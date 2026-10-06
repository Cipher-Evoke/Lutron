/**
 * Optional `group_scope` on custom graphs: restrict by-group API calls to special or user groups only.
 * Default (no scope): unchanged behavior.
 *
 * Example (stored on graph in localStorage):
 *   { "group_scope": "special_only" }  → only group_ids from special_area_groups
 *   { "group_scope": "user_only" }     → only group_ids from user_area_groups
 *   { "group_scope": "special_and_user" } → union of group_ids from both lists
 */
import { mergeCustomGraphScopeIntoApiParams } from './mergeCustomGraphScopeIntoApiParams';
import { resolveDashboardLocationForGroupCharts } from '../redux/slice/dashboard/dashboardSlice';
import {
  CUSTOM_GRAPH_GROUP_SCOPES,
  filterGroupIdsByAreaGroupScope,
  isCustomGraphGroupScope,
} from './filterGroupIdsByAreaGroupScope';
// NOTE: `group_scope` dropdown must follow the same buckets shown in UI:
// - special_area_groups
// - user_area_groups
// This keeps behavior consistent with Manage Area Groups screen even if backend flags differ.

function areaGroupsFromState(getState) {
  const s = getState();
  return (
    s.groupOccupancy?.areaGroups ||
    s.dashboard?.areaGroups ||
    {}
  );
}

function isByGroupApiPath(apiPath) {
  const p = String(apiPath || '').trim().toLowerCase();
  if (!p) return false;
  return (
    p.includes('total_consumption/by_group') ||
    p.includes('occupancy_by_group') ||
    p.includes('energy_consumption') ||
    p.includes('energy_savings')
  );
}

function deriveAllGroupIdsForScope(areaGroups, scope) {
  const lists =
    scope === CUSTOM_GRAPH_GROUP_SCOPES.SPECIAL_ONLY
      ? [areaGroups?.special_area_groups || []]
      : scope === CUSTOM_GRAPH_GROUP_SCOPES.USER_ONLY
        ? [areaGroups?.user_area_groups || []]
        : [
            areaGroups?.special_area_groups || [],
            areaGroups?.user_area_groups || [],
          ];

  const out = [];
  const seen = new Set();
  for (const list of lists) {
    for (const g of list) {
      const raw = g?.group_id ?? g?.id;
      if (raw == null) continue;
      const id = typeof raw === 'number' ? raw : parseInt(String(raw), 10);
      if (Number.isNaN(id) || seen.has(id)) continue;
      seen.add(id);
      out.push(id);
    }
  }
  return out;
}

/**
 * @param {function} getState - Redux getState
 * @param {object|null} qp - Dashboard apiParams
 * @param {object} graph - Custom graph row (may include group_scope)
 * @returns {object|null} Params for thunk / axios (may include skipAutoAreaGroupIds)
 */
export function applyCustomGraphGroupScopedParams(getState, qp, graph) {
  const merged = mergeCustomGraphScopeIntoApiParams(qp, graph);
  const scope = graph?.group_scope;
  if (!isCustomGraphGroupScope(scope) || !merged) {
    return merged;
  }

  const resolved = resolveDashboardLocationForGroupCharts(getState, merged);
  const ag = areaGroupsFromState(getState);
  // Only apply group_scope to by-group endpoints; otherwise keep behavior unchanged.
  if (!isByGroupApiPath(graph?.api_path)) {
    return resolved;
  }

  // Requirement: when user selects User/Special area groups only, use all group_ids from Manage Area Groups.
  const allScopedGroupIds = deriveAllGroupIdsForScope(ag, scope);

  // If the dashboard already has groupIds selected, keep them but filter down to the chosen scope.
  const filteredSelected = filterGroupIdsByAreaGroupScope(resolved.groupIds, ag, scope);
  let finalGroupIds =
    filteredSelected && filteredSelected.length > 0 ? filteredSelected : allScopedGroupIds;

  const picked = graph?.scoped_group_ids || graph?.custom_area_group_ids;
  if (Array.isArray(picked) && picked.length > 0) {
    const want = new Set(
      picked.map((x) => {
        const n = typeof x === "number" ? x : parseInt(String(x), 10);
        return Number.isNaN(n) ? null : n;
      }).filter((x) => x != null)
    );
    const narrowed = finalGroupIds.filter((id) => want.has(Number(id)));
    const fromScopeBucket = allScopedGroupIds.filter((id) => want.has(Number(id)));
    finalGroupIds =
      narrowed.length > 0 ? narrowed : fromScopeBucket.length > 0 ? fromScopeBucket : [];
  }

  return {
    ...resolved,
    groupIds: finalGroupIds,
    skipAutoAreaGroupIds: true,
  };
}

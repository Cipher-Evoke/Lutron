/**
 * Filters an existing group_ids list to only special or only user groups (from /area_group/list).
 * Used for optional per–custom-graph `group_scope` on by-group dashboard APIs.
 */

export const CUSTOM_GRAPH_GROUP_SCOPES = {
  ALL: '',
  SPECIAL_ONLY: 'special_only',
  USER_ONLY: 'user_only',
  /** Union of special + user area groups (Manage Area Groups) for one chart */
  SPECIAL_AND_USER: 'special_and_user',
};

export function isCustomGraphGroupScope(value) {
  return (
    value === CUSTOM_GRAPH_GROUP_SCOPES.SPECIAL_ONLY ||
    value === CUSTOM_GRAPH_GROUP_SCOPES.USER_ONLY ||
    value === CUSTOM_GRAPH_GROUP_SCOPES.SPECIAL_AND_USER
  );
}

/** True when charts should aggregate/tooltip using area-group maps (not dashboard default). */
export function isAreaGroupChartScope(scope) {
  const s = String(scope || "").trim().toLowerCase();
  return (
    s === CUSTOM_GRAPH_GROUP_SCOPES.SPECIAL_ONLY ||
    s === CUSTOM_GRAPH_GROUP_SCOPES.USER_ONLY ||
    s === CUSTOM_GRAPH_GROUP_SCOPES.SPECIAL_AND_USER
  );
}

/**
 * @param {number[]|null|undefined} groupIds
 * @param {object|null|undefined} areaGroups - { special_area_groups, user_area_groups }
 * @param {string} scope - 'special_only' | 'user_only' | 'special_and_user'
 * @returns {number[]|null} Filtered ids, or original when scope invalid / no ids
 */
export function filterGroupIdsByAreaGroupScope(groupIds, areaGroups, scope) {
  if (!isCustomGraphGroupScope(scope)) return groupIds;
  if (!groupIds || groupIds.length === 0) return groupIds;

  const lists =
    scope === CUSTOM_GRAPH_GROUP_SCOPES.SPECIAL_ONLY
      ? [areaGroups?.special_area_groups || []]
      : scope === CUSTOM_GRAPH_GROUP_SCOPES.USER_ONLY
        ? [areaGroups?.user_area_groups || []]
        : [
            areaGroups?.special_area_groups || [],
            areaGroups?.user_area_groups || [],
          ];

  const allowed = new Set();
  for (const list of lists) {
    for (const g of list) {
      const gid = g?.group_id ?? g?.id;
      if (gid == null) continue;
      const n = typeof gid === "number" ? gid : parseInt(String(gid), 10);
      if (!Number.isNaN(n)) allowed.add(n);
    }
  }

  const filtered = groupIds
    .map((id) => (typeof id === "number" ? id : parseInt(String(id), 10)))
    .filter((id) => !Number.isNaN(id) && allowed.has(id));

  return filtered;
}

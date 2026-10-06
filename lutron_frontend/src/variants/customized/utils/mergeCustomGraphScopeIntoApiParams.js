/**
 * When a custom graph has optional `floor_ids` / `area_ids` (from widget settings),
 * override dashboard `apiParams` location fields only for that graph's request.
 * Omitted or empty scope → returns `apiParams` unchanged.
 *
 * When the Energy dashboard has floors selected AND the widget has saved `floor_ids`,
 * the effective scope is the intersection (widget = ceiling; dashboard narrows).
 */

import {
  intersectDashboardAndGraphFloors,
  orderPerFloorIdsByGraphFloorIds,
} from "./intersectDashboardGraphFloors";

function normalizeIdArray(raw) {
  if (raw == null) return [];
  const arr = Array.isArray(raw) ? raw : [];
  const out = [];
  for (const x of arr) {
    const n = typeof x === "number" && !Number.isNaN(x) ? x : parseInt(String(x), 10);
    if (typeof n === "number" && !Number.isNaN(n)) out.push(n);
  }
  return out;
}

export function readCustomGraphScopeDraft(graph) {
  const floorSnake = normalizeIdArray(graph?.floor_ids);
  const floorCamel = normalizeIdArray(graph?.floorIds);
  const areaSnake = normalizeIdArray(graph?.area_ids);
  const areaCamel = normalizeIdArray(graph?.areaIds);
  const groupSnake = normalizeIdArray(graph?.group_ids);
  const groupCamel = normalizeIdArray(graph?.groupIds);
  const groupScoped = normalizeIdArray(graph?.scoped_group_ids);
  const groupCustom = normalizeIdArray(graph?.custom_area_group_ids);
  return {
    floor_ids: floorSnake.length > 0 ? floorSnake : floorCamel,
    area_ids: areaSnake.length > 0 ? areaSnake : areaCamel,
    group_ids:
      groupSnake.length > 0
        ? groupSnake
        : groupCamel.length > 0
          ? groupCamel
          : groupScoped.length > 0
            ? groupScoped
            : groupCustom,
  };
}

/**
 * @param {object|null|undefined} apiParams - Dashboard shape: areaIds, floorIds, groupIds, …
 * @param {object|undefined} graph - Custom graph from storage; may include floor_ids, area_ids
 * @returns {typeof apiParams}
 */
export function mergeCustomGraphScopeIntoApiParams(apiParams, graph) {
  if (!apiParams) return apiParams;

  const { floor_ids: floorIds, area_ids: areaIds, group_ids: groupIds } = readCustomGraphScopeDraft(graph);

  const dashFloors = normalizeIdArray(apiParams?.floorIds);
  const dashAreas = normalizeIdArray(apiParams?.areaIds);
  const dashGroups = normalizeIdArray(apiParams?.groupIds);
  const hasDashScope = dashFloors.length > 0 || dashAreas.length > 0 || dashGroups.length > 0;

  // CASE A: Widget has its own explicit scope settings -> USE THEM
  if (floorIds.length > 0 || areaIds.length > 0 || (groupIds && groupIds.length > 0)) {
    return {
      ...apiParams,
      floorIds: floorIds.length > 0 ? floorIds : null,
      areaIds: areaIds.length > 0 ? areaIds : null,
      groupIds: groupIds.length > 0 ? groupIds : null,
    };
  }

  // CASE B: Widget is set to 'Inherit' (no saved scope) -> follow dashboard selection
  if (hasDashScope) {
    return {
      ...apiParams,
      floorIds: dashFloors.length > 0 ? dashFloors : null,
      areaIds: dashAreas.length > 0 ? dashAreas : null,
      groupIds: dashGroups.length > 0 ? dashGroups : null,
    };
  }

  return apiParams;
}

/**
 * @param {{ floor_ids?: unknown[], area_ids?: unknown[] }} draft
 * @returns {{ floor_ids?: number[], area_ids?: number[] } | {}} Fields to persist (omit both = inherit dashboard)
 */
export function pickCustomGraphScopeForStorage(draft) {
  const floors = normalizeIdArray(draft?.floor_ids || draft?.floorIds);
  const areas = normalizeIdArray(draft?.area_ids || draft?.areaIds);
  const groups = normalizeIdArray(draft?.group_ids || draft?.groupIds || draft?.scoped_group_ids);

  const out = {};
  if (floors.length > 0) out.floor_ids = floors;
  if (areas.length > 0) out.area_ids = areas;
  if (groups.length > 0) out.group_ids = groups;
  return out;
}

/**
 * When a custom graph stores optional `floor_ids` as a ceiling and `area_ids` as the selection,
 * drop any area id whose floor (from the dashboard-built map) is not in `graph.floor_ids`.
 * No-op when graph has no floor ceiling or qp has no areaIds.
 *
 * @param {object|null} apiParams - After mergeCustomGraphScopeIntoApiParams
 * @param {object|undefined} graph - Custom graph row
 * @param {Map<number, number>|ReadonlyMap<number, number>} areaIdToFloorMap - area_id -> floor_id
 */
export function intersectDashboardAreasWithGraphFloorCeiling(apiParams, graph, areaIdToFloorMap) {
  if (!apiParams) return apiParams;
  const areaIds = normalizeIdArray(apiParams?.areaIds);
  if (!areaIds.length) return apiParams;
  const m = areaIdToFloorMap instanceof Map ? areaIdToFloorMap : new Map(Object.entries(areaIdToFloorMap || {}));
  // Drop area ids we cannot map to a floor yet (stale / invalid vs loaded trees).
  const known = areaIds.filter((id) => m.has(Number(id)));
  let next = known.length === areaIds.length ? areaIds : known;
  // Optional ceiling: graph.floor_ids (or floorIds) restricts which floors selected areas may belong to.
  const ceilingSnake = normalizeIdArray(graph?.floor_ids);
  const ceilingCamel = normalizeIdArray(graph?.floorIds);
  const ceiling = ceilingSnake.length > 0 ? ceilingSnake : ceilingCamel;
  if (ceiling.length > 0) {
    const allow = new Set(ceiling.map((x) => Number(x)));
    next = next.filter((id) => {
      const fid = m.get(Number(id));
      return fid != null && allow.has(Number(fid));
    });
  }
  if (next.length === areaIds.length) return apiParams;
  return { ...apiParams, areaIds: next.length > 0 ? next : null };
}

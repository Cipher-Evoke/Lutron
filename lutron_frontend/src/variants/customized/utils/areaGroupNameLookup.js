/**
 * Shared helpers so Energy and Space dashboard charts show the same names as
 * Settings → Manage Area Groups (Passage, Kitchen, etc.) when the API omits
 * labels or returns group_id keys instead of names.
 */

/** @returns {Map<string|number, string>} */
export function buildAreaGroupIdNameMap(areaGroupsState) {
  const lists = [
    ...(areaGroupsState?.special_area_groups || []),
    ...(areaGroupsState?.user_area_groups || []),
  ];
  const byId = new Map();
  for (const g of lists) {
    if (!g || typeof g !== 'object') continue;
    const id = g.group_id ?? g.id ?? g.groupId;
    if (id == null) continue;
    const name =
      g.name != null && String(g.name).trim() !== '' ? String(g.name).trim() : null;
    if (name) {
      byId.set(String(id), name);
      byId.set(Number(id), name);
    }
  }
  return byId;
}

/**
 * @param {Map<string|number, string>} lookupById
 * @param {string|number|null|undefined} id
 * @returns {string|null}
 */
export function nameFromAreaGroupLookup(lookupById, id) {
  if (id == null || !lookupById) return null;
  return lookupById.get(String(id)) ?? lookupById.get(Number(id)) ?? null;
}

function getAreaIdsFromGroupForLookup(group) {
  if (!group?.floors) return [];
  return group.floors.flatMap((f) => f.area_ids || []);
}

/**
 * Area-group display names for optional custom-graph `group_scope` (same idea as EnergyCustomGraphCard).
 * @param {object|null|undefined} areaGroupsState
 * @param {string} scope - special_only | user_only | special_and_user
 * @returns {string[]}
 */
export function groupDisplayNamesForScope(areaGroupsState, scope) {
  const s = String(scope || '').trim().toLowerCase();
  const lists =
    s === 'special_only'
      ? [areaGroupsState?.special_area_groups || []]
      : s === 'user_only'
        ? [areaGroupsState?.user_area_groups || []]
        : s === 'special_and_user'
          ? [areaGroupsState?.special_area_groups || [], areaGroupsState?.user_area_groups || []]
          : [];

  const out = [];
  const seen = new Set();
  for (const list of lists) {
    for (const g of list) {
      const name = String(g?.name ?? '').trim();
      if (!name || seen.has(name)) continue;
      seen.add(name);
      out.push(name);
    }
  }
  return out;
}

/**
 * Map a chart series key (often numeric group id or area id) to the Manage Area Group name.
 * Aligns with consumption-by-group pie resolution in buildTotalConsumptionByGroupPieRows.
 * @param {string|number} seriesKey
 * @param {object|null|undefined} areaGroupsState
 * @returns {string}
 */
export function resolveOccupancySeriesKeyToGroupName(seriesKey, areaGroupsState) {
  const keyStr = String(seriesKey ?? '').trim();
  if (!keyStr) return seriesKey;
  const groupIdToName = buildAreaGroupIdNameMap(areaGroupsState);
  const lists = [
    ...(areaGroupsState?.special_area_groups || []),
    ...(areaGroupsState?.user_area_groups || []),
  ];
  const byId = lists.find(
    (x) =>
      x &&
      x.group_id != null &&
      (String(x.group_id) === keyStr || Number(x.group_id) === Number(keyStr))
  );
  if (byId?.name) return String(byId.name).trim();
  const fromMap = nameFromAreaGroupLookup(groupIdToName, keyStr);
  if (fromMap) return fromMap;
  const n = Number(keyStr);
  if (!Number.isNaN(n) && keyStr !== '') {
    const fromMapN = nameFromAreaGroupLookup(groupIdToName, n);
    if (fromMapN) return fromMapN;
  }
  const byExactName = lists.find((x) => x && String(x.name ?? '').trim() === keyStr);
  if (byExactName?.name) return String(byExactName.name).trim();
  for (const group of lists) {
    if (!group?.name) continue;
    if (Array.isArray(group.areas) && group.areas.some((a) => a && String(a.name ?? '').trim() === keyStr)) {
      return String(group.name).trim();
    }
    for (const aid of getAreaIdsFromGroupForLookup(group)) {
      if (String(aid) === keyStr || Number(aid) === Number(keyStr)) {
        return String(group.name).trim();
      }
    }
  }
  return seriesKey;
}

/**
 * Row from occupancy_by_group / similar APIs.
 * @param {Record<string, unknown>} group
 * @param {number} index
 * @param {Map<string|number, string>} lookupById
 * @param {object|null|undefined} [areaGroupsState] - fallback list match (same as consumption pie)
 */
export function resolveOccupancyGroupDisplayName(group, index, lookupById, areaGroupsState) {
  if (!group || typeof group !== 'object') return null;
  let fromApi =
    group.area_group_name ||
    group.name ||
    group.group_name ||
    group.group_label ||
    group.label ||
    group.display_name ||
    group.title;
  if (
    (!fromApi || String(fromApi).trim() === '') &&
    group.area_group &&
    typeof group.area_group === 'object'
  ) {
    const ag = group.area_group;
    const n = ag.area_group_name || ag.name || ag.group_name;
    if (n != null && String(n).trim() !== '') fromApi = n;
  }
  if (fromApi != null && String(fromApi).trim() !== '') return String(fromApi).trim();

  const gid =
    group.group_id ??
    group.area_group_id ??
    group.user_area_group_id ??
    group.areaGroupId ??
    group.id ??
    group.groupId ??
    (group.area_group && typeof group.area_group === 'object'
      ? group.area_group.group_id ?? group.area_group.id ?? group.area_group.area_group_id
      : undefined);

  if (gid != null) {
    const fromStore = nameFromAreaGroupLookup(lookupById, gid);
    if (fromStore) return fromStore;
    if (areaGroupsState && typeof areaGroupsState === 'object') {
      const lists = [
        ...(areaGroupsState.special_area_groups || []),
        ...(areaGroupsState.user_area_groups || []),
      ];
      const hit = lists.find(
        (x) =>
          x &&
          x.group_id != null &&
          (String(x.group_id) === String(gid) || Number(x.group_id) === Number(gid))
      );
      if (hit?.name) return String(hit.name).trim();
    }
    return `Group ${gid}`;
  }
  return `Group ${index + 1}`;
}

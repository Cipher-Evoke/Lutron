import { isSpecialAreaGroup } from './areaGroupFlags';

/** Area group list API may send `areas: [{ area_id, name }]` without `floors[].area_ids`. */
function collectAreaIdsFromAreasArray(areas) {
  if (!Array.isArray(areas) || areas.length === 0) return [];
  const out = [];
  for (const a of areas) {
    if (a == null) continue;
    const raw =
      typeof a === 'number'
        ? a
        : typeof a === 'object'
          ? a.area_id ?? a.areaId ?? a.id
          : null;
    if (raw == null) continue;
    const n = typeof raw === 'number' && !Number.isNaN(raw) ? raw : parseInt(String(raw), 10);
    if (Number.isFinite(n)) out.push(n);
  }
  return out;
}

function mergeAreaGroupLists(...lists) {
  const out = [];
  const seen = new Set();
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const g of list) {
      if (!g || typeof g !== 'object') continue;
      const id = g.group_id ?? g.id ?? g.groupId;
      if (id != null) {
        const key = String(id);
        if (seen.has(key)) continue;
        seen.add(key);
      }
      out.push(g);
    }
  }
  return out;
}

export function normalizeAreaGroupListPayload(raw) {
  const empty = () => ({
    special_area_groups: [],
    user_area_groups: [],
    dashboard_area_groups: [],
  });

  if (raw == null) return empty();

  let data = raw;

  if (typeof raw === 'object' && !Array.isArray(raw) && raw.data !== undefined) {
    const hasGroupedKeys =
      Array.isArray(raw.user_area_groups) ||
      Array.isArray(raw.special_area_groups) ||
      Array.isArray(raw.dashboard_area_groups) ||
      Array.isArray(raw.userAreaGroups) ||
      Array.isArray(raw.specialAreaGroups) ||
      Array.isArray(raw.dashboardAreaGroups) ||
      Array.isArray(raw.user_groups) ||
      Array.isArray(raw.special_groups);

    if (!hasGroupedKeys) {
      data = raw.data;
    }
  }

  if (data == null) return empty();

  const normalizeGroup = (g) => {
    const group_id = g.group_id ?? g.id ?? g.groupId;
    const name = g.name ?? g.group_name ?? '';

    let floors = [];

    if (Array.isArray(g.floors)) {
      floors = g.floors.map((f) => ({
        floor_id: f.floor_id ?? f.id,
        area_ids: f.area_ids ?? f.areas ?? [],
      }));
    }

    if (!floors.length && Array.isArray(g.area_ids)) {
      floors = [
        {
          floor_id: null,
          area_ids: g.area_ids,
        },
      ];
    }

    const idsFromFloors = floors.flatMap((f) => f.area_ids || []).filter((x) => x != null);
    if (!idsFromFloors.length && Array.isArray(g.areas) && g.areas.length > 0) {
      const fromAreas = collectAreaIdsFromAreasArray(g.areas);
      if (fromAreas.length > 0) {
        floors = [{ floor_id: null, area_ids: [...new Set(fromAreas)] }];
      }
    }

    return {
      ...g,
      group_id,
      name,
      floors,
    };
  };

  if (Array.isArray(data)) {
    const special = [];
    const user = [];

    for (const g of data) {
      if (!g || typeof g !== 'object') continue;

      const row = normalizeGroup(g);
      const gid = row.group_id;
      if (gid == 37) continue;

      if (isSpecialAreaGroup(g)) {
        special.push(row);
      } else {
        user.push(row);
      }
    }

    return { special_area_groups: special, user_area_groups: user, dashboard_area_groups: [] };
  }

  if (typeof data === 'object') {
    const filterGhostGroups = (list) => (list || []).filter(g => {
      const id = g?.group_id ?? g?.id ?? g?.groupId;
      return id != 37;
    });

    const rawSpecial = (data.special_area_groups || data.specialAreaGroups || data.special_groups || []).map(
      normalizeGroup
    );
    const rawDashExplicit = (data.dashboard_area_groups || data.dashboardAreaGroups || []).map(normalizeGroup);

    const rawUserCombined = (data.user_area_groups || data.userAreaGroups || data.user_groups || []).map(
      normalizeGroup
    );

    const user_area_groups = filterGhostGroups(mergeAreaGroupLists(rawUserCombined, rawDashExplicit));

    return {
      special_area_groups: filterGhostGroups(rawSpecial),
      user_area_groups,
      dashboard_area_groups: [],
    };
  }

  return empty();
}

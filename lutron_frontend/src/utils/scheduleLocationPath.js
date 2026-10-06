/**
 * Resolve schedule detail area rows to "Floor / Area" labels (same logic as basic ScheduleDetails).
 */

function normNameKey(name) {
  return `name:${String(name || '').trim().toLowerCase()}`;
}

function walkAreaTree(nodes, floorId, floorName, map) {
  if (!Array.isArray(nodes)) return;
  for (const n of nodes) {
    const areaId = n?.area_id ?? n?.id ?? n?.areaId;
    const areaCode = n?.area_code ?? n?.areaCode;
    const areaName = n?.name ?? n?.area_name ?? n?.areaName;
    if (areaId != null && areaName) {
      map.set(String(areaId), {
        floorId,
        floorName,
        areaId,
        areaName,
      });
    }
    if (areaCode != null && areaName) {
      map.set(String(areaCode), {
        floorId,
        floorName,
        areaId: areaId ?? null,
        areaName,
      });
    }
    if (areaName) {
      const key = normNameKey(areaName);
      if (!map.has(key)) {
        map.set(key, {
          floorId,
          floorName,
          areaId: areaId ?? null,
          areaName,
        });
      }
    }
    if (Array.isArray(n?.children) && n.children.length > 0) {
      walkAreaTree(n.children, floorId, floorName, map);
    }
  }
}

/**
 * @param {Array} floors
 * @param {(floorId: string|number) => Promise<{ data?: object }>} fetchAreaTreeForFloor
 * @returns {Promise<Map>}
 */
export async function loadAreaTreeIndex(floors, fetchAreaTreeForFloor) {
  const map = new Map();
  if (!Array.isArray(floors) || floors.length === 0) return map;

  await Promise.all(
    floors.map(async (f) => {
      const floorId = f?.id ?? f?.floor_id ?? f?.floorId;
      if (floorId == null) return;
      const floorName = f?.floor_name ?? f?.floorName ?? f?.name ?? '';
      try {
        const res = await fetchAreaTreeForFloor(floorId);
        const tree = res?.data?.tree ?? res?.data ?? [];
        walkAreaTree(tree, floorId, floorName, map);
      } catch {
        /* ignore per-floor failures */
      }
    })
  );

  return map;
}

function buildAreaIdToFloorMap(floors) {
  return new Map(
    (floors || [])
      .flatMap((f) => {
        const fid = f?.id ?? f?.floor_id ?? f?.floorId;
        const fname = f?.floor_name ?? f?.floorName ?? f?.name;
        const processors = Array.isArray(f?.processors) ? f.processors : [];
        return processors.flatMap((p) => {
          const areas = Array.isArray(p?.areas) ? p.areas : [];
          return areas
            .map((a) => {
              const aid = a?.area_id ?? a?.id ?? a?.areaId;
              return aid != null && fid != null
                ? [String(aid), { floorId: fid, floorName: fname || '' }]
                : null;
            })
            .filter(Boolean);
        });
      })
      .filter(Boolean)
  );
}

function buildFloorNameById(floors) {
  return new Map(
    (floors || [])
      .map((f) => {
        const fid = f?.id ?? f?.floor_id ?? f?.floorId;
        const name = f?.floor_name ?? f?.floorName ?? f?.name;
        return fid != null && name ? [String(fid), String(name)] : null;
      })
      .filter(Boolean)
  );
}

/**
 * @param {Array} areas - schedule areas from API
 * @param {Array} floors - Redux floors list
 * @param {Map|null|undefined} areaTreeIndex - from loadAreaTreeIndex
 * @returns {Array<{ floorId, areaId, floorName, areaName, actions }>}
 */
export function mapAreasToScheduleLocations(areas, floors, areaTreeIndex) {
  if (!Array.isArray(areas) || areas.length === 0) return [];

  const floorNameById = buildFloorNameById(floors);
  const areaIdToFloor = buildAreaIdToFloorMap(floors);
  const tree = areaTreeIndex instanceof Map ? areaTreeIndex : null;

  return areas.map((area) => {
    const floorObj = area?.floor && typeof area.floor === 'object' ? area.floor : null;
    const areaObj = area?.area && typeof area.area === 'object' ? area.area : null;

    const floorId =
      area?.floor_id ??
      area?.floorId ??
      floorObj?.id ??
      floorObj?.floor_id ??
      (area?.floor != null &&
      (typeof area.floor === 'string' || typeof area.floor === 'number')
        ? area.floor
        : null) ??
      null;

    const areaId =
      area?.area_id ??
      area?.areaId ??
      areaObj?.id ??
      areaObj?.area_id ??
      (area?.area != null &&
      (typeof area.area === 'string' || typeof area.area === 'number')
        ? area.area
        : null) ??
      null;

    const resolvedFromFloors = areaId != null ? areaIdToFloor.get(String(areaId)) : null;

    const areaCode =
      area?.area_code ?? area?.areaCode ?? areaObj?.area_code ?? areaObj?.areaCode ?? null;

    const areaNameKey = normNameKey(
      area?.area_name ??
        area?.areaName ??
        area?.name ??
        areaObj?.area_name ??
        areaObj?.areaName ??
        areaObj?.name ??
        ''
    );

    const resolvedFromTree =
      (tree && areaId != null ? tree.get(String(areaId)) : null) ||
      (tree && areaCode != null ? tree.get(String(areaCode)) : null) ||
      (tree ? tree.get(areaNameKey) : null) ||
      null;

    const floorName =
      area.floor_name ||
      area.floorName ||
      floorObj?.floor_name ||
      floorObj?.floorName ||
      floorObj?.name ||
      (floorId != null ? floorNameById.get(String(floorId)) : '') ||
      resolvedFromFloors?.floorName ||
      resolvedFromTree?.floorName ||
      'Unknown Floor';

    const areaName =
      area.area_name ||
      area.areaName ||
      area.name ||
      areaObj?.area_name ||
      areaObj?.areaName ||
      areaObj?.name ||
      resolvedFromTree?.areaName ||
      'Unknown Area';

    return {
      floorId: floorId ?? resolvedFromFloors?.floorId ?? null,
      areaId,
      floorName,
      areaName,
      actions: area.actions || [],
    };
  });
}

/** Display label for location column (e.g. "1st Floor / ELECTRICAL ROOM 1"). */
export function formatScheduleLocationLabel(loc) {
  const floor = String(loc?.floorName ?? '').trim();
  const area = String(loc?.areaName ?? '').trim();
  const hasRealFloor = floor && floor !== 'Unknown Floor';
  if (hasRealFloor && area) return `${floor} / ${area}`;
  if (hasRealFloor) return floor;
  if (area) return area;
  return 'Unknown Location';
}

/**
 * Quick Control details: resolve "Floor / Area" from API area row (same as basic QuickControlDetails).
 * @param {object} area - quick_control_areas item
 * @param {Array} floors - Redux floors list
 * @param {Map|null|undefined} [areaTreeIndex] - optional from loadAreaTreeIndex
 */
export function formatQuickControlAreaLocationLabel(area, floors, areaTreeIndex = null) {
  if (!area || typeof area !== 'object') return 'Unknown Location';

  const floorNameById = buildFloorNameById(floors);
  const areaIdToFloor = buildAreaIdToFloorMap(floors);
  const tree = areaTreeIndex instanceof Map ? areaTreeIndex : null;

  const resolvedFromFloors =
    area?.area_id != null ? areaIdToFloor.get(String(area.area_id)) : null;

  const areaNameKey = normNameKey(
    area?.area_name ?? area?.areaName ?? area?.name ?? ''
  );

  const resolvedFromTree =
    (tree && area?.area_id != null ? tree.get(String(area.area_id)) : null) ||
    (tree ? tree.get(areaNameKey) : null) ||
    null;

  const floorLabel =
    area?.floor_name ||
    area?.floorName ||
    (area?.floor_id != null ? floorNameById.get(String(area.floor_id)) : '') ||
    resolvedFromFloors?.floorName ||
    resolvedFromTree?.floorName ||
    '';

  const areaName =
    area?.area_name ||
    area?.areaName ||
    area?.name ||
    resolvedFromTree?.areaName ||
    '';

  if (floorLabel) {
    return formatScheduleLocationLabel({ floorName: floorLabel, areaName: areaName || 'Unknown Area' });
  }
  return areaName ? String(areaName).trim() : 'Unknown Location';
}

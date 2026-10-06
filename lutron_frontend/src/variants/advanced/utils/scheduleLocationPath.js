/**
 * Location labels for schedules and quick controls.
 * Format: "Floor Name / Area Name" (e.g. "2nd Floor / ELECTRICAL ROOM 1").
 */

import { tagLoadedActions } from './scheduleActionPriority';

const LOCATION_META_STORAGE_KEY = 'lutron_location_meta_v1';

export const LOCATION_ENTITY = {
  SCHEDULE: 'schedule',
  QUICK_CONTROL: 'quickcontrol',
};

function readLocationMetaStore() {
  try {
    const raw = localStorage.getItem(LOCATION_META_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeLocationMetaStore(store) {
  try {
    localStorage.setItem(LOCATION_META_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore (quota/private mode)
  }
}

function makeLocationMetaKey(entityType, entityId, areaIdOrCode) {
  return `${entityType}:${String(entityId)}:${String(areaIdOrCode)}`;
}

export function makeAreaIndexKey(floorId, areaId) {
  return `${String(floorId)}:${String(areaId)}`;
}

/** Redux floor state may be an array or { floors: [] } */
export function getFloorsList(floors) {
  if (!floors) return [];
  if (Array.isArray(floors)) return floors;
  if (Array.isArray(floors.floors)) return floors.floors;
  return [];
}

export function formatFloorAreaPath(floorName, areaName, separator = ' / ') {
  const floor = (floorName || '').trim();
  const area = (areaName || '').trim();
  if (floor && area) return `${floor}${separator}${area}`;
  return area || floor || 'Unknown location';
}

function normalizeTreeNodes(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.tree)) return payload.tree;
  if (Array.isArray(payload.areas)) return payload.areas;
  return [];
}

function getChildNodes(node) {
  if (!node) return [];
  if (Array.isArray(node.children) && node.children.length > 0) return node.children;
  if (Array.isArray(node.areas) && node.areas.length > 0) return node.areas;
  return [];
}

/** Only use area_id — do not fall back to node.id (often area_code). */
function getNodeAreaId(node) {
  const id = node?.area_id;
  if (id == null || id === '' || id === 0) return null;
  return id;
}

function getNodeAreaName(node) {
  return (node?.name || node?.area_name || '').trim();
}

function getNodeAreaCode(node) {
  return (node?.area_code || node?.code || '').toString().trim();
}

function normalizeName(value) {
  return (value || '').trim().toLowerCase();
}

function getFloorNameFromList(floors, floorId) {
  if (floorId == null) return '';
  const floor = getFloorsList(floors).find((f) => String(f.id) === String(floorId));
  return (floor?.floor_name || floor?.name || '').trim();
}

/** Map area_id → owning floor from floors.processors.areas (same as basic Quick Control). */
function buildAreaIdToFloorMap(floors) {
  return new Map(
    getFloorsList(floors)
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
    getFloorsList(floors)
      .map((f) => {
        const fid = f?.id ?? f?.floor_id ?? f?.floorId;
        const name = f?.floor_name ?? f?.floorName ?? f?.name;
        return fid != null && name ? [String(fid), String(name)] : null;
      })
      .filter(Boolean)
  );
}

function findFloorByName(floors, floorName) {
  if (!floorName) return null;
  const target = normalizeName(floorName);
  return (
    getFloorsList(floors).find((f) => normalizeName(f.floor_name || f.name) === target) || null
  );
}

function getEntryOnFloor(areaTreeIndex, floorId, areaId) {
  if (!areaTreeIndex || floorId == null || areaId == null) return null;
  return areaTreeIndex.get(makeAreaIndexKey(floorId, areaId)) || null;
}

function populateIndexFromTree(index, floorId, floorName, nodes) {
  if (!nodes?.length) return;
  nodes.forEach((node) => {
    const areaId = getNodeAreaId(node);
    const nodeName = getNodeAreaName(node);
    const areaCode = getNodeAreaCode(node);

    if (areaId != null) {
      index.set(makeAreaIndexKey(floorId, areaId), {
        floorId,
        floorName: (floorName || '').trim(),
        areaId,
        areaName: nodeName,
        areaCode,
      });
    }

    const children = getChildNodes(node);
    if (children.length > 0) populateIndexFromTree(index, floorId, floorName, children);
  });
}

function findEntriesForAreaOnFloors(areaTreeIndex, floors, areaId, areaName) {
  if (!areaTreeIndex || areaId == null) return [];
  const matches = [];
  for (const floor of getFloorsList(floors)) {
    const entry = areaTreeIndex.get(makeAreaIndexKey(floor.id, areaId));
    if (!entry) continue;
    if (areaName && normalizeName(entry.areaName) !== normalizeName(areaName)) continue;
    matches.push(entry);
  }
  return matches;
}

/**
 * Fetch area trees for floors and build a lookup map keyed by "floorId:areaId".
 */
export async function loadAreaTreeIndex(floors, fetchAreaTree) {
  const index = new Map();
  const floorList = getFloorsList(floors);
  if (!floorList.length || typeof fetchAreaTree !== 'function') return index;

  const results = await Promise.all(
    floorList.map(async (floor) => {
      try {
        const response = await fetchAreaTree(floor.id);
        const data = response?.data ?? response;
        return { floor, data };
      } catch {
        return { floor, data: null };
      }
    })
  );

  results.forEach(({ floor, data }) => {
    const tree = normalizeTreeNodes(data);
    const floorName = (floor.floor_name || floor.name || '').trim();
    populateIndexFromTree(index, floor.id, floorName, tree);
  });

  return index;
}

/** Normalize schedule / quick-control area records from API */
export function pickAreaRecordFields(area) {
  if (!area) return { floorId: null, areaId: null, floorName: '', areaName: '' };

  const floorId =
    area.floor_id ?? area.floorId ?? area.Floor_Id ?? area.floor?.id ?? area.floor?.floor_id ?? null;
  const areaId =
    area.area_id ?? area.areaId ?? area.Area_Id ?? area.area?.id ?? area.area?.area_id ?? null;
  const areaCode =
    (area.area_code ?? area.areaCode ?? area.Area_Code ?? area.area?.area_code ?? area.code ?? '')
      .toString()
      .trim();

  const floorName = (
    area.floor_name ??
    area.floorName ??
    area.Floor_Name ??
    area.floor?.floor_name ??
    area.floor?.name ??
    ''
  ).trim();

  const areaName = (
    area.area_name ??
    area.areaName ??
    area.Area_Name ??
    area.name ??
    area.area?.name ??
    area.area?.area_name ??
    ''
  ).trim();

  return { floorId, areaId, areaCode, floorName, areaName };
}

function normalizeLocationForMeta(loc) {
  const fields = pickAreaRecordFields(loc);
  return {
    floorId: loc?.floorId ?? fields.floorId,
    areaId: loc?.areaId ?? fields.areaId,
    areaCode: (loc?.areaCode ?? loc?.area_code ?? fields.areaCode ?? '').toString().trim(),
    floorName: (loc?.floorName ?? loc?.floor_name ?? fields.floorName ?? '').trim(),
    areaName: (loc?.areaName ?? loc?.area_name ?? fields.areaName ?? '').trim(),
  };
}

/** Persist floor/area chosen in UI (API often returns wrong floor_id). */
export function saveLocationMeta(entityType, entityId, locations) {
  if (!entityType || entityId == null || !locations?.length) return;

  const store = readLocationMetaStore();
  locations.forEach((loc) => {
    const { floorId, areaId, areaCode, floorName, areaName } = normalizeLocationForMeta(loc);
    const key = areaCode || areaId;
    if (key == null || key === '' || !floorName) return;
    store[makeLocationMetaKey(entityType, entityId, key)] = { floorId, floorName, areaName, areaCode, areaId };
  });
  writeLocationMetaStore(store);
}

export function getLocationMeta(entityType, entityId, areaIdOrCode) {
  if (!entityType || entityId == null || areaIdOrCode == null) return null;
  const store = readLocationMetaStore();
  return store[makeLocationMetaKey(entityType, entityId, areaIdOrCode)] || null;
}

export function mergeAreaWithLocationMeta(area, entityType, entityId) {
  if (!area || !entityType || entityId == null) return area;
  const { areaId, areaCode } = pickAreaRecordFields(area);
  const meta = (areaCode && getLocationMeta(entityType, entityId, areaCode)) || getLocationMeta(entityType, entityId, areaId);
  if (!meta?.floorName) return area;
  return {
    ...area,
    floor_id: meta.floorId ?? area.floor_id ?? area.floorId,
    floor_name: meta.floorName,
    area_name: meta.areaName || area.area_name || area.areaName,
    area_code: meta.areaCode || area.area_code || area.areaCode,
  };
}

function findEntryByAreaCode(areaTreeIndex, areaCode) {
  if (!areaTreeIndex || !areaCode) return null;
  const target = normalizeName(areaCode);
  for (const entry of areaTreeIndex.values()) {
    if (entry?.areaCode && normalizeName(entry.areaCode) === target) return entry;
  }
  return null;
}

/**
 * Resolve floor + area names.
 * Priority: API/saved floor_name > API floor_id > unique tree match > first tree match.
 */
export function resolveFloorAreaNames(fields, floors, areaTreeIndex) {
  const { floorId, areaId, areaCode, floorName, areaName } = pickAreaRecordFields(fields);

  let resolvedArea = areaName;
  let resolvedFloor = '';
  let resolvedFloorId = floorId;

  // Saved floor_name from create/update / API — never override
  if (floorName) {
    const floorFromName = findFloorByName(floors, floorName);
    resolvedFloor = floorName;
    resolvedFloorId = floorFromName?.id ?? floorId;

    if (resolvedFloorId != null) {
      const onChosenFloor = getEntryOnFloor(areaTreeIndex, resolvedFloorId, areaId);
      if (onChosenFloor?.areaName) resolvedArea = onChosenFloor.areaName;
    }

    return { floorId: resolvedFloorId, areaId, floorName: resolvedFloor, areaName: resolvedArea };
  }

  // Prefer authoritative floor_id from API (Area.floor_id) before ambiguous tree matches
  if (floorId != null) {
    resolvedFloor = getFloorNameFromList(floors, floorId);
    resolvedFloorId = floorId;
    const onFloor = getEntryOnFloor(areaTreeIndex, floorId, areaId);
    if (onFloor?.areaName) resolvedArea = onFloor.areaName;
    if (resolvedFloor) {
      return { floorId: resolvedFloorId, areaId, floorName: resolvedFloor, areaName: resolvedArea };
    }
  }

  // If we have area_code, it's typically unique and can disambiguate floors
  if (areaCode) {
    const entry = findEntryByAreaCode(areaTreeIndex, areaCode);
    if (entry) {
      return {
        floorId: entry.floorId,
        areaId: entry.areaId ?? areaId,
        floorName: entry.floorName || getFloorNameFromList(floors, entry.floorId),
        areaName: entry.areaName || areaName,
      };
    }
  }

  const treeMatches = findEntriesForAreaOnFloors(areaTreeIndex, floors, areaId, areaName);
  if (treeMatches.length === 1) {
    const entry = treeMatches[0];
    return {
      floorId: entry.floorId,
      areaId,
      floorName: entry.floorName || getFloorNameFromList(floors, entry.floorId),
      areaName: entry.areaName || areaName,
    };
  }

  if (treeMatches.length > 1 && floorId != null) {
    const entry = treeMatches.find((e) => String(e.floorId) === String(floorId));
    if (entry) {
      return {
        floorId: entry.floorId,
        areaId,
        floorName: entry.floorName || getFloorNameFromList(floors, entry.floorId),
        areaName: entry.areaName || areaName,
      };
    }
  }

  if (treeMatches.length > 0) {
    const entry = treeMatches[0];
    return {
      floorId: entry.floorId,
      areaId,
      floorName: entry.floorName || getFloorNameFromList(floors, entry.floorId),
      areaName: entry.areaName || areaName,
    };
  }

  return {
    floorId: resolvedFloorId,
    areaId,
    floorName: resolvedFloor || areaName || 'Unknown location',
    areaName: resolvedArea,
  };
}

export function mapAreasToScheduleLocations(areas, floors, areaTreeIndex, entityType, entityId) {
  return (areas || []).map((area) => {
    const merged = mergeAreaWithLocationMeta(area, entityType, entityId);
    const { floorId, areaId, floorName, areaName } = resolveFloorAreaNames(merged, floors, areaTreeIndex);
    return {
      floorId,
      areaId,
      floorName,
      areaName,
      locationPath: formatFloorAreaPath(floorName, areaName),
      actions: tagLoadedActions(area.actions),
    };
  });
}

export function formatScheduleLocationLabel(loc, floors, areaTreeIndex, entityType, entityId) {
  if (!loc) return '';
  const merged = mergeAreaWithLocationMeta(loc, entityType, entityId);
  if (merged.floorName && merged.areaName) return formatFloorAreaPath(merged.floorName, merged.areaName);
  const { floorName, areaName } = resolveFloorAreaNames(merged, floors, areaTreeIndex);
  return formatFloorAreaPath(floorName, areaName);
}

/**
 * Quick Control details Location column — same resolution as basic:
 * floor_name → areaId→floor (processors.areas) → floor_id → unique tree match.
 * Does not use ambiguous treeMatches[0] (that always preferred 1st Floor).
 */
export function formatQuickControlAreaLocationLabel(area, floors, areaTreeIndex, entityType, entityId) {
  if (!area) return '';

  const floorNameById = buildFloorNameById(floors);
  const areaIdToFloor = buildAreaIdToFloorMap(floors);
  const { areaId, floorId, areaName: rawAreaName } = pickAreaRecordFields(area);
  const resolvedFromFloors =
    areaId != null ? areaIdToFloor.get(String(areaId)) : null;

  // Apply saved UI meta only when it agrees with processors.areas (or no mapping exists).
  let source = area;
  const merged = mergeAreaWithLocationMeta(area, entityType, entityId);
  if (merged !== area) {
    const metaFloor = (merged.floor_name || merged.floorName || '').trim();
    if (
      !resolvedFromFloors?.floorName ||
      normalizeName(metaFloor) === normalizeName(resolvedFromFloors.floorName)
    ) {
      source = merged;
    }
  }

  const sourceFields = pickAreaRecordFields(source);
  const areaName = (sourceFields.areaName || rawAreaName || '').trim();

  // Prefer processors.areas ownership when present; API floor_id/floor_name are often wrong
  // for areas that share the same name across floors.
  const namedFloor = (sourceFields.floorName || '').trim();
  let floorLabel = '';
  if (resolvedFromFloors?.floorName) {
    floorLabel =
      namedFloor && normalizeName(namedFloor) === normalizeName(resolvedFromFloors.floorName)
        ? namedFloor
        : resolvedFromFloors.floorName;
  } else {
    floorLabel =
      namedFloor ||
      (sourceFields.floorId != null
        ? floorNameById.get(String(sourceFields.floorId)) ||
          getFloorNameFromList(floors, sourceFields.floorId)
        : '') ||
      (floorId != null
        ? floorNameById.get(String(floorId)) || getFloorNameFromList(floors, floorId)
        : '') ||
      '';
  }

  if (floorLabel && areaName) {
    return formatFloorAreaPath(floorLabel, areaName);
  }

  // Last resort: unique tree match only (never first-of-many → 1st Floor).
  if (areaTreeIndex && areaId != null) {
    const treeMatches = findEntriesForAreaOnFloors(
      areaTreeIndex,
      floors,
      areaId,
      areaName || undefined
    );
    if (treeMatches.length === 1) {
      const entry = treeMatches[0];
      return formatFloorAreaPath(
        entry.floorName || getFloorNameFromList(floors, entry.floorId) || floorLabel,
        entry.areaName || areaName
      );
    }
    if (treeMatches.length > 1 && resolvedFromFloors?.floorId != null) {
      const entry = treeMatches.find(
        (e) => String(e.floorId) === String(resolvedFromFloors.floorId)
      );
      if (entry) {
        return formatFloorAreaPath(
          entry.floorName || resolvedFromFloors.floorName || floorLabel,
          entry.areaName || areaName
        );
      }
    }
  }

  return formatFloorAreaPath(floorLabel, areaName);
}


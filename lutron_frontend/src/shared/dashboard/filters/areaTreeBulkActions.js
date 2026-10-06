/**
 * Pure AreaTree bulk action resolvers (Phase 6.2C.7B.2).
 */
import { flattenAreaTree, getAllAreaIdsFromFloor } from './areaTreeTraversal';

function normalizeAreaId(id) {
  if (typeof id === 'number' && !Number.isNaN(id)) {
    return id;
  }
  const parsed = parseInt(String(id), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function resolveAreaNameFromNode(areaNode) {
  const id = Number(areaNode.area_id);
  return (
    areaNode.area_name ||
    areaNode.name ||
    areaNode.area_leaf_name ||
    areaNode.label ||
    areaNode.display_name ||
    (areaNode.area_code ? areaNode.area_code : `Area ${id}`)
  ).trim();
}

/**
 * Walk all area nodes in a floor payload (no flatten cap).
 * @param {object} payload
 */
export function walkAllAreaNodesInPayload(payload) {
  const nodes = [];
  const walk = (items) => {
    if (!Array.isArray(items)) {
      return;
    }
    for (const node of items) {
      if (!node) {
        continue;
      }
      if (node.area_id != null) {
        nodes.push(node);
      }
      if (node.children?.length) {
        walk(node.children);
      }
      if (node.areas?.length) {
        walk(node.areas);
      }
    }
  };
  walk(payload?.tree || payload?.areas);
  return nodes;
}

/**
 * @param {object} payload
 * @param {number} floorId
 */
export function buildAreaMappingsFromFloorPayload(payload, floorId) {
  const fid = payload?.floor_id || floorId;
  const areaIdToFloorIdEntries = [];
  const persistentAreaNameEntries = [];

  walkAllAreaNodesInPayload(payload).forEach((areaNode) => {
    const id = Number(areaNode.area_id);
    const actualName = resolveAreaNameFromNode(areaNode);

    areaIdToFloorIdEntries.push([id, fid], [String(id), fid], [`Area ${id}`, fid]);
    if (areaNode.area_code) {
      areaIdToFloorIdEntries.push([String(areaNode.area_code), fid]);
    }

    persistentAreaNameEntries.push(
      [id, actualName],
      [String(id), actualName],
      [`Area ${id}`, actualName]
    );
    if (areaNode.area_code) {
      persistentAreaNameEntries.push([String(areaNode.area_code), actualName]);
    }
    if (actualName) {
      persistentAreaNameEntries.push([actualName, actualName]);
    }
  });

  return { areaIdToFloorIdEntries, persistentAreaNameEntries };
}

/**
 * @param {object} params
 */
export function processFloorPayloadForAreaLoad({
  payload,
  floorId,
  variant = 'basic',
  flattenOptions = {},
  existingAreaIds = [],
}) {
  const areaIds = [...existingAreaIds];
  const mappings =
    variant === 'customized' ? buildAreaMappingsFromFloorPayload(payload, floorId) : null;

  const selectableAreas = flattenAreaTree(payload, flattenOptions);
  selectableAreas.forEach((area) => {
    if (!areaIds.includes(area.id)) {
      areaIds.push(area.id);
    }
  });

  return { areaIds, mappings, selectableAreas };
}

/**
 * @param {object} params
 */
export function shouldSkipLoadAllAreas({
  allAreasLoaded,
  selectedAreasLength,
  variant = 'basic',
  areaIdToFloorIdSize = 0,
  persistentAreaNamesSize = 0,
}) {
  if (variant === 'customized') {
    return allAreasLoaded && areaIdToFloorIdSize > 0 && persistentAreaNamesSize > 0;
  }
  if (allAreasLoaded) {
    return true;
  }
  if (selectedAreasLength > 0) {
    return true;
  }
  return false;
}

/**
 * @param {{ includeCustomWidgetFilters?: boolean }} [options]
 */
export function buildClearAllResolution(options = {}) {
  const { includeCustomWidgetFilters = false } = options;

  return {
    local: {
      localSelectedFloorIds: [],
      localSelectedAreas: [],
      localSelectedGroups: [],
      expandedFloorId: null,
      expandedNodes: [],
      floorsWithSelectedAreas: [],
    },
    redux: {
      selectedAreas: [],
      selectedFloorIds: [],
      selectedGroups: [],
      selectedGroupIds: [],
      selectedFloor: null,
      ...(includeCustomWidgetFilters ? { customWidgetFilters: null } : {}),
    },
    ui: {
      showAreaDropdown: false,
      clearPreviousApiParams: true,
      clearDataCache: true,
    },
  };
}

function resolveGroupExpandedAreaIds(localSelectedGroups, getAllAreasFromGroup) {
  const allGroupAreaIds = [];
  if (localSelectedGroups.length > 0 && typeof getAllAreasFromGroup === 'function') {
    localSelectedGroups.forEach((groupId) => {
      const groupAreas = getAllAreasFromGroup(groupId);
      if (Array.isArray(groupAreas)) {
        allGroupAreaIds.push(...groupAreas);
      }
    });
  }
  return allGroupAreaIds;
}

/**
 * @param {object} context
 */
export function buildSelectAllResolution(context) {
  const {
    variant = 'basic',
    localSelectedFloorIds = [],
    localSelectedAreas = [],
    localSelectedGroups = [],
    floors = [],
    getAllAreasFromGroup,
    areaIdToFloorId = null,
  } = context;

  if (variant === 'customized') {
    const finalFloorIds = [...localSelectedFloorIds];
    const finalAreaIds = localSelectedAreas
      .map(normalizeAreaId)
      .filter((id) => id != null);
    const finalGroupIds = [...localSelectedGroups];
    const allGroupAreaIds = resolveGroupExpandedAreaIds(finalGroupIds, getAllAreasFromGroup);
    const combinedAreaIds = [...new Set([...finalAreaIds, ...allGroupAreaIds])];

    const lookupFloorId = (aid) => {
      if (!areaIdToFloorId) {
        return undefined;
      }
      if (typeof areaIdToFloorId.get === 'function') {
        return areaIdToFloorId.get(aid) || areaIdToFloorId.get(String(aid));
      }
      return areaIdToFloorId[aid] || areaIdToFloorId[String(aid)];
    };

    const customFloorIds = [...finalFloorIds];
    const customAreaIds = combinedAreaIds.filter((aid) => {
      const fid = lookupFloorId(aid);
      return !customFloorIds.includes(Number(fid));
    });

    const customWidgetFilters = {
      floor_ids: customFloorIds,
      area_ids: customAreaIds,
    };

    if (finalFloorIds.length > 0) {
      const firstFloor = floors.find((f) => f.id === finalFloorIds[0]) || null;
      return {
        case: 'floors',
        redux: {
          selectedAreas: [],
          selectedFloorIds: finalFloorIds,
          selectedGroups: finalGroupIds,
          selectedGroupIds: finalGroupIds,
          selectedFloor: firstFloor,
          customWidgetFilters,
        },
        ui: { showAreaDropdown: false, clearPreviousApiParams: true, clearDataCache: true },
      };
    }

    if (finalAreaIds.length > 0 || finalGroupIds.length > 0) {
      const uniqueAreaIds = [...new Set([...finalAreaIds, ...allGroupAreaIds])];
      return {
        case: 'areas',
        redux: {
          selectedAreas: uniqueAreaIds,
          selectedFloorIds: [],
          selectedGroups: finalGroupIds,
          selectedGroupIds: finalGroupIds,
          selectedFloor: null,
          customWidgetFilters,
        },
        ui: { showAreaDropdown: false, clearPreviousApiParams: true, clearDataCache: true },
      };
    }

    return {
      case: 'none',
      redux: {
        selectedAreas: [],
        selectedFloorIds: [],
        selectedGroups: [],
        selectedGroupIds: [],
        selectedFloor: null,
        customWidgetFilters: null,
      },
      ui: { showAreaDropdown: false, clearPreviousApiParams: true, clearDataCache: true },
    };
  }

  if (localSelectedFloorIds.length > 0) {
    const firstFloor = floors.find((f) => f.id === localSelectedFloorIds[0]) || null;
    return {
      case: 'floors',
      redux: {
        selectedAreas: [],
        selectedFloorIds: localSelectedFloorIds,
        selectedGroups: [],
        selectedGroupIds: [],
        selectedFloor: firstFloor,
      },
      ui: { showAreaDropdown: false, clearPreviousApiParams: true, clearDataCache: true },
    };
  }

  if (localSelectedAreas.length > 0 || localSelectedGroups.length > 0) {
    const finalAreaIds = localSelectedAreas;
    const allGroupAreaIds = resolveGroupExpandedAreaIds(localSelectedGroups, getAllAreasFromGroup);
    const uniqueAreaIds = [...new Set([...finalAreaIds, ...allGroupAreaIds])];

    return {
      case: 'areas',
      redux: {
        selectedAreas: uniqueAreaIds,
        selectedFloorIds: [],
        selectedGroups: localSelectedGroups,
        selectedGroupIds: localSelectedGroups,
        selectedFloor: null,
      },
      ui: { showAreaDropdown: false, clearPreviousApiParams: true, clearDataCache: true },
    };
  }

  return {
    case: 'none',
    redux: {
      selectedAreas: [],
      selectedFloorIds: [],
      selectedGroups: [],
      selectedGroupIds: [],
      selectedFloor: null,
    },
    ui: { showAreaDropdown: false, clearPreviousApiParams: true, clearDataCache: true },
  };
}

/**
 * Pure planning helper for loadAllAreasFromAllFloors per-floor results.
 * @param {object[]} floorResults - `{ payload, floorId }[]`
 * @param {{ variant?: string, flattenOptions?: object, existingAreaIds?: number[] }} [options]
 */
export function loadAllAreasFromAllFloors(floorResults, options = {}) {
  const { variant = 'basic', flattenOptions = {}, existingAreaIds = [] } = options;
  let areaIds = [...existingAreaIds];
  const allMappings = [];

  floorResults.forEach(({ payload, floorId }) => {
    if (!payload || !(payload.tree || payload.areas)) {
      return;
    }
    const result = processFloorPayloadForAreaLoad({
      payload,
      floorId,
      variant,
      flattenOptions,
      existingAreaIds: areaIds,
    });
    areaIds = result.areaIds;
    if (result.mappings) {
      allMappings.push(result.mappings);
    }
  });

  return { areaIds, mappings: allMappings };
}

/**
 * Collect area IDs when auto-selecting all areas from a floor checkbox payload.
 * @param {object} floorData
 */
export function collectFloorCheckboxAreaIds(floorData) {
  const fromPayload = getAllAreaIdsFromFloor(floorData);
  return fromPayload.length > 0 ? fromPayload : [];
}

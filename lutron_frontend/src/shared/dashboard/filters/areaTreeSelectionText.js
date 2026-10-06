/**
 * Pure AreaTree selection label builders (Phase 6.2C.7B.2).
 */
import { getTreeRoots } from './areaTreeTraversal';

function collectAreaIdsUnderNode(node) {
  let areaIds = [];
  if (node.area_id) {
    areaIds.push(node.area_id);
  }
  if (node.children && node.children.length > 0) {
    node.children.forEach((child) => {
      areaIds = areaIds.concat(collectAreaIdsUnderNode(child));
    });
  }
  if (node.areas && node.areas.length > 0) {
    node.areas.forEach((area) => {
      areaIds = areaIds.concat(collectAreaIdsUnderNode(area));
    });
  }
  return areaIds;
}

function findAreaNameInTree(nodes, targetAreaId) {
  if (!Array.isArray(nodes)) {
    return null;
  }
  for (const node of nodes) {
    if (!node) {
      continue;
    }
    if (node.area_id === targetAreaId) {
      return node.name || node.area_name || `Area ${targetAreaId}`;
    }
    if (node.children && node.children.length > 0) {
      const childResult = findAreaNameInTree(node.children, targetAreaId);
      if (childResult) {
        return childResult;
      }
    }
    if (node.areas && node.areas.length > 0) {
      const areaResult = findAreaNameInTree(node.areas, targetAreaId);
      if (areaResult) {
        return areaResult;
      }
    }
  }
  return null;
}

function findCompleteParentLabel(nodes, displayAreas) {
  let bestMatch = null;

  const checkNode = (node) => {
    const nodeAreaIds = collectAreaIdsUnderNode(node);
    const allAreasUnderNodeSelected = nodeAreaIds.every((areaId) => displayAreas.includes(areaId));
    const allSelectedAreasUnderNode = displayAreas.every((areaId) => nodeAreaIds.includes(areaId));

    if (allAreasUnderNodeSelected && allSelectedAreasUnderNode && displayAreas.length > 0) {
      if (!bestMatch || nodeAreaIds.length < collectAreaIdsUnderNode(bestMatch).length) {
        bestMatch = node;
      }
    }

    if (node.children && node.children.length > 0) {
      node.children.forEach(checkNode);
    }
  };

  nodes.forEach(checkNode);
  return bestMatch ? bestMatch.name || bestMatch.area_code : null;
}

/**
 * @param {number[]} floorIds
 * @param {{ id: number, floor_name?: string, name?: string }[]} floors
 */
export function getFloorSelectionText(floorIds, floors) {
  if (!floorIds || floorIds.length === 0) {
    return null;
  }
  if (floorIds.length === 1) {
    const floor = floors.find((f) => f.id === floorIds[0]);
    return floor?.floor_name || floor?.name || `Floor ${floorIds[0]}`;
  }
  return `${floorIds.length} Floors Selected`;
}

/**
 * @param {(number|string)[]} groupIds
 * @param {{ variant?: 'basic'|'advanced'|'customized', areaGroups?: object|null }} [options]
 */
export function getGroupSelectionText(groupIds, options = {}) {
  const { variant = 'basic', areaGroups = null } = options;

  if (!groupIds || groupIds.length === 0) {
    return null;
  }

  if (variant === 'customized' && areaGroups) {
    const allGroupsList = [
      ...(areaGroups.special_area_groups || []),
      ...(areaGroups.user_area_groups || []),
    ];
    const names = groupIds.map((id) => {
      const g = allGroupsList.find(
        (x) =>
          x &&
          (x.group_id === id || x.group_id === Number(id) || String(x.group_id) === String(id))
      );
      return (g && g.name && String(g.name).trim()) || `Group ${id}`;
    });
    if (names.length === 1) {
      return names[0];
    }
    return `${names.length} groups`;
  }

  if (groupIds.length === 1) {
    return '1 Group Selected';
  }
  return `${groupIds.length} Groups Selected`;
}

/**
 * @param {number[]} areaIds
 * @param {{ areaTree?: object|null, variant?: string, combinedAreasThreshold?: number }} [options]
 */
export function getAreaSummaryText(areaIds, options = {}) {
  const { areaTree = null, variant = 'basic', combinedAreasThreshold = 5 } = options;

  if (!areaIds || areaIds.length === 0) {
    return null;
  }

  const roots = getTreeRoots(areaTree);

  if (variant === 'customized') {
    if (!roots.length) {
      return areaIds.length === 1 ? '1 area' : `${areaIds.length} areas`;
    }
    if (areaIds.length === 1) {
      return findAreaNameInTree(roots, areaIds[0]) || `Area ${areaIds[0]}`;
    }
    if (areaIds.length >= combinedAreasThreshold) {
      return 'Combined areas';
    }
    return `${areaIds.length} areas`;
  }

  if (areaIds.length === 1) {
    if (roots.length > 0) {
      const areaName = findAreaNameInTree(roots, areaIds[0]);
      if (areaName) {
        return areaName;
      }
    }
    return '1 Area Selected';
  }

  if (roots.length > 0) {
    const completeParent = findCompleteParentLabel(roots, areaIds);
    if (completeParent) {
      return completeParent;
    }
  }

  if (areaIds.length >= combinedAreasThreshold) {
    return 'Combined Areas';
  }
  return `${areaIds.length} Areas Selected`;
}

function joinLabelParts(base, ...extras) {
  const parts = [base, ...extras.filter(Boolean)];
  return parts.join(' · ');
}

/**
 * @param {object} context
 */
export function getAreaSelectionText(context) {
  const {
    variant = 'basic',
    floors = [],
    areaTree = null,
    areaGroups = null,
    selectedFloorIds = [],
    selectedAreas = [],
    selectedGroupIds = [],
    localSelectedFloorIds = [],
    localSelectedAreas = [],
    localSelectedGroups = [],
  } = context;

  const roots = getTreeRoots(areaTree);
  const textOptions = { variant, areaTree, areaGroups };

  if (selectedFloorIds.length > 0) {
    const base = getFloorSelectionText(selectedFloorIds, floors);
    if (variant === 'customized') {
      const g = getGroupSelectionText(selectedGroupIds, textOptions);
      const a = getAreaSummaryText(selectedAreas, textOptions);
      if (g || a) {
        return joinLabelParts(base, g, a);
      }
    }
    return base;
  }

  if (localSelectedFloorIds.length > 0) {
    const base = getFloorSelectionText(localSelectedFloorIds, floors);
    if (variant === 'customized') {
      const g = getGroupSelectionText(localSelectedGroups, textOptions);
      const a = getAreaSummaryText(localSelectedAreas, textOptions);
      if (g || a) {
        return joinLabelParts(base, g, a);
      }
    }
    return base;
  }

  if (variant === 'customized' && selectedGroupIds.length > 0) {
    const g = getGroupSelectionText(selectedGroupIds, textOptions);
    const a = getAreaSummaryText(selectedAreas, textOptions);
    if (a) {
      return joinLabelParts(g, a);
    }
    return g;
  }

  if (localSelectedGroups.length > 0) {
    return (
      getGroupSelectionText(localSelectedGroups, textOptions) ||
      `${localSelectedGroups.length} Groups Selected`
    );
  }

  const displayAreas = localSelectedAreas.length > 0 ? localSelectedAreas : selectedAreas;

  const isEmpty =
    displayAreas.length === 0 &&
    localSelectedFloorIds.length === 0 &&
    localSelectedGroups.length === 0 &&
    (!selectedFloorIds || selectedFloorIds.length === 0) &&
    (variant !== 'customized' || !selectedGroupIds || selectedGroupIds.length === 0);

  if (isEmpty) {
    if (roots.length > 0) {
      return roots[0].name || 'Project Name';
    }
    return 'Project Name';
  }

  return getAreaSummaryText(displayAreas, textOptions);
}

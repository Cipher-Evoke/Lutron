/**
 * Pure AreaTree selection ID resolvers (Phase 6.2C.7B.2).
 */
import {
  addDescendantAreaIds,
  removeDescendantAreaIds,
  mergeAreaSelections,
} from './areaTreeTraversal';

/**
 * @param {object} params
 */
export function resolveSelectedFloorIds({
  localSelectedFloorIds = [],
  committedSelectedFloorIds = [],
  preferLocal = true,
}) {
  if (preferLocal && localSelectedFloorIds.length > 0) {
    return [...localSelectedFloorIds];
  }
  return [...committedSelectedFloorIds];
}

/**
 * @param {object} params
 */
export function resolveSelectedGroupIds({
  localSelectedGroups = [],
  committedSelectedGroupIds = [],
  preferLocal = true,
}) {
  if (preferLocal && localSelectedGroups.length > 0) {
    return [...localSelectedGroups];
  }
  return [...committedSelectedGroupIds];
}

/**
 * @param {object} params
 */
export function resolveSelectedAreaIds({
  localSelectedAreas = [],
  committedSelectedAreas = [],
  localSelectedGroups = [],
  getAllAreasFromGroup,
  preferLocal = true,
}) {
  const baseAreas =
    preferLocal && localSelectedAreas.length > 0 ? [...localSelectedAreas] : [...committedSelectedAreas];

  if (!localSelectedGroups.length || typeof getAllAreasFromGroup !== 'function') {
    return baseAreas;
  }

  const groupAreaIds = [];
  localSelectedGroups.forEach((groupId) => {
    const areas = getAllAreasFromGroup(groupId);
    if (Array.isArray(areas)) {
      groupAreaIds.push(...areas);
    }
  });

  return [...new Set([...baseAreas, ...groupAreaIds])];
}

/**
 * @param {object} params
 */
export function resolveAreaToggleSelection({
  areaId,
  node,
  localSelectedAreas,
  getChildAreaIds,
}) {
  let newSelection = [...localSelectedAreas];
  let clearFloorSelection = false;

  if (localSelectedAreas.includes(areaId)) {
    newSelection = localSelectedAreas.filter((id) => id !== areaId);
    if (node.children?.length) {
      newSelection = removeDescendantAreaIds(newSelection, node, getChildAreaIds);
    }
    if (node.areas?.length) {
      newSelection = removeDescendantAreaIds(newSelection, node, getChildAreaIds);
    }
  } else {
    newSelection.push(areaId);
    if (node.children?.length) {
      newSelection = addDescendantAreaIds(newSelection, node, getChildAreaIds);
    }
    if (node.areas?.length) {
      newSelection = addDescendantAreaIds(newSelection, node, getChildAreaIds);
    }
  }

  if (newSelection.length > 0) {
    clearFloorSelection = true;
  }

  return { localSelectedAreas: newSelection, clearFloorSelection };
}

/**
 * @param {object} params
 */
export function resolveGroupToggleSelection({
  groupId,
  localSelectedGroups,
  localSelectedAreas,
  getAllAreasFromGroup,
}) {
  let newGroupSelection = [...localSelectedGroups];
  let newAreaSelection = [...localSelectedAreas];
  let clearFloorSelection = false;

  if (localSelectedGroups.includes(groupId)) {
    newGroupSelection = localSelectedGroups.filter((id) => id !== groupId);
    const childIds = getAllAreasFromGroup(groupId);
    newAreaSelection = newAreaSelection.filter((id) => !childIds.includes(id));
  } else {
    newGroupSelection.push(groupId);
    const childIds = getAllAreasFromGroup(groupId);
    newAreaSelection = mergeAreaSelections(newAreaSelection, childIds);
  }

  if (newGroupSelection.length > 0) {
    clearFloorSelection = true;
  }

  return {
    localSelectedGroups: newGroupSelection,
    localSelectedAreas: newAreaSelection,
    clearFloorSelection,
  };
}

/**
 * @param {object} params
 */
export function resolveIntermediateParentToggle({
  node,
  localSelectedAreas,
  getChildAreaIds,
}) {
  const allDescendantAreaIds = getChildAreaIds(node);
  const allDescendantsSelected = allDescendantAreaIds.every((id) => localSelectedAreas.includes(id));
  let newAreaSelection = [...localSelectedAreas];
  let clearFloorSelection = false;

  if (allDescendantsSelected) {
    newAreaSelection = newAreaSelection.filter((id) => !allDescendantAreaIds.includes(id));
  } else {
    newAreaSelection = mergeAreaSelections(newAreaSelection, allDescendantAreaIds);
  }

  if (newAreaSelection.length > 0) {
    clearFloorSelection = true;
  }

  return { localSelectedAreas: newAreaSelection, clearFloorSelection };
}

/**
 * @param {object} params
 */
export function resolveFloorDeselectAreas({
  floorId,
  localSelectedFloorIds,
  localSelectedAreas,
  getAreasForFloor,
}) {
  const floorAreaIds = getAreasForFloor(floorId);
  const newSelectedFloorIds = localSelectedFloorIds.filter((id) => id !== Number(floorId));
  const areasFromOtherFloors = new Set();

  for (const otherFloorId of newSelectedFloorIds) {
    const otherFloorAreaIds = getAreasForFloor(otherFloorId);
    otherFloorAreaIds.forEach((id) => areasFromOtherFloors.add(id));
  }

  const newSelectedAreas = localSelectedAreas.filter((id) => {
    const belongsToThisFloor = floorAreaIds.includes(id);
    const belongsToOtherFloors = areasFromOtherFloors.has(id);
    return !belongsToThisFloor || belongsToOtherFloors;
  });

  return {
    localSelectedFloorIds: newSelectedFloorIds,
    localSelectedAreas: newSelectedAreas,
    floorsWithSelectedAreas: newSelectedFloorIds,
  };
}

/**
 * @param {object} params
 */
export function resolveFloorSelectAreas({
  localSelectedAreas,
  floorAreaIds,
}) {
  return mergeAreaSelections(localSelectedAreas, floorAreaIds);
}

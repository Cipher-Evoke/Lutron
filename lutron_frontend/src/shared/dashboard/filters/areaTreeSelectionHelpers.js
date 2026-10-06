/**
 * Pure AreaTree selection state helpers (Phase 6.2C.7B.1).
 * @typedef {{ localSelectedAreas: number[], localSelectedFloorIds: number[], localSelectedGroups: (number|string)[] }} AreaTreeSelectionState
 */

/**
 * @param {object|null|undefined} node
 * @param {AreaTreeSelectionState} selectionState
 */
export function checkIfChildrenSelected(node, selectionState) {
  if (!node) {
    return false;
  }

  const { localSelectedAreas, localSelectedFloorIds, localSelectedGroups } = selectionState;

  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      if (child.area_id && localSelectedAreas.includes(child.area_id)) {
        return true;
      }
      if (child.floor_id && localSelectedFloorIds.includes(child.floor_id)) {
        return true;
      }
      if (child.group_id && localSelectedGroups.includes(child.group_id)) {
        return true;
      }
      if (checkIfChildrenSelected(child, selectionState)) {
        return true;
      }
    }
  }

  if (node.areas && node.areas.length > 0) {
    for (const area of node.areas) {
      if (area.area_id && localSelectedAreas.includes(area.area_id)) {
        return true;
      }
      if (checkIfChildrenSelected(area, selectionState)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * @param {object|null|undefined} node
 * @param {AreaTreeSelectionState} selectionState
 */
export function checkIfAllChildrenSelected(node, selectionState) {
  if (!node) {
    return false;
  }

  const { localSelectedAreas, localSelectedFloorIds, localSelectedGroups } = selectionState;

  let totalChildren = 0;
  let selectedChildren = 0;

  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      totalChildren += 1;
      if (child.area_id && localSelectedAreas.includes(child.area_id)) {
        selectedChildren += 1;
      } else if (child.floor_id && localSelectedFloorIds.includes(child.floor_id)) {
        selectedChildren += 1;
      } else if (child.group_id && localSelectedGroups.includes(child.group_id)) {
        selectedChildren += 1;
      } else if (checkIfAllChildrenSelected(child, selectionState)) {
        selectedChildren += 1;
      }
    }
  }

  if (node.areas && node.areas.length > 0) {
    for (const area of node.areas) {
      totalChildren += 1;
      if (area.area_id && localSelectedAreas.includes(area.area_id)) {
        selectedChildren += 1;
      } else if (checkIfAllChildrenSelected(area, selectionState)) {
        selectedChildren += 1;
      }
    }
  }

  return totalChildren > 0 && selectedChildren === totalChildren;
}

/**
 * @param {object} node
 * @param {AreaTreeSelectionState} selectionState
 */
export function resolveNodeCheckState(node, selectionState) {
  const hasChildren =
    (node.children && node.children.length > 0) || (node.areas && node.areas.length > 0);

  const isAreaSelected = Boolean(node.area_id && selectionState.localSelectedAreas.includes(node.area_id));
  const isFloorSelected = Boolean(
    node.floor_id && selectionState.localSelectedFloorIds.includes(node.floor_id)
  );
  const isGroupSelected = Boolean(
    node.group_id && selectionState.localSelectedGroups.includes(node.group_id)
  );

  const hasSelectedChildren = hasChildren && checkIfChildrenSelected(node, selectionState);
  const allChildrenSelected = hasChildren && checkIfAllChildrenSelected(node, selectionState);

  const isSelected = isAreaSelected || isFloorSelected || isGroupSelected || allChildrenSelected;
  const isIndeterminate = hasSelectedChildren && !allChildrenSelected;

  const isFloorNode = Boolean(node.floor_id && !node.area_id);
  const isAreaNode = Boolean(node.area_id);
  const isGroupNode = Boolean(node.group_id && !node.area_id && !node.floor_id);
  const isIntermediateParent = hasChildren && !isFloorNode && !isAreaNode && !isGroupNode;

  return {
    hasChildren,
    isAreaSelected,
    isFloorSelected,
    isGroupSelected,
    hasSelectedChildren,
    allChildrenSelected,
    isSelected,
    isIndeterminate,
    isFloorNode,
    isAreaNode,
    isGroupNode,
    isIntermediateParent,
  };
}

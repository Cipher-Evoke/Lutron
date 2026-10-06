/**
 * Pure AreaTree state aggregation resolvers (Phase 6.2C.7B.2).
 */
import { resolveNodeCheckState } from './areaTreeSelectionHelpers';
import { getAreaSelectionText } from './areaTreeSelectionText';

/**
 * @param {object} node
 * @param {object} selectionState
 */
export function resolveAreaTreeCheckboxState(node, selectionState) {
  return resolveNodeCheckState(node, selectionState);
}

/**
 * @param {object} params
 */
export function resolveAreaTreeSelectionState({
  localSelectedAreas = [],
  localSelectedFloorIds = [],
  localSelectedGroups = [],
}) {
  return {
    localSelectedAreas,
    localSelectedFloorIds,
    localSelectedGroups,
    hasPendingSelection:
      localSelectedAreas.length > 0 ||
      localSelectedFloorIds.length > 0 ||
      localSelectedGroups.length > 0,
  };
}

/**
 * @param {object} context
 */
export function resolveAreaTreeSummaryState(context) {
  const {
    localSelectedAreas = [],
    localSelectedFloorIds = [],
    localSelectedGroups = [],
    selectedAreas = [],
    selectedFloorIds = [],
    selectedGroupIds = [],
  } = context;

  const displayAreas = localSelectedAreas.length > 0 ? localSelectedAreas : selectedAreas;
  const displayFloorIds =
    localSelectedFloorIds.length > 0 ? localSelectedFloorIds : selectedFloorIds;
  const displayGroupIds =
    localSelectedGroups.length > 0 ? localSelectedGroups : selectedGroupIds;

  return {
    displayAreas,
    displayFloorIds,
    displayGroupIds,
    selectionLabel: getAreaSelectionText(context),
    hasCommittedSelection:
      selectedAreas.length > 0 ||
      selectedFloorIds.length > 0 ||
      selectedGroupIds.length > 0,
    hasPendingSelection:
      localSelectedAreas.length > 0 ||
      localSelectedFloorIds.length > 0 ||
      localSelectedGroups.length > 0,
  };
}

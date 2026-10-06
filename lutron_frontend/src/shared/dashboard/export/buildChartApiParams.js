/**
 * Builds apiParams for chart export/download/email Redux thunks.
 * Uses empty arrays (not null) to match existing Dashboard/SpaceUtil export handlers.
 */
export function buildChartApiParams({
  selectedAreas = [],
  selectedFloorIds = [],
  selectedGroupIds = [],
  timeRange,
  startDate,
  endDate,
  isNavigating = false,
  includeNavigating = true,
}) {
  const floorsSelected = Array.isArray(selectedFloorIds) && selectedFloorIds.length > 0;
  const groupsSelected = Array.isArray(selectedGroupIds) && selectedGroupIds.length > 0;

  const params = {
    areaIds: floorsSelected ? [] : selectedAreas.length > 0 ? selectedAreas : [],
    floorIds: floorsSelected ? selectedFloorIds : [],
    timeRange,
    startDate,
    endDate,
  };

  if (groupsSelected) {
    params.groupIds = selectedGroupIds;
  }

  if (includeNavigating) {
    params.isNavigating = isNavigating;
  }

  return params;
}

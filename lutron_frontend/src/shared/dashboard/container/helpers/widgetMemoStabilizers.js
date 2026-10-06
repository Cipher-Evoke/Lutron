/**
 * Stabilize dashboard payload references when deep JSON content is unchanged.
 * Mirrors legacy prevRef + useMemo pattern in Dashboard.jsx.
 */
export function stabilizeDashboardPayload(payload, previousRef) {
  const currentStr = JSON.stringify(payload);
  const prevStr = JSON.stringify(previousRef.current);

  if (currentStr === prevStr && previousRef.current !== null) {
    return previousRef.current;
  }

  previousRef.current = payload;
  return payload;
}

export function buildStandardTransformChartOptions({
  selectedDuration,
  selectedAreas,
  areaTree,
}) {
  return {
    selectedDuration,
    selectedAreas,
    areaTree,
  };
}

export function buildCustomizedTransformChartOptions({
  selectedDuration,
  selectedAreas,
  selectedFloorIds,
  selectedGroupIds,
  areaTree,
  areaGroups,
  floors,
  forceIndividualAreas = false,
  widgetFloorIds = null,
  widgetAreaIds = null,
  widgetGroupIds = null,
}) {
  return {
    selectedDuration,
    selectedAreas,
    selectedFloorIds,
    selectedGroupIds,
    areaTree,
    areaGroups,
    floors,
    forceIndividualAreas,
    widgetFloorIds: widgetFloorIds,
    widgetAreaIds: widgetAreaIds,
    widgetGroupIds: widgetGroupIds,
  };
}

export function createStandardTransformDataForCharts(sharedTransform, options) {
  return (data, chartType = 'consumption') =>
    sharedTransform(data, chartType, options);
}

export function createCustomizedTransformDataForCharts(sharedTransform, baseOptions) {
  return (
    data,
    chartType = 'consumption',
    forceIndividualAreas = false,
    floorIds = null,
    areaIds = null,
    groupIds = null
  ) =>
    sharedTransform(data, chartType, {
      ...baseOptions,
      forceIndividualAreas,
      widgetFloorIds: floorIds,
      widgetAreaIds: areaIds,
      widgetGroupIds: groupIds,
    });
}

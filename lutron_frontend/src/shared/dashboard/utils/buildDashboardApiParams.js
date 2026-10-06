import { mapTimeRangeToBackend } from './mapTimeRangeToBackend';

/**
 * Whether custom duration has both dates set (supports basic + advanced selector shapes).
 */
export function isCustomDurationReady(selectedDuration, customDateRange, customStartDate, customEndDate) {
  if (selectedDuration !== 'custom') return true;
  const startFromRange = (customDateRange?.startDate || '').trim();
  const endFromRange = (customDateRange?.endDate || '').trim();
  if (startFromRange !== '' || endFromRange !== '') {
    return startFromRange !== '' && endFromRange !== '';
  }
  return Boolean(customStartDate && customEndDate);
}

/**
 * Builds the Dashboard `apiParams` object passed to Redux thunks.
 * Shape unchanged: { areaIds, floorIds, timeRange, startDate, endDate, isNavigating }.
 */
export function buildDashboardApiParams({
  selectedDuration,
  customDateRange,
  customStartDate,
  customEndDate,
  selectedAreas,
  selectedFloorIds,
  allAreasLoaded,
  dateParams,
  isNavigating,
}) {
  if (!selectedDuration) {
    return null;
  }

  if (!isCustomDurationReady(selectedDuration, customDateRange, customStartDate, customEndDate)) {
    return null;
  }

  // Only block on allAreasLoaded if specific area or floor selections are active
  // but area tree hasn't finished loading. For default full-project view
  // (no areas/floors selected), apiParams must not be blocked so charts load immediately on refresh.
  const hasAreaOrFloorSelection =
    (selectedAreas && selectedAreas.length > 0) ||
    (selectedFloorIds && selectedFloorIds.length > 0);

  if (hasAreaOrFloorSelection && allAreasLoaded === false) {
    return null;
  }

  // Prefer explicit area selections when present. Only fall back to floors
  // when no explicit areas are selected. This ensures selecting 3 areas
  // results in `areaIds` being sent to the API instead of `floorIds`.
  const areasToUse = selectedAreas && selectedAreas.length > 0 ? selectedAreas : null;
  const floorsToUse = selectedFloorIds && selectedFloorIds.length > 0 ? selectedFloorIds : null;

  const { timeRange, startDate, endDate } = dateParams || {};

  return {
    areaIds: areasToUse && areasToUse.length > 0 ? areasToUse : null,
    floorIds: !areasToUse && floorsToUse && floorsToUse.length > 0 ? floorsToUse : null,
    timeRange,
    startDate,
    endDate,
    isNavigating,
  };
}

/** Stable JSON key for deduping fetch effects (matches Dashboard.jsx). */
export function serializeDashboardApiParams(apiParams) {
  if (!apiParams) return null;
  return JSON.stringify({
    areaIds: apiParams.areaIds,
    floorIds: apiParams.floorIds,
    timeRange: apiParams.timeRange,
    startDate: apiParams.startDate,
    endDate: apiParams.endDate,
    isNavigating: apiParams.isNavigating,
  });
}

/**
 * Axios query params for dashboard chart GETs (matches dashboardSlice thunk logic).
 */
export function buildDashboardChartAxiosParams(apiParams) {
  // No cache-buster: identical params must match dashboardSlice URLs so
  // coalesceDashboardHttpGet can join custom-graph + built-in chart GETs.
  const params = {};
  if (!apiParams) return params;

  const { areaIds, floorIds, groupIds, timeRange, startDate, endDate, isNavigating } = apiParams;

  if (floorIds && floorIds.length > 0) {
    params.floor_ids = floorIds;
  }
  if (areaIds && areaIds.length > 0) {
    params.area_ids = areaIds;
  }
  if (groupIds && groupIds.length > 0) {
    params.group_ids = groupIds;
  }

  if (timeRange === 'this-day' && isNavigating) {
    params.time_range = 'custom';
    params.start_date = startDate;
    params.end_date = endDate;
  } else if (timeRange === 'this-week' && isNavigating) {
    params.time_range = 'custom';
    params.start_date = startDate;
    params.end_date = endDate;
  } else if (timeRange === 'this-month' && isNavigating) {
    params.time_range = 'custom';
    params.start_date = startDate;
    params.end_date = endDate;
  } else if (timeRange === 'this-year' && isNavigating) {
    params.time_range = 'custom';
    params.start_date = startDate;
    params.end_date = endDate;
  } else if (
    timeRange === 'custom' &&
    startDate &&
    endDate &&
    String(startDate).trim() !== '' &&
    String(endDate).trim() !== ''
  ) {
    params.time_range = 'custom';
    params.start_date = startDate;
    params.end_date = endDate;
  } else {
    params.time_range = mapTimeRangeToBackend(timeRange);
  }

  return params;
}

export function pickEnergyBucketTimeParams(apiParams) {
  if (!apiParams || typeof apiParams !== 'object') return {};
  return {
    timeRange: apiParams.timeRange,
    startDate: apiParams.startDate,
    endDate: apiParams.endDate,
    isNavigating: apiParams.isNavigating,
  };
}

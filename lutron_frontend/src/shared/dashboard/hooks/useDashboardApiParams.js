import { useMemo } from 'react';
import {
  buildDashboardApiParams,
  serializeDashboardApiParams,
} from '../utils/buildDashboardApiParams';

/**
 * Memoized `apiParams` + stable serialization for fetch deduplication.
 */
export function useDashboardApiParams({
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
  const apiParams = useMemo(
    () =>
      buildDashboardApiParams({
        selectedDuration,
        customDateRange,
        customStartDate,
        customEndDate,
        selectedAreas,
        selectedFloorIds,
        allAreasLoaded,
        dateParams,
        isNavigating,
      }),
    [
      selectedAreas,
      selectedFloorIds,
      selectedDuration,
      customDateRange?.startDate,
      customDateRange?.endDate,
      customStartDate,
      customEndDate,
      dateParams,
      isNavigating,
      allAreasLoaded,
    ]
  );

  const apiParamsString = useMemo(
    () => serializeDashboardApiParams(apiParams),
    [apiParams]
  );

  return { apiParams, apiParamsString };
}

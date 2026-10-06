import { useMemo, useRef } from 'react';
import {
  calculateDashboardCurrentDateParameters,
  calculateDashboardDateParameters,
} from '../utils/dashboardDateState';

/**
 * Memoized dashboard date filter params from Redux duration state.
 */
export function useDashboardDateRange({
  selectedDuration,
  customDateRange,
  isNavigating,
  currentDate,
  currentYear,
}) {
  const stableDateRef = useRef(new Date());

  const dateParams = useMemo(
    () =>
      calculateDashboardDateParameters({
        selectedDuration,
        customDateRange,
        isNavigating,
        currentDate,
        currentYear,
        stableDate: stableDateRef.current,
      }),
    [selectedDuration, customDateRange?.startDate, customDateRange?.endDate, isNavigating, currentDate, currentYear]
  );

  const getCurrentDateParameters = () =>
    calculateDashboardCurrentDateParameters({
      selectedDuration,
      customDateRange,
      isNavigating,
      currentDate,
    });

  return { dateParams, getCurrentDateParameters, stableDateRef };
}

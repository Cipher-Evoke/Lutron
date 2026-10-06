import { useCallback, useMemo } from 'react';
import { useDashboardDateRange } from '../../hooks/useDashboardDateRange';
import { calculateDashboardDateParameters } from '../../utils/dashboardDateState';
import {
  applyDashboardPeriodNavigationResolution,
  DASHBOARD_NAVIGATION_CHART_LOADING,
  resolveEnergyCustomNeedsDates,
  resolveNextPeriodNavigation,
  resolvePreviousPeriodNavigation,
} from '../helpers/dashboardDateNavigation';
import { getDashboardPeriodText } from '../helpers/dashboardPeriodText';

export function useDashboardDates({
  dispatch,
  dateActions,
  selectedDuration,
  customDateRange,
  isNavigating,
  currentDate,
  currentYear,
  customStartDate = '',
  customEndDate = '',
  setChartLoading,
  setIsDataLoading,
  setSelectedMonthForData,
}) {
  const { setCustomDateRange, setCurrentDate, setCurrentYear, setIsNavigating } = dateActions;

  const { dateParams, getCurrentDateParameters, stableDateRef } = useDashboardDateRange({
    selectedDuration,
    customDateRange,
    isNavigating,
    currentDate,
    currentYear,
  });

  const calculateDateParameters = useCallback(
    () =>
      calculateDashboardDateParameters({
        selectedDuration,
        customDateRange,
        isNavigating,
        currentDate,
        currentYear,
        stableDate: stableDateRef.current,
      }),
    [selectedDuration, customDateRange, isNavigating, currentDate, currentYear, stableDateRef]
  );

  const energyCustomNeedsDates = useMemo(
    () =>
      resolveEnergyCustomNeedsDates({
        selectedDuration,
        customStartDate,
        customEndDate,
      }),
    [selectedDuration, customStartDate, customEndDate]
  );

  const getCurrentPeriodText = useCallback(
    () =>
      getDashboardPeriodText({
        selectedDuration,
        currentDate,
        currentYear,
        customStartDate,
        customEndDate,
      }),
    [selectedDuration, currentDate, currentYear, customStartDate, customEndDate]
  );

  const applyNavigationResolution = useCallback(
    (resolution) => {
      applyDashboardPeriodNavigationResolution({
        resolution,
        dispatch,
        setCustomDateRange,
        setCurrentDate,
        setCurrentYear,
        setIsNavigating,
        setSelectedMonthForData,
      });
    },
    [
      dispatch,
      setCustomDateRange,
      setCurrentDate,
      setCurrentYear,
      setIsNavigating,
      setSelectedMonthForData,
    ]
  );

  const handlePrevious = useCallback(() => {
    const resolution = resolvePreviousPeriodNavigation({
      selectedDuration,
      currentDate,
      currentYear,
      customDateRange,
    });
    if (!resolution) return;

    setChartLoading(DASHBOARD_NAVIGATION_CHART_LOADING);
    setIsDataLoading(true);
    applyNavigationResolution(resolution);
  }, [
    applyNavigationResolution,
    customDateRange,
    currentDate,
    currentYear,
    selectedDuration,
    setChartLoading,
    setIsDataLoading,
  ]);

  const handleNext = useCallback(() => {
    const resolution = resolveNextPeriodNavigation({
      selectedDuration,
      currentDate,
      currentYear,
      customDateRange,
    });
    if (!resolution.shouldSetLoading) return;

    setChartLoading(DASHBOARD_NAVIGATION_CHART_LOADING);
    setIsDataLoading(true);
    if (!resolution.applied) return;

    applyNavigationResolution(resolution);
  }, [
    applyNavigationResolution,
    customDateRange,
    currentDate,
    currentYear,
    selectedDuration,
    setChartLoading,
    setIsDataLoading,
  ]);

  return {
    dateParams,
    getCurrentDateParameters,
    calculateDateParameters,
    calculateCurrentDateParameters: getCurrentDateParameters,
    stableDateRef,
    energyCustomNeedsDates,
    getCurrentPeriodText,
    handlePrevious,
    handleNext,
  };
}

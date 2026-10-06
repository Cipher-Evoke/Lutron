import { formatDateForState, parseDateFromState } from '../../utils/dashboardDateState';

export const DASHBOARD_NAVIGATION_CHART_LOADING = {
  energyConsumption: true,
  energySavings: true,
  peakMinConsumption: true,
  totalConsumptionByGroup: true,
  lightPowerDensity: true,
  occupancyCount: true,
  occupancyByGroup: true,
  spaceUtilizationPerArea: true,
  savingsByStrategy: true,
};

function formatYmd(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatYmdWithTime(date, timeSuffix) {
  return `${formatYmd(date)}${timeSuffix}`;
}

function getEndOfToday(today = new Date()) {
  const end = new Date(today);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Pure resolver for legacy handlePrevious navigation outcomes.
 * Returns null when the duration is not navigable.
 */
export function resolvePreviousPeriodNavigation({
  selectedDuration,
  currentDate,
  currentYear,
  customDateRange = {},
}) {
  if (selectedDuration === 'this-day') {
    const newDate = parseDateFromState(currentDate);
    newDate.setDate(newDate.getDate() - 1);

    const startDateStr = formatYmd(newDate);
    const endDateStr = formatYmd(newDate);

    return {
      customDateRange: { startDate: startDateStr, endDate: endDateStr },
      currentDate: formatDateForState(newDate),
    };
  }

  if (selectedDuration === 'this-week') {
    const newDate = parseDateFromState(currentDate);
    newDate.setDate(newDate.getDate() - 7);

    const startOfWeek = new Date(newDate);
    startOfWeek.setDate(newDate.getDate() - newDate.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return {
      customDateRange: {
        startDate: formatYmd(startOfWeek),
        endDate: formatYmd(endOfWeek),
      },
      currentDate: formatDateForState(newDate),
    };
  }

  if (selectedDuration === 'this-month') {
    const newDate = parseDateFromState(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);

    const year = newDate.getFullYear();
    const month = newDate.getMonth();
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

    return {
      customDateRange: {
        startDate: `${year}-${String(month + 1).padStart(2, '0')}-01`,
        endDate: `${year}-${String(month + 1).padStart(2, '0')}-${String(endOfMonth.getDate()).padStart(2, '0')}`,
      },
      currentDate: formatDateForState(newDate),
      selectedMonthForData: { year, month },
    };
  }

  if (selectedDuration === 'this-year') {
    const newYear = currentYear - 1;

    return {
      customDateRange: {
        startDate: `${newYear}-01-01`,
        endDate: `${newYear}-12-31`,
      },
      currentYear: newYear,
    };
  }

  if (selectedDuration === 'custom') {
    const currentStartDate = new Date(customDateRange.startDate);
    const currentEndDate = new Date(customDateRange.endDate);
    const dayDiff =
      Math.ceil((currentEndDate - currentStartDate) / (1000 * 60 * 60 * 24)) + 1;

    const newStartDate = new Date(currentStartDate);
    newStartDate.setDate(newStartDate.getDate() - dayDiff);
    const newEndDate = new Date(currentEndDate);
    newEndDate.setDate(newEndDate.getDate() - dayDiff);

    return {
      customDateRange: {
        startDate: formatYmd(newStartDate),
        endDate: formatYmd(newEndDate),
      },
      currentDate: formatDateForState(newStartDate),
    };
  }

  return null;
}

/**
 * Pure resolver for legacy handleNext navigation outcomes.
 * `shouldSetLoading` mirrors when legacy code calls setChartLoading before applying navigation.
 */
export function resolveNextPeriodNavigation({
  selectedDuration,
  currentDate,
  currentYear,
  customDateRange = {},
  today = new Date(),
}) {
  const endOfToday = getEndOfToday(today);

  if (selectedDuration === 'this-day') {
    const newDate = parseDateFromState(currentDate);
    newDate.setDate(newDate.getDate() + 1);

    if (newDate > endOfToday) {
      return { shouldSetLoading: false, applied: false };
    }

    const startDateStr = formatYmd(newDate);
    const endDateStr = formatYmd(newDate);

    return {
      shouldSetLoading: true,
      applied: true,
      customDateRange: { startDate: startDateStr, endDate: endDateStr },
      currentDate: formatDateForState(newDate),
    };
  }

  if (selectedDuration === 'this-week') {
    const newDate = parseDateFromState(currentDate);
    newDate.setDate(newDate.getDate() + 7);

    if (newDate > endOfToday) {
      return { shouldSetLoading: false, applied: false };
    }

    const startOfWeek = new Date(newDate);
    startOfWeek.setDate(newDate.getDate() - newDate.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return {
      shouldSetLoading: true,
      applied: true,
      customDateRange: {
        startDate: formatYmdWithTime(startOfWeek, 'T00:00:00'),
        endDate: formatYmdWithTime(endOfWeek, 'T23:59:59'),
      },
      currentDate: formatDateForState(newDate),
    };
  }

  if (selectedDuration === 'this-month') {
    const newDate = parseDateFromState(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);

    if (newDate > endOfToday) {
      return { shouldSetLoading: false, applied: false };
    }

    const year = newDate.getFullYear();
    const month = newDate.getMonth();
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

    return {
      shouldSetLoading: true,
      applied: true,
      customDateRange: {
        startDate: `${year}-${String(month + 1).padStart(2, '0')}-01T00:00:00`,
        endDate: `${year}-${String(month + 1).padStart(2, '0')}-${String(endOfMonth.getDate()).padStart(2, '0')}T23:59:59`,
      },
      currentDate: formatDateForState(newDate),
      selectedMonthForData: { year, month },
    };
  }

  if (selectedDuration === 'this-year') {
    const newYear = currentYear + 1;

    if (newYear > endOfToday.getFullYear()) {
      return { shouldSetLoading: false, applied: false };
    }

    return {
      shouldSetLoading: true,
      applied: true,
      customDateRange: {
        startDate: `${newYear}-01-01T00:00:00`,
        endDate: `${newYear}-12-31T23:59:59`,
      },
      currentYear: newYear,
    };
  }

  if (selectedDuration === 'custom') {
    const currentStartDate = new Date(customDateRange.startDate);
    const currentEndDate = new Date(customDateRange.endDate);
    const dayDiff =
      Math.ceil((currentEndDate - currentStartDate) / (1000 * 60 * 60 * 24)) + 1;

    const newStartDate = new Date(currentStartDate);
    newStartDate.setDate(newStartDate.getDate() + dayDiff);
    const newEndDate = new Date(currentEndDate);
    newEndDate.setDate(newEndDate.getDate() + dayDiff);

    if (newEndDate > endOfToday) {
      return { shouldSetLoading: true, applied: false };
    }

    return {
      shouldSetLoading: true,
      applied: true,
      customDateRange: {
        startDate: newStartDate.toISOString(),
        endDate: newEndDate.toISOString(),
      },
      currentDate: formatDateForState(newStartDate),
    };
  }

  return { shouldSetLoading: false, applied: false };
}

export function resolveEnergyCustomNeedsDates({
  selectedDuration,
  customStartDate = '',
  customEndDate = '',
} = {}) {
  return selectedDuration === 'custom' && (!customStartDate || !customEndDate);
}

export function applyDashboardPeriodNavigationResolution({
  resolution,
  dispatch,
  setCustomDateRange,
  setCurrentDate,
  setCurrentYear,
  setIsNavigating,
  setSelectedMonthForData,
}) {
  if (!resolution?.customDateRange) return;

  dispatch(setCustomDateRange(resolution.customDateRange));
  if (resolution.currentDate) {
    dispatch(setCurrentDate(resolution.currentDate));
  }
  if (resolution.currentYear !== undefined) {
    dispatch(setCurrentYear(resolution.currentYear));
  }
  dispatch(setIsNavigating(true));
  if (resolution.selectedMonthForData && setSelectedMonthForData) {
    setSelectedMonthForData(resolution.selectedMonthForData);
  }
}

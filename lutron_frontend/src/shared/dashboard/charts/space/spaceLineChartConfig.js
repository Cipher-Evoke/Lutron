import { parseDateFromState } from '../../utils/dashboardDateState';
import { spaceOccupancyToRecharts } from '../transforms/spaceOccupancyToRecharts';

export const SPACE_LINE_EMPTY_MESSAGE = 'No occupancy data available for Utilization';
export const SPACE_LINE_ERROR_MESSAGE = 'Error loading occupancy data';

/**
 * Legacy status machine from variant SpaceUtilization LineChartComponent.
 */
export function resolveSpaceLineChartStatus({
  occupancyCount,
  occupancyCountLoading,
  anyLoading: _anyLoading,
  isLoading: _isLoading,
  globalLoadingProp: _globalLoadingProp,
}) {
  if (occupancyCountLoading) {
    return 'loading';
  }
  if (occupancyCount && occupancyCount.status === 'error') {
    return 'error';
  }
  if (occupancyCount && occupancyCount['x-axis'] && occupancyCount['y-axis']) {
    return 'ready';
  }
  if (!occupancyCount && !occupancyCountLoading) {
    return 'empty';
  }
  if (!occupancyCount) {
    return 'loading';
  }
  return 'ready';
}

export function shouldShowSpaceOccupancyPercentage(selectedDuration, customDateRange = {}) {
  if (selectedDuration === 'this-day') {
    return false;
  }
  if (selectedDuration === 'custom') {
    if (customDateRange.startDate && customDateRange.endDate) {
      try {
        const startDate = new Date(customDateRange.startDate);
        const endDate = new Date(customDateRange.endDate);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        const diffTime = endDateOnly.getTime() - startDateOnly.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays > 1;
      } catch (error) {
        return true;
      }
    }
    return true;
  }
  return true;
}

export function getCustomPeriodFlags(selectedDuration, customDateRange = {}) {
  let isCustomWeek = false;
  let isCustomMonth = false;
  if (selectedDuration === 'custom' && customDateRange.startDate && customDateRange.endDate) {
    try {
      const startDate = new Date(customDateRange.startDate);
      const endDate = new Date(customDateRange.endDate);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      const diffTime = endDate.getTime() - startDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      isCustomWeek = diffDays >= 2 && diffDays <= 7;
      isCustomMonth = diffDays >= 28 && diffDays <= 31;
    } catch (error) {
      isCustomWeek = false;
      isCustomMonth = false;
    }
  }
  return { isCustomWeek, isCustomMonth };
}

export function getSpaceLineChartConfig(processedChartData, selectedDuration, customDateRange = {}) {
  const dataPointCount = processedChartData.length;
  const { isCustomWeek, isCustomMonth } = getCustomPeriodFlags(selectedDuration, customDateRange);

  if (selectedDuration === 'this-day') {
    return { xAxisInterval: 3, xAxisTickCount: 24, xAxisFontSize: 10 };
  }
  if (selectedDuration === 'this-week' || isCustomWeek) {
    return {
      xAxisInterval: isCustomWeek ? 0 : 3,
      xAxisTickCount: 7,
      xAxisFontSize: 10,
    };
  }
  if (selectedDuration === 'this-month' || isCustomMonth) {
    return {
      xAxisInterval: isCustomMonth ? 0 : 2,
      xAxisTickCount: isCustomMonth ? dataPointCount : Math.min(10, Math.ceil(dataPointCount / 3)),
      xAxisFontSize: 9,
    };
  }
  if (selectedDuration === 'this-year') {
    return { xAxisInterval: 0, xAxisTickCount: 12, xAxisFontSize: 9 };
  }
  if (selectedDuration === 'custom') {
    return {
      xAxisInterval: 0,
      xAxisTickCount: dataPointCount,
      xAxisFontSize: 9,
    };
  }
  return {
    xAxisInterval: 2,
    xAxisTickCount: Math.min(10, Math.ceil(dataPointCount / 3)),
    xAxisFontSize: 10,
  };
}

export function filterCustomWeekOccupancyData(processedChartData, selectedDuration, customDateRange = {}) {
  if (selectedDuration !== 'custom' || !customDateRange.startDate || !customDateRange.endDate) {
    return processedChartData;
  }
  try {
    const startDate = new Date(customDateRange.startDate);
    const endDate = new Date(customDateRange.endDate);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    if (diffDays >= 2 && diffDays <= 7) {
      const filteredData = processedChartData.filter((item) => {
        if (!item.date) return false;
        const dateStr = String(item.date).trim();
        const match = dateStr.match(/^([A-Za-z]{3})\s+(\d+)$/);
        if (match) {
          return parseInt(match[2], 10) === 0;
        }
        return false;
      });
      if (filteredData.length > 0) {
        return filteredData;
      }
    }
  } catch (error) {
    // ignore
  }
  return processedChartData;
}

export function computeSpaceLineChartMetrics(processedChartData) {
  const limitedOccupancyValues = processedChartData.map((item) => item.occupancy);
  const nonNullValues = limitedOccupancyValues.filter((val) => val !== null && val !== undefined);
  const maxOccupancy =
    nonNullValues.length > 0 ? Math.max(...nonNullValues.map((val) => val), 1) : 1;
  return { nonNullValues, maxOccupancy };
}

export function isCustomWeekLocal(customDateRange = {}) {
  if (!customDateRange.startDate || !customDateRange.endDate) return false;
  try {
    const startDate = new Date(customDateRange.startDate);
    const endDate = new Date(customDateRange.endDate);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays >= 2 && diffDays <= 7;
  } catch (error) {
    return false;
  }
}

export function buildSpaceLineXAxisTicks(processedChartData, selectedDuration, customDateRange = {}) {
  if (selectedDuration === 'this-day') {
    const ticks = [];
    for (let hour = 0; hour < 24; hour++) {
      ticks.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return ticks;
  }
  if (selectedDuration === 'this-year') {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const allQuarters = [];
    monthNames.forEach((monthName) => {
      for (let quarter = 0; quarter < 4; quarter++) {
        allQuarters.push(`${monthName}-${quarter}`);
      }
    });
    return allQuarters;
  }
  if (selectedDuration === 'custom') {
    if (isCustomWeekLocal(customDateRange)) {
      return processedChartData
        .filter((item) => {
          const match = item.date && String(item.date).match(/^([A-Za-z]{3})\s+(\d+)$/);
          return match && parseInt(match[2], 10) === 0;
        })
        .map((item) => item.date);
    }
    return processedChartData.map((item) => item.date);
  }
  return undefined;
}

export function formatSpaceTooltipLabel(tooltipLabel, { selectedDuration, currentDate }) {
  if (!tooltipLabel) return tooltipLabel;

  if (selectedDuration === 'this-week') {
    const targetDate = parseDateFromState(currentDate);
    const selectionStart = new Date(targetDate);
    selectionStart.setHours(0, 0, 0, 0);
    selectionStart.setDate(selectionStart.getDate() - selectionStart.getDay());

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - today.getDay());

    const isSelectedWeekCurrent = selectionStart.getTime() === currentWeekStart.getTime();

    if (typeof tooltipLabel === 'string') {
      const dateTimeMatch = tooltipLabel.match(/^(\d{1,2})\/(\d{1,2})(?:\s+(\d+))?$/);
      if (dateTimeMatch && isSelectedWeekCurrent) {
        const dayNum = Number(dateTimeMatch[1]);
        const monthNum = Number(dateTimeMatch[2]);
        const hour = dateTimeMatch[3];

        const baseDate = parseDateFromState(currentDate);
        const resolvedDate = (() => {
          const candidate = new Date(baseDate.getFullYear(), monthNum - 1, dayNum);
          const diffDays = (candidate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24);
          if (diffDays > 180) {
            candidate.setFullYear(candidate.getFullYear() - 1);
          } else if (diffDays < -180) {
            candidate.setFullYear(candidate.getFullYear() + 1);
          }
          return candidate;
        })();

        const weekdayName = resolvedDate.toLocaleDateString('en-US', { weekday: 'short' });
        return hour ? `${weekdayName} ${hour}` : weekdayName;
      }
    }
  }

  return tooltipLabel;
}

export function buildSpaceLineChartDataset(occupancyCount, options = {}) {
  const {
    selectedDuration,
    currentDate,
    customDateRange = {},
  } = options;

  let processedChartData = spaceOccupancyToRecharts(occupancyCount, {
    selectedDuration,
    currentDate,
    customDateRange,
  });

  processedChartData = filterCustomWeekOccupancyData(
    processedChartData,
    selectedDuration,
    customDateRange
  );

  const chartConfig = getSpaceLineChartConfig(processedChartData, selectedDuration, customDateRange);
  const { nonNullValues, maxOccupancy } = computeSpaceLineChartMetrics(processedChartData);
  const showPercentage = shouldShowSpaceOccupancyPercentage(selectedDuration, customDateRange);
  const xAxisTicks = buildSpaceLineXAxisTicks(processedChartData, selectedDuration, customDateRange);

  return {
    processedChartData,
    chartConfig,
    nonNullValues,
    maxOccupancy,
    showPercentage,
    xAxisTicks,
  };
}

/**
 * Replicated legacy pipeline for parity tests.
 */
export function legacySpaceLineChartPipeline(occupancyCount, options = {}) {
  return buildSpaceLineChartDataset(occupancyCount, options);
}

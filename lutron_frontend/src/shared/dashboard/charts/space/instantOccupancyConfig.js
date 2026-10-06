import { parseDateFromState } from '../../utils/dashboardDateState';
import { instantOccupancyToRecharts } from '../transforms/instantOccupancyToRecharts';
import { shouldShowSpaceOccupancyPercentage, isCustomWeekLocal } from './spaceLineChartConfig';

export const INSTANT_OCCUPANCY_EMPTY_MESSAGE = 'No instant occupancy data available';
export const INSTANT_OCCUPANCY_ERROR_MESSAGE = 'Error loading instant occupancy data';

const WORK_START_MIN = 8 * 60;
const WORK_END_MIN = 18 * 60;

export function resolveInstantOccupancyChartStatus({
  instantOccupancyCount,
  instantOccupancyCountLoading,
  instantOccupancyCountError,
  anyLoading: _anyLoading,
  isLoading: _isLoading,
  globalLoadingProp: _globalLoadingProp,
}) {
  if (instantOccupancyCountLoading) {
    return 'loading';
  }
  if (instantOccupancyCountError) {
    return 'error';
  }
  if (
    !instantOccupancyCount ||
    !instantOccupancyCount['x-axis'] ||
    !instantOccupancyCount['y-axis']
  ) {
    if (!instantOccupancyCount && !instantOccupancyCountLoading) {
      return 'empty';
    }
    if (!instantOccupancyCount) return 'loading';
    return 'empty';
  }
  return 'ready';
}

export function getInstantOccupancyChartConfig(processedChartData, selectedDuration) {
  const dataPointCount = processedChartData.length;
  if (selectedDuration === 'this-day') {
    return { xAxisInterval: 0, xAxisTickCount: 24, xAxisFontSize: 10 };
  }
  if (selectedDuration === 'this-week') {
    return { xAxisInterval: 3, xAxisTickCount: 7, xAxisFontSize: 10 };
  }
  if (selectedDuration === 'this-month') {
    return {
      xAxisInterval: 2,
      xAxisTickCount: Math.min(10, Math.ceil(dataPointCount / 3)),
      xAxisFontSize: 9,
    };
  }
  if (selectedDuration === 'this-year') {
    return { xAxisInterval: 0, xAxisTickCount: 12, xAxisFontSize: 9 };
  }
  return {
    xAxisInterval: 2,
    xAxisTickCount: Math.min(10, Math.ceil(dataPointCount / 3)),
    xAxisFontSize: 10,
  };
}

export function computeInstantOccupancyMetrics(processedChartData) {
  const limitedOccupancyValues = processedChartData.map((item) => item.occupancy);
  const nonNullValues = limitedOccupancyValues.filter((val) => val !== null && val !== undefined);
  const maxOccupancy =
    nonNullValues.length > 0 ? Math.max(...nonNullValues.map((val) => val), 1) : 1;
  return { nonNullValues, maxOccupancy };
}

export function buildInstantOccupancyXAxisTicks(
  processedChartData,
  selectedDuration,
  customDateRange = {}
) {
  if (selectedDuration === 'this-day') {
    const ticks = [];
    for (let hour = 0; hour < 24; hour++) ticks.push(hour * 60);
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

function pickNumeric(obj, keys) {
  if (!obj || typeof obj !== 'object') return null;
  for (const k of keys) {
    const v = obj[k];
    if (v != null && v !== '' && !Number.isNaN(Number(v))) return Number(v);
  }
  return null;
}

export function computeUtilizationSummaryFromApi(chartData) {
  if (!chartData || typeof chartData !== 'object') return { workingPct: null, entirePct: null };
  const roots = [chartData, chartData.summary, chartData.data, chartData.meta, chartData.metadata].filter(
    (o) => o && typeof o === 'object'
  );
  let workingPct = null;
  let entirePct = null;
  for (const o of roots) {
    if (workingPct == null) {
      workingPct = pickNumeric(o, [
        'working_hours_utilization',
        'working_hours_percent',
        'working_hours_avg',
        'avg_working_hours_utilization',
        'utilization_working_hours',
        'workingHoursUtilization',
        'average_working_hours_utilization',
      ]);
    }
    if (entirePct == null) {
      entirePct = pickNumeric(o, [
        'entire_day_utilization',
        'entire_day_percent',
        'entire_day_avg',
        'avg_entire_day_utilization',
        'utilization_entire_day',
        'entireDayUtilization',
        'average_entire_day_utilization',
      ]);
    }
  }
  return { workingPct, entirePct };
}

export function computeUtilizationSummaryFromSeries(processedChartData, selectedDuration) {
  const points = processedChartData.filter(
    (p) => p.occupancy != null && p.occupancy !== undefined && !Number.isNaN(Number(p.occupancy))
  );
  if (!points.length) return { workingPct: null, entirePct: null };
  const mean = (arr) => arr.reduce((s, p) => s + Number(p.occupancy), 0) / arr.length;

  if (selectedDuration === 'this-day') {
    const withMin = points.filter((p) => typeof p.timeMinutes === 'number');
    if (withMin.length) {
      const wh = withMin.filter(
        (p) => p.timeMinutes >= WORK_START_MIN && p.timeMinutes < WORK_END_MIN
      );
      return { workingPct: wh.length ? mean(wh) : null, entirePct: mean(points) };
    }
  }
  if (selectedDuration === 'this-week') {
    const wh = points.filter((p) => {
      const m = String(p.date || '').match(/^([A-Za-z]{3})\s+(\d+)$/);
      if (!m) return false;
      const hour = parseInt(m[2], 10);
      return hour >= 6 && hour <= 18;
    });
    if (wh.length && wh.length !== points.length) {
      return { workingPct: mean(wh), entirePct: mean(points) };
    }
  }
  return { workingPct: null, entirePct: mean(points) };
}

export function buildUtilizationFooterModel({
  chartData,
  processedChartData,
  selectedDuration,
  customDateRange,
  chartSurface = 'dark',
}) {
  const showPercentage = shouldShowSpaceOccupancyPercentage(selectedDuration, customDateRange);
  const fromApi = computeUtilizationSummaryFromApi(chartData);
  const fromSeries = computeUtilizationSummaryFromSeries(processedChartData, selectedDuration);
  const utilizationSummaryComputed = {
    workingPct: fromApi.workingPct ?? fromSeries.workingPct,
    entirePct: fromApi.entirePct ?? fromSeries.entirePct,
  };
  const hasFooterNumeric =
    (utilizationSummaryComputed.entirePct != null &&
      !Number.isNaN(Number(utilizationSummaryComputed.entirePct))) ||
    (utilizationSummaryComputed.workingPct != null &&
      !Number.isNaN(Number(utilizationSummaryComputed.workingPct)));
  const showThisDayFooter =
    selectedDuration === 'this-day' &&
    Array.isArray(processedChartData) &&
    processedChartData.length > 0;
  const showUtilizationFooter =
    utilizationSummaryComputed && (hasFooterNumeric || showThisDayFooter);
  if (!showUtilizationFooter) return null;

  const lightSurface = chartSurface === 'light';
  const footerMuted = lightSurface ? '#9ca3af' : '#cbd5e1';
  const footerStrong = lightSurface ? '#111827' : '#ffffff';
  const footerSuffix = showPercentage ? '%' : '';
  const formatFooterStat = (v) => {
    if (v == null || Number.isNaN(Number(v))) return '—';
    return `${Math.round(Number(v))}${footerSuffix}`;
  };
  const hideWorkingHoursFooter =
    selectedDuration === 'this-day' ||
    selectedDuration === 'this-week' ||
    selectedDuration === 'this-month' ||
    selectedDuration === 'this-year';
  const showWorkingHoursFooter =
    !hideWorkingHoursFooter &&
    utilizationSummaryComputed.workingPct != null &&
    !Number.isNaN(Number(utilizationSummaryComputed.workingPct));

  let utilizationFooterPeriodLabel = 'Period';
  if (selectedDuration === 'this-day') {
    utilizationFooterPeriodLabel = 'Entire day';
  } else if (
    selectedDuration === 'this-week' ||
    selectedDuration === 'this-month' ||
    selectedDuration === 'this-year'
  ) {
    utilizationFooterPeriodLabel = '';
  } else if (selectedDuration === 'custom' && customDateRange.startDate && customDateRange.endDate) {
    try {
      const start = new Date(customDateRange.startDate);
      const end = new Date(customDateRange.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (days <= 1) utilizationFooterPeriodLabel = 'Entire day';
      else if (days <= 31) utilizationFooterPeriodLabel = '';
      else utilizationFooterPeriodLabel = 'Period';
    } catch {
      utilizationFooterPeriodLabel = 'Period';
    }
  }

  return {
    selectedDuration,
    entirePct: utilizationSummaryComputed.entirePct,
    workingPct: utilizationSummaryComputed.workingPct,
    showWorkingHoursFooter,
    utilizationFooterPeriodLabel,
    footerMuted,
    footerStrong,
    formatFooterStat,
  };
}

export function formatInstantOccupancyTooltipLabel(tooltipLabel, { selectedDuration, currentDate }) {
  if (!tooltipLabel && tooltipLabel !== 0) return tooltipLabel;

  if (selectedDuration === 'this-day') {
    if (typeof tooltipLabel === 'number') {
      const hours = Math.floor(tooltipLabel / 60);
      const minutes = tooltipLabel % 60;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    if (typeof tooltipLabel === 'string') {
      const timeMatch = tooltipLabel.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
      if (timeMatch) {
        return `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
      }
    }
    return tooltipLabel;
  }

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
          if (diffDays > 180) candidate.setFullYear(candidate.getFullYear() - 1);
          else if (diffDays < -180) candidate.setFullYear(candidate.getFullYear() + 1);
          return candidate;
        })();
        const weekdayName = resolvedDate.toLocaleDateString('en-US', { weekday: 'short' });
        return hour ? `${weekdayName} ${hour}` : weekdayName;
      }
    }
  }

  return tooltipLabel;
}

export function buildInstantOccupancyChartDataset(instantOccupancyCount, options = {}) {
  const {
    selectedDuration,
    currentDate,
    customDateRange = {},
    chartSurface = 'dark',
    enableUtilizationFooter = false,
  } = options;

  const processedChartData = instantOccupancyToRecharts(instantOccupancyCount, {
    selectedDuration,
    currentDate,
  });
  const chartConfig = getInstantOccupancyChartConfig(processedChartData, selectedDuration);
  const { nonNullValues, maxOccupancy } = computeInstantOccupancyMetrics(processedChartData);
  const showPercentage = shouldShowSpaceOccupancyPercentage(selectedDuration, customDateRange);
  const xAxisTicks = buildInstantOccupancyXAxisTicks(
    processedChartData,
    selectedDuration,
    customDateRange
  );
  const footerModel =
    enableUtilizationFooter
      ? buildUtilizationFooterModel({
          chartData: instantOccupancyCount,
          processedChartData,
          selectedDuration,
          customDateRange,
          chartSurface,
        })
      : null;

  return {
    processedChartData,
    chartConfig,
    nonNullValues,
    maxOccupancy,
    showPercentage,
    xAxisTicks,
    footerModel,
  };
}

export function legacyInstantOccupancyPipeline(instantOccupancyCount, options = {}) {
  return buildInstantOccupancyChartDataset(instantOccupancyCount, options);
}

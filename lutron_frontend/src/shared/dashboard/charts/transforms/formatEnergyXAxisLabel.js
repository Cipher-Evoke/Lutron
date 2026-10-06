import { parseDateFromState } from '../../utils/dashboardDateState';
import { MONTH_NAME_TO_INDEX } from './chartTransformConstants';

/**
 * Energy line chart X-axis tick formatter.
 * Extracted from variant Dashboard.jsx EnergyLineChart.
 */
export function formatEnergyXAxisLabel(value, index, options = {}) {
  const { chartDataLength = 0, selectedDuration, currentDate, currentYear } = options;
  const chartData = { length: chartDataLength };

  if (!value) {
    return value;
  }

  const parseLabelToDate = (label) => {
    const baseDate = parseDateFromState(currentDate);
    let match = label.match(/^(\d{1,2})\/(\d{1,2})(?:\s+\d+)?$/);
    if (match) {
      const day = Number(match[1]);
      const monthIndex = Number(match[2]) - 1;
      if (monthIndex >= 0) {
        const candidate = new Date(baseDate.getFullYear(), monthIndex, day);
        const diffDays = (candidate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays > 180) {
          candidate.setFullYear(candidate.getFullYear() - 1);
        } else if (diffDays < -180) {
          candidate.setFullYear(candidate.getFullYear() + 1);
        }
        return candidate;
      }
    }

    match = label.match(/^([A-Za-z]{3})-([1-4])$/);
    if (match) {
      const monthIndex = MONTH_NAME_TO_INDEX[match[1]];
      if (monthIndex !== undefined) {
        return new Date(currentYear, monthIndex, 1);
      }
    }

    match = label.match(/^(\d{1,2})\/(\d{4})-([1-4])$/);
    if (match) {
      const monthIndex = Number(match[1]) - 1;
      const year = Number(match[2]);
      if (monthIndex >= 0) {
        return new Date(year, monthIndex, 1);
      }
    }

    return null;
  };

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

    const weekEnd = new Date(selectionStart);
    weekEnd.setDate(selectionStart.getDate() + 6);

    const labelDate = parseLabelToDate(value);
    if (labelDate && (labelDate < selectionStart || labelDate > weekEnd)) {
      return '';
    }

    if (isSelectedWeekCurrent && value.includes('/')) {
      if (labelDate) {
        return labelDate.toLocaleDateString('en-US', { weekday: 'short' });
      }
    }
  }

  const isCustomOrWeekOrYear = selectedDuration === 'custom' || selectedDuration === 'this-week' || selectedDuration === 'this-year';

  if (isCustomOrWeekOrYear) {
    const leadingDayMatch = value.match(/^([A-Za-z]{3})/);
    if (leadingDayMatch) {
      return leadingDayMatch[1];
    }

    const customDateMatch = value.match(/^(\d{1,2}\/\d{1,2})/);
    if (customDateMatch) {
      return customDateMatch[1];
    }
  }

  if (selectedDuration === 'this-day') {
    // For this-day, only show hourly labels (00:00, 01:00, ..., 23:00)
    // Hide 23:59 label but keep the data point visible in the graph
    if (value === '23:59') {
      return ''; // Hide 23:59 label - data point will still be rendered in graph
    }
    // Only show labels that are on the hour (minutes are 00)
    const timeMatch = value.match(/^(\d{2}):(\d{2})$/);
    if (timeMatch) {
      const minutes = parseInt(timeMatch[2], 10);
      // Show only hourly labels (00:00, 01:00, 02:00, ..., 23:00)
      // This ensures exactly 24 labels while all data points (including 23:59) are shown in graph
      if (minutes === 0) {
        return value;
      }
      return ''; // Hide non-hourly labels (15, 30, 45 minutes) - data points still rendered
    }
    return value;
  } else if (chartData.length === 28) {
    const dayHourMatch = value.match(/^(\w+)\s+(\d+)$/);
    if (dayHourMatch) {
      const dayName = dayHourMatch[1];
      return dayName;
    }
    const dateHourMatch = value.match(/^(\d+)\/(\d+)\s+(\d+)$/);
    if (dateHourMatch) {
      const dayNum = Number(dateHourMatch[1]);
      const monthNum = Number(dateHourMatch[2]);
      const hour = dateHourMatch[3];

      const baseDate = parseDateFromState(currentDate);
      const resolvedDate = (() => {
        const candidate = new Date(baseDate.getFullYear(), monthNum - 1, dayNum);
        const diffDays = (candidate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays > 15) {
          candidate.setFullYear(candidate.getFullYear() - 1);
        } else if (diffDays < -15) {
          candidate.setFullYear(candidate.getFullYear() + 1);
        }
        return candidate;
      })();

      const startOfWeek = new Date(baseDate);
      startOfWeek.setDate(baseDate.getDate() - baseDate.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const isCurrentWeekRange =
        selectedDuration === 'this-week' &&
        resolvedDate >= startOfWeek &&
        resolvedDate <= endOfWeek;

      if (isCurrentWeekRange) {
        const dayLabel = resolvedDate.toLocaleDateString('en-US', { weekday: 'short' });
        return dayLabel;
      }

      const fallbackLabel = `${dayNum}/${monthNum}`;
      return fallbackLabel;
    }
  } else if (value.includes('/') && value.includes('-')) {
    const quarterlyMatch = value.match(/^(\d+)\/(\d+)-(\d+)$/);
    if (quarterlyMatch) {
      const month = quarterlyMatch[1];
      const year = quarterlyMatch[2];
      const quarter = quarterlyMatch[3];
      return quarter === '1' ? `${month}/${year}` : '';
    }
  } else if (chartData.length === 48 || selectedDuration === 'this-year') {
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31);
    const labelDate = parseLabelToDate(value);
    if (labelDate && (labelDate < yearStart || labelDate > yearEnd)) {
      return '';
    }

    if (value.includes('-') && !value.includes('/')) {
      const yearMatch = value.match(/^(\w+)-(\d+)$/);
      if (yearMatch) {
        const monthName = yearMatch[1];
        const quarter = yearMatch[2];
        return quarter === '1' ? monthName : '';
      }
    }
    return value;
  }

  return value;
}

import { parseDateFromState } from '../../utils/dashboardDateState';
import { MONTH_NAME_TO_INDEX } from './chartTransformConstants';
import { parseDashboardTimeAxisToMinutes } from './parseDashboardTimeAxisToMinutes';

/** Space InstantOccupancyChartComponent X-axis formatter */
export function formatSpaceInstantOccupancyXAxisLabel(value, options = {}) {
  const {
    selectedDuration,
    currentDate,
    currentYear,
    customDateRange = { startDate: '', endDate: '' },
  } = options;

  if (!value) {
    return '';
  }

  // For this-day, show hourly labels (Recharts may pass ticks as numbers or numeric strings)
  if (selectedDuration === 'this-day') {
    let mins = null;
    if (typeof value === 'number' && !Number.isNaN(value)) {
      mins = Math.round(value);
    } else if (typeof value === 'string') {
      const t = value.trim();
      if (/^\d+$/.test(t)) mins = parseInt(t, 10);
      else mins = parseDashboardTimeAxisToMinutes(value);
    }
    if (mins != null && mins >= 0 && mins <= 24 * 60) {
      const hours = Math.floor(mins / 60);
      const minutes = mins % 60;
      if (minutes === 0 && hours >= 0 && hours < 24) {
        return `${hours.toString().padStart(2, '0')}:00`;
      }
    }
    return '';
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

    match = label && typeof label === 'string' ? label.match(/^([A-Za-z]{3})-([0-3])$/) : null;
    if (match) {
      const monthIndex = MONTH_NAME_TO_INDEX[match[1]];
      if (monthIndex !== undefined) {
        return new Date(currentYear, monthIndex, 1);
      }
    }

    match = label && typeof label === 'string' ? label.match(/^(\d{1,2})\/(\d{4})-([0-3])$/) : null;
    if (match) {
      const monthIndex = Number(match[1]) - 1;
      const year = Number(match[2]);
      if (monthIndex >= 0) {
        return new Date(year, monthIndex, 1);
      }
    }

    return null;
  };

  if (selectedDuration === 'this-day') {
    return value;
  }

  // Check if custom period is a week (7 days)
  let isCustomWeek = false;
  if (selectedDuration === 'custom' && customDateRange.startDate && customDateRange.endDate) {
    try {
      const startDate = new Date(customDateRange.startDate);
      const endDate = new Date(customDateRange.endDate);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      const diffTime = endDate.getTime() - startDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      // Consider 2-7 day periods as week periods (to show only 0th positions)
      isCustomWeek = diffDays >= 2 && diffDays <= 7;
    } catch (error) {
      isCustomWeek = false;
    }
  }

  if (selectedDuration === 'this-week' || isCustomWeek) {
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

    // If it's the current week and value contains a date, convert to weekday name
    if (isSelectedWeekCurrent && value.includes('/')) {
      if (labelDate) {
        return labelDate.toLocaleDateString('en-US', { weekday: 'short' });
      }
    }

    // For week periods (both this-week and custom week), only show labels for 0th positions (Sun 0, Mon 0, etc.)
    // This prevents duplicate labels like "Sat Sat Sat Sat" when navigating to previous weeks
    const dayHourMatch = value.match(/^([A-Za-z]{3})\s+(\d+)$/);
    if (dayHourMatch) {
      const timeSlot = parseInt(dayHourMatch[2]);
      // Only show label for 0th position
      if (timeSlot === 0) {
        return dayHourMatch[1];
      }
      return ''; // Hide labels for non-0th positions
    }

    // Fallback: if value doesn't match day+time format, try to extract day name
    const dayMatch = value.match(/^([A-Za-z]{3})/);
    if (dayMatch) {
      return dayMatch[1];
    }

    const dateHourMatch = value.match(/^(\d{1,2}\/\d{1,2})/);
    if (dateHourMatch) {
      return dateHourMatch[1];
    }

    return value.replace(/\s+\d+$/, '').replace(/-\d+$/, '');
  }

  if (selectedDuration === 'this-month') {
    const dateMatch = value.match(/^(\d{1,2}\/\d{1,2})$/);
    if (dateMatch) {
      return value;
    }

    const dateTimeMatch = value.match(/^(\d{1,2}\/\d{1,2})\s+\d+$/);
    if (dateTimeMatch) {
      return dateTimeMatch[1];
    }

    return value;
  }

  if (selectedDuration === 'this-year') {
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31);
    const labelDate = parseLabelToDate(value);
    if (labelDate && (labelDate < yearStart || labelDate > yearEnd)) {
      return '';
    }

    const valueStr = String(value || '');

    // Handle month-quarter format: "Jan-0", "Jan-1", "Jan-2", "Jan-3" - only show month name for quarter 0
    const monthQuarterMatch = valueStr.match(/^(\w+)-(\d+)$/);
    if (monthQuarterMatch) {
      const quarter = parseInt(monthQuarterMatch[2]);
      // Only show month name for the first quarter (0) of each month
      if (quarter === 0) {
        return monthQuarterMatch[1];
      }
      return ''; // Hide label for quarters 1, 2, 3
    }

    // Handle month/year-quarter format: "1/2025-0", "1/2025-1", etc. - only show month/year for quarter 0
    const monthYearMatch = valueStr.match(/^(\d{1,2}\/\d{4})-(\d+)$/);
    if (monthYearMatch) {
      const quarter = parseInt(monthYearMatch[2]);
      // Only show month/year for the first quarter (0) of each month
      if (quarter === 0) {
        return monthYearMatch[1];
      }
      return ''; // Hide label for quarters 1, 2, 3
    }

    return valueStr.replace(/\s+\d+$/, '').replace(/-\d+$/, '');
  }

  if (selectedDuration === 'custom') {
    const dayMatch = value.match(/^([A-Za-z]{3})/);
    if (dayMatch) {
      return dayMatch[1];
    }

    const dateMatch = value.match(/^(\d{1,2}\/\d{1,2})/);
    if (dateMatch) {
      return dateMatch[1];
    }

    // For custom periods, show all day number labels (11, 12, 13, 14, 15, 16, etc.)
    const dayOnlyMatch = value.match(/^(\d{1,2})$/);
    if (dayOnlyMatch) {
      return value;
    }

    return value.replace(/\s+\d+$/, '').replace(/-\d+$/, '');
  }

  return value;
}

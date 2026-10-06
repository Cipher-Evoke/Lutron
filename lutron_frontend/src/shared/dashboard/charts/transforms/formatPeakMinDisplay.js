import { parseDateFromState } from '../../utils/dashboardDateState';
import { formatPeakMinTimeLabel } from './formatPeakMinTimeLabel';

/**
 * Energy peak/min metric panel display text.
 */
export function formatPeakMinDisplay(entry, options = {}) {
  const { unit = '', selectedDuration, currentDate } = options;

  if (!entry || entry.value === null || entry.value === undefined || entry.value === '') {
    return { valueText: 'No data', timeText: '' };
  }

  const numericValue = Number(entry.value);
  const displayValue = Number.isFinite(numericValue)
    ? numericValue.toLocaleString(undefined, { maximumFractionDigits: 2 })
    : entry.value;

  const unitText = unit ? ` ${unit}` : '';
  const valueText = `${displayValue}${unitText}`;

  let timeLabel = '';
  if (entry.time !== undefined && entry.time !== null && entry.time !== '') {
    let formattedTime = entry.time;

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
      const dateTimeMatch = entry.time.match(/^(\d{1,2})\/(\d{1,2})(?:\s+(\d+))?$/);
      if (dateTimeMatch && isSelectedWeekCurrent) {
        formattedTime = formatPeakMinTimeLabel(entry.time, selectedDuration, currentDate);
      }
    }

    timeLabel = `at ${formattedTime}`;
  }

  return {
    valueText,
    timeText: timeLabel,
  };
}

import { parseDateFromState } from '../../utils/dashboardDateState';

/**
 * Format peak/min time label for week navigation (space + energy panels).
 */
export function formatPeakMinTimeLabel(timeString, selectedDuration, currentDate) {
  if (!timeString) {
    return timeString;
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
    const dateTimeMatch = timeString.match(/^(\d{1,2})\/(\d{1,2})(?:\s+(\d+))?$/);
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

  return timeString;
}

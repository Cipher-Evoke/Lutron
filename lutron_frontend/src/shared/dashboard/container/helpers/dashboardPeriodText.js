import { parseDateFromState } from '../../utils/dashboardDateState';

/**
 * Dashboard period label shown in date navigation chrome (legacy getCurrentPeriodText).
 */
export function getDashboardPeriodText({
  selectedDuration,
  currentDate,
  currentYear,
  customStartDate = null,
  customEndDate = null,
} = {}) {
  const currentDateObj = parseDateFromState(currentDate);

  if (selectedDuration === 'this-day') {
    return currentDateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  if (selectedDuration === 'this-week') {
    const startOfWeek = new Date(currentDateObj);
    startOfWeek.setDate(currentDateObj.getDate() - currentDateObj.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
      return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}-${endOfWeek.getDate()}, ${startOfWeek.getFullYear()}`;
    }

    return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${startOfWeek.getFullYear()}`;
  }

  if (selectedDuration === 'this-month') {
    return currentDateObj.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }

  if (selectedDuration === 'this-year') {
    return String(currentYear);
  }

  if (selectedDuration === 'custom' && customStartDate && customEndDate) {
    const startDate = new Date(customStartDate);
    const endDate = new Date(customEndDate);

    if (startDate.toDateString() === endDate.toDateString()) {
      return startDate.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }

    if (
      startDate.getMonth() === endDate.getMonth() &&
      startDate.getFullYear() === endDate.getFullYear()
    ) {
      return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}-${endDate.getDate()}, ${startDate.getFullYear()}`;
    }

    if (startDate.getFullYear() === endDate.getFullYear()) {
      return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${startDate.getFullYear()}`;
    }

    return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }

  return '';
}

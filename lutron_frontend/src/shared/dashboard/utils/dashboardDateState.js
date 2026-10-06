/**
 * Pure date helpers for dashboard filter state (YYYY-MM-DD in Redux).
 * Extracted from variant Dashboard.jsx — behavior unchanged.
 */

export function formatDateForState(dateInput) {
  if (!dateInput) {
    return '';
  }

  const date =
    dateInput instanceof Date
      ? new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate())
      : new Date(dateInput);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function parseDateFromState(value) {
  if (!value) {
    return new Date();
  }

  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    }

    const normalized = value.split('T')[0];
    const [year, month, day] = normalized.split('-').map(Number);
    if (year && month && day) {
      return new Date(year, month - 1, day);
    }
  }

  return new Date();
}

function formatYmd(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return { startDate: `${year}-${month}-${day}`, endDate: `${year}-${month}-${day}` };
}

/**
 * Primary date param calculator (Dashboard energy/space fetch batch).
 */
export function calculateDashboardDateParameters({
  selectedDuration,
  customDateRange,
  isNavigating,
  currentDate,
  currentYear,
  stableDate = new Date(),
}) {
  if (
    customDateRange?.startDate &&
    customDateRange?.endDate &&
    customDateRange.startDate.trim() !== '' &&
    customDateRange.endDate.trim() !== ''
  ) {
    return {
      timeRange: 'custom',
      startDate: customDateRange.startDate,
      endDate: customDateRange.endDate,
    };
  }

  if (isNavigating && customDateRange?.startDate && customDateRange?.endDate) {
    return {
      timeRange: 'custom',
      startDate: customDateRange.startDate,
      endDate: customDateRange.endDate,
    };
  }

  const targetDate = isNavigating ? parseDateFromState(currentDate) : stableDate;
  let startDate;
  let endDate;

  if (selectedDuration === 'this-day') {
    const ymd = formatYmd(targetDate);
    startDate = ymd.startDate;
    endDate = ymd.endDate;
  } else if (selectedDuration === 'this-week') {
    const startOfWeek = new Date(targetDate);
    startOfWeek.setDate(targetDate.getDate() - targetDate.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    startDate = formatYmd(startOfWeek).startDate;
    endDate = formatYmd(endOfWeek).endDate;
  } else if (selectedDuration === 'this-month') {
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    startDate = formatYmd(startOfMonth).startDate;
    endDate = formatYmd(endOfMonth).endDate;
  } else if (selectedDuration === 'this-year') {
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31);
    startDate = formatYmd(startOfYear).startDate;
    endDate = formatYmd(endOfYear).endDate;
  } else {
    const now = new Date();
    const ymd = formatYmd(now);
    startDate = ymd.startDate;
    endDate = ymd.endDate;
  }

  if (isNavigating || (customDateRange?.startDate && customDateRange?.endDate)) {
    return {
      timeRange: 'custom',
      startDate,
      endDate,
    };
  }

  return {
    timeRange: selectedDuration,
    startDate,
    endDate,
  };
}

/**
 * Tab-switch date params — uses currentDate for all duration buckets.
 */
export function calculateDashboardCurrentDateParameters({
  selectedDuration,
  customDateRange,
  isNavigating,
  currentDate,
}) {
  if (
    customDateRange?.startDate &&
    customDateRange?.endDate &&
    customDateRange.startDate.trim() !== '' &&
    customDateRange.endDate.trim() !== ''
  ) {
    return {
      timeRange: 'custom',
      startDate: customDateRange.startDate,
      endDate: customDateRange.endDate,
    };
  }

  if (isNavigating && customDateRange?.startDate && customDateRange?.endDate) {
    return {
      timeRange: 'custom',
      startDate: customDateRange.startDate,
      endDate: customDateRange.endDate,
    };
  }

  const targetDate = parseDateFromState(currentDate);
  let startDate;
  let endDate;

  if (selectedDuration === 'this-day') {
    const ymd = formatYmd(targetDate);
    startDate = ymd.startDate;
    endDate = ymd.endDate;
  } else if (selectedDuration === 'this-week') {
    const startOfWeek = new Date(targetDate);
    startOfWeek.setDate(targetDate.getDate() - targetDate.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    startDate = formatYmd(startOfWeek).startDate;
    endDate = formatYmd(endOfWeek).endDate;
  } else if (selectedDuration === 'this-month') {
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    startDate = formatYmd(startOfMonth).startDate;
    endDate = formatYmd(endOfMonth).endDate;
  } else if (selectedDuration === 'this-year') {
    const yr = targetDate.getFullYear();
    const startOfYear = new Date(yr, 0, 1);
    const endOfYear = new Date(yr, 11, 31);
    startDate = formatYmd(startOfYear).startDate;
    endDate = formatYmd(endOfYear).endDate;
  } else {
    const ymd = formatYmd(targetDate);
    startDate = ymd.startDate;
    endDate = ymd.endDate;
  }

  return {
    timeRange: selectedDuration,
    startDate,
    endDate,
  };
}

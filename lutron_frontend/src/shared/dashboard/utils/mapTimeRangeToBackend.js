/** Maps UI duration keys to backend `time_range` query values. */

export function mapTimeRangeToBackend(timeRange) {
  if (!timeRange) return 'this_day';
  if (timeRange === 'this-day') return 'this_day';
  if (timeRange === 'this-week') return 'this_week';
  if (timeRange === 'this-month') return 'this_month';
  if (timeRange === 'this-year') return 'this_year';
  return timeRange;
}

/** Savings-by-strategy endpoint does not support `this_year`; falls back to `this_month`. */
export function mapTimeRangeToBackendForSavings(timeRange) {
  if (!timeRange) return 'this_day';
  if (timeRange === 'this-day') return 'this_day';
  if (timeRange === 'this-week') return 'this_week';
  if (timeRange === 'this-month') return 'this_month';
  if (timeRange === 'this-year') return 'this_month';
  return timeRange;
}

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function formatAlertTime(timeStr) {
  if (!timeStr) return '';
  const parts = String(timeStr).split(/[\s-./]+/);
  if (parts.length >= 5) {
    const [d, m, y, h, min] = parts;
    const monthIndex = parseInt(m, 10) - 1;
    return `${MONTH_LABELS[monthIndex] || m} ${d}, ${y} ${h}:${min}`;
  }
  return timeStr;
}

export function resolveAlertsWidgetStatus({ loading = false } = {}) {
  if (loading) return 'loading';
  return 'ready';
}

export function resolveAlertsDisplayModel(alerts, { maxPreviewCount = 3 } = {}) {
  const topAlerts = (alerts?.top_5 || []).slice(0, maxPreviewCount);
  const total = Number(alerts?.total) || 0;
  const moreCount = Math.max(0, total - topAlerts.length);

  return {
    total,
    topAlerts,
    moreCount,
    isEmpty: topAlerts.length === 0,
  };
}

export function formatAlertRowSubtitle(alert) {
  const location = alert?.location || '';
  const timeLabel = formatAlertTime(alert?.time);
  if (location && timeLabel) return `${location} - ${timeLabel}`;
  return location || timeLabel || '';
}

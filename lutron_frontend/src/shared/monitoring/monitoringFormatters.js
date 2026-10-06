export function formatMonitoringTimestamp(value) {
  if (value == null || value === "") return "—";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString();
  } catch {
    return String(value);
  }
}

export function formatDurationMs(ms) {
  if (ms == null || ms === "") return "—";
  const n = Number(ms);
  if (!Number.isFinite(n)) return String(ms);
  if (n < 1000) return `${Math.round(n)} ms`;
  return `${(n / 1000).toFixed(2)} s`;
}

export function boolLabel(value) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "—";
}

/**
 * Minutes since midnight for this-day charts (API time strings, ISO, or Recharts ticks).
 * Extracted from variant SpaceUtilization.jsx.
 */
export function parseDashboardTimeAxisToMinutes(raw) {
  if (raw == null || raw === '') return null;
  if (typeof raw === 'number' && !Number.isNaN(raw)) {
    const n = raw;
    if (n >= 0 && n <= 24 * 60) return Math.round(n);
    if (n > 1e12) {
      const d = new Date(n);
      if (!Number.isNaN(d.getTime())) return d.getHours() * 60 + d.getMinutes();
    }
    return null;
  }
  const s = String(raw).trim();
  if (/^\d+$/.test(s)) {
    const v = parseInt(s, 10);
    if (v >= 0 && v <= 24 * 60) return v;
    return null;
  }
  const hm = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?/);
  if (hm) {
    const h = parseInt(hm[1], 10);
    const mm = parseInt(hm[2], 10);
    if (h >= 0 && h < 24 && mm >= 0 && mm < 60) return h * 60 + mm;
  }
  const normalized = s.includes('T') ? s : s.replace(/^(\d{4}-\d{2}-\d{2})\s+/, '$1T');
  const parsed = Date.parse(normalized);
  if (!Number.isNaN(parsed)) {
    const d = new Date(parsed);
    return d.getHours() * 60 + d.getMinutes();
  }
  return null;
}

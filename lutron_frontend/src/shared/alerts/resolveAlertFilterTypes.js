/**
 * Build the Alerts page "Alert Type" filter options.
 *
 * Options = types present on the current (already-deduped) alerts list
 * intersected with Settings-ON types from GET /alert/alerts_types.
 * Empty alerts → empty dropdown (Settings alone must not fill it).
 * Settings-OFF types never appear even if a stale row exists.
 */

export const CANONICAL_ALERT_FILTER_ORDER = [
  "Processor Not Responding",
  "Device Not Responding",
  "Ballast Failure",
  "Lamp Failure",
  "Other Warnings",
];

export function resolveAlertFilterTypes({ apiTypes = [], alerts = [] } = {}) {
  const fromApi = (Array.isArray(apiTypes) ? apiTypes : [])
    .map((t) => (t == null ? "" : String(t).trim()))
    .filter(Boolean);
  if (fromApi.length === 0) return [];

  const alertRows = Array.isArray(alerts) ? alerts : [];
  if (alertRows.length === 0) return [];

  const settingsOnLower = new Set(fromApi.map((t) => t.toLowerCase()));
  const presentLower = new Set();
  for (const row of alertRows) {
    const t = row?.alert_type == null ? "" : String(row.alert_type).trim();
    if (!t) continue;
    const lower = t.toLowerCase();
    if (settingsOnLower.has(lower)) presentLower.add(lower);
  }
  if (presentLower.size === 0) return [];

  const ordered = CANONICAL_ALERT_FILTER_ORDER.filter((t) =>
    presentLower.has(t.toLowerCase())
  );
  for (const t of fromApi) {
    if (presentLower.has(t.toLowerCase()) && !ordered.some((o) => o.toLowerCase() === t.toLowerCase())) {
      ordered.push(t);
    }
  }
  return ordered;
}

/** Map API/occupancy_setting to UI labels used by Area Settings: Disabled, Auto, Vacancy */
export function normalizeOccupancyModeString(raw) {
  if (raw == null) return '';
  const t = String(raw).trim();
  if (!t) return '';
  const low = t.toLowerCase();
  if (low === 'disabled' || low === 'disable') return 'Disabled';
  if (low === 'auto' || low === 'automatic' || low === 'automation') return 'Auto';
  if (low === 'vacancy' || low === 'vacant') return 'Vacancy';
  if (t === t.toUpperCase() && t.length) {
    if (t === 'AUTO') return 'Auto';
    if (t === 'VACANCY') return 'Vacancy';
    if (t === 'DISABLED') return 'Disabled';
  }
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

/** Map Area Settings UI labels to values expected by POST /occupancy/update_setting */
export function mapUiModeToApiMode(uiMode) {
  if (uiMode == null) return '';
  const n = normalizeOccupancyModeString(uiMode);
  if (!n) return '';
  if (n === 'Disabled') return 'Disabled';
  if (n === 'Auto') return 'Auto';
  if (n === 'Vacancy') return 'Vacancy';
  return String(uiMode).trim();
}

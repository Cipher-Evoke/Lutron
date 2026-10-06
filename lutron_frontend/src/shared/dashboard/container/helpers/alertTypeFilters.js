export const ALERT_TYPE_DROPDOWN_REFRESH_DELAY_MS = 100;

export function normalizeAlertTypeKey(type) {
  return String(type || '').trim();
}

export function normalizeAlertTypes(types) {
  if (!Array.isArray(types)) return [];
  return types.map(normalizeAlertTypeKey).filter(Boolean);
}

export function toggleAlertTypeSelection(selectedTypes, type) {
  const normalized = normalizeAlertTypeKey(type);
  if (!normalized) return Array.isArray(selectedTypes) ? [...selectedTypes] : [];

  const current = Array.isArray(selectedTypes) ? selectedTypes : [];
  return current.includes(normalized)
    ? current.filter((entry) => entry !== normalized)
    : [...current, normalized];
}

export function bumpAlertFilterKey(previousKey) {
  return (Number(previousKey) || 0) + 1;
}

/**
 * Legacy alert-type dropdown refresh sequence (close then reopen after delay).
 */
export function scheduleAlertTypeDropdownRefresh(setShowDropdown, delayMs = ALERT_TYPE_DROPDOWN_REFRESH_DELAY_MS) {
  setShowDropdown(false);
  window.setTimeout(() => {
    setShowDropdown(true);
  }, delayMs);
}

export function applyAlertTypeToggle({
  type,
  setSelectedAlertTypes,
  setFilterKey,
  setShowDropdown,
}) {
  setSelectedAlertTypes((prev) => toggleAlertTypeSelection(prev, type));
  setFilterKey((prev) => bumpAlertFilterKey(prev));
  scheduleAlertTypeDropdownRefresh(setShowDropdown);
}

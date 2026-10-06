/** Persists settings sidebar pill geometry across route remounts so tab changes animate. */
let lastPillState = null;

export function readSettingsSidebarPillState() {
  return lastPillState;
}

export function writeSettingsSidebarPillState({ top, left, width, height, activeLabel }) {
  if (!activeLabel || width <= 0 || height <= 0) return;
  lastPillState = { top, left, width, height, activeLabel };
}

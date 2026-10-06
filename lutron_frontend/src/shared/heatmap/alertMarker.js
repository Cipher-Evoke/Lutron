/**
 * Zoom-aware hit radius for heatmap alert markers.
 * Target stays roughly 24px on screen; bounded so it covers the triangle
 * and never swallows surrounding area polygon clicks.
 */

export const ALERT_MARKER_TARGET_SCREEN_PX = 24;

export function alertMarkerHitRadius(fontSize, scale) {
  const fs = Number(fontSize);
  const s = Number(scale);
  const safeFont = Number.isFinite(fs) && fs > 0 ? fs : 12;
  const safeScale = Number.isFinite(s) && s > 0 ? s : 1;

  const raw = ALERT_MARKER_TARGET_SCREEN_PX / safeScale;
  const minR = Math.max(safeFont * 0.9, 8);
  const maxR = Math.max(safeFont * 3.5, 36);
  return Math.min(maxR, Math.max(minR, raw));
}

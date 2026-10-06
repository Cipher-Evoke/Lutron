/** Pure pan/drag threshold helpers (no React) for click-vs-drag discrimination. */

export const DRAG_THRESHOLD_PX = 4;

/**
 * Returns whether a gesture starting at origin should become a drag at point.
 */
export function shouldStartDrag(origin, point, threshold = DRAG_THRESHOLD_PX) {
  if (!origin || !point) return false;
  const dx = point.x - origin.x;
  const dy = point.y - origin.y;
  return Math.hypot(dx, dy) >= threshold;
}

/**
 * FOFP layout viewer: click-to-select vs hold/threshold-to-drag.
 */

export const FOFP_DRAG_HOLD_MS = 220;
export const FOFP_DRAG_THRESHOLD_PX = 6;

/**
 * @param {number} distancePx - pointer travel since pointerdown
 * @param {boolean} holdElapsed - true after hold timer fired
 */
export const shouldActivateMarkerDrag = (distancePx, holdElapsed) =>
  Boolean(holdElapsed) || distancePx >= FOFP_DRAG_THRESHOLD_PX;

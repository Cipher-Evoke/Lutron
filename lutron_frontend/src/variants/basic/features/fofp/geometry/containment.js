/**
 * Area containment with bbox precheck and clamp-to-valid drag positions.
 */

import { getRingBounds, getRingsBounds, isPointInBounds } from "./bounds";
import { pointInPolygon } from "./pointInPolygon";

/** @typedef {{ x: number, y: number }} Point */
/** @typedef {Point[]} Ring */

const ringBoundsCache = new WeakMap();

/**
 * @param {Ring} ring
 */
export const getCachedRingBounds = (ring) => {
  if (!ring) return null;
  let cached = ringBoundsCache.get(ring);
  if (!cached) {
    cached = getRingBounds(ring);
    if (cached) ringBoundsCache.set(ring, cached);
  }
  return cached;
};

/**
 * Fast reject: point outside ring AABB cannot be inside ring.
 * @param {Point} point
 * @param {Ring} ring
 */
export const pointInPolygonFast = (point, ring) => {
  const bounds = getCachedRingBounds(ring);
  if (bounds && !isPointInBounds(point, bounds)) return false;
  return pointInPolygon(point, ring);
};

/**
 * @param {Point} point
 * @param {Ring[]} rings
 */
export const pointInAnyRing = (point, rings) => {
  if (!point || !Array.isArray(rings) || rings.length === 0) return false;
  const groupBounds = getRingsBounds(rings);
  if (groupBounds && !isPointInBounds(point, groupBounds)) return false;
  for (let i = 0; i < rings.length; i += 1) {
    if (pointInPolygonFast(point, rings[i])) return true;
  }
  return false;
};

/**
 * @param {Ring} ring
 * @returns {Point | null}
 */
export const getRingCentroid = (ring) => {
  if (!Array.isArray(ring) || ring.length === 0) return null;
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (const p of ring) {
    const x = Number(p?.x);
    const y = Number(p?.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    sx += x;
    sy += y;
    n += 1;
  }
  if (n === 0) return null;
  return { x: sx / n, y: sy / n };
};

/**
 * Clamp drag target to nearest in-area point (edge slide) via binary search
 * from last valid position toward cursor. Never returns an out-of-area point.
 *
 * @param {Point} target
 * @param {Ring[] | null | undefined} rings
 * @param {Point | null} [lastValid]
 * @returns {Point | null}
 */
export const clampPointToRings = (target, rings, lastValid = null) => {
  if (!target || !Array.isArray(rings) || rings.length === 0) return null;
  if (pointInAnyRing(target, rings)) return target;

  const anchor =
    lastValid && pointInAnyRing(lastValid, rings)
      ? lastValid
      : getRingCentroid(rings[0]);

  if (!anchor) return null;

  if (pointInAnyRing(anchor, rings)) {
    let lo = anchor;
    let hi = target;
    for (let i = 0; i < 14; i += 1) {
      const mid = { x: (lo.x + hi.x) / 2, y: (lo.y + hi.y) / 2 };
      if (pointInAnyRing(mid, rings)) lo = mid;
      else hi = mid;
    }
    return lo;
  }

  return anchor;
};

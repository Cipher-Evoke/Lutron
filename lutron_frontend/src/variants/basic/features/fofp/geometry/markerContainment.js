/**
 * FOFP marker outline containment against area polygon rings.
 * Used during resize, shape change, and save validation (not per-frame render).
 */

import { resolveFofpShape } from "../../../screens/heatmap/fofpMarkerShapes";
import {
  FOFP_GLOWING_DOT_HALO_SCALE,
  FOFP_MIN_MARKER_SIZE,
} from "../../../screens/heatmap/fofpMarkerShapes";
import { pointInAnyRing } from "./containment";

const ELLIPSE_SAMPLES = 32;
const BINARY_SEARCH_STEPS = 16;

/** @param {import('./rings').Ring[] | null | undefined} rings */
export const hasValidAreaRings = (rings) =>
  Array.isArray(rings) && rings.some((ring) => Array.isArray(ring) && ring.length >= 3);

const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** @param {number} cx @param {number} cy @param {number} rx @param {number} ry @param {number} n */
export const sampleEllipseBoundary = (cx, cy, rx, ry, n = ELLIPSE_SAMPLES) => {
  const pts = [];
  for (let i = 0; i < n; i += 1) {
    const a = (2 * Math.PI * i) / n;
    pts.push({
      x: cx + rx * Math.cos(a),
      y: cy + ry * Math.sin(a),
    });
  }
  return pts;
};

/**
 * Outline sample points for containment (matches FOFPMarkerShape geometry).
 * @returns {{ x: number, y: number }[]}
 */
export const getMarkerOutlinePoints = (shape, cx, cy, halfX, halfY) => {
  const x = toNum(cx);
  const y = toNum(cy);
  const rx = Math.max(FOFP_MIN_MARKER_SIZE, toNum(halfX) ?? FOFP_MIN_MARKER_SIZE);
  const ry = Math.max(FOFP_MIN_MARKER_SIZE, toNum(halfY) ?? rx);
  if (x == null || y == null) return [];

  const resolved = resolveFofpShape(shape);

  switch (resolved) {
    case "square":
      return [
        { x: x - rx, y: y - ry },
        { x: x + rx, y: y - ry },
        { x: x + rx, y: y + ry },
        { x: x - rx, y: y + ry },
      ];
    case "triangle":
      return [
        { x, y: y - ry },
        { x: x - rx, y: y + ry },
        { x: x + rx, y: y + ry },
      ];
    case "hexagon":
      return Array.from({ length: 6 }, (_, i) => {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        return { x: x + rx * Math.cos(angle), y: y + ry * Math.sin(angle) };
      });
    case "bulb": {
      const stemW = rx * 0.55;
      const stemH = ry * 0.85;
      const bulbCx = x;
      const bulbCy = y - ry * 0.35;
      const bulbRx = rx * 0.95;
      const bulbRy = ry * 0.95;
      const stemLeft = x - stemW / 2;
      const stemTop = y + ry * 0.15;
      const stemRight = x + stemW / 2;
      const stemBottom = stemTop + stemH;
      return [
        ...sampleEllipseBoundary(bulbCx, bulbCy, bulbRx, bulbRy, 24),
        { x: stemLeft, y: stemTop },
        { x: stemRight, y: stemTop },
        { x: stemRight, y: stemBottom },
        { x: stemLeft, y: stemBottom },
      ];
    }
    case "glowing_dot":
      return sampleEllipseBoundary(
        x,
        y,
        rx * FOFP_GLOWING_DOT_HALO_SCALE,
        ry * FOFP_GLOWING_DOT_HALO_SCALE,
        ELLIPSE_SAMPLES
      );
    case "circle":
    default:
      return sampleEllipseBoundary(x, y, rx, ry, ELLIPSE_SAMPLES);
  }
};

/**
 * @param {{ x: number, y: number }[]} points
 * @param {import('./rings').Ring[]} rings
 */
export const isMarkerContainedInRings = (points, rings) => {
  if (!Array.isArray(points) || points.length === 0) return false;
  if (!hasValidAreaRings(rings)) return false;
  for (let i = 0; i < points.length; i += 1) {
    if (!pointInAnyRing(points[i], rings)) return false;
  }
  return true;
};

export const isMarkerSizeContained = (
  shape,
  cx,
  cy,
  halfX,
  halfY,
  rings
) => {
  const pts = getMarkerOutlinePoints(shape, cx, cy, halfX, halfY);
  return isMarkerContainedInRings(pts, rings);
};

const lerpHalf = (from, to, t) => ({
  halfX: from.halfX + (to.halfX - from.halfX) * t,
  halfY: from.halfY + (to.halfY - from.halfY) * t,
});

/**
 * Binary-search from lastValid toward proposed; returns largest contained half-axes.
 */
export const clampHalfAxesToArea = ({
  shape,
  cx,
  cy,
  proposedHalfX,
  proposedHalfY,
  lastValidHalfX,
  lastValidHalfY,
  rings,
}) => {
  const hx = Math.max(FOFP_MIN_MARKER_SIZE, Math.round(Number(proposedHalfX)));
  const hy = Math.max(FOFP_MIN_MARKER_SIZE, Math.round(Number(proposedHalfY)));
  const last = {
    halfX: Math.max(FOFP_MIN_MARKER_SIZE, Math.round(Number(lastValidHalfX))),
    halfY: Math.max(FOFP_MIN_MARKER_SIZE, Math.round(Number(lastValidHalfY))),
  };
  const proposed = { halfX: hx, halfY: hy };

  if (!hasValidAreaRings(rings)) {
    return last;
  }

  if (
    isMarkerSizeContained(shape, cx, cy, proposed.halfX, proposed.halfY, rings)
  ) {
    return proposed;
  }

  if (
    !isMarkerSizeContained(shape, cx, cy, last.halfX, last.halfY, rings)
  ) {
    return findLargestContainedHalfAxes({
      shape,
      cx,
      cy,
      maxHalfX: last.halfX,
      maxHalfY: last.halfY,
      rings,
    });
  }

  let lo = 0;
  let hi = 1;
  let best = { ...last };

  for (let i = 0; i < BINARY_SEARCH_STEPS; i += 1) {
    const mid = (lo + hi) / 2;
    const candidate = lerpHalf(last, proposed, mid);
    const cxR = Math.max(FOFP_MIN_MARKER_SIZE, Math.round(candidate.halfX));
    const cyR = Math.max(FOFP_MIN_MARKER_SIZE, Math.round(candidate.halfY));
    if (isMarkerSizeContained(shape, cx, cy, cxR, cyR, rings)) {
      best = { halfX: cxR, halfY: cyR };
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return best;
};

/**
 * Largest half-axes in [MIN, maxHalf*] that fit ``shape`` inside ``rings``.
 * Used when shape changes or both endpoints fail resize clamp.
 */
export const findLargestContainedHalfAxes = ({
  shape,
  cx,
  cy,
  maxHalfX,
  maxHalfY,
  rings,
}) => {
  const min = {
    halfX: FOFP_MIN_MARKER_SIZE,
    halfY: FOFP_MIN_MARKER_SIZE,
  };
  const max = {
    halfX: Math.max(FOFP_MIN_MARKER_SIZE, Math.round(Number(maxHalfX))),
    halfY: Math.max(FOFP_MIN_MARKER_SIZE, Math.round(Number(maxHalfY))),
  };

  if (!hasValidAreaRings(rings)) {
    return min;
  }

  if (isMarkerSizeContained(shape, cx, cy, max.halfX, max.halfY, rings)) {
    return max;
  }

  if (!isMarkerSizeContained(shape, cx, cy, min.halfX, min.halfY, rings)) {
    return min;
  }

  let lo = 0;
  let hi = 1;
  let best = { ...min };

  for (let i = 0; i < BINARY_SEARCH_STEPS; i += 1) {
    const mid = (lo + hi) / 2;
    const candidate = lerpHalf(min, max, mid);
    const hx = Math.max(FOFP_MIN_MARKER_SIZE, Math.round(candidate.halfX));
    const hy = Math.max(FOFP_MIN_MARKER_SIZE, Math.round(candidate.halfY));
    if (isMarkerSizeContained(shape, cx, cy, hx, hy, rings)) {
      best = { halfX: hx, halfY: hy };
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return best;
};

/** Build size patch after shape change (shrink-to-fit when needed). */
export const clampMarkerSizeForShapeChange = ({
  shape,
  cx,
  cy,
  halfX,
  halfY,
  rings,
}) => {
  const hx = Math.max(FOFP_MIN_MARKER_SIZE, Math.round(Number(halfX)));
  const hy = Math.max(FOFP_MIN_MARKER_SIZE, Math.round(Number(halfY)));
  const fitted = findLargestContainedHalfAxes({
    shape,
    cx,
    cy,
    maxHalfX: hx,
    maxHalfY: hy,
    rings,
  });
  return {
    shape_size_x: fitted.halfX,
    shape_size_y: fitted.halfY,
    shape_size: Math.max(fitted.halfX, fitted.halfY),
  };
};

/**
 * Apply area clamp to a size patch using binary search from last valid half-axes.
 */
export const clampMarkerSizePatchToArea = ({
  shape,
  cx,
  cy,
  patch,
  lastValidHalfX,
  lastValidHalfY,
  rings,
}) => {
  const px = patch?.shape_size_x != null ? patch.shape_size_x : patch?.shape_size;
  const py = patch?.shape_size_y != null ? patch.shape_size_y : patch?.shape_size;
  const clamped = clampHalfAxesToArea({
    shape,
    cx,
    cy,
    proposedHalfX: px,
    proposedHalfY: py,
    lastValidHalfX,
    lastValidHalfY,
    rings,
  });
  return {
    shape_size_x: clamped.halfX,
    shape_size_y: clamped.halfY,
    shape_size: Math.max(clamped.halfX, clamped.halfY),
  };
};

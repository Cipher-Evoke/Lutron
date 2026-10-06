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

/** Mid-edge stretch handles lock one axis during area clamp. */
export const getStretchAxisLock = (handleId) => {
  if (handleId === "e" || handleId === "w") {
    return { lockHalfX: false, lockHalfY: true };
  }
  if (handleId === "n" || handleId === "s") {
    return { lockHalfX: true, lockHalfY: false };
  }
  return { lockHalfX: false, lockHalfY: false };
};

const applyAxisLock = (halfAxes, last, lock) => {
  const out = { ...halfAxes };
  if (lock.lockHalfX) out.halfX = last.halfX;
  if (lock.lockHalfY) out.halfY = last.halfY;
  return out;
};

const clampSingleAxisToArea = ({
  shape,
  cx,
  cy,
  axis,
  lastValue,
  proposedValue,
  fixedHalfX,
  fixedHalfY,
  rings,
}) => {
  const lastContained = isMarkerSizeContained(
    shape,
    cx,
    cy,
    fixedHalfX,
    fixedHalfY,
    rings
  );
  const proposed = Math.max(
    FOFP_MIN_MARKER_SIZE,
    Math.round(Number(proposedValue))
  );
  const last = Math.max(FOFP_MIN_MARKER_SIZE, Math.round(Number(lastValue)));

  if (!hasValidAreaRings(rings)) {
    return proposed;
  }

  const halfX = axis === "x" ? proposed : fixedHalfX;
  const halfY = axis === "y" ? proposed : fixedHalfY;

  if (isMarkerSizeContained(shape, cx, cy, halfX, halfY, rings)) {
    return proposed;
  }

  if (!lastContained) {
    const fitted = findLargestContainedHalfAxes({
      shape,
      cx,
      cy,
      maxHalfX: fixedHalfX,
      maxHalfY: fixedHalfY,
      rings,
    });
    return axis === "x" ? fitted.halfX : fitted.halfY;
  }

  let lo = 0;
  let hi = 1;
  let best = last;

  for (let i = 0; i < BINARY_SEARCH_STEPS; i += 1) {
    const mid = (lo + hi) / 2;
    const candidate = Math.max(
      FOFP_MIN_MARKER_SIZE,
      Math.round(last + (proposed - last) * mid)
    );
    const testHalfX = axis === "x" ? candidate : fixedHalfX;
    const testHalfY = axis === "y" ? candidate : fixedHalfY;
    if (isMarkerSizeContained(shape, cx, cy, testHalfX, testHalfY, rings)) {
      best = candidate;
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return best;
};

const buildSizePatchFromHalfAxes = (halfX, halfY, x = null, y = null) => {
  const patch = {
    shape_size_x: halfX,
    shape_size_y: halfY,
    shape_size: Math.max(halfX, halfY),
  };
  if (x != null && Number.isFinite(Number(x))) patch.x = Math.round(Number(x));
  if (y != null && Number.isFinite(Number(y))) patch.y = Math.round(Number(y));
  return patch;
};

const clampAnchoredAxisToArea = ({
  shape,
  axis,
  handleId,
  stretchAnchor,
  lastValue,
  proposedValue,
  fixedHalfX,
  fixedHalfY,
  fixedCenterX,
  fixedCenterY,
  rings,
}) => {
  const proposed = Math.max(
    FOFP_MIN_MARKER_SIZE,
    Math.round(Number(proposedValue))
  );
  const last = Math.max(FOFP_MIN_MARKER_SIZE, Math.round(Number(lastValue)));

  const centerForHalf = (halfX, halfY) => {
    if (handleId === "s") {
      return { cx: fixedCenterX, cy: stretchAnchor.top + halfY };
    }
    if (handleId === "n") {
      return { cx: fixedCenterX, cy: stretchAnchor.bottom - halfY };
    }
    if (handleId === "e") {
      return { cx: stretchAnchor.left + halfX, cy: fixedCenterY };
    }
    if (handleId === "w") {
      return { cx: stretchAnchor.right - halfX, cy: fixedCenterY };
    }
    return { cx: fixedCenterX, cy: fixedCenterY };
  };

  const testContainment = (halfX, halfY) => {
    const { cx, cy } = centerForHalf(halfX, halfY);
    return isMarkerSizeContained(shape, cx, cy, halfX, halfY, rings);
  };

  if (!hasValidAreaRings(rings)) {
    return proposed;
  }

  if (testContainment(
    axis === "x" ? proposed : fixedHalfX,
    axis === "y" ? proposed : fixedHalfY
  )) {
    return proposed;
  }

  if (!testContainment(fixedHalfX, fixedHalfY)) {
    const fitted = findLargestContainedHalfAxes({
      shape,
      cx: fixedCenterX,
      cy: fixedCenterY,
      maxHalfX: fixedHalfX,
      maxHalfY: fixedHalfY,
      rings,
    });
    return axis === "x" ? fitted.halfX : fitted.halfY;
  }

  let lo = 0;
  let hi = 1;
  let best = last;

  for (let i = 0; i < BINARY_SEARCH_STEPS; i += 1) {
    const mid = (lo + hi) / 2;
    const candidate = Math.max(
      FOFP_MIN_MARKER_SIZE,
      Math.round(last + (proposed - last) * mid)
    );
    const testHalfX = axis === "x" ? candidate : fixedHalfX;
    const testHalfY = axis === "y" ? candidate : fixedHalfY;
    if (testContainment(testHalfX, testHalfY)) {
      best = candidate;
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return best;
};

const clampAnchoredStretchPatch = ({
  shape,
  handleId,
  stretchAnchor,
  patch,
  lastValidHalfX,
  lastValidHalfY,
  lastValidX,
  lastValidY,
  rings,
}) => {
  const lastHalfX = Math.max(
    FOFP_MIN_MARKER_SIZE,
    Math.round(Number(lastValidHalfX))
  );
  const lastHalfY = Math.max(
    FOFP_MIN_MARKER_SIZE,
    Math.round(Number(lastValidHalfY))
  );
  const fixedX = Math.round(Number(lastValidX));
  const fixedY = Math.round(Number(lastValidY));
  const px = patch?.shape_size_x != null ? patch.shape_size_x : patch?.shape_size;
  const py = patch?.shape_size_y != null ? patch.shape_size_y : patch?.shape_size;

  if (handleId === "e" || handleId === "w") {
    const halfX = clampAnchoredAxisToArea({
      shape,
      axis: "x",
      handleId,
      stretchAnchor,
      lastValue: lastHalfX,
      proposedValue: px,
      fixedHalfX: lastHalfX,
      fixedHalfY: lastHalfY,
      fixedCenterX: fixedX,
      fixedCenterY: fixedY,
      rings,
    });
    const cx = handleId === "e"
      ? stretchAnchor.left + halfX
      : stretchAnchor.right - halfX;
    return buildSizePatchFromHalfAxes(halfX, lastHalfY, cx, fixedY);
  }

  const halfY = clampAnchoredAxisToArea({
    shape,
    axis: "y",
    handleId,
    stretchAnchor,
    lastValue: lastHalfY,
    proposedValue: py,
    fixedHalfX: lastHalfX,
    fixedHalfY: lastHalfY,
    fixedCenterX: fixedX,
    fixedCenterY: fixedY,
    rings,
  });
  const cy = handleId === "s"
    ? stretchAnchor.top + halfY
    : stretchAnchor.bottom - halfY;
  return buildSizePatchFromHalfAxes(lastHalfX, halfY, fixedX, cy);
};

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
  handleId = null,
}) => {
  const hx = Math.max(FOFP_MIN_MARKER_SIZE, Math.round(Number(proposedHalfX)));
  const hy = Math.max(FOFP_MIN_MARKER_SIZE, Math.round(Number(proposedHalfY)));
  const last = {
    halfX: Math.max(FOFP_MIN_MARKER_SIZE, Math.round(Number(lastValidHalfX))),
    halfY: Math.max(FOFP_MIN_MARKER_SIZE, Math.round(Number(lastValidHalfY))),
  };
  let proposed = { halfX: hx, halfY: hy };
  const axisLock = getStretchAxisLock(handleId);

  if (axisLock.lockHalfX || axisLock.lockHalfY) {
    proposed = applyAxisLock(proposed, last, axisLock);
    if (axisLock.lockHalfY && !axisLock.lockHalfX) {
      return {
        halfX: clampSingleAxisToArea({
          shape,
          cx,
          cy,
          axis: "x",
          lastValue: last.halfX,
          proposedValue: proposed.halfX,
          fixedHalfX: proposed.halfX,
          fixedHalfY: last.halfY,
          rings,
        }),
        halfY: last.halfY,
      };
    }
    if (axisLock.lockHalfX && !axisLock.lockHalfY) {
      return {
        halfX: last.halfX,
        halfY: clampSingleAxisToArea({
          shape,
          cx,
          cy,
          axis: "y",
          lastValue: last.halfY,
          proposedValue: proposed.halfY,
          fixedHalfX: last.halfX,
          fixedHalfY: proposed.halfY,
          rings,
        }),
      };
    }
  }

  if (!hasValidAreaRings(rings)) {
    return proposed;
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
  lastValidX,
  lastValidY,
  rings,
  handleId = null,
  stretchAnchor = null,
}) => {
  if (
    stretchAnchor &&
    (handleId === "n" ||
      handleId === "s" ||
      handleId === "e" ||
      handleId === "w")
  ) {
    return clampAnchoredStretchPatch({
      shape,
      handleId,
      stretchAnchor,
      patch,
      lastValidHalfX,
      lastValidHalfY,
      lastValidX: lastValidX ?? cx,
      lastValidY: lastValidY ?? cy,
      rings,
    });
  }

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
    handleId,
  });
  return {
    shape_size_x: clamped.halfX,
    shape_size_y: clamped.halfY,
    shape_size: Math.max(clamped.halfX, clamped.halfY),
  };
};

/**
 * Per-zone marker half-axes (horizontal / vertical) for FOFP stretch + resize.
 */

import {
  clampFofpMarkerSizeMin,
  FOFP_DEFAULT_MARKER_SIZE,
} from "./fofpMarkerShapes";

/** Resolve half-width, half-height, and legacy shape_size from position row. */
export const resolveFofpMarkerHalfAxes = (
  position,
  globalMarkerSize = FOFP_DEFAULT_MARKER_SIZE
) => {
  const base = clampFofpMarkerSizeMin(
    position?.shape_size != null ? position.shape_size : globalMarkerSize
  );
  const halfX = clampFofpMarkerSizeMin(
    position?.shape_size_x != null ? position.shape_size_x : base
  );
  const halfY = clampFofpMarkerSizeMin(
    position?.shape_size_y != null ? position.shape_size_y : base
  );
  return {
    halfX,
    halfY,
    shapeSize: Math.max(halfX, halfY),
  };
};

/** Patch object for onMarkerStyleChange after resize. */
export const buildMarkerSizePatch = (halfX, halfY) => {
  const hx = clampFofpMarkerSizeMin(halfX);
  const hy = clampFofpMarkerSizeMin(halfY);
  return {
    shape_size_x: hx,
    shape_size_y: hy,
    shape_size: Math.max(hx, hy),
  };
};

/** Size patch plus optional center move (edge-anchored stretch). */
export const buildMarkerResizePatch = (halfX, halfY, x = null, y = null) => {
  const patch = buildMarkerSizePatch(halfX, halfY);
  if (x != null && Number.isFinite(Number(x))) {
    patch.x = Math.round(Number(x));
  }
  if (y != null && Number.isFinite(Number(y))) {
    patch.y = Math.round(Number(y));
  }
  return patch;
};

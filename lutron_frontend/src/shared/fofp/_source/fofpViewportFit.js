/**
 * Calibrated floor viewport fit for FOFP layout viewer.
 * Extracted for unit tests and to skip fit when layout size is not ready.
 */

// Allow small scales so tall/wide floor plans can fully fit the viewer on load.
const MIN_ZOOM = 0.05;
const MAX_ZOOM = 5;

/** If area polygons only cover a small slice of the PDF, fit the full page instead. */
const PARTIAL_BOUNDS_AREA_RATIO = 0.4;

export const clampZoom = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return 1;
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Number(n.toFixed(2))));
};

const pageBounds = (dims) => ({
  xLeft: 0,
  xRight: dims.width,
  yTop: 0,
  yBottom: dims.height,
  width: dims.width,
  height: dims.height,
});

/**
 * Resolve the rectangle used for Fit / initial load.
 * Floors with only a subset of areas drawn (e.g. washroom strip on 2nd Floor)
 * must still fit the full PDF so the plan matches other floors.
 *
 * @param {object | null | undefined} bounds raw viewport/boundary values
 * @param {{ width: number, height: number }} dims PDF page dimensions
 * @returns {{ xLeft: number, xRight: number, yTop: number, yBottom: number, width: number, height: number }}
 */
export const resolveFitBounds = (bounds, dims) => {
  const page = pageBounds(dims);
  const raw = bounds || {};
  const xLeft = Number(raw.x_left ?? raw.xLeft);
  const xRight = Number(raw.x_right ?? raw.xRight);
  const yTop = Number(raw.y_top ?? raw.yTop);
  const yBottom = Number(raw.y_bottom ?? raw.yBottom);

  if (
    !(
      Number.isFinite(xLeft) &&
      Number.isFinite(xRight) &&
      Number.isFinite(yTop) &&
      Number.isFinite(yBottom) &&
      xRight > xLeft &&
      yBottom > yTop
    )
  ) {
    return page;
  }

  const width = xRight - xLeft;
  const height = yBottom - yTop;
  const pageArea = Math.max(1, page.width * page.height);
  const boundsArea = width * height;

  // Partial coordinate coverage (common when only some rooms are drawn).
  if (boundsArea < pageArea * PARTIAL_BOUNDS_AREA_RATIO) {
    return page;
  }

  return {
    xLeft,
    xRight,
    yTop,
    yBottom,
    width,
    height,
  };
};

/**
 * @returns {{ scale: number, x: number, y: number } | null}
 */
export const computeCalibratedTransform = (viewportW, viewportH, bounds) => {
  const w = Number(viewportW);
  const h = Number(viewportH);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
    return null;
  }

  const b = bounds || {};
  const width = Number(b.width);
  const height = Number(b.height);
  const xLeft = Number(b.xLeft);
  const yTop = Number(b.yTop);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }

  const scale = clampZoom(
    Math.min(1, (w - 48) / width, (h - 48) / height)
  );

  return {
    scale,
    x: (w - width * scale) / 2 - (Number.isFinite(xLeft) ? xLeft : 0) * scale,
    y: (h - height * scale) / 2 - (Number.isFinite(yTop) ? yTop : 0) * scale,
  };
};

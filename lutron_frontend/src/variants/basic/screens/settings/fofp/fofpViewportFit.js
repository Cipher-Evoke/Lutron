/**
 * Basic-only FOFP viewport fit.
 * Always fits the full PDF page into the viewer (ignores partial boundary
 * boxes that clip/offset Fit). Allows scale > 1 so plans fill the viewport.
 * Advanced/customized keep using shared/fofp/settings/fofpViewportFit.
 */

const MIN_ZOOM = 0.05;
const MAX_ZOOM = 5;
const FIT_PADDING_PX = 48;

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
 * Fit always uses the full page — boundary_values often cover only drawn
 * areas and produce a clipped, top-left “Fit” in the settings viewer.
 */
export const resolveFitBounds = (_bounds, dims) => pageBounds(dims);

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

  const pad = FIT_PADDING_PX;
  const availW = Math.max(1, w - pad);
  const availH = Math.max(1, h - pad);
  // Do not cap at 1 — Fit should fill the viewer (letterbox/pillarbox).
  const scale = clampZoom(Math.min(availW / width, availH / height));

  return {
    scale,
    x: (w - width * scale) / 2 - (Number.isFinite(xLeft) ? xLeft : 0) * scale,
    y: (h - height * scale) / 2 - (Number.isFinite(yTop) ? yTop : 0) * scale,
  };
};

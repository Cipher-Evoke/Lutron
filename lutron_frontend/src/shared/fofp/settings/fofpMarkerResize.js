import {
  clampFofpMarkerSizeMin,
  FOFP_MIN_MARKER_SIZE,
} from "../fofpMarkerShapes";
import {
  buildMarkerResizePatch,
  buildMarkerSizePatch,
} from "../fofpMarkerDimensions";
import { clampMarkerSizePatchToArea } from "../geometry/markerContainment";

/** Corner handles: uniform scale (preserve aspect). */
export const FOFP_CORNER_HANDLES = ["nw", "ne", "sw", "se"];

/** Mid-edge handles: stretch one axis. */
export const FOFP_STRETCH_HANDLES = ["n", "s", "e", "w"];

/** All resize chrome handles (8). */
export const FOFP_RESIZE_HANDLES = [...FOFP_CORNER_HANDLES, ...FOFP_STRETCH_HANDLES];

export const isCornerResizeHandle = (id) => FOFP_CORNER_HANDLES.includes(id);
export const isStretchResizeHandle = (id) => FOFP_STRETCH_HANDLES.includes(id);

/** Extra space between marker shape and dashed resize box (SVG units). */
export const RESIZE_CHROME_PADDING = 10;

const clampHalf = (v) => clampFofpMarkerSizeMin(v);

/**
 * Uniform resize from corner: scale both axes by the same factor (aspect preserved).
 */
export const markerUniformResizeFromCorner = (
  handleId,
  svgX,
  svgY,
  centerX,
  centerY,
  halfW,
  halfH
) => {
  const cx = Number(centerX);
  const cy = Number(centerY);
  const curW = clampHalf(halfW);
  const curH = clampHalf(halfH);
  let targetW = curW;
  let targetH = curH;

  switch (handleId) {
    case "nw":
      targetW = cx - Number(svgX);
      targetH = cy - Number(svgY);
      break;
    case "ne":
      targetW = Number(svgX) - cx;
      targetH = cy - Number(svgY);
      break;
    case "sw":
      targetW = cx - Number(svgX);
      targetH = Number(svgY) - cy;
      break;
    case "se":
    default:
      targetW = Number(svgX) - cx;
      targetH = Number(svgY) - cy;
      break;
  }

  targetW = clampHalf(Math.max(targetW, FOFP_MIN_MARKER_SIZE));
  targetH = clampHalf(Math.max(targetH, FOFP_MIN_MARKER_SIZE));

  const scaleW = targetW / curW;
  const scaleH = targetH / curH;
  const scale = Math.max(scaleW, scaleH, FOFP_MIN_MARKER_SIZE / curW);
  const nextW = clampHalf(curW * scale);
  const nextH = clampHalf(curH * scale);
  return buildMarkerSizePatch(nextW, nextH);
};

/** Fixed edge coordinates for edge-anchored stretch (from drag start). */
export const computeStretchAnchorEdges = (centerX, centerY, halfW, halfH) => {
  const cx = Number(centerX);
  const cy = Number(centerY);
  const hw = clampHalf(halfW);
  const hh = clampHalf(halfH);
  return {
    top: cy - hh,
    bottom: cy + hh,
    left: cx - hw,
    right: cx + hw,
  };
};

/**
 * Stretch one axis from mid-edge handle; opposite edge stays fixed on the floor plan.
 */
export const markerStretchFromEdge = (
  handleId,
  svgX,
  svgY,
  centerX,
  centerY,
  halfW,
  halfH,
  anchorEdges = null
) => {
  const cx = Number(centerX);
  const cy = Number(centerY);
  const curW = clampHalf(halfW);
  const curH = clampHalf(halfH);
  const anchor =
    anchorEdges ?? computeStretchAnchorEdges(cx, cy, curW, curH);

  let nextW = curW;
  let nextH = curH;
  let nextX = cx;
  let nextY = cy;

  switch (handleId) {
    case "s": {
      const span = Number(svgY) - anchor.top;
      nextH = clampHalf(Math.max(span / 2, FOFP_MIN_MARKER_SIZE));
      nextY = anchor.top + nextH;
      break;
    }
    case "n": {
      const span = anchor.bottom - Number(svgY);
      nextH = clampHalf(Math.max(span / 2, FOFP_MIN_MARKER_SIZE));
      nextY = anchor.bottom - nextH;
      break;
    }
    case "e": {
      const span = Number(svgX) - anchor.left;
      nextW = clampHalf(Math.max(span / 2, FOFP_MIN_MARKER_SIZE));
      nextX = anchor.left + nextW;
      break;
    }
    case "w": {
      const span = anchor.right - Number(svgX);
      nextW = clampHalf(Math.max(span / 2, FOFP_MIN_MARKER_SIZE));
      nextX = anchor.right - nextW;
      break;
    }
    default:
      break;
  }

  return buildMarkerResizePatch(nextW, nextH, nextX, nextY);
};

/**
 * Raw resize from handle (min size only; no area clamp).
 */
export const markerResizeFromHandleRaw = (
  handleId,
  svgX,
  svgY,
  centerX,
  centerY,
  halfW,
  halfH,
  stretchAnchor = null
) => {
  if (isCornerResizeHandle(handleId)) {
    return markerUniformResizeFromCorner(
      handleId,
      svgX,
      svgY,
      centerX,
      centerY,
      halfW,
      halfH
    );
  }
  if (isStretchResizeHandle(handleId)) {
    return markerStretchFromEdge(
      handleId,
      svgX,
      svgY,
      centerX,
      centerY,
      halfW,
      halfH,
      stretchAnchor
    );
  }
  return buildMarkerSizePatch(halfW, halfH);
};

/**
 * Resize from handle with polygon containment (binary-search clamp).
 */
export const markerResizeFromHandle = (
  handleId,
  svgX,
  svgY,
  centerX,
  centerY,
  halfW,
  halfH,
  {
    shape,
    rings,
    lastValidHalfX,
    lastValidHalfY,
    lastValidX,
    lastValidY,
    stretchAnchor = null,
  } = {}
) => {
  const rawPatch = markerResizeFromHandleRaw(
    handleId,
    svgX,
    svgY,
    centerX,
    centerY,
    halfW,
    halfH,
    stretchAnchor
  );
  return clampMarkerSizePatchToArea({
    shape,
    cx: centerX,
    cy: centerY,
    patch: rawPatch,
    lastValidHalfX,
    lastValidHalfY,
    lastValidX,
    lastValidY,
    rings,
    handleId,
    stretchAnchor,
  });
};

/** Padding around marker so handles sit outside the visible shape. */
export const getResizeChromePadding = (halfW, halfH) => {
  const ref = Math.max(Number(halfW) || 0, Number(halfH) || 0);
  return Math.max(RESIZE_CHROME_PADDING, ref * 0.35);
};

/** Axis-aligned bounds for resize chrome from half-axes. */
export const getMarkerResizeBounds = (centerX, centerY, halfW, halfH) => {
  const markerHalfW = clampHalf(halfW);
  const markerHalfH = clampHalf(halfH);
  const pad = getResizeChromePadding(markerHalfW, markerHalfH);
  const chromeHalfW = markerHalfW + pad;
  const chromeHalfH = markerHalfH + pad;
  const cx = Number(centerX);
  const cy = Number(centerY);
  return {
    x: cx - chromeHalfW,
    y: cy - chromeHalfH,
    width: chromeHalfW * 2,
    height: chromeHalfH * 2,
    cx,
    cy,
    markerHalfW,
    markerHalfH,
    chromeHalfW,
    chromeHalfH,
  };
};

/** Hit target size; mid-edge handles get a slightly larger target for easier grabs. */
export const getResizeHandleHitSize = (halfW, halfH, handleId = null) => {
  const ref = Math.max(Number(halfW) || 0, Number(halfH) || 0);
  const base = Math.max(6, Math.min(RESIZE_HANDLE_HIT_SIZE, ref + 4));
  if (handleId != null && isStretchResizeHandle(handleId)) {
    return Math.min(RESIZE_HANDLE_HIT_SIZE + 2, base + 2);
  }
  return base;
};

/** Cursor for handle id. */
export const getResizeHandleCursor = (handleId) => {
  if (handleId === "n" || handleId === "s") return "ns-resize";
  if (handleId === "e" || handleId === "w") return "ew-resize";
  if (handleId === "nw" || handleId === "se") return "nwse-resize";
  if (handleId === "ne" || handleId === "sw") return "nesw-resize";
  return "pointer";
};

/** Handle center positions in SVG coordinates. */
export const getResizeHandlePositions = (bounds) => {
  const { x, y, width, height } = bounds;
  const right = x + width;
  const bottom = y + height;
  const midX = x + width / 2;
  const midY = y + height / 2;
  return {
    nw: { x, y },
    ne: { x: right, y },
    sw: { x, y: bottom },
    se: { x: right, y: bottom },
    n: { x: midX, y },
    s: { x: midX, y: bottom },
    e: { x: right, y: midY },
    w: { x, y: midY },
  };
};

export const RESIZE_HANDLE_HIT_SIZE = 10;

/** Screen offset for context menu below-right of anchor point. */
export const CONTEXT_MENU_OFFSET_PX = 14;

export { FOFP_MIN_MARKER_SIZE };

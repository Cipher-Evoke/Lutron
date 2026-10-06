/**
 * Axis-aligned bounds for rings and viewport culling.
 */

/** @typedef {{ x: number, y: number }} Point */
/** @typedef {Point[]} Ring */

/**
 * @param {Ring} ring
 * @returns {{ minX: number, minY: number, maxX: number, maxY: number } | null}
 */
export const getRingBounds = (ring) => {
  if (!Array.isArray(ring) || ring.length < 3) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of ring) {
    const x = Number(p?.x);
    const y = Number(p?.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  if (!Number.isFinite(minX)) return null;
  return { minX, minY, maxX, maxY };
};

/**
 * @param {Ring[]} rings
 * @returns {{ minX: number, minY: number, maxX: number, maxY: number } | null}
 */
export const getRingsBounds = (rings) => {
  if (!Array.isArray(rings) || rings.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const ring of rings) {
    const b = getRingBounds(ring);
    if (!b) continue;
    minX = Math.min(minX, b.minX);
    minY = Math.min(minY, b.minY);
    maxX = Math.max(maxX, b.maxX);
    maxY = Math.max(maxY, b.maxY);
  }
  if (!Number.isFinite(minX)) return null;
  return { minX, minY, maxX, maxY };
};

/**
 * @param {Point} point
 * @param {{ minX: number, minY: number, maxX: number, maxY: number }} bounds
 * @param {number} [margin=0]
 */
export const isPointInBounds = (point, bounds, margin = 0) => {
  if (!point || !bounds) return false;
  const x = Number(point.x);
  const y = Number(point.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
  return (
    x >= bounds.minX - margin &&
    x <= bounds.maxX + margin &&
    y >= bounds.minY - margin &&
    y <= bounds.maxY + margin
  );
};

/**
 * Visible PDF/SVG rectangle from viewport pan/zoom.
 * @param {{ x: number, y: number, scale: number }} transform
 * @param {number} viewportWidth
 * @param {number} viewportHeight
 * @param {number} [margin=40]
 */
export const getVisibleContentBounds = (
  transform,
  viewportWidth,
  viewportHeight,
  margin = 40
) => {
  const scale = Number(transform?.scale) || 1;
  if (scale <= 0 || viewportWidth <= 0 || viewportHeight <= 0) return null;
  const x = Number(transform?.x) || 0;
  const y = Number(transform?.y) || 0;
  return {
    minX: (-x - margin) / scale,
    minY: (-y - margin) / scale,
    maxX: (viewportWidth - x + margin) / scale,
    maxY: (viewportHeight - y + margin) / scale,
  };
};

/**
 * @param {{ x: number, y: number }} marker
 * @param {{ minX: number, minY: number, maxX: number, maxY: number }} viewBounds
 * @param {number} markerRadius
 */
export const isMarkerVisibleInBounds = (marker, viewBounds, markerRadius = 8) => {
  if (!marker || !viewBounds) return true;
  const x = Number(marker.x);
  const y = Number(marker.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
  const r = Number(markerRadius) || 8;
  return !(
    x + r < viewBounds.minX ||
    x - r > viewBounds.maxX ||
    y + r < viewBounds.minY ||
    y - r > viewBounds.maxY
  );
};

/**
 * Helpers for floorplan area coordinates with multi-polygon (rings) support.
 */

/** Normalize coordinates to array of rings for multi-polygon support. */
export function getPolygonRings(area) {
  const c = area?.coordinates || area?.['co-ordinates'] || [];
  if (!c?.length) return [];
  const first = c[0];
  if (Array.isArray(first) && first[0] && typeof first[0]?.x === 'number') {
    return c.filter(ring => ring && ring.length >= 3);
  }
  const flat = c.filter(pt => pt && typeof pt.x === 'number' && typeof pt.y === 'number');
  return flat.length >= 3 ? [flat] : [];
}

/** Flatten area coordinates to a single array for bbox/content calculations. */
export function flattenAreaCoords(area) {
  const c = area?.coordinates || area?.['co-ordinates'] || [];
  if (!c?.length) return [];
  const first = c[0];
  if (Array.isArray(first) && first[0] && typeof first[0]?.x === 'number') {
    return c.flat();
  }
  return Array.isArray(c) ? c : [];
}

/** Axis-aligned bounding box for a list of {x, y} points. */
export function getPolygonBoundingBox(coords) {
  if (!coords || !coords.length) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }
  const xs = coords.map((pt) => pt.x);
  const ys = coords.map((pt) => pt.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}


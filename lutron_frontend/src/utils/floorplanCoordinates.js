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


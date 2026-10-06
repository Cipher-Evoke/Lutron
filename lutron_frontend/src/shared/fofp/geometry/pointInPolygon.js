/**
 * Point-in-polygon (ray casting) with edge inclusion.
 */

/** @typedef {{ x: number, y: number }} Point */
/** @typedef {Point[]} Ring */

const isPointOnSegment = (point, a, b) => {
  const cross = (point.y - a.y) * (b.x - a.x) - (point.x - a.x) * (b.y - a.y);
  if (Math.abs(cross) > 1e-7) return false;
  const dot = (point.x - a.x) * (b.x - a.x) + (point.y - a.y) * (b.y - a.y);
  if (dot < 0) return false;
  const lenSq = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  return dot <= lenSq;
};

/**
 * @param {Point} point
 * @param {Ring} polygon
 */
export const pointInPolygon = (point, polygon) => {
  if (!point || !Array.isArray(polygon) || polygon.length < 3) return false;

  let inside = false;
  let j = polygon.length - 1;
  for (let i = 0; i < polygon.length; i += 1) {
    const pi = polygon[i];
    const pj = polygon[j];
    if (!pi || !pj) return false;
    if (isPointOnSegment(point, pi, pj)) return true;
    if ((pi.y > point.y) !== (pj.y > point.y)) {
      const xIntersect =
        ((pj.x - pi.x) * (point.y - pi.y)) / (pj.y - pi.y) + pi.x;
      if (point.x < xIntersect) inside = !inside;
    }
    j = i;
  }
  return inside;
};

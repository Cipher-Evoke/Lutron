/**
 * Label anchor + local fit box for heatmap area names.
 *
 * Handles:
 * - Normal rooms: center of the filled region
 * - Thin strips (WS SHADES): label sits in the strip, sized to strip thickness
 * - C / L shapes (RECEPTION AREA): label sits in the thick open body — NOT at the
 *   bbox/notch midpoint (axis-aligned ray spans can "see" through connected arms
 *   and their midpoint falls on the cutout edge).
 */

function ringArea(coords) {
  if (!coords || coords.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < coords.length; i += 1) {
    const j = (i + 1) % coords.length;
    area += coords[i].x * coords[j].y - coords[j].x * coords[i].y;
  }
  return area / 2;
}

function bboxOf(coords) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of coords) {
    const x = Number(p?.x);
    const y = Number(p?.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  if (!Number.isFinite(minX)) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

function bboxCenter(coords) {
  const b = bboxOf(coords);
  return {
    x: (b.minX + b.maxX) / 2,
    y: (b.minY + b.maxY) / 2,
    fitWidth: Math.max(0, b.width),
    fitHeight: Math.max(0, b.height),
  };
}

function pointInRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const xi = ring[i].x;
    const yi = ring[i].y;
    const xj = ring[j].x;
    const yj = ring[j].y;
    const intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi + 0.0) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 <= 1e-12) {
    const ex = px - ax;
    const ey = py - ay;
    return Math.sqrt(ex * ex + ey * ey);
  }
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const qx = ax + t * dx;
  const qy = ay + t * dy;
  const ex = px - qx;
  const ey = py - qy;
  return Math.sqrt(ex * ex + ey * ey);
}

function minDistToRing(x, y, ring) {
  let min = Infinity;
  for (let i = 0; i < ring.length; i += 1) {
    const j = (i + 1) % ring.length;
    const d = distToSegment(x, y, ring[i].x, ring[i].y, ring[j].x, ring[j].y);
    if (d < min) min = d;
  }
  return min;
}

/**
 * Probe how far we can travel from (x,y) along axis while staying inside.
 * Used only for fit sizing — NOT for recentering (that broke C-shapes).
 */
function localSpanSize(x, y, ring, bbox) {
  const maxStep = Math.max(bbox.width, bbox.height, 1);
  const step = Math.max(0.5, Math.min(8, maxStep / 80));

  let left = x;
  let right = x;
  let top = y;
  let bottom = y;

  while (left - step >= bbox.minX - step && pointInRing(left - step, y, ring)) {
    left -= step;
  }
  while (right + step <= bbox.maxX + step && pointInRing(right + step, y, ring)) {
    right += step;
  }
  while (top - step >= bbox.minY - step && pointInRing(x, top - step, ring)) {
    top -= step;
  }
  while (bottom + step <= bbox.maxY + step && pointInRing(x, bottom + step, ring)) {
    bottom += step;
  }

  return {
    fitWidth: Math.max(0, right - left),
    fitHeight: Math.max(0, bottom - top),
  };
}

/**
 * Place label in the thickest filled region (clearance), using the centroid of
 * near-max-clearance samples so C/L shapes land in the open body — not the notch.
 */
function visualPlacement(ring) {
  if (!ring || ring.length < 3) return null;
  const b = bboxOf(ring);
  if (b.width <= 0 || b.height <= 0) return null;

  const stepsX = Math.max(10, Math.min(48, Math.ceil(b.width / 35)));
  const stepsY = Math.max(10, Math.min(48, Math.ceil(b.height / 35)));

  const samples = [];
  let maxClearance = -1;

  for (let iy = 0; iy <= stepsY; iy += 1) {
    const y = b.minY + (b.height * iy) / stepsY;
    for (let ix = 0; ix <= stepsX; ix += 1) {
      const x = b.minX + (b.width * ix) / stepsX;
      if (!pointInRing(x, y, ring)) continue;
      const clearance = minDistToRing(x, y, ring);
      samples.push({ x, y, clearance });
      if (clearance > maxClearance) maxClearance = clearance;
    }
  }

  if (!samples.length || maxClearance <= 0) return null;

  // Thick region = near the pole of inaccessibility.
  const thick = samples.filter((s) => s.clearance >= maxClearance * 0.82);
  let sx = 0;
  let sy = 0;
  for (const s of thick) {
    sx += s.x;
    sy += s.y;
  }
  sx /= thick.length;
  sy /= thick.length;

  // Average can fall slightly outside on weird shapes — snap to nearest thick sample.
  let best = thick[0];
  let bestDist = Infinity;
  for (const s of thick) {
    const dx = s.x - sx;
    const dy = s.y - sy;
    const d = dx * dx + dy * dy;
    if (d < bestDist) {
      bestDist = d;
      best = s;
    }
  }

  // Prefer the actual max-clearance sample if the average snapped far away.
  const pole = samples.reduce((a, s) => (s.clearance > a.clearance ? s : a), samples[0]);
  const use = best.clearance >= maxClearance * 0.82 ? best : pole;

  const span = localSpanSize(use.x, use.y, ring, b);
  // Clamp fit box to local thickness so thin strips don't inherit huge L/C bboxes.
  const fitHeight = Math.min(span.fitHeight, Math.max(8, use.clearance * 2.4));
  const fitWidth = Math.min(
    span.fitWidth,
    Math.max(fitHeight * 3, use.clearance * 8, span.fitWidth * 0.35)
  );

  return {
    x: use.x,
    y: use.y,
    fitWidth: Math.max(8, fitWidth),
    fitHeight: Math.max(8, fitHeight),
    clearance: use.clearance,
  };
}

function ringCentroid(coords) {
  if (!coords || coords.length < 3) return null;
  const area = ringArea(coords);
  if (!Number.isFinite(area) || Math.abs(area) < 1e-6) return null;

  let cx = 0;
  let cy = 0;
  for (let i = 0; i < coords.length; i += 1) {
    const j = (i + 1) % coords.length;
    const cross = coords[i].x * coords[j].y - coords[j].x * coords[i].y;
    cx += (coords[i].x + coords[j].x) * cross;
    cy += (coords[i].y + coords[j].y) * cross;
  }
  const factor = 1 / (6 * area);
  const x = cx * factor;
  const y = cy * factor;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x, y };
}

function placementForRing(ring) {
  const visual = visualPlacement(ring);
  if (visual && visual.fitWidth > 0 && visual.fitHeight > 0) {
    return {
      x: visual.x,
      y: visual.y,
      fitWidth: visual.fitWidth,
      fitHeight: visual.fitHeight,
    };
  }

  const b = bboxOf(ring);
  const centroid = ringCentroid(ring);
  if (centroid && pointInRing(centroid.x, centroid.y, ring)) {
    const span = localSpanSize(centroid.x, centroid.y, ring, b);
    const clearance = minDistToRing(centroid.x, centroid.y, ring);
    return {
      x: centroid.x,
      y: centroid.y,
      fitWidth: Math.min(span.fitWidth || b.width, Math.max(b.width * 0.5, clearance * 8)),
      fitHeight: Math.min(span.fitHeight || b.height, Math.max(8, clearance * 2.4)),
    };
  }

  return bboxCenter(ring);
}

/**
 * Full placement: center + local fit size for font sizing.
 * @returns {{x:number,y:number,fitWidth:number,fitHeight:number}}
 */
export function getHeatmapAreaLabelPlacement(coords, rings) {
  if (Array.isArray(rings) && rings.length) {
    let bestRing = null;
    let bestAbsArea = -1;
    for (const ring of rings) {
      if (!ring || ring.length < 2) continue;
      const absArea = Math.abs(ringArea(ring));
      const score = absArea > 1e-6 ? absArea : ring.length;
      if (score >= bestAbsArea) {
        bestAbsArea = score;
        bestRing = ring;
      }
    }
    if (bestRing && bestRing.length >= 3) return placementForRing(bestRing);
    if (bestRing) return bboxCenter(bestRing);
  }

  const list = Array.isArray(coords) ? coords : [];
  if (list.length >= 3) return placementForRing(list);
  return bboxCenter(list);
}

/**
 * @returns {{x:number,y:number}}
 */
export function getHeatmapAreaLabelCenter(coords, rings) {
  const p = getHeatmapAreaLabelPlacement(coords, rings);
  return { x: p.x, y: p.y };
}

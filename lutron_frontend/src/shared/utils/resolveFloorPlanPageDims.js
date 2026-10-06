/**
 * Resolve PDF overlay size so area polygons line up with the visible floor plan.
 *
 * react-pdf `originalWidth` / `originalHeight` are the unrotated MediaBox.
 * PDFs with /Rotate 90|270 are shown landscape while MediaBox stays portrait
 * (or the reverse). Coordinate CSVs are usually captured against the *visible*
 * page, so the SVG overlay must use that size.
 *
 * When area coordinates are available, pick MediaBox vs rotated viewport by
 * which box better contains the coordinate extents (keeps unrotated floors
 * unchanged).
 */

export function getAreasCoordinateExtent(areas = []) {
  let maxX = -Infinity;
  let maxY = -Infinity;
  let minX = Infinity;
  let minY = Infinity;
  let count = 0;

  for (const area of areas || []) {
    const coords = area?.coordinates || area?.['co-ordinates'] || [];
    if (!Array.isArray(coords) || !coords.length) continue;

    const first = coords[0];
    const points =
      Array.isArray(first) && first[0] && typeof first[0]?.x === 'number'
        ? coords.flat()
        : coords;

    for (const pt of points) {
      if (!pt || typeof pt.x !== 'number' || typeof pt.y !== 'number') continue;
      if (!Number.isFinite(pt.x) || !Number.isFinite(pt.y)) continue;
      count += 1;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y > maxY) maxY = pt.y;
      if (pt.x < minX) minX = pt.x;
      if (pt.y < minY) minY = pt.y;
    }
  }

  if (!count || !Number.isFinite(maxX) || !Number.isFinite(maxY)) return null;
  return { minX, minY, maxX, maxY, count };
}

/** How well coordinate extents fit inside a candidate page box (higher is better). */
export function scorePageDimsFit(extent, width, height) {
  if (!extent || !(width > 0) || !(height > 0)) return -Infinity;

  const { maxX, maxY } = extent;
  // Prefer boxes that contain the points with modest margin (not wildly larger).
  const containX = maxX <= width * 1.08;
  const containY = maxY <= height * 1.08;
  if (!containX || !containY) {
    // Still score by relative overflow — smaller overflow wins.
    const overflow =
      Math.max(0, maxX / width - 1) + Math.max(0, maxY / height - 1);
    return -1000 - overflow * 100;
  }

  const fillX = maxX / width;
  const fillY = maxY / height;
  // Prefer similar fill on both axes and fill not tiny (avoids picking a huge box).
  const balance = 1 - Math.abs(fillX - fillY);
  const fill = Math.min(fillX, fillY);
  return balance * 2 + fill;
}

/**
 * @param {{ originalWidth?: number, originalHeight?: number, width?: number, height?: number, rotate?: number }} page
 * @param {Array} [areas]
 * @returns {{ width: number, height: number, rotate: number, source: 'media'|'rotated'|'page' }}
 */
export function resolveFloorPlanPageDims(page, areas = []) {
  const ow = Number(page?.originalWidth);
  const oh = Number(page?.originalHeight);
  const rotate = ((Number(page?.rotate) || 0) % 360 + 360) % 360;

  const mediaW = Number.isFinite(ow) && ow > 0 ? ow : Number(page?.width);
  const mediaH = Number.isFinite(oh) && oh > 0 ? oh : Number(page?.height);

  if (!Number.isFinite(mediaW) || !Number.isFinite(mediaH) || mediaW <= 0 || mediaH <= 0) {
    return { width: 794, height: 1123, rotate, source: 'media' };
  }

  const swapped = rotate === 90 || rotate === 270;
  const media = { width: mediaW, height: mediaH, rotate, source: 'media' };
  const rotated = swapped
    ? { width: mediaH, height: mediaW, rotate, source: 'rotated' }
    : media;

  const extent = getAreasCoordinateExtent(areas);
  if (!extent) {
    // No coords yet — prefer what the user sees (rotated viewport when applicable).
    return rotated;
  }

  if (!swapped) {
    return media;
  }

  const mediaScore = scorePageDimsFit(extent, media.width, media.height);
  const rotatedScore = scorePageDimsFit(extent, rotated.width, rotated.height);

  return rotatedScore >= mediaScore ? rotated : media;
}

export function pageDimsEqual(a, b) {
  if (!a || !b) return false;
  return (
    Number(a.width) === Number(b.width) &&
    Number(a.height) === Number(b.height)
  );
}

/**
 * Heatmap area-name labels for customized / basic / advanced.
 *
 * Split + abbreviate only. Do not wire fitHeatmapAreaLabel or
 * getHeatmapAreaLabelPlacement back into HeatMaps.
 */

function normalizeLabelName(text) {
  return String(text || "")
    .trim()
    .toUpperCase();
}

function charLimits(areaSize) {
  const size = Number(areaSize);
  if (Number.isFinite(size) && size < 40) return { line1: 12, line2: 10 };
  if (Number.isFinite(size) && size < 80) return { line1: 18, line2: 15 };
  return { line1: 30, line2: 20 };
}

function clipLine(text, max) {
  const s = String(text || "");
  if (!s) return "";
  return s.length <= max ? s : s.slice(0, max);
}

/**
 * Split an area display name into 1–2 uppercase lines.
 * Uses area.name text only — never area.code.
 *
 * @param {string} text
 * @param {number} [areaSize]
 * @returns {string[]}
 */
export function createTwoLineLabel(text, areaSize) {
  const upper = normalizeLabelName(text);
  if (!upper) return [];

  const { line1: mainLimit, line2: secondLimit } = charLimits(areaSize);

  const osMatch = upper.match(/\bOS[-\s]?[\w\-/]+/);
  if (osMatch) {
    const osToken = osMatch[0].replace(/\s+/g, "-");
    const before = upper.slice(0, osMatch.index).trim();
    if (!before) {
      return [clipLine(osToken, mainLimit)].filter(Boolean);
    }
    return [clipLine(before, mainLimit), clipLine(osToken, secondLimit)].filter(
      Boolean
    );
  }

  const space = upper.indexOf(" ");
  if (space > 0) {
    return [
      clipLine(upper.slice(0, space), mainLimit),
      clipLine(upper.slice(space + 1).trim(), secondLimit),
    ].filter(Boolean);
  }

  return [clipLine(upper, mainLimit)];
}

function medianOfSorted(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  if (!n) return 0;
  if (n % 2 === 1) return sorted[(n - 1) / 2];
  return (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
}

function isPbOs24Name(name) {
  return String(name || "").trim().toUpperCase() === "PB OS-24";
}

/**
 * Label anchor: average of polygon vertices.
 * basic/advanced pass { usePbOs24Fix: true } so "PB OS-24" uses
 * the median of sorted coords (narrow strip).
 *
 * @param {Array<{x:number,y:number}>} coords
 * @param {string} name
 * @param {{ usePbOs24Fix?: boolean }} [options]
 * @returns {{x:number,y:number}}
 */
export function getHeatmapPolygonLabelCenter(coords, name, options = {}) {
  const vertices = (Array.isArray(coords) ? coords : []).filter(
    (p) => Number.isFinite(p?.x) && Number.isFinite(p?.y)
  );
  if (!vertices.length) return { x: 0, y: 0 };

  if (options.usePbOs24Fix && isPbOs24Name(name)) {
    return {
      x: medianOfSorted(vertices.map((p) => p.x)),
      y: medianOfSorted(vertices.map((p) => p.y)),
    };
  }

  let sx = 0;
  let sy = 0;
  for (const p of vertices) {
    sx += p.x;
    sy += p.y;
  }
  return {
    x: sx / vertices.length,
    y: sy / vertices.length,
  };
}

/**
 * Font in SVG units from PDF-normalized base (6–9). Smaller rooms drop 2–3px
 * (min 5). Not divided by fitScale and not tied to live zoom — zoom only
 * unhides tiny rooms (areaSize < 20).
 *
 * @param {number} areaSize
 * @param {number} baseFont
 * @returns {number}
 */
export function getHeatmapLabelFontSize(areaSize, baseFont) {
  const base = Number(baseFont);
  const safeBase = Number.isFinite(base) && base > 0 ? base : 7;
  const size = Number(areaSize);
  if (Number.isFinite(size) && size < 40) return Math.max(5, safeBase - 3);
  if (Number.isFinite(size) && size < 80) return Math.max(5, safeBase - 2);
  return safeBase;
}

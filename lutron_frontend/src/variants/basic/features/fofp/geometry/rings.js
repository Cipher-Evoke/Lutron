/**
 * Parse area polygon rings from /floor/light_status shapes.
 */

/** @typedef {{ x: number, y: number }} Point */
/** @typedef {Point[]} Ring */

/**
 * @param {object} area
 * @returns {Ring[]}
 */
export const getRingsFromArea = (area) => {
  const raw = area?.["co-ordinates"] || area?.coordinates || [];
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const first = raw[0];
  if (Array.isArray(first) && first[0] && typeof first[0]?.x === "number") {
    return raw.filter((ring) => Array.isArray(ring) && ring.length >= 3);
  }
  if (first && typeof first?.x === "number") {
    return raw.length >= 3 ? [raw] : [];
  }
  return [];
};

/**
 * @param {object[]} areas
 * @returns {Map<number, Ring[]>}
 */
export const buildAreaRingsById = (areas) => {
  const map = new Map();
  for (const area of areas || []) {
    const id = area?.id ?? area?.area_id;
    if (id == null) continue;
    const rings = getRingsFromArea(area);
    if (rings.length > 0) map.set(Number(id), rings);
  }
  return map;
};

/**
 * @param {object[]} areas
 * @returns {{ key: string, points: string }[]}
 */
export const buildPolygonRenderList = (areas) =>
  (areas || []).flatMap((area) => {
    const rings = getRingsFromArea(area);
    return rings.map((ring, ringIdx) => ({
      key: `${area?.id ?? area?.area_id ?? "area"}-${ringIdx}`,
      points: ring.map((p) => `${p.x},${p.y}`).join(" "),
    }));
  });

/**
 * Normalize FOFP layout positions as Map<zoneId, row> for O(1) updates.
 */

/**
 * @param {object[] | Map<number, object> | null | undefined} source
 * @returns {Map<number, object>}
 */
export const positionsArrayToMap = (source) => {
  const map = new Map();
  if (!source) return map;
  if (source instanceof Map) {
    source.forEach((row, zoneId) => {
      if (row?.zone_id != null) map.set(Number(zoneId), { ...row });
    });
    return map;
  }
  if (Array.isArray(source)) {
    for (const row of source) {
      if (row?.zone_id != null) map.set(Number(row.zone_id), { ...row });
    }
  }
  return map;
};

/** @param {Map<number, object>} map */
export const positionsMapToArray = (map) =>
  Array.from(map.values()).sort((a, b) => Number(a.zone_id) - Number(b.zone_id));

/**
 * @param {Map<number, object>} map
 * @param {number} zoneId
 * @param {number} x
 * @param {number} y
 */
export const updatePositionInMap = (map, zoneId, x, y) => {
  const id = Number(zoneId);
  const row = map.get(id);
  if (!row) return map;
  const next = new Map(map);
  next.set(id, { ...row, x, y });
  return next;
};

/**
 * @param {Map<number, object>} map
 * @param {number} zoneId
 * @param {object} patch
 */
export const patchPositionInMap = (map, zoneId, patch) => {
  const id = Number(zoneId);
  const row = map.get(id);
  if (!row || !patch) return map;
  const next = new Map(map);
  next.set(id, { ...row, ...patch });
  return next;
};

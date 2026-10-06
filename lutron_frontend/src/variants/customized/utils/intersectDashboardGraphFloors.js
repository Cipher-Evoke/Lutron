/**
 * When a custom graph has saved `floor_ids` AND the dashboard has `floorIds` in apiParams,
 * use the intersection so the chart respects both (e.g. widget allows 1–3; user selects 1–2 on Energy → only 1–2).
 * If either side has no floor list, returns null (caller uses merged scope as today).
 */
function normalizeFloorIds(raw) {
  if (raw == null) return [];
  const arr = Array.isArray(raw) ? raw : [];
  const out = [];
  for (const x of arr) {
    const n = typeof x === "number" && !Number.isNaN(x) ? x : parseInt(String(x), 10);
    if (typeof n === "number" && !Number.isNaN(n)) out.push(n);
  }
  return out;
}

/** Exported for Dashboard per-floor detection (same rules as intersection helpers). */
export function normalizeDashboardFloorIds(raw) {
  return normalizeFloorIds(raw);
 }

/**
 * @param {object|null} qp - Dashboard apiParams (may include floorIds)
 * @param {object} graph - Custom graph row (may include floor_ids)
 * @returns {number[]|null} Intersection, or null to keep existing merge behavior only
 */
export function intersectDashboardAndGraphFloors(qp, graph) {
  const gSnake = normalizeFloorIds(graph?.floor_ids);
  const gCamel = normalizeFloorIds(graph?.floorIds);
  const gFloors = gSnake.length > 0 ? gSnake : gCamel;
  const dFloors = normalizeFloorIds(qp?.floorIds);
  if (gFloors.length > 0 && dFloors.length > 0) {
    const allow = new Set(gFloors.map(Number));
    return dFloors.filter((id) => allow.has(Number(id)));
  }
  return null;
}

/**
 * Sort active floor ids to follow the order saved on the graph (`graph.floor_ids`).
 * Keeps x-axis / labels aligned with the order chosen in Widgets when ids are a subset (e.g. intersection).
 */
export function orderPerFloorIdsByGraphFloorIds(activeIds, graphFloorIds) {
  const active = normalizeFloorIds(activeIds);
  if (active.length === 0) return active;
  const order = normalizeFloorIds(graphFloorIds);
  if (order.length === 0) return active;
  const activeSet = new Set(active.map(Number));
  const out = [];
  for (const id of order) {
    const n = Number(id);
    if (activeSet.has(n)) out.push(n);
  }
  for (const id of active) {
    const n = Number(id);
    if (!out.includes(n)) out.push(n);
  }
  return out;
}

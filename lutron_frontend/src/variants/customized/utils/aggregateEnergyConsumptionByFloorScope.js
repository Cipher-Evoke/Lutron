/**
 * Custom energy consumption widgets (Settings → Widgets, bar/pie/table on `/dashboard/energy_consumption`):
 * one bar per floor. See `buildMixedWidgetEnergyFloorBuckets` and `buildFloorBucketsFromSelectedAreaIds`.
 */

import { readCustomGraphScopeDraft } from './mergeCustomGraphScopeIntoApiParams';

function normAreaIds(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return [];
  const out = [];
  for (const x of arr) {
    const n = typeof x === 'number' && !Number.isNaN(x)
      ? x
      : parseInt(String(x), 10);
    if (Number.isFinite(n)) out.push(n);
  }
  return out;
}

function orderFloorIdList(ids, floorsOrdered) {
  const raw = Array.isArray(ids) ? ids : [];
  const idSet = new Set();

  for (const x of raw) {
    const n = typeof x === 'number' && !Number.isNaN(x)
      ? x
      : parseInt(String(x), 10);
    if (Number.isFinite(n)) idSet.add(n);
  }

  const out = [];
  const seen = new Set();

  if (Array.isArray(floorsOrdered)) {
    for (const row of floorsOrdered) {
      const id = Number(row?.id);
      if (!Number.isFinite(id) || !idSet.has(id) || seen.has(id)) continue;
      seen.add(id);
      out.push(id);
    }
  }

  for (const id of [...idSet].sort((a, b) => a - b)) {
    if (!seen.has(id)) out.push(id);
  }

  return out;
}

/**
 * One `mode: 'areas'` bucket per floor from explicit area ids (dashboard or widget area-only scope).
 * @returns {Array<{ floorId: number, mode: 'areas', areaIds: number[] }>}
 */
export function buildFloorBucketsFromSelectedAreaIds(
  areaIds,
  areaIdToFloorId,
  floorsOrdered
) {
  const ids = normAreaIds(areaIds);
  if (ids.length === 0) return [];

  const m =
    areaIdToFloorId instanceof Map
      ? areaIdToFloorId
      : new Map(Object.entries(areaIdToFloorId || {}));

  const floorToSelected = new Map();
  for (const aid of ids) {
    const rawF = m.get(aid) ?? m.get(String(aid));
    const f = Number(rawF);
    if (!Number.isFinite(f)) continue;
    if (!floorToSelected.has(f)) floorToSelected.set(f, new Set());
    floorToSelected.get(f).add(aid);
  }

  const bucketFloorIds = [...floorToSelected.keys()];
  const ordered = [];
  const seen = new Set();
  if (Array.isArray(floorsOrdered)) {
    for (const row of floorsOrdered) {
      const id = Number(row?.id);
      if (!Number.isFinite(id) || !bucketFloorIds.includes(id) || seen.has(id)) continue;
      seen.add(id);
      ordered.push(id);
    }
  }
  for (const id of bucketFloorIds.sort((a, b) => a - b)) {
    if (!seen.has(id)) ordered.push(id);
  }

  const buckets = [];
  for (const fid of ordered) {
    const selectedSet = floorToSelected.get(fid);
    if (!selectedSet || selectedSet.size === 0) continue;
    buckets.push({
      floorId: fid,
      mode: 'areas',
      areaIds: [...selectedSet].sort((a, b) => a - b),
    });
  }

  return buckets;
}

export function buildMixedWidgetEnergyFloorBuckets(
  graph,
  areaIdToFloorId,
  floorsOrdered
) {
  const draft = readCustomGraphScopeDraft(graph);

  const fullFloorIds = normAreaIds(draft.floor_ids);
  const areaIds = normAreaIds(draft.area_ids);

  // If no mixed selection, skip
  if (fullFloorIds.length === 0 || areaIds.length === 0) return [];

  const m =
    areaIdToFloorId instanceof Map
      ? areaIdToFloorId
      : new Map(Object.entries(areaIdToFloorId || {}));

  const areasByFloor = new Map();

  // ✅ Build area → floor grouping
  for (const aid of areaIds) {
    const rawF = m.get(aid) ?? m.get(String(aid));
    const f = Number(rawF);

    if (!Number.isFinite(f)) continue;

    if (!areasByFloor.has(f)) areasByFloor.set(f, []);
    areasByFloor.get(f).push(aid);
  }

  // ✅ Handle unmapped areas (IMPORTANT)
  const orphanIds = areaIds.filter((aid) => {
    const rawF = m.get(aid) ?? m.get(String(aid));
    return !Number.isFinite(Number(rawF));
  });

  if (orphanIds.length > 0) {
    const inScope = fullFloorIds.map(Number).filter(Number.isFinite);

    if (areasByFloor.size === 0 && inScope.length > 0) {
      // assign to highest floor
      const guessFloor = Math.max(...inScope);
      areasByFloor.set(guessFloor, [...orphanIds]);
    } else if (areasByFloor.size === 1) {
      const onlyF = [...areasByFloor.keys()][0];
      const merged = new Set([
        ...(areasByFloor.get(onlyF) || []),
        ...orphanIds,
      ]);
      areasByFloor.set(onlyF, [...merged].sort((a, b) => a - b));
    }
  }

  // ✅ EXTRA safety fallback (mapping totally failed)
  if (
    areaIds.length > 0 &&
    areasByFloor.size === 0 &&
    fullFloorIds.length > 0
  ) {
    const fallbackFloor = Math.max(...fullFloorIds);
    areasByFloor.set(fallbackFloor, [...areaIds]);
  }

  const fullSet = new Set(fullFloorIds.map(Number));
  const buckets = [];
  const seenFloorIds = new Set();

  // ✅ MAIN LOOP (CRITICAL FIX AREA)
  for (const fid of orderFloorIdList(fullFloorIds, floorsOrdered)) {
    if (!fullSet.has(Number(fid))) continue;

    const fidNum = Number(fid);
    const selectedArr = areasByFloor.get(fidNum);

    if (selectedArr && selectedArr.length > 0) {
      // ✅ correct area aggregation
      const selectedSet = new Set(
        selectedArr.map((x) => Number(x)).filter(Number.isFinite)
      );

      buckets.push({
        floorId: fidNum,
        mode: 'areas',
        areaIds: [...selectedSet].sort((a, b) => a - b),
      });

    } else {
      // No widget `area_ids` mapped to this floor → whole-floor request for this ceiling floor
      buckets.push({
        floorId: fidNum,
        mode: 'floor',
      });
    }

    seenFloorIds.add(fidNum);
  }

  // ✅ Handle remaining partial floors
  const partialFloorIds = orderFloorIdList(
    [...areasByFloor.keys()],
    floorsOrdered
  ).filter((fid) => !seenFloorIds.has(Number(fid)));

  for (const fid of partialFloorIds) {
    const selectedArr = areasByFloor.get(fid) || [];

    const selectedSet = new Set(
      selectedArr.map((x) => Number(x)).filter(Number.isFinite)
    );

    buckets.push({
      floorId: Number(fid),
      mode: 'areas',
      areaIds: [...selectedSet].sort((a, b) => a - b),
    });
  }

  return buckets;
}

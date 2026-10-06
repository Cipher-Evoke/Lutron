import { buildFloorBucketsFromSelectedAreaIds } from './aggregateEnergyConsumptionByFloorScope'
import { getFloorDisplayLabel } from './floorDisplayLabel'

/**
 * Merges custom-widget-only floor + area selection into per-floor buckets for APIs that
 * accept either floor_ids OR area_ids (not both). Full floors win over partial area buckets.
 *
 * @param {{ floor_ids?: unknown[], area_ids?: unknown[] }} cw
 * @param {Map|Record} areaIdToFloorId
 * @param {object[]} floorsList
 * @returns {Array<{ mode: 'floor'|'areas', floorId: number, areaIds: number[] }>}
 */
export function buildCustomWidgetFilterFloorBuckets(cw, areaIdToFloorId, floorsList) {
  if (!cw || typeof cw !== 'object') return []
  const floorIds = Array.isArray(cw.floor_ids) ? cw.floor_ids : []
  const areaIds = Array.isArray(cw.area_ids) ? cw.area_ids : []
  if (floorIds.length === 0 && areaIds.length === 0) return []

  const fullFloorBuckets = floorIds.map((fid) => ({
    mode: 'floor',
    floorId: Number(fid),
    areaIds: [],
  }))

  const partialFloorBuckets = buildFloorBucketsFromSelectedAreaIds(areaIds, areaIdToFloorId, floorsList)

  const mergedMap = new Map()
  for (const b of fullFloorBuckets) {
    const fid = Number(b.floorId)
    if (Number.isFinite(fid)) mergedMap.set(fid, b)
  }
  for (const b of partialFloorBuckets) {
    const fid = Number(b.floorId)
    if (!Number.isFinite(fid)) continue
    if (!mergedMap.has(fid)) mergedMap.set(fid, b)
  }

  return Array.from(mergedMap.values()).sort((a, b) => Number(a.floorId) - Number(b.floorId))
}

export function formatSelectedAreaNamesForCustomWidgetTooltip(areaIds, displayMap) {
  const ids = Array.isArray(areaIds) ? areaIds : []
  const m =
    displayMap instanceof Map
      ? displayMap
      : new Map(Object.entries(displayMap || {}))
  const names = []
  const seen = new Set()
  for (const raw of ids) {
    const n =
      typeof raw === 'number' && !Number.isNaN(raw)
        ? raw
        : parseInt(String(raw), 10)
    if (!Number.isFinite(n) || seen.has(n)) continue
    seen.add(n)
    const v = m.get(n) ?? m.get(String(n))
    const s = v != null && String(v).trim() !== '' ? String(v).trim() : `Area ${n}`
    names.push(s)
  }
  return names.join(', ')
}

/**
 * @param {{ preferAreaNamesOnAxis?: boolean }} [opts] — occupancy: axis label = area name(s), not floor
 */
export function perFloorBucketAxisAndTooltipTitle(bucket, floorsList, displayMap, opts) {
  const preferAreaNamesOnAxis = Boolean(opts?.preferAreaNamesOnAxis)
  const floorLabel =
    bucket.floorId != null && Number.isFinite(Number(bucket.floorId))
      ? getFloorDisplayLabel(floorsList, bucket.floorId)
      : 'Selected areas'
  const isWholeFloor = bucket.mode === 'floor'
  const aIds = bucket.mode === 'areas' && Array.isArray(bucket.areaIds) ? bucket.areaIds : []
  const areasStr =
    !isWholeFloor && aIds.length > 0
      ? formatSelectedAreaNamesForCustomWidgetTooltip(aIds, displayMap)
      : ''

  if (preferAreaNamesOnAxis && !isWholeFloor && aIds.length > 0) {
    const label = areasStr
    const tooltipTitle =
      aIds.length > 1
        ? `${areasStr} · ${floorLabel}`
        : String(areasStr).trim() !== ''
          ? areasStr
          : floorLabel
    return { label, tooltipTitle }
  }

  const tooltipTitle =
    areasStr && String(areasStr).trim() !== ''
      ? `${floorLabel}: ${areasStr}`
      : floorLabel
  return { label: floorLabel, tooltipTitle }
}

/**
 * Occupancy: one bar per area when a bucket has multiple `areaIds` (Space/Dashboard custom graphs).
 */
export function expandOccupancyCountBucketsToOneBarPerArea(buckets) {
  if (!Array.isArray(buckets) || buckets.length === 0) return buckets
  const out = []
  for (const b of buckets) {
    if (b.mode === 'areas' && Array.isArray(b.areaIds) && b.areaIds.length > 1) {
      for (const raw of b.areaIds) {
        const aid =
          typeof raw === 'number' && !Number.isNaN(raw) ? raw : parseInt(String(raw), 10)
        if (!Number.isFinite(aid)) continue
        out.push({
          ...b,
          areaIds: [aid],
        })
      }
    } else {
      out.push(b)
    }
  }
  return out
}

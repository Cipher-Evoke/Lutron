/**
 * Suppress WebSocket cache area_status pushes while a live=1 fetchAreaStatus
 * is in flight for the same area — prevents click flicker (cache ON → live OFF).
 *
 * Uses heatmap.areaStatusFetchingId set in fetchAreaStatus.pending and cleared
 * on fulfilled/rejected. No new state.
 */

export function isAreaAwaitingLiveRead(state, areaId) {
  if (areaId == null || areaId === "") return false;
  const fetchingId = state?.areaStatusFetchingId;
  if (fetchingId == null || fetchingId === "") return false;
  return String(fetchingId) === String(areaId);
}

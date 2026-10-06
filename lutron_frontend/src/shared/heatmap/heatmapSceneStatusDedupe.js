/** Stable key for deduping POST /setting/scene_status in HeatMap sidebar. */
export function getHeatmapSceneStatusKey(areaId, sceneId) {
  if (areaId == null || sceneId == null) return "";
  const n = Number(sceneId);
  if (!Number.isFinite(n)) return "";
  return `${areaId}:${n}`;
}

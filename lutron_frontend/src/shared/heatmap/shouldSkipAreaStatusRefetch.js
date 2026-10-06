function normStatus(value) {
  return String(value ?? "")
    .toLowerCase()
    .trim();
}

/**
 * Skip a second full_area_status when the sidebar is already for this area
 * and the floor map has not drifted (light / occupancy).
 * First click, area switch, or map drift still fetches.
 */
export function shouldSkipAreaStatusRefetch({
  areaId,
  areaStatus,
  areaStatusLoading,
  mapAreas,
}) {
  const id = Number(areaId);
  if (!Number.isFinite(id)) return false;
  if (Number(areaStatus?.area_id) !== id) return false;
  if (areaStatusLoading) return true;
  // Empty zone list is not a complete sidebar — retry like a first click.
  if (!Array.isArray(areaStatus?.zones) || areaStatus.zones.length === 0) {
    return false;
  }

  const mapArea = (mapAreas || []).find(
    (area) => Number(area.area_id ?? area.id) === id
  );
  if (!mapArea) return true;

  if (
    mapArea.light_status != null &&
    mapArea.light_status !== "" &&
    normStatus(mapArea.light_status) !== normStatus(areaStatus.light_status)
  ) {
    return false;
  }
  if (
    mapArea.occupancy_status != null &&
    mapArea.occupancy_status !== "" &&
    normStatus(mapArea.occupancy_status) !==
      normStatus(areaStatus.occupancy_status)
  ) {
    return false;
  }
  return true;
}

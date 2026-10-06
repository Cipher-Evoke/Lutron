/**
 * Patch the open heatmap sidebar with light/occupancy only.
 * Does not touch consumption, savings, zones, or scenes.
 */

function normalizeLight(value) {
  if (value == null || String(value).trim() === "") return null;
  const s = String(value).toLowerCase().trim();
  if (s === "on" || s === "true") return "On";
  if (s === "off" || s === "false") return "Off";
  return null;
}

function normalizeOccupancy(value) {
  if (value == null || String(value).trim() === "") return null;
  const o = String(value).toLowerCase().trim();
  if (o === "occupied") return "Occupied";
  if (o === "unoccupied") return "Unoccupied";
  return null;
}

function findArea(areas, areaId) {
  if (!Array.isArray(areas) || areaId == null) return null;
  return (
    areas.find((area) => {
      const id = area?.area_id ?? area?.id;
      return id != null && String(id) === String(areaId);
    }) || null
  );
}

export function patchOpenAreaLiveLightOccupancy(state, areas) {
  if (!state?.areaStatus) return;
  const match = findArea(areas, state.areaStatus.area_id);
  if (!match) return;

  const light = normalizeLight(match.light_status);
  if (light) state.areaStatus.light_status = light;

  const occupancy = normalizeOccupancy(match.occupancy_status);
  if (occupancy) state.areaStatus.occupancy_status = occupancy;
}

export function areaLiveFieldsAlreadyOnMap(mapAreas, areaId, light, occupancy) {
  const match = findArea(mapAreas, areaId);
  if (!match) return false;
  const mapLight = normalizeLight(match.light_status);
  const nextLight = normalizeLight(light);
  const mapOcc = normalizeOccupancy(match.occupancy_status);
  const nextOcc = normalizeOccupancy(occupancy);
  const lightOk = !nextLight || mapLight === nextLight;
  const occOk = !nextOcc || mapOcc === nextOcc;
  return lightOk && occOk;
}

/**
 * True when the floor poll shows the already-open area drifted
 * (light in Light mode, occupancy in Occupancy mode).
 */
export function openAreaMapFieldsDrifted({
  areas,
  areaId,
  sidebarAreaId,
  sidebarLight,
  sidebarOccupancy,
  field,
}) {
  if (areaId == null || sidebarAreaId == null) return false;
  if (String(areaId) !== String(sidebarAreaId)) return false;
  const match = findArea(areas, areaId);
  if (!match) return false;

  if (field === "occupancy") {
    const mapOcc = normalizeOccupancy(match.occupancy_status);
    const prevOcc = normalizeOccupancy(sidebarOccupancy);
    if (!mapOcc || !prevOcc) return false;
    return mapOcc !== prevOcc;
  }

  const mapLight = normalizeLight(match.light_status);
  const prevLight = normalizeLight(sidebarLight);
  if (!mapLight || !prevLight) return false;
  return mapLight !== prevLight;
}

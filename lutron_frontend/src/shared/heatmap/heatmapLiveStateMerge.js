import { resolveFloorPlanMediaUrl } from "../pdf/floorPlanPdf";
import { patchOpenAreaLiveLightOccupancy } from "./patchOpenAreaLiveStatus";

function normalizeLightStatus(status) {
  if (status == null || status === "") return null;
  const s = String(status).toLowerCase().trim();
  if (s === "on" || s === "true") return "on";
  if (s === "off" || s === "false") return "off";
  return s;
}

function areaIdsMatch(area, areaId) {
  if (areaId == null) return false;
  const target = Number(areaId);
  const aid = area.area_id != null ? Number(area.area_id) : null;
  const id = area.id != null ? Number(area.id) : null;
  return aid === target || id === target;
}

function normalizeFloorLightAreas(rawAreas) {
  return (rawAreas || []).map((area) => {
    const rawLevel = area.light_level;
    let light_level = null;
    if (rawLevel !== null && rawLevel !== undefined && rawLevel !== "") {
      const levelRaw = Number(rawLevel);
      if (Number.isFinite(levelRaw)) {
        light_level = Math.max(0, Math.min(100, Math.round(levelRaw)));
      }
    }
    return {
      ...area,
      coordinates: area["co-ordinates"] || area.coordinates || [],
      area_id: area.id,
      id: area.id,
      light_status: (area.light_status || "").toLowerCase().trim(),
      light_level,
      processor_reachable: area.processor_reachable !== false,
    };
  });
}

/** Merge live=0 / WebSocket floor light payload into heatmap state. */
export function mergeHeatmapFloorLightLive(state, payload) {
  if (!payload?.areas) return;

  const areas = normalizeFloorLightAreas(payload.areas);
  const hasExisting = Boolean(state.heatmapData?.areas?.length);

  if (hasExisting) {
    state.heatmapData.areas = state.heatmapData.areas.map((area) => {
      const updated = areas.find((a) =>
        areaIdsMatch(area, a.area_id ?? a.id)
      );
      if (!updated) return area;
      return {
        ...area,
        light_status: updated.light_status,
        light_level: updated.light_level,
        processor_reachable:
          updated.processor_reachable === false
            ? false
            : area.processor_reachable,
      };
    });
    patchOpenAreaLiveLightOccupancy(state, areas);
    return;
  }

  state.heatmapData = { ...payload, areas };
  patchOpenAreaLiveLightOccupancy(state, areas);
  const rawPath = payload.floor_plan || payload.floor_image || "";
  if (rawPath) {
    state.pdfUrl = resolveFloorPlanMediaUrl(rawPath);
  }
}

/** Merge live=0 / WebSocket floor occupancy payload into heatmap state. */
export function mergeHeatmapFloorOccupancyLive(state, payload) {
  const updatedAreas = (payload?.areas || []).map((a) => ({
    ...a,
    area_id: a.area_id || a.id,
  }));
  if (!state.heatmapData?.areas?.length || !updatedAreas.length) return;

  state.heatmapData.areas = state.heatmapData.areas.map((area) => {
    const updated = updatedAreas.find(
      (a) =>
        a.area_id === (area.area_id || area.id) ||
        a.id === (area.area_id || area.id)
    );
    return updated
      ? {
          ...area,
          occupancy_status: updated.occupancy_status,
          processor_reachable:
            updated.processor_reachable === false
              ? false
              : area.processor_reachable,
        }
      : area;
  });
  patchOpenAreaLiveLightOccupancy(state, updatedAreas);
}

/** Keep sidebar zone rows when a cache/live=0 payload has an empty list. */
export function keepSidebarZonesIfIncomingEmpty(previous, incoming) {
  if (!previous || !incoming || typeof incoming !== "object") return incoming;
  if (String(previous.area_id) !== String(incoming.area_id)) return incoming;
  const incomingZones = Array.isArray(incoming.zones) ? incoming.zones : [];
  const previousZones = Array.isArray(previous.zones) ? previous.zones : [];
  if (incomingZones.length > 0 || previousZones.length === 0) return incoming;
  return { ...incoming, zones: previousZones };
}

/** Merge live=0 / WebSocket area sidebar payload; preserve energy like silent poll. */
export function mergeHeatmapAreaStatusLive(state, payload) {
  if (!payload?.area_id) return;

  const previousAreaStatus = state.areaStatus;
  const sameArea =
    previousAreaStatus &&
    String(previousAreaStatus.area_id) === String(payload.area_id);

  const mergedPayload = keepSidebarZonesIfIncomingEmpty(
    previousAreaStatus,
    payload
  );

  state.areaStatus = sameArea
    ? {
        ...mergedPayload,
        consumption:
          previousAreaStatus?.consumption ?? payload?.consumption,
        savings: previousAreaStatus?.savings ?? payload?.savings,
      }
    : mergedPayload;

  const payloadAreaId = payload.area_id;
  const mapLight = normalizeLightStatus(payload.light_status);
  if (payloadAreaId != null && state.heatmapData?.areas) {
    state.heatmapData.areas = state.heatmapData.areas.map((area) =>
      areaIdsMatch(area, payloadAreaId)
        ? {
            ...area,
            occupancy_status: (payload.occupancy_status || "")
              .toLowerCase()
              .trim(),
            light_status: mapLight ?? area.light_status,
          }
        : area
    );
  }
}

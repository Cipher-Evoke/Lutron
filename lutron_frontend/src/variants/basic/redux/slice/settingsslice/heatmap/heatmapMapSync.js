/**
 * Helpers to keep floorplan polygon status in sync with control-panel updates.
 * Basic variant (includes maxFadeDelayMs for zone Apply timing).
 */

/** @param {unknown} status */
export function normalizeLightStatus(status) {
  if (status == null || status === "") return null;
  const s = String(status).toLowerCase().trim();
  if (s === "on" || s === "true") return "on";
  if (s === "off" || s === "false") return "off";
  return null;
}

/** @param {{ area_id?: number, id?: number }} area @param {number|string} areaId */
export function areaIdsMatch(area, areaId) {
  if (areaId == null) return false;
  const target = Number(areaId);
  if (!Number.isFinite(target)) return false;
  const aid = area.area_id != null ? Number(area.area_id) : null;
  const id = area.id != null ? Number(area.id) : null;
  return aid === target || id === target;
}

/**
 * Canonical occupancy label for sidebar / API merge.
 * @param {unknown} status
 * @returns {'Occupied'|'Unoccupied'|'Unknown'|null}
 */
export function normalizeOccupancyStatus(status) {
  if (status == null || status === "") return null;
  const o = String(status).toLowerCase().trim();
  if (o === "occupied") return "Occupied";
  if (o === "unoccupied") return "Unoccupied";
  if (o === "unknown") return "Unknown";
  return null;
}

function zoneTypeLower(zone) {
  return String(zone?.zone_type || zone?.type || "").toLowerCase();
}

function parseZoneBrightnessLevel(zone) {
  if (zone == null) return 0;
  if (typeof zone.level === "number" && Number.isFinite(zone.level)) {
    return Math.max(0, Math.min(100, Math.round(zone.level)));
  }
  const raw = zone.brightness ?? zone.level ?? 0;
  const parsed = parseInt(String(raw).replace("%", ""), 10);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : 0;
}

function clampLevel0To100(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * Infer on/off from zone update commands or full_area_status zone rows.
 * Ignores shade zones. Returns null when no readable non-shade zones.
 */
export function deriveLightStatusFromZoneUpdates(zones) {
  if (!Array.isArray(zones) || zones.length === 0) return null;

  let anyOn = false;
  let anyReadable = false;

  for (const z of zones) {
    const type = zoneTypeLower(z);
    if (type === "shade") continue;

    anyReadable = true;

    if (type === "switched") {
      const st = String(
        z.switched_state || z.status || z.on_off || ""
      ).toLowerCase();
      if (st === "on") anyOn = true;
      continue;
    }

    const level = parseZoneBrightnessLevel(z);
    if (level > 0) anyOn = true;
  }

  if (!anyReadable) return null;
  return anyOn ? "on" : "off";
}

/**
 * Max wait (ms) before re-reading processor status after a fade command.
 * fade_time is typically "02" meaning 2 seconds in Lutron LEAP.
 * @param {Array<{ fade_time?: string, delay_time?: string }>} zones
 */
export function maxFadeDelayMs(zones) {
  if (!Array.isArray(zones) || zones.length === 0) return 300;
  let maxSec = 0;
  for (const z of zones) {
    const fade = parseInt(String(z.fade_time ?? "0"), 10);
    const delay = parseInt(String(z.delay_time ?? "0"), 10);
    const total =
      (Number.isNaN(fade) ? 0 : fade) + (Number.isNaN(delay) ? 0 : delay);
    if (total > maxSec) maxSec = total;
  }
  const ms = maxSec > 0 ? maxSec * 1000 + 200 : 300;
  return Math.min(ms, 5000);
}

/**
 * Map light_level (0-100) for one sidebar area from zones + status.
 */
export function lightLevelFromSidebarPayload(payload, existingLevel) {
  const zones = payload?.zones;
  let maxLevel = null;

  if (Array.isArray(zones) && zones.length > 0) {
    for (const z of zones) {
      const type = zoneTypeLower(z);
      if (type === "shade") continue;

      if (type === "switched") {
        const st = String(
          z.switched_state || z.status || z.on_off || ""
        ).toLowerCase();
        const lv = st === "on" ? 100 : 0;
        maxLevel = maxLevel == null ? lv : Math.max(maxLevel, lv);
        continue;
      }

      const lv = parseZoneBrightnessLevel(z);
      maxLevel = maxLevel == null ? lv : Math.max(maxLevel, lv);
    }
  }

  if (maxLevel != null) return maxLevel;

  const derived = deriveLightStatusFromZoneUpdates(
    Array.isArray(zones) ? zones : []
  );
  const normalized = derived ?? normalizeLightStatus(payload?.light_status);

  if (normalized === "off") return 0;
  if (normalized === "on") {
    const existing = clampLevel0To100(existingLevel);
    return existing > 0 ? existing : 100;
  }

  const existing = clampLevel0To100(existingLevel);
  return Number.isFinite(Number(existingLevel)) ? existing : null;
}

/** Toggle-friendly On/Off label for areaStatus from payload + zones. */
export function sidebarLightStatusFromPayload(payload) {
  const zones = payload?.zones;
  if (Array.isArray(zones) && zones.length > 0) {
    const derived = deriveLightStatusFromZoneUpdates(zones);
    if (derived === "on") return "On";
    if (derived === "off") return "Off";
  }
  const normalized = normalizeLightStatus(payload?.light_status);
  if (normalized === "on") return "On";
  if (normalized === "off") return "Off";
  return payload?.light_status;
}

/**
 * True when preferred (live=1) is Off/0% but incoming (live=0 cache) would raise level.
 */
export function isCacheLightStaleVsPreferred(preferred, incoming) {
  if (!preferred || !incoming) return false;
  if (String(preferred.area_id) !== String(incoming.area_id)) return false;

  const prefZones = preferred.zones;
  if (!Array.isArray(prefZones) || prefZones.length === 0) return false;

  const prefDerived = deriveLightStatusFromZoneUpdates(prefZones);
  const prefLevel = lightLevelFromSidebarPayload(preferred, 0);
  if (prefDerived !== "off" || prefLevel !== 0) return false;

  const incLevel = lightLevelFromSidebarPayload(incoming, 0);
  return incLevel != null && incLevel > 0;
}

/**
 * Patch light_status + light_level for one area on the floor map.
 */
export function patchAreasLightFromSidebar(areas, areaId, payload) {
  if (!areas?.length || areaId == null || !payload) return areas;

  return areas.map((area) => {
    if (!areaIdsMatch(area, areaId)) return area;

    const zones = payload.zones;
    let lightStatusNorm = null;
    if (Array.isArray(zones) && zones.length > 0) {
      lightStatusNorm = deriveLightStatusFromZoneUpdates(zones);
    }
    if (lightStatusNorm == null) {
      lightStatusNorm = normalizeLightStatus(payload.light_status);
    }

    const light_level = lightLevelFromSidebarPayload(payload, area.light_level);

    return {
      ...area,
      ...(lightStatusNorm != null ? { light_status: lightStatusNorm } : {}),
      ...(light_level != null ? { light_level } : {}),
    };
  });
}

/** Re-assert open-area map light from sidebar when it is zone-derived Off. */
export function reassertOpenAreaLightFromSidebar(state) {
  const areaStatus = state?.areaStatus;
  const areaId = areaStatus?.area_id;
  if (areaId == null || !state.heatmapData?.areas) return;
  if (!Array.isArray(areaStatus.zones) || areaStatus.zones.length === 0) return;
  if (deriveLightStatusFromZoneUpdates(areaStatus.zones) !== "off") return;
  state.heatmapData.areas = patchAreasLightFromSidebar(
    state.heatmapData.areas,
    areaId,
    areaStatus
  );
}

/**
 * @param {Array<Record<string, unknown>>} areas
 * @param {number} areaId
 * @param {string|null} lightStatus normalized on/off or raw On/Off
 */
export function patchAreasLightStatus(areas, areaId, lightStatus) {
  if (!areas?.length || lightStatus == null) return areas;

  const norm =
    normalizeLightStatus(lightStatus) ?? String(lightStatus).toLowerCase();

  return areas.map((area) => {
    if (!areaIdsMatch(area, areaId)) return area;

    const existingClamped = clampLevel0To100(area.light_level);
    let light_level = existingClamped;
    if (norm === "off") {
      light_level = 0;
    } else if (norm === "on") {
      light_level = existingClamped > 0 ? existingClamped : 100;
    }

    return {
      ...area,
      light_status: norm,
      light_level,
    };
  });
}

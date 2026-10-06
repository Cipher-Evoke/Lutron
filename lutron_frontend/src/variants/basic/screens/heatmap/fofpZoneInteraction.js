/**
 * Helpers for FOFP marker hover labels and sidebar zone highlight matching.
 */

/**
 * @param {string|null|undefined} zoneName
 * @param {number|null|undefined} lightLevel
 * @param {{ driverAlert?: boolean, driverAlertType?: string }} [options]
 */
export function formatFofpMarkerTooltip(zoneName, lightLevel, options = {}) {
  const name = typeof zoneName === "string" && zoneName.trim()
    ? zoneName.trim()
    : "Zone";
  const alertType =
    typeof options.driverAlertType === "string" && options.driverAlertType.trim()
      ? options.driverAlertType.trim()
      : null;
  if (options.driverAlert === true || alertType) {
    return `${name} — ${alertType || "Driver fault"}`;
  }
  if (lightLevel == null || !Number.isFinite(Number(lightLevel))) {
    return `${name} — —`;
  }
  const pct = Math.max(0, Math.min(100, Math.round(Number(lightLevel))));
  return `${name} — ${pct}%`;
}

/**
 * Floorplan FOFP marker highlight: unique per DB ``zones.id`` only.
 * Avoids highlighting every marker that shares a generic name (e.g. "LINEAR").
 *
 * @param {{ zoneId?: number }} marker
 * @param {{ zoneId?: number }|null} highlight
 */
export function isFofpMarkerHighlighted(marker, highlight) {
  if (!highlight || !marker) return false;
  if (highlight.zoneId == null || marker.zoneId == null) return false;
  return Number(marker.zoneId) === Number(highlight.zoneId);
}

/**
 * Sidebar zone card highlight after an FOFP marker click.
 * Prefers DB ``zoneId``; name fallback only for the first matching zone in this area.
 *
 * @param {{ id?: number, name?: string }} zone
 * @param {{ areaId?: number, zoneId?: number, zoneName?: string }|null} highlight
 * @param {Array<{ id?: number, name?: string, type?: string }>} [zonesInArea]
 */
export function isFofpZonePanelHighlighted(zone, highlight, zonesInArea) {
  if (!highlight || !zone) return false;

  if (
    highlight.zoneId != null &&
    zone.id != null &&
    Number(zone.id) === Number(highlight.zoneId)
  ) {
    return true;
  }

  const wanted = String(highlight.zoneName || "").trim().toLowerCase();
  if (!wanted || !Array.isArray(zonesInArea) || !zonesInArea.length) {
    return false;
  }

  const list = buildZonesPanelList(zonesInArea);
  const first = list.find(
    (z) => String(z.name || "").trim().toLowerCase() === wanted
  );
  return (
    first != null &&
    zone.id != null &&
    first.id != null &&
    Number(first.id) === Number(zone.id)
  );
}

const normalizeZoneType = (type) => String(type || "").toLowerCase().trim();

/** Same ordering as HeatMap zonesToShow. */
export function buildZonesPanelList(zones) {
  if (!Array.isArray(zones)) return [];
  const whiteTune = zones.filter((z) =>
    ["whitening", "whitetune"].includes(normalizeZoneType(z.type))
  );
  const dimmed = zones.filter((z) => normalizeZoneType(z.type) === "dimmed");
  const switched = zones.filter((z) => normalizeZoneType(z.type) === "switched");
  return [...whiteTune, ...dimmed, ...switched];
}

/**
 * Index of zone in the ordered sidebar list (whiteTune, dimmed, switched).
 *
 * @param {Array<{ id?: number, name?: string, type?: string }>} zones
 * @param {{ zoneId?: number, zoneName?: string }} highlight
 */
export function findFofpZoneIndexInPanelList(zones, highlight) {
  if (!Array.isArray(zones) || !highlight) return -1;
  const list = buildZonesPanelList(zones);

  if (highlight.zoneId != null) {
    const byId = list.findIndex((z) => Number(z.id) === Number(highlight.zoneId));
    if (byId >= 0) return byId;
  }

  const wanted = String(highlight.zoneName || "").trim().toLowerCase();
  if (!wanted) return -1;
  return list.findIndex((z) => String(z.name || "").trim().toLowerCase() === wanted);
}

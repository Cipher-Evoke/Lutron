/**
 * Helpers for FOFP marker hover labels and sidebar zone highlight matching.
 */

/** @param {string|null|undefined} zoneName @param {number|null|undefined} lightLevel */
export function formatFofpMarkerTooltip(zoneName, lightLevel) {
  const name = typeof zoneName === "string" && zoneName.trim()
    ? zoneName.trim()
    : "Zone";
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

const isWhitening = (type) =>
  ["whitening", "white tune", "whitetune", "white_tune"].includes(
    (type || "").toLowerCase()
  );
const isDimmed = (type) => (type || "").toLowerCase() === "dimmed";
const isSwitched = (type) => (type || "").toLowerCase() === "switched";

/** Same ordering as HeatMap buildSidebarZonesToShow. */
export function buildZonesPanelList(zones) {
  if (!Array.isArray(zones)) return [];
  const whiteTune = zones.filter((z) => isWhitening(z.type));
  const dimmed = zones.filter((z) => isDimmed(z.type));
  const switched = zones.filter((z) => isSwitched(z.type));
  if (whiteTune.length > 0 || dimmed.length > 0) {
    return [...whiteTune, ...dimmed];
  }
  return switched;
}

/**
 * Index of zone in the ordered sidebar list.
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

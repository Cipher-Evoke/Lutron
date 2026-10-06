/**
 * Shared heatmap sidebar helpers — shade zones, energy formatting, pagination.
 */

export const SHADES_VISIBLE_PER_PAGE = 2;

export const SHADE_PRESET_LEVELS = [100, 75, 50, 25, 0];

export function resolveShadeZoneId(shade) {
  const raw = shade?.id ?? shade?.zone_id;
  if (raw == null || raw === "") return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : raw;
}

export function parseShadeLevel(level) {
  if (level == null) return 0;
  if (typeof level === "number") {
    return Number.isFinite(level) ? Math.round(level) : 0;
  }
  let text = String(level).trim();
  if (text.endsWith("%")) text = text.slice(0, -1);
  const parsed = parseInt(text, 10);
  return Number.isFinite(parsed) ? Math.round(parsed) : 0;
}

export function clampShadeLevel(value) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

export function getShadeDisplayName(shade) {
  const id = shade?.id ?? shade?.zone_id ?? "";
  return shade?.name || `Shade ${id}`;
}

export function getShadesForPage(shades, page) {
  const start = page * SHADES_VISIBLE_PER_PAGE;
  return shades.slice(start, start + SHADES_VISIBLE_PER_PAGE);
}

export function getShadesPageCount(shades) {
  if (!shades?.length) return 1;
  return Math.ceil(shades.length / SHADES_VISIBLE_PER_PAGE);
}

export function getShadesPageLabel(shades, page) {
  return getShadesForPage(shades, page).map(getShadeDisplayName).join(" · ");
}

export function isShadePresetActive(shades, shadesLocalValues, percent) {
  if (!shades.length) return false;
  return shades.every((shade) => {
    const zoneId = resolveShadeZoneId(shade);
    return zoneId != null && Math.round(shadesLocalValues[zoneId] ?? 0) === percent;
  });
}

export function buildShadesUpdatePayload(shades, shadesLocalValues) {
  return Object.entries(shadesLocalValues)
    .filter(([id, position]) => {
      const shade = shades.find((s) => String(resolveShadeZoneId(s)) === String(id));
      if (!shade) return false;
      const originalLevel = parseShadeLevel(shade.level);
      return clampShadeLevel(position) !== originalLevel;
    })
    .map(([id, position]) => ({
      zone_id: Number(id),
      zone_type: "Shade",
      level: clampShadeLevel(position),
    }));
}

export function formatSidebarEnergyWatts(v) {
  if (v === undefined || v === null || v === "") return "Unknown";
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return "Unknown";
  return `${n.toFixed(1)} W`;
}

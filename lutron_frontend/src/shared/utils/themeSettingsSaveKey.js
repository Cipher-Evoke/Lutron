/**
 * Fingerprints for Settings → Theme Save / Reset (application + heatmap colors).
 */
export function buildThemeApplicationSaveKey(payload) {
  return JSON.stringify({
    background: String(payload?.background || "").toLowerCase(),
    content: String(payload?.content || "").toLowerCase(),
    button: String(payload?.button || "").toLowerCase(),
  });
}

export function buildThemeHeatmapSaveKey(payload) {
  return JSON.stringify({
    light: String(payload?.light || "").toLowerCase(),
    occupancy: String(payload?.occupancy || "").toLowerCase(),
    energy: String(payload?.energy || "").toLowerCase(),
  });
}

export function buildFofpThemeSaveKey(markerColor) {
  return JSON.stringify({
    marker_color: String(markerColor || "").toLowerCase(),
  });
}

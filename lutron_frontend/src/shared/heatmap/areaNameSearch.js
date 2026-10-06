/** Visible heatmap label only. Never code, area_id, or id. */
export function getAreaDisplayName(area) {
  return String(area?.name || area?.area_name || "");
}

export function areaNameMatchesSearch(area, searchTerm) {
  const q = String(searchTerm ?? "").trim().toLowerCase();
  if (!q) return false;
  return getAreaDisplayName(area).toLowerCase().includes(q);
}

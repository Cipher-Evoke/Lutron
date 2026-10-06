import { isLightSurface } from "./themeOnSurface";

/**
 * Sliding Energy/Space/Alerts (and heatmap mode) tab strip tokens.
 * Inactive label color is derived from the pill track solid so light tracks
 * never get white text (and dark tracks never get near-black text).
 *
 * @param {HTMLElement} root
 * @param {{
 *   pillBg: string,
 *   activeText: string,
 *   contrastSolid: string,
 *   indicatorBg?: string,
 * }} opts
 */
export function applyHeatmapTabPillTokens(
  root,
  { pillBg, activeText, contrastSolid, indicatorBg = "#ffffff" }
) {
  const inactiveText = isLightSurface(contrastSolid) ? "#2c2820" : "#ffffff";
  root.style.setProperty("--heatmap-tab-pill-bg", pillBg);
  root.style.setProperty("--heatmap-tab-indicator-bg", indicatorBg);
  root.style.setProperty("--heatmap-tab-active-text", activeText);
  root.style.setProperty("--heatmap-tab-inactive-text", inactiveText);
  return inactiveText;
}

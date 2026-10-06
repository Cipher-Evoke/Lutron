/**
 * Floorplan Light display mode: area polygon fill from 0–100 light_level.
 * 0 = grey (off), 100 = full theme light color (brightest).
 */

import { hexToRgb, interpolateHexColor } from "../../utils/colorScale";
import { isMapProcessorUnreachable } from "../../../../shared/heatmap/processorReachable";

export const LIGHT_OFF_GREY_HEX = "#5f5f5f";
export const LIGHT_FILL_OPACITY = 0.5;

/** Clamp API light_level to 0–100; null when not a finite number. */
export function clampLightLevel(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * Polygon fill for a given light level and theme color.
 * @param {number} level 0–100
 * @param {string} lightColorHex e.g. #f2ff00
 * @param {number} [opacity]
 * @returns {string} rgba(...)
 */
export function getLightLevelFillColor(
  level,
  lightColorHex,
  opacity = LIGHT_FILL_OPACITY
) {
  const clamped = clampLightLevel(level);
  if (clamped === null) return "transparent";

  const hex = interpolateHexColor(
    LIGHT_OFF_GREY_HEX,
    lightColorHex,
    clamped
  );
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Resolve Light-mode polygon fill for an area.
 * Prefers light_level gradient; falls back to light_status on/off.
 */
export function resolveLightModeFill(area, lightColorHex) {
  if (isMapProcessorUnreachable(area)) {
    return "transparent";
  }

  const level = clampLightLevel(area?.light_level);
  if (level !== null) {
    return getLightLevelFillColor(level, lightColorHex);
  }

  const light = (area?.light_status || "").toLowerCase().trim();
  if (light === "on") {
    return getLightLevelFillColor(100, lightColorHex);
  }
  if (light === "off") {
    return getLightLevelFillColor(0, lightColorHex);
  }
  return "transparent";
}

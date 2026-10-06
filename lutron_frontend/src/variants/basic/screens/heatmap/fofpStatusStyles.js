// Visual tokens for the live FOFP overlay (Step 7).
//
// One source of truth for marker colors, glow strength, and CSS transition
// timings. Kept pure (no React imports, no DOM access) so it is trivial to
// unit-test and so designers can tweak constants without touching components.
//
// Status convention from the backend:
//   light_level:  0-100 (sole visualization driver for brightness)
//   marker_color: #RRGGBB base hue (brightness modulates S/L above zero)
//   driver_alert / driver_alert_type: when set, solid fault red (light_level / light_status are null)

import {
  DEFAULT_FOFP_MARKER_COLOR,
  hexToGlowColor,
  hexToHue,
  normalizeFofpHex,
} from "./fofpColorUtils";

export const FOFP_COLORS = Object.freeze({
  // light intensity endpoints
  lightOff: "#424242",
  lightFull: "#fdd835",
  // border/outline
  outline: "#ffffff",
  alertFill: "#d32f2f", // solid fill for active driver faults
  outlineAlert: "#d32f2f",
  // glow tints (used as feFlood fill in the SVG filter)
  glowLight: "#ffee58",
});

/** Glow filter buckets every N percent on the 0-100 light_level scale. */
export const FOFP_GLOW_STEP = 5;

export const clampLightLevel = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
};

/**
 * Map raw light_level to a glow filter bucket (5, 10, … 100). Zero = no glow.
 */
export const getGlowBucketLevel = (level) => {
  const clamped = clampLightLevel(level);
  if (clamped <= 0) return 0;
  return Math.max(
    FOFP_GLOW_STEP,
    Math.min(100, Math.round(clamped / FOFP_GLOW_STEP) * FOFP_GLOW_STEP)
  );
};

/** SVG filter id for a light_level (null when off). */
export const getGlowFilterIdForLevel = (level) => {
  const bucket = getGlowBucketLevel(level);
  if (bucket <= 0) return null;
  return `fofp-glow-${bucket}`;
};

/** Glow blur/opacity for a bucket (stronger at higher light_level). */
export const computeGlowFilterSpec = (bucketLevel, baseColorHex) => {
  const bucket = getGlowBucketLevel(bucketLevel);
  const ratio = bucket / 100;
  const color = baseColorHex
    ? hexToGlowColor(normalizeFofpHex(baseColorHex))
    : FOFP_COLORS.glowLight;
  return {
    id: `fofp-glow-${bucket}`,
    color,
    stdDeviation: Number((0.35 + ratio * 3.25).toFixed(2)),
    floodOpacity: Number((0.22 + ratio * 0.63).toFixed(2)),
  };
};

/** True when backend reports an active driver fault for this zone marker. */
export const isFofpDriverAlert = ({ driverAlert, alertColor }) =>
  driverAlert === true || alertColor === "red";

/** Solid red marker — no dimming gradient or glow. */
export const getDriverAlertMarkerStyle = () => ({
  lightLevel: null,
  fill: FOFP_COLORS.alertFill,
  stroke: FOFP_COLORS.outline,
  strokeWidth: 1,
  opacity: 1,
  glowFilterId: null,
});

// Per-marker visual descriptor. Driver alert wins over light_level / light_status.
// Otherwise light_level drives fill brightness; marker_color sets hue when level > 0.
export const getMarkerStyle = ({
  driverAlert,
  alertColor,
  lightLevel,
  lightStatus,
  baseColor,
}) => {
  if (isFofpDriverAlert({ driverAlert, alertColor })) {
    return getDriverAlertMarkerStyle();
  }

  const level =
    lightLevel == null
      ? lightStatus === true
        ? 100
        : 0
      : clampLightLevel(lightLevel);
  const ratio = level / 100;

  if (level === 0) {
    return {
      lightLevel: 0,
      fill: FOFP_COLORS.lightOff,
      stroke: FOFP_COLORS.outline,
      strokeWidth: 1,
      opacity: 0.55,
      glowFilterId: null,
    };
  }

  const hue = hexToHue(normalizeFofpHex(baseColor || DEFAULT_FOFP_MARKER_COLOR));
  const saturation = Math.round(18 + ratio * 82);
  const lightness = Math.round(28 + ratio * 34);
  const fill = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  const opacity = Number((0.35 + ratio * 0.6).toFixed(2));
  const glowFilterId = getGlowFilterIdForLevel(level);

  return {
    lightLevel: level,
    fill,
    stroke: FOFP_COLORS.outline,
    strokeWidth: 1,
    opacity,
    glowFilterId,
  };
};

// CSS transition tokens. Plain strings so they can be applied via inline
// style without pulling in styled-components / emotion. GPU-friendly:
// only color / opacity / filter properties are animated — no layout
// properties (which would force layout passes on every frame).
export const FOFP_TRANSITION = "fill 220ms ease-out, stroke 220ms ease-out, opacity 220ms ease-out, filter 320ms ease-out";

/** All glow filter defs for overlay <defs> (stepped 5–100). */
export const buildFofpGlowFilters = (baseColorHex) => {
  const filters = [];
  for (let bucket = FOFP_GLOW_STEP; bucket <= 100; bucket += FOFP_GLOW_STEP) {
    filters.push(computeGlowFilterSpec(bucket, baseColorHex));
  }
  return filters;
};

export const FOFP_GLOW_FILTERS = Object.freeze(buildFofpGlowFilters());

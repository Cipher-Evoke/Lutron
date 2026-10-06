/**
 * FOFP color helpers — hex storage, HSL for brightness ramps.
 * Pure module (no React) for tests and shared overlay/settings use.
 */

export const DEFAULT_FOFP_MARKER_COLOR = "#FDD835";

const HEX_RE = /^#([0-9A-F]{6})$/i;

export const normalizeFofpHex = (raw) => {
  if (typeof raw !== "string") return DEFAULT_FOFP_MARKER_COLOR;
  const key = raw.trim().toUpperCase();
  if (!HEX_RE.test(key)) return DEFAULT_FOFP_MARKER_COLOR;
  return key;
};

/** Convert HSL string from HexColorPicker to #RRGGBB (same algorithm as Theme page). */
export const hslStringToHex = (hsl) => {
  if (typeof hsl !== "string" || !hsl.trim().toLowerCase().startsWith("hsl")) {
    return null;
  }
  const nums = hsl.match(/\d+/g);
  if (!nums || nums.length < 3) return null;
  const h = Number(nums[0]);
  const s = Number(nums[1]);
  const l = Number(nums[2]);

  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  let r;
  let g;
  let b;

  if (h >= 0 && h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  const toHex = (n) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? `0${hex}` : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

/**
 * Normalize a Theme picker value (hex or hsl) for PUT /fofp/config marker_color.
 */
export const resolveFofpThemePickerColor = (raw) => {
  if (typeof raw !== "string") return DEFAULT_FOFP_MARKER_COLOR;
  const trimmed = raw.trim();
  if (HEX_RE.test(trimmed)) return normalizeFofpHex(trimmed);
  const fromHsl = hslStringToHex(trimmed);
  if (fromHsl) return normalizeFofpHex(fromHsl);
  return DEFAULT_FOFP_MARKER_COLOR;
};

export const hexToRgb = (hex) => {
  const key = normalizeFofpHex(hex).slice(1);
  return {
    r: parseInt(key.slice(0, 2), 16),
    g: parseInt(key.slice(2, 4), 16),
    b: parseInt(key.slice(4, 6), 16),
  };
};

export const rgbToHsl = (r, g, b) => {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case rn:
        h = ((gn - bn) / delta) % 6;
        break;
      case gn:
        h = (bn - rn) / delta + 2;
        break;
      default:
        h = (rn - gn) / delta + 4;
        break;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  return {
    h,
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
};

export const hexToHsl = (hex) => {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHsl(r, g, b);
};

export const hexToHue = (hex) => hexToHsl(hex).h;

/** Brighter tint for SVG glow flood (derived from base marker color). */
export const hexToGlowColor = (hex) => {
  const { h, s, l } = hexToHsl(hex);
  const glowL = Math.min(92, l + 38);
  const glowS = Math.min(100, s + 12);
  return `hsl(${h}, ${glowS}%, ${glowL}%)`;
};

/** Curated palette rows (warm → cool) plus grayscale — Hue-style swatches. */
export const FOFP_PALETTE_ROWS = Object.freeze([
  ["#FF1744", "#F50057", "#E91E63", "#C2185B", "#AD1457", "#880E4F"],
  ["#FF5722", "#FF6F00", "#FF8F00", "#FFA000", "#FFB300", "#FDD835"],
  ["#CDDC39", "#8BC34A", "#4CAF50", "#009688", "#00BCD4", "#03A9F4"],
  ["#2196F3", "#3F51B5", "#673AB7", "#9C27B0", "#E040FB", "#7C4DFF"],
]);

export const FOFP_GRAYSCALE = Object.freeze([
  "#FFFFFF",
  "#ECEFF1",
  "#B0BEC5",
  "#78909C",
  "#546E7A",
  "#263238",
]);

// Color interpolation utilities without any conditional branches
// Convert 6-digit hex to [r,g,b]
export const hexToRgb = (hex) => {
  const h = hex.startsWith('#') ? hex.slice(1) : hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return [r, g, b];
};

// Convert [r,g,b] to 6-digit hex
export const rgbToHex = (r, g, b) => {
  const toHex = (n) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

// Linear interpolation between two numbers
const lerp = (a, b, t) => a + (b - a) * t;

// Clamp x into [min, max] without conditionals
const clamp01 = (x) => Math.min(1, Math.max(0, x));

// Interpolate between two hex colors by percent (0..100)
// No if/else branches; all math-based
export const interpolateHexColor = (startHex, endHex, percent) => {
  const t = clamp01((Number(percent) || 0) / 100);
  const [r1, g1, b1] = hexToRgb(startHex);
  const [r2, g2, b2] = hexToRgb(endHex);
  const r = Math.round(lerp(r1, r2, t));
  const g = Math.round(lerp(g1, g2, t));
  const b = Math.round(lerp(b1, b2, t));
  return rgbToHex(r, g, b);
};

// Find the largest element in an array
export const arraylargest = (arr) => {
  if (!Array.isArray(arr) || arr.length === 0) return undefined;
  return Math.max(...arr);
};



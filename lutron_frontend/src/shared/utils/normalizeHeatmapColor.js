const DEFAULT_HEATMAP_COLOR = '#e88330';

function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
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
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Parse theme/API colors for heatmap rendering without throwing on bad HSL. */
export function normalizeHeatmapColor(color, fallback = DEFAULT_HEATMAP_COLOR) {
  if (!color) return fallback;

  if (typeof color === 'string' && color.startsWith('hsl')) {
    const matches = color.match(/\d+/g);
    if (!matches || matches.length < 3) return fallback;
    const [h, s, l] = matches.map(Number);
    return hslToHex(h, s, l);
  }

  if (typeof color === 'string' && color.startsWith('#')) {
    return color;
  }

  return fallback;
}

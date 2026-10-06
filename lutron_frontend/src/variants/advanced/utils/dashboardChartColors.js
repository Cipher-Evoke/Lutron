import { hexToHsl, hslToHex } from './colorScale';
import { normalizeThemeHex, usesCustomApplicationTheme } from './themePageBackground';

const GOLDEN_ANGLE = 137.508;

export { GOLDEN_ANGLE };

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash);
}

function getBaseHsl(background) {
  const baseHex = normalizeThemeHex(background) || '#6f809d';
  const { h, s } = hexToHsl(baseHex);
  return {
    h,
    saturation: Math.min(88, Math.max(48, s + 20)),
  };
}

/**
 * Custom hex-picker themes only — preset Gold / Blue / Brown keep fixed chart colors.
 */
export function usesThemeAwareChartColors(background) {
  return usesCustomApplicationTheme(background);
}

/** White outline on inner metric panels (LPD, peak/min load & utilization) — all themes. */
export function getThemeAwareMetricPanelBorder(_background) {
  return '1px solid rgba(255, 255, 255, 0.85)';
}

/**
 * Pie/donut leader-line labels: white text on all advanced cards (preset + custom)
 * so % labels stay readable on dark theme backgrounds. Leader lines keep segment color.
 */
export function resolvePieChartLabelColors(_background, segmentColor) {
  return {
    textFill: '#ffffff',
    lineStroke: segmentColor,
    textShadow: '0 1px 4px rgba(0, 0, 0, 0.9)',
  };
}

/**
 * Build N visible chart colors from a custom theme background (light tints on dark cards).
 * Returns null for Gold / Blue / Brown presets.
 */
export function buildThemeAwareChartPalette(
  background,
  count,
  { hueOffset = 0, lightnessMin = 70, lightnessMax = 88, hueSpread = 28 } = {}
) {
  if (!usesCustomApplicationTheme(background) || count <= 0) {
    return null;
  }

  const { h, saturation } = getBaseHsl(background);
  const colors = [];

  for (let i = 0; i < count; i += 1) {
    const hue = (h + hueOffset + i * hueSpread) % 360;
    const t = count <= 1 ? 0.5 : i / (count - 1);
    const lightness = Math.round(lightnessMin + t * (lightnessMax - lightnessMin));
    colors.push(hslToHex(hue, saturation, lightness));
  }

  return colors;
}

export function getThemeAwareConsumptionLineColors(background) {
  return buildThemeAwareChartPalette(background, 4, {
    hueOffset: 18,
    lightnessMin: 68,
    lightnessMax: 82,
    hueSpread: GOLDEN_ANGLE,
  });
}

export function getThemeAwareSavingsLineColors(background) {
  return buildThemeAwareChartPalette(background, 4, {
    hueOffset: -18,
    lightnessMin: 70,
    lightnessMax: 86,
    hueSpread: GOLDEN_ANGLE,
  });
}

export function getThemeAwarePieColors(background, count = 8) {
  return buildThemeAwareChartPalette(background, count, {
    lightnessMin: 72,
    lightnessMax: 88,
    hueSpread: 22,
  });
}

export function getThemeAwareLineSeriesColor(background, index = 0) {
  const palette = buildThemeAwareChartPalette(background, Math.max(index + 1, 4));
  return palette ? palette[index % palette.length] : null;
}

export function getThemeAwareStackedBarPair(background) {
  if (!usesCustomApplicationTheme(background)) {
    return null;
  }

  const { h, saturation } = getBaseHsl(background);
  const sat = Math.min(85, saturation);

  return {
    unoccupied: hslToHex((h + 32) % 360, sat, 74),
    occupied: hslToHex((h + 360 - 28) % 360, sat, 72),
  };
}

/**
 * Custom hex-picker themes only — preset Gold / Blue / Brown keep fixed chart colors.
 */
export function getThemeAwareSavingsStrategyColor(strategyName, background) {
  if (!usesCustomApplicationTheme(background)) {
    return null;
  }

  const normalizedName = String(strategyName || '').toLowerCase().trim();
  const { h, saturation } = getBaseHsl(background);

  if (normalizedName === 'consumption' || normalizedName.includes('consumption')) {
    const consumptionHue = (h + 28) % 360;
    return hslToHex(consumptionHue, saturation, 76);
  }

  const hash = hashString(normalizedName);
  const hueShift = (hash % 5) * 18;
  const savingsHue = (h + hueShift) % 360;
  const lightness = 78 + (hash % 3) * 4;

  return hslToHex(savingsHue, saturation, lightness);
}

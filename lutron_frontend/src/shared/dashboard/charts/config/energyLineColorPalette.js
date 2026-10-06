const DIVERSE_COLORS = [
  '#e57373', '#64b5f6', '#81c784', '#ffd54f', '#ba68c8', '#4db6ac',
  '#ff8a65', '#7986cb', '#aed581', '#ffb74d', '#f06292', '#4fc3f7',
  '#81c784', '#fff176', '#e1bee7', '#b2dfdb', '#ffcc02', '#ff8a80',
  '#82b1ff', '#b9f6ca', '#ffe082', '#d1c4e9', '#c8e6c9', '#ffcdd2',
  '#bbdefb', '#c5cae9', '#f8bbd9', '#dcedc8', '#fff9c4', '#ffecb3',
];

const GREEN_COMBINED = [
  '#10B981', '#059669', '#047857', '#065f46', '#064e3b', '#22C55E',
  '#16A34A', '#15803D', '#166534', '#14532D', '#052e16', '#0f172a',
];

const SAVINGS_LINE_COLORS = [
  '#50c878', '#10B981', '#059669', '#90EE90', '#98FB98', '#87CEEB',
  '#22C55E', '#16A34A', '#4ade80', '#6ee7b7', '#047857', '#065f46',
];

const RED_COMBINED = [
  '#EF4444', '#DC2626', '#B91C1C', '#991B1B', '#7f1d1d', '#F87171',
  '#FCA5A5', '#FECACA', '#FEE2E2', '#FEF2F2', '#450a0a', '#7f1d1d',
];

function expandPalette(base, count) {
  if (count <= base.length) return base.slice(0, count);
  const additional = [];
  for (let i = base.length; i < count; i++) {
    const hue = (i * 137.508) % 360;
    const saturation = 60 + (i % 20);
    const lightness = 50 + (i % 20);
    additional.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
  }
  return [...base, ...additional];
}

/**
 * Series color palette for energy line charts.
 * @param {number} count - colors needed
 * @param {{ chartKind: 'consumption'|'savings'|'other', selectedAreaCount: number, resolveThemePalette?: (count: number) => string[]|null }} options
 */
export function generateEnergyLineColorPalette(count, options = {}) {
  const { chartKind = 'other', selectedAreaCount = 0, resolveThemePalette } = options;
  const isSavings = chartKind === 'savings' || chartKind === 'other';
  const isConsumption = chartKind === 'consumption';

  if (isSavings && selectedAreaCount >= 5) {
    const themePalette = resolveThemePalette?.(count, { hueOffset: -18 });
    if (themePalette) return themePalette;
    return GREEN_COMBINED.slice(0, count);
  }

  if (isConsumption && selectedAreaCount >= 5) {
    const themePalette = resolveThemePalette?.(count, { hueOffset: 18 });
    if (themePalette) return themePalette;
    return RED_COMBINED.slice(0, count);
  }

  const themePalette = resolveThemePalette?.(count, { hueSpread: count > 4 ? 137.508 : 22 });
  if (themePalette) return themePalette;

  if (selectedAreaCount < 5) {
    if (isSavings) {
      return expandPalette(SAVINGS_LINE_COLORS, count);
    }
    return expandPalette(DIVERSE_COLORS, count);
  }

  if (selectedAreaCount >= 5) {
    if (isSavings) {
      return Array(count).fill('#064e3b').map((_, i) =>
        ['#10B981', '#059669', '#047857', '#065f46', '#064e3b'][i] || '#064e3b'
      );
    }
    if (isConsumption) {
      return Array(count).fill('#7f1d1d').map((_, i) =>
        ['#EF4444', '#DC2626', '#B91C1C', '#991B1B', '#7f1d1d'][i] || '#7f1d1d'
      );
    }
  }

  return expandPalette(DIVERSE_COLORS, count);
}

export function resolveEnergyLineChartKind({ title, legendSeriesName }) {
  if (legendSeriesName != null) {
    return /saving/i.test(String(legendSeriesName)) ? 'savings' : 'consumption';
  }
  if (title === 'Consumption') return 'consumption';
  if (title === 'Savings') return 'savings';
  return 'other';
}

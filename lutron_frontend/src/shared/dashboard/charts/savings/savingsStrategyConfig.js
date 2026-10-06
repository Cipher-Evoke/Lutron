/** @typedef {import('../types/savingsStrategyChartTypes').SavingsStrategyPieRow} SavingsStrategyPieRow */

export const SAVINGS_STRATEGY_PIE_LAYOUT = {
  margin: { top: 56, right: 140, bottom: 56, left: 140 },
  cx: '44%',
  cy: '50%',
  innerRadius: 55,
  outerRadius: 95,
  paddingAngle: 5,
  labelRadiusOffset: 28,
  labelLineInset: 5,
  centerLabelFontSize: 30,
  minAngle: 1,
};

const EMBEDDED_LIGHT_MAP = {
  usage: '#0F6CBD',
  tuning: '#3E4AAE',
  occupancy: '#2F7E8A',
  schedules: '#2A86C0',
  schedule: '#2A86C0',
  'load shed': '#6E8F2D',
  saving: '#6E8F2D',
  savings: '#6E8F2D',
  daylighting: '#6B7280',
  daylight: '#6B7280',
  'personal control': '#7C3AED',
  keypad: '#7C3AED',
  sensors: '#2A86C0',
  gui: '#6B7280',
  consumption: '#9CA3AF',
};

const EMBEDDED_LIGHT_FALLBACK = ['#0F6CBD', '#3E4AAE', '#2F7E8A', '#2A86C0', '#6E8F2D', '#7C3AED', '#6B7280'];

const STANDALONE_DARK_MAP = {
  keypad: '#4CAF50',
  sensors: '#2196F3',
  schedule: '#FF9800',
  gui: '#9C27B0',
  'combined areas': '#4CAF50',
  'selected areas': '#FFC107',
  manual: '#00BCD4',
  automatic: '#E91E63',
  daylight: '#00ACC1',
  occupancy: '#7B1FA2',
  timer: '#43A047',
  scene: '#F4511E',
};

const STANDALONE_DARK_FALLBACK = [
  '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#E91E63', '#00BCD4', '#FFC107', '#E53935',
  '#00ACC1', '#7B1FA2', '#43A047', '#F4511E', '#5C6BC0', '#AD1457', '#00897B', '#D84315',
];

function hashName(normalizedName) {
  let hash = 0;
  for (let i = 0; i < normalizedName.length; i++) {
    hash = ((hash << 5) - hash + normalizedName.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash);
}

/**
 * @param {string} strategyName
 * @param {{ paletteProfile?: string, resolveThemeColor?: (name: string) => string|null }} [options]
 */
export function resolveSavingsStrategyColor(strategyName, options = {}) {
  const { paletteProfile = 'standalone-dark', resolveThemeColor } = options;
  const normalizedName = String(strategyName || '').toLowerCase().trim();

  if (paletteProfile === 'theme-aware' && resolveThemeColor) {
    const themeColor = resolveThemeColor(strategyName);
    if (themeColor) return themeColor;
  }

  if (paletteProfile === 'embedded-light') {
    if (EMBEDDED_LIGHT_MAP[normalizedName]) return EMBEDDED_LIGHT_MAP[normalizedName];
    return EMBEDDED_LIGHT_FALLBACK[hashName(normalizedName) % EMBEDDED_LIGHT_FALLBACK.length];
  }

  if (normalizedName === 'consumption' || normalizedName.includes('consumption')) {
    return '#E53935';
  }

  if (STANDALONE_DARK_MAP[normalizedName]) return STANDALONE_DARK_MAP[normalizedName];
  return STANDALONE_DARK_FALLBACK[hashName(normalizedName) % STANDALONE_DARK_FALLBACK.length];
}

/**
 * @param {SavingsStrategyPieRow[]} pieData
 */
export function calculateSavingsCenterLabelValue(pieData) {
  if (!pieData?.length) return 0;
  return pieData
    .filter((d) => d.name.toLowerCase() !== 'consumption')
    .reduce((sum, d) => sum + d.value, 0);
}

export function formatSavingsStrategyTooltipValue(value) {
  return `${Number(value).toFixed(2)}%`;
}

export const SAVINGS_STRATEGY_EMPTY_NULL_MESSAGE =
  'No data available for the selected areas and time range';

export const SAVINGS_STRATEGY_EMPTY_ZERO_MESSAGE =
  'No savings data available for the selected areas and time range';

export const SAVINGS_STRATEGY_CUSTOM_RANGE_PLACEHOLDER = [{ name: '_range_placeholder', value: 100 }];

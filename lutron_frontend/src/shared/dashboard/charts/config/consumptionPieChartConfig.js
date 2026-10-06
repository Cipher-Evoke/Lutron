/** @typedef {import('../types/consumptionPieChartTypes').ConsumptionPieRow} ConsumptionPieRow */

export const DEFAULT_CONSUMPTION_PIE_COLORS = [
  '#E53935',
  '#2196F3',
  '#4CAF50',
  '#FF9800',
  '#9C27B0',
  '#E91E63',
  '#00BCD4',
  '#FFC107',
];

export const CONSUMPTION_PIE_LAYOUT = {
  margin: { top: 80, right: 140, bottom: 80, left: 140 },
  cx: '44%',
  cy: '52%',
  innerRadius: 60,
  outerRadius: 110,
  paddingAngle: 5,
  labelRadiusOffset: 35,
  labelLineInset: 5,
  minVisiblePercent: 0.01,
  centerLabelValue: '100 %',
  centerLabelFontSize: 34,
};

/**
 * @param {number} count
 * @param {{ resolveThemePalette?: (count: number) => string[]|null }} [options]
 * @returns {string[]}
 */
export function resolveConsumptionPieSegmentColors(count, options = {}) {
  const { resolveThemePalette } = options;
  const themePalette = resolveThemePalette?.(count);
  if (themePalette && themePalette.length > 0) {
    return themePalette;
  }
  if (count <= DEFAULT_CONSUMPTION_PIE_COLORS.length) {
    return DEFAULT_CONSUMPTION_PIE_COLORS.slice(0, count);
  }
  return DEFAULT_CONSUMPTION_PIE_COLORS;
}

/**
 * @param {import('../types/consumptionPieChartTypes').ConsumptionPieRow[]} pieData
 * @param {string} name
 */
export function formatConsumptionPieTooltipValue(pieData, name) {
  const item = pieData.find((row) => row.name === name);
  return `${item?.actual_energy} (${item?.consumption_percentage})`;
}

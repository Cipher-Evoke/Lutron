export const UNIFIED_ENERGY_WIDGET_MODES = {
  consumption: 'consumption',
  savings: 'savings',
};

export const UNIFIED_ENERGY_WIDGET_KEYS = {
  consumption: 'consumption',
  savings: 'savings',
};

export function resolveUnifiedEnergyChartType(mode) {
  return mode === UNIFIED_ENERGY_WIDGET_MODES.consumption ? 'consumption' : 'other';
}

export function resolveUnifiedEnergyLegendSeriesName(mode, title) {
  if (mode === UNIFIED_ENERGY_WIDGET_MODES.consumption) {
    return title;
  }
  return title;
}

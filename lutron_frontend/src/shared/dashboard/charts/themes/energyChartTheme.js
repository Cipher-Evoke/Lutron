/** @typedef {import('../views/energyLineChartTypes').EnergyChartThemeTokens} EnergyChartThemeTokens */

export const ENERGY_CHART_THEME_PRESETS = {
  basicDark: 'basic-dark',
  basicLight: 'basic-light',
  advanced: 'advanced',
  customized: 'customized',
};

/**
 * @param {{ preset?: string, chartSurface?: string }} options
 * @returns {EnergyChartThemeTokens}
 */
export function resolveEnergyChartTheme(options = {}) {
  const { preset, chartSurface = 'dark' } = options;
  const light = chartSurface === 'light' || preset === ENERGY_CHART_THEME_PRESETS.basicLight;

  if (light) {
    return {
      preset: ENERGY_CHART_THEME_PRESETS.basicLight,
      plotBg: '#ffffff',
      outerBg: '#ffffff',
      outerBorder: '1px solid #e8e8e8',
      plotBorder: '1px solid #e0e0e0',
      tick: '#000000',
      axis: '#000000',
      grid: 'rgba(0, 0, 0, 0.15)',
      header: '#000000',
      tooltipBg: '#ffffff',
      tooltipBorder: '1px solid rgba(0,0,0,0.2)',
      tooltipText: 'rgba(0, 0, 0, 0.87)',
      tooltipTitleBorder: 'rgba(0, 0, 0, 0.2)',
      exportBtn: '#1565C0',
      dropdownBg: '#ffffff',
      dropdownBorder: '1px solid rgba(0,0,0,0.15)',
      dropdownText: 'rgba(0, 0, 0, 0.87)',
      dropdownMuted: 'rgba(0, 0, 0, 0.45)',
      dropdownSep: 'rgba(0, 0, 0, 0.12)',
      legend: '#000000',
      cursor: 'rgba(0, 0, 0, 0.35)',
      dotStroke: 'rgba(0, 0, 0, 0.35)',
      activeDotStroke: '#000000',
      emptyText: 'rgba(0, 0, 0, 0.7)',
      useCssTooltipVars: false,
    };
  }

  if (preset === ENERGY_CHART_THEME_PRESETS.advanced) {
    return {
      preset: ENERGY_CHART_THEME_PRESETS.advanced,
      plotBg: 'transparent',
      outerBg: undefined,
      outerBorder: undefined,
      plotBorder: '1px solid #ddd',
      tick: '#ffffff',
      axis: '#ffffff',
      grid: '#ffffff',
      header: '#ffffff',
      tooltipBg: undefined,
      tooltipBorder: undefined,
      tooltipText: '#fff',
      tooltipTitleBorder: 'var(--dashboard-chart-tooltip-border-color, #ffffff)',
      exportBtn: '#fff',
      dropdownBg: undefined,
      dropdownBorder: undefined,
      dropdownText: undefined,
      dropdownMuted: undefined,
      dropdownSep: undefined,
      legend: '#ffffff',
      cursor: '#fff',
      dotStroke: '#fff',
      activeDotStroke: '#fff',
      emptyText: '#fff',
      useCssTooltipVars: true,
    };
  }

  if (preset === ENERGY_CHART_THEME_PRESETS.customized) {
    return {
      preset: ENERGY_CHART_THEME_PRESETS.customized,
      plotBg: undefined,
      outerBg: undefined,
      outerBorder: undefined,
      plotBorder: undefined,
      tick: '#fff',
      axis: '#fff',
      grid: '#fff',
      header: '#fff',
      tooltipBg: '#807864',
      tooltipBorder: '1px solid #fff',
      tooltipText: '#fff',
      tooltipTitleBorder: '#fff',
      exportBtn: '#fff',
      dropdownBg: '#CDC0A0',
      dropdownBorder: '1px solid #444',
      dropdownText: '#fff',
      dropdownMuted: '#999',
      dropdownSep: '1px solid #444',
      legend: '#fff',
      cursor: '#fff',
      dotStroke: '#fff',
      activeDotStroke: '#fff',
      emptyText: '#fff',
      useCssTooltipVars: false,
    };
  }

  return {
    preset: ENERGY_CHART_THEME_PRESETS.basicDark,
    plotBg: '#767061',
    outerBg: 'rgba(128, 120, 100, 0.6)',
    outerBorder: '1px solid #ccc',
    plotBorder: '1px solid #ddd',
    tick: '#ffffff',
    axis: '#ffffff',
    grid: '#ffffff',
    header: '#ffffff',
    tooltipBg: '#807864',
    tooltipBorder: '1px solid #fff',
    tooltipText: '#fff',
    tooltipTitleBorder: '#fff',
    exportBtn: '#fff',
    dropdownBg: '#ffffff',
    dropdownBorder: '1px solid rgba(0,0,0,0.15)',
    dropdownText: 'rgba(0, 0, 0, 0.87)',
    dropdownMuted: 'rgba(0, 0, 0, 0.45)',
    dropdownSep: 'rgba(0, 0, 0, 0.12)',
    legend: '#ffffff',
    cursor: '#fff',
    dotStroke: '#fff',
    activeDotStroke: '#fff',
    emptyText: '#fff',
    useCssTooltipVars: false,
  };
}

/** @typedef {import('../types/consumptionPieChartTypes').PieChartThemeTokens} PieChartThemeTokens */

export const PIE_CHART_THEME_PRESETS = {
  basicDark: 'basic-dark',
  basicLight: 'basic-light',
  advanced: 'advanced',
  customized: 'customized',
};

/**
 * @param {{ preset?: string, chartSurface?: string }} options
 * @returns {PieChartThemeTokens}
 */
export function resolvePieChartTheme(options = {}) {
  const { preset, chartSurface = 'dark' } = options;
  const light = chartSurface === 'light' || preset === PIE_CHART_THEME_PRESETS.basicLight;

  if (light) {
    return {
      preset: PIE_CHART_THEME_PRESETS.basicLight,
      outerBg: '#ffffff',
      outerBorder: '1px solid #e8e8e8',
      plotBg: '#ffffff',
      plotBorder: '1px solid #e0e0e0',
      header: '#000000',
      exportBtn: '#1565C0',
      dropdownBg: '#ffffff',
      dropdownBorder: '1px solid rgba(0,0,0,0.15)',
      dropdownText: 'rgba(0, 0, 0, 0.87)',
      dropdownMuted: 'rgba(0, 0, 0, 0.45)',
      dropdownSep: 'rgba(0, 0, 0, 0.12)',
      tooltipBg: '#ffffff',
      tooltipBorder: '1px solid rgba(0,0,0,0.2)',
      tooltipText: 'rgba(0, 0, 0, 0.87)',
      legend: '#000000',
      centerLabel: '#000000',
      emptyText: 'rgba(0, 0, 0, 0.7)',
      centerLabelShadow: false,
      useCssTooltipVars: false,
    };
  }

  if (preset === PIE_CHART_THEME_PRESETS.advanced) {
    return {
      preset: PIE_CHART_THEME_PRESETS.advanced,
      plotBg: 'transparent',
      plotBorder: '1px solid #ddd',
      header: '#ffffff',
      exportBtn: '#fff',
      tooltipBg: undefined,
      tooltipBorder: undefined,
      tooltipText: '#fff',
      legend: '#ffffff',
      centerLabel: '#fff',
      emptyText: '#fff',
      centerLabelShadow: true,
      useCssTooltipVars: true,
    };
  }

  if (preset === PIE_CHART_THEME_PRESETS.customized) {
    return {
      preset: PIE_CHART_THEME_PRESETS.customized,
      header: '#fff',
      exportBtn: '#fff',
      dropdownBg: '#CDC0A0',
      dropdownBorder: '1px solid #444',
      dropdownText: '#fff',
      dropdownMuted: '#999',
      dropdownSep: '1px solid #444',
      tooltipBg: '#807864',
      tooltipBorder: '1px solid #fff',
      tooltipText: '#fff',
      legend: '#fff',
      centerLabel: '#fff',
      emptyText: '#fff',
      errorText: '#ffeb3b',
      centerLabelShadow: true,
      useCssTooltipVars: false,
    };
  }

  return {
    preset: PIE_CHART_THEME_PRESETS.basicDark,
    header: '#ffffff',
    exportBtn: '#fff',
    dropdownBg: '#ffffff',
    dropdownBorder: '1px solid rgba(0,0,0,0.15)',
    dropdownText: 'rgba(0, 0, 0, 0.87)',
    dropdownMuted: 'rgba(0, 0, 0, 0.45)',
    dropdownSep: 'rgba(0, 0, 0, 0.12)',
    tooltipBg: '#807864',
    tooltipBorder: '1px solid #fff',
    tooltipText: '#fff',
    legend: '#ffffff',
    centerLabel: '#fff',
    emptyText: '#fff',
    centerLabelShadow: true,
    useCssTooltipVars: false,
  };
}

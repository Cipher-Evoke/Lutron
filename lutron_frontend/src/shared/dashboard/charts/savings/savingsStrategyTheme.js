/** @typedef {import('../types/savingsStrategyChartTypes').SavingsStrategyThemeTokens} SavingsStrategyThemeTokens */

export const SAVINGS_STRATEGY_THEME_PRESETS = {
  basicDark: 'basic-dark',
  basicLight: 'basic-light',
  basicEmbedded: 'basic-embedded',
  advanced: 'advanced',
  customized: 'customized',
};

/**
 * @param {{ preset?: string, chartSurface?: string, embedded?: boolean }} options
 * @returns {SavingsStrategyThemeTokens}
 */
export function resolveSavingsStrategyTheme(options = {}) {
  const { preset, chartSurface = 'dark', embedded = false } = options;
  const light = chartSurface === 'light' || preset === SAVINGS_STRATEGY_THEME_PRESETS.basicLight;

  if (embedded || preset === SAVINGS_STRATEGY_THEME_PRESETS.basicEmbedded) {
    return {
      preset: SAVINGS_STRATEGY_THEME_PRESETS.basicEmbedded,
      header: '#1565C0',
      chromeText: '#111827',
      centerLabel: '#111827',
      legend: '#111827',
      tooltipBg: '#ffffff',
      tooltipBorder: '1px solid #e5e7eb',
      tooltipText: '#111827',
      centerLabelShadow: false,
      labelTextShadow: 'none',
      useCssTooltipVars: false,
      paletteProfile: 'embedded-light',
    };
  }

  if (light) {
    return {
      preset: SAVINGS_STRATEGY_THEME_PRESETS.basicLight,
      outerBg: '#ffffff',
      outerBorder: '1px solid #e8e8e8',
      plotBg: '#ffffff',
      plotBorder: '1px solid #e0e0e0',
      header: '#000000',
      chromeText: '#000000',
      centerLabel: '#000000',
      legend: '#111827',
      tooltipBg: '#ffffff',
      tooltipBorder: '1px solid #e5e7eb',
      tooltipText: '#111827',
      centerLabelShadow: false,
      labelTextShadow: 'none',
      useCssTooltipVars: false,
      paletteProfile: 'embedded-light',
    };
  }

  if (preset === SAVINGS_STRATEGY_THEME_PRESETS.advanced) {
    return {
      preset: SAVINGS_STRATEGY_THEME_PRESETS.advanced,
      header: '#ffffff',
      chromeText: '#ffffff',
      centerLabel: '#fff',
      legend: '#fff',
      tooltipText: '#ffffff',
      centerLabelShadow: true,
      labelTextShadow: '1px 1px 2px rgba(0,0,0,0.8)',
      useCssTooltipVars: true,
      paletteProfile: 'theme-aware',
    };
  }

  if (preset === SAVINGS_STRATEGY_THEME_PRESETS.customized) {
    return {
      preset: SAVINGS_STRATEGY_THEME_PRESETS.customized,
      header: '#fff',
      chromeText: '#fff',
      centerLabel: '#fff',
      legend: '#fff',
      tooltipBg: '#807864',
      tooltipBorder: '1px solid #fff',
      tooltipText: '#fff',
      centerLabelShadow: true,
      labelTextShadow: '1px 1px 2px rgba(0,0,0,0.8)',
      useCssTooltipVars: false,
      paletteProfile: 'standalone-dark',
    };
  }

  return {
    preset: SAVINGS_STRATEGY_THEME_PRESETS.basicDark,
    header: '#ffffff',
    chromeText: '#ffffff',
    centerLabel: '#fff',
    legend: '#fff',
    tooltipBg: '#807864',
    tooltipBorder: '1px solid #fff',
    tooltipText: '#fff',
    centerLabelShadow: true,
    labelTextShadow: '1px 1px 2px rgba(0,0,0,0.8)',
    useCssTooltipVars: false,
    paletteProfile: 'standalone-dark',
  };
}

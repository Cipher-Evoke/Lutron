export const SPACE_LINE_CHART_THEME_PRESETS = {
  basic: 'basic',
  advanced: 'advanced',
  customized: 'customized',
};

const ADVANCED_CARD = {
  plotBg: null,
  plotBorder: '1px solid #ddd',
  plotCardBg: 'CARD_BACKGROUND',
  grid: '#fff',
  axis: '#fff',
  tick: '#fff',
  yLabel: '#fff',
  tooltipBg: 'CARD_BACKGROUND',
  tooltipText: '#fff',
  tooltipBorder: '1px solid #fff',
  tooltipHeadBorder: '#fff',
  cursor: '#fff',
  seriesColor: null,
  seriesStrokeWidth: 2,
  dotStroke: '#fff',
  areaFill: null,
  areaFillOpacity: 0,
  emptyBg: 'CARD_BACKGROUND',
  emptyColor: '#fff',
  spinOuter: '#555',
  spinTop: '#fff',
};

const CUSTOMIZED_BUILTIN = {
  plotBg: '#767061',
  plotBorder: '1px solid #ddd',
  plotCardBg: null,
  grid: '#fff',
  axis: '#fff',
  tick: '#fff',
  yLabel: '#fff',
  tooltipBg: '#807864',
  tooltipText: '#fff',
  tooltipBorder: '1px solid #fff',
  tooltipHeadBorder: '#fff',
  cursor: '#fff',
  seriesColor: '#87CEEB',
  seriesColorFullscreen: '#00B0FF',
  seriesStrokeWidth: 2,
  seriesStrokeWidthFullscreen: 4,
  dotStroke: '#fff',
  areaFill: null,
  areaFillOpacity: 0,
  emptyBg: '#767061',
  emptyColor: '#fff',
  spinOuter: '#555',
  spinTop: '#fff',
};

/**
 * Resolve chart theme tokens for Space utilization line/area chart.
 * Basic passes dynamic spaceShell from parent; advanced/customized use presets.
 */
export function resolveSpaceLineChartTheme({
  preset = SPACE_LINE_CHART_THEME_PRESETS.basic,
  spaceShell = null,
  lineSeriesColor = null,
  isFullscreen = false,
  cardBackground = null,
  cardBorder = null,
  cardShadow = null,
} = {}) {
  if (preset === SPACE_LINE_CHART_THEME_PRESETS.basic && spaceShell) {
    return {
      preset,
      chartRenderMode: 'area',
      plotHeightStyle: 'basicFixed280',
      plotBg: spaceShell.plotBg,
      plotBorder: spaceShell.plotBorder,
      grid: spaceShell.grid,
      axis: spaceShell.axis,
      tick: spaceShell.tick,
      yLabel: spaceShell.yLabel,
      tooltipBg: spaceShell.tooltipBg,
      tooltipText: spaceShell.tooltipText,
      tooltipBorder: spaceShell.tooltipBorder,
      tooltipHeadBorder: spaceShell.tooltipHeadBorder,
      cursor: spaceShell.cursor,
      seriesColor: spaceShell.areaStroke,
      seriesFill: spaceShell.areaFill,
      seriesStrokeWidth: 2,
      dotStroke: spaceShell.dotStroke,
      areaFillOpacity: 0.55,
      emptyBg: spaceShell.emptyBg,
      emptyColor: spaceShell.emptyColor,
      spinOuter: spaceShell.spinOuter,
      spinTop: spaceShell.spinTop,
      shellStyle: {},
    };
  }

  if (preset === SPACE_LINE_CHART_THEME_PRESETS.advanced) {
    const shellStyle = {
      background: cardBackground,
      border: cardBorder,
      boxShadow: cardShadow,
    };
    return {
      preset,
      chartRenderMode: 'line',
      plotHeightStyle: 'fixed350',
      plotBg: null,
      plotBorder: ADVANCED_CARD.plotBorder,
      grid: ADVANCED_CARD.grid,
      axis: ADVANCED_CARD.axis,
      tick: ADVANCED_CARD.tick,
      yLabel: ADVANCED_CARD.yLabel,
      tooltipBg: 'var(--dashboard-chart-tooltip-bg, #3d4a5c)',
      tooltipText: 'var(--dashboard-chart-tooltip-text, #ffffff)',
      tooltipBorder: '1px solid var(--dashboard-chart-tooltip-border-color, #ffffff)',
      tooltipHeadBorder: 'var(--dashboard-chart-tooltip-border-color, #ffffff)',
      useCssTooltipVars: true,
      cursor: ADVANCED_CARD.cursor,
      seriesColor: lineSeriesColor || '#87CEEB',
      seriesFill: lineSeriesColor || '#87CEEB',
      seriesStrokeWidth: ADVANCED_CARD.seriesStrokeWidth,
      dotStroke: ADVANCED_CARD.dotStroke,
      areaFillOpacity: 0,
      emptyBg: cardBackground,
      emptyColor: ADVANCED_CARD.emptyColor,
      spinOuter: ADVANCED_CARD.spinOuter,
      spinTop: ADVANCED_CARD.spinTop,
      shellStyle,
    };
  }

  if (preset === SPACE_LINE_CHART_THEME_PRESETS.customized) {
    const seriesColor = isFullscreen
      ? CUSTOMIZED_BUILTIN.seriesColorFullscreen
      : CUSTOMIZED_BUILTIN.seriesColor;
    const seriesStrokeWidth = isFullscreen
      ? CUSTOMIZED_BUILTIN.seriesStrokeWidthFullscreen
      : CUSTOMIZED_BUILTIN.seriesStrokeWidth;
    return {
      preset,
      chartRenderMode: 'line',
      plotHeightStyle: 'flexFill',
      plotBg: CUSTOMIZED_BUILTIN.plotBg,
      plotBorder: CUSTOMIZED_BUILTIN.plotBorder,
      grid: CUSTOMIZED_BUILTIN.grid,
      axis: CUSTOMIZED_BUILTIN.axis,
      tick: CUSTOMIZED_BUILTIN.tick,
      yLabel: CUSTOMIZED_BUILTIN.yLabel,
      tooltipBg: CUSTOMIZED_BUILTIN.tooltipBg,
      tooltipText: CUSTOMIZED_BUILTIN.tooltipText,
      tooltipBorder: CUSTOMIZED_BUILTIN.tooltipBorder,
      tooltipHeadBorder: CUSTOMIZED_BUILTIN.tooltipHeadBorder,
      cursor: CUSTOMIZED_BUILTIN.cursor,
      seriesColor,
      seriesFill: seriesColor,
      seriesStrokeWidth,
      dotStroke: CUSTOMIZED_BUILTIN.dotStroke,
      areaFillOpacity: 0,
      emptyBg: CUSTOMIZED_BUILTIN.emptyBg,
      emptyColor: CUSTOMIZED_BUILTIN.emptyColor,
      spinOuter: CUSTOMIZED_BUILTIN.spinOuter,
      spinTop: CUSTOMIZED_BUILTIN.spinTop,
      shellStyle: {},
    };
  }

  return resolveSpaceLineChartTheme({ preset: SPACE_LINE_CHART_THEME_PRESETS.basic, spaceShell });
}

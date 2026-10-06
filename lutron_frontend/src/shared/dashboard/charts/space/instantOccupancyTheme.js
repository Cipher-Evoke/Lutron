export const INSTANT_OCCUPANCY_THEME_PRESETS = {
  basic: 'basic',
  advanced: 'advanced',
  customized: 'customized',
};

const BASIC_SURFACE = {
  plotBg: '#ffffff',
  plotBorder: '#e0e0e0',
  grid: 'rgba(0, 0, 0, 0.12)',
  axis: '#111827',
  tick: '#111827',
  yLabel: '#111827',
  tooltipBg: '#ffffff',
  tooltipText: 'rgba(0, 0, 0, 0.87)',
  tooltipBorder: 'rgba(0,0,0,0.12)',
  tooltipHeadBorder: 'rgba(0,0,0,0.12)',
  line: '#1565C0',
  dotStroke: '#ffffff',
  cursor: 'rgba(0, 0, 0, 0.28)',
  shellBg: '#ffffff',
  shellText: 'rgba(0, 0, 0, 0.87)',
  spinOuter: '#e0e0e0',
  spinTop: '#1565C0',
  shellBorder: '#e0e0e0',
};

export function resolveInstantOccupancyTheme({
  preset = INSTANT_OCCUPANCY_THEME_PRESETS.basic,
  chartSurface = 'dark',
  lineSeriesColor = null,
  isFullscreen = false,
  cardBackground = null,
  cardBorder = null,
  cardShadow = null,
  showChartsTab = false,
} = {}) {
  if (preset === INSTANT_OCCUPANCY_THEME_PRESETS.basic) {
    return {
      preset,
      chartRenderMode: 'area',
      plotHeightStyle: showChartsTab ? 'basicInstantChartsTabClamp' : 'basicFixed280',
      chartSurface,
      ...BASIC_SURFACE,
      areaFillOpacity: 0.55,
      shellStyle: {},
    };
  }

  if (preset === INSTANT_OCCUPANCY_THEME_PRESETS.advanced) {
    const seriesColor = lineSeriesColor || '#87CEEB';
    return {
      preset,
      chartRenderMode: 'line',
      plotHeightStyle: 'instantFixed350',
      chartSurface: 'dark',
      plotBg: null,
      plotBorder: '1px solid #ddd',
      grid: '#fff',
      axis: '#fff',
      tick: '#fff',
      yLabel: '#fff',
      tooltipBg: 'var(--dashboard-chart-tooltip-bg, #3d4a5c)',
      tooltipText: 'var(--dashboard-chart-tooltip-text, #ffffff)',
      tooltipBorder: '1px solid var(--dashboard-chart-tooltip-border-color, #ffffff)',
      tooltipHeadBorder: 'var(--dashboard-chart-tooltip-border-color, #ffffff)',
      useCssTooltipVars: true,
      line: seriesColor,
      dotStroke: '#fff',
      cursor: '#fff',
      shellBg: cardBackground,
      shellText: '#fff',
      spinOuter: '#555',
      spinTop: '#fff',
      shellBorder: '1px solid #ddd',
      areaFillOpacity: 0,
      shellStyle: {
        background: cardBackground,
        border: cardBorder,
        boxShadow: cardShadow,
      },
    };
  }

  if (preset === INSTANT_OCCUPANCY_THEME_PRESETS.customized) {
    const seriesColor = isFullscreen ? '#00B0FF' : '#87CEEB';
    const strokeWidth = isFullscreen ? 4 : 2;
    return {
      preset,
      chartRenderMode: 'line',
      plotHeightStyle: showChartsTab ? 'instantChartsTabClamp' : 'flexFill',
      chartSurface: 'dark',
      plotBg: '#767061',
      plotBorder: '1px solid #ddd',
      grid: '#fff',
      axis: '#fff',
      tick: '#fff',
      yLabel: '#fff',
      tooltipBg: '#807864',
      tooltipText: '#fff',
      tooltipBorder: '1px solid #fff',
      tooltipHeadBorder: '#fff',
      line: seriesColor,
      seriesStrokeWidth: strokeWidth,
      dotStroke: '#fff',
      cursor: '#fff',
      shellBg: '#767061',
      shellText: '#fff',
      spinOuter: '#555',
      spinTop: '#fff',
      shellBorder: '1px solid #ddd',
      areaFillOpacity: 0,
      shellStyle: {},
    };
  }

  return resolveInstantOccupancyTheme({ preset: INSTANT_OCCUPANCY_THEME_PRESETS.basic, chartSurface, showChartsTab });
}

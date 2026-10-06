import {
  getSpaceWidgetRenderMapEntry,
  isSupportedSpaceWidgetRendererKey,
  SPACE_WIDGET_RENDERER_TYPES,
} from './spaceWidgetRenderMap';

const TITLE_FALLBACKS = {
  utilization: 'Utilization',
  utilization_by_area_group: {
    active: 'Occupancy by Group',
    main: 'Utilization By Area Groups',
  },
  utilization_by_area: 'Utilization By Area',
  instant_occupancy_count: 'Instant Occupancy Count',
  peak_and_minimum_utilization: 'Peak & Minimum Utilization',
};

const CHART_WIDGETS_WITH_LOADER = new Set([
  'utilization',
  'utilization_by_area_group',
  'instant_occupancy_count',
]);

function getWidgetOverrides(context, widgetKey) {
  return context?.overrides?.[widgetKey] || context?.widgetOverrides || {};
}

function resolveTitleFallback(widgetKey, selectorMode = 'active') {
  const fallback = TITLE_FALLBACKS[widgetKey];
  if (fallback && typeof fallback === 'object') {
    return fallback[selectorMode] || fallback.active;
  }
  return fallback || widgetKey;
}

export function resolveSpaceWidgetRenderer(widgetKey) {
  return getSpaceWidgetRenderMapEntry(widgetKey);
}

export function resolveSpaceWidgetVisibility(widgetKey, context = {}) {
  const entry = getSpaceWidgetRenderMapEntry(widgetKey);
  if (!entry) return false;

  if (context.visible === false) return false;

  const { variant = 'basic', shouldShowWidget } = context;
  if (!entry.variants.includes(variant)) return false;

  if (typeof shouldShowWidget === 'function') {
    return shouldShowWidget(widgetKey);
  }

  return true;
}

export function resolveSpaceWidgetTitle(widgetKey, context = {}) {
  const {
    selectorMode = 'active',
    getWidgetTitle,
    widgetList,
    fallbackTitle,
  } = context;

  const defaultFallback = fallbackTitle ?? resolveTitleFallback(widgetKey, selectorMode);

  if (typeof getWidgetTitle === 'function') {
    const resolved = getWidgetTitle(widgetKey, defaultFallback);
    if (resolved) return resolved;
  }

  if (widgetList?.titles) {
    const widget = widgetList.titles.find((item) => item.key === widgetKey);
    if (widget?.title) return widget.title;
  }

  return defaultFallback;
}

export function resolveSpaceWidgetLoading(widgetKey, context = {}) {
  if (!CHART_WIDGETS_WITH_LOADER.has(widgetKey)) return false;

  const { loading = {}, selectorMode = 'active' } = context;
  const {
    occupancyCountLoading = false,
    instantOccupancyCountLoading = false,
    activeOccupancyByGroupLoading = false,
    occupancyByGroupLoading = false,
  } = loading;

  switch (widgetKey) {
    case 'utilization':
      return occupancyCountLoading;
    case 'instant_occupancy_count':
      return instantOccupancyCountLoading;
    case 'utilization_by_area_group':
      if (selectorMode === 'main') {
        return occupancyByGroupLoading;
      }
      return activeOccupancyByGroupLoading;
    default:
      return false;
  }
}

function buildLineChartProps(context, overrides) {
  const { variant = 'basic', data = {}, loading = {}, chart = {}, shell = {} } = context;

  return {
    occupancyCount: data.occupancyCount,
    occupancyCountLoading: loading.occupancyCountLoading,
    selectedDuration: chart.selectedDuration,
    currentDate: chart.currentDate,
    currentYear: chart.currentYear,
    customDateRange: chart.customDateRange,
    isNavigating: chart.isNavigating,
    shellVariant: variant,
    spaceShell: shell.spaceShell,
    lineSeriesColor: shell.lineSeriesColor,
    isFullscreen: shell.isUtilizationFullscreen,
    cardBackground: shell.cardBackground,
    cardBorder: shell.cardBorder,
    cardShadow: shell.cardShadow,
    ...overrides,
  };
}

function buildStackedBarChartProps(context, overrides) {
  const { variant = 'basic', data = {}, loading = {}, chart = {}, shell = {} } = context;

  return {
    activeOccupancyByGroup: data.activeOccupancyByGroup,
    activeOccupancyByGroupLoading: loading.activeOccupancyByGroupLoading,
    shellVariant: variant,
    spaceShell: shell.spaceShell,
    stackedBarColors: shell.stackedBarColors,
    cardBackground: shell.cardBackground,
    cardBorder: shell.cardBorder,
    cardShadow: shell.cardShadow,
    showChartsTab: chart.showChartsTab,
    colorPalette: shell.colorPalette,
    resolveGroupLabel: shell.resolveGroupLabel,
    requireAreaGroupName:
      shell.requireAreaGroupName !== undefined ? shell.requireAreaGroupName : variant !== 'customized',
    ...overrides,
  };
}

function buildInstantOccupancyChartProps(context, overrides) {
  const { variant = 'basic', data = {}, loading = {}, chart = {}, shell = {} } = context;

  return {
    instantOccupancyCount: data.instantOccupancyCount,
    instantOccupancyCountLoading: loading.instantOccupancyCountLoading,
    instantOccupancyCountError: data.instantOccupancyCountError,
    selectedDuration: chart.selectedDuration,
    currentDate: chart.currentDate,
    currentYear: chart.currentYear,
    customDateRange: chart.customDateRange,
    isNavigating: chart.isNavigating,
    shellVariant: variant,
    chartSurface: shell.chartSurface,
    lineSeriesColor: shell.lineSeriesColor,
    isFullscreen: shell.isInstantOccupancyFullscreen,
    cardBackground: shell.cardBackground,
    cardBorder: shell.cardBorder,
    cardShadow: shell.cardShadow,
    showChartsTab: chart.showChartsTab,
    enableUtilizationFooter: shell.enableUtilizationFooter,
    ...overrides,
  };
}

function buildPeakMinCardsProps(context, overrides) {
  const { variant = 'basic', data = {}, loading = {}, chart = {}, shell = {}, selectorMode = 'active' } =
    context;
  const isMainTab = selectorMode === 'main';

  const base = {
    showChartsTab: chart.showChartsTab,
    instantOccupancyCount: data.instantOccupancyCount,
    occupancyCount: data.occupancyCount,
    selectedDuration: chart.selectedDuration,
    currentDate: chart.currentDate,
    shellVariant: variant,
    chartSurface: shell.chartSurface,
    metricPanelBorder: shell.metricPanelBorder,
    isLargeScreen: shell.isLargeScreen,
    ...overrides,
  };

  if (isMainTab) {
    return {
      ...base,
      isLoading: Boolean(loading.occupancyCountLoading),
      includeInstantLoading: false,
    };
  }

  return {
    ...base,
    instantOccupancyCountLoading: loading.instantOccupancyCountLoading,
    isLoading: false,
  };
}

function buildUtilizationByAreaListProps(context, overrides) {
  const { variant = 'basic', data = {}, loading = {}, shell = {}, selectorMode = 'active' } = context;
  const isMainTab = selectorMode === 'main';

  return {
    payload: isMainTab ? data.spaceUtilizationPerArea : data.activeSpaceUtilizationPerArea,
    processOptions: shell.processOptions,
    dataLoading: isMainTab ? loading.spaceUtilizationLoading : loading.activeSpaceUtilizationLoading,
    shellVariant: variant,
    chartSurface: shell.chartSurface,
    customizedTheme: shell.customizedTheme,
    layoutMode: shell.utilizationByAreaLayoutMode,
    isLargeScreen: shell.isLargeScreen,
    ...overrides,
  };
}

export function resolveSpaceWidgetProps(widgetKey, context = {}) {
  const entry = getSpaceWidgetRenderMapEntry(widgetKey);
  if (!entry) return null;

  const overrides = getWidgetOverrides(context, widgetKey);

  switch (entry.type) {
    case SPACE_WIDGET_RENDERER_TYPES.LINE_CHART:
      return buildLineChartProps(context, overrides);
    case SPACE_WIDGET_RENDERER_TYPES.STACKED_BAR_CHART:
      return buildStackedBarChartProps(context, overrides);
    case SPACE_WIDGET_RENDERER_TYPES.INSTANT_OCCUPANCY_CHART:
      return buildInstantOccupancyChartProps(context, overrides);
    case SPACE_WIDGET_RENDERER_TYPES.PEAK_MIN_CARDS:
      return buildPeakMinCardsProps(context, overrides);
    case SPACE_WIDGET_RENDERER_TYPES.UTILIZATION_BY_AREA_LIST:
      return buildUtilizationByAreaListProps(context, overrides);
    default:
      return null;
  }
}

export function isRenderableSpaceWidgetKey(widgetKey) {
  return isSupportedSpaceWidgetRendererKey(widgetKey);
}

/**
 * Assembles the render context passed to SpaceWidgetRenderer.
 * Variant chrome (export controls, card shells) stays outside the renderer.
 */
export function buildSpaceWidgetRenderContext({
  variant = 'basic',
  selectorMode = 'active',
  showChartsTab = false,
  visible,
  shouldShowWidget,
  getWidgetTitle,
  widgetList,
  data = {},
  loading = {},
  chart = {},
  shell = {},
  ChartLoader,
  overrides = {},
}) {
  return {
    variant,
    selectorMode,
    showChartsTab,
    visible,
    shouldShowWidget,
    getWidgetTitle,
    widgetList,
    data,
    loading,
    chart: {
      showChartsTab,
      ...chart,
    },
    shell,
    ChartLoader,
    overrides,
  };
}

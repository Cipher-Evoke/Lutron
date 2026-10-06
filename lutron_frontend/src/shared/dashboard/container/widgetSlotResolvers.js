import { UNIFIED_ENERGY_WIDGET_MODES } from '../widgets/energy/energyWidgetModes';
import { OVERVIEW_TILE_TITLES } from '../widgets/overview/overviewTileTypes';
import {
  ENERGY_WIDGET_TITLE_DEFAULTS,
  resolveDashboardWidgetTitle,
  resolveDashboardWidgetTitleWithAliases,
  resolveEnergyWidgetVisible,
  TOTAL_CONSUMPTION_GROUP_ALIASES,
} from './hooks/widgetVisibilityResolvers';
import {
  buildLightPowerDensityWidgetProps,
  buildPeakMinConsumptionWidgetProps,
  buildSavingsByStrategyWidgetProps,
  buildTotalConsumptionByGroupWidgetProps,
  buildUnifiedEnergyWidgetProps,
} from './hooks/widgetPropBuilders';
import {
  getWidgetRenderMapEntry,
  isSupportedDashboardWidgetRendererKey,
  WIDGET_RENDERER_TYPES,
} from './widgetRenderMap';

const TITLE_FALLBACKS = {
  consumption: ENERGY_WIDGET_TITLE_DEFAULTS.consumption,
  savings: ENERGY_WIDGET_TITLE_DEFAULTS.savings,
  savings_by_strategy: ENERGY_WIDGET_TITLE_DEFAULTS.savingsByStrategy,
  total_consumption_by_group: ENERGY_WIDGET_TITLE_DEFAULTS.totalConsumptionByGroup,
  light_power_density: ENERGY_WIDGET_TITLE_DEFAULTS.lightPowerDensity,
  peak_and_minimum_consumption: ENERGY_WIDGET_TITLE_DEFAULTS.peakAndMinimumConsumption,
  energy: OVERVIEW_TILE_TITLES.energy,
  alerts: 'Alerts',
  schedules: OVERVIEW_TILE_TITLES.schedules,
  quick_controls: OVERVIEW_TILE_TITLES.quick_controls,
  floors: OVERVIEW_TILE_TITLES.floors,
  space_utilization: OVERVIEW_TILE_TITLES.space_utilization,
};

export function resolveWidgetRenderer(widgetKey) {
  return getWidgetRenderMapEntry(widgetKey);
}

export function resolveWidgetVisibility(widgetKey, context = {}) {
  const entry = getWidgetRenderMapEntry(widgetKey);
  if (!entry) return false;

  if (entry.section === 'overview') {
    if (context.visible === false) return false;
    return true;
  }

  return resolveEnergyWidgetVisible(widgetKey, context);
}

export function resolveWidgetTitle(widgetKey, context = {}) {
  const {
    variant = 'basic',
    widgetList,
    titles = {},
    getWidgetTitle,
    fallbackTitle,
  } = context;

  const defaultFallback = fallbackTitle ?? TITLE_FALLBACKS[widgetKey] ?? widgetKey;

  if (widgetKey === 'consumption' && titles.consumption) return titles.consumption;
  if (widgetKey === 'savings' && titles.savings) return titles.savings;
  if (widgetKey === 'savings_by_strategy' && titles.savingsByStrategy) {
    return titles.savingsByStrategy;
  }
  if (widgetKey === 'total_consumption_by_group' && titles.totalConsumptionByGroup) {
    return titles.totalConsumptionByGroup;
  }

  if (widgetKey === 'total_consumption_by_group') {
    return resolveDashboardWidgetTitleWithAliases(
      widgetKey,
      TOTAL_CONSUMPTION_GROUP_ALIASES,
      defaultFallback,
      widgetList,
      { variant }
    );
  }

  if (typeof getWidgetTitle === 'function') {
    const resolved = getWidgetTitle(widgetKey, defaultFallback);
    if (resolved) return resolved;
  }

  return resolveDashboardWidgetTitle(widgetKey, defaultFallback, widgetList, { variant });
}

function getWidgetOverrides(context, widgetKey) {
  return context?.overrides?.[widgetKey] || {};
}

export function resolveWidgetProps(widgetKey, context = {}) {
  const entry = getWidgetRenderMapEntry(widgetKey);
  if (!entry) return null;

  const { variant = 'basic' } = context;
  const overrides = getWidgetOverrides(context, widgetKey);
  const {
    titles = {},
    data = {},
    loading = {},
    chartLoading = {},
    allEnergyChartsReady,
    globalLoading,
    colors = {},
    chartHeaderStyle,
    ChartLoader,
    transformDataForCharts,
    selectedDuration,
    currentDate,
    currentYear,
    selectedAreas,
    energyCustomNeedsDates,
    isLargeScreen,
    areaGroups,
    areaIdToDisplayName,
    metricPanelBorder,
    overview = {},
  } = context;

  switch (entry.type) {
    case WIDGET_RENDERER_TYPES.UNIFIED_ENERGY: {
      const isConsumption = entry.energyMode === 'consumption';
      const mode = isConsumption
        ? UNIFIED_ENERGY_WIDGET_MODES.consumption
        : UNIFIED_ENERGY_WIDGET_MODES.savings;
      const title = isConsumption
        ? resolveWidgetTitle('consumption', context)
        : resolveWidgetTitle('savings', context);

      return buildUnifiedEnergyWidgetProps({
        mode,
        title,
        energyData: isConsumption ? data.memoizedEnergyConsumption : data.memoizedEnergySavings,
        allEnergyChartsReady,
        energyLoading: isConsumption
          ? loading.energyConsumptionLoading
          : loading.energySavingsLoading,
        chartLoadingFlag: isConsumption
          ? chartLoading.energyConsumption
          : chartLoading.energySavings,
        colors: isConsumption ? colors.consumption : colors.savings,
        transformDataForCharts,
        selectedDuration,
        currentDate,
        currentYear,
        selectedAreas,
        customDatesIncomplete: energyCustomNeedsDates,
        shellVariant: variant,
        chartHeaderStyle,
        ChartLoader,
        overrides,
      });
    }

    case WIDGET_RENDERER_TYPES.SAVINGS_BY_STRATEGY:
      return buildSavingsByStrategyWidgetProps({
        title: resolveWidgetTitle('savings_by_strategy', context),
        savingsByStrategy: data.savingsByStrategy,
        allEnergyChartsReady,
        chartLoadingSavingsByStrategy: chartLoading.savingsByStrategy,
        globalLoading,
        shellVariant: variant,
        chartHeaderStyle,
        ChartLoader,
        overrides,
      });

    case WIDGET_RENDERER_TYPES.TOTAL_CONSUMPTION_BY_GROUP:
      return buildTotalConsumptionByGroupWidgetProps({
        title: resolveWidgetTitle('total_consumption_by_group', context),
        totalConsumptionByGroup: data.totalConsumptionByGroup,
        allEnergyChartsReady,
        chartLoadingTotalConsumptionByGroup: chartLoading.totalConsumptionByGroup,
        areaGroups,
        shellVariant: variant,
        chartHeaderStyle,
        ChartLoader,
        areaIdToDisplayName,
        overrides,
      });

    case WIDGET_RENDERER_TYPES.LIGHT_POWER_DENSITY:
      return buildLightPowerDensityWidgetProps({
        lightPowerDensity: data.lightPowerDensity,
        lightingUnit: data.lightingUnit,
        allEnergyChartsReady,
        chartLoadingLightPowerDensity: chartLoading.lightPowerDensity,
        shellVariant: variant,
        isLargeScreen,
        metricPanelBorder,
        overrides,
      });

    case WIDGET_RENDERER_TYPES.PEAK_MIN_CONSUMPTION:
      return buildPeakMinConsumptionWidgetProps({
        energyConsumption: data.memoizedEnergyConsumption,
        allEnergyChartsReady,
        energyConsumptionLoading: loading.energyConsumptionLoading,
        peakMinConsumptionLoading: loading.peakMinConsumptionLoading,
        chartLoadingPeakMinConsumption: chartLoading.peakMinConsumption,
        transformDataForCharts,
        selectedDuration,
        currentDate,
        shellVariant: variant,
        isLargeScreen,
        overrides,
      });

    case WIDGET_RENDERER_TYPES.OVERVIEW_TILE:
      return {
        tileType: entry.tileType,
        title: resolveWidgetTitle(widgetKey, context),
        energy: overview.energy,
        schedule: overview.schedule,
        floorsCount: overview.floorsCount,
        spaceUtil: overview.spaceUtil,
        onClick: overview.onClick,
        cardSx: overview.cardSx,
        themeVariant: overview.themeVariant,
        cardVariant: overview.cardVariant,
        surfaceVariant: overview.surfaceVariant,
        ...overrides,
      };

    case WIDGET_RENDERER_TYPES.OVERVIEW_ALERTS:
      return {
        title: resolveWidgetTitle('alerts', context),
        ...overrides,
      };

    default:
      return null;
  }
}

export function isRenderableDashboardWidgetKey(widgetKey) {
  return isSupportedDashboardWidgetRendererKey(widgetKey);
}

/**
 * Assembles the energy-tab render context passed to DashboardWidgetRenderer.
 * Variant-specific chrome (export controls, surfaces) stays in overrides.
 */
export function buildEnergyWidgetRenderContext({
  variant,
  titles,
  widgetList,
  getWidgetTitle,
  data = {},
  loading = {},
  chartLoading,
  allEnergyChartsReady,
  globalLoading,
  colors = {},
  chartHeaderStyle,
  ChartLoader,
  transformDataForCharts,
  selectedDuration,
  currentDate,
  currentYear,
  selectedAreas,
  energyCustomNeedsDates,
  isLargeScreen,
  areaGroups,
  areaIdToDisplayName,
  metricPanelBorder,
  overrides = {},
  widgetVisibility,
  visibilityMap,
  getEffectiveBuiltinDashboardPage
}) {
  return {
    variant,
    titles,
    widgetList,
    getWidgetTitle,
    data,
    loading,
    chartLoading,
    allEnergyChartsReady,
    globalLoading,
    colors,
    chartHeaderStyle,
    ChartLoader,
    transformDataForCharts,
    selectedDuration,
    currentDate,
    currentYear,
    selectedAreas,
    energyCustomNeedsDates,
    isLargeScreen,
    areaGroups,
    areaIdToDisplayName,
    metricPanelBorder,
    overrides,
    widgetVisibility,
    visibilityMap,
    getEffectiveBuiltinDashboardPage
  };
}

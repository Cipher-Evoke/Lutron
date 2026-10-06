import { buildSpaceLayoutContext } from './spaceLayoutResolvers';
import { buildSpaceWidgetRenderContext } from './spaceWidgetSlotResolvers';

/**
 * Selects active vs from_logs data sources based on charts tab.
 */
export function resolveSpaceActiveDataSources({
  showChartsTab = false,
  occupancyByGroup,
  spaceUtilizationPerArea,
  occupancyByGroupFromLogs,
  spaceUtilizationPerFromLogs,
  occupancyByGroupFromLogsLoading = false,
  spaceUtilizationPerFromLogsLoading = false,
  occupancyByGroupLoading = false,
  spaceUtilizationLoading = false,
} = {}) {
  return {
    activeOccupancyByGroup: showChartsTab ? occupancyByGroupFromLogs : occupancyByGroup,
    activeSpaceUtilizationPerArea: showChartsTab
      ? spaceUtilizationPerFromLogs
      : spaceUtilizationPerArea,
    activeOccupancyByGroupLoading: showChartsTab
      ? occupancyByGroupFromLogsLoading
      : occupancyByGroupLoading,
    activeSpaceUtilizationLoading: showChartsTab
      ? spaceUtilizationPerFromLogsLoading
      : spaceUtilizationLoading,
  };
}

/**
 * Aggregates per-chart loading flags into shared loading state.
 */
export function aggregateSpaceLoading({
  occupancyCountLoading = false,
  activeOccupancyByGroupLoading = false,
  activeSpaceUtilizationLoading = false,
  instantOccupancyCountLoading = false,
  globalLoading = false,
  isLoading = false,
  globalLoadingProp = false,
} = {}) {
  const anyLoading =
    occupancyCountLoading ||
    activeOccupancyByGroupLoading ||
    activeSpaceUtilizationLoading ||
    instantOccupancyCountLoading ||
    globalLoading;

  return {
    occupancyCountLoading,
    activeOccupancyByGroupLoading,
    occupancyByGroupLoading: activeOccupancyByGroupLoading,
    activeSpaceUtilizationLoading,
    spaceUtilizationLoading: activeSpaceUtilizationLoading,
    instantOccupancyCountLoading,
    globalLoading,
    isLoading,
    globalLoadingProp,
    anyLoading,
  };
}

export function resolveSpaceWidgetTitleFromList(widgetList, widgetKey, fallbackTitle) {
  if (!widgetList?.titles) return fallbackTitle;
  const widget = widgetList.titles.find((item) => item.key === widgetKey);
  return widget?.title || fallbackTitle;
}

export function createSpaceWidgetTitleResolver(widgetList) {
  return (widgetKey, fallbackTitle) =>
    resolveSpaceWidgetTitleFromList(widgetList, widgetKey, fallbackTitle);
}

export function buildSpaceContainerWidgetContext(options = {}) {
  const {
    variant,
    showChartsTab,
    getWidgetTitle,
    widgetList,
    data,
    loading,
    chart,
    shell,
    ChartLoader,
    shouldShowWidget,
    visible,
    overrides,
  } = options;

  return buildSpaceWidgetRenderContext({
    variant,
    showChartsTab,
    getWidgetTitle,
    widgetList,
    data,
    loading,
    chart,
    shell,
    ChartLoader,
    shouldShowWidget,
    visible,
    overrides,
  });
}

export function buildSpaceContainerLayoutContext(options = {}) {
  return buildSpaceLayoutContext(options);
}

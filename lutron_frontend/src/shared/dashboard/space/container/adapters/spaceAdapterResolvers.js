import {
  aggregateSpaceLoading,
  createSpaceWidgetTitleResolver,
  resolveSpaceActiveDataSources,
} from '../spaceContainerResolvers';

export function resolveSharedSpaceWidgetOptionsCore(runtime) {
  const activeData = resolveSpaceActiveDataSources({
    showChartsTab: runtime.showChartsTab,
    occupancyByGroup: runtime.occupancyByGroup,
    spaceUtilizationPerArea: runtime.spaceUtilizationPerArea,
    occupancyByGroupFromLogs: runtime.occupancyByGroupFromLogs,
    spaceUtilizationPerFromLogs: runtime.spaceUtilizationPerFromLogs,
    occupancyByGroupFromLogsLoading: runtime.occupancyByGroupFromLogsLoading,
    spaceUtilizationPerFromLogsLoading: runtime.spaceUtilizationPerFromLogsLoading,
    occupancyByGroupLoading: runtime.occupancyByGroupLoading,
    spaceUtilizationLoading: runtime.spaceUtilizationLoading,
  });

  const loading = aggregateSpaceLoading({
    occupancyCountLoading: runtime.occupancyCountLoading,
    activeOccupancyByGroupLoading: activeData.activeOccupancyByGroupLoading,
    activeSpaceUtilizationLoading: activeData.activeSpaceUtilizationLoading,
    instantOccupancyCountLoading: runtime.instantOccupancyCountLoading,
    globalLoading: runtime.globalLoading,
    isLoading: runtime.isLoading,
    globalLoadingProp: runtime.globalLoadingProp,
  });

  return { activeData, loading };
}

export function buildSharedSpaceWidgetData(runtime, activeData) {
  return {
    occupancyCount: runtime.occupancyCount,
    instantOccupancyCount: runtime.instantOccupancyCount,
    instantOccupancyCountError: runtime.instantOccupancyCountError,
    activeOccupancyByGroup: activeData.activeOccupancyByGroup,
    activeSpaceUtilizationPerArea: activeData.activeSpaceUtilizationPerArea,
    spaceUtilizationPerArea: runtime.spaceUtilizationPerArea,
  };
}

export function buildSharedSpaceChartOptions(runtime) {
  return {
    selectedDuration: runtime.selectedDuration,
    currentDate: runtime.currentDate,
    currentYear: runtime.currentYear,
    customDateRange: runtime.customDateRange,
    isNavigating: runtime.isNavigating,
  };
}

export function buildSharedSpaceWidgetOptionsBase(runtime, variant) {
  const { activeData, loading } = resolveSharedSpaceWidgetOptionsCore(runtime);

  return {
    variant,
    showChartsTab: runtime.showChartsTab,
    widgetList: runtime.widgetList,
    getWidgetTitle: createSpaceWidgetTitleResolver(runtime.widgetList),
    data: buildSharedSpaceWidgetData(runtime, activeData),
    loading,
    chart: buildSharedSpaceChartOptions(runtime),
    ChartLoader: runtime.ChartLoader,
  };
}

export function resolveSharedSpaceExportOptionsCore(runtime, overrides = {}) {
  return {
    dispatch: runtime.dispatch,
    showSnackbar: runtime.showSnackbar,
    userProfile: runtime.userProfile,
    fetchEmailConfigs: runtime.fetchEmailConfigs,
    showChartsTab: runtime.showChartsTab,
    selection: {
      selectedAreas: runtime.selectedAreas,
      selectedFloorIds: runtime.selectedFloorIds,
      ...(runtime.selectedGroupIds != null ? { selectedGroupIds: runtime.selectedGroupIds } : {}),
      selectedDuration: runtime.selectedDuration,
      customDateRange: runtime.customDateRange,
      isNavigating: runtime.isNavigating,
    },
    thunks: runtime.exportThunks,
    ...overrides,
  };
}

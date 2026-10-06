export function resolveDashboardWidgetsOptions(ctx, variant) {
  return {
    variant,
    widgetList: ctx.widgetList,
    energyConsumption: ctx.energyConsumption,
    energySavings: ctx.energySavings,
    energyConsumptionLoading: ctx.energyConsumptionLoading,
    energySavingsLoading: ctx.energySavingsLoading,
    savingsByStrategy: ctx.savingsByStrategy,
    globalLoading: ctx.globalLoading,
    selectedDuration: ctx.selectedDuration,
    customStartDate: ctx.customStartDate,
    customEndDate: ctx.customEndDate,
    backgroundColor: ctx.backgroundColor,
    getThemeAwareConsumptionLineColors: ctx.getThemeAwareConsumptionLineColors,
    getThemeAwareSavingsLineColors: ctx.getThemeAwareSavingsLineColors,
  };
}

export function resolveDashboardDatesOptions(ctx) {
  return {
    dispatch: ctx.dispatch,
    dateActions: ctx.dateActions,
    selectedDuration: ctx.selectedDuration,
    customDateRange: ctx.customDateRange,
    isNavigating: ctx.isNavigating,
    currentDate: ctx.currentDate,
    currentYear: ctx.currentYear,
    customStartDate: ctx.customStartDate,
    customEndDate: ctx.customEndDate,
    setChartLoading: ctx.widgets.setChartLoading,
    setIsDataLoading: ctx.setIsDataLoading,
    setSelectedMonthForData: ctx.setSelectedMonthForData,
  };
}

export function resolveDashboardExportsOptionsCore(ctx, overrides = {}) {
  return {
    dispatch: ctx.dispatch,
    showSnackbar: ctx.showSnackbar,
    userProfile: ctx.userProfile,
    fetchEmailConfigs: ctx.fetchEmailConfigs,
    selection: {
      selectedAreas: ctx.selectedAreas,
      selectedFloorIds: ctx.selectedFloorIds,
      selectedDuration: ctx.selectedDuration,
      customStartDate: ctx.customStartDate,
      customEndDate: ctx.customEndDate,
      isNavigating: ctx.isNavigating,
    },
    calculateDateParameters: ctx.dates.calculateDateParameters,
    thunks: ctx.exportThunks,
    ...overrides,
  };
}

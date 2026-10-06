import { UNIFIED_ENERGY_WIDGET_MODES } from '../../widgets/energy/energyWidgetModes';

export const BASIC_CONSUMPTION_COLORS = ['#ff6b6b', '#ff8a80', '#ffcdd2', '#fecaca'];
export const BASIC_SAVINGS_COLORS = [
  '#1f77b4',
  '#3b4cc0',
  '#2ca02c',
  '#17becf',
  '#ff7f0e',
  '#9467bd',
  '#8c564b',
];
export const CUSTOMIZED_CONSUMPTION_COLORS = BASIC_CONSUMPTION_COLORS;
export const CUSTOMIZED_SAVINGS_COLORS = ['#50c878', '#90EE90', '#98FB98', '#87CEEB'];

export function createInitialChartLoadingState(options = {}) {
  const { variant } = options;
  const base = {
    energyConsumption: false,
    energySavings: false,
    peakMinConsumption: false,
    totalConsumptionByGroup: false,
    lightPowerDensity: false,
    occupancyCount: false,
    occupancyByGroup: false,
    spaceUtilizationPerArea: false,
    instantOccupancyCount: false,
    savingsByStrategy: false,
  };

  if (variant === 'customized') {
    return {
      ...base,
      occupancyByGroupFromLogs: false,
      spaceUtilizationPerFromLogs: false,
    };
  }

  return base;
}

export function buildEnergyTabLoadingStartPatch(previousState, { includeUnified = true } = {}) {
  const prev = { ...createInitialChartLoadingState(), ...(previousState || {}) };
  const patch = {
    totalConsumptionByGroup: true,
    lightPowerDensity: true,
    savingsByStrategy: true,
  };

  if (includeUnified) {
    patch.energyConsumption = true;
    patch.energySavings = true;
    patch.peakMinConsumption = true;
  }

  return { ...prev, ...patch };
}

export function buildEnergyTabLoadingCompletePatch(previousState, { includeUnified = true } = {}) {
  const prev = { ...createInitialChartLoadingState(), ...(previousState || {}) };
  const patch = {
    totalConsumptionByGroup: false,
    lightPowerDensity: false,
    savingsByStrategy: false,
  };

  if (includeUnified) {
    patch.energyConsumption = false;
    patch.energySavings = false;
    patch.peakMinConsumption = false;
  }

  return { ...prev, ...patch };
}

/** Maps Energy tab API names to per-widget chartLoading keys. */
export const ENERGY_TAB_WIDGET_LOADING_KEYS = {
  unifiedEnergyData: ['energyConsumption', 'energySavings', 'peakMinConsumption'],
  totalConsumptionByGroup: ['totalConsumptionByGroup'],
  lightPowerDensity: ['lightPowerDensity'],
  savingsByStrategy: ['savingsByStrategy'],
};

export function buildEnergyWidgetLoadingCompletePatch(previousState, apiCallName) {
  const prev = { ...createInitialChartLoadingState(), ...(previousState || {}) };
  const keys = ENERGY_TAB_WIDGET_LOADING_KEYS[apiCallName] || [];
  const patch = {};
  keys.forEach((key) => {
    patch[key] = false;
  });
  return { ...prev, ...patch };
}

export function buildEnergyTabApiCallPlan({
  apiParamsString,
  unifiedApiParamsRefCurrent,
}) {
  const shouldCallUnified = unifiedApiParamsRefCurrent !== apiParamsString;
  const apiCallNames = [];

  if (shouldCallUnified) {
    apiCallNames.push('unifiedEnergyData');
  }

  apiCallNames.push(
    'totalConsumptionByGroup',
    'lightPowerDensity',
    'savingsByStrategy'
  );

  return {
    shouldCallUnified,
    apiCallNames,
    nextUnifiedApiParamsRef: shouldCallUnified ? apiParamsString : unifiedApiParamsRefCurrent,
    totalApis: apiCallNames.length,
  };
}

export function resolveConsumptionIsLoading({
  energyConsumptionLoading,
  energyConsumption,
  chartLoadingEnergyConsumption,
}) {
  return (
    energyConsumptionLoading ||
    !energyConsumption ||
    chartLoadingEnergyConsumption
  );
}

export function resolveSavingsIsLoading({
  energySavingsLoading,
  energySavings,
  chartLoadingEnergySavings,
}) {
  return (
    energySavingsLoading ||
    !energySavings ||
    chartLoadingEnergySavings
  );
}

export function resolveCombinedConsumptionSavingIsLoading({
  energyCustomNeedsDates = false,
  consumptionIsLoading,
  savingsIsLoading,
}) {
  if (energyCustomNeedsDates) return false;
  return consumptionIsLoading || savingsIsLoading;
}

export function resolveEmbeddedSavingsByStrategyLoading({
  energyCustomNeedsDates = false,
  chartLoadingSavingsByStrategy,
  savingsByStrategy,
}) {
  if (energyCustomNeedsDates) return false;
  return chartLoadingSavingsByStrategy || !savingsByStrategy;
}

export function resolveEnergyColorPalettes({
  variant = 'basic',
  backgroundColor = null,
  getThemeAwareConsumptionLineColors = null,
  getThemeAwareSavingsLineColors = null,
}) {
  if (variant === 'advanced') {
    return {
      consumptionColors:
        getThemeAwareConsumptionLineColors?.(backgroundColor) || BASIC_CONSUMPTION_COLORS,
      savingsColors:
        getThemeAwareSavingsLineColors?.(backgroundColor) || CUSTOMIZED_SAVINGS_COLORS,
    };
  }

  if (variant === 'customized') {
    return {
      consumptionColors: CUSTOMIZED_CONSUMPTION_COLORS,
      savingsColors: CUSTOMIZED_SAVINGS_COLORS,
    };
  }

  return {
    consumptionColors: BASIC_CONSUMPTION_COLORS,
    savingsColors: BASIC_SAVINGS_COLORS,
  };
}

export function buildUnifiedEnergyWidgetProps({
  mode = UNIFIED_ENERGY_WIDGET_MODES.consumption,
  title,
  energyData,
  allEnergyChartsReady,
  energyLoading,
  chartLoadingFlag,
  colors,
  transformDataForCharts,
  selectedDuration,
  currentDate,
  currentYear,
  selectedAreas,
  customDatesIncomplete,
  shellVariant,
  chartHeaderStyle,
  ChartLoader,
  overrides = {},
}) {
  return {
    mode,
    title,
    energyData,
    allEnergyChartsReady,
    energyLoading,
    chartLoadingFlag,
    colors,
    transformDataForCharts,
    selectedDuration,
    currentDate,
    currentYear,
    selectedAreas,
    ...(customDatesIncomplete !== undefined ? { customDatesIncomplete } : {}),
    ...(shellVariant ? { shellVariant } : {}),
    ...(chartHeaderStyle ? { chartHeaderStyle } : {}),
    ...(ChartLoader ? { ChartLoader } : {}),
    ...overrides,
  };
}

export function buildSavingsByStrategyWidgetProps({
  title,
  savingsByStrategy,
  allEnergyChartsReady,
  chartLoadingSavingsByStrategy,
  globalLoading,
  shellVariant,
  chartHeaderStyle,
  ChartLoader,
  overrides = {},
}) {
  return {
    title,
    savingsByStrategy,
    allEnergyChartsReady,
    chartLoadingSavingsByStrategy,
    globalLoading,
    ...(shellVariant ? { shellVariant } : {}),
    ...(chartHeaderStyle ? { chartHeaderStyle } : {}),
    ...(ChartLoader ? { ChartLoader } : {}),
    ...overrides,
  };
}

export function buildTotalConsumptionByGroupWidgetProps({
  title,
  totalConsumptionByGroup,
  allEnergyChartsReady,
  chartLoadingTotalConsumptionByGroup,
  areaGroups,
  shellVariant,
  chartHeaderStyle,
  exportControl,
  ChartLoader,
  areaIdToDisplayName,
  overrides = {},
}) {
  return {
    title,
    totalConsumptionByGroup,
    allEnergyChartsReady,
    chartLoadingTotalConsumptionByGroup,
    areaGroups,
    ...(shellVariant ? { shellVariant } : {}),
    ...(chartHeaderStyle ? { chartHeaderStyle } : {}),
    ...(exportControl ? { exportControl } : {}),
    ...(ChartLoader ? { ChartLoader } : {}),
    ...(areaIdToDisplayName ? { areaIdToDisplayName } : {}),
    ...overrides,
  };
}

export function buildPeakMinConsumptionWidgetProps({
  energyConsumption,
  allEnergyChartsReady,
  energyConsumptionLoading,
  peakMinConsumptionLoading,
  chartLoadingPeakMinConsumption,
  transformDataForCharts,
  selectedDuration,
  currentDate,
  shellVariant,
  isLargeScreen,
  chartSurface,
  overrides = {},
}) {
  return {
    energyConsumption,
    allEnergyChartsReady,
    energyConsumptionLoading,
    peakMinConsumptionLoading,
    chartLoadingPeakMinConsumption,
    transformDataForCharts,
    selectedDuration,
    currentDate,
    ...(shellVariant ? { shellVariant } : {}),
    ...(isLargeScreen !== undefined ? { isLargeScreen } : {}),
    ...(chartSurface ? { chartSurface } : {}),
    ...overrides,
  };
}

export function buildLightPowerDensityWidgetProps({
  lightPowerDensity,
  lightingUnit,
  allEnergyChartsReady,
  chartLoadingLightPowerDensity,
  shellVariant,
  isLargeScreen,
  chartSurface,
  metricPanelBorder,
  overrides = {},
}) {
  return {
    lightPowerDensity,
    lightingUnit,
    allEnergyChartsReady,
    chartLoadingLightPowerDensity,
    ...(shellVariant ? { shellVariant } : {}),
    ...(isLargeScreen !== undefined ? { isLargeScreen } : {}),
    ...(chartSurface ? { chartSurface } : {}),
    ...(metricPanelBorder ? { metricPanelBorder } : {}),
    ...overrides,
  };
}

import { useCallback, useMemo, useRef, useState } from 'react';
import { resolveEnergyCustomNeedsDates } from '../helpers/dashboardDateNavigation';
import { stabilizeDashboardPayload } from '../helpers/widgetMemoStabilizers';
import {
  resolveEnergyWidgetTitles,
  resolveDashboardWidgetTitle,
  resolveDashboardWidgetTitleWithAliases,
  TOTAL_CONSUMPTION_GROUP_ALIASES,
} from './widgetVisibilityResolvers';
import {
  buildEnergyTabLoadingCompletePatch,
  buildEnergyTabLoadingStartPatch,
  buildEnergyWidgetLoadingCompletePatch,
  buildEnergyTabApiCallPlan,
  createInitialChartLoadingState,
  resolveCombinedConsumptionSavingIsLoading,
  resolveConsumptionIsLoading,
  resolveEmbeddedSavingsByStrategyLoading,
  resolveEnergyColorPalettes,
  resolveSavingsIsLoading,
} from './widgetPropBuilders';

export function useDashboardWidgets({
  variant = 'basic',
  widgetList = null,
  energyConsumption,
  energySavings,
  energyConsumptionLoading,
  energySavingsLoading,
  savingsByStrategy = null,
  globalLoading = false,
  selectedDuration,
  customStartDate = '',
  customEndDate = '',
  energyCustomNeedsDates: energyCustomNeedsDatesOverride,
  backgroundColor = null,
  getThemeAwareConsumptionLineColors = null,
  getThemeAwareSavingsLineColors = null,
}) {
  const energyCustomNeedsDates = useMemo(() => {
    if (energyCustomNeedsDatesOverride !== undefined) {
      return energyCustomNeedsDatesOverride;
    }
    return resolveEnergyCustomNeedsDates({
      selectedDuration,
      customStartDate,
      customEndDate,
    });
  }, [
    energyCustomNeedsDatesOverride,
    selectedDuration,
    customStartDate,
    customEndDate,
  ]);

  const [chartLoading, setChartLoading] = useState(() =>
    createInitialChartLoadingState({ variant })
  );
  const [allEnergyChartsReady, setAllEnergyChartsReady] = useState(true);

  const prevEnergyConsumptionRef = useRef(null);
  const prevEnergySavingsRef = useRef(null);

  const energyWidgetTitles = useMemo(
    () =>
      resolveEnergyWidgetTitles(widgetList, {
        variant,
        includeAliases: variant === 'customized',
      }),
    [widgetList, variant]
  );

  const getWidgetTitle = useCallback(
    (widgetKey, fallbackTitle) =>
      resolveDashboardWidgetTitle(widgetKey, fallbackTitle, widgetList, { variant }),
    [widgetList, variant]
  );

  const getWidgetTitleWithAliases = useCallback(
    (primaryKey, aliasKeys, fallbackTitle) =>
      resolveDashboardWidgetTitleWithAliases(primaryKey, aliasKeys, fallbackTitle, widgetList, {
        variant,
      }),
    [widgetList, variant]
  );

  const memoizedEnergyConsumption = useMemo(
    () => stabilizeDashboardPayload(energyConsumption, prevEnergyConsumptionRef),
    [energyConsumption]
  );

  const memoizedEnergySavings = useMemo(
    () => stabilizeDashboardPayload(energySavings, prevEnergySavingsRef),
    [energySavings]
  );

  const { consumptionColors, savingsColors } = useMemo(
    () =>
      resolveEnergyColorPalettes({
        variant,
        backgroundColor,
        getThemeAwareConsumptionLineColors,
        getThemeAwareSavingsLineColors,
      }),
    [variant, backgroundColor, getThemeAwareConsumptionLineColors, getThemeAwareSavingsLineColors]
  );

  const consumptionIsLoading = useMemo(
    () =>
      resolveConsumptionIsLoading({
        energyConsumptionLoading,
        energyConsumption,
        chartLoadingEnergyConsumption: chartLoading.energyConsumption,
      }),
    [
      energyConsumptionLoading,
      energyConsumption,
      chartLoading.energyConsumption,
    ]
  );

  const savingsIsLoading = useMemo(
    () =>
      resolveSavingsIsLoading({
        energySavingsLoading,
        energySavings,
        chartLoadingEnergySavings: chartLoading.energySavings,
      }),
    [energySavingsLoading, energySavings, chartLoading.energySavings]
  );

  const combinedConsumptionSavingIsLoading = useMemo(
    () =>
      resolveCombinedConsumptionSavingIsLoading({
        energyCustomNeedsDates,
        consumptionIsLoading,
        savingsIsLoading,
      }),
    [energyCustomNeedsDates, consumptionIsLoading, savingsIsLoading]
  );

  const embeddedSavingsByStrategyLoading = useMemo(
    () =>
      resolveEmbeddedSavingsByStrategyLoading({
        energyCustomNeedsDates,
        chartLoadingSavingsByStrategy: chartLoading.savingsByStrategy,
        savingsByStrategy,
      }),
    [
      energyCustomNeedsDates,
      chartLoading.savingsByStrategy,
      savingsByStrategy,
    ]
  );

  const startEnergyTabLoading = useCallback(
    (includeUnified = true) => {
      setChartLoading((prev) => buildEnergyTabLoadingStartPatch(prev, { includeUnified }));
    },
    []
  );

  const completeEnergyTabLoading = useCallback((includeUnified = true) => {
    setAllEnergyChartsReady(true);
    setChartLoading((prev) => buildEnergyTabLoadingCompletePatch(prev, { includeUnified }));
  }, []);

  const completeEnergyWidgetLoading = useCallback((apiCallName) => {
    setChartLoading((prev) => buildEnergyWidgetLoadingCompletePatch(prev, apiCallName));
  }, []);

  const planEnergyTabApiCalls = useCallback(
    (apiParamsString, unifiedApiParamsRefCurrent) =>
      buildEnergyTabApiCallPlan({
        apiParamsString,
        unifiedApiParamsRefCurrent,
      }),
    []
  );

  return {
    chartLoading,
    setChartLoading,
    allEnergyChartsReady,
    setAllEnergyChartsReady,
    energyWidgetTitles,
    getWidgetTitle,
    getWidgetTitleWithAliases,
    totalConsumptionGroupAliases: TOTAL_CONSUMPTION_GROUP_ALIASES,
    memoizedEnergyConsumption,
    memoizedEnergySavings,
    consumptionColors,
    savingsColors,
    consumptionIsLoading,
    savingsIsLoading,
    combinedConsumptionSavingIsLoading,
    embeddedSavingsByStrategyLoading,
    startEnergyTabLoading,
    completeEnergyTabLoading,
    completeEnergyWidgetLoading,
    planEnergyTabApiCalls,
    energyCustomNeedsDates,
  };
}

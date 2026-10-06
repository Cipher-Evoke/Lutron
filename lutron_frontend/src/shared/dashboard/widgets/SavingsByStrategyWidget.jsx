import React, { useMemo } from 'react';
import { SavingsByStrategyCard } from './SavingsByStrategyCard';
import {
  resolveSavingsByStrategyTheme,
  resolveSavingsByStrategyLoading,
  SAVINGS_BY_STRATEGY_THEME_PRESETS,
} from './savingsByStrategyTheme';
import { savingsByStrategyWidgetPropsAreEqual } from './savingsByStrategyMemoCompare';

function SavingsByStrategyWidgetInner({
  title,
  savingsByStrategy,
  allEnergyChartsReady,
  chartLoadingSavingsByStrategy = false,
  globalLoading = false,
  shellVariant = SAVINGS_BY_STRATEGY_THEME_PRESETS.basic,
  chartSurface = 'dark',
  chartHeaderStyle = {},
  embedded = false,
  customDatesIncomplete = false,
  energyLightFullCardHeightPx = null,
  advancedSurface = null,
  customizedSurface = null,
  ChartLoader = null,
}) {
  const isLoading = useMemo(
    () =>
      resolveSavingsByStrategyLoading({
        chartLoadingSavingsByStrategy,
        savingsByStrategy,
        customDatesIncomplete,
      }),
    [
      chartLoadingSavingsByStrategy,
      savingsByStrategy,
      customDatesIncomplete,
    ]
  );

  const theme = useMemo(
    () =>
      resolveSavingsByStrategyTheme({
        preset: shellVariant,
        chartSurface,
        chartHeaderStyle,
        embedded,
        energyLightFullCardHeightPx,
        advancedSurface,
        customizedSurface,
      }),
    [
      shellVariant,
      chartSurface,
      chartHeaderStyle,
      embedded,
      energyLightFullCardHeightPx,
      advancedSurface,
      customizedSurface,
    ]
  );

  return (
    <SavingsByStrategyCard
      title={title}
      savingsByStrategy={savingsByStrategy}
      isLoading={isLoading}
      globalLoading={globalLoading}
      theme={theme}
      customDatesIncomplete={customDatesIncomplete}
      ChartLoader={ChartLoader}
    />
  );
}

export const SavingsByStrategyWidget = React.memo(
  SavingsByStrategyWidgetInner,
  savingsByStrategyWidgetPropsAreEqual
);

export default SavingsByStrategyWidget;

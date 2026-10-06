import React, { useMemo } from 'react';
import { UnifiedEnergyCard } from './UnifiedEnergyCard';
import {
  resolveUnifiedEnergyTheme,
  resolveUnifiedEnergyLoading,
  resolveUnifiedEnergyData,
  resolveUnifiedEnergyEmptyStateVariant,
  UNIFIED_ENERGY_THEME_PRESETS,
} from './unifiedEnergyTheme';
import { UNIFIED_ENERGY_WIDGET_MODES } from './energyWidgetModes';
import { unifiedEnergyWidgetPropsAreEqual } from './unifiedEnergyMemoCompare';

function UnifiedEnergyWidgetInner({
  mode = UNIFIED_ENERGY_WIDGET_MODES.consumption,
  title,
  energyData,
  allEnergyChartsReady,
  energyLoading = false,
  chartLoadingFlag = false,
  colors = [],
  shellVariant = UNIFIED_ENERGY_THEME_PRESETS.basic,
  chartSurface = 'dark',
  chartHeaderStyle = {},
  customDatesIncomplete = false,
  energyLightFullCardHeightPx = null,
  advancedSurface = null,
  customizedSurface = null,
  transformDataForCharts,
  selectedDuration,
  currentDate,
  currentYear,
  selectedAreas = [],
  exportControl = null,
  emptyStateExtras = null,
  blankChartPreview = null,
  ChartLoader = null,
}) {
  const isLoading = useMemo(
    () =>
      resolveUnifiedEnergyLoading({
        energyLoading,
        chartLoadingFlag,
        energyData,
        customDatesIncomplete,
      }),
    [
      energyLoading,
      chartLoadingFlag,
      energyData,
      customDatesIncomplete,
    ]
  );

  const resolvedData = useMemo(
    () =>
      resolveUnifiedEnergyData({
        energyData,
        customDatesIncomplete,
      }),
    [energyData, customDatesIncomplete]
  );

  const emptyStateVariant = useMemo(
    () => resolveUnifiedEnergyEmptyStateVariant(customDatesIncomplete),
    [customDatesIncomplete]
  );

  const theme = useMemo(
    () =>
      resolveUnifiedEnergyTheme({
        preset: shellVariant,
        mode,
        chartSurface,
        chartHeaderStyle,
        energyLightFullCardHeightPx,
        advancedSurface,
        customizedSurface,
      }),
    [
      shellVariant,
      mode,
      chartSurface,
      chartHeaderStyle,
      energyLightFullCardHeightPx,
      advancedSurface,
      customizedSurface,
    ]
  );

  return (
    <UnifiedEnergyCard
      title={title}
      data={resolvedData}
      isLoading={isLoading}
      theme={theme}
      mode={mode}
      colors={colors}
      transformDataForCharts={transformDataForCharts}
      selectedDuration={selectedDuration}
      currentDate={currentDate}
      currentYear={currentYear}
      selectedAreas={selectedAreas}
      emptyStateVariant={emptyStateVariant}
      exportControl={exportControl}
      emptyStateExtras={emptyStateExtras}
      blankChartPreview={blankChartPreview}
      ChartLoader={ChartLoader}
    />
  );
}

export const UnifiedEnergyWidget = React.memo(
  UnifiedEnergyWidgetInner,
  unifiedEnergyWidgetPropsAreEqual
);

export default UnifiedEnergyWidget;

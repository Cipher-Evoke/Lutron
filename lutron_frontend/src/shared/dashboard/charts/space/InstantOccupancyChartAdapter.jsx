import React, { useMemo } from 'react';
import {
  resolveInstantOccupancyChartStatus,
  buildInstantOccupancyChartDataset,
} from './instantOccupancyConfig';
import {
  resolveInstantOccupancyTheme,
  INSTANT_OCCUPANCY_THEME_PRESETS,
} from './instantOccupancyTheme';
import { InstantOccupancyChartView } from './InstantOccupancyChartView';
import { instantOccupancyChartPropsAreEqual } from './instantOccupancyMemoCompare';

function InstantOccupancyChartAdapterInner({
  instantOccupancyCount,
  instantOccupancyCountLoading = false,
  instantOccupancyCountError = null,
  anyLoading = false,
  isLoading = false,
  globalLoadingProp = false,
  selectedDuration,
  currentDate,
  currentYear,
  customDateRange = { startDate: '', endDate: '' },
  isNavigating = false,
  shellVariant = INSTANT_OCCUPANCY_THEME_PRESETS.basic,
  chartSurface = 'dark',
  lineSeriesColor = null,
  isFullscreen = false,
  cardBackground = null,
  cardBorder = null,
  cardShadow = null,
  showChartsTab = false,
  enableUtilizationFooter = false,
}) {
  const theme = useMemo(
    () =>
      resolveInstantOccupancyTheme({
        preset: shellVariant,
        chartSurface,
        lineSeriesColor,
        isFullscreen,
        cardBackground,
        cardBorder,
        cardShadow,
        showChartsTab,
      }),
    [
      shellVariant,
      chartSurface,
      lineSeriesColor,
      isFullscreen,
      cardBackground,
      cardBorder,
      cardShadow,
      showChartsTab,
    ]
  );

  const status = useMemo(
    () =>
      resolveInstantOccupancyChartStatus({
        instantOccupancyCount,
        instantOccupancyCountLoading,
        instantOccupancyCountError,
        anyLoading,
        isLoading,
        globalLoadingProp,
      }),
    [
      instantOccupancyCount,
      instantOccupancyCountLoading,
      instantOccupancyCountError,
      anyLoading,
      isLoading,
      globalLoadingProp,
    ]
  );

  const dataset = useMemo(() => {
    if (status !== 'ready' || !instantOccupancyCount) return null;
    return buildInstantOccupancyChartDataset(instantOccupancyCount, {
      selectedDuration,
      currentDate,
      customDateRange,
      chartSurface,
      enableUtilizationFooter,
    });
  }, [
    status,
    instantOccupancyCount,
    selectedDuration,
    currentDate,
    customDateRange,
    chartSurface,
    enableUtilizationFooter,
  ]);

  try {
    if (status !== 'ready' || !dataset) {
      return (
        <InstantOccupancyChartView
          status={status}
          theme={theme}
          plotHeightStyle={theme.plotHeightStyle}
        />
      );
    }

    return (
      <InstantOccupancyChartView
        status="ready"
        theme={theme}
        plotHeightStyle={theme.plotHeightStyle}
        processedChartData={dataset.processedChartData}
        chartConfig={dataset.chartConfig}
        maxOccupancy={dataset.maxOccupancy}
        nonNullValues={dataset.nonNullValues}
        showPercentage={dataset.showPercentage}
        xAxisTicks={dataset.xAxisTicks}
        footerModel={dataset.footerModel}
        selectedDuration={selectedDuration}
        currentDate={currentDate}
        currentYear={currentYear}
        customDateRange={customDateRange}
        isNavigating={isNavigating}
      />
    );
  } catch (error) {
    return (
      <InstantOccupancyChartView
        status="error"
        theme={theme}
        plotHeightStyle={theme.plotHeightStyle}
      />
    );
  }
}

export const InstantOccupancyChartAdapter = React.memo(
  InstantOccupancyChartAdapterInner,
  instantOccupancyChartPropsAreEqual
);

export { instantOccupancyChartPropsAreEqual } from './instantOccupancyMemoCompare';

export default InstantOccupancyChartAdapter;

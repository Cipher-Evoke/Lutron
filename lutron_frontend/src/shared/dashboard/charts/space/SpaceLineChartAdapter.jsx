import React, { useMemo } from 'react';
import {
  resolveSpaceLineChartStatus,
  buildSpaceLineChartDataset,
} from './spaceLineChartConfig';
import {
  resolveSpaceLineChartTheme,
  SPACE_LINE_CHART_THEME_PRESETS,
} from './spaceLineChartTheme';
import { SpaceLineChartView } from './SpaceLineChartView';
import { spaceLineChartPropsAreEqual } from './spaceLineChartMemoCompare';

function SpaceLineChartAdapterInner({
  occupancyCount,
  occupancyCountLoading = false,
  anyLoading = false,
  isLoading = false,
  globalLoadingProp = false,
  selectedDuration,
  currentDate,
  currentYear,
  customDateRange = { startDate: '', endDate: '' },
  isNavigating = false,
  shellVariant = SPACE_LINE_CHART_THEME_PRESETS.basic,
  spaceShell = null,
  lineSeriesColor = null,
  isFullscreen = false,
  cardBackground = null,
  cardBorder = null,
  cardShadow = null,
}) {
  const theme = useMemo(
    () =>
      resolveSpaceLineChartTheme({
        preset: shellVariant,
        spaceShell,
        lineSeriesColor,
        isFullscreen,
        cardBackground,
        cardBorder,
        cardShadow,
      }),
    [
      shellVariant,
      spaceShell,
      lineSeriesColor,
      isFullscreen,
      cardBackground,
      cardBorder,
      cardShadow,
    ]
  );

  const status = useMemo(
    () =>
      resolveSpaceLineChartStatus({
        occupancyCount,
        occupancyCountLoading,
        anyLoading,
        isLoading,
        globalLoadingProp,
      }),
    [occupancyCount, occupancyCountLoading, anyLoading, isLoading, globalLoadingProp]
  );

  const dataset = useMemo(() => {
    if (status !== 'ready' || !occupancyCount) {
      return null;
    }
    return buildSpaceLineChartDataset(occupancyCount, {
      selectedDuration,
      currentDate,
      customDateRange,
    });
  }, [status, occupancyCount, selectedDuration, currentDate, customDateRange]);

  try {
    if (status !== 'ready' || !dataset) {
      return (
        <SpaceLineChartView
          status={status}
          theme={theme}
          plotHeightStyle={theme.plotHeightStyle}
        />
      );
    }

    return (
      <SpaceLineChartView
        status="ready"
        theme={theme}
        plotHeightStyle={theme.plotHeightStyle}
        processedChartData={dataset.processedChartData}
        chartConfig={dataset.chartConfig}
        maxOccupancy={dataset.maxOccupancy}
        nonNullValues={dataset.nonNullValues}
        showPercentage={dataset.showPercentage}
        xAxisTicks={dataset.xAxisTicks}
        selectedDuration={selectedDuration}
        currentDate={currentDate}
        currentYear={currentYear}
        customDateRange={customDateRange}
        isNavigating={isNavigating}
      />
    );
  } catch (error) {
    return (
      <SpaceLineChartView
        status="error"
        theme={theme}
        plotHeightStyle={theme.plotHeightStyle}
      />
    );
  }
}

export const SpaceLineChartAdapter = React.memo(
  SpaceLineChartAdapterInner,
  spaceLineChartPropsAreEqual
);

export { spaceLineChartPropsAreEqual } from './spaceLineChartMemoCompare';

export default SpaceLineChartAdapter;

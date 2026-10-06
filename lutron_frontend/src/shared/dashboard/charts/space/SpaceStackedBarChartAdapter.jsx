import React, { useMemo } from 'react';
import {
  resolveSpaceStackedBarChartStatus,
  buildSpaceStackedBarChartDataset,
} from './spaceStackedBarConfig';
import {
  resolveSpaceStackedBarTheme,
  SPACE_STACKED_BAR_THEME_PRESETS,
} from './spaceStackedBarTheme';
import { SpaceStackedBarChartView } from './SpaceStackedBarChartView';
import { spaceStackedBarChartPropsAreEqual } from './spaceStackedBarMemoCompare';

function SpaceStackedBarChartAdapterInner({
  activeOccupancyByGroup,
  activeOccupancyByGroupLoading = false,
  anyLoading = false,
  isLoading = false,
  globalLoadingProp = false,
  shellVariant = SPACE_STACKED_BAR_THEME_PRESETS.basic,
  spaceShell = null,
  stackedBarColors = null,
  cardBackground = null,
  cardBorder = null,
  cardShadow = null,
  showChartsTab = false,
  colorPalette = null,
  resolveGroupLabel = null,
  requireAreaGroupName = true,
}) {
  const theme = useMemo(
    () =>
      resolveSpaceStackedBarTheme({
        preset: shellVariant,
        spaceShell,
        stackedBarColors,
        cardBackground,
        cardBorder,
        cardShadow,
        showChartsTab,
      }),
    [
      shellVariant,
      spaceShell,
      stackedBarColors,
      cardBackground,
      cardBorder,
      cardShadow,
      showChartsTab,
    ]
  );

  const shellStatus = useMemo(
    () =>
      resolveSpaceStackedBarChartStatus({
        activeOccupancyByGroup,
        activeOccupancyByGroupLoading,
        anyLoading,
        isLoading,
        globalLoadingProp,
      }),
    [
      activeOccupancyByGroup,
      activeOccupancyByGroupLoading,
      anyLoading,
      isLoading,
      globalLoadingProp,
    ]
  );

  const transformOptions = useMemo(
    () => ({
      resolveGroupLabel: resolveGroupLabel || undefined,
      colorPalette: colorPalette || undefined,
      requireAreaGroupName,
    }),
    [resolveGroupLabel, colorPalette, requireAreaGroupName]
  );

  const dataset = useMemo(() => {
    if (shellStatus !== 'ready' || !activeOccupancyByGroup) {
      return null;
    }
    return buildSpaceStackedBarChartDataset(activeOccupancyByGroup, transformOptions);
  }, [shellStatus, activeOccupancyByGroup, transformOptions]);

  const chartKey = useMemo(
    () => `stacked-bar-${JSON.stringify(activeOccupancyByGroup)}`,
    [activeOccupancyByGroup]
  );

  try {
    if (shellStatus !== 'ready') {
      return (
        <SpaceStackedBarChartView
          status={shellStatus}
          theme={theme}
          plotHeightStyle={theme.plotHeightStyle}
        />
      );
    }

    if (!dataset || dataset.status === 'empty-criteria') {
      return (
        <SpaceStackedBarChartView
          status="empty-criteria"
          theme={theme}
          plotHeightStyle={theme.plotHeightStyle}
        />
      );
    }

    return (
      <SpaceStackedBarChartView
        status="ready"
        theme={theme}
        stackedBarData={dataset.stackedBarData}
        chartKey={chartKey}
        plotHeightStyle={theme.plotHeightStyle}
      />
    );
  } catch (error) {
    return (
      <SpaceStackedBarChartView
        status="catch-error"
        theme={theme}
        plotHeightStyle={theme.plotHeightStyle}
      />
    );
  }
}

export const SpaceStackedBarChartAdapter = React.memo(
  SpaceStackedBarChartAdapterInner,
  spaceStackedBarChartPropsAreEqual
);

export { spaceStackedBarChartPropsAreEqual } from './spaceStackedBarMemoCompare';

export default SpaceStackedBarChartAdapter;

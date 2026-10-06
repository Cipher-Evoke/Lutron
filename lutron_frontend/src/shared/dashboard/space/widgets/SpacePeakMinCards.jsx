import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import { formatPeakMinTimeLabel } from '../../charts/transforms/formatPeakMinTimeLabel';
import {
  resolveSpacePeakMinDataSource,
  resolveSpacePeakMinModel,
} from '../transforms/resolveSpacePeakMinModel';
import { SpacePeakMinCard } from './SpacePeakMinCard';
import {
  resolveSpacePeakMinLoading,
  resolveSpacePeakMinTheme,
  SPACE_PEAK_MIN_THEME_PRESETS,
} from './spacePeakMinTheme';
import { spacePeakMinCardsPropsAreEqual } from './spacePeakMinMemoCompare';

function resolveMetricDisplay(value, time, selectedDuration, currentDate, reformatTimeLabels) {
  const valueText = value !== null && value !== undefined ? value : 'No data';
  let timeText = 'No data';
  if (time) {
    const formatted = reformatTimeLabels
      ? formatPeakMinTimeLabel(time, selectedDuration, currentDate)
      : time;
    timeText = `at ${formatted}`;
  }
  return { valueText, timeText };
}

function SpacePeakMinCardsInner({
  isLoading: isLoadingProp,
  instantOccupancyCountLoading = false,
  anyLoading = false,
  isLoading = false,
  globalLoadingProp = false,
  includeInstantLoading = true,
  showChartsTab = false,
  instantOccupancyCount,
  occupancyCount,
  selectedDuration,
  currentDate,
  shellVariant = SPACE_PEAK_MIN_THEME_PRESETS.basic,
  chartSurface = 'dark',
  metricPanelBorder = null,
  isLargeScreen = false,
  reformatTimeLabels = true,
}) {
  const loading = useMemo(() => {
    if (isLoadingProp !== undefined) {
      return isLoadingProp;
    }
    return resolveSpacePeakMinLoading({
      instantOccupancyCountLoading,
      anyLoading,
      isLoading,
      globalLoadingProp,
      includeInstantLoading,
    });
  }, [
    isLoadingProp,
    instantOccupancyCountLoading,
    anyLoading,
    isLoading,
    globalLoadingProp,
    includeInstantLoading,
  ]);

  const theme = useMemo(
    () =>
      resolveSpacePeakMinTheme({
        preset: shellVariant,
        chartSurface,
        metricPanelBorder,
      }),
    [shellVariant, chartSurface, metricPanelBorder]
  );

  const displayModel = useMemo(() => {
    if (loading) {
      return null;
    }
    const model = resolveSpacePeakMinModel({
      dataSource: resolveSpacePeakMinDataSource({
        showChartsTab,
        instantOccupancyCount,
        occupancyCount,
      }),
      selectedDuration,
      currentDate,
    });
    return {
      peak: resolveMetricDisplay(
        model.peakValue,
        model.peakTime,
        selectedDuration,
        currentDate,
        reformatTimeLabels
      ),
      min: resolveMetricDisplay(
        model.minimumValue,
        model.minimumTime,
        selectedDuration,
        currentDate,
        reformatTimeLabels
      ),
    };
  }, [
    loading,
    showChartsTab,
    instantOccupancyCount,
    occupancyCount,
    selectedDuration,
    currentDate,
    reformatTimeLabels,
  ]);

  const rowSx = useMemo(() => {
    if (theme.panelLayout === 'basic-stretch') {
      return {
        display: 'flex',
        gap: theme.rowGap,
        flex: 1,
        minHeight: 0,
        width: '100%',
        alignItems: 'stretch',
      };
    }
    if (theme.panelLayout === 'centered-fixed') {
      return {
        display: 'flex',
        gap: { xs: 1.5, sm: 2, md: 2.5, lg: 3, xl: 3.5 },
        width: '100%',
        height: theme.rowHeight,
        alignItems: 'stretch',
      };
    }
    return {
      display: 'flex',
      gap: theme.rowGap || { xs: 1.5, sm: 2, md: 2.5, lg: 3, xl: 3.5 },
      width: '100%',
    };
  }, [theme]);

  return (
    <Box sx={rowSx}>
      <SpacePeakMinCard
        variant="peak"
        isLoading={loading}
        valueText={displayModel?.peak?.valueText ?? ''}
        timeText={displayModel?.peak?.timeText ?? ''}
        theme={theme}
        isLargeScreen={isLargeScreen}
      />
      <SpacePeakMinCard
        variant="min"
        isLoading={loading}
        valueText={displayModel?.min?.valueText ?? ''}
        timeText={displayModel?.min?.timeText ?? ''}
        theme={theme}
        isLargeScreen={isLargeScreen}
      />
    </Box>
  );
}

export const SpacePeakMinCards = React.memo(
  SpacePeakMinCardsInner,
  spacePeakMinCardsPropsAreEqual
);

export default SpacePeakMinCards;

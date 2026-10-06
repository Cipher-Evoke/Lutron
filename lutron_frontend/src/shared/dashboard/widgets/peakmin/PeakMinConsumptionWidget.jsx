import React, { useMemo } from 'react';
import { PeakMinConsumptionCard } from './PeakMinConsumptionCard';
import {
  resolvePeakMinConsumptionTheme,
  resolvePeakMinConsumptionLoading,
  PEAK_MIN_CONSUMPTION_THEME_PRESETS,
} from './peakMinConsumptionTheme';
import { resolvePeakMinConsumptionDisplayModel } from './peakMinConsumptionResolvers';
import { peakMinConsumptionWidgetPropsAreEqual } from './peakMinConsumptionMemoCompare';

function PeakMinConsumptionWidgetInner({
  energyConsumption,
  allEnergyChartsReady,
  energyConsumptionLoading = false,
  peakMinConsumptionLoading = false,
  chartLoadingPeakMinConsumption = false,
  transformDataForCharts,
  selectedDuration,
  currentDate,
  shellVariant = PEAK_MIN_CONSUMPTION_THEME_PRESETS.basic,
  chartSurface = 'dark',
  metricPanelBorder = null,
  isLargeScreen = false,
}) {
  const isLoading = useMemo(
    () =>
      resolvePeakMinConsumptionLoading({
        energyConsumptionLoading,
        peakMinConsumptionLoading,
        chartLoadingPeakMinConsumption,
      }),
    [
      energyConsumptionLoading,
      peakMinConsumptionLoading,
      chartLoadingPeakMinConsumption,
    ]
  );

  const theme = useMemo(
    () =>
      resolvePeakMinConsumptionTheme({
        preset: shellVariant,
        chartSurface,
        metricPanelBorder,
      }),
    [shellVariant, chartSurface, metricPanelBorder]
  );

  const displayModel = useMemo(
    () =>
      resolvePeakMinConsumptionDisplayModel({
        energyConsumption,
        transformDataForCharts,
        displayOptions: {
          unit: energyConsumption?.unit || '',
          selectedDuration,
          currentDate,
        },
      }),
    [energyConsumption, transformDataForCharts, selectedDuration, currentDate]
  );

  return (
    <PeakMinConsumptionCard
      isLoading={isLoading}
      peakDisplay={displayModel.peakDisplay}
      minDisplay={displayModel.minDisplay}
      theme={theme}
      isLargeScreen={isLargeScreen}
    />
  );
}

export const PeakMinConsumptionWidget = React.memo(
  PeakMinConsumptionWidgetInner,
  peakMinConsumptionWidgetPropsAreEqual
);

export default PeakMinConsumptionWidget;

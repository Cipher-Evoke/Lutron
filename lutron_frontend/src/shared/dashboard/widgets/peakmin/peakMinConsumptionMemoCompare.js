import { resolvePeakMinConsumptionLoading } from './peakMinConsumptionTheme';

export function peakMinConsumptionWidgetPropsAreEqual(prevProps, nextProps) {
  if (prevProps.allEnergyChartsReady !== nextProps.allEnergyChartsReady) return false;
  if (prevProps.energyConsumptionLoading !== nextProps.energyConsumptionLoading) return false;
  if (prevProps.peakMinConsumptionLoading !== nextProps.peakMinConsumptionLoading) return false;
  if (prevProps.chartLoadingPeakMinConsumption !== nextProps.chartLoadingPeakMinConsumption) {
    return false;
  }
  if (prevProps.shellVariant !== nextProps.shellVariant) return false;
  if (prevProps.chartSurface !== nextProps.chartSurface) return false;
  if (prevProps.metricPanelBorder !== nextProps.metricPanelBorder) return false;
  if (prevProps.isLargeScreen !== nextProps.isLargeScreen) return false;
  if (prevProps.selectedDuration !== nextProps.selectedDuration) return false;
  if (prevProps.currentDate !== nextProps.currentDate) return false;
  if (prevProps.transformDataForCharts !== nextProps.transformDataForCharts) return false;

  if (prevProps.energyConsumption !== nextProps.energyConsumption) {
    if (prevProps.energyConsumption && nextProps.energyConsumption) {
      try {
        if (
          JSON.stringify(prevProps.energyConsumption) ===
          JSON.stringify(nextProps.energyConsumption)
        ) {
          return true;
        }
      } catch (e) {
        // fall through
      }
    }
    return false;
  }

  return true;
}

export function legacyPeakMinConsumptionLoading(props) {
  return resolvePeakMinConsumptionLoading({
    allEnergyChartsReady: props.allEnergyChartsReady,
    energyConsumptionLoading: props.energyConsumptionLoading,
    peakMinConsumptionLoading: props.peakMinConsumptionLoading,
    chartLoadingPeakMinConsumption: props.chartLoadingPeakMinConsumption,
  });
}

export function sharedPeakMinConsumptionLoading(props) {
  return legacyPeakMinConsumptionLoading(props);
}

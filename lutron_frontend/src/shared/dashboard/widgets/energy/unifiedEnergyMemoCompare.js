import {
  resolveUnifiedEnergyLoading,
  resolveUnifiedEnergyData,
  resolveUnifiedEnergyChartData,
  resolveUnifiedEnergyPeakMin,
  resolveUnifiedEnergyPeakMinDisplay,
} from './unifiedEnergyTheme';
import { UNIFIED_ENERGY_WIDGET_MODES } from './energyWidgetModes';

export function unifiedEnergyWidgetPropsAreEqual(prevProps, nextProps) {
  if (prevProps.mode !== nextProps.mode) return false;
  if (prevProps.title !== nextProps.title) return false;
  if (prevProps.allEnergyChartsReady !== nextProps.allEnergyChartsReady) return false;
  if (prevProps.energyLoading !== nextProps.energyLoading) return false;
  if (prevProps.chartLoadingFlag !== nextProps.chartLoadingFlag) return false;
  if (prevProps.shellVariant !== nextProps.shellVariant) return false;
  if (prevProps.chartSurface !== nextProps.chartSurface) return false;
  if (prevProps.customDatesIncomplete !== nextProps.customDatesIncomplete) return false;
  if (prevProps.energyLightFullCardHeightPx !== nextProps.energyLightFullCardHeightPx) {
    return false;
  }
  if (prevProps.selectedDuration !== nextProps.selectedDuration) return false;
  if (prevProps.currentDate !== nextProps.currentDate) return false;
  if (prevProps.currentYear !== nextProps.currentYear) return false;
  if (prevProps.exportControl !== nextProps.exportControl) return false;
  if (prevProps.emptyStateExtras !== nextProps.emptyStateExtras) return false;
  if (prevProps.blankChartPreview !== nextProps.blankChartPreview) return false;
  if (prevProps.ChartLoader !== nextProps.ChartLoader) return false;
  if (prevProps.transformDataForCharts !== nextProps.transformDataForCharts) return false;
  if (prevProps.colors !== nextProps.colors) return false;
  if (prevProps.selectedAreas !== nextProps.selectedAreas) return false;

  if (prevProps.advancedSurface !== nextProps.advancedSurface) {
    const prevSurface = prevProps.advancedSurface;
    const nextSurface = nextProps.advancedSurface;
    if (prevSurface?.cardBackground !== nextSurface?.cardBackground) return false;
    if (prevSurface?.cardBorder !== nextSurface?.cardBorder) return false;
    if (prevSurface?.cardShadow !== nextSurface?.cardShadow) return false;
    if (prevSurface?.cssTooltipStyle !== nextSurface?.cssTooltipStyle) return false;
    if (prevSurface?.resolveThemePalette !== nextSurface?.resolveThemePalette) return false;
    if (prevSurface?.cardClassName !== nextSurface?.cardClassName) return false;
  }

  if (prevProps.customizedSurface !== nextProps.customizedSurface) {
    const prevSurface = prevProps.customizedSurface;
    const nextSurface = nextProps.customizedSurface;
    if (prevSurface?.cardShellStyle !== nextSurface?.cardShellStyle) return false;
    if (prevSurface?.cardHeaderStyle !== nextSurface?.cardHeaderStyle) return false;
    if (prevSurface?.plotStyleOverride !== nextSurface?.plotStyleOverride) return false;
    if (prevSurface?.loaderHeight !== nextSurface?.loaderHeight) return false;
    if (prevSurface?.legendSeriesName !== nextSurface?.legendSeriesName) return false;
  }

  if (prevProps.energyData !== nextProps.energyData) {
    if (prevProps.energyData && nextProps.energyData) {
      try {
        if (JSON.stringify(prevProps.energyData) === JSON.stringify(nextProps.energyData)) {
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

export function legacyUnifiedEnergyLoading(props) {
  return resolveUnifiedEnergyLoading({
    allEnergyChartsReady: props.allEnergyChartsReady,
    energyLoading: props.energyLoading,
    chartLoadingFlag: props.chartLoadingFlag,
    energyData: props.energyData,
    customDatesIncomplete: props.customDatesIncomplete,
  });
}

export function sharedUnifiedEnergyLoading(props) {
  return legacyUnifiedEnergyLoading(props);
}

export function sharedUnifiedEnergyPeakMinPipeline(energyData, mode, transformDataForCharts, displayOptions) {
  const chartData = resolveUnifiedEnergyChartData(energyData, mode, transformDataForCharts);
  const peakMin = resolveUnifiedEnergyPeakMin(chartData);
  return {
    chartData,
    peakMin,
    peakDisplay: resolveUnifiedEnergyPeakMinDisplay(peakMin.peak, displayOptions),
    minDisplay: resolveUnifiedEnergyPeakMinDisplay(peakMin.min, displayOptions),
  };
}

export const UNIFIED_ENERGY_MODES = UNIFIED_ENERGY_WIDGET_MODES;

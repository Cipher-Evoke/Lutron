import {
  resolveInstantOccupancyChartStatus,
  buildInstantOccupancyChartDataset,
  legacyInstantOccupancyPipeline,
} from './instantOccupancyConfig';

export function instantOccupancyChartPropsAreEqual(prevProps, nextProps) {
  if (prevProps.instantOccupancyCountLoading !== nextProps.instantOccupancyCountLoading) {
    return false;
  }
  if (prevProps.instantOccupancyCountError !== nextProps.instantOccupancyCountError) return false;
  if (prevProps.anyLoading !== nextProps.anyLoading) return false;
  if (prevProps.isLoading !== nextProps.isLoading) return false;
  if (prevProps.globalLoadingProp !== nextProps.globalLoadingProp) return false;
  if (prevProps.selectedDuration !== nextProps.selectedDuration) return false;
  if (prevProps.currentDate !== nextProps.currentDate) return false;
  if (prevProps.currentYear !== nextProps.currentYear) return false;
  if (prevProps.isNavigating !== nextProps.isNavigating) return false;
  if (prevProps.shellVariant !== nextProps.shellVariant) return false;
  if (prevProps.chartSurface !== nextProps.chartSurface) return false;
  if (prevProps.lineSeriesColor !== nextProps.lineSeriesColor) return false;
  if (prevProps.isFullscreen !== nextProps.isFullscreen) return false;
  if (prevProps.showChartsTab !== nextProps.showChartsTab) return false;
  if (prevProps.enableUtilizationFooter !== nextProps.enableUtilizationFooter) return false;
  if (prevProps.cardBackground !== nextProps.cardBackground) return false;
  if (prevProps.cardBorder !== nextProps.cardBorder) return false;
  if (prevProps.cardShadow !== nextProps.cardShadow) return false;

  if (prevProps.customDateRange !== nextProps.customDateRange) {
    if (prevProps.customDateRange && nextProps.customDateRange) {
      if (
        prevProps.customDateRange.startDate === nextProps.customDateRange.startDate &&
        prevProps.customDateRange.endDate === nextProps.customDateRange.endDate
      ) {
        // continue
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  if (prevProps.instantOccupancyCount !== nextProps.instantOccupancyCount) {
    if (prevProps.instantOccupancyCount && nextProps.instantOccupancyCount) {
      try {
        if (
          JSON.stringify(prevProps.instantOccupancyCount) ===
          JSON.stringify(nextProps.instantOccupancyCount)
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

export function legacyInstantOccupancyChartPropsAreEqual(prevProps, nextProps) {
  if (prevProps.instantOccupancyCount !== nextProps.instantOccupancyCount) return false;
  if (prevProps.instantOccupancyCountLoading !== nextProps.instantOccupancyCountLoading) {
    return false;
  }
  if (prevProps.instantOccupancyCountError !== nextProps.instantOccupancyCountError) return false;
  if (prevProps.anyLoading !== nextProps.anyLoading) return false;
  if (prevProps.isLoading !== nextProps.isLoading) return false;
  if (prevProps.globalLoadingProp !== nextProps.globalLoadingProp) return false;
  if (prevProps.selectedDuration !== nextProps.selectedDuration) return false;
  if (prevProps.chartSurface !== nextProps.chartSurface) return false;
  if (prevProps.isFullscreen !== nextProps.isFullscreen) return false;
  return true;
}

export function sharedInstantOccupancyStatus(props) {
  return resolveInstantOccupancyChartStatus(props);
}

export function sharedInstantOccupancyDataset(payload, options) {
  return buildInstantOccupancyChartDataset(payload, options);
}

export function legacyInstantOccupancyDataset(payload, options) {
  return legacyInstantOccupancyPipeline(payload, options);
}

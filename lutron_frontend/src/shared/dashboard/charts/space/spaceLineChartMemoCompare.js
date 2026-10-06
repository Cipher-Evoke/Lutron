import {
  resolveSpaceLineChartStatus,
  buildSpaceLineChartDataset,
  legacySpaceLineChartPipeline,
} from './spaceLineChartConfig';

/**
 * Shared React.memo comparator for SpaceLineChart adapter props.
 */
export function spaceLineChartPropsAreEqual(prevProps, nextProps) {
  if (prevProps.occupancyCountLoading !== nextProps.occupancyCountLoading) return false;
  if (prevProps.anyLoading !== nextProps.anyLoading) return false;
  if (prevProps.isLoading !== nextProps.isLoading) return false;
  if (prevProps.globalLoadingProp !== nextProps.globalLoadingProp) return false;
  if (prevProps.selectedDuration !== nextProps.selectedDuration) return false;
  if (prevProps.currentDate !== nextProps.currentDate) return false;
  if (prevProps.currentYear !== nextProps.currentYear) return false;
  if (prevProps.isNavigating !== nextProps.isNavigating) return false;
  if (prevProps.shellVariant !== nextProps.shellVariant) return false;
  if (prevProps.lineSeriesColor !== nextProps.lineSeriesColor) return false;
  if (prevProps.isFullscreen !== nextProps.isFullscreen) return false;
  if (prevProps.spaceShell !== nextProps.spaceShell) return false;
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

  if (prevProps.occupancyCount !== nextProps.occupancyCount) {
    if (prevProps.occupancyCount && nextProps.occupancyCount) {
      try {
        if (JSON.stringify(prevProps.occupancyCount) === JSON.stringify(nextProps.occupancyCount)) {
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

/**
 * Legacy comparator replicated from implicit re-render behavior (no memo in variants).
 */
export function legacySpaceLineChartPropsAreEqual(prevProps, nextProps) {
  if (prevProps.occupancyCount !== nextProps.occupancyCount) return false;
  if (prevProps.occupancyCountLoading !== nextProps.occupancyCountLoading) return false;
  if (prevProps.anyLoading !== nextProps.anyLoading) return false;
  if (prevProps.isLoading !== nextProps.isLoading) return false;
  if (prevProps.globalLoadingProp !== nextProps.globalLoadingProp) return false;
  if (prevProps.selectedDuration !== nextProps.selectedDuration) return false;
  if (prevProps.currentDate !== nextProps.currentDate) return false;
  if (prevProps.currentYear !== nextProps.currentYear) return false;
  if (prevProps.isNavigating !== nextProps.isNavigating) return false;
  if (prevProps.isFullscreen !== nextProps.isFullscreen) return false;
  if (prevProps.lineSeriesColor !== nextProps.lineSeriesColor) return false;
  if (prevProps.spaceShell !== nextProps.spaceShell) return false;
  return true;
}

export function sharedSpaceLineChartStatus(props) {
  return resolveSpaceLineChartStatus(props);
}

export function sharedSpaceLineChartDataset(occupancyCount, options) {
  return buildSpaceLineChartDataset(occupancyCount, options);
}

export function legacySpaceLineChartDataset(occupancyCount, options) {
  return legacySpaceLineChartPipeline(occupancyCount, options);
}

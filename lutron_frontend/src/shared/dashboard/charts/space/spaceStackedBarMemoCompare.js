import {
  resolveSpaceStackedBarChartStatus,
  buildSpaceStackedBarChartDataset,
  legacySpaceStackedBarPipeline,
} from './spaceStackedBarConfig';

/**
 * Shared React.memo comparator for SpaceStackedBarChart adapter props.
 */
export function spaceStackedBarChartPropsAreEqual(prevProps, nextProps) {
  if (prevProps.activeOccupancyByGroupLoading !== nextProps.activeOccupancyByGroupLoading) {
    return false;
  }
  if (prevProps.anyLoading !== nextProps.anyLoading) return false;
  if (prevProps.isLoading !== nextProps.isLoading) return false;
  if (prevProps.globalLoadingProp !== nextProps.globalLoadingProp) return false;
  if (prevProps.shellVariant !== nextProps.shellVariant) return false;
  if (prevProps.showChartsTab !== nextProps.showChartsTab) return false;
  if (prevProps.spaceShell !== nextProps.spaceShell) return false;
  if (prevProps.stackedBarColors !== nextProps.stackedBarColors) return false;
  if (prevProps.cardBackground !== nextProps.cardBackground) return false;
  if (prevProps.cardBorder !== nextProps.cardBorder) return false;
  if (prevProps.cardShadow !== nextProps.cardShadow) return false;
  if (prevProps.colorPalette !== nextProps.colorPalette) return false;
  if (prevProps.resolveGroupLabel !== nextProps.resolveGroupLabel) return false;
  if (prevProps.requireAreaGroupName !== nextProps.requireAreaGroupName) return false;

  if (prevProps.activeOccupancyByGroup !== nextProps.activeOccupancyByGroup) {
    if (prevProps.activeOccupancyByGroup && nextProps.activeOccupancyByGroup) {
      try {
        if (
          JSON.stringify(prevProps.activeOccupancyByGroup) ===
          JSON.stringify(nextProps.activeOccupancyByGroup)
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

export function legacySpaceStackedBarChartPropsAreEqual(prevProps, nextProps) {
  if (prevProps.activeOccupancyByGroup !== nextProps.activeOccupancyByGroup) return false;
  if (prevProps.activeOccupancyByGroupLoading !== nextProps.activeOccupancyByGroupLoading) {
    return false;
  }
  if (prevProps.anyLoading !== nextProps.anyLoading) return false;
  if (prevProps.isLoading !== nextProps.isLoading) return false;
  if (prevProps.globalLoadingProp !== nextProps.globalLoadingProp) return false;
  if (prevProps.showChartsTab !== nextProps.showChartsTab) return false;
  if (prevProps.spaceShell !== nextProps.spaceShell) return false;
  if (prevProps.stackedBarColors !== nextProps.stackedBarColors) return false;
  if (prevProps.resolveGroupLabel !== nextProps.resolveGroupLabel) return false;
  return true;
}

export function sharedSpaceStackedBarStatus(props) {
  return resolveSpaceStackedBarChartStatus(props);
}

export function sharedSpaceStackedBarDataset(payload, options) {
  return buildSpaceStackedBarChartDataset(payload, options);
}

export function legacySpaceStackedBarDataset(payload, options) {
  return legacySpaceStackedBarPipeline(payload, options);
}

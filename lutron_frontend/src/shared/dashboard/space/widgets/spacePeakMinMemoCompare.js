import { resolveSpacePeakMinLoading } from './spacePeakMinTheme';

export function spacePeakMinCardsPropsAreEqual(prevProps, nextProps) {
  if (prevProps.isLoading !== nextProps.isLoading) return false;
  if (prevProps.shellVariant !== nextProps.shellVariant) return false;
  if (prevProps.chartSurface !== nextProps.chartSurface) return false;
  if (prevProps.metricPanelBorder !== nextProps.metricPanelBorder) return false;
  if (prevProps.isLargeScreen !== nextProps.isLargeScreen) return false;
  if (prevProps.showChartsTab !== nextProps.showChartsTab) return false;
  if (prevProps.selectedDuration !== nextProps.selectedDuration) return false;
  if (prevProps.currentDate !== nextProps.currentDate) return false;
  if (prevProps.includeInstantLoading !== nextProps.includeInstantLoading) return false;

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

  if (prevProps.occupancyCount !== nextProps.occupancyCount) {
    if (prevProps.occupancyCount && nextProps.occupancyCount) {
      try {
        if (
          JSON.stringify(prevProps.occupancyCount) ===
          JSON.stringify(nextProps.occupancyCount)
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

export function legacySpacePeakMinLoading(props) {
  return resolveSpacePeakMinLoading({
    instantOccupancyCountLoading: props.instantOccupancyCountLoading,
    anyLoading: props.anyLoading,
    isLoading: props.isLoading,
    globalLoadingProp: props.globalLoadingProp,
    includeInstantLoading: props.includeInstantLoading !== false,
  });
}

export function sharedSpacePeakMinLoading(props) {
  if (props.isLoading !== undefined) {
    return props.isLoading;
  }
  return legacySpacePeakMinLoading(props);
}

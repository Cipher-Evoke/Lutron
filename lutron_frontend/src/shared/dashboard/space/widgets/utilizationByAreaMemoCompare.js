import { resolveUtilizationByAreaLoading } from './utilizationByAreaTheme';

export function utilizationByAreaListPropsAreEqual(prevProps, nextProps) {
  if (prevProps.shellVariant !== nextProps.shellVariant) return false;
  if (prevProps.chartSurface !== nextProps.chartSurface) return false;
  if (prevProps.customizedTheme !== nextProps.customizedTheme) return false;
  if (prevProps.layoutMode !== nextProps.layoutMode) return false;
  if (prevProps.dataLoading !== nextProps.dataLoading) return false;
  if (prevProps.anyLoading !== nextProps.anyLoading) return false;
  if (prevProps.isLoading !== nextProps.isLoading) return false;
  if (prevProps.globalLoadingProp !== nextProps.globalLoadingProp) return false;
  if (prevProps.emptyMessage !== nextProps.emptyMessage) return false;
  if (prevProps.isLargeScreen !== nextProps.isLargeScreen) return false;

  const prevOpts = prevProps.processOptions || {};
  const nextOpts = nextProps.processOptions || {};
  if (prevOpts.strictOccupiedType !== nextOpts.strictOccupiedType) return false;
  if (JSON.stringify(prevOpts.selectedGroupIds) !== JSON.stringify(nextOpts.selectedGroupIds)) {
    return false;
  }
  if (prevOpts.areaGroups !== nextOpts.areaGroups) {
    if (prevOpts.areaGroups && nextOpts.areaGroups) {
      try {
        if (JSON.stringify(prevOpts.areaGroups) === JSON.stringify(nextOpts.areaGroups)) {
          return true;
        }
      } catch (e) {
        // fall through
      }
    }
    return false;
  }

  if (prevProps.payload !== nextProps.payload) {
    if (prevProps.payload && nextProps.payload) {
      try {
        if (JSON.stringify(prevProps.payload) === JSON.stringify(nextProps.payload)) {
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

export function legacyUtilizationByAreaLoading(props) {
  return resolveUtilizationByAreaLoading({
    dataLoading: props.dataLoading,
    anyLoading: props.anyLoading,
    isLoading: props.isLoading,
    globalLoadingProp: props.globalLoadingProp,
  });
}

export function sharedUtilizationByAreaLoading(props) {
  return legacyUtilizationByAreaLoading(props);
}

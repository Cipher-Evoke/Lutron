/**
 * Shared React.memo comparator for legacy EnergyLineChart adapter props.
 * Returns true when props are equal (skip re-render).
 */
export function energyLineChartPropsAreEqual(prevProps, nextProps) {
  if (prevProps.title !== nextProps.title) return false;
  if (prevProps.isLoading !== nextProps.isLoading) return false;
  if (prevProps.colors !== nextProps.colors) return false;
  if (prevProps.energyMode !== nextProps.energyMode) return false;
  if (prevProps.onEmail !== nextProps.onEmail) return false;
  if (prevProps.onDownload !== nextProps.onDownload) return false;
  if (prevProps.exportControl !== nextProps.exportControl) return false;

  if ('chartSurface' in prevProps || 'chartSurface' in nextProps) {
    if (prevProps.chartSurface !== nextProps.chartSurface) return false;
  }

  if ('legendSeriesName' in prevProps || 'legendSeriesName' in nextProps) {
    if (prevProps.legendSeriesName !== nextProps.legendSeriesName) return false;
  }

  if ('emptyStateVariant' in prevProps || 'emptyStateVariant' in nextProps) {
    if (prevProps.emptyStateVariant !== nextProps.emptyStateVariant) return false;
  }

  if ('showDurationControls' in prevProps || 'showDurationControls' in nextProps) {
    if (prevProps.showDurationControls !== nextProps.showDurationControls) return false;
  }

  if (prevProps.data !== nextProps.data) {
    if (prevProps.data && nextProps.data) {
      try {
        const prevDataStr = JSON.stringify(prevProps.data);
        const nextDataStr = JSON.stringify(nextProps.data);
        if (prevDataStr === nextDataStr) {
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

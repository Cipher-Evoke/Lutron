import { resolveTotalConsumptionByGroupLoading } from './totalConsumptionByGroupTheme';

export function totalConsumptionByGroupWidgetPropsAreEqual(prevProps, nextProps) {
  if (prevProps.title !== nextProps.title) return false;
  if (prevProps.allEnergyChartsReady !== nextProps.allEnergyChartsReady) return false;
  if (prevProps.chartLoadingTotalConsumptionByGroup !== nextProps.chartLoadingTotalConsumptionByGroup) {
    return false;
  }
  if (prevProps.shellVariant !== nextProps.shellVariant) return false;
  if (prevProps.chartSurface !== nextProps.chartSurface) return false;
  if (prevProps.energyLightFullCardHeightPx !== nextProps.energyLightFullCardHeightPx) return false;
  if (prevProps.exportControl !== nextProps.exportControl) return false;
  if (prevProps.ChartLoader !== nextProps.ChartLoader) return false;
  if (prevProps.areaGroups !== nextProps.areaGroups) return false;
  if (prevProps.areaIdToDisplayName !== nextProps.areaIdToDisplayName) return false;

  if (prevProps.advancedSurface !== nextProps.advancedSurface) {
    const prevSurface = prevProps.advancedSurface;
    const nextSurface = nextProps.advancedSurface;
    if (prevSurface?.cardBackground !== nextSurface?.cardBackground) return false;
    if (prevSurface?.cardBorder !== nextSurface?.cardBorder) return false;
    if (prevSurface?.cardShadow !== nextSurface?.cardShadow) return false;
    if (prevSurface?.cssTooltipStyle !== nextSurface?.cssTooltipStyle) return false;
    if (prevSurface?.resolveThemePalette !== nextSurface?.resolveThemePalette) return false;
    if (prevSurface?.resolveSegmentLabelColors !== nextSurface?.resolveSegmentLabelColors) {
      return false;
    }
  }

  if (prevProps.customizedSurface !== nextProps.customizedSurface) {
    const prevSurface = prevProps.customizedSurface;
    const nextSurface = nextProps.customizedSurface;
    if (prevSurface?.cardShellStyle !== nextSurface?.cardShellStyle) return false;
    if (prevSurface?.cardHeaderStyle !== nextSurface?.cardHeaderStyle) return false;
    if (prevSurface?.plotStyleOverride !== nextSurface?.plotStyleOverride) return false;
    if (prevSurface?.loaderHeight !== nextSurface?.loaderHeight) return false;
  }

  if (prevProps.totalConsumptionByGroup !== nextProps.totalConsumptionByGroup) {
    if (prevProps.totalConsumptionByGroup && nextProps.totalConsumptionByGroup) {
      try {
        if (
          JSON.stringify(prevProps.totalConsumptionByGroup) ===
          JSON.stringify(nextProps.totalConsumptionByGroup)
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

export function legacyTotalConsumptionByGroupLoading(props) {
  return resolveTotalConsumptionByGroupLoading({
    allEnergyChartsReady: props.allEnergyChartsReady,
    chartLoadingTotalConsumptionByGroup: props.chartLoadingTotalConsumptionByGroup,
    totalConsumptionByGroup: props.totalConsumptionByGroup,
  });
}

export function sharedTotalConsumptionByGroupLoading(props) {
  return legacyTotalConsumptionByGroupLoading(props);
}

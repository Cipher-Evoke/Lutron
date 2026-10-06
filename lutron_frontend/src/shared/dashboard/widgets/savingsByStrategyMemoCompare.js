import { sharedSavingsStrategyStatus } from '../charts/savings/savingsStrategyMemoCompare';
import { resolveSavingsByStrategyLoading } from './savingsByStrategyTheme';

export function savingsByStrategyWidgetPropsAreEqual(prevProps, nextProps) {
  if (prevProps.title !== nextProps.title) return false;
  if (prevProps.allEnergyChartsReady !== nextProps.allEnergyChartsReady) return false;
  if (prevProps.chartLoadingSavingsByStrategy !== nextProps.chartLoadingSavingsByStrategy) {
    return false;
  }
  if (prevProps.globalLoading !== nextProps.globalLoading) return false;
  if (prevProps.shellVariant !== nextProps.shellVariant) return false;
  if (prevProps.chartSurface !== nextProps.chartSurface) return false;
  if (prevProps.embedded !== nextProps.embedded) return false;
  if (prevProps.customDatesIncomplete !== nextProps.customDatesIncomplete) return false;
  if (prevProps.energyLightFullCardHeightPx !== nextProps.energyLightFullCardHeightPx) {
    return false;
  }
  if (prevProps.ChartLoader !== nextProps.ChartLoader) return false;

  if (prevProps.advancedSurface !== nextProps.advancedSurface) {
    const prevSurface = prevProps.advancedSurface;
    const nextSurface = nextProps.advancedSurface;
    if (prevSurface?.cardBackground !== nextSurface?.cardBackground) return false;
    if (prevSurface?.cardBorder !== nextSurface?.cardBorder) return false;
    if (prevSurface?.cardShadow !== nextSurface?.cardShadow) return false;
    if (prevSurface?.cssTooltipStyle !== nextSurface?.cssTooltipStyle) return false;
    if (prevSurface?.resolveThemeColor !== nextSurface?.resolveThemeColor) return false;
    if (prevSurface?.resolveSegmentLabelColors !== nextSurface?.resolveSegmentLabelColors) {
      return false;
    }
    if (prevSurface?.cardClassName !== nextSurface?.cardClassName) return false;
    if (prevSurface?.loaderHeight !== nextSurface?.loaderHeight) return false;
  }

  if (prevProps.customizedSurface !== nextProps.customizedSurface) {
    const prevSurface = prevProps.customizedSurface;
    const nextSurface = nextProps.customizedSurface;
    if (prevSurface?.cardShellStyle !== nextSurface?.cardShellStyle) return false;
    if (prevSurface?.plotStyleOverride !== nextSurface?.plotStyleOverride) return false;
    if (prevSurface?.loaderHeight !== nextSurface?.loaderHeight) return false;
  }

  if (prevProps.savingsByStrategy !== nextProps.savingsByStrategy) {
    if (prevProps.savingsByStrategy && nextProps.savingsByStrategy) {
      try {
        if (
          JSON.stringify(prevProps.savingsByStrategy) ===
          JSON.stringify(nextProps.savingsByStrategy)
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

export function legacySavingsByStrategyLoading(props) {
  return resolveSavingsByStrategyLoading({
    allEnergyChartsReady: props.allEnergyChartsReady,
    chartLoadingSavingsByStrategy: props.chartLoadingSavingsByStrategy,
    globalLoading: props.globalLoading,
    savingsByStrategy: props.savingsByStrategy,
    customDatesIncomplete: props.customDatesIncomplete,
  });
}

export function sharedSavingsByStrategyWidgetLoading(props) {
  return legacySavingsByStrategyLoading(props);
}

export function sharedSavingsByStrategyWidgetStatus(
  savingsByStrategy,
  { isLoading, globalLoading, customDatesIncomplete = false }
) {
  return sharedSavingsStrategyStatus(savingsByStrategy, {
    isLoading,
    globalLoading,
    customDatesIncomplete,
  });
}

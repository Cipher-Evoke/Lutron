import {
  resolveLightPowerDensityStatus,
  resolveLightPowerDensityDisplay,
} from './LightPowerDensityWidget';

export function lightPowerDensityWidgetPropsAreEqual(prevProps, nextProps) {
  if (prevProps.lightingUnit !== nextProps.lightingUnit) return false;
  if (prevProps.allEnergyChartsReady !== nextProps.allEnergyChartsReady) return false;
  if (prevProps.chartLoadingLightPowerDensity !== nextProps.chartLoadingLightPowerDensity) {
    return false;
  }
  if (prevProps.shellVariant !== nextProps.shellVariant) return false;
  if (prevProps.chartSurface !== nextProps.chartSurface) return false;
  if (prevProps.metricPanelBorder !== nextProps.metricPanelBorder) return false;
  if (prevProps.isLargeScreen !== nextProps.isLargeScreen) return false;

  if (prevProps.lightPowerDensity !== nextProps.lightPowerDensity) {
    if (prevProps.lightPowerDensity && nextProps.lightPowerDensity) {
      try {
        if (
          JSON.stringify(prevProps.lightPowerDensity) ===
          JSON.stringify(nextProps.lightPowerDensity)
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

export function legacyLightPowerDensityWidgetPropsAreEqual(prevProps, nextProps) {
  if (prevProps.lightPowerDensity !== nextProps.lightPowerDensity) return false;
  if (prevProps.lightingUnit !== nextProps.lightingUnit) return false;
  if (prevProps.allEnergyChartsReady !== nextProps.allEnergyChartsReady) return false;
  if (prevProps.chartLoadingLightPowerDensity !== nextProps.chartLoadingLightPowerDensity) {
    return false;
  }
  return true;
}

export function sharedLightPowerDensityStatus(props) {
  return resolveLightPowerDensityStatus(props);
}

export function sharedLightPowerDensityDisplay(payload, lightingUnit) {
  return resolveLightPowerDensityDisplay(payload, lightingUnit);
}

export function legacyLightPowerDensityDisplay(payload, lightingUnit) {
  return resolveLightPowerDensityDisplay(payload, lightingUnit);
}

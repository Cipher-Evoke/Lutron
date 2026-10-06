import React, { useMemo } from 'react';
import { LightPowerDensityCard } from './LightPowerDensityCard';
import {
  resolveLightPowerDensityTheme,
  LIGHT_POWER_DENSITY_THEME_PRESETS,
} from './lightPowerDensityTheme';
import { lightPowerDensityWidgetPropsAreEqual } from './lightPowerDensityMemoCompare';

export function resolveLightPowerDensityStatus({
  chartLoadingLightPowerDensity,
  lightPowerDensity,
}) {
  if (chartLoadingLightPowerDensity || !lightPowerDensity) {
    return 'loading';
  }
  return 'ready';
}

export function resolveLightPowerDensityDisplay(lightPowerDensity, lightingUnit) {
  let value = 0;
  let unit = lightingUnit;

  if (lightPowerDensity && lightPowerDensity.status === 'success') {
    if (lightingUnit === 'Watt / Sq ft') {
      value = lightPowerDensity.watt_per_sqft;
      unit = lightPowerDensity.unit || '';
    } else if (lightingUnit === 'Watt / Sq m') {
      value = lightPowerDensity.watt_per_sqm;
      unit = lightPowerDensity.unit || '';
    }

    if (value === null || value === undefined) {
      value = 'No data';
      unit = '';
    }
  } else {
    value = 'No data';
    unit = '';
  }

  return { value, unit };
}

function LightPowerDensityWidgetInner({
  lightPowerDensity,
  lightingUnit,
  allEnergyChartsReady,
  chartLoadingLightPowerDensity = false,
  shellVariant = LIGHT_POWER_DENSITY_THEME_PRESETS.basic,
  chartSurface = 'dark',
  metricPanelBorder = null,
  isLargeScreen = false,
}) {
  const theme = useMemo(
    () =>
      resolveLightPowerDensityTheme({
        preset: shellVariant,
        chartSurface,
        metricPanelBorder,
      }),
    [shellVariant, chartSurface, metricPanelBorder]
  );

  const status = useMemo(
    () =>
      resolveLightPowerDensityStatus({
        chartLoadingLightPowerDensity,
        lightPowerDensity,
      }),
    [chartLoadingLightPowerDensity, lightPowerDensity]
  );

  const display = useMemo(() => {
    if (status !== 'ready') return null;
    return resolveLightPowerDensityDisplay(lightPowerDensity, lightingUnit);
  }, [status, lightPowerDensity, lightingUnit]);

  return (
    <LightPowerDensityCard
      status={status}
      display={display}
      theme={theme}
      isLargeScreen={isLargeScreen}
    />
  );
}

export const LightPowerDensityWidget = React.memo(
  LightPowerDensityWidgetInner,
  lightPowerDensityWidgetPropsAreEqual
);

export default LightPowerDensityWidget;

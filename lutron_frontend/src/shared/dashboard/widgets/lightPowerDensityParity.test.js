/**
 * @jest-environment node
 */
import {
  resolveLightPowerDensityStatus,
  resolveLightPowerDensityDisplay,
} from './LightPowerDensityWidget';
import {
  resolveLightPowerDensityTheme,
  LIGHT_POWER_DENSITY_THEME_PRESETS,
} from './lightPowerDensityTheme';
import {
  lightPowerDensityWidgetPropsAreEqual,
  legacyLightPowerDensityWidgetPropsAreEqual,
  sharedLightPowerDensityStatus,
  sharedLightPowerDensityDisplay,
  legacyLightPowerDensityDisplay,
} from './lightPowerDensityMemoCompare';

const sqftPayload = {
  status: 'success',
  watt_per_sqft: 1.25,
  watt_per_sqm: 13.45,
  unit: 'W/ft²',
};

const sqmPayload = {
  status: 'success',
  watt_per_sqft: 1.25,
  watt_per_sqm: 13.45,
  unit: 'W/m²',
};

const nullValuePayload = {
  status: 'success',
  watt_per_sqft: null,
  watt_per_sqm: null,
  unit: 'W/ft²',
};

describe('LightPowerDensity display parity', () => {
  it('legacy result === shared result for sqft fixture matrix', () => {
    const fixtures = [
      { payload: sqftPayload, unit: 'Watt / Sq ft', expected: { value: 1.25, unit: 'W/ft²' } },
      { payload: sqmPayload, unit: 'Watt / Sq m', expected: { value: 13.45, unit: 'W/m²' } },
      { payload: nullValuePayload, unit: 'Watt / Sq ft', expected: { value: 'No data', unit: '' } },
      { payload: { status: 'error' }, unit: 'Watt / Sq ft', expected: { value: 'No data', unit: '' } },
      { payload: null, unit: 'Watt / Sq ft', expected: { value: 'No data', unit: '' } },
    ];

    for (const { payload, unit, expected } of fixtures) {
      expect(sharedLightPowerDensityDisplay(payload, unit)).toEqual(
        legacyLightPowerDensityDisplay(payload, unit)
      );
      expect(sharedLightPowerDensityDisplay(payload, unit)).toEqual(expected);
    }
  });
});

describe('LightPowerDensity status parity', () => {
  it('does not wait on sibling Energy widgets', () => {
    expect(
      sharedLightPowerDensityStatus({
        allEnergyChartsReady: false,
        chartLoadingLightPowerDensity: false,
        lightPowerDensity: sqftPayload,
      })
    ).toBe('ready');
  });

  it('loading when chart loading flag set', () => {
    expect(
      resolveLightPowerDensityStatus({
        allEnergyChartsReady: true,
        chartLoadingLightPowerDensity: true,
        lightPowerDensity: sqftPayload,
      })
    ).toBe('loading');
  });

  it('loading when payload missing', () => {
    expect(
      sharedLightPowerDensityStatus({
        allEnergyChartsReady: true,
        chartLoadingLightPowerDensity: false,
        lightPowerDensity: null,
      })
    ).toBe('loading');
  });

  it('ready when payload present and charts ready', () => {
    expect(
      sharedLightPowerDensityStatus({
        allEnergyChartsReady: true,
        chartLoadingLightPowerDensity: false,
        lightPowerDensity: sqftPayload,
      })
    ).toBe('ready');
  });
});

describe('LightPowerDensity theme variant differences', () => {
  it('basic light surface uses blue panel', () => {
    const theme = resolveLightPowerDensityTheme({
      preset: LIGHT_POWER_DENSITY_THEME_PRESETS.basic,
      chartSurface: 'light',
    });
    expect(theme.panelBg).toBe('#1565C0');
    expect(theme.loadingBorderRadius).toBe('4px');
    expect(theme.showUnitSubtitle).toBe(false);
  });

  it('basic dark surface uses dark panel', () => {
    const theme = resolveLightPowerDensityTheme({
      preset: LIGHT_POWER_DENSITY_THEME_PRESETS.basic,
      chartSurface: 'dark',
    });
    expect(theme.panelBg).toBe('#232323');
  });

  it('advanced uses CSS variable panel bg and optional border', () => {
    const theme = resolveLightPowerDensityTheme({
      preset: LIGHT_POWER_DENSITY_THEME_PRESETS.advanced,
      metricPanelBorder: '1px solid #fff',
    });
    expect(theme.panelBg).toContain('--dashboard-chart-loading-bg');
    expect(theme.panelBorder).toBe('1px solid #fff');
  });

  it('customized fills container and shows unit subtitle', () => {
    const theme = resolveLightPowerDensityTheme({
      preset: LIGHT_POWER_DENSITY_THEME_PRESETS.customized,
    });
    expect(theme.fillContainer).toBe(true);
    expect(theme.showUnitSubtitle).toBe(true);
    expect(theme.readyPadding).toBe('16px 14px');
  });
});

describe('LightPowerDensity memo comparator parity', () => {
  const baseProps = {
    lightPowerDensity: sqftPayload,
    lightingUnit: 'Watt / Sq ft',
    allEnergyChartsReady: true,
    chartLoadingLightPowerDensity: false,
    shellVariant: 'basic',
    chartSurface: 'dark',
    isLargeScreen: true,
  };

  it('shared comparator treats deep-equal payload as equal', () => {
    const next = { ...baseProps, lightPowerDensity: { ...sqftPayload } };
    expect(lightPowerDensityWidgetPropsAreEqual(baseProps, next)).toBe(true);
  });

  it('shared comparator detects unit change', () => {
    expect(
      lightPowerDensityWidgetPropsAreEqual(baseProps, {
        ...baseProps,
        lightingUnit: 'Watt / Sq m',
      })
    ).toBe(false);
  });

  it('legacy comparator ignores shell variant props', () => {
    expect(
      legacyLightPowerDensityWidgetPropsAreEqual(baseProps, {
        ...baseProps,
        shellVariant: 'customized',
      })
    ).toBe(true);
  });
});

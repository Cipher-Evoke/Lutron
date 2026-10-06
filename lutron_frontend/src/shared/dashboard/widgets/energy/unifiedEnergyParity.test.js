/**
 * @jest-environment node
 */
import { transformDataForCharts } from '../../charts/transforms/transformDataForCharts';
import {
  resolveUnifiedEnergyLoading,
  resolveUnifiedEnergyData,
  resolveUnifiedEnergyEmptyStateVariant,
  resolveUnifiedEnergyChartData,
  resolveUnifiedEnergyPeakMin,
  resolveUnifiedEnergyPeakMinDisplay,
  resolveUnifiedEnergyExportActions,
  resolveUnifiedEnergyTheme,
  UNIFIED_ENERGY_THEME_PRESETS,
} from './unifiedEnergyTheme';
import { UNIFIED_ENERGY_WIDGET_MODES } from './energyWidgetModes';
import {
  unifiedEnergyWidgetPropsAreEqual,
  legacyUnifiedEnergyLoading,
  sharedUnifiedEnergyLoading,
  sharedUnifiedEnergyPeakMinPipeline,
} from './unifiedEnergyMemoCompare';
import {
  createEnergyExportActionMap,
  ENERGY_EXPORT_WIDGET_KEYS,
} from '../../export/energyExportActionMap';

const areaTree = {
  tree: [{ area_id: 1, name: 'Area One' }],
};

const transformOptions = {
  selectedDuration: 'this-week',
  selectedAreas: [1],
  areaTree,
};

const consumptionPayload = {
  'x-axis': Array.from({ length: 29 }, (_, i) => (i === 0 || i === 28 ? 'Sun 0' : `Mon ${i}`)),
  'y-axis': { 'Combined Areas': Array.from({ length: 29 }, (_, i) => i * 10) },
  unit: 'kWh',
  max_limit: 500,
};

const savingsPayload = {
  'x-axis': ['Mon 0', 'Tue 0', 'Wed 0'],
  'y-axis': { 'Combined Areas': [5, 15, 0] },
  unit: 'kWh',
};

function legacyLoading(props) {
  if (props.customDatesIncomplete) return false;
  return (
    props.energyLoading ||
    props.chartLoadingFlag ||
    !props.energyData
  );
}

describe('UnifiedEnergy loading parity', () => {
  const readyProps = {
    allEnergyChartsReady: true,
    energyLoading: false,
    chartLoadingFlag: false,
    energyData: consumptionPayload,
    customDatesIncomplete: false,
  };

  it('consumption basic legacy loading matches shared resolver', () => {
    expect(sharedUnifiedEnergyLoading(readyProps)).toBe(legacyLoading(readyProps));
    expect(sharedUnifiedEnergyLoading(readyProps)).toBe(false);
  });

  it('savings advanced legacy loading matches shared resolver', () => {
    const savingsReady = { ...readyProps, energyData: savingsPayload };
    expect(resolveUnifiedEnergyLoading(savingsReady)).toBe(legacyLoading(savingsReady));
  });

  it('customized custom-date gate disables loading', () => {
    expect(
      resolveUnifiedEnergyLoading({
        ...readyProps,
        customDatesIncomplete: true,
        energyData: null,
      })
    ).toBe(false);
  });

  it('loading when payload missing', () => {
    expect(
      resolveUnifiedEnergyLoading({ ...readyProps, energyData: null })
    ).toBe(true);
  });

  it('does not wait on sibling Energy widgets', () => {
    expect(
      resolveUnifiedEnergyLoading({ ...readyProps, allEnergyChartsReady: false })
    ).toBe(false);
  });
});

describe('UnifiedEnergy empty state parity', () => {
  it('custom dates incomplete yields blank variant and null data', () => {
    expect(resolveUnifiedEnergyEmptyStateVariant(true)).toBe('blank');
    expect(
      resolveUnifiedEnergyData({
        energyData: consumptionPayload,
        customDatesIncomplete: true,
      })
    ).toBeNull();
  });

  it('ready path preserves payload', () => {
    expect(
      resolveUnifiedEnergyData({
        energyData: consumptionPayload,
        customDatesIncomplete: false,
      })
    ).toBe(consumptionPayload);
  });
});

describe('UnifiedEnergy theme parity', () => {
  it('basic consumption light theme sets card height', () => {
    const theme = resolveUnifiedEnergyTheme({
      preset: UNIFIED_ENERGY_THEME_PRESETS.basic,
      mode: UNIFIED_ENERGY_WIDGET_MODES.consumption,
      chartSurface: 'light',
      energyLightFullCardHeightPx: 500,
    });
    expect(theme.shellVariant).toBe('basic-energy');
    expect(theme.loaderLight).toBe(true);
    expect(theme.outerStyleOverride.height).toBe(500);
  });

  it('advanced theme wires palette resolver', () => {
    const resolveThemePalette = () => ['#fff'];
    const theme = resolveUnifiedEnergyTheme({
      preset: UNIFIED_ENERGY_THEME_PRESETS.advanced,
      advancedSurface: {
        cardBackground: '#111',
        cardBorder: '1px solid #222',
        cardShadow: 'none',
        resolveThemePalette,
      },
    });
    expect(theme.resolveThemePalette).toBe(resolveThemePalette);
  });

  it('customized consumption uses bold stroke and W fallback', () => {
    const theme = resolveUnifiedEnergyTheme({
      preset: UNIFIED_ENERGY_THEME_PRESETS.customized,
      mode: UNIFIED_ENERGY_WIDGET_MODES.consumption,
      customizedSurface: { legendSeriesName: 'Energy Consumption' },
    });
    expect(theme.strokeWidthProfile).toBe('bold');
    expect(theme.dynamicUnitFallback).toBe('W');
    expect(theme.legendSeriesName).toBe('Energy Consumption');
  });

  it('customized savings has empty dynamic unit fallback', () => {
    const theme = resolveUnifiedEnergyTheme({
      preset: UNIFIED_ENERGY_THEME_PRESETS.customized,
      mode: UNIFIED_ENERGY_WIDGET_MODES.savings,
    });
    expect(theme.dynamicUnitFallback).toBe('');
  });
});

describe('UnifiedEnergy peak/min pipeline', () => {
  it('consumption chart data produces peak/min display', () => {
    const transform = (data, type) =>
      transformDataForCharts(data, type, transformOptions);
    const pipeline = sharedUnifiedEnergyPeakMinPipeline(
      consumptionPayload,
      UNIFIED_ENERGY_WIDGET_MODES.consumption,
      transform,
      { unit: 'kWh', selectedDuration: 'this-week', currentDate: '2024-06-10' }
    );
    expect(pipeline.chartData.length).toBeGreaterThan(0);
    expect(pipeline.peakMin.peak.value).toBe(270);
    expect(pipeline.peakDisplay.valueText).toBeTruthy();
    expect(pipeline.minDisplay.valueText).toBeTruthy();
  });

  it('resolveUnifiedEnergyPeakMinDisplay delegates to shared formatter', () => {
    const display = resolveUnifiedEnergyPeakMinDisplay(
      { value: 100, time: '09:00' },
      { unit: 'kWh' }
    );
    expect(display.valueText).toContain('100');
  });
});

describe('UnifiedEnergy export routing', () => {
  const thunks = {
    sendEnergyConsumptionEmail: 'c-email',
    downloadEnergyConsumption: 'c-dl',
    sendEnergySavingsEmail: 's-email',
    downloadEnergySavings: 's-dl',
  };

  it('consumption resolves consumption export actions', () => {
    const actions = resolveUnifiedEnergyExportActions(
      UNIFIED_ENERGY_WIDGET_MODES.consumption,
      thunks
    );
    expect(actions.emailThunk).toBe('c-email');
    expect(actions.downloadThunk).toBe('c-dl');
  });

  it('savings resolves savings export actions', () => {
    const actions = resolveUnifiedEnergyExportActions(
      UNIFIED_ENERGY_WIDGET_MODES.savings,
      thunks
    );
    expect(actions.emailThunk).toBe('s-email');
    expect(actions.downloadThunk).toBe('s-dl');
  });

  it('matches energy export foundation map', () => {
    const map = createEnergyExportActionMap(thunks);
    expect(
      resolveUnifiedEnergyExportActions(UNIFIED_ENERGY_WIDGET_MODES.consumption, thunks)
    ).toEqual(map[ENERGY_EXPORT_WIDGET_KEYS.CONSUMPTION]);
    expect(
      resolveUnifiedEnergyExportActions(UNIFIED_ENERGY_WIDGET_MODES.savings, thunks)
    ).toEqual(map[ENERGY_EXPORT_WIDGET_KEYS.SAVINGS]);
  });
});

describe('unifiedEnergyWidgetPropsAreEqual', () => {
  const base = {
    mode: UNIFIED_ENERGY_WIDGET_MODES.consumption,
    title: 'Consumption',
    energyData: consumptionPayload,
    allEnergyChartsReady: true,
    energyLoading: false,
    chartLoadingFlag: false,
    shellVariant: UNIFIED_ENERGY_THEME_PRESETS.basic,
    chartSurface: 'dark',
    customDatesIncomplete: false,
    colors: ['#ff6b6b'],
    selectedDuration: 'this-week',
    currentDate: '2024-06-10',
    currentYear: 2024,
    selectedAreas: [1],
    ChartLoader: null,
    transformDataForCharts: () => [],
  };

  it('skips re-render for deep-equal payload with different reference', () => {
    const next = {
      ...base,
      energyData: JSON.parse(JSON.stringify(consumptionPayload)),
    };
    expect(unifiedEnergyWidgetPropsAreEqual(base, next)).toBe(true);
  });

  it('re-renders when mode changes', () => {
    const next = { ...base, mode: UNIFIED_ENERGY_WIDGET_MODES.savings };
    expect(unifiedEnergyWidgetPropsAreEqual(base, next)).toBe(false);
  });

  it('re-renders when loading gate changes', () => {
    const next = { ...base, chartLoadingFlag: true };
    expect(unifiedEnergyWidgetPropsAreEqual(base, next)).toBe(false);
  });
});

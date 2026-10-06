/**
 * @jest-environment node
 */
import { transformDataForCharts } from '../../charts/transforms/transformDataForCharts';
import {
  resolvePeakMinConsumptionLoading,
  resolvePeakMinConsumptionTheme,
  PEAK_MIN_CONSUMPTION_THEME_PRESETS,
} from './peakMinConsumptionTheme';
import {
  resolvePeakMinConsumptionChartData,
  resolvePeakMinConsumptionPeakMin,
  resolvePeakMinConsumptionDisplayEntry,
  resolvePeakMinConsumptionDisplayModel,
  resolvePeakMinConsumptionExportActions,
} from './peakMinConsumptionResolvers';
import {
  peakMinConsumptionWidgetPropsAreEqual,
  legacyPeakMinConsumptionLoading,
  sharedPeakMinConsumptionLoading,
} from './peakMinConsumptionMemoCompare';

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

const emptyPayload = {
  'x-axis': [],
  'y-axis': {},
  unit: 'kWh',
};

function legacyLoading(props) {
  return (
    props.energyConsumptionLoading ||
    props.peakMinConsumptionLoading ||
    props.chartLoadingPeakMinConsumption
  );
}

function legacyPeakMinPipeline(energyConsumption, transform, displayOptions) {
  const chartData = resolvePeakMinConsumptionChartData(energyConsumption, transform);
  const peakMin = resolvePeakMinConsumptionPeakMin(chartData);
  return {
    chartData,
    peakMin,
    peakDisplay: resolvePeakMinConsumptionDisplayEntry(peakMin.peak, displayOptions),
    minDisplay: resolvePeakMinConsumptionDisplayEntry(peakMin.min, displayOptions),
  };
}

describe('PeakMinConsumption loading parity', () => {
  const readyProps = {
    allEnergyChartsReady: true,
    energyConsumptionLoading: false,
    peakMinConsumptionLoading: false,
    chartLoadingPeakMinConsumption: false,
  };

  it('basic legacy loading matches shared resolver', () => {
    expect(sharedPeakMinConsumptionLoading(readyProps)).toBe(legacyLoading(readyProps));
    expect(sharedPeakMinConsumptionLoading(readyProps)).toBe(false);
  });

  it('advanced loading when consumption fetch in flight', () => {
    const loading = { ...readyProps, energyConsumptionLoading: true };
    expect(resolvePeakMinConsumptionLoading(loading)).toBe(true);
    expect(legacyPeakMinConsumptionLoading(loading)).toBe(true);
  });

  it('customized loading when peak/min chart flag set', () => {
    const loading = { ...readyProps, chartLoadingPeakMinConsumption: true };
    expect(resolvePeakMinConsumptionLoading(loading)).toBe(true);
  });

  it('does not wait on sibling Energy widgets', () => {
    expect(
      resolvePeakMinConsumptionLoading({ ...readyProps, allEnergyChartsReady: false })
    ).toBe(false);
  });
});

describe('PeakMinConsumption peak/min calculation', () => {
  const transform = (data) => transformDataForCharts(data, 'consumption', transformOptions);
  const displayOptions = {
    unit: 'kWh',
    selectedDuration: 'this-week',
    currentDate: '2024-06-10',
  };

  it('peak calculation matches legacy pipeline', () => {
    const pipeline = legacyPeakMinPipeline(consumptionPayload, transform, displayOptions);
    expect(pipeline.peakMin.peak.value).toBe(270);
    expect(pipeline.peakDisplay.valueText).toContain('270');
  });

  it('minimum calculation matches legacy pipeline', () => {
    const pipeline = legacyPeakMinPipeline(consumptionPayload, transform, displayOptions);
    expect(pipeline.peakMin.min.value).toBe(0);
    expect(pipeline.minDisplay.valueText).toContain('0');
  });

  it('empty chart data yields null peak/min entries', () => {
    const peakMin = resolvePeakMinConsumptionPeakMin([]);
    expect(peakMin.peak.value).toBeNull();
    expect(peakMin.min.value).toBeNull();
  });

  it('display model empty state shows No data', () => {
    const model = resolvePeakMinConsumptionDisplayModel({
      energyConsumption: emptyPayload,
      transformDataForCharts: transform,
      displayOptions,
    });
    expect(model.peakDisplay.valueText).toBe('No data');
    expect(model.minDisplay.valueText).toBe('No data');
  });
});

describe('PeakMinConsumption display formatting', () => {
  it('formats value with unit', () => {
    const display = resolvePeakMinConsumptionDisplayEntry(
      { value: 100, time: '09:00' },
      { unit: 'kWh' }
    );
    expect(display.valueText).toContain('100');
    expect(display.valueText).toContain('kWh');
  });

  it('formats time label when time present', () => {
    const display = resolvePeakMinConsumptionDisplayEntry(
      { value: 50, time: 'Mon 3' },
      { unit: 'kWh', selectedDuration: 'this-week', currentDate: '2024-06-10' }
    );
    expect(display.timeText).toContain('at');
  });
});

describe('PeakMinConsumption theme parity', () => {
  it('basic light theme uses blue panel and light spinner track', () => {
    const theme = resolvePeakMinConsumptionTheme({
      preset: PEAK_MIN_CONSUMPTION_THEME_PRESETS.basic,
      chartSurface: 'light',
    });
    expect(theme.panelBg).toBe('#1565C0');
    expect(theme.panelLayout).toBe('basic-stretch');
    expect(theme.loaderSpinnerStyle.border).toContain('rgba(255,255,255,0.35)');
  });

  it('advanced theme uses dashboard loading bg and optional border', () => {
    const theme = resolvePeakMinConsumptionTheme({
      preset: PEAK_MIN_CONSUMPTION_THEME_PRESETS.advanced,
      metricPanelBorder: '1px solid #444',
    });
    expect(theme.panelLayout).toBe('centered');
    expect(theme.panelBorder).toBe('1px solid #444');
  });

  it('customized theme uses centered dark panels', () => {
    const theme = resolvePeakMinConsumptionTheme({
      preset: PEAK_MIN_CONSUMPTION_THEME_PRESETS.customized,
    });
    expect(theme.panelBg).toBe('#232323');
    expect(theme.rowGap).toBe('15px');
  });
});

describe('PeakMinConsumption export routing', () => {
  const thunks = {
    sendPeakMinConsumptionEmail: 'p-email',
    downloadPeakMinConsumption: 'p-dl',
  };

  it('resolves peak/min export actions', () => {
    const actions = resolvePeakMinConsumptionExportActions(thunks);
    expect(actions.emailThunk).toBe('p-email');
    expect(actions.downloadThunk).toBe('p-dl');
    expect(actions.label).toBe('Peak & Minimum Consumption');
  });
});

describe('peakMinConsumptionWidgetPropsAreEqual', () => {
  const base = {
    energyConsumption: consumptionPayload,
    allEnergyChartsReady: true,
    energyConsumptionLoading: false,
    peakMinConsumptionLoading: false,
    chartLoadingPeakMinConsumption: false,
    shellVariant: PEAK_MIN_CONSUMPTION_THEME_PRESETS.basic,
    chartSurface: 'dark',
    selectedDuration: 'this-week',
    currentDate: '2024-06-10',
    isLargeScreen: false,
    transformDataForCharts: () => [],
  };

  it('skips re-render for deep-equal payload with different reference', () => {
    const next = {
      ...base,
      energyConsumption: JSON.parse(JSON.stringify(consumptionPayload)),
    };
    expect(peakMinConsumptionWidgetPropsAreEqual(base, next)).toBe(true);
  });

  it('re-renders when loading gate changes', () => {
    const next = { ...base, peakMinConsumptionLoading: true };
    expect(peakMinConsumptionWidgetPropsAreEqual(base, next)).toBe(false);
  });

  it('re-renders when shell variant changes', () => {
    const next = { ...base, shellVariant: PEAK_MIN_CONSUMPTION_THEME_PRESETS.advanced };
    expect(peakMinConsumptionWidgetPropsAreEqual(base, next)).toBe(false);
  });
});

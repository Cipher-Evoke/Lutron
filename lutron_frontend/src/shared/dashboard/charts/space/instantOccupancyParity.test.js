/**
 * @jest-environment node
 */
import { instantOccupancyToRecharts } from '../transforms/instantOccupancyToRecharts';
import {
  resolveInstantOccupancyChartStatus,
  buildInstantOccupancyChartDataset,
  formatInstantOccupancyTooltipLabel,
  INSTANT_OCCUPANCY_EMPTY_MESSAGE,
  INSTANT_OCCUPANCY_ERROR_MESSAGE,
} from './instantOccupancyConfig';
import {
  resolveInstantOccupancyTheme,
  INSTANT_OCCUPANCY_THEME_PRESETS,
} from './instantOccupancyTheme';
import {
  instantOccupancyChartPropsAreEqual,
  legacyInstantOccupancyChartPropsAreEqual,
  sharedInstantOccupancyStatus,
  sharedInstantOccupancyDataset,
  legacyInstantOccupancyDataset,
} from './instantOccupancyMemoCompare';
import { resolveSpaceExportThunks } from '../../export/spaceExportActionMap';

const thisDayPayload = {
  'x-axis': ['08:00', '09:30', '12:00', '18:00'],
  'y-axis': { data: [12, 45, 30, 8] },
};

const thisWeekPayload = {
  'x-axis': ['Mon 6', 'Mon 12', 'Wed 6', 'Fri 18'],
  'y-axis': { data: [20, 35, 40, 15] },
};

const thisMonthPayload = {
  'x-axis': ['1', '5', '15', '28'],
  'y-axis': { data: [10, 25, 50, 30] },
};

const singlePointPayload = {
  'x-axis': ['14:00'],
  'y-axis': { data: [72] },
};

const footerPayload = {
  ...thisDayPayload,
  entire_day_utilization: 42,
  working_hours_utilization: 55,
};

const baseOptions = {
  selectedDuration: 'this-day',
  currentDate: '2026-06-10',
  customDateRange: { startDate: '', endDate: '' },
  chartSurface: 'dark',
};

function stripInstantOccupancyDatasetFunctions(dataset) {
  if (!dataset?.footerModel) return dataset;
  const { formatFooterStat, ...footerModel } = dataset.footerModel;
  return { ...dataset, footerModel };
}

describe('InstantOccupancy dataset parity across variants', () => {
  it('basic/advanced/customized pipelines produce identical rows for this-day', () => {
    const basic = buildInstantOccupancyChartDataset(thisDayPayload, {
      ...baseOptions,
      enableUtilizationFooter: true,
    });
    const advanced = buildInstantOccupancyChartDataset(thisDayPayload, baseOptions);
    const customized = buildInstantOccupancyChartDataset(thisDayPayload, baseOptions);

    expect(advanced.processedChartData).toEqual(basic.processedChartData);
    expect(customized.processedChartData).toEqual(basic.processedChartData);
    expect(basic.processedChartData.length).toBeGreaterThanOrEqual(24);
  });

  it('legacy result === shared result for fixture matrix', () => {
    const fixtures = [
      { payload: thisDayPayload, options: { ...baseOptions, enableUtilizationFooter: true } },
      { payload: thisWeekPayload, options: { ...baseOptions, selectedDuration: 'this-week' } },
      { payload: thisMonthPayload, options: { ...baseOptions, selectedDuration: 'this-month' } },
      { payload: singlePointPayload, options: baseOptions },
      {
        payload: footerPayload,
        options: { ...baseOptions, enableUtilizationFooter: true, chartSurface: 'light' },
      },
    ];

    for (const { payload, options } of fixtures) {
      expect(stripInstantOccupancyDatasetFunctions(sharedInstantOccupancyDataset(payload, options))).toEqual(
        stripInstantOccupancyDatasetFunctions(legacyInstantOccupancyDataset(payload, options))
      );
    }
  });

  it('single-area / single-point edge case', () => {
    const dataset = buildInstantOccupancyChartDataset(singlePointPayload, baseOptions);
    const nonNull = dataset.processedChartData.filter((p) => p.occupancy != null);
    expect(nonNull).toHaveLength(1);
    expect(nonNull[0].occupancy).toBe(72);
  });

  it('multi-point this-week edge case fills missing slots', () => {
    const dataset = buildInstantOccupancyChartDataset(thisWeekPayload, {
      ...baseOptions,
      selectedDuration: 'this-week',
    });
    expect(dataset.processedChartData.length).toBeGreaterThan(4);
    expect(dataset.xAxisTicks).toBeUndefined();
  });
});

describe('InstantOccupancy tooltip parity', () => {
  it('formats this-day numeric minutes as HH:MM', () => {
    expect(
      formatInstantOccupancyTooltipLabel(510, {
        selectedDuration: 'this-day',
        currentDate: '2026-06-10',
      })
    ).toBe('08:30');
  });

  it('formats this-day string time labels', () => {
    expect(
      formatInstantOccupancyTooltipLabel('9:05', {
        selectedDuration: 'this-day',
        currentDate: '2026-06-10',
      })
    ).toBe('09:05');
  });

  it('instantOccupancyToRecharts preserves occupancy values', () => {
    const rows = instantOccupancyToRecharts(thisDayPayload, baseOptions);
    const at830 = rows.find((r) => r.date === '09:30');
    expect(at830?.occupancy).toBe(45);
  });
});

describe('InstantOccupancy empty/loading parity', () => {
  it('loading when instant occupancy loading flag set', () => {
    expect(
      sharedInstantOccupancyStatus({
        instantOccupancyCount: null,
        instantOccupancyCountLoading: true,
        instantOccupancyCountError: null,
        anyLoading: false,
        isLoading: false,
        globalLoadingProp: false,
      })
    ).toBe('loading');
  });

  it('error when instant occupancy error flag set', () => {
    expect(
      resolveInstantOccupancyChartStatus({
        instantOccupancyCount: thisDayPayload,
        instantOccupancyCountLoading: false,
        instantOccupancyCountError: true,
        anyLoading: false,
        isLoading: false,
        globalLoadingProp: false,
      })
    ).toBe('error');
  });

  it('empty when no payload and not loading', () => {
    expect(
      sharedInstantOccupancyStatus({
        instantOccupancyCount: null,
        instantOccupancyCountLoading: false,
        instantOccupancyCountError: null,
        anyLoading: false,
        isLoading: false,
        globalLoadingProp: false,
      })
    ).toBe('empty');
  });

  it('ready when payload present', () => {
    expect(
      sharedInstantOccupancyStatus({
        instantOccupancyCount: thisDayPayload,
        instantOccupancyCountLoading: false,
        instantOccupancyCountError: null,
        anyLoading: false,
        isLoading: false,
        globalLoadingProp: false,
      })
    ).toBe('ready');
  });

  it('empty/error message constants match legacy copy', () => {
    expect(INSTANT_OCCUPANCY_EMPTY_MESSAGE).toBe('No instant occupancy data available');
    expect(INSTANT_OCCUPANCY_ERROR_MESSAGE).toBe('Error loading instant occupancy data');
  });
});

describe('InstantOccupancy theme variant differences', () => {
  it('basic uses area chart and charts-tab clamp when showChartsTab', () => {
    const theme = resolveInstantOccupancyTheme({
      preset: INSTANT_OCCUPANCY_THEME_PRESETS.basic,
      showChartsTab: true,
    });
    expect(theme.chartRenderMode).toBe('area');
    expect(theme.plotHeightStyle).toBe('basicInstantChartsTabClamp');
    expect(theme.line).toBe('#1565C0');
  });

  it('advanced uses line chart and occupancy line color', () => {
    const theme = resolveInstantOccupancyTheme({
      preset: INSTANT_OCCUPANCY_THEME_PRESETS.advanced,
      lineSeriesColor: '#ABCDEF',
      cardBackground: '#222',
      cardBorder: '1px solid #fff',
      cardShadow: 'none',
    });
    expect(theme.chartRenderMode).toBe('line');
    expect(theme.line).toBe('#ABCDEF');
    expect(theme.plotHeightStyle).toBe('instantFixed350');
  });

  it('customized uses flex fill and fullscreen line color', () => {
    const normal = resolveInstantOccupancyTheme({
      preset: INSTANT_OCCUPANCY_THEME_PRESETS.customized,
      isFullscreen: false,
    });
    const chartsTab = resolveInstantOccupancyTheme({
      preset: INSTANT_OCCUPANCY_THEME_PRESETS.customized,
      showChartsTab: true,
    });
    const fullscreen = resolveInstantOccupancyTheme({
      preset: INSTANT_OCCUPANCY_THEME_PRESETS.customized,
      isFullscreen: true,
    });
    expect(normal.plotHeightStyle).toBe('flexFill');
    expect(chartsTab.plotHeightStyle).toBe('instantChartsTabClamp');
    expect(normal.plotBg).toBe('#767061');
    expect(normal.line).toBe('#87CEEB');
    expect(fullscreen.line).toBe('#00B0FF');
    expect(fullscreen.seriesStrokeWidth).toBe(4);
  });

  it('basic combined-widget footer model uses light surface tokens', () => {
    const dataset = buildInstantOccupancyChartDataset(footerPayload, {
      ...baseOptions,
      enableUtilizationFooter: true,
      chartSurface: 'light',
    });
    expect(dataset.footerModel).not.toBeNull();
    expect(dataset.footerModel.footerMuted).toBe('#9ca3af');
    expect(dataset.footerModel.footerStrong).toBe('#111827');
  });
});

describe('InstantOccupancy export routing parity', () => {
  const thunks = {
    sendInstantOccupancyCountEmail: 'instant-email',
    downloadInstantOccupancyCount: 'instant-dl',
    sendOccupancyCountEmail: 'occ-email',
    downloadOccupancyCount: 'occ-dl',
  };

  it('routes instant chart on charts tab to downloadInstantOccupancyCount', () => {
    const resolved = resolveSpaceExportThunks(
      { showChartsTab: true, dropdownKey: 'instant', chartTitle: 'Instant Occupancy' },
      thunks
    );
    expect(resolved.downloadThunk).toBe('instant-dl');
    expect(resolved.emailThunk).toBe('instant-email');
  });

  it('routes instantCombined on space tab to occupancy count export', () => {
    const resolved = resolveSpaceExportThunks(
      { showChartsTab: false, dropdownKey: 'instantCombined', chartTitle: 'Space Utilization' },
      thunks
    );
    expect(resolved.downloadThunk).toBe('occ-dl');
    expect(resolved.emailThunk).toBe('occ-email');
  });
});

describe('InstantOccupancy memo comparator parity', () => {
  const propsA = {
    instantOccupancyCount: thisDayPayload,
    instantOccupancyCountLoading: false,
    instantOccupancyCountError: null,
    anyLoading: false,
    isLoading: false,
    globalLoadingProp: false,
    selectedDuration: 'this-day',
    currentDate: '2026-06-10',
    currentYear: 2026,
    customDateRange: { startDate: '', endDate: '' },
    isNavigating: false,
    shellVariant: 'basic',
    chartSurface: 'dark',
    showChartsTab: false,
    enableUtilizationFooter: true,
  };

  it('shared comparator treats deep-equal payload as equal', () => {
    const propsB = { ...propsA, instantOccupancyCount: { ...thisDayPayload } };
    expect(instantOccupancyChartPropsAreEqual(propsA, propsB)).toBe(true);
  });

  it('shared comparator detects loading change', () => {
    expect(
      instantOccupancyChartPropsAreEqual(propsA, { ...propsA, instantOccupancyCountLoading: true })
    ).toBe(false);
  });

  it('legacy comparator detects chartSurface change for combined widget', () => {
    expect(
      legacyInstantOccupancyChartPropsAreEqual(
        { ...propsA, chartSurface: 'dark' },
        { ...propsA, chartSurface: 'light' }
      )
    ).toBe(false);
  });

  it('shared comparator detects enableUtilizationFooter change', () => {
    expect(
      instantOccupancyChartPropsAreEqual(propsA, { ...propsA, enableUtilizationFooter: false })
    ).toBe(false);
  });
});

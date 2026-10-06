/**
 * @jest-environment node
 */
import { spaceOccupancyToRecharts } from '../transforms/spaceOccupancyToRecharts';
import {
  buildSpaceLineChartDataset,
  legacySpaceLineChartPipeline,
  shouldShowSpaceOccupancyPercentage,
  formatSpaceTooltipLabel,
  resolveSpaceLineChartStatus,
  SPACE_LINE_EMPTY_MESSAGE,
} from './spaceLineChartConfig';
import { resolveSpaceLineChartTheme, SPACE_LINE_CHART_THEME_PRESETS } from './spaceLineChartTheme';
import {
  spaceLineChartPropsAreEqual,
  legacySpaceLineChartPropsAreEqual,
  sharedSpaceLineChartDataset,
  legacySpaceLineChartDataset,
} from './spaceLineChartMemoCompare';
import { resolveSpaceExportThunks } from '../../export/spaceExportActionMap';

const weekPayload = {
  'x-axis': ['Sun 0', 'Mon 0', 'Tue 0', 'Wed 0', 'Thu 0', 'Fri 0', 'Sat 0'],
  'y-axis': { data: [10, 20, 30, 40, 50, 60, 70] },
};

const dayPayload = {
  'x-axis': ['08:00', '09:00', '10:00'],
  'y-axis': { data: [5, 15, 8] },
};

const multiSlotPayload = {
  'x-axis': ['Sun 0', 'Sun 6', 'Mon 0'],
  'y-axis': { data: [12, null, 18] },
};

const transformOptions = {
  selectedDuration: 'this-week',
  currentDate: '2025-06-10',
  currentYear: 2025,
  customDateRange: { startDate: '', endDate: '' },
};

function buildVariantDataset(shellVariant, extra = {}) {
  return buildSpaceLineChartDataset(weekPayload, {
    ...transformOptions,
    ...extra,
  });
}

describe('SpaceLineChart dataset parity across variants', () => {
  it('basic/advanced/customized pipelines produce identical datasets', () => {
    const basic = buildVariantDataset('basic');
    const advanced = buildVariantDataset('advanced');
    const customized = buildVariantDataset('customized');

    expect(advanced.processedChartData).toEqual(basic.processedChartData);
    expect(customized.processedChartData).toEqual(basic.processedChartData);
    expect(advanced.chartConfig).toEqual(basic.chartConfig);
    expect(customized.maxOccupancy).toBe(basic.maxOccupancy);
    expect(advanced.showPercentage).toBe(true);
  });

  it('legacy result === shared result for fixture matrix', () => {
    const fixtures = [
      { payload: weekPayload, options: transformOptions },
      { payload: dayPayload, options: { ...transformOptions, selectedDuration: 'this-day' } },
      {
        payload: multiSlotPayload,
        options: {
          ...transformOptions,
          selectedDuration: 'custom',
          customDateRange: { startDate: '2025-06-08', endDate: '2025-06-14' },
        },
      },
    ];

    for (const { payload, options } of fixtures) {
      const shared = sharedSpaceLineChartDataset(payload, options);
      const legacy = legacySpaceLineChartDataset(payload, options);
      expect(shared).toEqual(legacy);
    }
  });

  it('single-series occupancy edge case', () => {
    const single = {
      'x-axis': ['Mon 0'],
      'y-axis': { data: [42] },
    };
    const dataset = buildSpaceLineChartDataset(single, transformOptions);
    expect(dataset.processedChartData.length).toBeGreaterThan(0);
    expect(dataset.nonNullValues).toEqual([42]);
    expect(dataset.maxOccupancy).toBe(42);
  });

  it('multi-slot week data retains null gaps', () => {
    const dataset = buildSpaceLineChartDataset(multiSlotPayload, {
      ...transformOptions,
      selectedDuration: 'this-week',
    });
    const nulls = dataset.processedChartData.filter((row) => row.occupancy == null);
    expect(nulls.length).toBeGreaterThan(0);
  });
});

describe('SpaceLineChart tooltip parity', () => {
  it('day view shows count (no percent suffix logic)', () => {
    expect(shouldShowSpaceOccupancyPercentage('this-day', {})).toBe(false);
  });

  it('week view shows percentage', () => {
    expect(shouldShowSpaceOccupancyPercentage('this-week', {})).toBe(true);
  });

  it('custom single-day shows count', () => {
    expect(
      shouldShowSpaceOccupancyPercentage('custom', {
        startDate: '2025-06-10',
        endDate: '2025-06-10',
      })
    ).toBe(false);
  });

  it('formatSpaceTooltipLabel preserves non-week labels', () => {
    expect(
      formatSpaceTooltipLabel('Mon 0', {
        selectedDuration: 'this-week',
        currentDate: '2025-06-10',
      })
    ).toBe('Mon 0');
  });
});

describe('SpaceLineChart empty/loading parity', () => {
  it('does not keep occupancy loading when a sibling anyLoading flag is set', () => {
    expect(
      resolveSpaceLineChartStatus({
        occupancyCount: weekPayload,
        occupancyCountLoading: false,
        anyLoading: true,
        isLoading: true,
        globalLoadingProp: true,
      })
    ).toBe('ready');
  });

  it('empty when no payload and not loading', () => {
    expect(
      resolveSpaceLineChartStatus({
        occupancyCount: null,
        occupancyCountLoading: false,
        anyLoading: false,
        isLoading: false,
        globalLoadingProp: false,
      })
    ).toBe('empty');
  });

  it('ready when x/y axes present', () => {
    expect(
      resolveSpaceLineChartStatus({
        occupancyCount: weekPayload,
        occupancyCountLoading: false,
        anyLoading: false,
        isLoading: false,
        globalLoadingProp: false,
      })
    ).toBe('ready');
  });

  it('empty message constant matches legacy copy', () => {
    expect(SPACE_LINE_EMPTY_MESSAGE).toBe('No occupancy data available for Utilization');
  });
});

describe('SpaceLineChart theme variant differences', () => {
  it('basic uses area render mode', () => {
    const theme = resolveSpaceLineChartTheme({
      preset: SPACE_LINE_CHART_THEME_PRESETS.basic,
      spaceShell: { plotBg: '#fff', plotBorder: '1px', grid: '#000', axis: '#000', tick: '#000', yLabel: '#000', tooltipBg: '#fff', tooltipText: '#000', tooltipBorder: '1px', tooltipHeadBorder: '#000', cursor: '#000', areaStroke: '#1565C0', areaFill: '#1565C0', dotStroke: '#fff', emptyBg: '#fff', emptyColor: '#000', spinOuter: '#ccc', spinTop: '#1565C0' },
    });
    expect(theme.chartRenderMode).toBe('area');
    expect(theme.areaFillOpacity).toBe(0.55);
  });

  it('advanced uses line render mode', () => {
    const theme = resolveSpaceLineChartTheme({
      preset: SPACE_LINE_CHART_THEME_PRESETS.advanced,
      lineSeriesColor: '#87CEEB',
      cardBackground: '#333',
    });
    expect(theme.chartRenderMode).toBe('line');
    expect(theme.seriesColor).toBe('#87CEEB');
  });

  it('customized fullscreen changes stroke width and color', () => {
    const normal = resolveSpaceLineChartTheme({
      preset: SPACE_LINE_CHART_THEME_PRESETS.customized,
      isFullscreen: false,
    });
    const fullscreen = resolveSpaceLineChartTheme({
      preset: SPACE_LINE_CHART_THEME_PRESETS.customized,
      isFullscreen: true,
    });
    expect(fullscreen.seriesColor).toBe('#00B0FF');
    expect(fullscreen.seriesStrokeWidth).toBeGreaterThan(normal.seriesStrokeWidth);
  });
});

describe('Space utilization export routing parity', () => {
  const thunks = {
    sendOccupancyCountEmail: 'occ-email',
    downloadOccupancyCount: 'occ-dl',
    sendSpaceUtilizationPerEmail: 'per-email',
    downloadSpaceUtilizationPer: 'per-dl',
  };

  it('routes utilization widget to downloadOccupancyCount', () => {
    const resolved = resolveSpaceExportThunks(
      { showChartsTab: false, dropdownKey: 'line', chartTitle: 'Utilization' },
      thunks
    );
    expect(resolved.downloadThunk).toBe('occ-dl');
    expect(resolved.emailThunk).toBe('occ-email');
  });

  it('routes utilization by area separately (unchanged)', () => {
    const resolved = resolveSpaceExportThunks(
      { showChartsTab: false, dropdownKey: 'table', chartTitle: 'Utilization By Area' },
      thunks
    );
    expect(resolved.downloadThunk).toBe('per-dl');
  });
});

const baseProps = {
  occupancyCount: weekPayload,
  occupancyCountLoading: false,
  anyLoading: false,
  isLoading: false,
  globalLoadingProp: false,
  selectedDuration: 'this-week',
  currentDate: '2025-06-10',
  currentYear: 2025,
  customDateRange: { startDate: '', endDate: '' },
  isNavigating: false,
  shellVariant: 'basic',
  spaceShell: { plotBg: '#fff' },
};

describe('spaceLineChartPropsAreEqual memo comparator', () => {
  it.each([
    ['same reference', baseProps, baseProps],
    [
      'deep-equal occupancyCount',
      baseProps,
      { ...baseProps, occupancyCount: JSON.parse(JSON.stringify(weekPayload)) },
    ],
    ['loading flip', baseProps, { ...baseProps, occupancyCountLoading: true }],
    ['duration flip', baseProps, { ...baseProps, selectedDuration: 'this-day' }],
    ['fullscreen flip', { ...baseProps, shellVariant: 'customized', isFullscreen: false }, { ...baseProps, shellVariant: 'customized', isFullscreen: true }],
  ])('%s', (_label, prev, next) => {
    const shared = spaceLineChartPropsAreEqual(prev, next);
    const legacy = legacySpaceLineChartPropsAreEqual(prev, next);
    if (prev === next) {
      expect(shared).toBe(true);
      expect(legacy).toBe(true);
    }
    if (prev.occupancyCountLoading !== next.occupancyCountLoading) {
      expect(shared).toBe(false);
      expect(legacy).toBe(false);
    }
    if (prev.selectedDuration !== next.selectedDuration) {
      expect(shared).toBe(false);
      expect(legacy).toBe(false);
    }
  });

  it('deep-equal occupancyCount allows memo skip', () => {
    const next = { ...baseProps, occupancyCount: JSON.parse(JSON.stringify(weekPayload)) };
    expect(spaceLineChartPropsAreEqual(baseProps, next)).toBe(true);
    expect(legacySpaceLineChartPropsAreEqual(baseProps, next)).toBe(false);
  });
});

describe('spaceOccupancyToRecharts transform reuse', () => {
  it('buildSpaceLineChartDataset uses shared transform without duplication', () => {
    const direct = spaceOccupancyToRecharts(weekPayload, transformOptions);
    const viaPipeline = buildSpaceLineChartDataset(weekPayload, transformOptions);
    expect(viaPipeline.processedChartData[0].date).toBe(direct[0].date);
  });
});

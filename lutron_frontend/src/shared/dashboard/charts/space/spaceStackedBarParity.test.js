/**
 * @jest-environment node
 */
import {
  occupancyByGroupToStackedBarRows,
  occupancyUtilizedAreaToStackedBarRows,
} from '../transforms/occupancyByGroupToStackedBarRows';
import {
  buildSpaceStackedBarChartDataset,
  buildSpaceStackedBarAreaModeDataset,
  resolveSpaceStackedBarChartStatus,
  STACKED_BAR_SERIES_ORDER,
  STACKED_BAR_LEGEND_LABELS,
  SPACE_STACKED_BAR_EMPTY_MESSAGE,
} from './spaceStackedBarConfig';
import { resolveSpaceStackedBarTheme, SPACE_STACKED_BAR_THEME_PRESETS } from './spaceStackedBarTheme';
import {
  spaceStackedBarChartPropsAreEqual,
  legacySpaceStackedBarChartPropsAreEqual,
  sharedSpaceStackedBarDataset,
  legacySpaceStackedBarDataset,
} from './spaceStackedBarMemoCompare';
import { resolveSpaceExportThunks } from '../../export/spaceExportActionMap';

const regularGroupPayload = {
  data: [
    {
      area_group_name: 'Floor A',
      total_possible: 100,
      total_occupied: 60,
    },
    {
      area_group_name: 'Floor B',
      total_possible: 200,
      total_occupied: 50,
    },
  ],
};

const logsGroupPayload = {
  data: [
    {
      area_group_name: 'East',
      occupied_percentage: 72.5,
      unoccupied_percentage: 27.5,
      total_time_seconds: 500,
    },
    {
      area_group_name: 'West',
      occupied_percentage: 40,
      unoccupied_percentage: 60,
      total_time_seconds: 300,
    },
  ],
};

const areaPayload = {
  utilized_area: [
    { name: 'Lobby', occupied: 55 },
    { name: 'Office 1', occupied: 80 },
  ],
};

const colors = ['#FFB3B3', '#87CEEB', '#98FB98'];

describe('SpaceStackedBar dataset parity across variants', () => {
  it('basic/advanced/customized group pipelines produce identical rows', () => {
    const basic = buildSpaceStackedBarChartDataset(regularGroupPayload, {
      colorPalette: colors,
      requireAreaGroupName: true,
    });
    const advanced = buildSpaceStackedBarChartDataset(regularGroupPayload, {
      colorPalette: colors,
      requireAreaGroupName: true,
    });
    const customized = buildSpaceStackedBarChartDataset(regularGroupPayload, {
      colorPalette: colors,
      requireAreaGroupName: false,
    });

    expect(advanced.stackedBarData).toEqual(basic.stackedBarData);
    expect(customized.stackedBarData).toEqual(basic.stackedBarData);
    expect(basic.stackedBarData[0].name).toBe('Floor B');
    expect(basic.stackedBarData[0].occupied).toBe(25);
    expect(basic.stackedBarData[0].unoccupied).toBe(75);
  });

  it('legacy result === shared result for fixture matrix', () => {
    const fixtures = [
      { payload: regularGroupPayload, options: { colorPalette: colors, requireAreaGroupName: true } },
      { payload: logsGroupPayload, options: { colorPalette: colors, requireAreaGroupName: true } },
      {
        payload: { data: [{ area_group_name: 'Solo', total_possible: 10, total_occupied: 10 }] },
        options: { colorPalette: colors, requireAreaGroupName: true },
      },
    ];

    for (const { payload, options } of fixtures) {
      expect(sharedSpaceStackedBarDataset(payload, options)).toEqual(
        legacySpaceStackedBarDataset(payload, options)
      );
    }
  });

  it('single-bar edge case', () => {
    const single = {
      data: [{ area_group_name: 'Only', total_possible: 50, total_occupied: 20 }],
    };
    const dataset = buildSpaceStackedBarChartDataset(single, { colorPalette: colors });
    expect(dataset.stackedBarData).toHaveLength(1);
    expect(dataset.stackedBarData[0].occupied).toBe(40);
    expect(dataset.stackedBarData[0].unoccupied).toBe(60);
  });

  it('multi-bar edge case preserves sort by total', () => {
    const dataset = buildSpaceStackedBarChartDataset(logsGroupPayload, { colorPalette: colors });
    expect(dataset.stackedBarData).toHaveLength(2);
    expect(dataset.stackedBarData[0].total).toBeGreaterThan(dataset.stackedBarData[1].total);
  });
});

describe('SpaceStackedBar area mode parity', () => {
  it('occupancyUtilizedAreaToStackedBarRows produces complementary percentages', () => {
    const rows = occupancyUtilizedAreaToStackedBarRows(areaPayload, { colorPalette: colors });
    expect(rows).toHaveLength(2);
    expect(rows[0].name).toBe('Office 1');
    expect(rows[0].occupied).toBe(80);
    expect(rows[0].unoccupied).toBe(20);
  });

  it('buildSpaceStackedBarAreaModeDataset wraps area transform', () => {
    const dataset = buildSpaceStackedBarAreaModeDataset(areaPayload, { colorPalette: colors });
    expect(dataset.status).toBe('ready');
    expect(dataset.stackedBarData[1].name).toBe('Lobby');
  });
});

describe('SpaceStackedBar group mode parity', () => {
  it('_from_logs format uses API percentages directly', () => {
    const rows = occupancyByGroupToStackedBarRows(logsGroupPayload, { colorPalette: colors });
    expect(rows[0].occupied).toBe(72.5);
    expect(rows[0].unoccupied).toBe(27.5);
  });

  it('regular format calculates percentages from counts', () => {
    const rows = occupancyByGroupToStackedBarRows(regularGroupPayload, { colorPalette: colors });
    expect(rows.find((r) => r.name === 'Floor A').occupied).toBe(60);
  });
});

describe('SpaceStackedBar tooltip / legend parity', () => {
  it('series order is unoccupied then occupied (stack bottom-up)', () => {
    expect(STACKED_BAR_SERIES_ORDER).toEqual(['unoccupied', 'occupied']);
  });

  it('legend labels match legacy bar names', () => {
    expect(STACKED_BAR_LEGEND_LABELS.unoccupied).toBe('Unoccupied');
    expect(STACKED_BAR_LEGEND_LABELS.occupied).toBe('Occupied');
  });
});

describe('SpaceStackedBar empty/loading parity', () => {
  it('loading when group loading flag set', () => {
    expect(
      resolveSpaceStackedBarChartStatus({
        activeOccupancyByGroup: null,
        activeOccupancyByGroupLoading: true,
        anyLoading: false,
        isLoading: false,
        globalLoadingProp: false,
      })
    ).toBe('loading');
  });

  it('empty when no payload and not loading', () => {
    expect(
      resolveSpaceStackedBarChartStatus({
        activeOccupancyByGroup: null,
        activeOccupancyByGroupLoading: false,
        anyLoading: false,
        isLoading: false,
        globalLoadingProp: false,
      })
    ).toBe('empty');
  });

  it('ready when group payload present', () => {
    expect(
      resolveSpaceStackedBarChartStatus({
        activeOccupancyByGroup: regularGroupPayload,
        activeOccupancyByGroupLoading: false,
        anyLoading: false,
        isLoading: false,
        globalLoadingProp: false,
      })
    ).toBe('ready');
  });

  it('empty message constant matches legacy copy', () => {
    expect(SPACE_STACKED_BAR_EMPTY_MESSAGE).toBe('No area group data available');
  });
});

describe('SpaceStackedBar theme variant differences', () => {
  it('basic uses charts tab clamp height when showChartsTab', () => {
    const theme = resolveSpaceStackedBarTheme({
      preset: SPACE_STACKED_BAR_THEME_PRESETS.basic,
      spaceShell: {
        plotBg: '#fff',
        plotBorder: '1px',
        grid: '#000',
        axis: '#000',
        tick: '#000',
        yLabel: '#000',
        tooltipBg: '#fff',
        tooltipText: '#000',
        tooltipBorder: '1px',
        tooltipHeadBorder: '#000',
        barEdge: '#000',
        emptyBg: '#fff',
        emptyColor: '#000',
        spinOuter: '#ccc',
        spinTop: '#1565C0',
      },
      showChartsTab: true,
    });
    expect(theme.plotHeightStyle).toBe('basicChartsTabClamp');
  });

  it('advanced uses theme-aware stacked bar colors', () => {
    const theme = resolveSpaceStackedBarTheme({
      preset: SPACE_STACKED_BAR_THEME_PRESETS.advanced,
      stackedBarColors: { unoccupied: '#f00', occupied: '#0f0' },
      cardBackground: '#333',
    });
    expect(theme.barColors.unoccupied).toBe('#f00');
    expect(theme.barColors.occupied).toBe('#0f0');
  });

  it('customized uses flex fill height', () => {
    const theme = resolveSpaceStackedBarTheme({
      preset: SPACE_STACKED_BAR_THEME_PRESETS.customized,
    });
    expect(theme.plotHeightStyle).toBe('flexFill');
    expect(theme.plotBg).toBe('#767061');
  });
});

describe('Space stacked bar export routing parity', () => {
  const thunks = {
    sendOccupancyByGroupEmail: 'group-email',
    downloadOccupancyByGroup: 'group-dl',
    sendOccupancyCountEmail: 'occ-email',
    downloadOccupancyCount: 'occ-dl',
    sendSpaceUtilizationPerEmail: 'per-email',
    downloadSpaceUtilizationPer: 'per-dl',
  };

  it('routes occupancy by group to downloadOccupancyByGroup', () => {
    const resolved = resolveSpaceExportThunks(
      { showChartsTab: false, dropdownKey: 'pie', chartTitle: 'Occupancy by Group' },
      thunks
    );
    expect(resolved.downloadThunk).toBe('group-dl');
    expect(resolved.emailThunk).toBe('group-email');
  });

  it('routes utilization line export separately (unchanged)', () => {
    const resolved = resolveSpaceExportThunks(
      { showChartsTab: false, dropdownKey: 'line', chartTitle: 'Utilization' },
      thunks
    );
    expect(resolved.downloadThunk).toBe('occ-dl');
  });

  it('routes utilization by area table export separately', () => {
    const resolved = resolveSpaceExportThunks(
      { showChartsTab: false, dropdownKey: 'table', chartTitle: 'Utilization By Area' },
      thunks
    );
    expect(resolved.downloadThunk).toBe('per-dl');
  });
});

const baseProps = {
  activeOccupancyByGroup: regularGroupPayload,
  activeOccupancyByGroupLoading: false,
  anyLoading: false,
  isLoading: false,
  globalLoadingProp: false,
  shellVariant: 'basic',
  showChartsTab: false,
  spaceShell: { plotBg: '#fff' },
  colorPalette: colors,
  requireAreaGroupName: true,
};

describe('spaceStackedBarChartPropsAreEqual memo comparator', () => {
  it('deep-equal payload allows memo skip', () => {
    const next = {
      ...baseProps,
      activeOccupancyByGroup: JSON.parse(JSON.stringify(regularGroupPayload)),
    };
    expect(spaceStackedBarChartPropsAreEqual(baseProps, next)).toBe(true);
    expect(legacySpaceStackedBarChartPropsAreEqual(baseProps, next)).toBe(false);
  });

  it('loading flip forces re-render', () => {
    const next = { ...baseProps, activeOccupancyByGroupLoading: true };
    expect(spaceStackedBarChartPropsAreEqual(baseProps, next)).toBe(false);
    expect(legacySpaceStackedBarChartPropsAreEqual(baseProps, next)).toBe(false);
  });
});

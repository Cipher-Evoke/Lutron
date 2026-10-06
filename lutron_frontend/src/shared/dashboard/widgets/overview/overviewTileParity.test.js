/**
 * @jest-environment node
 */
import {
  OVERVIEW_TILE_TYPES,
  resolveEnergyTileModel,
  resolveSchedulesTileModel,
  resolveQuickControlsTileModel,
  resolveFloorsTileModel,
  resolveSpaceUtilizationTileModel,
  resolveOverviewTileModel,
} from './overviewTileTypes';
import {
  resolveOverviewMetricTileTheme,
  OVERVIEW_THEME_VARIANTS,
  OVERVIEW_CARD_VARIANTS,
} from './OverviewMetricTileTheme';
import {
  overviewMetricTilePropsAreEqual,
  sharedOverviewTileModel,
  legacyOverviewTileModel,
} from './overviewTileMemoCompare';
import {
  overviewFiveGridSpanSx,
  overviewSevenGridSpanSx,
  overviewBottomRowTileWidthSx,
} from './OverviewTileGrid';

const energyPayload = {
  savings_percent: 42.7,
  savings_kw: 12.345,
  consumption_kw: 8.765,
};

const schedulePayload = {
  name: 'Morning Scene',
  time: '08:00',
  date: 'Jun 10',
};

const spaceUtilPayload = {
  occupied_percent: 65.2,
};

describe('Overview tile model parity', () => {
  it('energy tile legacy === shared', () => {
    expect(sharedOverviewTileModel(OVERVIEW_TILE_TYPES.ENERGY, { energy: energyPayload })).toEqual(
      legacyOverviewTileModel(OVERVIEW_TILE_TYPES.ENERGY, { energy: energyPayload })
    );
    expect(resolveEnergyTileModel(energyPayload)).toEqual({
      status: 'ready',
      savingsPercent: 42.7,
      savingsKw: '12.35',
      consumptionKw: '8.77',
    });
  });

  it('energy tile empty state', () => {
    expect(resolveEnergyTileModel(null)).toEqual({
      status: 'empty',
      emptyMessage: 'No data',
    });
  });

  it('schedules tile legacy === shared', () => {
    expect(
      sharedOverviewTileModel(OVERVIEW_TILE_TYPES.SCHEDULES, { schedule: schedulePayload })
    ).toEqual(legacyOverviewTileModel(OVERVIEW_TILE_TYPES.SCHEDULES, { schedule: schedulePayload }));
    expect(resolveSchedulesTileModel(schedulePayload)).toEqual({
      status: 'ready',
      eventText: 'Morning Scene 08:00, Jun 10',
    });
  });

  it('schedules tile empty state', () => {
    expect(resolveSchedulesTileModel(null)).toEqual({
      status: 'empty',
      emptyMessage: 'No upcoming event',
    });
  });

  it('quick controls tile legacy === shared', () => {
    const model = resolveQuickControlsTileModel();
    expect(sharedOverviewTileModel(OVERVIEW_TILE_TYPES.QUICK_CONTROLS, {})).toEqual(model);
    expect(model.description).toContain('quick controls');
  });

  it('floors tile legacy === shared', () => {
    expect(resolveFloorsTileModel(5)).toEqual({ status: 'ready', count: 5 });
    expect(resolveFloorsTileModel(null)).toEqual({ status: 'ready', count: '—' });
  });

  it('space utilization tile legacy === shared', () => {
    expect(
      sharedOverviewTileModel(OVERVIEW_TILE_TYPES.SPACE_UTILIZATION, {
        spaceUtil: spaceUtilPayload,
      })
    ).toEqual(
      legacyOverviewTileModel(OVERVIEW_TILE_TYPES.SPACE_UTILIZATION, {
        spaceUtil: spaceUtilPayload,
      })
    );
    expect(resolveSpaceUtilizationTileModel(spaceUtilPayload)).toEqual({
      status: 'ready',
      occupiedPercent: 65.2,
    });
  });

  it('space utilization empty state', () => {
    expect(resolveSpaceUtilizationTileModel(null)).toEqual({
      status: 'empty',
      emptyMessage: 'No data',
    });
  });
});

describe('Overview tile theme resolution', () => {
  it('basic theme uses responsive ring mode', () => {
    const theme = resolveOverviewMetricTileTheme({
      themeVariant: OVERVIEW_THEME_VARIANTS.BASIC,
      cardVariant: OVERVIEW_CARD_VARIANTS.RESPONSIVE,
    });
    expect(theme.ringMode).toBe('responsive');
    expect(theme.scheduleNextLabel).toBe('Next Event');
    expect(theme.titleStyle.fontWeight).toBe(400);
  });

  it('grid theme uses fixed ring sizes', () => {
    const theme = resolveOverviewMetricTileTheme({
      themeVariant: OVERVIEW_THEME_VARIANTS.GRID,
    });
    expect(theme.ringMode).toBe('fixed');
    expect(theme.ringSizeEnergy).toBe(136);
    expect(theme.ringSizeSpace).toBe(146);
    expect(theme.scheduleNextLabel).toBe('Next event');
  });

  it('advanced theme uses dashboard chart header text on dark cards', () => {
    const theme = resolveOverviewMetricTileTheme({
      themeVariant: OVERVIEW_THEME_VARIANTS.ADVANCED,
    });
    expect(theme.themeVariant).toBe(OVERVIEW_THEME_VARIANTS.ADVANCED);
    expect(theme.titleStyle.color).toContain('dashboard-chart-header-text');
    expect(theme.ringMode).toBe('fixed');
    expect(theme.iconInTileLarge('primary.main').color).toBe('#ffb74d');
  });
});

describe('Overview tile grid helpers', () => {
  it('seven-grid span helper', () => {
    expect(overviewSevenGridSpanSx(1, 1, 3)).toEqual({
      gridColumn: '1 / 3',
      gridRow: 1,
    });
  });

  it('five-grid span helper', () => {
    expect(overviewFiveGridSpanSx(2, 2, 4)).toEqual({
      gridColumn: '2 / 4',
      gridRow: 2,
    });
  });

  it('bottom row width helper', () => {
    expect(overviewBottomRowTileWidthSx(4).width).toContain('calc');
  });
});

describe('Overview tile memo comparator', () => {
  const baseProps = {
    tileType: OVERVIEW_TILE_TYPES.ENERGY,
    energy: energyPayload,
    themeVariant: OVERVIEW_THEME_VARIANTS.BASIC,
    cardSx: { cursor: 'pointer' },
    onClick: () => {},
  };

  it('detects tile type change', () => {
    expect(
      overviewMetricTilePropsAreEqual(baseProps, {
        ...baseProps,
        tileType: OVERVIEW_TILE_TYPES.FLOORS,
      })
    ).toBe(false);
  });

  it('treats deep-equal energy payload as equal', () => {
    expect(
      overviewMetricTilePropsAreEqual(baseProps, {
        ...baseProps,
        energy: { ...energyPayload },
      })
    ).toBe(true);
  });
});

/**
 * @jest-environment node
 */
import { processUtilizationByAreaRows } from '../transforms/processUtilizationByAreaRows';
import {
  resolveUtilizationByAreaLoading,
  resolveUtilizationByAreaTheme,
  resolveUtilizationByAreaViewState,
  UTILIZATION_BY_AREA_LAYOUT_MODES,
  UTILIZATION_BY_AREA_THEME_PRESETS,
} from './utilizationByAreaTheme';
import {
  legacyUtilizationByAreaLoading,
  sharedUtilizationByAreaLoading,
  utilizationByAreaListPropsAreEqual,
} from './utilizationByAreaMemoCompare';

const basicPayload = {
  status: 'ok',
  utilized_area: [
    { name: 'Area A', occupied: 40 },
    { name: 'Area B', occupied: 90 },
    { name: 'Area C', occupied: 150 },
  ],
};

const customizedPayload = {
  status: 'ok',
  data: [
    { name: 'Lobby', occupied: 55 },
    { name: 'Office', percentage: 70 },
  ],
};

const areaGroups = {
  user_area_groups: [
    {
      group_id: 1,
      areas: [{ name: 'Lobby' }],
    },
  ],
  special_area_groups: [],
};

describe('UtilizationByAreaList loading parity', () => {
  const ready = {
    dataLoading: false,
    anyLoading: false,
    isLoading: false,
    globalLoadingProp: false,
  };

  it('legacy loading matches shared resolver', () => {
    expect(sharedUtilizationByAreaLoading(ready)).toBe(legacyUtilizationByAreaLoading(ready));
    expect(resolveUtilizationByAreaLoading(ready)).toBe(false);
  });

  it('loading when utilization fetch in flight', () => {
    const loading = { ...ready, dataLoading: true };
    expect(resolveUtilizationByAreaLoading(loading)).toBe(true);
  });
});

describe('UtilizationByAreaList view state', () => {
  const rows = processUtilizationByAreaRows(basicPayload);

  it('loading state', () => {
    expect(
      resolveUtilizationByAreaViewState({
        payload: null,
        rows: [],
        dataLoading: true,
      })
    ).toBe('loading');
  });

  it('empty state when fetch complete with no payload', () => {
    expect(
      resolveUtilizationByAreaViewState({
        payload: null,
        rows: [],
        dataLoading: false,
        anyLoading: false,
        isLoading: false,
        globalLoadingProp: false,
      })
    ).toBe('empty');
  });

  it('no-rows when payload resolves to empty list', () => {
    expect(
      resolveUtilizationByAreaViewState({
        payload: { status: 'ok', utilized_area: [] },
        rows: [],
        dataLoading: false,
      })
    ).toBe('no-rows');
  });

  it('rows state when data present', () => {
    expect(
      resolveUtilizationByAreaViewState({
        payload: basicPayload,
        rows,
        dataLoading: false,
      })
    ).toBe('rows');
  });
});

describe('UtilizationByAreaList sorting and cap', () => {
  it('sorts descending and caps percentage at 100', () => {
    const rows = processUtilizationByAreaRows(basicPayload);
    expect(rows[0].name).toBe('Area C');
    expect(rows[0].percentage).toBe(100);
    expect(rows[1].name).toBe('Area B');
    expect(rows[1].percentage).toBe(90);
  });

  it('customized group filtering preserves sort order', () => {
    const rows = processUtilizationByAreaRows(customizedPayload, {
      strictOccupiedType: false,
      selectedGroupIds: [1],
      areaGroups,
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe('Lobby');
    expect(rows[0].percentage).toBe(55);
  });
});

describe('UtilizationByAreaList theme presets', () => {
  it('basic light surface uses dark text', () => {
    const theme = resolveUtilizationByAreaTheme({
      preset: UTILIZATION_BY_AREA_THEME_PRESETS.basic,
      chartSurface: 'light',
    });
    expect(theme.textColor).toBe('#111827');
    expect(theme.shellBg).toBe('#ffffff');
  });

  it('advanced light surface uses dark text', () => {
    const theme = resolveUtilizationByAreaTheme({
      preset: UTILIZATION_BY_AREA_THEME_PRESETS.advanced,
      chartSurface: 'light',
    });
    expect(theme.textColor).toBe('#111827');
    expect(theme.shellBg).toBe('#ffffff');
  });

  it('customized light surface uses dark text', () => {
    const theme = resolveUtilizationByAreaTheme({
      preset: UTILIZATION_BY_AREA_THEME_PRESETS.customized,
      chartSurface: 'light',
    });
    expect(theme.textColor).toBe('#111827');
    expect(theme.shellBg).toBe('#ffffff');
  });

  it('customized default_white theme', () => {
    const theme = resolveUtilizationByAreaTheme({
      preset: UTILIZATION_BY_AREA_THEME_PRESETS.customized,
      customizedTheme: 'default_white',
    });
    expect(theme.textColor).toBe('#000');
    expect(theme.spinTop).toBe('#1565C0');
  });

  it('layout modes are distinct', () => {
    expect(UTILIZATION_BY_AREA_LAYOUT_MODES.scroll).toBe('scroll');
    expect(UTILIZATION_BY_AREA_LAYOUT_MODES.fill).toBe('fill');
    expect(UTILIZATION_BY_AREA_LAYOUT_MODES.flex).toBe('flex');
  });
});

describe('UtilizationByAreaList memo compare', () => {
  it('detects group filter changes', () => {
    const base = {
      payload: customizedPayload,
      processOptions: {
        strictOccupiedType: false,
        selectedGroupIds: [1],
        areaGroups,
      },
      shellVariant: 'customized',
      chartSurface: 'dark',
      customizedTheme: 'default',
      layoutMode: 'flex',
      dataLoading: false,
      anyLoading: false,
      isLoading: false,
      globalLoadingProp: false,
      emptyMessage: 'No data available for Utilization By Area',
      isLargeScreen: true,
    };
    expect(
      utilizationByAreaListPropsAreEqual(base, {
        ...base,
        processOptions: { ...base.processOptions, selectedGroupIds: [2] },
      })
    ).toBe(false);
    expect(utilizationByAreaListPropsAreEqual(base, { ...base })).toBe(true);
  });
});

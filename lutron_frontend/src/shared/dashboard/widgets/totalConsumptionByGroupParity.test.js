/**
 * @jest-environment node
 */
import {
  resolveTotalConsumptionByGroupLoading,
  resolveTotalConsumptionByGroupTheme,
  resolveTotalConsumptionByGroupExportDropdownKey,
  resolveTotalConsumptionByGroupExportLoadingPrefix,
  TOTAL_CONSUMPTION_BY_GROUP_THEME_PRESETS,
  TOTAL_CONSUMPTION_BY_GROUP_WIDGET_KEY,
  TOTAL_CONSUMPTION_BY_GROUP_LEGACY_EXPORT_LABEL,
} from './totalConsumptionByGroupTheme';
import {
  resolveTotalConsumptionByGroupExportActions,
} from './TotalConsumptionByGroupWidget';
import {
  totalConsumptionByGroupWidgetPropsAreEqual,
  legacyTotalConsumptionByGroupLoading,
  sharedTotalConsumptionByGroupLoading,
} from './totalConsumptionByGroupMemoCompare';
import {
  createEnergyExportActionMap,
  ENERGY_EXPORT_WIDGET_KEYS,
} from '../export/energyExportActionMap';
import { buildTotalConsumptionByGroupPieRows } from '../utils/pieChartNormalizers';

const flatPayload = {
  data: { 'Area 1': 75, 'Area 2': 25 },
};

const areaGroups = {
  special_area_groups: [
    { group_id: 1, name: 'Group A', areas: [{ name: 'Area 1' }] },
    { group_id: 2, name: 'Group B', areas: [{ name: 'Area 2' }] },
  ],
  user_area_groups: [],
};

const zeroSegmentPayload = {
  data: { 'Area 1': 0, 'Area 2': 0 },
};

const title = 'Consumption By Area Groups';

function legacyBasicLoading(props) {
  return (
    props.chartLoadingTotalConsumptionByGroup ||
    !props.totalConsumptionByGroup
  );
}

function legacyAdvancedLoading(props) {
  return legacyBasicLoading(props);
}

function legacyCustomizedLoading(props) {
  return legacyBasicLoading(props);
}

describe('TotalConsumptionByGroup loading parity', () => {
  const readyProps = {
    allEnergyChartsReady: true,
    chartLoadingTotalConsumptionByGroup: false,
    totalConsumptionByGroup: flatPayload,
  };

  it('basic legacy loading matches shared resolver', () => {
    expect(sharedTotalConsumptionByGroupLoading(readyProps)).toBe(
      legacyBasicLoading(readyProps)
    );
    expect(sharedTotalConsumptionByGroupLoading(readyProps)).toBe(false);
  });

  it('advanced legacy loading matches shared resolver', () => {
    expect(legacyTotalConsumptionByGroupLoading(readyProps)).toBe(
      legacyAdvancedLoading(readyProps)
    );
  });

  it('customized legacy loading matches shared resolver', () => {
    expect(resolveTotalConsumptionByGroupLoading(readyProps)).toBe(
      legacyCustomizedLoading(readyProps)
    );
  });

  it('does not wait on sibling Energy widgets', () => {
    expect(
      resolveTotalConsumptionByGroupLoading({
        ...readyProps,
        allEnergyChartsReady: false,
      })
    ).toBe(false);
  });

  it('loading when chart flag set', () => {
    expect(
      resolveTotalConsumptionByGroupLoading({
        ...readyProps,
        chartLoadingTotalConsumptionByGroup: true,
      })
    ).toBe(true);
  });

  it('loading when payload missing', () => {
    expect(
      resolveTotalConsumptionByGroupLoading({
        ...readyProps,
        totalConsumptionByGroup: null,
      })
    ).toBe(true);
  });
});

describe('TotalConsumptionByGroup theme parity', () => {
  it('basic theme uses basic-energy shell and light surface flags', () => {
    const theme = resolveTotalConsumptionByGroupTheme({
      preset: TOTAL_CONSUMPTION_BY_GROUP_THEME_PRESETS.basic,
      chartSurface: 'light',
      energyLightFullCardHeightPx: 500,
    });
    expect(theme.shellVariant).toBe('basic-energy');
    expect(theme.loaderLight).toBe(true);
    expect(theme.outerStyleOverride).toEqual({
      height: 500,
      minHeight: 500,
      overflow: 'visible',
    });
    expect(theme.plotStyleOverride).toEqual({
      overflow: 'visible',
      minHeight: 340,
    });
    expect(theme.showZeroSegmentsState).toBe(false);
  });

  it('basic theme uses a taller default card so pie leader labels are not clipped', () => {
    const theme = resolveTotalConsumptionByGroupTheme({
      preset: TOTAL_CONSUMPTION_BY_GROUP_THEME_PRESETS.basic,
      chartSurface: 'dark',
    });
    expect(theme.outerStyleOverride).toEqual({
      height: 460,
      minHeight: 460,
      overflow: 'visible',
    });
  });

  it('advanced theme uses advanced-card shell and surface overrides', () => {
    const theme = resolveTotalConsumptionByGroupTheme({
      preset: TOTAL_CONSUMPTION_BY_GROUP_THEME_PRESETS.advanced,
      chartHeaderStyle: { fontSize: 16 },
      advancedSurface: {
        cardBackground: '#111',
        cardBorder: '1px solid #222',
        cardShadow: 'none',
        cssTooltipStyle: { color: '#fff' },
      },
    });
    expect(theme.shellVariant).toBe('advanced-card');
    expect(theme.outerStyleOverride.background).toBe('#111');
    expect(theme.titleStyleOverride).toEqual({ fontSize: 16 });
    expect(theme.plotStyleOverride.height).toBe('400px');
  });

  it('customized theme enables fetch error and zero-segment states', () => {
    const theme = resolveTotalConsumptionByGroupTheme({
      preset: TOTAL_CONSUMPTION_BY_GROUP_THEME_PRESETS.customized,
    });
    expect(theme.shellVariant).toBe('customized-builtin');
    expect(theme.showFetchErrorState).toBe(true);
    expect(theme.showZeroSegmentsState).toBe(true);
    expect(theme.loaderHeight).toBe('300px');
  });
});

describe('TotalConsumptionByGroup empty and zero-segment parity', () => {
  it('empty payload yields no pie rows', () => {
    expect(buildTotalConsumptionByGroupPieRows(null, areaGroups, new Map())).toEqual([]);
  });

  it('zero-value grouped payload yields no chartable segments', () => {
    const rows = buildTotalConsumptionByGroupPieRows(
      zeroSegmentPayload,
      areaGroups,
      new Map()
    );
    expect(rows).toEqual([]);
  });
});

describe('TotalConsumptionByGroup export routing', () => {
  const thunks = {
    sendTotalConsumptionByGroupEmail: 'g-email',
    downloadTotalConsumptionByGroup: 'g-dl',
  };

  it('resolves email and download thunks via widget export resolver', () => {
    const actions = resolveTotalConsumptionByGroupExportActions(thunks);
    expect(actions.emailThunk).toBe('g-email');
    expect(actions.downloadThunk).toBe('g-dl');
  });

  it('matches energy export foundation map', () => {
    const map = createEnergyExportActionMap(thunks);
    expect(resolveTotalConsumptionByGroupExportActions(thunks)).toEqual(
      map[ENERGY_EXPORT_WIDGET_KEYS.TOTAL_CONSUMPTION_BY_GROUP]
    );
  });

  it('basic export dropdown key uses widget key', () => {
    expect(
      resolveTotalConsumptionByGroupExportDropdownKey(
        TOTAL_CONSUMPTION_BY_GROUP_THEME_PRESETS.basic,
        title
      )
    ).toBe(TOTAL_CONSUMPTION_BY_GROUP_WIDGET_KEY);
    expect(
      resolveTotalConsumptionByGroupExportLoadingPrefix(
        TOTAL_CONSUMPTION_BY_GROUP_THEME_PRESETS.basic
      )
    ).toBe(TOTAL_CONSUMPTION_BY_GROUP_WIDGET_KEY);
  });

  it('advanced/customized export keys use display title and legacy loading prefix', () => {
    expect(
      resolveTotalConsumptionByGroupExportDropdownKey(
        TOTAL_CONSUMPTION_BY_GROUP_THEME_PRESETS.advanced,
        title
      )
    ).toBe(title);
    expect(
      resolveTotalConsumptionByGroupExportLoadingPrefix(
        TOTAL_CONSUMPTION_BY_GROUP_THEME_PRESETS.customized
      )
    ).toBe(TOTAL_CONSUMPTION_BY_GROUP_LEGACY_EXPORT_LABEL);
  });
});

describe('totalConsumptionByGroupWidgetPropsAreEqual', () => {
  const base = {
    title,
    totalConsumptionByGroup: flatPayload,
    allEnergyChartsReady: true,
    chartLoadingTotalConsumptionByGroup: false,
    areaGroups,
    shellVariant: TOTAL_CONSUMPTION_BY_GROUP_THEME_PRESETS.basic,
    chartSurface: 'dark',
    exportControl: null,
    ChartLoader: null,
  };

  it('skips re-render for deep-equal payload with different reference', () => {
    const next = {
      ...base,
      totalConsumptionByGroup: JSON.parse(JSON.stringify(flatPayload)),
    };
    expect(totalConsumptionByGroupWidgetPropsAreEqual(base, next)).toBe(true);
  });

  it('re-renders when loading gate changes', () => {
    const next = { ...base, chartLoadingTotalConsumptionByGroup: true };
    expect(totalConsumptionByGroupWidgetPropsAreEqual(base, next)).toBe(false);
  });

  it('re-renders when payload content changes', () => {
    const next = {
      ...base,
      totalConsumptionByGroup: { data: { 'Area 1': 99 } },
    };
    expect(totalConsumptionByGroupWidgetPropsAreEqual(base, next)).toBe(false);
  });
});

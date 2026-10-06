/**
 * @jest-environment node
 */
import { buildTotalConsumptionByGroupPieRows } from '../utils/pieChartNormalizers';
import {
  consumptionPieChartPropsAreEqual,
  legacyBasicAdvancedPieRows,
} from './views/consumptionPieChartMemoCompare';
import { formatConsumptionPieTooltipValue } from './config/consumptionPieChartConfig';
import {
  createEnergyExportActionMap,
  ENERGY_EXPORT_WIDGET_KEYS,
} from '../export/energyExportActionMap';

const areaGroups = {
  special_area_groups: [
    {
      group_id: 1,
      name: 'Group A',
      areas: [{ name: 'Area 1' }],
    },
    {
      group_id: 2,
      name: 'Group B',
      areas: [{ name: 'Area 2' }],
    },
  ],
  user_area_groups: [],
};

const flatPayload = {
  data: { 'Area 1': 75, 'Area 2': 25 },
};

const specialGroupsPayload = {
  special_area_groups: [
    {
      name: 'Group A',
      consumption_percentage: '60 %',
      actual_energy: '60.00 kWh',
    },
    {
      name: 'Group B',
      consumption_percentage: '40 %',
      actual_energy: '40.00 kWh',
    },
  ],
};

describe('Consumption pie dataset parity', () => {
  it('basic/advanced legacy rows match shared normalizer for flat data', () => {
    const shared = buildTotalConsumptionByGroupPieRows(flatPayload, areaGroups, new Map());
    const legacy = legacyBasicAdvancedPieRows(flatPayload, areaGroups);
    expect(shared.map((r) => r.name).sort()).toEqual(legacy.map((r) => r.name).sort());
    expect(shared[0].value + shared[1].value).toBeCloseTo(100, 1);
    expect(legacy[0].value + legacy[1].value).toBeCloseTo(100, 1);
  });

  it('customized/shared rows preserve special_area_groups backend percentages', () => {
    const rows = buildTotalConsumptionByGroupPieRows(specialGroupsPayload, areaGroups, new Map());
    expect(rows).toHaveLength(2);
    expect(rows[0].consumption_percentage).toBe('60 %');
    expect(rows[0].value).toBe(60);
  });

  it('filters zero-value rows in grouped flat data', () => {
    const payload = {
      data: { 'Area 1': 100, 'Area 2': 0 },
    };
    const rows = buildTotalConsumptionByGroupPieRows(payload, areaGroups, new Map());
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe('Group A');
  });

  it('single-segment edge case returns one slice at 100%', () => {
    const rows = buildTotalConsumptionByGroupPieRows({ data: { 'Area 1': 500 } }, areaGroups, new Map());
    expect(rows).toHaveLength(1);
    expect(rows[0].value).toBeCloseTo(100, 1);
  });

  it('empty payload yields no rows', () => {
    expect(buildTotalConsumptionByGroupPieRows(null, areaGroups, new Map())).toEqual([]);
    expect(buildTotalConsumptionByGroupPieRows({}, areaGroups, new Map())).toEqual([]);
  });
});

describe('Consumption pie tooltip parity', () => {
  it('tooltip string matches legacy inline formatter output', () => {
    const rows = buildTotalConsumptionByGroupPieRows(specialGroupsPayload, areaGroups, new Map());
    const formatted = formatConsumptionPieTooltipValue(rows, rows[0].name);
    expect(formatted).toBe(`${rows[0].actual_energy} (${rows[0].consumption_percentage})`);
  });
});

describe('consumptionPieChartPropsAreEqual', () => {
  const base = {
    title: 'Consumption By Area Groups',
    data: flatPayload,
    onEmail: () => {},
    onDownload: () => {},
    isLoading: false,
    areaGroups,
  };

  it('skips re-render for deep-equal data with different reference', () => {
    const next = { ...base, data: JSON.parse(JSON.stringify(base.data)) };
    expect(consumptionPieChartPropsAreEqual(base, next)).toBe(true);
  });

  it('re-renders when data content changes', () => {
    const next = { ...base, data: { data: { 'Area 1': 99 } } };
    expect(consumptionPieChartPropsAreEqual(base, next)).toBe(false);
  });
});

describe('total_consumption_by_group export routing', () => {
  const thunks = {
    sendTotalConsumptionByGroupEmail: 'g-email',
    downloadTotalConsumptionByGroup: 'g-dl',
  };

  it('resolves email and download thunks via export foundation', () => {
    const map = createEnergyExportActionMap(thunks);
    expect(map[ENERGY_EXPORT_WIDGET_KEYS.TOTAL_CONSUMPTION_BY_GROUP].emailThunk).toBe('g-email');
    expect(map[ENERGY_EXPORT_WIDGET_KEYS.TOTAL_CONSUMPTION_BY_GROUP].downloadThunk).toBe('g-dl');
  });
});

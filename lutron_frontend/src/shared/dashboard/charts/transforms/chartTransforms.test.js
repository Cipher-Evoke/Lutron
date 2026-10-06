/**
 * @jest-environment node
 */
import { transformDataForCharts } from './transformDataForCharts';
import { calculatePeakMinFromChartData } from './calculatePeakMinFromChartData';
import { calculatePeakMinFromOccupancyPayload } from './calculatePeakMinFromOccupancyPayload';
import { formatPeakMinDisplay } from './formatPeakMinDisplay';
import { formatPeakMinTimeLabel } from './formatPeakMinTimeLabel';
import { consumptionSavingMergedData } from './consumptionSavingMergedData';
import {
  savingsStrategyToPieRows,
  calculateTotalSavingsPercentage,
  isSavingsStrategyTransitionalData,
} from './savingsStrategyToPieRows';
import { spaceOccupancyToRecharts } from './spaceOccupancyToRecharts';
import { formatEnergyXAxisLabel } from './formatEnergyXAxisLabel';
import { formatSpaceOccupancyXAxisLabel } from './formatSpaceOccupancyXAxisLabel';

const basicAreaTree = {
  tree: [{ area_id: 1, name: 'Area One' }, { area_id: 2, name: 'Area Two' }],
};

const basicTransformOptions = {
  selectedDuration: 'this-week',
  selectedAreas: [1, 2],
  areaTree: basicAreaTree,
};

const customizedTransformOptions = {
  selectedDuration: 'this-week',
  selectedAreas: [],
  selectedFloorIds: [10],
  selectedGroupIds: [],
  areaTree: basicAreaTree,
  areaGroups: { user_area_groups: [{ group_id: 5, name: 'Group A' }] },
  floors: [{ id: 10, floor_name: 'Floor 10' }],
  forceIndividualAreas: false,
};

const weekPayload = {
  'x-axis': Array.from({ length: 29 }, (_, i) => (i === 0 || i === 28 ? 'Sun 0' : `Mon ${i}`)),
  'y-axis': { 'Combined Areas': Array.from({ length: 29 }, () => 5) },
};

describe('transformDataForCharts parity', () => {
  it('basic: splits Combined Areas for selected areas', () => {
    const out = transformDataForCharts(weekPayload, 'consumption', basicTransformOptions);
    expect(out.length).toBe(28);
    expect(out[0]).toHaveProperty('Area One', 5);
    expect(out[0]).toHaveProperty('Area Two', 5);
  });

  it('advanced: matches basic for same options', () => {
    const out = transformDataForCharts(weekPayload, 'consumption', basicTransformOptions);
    expect(Object.keys(out[0]).sort()).toEqual(['Area One', 'Area Two', 'date'].sort());
  });

  it('customized: splits Combined Areas to floor labels', () => {
    const payload = {
      'x-axis': ['Mon 0', 'Tue 0'],
      'y-axis': { 'Combined Areas': [10, 20] },
    };
    const out = transformDataForCharts(payload, 'consumption', customizedTransformOptions);
    expect(out[0]).toHaveProperty('Floor 10', 10);
  });

  it('customized: preserves Combined Areas when five floors are selected', () => {
    const payload = {
      'x-axis': ['Mon 0', 'Tue 0'],
      'y-axis': { 'Combined Areas': [10, 20] },
    };
    const options = {
      ...customizedTransformOptions,
      selectedFloorIds: [1, 2, 3, 4, 5],
      floors: [1, 2, 3, 4, 5].map((id) => ({ id, floor_name: `Floor ${id}` })),
    };
    const out = transformDataForCharts(payload, 'consumption', options);
    expect(out[0]).toEqual({ date: 'Mon 0', 'Combined Areas': 10 });
  });

  it('preserves explicit area series when the payload already contains them', () => {
    const payload = {
      'x-axis': ['Mon 0', 'Tue 0'],
      'y-axis': { 'Area One': [10, 20], 'Area Two': [30, 40] },
    };
    const out = transformDataForCharts(payload, 'consumption', basicTransformOptions);
    expect(out[0]).toHaveProperty('Area One', 10);
    expect(out[0]).toHaveProperty('Area Two', 30);
  });

  it('returns empty for invalid payload', () => {
    expect(transformDataForCharts(null, 'consumption', basicTransformOptions)).toEqual([]);
  });
});

describe('calculatePeakMinFromChartData parity', () => {
  it('finds peak and min with zero preference', () => {
    const rows = [
      { date: 'a', s1: 10 },
      { date: 'b', s1: 0 },
      { date: 'c', s1: 5 },
    ];
    const result = calculatePeakMinFromChartData(rows);
    expect(result.peak.value).toBe(10);
    expect(result.min.value).toBe(0);
  });
});

describe('calculatePeakMinFromOccupancyPayload parity', () => {
  it('reads y-axis.data series', () => {
    const payload = {
      'x-axis': ['09:00', '10:00'],
      'y-axis': { data: [40, 60] },
    };
    const result = calculatePeakMinFromOccupancyPayload(payload);
    expect(result.peak).toBe(60);
    expect(result.min).toBe(40);
    expect(result.peakTime).toBe('10:00');
  });

  it('handles multi-series y-axis object', () => {
    const payload = {
      'x-axis': ['a', 'b'],
      'y-axis': { A: [10, 30], B: [20, 15] },
    };
    const result = calculatePeakMinFromOccupancyPayload(payload);
    expect(result.peak).toBe(30);
  });
});

describe('consumptionSavingMergedData parity', () => {
  it('merges consumption and savings by date', () => {
    const consumption = [{ date: '1/1', a: 10 }];
    const savings = [{ date: '1/1', a: 2 }];
    const merged = consumptionSavingMergedData(consumption, savings);
    expect(merged).toHaveLength(1);
    expect(merged[0].consumption).toBe(10);
    expect(merged[0].savings).toBe(2);
    expect(merged[0].connectedLoad).toBe(12);
  });

  it('preserves individual area keys and calculates their specific metrics', () => {
    const consumption = [{ date: '1/1', Lobby: 10, Office: 20 }];
    const savings = [{ date: '1/1', Lobby: 2, Office: 3 }];
    const merged = consumptionSavingMergedData(consumption, savings);
    expect(merged).toHaveLength(1);
    
    // Totals should still be computed as the sum of areas
    expect(merged[0].consumption).toBe(30);
    expect(merged[0].savings).toBe(5);
    expect(merged[0].connectedLoad).toBe(35);
    
    // Individual area metrics should be preserved
    expect(merged[0].Lobby_consumption).toBe(10);
    expect(merged[0].Lobby_savings).toBe(2);
    expect(merged[0].Lobby_connectedLoad).toBe(12);
    expect(merged[0].Office_consumption).toBe(20);
    expect(merged[0].Office_savings).toBe(3);
    expect(merged[0].Office_connectedLoad).toBe(23);
    
    // areaKeys property should be attached to array
    expect(merged.areaKeys).toEqual(['Lobby', 'Office']);
  });
});

describe('savingsStrategyToPieRows parity', () => {
  const payload = { status: 'success', data: { Keypad: 10, Consumption: 5, Sensors: 0 } };

  it('filters zero segments and keeps consumption in pie rows', () => {
    const rows = savingsStrategyToPieRows(payload);
    expect(rows).toHaveLength(2);
    expect(rows.find((r) => r.name === 'Sensors')).toBeUndefined();
  });

  it('calculateTotalSavingsPercentage excludes consumption', () => {
    expect(calculateTotalSavingsPercentage(payload)).toBe(10);
  });

  it('detects transitional empty payload', () => {
    expect(isSavingsStrategyTransitionalData({ data: {} })).toBe(true);
  });
});

describe('spaceOccupancyToRecharts parity', () => {
  it('maps occupancy count payload for this-day', () => {
    const payload = {
      'x-axis': ['09:00', '10:00'],
      'y-axis': { data: [5, 10] },
    };
    const rows = spaceOccupancyToRecharts(payload, {
      selectedDuration: 'this-day',
      currentDate: '2024-06-10',
      customDateRange: { startDate: '', endDate: '' },
    });
    expect(rows.some((r) => r.date === '09:00' && r.occupancy === 5)).toBe(true);
    expect(rows.some((r) => r.date === '00:00')).toBe(true);
  });
});

describe('formatPeakMinDisplay parity', () => {
  it('formats value with unit', () => {
    const out = formatPeakMinDisplay({ value: 100, time: '09:00' }, { unit: 'kWh' });
    expect(out.valueText).toContain('100');
    expect(out.valueText).toContain('kWh');
  });
});

describe('formatPeakMinTimeLabel parity', () => {
  it('returns input when not this-week', () => {
    expect(formatPeakMinTimeLabel('09:00', 'this-day', '2024-06-10')).toBe('09:00');
  });
});

describe('formatEnergyXAxisLabel parity', () => {
  it('hides 23:59 for this-day', () => {
    expect(
      formatEnergyXAxisLabel('23:59', 0, {
        chartDataLength: 24,
        selectedDuration: 'this-day',
        currentDate: '2024-06-10',
        currentYear: 2024,
      })
    ).toBe('');
  });
});

describe('formatSpaceOccupancyXAxisLabel parity', () => {
  it('formats hourly ticks for this-day', () => {
    expect(
      formatSpaceOccupancyXAxisLabel('09:00', {
        selectedDuration: 'this-day',
        currentDate: '2024-06-10',
        currentYear: 2024,
        customDateRange: { startDate: '', endDate: '' },
      })
    ).toBe('09:00');
  });
});

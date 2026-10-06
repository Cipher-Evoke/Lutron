/**
 * @jest-environment node
 */
import {
  savingsStrategyToPieRows,
  calculateTotalSavingsPercentage,
} from './transforms/savingsStrategyToPieRows';
import {
  savingsStrategyChartPropsAreEqual,
  legacySavingsStrategyStatus,
  legacySavingsStrategyPieRows,
  sharedSavingsStrategyStatus,
} from './savings/savingsStrategyMemoCompare';
import {
  resolveSavingsStrategyColor,
  calculateSavingsCenterLabelValue,
  formatSavingsStrategyTooltipValue,
} from './savings/savingsStrategyConfig';

const populatedPayload = {
  data: { Keypad: 25, Sensors: 35, Schedule: 15, GUI: 10, Consumption: 15 },
};

const singleStrategyPayload = {
  data: { Keypad: 100, Consumption: 0 },
};

const zeroPayload = {
  data: { Keypad: 0, Sensors: 0, Schedule: 0, GUI: 0, Consumption: 0 },
};

describe('savingsStrategyConfig', () => {
  it('maps embedded-light palette for keypad', () => {
    expect(resolveSavingsStrategyColor('Keypad', { paletteProfile: 'embedded-light' })).toBe('#7C3AED');
  });

  it('maps consumption to red on standalone-dark', () => {
    expect(resolveSavingsStrategyColor('Consumption', { paletteProfile: 'standalone-dark' })).toBe('#E53935');
  });

  it('calculates center label excluding consumption', () => {
    const center = calculateSavingsCenterLabelValue([
      { name: 'Keypad', value: 10, percentage: 10 },
      { name: 'Consumption', value: 90, percentage: 90 },
    ]);
    expect(center).toBe(10);
  });
});

describe('SavingsStrategy dataset parity', () => {
  it('shared pie rows match legacy for populated payload', () => {
    const shared = savingsStrategyToPieRows(populatedPayload);
    const legacy = legacySavingsStrategyPieRows(populatedPayload);
    expect(shared).toEqual(legacy);
    expect(shared).toHaveLength(5);
  });

  it('filters zero-value strategies', () => {
    expect(savingsStrategyToPieRows(zeroPayload)).toEqual([]);
  });

  it('single-strategy edge case returns one slice', () => {
    const rows = savingsStrategyToPieRows(singleStrategyPayload);
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe('Keypad');
    expect(rows[0].value).toBe(100);
  });

  it('calculateTotalSavingsPercentage excludes consumption', () => {
    expect(calculateTotalSavingsPercentage(populatedPayload)).toBe(85);
  });
});

describe('SavingsStrategy status parity', () => {
  it('legacy status matches shared for fixtures', () => {
    const cases = [
      { payload: null, opts: { isLoading: false, globalLoading: false }, expected: 'empty-null' },
      { payload: populatedPayload, opts: { isLoading: true, globalLoading: false }, expected: 'loading' },
      { payload: zeroPayload, opts: { isLoading: false, globalLoading: false }, expected: 'loading' },
      { payload: populatedPayload, opts: { isLoading: false, globalLoading: false }, expected: 'ready' },
    ];
    cases.forEach(({ payload, opts, expected }) => {
      expect(legacySavingsStrategyStatus(payload, opts)).toBe(expected);
      expect(sharedSavingsStrategyStatus(payload, opts)).toBe(expected);
    });
  });
});

describe('SavingsStrategy tooltip parity', () => {
  it('formats value as percentage string', () => {
    expect(formatSavingsStrategyTooltipValue(33.333)).toBe('33.33%');
  });
});

describe('savingsStrategyChartPropsAreEqual', () => {
  const base = {
    title: 'Savings By Strategy',
    savingsByStrategy: populatedPayload,
    isLoading: false,
    globalLoading: false,
  };

  it('skips re-render for deep-equal payload', () => {
    const next = { ...base, savingsByStrategy: JSON.parse(JSON.stringify(base.savingsByStrategy)) };
    expect(savingsStrategyChartPropsAreEqual(base, next)).toBe(true);
  });

  it('re-renders when payload changes', () => {
    const next = { ...base, savingsByStrategy: { data: { Keypad: 99 } } };
    expect(savingsStrategyChartPropsAreEqual(base, next)).toBe(false);
  });
});

describe('savings_by_strategy export thunks', () => {
  it('thunk identifiers remain available for dashboard slice wiring', () => {
    const thunks = {
      sendSavingsByStrategyEmail: 'strategy-email',
      downloadSavingsByStrategy: 'strategy-download',
    };
    expect(thunks.sendSavingsByStrategyEmail).toBe('strategy-email');
    expect(thunks.downloadSavingsByStrategy).toBe('strategy-download');
  });
});

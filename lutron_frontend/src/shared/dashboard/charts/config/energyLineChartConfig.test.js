/**
 * @jest-environment node
 */
import {
  getEnergyLineChartConfig,
  resolveEnergyLineSeriesNames,
  resolveEnergyLineSeriesColors,
} from './energyLineChartConfig';
import {
  generateEnergyLineColorPalette,
  resolveEnergyLineChartKind,
} from './energyLineColorPalette';

const weekRows = Array.from({ length: 28 }, (_, i) => ({
  date: i === 0 ? 'Sun 0' : `Mon ${i}`,
  'Area One': i * 2,
  'Area Two': i * 3,
}));

describe('getEnergyLineChartConfig', () => {
  it('uses 96-point day profile for standard stroke', () => {
    const rows = Array.from({ length: 96 }, (_, i) => ({ date: `${i}`, s1: 1 }));
    const cfg = getEnergyLineChartConfig(rows, { strokeWidthProfile: 'standard' });
    expect(cfg.xAxisInterval).toBe(3);
    expect(cfg.strokeWidth).toBe(1.5);
  });

  it('uses bold stroke for customized profile', () => {
    const rows = Array.from({ length: 96 }, (_, i) => ({ date: `${i}`, s1: 1 }));
    const cfg = getEnergyLineChartConfig(rows, { strokeWidthProfile: 'bold' });
    expect(cfg.strokeWidth).toBe(4);
  });

  it('uses week profile for 28 rows', () => {
    const cfg = getEnergyLineChartConfig(weekRows);
    expect(cfg.xAxisTickCount).toBe(7);
    expect(cfg.strokeWidth).toBe(2);
  });
});

describe('resolveEnergyLineSeriesNames', () => {
  it('excludes date key', () => {
    expect(resolveEnergyLineSeriesNames(weekRows).sort()).toEqual(['Area One', 'Area Two']);
  });
});

describe('resolveEnergyLineSeriesColors', () => {
  it('extends palette when series exceed default colors', () => {
    const names = ['a', 'b', 'c', 'd', 'e'];
    const base = ['#111', '#222'];
    const colors = resolveEnergyLineSeriesColors(names, base, (n) =>
      Array.from({ length: n }, (_, i) => `#extra${i}`)
    );
    expect(colors).toHaveLength(5);
    expect(colors[0]).toBe('#111');
    expect(colors[4]).toBe('#extra2');
  });
});

describe('resolveEnergyLineChartKind', () => {
  it('maps consumption and savings titles', () => {
    expect(resolveEnergyLineChartKind({ title: 'Consumption' })).toBe('consumption');
    expect(resolveEnergyLineChartKind({ title: 'Savings' })).toBe('savings');
  });

  it('uses legendSeriesName for customized builtin charts', () => {
    expect(resolveEnergyLineChartKind({ title: 'Custom', legendSeriesName: 'Energy Savings' })).toBe(
      'savings'
    );
  });
});

describe('generateEnergyLineColorPalette', () => {
  it('uses red combined palette for consumption with many areas', () => {
    const palette = generateEnergyLineColorPalette(6, {
      chartKind: 'consumption',
      selectedAreaCount: 5,
    });
    expect(palette[0]).toBe('#EF4444');
  });

  it('uses green combined palette for savings with many areas', () => {
    const palette = generateEnergyLineColorPalette(6, {
      chartKind: 'savings',
      selectedAreaCount: 5,
    });
    expect(palette[0]).toBe('#10B981');
  });
});

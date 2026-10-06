/**
 * @jest-environment node
 */
import {
  DEFAULT_CONSUMPTION_PIE_COLORS,
  CONSUMPTION_PIE_LAYOUT,
  resolveConsumptionPieSegmentColors,
  formatConsumptionPieTooltipValue,
} from './consumptionPieChartConfig';

describe('consumptionPieChartConfig', () => {
  it('uses default palette when no theme resolver', () => {
    const colors = resolveConsumptionPieSegmentColors(3);
    expect(colors).toEqual(DEFAULT_CONSUMPTION_PIE_COLORS.slice(0, 3));
  });

  it('prefers theme palette when provided', () => {
    const colors = resolveConsumptionPieSegmentColors(2, {
      resolveThemePalette: () => ['#aaa', '#bbb'],
    });
    expect(colors).toEqual(['#aaa', '#bbb']);
  });

  it('formats tooltip value from pie rows', () => {
    const pieData = [
      {
        name: 'Group A',
        value: 60,
        percentage: 60,
        actual_energy: '60.00 kWh',
        consumption_percentage: '60.00 %',
      },
    ];
    expect(formatConsumptionPieTooltipValue(pieData, 'Group A')).toBe('60.00 kWh (60.00 %)');
  });

  it('exposes stable layout constants', () => {
    expect(CONSUMPTION_PIE_LAYOUT.centerLabelValue).toBe('100 %');
    expect(CONSUMPTION_PIE_LAYOUT.minVisiblePercent).toBe(0.01);
  });
});

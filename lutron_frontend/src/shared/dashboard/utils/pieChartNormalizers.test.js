/**
 * @jest-environment node
 */
import {
  normalizeTotalConsumptionByGroupPayload,
  buildTotalConsumptionByGroupPieRows,
  sumAbsoluteWhFromTotalConsumptionByGroupPayload,
} from './pieChartNormalizers';

describe('pieChartNormalizers', () => {
  it('normalizeTotalConsumptionByGroupPayload extracts data map', () => {
    const out = normalizeTotalConsumptionByGroupPayload({
      status: 'success',
      data: { 'Area A': 100, 'Area B': 50 },
    });
    expect(out.data).toEqual({ 'Area A': 100, 'Area B': 50 });
  });

  it('buildTotalConsumptionByGroupPieRows from flat data', () => {
    const rows = buildTotalConsumptionByGroupPieRows(
      { data: { A: 75, B: 25 } },
      null,
      new Map()
    );
    expect(rows).toHaveLength(2);
    expect(rows[0].value + rows[1].value).toBeCloseTo(100, 1);
  });

  it('sumAbsoluteWhFromTotalConsumptionByGroupPayload sums numeric data', () => {
    expect(
      sumAbsoluteWhFromTotalConsumptionByGroupPayload({ data: { a: 10, b: 20 } })
    ).toBe(30);
  });
});

/**
 * @jest-environment node
 */
import { fetchUnifiedEnergyTransformedPayload } from './fetchUnifiedEnergyPayload';

const request = (overrides = {}) => ({
  areaIds: null,
  floorIds: null,
  groupIds: null,
  timeRange: 'this-day',
  startDate: '2026-07-18',
  endDate: '2026-07-18',
  isNavigating: false,
  ...overrides,
});

describe('fetchUnifiedEnergyTransformedPayload', () => {
  it('uses the dedicated consumption and savings endpoints for 2-4 selected areas', async () => {
    const baseUrlClient = {
      get: jest
        .fn()
        .mockResolvedValueOnce({
          data: {
            'x-axis': ['10:00'],
            'y-axis': { Lobby: [12], Office: [15] },
            unit: 'kWh',
          },
        })
        .mockResolvedValueOnce({
          data: {
            'x-axis': ['10:00'],
            'y-axis': { Lobby: [3], Office: [4] },
            unit: 'kWh',
          },
        }),
    };

    const result = await fetchUnifiedEnergyTransformedPayload({
      ...request({ areaIds: [10, 11] }),
      baseUrlClient,
    });

    expect(baseUrlClient.get).toHaveBeenCalledTimes(2);
    expect(baseUrlClient.get.mock.calls[0][0]).toContain('/dashboard/energy_consumption?');
    expect(baseUrlClient.get.mock.calls[1][0]).toContain('/dashboard/energy_savings?');
    expect(baseUrlClient.get.mock.calls[0][0]).toContain('area_ids=10');
    expect(baseUrlClient.get.mock.calls[0][0]).toContain('area_ids=11');
    expect(result.consumption['y-axis']).toEqual({ Lobby: [12], Office: [15] });
    expect(result.savings['y-axis']).toEqual({ Lobby: [3], Office: [4] });
  });

  it.each([
    ['one area', { areaIds: [10] }],
    ['five areas', { areaIds: [1, 2, 3, 4, 5] }],
    ['a floor scope', { areaIds: [10, 11], floorIds: [2] }],
    ['a group scope', { areaIds: [10, 11], groupIds: [7] }],
  ])('keeps %s on the unified endpoint', async (_label, scope) => {
    const baseUrlClient = {
      get: jest.fn().mockResolvedValue({
        data: {
          'x-axis': ['10:00'],
          consumption_data: { combined_areas: [20] },
          savings_data: { combined_areas: [5] },
        },
      }),
    };

    await fetchUnifiedEnergyTransformedPayload({
      ...request(scope),
      baseUrlClient,
    });

    expect(baseUrlClient.get).toHaveBeenCalledTimes(1);
    expect(baseUrlClient.get.mock.calls[0][0]).toContain(
      '/dashboard/unified_energy_consumption_savings_data?'
    );
  });
});

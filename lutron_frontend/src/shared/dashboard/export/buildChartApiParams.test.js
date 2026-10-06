/**
 * @jest-environment node
 */
import { buildChartApiParams } from './buildChartApiParams';

describe('buildChartApiParams', () => {
  it('prioritizes floorIds and clears areaIds with empty array', () => {
    expect(
      buildChartApiParams({
        selectedAreas: [1, 2],
        selectedFloorIds: [10],
        timeRange: 'this-week',
        startDate: '2024-06-01',
        endDate: '2024-06-07',
        isNavigating: false,
      })
    ).toEqual({
      areaIds: [],
      floorIds: [10],
      timeRange: 'this-week',
      startDate: '2024-06-01',
      endDate: '2024-06-07',
      isNavigating: false,
    });
  });

  it('uses selected areas when no floors', () => {
    expect(
      buildChartApiParams({
        selectedAreas: [3],
        selectedFloorIds: [],
        timeRange: 'this-day',
        startDate: 'a',
        endDate: 'b',
        isNavigating: true,
      }).areaIds
    ).toEqual([3]);
  });

  it('includes groupIds when provided (customized space)', () => {
    const params = buildChartApiParams({
      selectedAreas: [],
      selectedFloorIds: [],
      selectedGroupIds: [5, 6],
      timeRange: 'custom',
      startDate: '1',
      endDate: '2',
      isNavigating: false,
    });
    expect(params.groupIds).toEqual([5, 6]);
  });

  it('omits isNavigating when includeNavigating is false', () => {
    const params = buildChartApiParams({
      selectedAreas: [],
      selectedFloorIds: [],
      timeRange: 'this-month',
      startDate: 'a',
      endDate: 'b',
      isNavigating: true,
      includeNavigating: false,
    });
    expect(params.isNavigating).toBeUndefined();
  });
});

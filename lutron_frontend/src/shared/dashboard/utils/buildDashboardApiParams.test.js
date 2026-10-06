/**
 * @jest-environment node
 */
import {
  buildDashboardApiParams,
  buildDashboardChartAxiosParams,
  isCustomDurationReady,
  serializeDashboardApiParams,
} from './buildDashboardApiParams';

describe('buildDashboardApiParams', () => {
  const dateParams = {
    timeRange: 'this-day',
    startDate: '2024-06-01',
    endDate: '2024-06-01',
  };

  it('returns null when duration unset', () => {
    expect(
      buildDashboardApiParams({
        selectedDuration: null,
        allAreasLoaded: true,
        dateParams,
        isNavigating: false,
      })
    ).toBeNull();
  });

  it('returns null when custom duration incomplete', () => {
    expect(
      buildDashboardApiParams({
        selectedDuration: 'custom',
        customDateRange: { startDate: '2024-01-01', endDate: '' },
        allAreasLoaded: true,
        dateParams,
        isNavigating: false,
      })
    ).toBeNull();
  });

  it('returns valid params on initial load when allAreasLoaded is false and no explicit area/floor selected', () => {
    const params = buildDashboardApiParams({
      selectedDuration: 'this-day',
      selectedAreas: [],
      selectedFloorIds: [],
      allAreasLoaded: false,
      dateParams,
      isNavigating: false,
    });
    expect(params).toEqual({
      areaIds: null,
      floorIds: null,
      timeRange: 'this-day',
      startDate: '2024-06-01',
      endDate: '2024-06-01',
      isNavigating: false,
    });
  });

  it('prioritizes explicit areaIds over floorIds', () => {
    const params = buildDashboardApiParams({
      selectedDuration: 'this-day',
      selectedAreas: [1, 2],
      selectedFloorIds: [10],
      allAreasLoaded: true,
      dateParams,
      isNavigating: false,
    });
    expect(params).toEqual({
      areaIds: [1, 2],
      floorIds: null,
      timeRange: 'this-day',
      startDate: '2024-06-01',
      endDate: '2024-06-01',
      isNavigating: false,
    });
  });

  it('serializeDashboardApiParams is stable for same input', () => {
    const p = {
      areaIds: [1],
      floorIds: null,
      timeRange: 'this-week',
      startDate: '2024-06-01',
      endDate: '2024-06-07',
      isNavigating: false,
    };
    expect(serializeDashboardApiParams(p)).toBe(serializeDashboardApiParams({ ...p }));
  });

  it('buildDashboardChartAxiosParams maps time_range for this-day navigation', () => {
    const axiosParams = buildDashboardChartAxiosParams({
      areaIds: [5],
      floorIds: null,
      timeRange: 'this-day',
      startDate: '2024-06-01',
      endDate: '2024-06-01',
      isNavigating: true,
    });
    expect(axiosParams.time_range).toBe('custom');
    expect(axiosParams.start_date).toBe('2024-06-01');
    expect(axiosParams.area_ids).toEqual([5]);
  });

  it('isCustomDurationReady accepts customStartDate/customEndDate', () => {
    expect(isCustomDurationReady('custom', {}, '2024-01-01', '2024-01-02')).toBe(true);
    expect(isCustomDurationReady('custom', {}, '', '')).toBe(false);
  });
});

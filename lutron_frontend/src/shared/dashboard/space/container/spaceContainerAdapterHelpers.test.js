/**
 * @jest-environment node
 */
import {
  buildSharedSpaceWidgetOptionsBase,
  resolveSharedSpaceExportOptionsCore,
} from './adapters/spaceAdapterResolvers';

describe('spaceAdapterResolvers', () => {
  const runtime = {
    showChartsTab: false,
    occupancyByGroup: {},
    spaceUtilizationPerArea: {},
    occupancyByGroupFromLogs: {},
    spaceUtilizationPerFromLogs: {},
    occupancyByGroupFromLogsLoading: false,
    spaceUtilizationPerFromLogsLoading: false,
    occupancyByGroupLoading: false,
    spaceUtilizationLoading: false,
    occupancyCountLoading: false,
    instantOccupancyCountLoading: false,
    globalLoading: false,
    isLoading: false,
    globalLoadingProp: false,
    widgetList: { titles: [] },
    occupancyCount: [],
    instantOccupancyCount: [],
    instantOccupancyCountError: null,
    selectedDuration: 'today',
    currentDate: '2026-01-01',
    currentYear: 2026,
    customDateRange: {},
    isNavigating: false,
    ChartLoader: () => null,
    dispatch: jest.fn(),
    showSnackbar: jest.fn(),
    selectedAreas: [1],
    selectedFloorIds: [2],
    exportThunks: {},
    userProfile: { email: 'user@example.com' },
    fetchEmailConfigs: jest.fn(),
  };

  it('buildSharedSpaceWidgetOptionsBase returns chart and data blocks', () => {
    const result = buildSharedSpaceWidgetOptionsBase(runtime, 'basic');
    expect(result.variant).toBe('basic');
    expect(result.chart.selectedDuration).toBe('today');
    expect(result.data.occupancyCount).toEqual([]);
  });

  it('resolveSharedSpaceExportOptionsCore includes group ids when present', () => {
    const withGroups = resolveSharedSpaceExportOptionsCore({
      ...runtime,
      selectedGroupIds: [9],
    });
    expect(withGroups.selection.selectedGroupIds).toEqual([9]);

    const withoutGroups = resolveSharedSpaceExportOptionsCore(runtime);
    expect(withoutGroups.selection.selectedGroupIds).toBeUndefined();
  });
});

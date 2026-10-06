import {
  aggregateSpaceLoading,
  createSpaceWidgetTitleResolver,
  resolveSpaceActiveDataSources,
} from './spaceContainerResolvers';
import { resolveSpaceActiveTab } from './spaceLayoutResolvers';
import { SPACE_TAB_IDS } from './spaceLayoutTypes';

describe('spaceContainerResolvers', () => {
  describe('resolveSpaceActiveDataSources', () => {
    it('selects from_logs sources on charts tab', () => {
      const result = resolveSpaceActiveDataSources({
        showChartsTab: true,
        occupancyByGroup: { a: 1 },
        occupancyByGroupFromLogs: { b: 2 },
        spaceUtilizationPerArea: { c: 3 },
        spaceUtilizationPerFromLogs: { d: 4 },
        occupancyByGroupLoading: false,
        occupancyByGroupFromLogsLoading: true,
        spaceUtilizationLoading: false,
        spaceUtilizationPerFromLogsLoading: true,
      });

      expect(result.activeOccupancyByGroup).toEqual({ b: 2 });
      expect(result.activeSpaceUtilizationPerArea).toEqual({ d: 4 });
      expect(result.activeOccupancyByGroupLoading).toBe(true);
      expect(result.activeSpaceUtilizationLoading).toBe(true);
    });
  });

  describe('aggregateSpaceLoading', () => {
    it('combines chart loading flags into anyLoading', () => {
      const result = aggregateSpaceLoading({
        occupancyCountLoading: false,
        activeOccupancyByGroupLoading: true,
        activeSpaceUtilizationLoading: false,
        instantOccupancyCountLoading: false,
        globalLoading: false,
      });

      expect(result.anyLoading).toBe(true);
    });
  });

  describe('createSpaceWidgetTitleResolver', () => {
    it('resolves renamed widget titles', () => {
      const getTitle = createSpaceWidgetTitleResolver({
        titles: [{ key: 'utilization', title: 'Space Utilization' }],
      });
      expect(getTitle('utilization', 'Utilization')).toBe('Space Utilization');
    });
  });

  describe('resolveSpaceActiveTab', () => {
    it('maps showChartsTab to tab ids', () => {
      expect(resolveSpaceActiveTab({ showChartsTab: true })).toBe(SPACE_TAB_IDS.CHARTS);
      expect(resolveSpaceActiveTab({ showChartsTab: false })).toBe(SPACE_TAB_IDS.UTILIZATION);
    });
  });
});

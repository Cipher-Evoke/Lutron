/**
 * @jest-environment node
 */
import { SPACE_TAB_IDS, SPACE_LAYOUT_MODES } from './spaceLayoutTypes';
import {
  buildSpaceChartsDashboardRows,
  resolveSpaceActiveTab,
  resolveSpaceTabLayout,
  resolveSpaceSectionLayout,
  resolveSpaceWidgetOrder,
  resolveSpaceLayoutVisibility,
  resolveSpaceSlotMeta,
  isSpaceCustomSlot,
  isSpaceLayoutTabSupported,
  buildSpaceLayoutContext,
} from './spaceLayoutResolvers';
import {
  BASIC_SPACE_SLOT_REGISTRY,
  ADVANCED_SPACE_UTILIZATION_SECTIONS,
  createBasicSpaceLayoutAdapter,
  createAdvancedSpaceLayoutAdapter,
} from './spaceLayoutAdapters';

const basicAdapter = createBasicSpaceLayoutAdapter({
  buildRows: buildSpaceChartsDashboardRows,
});

const advancedAdapter = createAdvancedSpaceLayoutAdapter();

describe('spaceLayoutResolvers', () => {
  describe('buildSpaceChartsDashboardRows', () => {
    it('isolates full-width instant slots', () => {
      expect(
        buildSpaceChartsDashboardRows([
          'instant_occupancy_count',
          'utilization_by_area_group',
          'peak_and_minimum_utilization',
        ])
      ).toEqual([
        ['instant_occupancy_count'],
        ['utilization_by_area_group', 'peak_and_minimum_utilization'],
      ]);
    });

    it('isolates instant_utilization_combined on its own row', () => {
      expect(
        buildSpaceChartsDashboardRows([
          'instant_utilization_combined',
          'utilization_by_area_group',
          'utilization_by_area',
        ])
      ).toEqual([
        ['instant_utilization_combined'],
        ['utilization_by_area_group', 'utilization_by_area'],
      ]);
    });
  });

  describe('resolveSpaceActiveTab', () => {
    it('maps showChartsTab to tab ids', () => {
      expect(resolveSpaceActiveTab({ showChartsTab: true })).toBe(SPACE_TAB_IDS.CHARTS);
      expect(resolveSpaceActiveTab({ showChartsTab: false })).toBe(SPACE_TAB_IDS.UTILIZATION);
    });
  });

  describe('resolveSpaceLayoutVisibility', () => {
    it('shows charts empty state when no visible slots', () => {
      expect(
        resolveSpaceLayoutVisibility({ showChartsTab: true, visibleSlotOrder: [] }, basicAdapter)
      ).toEqual({
        visible: true,
        showEmptyState: true,
        emptyStateKey: 'charts',
      });
    });

    it('hides utilization layout when showOnlyInstantChart', () => {
      expect(
        resolveSpaceLayoutVisibility({ showOnlyInstantChart: true }, basicAdapter)
      ).toEqual({ visible: false, showEmptyState: false });
    });

    it('shows utilization empty state on main tab', () => {
      expect(
        resolveSpaceLayoutVisibility(
          { showChartsTab: false, visibleSlotOrder: [] },
          basicAdapter
        )
      ).toEqual({
        visible: true,
        showEmptyState: true,
        emptyStateKey: 'utilization',
      });
    });
  });

  describe('resolveSpaceWidgetOrder', () => {
    it('returns visibleSlotOrder when provided', () => {
      const order = ['utilization', 'utilization_by_area'];
      expect(resolveSpaceWidgetOrder({ visibleSlotOrder: order }, basicAdapter)).toEqual(order);
    });
  });

  describe('resolveSpaceTabLayout', () => {
    it('resolves dynamic rows for basic charts tab', () => {
      const layout = resolveSpaceTabLayout(
        SPACE_TAB_IDS.CHARTS,
        {
          showChartsTab: true,
          visibleSlotOrder: ['instant_occupancy_count', 'utilization_by_area_group'],
        },
        basicAdapter
      );
      expect(layout.layoutMode).toBe(SPACE_LAYOUT_MODES.DYNAMIC_ROWS);
      expect(layout.selectorMode).toBe('active');
      expect(layout.rows).toEqual([
        ['instant_occupancy_count'],
        ['utilization_by_area_group'],
      ]);
    });

    it('resolves fixed sections for advanced utilization tab', () => {
      const layout = resolveSpaceTabLayout(
        SPACE_TAB_IDS.UTILIZATION,
        { showChartsTab: false },
        advancedAdapter
      );
      expect(layout.layoutMode).toBe(SPACE_LAYOUT_MODES.FIXED_SECTIONS);
      expect(layout.sections).toEqual(ADVANCED_SPACE_UTILIZATION_SECTIONS);
      expect(layout.selectorMode).toBe('main');
    });
  });

  describe('resolveSpaceSectionLayout', () => {
    it('builds rows from visible order', () => {
      expect(
        resolveSpaceSectionLayout(
          SPACE_TAB_IDS.CHARTS,
          { visibleSlotOrder: ['instant_occupancy_count', 'utilization_by_area'] },
          basicAdapter
        )
      ).toEqual([['instant_occupancy_count'], ['utilization_by_area']]);
    });
  });

  describe('slot metadata', () => {
    it('identifies custom combined slot', () => {
      expect(
        isSpaceCustomSlot('instant_utilization_combined', {
          SLOT_REGISTRY: BASIC_SPACE_SLOT_REGISTRY,
        })
      ).toBe(true);
      expect(resolveSpaceSlotMeta('utilization', { SLOT_REGISTRY: BASIC_SPACE_SLOT_REGISTRY }))
        .toMatchObject({ widgetKey: 'utilization' });
    });
  });

  describe('buildSpaceLayoutContext', () => {
    it('assembles layout context', () => {
      const ctx = buildSpaceLayoutContext({
        variant: 'basic',
        showChartsTab: true,
        visibleSlotOrder: ['utilization'],
      });
      expect(ctx.variant).toBe('basic');
      expect(ctx.visibleSlotOrder).toEqual(['utilization']);
    });
  });

  describe('isSpaceLayoutTabSupported', () => {
    it('supports charts and utilization tabs', () => {
      expect(isSpaceLayoutTabSupported(SPACE_TAB_IDS.CHARTS)).toBe(true);
      expect(isSpaceLayoutTabSupported('unknown')).toBe(false);
    });
  });
});

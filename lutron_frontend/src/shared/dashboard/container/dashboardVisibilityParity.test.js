/**
 * @jest-environment node
 */
import {
  ENERGY_CHART_SLOT_ORDER_DEFAULT,
  ENERGY_STANDALONE_CHART_ORDER,
  applyEnergyChartOrderForVisibility,
  applyEnergyCombinedChartOrder,
  applyEnergyStandaloneChartOrder,
  buildEnergyDashboardRows,
  deriveEnergyChartOrderFromWidgetTitles,
  mergeVisibleDashboardOrder,
  normalizeEnergySlotOrder,
  parseCustomizedWidgetVisibilityFromStorage,
  readDashboardPageOrder,
  readDashboardPageSpan,
  resolveEnergyAllVisible,
  resolveEnergyCardColumnSpan,
  resolveEnergyGridColumnTemplate,
  resolveEnergyVisibleSlotOrder,
  resolveHiddenEnergySlotIds,
  resolveOrderedVisibleDashboardCards,
  resolveShowEnergyStandaloneDurationFilter,
  sortItemsByDashboardOrder,
  writeDashboardPageOrder,
  writeDashboardPageSpan,
} from './dashboardLayoutResolvers';
import {
  createVisibilityOrderSignature,
  hasVisibilityOrderSignatureChanged,
} from './visibilityMemoCompare';
import { resolveCustomizedSpaceCombinedVisible, resolveEnergyWidgetVisible } from './hooks/widgetVisibilityResolvers';

const allVisibleMap = {
  consumption: true,
  consumption_saving: true,
  savings: true,
  savings_by_strategy: true,
  total_consumption_by_group: true,
  light_power_density: true,
  peak_and_minimum_consumption: true,
};

const combinedHiddenMap = {
  ...allVisibleMap,
  consumption_saving: false,
};

describe('dashboard visibility and layout parity', () => {
  describe('widget visibility', () => {
    it('resolveEnergyVisibleSlotOrder puts combined first when visible', () => {
      expect(resolveEnergyVisibleSlotOrder(allVisibleMap)[0]).toBe('consumption_saving');
      expect(resolveEnergyVisibleSlotOrder(allVisibleMap)).toEqual([
        'consumption_saving',
        ...ENERGY_STANDALONE_CHART_ORDER,
      ]);
    });

    it('resolveEnergyVisibleSlotOrder uses standalone order when combined hidden', () => {
      expect(resolveEnergyVisibleSlotOrder(combinedHiddenMap)).toEqual(
        ENERGY_STANDALONE_CHART_ORDER
      );
    });

    it('resolveEnergyAllVisible detects full visibility', () => {
      expect(resolveEnergyAllVisible(allVisibleMap)).toBe(true);
      expect(resolveEnergyAllVisible(combinedHiddenMap)).toBe(false);
      expect(resolveEnergyAllVisible({ consumption: false })).toBe(false);
    });

    it('resolveShowEnergyStandaloneDurationFilter gates standalone duration chrome', () => {
      expect(
        resolveShowEnergyStandaloneDurationFilter(
          combinedHiddenMap,
          resolveEnergyVisibleSlotOrder(combinedHiddenMap)
        )
      ).toBe(true);
      expect(
        resolveShowEnergyStandaloneDurationFilter(
          allVisibleMap,
          resolveEnergyVisibleSlotOrder(allVisibleMap)
        )
      ).toBe(false);
    });

    it('resolveEnergyWidgetVisible delegates basic visibility map', () => {
      expect(
        resolveEnergyWidgetVisible('consumption', {
          variant: 'basic',
          visibilityMap: { consumption: false },
        })
      ).toBe(false);
    });
  });

  describe('hidden widget calculations', () => {
    it('resolveHiddenEnergySlotIds returns slots not in visible order', () => {
      const fullOrder = [...ENERGY_CHART_SLOT_ORDER_DEFAULT];
      const hidden = resolveHiddenEnergySlotIds(fullOrder, { consumption: false });
      expect(hidden).toContain('consumption');
    });

    it('applyEnergyStandaloneChartOrder moves hidden slots to the end', () => {
      const prev = [...ENERGY_CHART_SLOT_ORDER_DEFAULT];
      const next = applyEnergyStandaloneChartOrder(prev, combinedHiddenMap);
      // Preserves rearrange among still-visible slots; Combined goes to the end.
      expect(next.filter((id) => id !== 'consumption_saving')).toEqual([
        'consumption',
        'savings',
        'savings_by_strategy',
        'total_consumption_by_group',
        'light_power_density',
        'peak_and_minimum_consumption',
      ]);
      expect(next).toContain('consumption_saving');
      expect(next.indexOf('consumption_saving')).toBeGreaterThan(
        next.indexOf('peak_and_minimum_consumption')
      );
    });

    it('applyEnergyCombinedChartOrder keeps combined first', () => {
      const prev = [...ENERGY_CHART_SLOT_ORDER_DEFAULT];
      const next = applyEnergyCombinedChartOrder(prev, allVisibleMap);
      expect(next[0]).toBe('consumption_saving');
    });

    it('applyEnergyChartOrderForVisibility selects standalone vs combined strategy', () => {
      const prev = [...ENERGY_CHART_SLOT_ORDER_DEFAULT];
      expect(applyEnergyChartOrderForVisibility(prev, allVisibleMap)[0]).toBe('consumption_saving');
      expect(applyEnergyChartOrderForVisibility(prev, combinedHiddenMap)[0]).toBe('consumption');
    });
  });

  describe('widget order parity', () => {
    it('normalizeEnergySlotOrder appends missing defaults', () => {
      expect(normalizeEnergySlotOrder(['savings'])).toEqual([
        'savings',
        'consumption',
        'consumption_saving',
        'savings_by_strategy',
        'total_consumption_by_group',
        'light_power_density',
        'peak_and_minimum_consumption',
      ]);
    });

    it('deriveEnergyChartOrderFromWidgetTitles respects widget list order', () => {
      const order = deriveEnergyChartOrderFromWidgetTitles({
        titles: [{ key: 'savings' }, { key: 'consumption' }],
      });
      expect(order[0]).toBe('savings');
      expect(order[1]).toBe('consumption');
    });

    it('mergeVisibleDashboardOrder preserves stored keys then appends new ones', () => {
      expect(mergeVisibleDashboardOrder(['b', 'a'], ['a', 'c', 'b'])).toEqual(['b', 'a', 'c']);
    });

    it('sortItemsByDashboardOrder sorts cards by merged order', () => {
      const cards = [{ key: 'c' }, { key: 'a' }, { key: 'b' }];
      expect(sortItemsByDashboardOrder(cards, ['b', 'a', 'c']).map((c) => c.key)).toEqual([
        'b',
        'a',
        'c',
      ]);
    });
  });

  describe('placement parity', () => {
    it('buildEnergyDashboardRows gives combined its own row', () => {
      expect(buildEnergyDashboardRows(['consumption', 'consumption_saving', 'savings'])).toEqual([
        ['consumption'],
        ['consumption_saving'],
        ['savings'],
      ]);
    });

    it('buildEnergyDashboardRows pairs adjacent standalone widgets', () => {
      expect(buildEnergyDashboardRows(['consumption', 'savings'])).toEqual([['consumption', 'savings']]);
    });

    it('resolveEnergyGridColumnTemplate switches at single card', () => {
      expect(resolveEnergyGridColumnTemplate(1)).toBe('1fr');
      expect(resolveEnergyGridColumnTemplate(2)).toBe('1fr 1fr');
    });

    it('resolveEnergyCardColumnSpan honors span map and single-card full width', () => {
      expect(resolveEnergyCardColumnSpan('consumption', { consumption: 12 }, 2)).toBe(12);
      expect(resolveEnergyCardColumnSpan('consumption', { consumption: 6 }, 1)).toBe(12);
    });

    it('resolveOrderedVisibleDashboardCards merges order and sorts', () => {
      const cards = [{ key: 'b' }, { key: 'a' }];
      const result = resolveOrderedVisibleDashboardCards(cards, ['a']);
      expect(result.mergedOrder).toEqual(['a', 'b']);
      expect(result.orderedCards.map((c) => c.key)).toEqual(['a', 'b']);
      expect(result.visibleCount).toBe(2);
    });
  });

  describe('customized storage helpers', () => {
    const storage = {};

    beforeEach(() => {
      Object.keys(storage).forEach((key) => delete storage[key]);
      global.localStorage = {
        getItem: (key) => storage[key] ?? null,
        setItem: (key, value) => {
          storage[key] = String(value);
        },
        removeItem: (key) => {
          delete storage[key];
        },
      };
    });

    it('parseCustomizedWidgetVisibilityFromStorage returns object', () => {
      storage.widgetVisibility_customized = JSON.stringify({ energy: { consumption: false } });
      expect(parseCustomizedWidgetVisibilityFromStorage().energy.consumption).toBe(false);
    });

    it('resolveCustomizedSpaceCombinedVisible matches combined widget prefs', () => {
      expect(resolveCustomizedSpaceCombinedVisible({})).toBe(false);
      expect(
        resolveCustomizedSpaceCombinedVisible({
          energy: { consumption: true },
        })
      ).toBe(false);
      expect(
        resolveCustomizedSpaceCombinedVisible({
          space: { instant_utilization_combined: true },
        })
      ).toBe(true);
      expect(
        resolveCustomizedSpaceCombinedVisible({
          space: { instant_occupancy_count: true },
        })
      ).toBe(false);
    });

    it('read/write dashboard page order and span', () => {
      writeDashboardPageOrder('energy', ['a', 'b']);
      writeDashboardPageSpan('energy', { a: 12 });
      expect(readDashboardPageOrder('energy')).toEqual(['a', 'b']);
      expect(readDashboardPageSpan('energy')).toEqual({ a: 12 });
    });
  });

  describe('visibility memo compare', () => {
    it('createVisibilityOrderSignature joins visible ids', () => {
      expect(createVisibilityOrderSignature(['a', 'b'])).toBe('a,b');
    });

    it('hasVisibilityOrderSignatureChanged detects changes after initial signature', () => {
      expect(hasVisibilityOrderSignatureChanged('a,b', ['a', 'c'])).toBe(true);
      expect(hasVisibilityOrderSignatureChanged('', ['a'])).toBe(false);
    });
  });
});

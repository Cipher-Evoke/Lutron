/**
 * @jest-environment node
 */
import {
  ENERGY_WIDGET_TITLE_DEFAULTS,
  TOTAL_CONSUMPTION_GROUP_ALIASES,
  resolveDashboardWidgetTitle,
  resolveDashboardWidgetTitleWithAliases,
  resolveEnergyWidgetTitles,
  resolveEnergyWidgetVisibilityKeys,
  resolveBuiltinEnergyWidgetVisible,
  resolveCustomizedEnergyWidgetVisible,
  resolveEnergyWidgetVisible,
} from './widgetVisibilityResolvers';
import {
  createInitialChartLoadingState,
  buildEnergyTabLoadingStartPatch,
  buildEnergyTabLoadingCompletePatch,
  buildEnergyWidgetLoadingCompletePatch,
  buildEnergyTabApiCallPlan,
  resolveConsumptionIsLoading,
  resolveSavingsIsLoading,
  resolveCombinedConsumptionSavingIsLoading,
  resolveEmbeddedSavingsByStrategyLoading,
  resolveEnergyColorPalettes,
  buildUnifiedEnergyWidgetProps,
} from './widgetPropBuilders';

const widgetList = {
  titles: [
    { key: 'consumption', title: 'Custom Consumption' },
    { key: 'savings', title: 'Custom Savings', dropdown_name: 'Savings Dropdown' },
    { key: 'consumption_by_area_groups', title: 'Groups Alias Title' },
    { key: 42, title: 'Numeric Key Title' },
  ],
};

describe('dashboard widget orchestration parity', () => {
  describe('visibility resolution', () => {
    it('maps total consumption group aliases', () => {
      expect(resolveEnergyWidgetVisibilityKeys('total_consumption_by_group')).toEqual(
        TOTAL_CONSUMPTION_GROUP_ALIASES
      );
      expect(resolveEnergyWidgetVisibilityKeys('consumption')).toEqual(['consumption']);
    });

    it('resolveBuiltinEnergyWidgetVisible honors basic visibility map', () => {
      const map = { consumption: false, savings: true };
      expect(
        resolveBuiltinEnergyWidgetVisible('consumption', map, { variant: 'basic' })
      ).toBe(false);
      expect(resolveBuiltinEnergyWidgetVisible('savings', map, { variant: 'basic' })).toBe(
        true
      );
    });

    it('resolveBuiltinEnergyWidgetVisible honors visibility map for advanced', () => {
      expect(
        resolveBuiltinEnergyWidgetVisible('consumption', { consumption: false }, {
          variant: 'advanced',
        })
      ).toBe(false);
    });

    it('resolveCustomizedEnergyWidgetVisible defaults to Advanced-like when empty', () => {
      const getPage = (key) =>
        key === 'occupancy_count' ? 'space' : 'energy';

      expect(
        resolveCustomizedEnergyWidgetVisible('occupancy_count', { energy: {} }, getPage)
      ).toBe(false);

      // Empty prefs → Advanced-like individuals (Combined off).
      expect(resolveCustomizedEnergyWidgetVisible('consumption', null, getPage)).toBe(true);
      expect(
        resolveCustomizedEnergyWidgetVisible('consumption_saving', null, getPage)
      ).toBe(false);

      expect(
        resolveCustomizedEnergyWidgetVisible(
          'custom_graph:abc',
          { energy: { 'custom_graph:abc': false } },
          getPage
        )
      ).toBe(false);

      expect(
        resolveCustomizedEnergyWidgetVisible(
          'total_consumption_by_group',
          { energy: { consumption_by_area_groups: true } },
          getPage
        )
      ).toBe(true);

      // Combined vs individuals mutual exclusion
      expect(
        resolveCustomizedEnergyWidgetVisible(
          'consumption_saving',
          { energy: { consumption_saving: true, consumption: true } },
          getPage
        )
      ).toBe(false);
      expect(
        resolveCustomizedEnergyWidgetVisible(
          'consumption',
          { energy: { consumption_saving: true, consumption: true } },
          getPage
        )
      ).toBe(true);
    });

    it('resolveEnergyWidgetVisible delegates by variant', () => {
      expect(
        resolveEnergyWidgetVisible('consumption', {
          variant: 'customized',
          widgetVisibility: { energy: { consumption: false } },
          getEffectiveBuiltinDashboardPage: () => 'energy',
        })
      ).toBe(false);
    });
  });

  describe('title resolution', () => {
    it('basic/advanced exact key match with title fallback', () => {
      expect(
        resolveDashboardWidgetTitle('consumption', 'Consumption', widgetList, {
          variant: 'basic',
        })
      ).toBe('Custom Consumption');
      expect(
        resolveDashboardWidgetTitle('missing', 'Fallback', widgetList, { variant: 'advanced' })
      ).toBe('Fallback');
    });

    it('customized uses string coercion and dropdown_name fallback', () => {
      expect(
        resolveDashboardWidgetTitle('savings', 'Savings', widgetList, {
          variant: 'customized',
        })
      ).toBe('Custom Savings');

      const listWithoutTitle = {
        titles: [{ key: 'savings', dropdown_name: 'Savings Dropdown' }],
      };
      expect(
        resolveDashboardWidgetTitle('savings', 'Savings', listWithoutTitle, {
          variant: 'customized',
        })
      ).toBe('Savings Dropdown');

      expect(
        resolveDashboardWidgetTitle(42, 'Numeric', widgetList, { variant: 'customized' })
      ).toBe('Numeric Key Title');
    });

    it('resolveDashboardWidgetTitleWithAliases walks alias keys', () => {
      expect(
        resolveDashboardWidgetTitleWithAliases(
          'total_consumption_by_group',
          ['consumption_by_area_groups'],
          'Consumption By Area Groups',
          widgetList,
          { variant: 'customized' }
        )
      ).toBe('Groups Alias Title');
    });

    it('resolveEnergyWidgetTitles returns defaults and configured titles', () => {
      const basicTitles = resolveEnergyWidgetTitles(widgetList, { variant: 'basic' });
      expect(basicTitles.consumption).toBe('Custom Consumption');
      expect(basicTitles.peakAndMinimumConsumption).toBe(
        ENERGY_WIDGET_TITLE_DEFAULTS.peakAndMinimumConsumption
      );

      const customizedTitles = resolveEnergyWidgetTitles(widgetList, {
        variant: 'customized',
        includeAliases: true,
      });
      expect(customizedTitles.totalConsumptionByGroup).toBe('Groups Alias Title');
    });
  });

  describe('widget ordering helpers', () => {
    it('alias keys preserve stable ordering for group widget visibility checks', () => {
      const keys = resolveEnergyWidgetVisibilityKeys('total_consumption_by_group');
      expect(keys[0]).toBe('total_consumption_by_group');
      expect(keys[1]).toBe('consumption_by_area_groups');
    });
  });

  describe('loading guards', () => {
    const readyContext = {
      allEnergyChartsReady: true,
      energyConsumptionLoading: false,
      energyConsumption: { unit: 'kWh' },
      chartLoadingEnergyConsumption: false,
      energySavingsLoading: false,
      energySavings: { unit: 'kWh' },
      chartLoadingEnergySavings: false,
    };

    it('resolveConsumptionIsLoading is false when all gates pass', () => {
      expect(resolveConsumptionIsLoading(readyContext)).toBe(false);
    });

    it('resolveConsumptionIsLoading is true when chart batch is in flight', () => {
      expect(
        resolveConsumptionIsLoading({
          ...readyContext,
          chartLoadingEnergyConsumption: true,
        })
      ).toBe(true);
    });

    it('resolveCombinedConsumptionSavingIsLoading respects custom date guard', () => {
      expect(
        resolveCombinedConsumptionSavingIsLoading({
          energyCustomNeedsDates: true,
          consumptionIsLoading: true,
          savingsIsLoading: true,
        })
      ).toBe(false);

      expect(
        resolveCombinedConsumptionSavingIsLoading({
          energyCustomNeedsDates: false,
          consumptionIsLoading: false,
          savingsIsLoading: true,
        })
      ).toBe(true);
    });

    it('resolveEmbeddedSavingsByStrategyLoading matches embedded slot guard', () => {
      expect(
        resolveEmbeddedSavingsByStrategyLoading({
          energyCustomNeedsDates: false,
          allEnergyChartsReady: true,
          chartLoadingSavingsByStrategy: false,
          globalLoading: false,
          savingsByStrategy: { segments: [] },
        })
      ).toBe(false);

      expect(
        resolveEmbeddedSavingsByStrategyLoading({
          energyCustomNeedsDates: false,
          allEnergyChartsReady: false,
          chartLoadingSavingsByStrategy: false,
          globalLoading: false,
          savingsByStrategy: { segments: [] },
        })
      ).toBe(false);
    });

    it('resolveSavingsIsLoading requires savings payload', () => {
      expect(
        resolveSavingsIsLoading({
          ...readyContext,
          energySavings: null,
        })
      ).toBe(true);
    });
  });

  describe('energy tab chart loading patches', () => {
    it('createInitialChartLoadingState includes customized from-logs keys', () => {
      const customized = createInitialChartLoadingState({ variant: 'customized' });
      expect(customized.occupancyByGroupFromLogs).toBe(false);
      expect(customized.spaceUtilizationPerFromLogs).toBe(false);
    });

    it('buildEnergyTabLoadingStartPatch toggles unified and donut flags', () => {
      const start = buildEnergyTabLoadingStartPatch({}, { includeUnified: true });
      expect(start.energyConsumption).toBe(true);
      expect(start.savingsByStrategy).toBe(true);

      const startNoUnified = buildEnergyTabLoadingStartPatch({}, { includeUnified: false });
      expect(startNoUnified.energyConsumption).toBe(false);
      expect(startNoUnified.totalConsumptionByGroup).toBe(true);
    });

    it('buildEnergyTabLoadingCompletePatch clears matching flags', () => {
      const prev = buildEnergyTabLoadingStartPatch({}, { includeUnified: true });
      const done = buildEnergyTabLoadingCompletePatch(prev, { includeUnified: true });
      expect(done.energyConsumption).toBe(false);
      expect(done.savingsByStrategy).toBe(false);
    });

    it('buildEnergyWidgetLoadingCompletePatch clears only the matching widget flags', () => {
      const prev = buildEnergyTabLoadingStartPatch({}, { includeUnified: true });
      const afterUnified = buildEnergyWidgetLoadingCompletePatch(prev, 'unifiedEnergyData');
      expect(afterUnified.energyConsumption).toBe(false);
      expect(afterUnified.energySavings).toBe(false);
      expect(afterUnified.peakMinConsumption).toBe(false);
      expect(afterUnified.lightPowerDensity).toBe(true);
      expect(afterUnified.savingsByStrategy).toBe(true);
      expect(afterUnified.totalConsumptionByGroup).toBe(true);

      const afterLpd = buildEnergyWidgetLoadingCompletePatch(afterUnified, 'lightPowerDensity');
      expect(afterLpd.lightPowerDensity).toBe(false);
      expect(afterLpd.savingsByStrategy).toBe(true);
    });

    it('buildEnergyTabApiCallPlan skips unified when params unchanged', () => {
      const plan = buildEnergyTabApiCallPlan({
        apiParamsString: '{"a":1}',
        unifiedApiParamsRefCurrent: '{"a":1}',
      });
      expect(plan.shouldCallUnified).toBe(false);
      expect(plan.totalApis).toBe(3);
      expect(plan.apiCallNames).toEqual([
        'totalConsumptionByGroup',
        'lightPowerDensity',
        'savingsByStrategy',
      ]);
    });

    it('buildEnergyTabApiCallPlan includes unified when params changed', () => {
      const plan = buildEnergyTabApiCallPlan({
        apiParamsString: '{"a":2}',
        unifiedApiParamsRefCurrent: '{"a":1}',
      });
      expect(plan.shouldCallUnified).toBe(true);
      expect(plan.totalApis).toBe(4);
      expect(plan.nextUnifiedApiParamsRef).toBe('{"a":2}');
    });
  });

  describe('prop assembly', () => {
    it('resolveEnergyColorPalettes returns variant palettes', () => {
      expect(resolveEnergyColorPalettes({ variant: 'basic' }).consumptionColors[0]).toBe(
        '#ff6b6b'
      );
      expect(
        resolveEnergyColorPalettes({
          variant: 'advanced',
          getThemeAwareConsumptionLineColors: () => ['#abc'],
        }).consumptionColors
      ).toEqual(['#abc']);
    });

    it('buildUnifiedEnergyWidgetProps assembles core widget props', () => {
      const ChartLoader = () => null;
      const props = buildUnifiedEnergyWidgetProps({
        title: 'Consumption',
        energyData: { unit: 'kWh' },
        allEnergyChartsReady: true,
        energyLoading: false,
        chartLoadingFlag: false,
        colors: ['#ff6b6b'],
        transformDataForCharts: () => [],
        selectedDuration: 'this-week',
        currentDate: '2025-06-10',
        currentYear: 2025,
        selectedAreas: [1],
        customDatesIncomplete: false,
        shellVariant: 'basic',
        ChartLoader,
      });

      expect(props).toMatchObject({
        title: 'Consumption',
        shellVariant: 'basic',
        customDatesIncomplete: false,
        selectedAreas: [1],
      });
      expect(props.ChartLoader).toBe(ChartLoader);
    });
  });
});

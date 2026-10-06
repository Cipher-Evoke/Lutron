/**
 * @jest-environment node
 */
import {
  SUPPORTED_DASHBOARD_WIDGET_RENDERER_KEYS,
  WIDGET_RENDERER_TYPES,
  getWidgetRenderMapEntry,
  isSupportedDashboardWidgetRendererKey,
  isWidgetRendererSupportedForVariant,
} from './widgetRenderMap';
import {
  resolveWidgetRenderer,
  resolveWidgetVisibility,
  resolveWidgetProps,
  resolveWidgetTitle,
  isRenderableDashboardWidgetKey,
  buildEnergyWidgetRenderContext,
} from './widgetSlotResolvers';
import { ENERGY_WIDGET_TITLE_DEFAULTS } from './hooks/widgetVisibilityResolvers';

const widgetList = {
  titles: [
    { key: 'consumption', title: 'Custom Consumption' },
    { key: 'consumption_by_area_groups', title: 'Groups Alias Title' },
    { key: 'energy', title: 'Overview Energy' },
  ],
};

const baseContext = {
  variant: 'basic',
  widgetList,
  getWidgetTitle: (key, fallback) => fallback,
  titles: {
    consumption: 'Hook Consumption',
    savings: 'Hook Savings',
    savingsByStrategy: 'Hook Strategy',
    totalConsumptionByGroup: 'Hook Groups',
  },
  data: {
    memoizedEnergyConsumption: { series: [] },
    memoizedEnergySavings: { series: [] },
    savingsByStrategy: { segments: [] },
    totalConsumptionByGroup: { groups: [] },
    lightPowerDensity: { value: 1 },
    lightingUnit: 'Watt / Sq ft',
  },
  loading: {
    energyConsumptionLoading: false,
    energySavingsLoading: false,
    peakMinConsumptionLoading: false,
  },
  chartLoading: {
    energyConsumption: false,
    energySavings: false,
    savingsByStrategy: false,
    totalConsumptionByGroup: false,
    lightPowerDensity: false,
    peakMinConsumption: false,
  },
  allEnergyChartsReady: true,
  globalLoading: false,
  colors: {
    consumption: ['#ff6b6b'],
    savings: ['#1f77b4'],
  },
  chartHeaderStyle: { fontSize: 14 },
  transformDataForCharts: (data) => data,
  selectedDuration: 'this_week',
  currentDate: '2026-06-10',
  currentYear: 2026,
  selectedAreas: [],
  energyCustomNeedsDates: false,
  isLargeScreen: true,
  areaGroups: [],
  overrides: {
    consumption: { chartSurface: 'dark', exportControl: 'export-a' },
    savings: { chartSurface: 'dark' },
    savings_by_strategy: { chartSurface: 'light' },
    total_consumption_by_group: { exportControl: 'export-b' },
    light_power_density: { chartSurface: 'light' },
    peak_and_minimum_consumption: { chartSurface: 'dark' },
  },
};

describe('widgetSlotResolvers', () => {
  describe('resolveWidgetRenderer', () => {
    it('returns map entry for supported energy keys', () => {
      expect(resolveWidgetRenderer('consumption')).toMatchObject({
        type: WIDGET_RENDERER_TYPES.UNIFIED_ENERGY,
        energyMode: 'consumption',
      });
      expect(resolveWidgetRenderer('peak_and_minimum_consumption')).toMatchObject({
        type: WIDGET_RENDERER_TYPES.PEAK_MIN_CONSUMPTION,
      });
    });

    it('returns overview tile entry for overview keys', () => {
      expect(resolveWidgetRenderer('schedules')).toMatchObject({
        type: WIDGET_RENDERER_TYPES.OVERVIEW_TILE,
        section: 'overview',
      });
    });

    it('returns null for unsupported keys', () => {
      expect(resolveWidgetRenderer('consumption_saving')).toBeNull();
      expect(resolveWidgetRenderer('custom_graph:abc')).toBeNull();
      expect(resolveWidgetRenderer('utilization')).toBeNull();
      expect(resolveWidgetRenderer(null)).toBeNull();
    });
  });

  describe('resolveWidgetTitle', () => {
    it('uses hook titles when provided', () => {
      expect(resolveWidgetTitle('consumption', baseContext)).toBe('Hook Consumption');
      expect(resolveWidgetTitle('savings_by_strategy', baseContext)).toBe('Hook Strategy');
    });

    it('resolves total consumption group aliases from widget list', () => {
      expect(
        resolveWidgetTitle('total_consumption_by_group', {
          ...baseContext,
          titles: {},
          getWidgetTitle: undefined,
        })
      ).toBe('Groups Alias Title');
    });

    it('falls back to defaults for unknown keys', () => {
      expect(
        resolveWidgetTitle('light_power_density', {
          variant: 'basic',
          titles: {},
        })
      ).toBe(ENERGY_WIDGET_TITLE_DEFAULTS.lightPowerDensity);
    });
  });

  describe('resolveWidgetVisibility', () => {
    it('honors explicit visible=false', () => {
      expect(
        resolveWidgetVisibility('energy', { visible: false })
      ).toBe(false);
    });

    it('delegates energy visibility to variant rules', () => {
      expect(
        resolveWidgetVisibility('consumption', {
          variant: 'advanced',
          visibilityMap: { consumption: false },
        })
      ).toBe(true);

      expect(
        resolveWidgetVisibility('consumption', {
          variant: 'basic',
          visibilityMap: { consumption: false },
        })
      ).toBe(false);
    });

    it('returns false for invalid widget keys', () => {
      expect(resolveWidgetVisibility('shades', baseContext)).toBe(false);
    });
  });

  describe('resolveWidgetProps', () => {
    it('builds unified energy consumption props with overrides', () => {
      const props = resolveWidgetProps('consumption', baseContext);
      expect(props.mode).toBe('consumption');
      expect(props.title).toBe('Hook Consumption');
      expect(props.energyData).toEqual({ series: [] });
      expect(props.chartSurface).toBe('dark');
      expect(props.exportControl).toBe('export-a');
      expect(props.shellVariant).toBe('basic');
    });

    it('builds savings props', () => {
      const props = resolveWidgetProps('savings', baseContext);
      expect(props.mode).toBe('savings');
      expect(props.title).toBe('Hook Savings');
      expect(props.colors).toEqual(['#1f77b4']);
    });

    it('builds strategy, group, lpd, and peak props', () => {
      expect(resolveWidgetProps('savings_by_strategy', baseContext)).toMatchObject({
        title: 'Hook Strategy',
        chartSurface: 'light',
        shellVariant: 'basic',
      });
      expect(resolveWidgetProps('total_consumption_by_group', baseContext)).toMatchObject({
        title: 'Hook Groups',
        exportControl: 'export-b',
      });
      expect(resolveWidgetProps('light_power_density', baseContext)).toMatchObject({
        lightingUnit: 'Watt / Sq ft',
        chartSurface: 'light',
      });
      expect(resolveWidgetProps('peak_and_minimum_consumption', baseContext)).toMatchObject({
        chartSurface: 'dark',
        isLargeScreen: true,
      });
    });

    it('builds overview tile props', () => {
      const props = resolveWidgetProps('energy', {
        ...baseContext,
        overview: {
          energy: { savings_percent: 10 },
          themeVariant: 'basic',
        },
      });
      expect(props.tileType).toBe('energy');
      expect(props.energy).toEqual({ savings_percent: 10 });
      expect(props.themeVariant).toBe('basic');
    });

    it('returns null for unsupported keys', () => {
      expect(resolveWidgetProps('consumption_saving', baseContext)).toBeNull();
      expect(resolveWidgetProps('custom_graph:1', baseContext)).toBeNull();
    });
  });

  describe('buildEnergyWidgetRenderContext', () => {
    it('assembles a render context bag for DashboardWidgetRenderer', () => {
      const ctx = buildEnergyWidgetRenderContext({
        variant: 'advanced',
        titles: { consumption: 'C' },
        overrides: { consumption: { advancedSurface: { card: 1 } } },
      });
      expect(ctx.variant).toBe('advanced');
      expect(ctx.titles.consumption).toBe('C');
      expect(ctx.overrides.consumption.advancedSurface).toEqual({ card: 1 });
    });
  });

  describe('registry helpers', () => {
    it('lists all supported renderer keys', () => {
      expect(SUPPORTED_DASHBOARD_WIDGET_RENDERER_KEYS).toHaveLength(12);
      expect(isSupportedDashboardWidgetRendererKey('consumption')).toBe(true);
      expect(isRenderableDashboardWidgetKey('floors')).toBe(true);
      expect(isWidgetRendererSupportedForVariant('consumption', 'customized')).toBe(true);
      expect(isWidgetRendererSupportedForVariant('consumption', 'unknown')).toBe(false);
    });

    it('excludes out-of-scope keys from map', () => {
      expect(getWidgetRenderMapEntry('consumption_saving')).toBeNull();
      expect(getWidgetRenderMapEntry('shades')).toBeNull();
    });
  });
});

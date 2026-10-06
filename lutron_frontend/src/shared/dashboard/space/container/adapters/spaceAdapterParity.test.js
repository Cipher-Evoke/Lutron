/**
 * @jest-environment node
 */
import { basicSpaceContainerAdapter } from './basicSpaceContainerAdapter';
import { advancedSpaceContainerAdapter } from './advancedSpaceContainerAdapter';
import { customizedSpaceContainerAdapter } from './customizedSpaceContainerAdapter';
import { SPACE_TAB_IDS } from '../spaceLayoutTypes';
import {
  buildBasicSpaceExportOptions,
  buildAdvancedSpaceExportOptions,
  buildCustomizedSpaceExportOptions,
  buildBasicSpaceLayoutOptions,
  buildAdvancedSpaceLayoutOptions,
  buildCustomizedSpaceLayoutOptions,
  buildBasicSpaceWidgetOptions,
  buildAdvancedSpaceWidgetOptions,
  buildCustomizedSpaceWidgetOptions,
  buildBasicSpaceLayoutContexts,
  buildCustomizedSpaceLayoutContexts,
  buildAdvancedSpaceLayoutContexts,
  resolveDualTabSpaceLayoutContext,
  resolveAdvancedSpaceLayoutContext,
  ADVANCED_SPACE_EXPORT_PANEL_CLASS,
} from './spaceAdapterHelpers';
import {
  buildSharedSpaceWidgetOptionsBase,
  resolveSharedSpaceExportOptionsCore,
} from './spaceAdapterResolvers';
import { SPACE_EXPORT_OUTSIDE_CLICK_PROFILES } from '../../export/spaceExportMenuState';

const baseRuntime = {
  showChartsTab: false,
  showOnlyInstantChart: false,
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
  userProfile: { email: 'user@example.com' },
  fetchEmailConfigs: jest.fn(),
  selectedAreas: [1],
  selectedFloorIds: [2],
  exportThunks: {},
  spaceChartsVisibleOrder: ['utilization'],
  spaceMainVisibleOrder: ['utilization'],
  showSpaceChartsStandaloneDurationFilter: false,
  spaceShell: {},
  spaceUtilLight: true,
  colorPalette: [],
  isLargeScreen: true,
  occupancyLineColor: '#87CEEB',
  stackedBarColors: { occupied: '#98FB98', unoccupied: '#FFB3B3' },
  chartPalette: [],
  cardBackground: '#fff',
  cardBorder: '1px solid #ccc',
  cardShadow: 'none',
  metricPanelBorder: '#ccc',
  shouldShowWidget: jest.fn(() => true),
  resolveOccupancyGroupLabel: jest.fn(),
  isUtilizationFullscreen: false,
  isInstantOccupancyFullscreen: false,
  theme: {},
  selectedGroupIds: [9],
  areaGroups: {},
  spaceMergedOrder: ['utilization'],
};

describe('spaceAdapterResolvers', () => {
  it('buildSharedSpaceWidgetOptionsBase preserves variant', () => {
    expect(buildSharedSpaceWidgetOptionsBase(baseRuntime, 'basic').variant).toBe('basic');
    expect(buildSharedSpaceWidgetOptionsBase(baseRuntime, 'advanced').variant).toBe('advanced');
  });

  it('resolveSharedSpaceExportOptionsCore includes group ids when present', () => {
    const withGroups = resolveSharedSpaceExportOptionsCore({
      ...baseRuntime,
      selectedGroupIds: [9],
    });
    expect(withGroups.selection.selectedGroupIds).toEqual([9]);

    const withoutGroups = resolveSharedSpaceExportOptionsCore({
      ...baseRuntime,
      selectedGroupIds: undefined,
    });
    expect(withoutGroups.selection.selectedGroupIds).toBeUndefined();
  });
});

describe('space adapter widget option parity', () => {
  function expectWidgetOptionsParity(adapterResult, helperResult) {
    expect(adapterResult).toMatchObject({
      variant: helperResult.variant,
      showChartsTab: helperResult.showChartsTab,
      widgetList: helperResult.widgetList,
      data: helperResult.data,
      loading: helperResult.loading,
      chart: helperResult.chart,
      shell: helperResult.shell,
    });
    expect(typeof adapterResult.getWidgetTitle).toBe('function');
    expect(typeof helperResult.getWidgetTitle).toBe('function');
  }

  it('basic adapter matches helper output', () => {
    const helper = buildBasicSpaceWidgetOptions(baseRuntime);
    const adapter = basicSpaceContainerAdapter.resolveWidgetOptions(baseRuntime);
    expectWidgetOptionsParity(adapter, helper);
    expect(adapter.shell.utilizationByAreaLayoutMode).toBe('scroll');
  });

  it('advanced adapter matches helper output', () => {
    const helper = buildAdvancedSpaceWidgetOptions(baseRuntime);
    const adapter = advancedSpaceContainerAdapter.resolveWidgetOptions(baseRuntime);
    expectWidgetOptionsParity(adapter, helper);
    expect(adapter.shell.utilizationByAreaLayoutMode).toBe('fill');
  });

  it('customized adapter matches helper output', () => {
    const helper = buildCustomizedSpaceWidgetOptions(baseRuntime);
    const adapter = customizedSpaceContainerAdapter.resolveWidgetOptions(baseRuntime);
    expect(adapter).toMatchObject({
      variant: helper.variant,
      shouldShowWidget: helper.shouldShowWidget,
      shell: helper.shell,
      data: helper.data,
      loading: helper.loading,
      chart: helper.chart,
    });
    expect(adapter.shell.processOptions.selectedGroupIds).toEqual([9]);
  });
});

describe('space adapter layout option parity', () => {
  it('basic layout options expose dual visible orders', () => {
    const result = basicSpaceContainerAdapter.resolveLayoutOptions(baseRuntime);
    expect(result).toEqual(buildBasicSpaceLayoutOptions(baseRuntime));
    expect(result.spaceChartsVisibleOrder).toEqual(['utilization']);
  });

  it('advanced layout options expose charts tab flags only', () => {
    expect(advancedSpaceContainerAdapter.resolveLayoutOptions(baseRuntime)).toEqual(
      buildAdvancedSpaceLayoutOptions(baseRuntime)
    );
  });

  it('customized layout options expose merged order', () => {
    expect(customizedSpaceContainerAdapter.resolveLayoutOptions(baseRuntime)).toEqual(
      buildCustomizedSpaceLayoutOptions(baseRuntime)
    );
    expect(customizedSpaceContainerAdapter.resolveLayoutOptions(baseRuntime).spaceMergedOrder).toEqual([
      'utilization',
    ]);
  });
});

describe('space adapter export option parity', () => {
  it('basic export options use basic preset and outside-click profile', () => {
    const result = basicSpaceContainerAdapter.resolveExportOptions(baseRuntime);
    expect(result).toEqual(buildBasicSpaceExportOptions(baseRuntime));
    expect(result.messagePreset).toBe('basic');
    expect(result.outsideClickProfile).toBe(SPACE_EXPORT_OUTSIDE_CLICK_PROFILES.basic);
  });

  it('advanced export options use chart export outside-click profile', () => {
    const result = advancedSpaceContainerAdapter.resolveExportOptions(baseRuntime);
    expect(result).toEqual(buildAdvancedSpaceExportOptions(baseRuntime));
    expect(result.messagePreset).toBe('advanced');
    expect(result.outsideClickProfile.panelSelectors).toContain(`.${ADVANCED_SPACE_EXPORT_PANEL_CLASS}`);
  });

  it('customized export options use customized outside-click profile', () => {
    const result = customizedSpaceContainerAdapter.resolveExportOptions(baseRuntime);
    expect(result).toEqual(buildCustomizedSpaceExportOptions(baseRuntime));
    expect(result.outsideClickProfile).toBe(SPACE_EXPORT_OUTSIDE_CLICK_PROFILES.customized);
  });
});

describe('space adapter layout context routing', () => {
  const widgetContext = { variant: 'basic', data: {}, loading: {} };
  const layoutOptions = buildBasicSpaceLayoutOptions({ ...baseRuntime, showChartsTab: true });

  it('basic dual-tab routing selects charts or main context', () => {
    const contexts = buildBasicSpaceLayoutContexts({ widgetContext, layoutOptions });
    const orchestration = {
      chartsLayoutContext: contexts.chartsLayoutContext,
      mainLayoutContext: contexts.mainLayoutContext,
    };

    expect(basicSpaceContainerAdapter.resolveLayoutContextForTab(SPACE_TAB_IDS.CHARTS, orchestration)).toBe(
      contexts.chartsLayoutContext
    );
    expect(basicSpaceContainerAdapter.resolveLayoutContextForTab(SPACE_TAB_IDS.UTILIZATION, orchestration)).toBe(
      contexts.mainLayoutContext
    );
    expect(resolveDualTabSpaceLayoutContext(SPACE_TAB_IDS.CHARTS, orchestration)).toBe(contexts.chartsLayoutContext);
  });

  it('advanced routing always returns unified layout context', () => {
    const contexts = buildAdvancedSpaceLayoutContexts({
      widgetContext: { variant: 'advanced' },
      layoutOptions: buildAdvancedSpaceLayoutOptions(baseRuntime),
    });
    const orchestration = { layoutContext: contexts.layoutContext };

    expect(advancedSpaceContainerAdapter.resolveLayoutContextForTab(SPACE_TAB_IDS.CHARTS, orchestration)).toBe(
      contexts.layoutContext
    );
    expect(resolveAdvancedSpaceLayoutContext(SPACE_TAB_IDS.UTILIZATION, orchestration)).toBe(contexts.layoutContext);
  });

  it('customized dual-tab routing matches basic pattern', () => {
    const contexts = buildCustomizedSpaceLayoutContexts({
      widgetContext: { variant: 'customized' },
      layoutOptions: buildCustomizedSpaceLayoutOptions(baseRuntime),
    });
    const orchestration = {
      chartsLayoutContext: contexts.chartsLayoutContext,
      mainLayoutContext: contexts.mainLayoutContext,
    };

    expect(customizedSpaceContainerAdapter.resolveLayoutContextForTab(SPACE_TAB_IDS.CHARTS, orchestration)).toBe(
      contexts.chartsLayoutContext
    );
  });
});

describe('space adapter loading and visibility parity', () => {
  it('basic/customized/advanced disable shared anyLoading so widgets load independently', () => {
    const loading = { anyLoading: true, instantOccupancyCountLoading: true };
    const widgetOptions = { loading };
    expect(basicSpaceContainerAdapter.buildLoadingState(widgetOptions)).toEqual({
      ...loading,
      anyLoading: false,
    });
    expect(customizedSpaceContainerAdapter.buildLoadingState(widgetOptions)).toEqual({
      ...loading,
      anyLoading: false,
    });
    expect(advancedSpaceContainerAdapter.buildLoadingState(widgetOptions)).toEqual({
      ...loading,
      anyLoading: false,
    });
  });

  it('basic visibility exposes slot orders', () => {
    const layoutOptions = buildBasicSpaceLayoutOptions(baseRuntime);
    const visibility = basicSpaceContainerAdapter.buildVisibility({ layoutOptions });
    expect(visibility.spaceChartsVisibleOrder).toEqual(['utilization']);
    expect(visibility.showSpaceChartsStandaloneDurationFilter).toBe(false);
  });
});

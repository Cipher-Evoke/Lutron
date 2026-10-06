/**
 * @jest-environment node
 */
import { basicDashboardContainerAdapter } from './basicDashboardContainerAdapter';
import { advancedDashboardContainerAdapter } from './advancedDashboardContainerAdapter';
import { customizedDashboardContainerAdapter } from './customizedDashboardContainerAdapter';
import {
  buildBasicDashboardExportOptions,
  buildAdvancedDashboardExportOptions,
  buildCustomizedDashboardExportOptions,
  buildBasicDashboardVisibilityOptions,
  buildAdvancedDashboardVisibilityOptions,
  buildCustomizedDashboardVisibilityOptions,
  BASIC_TOTAL_CONSUMPTION_BY_GROUP_EXPORT_KEY,
} from './dashboardAdapterHelpers';
import {
  resolveDashboardDatesOptions,
  resolveDashboardExportsOptionsCore,
  resolveDashboardWidgetsOptions,
} from './dashboardAdapterResolvers';
import { EXPORT_MENU_OUTSIDE_CLICK_PROFILES } from '../helpers/exportMenuUtils';
import {
  DEFAULT_CONSUMPTION_EXPORT_KEYS,
  DEFAULT_SAVINGS_EXPORT_KEYS,
} from '../hooks/exportMenuState';

const baseCtx = {
  widgetList: [],
  energyConsumption: {},
  energySavings: {},
  energyConsumptionLoading: false,
  energySavingsLoading: false,
  savingsByStrategy: {},
  globalLoading: false,
  selectedDuration: 'today',
  customStartDate: '',
  customEndDate: '',
  backgroundColor: '#fff',
  getThemeAwareConsumptionLineColors: jest.fn(),
  getThemeAwareSavingsLineColors: jest.fn(),
  dispatch: jest.fn(),
  dateActions: {},
  customDateRange: {},
  isNavigating: false,
  currentDate: '2026-01-01',
  currentYear: 2026,
  widgets: { setChartLoading: jest.fn() },
  setIsDataLoading: jest.fn(),
  setSelectedMonthForData: jest.fn(),
  showSnackbar: jest.fn(),
  userProfile: { email: 'user@example.com' },
  fetchEmailConfigs: jest.fn(),
  selectedAreas: [1],
  selectedFloorIds: [2],
  dates: { calculateDateParameters: jest.fn() },
  exportThunks: { sendEnergyConsumptionEmail: 'email' },
};

describe('dashboardAdapterResolvers', () => {
  it('resolveDashboardWidgetsOptions preserves variant', () => {
    expect(resolveDashboardWidgetsOptions(baseCtx, 'basic').variant).toBe('basic');
    expect(resolveDashboardWidgetsOptions(baseCtx, 'advanced').variant).toBe('advanced');
    expect(resolveDashboardWidgetsOptions(baseCtx, 'customized').variant).toBe('customized');
  });

  it('resolveDashboardDatesOptions wires chart loading setter', () => {
    expect(resolveDashboardDatesOptions(baseCtx).setChartLoading).toBe(baseCtx.widgets.setChartLoading);
  });

  it('resolveDashboardExportsOptionsCore merges overrides', () => {
    const result = resolveDashboardExportsOptionsCore(baseCtx, {
      outsideClickProfile: { panelSelectors: ['.x'] },
      enableCustomGraphExport: true,
    });
    expect(result.enableCustomGraphExport).toBe(true);
    expect(result.selection.selectedAreas).toEqual([1]);
  });
});

describe('dashboard adapter widget options parity', () => {
  it('basic adapter matches shared widget resolver', () => {
    const ctx = { ...baseCtx };
    expect(basicDashboardContainerAdapter.resolveWidgetsOptions(ctx)).toEqual(
      resolveDashboardWidgetsOptions(ctx, 'basic')
    );
  });

  it('advanced adapter matches shared widget resolver', () => {
    const ctx = { ...baseCtx };
    expect(advancedDashboardContainerAdapter.resolveWidgetsOptions(ctx)).toEqual(
      resolveDashboardWidgetsOptions(ctx, 'advanced')
    );
  });

  it('customized adapter matches shared widget resolver', () => {
    const ctx = { ...baseCtx };
    expect(customizedDashboardContainerAdapter.resolveWidgetsOptions(ctx)).toEqual(
      resolveDashboardWidgetsOptions(ctx, 'customized')
    );
  });
});

describe('dashboard adapter date options parity', () => {
  const adapters = [
    ['basic', basicDashboardContainerAdapter],
    ['advanced', advancedDashboardContainerAdapter],
    ['customized', customizedDashboardContainerAdapter],
  ];

  it.each(adapters)('%s adapter matches shared date resolver', (_label, adapter) => {
    const ctx = { ...baseCtx };
    expect(adapter.resolveDatesOptions(ctx)).toEqual(resolveDashboardDatesOptions(ctx));
  });
});

describe('dashboard adapter export options parity', () => {
  it('basic adapter uses space-aligned outside-click profile and group export key', () => {
    const result = basicDashboardContainerAdapter.resolveExportsOptions({ ...baseCtx });
    expect(result.outsideClickProfile).toEqual({
      buttonSelector: 'button[data-export-menu]',
      panelSelector: '[data-export-dropdown-panel]',
    });
    expect(result.keys.consumption).toEqual(DEFAULT_CONSUMPTION_EXPORT_KEYS);
    expect(result.keys.totalConsumptionByGroup.loadingPrefix).toBe(
      BASIC_TOTAL_CONSUMPTION_BY_GROUP_EXPORT_KEY
    );
    expect(result.enableCustomGraphExport).toBeUndefined();
  });

  it('advanced adapter uses advanced outside-click profile by default', () => {
    const result = advancedDashboardContainerAdapter.resolveExportsOptions({ ...baseCtx });
    expect(result.outsideClickProfile).toBe(EXPORT_MENU_OUTSIDE_CLICK_PROFILES.advanced);
    expect(result.keys.totalConsumptionByGroup.loadingPrefix).toBe('Consumption by Group');
  });

  it('advanced adapter respects runtime outsideClickProfile override', () => {
    const customProfile = { panelSelectors: ['.custom'] };
    const result = advancedDashboardContainerAdapter.resolveExportsOptions({
      ...baseCtx,
      outsideClickProfile: customProfile,
    });
    expect(result.outsideClickProfile).toBe(customProfile);
  });

  it('customized adapter enables custom graph export', () => {
    const result = customizedDashboardContainerAdapter.resolveExportsOptions({ ...baseCtx });
    expect(result.outsideClickProfile).toBe(EXPORT_MENU_OUTSIDE_CLICK_PROFILES.basic);
    expect(result.enableCustomGraphExport).toBe(true);
  });

  it('export option builders match adapter outputs', () => {
    const ctx = { ...baseCtx };
    expect(buildBasicDashboardExportOptions(ctx)).toEqual(
      basicDashboardContainerAdapter.resolveExportsOptions(ctx)
    );
    expect(buildAdvancedDashboardExportOptions(ctx)).toEqual(
      advancedDashboardContainerAdapter.resolveExportsOptions(ctx)
    );
    expect(buildCustomizedDashboardExportOptions(ctx)).toEqual(
      customizedDashboardContainerAdapter.resolveExportsOptions(ctx)
    );
  });
});

describe('dashboard adapter visibility parity', () => {
  it('basic visibility options include drag translate keys', () => {
    const runtime = {
      visibilityMap: {},
      isWidgetVisible: jest.fn(),
      energyReflowLocked: false,
      dispatch: jest.fn(),
      saveDashboardChartOrder: jest.fn(),
      dashboardChartOrder: [],
      dashboardChartOrderStatus: 'idle',
      widgetList: [],
      energyDragTranslateKeys: { consumption: 'Consumption' },
    };
    const result = basicDashboardContainerAdapter.resolveVisibilityOptions(runtime);
    expect(result).toEqual(buildBasicDashboardVisibilityOptions(runtime));
    expect(result.dragTranslateKeys).toEqual({ consumption: 'Consumption' });
  });

  it('advanced visibility options expose showOverviewTab', () => {
    const runtime = { showOverviewTab: true };
    expect(advancedDashboardContainerAdapter.resolveVisibilityOptions(runtime)).toEqual(
      buildAdvancedDashboardVisibilityOptions(runtime)
    );
  });

  it('customized visibility options expose custom graph fetchers', () => {
    const runtime = {
      locationPathname: '/dashboard/energy',
      getEffectiveBuiltinDashboardPage: jest.fn(),
      dispatch: jest.fn(),
      fetchRenameWidgets: jest.fn(),
      fetchCustomGraphs: jest.fn(),
    };
    expect(customizedDashboardContainerAdapter.resolveVisibilityOptions(runtime)).toEqual(
      buildCustomizedDashboardVisibilityOptions(runtime)
    );
  });
});

describe('dashboard adapter section keys parity', () => {
  const orchestration = {
    visibility: {
      showEnergyStandaloneDurationFilter: false,
      energyVisibleSlotOrder: ['consumption'],
      energyDashboardRows: [['consumption']],
    },
    widgets: {
      getWidgetTitle: (_key, fallback) => fallback,
    },
    dates: {},
    exports: {},
  };

  const sharedRuntime = {
    DashboardOverview: 'Overview',
    SpaceUtilization: 'Space',
    Alerts: 'Alerts',
    overviewData: {},
    overviewLoading: false,
    overviewError: null,
    handleTabChange: jest.fn(),
    navigate: jest.fn(),
    instantOccupancyCount: {},
    instantOccupancyCountLoading: false,
    globalLoading: false,
    filterKey: 'k',
    selectedAlertTypes: [],
    focusAlertFromLocation: null,
    energyLayoutRuntime: {},
    theme: {},
  };

  it('basic and advanced adapters expose the same section keys', () => {
    const basic = basicDashboardContainerAdapter.buildSections({
      orchestration,
      runtime: sharedRuntime,
    });
    const advanced = advancedDashboardContainerAdapter.buildSections({
      orchestration,
      runtime: sharedRuntime,
    });
    expect(Object.keys(basic).sort()).toEqual(['alerts', 'charts', 'energy', 'overview']);
    expect(Object.keys(advanced).sort()).toEqual(['alerts', 'charts', 'energy', 'overview']);
  });

  it('customized adapter exposes section keys and delegates energy rendering', () => {
    const renderEnergySection = jest.fn(() => 'custom-energy');
    const sections = customizedDashboardContainerAdapter.buildSections({
      orchestration,
      runtime: {
        ...sharedRuntime,
        handleNavigateToEnergy: jest.fn(),
        handleNavigateToSpace: jest.fn(),
        apiParams: { areaIds: [1] },
        renderEnergySection,
      },
    });
    expect(Object.keys(sections).sort()).toEqual(['alerts', 'charts', 'energy', 'overview']);
    expect(renderEnergySection).toHaveBeenCalledWith(orchestration);
    expect(sections.energy).toBe('custom-energy');
  });
});

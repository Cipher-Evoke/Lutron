/**
 * @jest-environment node
 */
import {
  resolveDashboardDatesOptions,
  resolveDashboardExportsOptionsCore,
  resolveDashboardWidgetsOptions,
} from './adapters/dashboardAdapterResolvers';

describe('dashboardAdapterResolvers', () => {
  const ctx = {
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
    selectedAreas: [],
    selectedFloorIds: [],
    dates: { calculateDateParameters: jest.fn() },
    exportThunks: {},
  };

  it('resolveDashboardWidgetsOptions preserves variant', () => {
    expect(resolveDashboardWidgetsOptions(ctx, 'advanced').variant).toBe('advanced');
  });

  it('resolveDashboardDatesOptions wires chart loading setter', () => {
    expect(resolveDashboardDatesOptions(ctx).setChartLoading).toBe(ctx.widgets.setChartLoading);
  });

  it('resolveDashboardExportsOptionsCore merges overrides', () => {
    const result = resolveDashboardExportsOptionsCore(ctx, {
      outsideClickProfile: { panelSelectors: ['.x'] },
      enableCustomGraphExport: true,
    });
    expect(result.enableCustomGraphExport).toBe(true);
    expect(result.outsideClickProfile).toEqual({ panelSelectors: ['.x'] });
  });
});

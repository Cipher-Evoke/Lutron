/**
 * @jest-environment node
 */
import {
  formatDateForState,
  parseDateFromState,
  calculateDashboardDateParameters,
  calculateDashboardCurrentDateParameters,
} from './dashboardDateState';

describe('dashboardDateState', () => {
  it('formatDateForState returns YYYY-MM-DD', () => {
    expect(formatDateForState(new Date(2024, 5, 9))).toBe('2024-06-09');
  });

  it('parseDateFromState parses ISO date string', () => {
    const d = parseDateFromState('2024-06-09');
    expect(d.getFullYear()).toBe(2024);
    expect(d.getMonth()).toBe(5);
    expect(d.getDate()).toBe(9);
  });

  it('calculateDashboardDateParameters uses custom range when set', () => {
    const result = calculateDashboardDateParameters({
      selectedDuration: 'this-day',
      customDateRange: { startDate: '2024-01-01', endDate: '2024-01-31' },
      isNavigating: false,
      currentDate: '2024-06-01',
      currentYear: 2024,
    });
    expect(result).toEqual({
      timeRange: 'custom',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    });
  });

  it('calculateDashboardDateParameters this-week non-navigating keeps duration key', () => {
    const stable = new Date(2024, 5, 12);
    const result = calculateDashboardDateParameters({
      selectedDuration: 'this-week',
      customDateRange: { startDate: '', endDate: '' },
      isNavigating: false,
      currentDate: '2024-06-12',
      currentYear: 2024,
      stableDate: stable,
    });
    expect(result.timeRange).toBe('this-week');
    expect(result.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('calculateDashboardCurrentDateParameters uses selectedDuration as timeRange', () => {
    const result = calculateDashboardCurrentDateParameters({
      selectedDuration: 'this-month',
      customDateRange: { startDate: '', endDate: '' },
      isNavigating: false,
      currentDate: '2024-03-15',
    });
    expect(result.timeRange).toBe('this-month');
    expect(result.startDate).toBe('2024-03-01');
    expect(result.endDate).toBe('2024-03-31');
  });
});

/**
 * @jest-environment node
 */
import { formatDateForState } from '../../utils/dashboardDateState';
import {
  resolvePreviousPeriodNavigation,
  resolveNextPeriodNavigation,
  resolveEnergyCustomNeedsDates,
  applyDashboardPeriodNavigationResolution,
  DASHBOARD_NAVIGATION_CHART_LOADING,
} from '../helpers/dashboardDateNavigation';
import { getDashboardPeriodText } from '../helpers/dashboardPeriodText';

const fixedToday = new Date('2025-06-10T12:00:00');

const selection = {
  selectedDuration: 'this-week',
  currentDate: '2025-06-03',
  currentYear: 2025,
  customDateRange: {
    startDate: '2025-06-01',
    endDate: '2025-06-07',
  },
  customStartDate: '2025-06-01',
  customEndDate: '2025-06-07',
};

function legacyEnergyCustomNeedsDates(duration, start, end) {
  return duration === 'custom' && (!start || !end);
}

function createDispatchSpy() {
  const calls = [];
  const dispatch = (action) => {
    calls.push(action);
    return action;
  };
  return { dispatch, calls };
}

describe('useDashboardDates building blocks parity', () => {
  describe('previous navigation', () => {
    it('this-day previous shifts current date back one day', () => {
      const result = resolvePreviousPeriodNavigation({
        selectedDuration: 'this-day',
        currentDate: '2025-06-10',
        currentYear: 2025,
        customDateRange: {},
      });

      expect(result).toEqual({
        customDateRange: { startDate: '2025-06-09', endDate: '2025-06-09' },
        currentDate: '2025-06-09',
      });
    });

    it('this-month previous includes selectedMonthForData', () => {
      const result = resolvePreviousPeriodNavigation({
        selectedDuration: 'this-month',
        currentDate: '2025-06-10',
        currentYear: 2025,
        customDateRange: {},
      });

      expect(result.selectedMonthForData).toEqual({ year: 2025, month: 4 });
      expect(result.customDateRange.startDate).toBe('2025-05-01');
    });
  });

  describe('next navigation', () => {
    it('blocks future this-day navigation', () => {
      const result = resolveNextPeriodNavigation({
        selectedDuration: 'this-day',
        currentDate: '2025-06-10',
        currentYear: 2025,
        customDateRange: {},
        today: fixedToday,
      });

      expect(result).toEqual({ shouldSetLoading: false, applied: false });
    });

    it('this-week next applies T-suffixed range when allowed', () => {
      const result = resolveNextPeriodNavigation({
        selectedDuration: 'this-week',
        currentDate: '2025-05-27',
        currentYear: 2025,
        customDateRange: {},
        today: fixedToday,
      });

      expect(result.applied).toBe(true);
      expect(result.customDateRange.startDate).toContain('T00:00:00');
      expect(result.customDateRange.endDate).toContain('T23:59:59');
    });
  });

  describe('custom date mode', () => {
    it('resolveEnergyCustomNeedsDates matches legacy guard', () => {
      expect(
        resolveEnergyCustomNeedsDates({
          selectedDuration: 'custom',
          customStartDate: '',
          customEndDate: '2025-06-07',
        })
      ).toBe(legacyEnergyCustomNeedsDates('custom', '', '2025-06-07'));

      expect(
        resolveEnergyCustomNeedsDates({
          selectedDuration: 'custom',
          customStartDate: '2025-06-01',
          customEndDate: '2025-06-07',
        })
      ).toBe(false);
    });

    it('custom next sets loading even when future-blocked', () => {
      const result = resolveNextPeriodNavigation({
        selectedDuration: 'custom',
        currentDate: '2025-06-08',
        currentYear: 2025,
        customDateRange: {
          startDate: '2025-06-08',
          endDate: '2025-06-10',
        },
        today: fixedToday,
      });

      expect(result.shouldSetLoading).toBe(true);
      expect(result.applied).toBe(false);
    });

    it('custom previous shifts by inclusive day span', () => {
      const result = resolvePreviousPeriodNavigation({
        selectedDuration: 'custom',
        currentDate: '2025-06-03',
        currentYear: 2025,
        customDateRange: {
          startDate: '2025-06-03',
          endDate: '2025-06-05',
        },
      });

      expect(result.customDateRange).toEqual({
        startDate: '2025-05-31',
        endDate: '2025-06-02',
      });
      expect(result.currentDate).toBe(formatDateForState(new Date('2025-05-31')));
    });
  });

  describe('period text generation', () => {
    it('getDashboardPeriodText matches this-week label', () => {
      const text = getDashboardPeriodText({
        selectedDuration: 'this-week',
        currentDate: '2025-06-11',
        currentYear: 2025,
      });

      expect(text).toMatch(/Jun/);
      expect(text).toMatch(/2025/);
    });

    it('getDashboardPeriodText formats custom same-month range', () => {
      const text = getDashboardPeriodText({
        selectedDuration: 'custom',
        currentDate: '2025-04-01',
        currentYear: 2025,
        customStartDate: '2025-04-01',
        customEndDate: '2025-04-07',
      });

      expect(text).toMatch(/Apr/);
      expect(text).toMatch(/2025/);
    });
  });

  describe('date synchronization', () => {
    it('applyDashboardPeriodNavigationResolution dispatches legacy Redux sequence', () => {
      const { dispatch, calls } = createDispatchSpy();
      const setCustomDateRange = (payload) => ({ type: 'setCustomDateRange', payload });
      const setCurrentDate = (payload) => ({ type: 'setCurrentDate', payload });
      const setCurrentYear = (payload) => ({ type: 'setCurrentYear', payload });
      const setIsNavigating = (payload) => ({ type: 'setIsNavigating', payload });
      const setSelectedMonthForData = jest.fn();

      const resolution = resolvePreviousPeriodNavigation({
        selectedDuration: 'this-month',
        currentDate: '2025-06-10',
        currentYear: 2025,
        customDateRange: {},
      });

      applyDashboardPeriodNavigationResolution({
        resolution,
        dispatch,
        setCustomDateRange,
        setCurrentDate,
        setCurrentYear,
        setIsNavigating,
        setSelectedMonthForData,
      });

      expect(calls.map((c) => c.type)).toEqual([
        'setCustomDateRange',
        'setCurrentDate',
        'setIsNavigating',
      ]);
      expect(setSelectedMonthForData).toHaveBeenCalledWith({ year: 2025, month: 4 });
    });

    it('DASHBOARD_NAVIGATION_CHART_LOADING covers energy navigation charts', () => {
      expect(DASHBOARD_NAVIGATION_CHART_LOADING.energyConsumption).toBe(true);
      expect(DASHBOARD_NAVIGATION_CHART_LOADING.savingsByStrategy).toBe(true);
      expect(DASHBOARD_NAVIGATION_CHART_LOADING.instantOccupancyCount).toBeUndefined();
    });
  });
});

/**
 * @jest-environment node
 */
import { parseDateFromState, formatDateForState } from '../../utils/dashboardDateState';
import {
  getDashboardPeriodText,
  resolvePreviousPeriodNavigation,
  resolveNextPeriodNavigation,
  DASHBOARD_NAVIGATION_CHART_LOADING,
  toggleAlertTypeSelection,
  normalizeAlertTypes,
  bumpAlertFilterKey,
  closeAllExportMenus,
  toggleExportMenuState,
  setExportMenuOpen,
  shouldCloseExportMenusOnOutsideClick,
  createAdvancedExportOutsideClickProfile,
  EXPORT_MENU_OUTSIDE_CLICK_PROFILES,
  stabilizeDashboardPayload,
  buildStandardTransformChartOptions,
  createStandardTransformDataForCharts,
  buildCustomizedTransformChartOptions,
  createCustomizedTransformDataForCharts,
} from './index';

function legacyGetCurrentPeriodText({
  selectedDuration,
  currentDate,
  currentYear,
  customStartDate = '',
  customEndDate = '',
}) {
  const currentDateObj = parseDateFromState(currentDate);

  if (selectedDuration === 'this-day') {
    return currentDateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  if (selectedDuration === 'this-week') {
    const startOfWeek = new Date(currentDateObj);
    startOfWeek.setDate(currentDateObj.getDate() - currentDateObj.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
      return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}-${endOfWeek.getDate()}, ${startOfWeek.getFullYear()}`;
    }

    return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${startOfWeek.getFullYear()}`;
  }

  if (selectedDuration === 'this-month') {
    return currentDateObj.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }

  if (selectedDuration === 'this-year') {
    return String(currentYear);
  }

  if (selectedDuration === 'custom' && customStartDate && customEndDate) {
    const startDate = new Date(customStartDate);
    const endDate = new Date(customEndDate);

    if (startDate.toDateString() === endDate.toDateString()) {
      return startDate.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }

    if (
      startDate.getMonth() === endDate.getMonth() &&
      startDate.getFullYear() === endDate.getFullYear()
    ) {
      return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}-${endDate.getDate()}, ${startDate.getFullYear()}`;
    }

    if (startDate.getFullYear() === endDate.getFullYear()) {
      return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${startDate.getFullYear()}`;
    }

    return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }

  return '';
}

function legacyToggleAlertTypes(selectedTypes, type) {
  return selectedTypes.includes(type)
    ? selectedTypes.filter((entry) => entry !== type)
    : [...selectedTypes, type];
}

function legacyStabilizePayload(payload, previousRef) {
  const currentStr = JSON.stringify(payload);
  const prevStr = JSON.stringify(previousRef.current);
  if (currentStr === prevStr && previousRef.current !== null) {
    return previousRef.current;
  }
  previousRef.current = payload;
  return payload;
}

function createClosestEvent(matches = []) {
  return {
    target: {
      closest(selector) {
        return matches.includes(selector) ? { selector } : null;
      },
    },
  };
}

describe('dashboard container helpers parity', () => {
  const fixedToday = new Date('2025-06-10T12:00:00');

  describe('getDashboardPeriodText', () => {
    const fixtures = [
      {
        name: 'this-day',
        input: {
          selectedDuration: 'this-day',
          currentDate: '2025-06-10',
          currentYear: 2025,
        },
      },
      {
        name: 'this-week same month',
        input: {
          selectedDuration: 'this-week',
          currentDate: '2025-06-11',
          currentYear: 2025,
        },
      },
      {
        name: 'this-week cross month',
        input: {
          selectedDuration: 'this-week',
          currentDate: '2025-06-01',
          currentYear: 2025,
        },
      },
      {
        name: 'this-month',
        input: {
          selectedDuration: 'this-month',
          currentDate: '2025-03-15',
          currentYear: 2025,
        },
      },
      {
        name: 'this-year',
        input: {
          selectedDuration: 'this-year',
          currentDate: '2025-01-01',
          currentYear: 2024,
        },
      },
      {
        name: 'custom single day',
        input: {
          selectedDuration: 'custom',
          currentDate: '2025-04-01',
          currentYear: 2025,
          customStartDate: '2025-04-01',
          customEndDate: '2025-04-01',
        },
      },
      {
        name: 'custom same month range',
        input: {
          selectedDuration: 'custom',
          currentDate: '2025-04-01',
          currentYear: 2025,
          customStartDate: '2025-04-01',
          customEndDate: '2025-04-07',
        },
      },
      {
        name: 'custom cross year',
        input: {
          selectedDuration: 'custom',
          currentDate: '2024-12-30',
          currentYear: 2024,
          customStartDate: '2024-12-30',
          customEndDate: '2025-01-05',
        },
      },
    ];

    it.each(fixtures)('$name matches legacy getCurrentPeriodText', ({ input }) => {
      expect(getDashboardPeriodText(input)).toBe(legacyGetCurrentPeriodText(input));
    });
  });

  describe('resolvePreviousPeriodNavigation', () => {
    it('this-day previous matches legacy plain YMD range', () => {
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

    it('this-month previous sets selectedMonthForData', () => {
      const result = resolvePreviousPeriodNavigation({
        selectedDuration: 'this-month',
        currentDate: '2025-06-10',
        currentYear: 2025,
        customDateRange: {},
      });

      expect(result.customDateRange).toEqual({
        startDate: '2025-05-01',
        endDate: '2025-05-31',
      });
      expect(result.currentDate).toBe('2025-05-10');
      expect(result.selectedMonthForData).toEqual({ year: 2025, month: 4 });
    });

    it('custom previous shifts by inclusive day diff', () => {
      const result = resolvePreviousPeriodNavigation({
        selectedDuration: 'custom',
        currentDate: '2025-06-10',
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

  describe('resolveNextPeriodNavigation', () => {
    it('this-day next uses plain YMD when not future', () => {
      const result = resolveNextPeriodNavigation({
        selectedDuration: 'this-day',
        currentDate: '2025-06-09',
        currentYear: 2025,
        customDateRange: {},
        today: fixedToday,
      });

      expect(result).toEqual({
        shouldSetLoading: true,
        applied: true,
        customDateRange: { startDate: '2025-06-10', endDate: '2025-06-10' },
        currentDate: '2025-06-10',
      });
    });

    it('this-day next blocks future navigation', () => {
      const result = resolveNextPeriodNavigation({
        selectedDuration: 'this-day',
        currentDate: '2025-06-10',
        currentYear: 2025,
        customDateRange: {},
        today: fixedToday,
      });

      expect(result).toEqual({ shouldSetLoading: false, applied: false });
    });

    it('this-week next uses T00/T23 suffixes', () => {
      const result = resolveNextPeriodNavigation({
        selectedDuration: 'this-week',
        currentDate: '2025-06-03',
        currentYear: 2025,
        customDateRange: {},
        today: fixedToday,
      });

      expect(result.applied).toBe(true);
      expect(result.customDateRange.startDate).toMatch(/T00:00:00$/);
      expect(result.customDateRange.endDate).toMatch(/T23:59:59$/);
    });

    it('custom next sets loading even when blocked by future guard', () => {
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

    it('custom next uses ISO strings when applied', () => {
      const result = resolveNextPeriodNavigation({
        selectedDuration: 'custom',
        currentDate: '2025-06-01',
        currentYear: 2025,
        customDateRange: {
          startDate: '2025-06-01',
          endDate: '2025-06-03',
        },
        today: fixedToday,
      });

      expect(result.applied).toBe(true);
      expect(result.customDateRange.startDate).toContain('T');
      expect(result.customDateRange.endDate).toContain('T');
    });
  });

  describe('alert type filters', () => {
    it('toggleAlertTypeSelection matches legacy toggle', () => {
      expect(toggleAlertTypeSelection(['A', 'B'], 'B')).toEqual(
        legacyToggleAlertTypes(['A', 'B'], 'B')
      );
      expect(toggleAlertTypeSelection(['A'], 'B')).toEqual(
        legacyToggleAlertTypes(['A'], 'B')
      );
    });

    it('normalizeAlertTypes trims and drops empty values', () => {
      expect(normalizeAlertTypes([' A ', '', null, 'B'])).toEqual(['A', 'B']);
    });

    it('bumpAlertFilterKey increments legacy filter key', () => {
      expect(bumpAlertFilterKey(3)).toBe(4);
    });
  });

  describe('export menu utils', () => {
    it('close/toggle/set helpers match legacy object semantics', () => {
      expect(closeAllExportMenus()).toEqual({});
      expect(toggleExportMenuState({ a: true }, 'b')).toEqual({ a: true, b: true });
      expect(setExportMenuOpen({ a: true }, 'a', false)).toEqual({ a: false });
    });

    it('basic profile outside click closes when not on button/panel', () => {
      const event = createClosestEvent();
      expect(
        shouldCloseExportMenusOnOutsideClick(event, EXPORT_MENU_OUTSIDE_CLICK_PROFILES.basic)
      ).toBe(true);
    });

    it('basic profile keeps open when export button clicked', () => {
      const event = createClosestEvent(['button[data-export-menu="true"]']);
      expect(
        shouldCloseExportMenusOnOutsideClick(event, EXPORT_MENU_OUTSIDE_CLICK_PROFILES.basic)
      ).toBe(false);
    });

    it('advanced profile uses chart export class selector', () => {
      const profile = createAdvancedExportOutsideClickProfile('chart-export-dropdown');
      const inside = createClosestEvent(['.chart-export-dropdown']);
      expect(shouldCloseExportMenusOnOutsideClick(inside, profile)).toBe(false);
    });

    it('customized legacy profile keeps export button and panel clicks open', () => {
      const profile = EXPORT_MENU_OUTSIDE_CLICK_PROFILES.customizedLegacy;
      const exportButton = createClosestEvent(['button[data-export-menu="true"]']);
      const exportPanel = createClosestEvent(['[data-export-dropdown-panel]']);

      expect(shouldCloseExportMenusOnOutsideClick(exportButton, profile)).toBe(false);
      expect(shouldCloseExportMenusOnOutsideClick(exportPanel, profile)).toBe(false);
    });
  });

  describe('widget memo stabilizers', () => {
    it('stabilizeDashboardPayload preserves reference for deep-equal payloads', () => {
      const ref = { current: null };
      const first = { unit: 'kWh', values: [1, 2] };
      const second = { unit: 'kWh', values: [1, 2] };

      const resolvedFirst = stabilizeDashboardPayload(first, ref);
      const resolvedSecond = stabilizeDashboardPayload(second, ref);

      expect(resolvedFirst).toBe(first);
      expect(resolvedSecond).toBe(first);
      expect(legacyStabilizePayload(second, ref)).toBe(first);
    });

    it('transform builders preserve legacy option shapes', () => {
      const standard = buildStandardTransformChartOptions({
        selectedDuration: 'this-week',
        selectedAreas: [1],
        areaTree: { tree: [] },
      });

      const customized = buildCustomizedTransformChartOptions({
        selectedDuration: 'this-week',
        selectedAreas: [1],
        selectedFloorIds: [9],
        selectedGroupIds: [2],
        areaTree: { tree: [] },
        areaGroups: [],
        floors: [],
        forceIndividualAreas: true,
        widgetFloorIds: [9],
        widgetAreaIds: [1],
        widgetGroupIds: [2],
      });

      const sharedTransform = jest.fn(() => []);
      const standardTransform = createStandardTransformDataForCharts(sharedTransform, standard);
      const customizedTransform = createCustomizedTransformDataForCharts(sharedTransform, customized);

      standardTransform({ ok: true }, 'consumption');
      customizedTransform({ ok: true }, 'consumption', true, [9], [1], [2]);

      expect(sharedTransform).toHaveBeenNthCalledWith(1, { ok: true }, 'consumption', standard);
      expect(sharedTransform).toHaveBeenNthCalledWith(2, { ok: true }, 'consumption', {
        ...customized,
        forceIndividualAreas: true,
        widgetFloorIds: [9],
        widgetAreaIds: [1],
        widgetGroupIds: [2],
      });
    });
  });

  it('DASHBOARD_NAVIGATION_CHART_LOADING includes expected chart keys', () => {
    expect(DASHBOARD_NAVIGATION_CHART_LOADING).toMatchObject({
      energyConsumption: true,
      energySavings: true,
      savingsByStrategy: true,
    });
    expect(DASHBOARD_NAVIGATION_CHART_LOADING.instantOccupancyCount).toBeUndefined();
  });
});

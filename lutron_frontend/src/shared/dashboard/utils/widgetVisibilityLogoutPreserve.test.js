/**
 * @jest-environment jsdom
 */
import {
  snapshotAllVariantWidgetVisibilityForLogout,
  restoreAllVariantWidgetVisibilityAfterStorageClear,
} from './widgetVisibilityLogoutPreserve';
import { getDashboardWidgetVisibilityStorageKey } from './dashboardWidgetVisibilityCore';
import { CUSTOMIZED_WIDGET_VISIBILITY_STORAGE_KEY } from '../../../variants/customized/utils/customizedOverviewWidgetVisibility';

describe('widgetVisibilityLogoutPreserve', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('snapshots and restores Basic, Advanced, and Customized keys after clear', () => {
    const basicKey = getDashboardWidgetVisibilityStorageKey('basic');
    const advancedKey = getDashboardWidgetVisibilityStorageKey('advanced');
    const basicRaw = JSON.stringify({ consumption: false, consumption_saving: false });
    const advancedRaw = JSON.stringify({
      consumption_saving: false,
      consumption: true,
      savings_by_strategy: true,
    });
    const customizedRaw = JSON.stringify({
      energy: {
        consumption_saving: false,
        consumption: true,
        savings_by_strategy: true,
      },
      space: {
        instant_utilization_combined: false,
        instant_occupancy_count: true,
        utilization_by_area: true,
      },
    });

    localStorage.setItem(basicKey, basicRaw);
    localStorage.setItem(advancedKey, advancedRaw);
    localStorage.setItem(CUSTOMIZED_WIDGET_VISIBILITY_STORAGE_KEY, customizedRaw);

    const snapshot = snapshotAllVariantWidgetVisibilityForLogout();
    expect(snapshot.basic).toBe(basicRaw);
    expect(snapshot.advanced).toBe(advancedRaw);
    expect(snapshot.customized).toBe(customizedRaw);

    localStorage.clear();
    expect(localStorage.getItem(basicKey)).toBeNull();
    expect(localStorage.getItem(advancedKey)).toBeNull();
    expect(localStorage.getItem(CUSTOMIZED_WIDGET_VISIBILITY_STORAGE_KEY)).toBeNull();

    restoreAllVariantWidgetVisibilityAfterStorageClear(snapshot);

    expect(localStorage.getItem(basicKey)).toBe(basicRaw);
    expect(localStorage.getItem(advancedKey)).toBe(advancedRaw);
    expect(localStorage.getItem(CUSTOMIZED_WIDGET_VISIBILITY_STORAGE_KEY)).toBe(customizedRaw);
  });

  it('restore is a no-op when a key was never set (null snapshot field)', () => {
    const advancedKey = getDashboardWidgetVisibilityStorageKey('advanced');
    const snapshot = {
      basic: null,
      advanced: JSON.stringify({ consumption_saving: false, consumption: true }),
      customized: null,
    };

    restoreAllVariantWidgetVisibilityAfterStorageClear(snapshot);

    expect(localStorage.getItem(getDashboardWidgetVisibilityStorageKey('basic'))).toBeNull();
    expect(localStorage.getItem(advancedKey)).toContain('consumption');
    expect(localStorage.getItem(CUSTOMIZED_WIDGET_VISIBILITY_STORAGE_KEY)).toBeNull();
  });
});

/**
 * Logout clears localStorage. Each Topbar used to restore only its own variant's
 * widget prefs, which wiped Advanced/Customized selections after a Basic logout
 * (and the reverse). Snapshot/restore all variant keys together.
 */
import {
  readDashboardWidgetVisibilityRaw,
  restoreDashboardWidgetVisibilityAfterStorageClear,
} from './dashboardWidgetVisibilityCore';
import {
  readCustomizedWidgetVisibilityRaw,
  restoreCustomizedWidgetVisibilityAfterStorageClear,
} from '../../../variants/customized/utils/customizedOverviewWidgetVisibility';

export function snapshotAllVariantWidgetVisibilityForLogout() {
  return {
    basic: readDashboardWidgetVisibilityRaw('basic'),
    advanced: readDashboardWidgetVisibilityRaw('advanced'),
    customized: readCustomizedWidgetVisibilityRaw(),
  };
}

export function restoreAllVariantWidgetVisibilityAfterStorageClear(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') return;
  restoreDashboardWidgetVisibilityAfterStorageClear(snapshot.basic, 'basic');
  restoreDashboardWidgetVisibilityAfterStorageClear(snapshot.advanced, 'advanced');
  restoreCustomizedWidgetVisibilityAfterStorageClear(snapshot.customized);
}

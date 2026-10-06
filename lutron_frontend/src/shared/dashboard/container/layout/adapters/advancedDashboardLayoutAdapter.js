import { DASHBOARD_SECTION_IDS } from '../layoutTypes';

export const ADVANCED_DASHBOARD_TAB_ORDER = [
  DASHBOARD_SECTION_IDS.OVERVIEW,
  DASHBOARD_SECTION_IDS.ENERGY,
  DASHBOARD_SECTION_IDS.CHARTS,
  DASHBOARD_SECTION_IDS.ALERTS,
];

export const ADVANCED_DASHBOARD_TAB_ORDER_WITHOUT_OVERVIEW = [
  DASHBOARD_SECTION_IDS.ENERGY,
  DASHBOARD_SECTION_IDS.CHARTS,
  DASHBOARD_SECTION_IDS.ALERTS,
];

export const ADVANCED_DASHBOARD_LAYOUT_ADAPTER = {
  variant: 'advanced',
  TAB_ORDER: ADVANCED_DASHBOARD_TAB_ORDER,
  // Keep visited Energy/Space/Alerts panels mounted so tab switches don't remount widgets.
  keepInactiveSectionsMounted: true,
  resolveSectionKey(activeTab) {
    if (activeTab === DASHBOARD_SECTION_IDS.CHARTS) {
      return DASHBOARD_SECTION_IDS.CHARTS;
    }
    if (
      activeTab === DASHBOARD_SECTION_IDS.OVERVIEW ||
      activeTab === DASHBOARD_SECTION_IDS.ENERGY ||
      activeTab === DASHBOARD_SECTION_IDS.ALERTS
    ) {
      return activeTab;
    }
    return null;
  },
};

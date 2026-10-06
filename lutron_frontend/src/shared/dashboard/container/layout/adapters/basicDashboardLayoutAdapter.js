import { DASHBOARD_SECTION_IDS } from '../layoutTypes';

export const BASIC_DASHBOARD_TAB_ORDER = [
  DASHBOARD_SECTION_IDS.OVERVIEW,
  DASHBOARD_SECTION_IDS.ENERGY,
  DASHBOARD_SECTION_IDS.CHARTS,
  DASHBOARD_SECTION_IDS.ALERTS,
];

export const BASIC_DASHBOARD_LAYOUT_ADAPTER = {
  variant: 'basic',
  TAB_ORDER: BASIC_DASHBOARD_TAB_ORDER,
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

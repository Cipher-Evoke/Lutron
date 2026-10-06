/**
 * Built-in dashboard widget registry (19 keys, excludes variant-only `shades`).
 * Metadata only — components remain in variant monoliths until Phase 6.2.
 */

export const WIDGET_SECTIONS = {
  OVERVIEW: 'overview',
  ENERGY: 'energy',
  SPACE: 'space',
};

export const BUILTIN_WIDGET_REGISTRY = {
  energy: {
    key: 'energy',
    section: WIDGET_SECTIONS.OVERVIEW,
    component: 'DashboardOverview.jsx',
    thunk: 'getDashboardOverview',
    selectors: ['selectDashboardOverview', 'selectDashboardOverviewLoading', 'selectDashboardOverviewError'],
    apiEndpoints: ['GET /home/dashboard'],
    variants: ['basic', 'advanced', 'customized'],
  },
  alerts: {
    key: 'alerts',
    section: WIDGET_SECTIONS.OVERVIEW,
    component: 'DashboardOverview.jsx + Alerts.jsx',
    thunk: 'getDashboardOverview',
    selectors: ['selectDashboardOverview'],
    apiEndpoints: ['GET /home/dashboard', 'GET /alert/active_alerts'],
    variants: ['basic', 'advanced', 'customized'],
  },
  schedules: {
    key: 'schedules',
    section: WIDGET_SECTIONS.OVERVIEW,
    component: 'DashboardOverview.jsx',
    thunk: 'getDashboardOverview',
    selectors: ['selectDashboardOverview'],
    apiEndpoints: ['GET /home/dashboard'],
    variants: ['basic', 'advanced', 'customized'],
  },
  quick_controls: {
    key: 'quick_controls',
    section: WIDGET_SECTIONS.OVERVIEW,
    component: 'DashboardOverview.jsx',
    thunk: null,
    selectors: [],
    apiEndpoints: [],
    variants: ['basic', 'advanced', 'customized'],
  },
  floors: {
    key: 'floors',
    section: WIDGET_SECTIONS.OVERVIEW,
    component: 'DashboardOverview.jsx',
    thunk: 'getDashboardOverview',
    selectors: ['selectDashboardOverview'],
    apiEndpoints: ['GET /home/dashboard'],
    variants: ['basic', 'advanced', 'customized'],
  },
  space_utilization: {
    key: 'space_utilization',
    section: WIDGET_SECTIONS.OVERVIEW,
    component: 'DashboardOverview.jsx',
    thunk: 'getDashboardOverview',
    selectors: ['selectDashboardOverview'],
    apiEndpoints: ['GET /home/dashboard'],
    variants: ['basic', 'advanced', 'customized'],
  },
  consumption: {
    key: 'consumption',
    section: WIDGET_SECTIONS.ENERGY,
    component: 'Dashboard.jsx',
    thunk: 'fetchUnifiedEnergyConsumptionSavingsData',
    selectors: ['selectUnifiedEnergyConsumption', 'selectUnifiedEnergyConsumptionLoading'],
    apiEndpoints: ['GET /dashboard/unified_energy_consumption_savings_data'],
    variants: ['basic', 'advanced', 'customized'],
  },
  savings: {
    key: 'savings',
    section: WIDGET_SECTIONS.ENERGY,
    component: 'Dashboard.jsx',
    thunk: 'fetchUnifiedEnergyConsumptionSavingsData',
    selectors: ['selectUnifiedEnergySavings', 'selectUnifiedEnergySavingsLoading'],
    apiEndpoints: ['GET /dashboard/unified_energy_consumption_savings_data'],
    variants: ['basic', 'advanced', 'customized'],
  },
  consumption_saving: {
    key: 'consumption_saving',
    section: WIDGET_SECTIONS.ENERGY,
    component: 'ConsumptionSavingsCombinedChart.jsx (basic) / Dashboard.jsx',
    thunk: 'fetchUnifiedEnergyConsumptionSavingsData',
    selectors: ['selectUnifiedEnergyConsumption', 'selectUnifiedEnergySavings'],
    apiEndpoints: ['GET /dashboard/unified_energy_consumption_savings_data'],
    variants: ['basic', 'advanced', 'customized'],
  },
  savings_by_strategy: {
    key: 'savings_by_strategy',
    section: WIDGET_SECTIONS.ENERGY,
    component: 'Dashboard.jsx',
    thunk: 'fetchSavingsByStrategy',
    selectors: ['selectSavingsByStrategy'],
    apiEndpoints: ['GET /dashboard/saving_by_stratergy'],
    variants: ['basic', 'advanced', 'customized'],
  },
  total_consumption_by_group: {
    key: 'total_consumption_by_group',
    section: WIDGET_SECTIONS.ENERGY,
    component: 'Dashboard.jsx',
    thunk: 'fetchTotalConsumptionByGroup',
    selectors: ['selectTotalConsumptionByGroup', 'selectAreaGroups'],
    apiEndpoints: ['GET /dashboard/total_consumption/by_group', 'GET /area_group/list'],
    variants: ['basic', 'advanced', 'customized'],
  },
  light_power_density: {
    key: 'light_power_density',
    section: WIDGET_SECTIONS.ENERGY,
    component: 'Dashboard.jsx',
    thunk: 'fetchLightPowerDensity',
    selectors: ['selectLightPowerDensity'],
    apiEndpoints: ['GET /dashboard/light_power_density'],
    variants: ['basic', 'advanced', 'customized'],
  },
  peak_and_minimum_consumption: {
    key: 'peak_and_minimum_consumption',
    section: WIDGET_SECTIONS.ENERGY,
    component: 'Dashboard.jsx',
    thunk: 'fetchUnifiedEnergyConsumptionSavingsData',
    selectors: ['selectUnifiedPeakMinConsumption', 'selectUnifiedPeakMinConsumptionLoading'],
    apiEndpoints: ['GET /dashboard/unified_energy_consumption_savings_data'],
    variants: ['basic', 'advanced', 'customized'],
  },
  utilization: {
    key: 'utilization',
    section: WIDGET_SECTIONS.SPACE,
    component: 'SpaceUtilization.jsx',
    thunk: 'fetchSpaceUtilizationPerArea',
    selectors: ['selectSpaceUtilizationPerArea'],
    apiEndpoints: ['GET /dashboard/space_utilization_per'],
    variants: ['basic', 'advanced', 'customized'],
  },
  utilization_by_area_group: {
    key: 'utilization_by_area_group',
    section: WIDGET_SECTIONS.SPACE,
    component: 'SpaceUtilization.jsx',
    thunk: 'fetchOccupancyByGroup',
    selectors: ['selectOccupancyByGroup', 'selectOccupancyByGroupFromLogs'],
    apiEndpoints: ['GET /dashboard/occupancy_by_group', 'GET /dashboard/occupancy_by_group_from_logs'],
    variants: ['basic', 'advanced', 'customized'],
  },
  utilization_by_area: {
    key: 'utilization_by_area',
    section: WIDGET_SECTIONS.SPACE,
    component: 'SpaceUtilization.jsx',
    thunk: 'fetchOccupancyCount',
    selectors: ['selectOccupancyCount'],
    apiEndpoints: ['GET /dashboard/occupancy_count'],
    variants: ['basic', 'advanced', 'customized'],
  },
  peak_and_minimum_utilization: {
    key: 'peak_and_minimum_utilization',
    section: WIDGET_SECTIONS.SPACE,
    component: 'SpaceUtilization.jsx',
    thunk: null,
    selectors: [],
    apiEndpoints: [],
    apiNote: 'fetchPeakMinOccupancy disabled in all variants',
    variants: ['basic', 'advanced', 'customized'],
  },
  instant_occupancy_count: {
    key: 'instant_occupancy_count',
    section: WIDGET_SECTIONS.SPACE,
    component: 'SpaceUtilization.jsx',
    thunk: 'fetchInstantOccupancyCount',
    selectors: ['selectInstantOccupancyCount', 'selectInstantOccupancyCountLoading'],
    apiEndpoints: ['GET /dashboard/instant_occupancy_count'],
    variants: ['basic', 'advanced', 'customized'],
  },
  instant_utilization_combined: {
    key: 'instant_utilization_combined',
    section: WIDGET_SECTIONS.SPACE,
    component: 'SpaceInstantUtilizationCombinedChart.jsx / SpaceUtilization.jsx',
    thunk: 'fetchInstantOccupancyCount',
    selectors: [
      'selectInstantOccupancyCount',
      'selectOccupancyByGroupFromLogs',
      'selectSpaceUtilizationPerFromLogs',
    ],
    apiEndpoints: [
      'GET /dashboard/instant_occupancy_count',
      'GET /dashboard/occupancy_by_group_from_logs',
      'GET /dashboard/space_utilization_per_from_logs',
    ],
    variants: ['basic', 'advanced', 'customized'],
  },
};

export const BUILTIN_WIDGET_KEYS = Object.keys(BUILTIN_WIDGET_REGISTRY);

export function getWidgetRegistryEntry(key) {
  return BUILTIN_WIDGET_REGISTRY[key] || null;
}

export function getWidgetsBySection(section) {
  return BUILTIN_WIDGET_KEYS.filter((k) => BUILTIN_WIDGET_REGISTRY[k].section === section);
}

export const CUSTOM_GRAPH_VARIANTS = {
  customized: 'customized',
  basic: 'basic',
  advanced: 'advanced',
};

export const CUSTOM_GRAPHS_UPDATED_EVENT = 'customGraphsUpdated';

export const CUSTOM_GRAPH_VISIBILITY_UPDATED_EVENT = 'customGraphVisibilityUpdated';

/** API paths offered in Add New Graph dialog (shared across variants). */
export const CUSTOM_GRAPH_API_PATH_OPTIONS = [
  '/dashboard/energy_consumption',
  '/dashboard/energy_savings',
  '/dashboard/unified_energy_consumption_savings_data',
  '/dashboard/saving_by_stratergy',
  '/dashboard/total_consumption/by_group',
  '/dashboard/light_power_density',
  '/dashboard/peak_min_consumption',
  '/dashboard/instant_occupancy_count',
  '/dashboard/occupancy_count',
  '/dashboard/occupancy_by_group',
  '/dashboard/occupancy_by_group_from_logs',
  '/dashboard/peak_min_occupancy',
  '/dashboard/peak_min_occupancy_from_logs',
  '/dashboard/space_utilization_per',
  '/dashboard/space_utilization_per_from_logs',
];

export function formatCustomGraphApiPathLabel(apiPath) {
  const p = String(apiPath || '').trim();
  if (!p) return '';
  return p.replace(/^\/dashboard\//, '').replace(/\//g, ' / ');
}

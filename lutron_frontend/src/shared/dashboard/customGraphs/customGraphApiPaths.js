/**
 * Shared API path inference for custom graphs (basic + advanced).
 * Customized slice keeps its own copy for backward compatibility.
 */
export function getApiFromKeyword(keyword) {
  const k = String(keyword || '').toLowerCase().trim();

  if (
    k.includes('unified') ||
    k.includes('combined') ||
    k.includes('energy consumption')
  ) {
    return '/dashboard/unified_energy_consumption_savings_data';
  }

  if (k.includes('energy')) return '/dashboard/energy_consumption';

  if (k.includes('saving') && k.includes('strategy')) {
    return '/dashboard/saving_by_stratergy';
  }

  if (k.includes('saving')) return '/dashboard/energy_savings';

  if (
    k.includes('light power') ||
    k.includes('power density') ||
    k.includes('light density') ||
    (k.includes('light') && (k.includes('power') || k.includes('density')))
  ) {
    return '/dashboard/light_power_density';
  }

  if (k.includes('group') && k.includes('consumption')) {
    return '/dashboard/total_consumption/by_group';
  }

  if (k.includes('peak') && k.includes('consumption')) {
    return '/dashboard/peak_min_consumption';
  }

  if (k.includes('instant')) return '/dashboard/instant_occupancy_count';

  if (k.includes('occupancy') && k.includes('group') && k.includes('logs')) {
    return '/dashboard/occupancy_by_group_from_logs';
  }

  if (k.includes('occupancy') && k.includes('group')) {
    return '/dashboard/occupancy_by_group';
  }

  if (k.includes('peak') && k.includes('occupancy') && k.includes('logs')) {
    return '/dashboard/peak_min_occupancy_from_logs';
  }

  if (k.includes('peak') && k.includes('occupancy')) {
    return '/dashboard/peak_min_occupancy';
  }

  if (k.includes('occupancy')) return '/dashboard/occupancy_count';

  if (k.includes('utilization') && k.includes('logs')) {
    return '/dashboard/space_utilization_per_from_logs';
  }

  if (k.includes('utilization')) return '/dashboard/space_utilization_per';

  return '/dashboard/energy_consumption';
}

export function normalizeCustomGraphApiPath(rawPath, name) {
  const rawApiPath = String(rawPath ?? '').trim();
  const apiPathFromKeyword = getApiFromKeyword(name);
  if (!rawApiPath) return apiPathFromKeyword;
  return rawApiPath.startsWith('/')
    ? rawApiPath
    : `/dashboard/${rawApiPath.replace(/^\/+/, '')}`;
}

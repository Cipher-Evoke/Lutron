/**
 * Maps custom graph `api_path` values to the same Redux async thunks used by built-in
 * dashboard charts, so requests + normalized state match built-ins.
 * Returns null to fall back to raw HTTP (e.g. peak_min_occupancy, unknown paths).
 */
import {
  fetchEnergyConsumption,
  fetchEnergySavings,
  fetchPeakMinConsumption,
  fetchTotalConsumptionByGroup,
  fetchLightPowerDensity,
  fetchOccupancyCount,
  fetchInstantOccupancyCount,
  fetchOccupancyByGroupFromLogs,
  fetchSpaceUtilizationPerFromLogs,
  fetchOccupancyByGroup,
  fetchSpaceUtilizationPerArea,
  fetchSavingsByStrategy,
} from '../redux/slice/dashboard/dashboardSlice';
import { fetchUnifiedEnergyConsumptionSavingsData } from '../redux/slice/dashboard/unifiedEnergySlice';

function normalizeApiPathKey(path) {
  let p = String(path || '')
    .trim()
    .split('?')[0];
  if (!p.startsWith('/')) {
    p = `/dashboard/${p.replace(/^\/+/, '')}`;
  }
  return p.toLowerCase();
}

/**
 * @returns {null | { thunk: Function, mapArgs?: (a: object) => object, select: (state: object) => unknown }}
 */
export function resolveDashboardThunkForCustomGraphPath(apiPath) {
  const p = normalizeApiPathKey(apiPath);

  if (p.includes('unified_energy_consumption_savings_data')) {
    return {
      thunk: fetchUnifiedEnergyConsumptionSavingsData,
      mapArgs: (a) => ({ ...a, forceRefresh: true }),
      select: (s) => s.unifiedEnergy?.energyConsumption ?? null,
    };
  }

  if (p.includes('total_consumption/by_group') || p.includes('total_consumption%2fby_group')) {
    return {
      thunk: fetchTotalConsumptionByGroup,
      select: (s) => s.dashboard?.totalConsumptionByGroup ?? null,
    };
  }

  if (p.includes('instant_occupancy_count')) {
    return {
      thunk: fetchInstantOccupancyCount,
      select: (s) => s.dashboard?.instantOccupancyCount ?? null,
    };
  }

  if (p.includes('occupancy_by_group_from_logs')) {
    return {
      thunk: fetchOccupancyByGroupFromLogs,
      select: (s) => s.dashboard?.occupancyByGroupFromLogs ?? null,
    };
  }

  if (p.includes('occupancy_by_group')) {
    return {
      thunk: fetchOccupancyByGroup,
      select: (s) => s.dashboard?.occupancyByGroup ?? null,
    };
  }

  if (p.includes('space_utilization_per_from_logs')) {
    return {
      thunk: fetchSpaceUtilizationPerFromLogs,
      select: (s) => s.dashboard?.spaceUtilizationPerFromLogs ?? null,
    };
  }

  if (p.includes('space_utilization_per')) {
    return {
      thunk: fetchSpaceUtilizationPerArea,
      select: (s) => s.dashboard?.spaceUtilizationPerArea ?? null,
    };
  }

  if (p.includes('occupancy_count')) {
    return {
      thunk: fetchOccupancyCount,
      select: (s) => s.dashboard?.occupancyCount ?? null,
    };
  }

  if (p.includes('saving_by_stratergy') || p.includes('saving_by_strategy')) {
    return {
      thunk: fetchSavingsByStrategy,
      select: (s) => s.dashboard?.savingsByStrategy ?? null,
    };
  }

  if (p.includes('energy_savings')) {
    return {
      thunk: fetchEnergySavings,
      select: (s) => s.dashboard?.energySavings ?? null,
    };
  }

  if (p.includes('energy_consumption')) {
    return {
      thunk: fetchEnergyConsumption,
      select: (s) => s.dashboard?.energyConsumption ?? null,
    };
  }

  if (p.includes('peak_min_consumption')) {
    return {
      thunk: fetchPeakMinConsumption,
      select: (s) => s.dashboard?.peakMinConsumption ?? null,
    };
  }

  if (p.includes('light_power_density')) {
    return {
      thunk: fetchLightPowerDensity,
      select: (s) => s.dashboard?.lightPowerDensity ?? null,
    };
  }

  return null;
}

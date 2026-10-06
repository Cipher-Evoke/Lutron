export const ENERGY_EXPORT_WIDGET_KEYS = {
  CONSUMPTION: 'Consumption',
  SAVINGS: 'Savings',
  TOTAL_CONSUMPTION_BY_GROUP: 'total_consumption_by_group',
};

/**
 * Widget-key → { label, emailThunk, downloadThunk } for built-in energy dashboard exports.
 */
export function createEnergyExportActionMap(thunks) {
  return {
    [ENERGY_EXPORT_WIDGET_KEYS.CONSUMPTION]: {
      label: 'Energy Consumption',
      emailThunk: thunks.sendEnergyConsumptionEmail,
      downloadThunk: thunks.downloadEnergyConsumption,
    },
    [ENERGY_EXPORT_WIDGET_KEYS.SAVINGS]: {
      label: 'Energy Savings',
      emailThunk: thunks.sendEnergySavingsEmail,
      downloadThunk: thunks.downloadEnergySavings,
    },
    [ENERGY_EXPORT_WIDGET_KEYS.TOTAL_CONSUMPTION_BY_GROUP]: {
      label: 'Consumption By Area Groups',
      emailThunk: thunks.sendTotalConsumptionByGroupEmail,
      downloadThunk: thunks.downloadTotalConsumptionByGroup,
    },
  };
}

/**
 * Resolves export thunks from a custom graph `api_path` (customized Energy tab).
 */
export function resolveEnergyExportByApiPath(apiPath, thunks) {
  const path = String(apiPath || '').trim();
  if (!path) return null;

  if (path.includes('/dashboard/energy_consumption')) {
    return {
      label: 'Energy Consumption',
      emailThunk: thunks.sendEnergyConsumptionEmail,
      downloadThunk: thunks.downloadEnergyConsumption,
    };
  }

  if (
    path.includes('/dashboard/energy_savings') ||
    path.includes('/dashboard/saving_by_stratergy')
  ) {
    return {
      label: 'Energy Savings',
      emailThunk: thunks.sendEnergySavingsEmail,
      downloadThunk: thunks.downloadEnergySavings,
    };
  }

  if (path.includes('/dashboard/peak_min_consumption')) {
    return {
      label: 'Peak & Minimum Consumption',
      emailThunk: thunks.sendPeakMinConsumptionEmail,
      downloadThunk: thunks.downloadPeakMinConsumption,
    };
  }

  if (path.includes('/dashboard/total_consumption/by_group')) {
    return {
      label: 'Consumption By Area Groups',
      emailThunk: thunks.sendTotalConsumptionByGroupEmail,
      downloadThunk: thunks.downloadTotalConsumptionByGroup,
    };
  }

  if (path.includes('/dashboard/occupancy_count')) {
    return {
      label: 'Utilization',
      emailThunk: thunks.sendOccupancyCountEmail,
      downloadThunk: thunks.downloadOccupancyCount,
    };
  }

  if (path.includes('/dashboard/occupancy_by_group')) {
    return {
      label: 'Occupancy by Group',
      emailThunk: thunks.sendOccupancyByGroupEmail,
      downloadThunk: thunks.downloadOccupancyByGroup,
    };
  }

  if (path.includes('/dashboard/space_utilization_per')) {
    return {
      label: 'Utilization By Area',
      emailThunk: thunks.sendSpaceUtilizationPerEmail,
      downloadThunk: thunks.downloadSpaceUtilizationPer,
    };
  }

  return null;
}

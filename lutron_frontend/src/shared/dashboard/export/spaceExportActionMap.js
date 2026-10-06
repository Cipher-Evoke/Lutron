function isInstantExport(dropdownKey, chartTitle) {
  const title = String(chartTitle || '');
  return (
    dropdownKey === 'instant' ||
    dropdownKey === 'instantCombined' ||
    title.includes('Instant Occupancy Count') ||
    title.includes('instant_occupancy_count')
  );
}

function isOccupancyByGroupChart(chartTitle) {
  const title = String(chartTitle || '');
  return (
    title.includes('utilization_by_area_group') ||
    title.includes('Occupancy by Group') ||
    (title.includes('Area Groups') && !title.includes('Utilization By Area'))
  );
}

function isUtilizationByAreaChart(chartTitle) {
  const title = String(chartTitle || '');
  return title.includes('Utilization By Area') && !title.includes('Groups');
}

function isOccupancyCountUtilizationChart(chartTitle) {
  const title = String(chartTitle || '');
  return (
    title.includes('Utilization') &&
    !title.includes('Area') &&
    !title.includes('Occupancy by Group')
  );
}

/**
 * Resolves email/download thunks for space dashboard chart exports.
 * Mirrors routing in variant SpaceUtilization.jsx handleExport.
 */
export function resolveSpaceExportThunks({ showChartsTab, dropdownKey, chartTitle }, thunks) {
  if (isInstantExport(dropdownKey, chartTitle)) {
    return showChartsTab
      ? {
          emailThunk: thunks.sendInstantOccupancyCountEmail,
          downloadThunk: thunks.downloadInstantOccupancyCount,
        }
      : {
          emailThunk: thunks.sendOccupancyCountEmail,
          downloadThunk: thunks.downloadOccupancyCount,
        };
  }

  if (dropdownKey === 'pie') {
    return showChartsTab
      ? {
          emailThunk: thunks.sendOccupancyByGroupFromLogsEmail,
          downloadThunk: thunks.downloadOccupancyByGroupFromLogs,
        }
      : {
          emailThunk: thunks.sendOccupancyByGroupEmail,
          downloadThunk: thunks.downloadOccupancyByGroup,
        };
  }

  // Route by dropdown key so renamed widget titles still export correctly
  // (mirrors pie / instant key routing used by all three variants).
  if (dropdownKey === 'table') {
    return showChartsTab
      ? {
          emailThunk: thunks.sendSpaceUtilizationPerFromLogsEmail,
          downloadThunk: thunks.downloadSpaceUtilizationPerFromLogs,
        }
      : {
          emailThunk: thunks.sendSpaceUtilizationPerEmail,
          downloadThunk: thunks.downloadSpaceUtilizationPer,
        };
  }

  if (isOccupancyByGroupChart(chartTitle)) {
    return showChartsTab
      ? {
          emailThunk: thunks.sendOccupancyByGroupFromLogsEmail,
          downloadThunk: thunks.downloadOccupancyByGroupFromLogs,
        }
      : {
          emailThunk: thunks.sendOccupancyByGroupEmail,
          downloadThunk: thunks.downloadOccupancyByGroup,
        };
  }

  if (isUtilizationByAreaChart(chartTitle)) {
    return showChartsTab
      ? {
          emailThunk: thunks.sendSpaceUtilizationPerFromLogsEmail,
          downloadThunk: thunks.downloadSpaceUtilizationPerFromLogs,
        }
      : {
          emailThunk: thunks.sendSpaceUtilizationPerEmail,
          downloadThunk: thunks.downloadSpaceUtilizationPer,
        };
  }

  if (isOccupancyCountUtilizationChart(chartTitle)) {
    return {
      emailThunk: thunks.sendOccupancyCountEmail,
      downloadThunk: thunks.downloadOccupancyCount,
    };
  }

  return null;
}

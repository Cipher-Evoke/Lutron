const DEFAULT_COLORS = [
  '#FFB3B3',
  '#87CEEB',
  '#98FB98',
  '#FFD4A3',
  '#DDA0DD',
  '#FFB6C1',
  '#AFEEEE',
  '#F0E68C',
];

function defaultGroupLabel(group, index) {
  return group.area_group_name || `Group ${index + 1}`;
}

function roundPercent(value) {
  return Math.round(value * 100) / 100;
}

function computePercentages(group) {
  if (group.occupied_percentage !== undefined && group.unoccupied_percentage !== undefined) {
    const occupiedPercentage = group.occupied_percentage || 0;
    const unoccupiedPercentage = group.unoccupied_percentage || 0;
    const total = group.total_time_seconds || occupiedPercentage + unoccupiedPercentage;
    return { occupiedPercentage, unoccupiedPercentage, total };
  }

  const totalPossible = group.total_possible || 0;
  const totalOccupied = group.total_occupied || 0;
  const unoccupied = totalPossible - totalOccupied;
  let occupiedPercentage = 0;
  let unoccupiedPercentage = 0;

  if (totalPossible > 0) {
    occupiedPercentage = (totalOccupied / totalPossible) * 100;
    unoccupiedPercentage = (unoccupied / totalPossible) * 100;
    occupiedPercentage = Math.min(occupiedPercentage, 100);
    unoccupiedPercentage = Math.min(unoccupiedPercentage, 100);
  }

  return { occupiedPercentage, unoccupiedPercentage, total: totalPossible };
}

/**
 * Normalize occupancy-by-group API payload to Recharts stacked bar rows.
 * Extracted from variant SpaceUtilization.jsx StackedBarChartComponent.
 */
export function occupancyByGroupToStackedBarRows(payload, options = {}) {
  const {
    resolveGroupLabel = defaultGroupLabel,
    colorPalette = DEFAULT_COLORS,
    requireAreaGroupName = true,
  } = options;

  if (!payload || payload.status === 'error') {
    return [];
  }

  let groupDataArray = [];
  if (Array.isArray(payload)) {
    groupDataArray = payload;
  } else if (payload.data && Array.isArray(payload.data)) {
    groupDataArray = payload.data;
  } else {
    return [];
  }

  return groupDataArray
    .filter((group) => {
      if (!group || typeof group !== 'object') return false;
      if (requireAreaGroupName) {
        return Boolean(group.area_group_name);
      }
      return true;
    })
    .map((group, index) => {
      const { occupiedPercentage, unoccupiedPercentage, total } = computePercentages(group);
      return {
        name: resolveGroupLabel(group, index),
        occupied: roundPercent(occupiedPercentage),
        unoccupied: roundPercent(unoccupiedPercentage),
        total,
        color: colorPalette[index % colorPalette.length],
      };
    })
    .sort((a, b) => b.total - a.total);
}

/**
 * Convert utilization-by-area payload to stacked-bar row shape (area mode).
 * Single occupied segment with complementary unoccupied percentage.
 */
export function occupancyUtilizedAreaToStackedBarRows(payload, options = {}) {
  const { colorPalette = DEFAULT_COLORS } = options;

  if (!payload || payload.status === 'error') {
    return [];
  }

  let areaDataArray = payload.utilized_area || payload.data || [];
  if (!Array.isArray(areaDataArray)) {
    return [];
  }

  return areaDataArray
    .filter((area) => area && typeof area === 'object' && area.name)
    .map((area, index) => {
      const occupied = Math.min(Number(area.occupied ?? area.percentage) || 0, 100);
      const unoccupied = Math.max(0, 100 - occupied);
      return {
        name: area.name || 'Unknown Area',
        occupied: roundPercent(occupied),
        unoccupied: roundPercent(unoccupied),
        total: occupied,
        color: colorPalette[index % colorPalette.length],
      };
    })
    .sort((a, b) => b.total - a.total);
}

export { DEFAULT_COLORS as OCCUPANCY_STACKED_BAR_DEFAULT_COLORS };

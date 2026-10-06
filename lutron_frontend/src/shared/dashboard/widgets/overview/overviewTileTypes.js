export const OVERVIEW_TILE_TYPES = {
  ENERGY: 'energy',
  SCHEDULES: 'schedules',
  QUICK_CONTROLS: 'quick_controls',
  FLOORS: 'floors',
  SPACE_UTILIZATION: 'space_utilization',
};

export const OVERVIEW_TILE_TITLES = {
  [OVERVIEW_TILE_TYPES.ENERGY]: 'Energy',
  [OVERVIEW_TILE_TYPES.SCHEDULES]: 'Schedules',
  [OVERVIEW_TILE_TYPES.QUICK_CONTROLS]: 'Quick Controls',
  [OVERVIEW_TILE_TYPES.FLOORS]: 'Floors',
  [OVERVIEW_TILE_TYPES.SPACE_UTILIZATION]: 'Space Utilization',
};

export function resolveEnergyTileModel(energy) {
  if (!energy) {
    return { status: 'empty', emptyMessage: 'No data' };
  }
  return {
    status: 'ready',
    savingsPercent: energy.savings_percent,
    savingsKw: Number(energy.savings_kw).toFixed(2),
    consumptionKw: Number(energy.consumption_kw).toFixed(2),
  };
}

export function resolveSchedulesTileModel(schedule) {
  if (!schedule) {
    return { status: 'empty', emptyMessage: 'No upcoming event' };
  }
  return {
    status: 'ready',
    eventText: `${schedule.name} ${schedule.time}, ${schedule.date}`,
  };
}

export function resolveQuickControlsTileModel() {
  return {
    status: 'ready',
    description: 'Use quick controls to execute several actions at once.',
  };
}

export function resolveFloorsTileModel(floorsCount) {
  return {
    status: 'ready',
    count: floorsCount != null ? floorsCount : '—',
  };
}

export function resolveSpaceUtilizationTileModel(spaceUtil) {
  if (!spaceUtil) {
    return { status: 'empty', emptyMessage: 'No data' };
  }
  return {
    status: 'ready',
    occupiedPercent: spaceUtil.occupied_percent,
  };
}

export function resolveOverviewTileModel(tileType, data = {}) {
  switch (tileType) {
    case OVERVIEW_TILE_TYPES.ENERGY:
      return resolveEnergyTileModel(data.energy);
    case OVERVIEW_TILE_TYPES.SCHEDULES:
      return resolveSchedulesTileModel(data.schedule);
    case OVERVIEW_TILE_TYPES.QUICK_CONTROLS:
      return resolveQuickControlsTileModel();
    case OVERVIEW_TILE_TYPES.FLOORS:
      return resolveFloorsTileModel(data.floorsCount);
    case OVERVIEW_TILE_TYPES.SPACE_UTILIZATION:
      return resolveSpaceUtilizationTileModel(data.spaceUtil);
    default:
      return { status: 'empty', emptyMessage: 'No data' };
  }
}

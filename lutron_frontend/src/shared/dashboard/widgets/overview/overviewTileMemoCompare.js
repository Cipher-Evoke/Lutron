import {
  resolveEnergyTileModel,
  resolveSchedulesTileModel,
  resolveQuickControlsTileModel,
  resolveFloorsTileModel,
  resolveSpaceUtilizationTileModel,
  resolveOverviewTileModel,
} from './overviewTileTypes';

export function overviewMetricTilePropsAreEqual(prevProps, nextProps) {
  if (prevProps.tileType !== nextProps.tileType) return false;
  if (prevProps.title !== nextProps.title) return false;
  if (prevProps.themeVariant !== nextProps.themeVariant) return false;
  if (prevProps.cardVariant !== nextProps.cardVariant) return false;
  if (prevProps.surfaceVariant !== nextProps.surfaceVariant) return false;
  if (prevProps.onClick !== nextProps.onClick) return false;
  if (prevProps.floorsCount !== nextProps.floorsCount) return false;

  if (prevProps.cardSx !== nextProps.cardSx) {
    if (prevProps.cardSx && nextProps.cardSx) {
      try {
        if (JSON.stringify(prevProps.cardSx) === JSON.stringify(nextProps.cardSx)) {
          // continue
        } else {
          return false;
        }
      } catch (e) {
        return false;
      }
    } else {
      return false;
    }
  }

  const comparePayload = (prev, next) => {
    if (prev === next) return true;
    if (prev && next) {
      try {
        return JSON.stringify(prev) === JSON.stringify(next);
      } catch (e) {
        return false;
      }
    }
    return false;
  };

  if (!comparePayload(prevProps.energy, nextProps.energy)) return false;
  if (!comparePayload(prevProps.schedule, nextProps.schedule)) return false;
  if (!comparePayload(prevProps.spaceUtil, nextProps.spaceUtil)) return false;

  return true;
}

export function sharedOverviewTileModel(tileType, data) {
  return resolveOverviewTileModel(tileType, data);
}

export function legacyOverviewTileModel(tileType, data) {
  return resolveOverviewTileModel(tileType, data);
}

export {
  resolveEnergyTileModel,
  resolveSchedulesTileModel,
  resolveQuickControlsTileModel,
  resolveFloorsTileModel,
  resolveSpaceUtilizationTileModel,
};

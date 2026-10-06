import { createAction } from "@reduxjs/toolkit";

/** Push floor light cache payload (WebSocket floor_light). */
export const applyHeatmapFloorLightLive = createAction(
  "heatmap/live/floorLight",
  (payload) => ({ payload })
);

/** Push floor occupancy cache payload (WebSocket floor_occupancy). */
export const applyHeatmapFloorOccupancyLive = createAction(
  "heatmap/live/floorOccupancy",
  (payload) => ({ payload })
);

/** Push open-area sidebar cache payload (WebSocket area_status, energy preserved). */
export const applyHeatmapAreaStatusLive = createAction(
  "heatmap/live/areaStatus",
  (payload) => ({ payload })
);

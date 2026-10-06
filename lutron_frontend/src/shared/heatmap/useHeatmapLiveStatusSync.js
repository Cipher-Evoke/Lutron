import { useEffect, useRef } from "react";
import {
  applyHeatmapAreaStatusLive,
  applyHeatmapFloorLightLive,
  applyHeatmapFloorOccupancyLive,
} from "./heatmapLiveActions";
import createHeatmapLiveSocket from "./heatmapLiveSocket";

/**
 * Heatmap live status (all 3 variants via this hook only).
 *
 * WebSocket push from listener DB cache — no 10s/20s REST polling.
 * Click / Apply stay on default live=1 via HeatMap.jsx (unchanged).
 *
 * On reconnect, optional one-shot live=0 REST sync (fallback only).
 */
export function useHeatmapLiveStatusSync({
  dispatch,
  selectedFloorId,
  displayMode,
  selectedAreaId,
  fetchFloorMapData,
  fetchAreaOccupancyStatus,
  fetchAreaStatus,
}) {
  const latestRef = useRef({
    selectedFloorId,
    displayMode,
    selectedAreaId,
  });
  const socketRef = useRef(null);
  const fallbackInFlightRef = useRef(false);

  useEffect(() => {
    latestRef.current = {
      selectedFloorId,
      displayMode,
      selectedAreaId,
    };
  }, [selectedFloorId, displayMode, selectedAreaId]);

  useEffect(() => {
    if (displayMode !== "Light" && displayMode !== "Occupancy") {
      socketRef.current?.close();
      socketRef.current = null;
      return undefined;
    }

    const socket = createHeatmapLiveSocket({
      onFloorLight: (payload) => {
        dispatch(applyHeatmapFloorLightLive(payload));
      },
      onFloorOccupancy: (payload) => {
        dispatch(applyHeatmapFloorOccupancyLive(payload));
      },
      onAreaStatus: (payload) => {
        dispatch(applyHeatmapAreaStatusLive(payload));
      },
      onOpen: async () => {
        if (fallbackInFlightRef.current) return;
        const latest = latestRef.current;
        if (!latest.selectedFloorId) return;
        if (typeof document !== "undefined" && document.visibilityState !== "visible") {
          return;
        }

        fallbackInFlightRef.current = true;
        try {
          if (latest.displayMode === "Occupancy") {
            await dispatch(
              fetchAreaOccupancyStatus({
                floorId: latest.selectedFloorId,
                live: 0,
              })
            );
          } else {
            await dispatch(
              fetchFloorMapData({
                floorId: latest.selectedFloorId,
                live: 0,
              })
            );
          }
          if (latest.selectedAreaId && fetchAreaStatus) {
            await dispatch(
              fetchAreaStatus({
                areaId: latest.selectedAreaId,
                silent: true,
                preserveEnergy: true,
                live: 0,
              })
            );
          }
        } catch (error) {
          // Best-effort reconnect sync only.
        } finally {
          fallbackInFlightRef.current = false;
        }
      },
    });

    socketRef.current = socket;
    socket.subscribe({
      floorId: latestRef.current.selectedFloorId,
      areaId: latestRef.current.selectedAreaId,
      displayMode: latestRef.current.displayMode,
    });
    socket.start();

    return () => {
      socket.close();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [
    dispatch,
    displayMode,
    fetchAreaOccupancyStatus,
    fetchAreaStatus,
    fetchFloorMapData,
  ]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    if (!selectedFloorId) return;
    if (displayMode !== "Light" && displayMode !== "Occupancy") return;

    socket.subscribe({
      floorId: selectedFloorId,
      areaId: selectedAreaId,
      displayMode,
    });
  }, [selectedFloorId, selectedAreaId, displayMode]);
}

export default useHeatmapLiveStatusSync;

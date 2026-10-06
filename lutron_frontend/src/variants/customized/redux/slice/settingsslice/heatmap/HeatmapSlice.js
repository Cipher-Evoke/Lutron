// src/redux/slice/settingsslice/heatmap/HeatmapSlice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { BaseUrl } from "../../../../BaseUrl";
import {
  areaIdsMatch,
  isCacheLightStaleVsPreferred,
  normalizeOccupancyStatus,
  patchAreasLightFromSidebar,
  reassertOpenAreaLightFromSidebar,
  sidebarLightStatusFromPayload,
} from "./heatmapMapSync";
import { resolveFloorPlanMediaUrl } from "../../../../../../shared/pdf/floorPlanPdf";
import { mapAreaStatusFetchError } from "../../../../../../shared/heatmap/processorReachable";
import { patchOpenAreaLiveLightOccupancy } from "../../../../../../shared/heatmap/patchOpenAreaLiveStatus";
import {
  applyHeatmapAreaStatusLive,
  applyHeatmapFloorLightLive,
  applyHeatmapFloorOccupancyLive,
} from "../../../../../../shared/heatmap/heatmapLiveActions";
import {
  keepSidebarZonesIfIncomingEmpty,
  mergeHeatmapAreaStatusLive,
  mergeHeatmapFloorLightLive,
  mergeHeatmapFloorOccupancyLive,
} from "../../../../../../shared/heatmap/heatmapLiveStateMerge";
import { isAreaAwaitingLiveRead } from "../../../../../../shared/heatmap/liveCachePushGuard";

// Async Thunks
const formatFloorMapError = (err) => {
  const detail = err.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => item?.msg || String(item)).filter(Boolean).join('; ')
      || 'Failed to load floor plan';
  }
  return err.response?.data?.message || err.message || 'Failed to load floor plan';
};

export const fetchFloorMapData = createAsyncThunk(
  "heatmap/fetchFloorMapData",
  async ({ floorId, live = 1 }, { rejectWithValue }) => {
    try {
      const response = await BaseUrl.get(
        `/floor/light_status?floor_id=${floorId}&live=${live === 0 ? 0 : 1}`
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(formatFloorMapError(err));
    }
  },
  {
    // Drop duplicate light_status while the same floor is already in flight.
    condition: ({ floorId }, { getState }) => {
      const hm = getState()?.heatmap;
      if (hm?.floorMapFetchingId == null) return true;
      return String(hm.floorMapFetchingId) !== String(floorId);
    },
  }
);

export const fetchAreaOccupancyStatus = createAsyncThunk(
  "heatmap/fetchAreaOccupancyStatus",
  async ({ floorId, live = 1 }) => {
    const response = await BaseUrl.get(
      `/floor/occupancy_status?floor_id=${floorId}&live=${live === 0 ? 0 : 1}`
    );
    return response.data;
  },
  {
    condition: ({ floorId }, { getState }) => {
      const hm = getState()?.heatmap;
      if (hm?.occupancyFetchingId == null) return true;
      return String(hm.occupancyFetchingId) !== String(floorId);
    },
  }
);

export const fetchAreaEnergyConsumption = createAsyncThunk(
  "heatmap/fetchAreaEnergyConsumption",
  async ({ floorId }) => {
    const response = await BaseUrl.get(`/floor/energy_status?floor_id=${floorId}`);
    return response.data;
  },
  {
    condition: ({ floorId }, { getState }) => {
      const hm = getState()?.heatmap;
      if (hm?.energyFetchingId == null) return true;
      return String(hm.energyFetchingId) !== String(floorId);
    },
  }
);

const normalizeAreaStatusRequest = (arg) =>
  typeof arg === "object" && arg !== null ? arg : { areaId: arg };

export const fetchAreaStatus = createAsyncThunk(
  "heatmap/fetchAreaStatus",
  async (arg, { rejectWithValue }) => {
    const { areaId, live = 1 } = normalizeAreaStatusRequest(arg);
    try {
      const response = await BaseUrl.get(
        `/area/full_area_status?area_id=${areaId}&live=${live === 0 ? 0 : 1}`
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(mapAreaStatusFetchError(err));
    }
  },
  {
    condition: (arg, { getState }) => {
      const { areaId } = normalizeAreaStatusRequest(arg);
      const hm = getState()?.heatmap;
      if (!hm?.areaStatusLoading) return true;
      return String(hm.areaStatusFetchingId) !== String(areaId);
    },
  }
);

export const updateAreaLightStatus = createAsyncThunk(
  "heatmap/updateAreaLightStatus",
  async ({ areaId, lightStatus }, { rejectWithValue }) => {
    try {
      const response = await BaseUrl.patch(`/area/light_status`, {
        area_id: areaId,
        light_status: lightStatus,
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to update area light status');
    }
  }
);

// Thunk to turn ON/OFF all zones in an area
export const toggleAllZonesInArea = createAsyncThunk(
  'heatmap/toggleAllZonesInArea',
  async ({ areaId, action }, { rejectWithValue }) => {
    try {
      const response = await BaseUrl.post('/area/zone_on-off', {
        area_id: areaId,
        action,
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to toggle zones');
    }
  }
);

// // Update Zone Settings Thunk
// export const updateZoneSettings = createAsyncThunk(
//   "heatmap/updateZoneSettings",
//   async ({ zoneId, brightness, fadeTime, delayTime }) => {
//     const response = await BaseUrl.patch(`/area/zone_update`, {
//       zone_id: zoneId,
//       brightness,
//       fade_time: fadeTime,
//       delay_time: delayTime,
//     });
//     return response.data;
//   }
// );

export const updateZonesByArea = createAsyncThunk(
  "heatmap/updateZonesByArea",
  async ({ areaId, zones }, { rejectWithValue }) => {
    try {
      const response = await BaseUrl.post(`/area/zone_update`, {

        area_id: areaId,
        zones,
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to update zones');
    }
  }
);

// --- SCENE ACTIVATION THUNK (CORRECT ENDPOINT) ---
export const updateAreaScene = createAsyncThunk(
  'heatmap/updateAreaScene',
  async ({ area_id, scene_code }, { rejectWithValue }) => {
    try {
      const response = await BaseUrl.post(`/area/scene_activate`, {
        area_id,
        scene_code,
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to update area scene');
    }
  }
);

const formatRenameAreaError = (err) => {
  const detail = err.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const parts = detail.map((item) => item?.msg || JSON.stringify(item));
    return parts.filter(Boolean).join("; ") || err.message;
  }
  return err.response?.data?.message || err.message || "Failed to rename area";
};

export const renameArea = createAsyncThunk(
  "heatmap/renameArea",
  async ({ area_id, new_name }, { rejectWithValue }) => {
    try {
      const response = await BaseUrl.post("/area/rename", {
        area_id,
        new_name,
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(formatRenameAreaError(err));
    }
  }
);

// Add a new thunk for base floor data (without light status)
export const fetchBaseFloorData = createAsyncThunk(
  "heatmap/fetchBaseFloorData",
  async ({ floorId }) => {
    // This should call a different endpoint that only returns floor plan and area coordinates
    // without light status data
    const response = await BaseUrl.get(`/floor/get/${floorId}`);
    return response.data;
  }
);

// Thunk to refresh all data for a floor and optionally an area
export const refreshAllHeatmapData = createAsyncThunk(
  'heatmap/refreshAllHeatmapData',
  async ({ floorId, areaId = null, displayMode = 'Light' }, { dispatch, rejectWithValue }) => {
    try {
      if (displayMode === 'Occupancy') {
        await dispatch(fetchAreaOccupancyStatus({ floorId }));
      } else if (displayMode === 'Energy') {
        await dispatch(fetchAreaEnergyConsumption({ floorId }));
      } else {
        await dispatch(fetchFloorMapData({ floorId })).unwrap();
      }

      if (areaId) {
        await dispatch(fetchAreaStatus(areaId));
      }

      return { success: true };
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to refresh heatmap data');
    }
  }
);

// Initial State
const initialState = {
  selectedFloorId: null,
  displayMode: "Light",
  searchTerm: "",
  heatmapData: { areas: [] },
  pdfUrl: null,
  loading: false,
  error: null,
  areaStatus: null,
  areaStatusLoading: false,
  areaStatusError: null,
  areaStatusFetchingId: null,
  floorMapFetchingId: null,
  occupancyFetchingId: null,
  energyFetchingId: null,
  toggleAllZonesLoading: false,
  toggleAllZonesError: null,
};

// Slice
const heatmapSlice = createSlice({
  name: "heatmap",
  initialState,
  reducers: {
    setSelectedFloorId: (state, action) => {
      state.selectedFloorId = action.payload;
    },
    setDisplayMode: (state, action) => {
      state.displayMode = action.payload;
    },
    setHeatmapSearchTerm: (state, action) => { // added
      state.searchTerm = (action.payload ?? "").toString();
    },
    clearHeatmapData: (state) => {
      state.heatmapData = { areas: [] };
      state.pdfUrl = null;
      state.loading = false;
      state.error = null;
    },
    clearUserData: (state) => {
      // Clear all user-specific data when user logs out
      state.selectedFloorId = null;
      state.displayMode = "Light";
      state.searchTerm = "";
      state.heatmapData = { areas: [] };
      state.pdfUrl = null;
      state.areaStatus = null;
      state.areaStatusLoading = false;
      state.areaStatusError = null;
      state.areaStatusFetchingId = null;
      state.floorMapFetchingId = null;
      state.occupancyFetchingId = null;
      state.energyFetchingId = null;
      state.toggleAllZonesLoading = false;
      state.toggleAllZonesError = null;
      state.loading = false;
      state.error = null;
    },
    optimisticallyUpdateAreaStatus(state, action) {
      const { areaId, updatedZones } = action.payload;
      if (state.areaStatus && state.areaStatus.area_id === areaId) {
        state.areaStatus.zones = updatedZones;
      }
      if (state.heatmapData && Array.isArray(state.heatmapData.areas)) {
        const area = state.heatmapData.areas.find(a => (a.area_id || a.id) === areaId);
        if (area) {
          // optional: update area fields
        }
      }
    }
  },
  extraReducers: (builder) => {
    // LIGHT STATUS
    builder
      .addCase(fetchFloorMapData.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.floorMapFetchingId = action.meta.arg?.floorId ?? null;
      })
      .addCase(fetchFloorMapData.fulfilled, (state, action) => {
        const areas = (action.payload.areas || []).map((area) => {
          const rawLevel = area.light_level;
          let light_level = null;
          if (rawLevel !== null && rawLevel !== undefined && rawLevel !== "") {
            const levelRaw = Number(rawLevel);
            if (Number.isFinite(levelRaw)) {
              light_level = Math.max(0, Math.min(100, Math.round(levelRaw)));
            }
          }
          return {
            ...area,
            coordinates: area["co-ordinates"] || area.coordinates || [],
            area_id: area.id, // Always set area_id
            id: area.id,      // Always set id
            light_status: (area.light_status || '').toLowerCase().trim(),
            light_level,
            processor_reachable: area.processor_reachable !== false,
          };
        });
        
        state.heatmapData = { ...action.payload, areas };
        patchOpenAreaLiveLightOccupancy(state, areas);
      
        const rawPath = action.payload.floor_plan || action.payload.floor_image || "";
        state.pdfUrl = resolveFloorPlanMediaUrl(rawPath);
      
        state.loading = false;
        state.floorMapFetchingId = null;
      })
      .addCase(fetchFloorMapData.rejected, (state, action) => {
        state.loading = false;
        state.floorMapFetchingId = null;
        state.error = action.payload || action.error?.message || 'Failed to load floor plan';
        state.pdfUrl = null;
        state.heatmapData = { areas: [] };
      });

    // OCCUPANCY STATUS
    builder
      .addCase(fetchAreaOccupancyStatus.pending, (state, action) => {
        state.occupancyFetchingId = action.meta.arg?.floorId ?? null;
      })
      .addCase(fetchAreaOccupancyStatus.fulfilled, (state, action) => {
      state.occupancyFetchingId = null;
      const updatedAreas = (action.payload.areas || []).map(a => ({
        ...a,
        area_id: a.area_id || a.id // fallback to id if area_id is missing
      }));
      if (state.heatmapData && state.heatmapData.areas && updatedAreas.length) {
        state.heatmapData.areas = state.heatmapData.areas.map(area => {
          const updated = updatedAreas.find(
            a => areaIdsMatch(area, a.area_id ?? a.id)
          );
          if (!updated) return area;
          const occ =
            normalizeOccupancyStatus(updated.occupancy_status) ||
            updated.occupancy_status;
          return {
            ...area,
            occupancy_status: occ
              ? String(occ).toLowerCase().trim()
              : area.occupancy_status,
            processor_reachable:
              updated.processor_reachable === false
                ? false
                : area.processor_reachable,
          };
        });
        patchOpenAreaLiveLightOccupancy(state, updatedAreas);
      }
    })
      .addCase(fetchAreaOccupancyStatus.rejected, (state) => {
        state.occupancyFetchingId = null;
      });

    // Update the ENERGY STATUS handler to include the new fields
    builder
      .addCase(fetchAreaEnergyConsumption.pending, (state, action) => {
        state.energyFetchingId = action.meta.arg?.floorId ?? null;
      })
      .addCase(fetchAreaEnergyConsumption.fulfilled, (state, action) => {
      state.energyFetchingId = null;
      const energyAreas = action.payload.areas || [];
      
      
      // The energy API returns areas with instantaneous_power, instantaneous_max_power, and load_percentage
      // Update existing areas with energy status by matching area codes
      if (state.heatmapData && state.heatmapData.areas) {
        state.heatmapData.areas = state.heatmapData.areas.map((area) => {
          // Find matching energy area by code or name
          const matchingEnergyArea = energyAreas.find(energyArea => 
            energyArea.code === area.code || 
            energyArea.name === area.name ||
            energyArea.id === (area.area_id || area.id)
          );
          
          
          if (matchingEnergyArea) {
            const updatedArea = {
              ...area,
              // Update with new energy fields
              instantaneous_power: matchingEnergyArea.instantaneous_power,
              instantaneous_max_power: matchingEnergyArea.instantaneous_max_power,
              load_percentage: matchingEnergyArea.load_percentage,
              // Keep backward compatibility
              energy_status: matchingEnergyArea.instantaneous_power,
              area_id: area.area_id || area.id,
              id: area.id,
            };
            
            return updatedArea;
          }
          
          return area;
        });
        
      }
    })
      .addCase(fetchAreaEnergyConsumption.rejected, (state) => {
        state.energyFetchingId = null;
      });

    // FULL AREA STATUS
    builder
      .addCase(fetchAreaStatus.pending, (state, action) => {
        const request = normalizeAreaStatusRequest(action.meta.arg);
        const requestedAreaId = request.areaId;
        const silent = Boolean(request.silent);
        state.areaStatusLoading = !silent;
        state.areaStatusError = null;
        state.areaStatusFetchingId = requestedAreaId;
        // Keep sidebar for same-area retry; clear only when switching areas.
        if (
          !state.areaStatus ||
          String(state.areaStatus.area_id) !== String(requestedAreaId)
        ) {
          if (!silent) {
            state.areaStatus = null;
          }
        }
      })
      .addCase(fetchAreaStatus.fulfilled, (state, action) => {
        const request = normalizeAreaStatusRequest(action.meta.arg);
        const preserveEnergy = Boolean(request.preserveEnergy);
        const previousAreaStatus = state.areaStatus;
        const sameArea =
          previousAreaStatus &&
          String(previousAreaStatus.area_id) === String(action.payload?.area_id);
        state.areaStatusLoading = false;
        state.areaStatusFetchingId = null;

        const normalizedOcc =
          normalizeOccupancyStatus(action.payload?.occupancy_status) ||
          action.payload?.occupancy_status ||
          "Unknown";
        const payload = action.payload
          ? { ...action.payload, occupancy_status: normalizedOcc }
          : action.payload;

        const areaStatusPayload = keepSidebarZonesIfIncomingEmpty(
          previousAreaStatus,
          payload?.zones?.length > 0
            ? { ...payload, light_status: sidebarLightStatusFromPayload(payload) }
            : payload
        );

        state.areaStatus =
          preserveEnergy && sameArea
            ? {
                ...areaStatusPayload,
                consumption:
                  previousAreaStatus?.consumption ?? areaStatusPayload?.consumption,
                savings: previousAreaStatus?.savings ?? areaStatusPayload?.savings,
              }
            : areaStatusPayload;

        const payloadAreaId = areaStatusPayload?.area_id;
        if (payloadAreaId != null && state.heatmapData?.areas) {
          state.heatmapData.areas = state.heatmapData.areas.map((area) =>
            areaIdsMatch(area, payloadAreaId)
              ? {
                  ...area,
                  occupancy_status: String(normalizedOcc || "")
                    .toLowerCase()
                    .trim(),
                  energy_status: preserveEnergy
                    ? area.energy_status
                    : area.energy_status !== undefined
                      ? area.energy_status
                      : areaStatusPayload.energy_status,
                  energy_consumption: preserveEnergy
                    ? area.energy_consumption
                    : areaStatusPayload.consumption,
                  energy_savings: preserveEnergy
                    ? area.energy_savings
                    : areaStatusPayload.savings,
                }
              : area
          );
          state.heatmapData.areas = patchAreasLightFromSidebar(
            state.heatmapData.areas,
            payloadAreaId,
            areaStatusPayload
          );
        }
      })
      .addCase(fetchAreaStatus.rejected, (state, action) => {
        state.areaStatusLoading = false;
        state.areaStatusFetchingId = null;
        state.areaStatusError =
          action.payload || action.error.message || "Failed to fetch area status";
      });

    // Toggle all zones in area
    builder
      .addCase(toggleAllZonesInArea.pending, (state) => {
        state.toggleAllZonesLoading = true;
        state.toggleAllZonesError = null;
      })
      .addCase(toggleAllZonesInArea.fulfilled, (state, action) => {
        state.toggleAllZonesLoading = false;
        if (
          state.areaStatus &&
          action.payload &&
          action.payload.area_id === state.areaStatus.area_id
        ) {
          state.areaStatus.light_status =
            action.payload.light_status || state.areaStatus.light_status;
        }
        if (state.heatmapData?.areas && action.payload?.area_id != null) {
          const patchPayload = {
            area_id: action.payload.area_id,
            light_status: action.payload.light_status,
            zones: state.areaStatus?.zones,
          };
          state.heatmapData.areas = patchAreasLightFromSidebar(
            state.heatmapData.areas,
            action.payload.area_id,
            patchPayload
          );
        }
      })
      .addCase(toggleAllZonesInArea.rejected, (state, action) => {
        state.toggleAllZonesLoading = false;
        state.toggleAllZonesError = action.payload || action.error.message;
      });

    // Update area light status
    builder
      .addCase(updateAreaLightStatus.pending, (state) => {
        // Set loading state if needed
      })
      .addCase(updateAreaLightStatus.fulfilled, (state, action) => {
        if (
          state.areaStatus &&
          action.payload &&
          action.payload.area_id === state.areaStatus.area_id
        ) {
          state.areaStatus.light_status =
            action.payload.light_status || state.areaStatus.light_status;
        }
        if (state.heatmapData?.areas && action.payload?.area_id != null) {
          const patchPayload = {
            area_id: action.payload.area_id,
            light_status: action.payload.light_status,
            zones: state.areaStatus?.zones,
          };
          state.heatmapData.areas = patchAreasLightFromSidebar(
            state.heatmapData.areas,
            action.payload.area_id,
            patchPayload
          );
        }
      })
      .addCase(updateAreaLightStatus.rejected, (state, action) => {
        // Handle error if needed
      });

    // Update area scene
    builder
      .addCase(updateAreaScene.pending, (state) => {
        // Set loading state if needed
      })
      .addCase(updateAreaScene.fulfilled, (state, action) => {
        // Update areaStatus if it exists and matches the updated area
        if (state.areaStatus && action.payload && action.payload.area_id === state.areaStatus.area_id) {
          state.areaStatus.active_scene = action.payload.active_scene || state.areaStatus.active_scene;
        }
        // Update heatmapData areas if they exist
        if (state.heatmapData && state.heatmapData.areas) {
          state.heatmapData.areas = state.heatmapData.areas.map(area => {
            if (action.payload && areaIdsMatch(area, action.payload.area_id)) {
              return {
                ...area,
                active_scene: action.payload.active_scene || area.active_scene,
              };
            }
            return area;
          });
        }
      })
      .addCase(updateAreaScene.rejected, (state, action) => {
        // Handle error if needed
      });

    builder.addCase(renameArea.fulfilled, (state, action) => {
      const payload = action.payload;
      if (!payload || payload.area_id == null || !payload.name) return;
      const { area_id: renamedId, name } = payload;
      if (state.areaStatus && state.areaStatus.area_id === renamedId) {
        state.areaStatus.area_name = name;
      }
      if (state.heatmapData?.areas?.length) {
        state.heatmapData.areas = state.heatmapData.areas.map((area) =>
          (area.area_id || area.id) === renamedId
            ? { ...area, name, area_name: name }
            : area
        );
      }
    });

    // Update zones by area
    builder
      .addCase(updateZonesByArea.pending, (state) => {
        // Set loading state if needed
      })
      .addCase(updateZonesByArea.fulfilled, (state, action) => {
        // Update areaStatus if it exists and matches the updated area
        if (state.areaStatus && action.payload && action.payload.area_id === state.areaStatus.area_id) {
          // Update zones in areaStatus if the response includes updated zones
          if (action.payload.zones) {
            state.areaStatus.zones = action.payload.zones;
          }
        }
        // Update heatmapData areas if they exist
        if (state.heatmapData && state.heatmapData.areas) {
          state.heatmapData.areas = state.heatmapData.areas.map(area => {
            if (action.payload && areaIdsMatch(area, action.payload.area_id)) {
              return {
                ...area,
                // Update any relevant fields from the response
                ...action.payload,
              };
            }
            return area;
          });
        }
      })
      .addCase(updateZonesByArea.rejected, (state, action) => {
        // Handle error if needed
      });

    builder
      .addCase(refreshAllHeatmapData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(refreshAllHeatmapData.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(refreshAllHeatmapData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });

    builder
      .addCase(applyHeatmapFloorLightLive, (state, action) => {
        mergeHeatmapFloorLightLive(state, action.payload);
        // Stale floor cache (live=0) must not re-yellow an open area that live=1 set Off/0%.
        reassertOpenAreaLightFromSidebar(state);
      })
      .addCase(applyHeatmapFloorOccupancyLive, (state, action) => {
        mergeHeatmapFloorOccupancyLive(state, action.payload);
      })
      .addCase(applyHeatmapAreaStatusLive, (state, action) => {
        const incoming = action.payload;
        // A live=1 read is already on its way for this area; it wins over cache.
        if (isAreaAwaitingLiveRead(state, incoming?.area_id)) return;

        const previousAreaStatus = state.areaStatus;
        const staleVsLive = isCacheLightStaleVsPreferred(
          previousAreaStatus,
          incoming
        );

        mergeHeatmapAreaStatusLive(state, incoming);

        if (
          staleVsLive &&
          previousAreaStatus &&
          state.areaStatus &&
          String(state.areaStatus.area_id) === String(previousAreaStatus.area_id)
        ) {
          // Keep live=1 Off/0% zones + light; only accept occupancy/energy from cache push.
          state.areaStatus = {
            ...state.areaStatus,
            light_status:
              sidebarLightStatusFromPayload(previousAreaStatus) ||
              previousAreaStatus.light_status,
            zones: previousAreaStatus.zones,
          };
        }

        const patchPayload = state.areaStatus;
        if (patchPayload?.area_id != null && state.heatmapData?.areas) {
          state.heatmapData.areas = patchAreasLightFromSidebar(
            state.heatmapData.areas,
            patchPayload.area_id,
            patchPayload
          );
        }
      });
  },
});

// Actions
export const {
  setSelectedFloorId,
  setDisplayMode,
  setHeatmapSearchTerm, // added
  clearHeatmapData,
  clearUserData,
  optimisticallyUpdateAreaStatus,
} = heatmapSlice.actions;

// Selectors
export const selectSelectedFloorId = (state) => state.heatmap.selectedFloorId;
export const selectDisplayMode = (state) => state.heatmap.displayMode;
export const selectHeatmapData = (state) => state.heatmap.heatmapData;
export const selectPdfUrl = (state) => state.heatmap.pdfUrl;
export const selectHeatmapLoading = (state) => state.heatmap.loading;
export const selectHeatmapError = (state) => state.heatmap.error;
export const selectAreaStatus = (state) => state.heatmap.areaStatus;
export const selectAreaStatusLoading = (state) => state.heatmap.areaStatusLoading;
export const selectAreaStatusError = (state) => state.heatmap.areaStatusError;
export const selectAreaStatusFetchingId = (state) => state.heatmap.areaStatusFetchingId;
export const selectToggleAllZonesLoading = (state) => state.heatmap.toggleAllZonesLoading;
export const selectToggleAllZonesError = (state) => state.heatmap.toggleAllZonesError;
export const selectHeatmapSearchTerm = (state) => state.heatmap.searchTerm; // added

// Reducer
export default heatmapSlice.reducer;


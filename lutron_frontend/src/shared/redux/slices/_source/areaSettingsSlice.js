import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { BaseUrl } from '../../../../BaseUrl';
import axios from "axios";

// Thunk to fetch area settings (scenes, zones, etc.)
// export const fetchAreaSettings = createAsyncThunk(
//   'areaSettings/fetchAreaSettings',
//   async (areaId, { rejectWithValue }) => {
//     try {
//       const response = await BaseUrl.get(`/area/${areaId}/settings`);
//       return response.data;
//     } catch (err) {
//       return rejectWithValue(null);
//     }
//   }
// );

// Fetch Device Lock Status (POST with area_id)
export const fetchLockStatus = createAsyncThunk(
  'areaSettings/fetchLockStatus',
  async (areaId, { rejectWithValue }) => {
    try {
      const response = await BaseUrl.post('/setting/button_status', { area_id: areaId });
      const device = response.data?.devices?.[0];
      return {
        locked: device?.status === "Locked",
        buttoncode: device?.button_id
      };
    } catch (err) {
      return rejectWithValue(null);
    }
  }
);

// Update Device Lock Status (POST with area_id, buttoncode)
export const updateLockStatus = createAsyncThunk(
  'areaSettings/updateLockStatus',
  async ({ area_id, buttoncode }, { rejectWithValue }) => {
    try {
      const response = await BaseUrl.post('/setting/button_update', { area_id, buttoncode });
      const device = response.data?.devices?.[0];
      return {
        locked: device?.status === "Locked",
        buttoncode: device?.button_id
      };
    } catch (err) {
      return rejectWithValue(null);
    }
  }
);

// Fetch Occupancy Mode for an area
export const fetchOccupancyMode = createAsyncThunk(
  'areaSettings/fetchOccupancyMode',
  async (areaId, { rejectWithValue }) => {
    try {
      const res = await BaseUrl.get(`/area/occupancy_setting/${areaId}`);
      // The backend returns { status: "success", area_id: ..., active_mode: "Auto" }
      return res.data.active_mode;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error");
    }
  }
);

// Update Occupancy Mode for an area
export const updateOccupancyMode = createAsyncThunk(
  'areaSettings/updateOccupancyMode',
  async ({ areaId, mode }, { rejectWithValue }) => {
    try {
      await BaseUrl.post('/occupancy/update_setting', {
        area_id: areaId,
        occupancy_mode: mode,
      });
      // After update, fetch the new mode
      // const res = await BaseUrl.get(`/area/occupancy/${areaId}`);
      // return res.data.active_mode;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error");
    }
  }
);

// 5. Fetch Scenes (GET, update endpoint as needed)
export const fetchEditScenes = createAsyncThunk(
  'areaSettings/fetchEditScenes',
  async (areaId, { rejectWithValue }) => {
    try {
      const response = await BaseUrl.get(`/area/${areaId}/scenes`);
      return response.data; // { scenes: [...] }
    } catch (err) {
      return rejectWithValue(null);
    }
  }
);

// 6. Update Scene (POST, update endpoint as needed)
export const updateScene = createAsyncThunk(
  'areaSettings/updateScene',
  async ({ area_id, scene_id, data }, { rejectWithValue }) => {
    try {
      const response = await BaseUrl.post(`/area/${area_id}/scenes/${scene_id}/update`, data);
      return response.data;
    } catch (err) {
      return rejectWithValue(null);
    }
  }
);

// Thunk to fetch area scenes
export const fetchAreaScenes = createAsyncThunk(
  'areaSettings/fetchAreaScenes',
  async (areaId, { rejectWithValue }) => {
    try {
      const res = await BaseUrl.post('/area/scene_list', { area_id: areaId });
      // The backend returns { area_scenes: [...] }
      return res.data.area_scenes || [];
    } catch (err) {
      return rejectWithValue("Failed to fetch scenes from processor");
    }
  }
);

// Fetch scene status (POST)
export const fetchSceneStatus = createAsyncThunk(
  'areaSettings/fetchSceneStatus',
  async ({ areaId, sceneId }, { rejectWithValue }) => {
    try {
      const res = await BaseUrl.post('/setting/scene_status', {
        area_id: Number(areaId),
        scene_id: Number(sceneId)
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error");
    }
  }
);

// Edit scene (POST)
export const editScene = createAsyncThunk(
  'areaSettings/editScene',
  async ({ areaId, sceneId, details }, { rejectWithValue }) => {
    try {
      const payload = {
        area_id: areaId,
        details,
      };
      if (sceneId !== undefined && sceneId !== null) {
        payload.scene_id = sceneId;
      } else {
        payload.scene_code = sceneId;
      }
      const res = await BaseUrl.post('/setting/edit', payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error");
    }
  }
);

// Fetch tuning settings (zone-wise trims) for a given area
export const fetchTunningSettings = createAsyncThunk(
  'areaSettings/fetchTunningSettings',
  async (areaId, { rejectWithValue }) => {
    try {
      const res = await BaseUrl.get('/area/tunning_settings', {
        params: { area_id: Number(areaId) },
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message || 'Failed to fetch tuning settings');
    }
  }
);

// Update processor tunings for one zone (POST supports partial trim updates)
export const updateZoneTuning = createAsyncThunk(
  'areaSettings/updateZoneTuning',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await BaseUrl.post('/area/zone_tuning_update', payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message || 'Failed to update zone tuning');
    }
  }
);

const initialMockData = {
  locked: false,
  scenes: [
    {
      id: "1",
      name: "Scene 1",
      zones: [
        {
          id: 1, name: "Downlight", type: "whitetune", brightness: 40, cct: 4000,
          brightnessMin: 0, brightnessMax: 100, cctMin: 2700, cctMax: 6500,
          fadeTime: "02", delayTime: "00"
        },
        {
          id: 2, name: "Front Row", type: "dimmed", brightness: 60,
          brightnessMin: 0, brightnessMax: 100, fadeTime: "02", delayTime: "00"
        }
      ]
    },
    {
      id: "2",
      name: "Scene 2",
      zones: [
        { id: 3, name: "Switch Zone", type: "switched", on: true }
      ]
    }
  ]
};

const areaSettingsSlice = createSlice({
  name: 'areaSettings',
  initialState: {
    data: null,
    loading: false,
    error: null,
    lockLoading: false,
    lockError: null,
    locked: false,
    buttoncode: null,
    occupancyMode: "",
    occupancyLoading: false,
    scenes: [],
    scenesLoading: false,
    areaScenes: [],
    activeScene: null,
    sceneStatus: [],
    sceneStatusLoading: false,
    editSceneLoading: false,

    // Zone-wise tuning settings (trims)
    tunningSettings: null,
    tunningSettingsLoading: false,
    zoneTuningUpdateLoading: false,
    zoneTuningUpdateError: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
     
      .addCase(fetchLockStatus.pending, (state) => {
        state.lockLoading = true;
        state.lockError = null;
      })
      .addCase(fetchLockStatus.fulfilled, (state, action) => {
        state.lockLoading = false;
        state.locked = action.payload?.locked ?? false;
        state.buttoncode = action.payload?.buttoncode ?? null;
      })
      .addCase(fetchLockStatus.rejected, (state) => {
        state.lockLoading = false;
      })
      .addCase(updateLockStatus.pending, (state) => {
        state.lockLoading = true;
        state.lockError = null;
      })
      .addCase(updateLockStatus.fulfilled, (state, action) => {
        state.lockLoading = false;
        state.locked = action.payload?.locked ?? false;
        state.buttoncode = action.payload?.buttoncode ?? null;
      })
      .addCase(updateLockStatus.rejected, (state) => {
        state.lockLoading = false;
      })
      .addCase(fetchOccupancyMode.pending, (state) => {
        state.occupancyLoading = true;
      })
      .addCase(fetchOccupancyMode.fulfilled, (state, action) => {
        state.occupancyLoading = false;
        state.occupancyMode = action.payload || "";
      })
      .addCase(fetchOccupancyMode.rejected, (state) => {
        state.occupancyLoading = false;
      })
      .addCase(updateOccupancyMode.pending, (state) => {
        state.occupancyLoading = true;
      })
      .addCase(updateOccupancyMode.fulfilled, (state, action) => {
        state.occupancyLoading = false;
        state.occupancyMode = action.payload || "";
      })
      .addCase(updateOccupancyMode.rejected, (state) => {
        state.occupancyLoading = false;
      })
      .addCase(fetchEditScenes.pending, (state) => {
        state.scenesLoading = true;
      })
      .addCase(fetchEditScenes.fulfilled, (state, action) => {
        state.scenesLoading = false;
        state.scenes = action.payload?.scenes ?? [];
      })
      .addCase(fetchEditScenes.rejected, (state) => {
        state.scenesLoading = false;
      })
      .addCase(fetchAreaScenes.pending, (state) => {
        state.scenesLoading = true;
      })
      .addCase(fetchAreaScenes.fulfilled, (state, action) => {
        state.scenesLoading = false;
        state.areaScenes = action.payload;
      })
      .addCase(fetchAreaScenes.rejected, (state, action) => {
        state.scenesLoading = false;
        state.areaScenes = [];
        state.scenesError = action.payload || "Error fetching scenes";
      })
      .addCase(fetchSceneStatus.pending, (state) => {
        state.sceneStatusLoading = true;
      })
      .addCase(fetchSceneStatus.fulfilled, (state, action) => {
        state.sceneStatusLoading = false;
        state.sceneStatus = action.payload.details || [];
      })
      .addCase(fetchSceneStatus.rejected, (state) => {
        state.sceneStatusLoading = false;
        state.sceneStatus = [];
      })
      .addCase(editScene.pending, (state) => {
        state.editSceneLoading = true;
      })
      .addCase(editScene.fulfilled, (state) => {
        state.editSceneLoading = false;
      })
      .addCase(editScene.rejected, (state) => {
        state.editSceneLoading = false;
      });

    builder
      .addCase(fetchTunningSettings.pending, (state) => {
        state.tunningSettingsLoading = true;
        state.zoneTuningUpdateError = null;
        state.tunningSettings = null;
      })
      .addCase(fetchTunningSettings.fulfilled, (state, action) => {
        state.tunningSettingsLoading = false;
        state.tunningSettings = action.payload || null;
      })
      .addCase(fetchTunningSettings.rejected, (state, action) => {
        state.tunningSettingsLoading = false;
        state.zoneTuningUpdateError = action.payload || 'Error fetching tuning settings';
        state.tunningSettings = null;
      })
      .addCase(updateZoneTuning.pending, (state) => {
        state.zoneTuningUpdateLoading = true;
        state.zoneTuningUpdateError = null;
      })
      .addCase(updateZoneTuning.fulfilled, (state) => {
        state.zoneTuningUpdateLoading = false;
      })
      .addCase(updateZoneTuning.rejected, (state, action) => {
        state.zoneTuningUpdateLoading = false;
        state.zoneTuningUpdateError = action.payload || 'Error updating zone tuning';
      });
  },
});

export default areaSettingsSlice.reducer;

export const selectAreaSettings = createSelector(
  [(state) => state?.areaSettings?.data],
  (data) => data ?? {}
);
export const selectAreaSettingsLoading = (state) => state?.areaSettings?.loading ?? false;
export const selectAreaSettingsLockLoading = (state) => state?.areaSettings?.lockLoading ?? false;

// Memoized selectors to prevent unnecessary re-renders
export const selectLockStatus = createSelector(
  [(state) => state?.areaSettings?.locked, (state) => state?.areaSettings?.buttoncode, (state) => state?.areaSettings?.lockLoading],
  (locked, buttoncode, loading) => ({
    locked: locked ?? false,
    buttoncode: buttoncode ?? null,
    loading: loading ?? false,
  })
);

export const selectOccupancy = createSelector(
  [(state) => state?.areaSettings?.occupancyMode, (state) => state?.areaSettings?.occupancyLoading],
  (mode, loading) => ({
    mode: mode ?? '',
    loading: loading ?? false,
  })
);

export const selectScenes = createSelector(
  [(state) => state?.areaSettings?.scenes, (state) => state?.areaSettings?.scenesLoading],
  (scenes, loading) => ({
    scenes: scenes ?? [],
    loading: loading ?? false,
  })
);

export const selectAreaScenes = (state) => state.areaSettings.areaScenes;

export const selectSceneStatus = createSelector(
  [(state) => state.areaSettings.sceneStatus, (state) => state.areaSettings.sceneStatusLoading],
  (details, loading) => ({
    details,
    loading,
  })
);

export const selectEditSceneLoading = (state) => state.areaSettings.editSceneLoading;

export const selectTunningSettings = (state) => state?.areaSettings?.tunningSettings ?? null;
export const selectTunningSettingsLoading = (state) => state?.areaSettings?.tunningSettingsLoading ?? false;
export const selectZoneTuningUpdateLoading = (state) => state?.areaSettings?.zoneTuningUpdateLoading ?? false;
export const selectZoneTuningUpdateError = (state) => state?.areaSettings?.zoneTuningUpdateError ?? null;

export const selectTunningZones = (state) => state?.areaSettings?.tunningSettings?.zones ?? [];

export const selectHasKeypad = (state) => {
  const devices = state?.areaSettings?.data?.devices || [];
  return devices.some(device => device.type === "keypad");
};
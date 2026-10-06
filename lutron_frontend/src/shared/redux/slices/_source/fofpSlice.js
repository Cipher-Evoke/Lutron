/**
 * FOFP (Floor Overlay / Floorplan Positioning) admin slice.
 *
 * Exclusively talks to the new /fofp/* endpoints. Does NOT mutate or read any
 * existing floor/occupancy/energy slice state. All slice fields are local to
 * `state.fofp` so existing pages remain unaffected.
 */

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { BaseUrl } from "../../../BaseUrl";
import {
  DEFAULT_FOFP_MARKER_COLOR,
  normalizeFofpHex,
} from "../../../screens/heatmap/fofpColorUtils";

const formatFofpApiError = (err, fallback) => {
  if (err?.response?.data?.detail) {
    const d = err.response.data.detail;
    return typeof d === "string" ? d : JSON.stringify(d);
  }
  if (err?.response?.data?.message) {
    return String(err.response.data.message);
  }
  const msg = err?.message || "";
  if (
    msg === "Network Error" ||
    msg.includes("ERR_CONNECTION_REFUSED") ||
    msg.includes("ECONNREFUSED")
  ) {
    const base = process.env.REACT_APP_API_URL || "http://localhost:8000";
    return `Cannot reach the API at ${base}. Start the backend server and click Retry.`;
  }
  if (msg === "Redirect in progress" || msg.includes("authentication token")) {
    return "Session expired. Please sign in again.";
  }
  return msg || fallback;
};

const extractDetail = (err, fallback) => formatFofpApiError(err, fallback);

// -------------------- thunks --------------------

export const fetchFofpLayout = createAsyncThunk(
  "fofp/fetchLayout",
  async (floorId, { rejectWithValue }) => {
    if (!floorId) return rejectWithValue("floor_id is required");
    try {
      const res = await BaseUrl.get(`/fofp/layout/${floorId}`);
      return {
        floor_id: res?.data?.floor_id ?? Number(floorId),
        positions: Array.isArray(res?.data?.positions) ? res.data.positions : [],
      };
    } catch (err) {
      return rejectWithValue(extractDetail(err, "Failed to load FOFP layout"));
    }
  }
);

export const generateFofpLayout = createAsyncThunk(
  "fofp/generateLayout",
  async (floorId, { rejectWithValue }) => {
    if (!floorId) return rejectWithValue("floor_id is required");
    try {
      const res = await BaseUrl.post("/fofp/generate-layout", {
        floor_id: Number(floorId),
      });
      return {
        generated: Number(res?.data?.generated || 0),
        skipped: Number(res?.data?.skipped || 0),
        failed: Number(res?.data?.failed || 0),
      };
    } catch (err) {
      return rejectWithValue(extractDetail(err, "Failed to generate FOFP layout"));
    }
  }
);

export const fetchFofpConfig = createAsyncThunk(
  "fofp/fetchConfig",
  async (_, { rejectWithValue }) => {
    try {
      const res = await BaseUrl.get("/fofp/config");
      return res?.data || {};
    } catch (err) {
      return rejectWithValue(extractDetail(err, "Failed to load FOFP config"));
    }
  }
);

export const updateFofpConfig = createAsyncThunk(
  "fofp/updateConfig",
  async (patch, { rejectWithValue }) => {
    if (!patch || typeof patch !== "object") {
      return rejectWithValue("Invalid config patch");
    }
    try {
      const res = await BaseUrl.put("/fofp/config", patch);
      return res?.data || {};
    } catch (err) {
      return rejectWithValue(extractDetail(err, "Failed to update FOFP config"));
    }
  }
);

export const saveFofpLayout = createAsyncThunk(
  "fofp/saveLayout",
  async ({ floorId, positions }, { rejectWithValue }) => {
    if (!floorId) return rejectWithValue("floor_id is required");
    if (!Array.isArray(positions)) {
      return rejectWithValue("positions must be an array");
    }
    try {
      const res = await BaseUrl.put("/fofp/layout", {
        floor_id: Number(floorId),
        positions: positions.map((p) => {
          const out = {
            zone_id: Number(p.zone_id),
            area_id: Number(p.area_id),
            x: Number(p.x),
            y: Number(p.y),
          };
          if (p.marker_shape != null && String(p.marker_shape).trim()) {
            out.marker_shape = String(p.marker_shape).trim().toLowerCase();
          }
          if (p.shape_size != null) {
            out.shape_size = Number(p.shape_size);
          }
          if (p.shape_size_x != null) {
            out.shape_size_x = Number(p.shape_size_x);
          }
          if (p.shape_size_y != null) {
            out.shape_size_y = Number(p.shape_size_y);
          }
          return out;
        }),
      });
      return {
        updated: Number(res?.data?.updated || 0),
        created: Number(res?.data?.created || 0),
      };
    } catch (err) {
      return rejectWithValue(extractDetail(err, "Failed to save FOFP layout"));
    }
  }
);

// -------------------- slice --------------------

const initialState = {
  floorId: null,
  positions: [],

  loading: false,
  error: null,

  config: null,
  configLoading: false,
  configError: null,
  configSaving: false,
  previewMarkerColor: null,

  generating: false,
  generateError: null,
  lastGenerateResult: null,

  saving: false,
  saveError: null,
  lastSaveResult: null,
};

const fofpSlice = createSlice({
  name: "fofp",
  initialState,
  reducers: {
    clearFofpState: () => initialState,
    clearFofpErrors: (state) => {
      state.error = null;
      state.generateError = null;
      state.saveError = null;
    },
    setPreviewMarkerColor: (state, action) => {
      state.previewMarkerColor =
        typeof action.payload === "string" ? action.payload : null;
    },
    clearPreviewMarkerColor: (state) => {
      state.previewMarkerColor = null;
    },
    mergeFofpConfigFields: (state, action) => {
      if (!action.payload || typeof action.payload !== "object") return;
      state.config = {
        ...(state.config || {}),
        ...action.payload,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch
      .addCase(fetchFofpLayout.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.positions = [];
        const arg = action.meta.arg;
        state.floorId =
          arg != null && arg !== "" ? Number(arg) : null;
      })
      .addCase(fetchFofpLayout.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.floorId = action.payload.floor_id;
        state.positions = action.payload.positions;
      })
      .addCase(fetchFofpLayout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message || "Failed to load layout";
      })
      // generate
      .addCase(generateFofpLayout.pending, (state) => {
        state.generating = true;
        state.generateError = null;
      })
      .addCase(generateFofpLayout.fulfilled, (state, action) => {
        state.generating = false;
        state.generateError = null;
        state.lastGenerateResult = action.payload;
      })
      .addCase(generateFofpLayout.rejected, (state, action) => {
        state.generating = false;
        state.generateError =
          action.payload || action.error?.message || "Failed to generate layout";
      })
      // save
      .addCase(saveFofpLayout.pending, (state) => {
        state.saving = true;
        state.saveError = null;
      })
      .addCase(saveFofpLayout.fulfilled, (state, action) => {
        state.saving = false;
        state.saveError = null;
        state.lastSaveResult = action.payload;
      })
      .addCase(saveFofpLayout.rejected, (state, action) => {
        state.saving = false;
        state.saveError =
          action.payload || action.error?.message || "Failed to save layout";
      })
      // config
      .addCase(fetchFofpConfig.pending, (state) => {
        state.configLoading = true;
        state.configError = null;
      })
      .addCase(fetchFofpConfig.fulfilled, (state, action) => {
        state.configLoading = false;
        state.configError = null;
        state.config = {
          ...(state.config || {}),
          ...(action.payload || {}),
        };
      })
      .addCase(fetchFofpConfig.rejected, (state, action) => {
        state.configLoading = false;
        state.configError =
          action.payload || action.error?.message || "Failed to load config";
      })
      .addCase(updateFofpConfig.pending, (state) => {
        state.configSaving = true;
        state.configError = null;
      })
      .addCase(updateFofpConfig.fulfilled, (state, action) => {
        state.configSaving = false;
        state.configError = null;
        state.config = {
          ...(state.config || {}),
          ...(action.payload || {}),
        };
        state.previewMarkerColor = null;
      })
      .addCase(updateFofpConfig.rejected, (state, action) => {
        state.configSaving = false;
        state.configError =
          action.payload || action.error?.message || "Failed to update config";
      });
  },
});

export const {
  clearFofpState,
  clearFofpErrors,
  setPreviewMarkerColor,
  clearPreviewMarkerColor,
  mergeFofpConfigFields,
} = fofpSlice.actions;

export const selectFofpFloorId = (state) => state.fofp?.floorId ?? null;
export const selectFofpPositions = (state) => state.fofp?.positions ?? [];
export const selectFofpLoading = (state) => state.fofp?.loading ?? false;
export const selectFofpError = (state) => state.fofp?.error ?? null;
export const selectFofpGenerating = (state) => state.fofp?.generating ?? false;
export const selectFofpGenerateError = (state) => state.fofp?.generateError ?? null;
export const selectFofpLastGenerateResult = (state) =>
  state.fofp?.lastGenerateResult ?? null;
export const selectFofpSaving = (state) => state.fofp?.saving ?? false;
export const selectFofpSaveError = (state) => state.fofp?.saveError ?? null;
export const selectFofpLastSaveResult = (state) => state.fofp?.lastSaveResult ?? null;

export const selectFofpConfig = (state) => state.fofp?.config ?? null;
export const selectFofpConfigLoading = (state) => state.fofp?.configLoading ?? false;
export const selectFofpConfigSaving = (state) => state.fofp?.configSaving ?? false;
export const selectFofpConfigError = (state) => state.fofp?.configError ?? null;
export const selectFofpPreviewMarkerColor = (state) => state.fofp?.previewMarkerColor ?? null;

export const selectFofpEffectiveMarkerColor = (state) => {
  const preview = state.fofp?.previewMarkerColor;
  if (preview) return normalizeFofpHex(preview);
  const saved = state.fofp?.config?.marker_color;
  return normalizeFofpHex(saved || DEFAULT_FOFP_MARKER_COLOR);
};

export default fofpSlice.reducer;

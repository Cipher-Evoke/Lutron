import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { BaseUrl } from "../../../../BaseUrl";

const ALERT_TYPES_ORDER = [
  "Processor Not Responding",
  "Device Not Responding",
  "Ballast Failure",
  "Lamp Failure",
  "Other Warnings",
];

const normalizeType = (type) => (type ? String(type).toLowerCase() : "");

export const fetchAlertsDisplayStatus = createAsyncThunk(
  "alertsDisplay/fetchAlertsDisplayStatus",
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem("lutron");
    if (!token) return rejectWithValue("Not logged in");

    try {
      const res = await BaseUrl.get("/settings/alerts_display_status", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const toggles = res?.data?.toggles;
      if (!Array.isArray(toggles)) return rejectWithValue("Invalid API response");

      // Normalize just enough for stable UI mapping.
      const normalized = toggles
        .filter((t) => t && t.alert_type != null)
        .map((t) => ({
          alert_type: String(t.alert_type),
          display: Boolean(t.display),
        }));

      // Keep deterministic order for rendering: backend may return any order.
      const byType = new Map(normalized.map((t) => [normalizeType(t.alert_type), t]));
      return ALERT_TYPES_ORDER.map((type) => {
        const found = byType.get(normalizeType(type));
        return found || { alert_type: type, display: false };
      });
    } catch (e) {
      return rejectWithValue(
        e?.response?.data?.detail || e?.response?.data?.message || "Failed to load alert toggles"
      );
    }
  }
);

export const disableAlerts = createAsyncThunk(
  "alertsDisplay/disableAlerts",
  async ({ alert_type, display }, { rejectWithValue }) => {
    const token = localStorage.getItem("lutron");
    if (!token) return rejectWithValue("Not logged in");

    // Backend expects these exact fields.
    if (!alert_type) return rejectWithValue("alert_type is required");
    if (typeof display !== "boolean") return rejectWithValue("display must be boolean");

    try {
      const res = await BaseUrl.post(
        "/settings/disable_alerts",
        { alert_type, display },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Response is backend-specific; we only care that it succeeded.
      return res?.data ?? null;
    } catch (e) {
      return rejectWithValue(
        e?.response?.data?.detail || e?.response?.data?.message || "Failed to update alert visibility"
      );
    }
  }
);

const alertsDisplaySlice = createSlice({
  name: "alertsDisplay",
  initialState: {
    toggles: [],
    loading: false,
    error: null,
    updating: false,
    updateError: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAlertsDisplayStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAlertsDisplayStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.toggles = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchAlertsDisplayStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message || "Failed to load alert toggles";
      })
      .addCase(disableAlerts.pending, (state) => {
        state.updating = true;
        state.updateError = null;
      })
      .addCase(disableAlerts.fulfilled, (state) => {
        state.updating = false;
        state.updateError = null;
      })
      .addCase(disableAlerts.rejected, (state, action) => {
        state.updating = false;
        state.updateError = action.payload || action.error.message || "Failed to update alert visibility";
      });
  },
});

export const selectAlertsDisplayToggles = (state) => state.alertsDisplay?.toggles ?? [];
export const selectAlertsDisplayLoading = (state) => state.alertsDisplay?.loading ?? false;
export const selectAlertsDisplayError = (state) => state.alertsDisplay?.error ?? null;
export const selectAlertsDisplayUpdating = (state) => state.alertsDisplay?.updating ?? false;
export const selectAlertsDisplayUpdateError = (state) => state.alertsDisplay?.updateError ?? null;

export default alertsDisplaySlice.reducer;


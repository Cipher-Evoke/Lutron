import { createAsyncThunk, createSlice, createSelector } from "@reduxjs/toolkit";
import { BaseUrl } from "../../../BaseUrl";

export const fetchAlertTypes = createAsyncThunk(
  "alerts/fetchAlertTypes",
  async (_, { rejectWithValue }) => {
    try {
      const res = await BaseUrl.get("/alert/alerts_types");
      return Array.isArray(res?.data?.alert_types) ? res.data.alert_types : [];
    } catch (e) {
      return rejectWithValue(e?.response?.data?.detail || "Failed to load alert types");
    }
  }
);

export const fetchActiveAlerts = createAsyncThunk(
  "alerts/fetchActiveAlerts",
  async (_, { rejectWithValue }) => {
    try {
      const res = await BaseUrl.get("/alert/active_alerts");
      return Array.isArray(res?.data?.alerts) ? res.data.alerts : [];
    } catch (e) {
      return rejectWithValue(e?.response?.data?.detail || "Failed to load alerts");
    }
  }
);

export const sendAlertsByEmail = createAsyncThunk(
  "alerts/sendAlertsByEmail",
  async (toEmail, { rejectWithValue }) => {
    try {
      const res = await BaseUrl.post(`/alert/active_alerts/send_by_email?to_email=${encodeURIComponent(toEmail)}`);
      return res?.data || "Alerts sent by email successfully";
    } catch (e) {
      return rejectWithValue(e?.response?.data?.detail || "Failed to send alerts by email");
    }
  }
);

export const downloadAlerts = createAsyncThunk(
  "alerts/downloadAlerts",
  async (_, { rejectWithValue }) => {
    try {
      const res = await BaseUrl.get("/alert/active_alerts/download", {
        responseType: 'blob'
      });
      return res?.data || null;
    } catch (e) {
      return rejectWithValue(e?.response?.data?.detail || "Failed to download alerts");
    }
  }
);

const initialState = {
  types: [],
  alerts: [],
  loadingTypes: false,
  loadingAlerts: false,
  loadingEmail: false,
  loadingDownload: false,
  errorTypes: null,
  errorAlerts: null,
  errorEmail: null,
  errorDownload: null,
  selectedType: "",
  emailSuccess: false,
  downloadSuccess: false,
};

const alertsSlice = createSlice({
  name: "alerts",
  initialState,
  reducers: {
    setSelectedAlertType: (state, action) => {
      state.selectedType = action.payload || "";
    },
    clearAlertsState: () => initialState,
    resetEmailState: (state) => {
      state.loadingEmail = false;
      state.errorEmail = null;
      state.emailSuccess = false;
    },
    resetDownloadState: (state) => {
      state.loadingDownload = false;
      state.errorDownload = null;
      state.downloadSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAlertTypes.pending, (state) => {
        state.loadingTypes = true;
        state.errorTypes = null;
      })
      .addCase(fetchAlertTypes.fulfilled, (state, action) => {
        state.loadingTypes = false;
        state.types = action.payload || [];
      })
      .addCase(fetchAlertTypes.rejected, (state, action) => {
        state.loadingTypes = false;
        state.errorTypes = action.payload || "Failed to load alert types";
      })
      .addCase(fetchActiveAlerts.pending, (state) => {
        state.loadingAlerts = true;
        state.errorAlerts = null;
      })
      .addCase(fetchActiveAlerts.fulfilled, (state, action) => {
        state.loadingAlerts = false;
        state.alerts = action.payload || [];
      })
      .addCase(fetchActiveAlerts.rejected, (state, action) => {
        state.loadingAlerts = false;
        state.errorAlerts = action.payload || "Failed to load alerts";
      })
      .addCase(sendAlertsByEmail.pending, (state) => {
        state.loadingEmail = true;
        state.errorEmail = null;
        state.emailSuccess = false;
      })
      .addCase(sendAlertsByEmail.fulfilled, (state, action) => {
        state.loadingEmail = false;
        state.emailSuccess = true;
        state.errorEmail = null;
      })
      .addCase(sendAlertsByEmail.rejected, (state, action) => {
        state.loadingEmail = false;
        state.errorEmail = action.payload || "Failed to send alerts by email";
        state.emailSuccess = false;
      })
      .addCase(downloadAlerts.pending, (state) => {
        state.loadingDownload = true;
        state.errorDownload = null;
        state.downloadSuccess = false;
      })
      .addCase(downloadAlerts.fulfilled, (state) => {
        state.loadingDownload = false;
        state.downloadSuccess = true;
        state.errorDownload = null;
      })
      .addCase(downloadAlerts.rejected, (state, action) => {
        state.loadingDownload = false;
        state.errorDownload = action.payload || "Failed to download alerts";
        state.downloadSuccess = false;
      });
  },
});

export const { setSelectedAlertType, clearAlertsState, resetEmailState, resetDownloadState } = alertsSlice.actions;

export const selectAlertTypes = (state) => state.alerts.types;
// Memoized selector to prevent unnecessary re-renders
export const selectAlerts = createSelector(
  [(state) => state.alerts.alerts],
  (alerts) => {
    // Normalize alert list structure and keys defensively
    const list = alerts || [];
    
    // Helper function to parse backend time format for sorting
    const parseBackendTime = (timeStr) => {
      if (!timeStr) return new Date(0); // Default to epoch for sorting
      
      // Handle backend format: "01-09-2025 12.15"
      if (timeStr.includes('-') && timeStr.includes('.')) {
        try {
          const [datePart, timePart] = timeStr.split(' ');
          const [day, month, year] = datePart.split('-');
          const [hour, minute] = timePart.split('.');
          
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
        } catch (error) {
          return new Date(0); // Return epoch if parsing fails
        }
      }
      
      // Handle ISO format as fallback
      try {
        const date = new Date(timeStr);
        return isNaN(date.getTime()) ? new Date(0) : date;
      } catch (error) {
        return new Date(0); // Return epoch if parsing fails
      }
    };
    
    const normalizedAlerts = list.map((a, idx) => ({
      sn: a?.si_no ?? (idx + 1),
      location: a?.location ?? '-',
      alert_type: a?.alert_type ?? a?.type ?? '',
      device_name: a?.device_name ?? a?.device_id ?? '',
      serial_no: a?.serial_no ?? '',
      model_number: a?.model_number ?? null,
      time: a?.time ?? a?.created_at ?? null,
      reported_time: a?.reported_time ?? null,
      description: a?.description ?? '',
      // Add parsed time for sorting
      _parsedTime: parseBackendTime(a?.reported_time ?? a?.time ?? a?.created_at)
    }));
    
    // Sort by time with newest first
    return normalizedAlerts.sort((a, b) => b._parsedTime - a._parsedTime);
  }
);
export const selectSelectedAlertType = (state) => state.alerts.selectedType;
export const selectAlertsLoading = (state) => state.alerts.loadingTypes || state.alerts.loadingAlerts;
export const selectAlertsError = (state) => state.alerts.errorTypes || state.alerts.errorAlerts;
export const selectEmailLoading = (state) => state.alerts.loadingEmail;
export const selectDownloadLoading = (state) => state.alerts.loadingDownload;
export const selectEmailError = (state) => state.alerts.errorEmail;
export const selectDownloadError = (state) => state.alerts.errorDownload;
export const selectEmailSuccess = (state) => state.alerts.emailSuccess;
export const selectDownloadSuccess = (state) => state.alerts.downloadSuccess;

export default alertsSlice.reducer;

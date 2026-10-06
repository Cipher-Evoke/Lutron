// src/redux/slice/schedule/scheduleSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { BaseUrl } from '../../../BaseUrl';

// Fetch all schedules (not events)
export const fetchSchedules = createAsyncThunk(
  'schedule/fetchSchedules',
  async (_, { rejectWithValue }) => {
    try {
      const response = await BaseUrl.get('/schedule/list');
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.detail ||
        err.message ||
        'Failed to fetch schedules'
      );
    }
  }
);

// --- NEW: Fetch schedule status ---
export const fetchScheduleStatus = createAsyncThunk(
  'schedule/fetchScheduleStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await BaseUrl.get('/schedule/status');
      return response.data.status || [];
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.detail ||
        err.message ||
        'Failed to fetch schedule status'
      );
    }
  }
);

// --- Enable/Disable Schedules ---
export const enableSchedule = createAsyncThunk(
  'schedule/enableSchedule',
  async (eventId, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const { internal, preconfigured } = state.schedule;

      // Find schedule type and correct id
      const internalSchedule = internal.find(s => String(s.id) === String(eventId));
      const preconfiguredSchedule = preconfigured.find(s => {
        // Use last part of href for preconfigured
        const hrefId = s.href ? s.href.split('/').pop() : null;
        return String(hrefId) === String(eventId);
      });

      let params;
      if (internalSchedule) {
        params = { type: 'internal', internal_schedule_id: Number(eventId) };
      } else if (preconfiguredSchedule) {
        params = { type: 'preconfigured', timeclockevent_id: Number(eventId) };
      } else {
        return rejectWithValue('Schedule not found');
      }

      // Send as query params, not body!
      const response = await BaseUrl.post('/schedule/enable', null, { params });
      return { eventId: String(eventId), result: response.data };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.detail ||
        err.message ||
        'Failed to enable schedule'
      );
    }
  }
);

export const disableSchedule = createAsyncThunk(
  'schedule/disableSchedule',
  async (eventId, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const { internal, preconfigured } = state.schedule;

      // Find schedule type and correct id
      const internalSchedule = internal.find(s => String(s.id) === String(eventId));
      const preconfiguredSchedule = preconfigured.find(s => {
        // Use last part of href for preconfigured
        const hrefId = s.href ? s.href.split('/').pop() : null;
        return String(hrefId) === String(eventId);
      });

      let params;
      if (internalSchedule) {
        params = { type: 'internal', internal_schedule_id: Number(eventId) };
      } else if (preconfiguredSchedule) {
        params = { type: 'preconfigured', timeclockevent_id: Number(eventId) };
      } else {
        return rejectWithValue('Schedule not found');
      }

      // Send as query params, not body!
      const response = await BaseUrl.post('/schedule/disable', null, { params });
      return { eventId: String(eventId), result: response.data };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.detail ||
        err.message ||
        'Failed to disable schedule'
      );
    }
  }
);

// --- Other async thunks (create, update, delete, fetch details, etc) ---

export const createSchedule = createAsyncThunk(
  'schedule/createSchedule',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await BaseUrl.post('/schedule/create', payload);
      return response.data;
    } catch (err) {
      console.error('Create schedule error:', err);
      return rejectWithValue(
        err.response?.data?.detail ||
        err.message ||
        'Failed to create schedule'
      );
    }
  }
);

export const updateSchedule = createAsyncThunk(
  'schedule/updateSchedule',
  async (payload, { rejectWithValue }) => {
    try {
      const { id, ...scheduleData } = payload;
      const response = await BaseUrl.put(`/schedule/update/${id}`, scheduleData);
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.detail ||
        err.message ||
        'Failed to update schedule'
      );
    }
  }
);

export const deleteSchedule = createAsyncThunk(
  'schedule/deleteSchedule',
  async (scheduleId, { rejectWithValue }) => {
    try {
      const response = await BaseUrl.delete(`/schedule/delete/${scheduleId}`);
      return { id: scheduleId, ...response.data };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.detail ||
        err.message ||
        'Failed to delete schedule'
      );
    }
  }
);

// Fetch schedule groups
export const fetchScheduleGroups = createAsyncThunk(
  'schedule/fetchScheduleGroups',
  async (_, { rejectWithValue }) => {
    try {
      const response = await BaseUrl.get('/schedule/groups');
      return response.data.groups || [];
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.detail ||
        err.message ||
        'Failed to fetch groups'
      );
    }
  }
);

// Fetch schedule details (internal)
export const fetchScheduleDetails = createAsyncThunk(
  'schedule/fetchScheduleDetails',
  async (scheduleId, { rejectWithValue }) => {
    try {
      const response = await BaseUrl.get('/schedule/details', {
        params: {
          type: 'internal',
          internal_schedule_id: scheduleId,
        }
      });
      return {
        details: response.data.schedule_details,
        areas: response.data.areas,
      };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.detail ||
        err.message ||
        'Failed to fetch schedule details'
      );
    }
  }
);

// Fetch preconfigured schedule details
export const fetchPreconfiguredScheduleDetails = createAsyncThunk(
  'schedule/fetchPreconfiguredScheduleDetails',
  async (eventId, { rejectWithValue }) => {
    try {
      const response = await BaseUrl.get('/schedule/details', {
        params: {
          type: 'preconfigured',
          timeclockevent_id: eventId,
        }
      });
      return response.data.schedule_details;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.detail ||
        err.message ||
        'Failed to fetch preconfigured schedule details'
      );
    }
  }
);

// Trigger schedule
export const triggerSchedule = createAsyncThunk(
  'schedule/triggerSchedule',
  async (payload, { rejectWithValue }) => {
    try {
      let response;
      if (typeof payload === 'object' && payload.schedule_type) {
        // Internal
        response = await BaseUrl.post('/schedule/trigger', {
          schedule_type: payload.schedule_type,
          schedule_id: payload.schedule_id
        });
      } else {
        // Preconfigured
        response = await BaseUrl.post('/schedule/trigger', {
          timeclock_id: Number(payload),
          schedule_type: 'pre_configure'
        });
      }
      if (![200, 201, 204].includes(response.status)) {
        return rejectWithValue(response.data?.detail || 'Failed to trigger event');
      }
      if (response.data && response.data.status && response.data.status !== 'success') {
        return rejectWithValue(response.data.detail || 'Failed to trigger event');
      }
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.detail ||
        err.message ||
        'Failed to trigger event'
      );
    }
  }
);

const scheduleSlice = createSlice({
  name: 'schedule',
  initialState: {
    preconfigured: [],
    internal: [],
    status: [],
    loading: false,
    error: null,
    statusLoaded: false,
    schedulesLoaded: false,
    createLoading: false,
    createError: null,
    groups: [],
    groupsLoading: false,
    groupsError: null,
    selectedScheduleDetails: null,
    selectedScheduleAreas: [],
    detailsLoading: false,
    detailsError: null,
    triggerStatus: 'idle',
    toggleLoading: false,
  },
  reducers: {
    // Add a reducer to clear create error
    clearCreateError: (state) => {
      state.createError = null;
    },
    // Add a reducer to force refresh
    forceRefresh: (state) => {
      state.schedulesLoaded = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSchedules.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSchedules.fulfilled, (state, action) => {
        state.loading = false;
        state.preconfigured = action.payload.preconfigured_schedules || [];
        state.internal = action.payload.internal_schedules || [];
        state.schedulesLoaded = true;
        state.error = null;
      })
      .addCase(fetchSchedules.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      // NEW: Add fetchScheduleStatus cases
      .addCase(fetchScheduleStatus.pending, (state) => {
        state.statusLoading = true;
      })
      .addCase(fetchScheduleStatus.fulfilled, (state, action) => {
        state.statusLoading = false;
        state.status = action.payload;
        state.statusLoaded = true;
      })
      .addCase(fetchScheduleStatus.rejected, (state, action) => {
        state.statusLoading = false;
        state.statusError = action.payload || action.error.message;
      })
      // FIXED: Improved createSchedule cases
      .addCase(createSchedule.pending, (state) => {
        state.createLoading = true;
        state.createError = null;
      })
      .addCase(createSchedule.fulfilled, (state, action) => {
        state.createLoading = false;
        state.createError = null;
        
        // Add the new schedule to internal array
        if (action.payload && action.payload.id) {
          const newSchedule = {
            ...action.payload,
            EnableState: 'Enabled' // New schedules are enabled by default
          };
          
          // Check if schedule already exists to avoid duplicates
          const existingIndex = state.internal.findIndex(s => s.id === action.payload.id);
          if (existingIndex !== -1) {
            // Update existing schedule
            state.internal[existingIndex] = newSchedule;
          } else {
            // Add new schedule
            state.internal.push(newSchedule);
          }
          
          // Also add to status array
          const statusIndex = state.status.findIndex(s => String(s.event_id) === String(action.payload.id));
          if (statusIndex !== -1) {
            state.status[statusIndex].EnableState = 'Enabled';
          } else {
            state.status.push({
              event_id: String(action.payload.id),
              EnableState: 'Enabled'
            });
          }
        }
      })
      .addCase(createSchedule.rejected, (state, action) => {
        state.createLoading = false;
        state.createError = action.payload || action.error.message;
      })
      // FIXED: Improved updateSchedule cases
      .addCase(updateSchedule.pending, (state) => {
        state.updateLoading = true;
        state.updateError = null;
      })
      .addCase(updateSchedule.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.updateError = null;
        
        // Update the schedule in internal array
        if (action.payload && action.payload.id) {
          const index = state.internal.findIndex(s => s.id === action.payload.id);
          if (index !== -1) {
            state.internal[index] = { ...state.internal[index], ...action.payload };
          }
          
          // Update selectedScheduleDetails if it's the same schedule
          if (state.selectedScheduleDetails && state.selectedScheduleDetails.id === action.payload.id) {
            state.selectedScheduleDetails = { ...state.selectedScheduleDetails, ...action.payload };
          }
        }
      })
      .addCase(updateSchedule.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload || action.error.message;
      })
      // FIXED: Improved deleteSchedule cases
      .addCase(deleteSchedule.pending, (state) => {
        state.deleteLoading = true;
        state.deleteError = null;
      })
      .addCase(deleteSchedule.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = null;
        
        // Remove the schedule from internal array
        if (action.payload && action.payload.id) {
          state.internal = state.internal.filter(s => s.id !== action.payload.id);
          
          // Remove from status array
          state.status = state.status.filter(s => String(s.event_id) !== String(action.payload.id));
          
          // Clear selectedScheduleDetails if it's the deleted schedule
          if (state.selectedScheduleDetails && state.selectedScheduleDetails.id === action.payload.id) {
            state.selectedScheduleDetails = null;
            state.selectedScheduleAreas = [];
          }
        }
      })
      .addCase(deleteSchedule.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload || action.error.message;
      })
      .addCase(enableSchedule.pending, (state) => {
        state.toggleLoading = true;
      })
      .addCase(enableSchedule.fulfilled, (state, action) => {
        const { eventId, result } = action.payload;
        
        // Update the status array
        const idx = state.status.findIndex(s => String(s.event_id) === String(eventId));
        if (idx !== -1) {
          state.status[idx].EnableState = result.EnableState || 'Enabled';
        } else {
          state.status.push({
            event_id: String(eventId),
            EnableState: result.EnableState || 'Enabled'
          });
        }
        
        // FIXED: Also update the internal schedule's EnableState in the internal array
        const internalIdx = state.internal.findIndex(s => String(s.id) === String(eventId));
        if (internalIdx !== -1) {
          state.internal[internalIdx].EnableState = result.EnableState || 'Enabled';
        }
        
        // FIXED: Update the selectedScheduleDetails if it matches
        if (state.selectedScheduleDetails && String(state.selectedScheduleDetails.id) === String(eventId)) {
          state.selectedScheduleDetails.EnableState = result.EnableState || 'Enabled';
        }
        
        state.toggleLoading = false;
      })
      .addCase(enableSchedule.rejected, (state) => {
        state.toggleLoading = false;
      })
      .addCase(disableSchedule.pending, (state) => {
        state.toggleLoading = true;
      })
      .addCase(disableSchedule.fulfilled, (state, action) => {
        const { eventId, result } = action.payload;
        
        // Update the status array
        const idx = state.status.findIndex(s => String(s.event_id) === String(eventId));
        if (idx !== -1) {
          state.status[idx].EnableState = result.EnableState || 'Disabled';
        } else {
          state.status.push({
            event_id: String(eventId),
            EnableState: result.EnableState || 'Disabled'
          });
        }
        
        // FIXED: Also update the internal schedule's EnableState in the internal array
        const internalIdx = state.internal.findIndex(s => String(s.id) === String(eventId));
        if (internalIdx !== -1) {
          state.internal[internalIdx].EnableState = result.EnableState || 'Disabled';
        }
        
        // FIXED: Update the selectedScheduleDetails if it matches
        if (state.selectedScheduleDetails && String(state.selectedScheduleDetails.id) === String(eventId)) {
          state.selectedScheduleDetails.EnableState = result.EnableState || 'Disabled';
        }
        
        state.toggleLoading = false;
      })
      .addCase(disableSchedule.rejected, (state) => {
        state.toggleLoading = false;
      })
      .addCase(fetchScheduleDetails.fulfilled, (state, action) => {
        state.selectedScheduleDetails = action.payload.details;
        state.selectedScheduleAreas = action.payload.areas;
        state.detailsLoading = false;
        state.detailsError = null;
      })
      .addCase(fetchScheduleDetails.pending, (state) => {
        state.detailsLoading = true;
        state.detailsError = null;
      })
      .addCase(fetchScheduleDetails.rejected, (state, action) => {
        state.detailsLoading = false;
        state.detailsError = action.payload || action.error.message;
      })
      // Add these missing cases for fetchScheduleGroups
      .addCase(fetchScheduleGroups.pending, (state) => {
        state.groupsLoading = true;
        state.groupsError = null;
      })
      .addCase(fetchScheduleGroups.fulfilled, (state, action) => {
        state.groupsLoading = false;
        state.groups = action.payload;
      })
      .addCase(fetchScheduleGroups.rejected, (state, action) => {
        state.groupsLoading = false;
        state.groupsError = action.payload || action.error.message;
      });
  },
});

export const { clearCreateError, forceRefresh } = scheduleSlice.actions;
export default scheduleSlice.reducer;
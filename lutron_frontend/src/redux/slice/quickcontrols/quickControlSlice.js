import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { BaseUrl } from '../../../BaseUrl';
import Swal from 'sweetalert2';

// Async thunk to fetch floors
export const fetchFloors = createAsyncThunk(
  'quickControl/fetchFloors',
  async () => {
    const response = await BaseUrl.get('/floor/list');
    return response.data.floors || [];
  }
);

export const fetchQuickControls = createAsyncThunk(
  'quickControl/fetchQuickControls',
  async () => {
    const response = await BaseUrl.get('/quick_control/list');
    // response.data is the array!
    return response.data || [];
  }
);

// Create a new quick control
export const createQuickControl = createAsyncThunk(
  'quickControl/createQuickControl',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await BaseUrl.post('/quick_control/create', payload);
      return response.data;
    } catch (err) {
      console.error('Create quick control error:', err);
      return rejectWithValue(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        'Failed to create quick control'
      );
    }
  }
);

export const fetchQuickControlDetails = createAsyncThunk(
  'quickControl/fetchQuickControlDetails',
  async (controlId) => {
    const response = await BaseUrl.get(`/quick_control/details/${controlId}`);
    return response.data;
  }
);

export const updateQuickControl = createAsyncThunk(
  'quickControl/updateQuickControl',
  async ({ controlId, payload }) => {
    const response = await BaseUrl.put(`/quick_control/update/${controlId}`, payload);
    return response.data;
  }
);

export const triggerQuickControl = createAsyncThunk(
  'quickControl/triggerQuickControl',
  async (controlId) => {
    const response = await BaseUrl.post(`/quick_control/trigger/${controlId}`);
    return response.data;
  }
);

// Removed schedule-related functions as schedules should not affect Quick Controls

export const deleteQuickControl = createAsyncThunk(
  'quickControl/deleteQuickControl',
  async (controlId, { rejectWithValue }) => {
    try {
      const response = await BaseUrl.delete(`/quick_control/delete/${controlId}`);
      
      // Check if the response contains an error message even with 200 status
      if (response.data && response.data.status === "Error") {
        return rejectWithValue(response.data.message);
      }
      
      return { controlId, ...response.data };
    } catch (err) {
      console.error('Delete QuickControl error:', err);
      
      // Just pass the backend error message directly
      let errorMessage = "";
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

const quickControlSlice = createSlice({
  name: 'quickControl',
  initialState: {
    controls: [],
    loading: false,
    error: null,
    floors: [],
    floorsLoading: false,
    floorsError: null,
    status: 'idle',
    selectedControl: null,
    selectedControlLoading: false,
    selectedControlError: null,
    triggerStatus: null,
    deleteStatus: null,
    updateStatus: null,
    shouldRefresh: false,
    // Removed usageCheck as schedules should not affect Quick Controls
  },
  reducers: {
    clearSelectedControl(state) {
      state.selectedControl = null;
      state.selectedControlLoading = false;
      state.selectedControlError = null;
      state.triggerStatus = null;
      state.deleteStatus = null;
      state.updateStatus = null;
      state.shouldRefresh = false;
      // Removed usageCheck as schedules should not affect Quick Controls
    },
    setShouldRefresh(state, action) {
      state.shouldRefresh = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Quick Controls
      .addCase(fetchQuickControls.pending, (state) => {
        state.loading = true;
        state.status = 'loading';
      })
      .addCase(fetchQuickControls.fulfilled, (state, action) => {
        state.loading = false;
        state.status = 'succeeded';
        state.controls = action.payload;
      })
      .addCase(fetchQuickControls.rejected, (state, action) => {
        state.loading = false;
        state.status = 'failed';
        state.error = action.error.message;
      })
      // Floors
      .addCase(fetchFloors.pending, (state) => {
        state.floorsLoading = true;
      })
      .addCase(fetchFloors.fulfilled, (state, action) => {
        state.floorsLoading = false;
        state.floors = action.payload;
      })
      .addCase(fetchFloors.rejected, (state, action) => {
        state.floorsLoading = false;
        state.floorsError = action.error.message;
      })
      // Details
      .addCase(fetchQuickControlDetails.pending, (state) => {
        state.selectedControlLoading = true;
        state.selectedControlError = null;
      })
      .addCase(fetchQuickControlDetails.fulfilled, (state, action) => {
        state.selectedControlLoading = false;
        state.selectedControl = action.payload;
      })
      .addCase(fetchQuickControlDetails.rejected, (state, action) => {
        state.selectedControlLoading = false;
        state.selectedControlError = action.error.message;
      })
      // Trigger
      .addCase(triggerQuickControl.pending, (state) => {
        state.triggerStatus = 'loading';
      })
      .addCase(triggerQuickControl.fulfilled, (state, action) => {
        state.triggerStatus = 'success';
      })
      .addCase(triggerQuickControl.rejected, (state, action) => {
        state.triggerStatus = 'failed';
      })
      // Delete
      .addCase(deleteQuickControl.pending, (state) => {
        state.deleteStatus = 'loading';
      })
      .addCase(deleteQuickControl.fulfilled, (state, action) => {
        state.deleteStatus = 'success';
        // Remove from controls list
        state.controls = state.controls.filter(c => c.id !== action.payload.controlId);
        state.selectedControl = null;
        state.shouldRefresh = true;
      })
      .addCase(deleteQuickControl.rejected, (state, action) => {
        state.deleteStatus = 'failed';
        // Store the error message in the state so component can access it
        state.error = action.payload || action.error.message;
      })
      // Update
      .addCase(updateQuickControl.pending, (state) => {
        state.updateStatus = 'loading';
      })
      .addCase(updateQuickControl.fulfilled, (state, action) => {
        state.updateStatus = 'success';
        state.selectedControl = action.payload;
        state.shouldRefresh = true;
      })
      .addCase(updateQuickControl.rejected, (state, action) => {
        state.updateStatus = 'failed';
      })
      .addCase(createQuickControl.fulfilled, (state) => {
        state.shouldRefresh = true;
      })
      // Removed checkQuickControlUsage cases as schedules should not affect Quick Controls
  },
});

export const { clearSelectedControl, setShouldRefresh } = quickControlSlice.actions;
export default quickControlSlice.reducer;

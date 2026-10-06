import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { BaseUrl } from '../../../BaseUrl';

// Async thunk for fetching modules
export const fetchModules = createAsyncThunk(
  'modules/fetchModules',
  async (_, { rejectWithValue }) => {
    try {
      const response = await BaseUrl.get('/list/modules');
      return response.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

// Async thunk for uploading device alerts file
export const uploadDeviceAlerts = createAsyncThunk(
  'modules/uploadDeviceAlerts',
  async (file, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await BaseUrl.post('/alert/upload_device_alerts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

const initialState = {
  modules: [],
  loading: false,
  error: null,
  uploading: false,
  uploadError: null,
  uploadSuccess: false,
};

const modulesSlice = createSlice({
  name: 'modules',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearUploadError: (state) => {
      state.uploadError = null;
    },
    clearUploadSuccess: (state) => {
      state.uploadSuccess = false;
    },
    resetModulesState: (state) => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch modules
      .addCase(fetchModules.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchModules.fulfilled, (state, action) => {
        state.loading = false;
        state.modules = action.payload;
        state.error = null;
      })
      .addCase(fetchModules.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Upload device alerts
      .addCase(uploadDeviceAlerts.pending, (state) => {
        state.uploading = true;
        state.uploadError = null;
        state.uploadSuccess = false;
      })
      .addCase(uploadDeviceAlerts.fulfilled, (state, action) => {
        state.uploading = false;
        state.uploadSuccess = true;
        state.uploadError = null;
      })
      .addCase(uploadDeviceAlerts.rejected, (state, action) => {
        state.uploading = false;
        state.uploadError = action.payload;
        state.uploadSuccess = false;
      });
  },
});

export const { clearError, clearUploadError, clearUploadSuccess, resetModulesState } = modulesSlice.actions;
export default modulesSlice.reducer;

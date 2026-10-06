import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { BaseUrl } from '../../../BaseUrl';

// Async thunk for fetching sensors
export const fetchSensors = createAsyncThunk(
  'sensors/fetchSensors',
  async (_, { rejectWithValue }) => {
    try {
      const response = await BaseUrl.get('/list/sensors');
      return response.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

// Async thunk for discovering sensors
export const discoverSensors = createAsyncThunk(
  'sensors/discoverSensors',
  async (processorId, { rejectWithValue }) => {
    try {
      const response = await BaseUrl.post(`/alert/discover_sensors?processor_id=${processorId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

const initialState = {
  sensors: [],
  loading: false,
  error: null,
  discovering: false,
  discoverError: null,
  discoverSuccess: false,
};

const sensorsSlice = createSlice({
  name: 'sensors',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearDiscoverError: (state) => {
      state.discoverError = null;
    },
    clearDiscoverSuccess: (state) => {
      state.discoverSuccess = false;
    },
    resetSensorsState: (state) => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch sensors
      .addCase(fetchSensors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSensors.fulfilled, (state, action) => {
        state.loading = false;
        state.sensors = action.payload;
        state.error = null;
      })
      .addCase(fetchSensors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Discover sensors
      .addCase(discoverSensors.pending, (state) => {
        state.discovering = true;
        state.discoverError = null;
        state.discoverSuccess = false;
      })
      .addCase(discoverSensors.fulfilled, (state, action) => {
        state.discovering = false;
        state.discoverSuccess = true;
        state.discoverError = null;
      })
      .addCase(discoverSensors.rejected, (state, action) => {
        state.discovering = false;
        state.discoverError = action.payload;
        state.discoverSuccess = false;
      });
  },
});

export const { clearError, clearDiscoverError, clearDiscoverSuccess, resetSensorsState } = sensorsSlice.actions;
export default sensorsSlice.reducer;

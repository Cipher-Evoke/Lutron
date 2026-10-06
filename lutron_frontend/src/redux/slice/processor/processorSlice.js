import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { BaseUrl } from '../../../BaseUrl'; // Import the configured axios instance

const initialState = {
  processors: [],
  status: 'idle',
  error: null,
};

// Fetch Available Processors
export const fetchProcessors = createAsyncThunk(
  'processors/fetchProcessors',
  async (_, { rejectWithValue }) => {
    try {
      const response = await BaseUrl.get('/processor/list'); // Use BaseUrl instance
      return response.data;
    } catch (err) {
      return rejectWithValue("Failed to fetch processors.");
    }
  }
);

// New: Download Leaf Areas CSV
export const downloadLeafAreas = createAsyncThunk(
  'processors/downloadLeafAreas',
  async (processorId, { rejectWithValue }) => {
    try {
      const response = await BaseUrl.get(`/processor/leaf_areas?processor_id=${processorId}`, {
        responseType: 'blob', // Important for file downloads
      });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `leaf_areas_${processorId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      return { success: true };
    } catch (err) {
      return rejectWithValue("Failed to download leaf areas.");
    }
  }
);

// New: Upload Area Coordinates CSV
export const uploadAreaCoordinates = createAsyncThunk(
  'processors/uploadAreaCoordinates',
  async ({ processorId, file }, { rejectWithValue }) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await BaseUrl.post(`/processor/area_coord?processor_id=${processorId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || "Failed to upload area coordinates.";
      return rejectWithValue(errorMessage);
    }
  }
);

const processorSlice = createSlice({
  name: 'processor',
  initialState,
  reducers: {
    // Add a reducer to clear processors when needed
    clearProcessors: (state) => {
      state.processors = [];
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProcessors.pending, (state) => {
        state.status = 'loading';
        state.processors = []; // Clear old data on new fetch
      })
      .addCase(fetchProcessors.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Deduplicate processors by ID to prevent duplicates
        const uniqueProcessors = action.payload.filter((processor, index, self) => 
          index === self.findIndex(p => p.id === processor.id)
        );
        state.processors = uniqueProcessors;
      })
      .addCase(fetchProcessors.rejected, (state) => {
        state.status = 'failed';
        state.processors = []; // Clear on failure
      })
      // Upload Area Coordinates cases
      .addCase(uploadAreaCoordinates.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(uploadAreaCoordinates.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(uploadAreaCoordinates.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const { clearProcessors } = processorSlice.actions;
export default processorSlice.reducer;

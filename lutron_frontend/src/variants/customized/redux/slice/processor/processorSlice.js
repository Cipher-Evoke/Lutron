import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { BaseUrl } from '../../../BaseUrl'; // Import the configured axios instance

const initialState = {
  processors: [],
  status: 'idle',
  error: null,
  /** Full processor table for Settings → Processors (`GET /processor/list_all`). */
  processorsListAll: [],
  listAllStatus: 'idle',
  listAllError: null,
  discoverStatus: 'idle',
  discoverError: null,
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

/** All processor rows for the Processors settings table (no discovery / filtering). */
export const fetchProcessorsListAll = createAsyncThunk(
  'processors/fetchProcessorsListAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await BaseUrl.get('/processor/list_all');
      return response.data;
    } catch (err) {
      const msg =
        err.response?.data?.detail || err.message || 'Failed to load processors.';
      return rejectWithValue(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  }
);

/** Zeroconf discovery; on success caller typically refetches `list_all`. */
export const discoverProcessors = createAsyncThunk(
  'processors/discoverProcessors',
  async (_, { rejectWithValue }) => {
    try {
      const response = await BaseUrl.get('/processor/discover');
      return response.data;
    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail;
      const msg =
        typeof detail === 'string'
          ? detail
          : err.message || 'Discovery failed.';
      return rejectWithValue({ status, message: msg });
    }
  }
);

export const toggleHandshakeStatus = createAsyncThunk(
  'processors/toggleHandshakeStatus',
  async (processorId, { rejectWithValue }) => {
    try {
      const response = await BaseUrl.post('/processor/toggle_handshake_status', null, {
        params: { processor_id: processorId },
      });
      return response.data;
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Toggle failed.';
      return rejectWithValue(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  }
);

const HANDSHAKE_TIMEOUT_MS = 125_000;

export const processorHandshake = createAsyncThunk(
  'processors/processorHandshake',
  async (processorId, { rejectWithValue }) => {
    try {
      const response = await BaseUrl.post('/processor/processor_handshake', null, {
        params: { processor_id: processorId },
        timeout: HANDSHAKE_TIMEOUT_MS,
      });
      return response.data;
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        return rejectWithValue('Handshake timed out. Please try again.');
      }
      const detail = err.response?.data?.detail;
      const msg =
        typeof detail === 'string'
          ? detail
          : err.message || 'Handshake failed.';
      return rejectWithValue(msg);
    }
  }
);

export const pingProcessorTerminal = createAsyncThunk(
  'processors/pingProcessorTerminal',
  async (processorId, { rejectWithValue }) => {
    try {
      const response = await BaseUrl.post('/processor/ping_terminal', null, {
        params: { processor_id: processorId },
        responseType: 'text',
      });
      return response.data;
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg =
        typeof detail === 'string'
          ? detail
          : err.message || 'Ping terminal request failed.';
      return rejectWithValue(msg);
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

/**
 * Manually add (or update) a single processor by IP. Hits
 * `/processor_discovery/manual_add` which upserts into the existing
 * `processor` table.
 */
export const manualAddProcessor = createAsyncThunk(
  'processors/manualAddProcessor',
  async ({ ipv4, system, serial, mac } = {}, { rejectWithValue }) => {
    const payload = { ipv4 };
    if (system !== undefined && system !== null && String(system).trim() !== '') {
      payload.system = String(system).trim();
    }
    if (serial !== undefined && serial !== null && String(serial).trim() !== '') {
      payload.serial = String(serial).trim();
    }
    if (mac !== undefined && mac !== null && String(mac).trim() !== '') {
      payload.mac = String(mac).trim();
    }

    try {
      const response = await BaseUrl.post('/processor_discovery/manual_add', payload);
      return response.data;
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg =
        typeof detail === 'string'
          ? detail
          : err.message || 'Failed to save processor details.';
      return rejectWithValue(msg);
    }
  },
);

/**
 * Layer-3 IP scan + upsert. Hits `/processor_discovery/scan`; reachable IPs
 * are inserted into the `processor` table — refetch `list_all` after close.
 */
export const scanProcessorsByIp = createAsyncThunk(
  'processors/scanProcessorsByIp',
  async ({ raw, ips, ports, timeout } = {}, { rejectWithValue }) => {
    const payload = {};
    if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
      payload.raw = String(raw);
    }
    if (Array.isArray(ips) && ips.length) payload.ips = ips;
    if (Array.isArray(ports) && ports.length) payload.ports = ports;
    if (typeof timeout === 'number') payload.timeout = timeout;

    try {
      const response = await BaseUrl.post('/processor_discovery/scan', payload, {
        timeout: 60_000,
      });
      return response.data;
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg =
        typeof detail === 'string'
          ? detail
          : err.message || 'IP scan failed.';
      return rejectWithValue(msg);
    }
  },
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
      })
      // list_all (settings table)
      .addCase(fetchProcessorsListAll.pending, (state) => {
        state.listAllStatus = 'loading';
        state.listAllError = null;
      })
      .addCase(fetchProcessorsListAll.fulfilled, (state, action) => {
        state.listAllStatus = 'succeeded';
        state.processorsListAll = Array.isArray(action.payload) ? action.payload : [];
        state.listAllError = null;
      })
      .addCase(fetchProcessorsListAll.rejected, (state, action) => {
        state.listAllStatus = 'failed';
        state.listAllError = action.payload;
        state.processorsListAll = [];
      })
      .addCase(discoverProcessors.pending, (state) => {
        state.discoverStatus = 'loading';
        state.discoverError = null;
      })
      .addCase(discoverProcessors.fulfilled, (state) => {
        state.discoverStatus = 'succeeded';
        state.discoverError = null;
      })
      .addCase(discoverProcessors.rejected, (state, action) => {
        state.discoverStatus = 'failed';
        state.discoverError = action.payload?.message || 'Discovery failed.';
      });
  },
});

export const { clearProcessors } = processorSlice.actions;
export default processorSlice.reducer;

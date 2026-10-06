import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { BaseUrl } from '../../../BaseUrl'; // Import the configured axios instance
import { fetchAreaOccupancyStatus, fetchAreaEnergyConsumption } from '../settingsslice/heatmap/HeatmapSlice';
import Swal from 'sweetalert2';

const initialState = {
  floors: [],
  status: 'idle',
  error: null,
  selectedProcessors: JSON.parse(localStorage.getItem('selectedProcessors')) || [], // Load from localStorage
  singleFloor: {},
  leafData: {},
  pdfUrl: null,
  existingCalculatedAreas: null,
  lightStatus: null,
  occupancyStatus: null,
  energyStatus: null,
  baseAreas: [],
  heatmapData: {
    areas: [],
  },
  loading: true,
  processorAreaIds: {}, // Add this to track area_ids per processor
};
// Fetch Floors
export const fetchFloors = createAsyncThunk('floors/fetchFloors', async (_, { rejectWithValue }) => {
  try {
    const response = await BaseUrl.get('/floor/list');
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.detail || "Failed to fetch floors.");
  }
});
// Create Floor
// export const createFloor = createAsyncThunk('floors/createFloor', async (formData, { rejectWithValue }) => {
//   try {
//     console.log('Creating floor with formData:', formData);
//     const response = await BaseUrl.post('/floor/create', formData, {
//       headers: { 'Content-Type': 'multipart/form-data' },
//     });
//     console.log('Floor creation response:', response.data);
//     return response.data;
//   } catch (err) {
//     console.error('Create floor error:', err);
//     return rejectWithValue(err.response?.data?.detail || "Failed to create floor.");
//   }
// });
export const createAreaGroup = createAsyncThunk(
  'area_group/create',
  async (data, { rejectWithValue }) => {
    try {
      const response = await BaseUrl.post(`/area_group/create`, data);
      return response.data;
    } catch (error) {
      console.error('Backend error:', error);
      console.error('Error response:', error.response?.data);
      Swal.fire({
        background: "#D0DAF7",
        width: 200,
        icon: "error",
        title: "Oops...",
        text: `${error?.response?.data?.detail || "Failed to create area group."}`,
        customClass: {
          popup: 'custom-swal-radius',
        },
      });
      return rejectWithValue(error?.response?.data?.detail || "Failed to create area group.");
    }
  }
);
// Update Floor - Complete rewrite
export const updateFloor = createAsyncThunk(
  'floors/updateFloor',
  async ({ floorId, formData }, { rejectWithValue }) => {
    try {

      // Log all formData entries
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
        } else {
        }
      }

      const response = await BaseUrl.put(`/floor/update/${floorId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });


      return {
        id: parseInt(floorId),
        ...response.data
      };
    } catch (err) {
      console.error('=== UPDATE FLOOR ERROR ===');
      console.error('Error details:', err);
      console.error('Response data:', err.response?.data);
      console.error('Response status:', err.response?.status);

      const errorMessage = err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Failed to update floor.";

      return rejectWithValue(errorMessage);
    }
  }
);
// Delete Floor
export const deleteFloor = createAsyncThunk(
  'floors/deleteFloor',
  async (floorId, { rejectWithValue }) => {
    try {
      const response = await BaseUrl.delete(`/floor/delete/${floorId}`);
      return floorId;
    } catch (err) {
      console.error('Delete floor error:', err);
      const errorMessage = err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Failed to delete floor.";
      return rejectWithValue(errorMessage);
    }
  }
);
// Fetch Light Status
export const fetchLightStatus = createAsyncThunk(
  'floor/fetchLightStatus',
  async (floorId, { rejectWithValue }) => {
    try {
      const response = await BaseUrl.get(`/floor/light_status?floor_id=${floorId}`);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Failed to fetch light status.");
    }
  }
);
// Fetch Occupancy Status
export const fetchOccupancyStatus = createAsyncThunk(
  'floor/fetchOccupancyStatus',
  async (floorId, { rejectWithValue }) => {
    try {
      const response = await BaseUrl.get(`/floor/occupancy_status?floor_id=${floorId}`);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Failed to fetch occupancy status.");
    }
  }
);
// Fetch Energy Status
export const fetchEnergyStatus = createAsyncThunk(
  'floor/fetchEnergyStatus',
  async (floorId, { rejectWithValue }) => {
    try {
      const response = await BaseUrl.get(`/floor/energy_status?floor_id=${floorId}`);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Failed to fetch energy status.");
    }
  }
);
//fetch single floor
export const fetchSingleFloor = createAsyncThunk(
  'floor/fetchSingleFloor',
  async (floorId, { rejectWithValue }) => {
    try {
      const response = await BaseUrl.get(`/floor/get/${floorId}`);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Failed to fetch floor details.");
    }
  }
);
//get leaf data by floor id
export const getLeafByFloorID = createAsyncThunk(
  'Leaf/getLeafByFloorID',
  async (floorId, { rejectWithValue }) => {
    try {
      const response = await BaseUrl.get(`/floor/area_tree/${floorId}`);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Failed to fetch floor details.");
    }
  }
);

export const updateAreaFloorAndProcessor = createAsyncThunk(
  'area/updateAreaFloorAndProcessor',
  async ({ areaId, floorId, processorId }, { rejectWithValue }) => {
    try {
      const response = await BaseUrl.patch(`/area/update/${areaId}`, {
        floor_id: floorId,
        processor_id: processorId
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Failed to update area.");
    }
  }
);
export const createFloorWithAreas = createAsyncThunk(
  'floors/createFloorWithAreas',
  async (formData, { rejectWithValue }) => {
    try {
      // FIX: Use the correct endpoint
      const response = await BaseUrl.post('/floor/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Failed to create floor with areas.");
    }
  }
);

// Add this new thunk for coordinate correction
export const correctCoordinates = createAsyncThunk(
  'floors/correctCoordinates',
  async ({ floorId, action, subAction, value }, { rejectWithValue }) => {
    try {
      // Map frontend action names to API operation names
      const operationMap = {
        'move-x': 'move_x',
        'move-y': 'move_y',
        'scale-x': 'scale_x',
        'scale-y': 'scale_y'
      };

      // Map sub-action names to API format
      const unitMap = {
        'pixels': 'pixels',
        'percent': 'percentage', // Note: API expects 'percentage' not 'percent'
        'factor': null // Scale operations don't use move_by
      };

      const operation = operationMap[action];
      const unit = unitMap[subAction];

      // Prepare request body based on operation type
      let requestBody = {
        floor_id: floorId,
        operation: operation
      };

      // Set the appropriate fields based on operation type
      if (action.includes('move')) {
        requestBody.move_by = unit;
        requestBody.move_value = value;
        // Don't include scale_factor for move operations
      } else if (action.includes('scale')) {
        requestBody.scale_factor = value;
        // Don't include move_by or move_value for scale operations
      }


      const response = await BaseUrl.post('/floor/modify_coordinates', requestBody);
      return response.data;
    } catch (err) {
      console.error('Coordinate correction error:', err);
      return rejectWithValue(err.response?.data?.detail || "Failed to correct coordinates.");
    }
  }
);

// Add this new thunk for area calculation with reference length
export const calculateAreaWithReferenceLength = createAsyncThunk(
  'floors/calculateAreaWithReferenceLength',
  async ({ first_point, second_point, length_in_meters, length_in_feet, floor_id }, { rejectWithValue }) => {
    try {
      const payload = {
        first_point,
        second_point,
        length_in_meters,
        length_in_feet,
        floor_id
      };


      const response = await BaseUrl.post('/area/reference_length', payload);
      return response.data;
    } catch (err) {
      console.error('Area calculation error:', err);
      return rejectWithValue(err.response?.data?.detail || "Failed to calculate area.");
    }
  }
);

// Add this new thunk for fetching existing calculated areas
export const fetchExistingCalculatedAreas = createAsyncThunk(
  'floors/fetchExistingCalculatedAreas',
  async (floorId, { rejectWithValue }) => {
    try {

      const response = await BaseUrl.get(`/area/calculated/${floorId}`);
      return response.data;
    } catch (err) {
      console.error('Fetch existing calculated areas error:', err);
      return rejectWithValue(err.response?.data?.detail || "Failed to fetch existing calculated areas.");
    }
  }
);

const floorSlice = createSlice({
  name: 'floor',
  initialState,
  reducers: {
    addSelectedProcessor: (state, action) => {
      state.selectedProcessors.push(action.payload);
    },
    removeSelectedProcessor: (state, action) => {
      state.selectedProcessors = state.selectedProcessors.filter(
        (processor) => processor.id !== action.payload
      );
    },
    clearSelectedProcessors: (state) => {
      state.selectedProcessors = [];
      localStorage.removeItem('selectedProcessors'); // Clear from localStorage
    },
    clearProcessorAreaIds: (state) => {
      state.processorAreaIds = {};
    },
    setProcessorAreaIds: (state, action) => {
      const { processorId, areaIds } = action.payload;
      state.processorAreaIds[processorId] = areaIds;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Floors
      .addCase(fetchFloors.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchFloors.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.floors = action.payload;
        state.error = null;
      })
      .addCase(fetchFloors.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error.message;
      })
      //fetch single floor
      .addCase(fetchSingleFloor.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchSingleFloor.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.singleFloor = action.payload;
        state.error = null;

        // Log the payload to see the structure

        const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
        const rawPath = action.payload.floor_image || action.payload.floor_plan || "";
        if (rawPath) {
          const base = rawPath.startsWith("http") ? rawPath : `${API_URL}${rawPath}`;
          const sep = base.includes('?') ? '&' : '?';
          state.pdfUrl = `${base}${sep}t=${Date.now()}`;
        }
      })
      .addCase(fetchSingleFloor.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error.message;
      })

      // CREATE FLOOR WITH AREAS
      .addCase(createFloorWithAreas.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(createFloorWithAreas.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.error = null;

        // optional: add new floor to list
        if (action.payload) {
          state.floors.push(action.payload);
        }
      })
      .addCase(createFloorWithAreas.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error.message;
      })
      // // Create Floor
      // .addCase(createFloor.pending, (state) => {
      //   state.status = 'loading';
      //   state.error = null;
      // })
      // .addCase(createFloor.fulfilled, (state, action) => {
      //   state.status = 'succeeded';
      //   // Add the new floor to the list
      //   state.floors.push(action.payload);
      //   state.error = null;
      // })
      // .addCase(createFloor.rejected, (state, action) => {
      //   state.status = 'failed';
      //   state.error = action.payload || action.error.message;
      // })
      // Update Floor - Complete rewrite
      .addCase(updateFloor.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updateFloor.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const updatedFloor = action.payload;

        const idx = state.floors.findIndex(f => f.id === updatedFloor.id);
        if (idx !== -1) state.floors[idx] = { ...state.floors[idx], ...updatedFloor };

        if (state.singleFloor && state.singleFloor.id === updatedFloor.id) {
          state.singleFloor = { ...state.singleFloor, ...updatedFloor };
        }

        // also refresh preview url with cache-busting token
        const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
        const rawUpd = updatedFloor.floor_image || updatedFloor.floor_plan || "";
        if (rawUpd) {
          const base = rawUpd.startsWith("http") ? rawUpd : `${API_URL}${rawUpd}`;
          const sep = base.includes('?') ? '&' : '?';
          state.pdfUrl = `${base}${sep}t=${Date.now()}`;
        }

        state.error = null;
      })
      .addCase(updateFloor.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error.message;
        console.error('Update floor rejected:', action.payload);
      })
      // Delete Floor
      .addCase(deleteFloor.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(deleteFloor.fulfilled, (state, action) => {
        // Remove the floor from the state
        state.floors = state.floors.filter(floor => floor.id !== action.meta.arg);
        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(deleteFloor.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error.message || 'Failed to delete floor';
        console.error('Delete floor rejected:', action.payload || action.error.message);
      })
      //get leafby floor id
      .addCase(getLeafByFloorID.pending, (state) => {
        state.loading = true
      })
      .addCase(getLeafByFloorID.fulfilled, (state, action) => {
        state.loading = false
        state.leafData = action.payload
      })
      .addCase(getLeafByFloorID.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })
      // Fetch Light Status
      .addCase(fetchLightStatus.fulfilled, (state, action) => {
        state.lightStatus = action.payload;
        state.baseAreas = action.payload.areas || [];
      })
      // Fetch Occupancy Status
      .addCase(fetchOccupancyStatus.fulfilled, (state, action) => {
        state.occupancyStatus = action.payload;
      })
      // Fetch Energy Status
      .addCase(fetchEnergyStatus.fulfilled, (state, action) => {
        state.energyStatus = action.payload;
      })
      // Coordinate Correction
      .addCase(correctCoordinates.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(correctCoordinates.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.error = null;
        // Optionally refresh floor data after correction
        // dispatch(fetchFloors());
      })
      .addCase(correctCoordinates.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error.message;
      })
      // Area Calculation with Reference Length
      .addCase(calculateAreaWithReferenceLength.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(calculateAreaWithReferenceLength.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.error = null;
        // Optionally refresh floor data after area calculation
        // dispatch(fetchFloors());
      })
      .addCase(calculateAreaWithReferenceLength.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error.message;
      })
      // Fetch Existing Calculated Areas
      .addCase(fetchExistingCalculatedAreas.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchExistingCalculatedAreas.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.error = null;
        // Store existing calculated areas in state if needed
        if (action.payload.status === 'success' && action.payload.calculated_areas) {
          state.existingCalculatedAreas = action.payload.calculated_areas;
        }
      })
      .addCase(fetchExistingCalculatedAreas.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error.message;
      })
      // Save selected processors to localStorage - This must be AFTER all addCase calls
      .addMatcher(
        (action) => action.type === 'floor/addSelectedProcessor' || action.type === 'floor/removeSelectedProcessor',
        (state) => {
          localStorage.setItem('selectedProcessors', JSON.stringify(state.selectedProcessors));
        }
      );
  },
});
export const {
  addSelectedProcessor,
  removeSelectedProcessor,
  clearSelectedProcessors,
  clearProcessorAreaIds,
  setProcessorAreaIds,
} = floorSlice.actions;
export const selectFloors = (state) => state.floor.floors;
export const uniqueFloor = (state) => state.floor.singleFloor;
export const selectFloorLoading = (state) => state.floor.status;
export const fetchLeafDataByID = (state) => state.floor.leafData
export default floorSlice.reducer;

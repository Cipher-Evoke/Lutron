/** Shared slice — Phase 5.1 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Swal from 'sweetalert2';

const CREATE_STRIP_FIELDS = [
  'source',
  'fade_time',
  'delay_time',
  'id',
  'quick_control_area_id',
  'quick_control_area_action_id',
  'floor_id',
];

function formatApiErrorDetail(detail, fallback) {
  if (detail == null || detail === '') return fallback;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return (
      detail
        .map((item) => (typeof item === 'string' ? item : item?.msg || JSON.stringify(item)))
        .filter(Boolean)
        .join('; ') || fallback
    );
  }
  if (typeof detail === 'object' && detail.msg) return detail.msg;
  return fallback;
}

/** Strip UI-only fields and keep one zone_status per area for /quick_control/create. */
export function normalizeQuickControlCreatePayload(payload) {
  if (!payload || typeof payload !== 'object') return payload;

  return {
    name: String(payload.name ?? '').trim(),
    areas: (payload.areas || []).map((area) => {
      const actions = [];
      let lastZoneStatus = null;

      for (const raw of area.actions || []) {
        if (!raw || typeof raw !== 'object') continue;
        const action = { ...raw };
        CREATE_STRIP_FIELDS.forEach((key) => {
          delete action[key];
        });
        Object.keys(action).forEach((key) => {
          if (action[key] === undefined) delete action[key];
        });

        if (action.type === 'set_scene' && action.scene_code != null && action.scene_code !== '') {
          const code = Number(action.scene_code);
          if (Number.isFinite(code)) action.scene_code = code;
        }

        if (action.type === 'zone_status') {
          if (action.zone_id != null && action.zone_id !== '') {
            const zoneId = Number(action.zone_id);
            if (Number.isFinite(zoneId)) action.zone_id = zoneId;
          }
          lastZoneStatus = action;
          continue;
        }

        if (action.type === 'shade_group_status') {
          if (action.shade_group_id != null && action.shade_group_id !== '') {
            const shadeId = Number(action.shade_group_id);
            if (Number.isFinite(shadeId)) action.shade_group_id = shadeId;
          }
          if (action.shade_level != null && action.shade_level !== '') {
            const level = String(action.shade_level).replace(/%+$/, '');
            action.shade_level = `${level}%`;
          }
        }

        actions.push(action);
      }

      if (lastZoneStatus) actions.push(lastZoneStatus);

      return {
        area_id:
          area.area_id == null || area.area_id === ''
            ? null
            : Number.isFinite(Number(area.area_id))
              ? Number(area.area_id)
              : area.area_id,
        actions,
      };
    }),
  };
}

export function createQuickControlModule({ BaseUrl }) {
  const fetchFloors = createAsyncThunk('quickControl/fetchFloors', async () => {
    const response = await BaseUrl.get('/floor/list');
    return response.data.floors || [];
  });

  let quickControlsListInflight = null;
  const fetchQuickControls = createAsyncThunk('quickControl/fetchQuickControls', async () => {
    if (quickControlsListInflight) {
      return await quickControlsListInflight;
    }
    quickControlsListInflight = BaseUrl.get('/quick_control/list')
      .then((response) => response.data)
      .finally(() => {
        quickControlsListInflight = null;
      });
    return await quickControlsListInflight;
  });

  const createQuickControl = createAsyncThunk(
    'quickControl/createQuickControl',
    async (payload, { rejectWithValue }) => {
      try {
        const normalized = normalizeQuickControlCreatePayload(payload);
        const response = await BaseUrl.post('/quick_control/create', normalized);
        return response.data;
      } catch (err) {
        console.error('Create quick control error:', err);
        const message = formatApiErrorDetail(
          err.response?.data?.detail ?? err.response?.data?.message,
          err.message || 'Failed to create quick control'
        );
        Swal.fire({
          icon: 'error',
          title: 'Quick Control',
          text: message,
          confirmButtonText: 'OK',
        });
        return rejectWithValue(message);
      }
    }
  );

  const fetchQuickControlDetails = createAsyncThunk(
    'quickControl/fetchQuickControlDetails',
    async (controlId) => {
      const response = await BaseUrl.get(`/quick_control/details/${controlId}`);
      return response.data;
    }
  );

  const updateQuickControl = createAsyncThunk(
    'quickControl/updateQuickControl',
    async ({ controlId, payload }) => {
      const normalized = normalizeQuickControlCreatePayload(payload);
      const response = await BaseUrl.put(`/quick_control/update/${controlId}`, normalized);
      return response.data;
    }
  );

  const triggerQuickControl = createAsyncThunk(
    'quickControl/triggerQuickControl',
    async (controlId) => {
      const response = await BaseUrl.post(`/quick_control/trigger/${controlId}`);
      return response.data;
    }
  );

  const deleteQuickControl = createAsyncThunk(
    'quickControl/deleteQuickControl',
    async (controlId, { rejectWithValue }) => {
      try {
        const response = await BaseUrl.delete(`/quick_control/delete/${controlId}`);

        if (response.data && response.data.status === 'Error') {
          return rejectWithValue(response.data.message);
        }

        return { controlId, ...response.data };
      } catch (err) {
        console.error('Delete QuickControl error:', err);

        let errorMessage = '';

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
      },
      setShouldRefresh(state, action) {
        state.shouldRefresh = action.payload;
      },
    },
    extraReducers: (builder) => {
      builder
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
        .addCase(triggerQuickControl.pending, (state) => {
          state.triggerStatus = 'loading';
        })
        .addCase(triggerQuickControl.fulfilled, (state) => {
          state.triggerStatus = 'success';
        })
        .addCase(triggerQuickControl.rejected, (state) => {
          state.triggerStatus = 'failed';
        })
        .addCase(deleteQuickControl.pending, (state) => {
          state.deleteStatus = 'loading';
        })
        .addCase(deleteQuickControl.fulfilled, (state, action) => {
          state.deleteStatus = 'success';
          state.controls = state.controls.filter((c) => c.id !== action.payload.controlId);
          state.selectedControl = null;
          state.shouldRefresh = true;
        })
        .addCase(deleteQuickControl.rejected, (state, action) => {
          state.deleteStatus = 'failed';
          state.error = action.payload || action.error.message;
        })
        .addCase(updateQuickControl.pending, (state) => {
          state.updateStatus = 'loading';
        })
        .addCase(updateQuickControl.fulfilled, (state, action) => {
          state.updateStatus = 'success';
          state.selectedControl = action.payload;
          state.shouldRefresh = true;
        })
        .addCase(updateQuickControl.rejected, (state) => {
          state.updateStatus = 'failed';
        })
        .addCase(createQuickControl.fulfilled, (state) => {
          state.shouldRefresh = true;
        });
    },
  });

  const { clearSelectedControl, setShouldRefresh } = quickControlSlice.actions;
  const reducer = quickControlSlice.reducer;
  return {
    reducer,
    fetchFloors,
    fetchQuickControls,
    createQuickControl,
    fetchQuickControlDetails,
    updateQuickControl,
    triggerQuickControl,
    deleteQuickControl,
    clearSelectedControl,
    setShouldRefresh,
  };
}

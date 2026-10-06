import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { BaseUrl } from '../../../../BaseUrl';
import qs from "qs";
import { createVariantCustomGraphThunks } from '../../../../../../shared/dashboard/customGraphs/createCustomGraphThunks';
import { CUSTOM_GRAPH_VARIANTS } from '../../../../../../shared/dashboard/customGraphs/customGraphConstants';
import { normalizeWidgetTitlesResponse, filterWidgetConfigurationByUiVariant, findWidgetConfigurationItemIndex, normalizeWidgetConfigurationUiVariant, getWidgetVisibilityPersistenceKey, normalizeDashboardWidgetKey } from '../../../../../../shared/dashboard/utils/dashboardWidgetVisibilityCore';

const advancedCustomGraphThunks = createVariantCustomGraphThunks(CUSTOM_GRAPH_VARIANTS.advanced);
export const fetchCustomGraphs = advancedCustomGraphThunks.fetchCustomGraphs;
export const createCustomGraph = advancedCustomGraphThunks.createCustomGraph;
export const deleteCustomGraph = advancedCustomGraphThunks.deleteCustomGraph;
// Thunk to fetch area groups
export const fetchAreaGroups = createAsyncThunk(
  'groupOccupancy/fetchAreaGroups',
  async (_, { rejectWithValue }) => {
    try {
      const res = await BaseUrl.get('/area_group/list');
      // Your API returns an array directly
      return res.data; // not res.data.groups
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error");
    }
  }
);
// Thunk to fetch group occupancy status
export const fetchGroupOccupancyStatus = createAsyncThunk(
  'groupOccupancy/fetchStatus',
  async (groupId, { rejectWithValue }) => {
    try {
      const res = await BaseUrl.get(`/area_group/occupancy_setting/${groupId}`);
      // Use the real-time value from the processor (group_status)
      return res.data.group_status;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error");
    }
  }
);

// Thunk to update group occupancy mode
export const updateGroupOccupancy = createAsyncThunk(
  'groupOccupancy/update',
  async ({ groupId, mode }, { rejectWithValue }) => {
    try {
      const res = await BaseUrl.post('/area_group/update_setting/', {
        area_id: groupId,
        occupancy_mode: mode,
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error");
    }
  }
);
//to get single area group details 
export const fetchSingleAreaGroups = createAsyncThunk(
  'groupOccupancy/fetchSingleAreaGroups',
  async (groupId, { rejectWithValue }) => {
    try {
      const res = await BaseUrl.get(`/area_group/get/${groupId}`);
      // Your API returns an array directly
      return res.data; // not res.data.groups
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error");
    }
  }
);
//to delete area group
export const deleteAreaGroup = createAsyncThunk(
  'area-group/deleteAreaGroup',
  async (groupId, { rejectWithValue }) => {
    try {
      const res = await BaseUrl.delete(`/area_group/delete/${groupId}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error");
    }
  }
);
//to update area group
export const updateAreaGroup = createAsyncThunk(
  'area-group/updateAreaGroup',
  async ({ data, groupId }, { rejectWithValue }) => {
    try {
      const res = await BaseUrl.put(`/area_group/update/${groupId}`, data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error");
    }
  }
);
//to create email
export const createEmail = createAsyncThunk(
  'createEmail/createEmail',
  async (data, { rejectWithValue }) => {
    try {
      const res = await BaseUrl.post('/email/create',
        data
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error");
    }
  }
);
//to get email data
export const fetchEmailConfigs = createAsyncThunk(
  'email/fetchEmailConfigs',
  async (_, { rejectWithValue }) => {
    try {
      const res = await BaseUrl.get('/email/list');
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error");
    }
  }
);
//test email api
export const testEmail = createAsyncThunk(
  'testEmail/testEmail',
  async (data, { rejectWithValue }) => {
    try {
      const res = await BaseUrl.post('/email/send-test-email',
        data
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error");
    }
  }
);
//get area size load data
export const getAreaSizeLoadData = createAsyncThunk(
  'getAreaSizeLoadData/getAreaSizeLoadData',
  async (_, { rejectWithValue }) => {
    try {
      const res = await BaseUrl.get('/area/size_and_load');
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error");
    }
  }
);
//to upload help file
export const uploadHelpFile = createAsyncThunk(
  'uploadHelpFile/uploadHelpFile',
  async ({ name, file }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("file", file);

      const res = await BaseUrl.post('/help/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error");
    }
  }
);
//to get the help file list
export const getHelpFileList = createAsyncThunk(
  'getHelpFileList/getHelpFileList',
  async (_, { rejectWithValue }) => {
    try {
      const res = await BaseUrl.get('/help/list');
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error");
    }
  }
);
//to get the activity log report
export const fetchActivityReport = createAsyncThunk(
  "activityReport/fetch",
  async (params, { rejectWithValue }) => {
    try {
      const res = await BaseUrl.get("/activity_report", {
        params,
        // floor_ids[]=1&floor_ids[]=2 style
        paramsSerializer: (p) => qs.stringify(p, { arrayFormat: "repeat" }),
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data || "Request failed");
    }
  }
);

//to download activity report
export const downloadActivityReport = createAsyncThunk(
  'activityReport/download',
  async (params, { rejectWithValue }) => {
    try {
      const response = await BaseUrl.get('/activity_report/export/download', {
        params,
        paramsSerializer: (p) => qs.stringify(p, { arrayFormat: "repeat" }),
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with date range
      const startDate = params.start_date || 'start';
      const endDate = params.end_date || 'end';
      link.setAttribute('download', `activity_report_${startDate}_to_${endDate}.csv`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      // Handle error response properly
      let errorMessage = "Download failed";
      
      if (error.response) {
        if (error.response.status === 422) {
          errorMessage = "Invalid parameters. Please check your selections.";
        } else if (error.response.data instanceof Blob) {
          // Try to read the blob as text to get error message
          try {
            const text = await error.response.data.text();
            const errorData = JSON.parse(text);
            errorMessage = errorData.detail || errorData.message || errorMessage;
          } catch (parseError) {
            errorMessage = `Server error (${error.response.status})`;
          }
        } else {
          errorMessage = error.response.data?.detail || error.response.data?.message || errorMessage;
        }
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

//to send activity report by email
export const sendActivityReportEmail = createAsyncThunk(
  'activityReport/sendEmail',
  async ({ toEmail, ...params }, { rejectWithValue }) => {
    try {
      const emailParams = {
        ...params,
        to_email: toEmail
      };
      
      const response = await BaseUrl.post('/activity_report/export/send_by_email', null, {
        params: emailParams,
        paramsSerializer: (p) => qs.stringify(p, { arrayFormat: "repeat" }),
      });
      
      return response.data;
    } catch (error) {
      // Handle error response properly
      let errorMessage = "Email send failed";
      
      if (error.response) {
        if (error.response.status === 422) {
          errorMessage = "Invalid parameters. Please check your selections.";
        } else {
          errorMessage = error.response.data?.detail || error.response.data?.message || errorMessage;
        }
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);
//to get rename widget
export const fetchRenameWidgets = createAsyncThunk(
  'fetchRenameWidgets/fetchRenameWidgets',
  async (_, { rejectWithValue }) => {
    try {
      const res = await BaseUrl.get('/widgets/widget_titles');
      return normalizeWidgetTitlesResponse(res.data);
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error");
    }
  }
);
//to post new value widget
export const renameWidget = createAsyncThunk(
  'renameWidget/renameWidget',
  async (data, { rejectWithValue }) => {
    try {
      // Frontend canonical keys (e.g. total_consumption_by_group) must match
      // backend WidgetKey (e.g. consumption_by_area_groups).
      const payload = {
        ...data,
        widget_key: getWidgetVisibilityPersistenceKey(data?.widget_key),
      };
      const res = await BaseUrl.post('/widgets/rename_widget', payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error");
    }
  }
);

/** GET widget visibility configuration for the advanced UI variant. */
export const fetchWidgetConfiguration = createAsyncThunk(
  'groupOccupancy/fetchWidgetConfiguration',
  async () => {
    try {
      const res = await BaseUrl.get('/widgets/configuration', {
        params: { variant: 'advanced' },
      });
      const items = res.data?.items ?? [];
      return filterWidgetConfigurationByUiVariant(items, 'advanced');
    } catch {
      return [];
    }
  }
);

/** POST single widget visibility (Superadmin only). Merges into Redux list on success. */
export const saveWidgetVisibility = createAsyncThunk(
  'groupOccupancy/saveWidgetVisibility',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await BaseUrl.post('/widgets/configuration', payload, {
        params: { variant: 'advanced' },
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Error');
    }
  }
);

/** GET/POST shared Energy + Space dashboard layout (order + span). Superadmin saves; all roles read. */
export const fetchDashboardChartOrder = createAsyncThunk(
  'groupOccupancy/fetchDashboardChartOrder',
  async () => {
    try {
      const res = await BaseUrl.get('/widgets/dashboard_chart_order');
      return res.data ?? null;
    } catch {
      return null;
    }
  }
);

export const saveDashboardChartOrder = createAsyncThunk(
  'groupOccupancy/saveDashboardChartOrder',
  async (payload) => {
    try {
      const res = await BaseUrl.post('/widgets/dashboard_chart_order', payload);
      return res.data ?? payload;
    } catch {
      return payload;
    }
  }
);

const groupOccupancySlice = createSlice({
  name: 'groupOccupancy',
  initialState: {
    areaGroups: {
      special_area_groups: [],
      user_area_groups: [],
    },
    emailConfigs: [],
    singleGroup: {},
    areaLoad: {},
    helpFiles: [],
    items: [],
    widgets: [],
    status: null, // "Auto", "Disabled", "Vacancy", "Mixed", "Unknown"
    loading: false,
    error: null,
    updating: false,
    updateError: null,
    areaGroupsLoading: false,
    areaGroupsError: null,
    uploadStatus: null,
    uploadError: null,
    // Activity report export state
    exportLoading: false,
    exportError: null,
    exportSuccess: null,
    exportSuccessTimestamp: null,
    emailLoading: false,
    emailError: null,
    emailSuccess: null,
    emailSuccessTimestamp: null,
    widgetConfiguration: [],
    widgetConfigurationStatus: 'idle',
    customGraphs: [],
    customGraphsLoading: false,
    customGraphsError: null,
    dashboardChartOrder: null,
    dashboardChartOrderStatus: 'idle',
  },
  reducers: {
    clearExportSuccess: (state) => {
      state.exportSuccess = null;
      state.exportSuccessTimestamp = null;
    },
    clearEmailSuccess: (state) => {
      state.emailSuccess = null;
      state.emailSuccessTimestamp = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAreaGroups.pending, (state) => {
        state.areaGroupsLoading = true;
        state.areaGroupsError = null;
      })
      .addCase(fetchAreaGroups.fulfilled, (state, action) => {
        state.areaGroupsLoading = false;
        state.areaGroups = action.payload;
      })
      .addCase(fetchAreaGroups.rejected, (state, action) => {
        state.areaGroupsLoading = false;
        state.areaGroupsError = action.payload || "Failed to fetch area groups";
      })
      .addCase(fetchGroupOccupancyStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGroupOccupancyStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.status = action.payload;
      })
      .addCase(fetchGroupOccupancyStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch group occupancy status";
      })
      .addCase(updateGroupOccupancy.pending, (state) => {
        state.updating = true;
        state.updateError = null;
      })
      .addCase(updateGroupOccupancy.fulfilled, (state) => {
        state.updating = false;
      })
      .addCase(updateGroupOccupancy.rejected, (state, action) => {
        state.updating = false;
        state.updateError = action.payload || "Failed to update group occupancy";
      })
      .addCase(fetchSingleAreaGroups.pending, (state) => {
        state.areaGroupsLoading = true;
        state.areaGroupsError = null;
        // Clear existing single group data to prevent showing stale data
        state.singleGroup = {};
      })
      .addCase(fetchSingleAreaGroups.fulfilled, (state, action) => {
        state.areaGroupsLoading = false;
        state.singleGroup = action.payload;
      })
      .addCase(fetchSingleAreaGroups.rejected, (state, action) => {
        state.areaGroupsLoading = false;
        state.areaGroupsError = action.payload || "Failed to fetch area groups";
        state.singleGroup = {};
      })
      .addCase(updateAreaGroup.pending, (state) => {
        state.areaGroupsLoading = true;
        state.areaGroupsError = null;
      })
      .addCase(updateAreaGroup.fulfilled, (state, action) => {
        state.areaGroupsLoading = false;
        // Backend might return just {message: "..."} or full data
        // Only update if we have the full data structure
        if (action.payload.name && action.payload.areas) {
          state.singleGroup = {
            name: action.payload.name,
            special: action.payload.special,
            areas: action.payload.areas
          };
        }
        // If backend returns only message, keep existing singleGroup data
        // The component will re-fetch via fetchSingleAreaGroups if needed
      })
      .addCase(updateAreaGroup.rejected, (state, action) => {
        state.areaGroupsLoading = false;
        state.areaGroupsError = action.payload || "Failed to update area group";
      })
      .addCase(deleteAreaGroup.pending, (state) => {
        state.areaGroupsLoading = true;
        state.areaGroupsError = null;
      })
      .addCase(deleteAreaGroup.fulfilled, (state, action) => {
        state.areaGroupsLoading = false;
        // Clear single group data after deletion
        state.singleGroup = {};
      })
      .addCase(deleteAreaGroup.rejected, (state, action) => {
        state.areaGroupsLoading = false;
        state.areaGroupsError = action.payload || "Failed to delete area group";
      });
    builder
      .addCase(fetchEmailConfigs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmailConfigs.fulfilled, (state, action) => {
        state.loading = false;
        state.emailConfigs = action.payload;
      })
      .addCase(fetchEmailConfigs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
    builder
      .addCase(getAreaSizeLoadData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAreaSizeLoadData.fulfilled, (state, action) => {
        state.loading = false;
        state.areaLoad = action.payload;
      })
      .addCase(getAreaSizeLoadData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
    builder
      .addCase(uploadHelpFile.pending, (state) => {
        state.uploadStatus = 'loading';
        state.uploadError = null;
      })
      .addCase(uploadHelpFile.fulfilled, (state) => {
        state.uploadStatus = 'succeeded';
        state.uploadError = null;
      })
      .addCase(uploadHelpFile.rejected, (state, action) => {
        state.uploadStatus = 'failed';
        state.uploadError = action.payload || 'Upload failed';
      });
    builder
      .addCase(getHelpFileList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getHelpFileList.fulfilled, (state, action) => {
        state.loading = false;
        state.helpFiles = action.payload;
      })
      .addCase(getHelpFileList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
    builder
      .addCase(fetchActivityReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActivityReport.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchActivityReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
    builder
      .addCase(fetchRenameWidgets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRenameWidgets.fulfilled, (state, action) => {
        state.loading = false;
        state.widgets = action.payload;
      })
      .addCase(fetchRenameWidgets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Handle renameWidget loading states
      .addCase(renameWidget.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(renameWidget.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // Optimistically sync titles so dashboard/settings show the new name
        // even before fetchRenameWidgets completes (and for stale dropdown_name rows).
        const arg = action.meta?.arg;
        const key = arg?.widget_key != null ? String(arg.widget_key) : '';
        const name = arg?.new_name != null ? String(arg.new_name).trim() : '';
        if (!key || !name) return;
        if (!state.widgets || typeof state.widgets !== 'object' || !Array.isArray(state.widgets.titles)) {
          return;
        }
        const canonical = normalizeDashboardWidgetKey(key);
        const idx = state.widgets.titles.findIndex(
          (t) => t && normalizeDashboardWidgetKey(String(t.key)) === canonical
        );
        if (idx !== -1) {
          const row = state.widgets.titles[idx];
          state.widgets.titles[idx] = {
            ...row,
            key: canonical || row.key,
            title: name,
            dropdown_name: name,
          };
        } else {
          state.widgets.titles.push({
            key: canonical || key,
            title: name,
            dropdown_name: name,
          });
        }
      })
      .addCase(renameWidget.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to rename widget';
      })
      .addCase(fetchWidgetConfiguration.pending, (state) => {
        state.widgetConfigurationStatus = 'loading';
      })
      .addCase(fetchWidgetConfiguration.fulfilled, (state, action) => {
        state.widgetConfigurationStatus = 'succeeded';
        state.widgetConfiguration = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchWidgetConfiguration.rejected, (state) => {
        state.widgetConfigurationStatus = 'succeeded';
        state.widgetConfiguration = [];
      })
      .addCase(saveWidgetVisibility.fulfilled, (state, action) => {
        const row = action.payload;
        if (!row || typeof row.widget_key !== 'string') return;
        if (!Array.isArray(state.widgetConfiguration)) {
          state.widgetConfiguration = [];
        }
        const uiVariant = normalizeWidgetConfigurationUiVariant(
          row.ui_variant ?? action.meta?.arg?.ui_variant
        );
        const merged = { ...row, ui_variant: uiVariant };
        const idx = findWidgetConfigurationItemIndex(
          state.widgetConfiguration,
          merged.widget_key,
          uiVariant
        );
        if (idx >= 0) {
          state.widgetConfiguration[idx] = merged;
        } else {
          state.widgetConfiguration.push(merged);
        }
      })
      .addCase(fetchCustomGraphs.pending, (state) => {
        state.customGraphsLoading = true;
        state.customGraphsError = null;
      })
      .addCase(fetchCustomGraphs.fulfilled, (state, action) => {
        state.customGraphsLoading = false;
        state.customGraphs = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchCustomGraphs.rejected, (state, action) => {
        state.customGraphsLoading = false;
        state.customGraphsError = action.payload || 'Failed to load custom graphs';
      })
      .addCase(createCustomGraph.pending, (state) => {
        state.customGraphsLoading = true;
        state.customGraphsError = null;
      })
      .addCase(createCustomGraph.fulfilled, (state) => {
        state.customGraphsLoading = false;
      })
      .addCase(createCustomGraph.rejected, (state, action) => {
        state.customGraphsLoading = false;
        state.customGraphsError = action.payload || 'Failed to add graph';
      })
      .addCase(deleteCustomGraph.fulfilled, (state) => {
        state.customGraphsLoading = false;
      })
      // Handle activity report download states
      .addCase(downloadActivityReport.pending, (state) => {
        state.exportLoading = true;
        state.exportError = null;
        state.exportSuccess = null;
      })
      .addCase(downloadActivityReport.fulfilled, (state, action) => {
        state.exportLoading = false;
        state.exportSuccess = action.payload;
        state.exportSuccessTimestamp = Date.now();
        state.exportError = null;
      })
      .addCase(downloadActivityReport.rejected, (state, action) => {
        state.exportLoading = false;
        state.exportError = action.payload || 'Failed to download activity report';
        state.exportSuccess = null;
      })
      // Handle activity report email states
      .addCase(sendActivityReportEmail.pending, (state) => {
        state.emailLoading = true;
        state.emailError = null;
        state.emailSuccess = null;
      })
      .addCase(sendActivityReportEmail.fulfilled, (state, action) => {
        state.emailLoading = false;
        state.emailSuccess = action.payload;
        state.emailSuccessTimestamp = Date.now();
        state.emailError = null;
      })
      .addCase(sendActivityReportEmail.rejected, (state, action) => {
        state.emailLoading = false;
        state.emailError = action.payload || 'Failed to send activity report email';
        state.emailSuccess = null;
      })
      .addCase(fetchDashboardChartOrder.pending, (state) => {
        state.dashboardChartOrderStatus = 'loading';
      })
      .addCase(fetchDashboardChartOrder.fulfilled, (state, action) => {
        state.dashboardChartOrderStatus = 'succeeded';
        state.dashboardChartOrder = action.payload;
      })
      .addCase(fetchDashboardChartOrder.rejected, (state) => {
        state.dashboardChartOrderStatus = 'succeeded';
        state.dashboardChartOrder = state.dashboardChartOrder ?? null;
      })
      .addCase(saveDashboardChartOrder.fulfilled, (state, action) => {
        const fromArg =
          action.meta?.arg && typeof action.meta.arg === 'object' ? action.meta.arg : {};
        const fromRes =
          action.payload && typeof action.payload === 'object' ? action.payload : {};
        state.dashboardChartOrder = {
          ...(state.dashboardChartOrder || {}),
          ...fromRes,
          ...fromArg,
        };
      });
  }
});

export const { clearExportSuccess, clearEmailSuccess } = groupOccupancySlice.actions;

export default groupOccupancySlice.reducer;

export const selectAreaGroups = (state) => state.groupOccupancy.areaGroups;
export const getSingleAreaGroup = (state) => state.groupOccupancy.singleGroup
export const getEmailData = (state) => state.groupOccupancy.emailConfigs
export const fetchAreaLoadData = (state) => state.groupOccupancy.areaLoad
export const selectGroupOccupancyStatus = (state) => state.groupOccupancy.status;
export const selectGroupOccupancyLoading = (state) => state.groupOccupancy.loading;
export const selectGroupOccupancyError = (state) => state.groupOccupancy.error;
export const selectGroupOccupancyUpdating = (state) => state.groupOccupancy.updating;
export const fetchHelpFileList = (state) => state.groupOccupancy.helpFiles;
export const getWidgetList = (state) => state.groupOccupancy.widgets;
export const selectGroupOccupancyUpdateError = (state) => state.groupOccupancy.updateError;
export const selectAreaGroupsLoading = (state) => state.groupOccupancy.areaGroupsLoading;
export const selectAreaGroupsError = (state) => state.groupOccupancy.areaGroupsError;
export const getUploadStatus = (state) => state.groupOccupancy.uploadStatus;
export const getUploadError = (state) => state.groupOccupancy.uploadError;
export const selectActivityReport = (s) => s.groupOccupancy.items;
export const getActivityReportLoading = (s) => s.groupOccupancy.loading;
export const getActivityReportError = (s) => s.groupOccupancy.error;
export const selectRenameWidgetLoading = (state) => state.groupOccupancy.loading;
export const selectRenameWidgetError = (state) => state.groupOccupancy.error;
export const selectWidgetConfiguration = (state) => state.groupOccupancy.widgetConfiguration ?? [];
export const selectWidgetConfigurationStatus = (state) => state.groupOccupancy.widgetConfigurationStatus ?? 'idle';
export const selectCustomGraphs = (state) => state.groupOccupancy.customGraphs ?? [];
export const selectCustomGraphsLoading = (state) => state.groupOccupancy.customGraphsLoading ?? false;
export const selectCustomGraphsError = (state) => state.groupOccupancy.customGraphsError ?? null;
// Activity report export selectors
export const selectActivityReportExportLoading = (state) => state.groupOccupancy.exportLoading;
export const selectActivityReportExportError = (state) => state.groupOccupancy.exportError;
export const selectActivityReportExportSuccess = (state) => state.groupOccupancy.exportSuccess;                                                             
export const selectActivityReportExportSuccessTimestamp = (state) => state.groupOccupancy.exportSuccessTimestamp;
export const selectActivityReportEmailLoading = (state) => state.groupOccupancy.emailLoading;                                                               
export const selectActivityReportEmailError = (state) => state.groupOccupancy.emailError;                                                                   
export const selectActivityReportEmailSuccess = (state) => state.groupOccupancy.emailSuccess;
export const selectActivityReportEmailSuccessTimestamp = (state) => state.groupOccupancy.emailSuccessTimestamp;
export const selectDashboardChartOrder = (state) => state.groupOccupancy.dashboardChartOrder;
export const selectDashboardChartOrderStatus = (state) => state.groupOccupancy.dashboardChartOrderStatus;

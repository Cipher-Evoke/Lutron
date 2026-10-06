import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import { normalizeAreaGroupListPayload } from "../../../../utils/normalizeAreaGroupListPayload";
import { normalizeAreaGroupListPayload } from "../../../../utils/normalizeAreaGroupListPayload";
// import { normalizeAreaGroupListPayload } from "../../../../utils/normalizeAreaGroupListPayload"; 
import { BaseUrl } from '../../../../BaseUrl';
import { pickCustomGraphScopeForStorage } from "../../../../utils/mergeCustomGraphScopeIntoApiParams";
import { isCustomGraphGroupScope } from "../../../../utils/filterGroupIdsByAreaGroupScope";
import qs from "qs";
import { normalizeWidgetTitlesResponse, getWidgetVisibilityPersistenceKey, normalizeDashboardWidgetKey, filterWidgetConfigurationByUiVariant, findWidgetConfigurationItemIndex, normalizeWidgetConfigurationUiVariant } from '../../../../../../shared/dashboard/utils/dashboardWidgetVisibilityCore';
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

function normalizeRenameError(err) {
  const d = err?.response?.data;
  if (d == null) return err?.message || 'Error';
  if (typeof d === 'string') return d;
  if (typeof d === 'object') {
    if (typeof d.detail === 'string') return d.detail;
    if (Array.isArray(d.detail) && d.detail.length) {
      const first = d.detail[0];
      if (typeof first === 'string') return first;
      if (first && typeof first.msg === 'string') return first.msg;
    }
    return d.message || d.error || 'Error';
  }
  return 'Error';
}

// -------------------- Custom Graphs (Widget Builder) -------------------- //
function normalizeCustomGraphsResponse(data) {
  if (data == null) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'object') {
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.graphs)) return data.graphs;
    if (Array.isArray(data.custom_graphs)) return data.custom_graphs;
    if (Array.isArray(data.data)) return data.data;
  }
  return [];
}

function isSpaceCustomGraphPage(page) {
  const p = String(page ?? "").toLowerCase().replace(/_/g, "-").replace(/\s+/g, "-");
  return p === "space" || p === "space-utilization" || p.startsWith("space-");
}

/**
 * When api_path is empty, use a single default per page (Energy vs Space).
 * Does not infer endpoints from graph name keywords — set api_path explicitly when needed.
 */
// function deriveCustomGraphApiPath(g) {
//   const existing = String(g?.api_path ?? "").trim();
//   if (existing) return existing;
//   const name = String(g?.name ?? "").trim();
//   if (name.startsWith("/")) return name;
//   return isSpaceCustomGraphPage(g?.page)
//   return getApiFromKeyword(g?.name);
// ? "/dashboard/space_utilization_per"
// : "/dashboard/energy_consumption";
// }

function deriveCustomGraphApiPath(g) {
  const existing = String(g?.api_path ?? "").trim();
  if (existing) return existing;

  return getApiFromKeyword(g?.name);
}

export const fetchCustomGraphs = createAsyncThunk(
  'widgets/fetchCustomGraphs',
  async (_, { rejectWithValue }) => {
    try {
      const key = "customGraphs";
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(parsed) ? parsed : [];

      return list.map((g) => ({
        ...g,
        api_path: g?.api_path?.trim?.() ? g.api_path : deriveCustomGraphApiPath(g),
      }));
    } catch (err) {
      return rejectWithValue(normalizeRenameError(err));
    }
  }
);


  function getApiFromKeyword(keyword) {
    // const k = String(keyword || "").toLowerCase();
    const k = String(keyword || "").toLowerCase().trim();
  
    // 🔋 ENERGY

    if (
      k.includes("unified") ||
      k.includes("combined") ||
      k.includes("energy consumption")
    ) {
      return "/dashboard/unified_energy_consumption_savings_data";
    }
    // if (k.includes("unified") || k.includes("combined"))  || k.includes("energy consumption")
    //   return "/dashboard/unified_energy_consumption_savings_data";
  
    if (k.includes("energy"))
      return "/dashboard/energy_consumption";
  
    if (k.includes("saving") && k.includes("strategy"))
      return "/dashboard/saving_by_stratergy";
  
    if (k.includes("saving"))
      return "/dashboard/energy_savings";
  
    // 💡 LIGHT POWER DENSITY
    if (
      k.includes("light power") ||
      k.includes("power density") ||
      k.includes("light density") ||
      (k.includes("light") && (k.includes("power") || k.includes("density")))
    ) {
      return "/dashboard/light_power_density";
    }
  
    // 📊 CONSUMPTION
    if (k.includes("group") && k.includes("consumption"))
      return "/dashboard/total_consumption/by_group";
  
    if (k.includes("peak") && k.includes("consumption"))
      return "/dashboard/peak_min_consumption";
  
    // 🏢 OCCUPANCY
    if (k.includes("instant"))
      return "/dashboard/instant_occupancy_count";
  
    if (k.includes("occupancy") && k.includes("group") && k.includes("logs"))
      return "/dashboard/occupancy_by_group_from_logs";
  
    if (k.includes("occupancy") && k.includes("group"))
      return "/dashboard/occupancy_by_group";
  
    if (k.includes("peak") && k.includes("occupancy") && k.includes("logs"))
      return "/dashboard/peak_min_occupancy_from_logs";
  
    if (k.includes("peak") && k.includes("occupancy"))
      return "/dashboard/peak_min_occupancy";
  
    if (k.includes("occupancy"))
      return "/dashboard/occupancy_count";
  
    // 🧭 UTILIZATION
    if (k.includes("utilization") && k.includes("logs"))
      return "/dashboard/space_utilization_per_from_logs";
  
    if (k.includes("utilization"))
      return "/dashboard/space_utilization_per";
  
    // ✅ DEFAULT
    return "/dashboard/energy_consumption";
  }
  export { getApiFromKeyword };
  // const map = [
  //   { match: ["energy"], api: "/dashboard/energy_consumption" },
  //   { match: ["saving"], api: "/dashboard/energy_savings" },
  //   { match: ["light"], api: "/dashboard/light_power_density" },
  //   { match: ["peak"], api: "/dashboard/peak_min_consumption" },
  //   { match: ["utilization"], api: "/dashboard/space_utilization_per" },
  //   { match: ["occupancy"], api: "/dashboard/occupancy_count" },
  //   { match: ["instant"], api: "/dashboard/instant_occupancy_count" },
  // ];

//   for (const m of map) {
//     if (m.match.some(word => k.includes(word))) {
//       return m.api;
//     }
//   }

//   return "/dashboard/energy_consumption"; // default
// }

export const createCustomGraph = createAsyncThunk(

  'widgets/createCustomGraph',


  async (payload, { rejectWithValue }) => {
    try {
      const key = "customGraphs";
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(parsed) ? parsed : [];

      // const name = String(payload?.name ?? "").trim();
      const page = payload?.page;
      const graph_type = payload?.graph_type;

      const name = String(payload?.name ?? "").trim();

      if (!name) {
        return rejectWithValue("Widget name is required");
      }



      // const item = {
      //   id: String(Date.now()) + "_" + Math.random().toString(16).slice(2),
      //   page,
      //   graph_type,
      //   name,
      //   api_path: deriveCustomGraphApiPath({ name, page, api_path: payload?.api_path }),
      // };

      const rawApiPath = String(payload?.api_path ?? '').trim();
      const apiPathFromKeyword = getApiFromKeyword(name);
      const api_path = rawApiPath
        ? (rawApiPath.startsWith("/") ? rawApiPath : `/dashboard/${rawApiPath.replace(/^\/+/, "")}`)
        : apiPathFromKeyword;
      const scopeFields = pickCustomGraphScopeForStorage(payload);

      const item = {
        id: String(Date.now()) + "_" + Math.random().toString(16).slice(2),
        page,
        graph_type,
        name,
        api_path,
        ...scopeFields,
        ...(isCustomGraphGroupScope(payload?.group_scope)
          ? { group_scope: payload.group_scope }
          : {}),
        ...(Array.isArray(payload?.scoped_group_ids) && payload.scoped_group_ids.length > 0
          ? { scoped_group_ids: payload.scoped_group_ids }
          : {}),
      };

      const next = [...list, item];
      localStorage.setItem(key, JSON.stringify(next));
      return item;
    } catch (err) {
      return rejectWithValue(normalizeRenameError(err));
    }
  }
);
//to get rename widget
export const fetchRenameWidgets = createAsyncThunk(
  'fetchRenameWidgets/fetchRenameWidgets',
  async (_, { rejectWithValue }) => {
    try {
      const res = await BaseUrl.get('/widgets/widget_titles', {
        params: { _: Date.now() },
      });
      return normalizeWidgetTitlesResponse(res.data);
    } catch (err) {
      return rejectWithValue(normalizeRenameError(err));
    }
  }
);
//to post new value widget
export const Widget = createAsyncThunk(
  'Widget/Widget',
  async (data, { rejectWithValue }) => {
    const trimmed = String(data.new_name ?? '').trim();
    // Frontend canonical keys (e.g. total_consumption_by_group) must match
    // backend WidgetKey (e.g. consumption_by_area_groups). Combined widgets
    // are unchanged (not in the API enum).
    const apiWidgetKey = getWidgetVisibilityPersistenceKey(data.widget_key);
    const minimalBody = {
      widget_key: apiWidgetKey,
      new_name: trimmed,
    };
    const fullBody = {
      ...minimalBody,
      dropdown_name: trimmed,
      title: trimmed,
    };

    const postRename = async (body) => {
      const res = await BaseUrl.post('/widgets/rename_widget', body);
      const payload = res.data;
      if (payload != null && (Array.isArray(payload?.titles) || Array.isArray(payload))) {
        return normalizeWidgetTitlesResponse(payload);
      }
      return payload;
    };

    try {
      return await postRename(fullBody);
    } catch (err) {
      if (err?.response?.status === 422) {
        try {
          return await postRename(minimalBody);
        } catch (err2) {
          return rejectWithValue(normalizeRenameError(err2));
        }
      }
      return rejectWithValue(normalizeRenameError(err));
    }
  }
);

/** GET/POST customized dashboard widget slot order (variant-scoped). */
export const fetchDashboardChartOrder = createAsyncThunk(
  'groupOccupancy/fetchDashboardChartOrder',
  async () => {
    try {
      const res = await BaseUrl.get('/widgets/dashboard_chart_order', {
        params: { variant: 'customized' },
      });
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
      const res = await BaseUrl.post('/widgets/dashboard_chart_order', payload, {
        params: { variant: 'customized' },
      });
      return res.data ?? payload;
    } catch {
      return payload;
    }
  }
);

/** GET widget visibility configuration for the customized UI variant. */
export const fetchWidgetConfiguration = createAsyncThunk(
  'groupOccupancy/fetchWidgetConfiguration',
  async () => {
    try {
      const res = await BaseUrl.get('/widgets/configuration', {
        params: { variant: 'customized' },
      });
      const items = res.data?.items ?? [];
      return filterWidgetConfigurationByUiVariant(items, 'customized');
    } catch {
      return [];
    }
  }
);

/** POST single widget visibility (Superadmin only). */
export const saveWidgetVisibility = createAsyncThunk(
  'groupOccupancy/saveWidgetVisibility',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await BaseUrl.post('/widgets/configuration', payload, {
        params: { variant: 'customized' },
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Error');
    }
  }
);

const groupOccupancySlice = createSlice({
  name: 'groupOccupancy',
  initialState: {
    areaGroups: {
      special_area_groups: [],
      user_area_groups: [],
      dashboard_area_groups: [],
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
    // Widget rename + widget_titles fetch (do not share `loading`/`error` with other thunks)
    renameWidgetLoading: false,
    renameWidgetError: null,
    // Custom graphs
    customGraphs: [],
    customGraphsLoading: false,
    customGraphsError: null,
    widgetConfiguration: [],
    widgetConfigurationStatus: 'idle',
    dashboardChartOrder: null,
    dashboardChartOrderStatus: 'idle',
  },
  reducers: {
    clearRenameWidgetError: (state) => {
      state.renameWidgetError = null;
    },
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
      })
      .addCase(fetchAreaGroups.fulfilled, (state, action) => {
        state.areaGroupsLoading = false;
        state.areaGroups = normalizeAreaGroupListPayload(action.payload);
      })
      .addCase(fetchAreaGroups.rejected, (state, action) => {
        state.areaGroupsLoading = false;
        state.areaGroupsError = action.payload || "Failed to fetch area groups";
      })

  // extraReducers: (builder) => {
  //   builder
  //     .addCase(fetchAreaGroups.pending, (state) => {
  //       state.areaGroupsLoading = true;
  //       state.areaGroupsError = null;
  //     })


  //     builder.addCase(fetchAreaGroups.fulfilled, (state, action) => {
  //       state.areaGroupsLoading = false;
  //       state.areaGroups = normalizeAreaGroupListPayload(action.payload); // 🔥 replace here
  //   });
  //     // .addCase(fetchAreaGroups.fulfilled, (state, action) => {
  //     //   state.areaGroupsLoading = false;
  //     //   state.areaGroups = action.payload;
  //     // })
  //     .addCase(fetchAreaGroups.rejected, (state, action) => {
  //       state.areaGroupsLoading = false;
  //       state.areaGroupsError = action.payload || "Failed to fetch area groups";
  //     })

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
        state.renameWidgetLoading = true;
        state.renameWidgetError = null;
      })
      .addCase(fetchRenameWidgets.fulfilled, (state, action) => {
        state.renameWidgetLoading = false;
        state.renameWidgetError = null;
        state.widgets = action.payload;
      })
      .addCase(fetchRenameWidgets.rejected, (state, action) => {
        state.renameWidgetLoading = false;
        state.renameWidgetError =
          action.payload || 'Failed to load widget titles';
      })
      // Handle Widget loading states
      .addCase(Widget.pending, (state) => {
        state.renameWidgetLoading = true;
        state.renameWidgetError = null;
      })
      .addCase(Widget.fulfilled, (state, action) => {
        state.renameWidgetLoading = false;
        state.renameWidgetError = null;
        const p = action.payload;
        if (p && typeof p === 'object' && Array.isArray(p.titles)) {
          state.widgets = p;
          return;
        }
        // POST often returns { message: "ok" } with no titles — update local list so
        // getWidgetTitle (dropdown_name) matches what the user just saved.
        const arg = action.meta?.arg;
        const key =
          arg && arg.widget_key != null ? String(arg.widget_key) : '';
        const name =
          arg && arg.new_name != null ? String(arg.new_name).trim() : '';
        if (!key || !name) return;
        if (
          !state.widgets ||
          typeof state.widgets !== 'object' ||
          !Array.isArray(state.widgets.titles)
        ) {
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
      .addCase(Widget.rejected, (state, action) => {
        state.renameWidgetLoading = false;
        state.renameWidgetError =
          action.payload || 'Failed to rename widget';
      })
      .addCase(fetchCustomGraphs.pending, (state) => {
        state.customGraphsLoading = true;
        state.customGraphsError = null;
      })
      .addCase(fetchCustomGraphs.fulfilled, (state, action) => {
        state.customGraphsLoading = false;
        state.customGraphsError = null;
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
        state.customGraphsError = null;
      })
      .addCase(createCustomGraph.rejected, (state, action) => {
        state.customGraphsLoading = false;
        state.customGraphsError = action.payload || 'Failed to create custom graph';
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
          row.ui_variant ?? action.meta?.arg?.ui_variant ?? 'customized'
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
      });
  }
});
// 🔥 REQUIRED EXPORTS

// export const getApiFromKeyword = (keyword) => {
//   const k = keyword.toLowerCase();

//   if (k.includes("energy consumption"))
//     return "/dashboard/energy_consumption";

//   if (k.includes("energy saving"))
//     return "/dashboard/energy_savings";

//   if (k.includes("utilization"))
//     return "/dashboard/space_utilization_per";

//   if (k.includes("occupancy"))
//     return "/dashboard/occupancy_by_group";

//   return "";
// };


export const DUPLICATE_CUSTOM_GRAPH_NAME_MSG =
  "Widget name already exists. Please use a different name.";

/** Canonical list of dashboard API paths used for Widgets dropdowns and defaults. */
export const BUILTIN_WIDGET_DEFAULT_API_PATHS = {
  // Legacy alias keys (kept for compatibility)
  energy: "/dashboard/energy_consumption",
  utilization: "/dashboard/space_utilization_per",
  // Energy tab built-ins
  consumption: "/dashboard/energy_consumption",
  savings: "/dashboard/energy_savings",
  savings_by_strategy: "/dashboard/saving_by_stratergy",
  total_consumption_by_group: "/dashboard/total_consumption/by_group",
  consumption_by_area_groups: "/dashboard/total_consumption/by_group",
  light_power_density: "/dashboard/light_power_density",
  peak_and_minimum_consumption: "/dashboard/peak_min_consumption",
  consumption_saving: "/dashboard/unified_energy_consumption_savings_data",
  // Space tab built-ins
  instant_occupancy_count: "/dashboard/instant_occupancy_count",
  utilization_by_area_group: "/dashboard/occupancy_by_group",
  utilization_by_area: "/dashboard/space_utilization_per",
  peak_and_minimum_utilization: "/dashboard/occupancy_count",
};

/**
 * Default API paths for Settings → Widgets → Edit built-in chart.
 * Previously only `energy` / `utilization` had defaults; other keys had "" so
 * overrides could not save when switching Energy/Space (requires non-empty ap + graph_type).
 */
export const getBuiltinWidgetDefaultApiPath = (key) => {
  const k = String(key ?? "").trim();
  return BUILTIN_WIDGET_DEFAULT_API_PATHS[k] || "";
};

/**
 * Build peer list for Settings → Widgets graph name validation.
 * Expects full Redux root state (Widgets passes store.getState()).
 */
export function buildPeerGraphDescriptorsForKeywordValidation(state, options = {}) {
  const excludeCustomGraphId =
    options.excludeCustomGraphId != null ? String(options.excludeCustomGraphId) : null;
  const excludeBuiltinWidgetKey =
    options.excludeBuiltinWidgetKey != null
      ? String(options.excludeBuiltinWidgetKey).trim()
      : "";

  const go = state?.groupOccupancy ?? {};
  const customGraphs = Array.isArray(go.customGraphs) ? go.customGraphs : [];
  const titles = Array.isArray(go.widgets?.titles) ? go.widgets.titles : [];

  const peers = [];

  for (const g of customGraphs) {
    const id = String(g?.id ?? "");
    if (excludeCustomGraphId && id === excludeCustomGraphId) continue;
    const name = String(g?.name ?? "").trim();
    peers.push({
      id,
      name,
      keyword: name.toLowerCase(),
      apiPath: String(g?.api_path ?? "").trim(),
    });
  }

  for (const t of titles) {
    const key = String(t?.key ?? "").trim();
    if (!key) continue;
    if (excludeBuiltinWidgetKey && key === excludeBuiltinWidgetKey) continue;
    const name = String(t?.dropdown_name ?? t?.title ?? "").trim();
    peers.push({
      id: `builtin:${key}`,
      name,
      keyword: name.toLowerCase(),
      apiPath: getBuiltinWidgetDefaultApiPath(key),
    });
  }

  return peers;
}

/**
 * Returns { isValid, message } as used by Widgets.jsx handleSaveGraphEdit.
 * resolvedApiPath is reserved for future stricter checks (e.g. duplicate endpoints).
 */
export function validateKeywordConflictForGraph(newName, _resolvedApiPath, peers) {
  const name = String(newName ?? "").trim();
  const nn = name.toLowerCase();
  const list = Array.isArray(peers) ? peers : [];

  if (!name) {
    return { isValid: false, message: "Name is required." };
  }

  const nameDup = list.some(
    (p) => p && p.name && String(p.name).trim().toLowerCase() === nn
  );
  if (nameDup) {
    return { isValid: false, message: DUPLICATE_CUSTOM_GRAPH_NAME_MSG };
  }

  return { isValid: true, message: "" };
}

export const {
  clearExportSuccess,
  clearEmailSuccess,
  clearRenameWidgetError,
} = groupOccupancySlice.actions;

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
export const selectRenameWidgetLoading = (state) =>
  state.groupOccupancy.renameWidgetLoading;
export const selectRenameWidgetError = (state) =>
  state.groupOccupancy.renameWidgetError;
export const selectCustomGraphs = (state) => state.groupOccupancy.customGraphs;
export const selectCustomGraphsLoading = (state) => state.groupOccupancy.customGraphsLoading;
export const selectCustomGraphsError = (state) => state.groupOccupancy.customGraphsError;
export const selectDashboardChartOrder = (state) => state.groupOccupancy.dashboardChartOrder;
export const selectDashboardChartOrderStatus = (state) =>
  state.groupOccupancy.dashboardChartOrderStatus;
export const selectWidgetConfiguration = (state) => state.groupOccupancy.widgetConfiguration ?? [];
export const selectWidgetConfigurationStatus = (state) =>
  state.groupOccupancy.widgetConfigurationStatus ?? 'idle';
// Activity report export selectors
export const selectActivityReportExportLoading = (state) => state.groupOccupancy.exportLoading;
export const selectActivityReportExportError = (state) => state.groupOccupancy.exportError;
export const selectActivityReportExportSuccess = (state) => state.groupOccupancy.exportSuccess;
export const selectActivityReportExportSuccessTimestamp = (state) => state.groupOccupancy.exportSuccessTimestamp;
export const selectActivityReportEmailLoading = (state) => state.groupOccupancy.emailLoading;
export const selectActivityReportEmailError = (state) => state.groupOccupancy.emailError;
export const selectActivityReportEmailSuccess = (state) => state.groupOccupancy.emailSuccess;
export const selectActivityReportEmailSuccessTimestamp = (state) => state.groupOccupancy.emailSuccessTimestamp;

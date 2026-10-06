/** Shared slice — Phase 5.1 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { resolveApiAssetUrl } from '../../utils/resolveMediaUrl';

export function createHomeModule({ BaseUrl }) {

  const getLutronData = createAsyncThunk(
      "getLutronData", async () => {
          try {
              // console.log("getAuthHeaders", getAuthHeaders())
              const response = await BaseUrl.get(`/home/lutron`);
              // console.log("response.data", response.data)

              return response.data;
          } catch (error) {
              throw error
          }
      })

  const getLutronDataClient = createAsyncThunk(
      "getLutronDataClient", async (_, { rejectWithValue }) => {
          try {
              const response = await BaseUrl.get(`/home/client`);
              return response.data;
          } catch (error) {
              // Return null instead of throwing to prevent multiple retries
              // Only log in development
              if (process.env.NODE_ENV === 'development') {
                  console.warn('Failed to fetch client data:', error.response?.status || error.message);
              }
              return rejectWithValue(error.response?.data || error.message);
          }
      })


  const getLutronDataProject = createAsyncThunk(
      "getLutronDataProject", async () => {
          try {
              const response = await BaseUrl.get(`/home/project`);
              return response.data;
          } catch (error) {
              throw error
          }
      })

  // Add save actions
  const saveLutronData = createAsyncThunk(
      "saveLutronData", async (formData, { rejectWithValue }) => {
          try {
              const response = await BaseUrl.post(`/home/lutron`, formData, {
                  headers: {
                      'Content-Type': 'multipart/form-data',
                  },
              });
              return response.data;
          } catch (error) {
              return rejectWithValue(error.response?.data || error.message);
          }
      }
  );

  const saveClientData = createAsyncThunk(
      "saveClientData", async (formData, { rejectWithValue }) => {
          try {
              const response = await BaseUrl.post(`/home/client`, formData, {
                  headers: {
                      'Content-Type': 'multipart/form-data',
                  },
              });
              return response.data;
          } catch (error) {
              return rejectWithValue(error.response?.data || error.message);
          }
      }
  );

  const saveProjectData = createAsyncThunk(
      "saveProjectData", async (formData, { rejectWithValue }) => {
          try {
              const response = await BaseUrl.post(`/home/project`, formData, {
                  headers: {
                      'Content-Type': 'multipart/form-data',
                  },
              });
              return response.data;
          } catch (error) {
              return rejectWithValue(error.response?.data || error.message);
          }
      }
  );

  const DASHBOARD_OVERVIEW_TIMEOUT_MS = 30000;

  const getDashboardOverview = createAsyncThunk(
      "home/getDashboardOverview",
      async (_, { rejectWithValue, signal }) => {
          try {
              const response = await BaseUrl.get("/home/dashboard", {
                  timeout: DASHBOARD_OVERVIEW_TIMEOUT_MS,
                  signal,
              });
              return response.data;
          } catch (error) {
              if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError") {
                  return rejectWithValue("Request cancelled");
              }
              if (error?.code === "ECONNABORTED") {
                  return rejectWithValue("Dashboard overview request timed out. Check that the API server is running.");
              }
              return rejectWithValue(error.response?.data || error.message);
          }
      }
  );

  const homeSlice = createSlice({
      name: "home",
      initialState: {
          homeData: {},
          homeClient: {},
          homeProject: {},
          loading: false,
          error: null,
          saveLoading: false,
          saveError: null,
          dashboardOverview: null,
          dashboardOverviewLoading: false,
          dashboardOverviewError: null,
      },
      reducers: {
          clearSaveError: (state) => {
              state.saveError = null;
          },

      },
      extraReducers: (builder) => {
          builder
              .addCase(getLutronData.pending, (state) => {
                  state.loading = true
              })
              .addCase(getLutronData.fulfilled, (state, action) => {
                  state.loading = false
                  state.homeData = action.payload

                  const rawPath = action.payload.floor_image || action.payload.floor_image || "";
                  state.pdfUrl = resolveApiAssetUrl(rawPath) || rawPath || null;
              })
              .addCase(getLutronData.rejected, (state, action) => {
                  state.loading = false
                  state.error = action.error.message
              })


              .addCase(getLutronDataClient.pending, (state) => {
                  state.loading = true
              })
              .addCase(getLutronDataClient.fulfilled, (state, action) => {
                  state.loading = false
                  state.homeClient = action.payload

                  const rawPath = action.payload.floor_image || action.payload.floor_image || "";
                  state.pdfUrl = resolveApiAssetUrl(rawPath) || rawPath || null;
              })
              .addCase(getLutronDataClient.rejected, (state, action) => {
                  state.loading = false
                  // Don't set error for 404s - endpoint might not be available
                  // Only set error for other types of errors
                  if (action.payload && !action.payload.toString().includes('404')) {
                      state.error = action.payload
                  } else {
                      // Set empty client data instead of error for 404s
                      state.homeClient = {}
                  }
              })


              .addCase(getLutronDataProject.pending, (state) => {
                  state.loading = true
              })
              .addCase(getLutronDataProject.fulfilled, (state, action) => {
                  state.loading = false
                  state.homeProject = action.payload

                  // const API_URL = process.env.REACT_APP_API_URL || "";
                  // const rawPath = action.payload.floor_image || action.payload.floor_image || "";
                  // state.pdfUrl = rawPath.startsWith("http") ? rawPath : `${API_URL}${rawPath}`;
              })
              .addCase(getLutronDataProject.rejected, (state, action) => {
                  state.loading = false
                  state.error = action.error.message
              })

              // Save cases
              .addCase(saveLutronData.pending, (state) => {
                  state.saveLoading = true;
                  state.saveError = null;
              })
              .addCase(saveLutronData.fulfilled, (state, action) => {
                  state.saveLoading = false;
                  state.homeData = { ...state.homeData, ...action.payload };
              })
              .addCase(saveLutronData.rejected, (state, action) => {
                  state.saveLoading = false;
                  state.saveError = action.payload;
              })

              .addCase(saveClientData.pending, (state) => {
                  state.saveLoading = true;
                  state.saveError = null;
              })
              .addCase(saveClientData.fulfilled, (state, action) => {
                  state.saveLoading = false;
                  state.homeClient = { ...state.homeClient, ...action.payload };
              })
              .addCase(saveClientData.rejected, (state, action) => {
                  state.saveLoading = false;
                  state.saveError = action.payload;
              })

              .addCase(saveProjectData.pending, (state) => {
                  state.saveLoading = true;
                  state.saveError = null;
              })
              .addCase(saveProjectData.fulfilled, (state, action) => {
                  state.saveLoading = false;
                  state.homeProject = { ...state.homeProject, ...action.payload };
              })
              .addCase(saveProjectData.rejected, (state, action) => {
                  state.saveLoading = false;
                  state.saveError = action.payload;
              })

              .addCase(getDashboardOverview.pending, (state) => {
                  state.dashboardOverviewLoading = true;
                  state.dashboardOverviewError = null;
              })
              .addCase(getDashboardOverview.fulfilled, (state, action) => {
                  state.dashboardOverviewLoading = false;
                  state.dashboardOverview = action.payload;
              })
              .addCase(getDashboardOverview.rejected, (state, action) => {
                  state.dashboardOverviewLoading = false;
                  state.dashboardOverviewError = action.payload;
              })
      }
  })

  const {  clearSaveError  } = homeSlice.actions;
  const reducer = homeSlice.reducer;
  const homeDataList = (state) => state.home.homeData;
  const homeDataClient = (state) => state.home.homeClient;
  const homeDataProject = (state) => state.home.homeProject;
  const selectDashboardOverview = (state) => state.home.dashboardOverview;
  const selectDashboardOverviewLoading = (state) => state.home.dashboardOverviewLoading;
  const selectDashboardOverviewError = (state) => state.home.dashboardOverviewError;


  return {
    reducer,
    getLutronData,
    getLutronDataClient,
    getLutronDataProject,
    saveLutronData,
    saveClientData,
    saveProjectData,
    getDashboardOverview,
    homeSlice,
    homeDataList,
    homeDataClient,
    homeDataProject,
    selectDashboardOverview,
    selectDashboardOverviewLoading,
    selectDashboardOverviewError,
    clearSaveError,
  };
}

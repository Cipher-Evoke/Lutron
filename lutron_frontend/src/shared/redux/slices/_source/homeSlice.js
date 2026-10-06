import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { BaseUrl } from '../../../BaseUrl';

export const getLutronData = createAsyncThunk(
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

export const getLutronDataClient = createAsyncThunk(
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


export const getLutronDataProject = createAsyncThunk(
    "getLutronDataProject", async () => {
        try {
            const response = await BaseUrl.get(`/home/project`);
            return response.data;
        } catch (error) {
            throw error
        }
    })

// Add save actions
export const saveLutronData = createAsyncThunk(
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

export const saveClientData = createAsyncThunk(
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

export const saveProjectData = createAsyncThunk(
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

export const getDashboardOverview = createAsyncThunk(
    "home/getDashboardOverview",
    async (_, { rejectWithValue }) => {
        try {
            const response = await BaseUrl.get("/home/dashboard");
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const homeSlice = createSlice({
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

                const API_URL = process.env.REACT_APP_API_URL || "https://lutron.onrender.com";
                const rawPath = action.payload.floor_image || action.payload.floor_image || "";
                state.pdfUrl = rawPath.startsWith("http") ? rawPath : `${API_URL}${rawPath}`;
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

                const API_URL = process.env.REACT_APP_API_URL || "https://lutron.onrender.com";
                const rawPath = action.payload.floor_image || action.payload.floor_image || "";
                state.pdfUrl = rawPath.startsWith("http") ? rawPath : `${API_URL}${rawPath}`;
            })
            .addCase(getLutronDataClient.rejected, (state, action) => {
                state.loading = false
                const payloadText = action.payload == null ? "" : String(action.payload)
                const missingClient = !action.payload || payloadText.includes("404")
                if (!missingClient) {
                    state.error = action.payload
                    return
                }
                // A later failed refresh must not wipe a logo that already loaded.
                if (!state.homeClient?.logo_image && !state.homeClient?.name) {
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

export const { clearSaveError } = homeSlice.actions;
export default homeSlice.reducer;
export const homeDataList = (state) => state.home.homeData;
export const homeDataClient = (state) => state.home.homeClient;
export const homeDataProject = (state) => state.home.homeProject;
export const selectDashboardOverview = (state) => state.home.dashboardOverview;
export const selectDashboardOverviewLoading = (state) => state.home.dashboardOverviewLoading;
export const selectDashboardOverviewError = (state) => state.home.dashboardOverviewError;


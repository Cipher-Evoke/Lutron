// src/features/theme/themeSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { BaseUrl } from "../../../BaseUrl";
import { getToken } from "../auth/userlogin"; // Import getToken

// Helper to get auth headers
const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${getToken()}` }
});

// Thunk to fetch theme settings from FastAPI /theme/ endpoint
export const fetchThemeSettings = createAsyncThunk(
  "theme/fetchSettings",
  async (_, { rejectWithValue }) => {
    try {
      // Make sure BaseUrl is configured to point to your FastAPI server
     
      const response = await BaseUrl.get("/theme/");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.statusText ||
        error.message
      );
    }
  }
);
//to get application theme color 
export const fetchApplicationTheme = createAsyncThunk(
  "theme/fetchApplicationTheme",
  async (_, { rejectWithValue }) => {
    try {
      // Make sure BaseUrl is configured to point to your FastAPI server
      // e.g. axios.create({ baseURL: 'http://localhost:8000' })
      const response = await BaseUrl.get("/theme/application", getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.statusText ||
        error.message
      );
    }
  }
);
//to send application theme color to backend
export const updateApplicationTheme = createAsyncThunk(
  "theme/updateApplicationTheme",
  async (data, { rejectWithValue }) => {
    try {
      // Make sure BaseUrl is configured to point to your FastAPI server
      // e.g. axios.create({ baseURL: 'http://localhost:8000' })
      const response = await BaseUrl.post("/theme/application", data, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.statusText ||
        error.message
      );
    }
  }
);
//to get heatmap theme color 
export const fetchHeatMapTheme = createAsyncThunk(
  "theme/fetchHeatMapTheme",
  async (_, { rejectWithValue }) => {
    try {
      // Make sure BaseUrl is configured to point to your FastAPI server
      // e.g. axios.create({ baseURL: 'http://localhost:8000' })
      const response = await BaseUrl.get("/theme/heatmap", getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.statusText ||
        error.message
      );
    }
  }
);
//to send heat map theme color to backend
export const updateHeatMapTheme = createAsyncThunk(
  "theme/updateHeatMapTheme",
  async (data, { rejectWithValue }) => {
    try {
      // Make sure BaseUrl is configured to point to your FastAPI server
      // e.g. axios.create({ baseURL: 'http://localhost:8000' })
      const response = await BaseUrl.post("/theme/heatmap", data, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.statusText ||
        error.message
      );
    }
  }
);
//to get background image 
export const fetchBackgroundImage = createAsyncThunk(
  "theme/fetchBackgroundImage",
  async (_, { rejectWithValue }) => {
    try {
      // Make sure BaseUrl is configured to point to your FastAPI server
      // e.g. axios.create({ baseURL: 'http://localhost:8000' })
      const response = await BaseUrl.get("/theme/background", getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.statusText ||
        error.message
      );
    }
  }
);
//to send background image to backend
export const updateBackgroundImage = createAsyncThunk(
  "theme/updateBackgroundImage",
  async (data, { rejectWithValue }) => {
    try {
      // Make sure BaseUrl is configured to point to your FastAPI server
      // e.g. axios.create({ baseURL: 'http://localhost:8000' })
      const response = await BaseUrl.post("/theme/background", data, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.statusText ||
        error.message
      );
    }
  }
);
const themeSlice = createSlice({
  name: "theme",
  initialState: {

    settings: null,  // Will hold the entire JSON response from /theme/
    applicationTheme: {},
    heatMapTheme: {},
    backgroundImage: {},
    loading: false,

    error: null,
  },
  reducers: {
   
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchThemeSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchThemeSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload; // e.g. {status, background_image, ui_theme_colors, heatmap_colors}
      })
      .addCase(fetchThemeSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
    builder
      .addCase(fetchApplicationTheme.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchApplicationTheme.fulfilled, (state, action) => {
        state.loading = false;
        state.applicationTheme = action.payload; // e.g. {status, background_image, ui_theme_colors, heatmap_colors}
      })
      .addCase(fetchApplicationTheme.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
    builder
      .addCase(fetchHeatMapTheme.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHeatMapTheme.fulfilled, (state, action) => {
        state.loading = false;
        state.heatMapTheme = action.payload; // e.g. {status, background_image, ui_theme_colors, heatmap_colors}
      })
      .addCase(fetchHeatMapTheme.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
    builder
      .addCase(fetchBackgroundImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBackgroundImage.fulfilled, (state, action) => {
        state.loading = false;
        state.backgroundImage = action.payload; // e.g. {status, background_image, ui_theme_colors, heatmap_colors}
      })
      .addCase(fetchBackgroundImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export default themeSlice.reducer;

// Selectors:
export const selectThemeSettings = (state) => state.theme.settings;
export const selectApplicationTheme = (state) => state.theme.applicationTheme
export const selectHeatMapTheme = (state) => state.theme.heatMapTheme
export const selectBackgroundImage = (state) => state.theme.backgroundImage
export const selectThemeLoading = (state) => state.theme.loading;
export const selectThemeError = (state) => state.theme.error;
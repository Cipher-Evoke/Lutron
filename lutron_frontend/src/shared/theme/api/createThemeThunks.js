import { createAsyncThunk } from "@reduxjs/toolkit";
import { getUiVariant } from "../../../utils/uiVariant";

/**
 * Factory for theme API thunks. Each variant injects its own BaseUrl and getToken.
 * All theme requests include `variant` so reads/writes hit that variant's DB row.
 */
export function createThemeThunks({ BaseUrl, getToken }) {
  const getThemeRequestConfig = (extra = {}) => ({
    ...extra,
    params: {
      ...(extra.params || {}),
      variant: getUiVariant(),
    },
  });

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  const fetchThemeSettings = createAsyncThunk(
    "theme/fetchSettings",
    async (_, { rejectWithValue }) => {
      try {
        const response = await BaseUrl.get(
          "/theme/",
          getThemeRequestConfig()
        );
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

  const fetchApplicationTheme = createAsyncThunk(
    "theme/fetchApplicationTheme",
    async (_, { rejectWithValue }) => {
      try {
        const response = await BaseUrl.get(
          "/theme/application",
          getThemeRequestConfig(getAuthHeaders())
        );
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

  const updateApplicationTheme = createAsyncThunk(
    "theme/updateApplicationTheme",
    async (data, { rejectWithValue }) => {
      try {
        const response = await BaseUrl.post(
          "/theme/application",
          data,
          getThemeRequestConfig(getAuthHeaders())
        );
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

  const fetchHeatMapTheme = createAsyncThunk(
    "theme/fetchHeatMapTheme",
    async (_, { rejectWithValue }) => {
      try {
        const response = await BaseUrl.get(
          "/theme/heatmap",
          getThemeRequestConfig(getAuthHeaders())
        );
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

  const updateHeatMapTheme = createAsyncThunk(
    "theme/updateHeatMapTheme",
    async (data, { rejectWithValue }) => {
      try {
        const response = await BaseUrl.post(
          "/theme/heatmap",
          data,
          getThemeRequestConfig(getAuthHeaders())
        );
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

  const fetchBackgroundImage = createAsyncThunk(
    "theme/fetchBackgroundImage",
    async (_, { rejectWithValue }) => {
      try {
        const response = await BaseUrl.get(
          "/theme/background",
          getThemeRequestConfig(getAuthHeaders())
        );
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

  const updateBackgroundImage = createAsyncThunk(
    "theme/updateBackgroundImage",
    async (data, { rejectWithValue }) => {
      try {
        const response = await BaseUrl.post(
          "/theme/background",
          data,
          getThemeRequestConfig(getAuthHeaders())
        );
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

  const clearBackgroundImage = createAsyncThunk(
    "theme/clearBackgroundImage",
    async (_, { rejectWithValue }) => {
      try {
        const response = await BaseUrl.post(
          "/theme/background_image_clear",
          null,
          getThemeRequestConfig(getAuthHeaders())
        );
        return response.data;
      } catch (error) {
        const detail = error?.response?.data?.detail;
        return rejectWithValue(
          (Array.isArray(detail)
            ? detail.map((item) => item.msg).join(", ")
            : detail) ||
            error?.response?.data?.message ||
            error?.response?.statusText ||
            error?.message ||
            "Failed to remove background image"
        );
      }
    }
  );

  return {
    fetchThemeSettings,
    fetchApplicationTheme,
    updateApplicationTheme,
    fetchHeatMapTheme,
    updateHeatMapTheme,
    fetchBackgroundImage,
    updateBackgroundImage,
    clearBackgroundImage,
  };
}

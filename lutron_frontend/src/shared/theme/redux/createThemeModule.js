import { createSlice } from "@reduxjs/toolkit";
import { createThemeThunks } from "../api/createThemeThunks";
import { buildThemeExtraReducers } from "./buildThemeExtraReducers";

const DEFAULT_INITIAL_STATE = {
  settings: null,
  applicationTheme: {},
  heatMapTheme: {},
  backgroundImage: {},
  loading: false,
  error: null,
};

/**
 * Creates the theme reducer and thunks for a variant.
 *
 * @param {object} config
 * @param {object} config.BaseUrl - Variant axios instance
 * @param {Function} config.getToken - Auth token accessor
 * @param {object} [config.initialState] - Partial initial state overrides
 * @param {boolean} [config.includeUpdateApplicationThemeFulfilled=false]
 */
export function createThemeModule({
  BaseUrl,
  getToken,
  initialState = {},
  includeUpdateApplicationThemeFulfilled = false,
}) {
  const thunks = createThemeThunks({ BaseUrl, getToken });

  const themeSlice = createSlice({
    name: "theme",
    initialState: {
      ...DEFAULT_INITIAL_STATE,
      ...initialState,
    },
    reducers: {},
    extraReducers: (builder) => {
      buildThemeExtraReducers(builder, thunks, {
        includeUpdateApplicationThemeFulfilled,
      });
    },
  });

  return {
    reducer: themeSlice.reducer,
    ...thunks,
  };
}

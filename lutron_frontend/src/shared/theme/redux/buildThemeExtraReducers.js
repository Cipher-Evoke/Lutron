import { addUpdateApplicationThemeFulfilledReducer } from "./updateApplicationThemeFulfilled";

const normalizeBackgroundPayload = (payload) => {
  const bg = payload.background_image;
  return {
    ...payload,
    background_image: typeof bg === "string" && bg.trim() !== "" ? bg : "",
  };
};

/**
 * Registers shared theme slice extraReducers on the builder.
 */
export function buildThemeExtraReducers(builder, thunks, options = {}) {
  const {
    fetchThemeSettings,
    fetchApplicationTheme,
    fetchHeatMapTheme,
    fetchBackgroundImage,
    clearBackgroundImage,
  } = thunks;

  builder
    .addCase(fetchThemeSettings.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(fetchThemeSettings.fulfilled, (state, action) => {
      state.loading = false;
      state.settings = normalizeBackgroundPayload(action.payload || {});
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
      state.applicationTheme = action.payload;
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
      state.heatMapTheme = action.payload;
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
      state.backgroundImage = normalizeBackgroundPayload(action.payload || {});
    })
    .addCase(fetchBackgroundImage.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || action.error.message;
    });

  builder
    .addCase(clearBackgroundImage.fulfilled, (state, action) => {
      const payload = action.payload || {};
      state.backgroundImage = {
        ...payload,
        background_image: "",
      };
      if (state.settings) {
        state.settings = {
          ...state.settings,
          background_image: "",
        };
      }
      if (state.applicationTheme?.application_theme) {
        state.applicationTheme = {
          ...state.applicationTheme,
          application_theme: {
            ...state.applicationTheme.application_theme,
            background_image: "",
            backgroundImageUrl: "",
          },
        };
      }
    })
    .addCase(clearBackgroundImage.rejected, (state, action) => {
      state.error = action.payload || action.error.message;
    });

  if (options.includeUpdateApplicationThemeFulfilled) {
    addUpdateApplicationThemeFulfilledReducer(
      builder,
      thunks.updateApplicationTheme
    );
  }
}

/**
 * Advanced variant: optimistic merge when POST /theme/application succeeds.
 */
export function addUpdateApplicationThemeFulfilledReducer(
  builder,
  updateApplicationTheme
) {
  builder.addCase(updateApplicationTheme.fulfilled, (state, action) => {
    const arg = action.meta?.arg || {};
    const payload = action.payload || {};
    const apiTheme = payload.application_theme || {};
    const existing = state.applicationTheme?.application_theme || {};
    const background =
      apiTheme.background ?? payload.background ?? arg.background;
    const content = apiTheme.content ?? payload.content ?? arg.content;
    const button = apiTheme.button ?? payload.button ?? arg.button;
    const backgroundImage =
      apiTheme.background_image ??
      payload.background_image ??
      arg.background_image;

    const nextTheme = { ...existing };
    if (background != null) nextTheme.background = background;
    if (content != null) nextTheme.content = content;
    if (button != null) nextTheme.button = button;
    if (backgroundImage != null) nextTheme.background_image = backgroundImage;

    const hasColorUpdate =
      background != null || content != null || button != null;
    const hasImageUpdate = backgroundImage != null;

    if (!hasColorUpdate && !hasImageUpdate) {
      return;
    }

    state.applicationTheme = {
      ...state.applicationTheme,
      application_theme: nextTheme,
    };

    if (state.settings && hasColorUpdate) {
      const ui = { ...(state.settings.ui_theme_colors || {}) };
      if (background != null) ui.background = background;
      if (content != null) ui.content = content;
      if (button != null) ui.button = button;
      state.settings = {
        ...state.settings,
        ui_theme_colors: ui,
      };
    }
  });
}

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { dispatchFetchThemeSettingsOnce } from "../../utils/bootstrapFetchGuards";
import {
  isUserThemeBackgroundImage,
  pickUserThemeBackgroundImage,
} from "../utils/themeBackgroundImage";
import { resolvePublicAssetUrl } from "../../utils/resolveMediaUrl";
import { useThemeReload } from "./useThemeReload";

function resolvePaintedBackground(bg) {
  if (bg == null || bg === "") return bg;
  return resolvePublicAssetUrl(bg) || bg;
}

function applicationThemeHasColors(applicationTheme) {
  const at = applicationTheme?.application_theme;
  return Boolean(at?.background || at?.content || at?.button);
}

/**
 * Shared Redux bootstrap + theme state for ThemeProviderCustom.
 *
 * Variant-specific createAppTheme / applyCssVariables remain in each variant file.
 *
 * @param {boolean} [preferApplicationThemeCss=false]
 *   Advanced-only: when true, `/theme/application` owns CSS vars + MUI theme once
 *   loaded, so stale `/theme/` settings cannot overwrite the selected theme on refresh.
 * @param {boolean} [applyApplicationThemeToMui=false]
 *   Basic-only: apply `/theme/application` to MUI (dialogs/inputs) and do not let a
 *   stale `/theme/` session cache overwrite it. Customized leaves this false.
 */
export function useThemeProviderBootstrap({
  createAppTheme,
  applyCssVariables,
  fetchThemeSettings,
  selectThemeSettings,
  selectThemeLoading,
  selectThemeError,
  initialBackgroundImage,
  mountCssBackground,
  resolveApiBackgroundImage,
  resolveReloadBackgroundImage,
  applicationTheme,
  pickThemeBackgroundImage,
  preferApplicationThemeCss = false,
  applyApplicationThemeToMui = false,
}) {
  const dispatch = useDispatch();

  const themeSettings = useSelector(selectThemeSettings);
  const themeLoading = useSelector(selectThemeLoading);
  const themeError = useSelector(selectThemeError);

  const [theme, setTheme] = useState(() => {
    // Advanced: seed MUI theme from pinned/application colors so first paint is not defaults.
    if (preferApplicationThemeCss && applicationThemeHasColors(applicationTheme)) {
      const at = applicationTheme.application_theme;
      return createAppTheme(
        {
          background: at.background,
          content: at.content,
          button: at.button,
        },
        initialBackgroundImage
      );
    }
    return createAppTheme({});
  });
  const [backgroundImage, setBackgroundImage] = useState(initialBackgroundImage);

  useEffect(() => {
    // Advanced (preferApplicationThemeCss): never paint empty/default CSS.
    // Empty apply resolves to #6f809d and strips gold-theme / theme-4-page.
    if (preferApplicationThemeCss) {
      return;
    }
    applyCssVariables({}, resolvePaintedBackground(mountCssBackground));
  }, [applyCssVariables, mountCssBackground, preferApplicationThemeCss]);

  useEffect(() => {
    dispatchFetchThemeSettingsOnce(dispatch, fetchThemeSettings, {
      alreadyLoaded: Boolean(themeSettings),
    });
  }, [dispatch, themeSettings, fetchThemeSettings]);

  useEffect(() => {
    if (!themeSettings) {
      return;
    }

    // Advanced: do not let /theme/ settings colors paint over a loaded application theme.
    // Basic: same skip so a stale settings session cache cannot override MUI after
    // /theme/application is loaded. A real /theme/ photo is still applied when the
    // application theme has colors but no uploaded image.
    // Customized does not set applyApplicationThemeToMui.
    if (
      (preferApplicationThemeCss || applyApplicationThemeToMui) &&
      applicationThemeHasColors(applicationTheme)
    ) {
      const settingsBg = resolvePaintedBackground(
        resolveApiBackgroundImage(themeSettings.background_image)
      );
      if (isUserThemeBackgroundImage(settingsBg)) {
        const at = applicationTheme.application_theme;
        const ui = {
          background: at.background,
          content: at.content,
          button: at.button,
        };
        applyCssVariables(ui, settingsBg);
        setBackgroundImage(settingsBg);
        setTheme(createAppTheme(ui, settingsBg));
      }
      return;
    }

    const ui = themeSettings.ui_theme_colors || {};
    const bgImage = resolvePaintedBackground(
      resolveApiBackgroundImage(themeSettings.background_image)
    );

    applyCssVariables(ui, bgImage);
    setBackgroundImage(bgImage);
    setTheme(createAppTheme(ui, bgImage));
  }, [
    themeSettings,
    applyCssVariables,
    createAppTheme,
    resolveApiBackgroundImage,
    preferApplicationThemeCss,
    applyApplicationThemeToMui,
    applicationTheme,
  ]);

  // Keep CSS variables in sync with /theme/application (Advanced + Basic when wired).
  useEffect(() => {
    if (!pickThemeBackgroundImage || applicationTheme == null) {
      return;
    }

    const at = applicationTheme?.application_theme;
    if (!at?.background && !at?.content && !at?.button) {
      return;
    }

    const settingsBg = themeSettings
      ? resolveApiBackgroundImage(themeSettings.background_image)
      : undefined;
    const explicitBg = pickUserThemeBackgroundImage(
      at.background_image,
      at.backgroundImageUrl,
      applicationTheme?.background_image,
      settingsBg,
      backgroundImage
    );
    const appBgImage =
      explicitBg !== undefined ? resolvePaintedBackground(explicitBg) : "";

    const ui = {
      background: at.background,
      content: at.content,
      button: at.button,
    };

    applyCssVariables(ui, appBgImage);

    // Advanced: application theme is also the MUI theme source of truth.
    // Basic: same MUI update so dialogs/inputs match CSS vars; Customized unchanged.
    if (preferApplicationThemeCss || applyApplicationThemeToMui) {
      if (explicitBg !== undefined) {
        setBackgroundImage(appBgImage);
      }
      setTheme(createAppTheme(ui, appBgImage));
    }
  }, [
    applicationTheme,
    applicationTheme?.application_theme?.background,
    applicationTheme?.application_theme?.content,
    applicationTheme?.application_theme?.button,
    applicationTheme?.application_theme?.background_image,
    applicationTheme?.background_image,
    backgroundImage,
    themeSettings,
    applyCssVariables,
    resolveApiBackgroundImage,
    pickThemeBackgroundImage,
    preferApplicationThemeCss,
    applyApplicationThemeToMui,
    createAppTheme,
  ]);

  const reloadTheme = useThemeReload({
    backgroundImage,
    setBackgroundImage,
    setTheme,
    applyCssVariables,
    createAppTheme,
    resolveReloadBackgroundImage,
  });

  return {
    theme,
    backgroundImage,
    reloadTheme,
    themeLoading,
    themeError,
  };
}

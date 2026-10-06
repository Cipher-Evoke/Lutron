// src/screens/settings/theme/ThemeContext.jsx
import React from "react";
import { useSelector } from "react-redux";
import {
  fetchThemeSettings,
  selectThemeSettings,
  selectThemeLoading,
  selectThemeError,
  selectApplicationTheme,
} from "../../../redux/slice/theme/themeSlice";
import {
  DEFAULT_PUBLIC_BG,
  resolveAppShellBackgroundUrl,
} from "../../../utils/normalizeBackgroundPath";
import {
  DEFAULT_APP_BACKGROUND,
  DEFAULT_APP_CONTENT,
  isWhiteAreaPickerChrome,
} from "../../../utils/themeOnSurface";
import { pickThemeBackgroundImage } from "../../../../../shared/theme/utils/themeBackgroundImage";
import {
  createThemeContext,
  createNormalizeUiColors,
  createNormalizedBackgroundResolvers,
  ThemeMuiProviderShell,
  useThemeProviderBootstrap,
} from "../../../../../shared/theme/context";
import { createBasicAppTheme } from "../../../../../shared/theme/mui/createBasicAppTheme";
import {
  WhiteThemeCheckboxCheckedIcon,
  WhiteThemeCheckboxIndeterminateIcon,
  WhiteThemeCheckboxUncheckedIcon,
} from "../../../utils/whiteThemeCheckboxIcons";
const DEFAULT_TAB_COLOR = '#1976d2';
/** Default action buttons (contained / outlined / text) — semantic colors stay on palette. */
const BUTTON_BLUE = '#1565C0';

/** Customized/legacy Theme seeds wrongly copied into basic on backend restart. */
const LEGACY_CUSTOMIZED_BG = '#cdc0a0';
const LEGACY_CUSTOMIZED_CONTENT = '#807864';
/** Observed pollution from legacy Theme.ui.* (#F59E0B orange / #807864 taupe). */
const LEGACY_POLLUTED_ORANGE_BG = '#f59e0b';

const sanitizeBasicApplicationColors = (uiColors = {}) => {
  const background = String(uiColors.background || '').trim().toLowerCase();
  const content = String(uiColors.content || '').trim().toLowerCase();
  const isLegacyCustomized =
    background === LEGACY_CUSTOMIZED_BG && content === LEGACY_CUSTOMIZED_CONTENT;
  const isLegacyOrangePollute =
    background === LEGACY_POLLUTED_ORANGE_BG && content === LEGACY_CUSTOMIZED_CONTENT;
  if (!isLegacyCustomized && !isLegacyOrangePollute) {
    return uiColors;
  }
  const buttonRaw = String(uiColors.button || '').trim().toLowerCase();
  return {
    ...uiColors,
    background: DEFAULT_APP_BACKGROUND,
    content: DEFAULT_APP_CONTENT,
    button:
      !buttonRaw || buttonRaw === '#232323' || buttonRaw === '#8b5cf6'
        ? BUTTON_BLUE
        : uiColors.button,
  };
};

const normalizeUiColors = createNormalizeUiColors({
  background: DEFAULT_APP_BACKGROUND,
  content: DEFAULT_APP_CONTENT,
  button: "#232323",
  error: "#d32f2f",
});

// Strip seeded defaultBg so /theme/ and /theme/application never paint the orange photo.
const backgroundResolvers = createNormalizedBackgroundResolvers(
  resolveAppShellBackgroundUrl
);

const applyCssVariables = (uiColors = {}, bgImage) => {
  if (typeof document === "undefined") return;

  const { background, content, button } = normalizeUiColors(
    sanitizeBasicApplicationColors(uiColors)
  );
  const isDefaultWhiteTheme = isWhiteAreaPickerChrome(content);
  const root = document.documentElement;

  // Always apply the saved Background color. White-chrome helpers below still
  // key off light Content for checkboxes / area pickers — not for page bg.
  root.style.setProperty("--app-background", background);
  root.style.setProperty("--app-content", content);
  root.style.setProperty("--app-button", button);
  root.style.setProperty("--app-checkbox-accent", isDefaultWhiteTheme ? BUTTON_BLUE : "auto");
  root.style.setProperty("--app-checkbox-border", isDefaultWhiteTheme ? "#D1D1D1" : "transparent");
  // 26.09.61: theme photo is login-only. The shell must not paint it.
  root.style.setProperty("--app-background-image", "none");
  /* Native <input type="checkbox"> (Dashboard tree, schedules, etc.) — see index.css */
  root.classList.toggle("app-native-checkbox-light", Boolean(isDefaultWhiteTheme));
};

const createAppTheme = (uiColors = {}, bgImage = "") =>
  createBasicAppTheme({
    normalizeUiColors,
    isWhiteAreaPickerChrome,
    uiColors: sanitizeBasicApplicationColors(uiColors),
    bgImage,
    tabColor: DEFAULT_TAB_COLOR,
    buttonBlue: BUTTON_BLUE,
    checkboxIcons: {
      uncheckedIcon: <WhiteThemeCheckboxUncheckedIcon />,
      checkedIcon: <WhiteThemeCheckboxCheckedIcon />,
      indeterminateIcon: <WhiteThemeCheckboxIndeterminateIcon />,
    },
  });

export const ThemeContext = createThemeContext(DEFAULT_PUBLIC_BG);

export const ThemeProviderCustom = ({ children }) => {
  const applicationTheme = useSelector(selectApplicationTheme);

  const { theme, backgroundImage, reloadTheme } = useThemeProviderBootstrap({
    createAppTheme,
    applyCssVariables,
    fetchThemeSettings,
    selectThemeSettings,
    selectThemeLoading,
    selectThemeError,
    initialBackgroundImage: "",
    mountCssBackground: "",
    resolveApiBackgroundImage: backgroundResolvers.fromApi,
    resolveReloadBackgroundImage: backgroundResolvers.onReload,
    applicationTheme,
    pickThemeBackgroundImage,
    applyApplicationThemeToMui: true,
  });

  return (
    <ThemeContext.Provider value={{ theme, backgroundImage, reloadTheme }}>
      <ThemeMuiProviderShell theme={theme}>
        {children}
      </ThemeMuiProviderShell>
    </ThemeContext.Provider>
  );
};

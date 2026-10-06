// src/screens/settings/theme/ThemeContext.jsx
import {
  fetchThemeSettings,
  selectThemeSettings,
  selectThemeLoading,
  selectThemeError,
} from "../../../redux/slice/theme/themeSlice";
import {
  createThemeContext,
  createNormalizeUiColors,
  rawBackgroundResolvers,
  ThemeMuiProviderShell,
  useThemeProviderBootstrap,
} from "../../../../../shared/theme/context";
import { createCustomizedAppTheme } from "../../../../../shared/theme/mui/createCustomizedAppTheme";

const DEFAULT_BG = '/assets/defaultBg.png';
const DEFAULT_TAB_COLOR = '#1976d2';

const normalizeUiColors = createNormalizeUiColors({
  background: "#CDC0A0",
  content: "#807864",
  button: "#232323",
  error: "#FFFFFF",
});

const applyCssVariables = (uiColors = {}, bgImage = "") => {
  if (typeof document === "undefined") return;

  const { background, content, button } = normalizeUiColors(uiColors);
  const root = document.documentElement;

  root.style.setProperty("--app-background", background);
  root.style.setProperty("--app-content", content);
  root.style.setProperty("--app-button", button);
  root.style.setProperty("--app-background-image", "none");
};

const createAppTheme = (uiColors = {}, bgImage = "") =>
  createCustomizedAppTheme({
    normalizeUiColors,
    uiColors,
    bgImage,
    tabColor: DEFAULT_TAB_COLOR,
  });

export const ThemeContext = createThemeContext(DEFAULT_BG);

export const ThemeProviderCustom = ({ children }) => {
  const { theme, backgroundImage, reloadTheme } = useThemeProviderBootstrap({
    createAppTheme,
    applyCssVariables,
    fetchThemeSettings,
    selectThemeSettings,
    selectThemeLoading,
    selectThemeError,
    initialBackgroundImage: "",
    mountCssBackground: "",
    resolveApiBackgroundImage: rawBackgroundResolvers.fromApi,
    resolveReloadBackgroundImage: rawBackgroundResolvers.onReload,
  });

  return (
    <ThemeContext.Provider value={{ theme, backgroundImage, reloadTheme }}>
      <ThemeMuiProviderShell theme={theme}>
        {children}
      </ThemeMuiProviderShell>
    </ThemeContext.Provider>
  );
};

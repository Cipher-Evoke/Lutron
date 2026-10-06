// src/screens/settings/theme/ThemeContext.jsx
import React, { createContext, useEffect, useState } from "react";
import {
  alpha,
  createTheme,
  darken,
  ThemeProvider as MUIThemeProvider,
} from "@mui/material/styles";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchThemeSettings,
  selectThemeSettings,
  selectThemeLoading,
  selectThemeError,
} from "../../../redux/slice/theme/themeSlice";

const DEFAULT_BG = '/assets/defaultBg.png';
const DEFAULT_TAB_COLOR = '#1976d2';
const POLLING_INTERVAL = 30000;

const normalizeUiColors = (uiColors = {}) => ({
  background: uiColors.background || "#CDC0A0",
  content: uiColors.content || "#807864",
  button: uiColors.button || "#232323",
  error: uiColors.error || "#FFFFFF",
});

const applyCssVariables = (uiColors = {}, bgImage = DEFAULT_BG) => {
  if (typeof document === "undefined") return;

  const { background, content, button } = normalizeUiColors(uiColors);
  const root = document.documentElement;

  root.style.setProperty("--app-background", background);
  root.style.setProperty("--app-content", content);
  root.style.setProperty("--app-button", button);
  root.style.setProperty("--app-background-image", "none");
};

const createAppTheme = (uiColors = {}, bgImage = DEFAULT_BG) => {
  const normalized = normalizeUiColors(uiColors);
  const backgroundDefault = normalized.background;
  const backgroundPaper = normalized.content;
  const buttonMain = normalized.button;

  return createTheme({
    palette: {
      background: {
        default: backgroundDefault,
        paper: backgroundPaper,
      },
      primary: {
        main: buttonMain,
      },
      custom: {
        containerBg: backgroundDefault,
        navbarBg: backgroundPaper,
        buttonBg: buttonMain,
        searchbarBg: "#FFFFFF",
        backgroundImage: bgImage,
      },
      text: {
        primary: "#000000",
        secondary: "#FFFFFF",
      },
      error: {
        main: normalized.error,
      },
    },
    shape: {
      borderRadius: 12,
    },
    typography: {
      fontFamily: 'Roboto, sans-serif',
      fontWeightLight: 300,
      fontWeightRegular: 400,
      fontWeightMedium: 500,
      fontWeightBold: 700,
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: backgroundPaper,
            borderRadius: "12px",
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: backgroundPaper,
            borderRadius: "12px",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            borderRadius: "8px",
            fontWeight: 600,
          },
          contained: {
            backgroundColor: buttonMain,
            color: "#FFFFFF",
            "&:hover": {
              backgroundColor: darken(buttonMain, 0.15),
            },
            "&.Mui-disabled": {
              backgroundColor: alpha(buttonMain, 0.3),
              color: alpha("#FFFFFF", 0.7),
            },
          },
          outlined: {
            borderColor: buttonMain,
            color: buttonMain,
            "&:hover": {
              borderColor: darken(buttonMain, 0.15),
              backgroundColor: alpha(buttonMain, 0.08),
            },
            "&.Mui-disabled": {
              borderColor: alpha(buttonMain, 0.3),
              color: alpha(buttonMain, 0.3),
            },
          },
          text: {
            color: buttonMain,
            "&:hover": {
              backgroundColor: alpha(buttonMain, 0.08),
            },
            "&.Mui-disabled": {
              color: alpha(buttonMain, 0.3),
            },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: {
            backgroundColor: DEFAULT_TAB_COLOR,
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            "&.Mui-selected": {
              color: DEFAULT_TAB_COLOR,
            },
          },
        },
      },
      MuiFilledInput: {
        styleOverrides: {
          root: {
            backgroundColor: backgroundDefault,
            borderRadius: "5px",
            "&:hover": {
              backgroundColor: backgroundDefault,
            },
            "&:before, &:after": {
              borderBottom: "none",
            },
          },
          input: {
            padding: "12px",
            color: "#000000",
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            color: "#000000",
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: "filled",
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            backgroundColor: "#fff",
            color: "#000",
          },
          icon: {
            color: "#f44336",
          },
        },
      },
      MuiFormHelperText: {
        styleOverrides: {
          root: {
            color: "#FFFFFF",
            "&.Mui-error": {
              color: "#FFFFFF",
            },
          },
        },
      },
    },
  });
};

export const ThemeContext = createContext({
  theme: null,
  backgroundImage: DEFAULT_BG,
  reloadTheme: (uiColors, bgImage) => { },
});

export const ThemeProviderCustom = ({ children }) => {
  const dispatch = useDispatch();

  const themeSettings = useSelector(selectThemeSettings);
  const themeLoading = useSelector(selectThemeLoading);
  const themeError = useSelector(selectThemeError);

  const [theme, setTheme] = useState(() => createAppTheme({}));
  const [backgroundImage, setBackgroundImage] = useState(DEFAULT_BG);

  useEffect(() => {
    applyCssVariables({}, DEFAULT_BG);
  }, []);

  useEffect(() => {
    if (!themeSettings) {
      dispatch(fetchThemeSettings());
    }
  }, [dispatch, themeSettings]);

  useEffect(() => {
    if (themeSettings) {
      const ui = themeSettings.ui_theme_colors || {};
      const apiBG = themeSettings.background_image;

      const bgImage = typeof apiBG === "string" && apiBG.trim() !== ""
        ? apiBG
        : DEFAULT_BG;

      applyCssVariables(ui, bgImage);
      setBackgroundImage(bgImage);
      setTheme(createAppTheme(ui, bgImage));
    }
  }, [themeSettings]);

  const reloadTheme = (uiColors = {}, bgImage = DEFAULT_BG) => {
    applyCssVariables(uiColors, bgImage);
    const newTheme = createAppTheme(uiColors, bgImage);
    setTheme({ ...newTheme });
    setBackgroundImage(bgImage);
  };

  return (
    <ThemeContext.Provider value={{ theme, backgroundImage, reloadTheme }}>
      <MUIThemeProvider theme={theme} key={JSON.stringify(theme.palette)}>
        {children}
      </MUIThemeProvider>
    </ThemeContext.Provider>
  );
};

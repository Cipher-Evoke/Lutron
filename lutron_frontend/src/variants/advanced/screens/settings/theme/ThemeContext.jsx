// src/screens/settings/theme/ThemeContext.jsx
import React, { useEffect, useLayoutEffect } from "react";
import {
  alpha,
  createTheme,
  darken,
} from "@mui/material/styles";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchApplicationTheme,
  fetchThemeSettings,
  selectApplicationTheme,
  selectThemeSettings,
  selectThemeLoading,
  selectThemeError,
} from "../../../redux/slice/theme/themeSlice";
import { pickThemeBackgroundImage } from "../../../../../utils/themeBackgroundImage";
import {
  createThemeContext,
  createNormalizeUiColors,
  rawBackgroundResolvers,
  ThemeMuiProviderShell,
  useThemeProviderBootstrap,
} from "../../../../../shared/theme/context";
import {
  dispatchFetchApplicationThemeOnce,
  syncApplicationThemeSessionCache,
} from "../../../../../shared/utils/bootstrapFetchGuards";
import {
  readAdvancedApplicationThemePin,
  toAdvancedApplicationThemePayload,
} from "../../../utils/advancedApplicationThemePersist";
import { isLightSurface, onContentColors } from "../../../utils/themeOnSurface";

import {
  THEME_3_BUTTON_SOLID,
  THEME_4_BUTTON_SOLID,
} from "../../../config/themeConstants";
import {
  resolveApplicationPageTextOn,
  resolveApplicationPaperSurface,
  resolveCustomNavbarSolid,
  resolveThemeButtonStyle,
  usesGoldPageTheme,
  usesCustomApplicationTheme,
  usesTheme3PageGradient,
  usesTheme4PageGradient,
} from "../../../utils/themePageBackground";
import { applyAdvancedCssVariables as applyCssVariables } from "../../../../../shared/theme/registry/applyAdvancedCssVariables";

export { applyCssVariables };

const DEFAULT_BG = '/assets/defaultBg.png';
const DEFAULT_TAB_COLOR = '#1976d2';
const POLLING_INTERVAL = 30000;

const normalizeUiColors = createNormalizeUiColors({
  background: "#6f809d",
  content: "#3d4a5c",
  button: "#232323",
  error: "#FFFFFF",
});

const createAppTheme = (uiColors = {}, bgImage = DEFAULT_BG) => {
  const normalized = normalizeUiColors(uiColors);
  const backgroundDefault = normalized.background;
  const backgroundPaper = normalized.content;
  const buttonResolved = resolveThemeButtonStyle(
    normalized.button,
    backgroundDefault
  );
  const buttonMain = buttonResolved.solid;
  const resolvedPaper = resolveApplicationPaperSurface(backgroundDefault, backgroundPaper);
  const pageTextOn = resolveApplicationPageTextOn(backgroundDefault);
  const paperTextOn = onContentColors(resolvedPaper);
  const navbarBg = usesTheme3PageGradient(backgroundDefault)
    ? THEME_3_BUTTON_SOLID
    : usesTheme4PageGradient(backgroundDefault)
      ? THEME_4_BUTTON_SOLID
      : usesGoldPageTheme(backgroundDefault)
        ? "#2b2b2b"
        : usesCustomApplicationTheme(backgroundDefault)
          ? resolveCustomNavbarSolid(backgroundDefault)
          : isLightSurface(backgroundDefault)
            ? "#2b2b2b"
            : backgroundPaper;
  const dialogOnPaper = paperTextOn.primary;

  return createTheme({
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 900,
        lg: 1200,
        xl: 1536,
        xxl: 1920,
        '2xl': 1600,
        '3xl': 2560,
        '4xl': 3440,
        '5xl': 3840,
        '6xl': 5120,
      },
    },
    palette: {
      background: {
        default: backgroundDefault,
        paper: resolvedPaper,
      },
      primary: {
        main: buttonMain,
      },
      custom: {
        containerBg: usesCustomApplicationTheme(backgroundDefault)
          ? resolvedPaper
          : backgroundDefault,
        navbarBg,
        buttonBg: buttonMain,
        searchbarBg: "#FFFFFF",
        backgroundImage: bgImage,
      },
      text: {
        primary: pageTextOn.primary,
        secondary: pageTextOn.secondary,
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
            backgroundColor: resolvedPaper,
            color: paperTextOn.primary,
            borderRadius: "12px",
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: resolvedPaper,
            color: paperTextOn.primary,
            borderRadius: "12px",
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: resolvedPaper,
            color: dialogOnPaper,
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
            color: buttonResolved.text,
            "&:hover": {
              backgroundColor: darken(buttonMain, 0.15),
            },
            "&.Mui-disabled": {
              backgroundColor: alpha(buttonMain, 0.3),
              color: alpha(buttonResolved.text, 0.7),
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
            /* White/light fields are the default surface — white helper text is invisible */
            color: "rgba(0, 0, 0, 0.72)",
            "&.Mui-error": {
              color: "#c62828",
            },
          },
        },
      },
    },
  });
};

export const ThemeContext = createThemeContext(DEFAULT_BG);

export const ThemeProviderCustom = ({ children }) => {
  const dispatch = useDispatch();
  const applicationTheme = useSelector(selectApplicationTheme);

  // Before paint: lock saved Advanced colors so Topbar/settings soft-fetch cannot
  // race and paint the wrong chrome after refresh.
  useLayoutEffect(() => {
    const pin = readAdvancedApplicationThemePin();
    if (!pin) return;
    const payload = toAdvancedApplicationThemePayload(pin);
    syncApplicationThemeSessionCache(payload);
    if (fetchApplicationTheme?.fulfilled?.type) {
      dispatch({ type: fetchApplicationTheme.fulfilled.type, payload });
    }
    applyCssVariables(
      {
        background: pin.background,
        content: pin.content,
        button: pin.button,
      },
      undefined
    );
  }, [dispatch]);

  // Soft fetch only when there is no pin (first install / cleared storage).
  // Do NOT auto-write API colors into the pin — that can lock a stale GET over
  // the user's saved Gold/Brown preset. Pin is written only on Theme Save/Reset.
  useEffect(() => {
    if (readAdvancedApplicationThemePin()) return;
    dispatchFetchApplicationThemeOnce(dispatch, fetchApplicationTheme);
  }, [dispatch]);

  const { theme, backgroundImage, reloadTheme } = useThemeProviderBootstrap({
    createAppTheme,
    applyCssVariables,
    fetchThemeSettings,
    selectThemeSettings,
    selectThemeLoading,
    selectThemeError,
    initialBackgroundImage: DEFAULT_BG,
    mountCssBackground: DEFAULT_BG,
    resolveApiBackgroundImage: rawBackgroundResolvers.fromApi,
    resolveReloadBackgroundImage: rawBackgroundResolvers.onReload,
    applicationTheme,
    pickThemeBackgroundImage,
    // Selected /theme/application colors must win over /theme/ settings on refresh.
    preferApplicationThemeCss: true,
  });

  return (
    <ThemeContext.Provider value={{ theme, backgroundImage, reloadTheme }}>
      <ThemeMuiProviderShell theme={theme}>
        {children}
      </ThemeMuiProviderShell>
    </ThemeContext.Provider>
  );
};

import React from "react";
import { alpha, createTheme, darken } from "@mui/material/styles";
import { createNormalizeUiColors } from "../context/normalizeUiColors";
import {
  DEFAULT_APP_BACKGROUND,
  DEFAULT_APP_CONTENT,
  isWhiteAreaPickerChrome,
} from "../utils/themeOnSurface";
import { createBasicAppTheme } from "./createBasicAppTheme";
import { createCustomizedAppTheme } from "./createCustomizedAppTheme";

const DEFAULT_TAB_COLOR = "#1976d2";
const BUTTON_BLUE = "#1565C0";

const basicNormalize = createNormalizeUiColors({
  background: DEFAULT_APP_BACKGROUND,
  content: DEFAULT_APP_CONTENT,
  button: "#232323",
  error: "#d32f2f",
});

const customizedNormalize = createNormalizeUiColors({
  background: "#CDC0A0",
  content: "#807864",
  button: "#232323",
  error: "#FFFFFF",
});

const isSemanticButtonColor = (color) =>
  color === "error" ||
  color === "success" ||
  color === "warning" ||
  color === "info";

function StubIcon({ name }) {
  return <span data-icon={name} />;
}

/** Pre-4.2C reference implementation — basic variant. */
function legacyBasicCreateAppTheme(uiColors = {}, bgImage = "") {
  const normalized = basicNormalize(uiColors);
  const backgroundDefault = normalized.background;
  const backgroundPaper = normalized.content;
  const buttonMain = normalized.button;
  const isDefaultWhiteTheme = isWhiteAreaPickerChrome(backgroundPaper);

  return createTheme({
    palette: {
      background: {
        default: backgroundDefault,
        paper: backgroundPaper,
      },
      primary: { main: buttonMain },
      custom: {
        containerBg: backgroundDefault,
        navbarBg: backgroundPaper,
        buttonBg: buttonMain,
        searchbarBg: "#FFFFFF",
        backgroundImage: bgImage,
      },
      text: {
        primary: "rgba(0, 0, 0, 0.87)",
        secondary: "rgba(0, 0, 0, 0.6)",
        disabled: "rgba(0, 0, 0, 0.38)",
      },
      error: { main: normalized.error },
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: "Roboto, sans-serif",
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
          contained: ({ ownerState }) => {
            if (isSemanticButtonColor(ownerState.color)) return {};
            return {
              backgroundColor: BUTTON_BLUE,
              color: "#FFFFFF",
              "&:hover": { backgroundColor: darken(BUTTON_BLUE, 0.15) },
              "&.Mui-disabled": {
                backgroundColor: alpha(BUTTON_BLUE, 0.3),
                color: alpha("#FFFFFF", 0.7),
              },
            };
          },
          outlined: ({ ownerState }) => {
            if (isSemanticButtonColor(ownerState.color)) return {};
            return {
              borderColor: BUTTON_BLUE,
              color: BUTTON_BLUE,
              backgroundColor: alpha(BUTTON_BLUE, 0.06),
              "&:hover": {
                borderColor: darken(BUTTON_BLUE, 0.15),
                backgroundColor: alpha(BUTTON_BLUE, 0.12),
              },
              "&.Mui-disabled": {
                borderColor: alpha(BUTTON_BLUE, 0.3),
                color: alpha(BUTTON_BLUE, 0.3),
              },
            };
          },
          text: ({ ownerState }) => {
            if (isSemanticButtonColor(ownerState.color)) return {};
            return {
              color: BUTTON_BLUE,
              "&:hover": { backgroundColor: alpha(BUTTON_BLUE, 0.08) },
              "&.Mui-disabled": { color: alpha(BUTTON_BLUE, 0.3) },
            };
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: { backgroundColor: DEFAULT_TAB_COLOR },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: { "&.Mui-selected": { color: DEFAULT_TAB_COLOR } },
        },
      },
      MuiFilledInput: {
        styleOverrides: {
          root: {
            backgroundColor: backgroundDefault,
            borderRadius: "5px",
            "&:hover": { backgroundColor: backgroundDefault },
            "&:before, &:after": { borderBottom: "none" },
          },
          input: { padding: "12px", color: "#000000" },
        },
      },
      MuiInputLabel: {
        styleOverrides: { root: { color: "#000000" } },
      },
      MuiTextField: { defaultProps: { variant: "filled" } },
      MuiAlert: {
        styleOverrides: {
          root: { backgroundColor: "#fff", color: "#000" },
          icon: { color: "#f44336" },
        },
      },
      MuiFormHelperText: {
        styleOverrides: {
          root: {
            color: "rgba(0, 0, 0, 0.6)",
            "&.Mui-error": { color: "#d32f2f" },
          },
        },
      },
      MuiCheckbox: {
        ...(isDefaultWhiteTheme
          ? {
              defaultProps: {
                icon: <StubIcon name="unchecked" />,
                checkedIcon: <StubIcon name="checked" />,
                indeterminateIcon: <StubIcon name="indeterminate" />,
              },
            }
          : {}),
        styleOverrides: {
          root: {
            ...(isDefaultWhiteTheme
              ? {
                  padding: "9px",
                  "& .MuiSvgIcon-root": { fontSize: 20 },
                  "&.Mui-disabled": { opacity: 0.38 },
                }
              : {}),
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            backgroundColor: isDefaultWhiteTheme ? BUTTON_BLUE : undefined,
            color: isDefaultWhiteTheme ? "#FFFFFF" : undefined,
            fontWeight: 700,
          },
        },
      },
      MuiTableSortLabel: {
        styleOverrides: {
          root: {
            color: isDefaultWhiteTheme ? "#FFFFFF" : undefined,
            "&:hover": { color: isDefaultWhiteTheme ? "#FFFFFF" : undefined },
            "&.Mui-active": {
              color: isDefaultWhiteTheme ? "#FFFFFF" : undefined,
            },
            "& .MuiTableSortLabel-icon": {
              color: isDefaultWhiteTheme ? "#FFFFFF !important" : undefined,
            },
          },
        },
      },
    },
  });
}

/** Pre-4.2C reference implementation — customized variant. */
function legacyCustomizedCreateAppTheme(uiColors = {}, bgImage = "") {
  const normalized = customizedNormalize(uiColors);
  const backgroundDefault = normalized.background;
  const backgroundPaper = normalized.content;
  const buttonMain = normalized.button;

  return createTheme({
    palette: {
      background: {
        default: backgroundDefault,
        paper: backgroundPaper,
      },
      primary: { main: buttonMain },
      custom: {
        containerBg: backgroundDefault,
        navbarBg: backgroundPaper,
        buttonBg: buttonMain,
        searchbarBg: "#FFFFFF",
        backgroundImage: bgImage,
      },
      text: { primary: "#000000", secondary: "#FFFFFF" },
      error: { main: normalized.error },
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: "Roboto, sans-serif",
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
            "&:hover": { backgroundColor: darken(buttonMain, 0.15) },
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
            "&:hover": { backgroundColor: alpha(buttonMain, 0.08) },
            "&.Mui-disabled": { color: alpha(buttonMain, 0.3) },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: { backgroundColor: DEFAULT_TAB_COLOR },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: { "&.Mui-selected": { color: DEFAULT_TAB_COLOR } },
        },
      },
      MuiFilledInput: {
        styleOverrides: {
          root: {
            backgroundColor: backgroundDefault,
            borderRadius: "5px",
            "&:hover": { backgroundColor: backgroundDefault },
            "&:before, &:after": { borderBottom: "none" },
          },
          input: { padding: "12px", color: "#000000" },
        },
      },
      MuiInputLabel: {
        styleOverrides: { root: { color: "#000000" } },
      },
      MuiTextField: { defaultProps: { variant: "filled" } },
      MuiAlert: {
        styleOverrides: {
          root: { backgroundColor: "#fff", color: "#000" },
          icon: { color: "#f44336" },
        },
      },
      MuiFormHelperText: {
        styleOverrides: {
          root: {
            color: "#FFFFFF",
            "&.Mui-error": { color: "#d32f2f" },
          },
        },
      },
    },
  });
}

function extractComparableTheme(theme) {
  return {
    palette: {
      background: {
        default: theme.palette.background.default,
        paper: theme.palette.background.paper,
      },
      primary: { main: theme.palette.primary.main },
      custom: { ...theme.palette.custom },
      text: { ...theme.palette.text },
      error: { main: theme.palette.error.main },
    },
    shape: { ...theme.shape },
    typography: {
      fontFamily: theme.typography.fontFamily,
      fontWeightLight: theme.typography.fontWeightLight,
      fontWeightRegular: theme.typography.fontWeightRegular,
      fontWeightMedium: theme.typography.fontWeightMedium,
      fontWeightBold: theme.typography.fontWeightBold,
    },
    components: {
      MuiTextField: theme.components.MuiTextField,
      MuiAlert: theme.components.MuiAlert,
      MuiFormHelperText: theme.components.MuiFormHelperText,
      MuiPaper: theme.components.MuiPaper,
      MuiTabs: theme.components.MuiTabs,
    },
  };
}

function resolveStyleOverride(override, ownerState = {}) {
  if (typeof override === "function") {
    return override({ ownerState, theme: {} });
  }
  return override;
}

const BASIC_CASES = [
  { name: "defaults", ui: {}, bg: "" },
  {
    name: "custom colors",
    ui: {
      background: "#111111",
      content: "#222222",
      button: "#333333",
      error: "#ff0000",
    },
    bg: "/uploads/bg.png",
  },
  {
    name: "white theme content",
    ui: { background: "#ffffff", content: "#f5f5f5", button: "#232323" },
    bg: "",
  },
  {
    name: "dark content surface",
    ui: { background: "#CDC0A0", content: "#807864", button: "#444444" },
    bg: "/assets/defaultBg.png",
  },
];

const CUSTOMIZED_CASES = [
  { name: "defaults", ui: {}, bg: "" },
  {
    name: "custom colors",
    ui: {
      background: "#aaaaaa",
      content: "#bbbbbb",
      button: "#cccccc",
    },
    bg: "/bg.png",
  },
];

describe("createBasicAppTheme equivalence", () => {
  const checkboxIcons = {
    uncheckedIcon: <StubIcon name="unchecked" />,
    checkedIcon: <StubIcon name="checked" />,
    indeterminateIcon: <StubIcon name="indeterminate" />,
  };

  test.each(BASIC_CASES)("$name matches legacy palette and structure", ({ ui, bg }) => {
    const legacy = legacyBasicCreateAppTheme(ui, bg);
    const next = createBasicAppTheme({
      normalizeUiColors: basicNormalize,
      isWhiteAreaPickerChrome,
      uiColors: ui,
      bgImage: bg,
      checkboxIcons,
    });

    expect(extractComparableTheme(next)).toEqual(
      extractComparableTheme(legacy)
    );
  });

  test.each(BASIC_CASES)(
    "$name matches legacy MuiButton contained styles",
    ({ ui, bg }) => {
      const legacy = legacyBasicCreateAppTheme(ui, bg);
      const next = createBasicAppTheme({
        normalizeUiColors: basicNormalize,
        isWhiteAreaPickerChrome,
        uiColors: ui,
        bgImage: bg,
        checkboxIcons,
      });

      for (const color of ["primary", "error"]) {
        const ownerState = { color };
        expect(
          resolveStyleOverride(
            next.components.MuiButton.styleOverrides.contained,
            ownerState
          )
        ).toEqual(
          resolveStyleOverride(
            legacy.components.MuiButton.styleOverrides.contained,
            ownerState
          )
        );
      }
    }
  );
});

describe("createCustomizedAppTheme equivalence", () => {
  test.each(CUSTOMIZED_CASES)("$name matches legacy palette and structure", ({ ui, bg }) => {
    const legacy = legacyCustomizedCreateAppTheme(ui, bg);
    const next = createCustomizedAppTheme({
      normalizeUiColors: customizedNormalize,
      uiColors: ui,
      bgImage: bg,
    });

    expect(extractComparableTheme(next)).toEqual(
      extractComparableTheme(legacy)
    );
  });

  test.each(CUSTOMIZED_CASES)(
    "$name matches legacy MuiButton contained styles",
    ({ ui, bg }) => {
      const legacy = legacyCustomizedCreateAppTheme(ui, bg);
      const next = createCustomizedAppTheme({
        normalizeUiColors: customizedNormalize,
        uiColors: ui,
        bgImage: bg,
      });

      expect(
        resolveStyleOverride(
          next.components.MuiButton.styleOverrides.contained
        )
      ).toEqual(
        resolveStyleOverride(
          legacy.components.MuiButton.styleOverrides.contained
        )
      );
    }
  );
});

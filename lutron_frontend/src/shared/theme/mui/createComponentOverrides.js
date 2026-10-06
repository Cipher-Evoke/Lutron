import { alpha, darken } from "@mui/material/styles";

const isSemanticButtonColor = (color) =>
  color === "error" ||
  color === "success" ||
  color === "warning" ||
  color === "info";

/** MuiPaper, MuiCard, MuiTabs, MuiTab, inputs, MuiAlert — identical in both variants. */
export function createSharedSurfaceAndInputOverrides({
  backgroundDefault,
  backgroundPaper,
  tabColor,
}) {
  return {
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
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: tabColor,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          "&.Mui-selected": {
            color: tabColor,
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
  };
}

/** Customized: buttons derive from buttonMain. */
export function createCustomizedButtonOverrides({ buttonMain }) {
  return {
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
  };
}

/** Basic: fixed BUTTON_BLUE with semantic color guard. */
export function createBasicButtonOverrides({ buttonBlue }) {
  return {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: "8px",
          fontWeight: 600,
        },
        contained: ({ ownerState }) => {
          if (isSemanticButtonColor(ownerState.color)) {
            return {};
          }
          return {
            backgroundColor: buttonBlue,
            color: "#FFFFFF",
            "&:hover": {
              backgroundColor: darken(buttonBlue, 0.15),
            },
            "&.Mui-disabled": {
              backgroundColor: alpha(buttonBlue, 0.3),
              color: alpha("#FFFFFF", 0.7),
            },
          };
        },
        outlined: ({ ownerState }) => {
          if (isSemanticButtonColor(ownerState.color)) {
            return {};
          }
          return {
            borderColor: buttonBlue,
            color: buttonBlue,
            backgroundColor: alpha(buttonBlue, 0.06),
            "&:hover": {
              borderColor: darken(buttonBlue, 0.15),
              backgroundColor: alpha(buttonBlue, 0.12),
            },
            "&.Mui-disabled": {
              borderColor: alpha(buttonBlue, 0.3),
              color: alpha(buttonBlue, 0.3),
            },
          };
        },
        text: ({ ownerState }) => {
          if (isSemanticButtonColor(ownerState.color)) {
            return {};
          }
          return {
            color: buttonBlue,
            "&:hover": {
              backgroundColor: alpha(buttonBlue, 0.08),
            },
            "&.Mui-disabled": {
              color: alpha(buttonBlue, 0.3),
            },
          };
        },
      },
    },
  };
}

export function createBasicFormHelperOverrides() {
  return {
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          color: "rgba(0, 0, 0, 0.6)",
          "&.Mui-error": {
            color: "#d32f2f",
          },
        },
      },
    },
  };
}

export function createCustomizedFormHelperOverrides() {
  return {
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          color: "#FFFFFF",
          "&.Mui-error": {
            color: "#d32f2f",
          },
        },
      },
    },
  };
}

/** Basic-only white theme checkbox and table header overrides. */
export function createBasicWhiteThemeOverrides({
  isDefaultWhiteTheme,
  buttonBlue,
  checkboxIcons,
}) {
  if (!isDefaultWhiteTheme) {
    return {
      MuiCheckbox: {
        styleOverrides: {
          root: {},
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 700,
          },
        },
      },
      MuiTableSortLabel: {
        styleOverrides: {
          root: {},
        },
      },
    };
  }

  const {
    uncheckedIcon,
    checkedIcon,
    indeterminateIcon,
  } = checkboxIcons;

  return {
    MuiCheckbox: {
      defaultProps: {
        icon: uncheckedIcon,
        checkedIcon,
        indeterminateIcon,
      },
      styleOverrides: {
        root: {
          padding: "9px",
          "& .MuiSvgIcon-root": {
            fontSize: 20,
          },
          "&.Mui-disabled": {
            opacity: 0.38,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: buttonBlue,
          color: "#FFFFFF",
          fontWeight: 700,
        },
      },
    },
    MuiTableSortLabel: {
      styleOverrides: {
        root: {
          color: "#FFFFFF",
          "&:hover": {
            color: "#FFFFFF",
          },
          "&.Mui-active": {
            color: "#FFFFFF",
          },
          "& .MuiTableSortLabel-icon": {
            color: "#FFFFFF !important",
          },
        },
      },
    },
  };
}

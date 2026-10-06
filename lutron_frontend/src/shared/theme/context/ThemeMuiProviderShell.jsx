import React from "react";
import { CssBaseline } from "@mui/material";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";

/**
 * Single MUI theme boundary for the app: ThemeProvider + CssBaseline.
 *
 * @param {object} props
 * @param {object} props.theme - MUI theme object from variant createAppTheme
 * @param {string} [props.remountKey] - When set, forces subtree remount on palette changes (basic/customized)
 */
export function ThemeMuiProviderShell({ theme, remountKey, children }) {
  return (
    <MuiThemeProvider theme={theme} key={remountKey}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}

/**
 * Palette JSON key used by basic/customized to remount MUI subtree after theme switches.
 */
export function getPaletteRemountKey(theme) {
  return JSON.stringify(theme?.palette);
}

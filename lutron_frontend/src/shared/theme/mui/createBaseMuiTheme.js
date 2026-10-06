import { createTheme } from "@mui/material/styles";
import { BASE_BREAKPOINTS } from "./createBreakpoints";
import { BASE_SHAPE } from "./createPalette";
import { BASE_TYPOGRAPHY } from "./createTypography";

/**
 * Assembles a MUI theme from shared structural tokens and variant component overrides.
 */
export function createBaseMuiTheme({ palette, components }) {
  const options = {
    palette,
    shape: BASE_SHAPE,
    typography: BASE_TYPOGRAPHY,
    components,
  };

  if (BASE_BREAKPOINTS) {
    options.breakpoints = BASE_BREAKPOINTS;
  }

  return createTheme(options);
}

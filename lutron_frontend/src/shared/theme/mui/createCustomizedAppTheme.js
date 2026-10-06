import { createBaseMuiTheme } from "./createBaseMuiTheme";
import { createStructuralPalette } from "./createPalette";
import {
  createCustomizedButtonOverrides,
  createCustomizedFormHelperOverrides,
  createSharedSurfaceAndInputOverrides,
} from "./createComponentOverrides";

const DEFAULT_TAB_COLOR = "#1976d2";

const CUSTOMIZED_TEXT_PALETTE = {
  primary: "#000000",
  secondary: "#FFFFFF",
};

/**
 * MUI theme factory for the customized variant.
 */
export function createCustomizedAppTheme({
  normalizeUiColors,
  uiColors = {},
  bgImage = "",
  tabColor = DEFAULT_TAB_COLOR,
}) {
  const normalized = normalizeUiColors(uiColors);
  const backgroundDefault = normalized.background;
  const backgroundPaper = normalized.content;
  const buttonMain = normalized.button;

  const palette = createStructuralPalette({
    backgroundDefault,
    backgroundPaper,
    buttonMain,
    bgImage,
    text: CUSTOMIZED_TEXT_PALETTE,
    errorMain: normalized.error,
  });

  const components = {
    ...createSharedSurfaceAndInputOverrides({
      backgroundDefault,
      backgroundPaper,
      tabColor,
    }),
    ...createCustomizedButtonOverrides({ buttonMain }),
    ...createCustomizedFormHelperOverrides(),
  };

  return createBaseMuiTheme({ palette, components });
}

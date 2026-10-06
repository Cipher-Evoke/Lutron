import { createBaseMuiTheme } from "./createBaseMuiTheme";
import { createStructuralPalette } from "./createPalette";
import {
  createBasicButtonOverrides,
  createBasicFormHelperOverrides,
  createBasicWhiteThemeOverrides,
  createSharedSurfaceAndInputOverrides,
} from "./createComponentOverrides";

const DEFAULT_TAB_COLOR = "#1976d2";
const BUTTON_BLUE = "#1565C0";

const BASIC_TEXT_PALETTE = {
  primary: "rgba(0, 0, 0, 0.87)",
  secondary: "rgba(0, 0, 0, 0.6)",
  disabled: "rgba(0, 0, 0, 0.38)",
};

/**
 * MUI theme factory for the basic variant.
 */
export function createBasicAppTheme({
  normalizeUiColors,
  isWhiteAreaPickerChrome,
  uiColors = {},
  bgImage = "",
  checkboxIcons,
  tabColor = DEFAULT_TAB_COLOR,
  buttonBlue = BUTTON_BLUE,
}) {
  const normalized = normalizeUiColors(uiColors);
  const backgroundDefault = normalized.background;
  const backgroundPaper = normalized.content;
  const buttonMain = normalized.button;
  const isDefaultWhiteTheme = isWhiteAreaPickerChrome(backgroundPaper);

  const palette = createStructuralPalette({
    backgroundDefault,
    backgroundPaper,
    buttonMain,
    bgImage,
    text: BASIC_TEXT_PALETTE,
    errorMain: normalized.error,
  });

  const components = {
    ...createSharedSurfaceAndInputOverrides({
      backgroundDefault,
      backgroundPaper,
      tabColor,
    }),
    ...createBasicButtonOverrides({ buttonBlue }),
    ...createBasicFormHelperOverrides(),
    ...createBasicWhiteThemeOverrides({
      isDefaultWhiteTheme,
      buttonBlue,
      checkboxIcons,
    }),
  };

  return createBaseMuiTheme({ palette, components });
}

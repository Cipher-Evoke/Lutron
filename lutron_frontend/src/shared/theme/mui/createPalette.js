/** Shape token shared by basic and customized. */
export const BASE_SHAPE = {
  borderRadius: 12,
};

const SEARCHBAR_BG = "#FFFFFF";

/**
 * Structural palette fields identical across basic and customized.
 * Variant-specific text and error colors are passed in.
 */
export function createStructuralPalette({
  backgroundDefault,
  backgroundPaper,
  buttonMain,
  bgImage,
  text,
  errorMain,
}) {
  return {
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
      searchbarBg: SEARCHBAR_BG,
      backgroundImage: bgImage,
    },
    text,
    error: {
      main: errorMain,
    },
  };
}

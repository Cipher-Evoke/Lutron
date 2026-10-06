import { createContext } from "react";

/**
 * Default React context value shared by all variants.
 */
export function createThemeContextDefaultValue(defaultBackgroundImage) {
  return {
    theme: null,
    backgroundImage: defaultBackgroundImage,
    reloadTheme: () => {},
  };
}

/**
 * Creates a variant-scoped ThemeContext with the correct default background placeholder.
 */
export function createThemeContext(defaultBackgroundImage) {
  return createContext(createThemeContextDefaultValue(defaultBackgroundImage));
}

/** Slate palette used for Theme Reset and ThemeContext/MainLayout fallbacks. */
export const PRODUCT_DEFAULT_APP_BACKGROUND = "#6f809d";
export const PRODUCT_DEFAULT_APP_CONTENT = "#3d4a5c";
export const PRODUCT_DEFAULT_APP_BUTTON = "#232323";

export const PRODUCT_DEFAULT_THEME_COLOR_MAP = {
  Background: PRODUCT_DEFAULT_APP_BACKGROUND,
  Content: PRODUCT_DEFAULT_APP_CONTENT,
  Button: PRODUCT_DEFAULT_APP_BUTTON,
};

/** Gold preset page background (exact anchor — same rule as usesGoldPageTheme). */
export function isGoldApplicationTheme(background) {
  if (background == null) return false;
  let s = String(background).trim().toLowerCase();
  if (s === "white") s = "#ffffff";
  if (s.startsWith("#") && s.length === 4) {
    s = `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`;
  }
  return s === "#e6c84c";
}

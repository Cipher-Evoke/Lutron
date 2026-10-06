import {
  getFixedGradientPageTheme,
  usesCustomApplicationTheme,
  usesGoldPageTheme,
} from "../../../variants/advanced/utils/themePageBackground";

/** @typedef {'gold' | 'theme3' | 'theme4' | 'custom' | 'default'} AdvancedThemePreset */

/**
 * @param {string} background Normalized background hex from theme settings.
 * @returns {AdvancedThemePreset}
 */
export function resolveAdvancedPreset(background) {
  if (usesGoldPageTheme(background)) return "gold";
  if (usesCustomApplicationTheme(background)) return "custom";
  const fixed = getFixedGradientPageTheme(background);
  if (fixed?.id === "theme3") return "theme3";
  if (fixed?.id === "theme4") return "theme4";
  return "default";
}

/**
 * @param {HTMLElement} root
 * @param {{ gradient: string, anchor: string, className: string }} fixedGradientPageTheme
 */
export function applyFixedGradientPageBase(root, fixedGradientPageTheme) {
  document.documentElement.classList.add(fixedGradientPageTheme.className);
  root.style.setProperty("--app-page-background", fixedGradientPageTheme.gradient);
  root.style.setProperty("--footer-background", fixedGradientPageTheme.gradient);
  root.style.setProperty(
    "--footer-background-color",
    fixedGradientPageTheme.anchor
  );
  root.style.removeProperty("--footer-background-image");
}

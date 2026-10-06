import { isLightSurface } from './themeOnSurface';

const SETTINGS_ACTION_BLUE = '#1565C0';

/**
 * Contained action buttons on settings pages (e.g. Processors): blue on default white
 * theme background, otherwise use the configured theme button color.
 */
export function getThemeButtonColor(buttonColor, backgroundColor) {
  const button = buttonColor || '#232323';
  if (isLightSurface(backgroundColor || '#ffffff')) {
    return SETTINGS_ACTION_BLUE;
  }
  return button;
}

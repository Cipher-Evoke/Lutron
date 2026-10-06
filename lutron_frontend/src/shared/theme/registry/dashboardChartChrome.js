import {
  GOLD_THEME_BUTTON_SOLID,
  GOLD_THEME_SURFACE_GRADIENT,
  THEME_3_BUTTON_SOLID,
  THEME_3_TAB_PILL_GRADIENT,
  THEME_4_BUTTON_SOLID,
  THEME_4_TAB_PILL_GRADIENT,
} from '../../../variants/advanced/config/themeConstants';

/** Chart tooltip / loading colors per application theme (set on :root). */
export function applyDashboardChartChrome(root, { isGoldTheme, isTheme3Page, isTheme4Page, isCustomTheme }) {
  if (isGoldTheme) {
    root.style.setProperty('--dashboard-chart-header-text', '#ffffff');
    root.style.setProperty('--dashboard-chart-tooltip-bg', GOLD_THEME_SURFACE_GRADIENT);
    root.style.setProperty('--dashboard-chart-tooltip-border-color', 'rgba(255, 255, 255, 0.85)');
    root.style.setProperty('--dashboard-chart-tooltip-text', '#ffffff');
    root.style.setProperty('--dashboard-chart-loading-bg', 'rgba(74, 67, 52, 0.35)');
    root.style.setProperty('--dashboard-chart-loading-spinner-track', 'rgba(74, 67, 52, 0.45)');
    root.style.setProperty('--dashboard-chart-loading-spinner-head', GOLD_THEME_BUTTON_SOLID);
    return;
  }
  if (isTheme4Page) {
    root.style.setProperty('--dashboard-chart-header-text', '#ffffff');
    root.style.setProperty('--dashboard-chart-tooltip-bg', THEME_4_TAB_PILL_GRADIENT);
    root.style.setProperty('--dashboard-chart-tooltip-border-color', 'rgba(255, 255, 255, 0.85)');
    root.style.setProperty('--dashboard-chart-tooltip-text', '#ffffff');
    root.style.setProperty('--dashboard-chart-loading-bg', 'rgba(64, 58, 49, 0.32)');
    root.style.setProperty('--dashboard-chart-loading-spinner-track', 'rgba(64, 58, 49, 0.45)');
    root.style.setProperty('--dashboard-chart-loading-spinner-head', THEME_4_BUTTON_SOLID);
    return;
  }
  if (isTheme3Page) {
    root.style.setProperty('--dashboard-chart-header-text', '#ffffff');
    root.style.setProperty('--dashboard-chart-tooltip-bg', THEME_3_TAB_PILL_GRADIENT);
    root.style.setProperty('--dashboard-chart-tooltip-border-color', 'rgba(255, 255, 255, 0.85)');
    root.style.setProperty('--dashboard-chart-tooltip-text', '#ffffff');
    root.style.setProperty('--dashboard-chart-loading-bg', 'rgba(61, 74, 92, 0.28)');
    root.style.setProperty('--dashboard-chart-loading-spinner-track', 'rgba(61, 74, 92, 0.4)');
    root.style.setProperty('--dashboard-chart-loading-spinner-head', THEME_3_BUTTON_SOLID);
    return;
  }
  if (isCustomTheme) {
    return;
  }
  root.style.setProperty('--dashboard-chart-header-text', '#ffffff');
  root.style.setProperty('--dashboard-chart-tooltip-bg', '#3d4a5c');
  root.style.setProperty('--dashboard-chart-tooltip-border-color', '#ffffff');
  root.style.setProperty('--dashboard-chart-tooltip-text', '#ffffff');
  root.style.setProperty('--dashboard-chart-loading-bg', '#232323');
  root.style.setProperty('--dashboard-chart-loading-spinner-track', '#555555');
  root.style.setProperty('--dashboard-chart-loading-spinner-head', '#ffffff');
}

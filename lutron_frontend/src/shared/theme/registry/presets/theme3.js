import {
  THEME_3_LIGHT_PANEL_BG,
  THEME_3_LIGHT_SECTION_BG,
  THEME_3_LIGHT_SURFACE_TEXT,
  THEME_3_TAB_PILL_GRADIENT,
} from "../../../../variants/advanced/config/themeConstants";

/**
 * Theme 3 inline preset (Phase 4.3C) — navigation / early chrome from orchestrator.
 * Page chrome and heatmap remain in theme3PageChrome.js (not moved).
 * @param {HTMLElement} root
 */
export function applyTheme3Preset(root) {
  root.style.setProperty(
    "--settings-theme-pill-active-bg",
    THEME_3_TAB_PILL_GRADIENT
  );
  root.style.setProperty("--settings-theme-pill-active-text", "#ffffff");
  root.style.setProperty(
    "--settings-theme-pill-inactive-border",
    "#C5CDD8"
  );
  root.style.setProperty(
    "--settings-theme-action-button-bg",
    THEME_3_TAB_PILL_GRADIENT
  );
  root.style.setProperty(
    "--settings-theme-action-button-text",
    "#ffffff"
  );
  root.style.setProperty(
    "--settings-sidebar-active-bg",
    THEME_3_TAB_PILL_GRADIENT
  );
  root.style.setProperty("--settings-panel-border", "#C5CDD8");
  root.style.setProperty("--settings-panel-text", "#1a2a42");
  root.style.setProperty("--app-page-text", THEME_3_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--app-page-muted-text", "rgba(26, 42, 66, 0.72)");
  root.style.setProperty("--dashboard-select-field-text", THEME_3_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--quick-control-page-text", THEME_3_LIGHT_SURFACE_TEXT);
  root.style.removeProperty("--topbar-navbar-background");
  root.style.setProperty("--topbar-nav-pill-bg", "rgba(244, 246, 249, 0.95)");
  root.style.setProperty("--topbar-nav-active-text", "#1a2a42");
  root.style.setProperty("--topbar-nav-inactive-text", "#ffffff");
  root.style.setProperty("--topbar-profile-menu-bg", THEME_3_LIGHT_PANEL_BG);
  root.style.setProperty("--topbar-profile-menu-text", THEME_3_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--topbar-profile-menu-border", "#C5CDD8");
  root.style.setProperty("--topbar-profile-menu-hover-bg", THEME_3_LIGHT_SECTION_BG);
  root.style.setProperty("--topbar-profile-menu-icon", "rgba(26, 42, 66, 0.72)");
}

/** @returns {string[]} */
export function getTheme3PresetVariableNames() {
  return [
    "app-page-muted-text",
    "app-page-text",
    "dashboard-select-field-text",
    "quick-control-page-text",
    "settings-panel-border",
    "settings-panel-text",
    "settings-sidebar-active-bg",
    "settings-theme-action-button-bg",
    "settings-theme-action-button-text",
    "settings-theme-pill-active-bg",
    "settings-theme-pill-active-text",
    "settings-theme-pill-inactive-border",
    "topbar-nav-active-text",
    "topbar-nav-inactive-text",
    "topbar-nav-pill-bg",
    "topbar-profile-menu-bg",
    "topbar-profile-menu-border",
    "topbar-profile-menu-hover-bg",
    "topbar-profile-menu-icon",
    "topbar-profile-menu-text",
  ];
}

import {
  THEME_4_BUTTON_SOLID,
  THEME_4_LIGHT_PANEL_BG,
  THEME_4_LIGHT_SECTION_BG,
  THEME_4_LIGHT_SURFACE_TEXT,
  THEME_4_NAVBAR_GRADIENT,
  THEME_4_TAB_PILL_GRADIENT,
} from "../../../../variants/advanced/config/themeConstants";
import { applySettingsSidebarTypographyVars } from "../settingsSidebarTabStyles";
import { applyHeatmapTabPillTokens } from "../../utils/applyHeatmapTabPillTokens";

/**
 * Theme 4 preset CSS variables.
 * @param {HTMLElement} root
 * @param {{ stage?: 'navigation' | 'surface' }} context
 */
export function applyTheme4Preset(root, context = {}) {
  const { stage = "surface" } = context;

  if (stage === "navigation") {
    root.style.setProperty(
      "--topbar-navbar-background",
      THEME_4_NAVBAR_GRADIENT
    );
    root.style.setProperty("--topbar-nav-pill-bg", "rgba(240, 235, 227, 0.95)");
    root.style.setProperty("--topbar-nav-active-text", THEME_4_LIGHT_SURFACE_TEXT);
    root.style.setProperty("--topbar-nav-inactive-text", "#ffffff");
    root.style.setProperty("--topbar-profile-menu-bg", THEME_4_LIGHT_PANEL_BG);
    root.style.setProperty("--topbar-profile-menu-text", THEME_4_LIGHT_SURFACE_TEXT);
    root.style.setProperty("--topbar-profile-menu-border", "rgba(64, 58, 49, 0.28)");
    root.style.setProperty("--topbar-profile-menu-hover-bg", THEME_4_LIGHT_SECTION_BG);
    root.style.setProperty("--topbar-profile-menu-icon", "rgba(44, 40, 32, 0.72)");
    return;
  }

  root.style.setProperty("--heatmap-sidebar-panel-bg", "rgba(64, 58, 49, 0.55)");
  root.style.setProperty("--heatmap-sidebar-panel-border", "rgba(255, 255, 255, 0.2)");
  root.style.setProperty("--heatmap-sidebar-section-bg", THEME_4_TAB_PILL_GRADIENT);
  root.style.setProperty("--heatmap-sidebar-panel-label", "#ffffff");
  root.style.setProperty("--heatmap-sidebar-section-text", "#ffffff");
  root.style.setProperty("--heatmap-sidebar-section-label-bg", "rgba(0, 0, 0, 0.15)");
  root.style.setProperty(
    "--heatmap-sidebar-loading-overlay-bg",
    "rgba(250, 246, 239, 0.94)"
  );
  root.style.setProperty(
    "--heatmap-sidebar-loading-spinner-color",
    THEME_4_BUTTON_SOLID
  );
  // Dark brown track (same as cards) so inactive white labels stay readable —
  // matches Gold / Blue dashboard tabs. Do not use light cream track here.
  applyHeatmapTabPillTokens(root, {
    pillBg: THEME_4_TAB_PILL_GRADIENT,
    activeText: THEME_4_BUTTON_SOLID,
    contrastSolid: THEME_4_BUTTON_SOLID,
  });
  root.style.setProperty("--home-editor-text", THEME_4_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--home-tab-active-color", "#403A31");
  root.style.setProperty("--home-field-surface-bg", "#f0ebe3");
  root.style.setProperty("--home-field-border", "rgba(64, 58, 49, 0.28)");
  root.style.setProperty("--heatmap-dialog-paper-bg", THEME_4_LIGHT_PANEL_BG);
  root.style.setProperty("--heatmap-dialog-section-bg", THEME_4_TAB_PILL_GRADIENT);
  root.style.setProperty("--heatmap-dialog-zone-card-bg", "#ffffff");
  root.style.setProperty("--heatmap-rename-dialog-bg", THEME_4_TAB_PILL_GRADIENT);
  root.style.setProperty("--heatmap-legends-nav-bg", "#f0ebe3");
  root.style.setProperty("--heatmap-legends-nav-text", "#2c2820");
  root.style.setProperty("--heatmap-select-menu-bg", "#f0ebe3");
  root.style.setProperty("--heatmap-select-menu-hover", "rgba(64, 58, 49, 0.12)");
  root.style.setProperty("--heatmap-select-menu-selected", "rgba(64, 58, 49, 0.22)");
  root.style.setProperty("--heatmap-select-menu-selected-hover", "rgba(64, 58, 49, 0.28)");
  root.style.setProperty("--schedule-grid-bg", THEME_4_TAB_PILL_GRADIENT);
  root.style.setProperty("--schedule-panel-bg", "#f0ebe3");
  root.style.setProperty("--schedule-panel-border", "rgba(64, 58, 49, 0.28)");
  root.style.setProperty("--schedule-section-bg", THEME_4_TAB_PILL_GRADIENT);
  root.style.setProperty("--schedule-section-text", "#ffffff");
  root.style.setProperty("--schedule-panel-label", "#2c2820");
  root.style.setProperty("--schedule-page-heading-text", THEME_4_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--schedule-modal-bg", THEME_4_TAB_PILL_GRADIENT);
  root.style.setProperty("--schedule-modal-title-color", "#ffffff");
  root.style.setProperty("--schedule-modal-body-text", "#ffffff");
  root.style.setProperty("--schedule-modal-muted-text", "rgba(255, 255, 255, 0.9)");
  root.style.setProperty("--schedule-modal-section-label-color", "#ffffff");
  root.style.setProperty("--schedule-modal-item-selected-bg", "#403A31");
  root.style.setProperty("--quick-control-page-text", THEME_4_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--quick-control-radio-border", "rgba(255, 255, 255, 0.9)");
  root.style.setProperty("--quick-control-radio-checked-fill", "#ffffff");
  root.style.setProperty("--quick-control-radio-unchecked-fill", "transparent");
  root.style.setProperty("--schedule-today-bg", "#ffffff");
  root.style.setProperty("--schedule-today-text", THEME_4_LIGHT_SURFACE_TEXT);
  root.style.setProperty(
    "--schedule-event-active-bg",
    `linear-gradient(90deg, ${THEME_4_LIGHT_SECTION_BG} 0%, ${THEME_4_LIGHT_PANEL_BG} 100%)`
  );
  root.style.setProperty("--schedule-event-active-text", THEME_4_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--schedule-status-text", THEME_4_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--schedule-select-bg", THEME_4_LIGHT_PANEL_BG);
  root.style.setProperty("--schedule-select-text", THEME_4_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--schedule-select-menu-bg", THEME_4_LIGHT_PANEL_BG);
  root.style.setProperty("--schedule-select-menu-text", THEME_4_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--schedule-select-menu-hover", "rgba(64, 58, 49, 0.16)");
  root.style.setProperty("--schedule-select-menu-selected-hover", "#352f28");
  root.style.setProperty("--area-picker-light-dialog-bg", THEME_4_TAB_PILL_GRADIENT);
  root.style.setProperty("--area-picker-light-dialog-title-color", "#ffffff");
  root.style.setProperty("--area-picker-light-dialog-field-text", "#2c2820");
  root.style.setProperty("--area-picker-confirm-dialog-body-text", "rgba(255, 255, 255, 0.92)");
  root.style.setProperty("--settings-theme-dialog-bg", THEME_4_TAB_PILL_GRADIENT);
  root.style.setProperty("--settings-sidebar-text", "#2c2820");
  root.style.setProperty("--settings-sidebar-title-color", "#2c2820");
  root.style.setProperty("--settings-sidebar-active-bg", THEME_4_TAB_PILL_GRADIENT);
  root.style.setProperty("--settings-sidebar-active-text", "#ffffff");
  root.style.setProperty("--settings-sidebar-hover-bg", "rgba(64, 58, 49, 0.14)");
  applySettingsSidebarTypographyVars(root);
  root.style.setProperty("--settings-panel-inner-bg", THEME_4_LIGHT_PANEL_BG);
  root.style.setProperty("--settings-theme-card-bg", THEME_4_LIGHT_PANEL_BG);
  root.style.setProperty("--settings-panel-outer-bg", THEME_4_LIGHT_SECTION_BG);
  root.style.setProperty("--settings-panel-border", "rgba(64, 58, 49, 0.28)");
  root.style.setProperty("--settings-panel-text", THEME_4_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--settings-panel-muted-text", "rgba(44, 40, 32, 0.72)");
  root.style.setProperty("--settings-panel-button-text", "#ffffff");
  root.style.setProperty("--settings-panel-button-bg", THEME_4_LIGHT_SECTION_BG);
  root.style.setProperty("--users-table-container-bg", "#ffffff");
  root.style.setProperty("--users-table-head-bg", THEME_4_LIGHT_SECTION_BG);
  root.style.setProperty("--users-table-row-bg", THEME_4_LIGHT_PANEL_BG);
  root.style.setProperty("--users-modal-bg", THEME_4_LIGHT_PANEL_BG);
  root.style.setProperty("--users-modal-inner-bg", "#ffffff");
  root.style.setProperty("--users-modal-info-bg", THEME_4_LIGHT_SECTION_BG);
  root.style.setProperty("--users-input-bg", "#ffffff");
  root.style.setProperty("--users-select-menu-bg", THEME_4_LIGHT_SECTION_BG);
  root.style.setProperty("--users-select-menu-hover", "rgba(64, 58, 49, 0.12)");
  root.style.setProperty("--users-select-menu-checkbox-color", "rgba(44, 40, 32, 0.55)");
  root.style.setProperty("--users-select-menu-checkbox-checked-color", THEME_4_BUTTON_SOLID);
  root.style.setProperty("--users-chip-bg", THEME_4_LIGHT_SECTION_BG);
  root.style.setProperty("--users-confirm-dialog-bg", THEME_4_LIGHT_PANEL_BG);
  root.style.setProperty("--users-border", "rgba(64, 58, 49, 0.28)");
  root.style.setProperty("--area-groups-panel-bg", THEME_4_LIGHT_PANEL_BG);
  root.style.setProperty("--area-groups-inner-bg", THEME_4_LIGHT_SECTION_BG);
  root.style.setProperty("--area-groups-chip-bg", THEME_4_LIGHT_SECTION_BG);
  root.style.setProperty("--area-groups-border", "rgba(64, 58, 49, 0.28)");
  root.style.setProperty("--area-group-on-surface-text", THEME_4_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--area-group-inner-text", THEME_4_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--settings-form-section-bg", THEME_4_LIGHT_SECTION_BG);
  root.style.setProperty("--settings-form-control-bg", "#ffffff");
  root.style.setProperty("--settings-form-control-text", THEME_4_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--settings-form-label-color", THEME_4_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--activity-report-page-text", "#2c2820");
  root.style.setProperty("--activity-report-page-muted-text", "rgba(44, 40, 32, 0.72)");
  root.style.setProperty("--activity-report-page-disabled-text", "rgba(44, 40, 32, 0.35)");
  root.style.setProperty("--activity-report-pagination-text", "#2c2820");
  root.style.setProperty("--activity-report-table-head-bg", "#f0ebe3");
  root.style.setProperty("--activity-report-table-container-bg", "#ffffff");
  root.style.setProperty("--activity-report-table-row-bg", "#ffffff");
  root.style.setProperty("--activity-report-table-row-alt-bg", "#faf6ef");
  root.style.setProperty("--activity-report-table-text", "#2c2820");
  root.style.setProperty("--activity-report-table-head-text", "#2c2820");
  root.style.setProperty("--activity-report-chip-border", "rgba(64, 58, 49, 0.4)");
  root.style.setProperty("--activity-report-filter-field-bg", THEME_4_LIGHT_SECTION_BG);
  root.style.setProperty("--activity-report-filter-field-border", "rgba(64, 58, 49, 0.28)");
  root.style.setProperty("--alerts-export-menu-bg", THEME_4_LIGHT_PANEL_BG);
  root.style.setProperty("--alerts-export-menu-border", "rgba(64, 58, 49, 0.28)");
  root.style.setProperty("--alerts-export-menu-text", THEME_4_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--topbar-profile-menu-bg", THEME_4_LIGHT_PANEL_BG);
  root.style.setProperty("--topbar-profile-menu-text", THEME_4_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--topbar-profile-menu-border", "rgba(64, 58, 49, 0.28)");
  root.style.setProperty("--topbar-profile-menu-hover-bg", THEME_4_LIGHT_SECTION_BG);
  root.style.setProperty("--topbar-profile-menu-icon", "rgba(44, 40, 32, 0.72)");
  root.style.setProperty("--alerts-menu-hover", THEME_4_LIGHT_SECTION_BG);
  root.style.setProperty("--alerts-menu-bg", THEME_4_LIGHT_PANEL_BG);
  root.style.setProperty("--alerts-menu-text", THEME_4_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--alerts-menu-selected", "rgba(64, 58, 49, 0.18)");
  root.style.setProperty("--alerts-menu-field-bg", "#ffffff");
  root.style.setProperty("--dashboard-select-option-bg", THEME_4_LIGHT_PANEL_BG);
  root.style.setProperty("--dashboard-select-option-text", THEME_4_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--dashboard-select-option-selected-bg", THEME_4_BUTTON_SOLID);
  root.style.setProperty("--dashboard-select-option-selected-text", "#ffffff");
  root.style.setProperty("--dashboard-select-menu-hover", "rgba(64, 58, 49, 0.12)");
  root.style.setProperty("--dashboard-select-menu-selected-hover", "rgba(64, 58, 49, 0.28)");
  root.style.setProperty("--dashboard-select-field-bg", "#ffffff");
  root.style.setProperty("--dashboard-select-field-text", THEME_4_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--dashboard-select-field-border", "rgba(64, 58, 49, 0.28)");
  root.style.setProperty("--dashboard-area-tree-hover-bg", THEME_4_LIGHT_SECTION_BG);
  root.style.setProperty("--app-page-text", THEME_4_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--app-page-muted-text", "rgba(44, 40, 32, 0.72)");
  root.style.setProperty("--dashboard-alert-filter-hover-bg", "rgba(64, 58, 49, 0.08)");
  root.style.setProperty("--dashboard-control-accent", THEME_4_BUTTON_SOLID);
  root.style.setProperty("--dashboard-alert-filter-bg", "#ffffff");
  root.style.setProperty("--dashboard-alert-filter-menu-bg", THEME_4_LIGHT_PANEL_BG);
  root.style.setProperty("--dashboard-alert-filter-border", "rgba(64, 58, 49, 0.28)");
  root.style.setProperty("--dashboard-alert-filter-checked-bg", THEME_4_LIGHT_SECTION_BG);
  root.style.setProperty("--dashboard-alert-filter-text", THEME_4_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--settings-theme-pill-active-bg", THEME_4_TAB_PILL_GRADIENT);
  root.style.setProperty("--settings-theme-pill-active-text", "#ffffff");
  root.style.setProperty("--settings-theme-action-button-bg", THEME_4_TAB_PILL_GRADIENT);
  root.style.setProperty("--settings-theme-action-button-text", "#ffffff");
  root.style.setProperty("--auth-page-background-image", "none");
  root.style.setProperty("--auth-card-bg", THEME_4_TAB_PILL_GRADIENT);
  root.style.setProperty("--auth-card-text", "#ffffff");
  root.style.setProperty("--auth-card-subtext", "rgba(255, 255, 255, 0.92)");
  root.style.setProperty("--auth-card-caption", "rgba(255, 255, 255, 0.85)");
  root.style.setProperty("--auth-card-border", "rgba(64, 58, 49, 0.35)");
  root.style.setProperty("--auth-card-shadow", "0 8px 32px rgba(64, 58, 49, 0.28)");
  root.style.setProperty("--auth-field-border-focus", THEME_4_BUTTON_SOLID);
  root.style.setProperty("--auth-button-background", THEME_4_TAB_PILL_GRADIENT);
  root.style.setProperty("--auth-button-bg", THEME_4_BUTTON_SOLID);
  root.style.setProperty("--auth-button-text", "#ffffff");
  root.style.setProperty("--auth-button-hover-bg", THEME_4_BUTTON_SOLID);
  root.style.setProperty("--auth-icon-color", "#ffffff");
}

/** @returns {string[]} */
export function getTheme4PresetVariableNames() {
  return [
    "activity-report-chip-border",
    "activity-report-filter-field-bg",
    "activity-report-filter-field-border",
    "activity-report-page-disabled-text",
    "activity-report-page-muted-text",
    "activity-report-page-text",
    "activity-report-pagination-text",
    "activity-report-table-container-bg",
    "activity-report-table-head-bg",
    "activity-report-table-head-text",
    "activity-report-table-row-alt-bg",
    "activity-report-table-row-bg",
    "activity-report-table-text",
    "alerts-export-menu-bg",
    "alerts-export-menu-border",
    "alerts-export-menu-text",
    "alerts-menu-bg",
    "alerts-menu-field-bg",
    "alerts-menu-hover",
    "alerts-menu-selected",
    "alerts-menu-text",
    "app-page-muted-text",
    "app-page-text",
    "area-groups-border",
    "area-groups-chip-bg",
    "area-groups-inner-bg",
    "area-groups-panel-bg",
    "area-picker-confirm-dialog-body-text",
    "area-picker-light-dialog-bg",
    "area-picker-light-dialog-field-text",
    "area-picker-light-dialog-title-color",
    "auth-button-background",
    "auth-button-bg",
    "auth-button-hover-bg",
    "auth-button-text",
    "auth-card-bg",
    "auth-card-border",
    "auth-card-caption",
    "auth-card-shadow",
    "auth-card-subtext",
    "auth-card-text",
    "auth-field-border-focus",
    "auth-icon-color",
    "auth-page-background-image",
    "dashboard-alert-filter-bg",
    "dashboard-alert-filter-border",
    "dashboard-alert-filter-checked-bg",
    "dashboard-alert-filter-hover-bg",
    "dashboard-alert-filter-menu-bg",
    "dashboard-alert-filter-text",
    "dashboard-area-tree-hover-bg",
    "dashboard-control-accent",
    "dashboard-select-field-bg",
    "dashboard-select-field-border",
    "dashboard-select-field-text",
    "dashboard-select-menu-hover",
    "dashboard-select-menu-selected-hover",
    "dashboard-select-option-bg",
    "dashboard-select-option-selected-bg",
    "dashboard-select-option-selected-text",
    "dashboard-select-option-text",
    "heatmap-dialog-paper-bg",
    "heatmap-dialog-section-bg",
    "heatmap-dialog-zone-card-bg",
    "heatmap-legends-nav-bg",
    "heatmap-legends-nav-text",
    "heatmap-rename-dialog-bg",
    "heatmap-select-menu-bg",
    "heatmap-select-menu-hover",
    "heatmap-select-menu-selected",
    "heatmap-select-menu-selected-hover",
    "heatmap-sidebar-loading-overlay-bg",
    "heatmap-sidebar-loading-spinner-color",
    "heatmap-sidebar-panel-bg",
    "heatmap-sidebar-panel-border",
    "heatmap-sidebar-panel-label",
    "heatmap-sidebar-section-bg",
    "heatmap-sidebar-section-label-bg",
    "heatmap-sidebar-section-text",
    "heatmap-tab-active-text",
    "heatmap-tab-inactive-text",
    "heatmap-tab-indicator-bg",
    "heatmap-tab-pill-bg",
    "home-editor-text",
    "home-field-border",
    "home-field-surface-bg",
    "home-tab-active-color",
    "quick-control-page-text",
    "quick-control-radio-border",
    "quick-control-radio-checked-fill",
    "quick-control-radio-unchecked-fill",
    "schedule-event-active-bg",
    "schedule-event-active-text",
    "schedule-grid-bg",
    "schedule-modal-bg",
    "schedule-modal-body-text",
    "schedule-modal-item-selected-bg",
    "schedule-modal-muted-text",
    "schedule-modal-section-label-color",
    "schedule-modal-title-color",
    "schedule-page-heading-text",
    "schedule-panel-bg",
    "schedule-panel-border",
    "schedule-panel-label",
    "schedule-section-bg",
    "schedule-section-text",
    "schedule-select-bg",
    "schedule-select-menu-bg",
    "schedule-select-menu-hover",
    "schedule-select-menu-selected-hover",
    "schedule-select-menu-text",
    "schedule-select-text",
    "schedule-status-text",
    "schedule-today-bg",
    "schedule-today-text",
    "settings-form-control-bg",
    "settings-form-control-text",
    "settings-form-label-color",
    "settings-form-section-bg",
    "settings-panel-border",
    "settings-panel-button-bg",
    "settings-panel-button-text",
    "settings-panel-inner-bg",
    "settings-panel-muted-text",
    "settings-panel-outer-bg",
    "settings-panel-text",
    "settings-sidebar-active-bg",
    "settings-sidebar-active-text",
    "settings-sidebar-hover-bg",
    "settings-sidebar-text",
    "settings-sidebar-title-color",
    "settings-theme-action-button-bg",
    "settings-theme-action-button-text",
    "settings-theme-card-bg",
    "settings-theme-dialog-bg",
    "settings-theme-pill-active-bg",
    "settings-theme-pill-active-text",
    "topbar-nav-active-text",
    "topbar-nav-inactive-text",
    "topbar-nav-pill-bg",
    "topbar-navbar-background",
    "topbar-profile-menu-bg",
    "topbar-profile-menu-border",
    "topbar-profile-menu-hover-bg",
    "topbar-profile-menu-icon",
    "topbar-profile-menu-text",
    "users-border",
    "users-chip-bg",
    "users-confirm-dialog-bg",
    "users-input-bg",
    "users-modal-bg",
    "users-modal-info-bg",
    "users-modal-inner-bg",
    "users-select-menu-bg",
    "users-select-menu-hover",
    "users-table-container-bg",
    "users-table-head-bg",
    "users-table-row-bg"
  ];
}

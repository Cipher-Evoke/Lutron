import { lighten } from "@mui/material/styles";
import {
  GOLD_THEME_BUTTON_SOLID,
  GOLD_THEME_LIGHT_PANEL_BG,
  GOLD_THEME_LIGHT_SECTION_BG,
  GOLD_THEME_LIGHT_SURFACE_TEXT,
  GOLD_THEME_SURFACE_GRADIENT,
  GOLD_THEME_TAB_INDICATOR_BG,
} from "../../../../variants/advanced/config/themeConstants";
import { applySettingsSidebarTypographyVars } from "../settingsSidebarTabStyles";
import { applyHeatmapTabPillTokens } from "../../utils/applyHeatmapTabPillTokens";
import { resolveWordmarkLogoFilter } from "../../utils/resolveWordmarkLogoFilter";

/**
 * Gold preset CSS variables (Phase 4.3B extraction from ThemeContext).
 * @param {HTMLElement} root
 * @param {{ background: string, buttonStyle: { solid: string } }} context
 */
export function applyGoldPreset(root, context) {
  const { background, buttonStyle, stage = "main" } = context;

  if (stage === "heatmap") {
    root.style.setProperty("--heatmap-sidebar-panel-bg", "rgba(58, 53, 46, 0.55)");
    root.style.setProperty("--heatmap-sidebar-panel-border", "rgba(255, 255, 255, 0.2)");
    root.style.setProperty("--heatmap-sidebar-section-bg", GOLD_THEME_SURFACE_GRADIENT);
    root.style.setProperty("--heatmap-sidebar-panel-label", "#ffffff");
    root.style.setProperty("--heatmap-sidebar-section-text", "#ffffff");
    root.style.setProperty("--heatmap-sidebar-section-label-bg", "rgba(0, 0, 0, 0.15)");
    root.style.setProperty(
      "--heatmap-sidebar-loading-overlay-bg",
      "rgba(250, 240, 212, 0.94)"
    );
    root.style.setProperty(
      "--heatmap-sidebar-loading-spinner-color",
      GOLD_THEME_BUTTON_SOLID
    );
    applyHeatmapTabPillTokens(root, {
      pillBg: GOLD_THEME_SURFACE_GRADIENT,
      activeText: GOLD_THEME_BUTTON_SOLID,
      contrastSolid: GOLD_THEME_BUTTON_SOLID,
      indicatorBg: GOLD_THEME_TAB_INDICATOR_BG,
    });
    root.style.setProperty("--home-tab-active-color", "#3D3629");
    root.style.setProperty("--home-field-surface-bg", GOLD_THEME_LIGHT_SECTION_BG);
    root.style.setProperty("--home-field-border", "rgba(74, 67, 52, 0.28)");
    root.style.setProperty("--heatmap-dialog-paper-bg", GOLD_THEME_LIGHT_PANEL_BG);
    root.style.setProperty("--heatmap-dialog-section-bg", GOLD_THEME_SURFACE_GRADIENT);
    root.style.setProperty("--heatmap-dialog-zone-card-bg", "#ffffff");
    root.style.setProperty("--heatmap-rename-dialog-bg", GOLD_THEME_LIGHT_PANEL_BG);
    root.style.setProperty("--heatmap-rename-dialog-title-color", GOLD_THEME_LIGHT_SURFACE_TEXT);
    root.style.setProperty("--heatmap-rename-dialog-border", "rgba(74, 67, 52, 0.28)");
    root.style.setProperty(
      "--heatmap-rename-dialog-shadow",
      "0 8px 24px rgba(74, 67, 52, 0.18)"
    );
    root.style.setProperty("--heatmap-rename-dialog-field-bg", "#ffffff");
    root.style.setProperty("--heatmap-rename-dialog-field-text", GOLD_THEME_LIGHT_SURFACE_TEXT);
    root.style.setProperty(
      "--heatmap-rename-dialog-field-border",
      "rgba(74, 67, 52, 0.28)"
    );
    root.style.setProperty("--heatmap-rename-dialog-label-color", GOLD_THEME_LIGHT_SURFACE_TEXT);
    root.style.setProperty("--heatmap-rename-dialog-label-bg", GOLD_THEME_LIGHT_PANEL_BG);
    root.style.setProperty("--heatmap-rename-dialog-cancel-color", GOLD_THEME_LIGHT_SURFACE_TEXT);
    root.style.setProperty(
      "--heatmap-rename-dialog-cancel-border",
      "rgba(74, 67, 52, 0.35)"
    );
    root.style.setProperty("--heatmap-legends-nav-bg", GOLD_THEME_LIGHT_PANEL_BG);
    root.style.setProperty("--heatmap-legends-nav-text", GOLD_THEME_LIGHT_SURFACE_TEXT);
    root.style.setProperty("--heatmap-select-menu-bg", GOLD_THEME_LIGHT_SECTION_BG);
    root.style.setProperty("--heatmap-select-menu-hover", "rgba(74, 67, 52, 0.12)");
    root.style.setProperty("--heatmap-select-menu-selected", "rgba(74, 67, 52, 0.22)");
    root.style.setProperty("--heatmap-select-menu-selected-hover", "rgba(74, 67, 52, 0.28)");
    return;
  }

  root.style.setProperty("--area-picker-light-dialog-bg", GOLD_THEME_LIGHT_PANEL_BG);
  root.style.setProperty("--area-picker-light-dialog-title-color", GOLD_THEME_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--activity-report-table-head-bg", GOLD_THEME_LIGHT_SECTION_BG);
  root.style.setProperty("--activity-report-table-container-bg", GOLD_THEME_LIGHT_PANEL_BG);
  root.style.setProperty("--activity-report-table-row-bg", "#ffffff");
  root.style.setProperty("--activity-report-table-row-alt-bg", GOLD_THEME_LIGHT_SECTION_BG);
  root.style.setProperty("--activity-report-table-text", GOLD_THEME_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--activity-report-table-head-text", GOLD_THEME_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--activity-report-page-text", GOLD_THEME_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--activity-report-page-muted-text", "rgba(44, 40, 32, 0.72)");
  root.style.setProperty("--activity-report-page-disabled-text", "rgba(44, 40, 32, 0.35)");
  root.style.setProperty("--activity-report-pagination-text", GOLD_THEME_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--activity-report-chip-border", "rgba(74, 67, 52, 0.4)");
  root.style.setProperty("--activity-report-filter-field-bg", "#ffffff");
  root.style.setProperty("--activity-report-filter-field-border", "rgba(74, 67, 52, 0.28)");
  const lightBg = lighten(background, 0.25);
  const veryLightBg = lighten(background, 0.55);
  const pageBackground = `radial-gradient(circle at 50% 15%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.12) 20%, rgba(255,255,255,0.05) 40%, transparent 70%), linear-gradient(180deg, ${background} 0%, ${lightBg} 42%, ${veryLightBg} 100%)`;
  const footerBackground = `linear-gradient(180deg, ${background} 0%, ${lightBg} 42%, ${veryLightBg} 100%)`;
  root.style.setProperty("--app-page-background", pageBackground);
  root.style.setProperty("--app-page-text", GOLD_THEME_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--app-page-muted-text", "rgba(44, 40, 32, 0.72)");
  root.style.setProperty("--dashboard-select-field-text", GOLD_THEME_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--footer-background", footerBackground);
  root.style.setProperty("--footer-background-color", background);
  root.style.removeProperty("--footer-background-image");
  root.style.setProperty("--footer-text-color", GOLD_THEME_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--footer-logo-filter", resolveWordmarkLogoFilter(veryLightBg));
  root.style.setProperty("--schedule-grid-bg", "#3D3629");
  root.style.setProperty("--schedule-panel-bg", GOLD_THEME_LIGHT_PANEL_BG);
  root.style.setProperty("--schedule-panel-border", "rgba(74, 67, 52, 0.22)");
  root.style.setProperty("--schedule-section-bg", GOLD_THEME_LIGHT_SECTION_BG);
  root.style.setProperty("--schedule-section-text", GOLD_THEME_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--schedule-panel-label", GOLD_THEME_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--schedule-page-heading-text", GOLD_THEME_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--schedule-modal-bg", GOLD_THEME_LIGHT_PANEL_BG);
  root.style.setProperty("--schedule-modal-title-color", GOLD_THEME_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--schedule-today-bg", "#ffffff");
  root.style.setProperty("--schedule-today-text", "#000000");
  root.style.setProperty(
    "--schedule-event-active-bg",
    `linear-gradient(90deg, ${GOLD_THEME_LIGHT_SECTION_BG} 0%, ${GOLD_THEME_LIGHT_PANEL_BG} 100%)`
  );
  root.style.setProperty("--schedule-event-active-text", GOLD_THEME_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--schedule-status-text", GOLD_THEME_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--schedule-select-bg", GOLD_THEME_LIGHT_PANEL_BG);
  root.style.setProperty("--schedule-select-text", GOLD_THEME_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--schedule-select-menu-bg", GOLD_THEME_LIGHT_PANEL_BG);
  root.style.setProperty("--schedule-select-menu-text", GOLD_THEME_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--schedule-select-menu-hover", "rgba(74, 67, 52, 0.16)");
  root.style.setProperty("--schedule-select-menu-selected-hover", "#3D3629");
  root.style.setProperty("--schedule-modal-body-text", GOLD_THEME_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--schedule-modal-muted-text", "rgba(44, 40, 32, 0.72)");
  root.style.setProperty("--schedule-modal-section-label-color", GOLD_THEME_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--schedule-modal-item-selected-bg", GOLD_THEME_BUTTON_SOLID);
  root.style.setProperty("--schedule-modal-item-selected-text", "#ffffff");
  root.style.setProperty("--quick-control-page-text", GOLD_THEME_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--quick-control-radio-border", GOLD_THEME_BUTTON_SOLID);
  root.style.setProperty("--quick-control-radio-checked-fill", GOLD_THEME_BUTTON_SOLID);
  root.style.setProperty("--quick-control-radio-unchecked-fill", "#ffffff");
  root.style.setProperty("--settings-color-swatch-selected-stroke", GOLD_THEME_BUTTON_SOLID);
  root.style.setProperty("--help-download-available-bg", GOLD_THEME_LIGHT_PANEL_BG);
  root.style.setProperty("--help-download-available-hover-bg", GOLD_THEME_LIGHT_SECTION_BG);
  root.style.setProperty("--help-download-available-text", "#000000");
  root.style.setProperty("--help-download-available-border", GOLD_THEME_BUTTON_SOLID);
  root.style.setProperty("--help-download-unavailable-bg", "transparent");
  root.style.setProperty("--help-download-unavailable-text", "rgba(255, 255, 255, 0.42)");
  root.style.setProperty("--help-download-unavailable-border", "rgba(255, 255, 255, 0.45)");
  root.style.setProperty("--settings-panel-inner-bg", GOLD_THEME_LIGHT_PANEL_BG);
  root.style.setProperty("--settings-theme-card-bg", GOLD_THEME_LIGHT_PANEL_BG);
  root.style.setProperty("--settings-theme-dialog-bg", GOLD_THEME_LIGHT_PANEL_BG);
  root.style.setProperty("--settings-panel-outer-bg", GOLD_THEME_LIGHT_SECTION_BG);
  root.style.setProperty("--settings-panel-border", "rgba(74, 67, 52, 0.28)");
  root.style.setProperty("--settings-sidebar-text", GOLD_THEME_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--settings-sidebar-title-color", GOLD_THEME_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--settings-sidebar-active-bg", GOLD_THEME_SURFACE_GRADIENT);
  root.style.setProperty("--settings-sidebar-active-text", "#ffffff");
  root.style.setProperty("--settings-sidebar-hover-bg", "rgba(74, 67, 52, 0.14)");
  applySettingsSidebarTypographyVars(root);
  root.style.setProperty("--settings-panel-text", GOLD_THEME_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--settings-panel-muted-text", "rgba(44, 40, 32, 0.72)");
  root.style.setProperty("--settings-panel-button-text", GOLD_THEME_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--settings-panel-button-bg", GOLD_THEME_LIGHT_SECTION_BG);
  root.style.setProperty("--users-table-container-bg", GOLD_THEME_LIGHT_SECTION_BG);
  root.style.setProperty("--users-table-head-bg", GOLD_THEME_LIGHT_SECTION_BG);
  root.style.setProperty("--users-table-row-bg", "#ffffff");
  root.style.setProperty("--users-modal-bg", GOLD_THEME_LIGHT_PANEL_BG);
  root.style.setProperty("--users-modal-inner-bg", "#ffffff");
  root.style.setProperty("--users-modal-info-bg", GOLD_THEME_LIGHT_SECTION_BG);
  root.style.setProperty("--users-input-bg", "#ffffff");
  root.style.setProperty("--users-select-menu-bg", "#ffffff");
  root.style.setProperty("--users-select-menu-hover", GOLD_THEME_LIGHT_SECTION_BG);
  root.style.setProperty("--users-select-menu-checkbox-color", "rgba(44, 40, 32, 0.55)");
  root.style.setProperty("--users-select-menu-checkbox-checked-color", GOLD_THEME_BUTTON_SOLID);
  root.style.setProperty("--users-chip-bg", GOLD_THEME_LIGHT_SECTION_BG);
  root.style.setProperty("--users-confirm-dialog-bg", GOLD_THEME_LIGHT_PANEL_BG);
  root.style.setProperty("--users-border", "rgba(74, 67, 52, 0.28)");
  root.style.setProperty("--area-groups-panel-bg", GOLD_THEME_LIGHT_PANEL_BG);
  root.style.setProperty("--area-groups-inner-bg", "#ffffff");
  root.style.setProperty("--area-groups-chip-bg", GOLD_THEME_LIGHT_SECTION_BG);
  root.style.setProperty("--area-groups-border", "rgba(74, 67, 52, 0.28)");
  root.style.setProperty("--area-group-on-surface-text", GOLD_THEME_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--area-group-inner-text", GOLD_THEME_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--settings-form-section-bg", GOLD_THEME_LIGHT_SECTION_BG);
  root.style.setProperty("--settings-form-control-bg", "#ffffff");
  root.style.setProperty("--settings-form-control-text", GOLD_THEME_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--settings-form-label-color", GOLD_THEME_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--alerts-panel-bg", GOLD_THEME_LIGHT_PANEL_BG);
  root.style.setProperty("--alerts-panel-text", GOLD_THEME_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--alerts-panel-muted-text", "rgba(44, 40, 32, 0.72)");
  root.style.setProperty("--alerts-table-container-bg", GOLD_THEME_LIGHT_SECTION_BG);
  root.style.setProperty("--alerts-table-head-bg", GOLD_THEME_SURFACE_GRADIENT);
  root.style.setProperty("--alerts-table-head-text", "#ffffff");
  root.style.setProperty("--alerts-export-menu-bg", GOLD_THEME_LIGHT_PANEL_BG);
  root.style.setProperty("--alerts-export-menu-border", "rgba(74, 67, 52, 0.28)");
  root.style.setProperty("--alerts-export-menu-text", GOLD_THEME_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--topbar-profile-menu-bg", GOLD_THEME_LIGHT_PANEL_BG);
  root.style.setProperty("--topbar-profile-menu-text", GOLD_THEME_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--topbar-profile-menu-border", "rgba(74, 67, 52, 0.28)");
  root.style.setProperty("--topbar-profile-menu-hover-bg", GOLD_THEME_LIGHT_SECTION_BG);
  root.style.setProperty("--topbar-profile-menu-icon", "rgba(44, 40, 32, 0.72)");
  root.style.setProperty("--alerts-menu-bg", GOLD_THEME_LIGHT_PANEL_BG);
  root.style.setProperty("--alerts-menu-hover", GOLD_THEME_LIGHT_SECTION_BG);
  root.style.setProperty("--alerts-menu-selected", "rgba(74, 67, 52, 0.18)");
  root.style.setProperty("--alerts-menu-text", GOLD_THEME_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--alerts-menu-field-bg", "#ffffff");
  root.style.setProperty("--dashboard-alert-filter-bg", "#ffffff");
  root.style.setProperty("--dashboard-alert-filter-menu-bg", GOLD_THEME_LIGHT_PANEL_BG);
  root.style.setProperty("--dashboard-alert-filter-border", "rgba(74, 67, 52, 0.28)");
  root.style.setProperty("--dashboard-alert-filter-checked-bg", GOLD_THEME_LIGHT_SECTION_BG);
  root.style.setProperty("--dashboard-alert-filter-text", GOLD_THEME_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--dashboard-control-accent", GOLD_THEME_BUTTON_SOLID);
  root.style.setProperty("--dashboard-select-option-bg", GOLD_THEME_LIGHT_PANEL_BG);
  root.style.setProperty("--dashboard-select-option-text", GOLD_THEME_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--dashboard-select-option-selected-bg", GOLD_THEME_BUTTON_SOLID);
  root.style.setProperty("--dashboard-select-option-selected-text", "#ffffff");
  root.style.setProperty("--dashboard-select-menu-hover", "rgba(74, 67, 52, 0.12)");
  root.style.setProperty("--dashboard-select-menu-selected-hover", "rgba(74, 67, 52, 0.28)");
  root.style.setProperty("--dashboard-select-field-bg", "#ffffff");
  root.style.setProperty("--dashboard-select-field-border", "rgba(74, 67, 52, 0.28)");
  root.style.setProperty("--dashboard-alert-filter-hover-bg", "rgba(74, 67, 52, 0.08)");
  root.style.setProperty("--dashboard-area-tree-hover-bg", GOLD_THEME_LIGHT_SECTION_BG);
  root.style.setProperty("--alerts-table-row-bg", "#ffffff");
  root.style.setProperty("--alerts-table-row-alt-bg", GOLD_THEME_LIGHT_PANEL_BG);
  root.style.setProperty("--alerts-table-text", GOLD_THEME_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--alerts-table-border", "rgba(74, 67, 52, 0.28)");
  root.style.setProperty("--alerts-pagination-bg", GOLD_THEME_LIGHT_SECTION_BG);
  root.style.setProperty("--alerts-pagination-text", GOLD_THEME_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--alerts-pagination-border", "rgba(74, 67, 52, 0.28)");
  root.style.setProperty("--alerts-pagination-item-bg", "#ffffff");
  root.style.setProperty("--alerts-pagination-item-text", GOLD_THEME_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--alerts-pagination-item-hover-bg", GOLD_THEME_LIGHT_SECTION_BG);
  root.style.setProperty("--alerts-pagination-item-selected-bg", GOLD_THEME_BUTTON_SOLID);
  root.style.setProperty("--alerts-pagination-item-selected-text", "#ffffff");
  root.style.setProperty("--alerts-pagination-item-disabled-text", "rgba(44, 40, 32, 0.35)");
  root.style.setProperty("--auth-page-background-image", "none");
  root.style.setProperty("--auth-card-bg", GOLD_THEME_LIGHT_PANEL_BG);
  root.style.setProperty("--auth-card-text", GOLD_THEME_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--auth-card-subtext", "rgba(44, 40, 32, 0.72)");
  root.style.setProperty("--auth-card-caption", "rgba(44, 40, 32, 0.65)");
  root.style.setProperty("--auth-card-border", "rgba(74, 67, 52, 0.28)");
  root.style.setProperty("--auth-card-shadow", "0 8px 24px rgba(74, 67, 52, 0.14)");
  root.style.setProperty("--auth-field-bg", "#ffffff");
  root.style.setProperty("--auth-field-text", GOLD_THEME_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--auth-field-border", "rgba(74, 67, 52, 0.28)");
  root.style.setProperty("--auth-field-border-focus", GOLD_THEME_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--auth-button-bg", buttonStyle.solid);
  root.style.setProperty("--auth-button-text", "#ffffff");
  root.style.setProperty("--auth-button-hover-bg", "#3D3629");
  root.style.setProperty("--settings-theme-pill-active-bg", GOLD_THEME_SURFACE_GRADIENT);
  root.style.setProperty("--settings-theme-pill-active-text", "#ffffff");
  root.style.setProperty("--settings-theme-action-button-bg", GOLD_THEME_SURFACE_GRADIENT);
  root.style.setProperty("--settings-theme-action-button-text", "#ffffff");
  root.style.setProperty("--auth-icon-color", GOLD_THEME_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--auth-logo-filter", "brightness(0) saturate(100%)");
  root.style.setProperty("--floor-tool-field-bg", "#ffffff");
  root.style.setProperty("--floor-tool-field-text", GOLD_THEME_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--floor-tool-field-border", "rgba(74, 67, 52, 0.28)");

  document.documentElement.classList.remove("theme-3-page", "theme-4-page");
  document.documentElement.classList.add("gold-theme");
  root.style.removeProperty("--topbar-navbar-background");
  root.style.setProperty("--topbar-nav-pill-bg", "rgba(250, 240, 212, 0.95)");
  root.style.setProperty("--topbar-nav-active-text", GOLD_THEME_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--topbar-nav-inactive-text", "#ffffff");
}

/** @returns {string[]} variable names set by applyGoldPreset */
export function getGoldPresetVariableNames() {
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
    "alerts-pagination-bg",
    "alerts-pagination-border",
    "alerts-pagination-item-bg",
    "alerts-pagination-item-disabled-text",
    "alerts-pagination-item-hover-bg",
    "alerts-pagination-item-selected-bg",
    "alerts-pagination-item-selected-text",
    "alerts-pagination-item-text",
    "alerts-pagination-text",
    "alerts-panel-bg",
    "alerts-panel-muted-text",
    "alerts-panel-text",
    "alerts-table-border",
    "alerts-table-container-bg",
    "alerts-table-head-bg",
    "alerts-table-head-text",
    "alerts-table-row-alt-bg",
    "alerts-table-row-bg",
    "alerts-table-text",
    "app-page-background",
    "app-page-muted-text",
    "app-page-text",
    "area-groups-border",
    "area-groups-chip-bg",
    "area-groups-inner-bg",
    "area-groups-panel-bg",
    "area-picker-light-dialog-bg",
    "area-picker-light-dialog-title-color",
    "auth-button-bg",
    "auth-button-hover-bg",
    "auth-button-text",
    "auth-card-bg",
    "auth-card-border",
    "auth-card-caption",
    "auth-card-shadow",
    "auth-card-subtext",
    "auth-card-text",
    "auth-field-bg",
    "auth-field-border",
    "auth-field-border-focus",
    "auth-field-text",
    "auth-icon-color",
    "auth-logo-filter",
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
    "floor-tool-field-bg",
    "floor-tool-field-border",
    "floor-tool-field-text",
    "footer-background",
    "footer-background-color",
    "footer-logo-filter",
    "footer-text-color",
    "heatmap-dialog-paper-bg",
    "heatmap-dialog-section-bg",
    "heatmap-dialog-zone-card-bg",
    "heatmap-legends-nav-bg",
    "heatmap-legends-nav-text",
    "heatmap-rename-dialog-bg",
    "heatmap-rename-dialog-border",
    "heatmap-rename-dialog-cancel-border",
    "heatmap-rename-dialog-cancel-color",
    "heatmap-rename-dialog-field-bg",
    "heatmap-rename-dialog-field-border",
    "heatmap-rename-dialog-field-text",
    "heatmap-rename-dialog-label-bg",
    "heatmap-rename-dialog-label-color",
    "heatmap-rename-dialog-shadow",
    "heatmap-rename-dialog-title-color",
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
    "help-download-available-bg",
    "help-download-available-border",
    "help-download-available-hover-bg",
    "help-download-available-text",
    "help-download-unavailable-bg",
    "help-download-unavailable-border",
    "help-download-unavailable-text",
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
    "schedule-modal-item-selected-text",
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
    "settings-color-swatch-selected-stroke",
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

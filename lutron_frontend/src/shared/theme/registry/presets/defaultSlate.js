import {
  THEME_3_LIGHT_SURFACE_TEXT,
  THEME_4_BUTTON_SOLID,
  THEME_4_TAB_PILL_GRADIENT,
} from "../../../../variants/advanced/config/themeConstants";
import { onContentColors } from "../../../../variants/advanced/utils/themeOnSurface";
import { applyHeatmapTabPillTokens } from "../../utils/applyHeatmapTabPillTokens";
import { resolveWordmarkLogoFilter } from "../../utils/resolveWordmarkLogoFilter";

/**
 * Default slate preset CSS variables (non-gold, non-custom shared surface).
 * @param {HTMLElement} root
 * @param {{
 *   stage?: 'navigation-fixed-fallback' | 'navigation-none' | 'surface' | 'heatmap',
 *   fixedGradientPageTheme?: { id?: string } | null,
 *   isTheme4Page?: boolean,
 *   customImageUrl?: string | null,
 * }} context
 */
export function applyDefaultSlatePreset(root, context = {}) {
  const {
    stage = "surface",
    fixedGradientPageTheme = null,
    isTheme4Page = false,
    customImageUrl = null,
  } = context;

  if (stage === "navigation-fixed-fallback") {
    root.style.setProperty("--topbar-profile-menu-bg", "#ffffff");
    root.style.setProperty("--topbar-profile-menu-text", "#1c2330");
    root.style.setProperty("--topbar-profile-menu-border", "#C5CDD8");
    root.style.setProperty("--topbar-profile-menu-hover-bg", "#d6dde8");
    root.style.setProperty("--topbar-profile-menu-icon", "rgba(28, 35, 48, 0.72)");
    root.style.removeProperty("--topbar-navbar-background");
    root.style.setProperty("--topbar-nav-pill-bg", "rgba(214, 221, 232, 0.95)");
    root.style.setProperty("--topbar-nav-active-text", "#1a2a42");
    root.style.setProperty("--topbar-nav-inactive-text", "#ffffff");
    return;
  }

  if (stage === "navigation-none") {
    root.style.removeProperty("--app-page-background");
    root.style.removeProperty("--topbar-navbar-background");
    root.style.setProperty("--topbar-nav-pill-bg", "rgba(214, 221, 232, 0.95)");
    root.style.setProperty("--topbar-nav-active-text", "#1a2a42");
    root.style.setProperty("--topbar-nav-inactive-text", "#ffffff");
    root.style.setProperty("--topbar-profile-menu-bg", "#ffffff");
    root.style.setProperty("--topbar-profile-menu-text", "#1c2330");
    root.style.setProperty("--topbar-profile-menu-border", "#C5CDD8");
    root.style.setProperty("--topbar-profile-menu-hover-bg", "#d6dde8");
    return;
  }

  if (stage === "heatmap") {
    root.style.setProperty("--heatmap-sidebar-panel-bg", "#d6dde8");
    root.style.setProperty("--heatmap-sidebar-panel-border", "#b8c5d6");
    root.style.setProperty("--heatmap-sidebar-section-bg", "#4a586c");
    root.style.setProperty("--heatmap-sidebar-panel-label", "#1a2a42");
    root.style.setProperty("--heatmap-sidebar-section-text", "#ffffff");
    root.style.setProperty("--heatmap-sidebar-section-label-bg", "rgba(0, 0, 0, 0.12)");
    applyHeatmapTabPillTokens(root, {
      pillBg: "#3d4a5c",
      activeText: "#3d4a5c",
      contrastSolid: "#3d4a5c",
    });
    root.style.setProperty("--home-tab-active-color", "#3d4a5c");
    root.style.setProperty("--home-field-surface-bg", "#D6DDE8");
    root.style.setProperty("--home-field-border", "#C5CDD8");
    root.style.setProperty("--heatmap-dialog-paper-bg", "#d6dde8");
    root.style.setProperty("--heatmap-dialog-section-bg", "#3d4a5c");
    root.style.setProperty(
      "--heatmap-rename-dialog-bg",
      "linear-gradient(160deg, #0a1428 0%, #152238 45%, #1a2d4a 100%)"
    );
    root.style.setProperty("--heatmap-legends-nav-bg", "#ffffff");
    root.style.setProperty("--heatmap-legends-nav-text", "#000000");
    root.style.setProperty("--heatmap-select-menu-bg", "#d6dde8");
    root.style.setProperty("--heatmap-select-menu-hover", "rgba(61, 74, 92, 0.12)");
    root.style.setProperty("--heatmap-select-menu-selected", "rgba(61, 74, 92, 0.22)");
    root.style.setProperty("--heatmap-select-menu-selected-hover", "rgba(61, 74, 92, 0.28)");
    return;
  }

  const whitePanelOn = onContentColors("#ffffff");
  const creamSectionOn = onContentColors("#d6dde8");

  root.style.setProperty("--area-picker-light-dialog-bg", "#d6dde8");
  root.style.setProperty("--area-picker-light-dialog-title-color", whitePanelOn.primary);
  root.style.setProperty("--area-picker-light-dialog-field-text", whitePanelOn.primary);
  root.style.setProperty("--activity-report-table-head-bg", "#d6dde8");
  root.style.setProperty("--activity-report-table-container-bg", "#ffffff");
  root.style.setProperty("--activity-report-table-row-bg", "#ffffff");
  root.style.setProperty("--activity-report-table-row-alt-bg", "#f5f5f5");
  root.style.setProperty("--activity-report-table-text", "#000000");
  root.style.setProperty("--activity-report-table-head-text", "#000000");
  if (!fixedGradientPageTheme) {
    root.style.removeProperty("--footer-background-color");
    if (customImageUrl) {
      const pageBgWithImage =
        `linear-gradient(180deg, rgba(111, 128, 157, 0.82) 0%, rgba(215, 217, 228, 0.94) 100%), url(${customImageUrl})`;
      root.style.setProperty("--app-page-background", pageBgWithImage);
      root.style.setProperty("--footer-background", pageBgWithImage);
    } else {
      root.style.setProperty(
        "--footer-background",
        "linear-gradient(180deg, rgba(111, 128, 157, 0.45) 0%, #d7d9e4 100%)"
      );
      root.style.removeProperty("--app-page-background");
    }
    root.style.removeProperty("--footer-background-image");
  }
  root.style.setProperty("--footer-text-color", "#1a1a1a");
  root.style.setProperty("--footer-logo-filter", resolveWordmarkLogoFilter("#d7d9e4"));
  root.style.setProperty("--schedule-grid-bg", "#3d4a5c");
  root.style.setProperty("--schedule-panel-bg", "#d6dde8");
  root.style.setProperty("--schedule-panel-border", "#b8c5d6");
  root.style.setProperty("--schedule-section-bg", "#4a586c");
  root.style.setProperty("--schedule-section-text", "#ffffff");
      root.style.setProperty("--schedule-panel-label", "#1a2a42");
      root.style.setProperty("--schedule-page-heading-text", THEME_3_LIGHT_SURFACE_TEXT);
  root.style.setProperty("--schedule-modal-bg", "#d6dde8");
  root.style.setProperty("--schedule-modal-title-color", "#000000");
  root.style.setProperty("--schedule-today-bg", "#1E75BB");
  root.style.setProperty("--schedule-today-text", "#ffffff");
  root.style.setProperty(
    "--schedule-event-active-bg",
    "linear-gradient(90deg, #1E75BB 0%, #3A8DFF 100%)"
  );
  root.style.setProperty("--schedule-event-active-text", "#ffffff");
  root.style.setProperty("--schedule-status-text", "#1E75BB");
  root.style.removeProperty("--schedule-select-bg");
  root.style.removeProperty("--schedule-select-text");
  root.style.removeProperty("--schedule-select-menu-bg");
  root.style.removeProperty("--schedule-select-menu-text");
  root.style.removeProperty("--schedule-select-menu-hover");
  root.style.removeProperty("--schedule-select-menu-selected-hover");
  root.style.setProperty("--schedule-modal-item-selected-bg", "#3d4a5c");
  root.style.setProperty("--schedule-modal-item-selected-text", "#ffffff");
  root.style.removeProperty("--schedule-modal-body-text");
  root.style.removeProperty("--schedule-modal-muted-text");
  root.style.removeProperty("--schedule-modal-section-label-color");
  root.style.removeProperty("--settings-color-swatch-selected-stroke");
  root.style.removeProperty("--help-download-available-bg");
  root.style.removeProperty("--help-download-available-hover-bg");
  root.style.removeProperty("--help-download-available-text");
  root.style.removeProperty("--help-download-available-border");
  root.style.removeProperty("--help-download-unavailable-bg");
  root.style.removeProperty("--help-download-unavailable-text");
  root.style.removeProperty("--help-download-unavailable-border");
  root.style.setProperty("--settings-panel-inner-bg", "#ffffff");
  root.style.setProperty("--settings-theme-card-bg", "#ffffff");
  root.style.setProperty("--settings-panel-outer-bg", "#ffffff");
  if (fixedGradientPageTheme?.id !== "theme3") {
    root.style.setProperty("--settings-panel-border", "transparent");
  }
  root.style.setProperty("--settings-sidebar-text", "#ffffff");
  root.style.setProperty("--settings-sidebar-title-color", "");
  if (fixedGradientPageTheme?.id !== "theme3") {
    root.style.setProperty("--settings-sidebar-active-bg", "#3d4a5c");
    root.style.setProperty("--settings-panel-text", whitePanelOn.primary);
    root.style.setProperty("--settings-panel-muted-text", whitePanelOn.secondary);
    root.style.setProperty("--settings-panel-button-text", creamSectionOn.primary);
    root.style.setProperty("--settings-panel-button-bg", "#d6dde8");
  }
  root.style.setProperty("--users-input-text", whitePanelOn.primary);
  root.style.setProperty("--users-input-label-text", whitePanelOn.secondary);
  root.style.setProperty("--users-input-placeholder-text", whitePanelOn.disabled);
  root.style.setProperty("--users-readonly-field-text", whitePanelOn.primary);
  root.style.setProperty("--dashboard-select-field-text", whitePanelOn.primary);
  root.style.setProperty("--dashboard-select-option-text", whitePanelOn.primary);
  root.style.setProperty("--settings-sidebar-active-text", "#ffffff");
  root.style.setProperty("--settings-sidebar-hover-bg", "rgba(61, 74, 92, 0.18)");
  root.style.setProperty("--users-table-container-bg", "#d6dde8");
  root.style.setProperty("--users-table-head-bg", "#d6dde8");
  root.style.setProperty("--users-table-row-bg", "#ffffff");
  root.style.setProperty("--users-modal-bg", "#d6dde8");
  root.style.setProperty("--users-modal-inner-bg", "#ffffff");
  root.style.setProperty("--users-modal-info-bg", "#D6DDE8");
  root.style.setProperty("--users-input-bg", "#ffffff");
  root.style.setProperty("--users-select-menu-bg", "#ffffff");
  root.style.setProperty("--users-select-menu-hover", "#D6DDE8");
  root.style.setProperty("--users-select-menu-checkbox-color", whitePanelOn.secondary);
  root.style.setProperty("--users-select-menu-checkbox-checked-color", "#3d4a5c");
  root.style.setProperty("--users-chip-bg", "#D6DDE8");
  root.style.setProperty("--users-confirm-dialog-bg", "#ffffff");
  root.style.setProperty("--users-border", "#C5CDD8");
  root.style.setProperty("--area-groups-panel-bg", "#d6dde8");
  root.style.setProperty("--area-groups-inner-bg", "#ffffff");
  root.style.setProperty("--area-groups-chip-bg", "#D6DDE8");
  root.style.setProperty("--area-groups-border", "#C5CDD8");
  root.style.setProperty("--area-group-on-surface-text", whitePanelOn.primary);
  root.style.setProperty("--area-group-inner-text", whitePanelOn.primary);
  root.style.setProperty("--settings-form-section-bg", "#3d4a5c");
  root.style.setProperty("--settings-form-control-bg", "#3d4a5c");
  root.style.setProperty("--settings-form-control-text", "#ffffff");
  root.style.setProperty("--settings-form-label-color", "#ffffff");
  root.style.setProperty("--alerts-panel-bg", "var(--dashboard-card-background)");
  root.style.setProperty("--alerts-panel-text", "#ffffff");
  root.style.setProperty("--alerts-panel-muted-text", "rgba(255, 255, 255, 0.9)");
  if (isTheme4Page) {
    root.style.setProperty("--alerts-table-container-bg", "#f0ebe3");
    root.style.setProperty("--alerts-table-head-bg", THEME_4_TAB_PILL_GRADIENT);
    root.style.setProperty("--alerts-table-head-text", "#ffffff");
    root.style.setProperty("--alerts-table-row-bg", "#ffffff");
    root.style.setProperty("--alerts-table-row-alt-bg", "#faf6ef");
    root.style.setProperty("--alerts-table-text", "#2c2820");
    root.style.setProperty("--alerts-table-border", "rgba(64, 58, 49, 0.28)");
    root.style.setProperty("--alerts-pagination-bg", THEME_4_TAB_PILL_GRADIENT);
    root.style.setProperty("--alerts-pagination-text", "#ffffff");
    root.style.setProperty("--alerts-pagination-border", "rgba(255, 255, 255, 0.15)");
    root.style.setProperty("--alerts-pagination-item-bg", "rgba(255, 255, 255, 0.2)");
    root.style.setProperty("--alerts-pagination-item-text", "#ffffff");
    root.style.setProperty("--alerts-pagination-item-hover-bg", "rgba(255, 255, 255, 0.32)");
    root.style.setProperty("--alerts-pagination-item-selected-bg", THEME_4_BUTTON_SOLID);
    root.style.setProperty("--alerts-pagination-item-selected-text", "#ffffff");
    root.style.setProperty("--alerts-pagination-item-disabled-text", "rgba(255, 255, 255, 0.35)");
  } else {
    root.style.setProperty("--alerts-table-container-bg", "#d6dde8");
    root.style.setProperty("--alerts-table-head-bg", "#667285");
    root.style.setProperty("--alerts-table-head-text", "#ffffff");
    root.style.setProperty("--alerts-table-row-bg", "#ffffff");
    root.style.setProperty("--alerts-table-row-alt-bg", "#ffffff");
    root.style.setProperty("--alerts-table-text", "#111111");
    root.style.setProperty("--alerts-table-border", "#c5cdd8");
    root.style.setProperty(
      "--alerts-pagination-bg",
      "linear-gradient(135deg, rgba(58, 69, 85, 0.78) 0%, rgba(74, 86, 103, 0.70) 100%)"
    );
    root.style.setProperty("--alerts-pagination-text", "#ffffff");
    root.style.setProperty("--alerts-pagination-border", "rgba(255, 255, 255, 0.1)");
    root.style.setProperty("--alerts-pagination-item-bg", "rgba(255, 255, 255, 0.14)");
    root.style.setProperty("--alerts-pagination-item-text", "#ffffff");
    root.style.setProperty("--alerts-pagination-item-hover-bg", "rgba(255, 255, 255, 0.24)");
    root.style.setProperty("--alerts-pagination-item-selected-bg", "#1c2330");
    root.style.setProperty("--alerts-pagination-item-selected-text", "#ffffff");
    root.style.setProperty("--alerts-pagination-item-disabled-text", "rgba(255, 255, 255, 0.35)");
  }
  root.style.setProperty(
    "--auth-page-background-image",
    customImageUrl ? `url(${customImageUrl})` : "none"
  );
  root.style.setProperty("--auth-card-bg", "linear-gradient(135deg, #3D4A5C 0%, #4A586C 100%)");
  root.style.setProperty("--auth-card-text", "#ffffff");
  root.style.setProperty("--auth-card-subtext", "rgba(214, 221, 232, 0.95)");
  root.style.setProperty("--auth-card-caption", "#D6DDE8");
  root.style.setProperty("--auth-card-border", "#C5CDD8");
  root.style.setProperty("--auth-card-shadow", "0 8px 32px rgba(0, 0, 0, 0.18)");
  root.style.setProperty("--auth-field-bg", "#ffffff");
  root.style.setProperty("--auth-field-text", "#1c2330");
  root.style.setProperty("--auth-field-border", "#C5CDD8");
  root.style.setProperty("--auth-field-border-focus", "#3D4A5C");
  root.style.setProperty("--auth-button-bg", "#1c2330");
  root.style.setProperty("--auth-button-text", "#ffffff");
  root.style.setProperty("--auth-button-hover-bg", "#3D4A5C");
  root.style.setProperty("--auth-icon-color", "#D6DDE8");
  root.style.setProperty("--auth-logo-filter", "none");
  root.style.setProperty("--floor-tool-field-bg", "#ffffff");
  root.style.setProperty("--floor-tool-field-text", "#1c2330");
  root.style.setProperty("--floor-tool-field-border", "#C5CDD8");
}

/** @returns {string[]} */
export function getDefaultSlatePresetVariableNames() {
  return [
    "activity-report-table-container-bg",
    "activity-report-table-head-bg",
    "activity-report-table-head-text",
    "activity-report-table-row-alt-bg",
    "activity-report-table-row-bg",
    "activity-report-table-text",
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
    "area-groups-border",
    "area-groups-chip-bg",
    "area-groups-inner-bg",
    "area-groups-panel-bg",
    "area-picker-light-dialog-bg",
    "area-picker-light-dialog-field-text",
    "area-picker-light-dialog-title-color",
    "dashboard-select-field-text",
    "dashboard-select-option-text",
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
    "floor-tool-field-bg",
    "floor-tool-field-border",
    "floor-tool-field-text",
    "footer-background",
    "footer-logo-filter",
    "footer-text-color",
    "heatmap-dialog-paper-bg",
    "heatmap-dialog-section-bg",
    "heatmap-legends-nav-bg",
    "heatmap-legends-nav-text",
    "heatmap-rename-dialog-bg",
    "heatmap-select-menu-bg",
    "heatmap-select-menu-hover",
    "heatmap-select-menu-selected",
    "heatmap-select-menu-selected-hover",
    "heatmap-sidebar-panel-bg",
    "heatmap-sidebar-panel-border",
    "heatmap-sidebar-panel-label",
    "heatmap-sidebar-section-bg",
    "heatmap-sidebar-section-label-bg",
    "heatmap-sidebar-section-text",
    "heatmap-tab-pill-bg",
    "heatmap-tab-indicator-bg",
    "heatmap-tab-active-text",
    "heatmap-tab-inactive-text",
    "home-field-border",
    "home-field-surface-bg",
    "home-tab-active-color",
    "schedule-event-active-bg",
    "schedule-event-active-text",
    "schedule-grid-bg",
    "schedule-modal-bg",
    "schedule-modal-item-selected-bg",
    "schedule-modal-item-selected-text",
    "schedule-modal-title-color",
    "schedule-page-heading-text",
    "schedule-panel-bg",
    "schedule-panel-border",
    "schedule-panel-label",
    "schedule-section-bg",
    "schedule-section-text",
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
    "settings-theme-card-bg",
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
    "users-readonly-field-text",
    "users-input-bg",
    "users-input-label-text",
    "users-input-placeholder-text",
    "users-input-text",
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

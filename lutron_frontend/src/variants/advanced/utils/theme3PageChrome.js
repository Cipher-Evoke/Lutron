import {
  THEME_3_BUTTON_SOLID,
  THEME_3_LIGHT_PANEL_BG,
  THEME_3_LIGHT_SECTION_BG,
  THEME_3_LIGHT_SURFACE_TEXT,
  THEME_3_NAVBAR_GRADIENT,
  THEME_3_TAB_PILL_GRADIENT,
} from '../config/themeConstants';
import { applySettingsSidebarTypographyVars } from './settingsSidebarTabStyles';
import { applyHeatmapTabPillTokens } from '../../../shared/theme/utils/applyHeatmapTabPillTokens';
import { resolveWordmarkLogoFilter } from '../../../shared/theme/utils/resolveWordmarkLogoFilter';

/** Theme 3 (Blue) page chrome — overrides generic else-branch vars in ThemeContext. */
export function applyTheme3PageChrome(root) {
  root.style.setProperty('--topbar-navbar-background', THEME_3_NAVBAR_GRADIENT);
  root.style.setProperty('--topbar-nav-pill-bg', 'rgba(244, 246, 249, 0.95)');
  root.style.setProperty('--topbar-nav-active-text', THEME_3_LIGHT_SURFACE_TEXT);
  root.style.setProperty('--topbar-nav-inactive-text', '#ffffff');
  root.style.setProperty('--footer-text-color', THEME_3_LIGHT_SURFACE_TEXT);
  root.style.setProperty('--footer-logo-filter', resolveWordmarkLogoFilter(THEME_3_LIGHT_PANEL_BG));

  root.style.setProperty('--settings-panel-inner-bg', THEME_3_LIGHT_PANEL_BG);
  root.style.setProperty('--settings-theme-card-bg', THEME_3_LIGHT_PANEL_BG);
  root.style.setProperty('--settings-theme-dialog-bg', THEME_3_LIGHT_PANEL_BG);
  root.style.setProperty('--settings-panel-outer-bg', THEME_3_LIGHT_SECTION_BG);
  root.style.setProperty('--settings-panel-border', '#C5CDD8');
  root.style.setProperty('--settings-sidebar-text', THEME_3_LIGHT_SURFACE_TEXT);
  root.style.setProperty('--settings-sidebar-title-color', THEME_3_LIGHT_SURFACE_TEXT);
  root.style.setProperty('--settings-sidebar-active-bg', THEME_3_TAB_PILL_GRADIENT);
  root.style.setProperty('--settings-sidebar-active-text', '#ffffff');
  root.style.setProperty('--settings-sidebar-hover-bg', 'rgba(61, 74, 92, 0.12)');
  applySettingsSidebarTypographyVars(root);
  root.style.setProperty('--settings-panel-text', THEME_3_LIGHT_SURFACE_TEXT);
  root.style.setProperty('--settings-panel-muted-text', 'rgba(26, 42, 66, 0.72)');
  root.style.setProperty('--settings-panel-button-text', THEME_3_LIGHT_SURFACE_TEXT);
  root.style.setProperty('--settings-panel-button-bg', THEME_3_LIGHT_SECTION_BG);

  root.style.setProperty('--users-table-container-bg', THEME_3_LIGHT_SECTION_BG);
  root.style.setProperty('--users-table-head-bg', THEME_3_LIGHT_SECTION_BG);
  root.style.setProperty('--users-table-row-bg', '#ffffff');
  root.style.setProperty('--users-modal-bg', THEME_3_LIGHT_PANEL_BG);
  root.style.setProperty('--users-modal-inner-bg', '#ffffff');
  root.style.setProperty('--users-modal-info-bg', THEME_3_LIGHT_SECTION_BG);
  root.style.setProperty('--users-input-bg', '#ffffff');
  root.style.setProperty('--users-select-menu-bg', '#ffffff');
  root.style.setProperty('--users-select-menu-hover', THEME_3_LIGHT_SECTION_BG);
  root.style.setProperty('--users-select-menu-checkbox-color', 'rgba(26, 42, 66, 0.55)');
  root.style.setProperty('--users-select-menu-checkbox-checked-color', THEME_3_BUTTON_SOLID);
  root.style.setProperty('--users-chip-bg', THEME_3_LIGHT_SECTION_BG);
  root.style.setProperty('--users-confirm-dialog-bg', THEME_3_LIGHT_PANEL_BG);
  root.style.setProperty('--users-border', '#C5CDD8');

  root.style.setProperty('--area-groups-panel-bg', THEME_3_LIGHT_PANEL_BG);
  root.style.setProperty('--area-groups-inner-bg', '#ffffff');
  root.style.setProperty('--area-groups-chip-bg', THEME_3_LIGHT_SECTION_BG);
  root.style.setProperty('--area-groups-border', '#C5CDD8');
  root.style.setProperty('--area-group-on-surface-text', THEME_3_LIGHT_SURFACE_TEXT);
  root.style.setProperty('--area-group-inner-text', THEME_3_LIGHT_SURFACE_TEXT);
  root.style.setProperty('--users-input-text', THEME_3_LIGHT_SURFACE_TEXT);

  root.style.setProperty('--settings-form-section-bg', THEME_3_LIGHT_SECTION_BG);
  root.style.setProperty('--settings-form-control-bg', '#ffffff');
  root.style.setProperty('--settings-form-control-text', THEME_3_LIGHT_SURFACE_TEXT);
  root.style.setProperty('--settings-form-label-color', THEME_3_LIGHT_SURFACE_TEXT);

  root.style.setProperty('--alerts-panel-bg', THEME_3_LIGHT_PANEL_BG);
  root.style.setProperty('--alerts-panel-text', THEME_3_LIGHT_SURFACE_TEXT);
  root.style.setProperty('--alerts-panel-muted-text', 'rgba(26, 42, 66, 0.72)');
  root.style.setProperty('--alerts-table-container-bg', THEME_3_LIGHT_SECTION_BG);
  root.style.setProperty('--alerts-table-head-bg', THEME_3_TAB_PILL_GRADIENT);
  root.style.setProperty('--alerts-table-head-text', '#ffffff');
  root.style.setProperty('--alerts-table-row-bg', '#ffffff');
  root.style.setProperty('--alerts-table-row-alt-bg', THEME_3_LIGHT_PANEL_BG);
  root.style.setProperty('--alerts-table-text', THEME_3_LIGHT_SURFACE_TEXT);
  root.style.setProperty('--alerts-table-border', '#C5CDD8');
  root.style.setProperty('--alerts-export-menu-bg', THEME_3_LIGHT_PANEL_BG);
  root.style.setProperty('--alerts-export-menu-border', '#C5CDD8');
  root.style.setProperty('--alerts-export-menu-text', THEME_3_LIGHT_SURFACE_TEXT);
  root.style.setProperty('--topbar-profile-menu-bg', THEME_3_LIGHT_PANEL_BG);
  root.style.setProperty('--topbar-profile-menu-text', THEME_3_LIGHT_SURFACE_TEXT);
  root.style.setProperty('--topbar-profile-menu-border', '#C5CDD8');
  root.style.setProperty('--topbar-profile-menu-hover-bg', THEME_3_LIGHT_SECTION_BG);
  root.style.setProperty('--topbar-profile-menu-icon', 'rgba(26, 42, 66, 0.72)');
  root.style.setProperty('--alerts-menu-bg', THEME_3_LIGHT_PANEL_BG);
  root.style.setProperty('--alerts-menu-hover', THEME_3_LIGHT_SECTION_BG);
  root.style.setProperty('--alerts-menu-selected', 'rgba(61, 74, 92, 0.18)');
  root.style.setProperty('--alerts-menu-text', THEME_3_LIGHT_SURFACE_TEXT);
  root.style.setProperty('--alerts-pagination-bg', THEME_3_LIGHT_SECTION_BG);
  root.style.setProperty('--alerts-pagination-text', THEME_3_LIGHT_SURFACE_TEXT);
  root.style.setProperty('--alerts-pagination-border', '#C5CDD8');
  root.style.setProperty('--alerts-pagination-item-bg', '#ffffff');
  root.style.setProperty('--alerts-pagination-item-text', THEME_3_LIGHT_SURFACE_TEXT);
  root.style.setProperty('--alerts-pagination-item-hover-bg', THEME_3_LIGHT_SECTION_BG);
  root.style.setProperty('--alerts-pagination-item-selected-bg', THEME_3_BUTTON_SOLID);
  root.style.setProperty('--alerts-pagination-item-selected-text', '#ffffff');
  root.style.setProperty('--alerts-pagination-item-disabled-text', 'rgba(26, 42, 66, 0.35)');

  root.style.setProperty('--dashboard-alert-filter-bg', '#ffffff');
  root.style.setProperty('--dashboard-alert-filter-menu-bg', THEME_3_LIGHT_PANEL_BG);
  root.style.setProperty('--dashboard-alert-filter-border', '#C5CDD8');
  root.style.setProperty('--dashboard-alert-filter-checked-bg', THEME_3_LIGHT_SECTION_BG);
  root.style.setProperty('--dashboard-alert-filter-text', THEME_3_LIGHT_SURFACE_TEXT);
  root.style.setProperty('--dashboard-alert-filter-hover-bg', 'rgba(61, 74, 92, 0.08)');
  root.style.setProperty('--dashboard-control-accent', THEME_3_BUTTON_SOLID);
  root.style.setProperty('--dashboard-select-option-bg', THEME_3_LIGHT_PANEL_BG);
  root.style.setProperty('--dashboard-select-option-text', THEME_3_LIGHT_SURFACE_TEXT);
  root.style.setProperty('--dashboard-select-option-selected-bg', THEME_3_BUTTON_SOLID);
  root.style.setProperty('--dashboard-select-option-selected-text', '#ffffff');
  root.style.setProperty('--dashboard-select-menu-hover', 'rgba(61, 74, 92, 0.12)');
  root.style.setProperty('--dashboard-select-menu-selected-hover', 'rgba(61, 74, 92, 0.28)');
  root.style.setProperty('--dashboard-select-field-bg', '#ffffff');
  root.style.setProperty('--dashboard-select-field-border', '#C5CDD8');
  root.style.setProperty('--dashboard-area-tree-hover-bg', THEME_3_LIGHT_SECTION_BG);

  root.style.setProperty('--activity-report-page-text', THEME_3_LIGHT_SURFACE_TEXT);
  root.style.setProperty('--activity-report-page-muted-text', 'rgba(26, 42, 66, 0.72)');
  root.style.setProperty('--activity-report-pagination-text', THEME_3_LIGHT_SURFACE_TEXT);
  root.style.setProperty('--activity-report-table-head-bg', THEME_3_LIGHT_SECTION_BG);
  root.style.setProperty('--activity-report-table-container-bg', '#ffffff');
  root.style.setProperty('--activity-report-table-row-bg', '#ffffff');
  root.style.setProperty('--activity-report-table-row-alt-bg', THEME_3_LIGHT_PANEL_BG);
  root.style.setProperty('--activity-report-table-text', THEME_3_LIGHT_SURFACE_TEXT);
  root.style.setProperty('--activity-report-table-head-text', THEME_3_LIGHT_SURFACE_TEXT);

  root.style.setProperty('--area-picker-light-dialog-bg', THEME_3_LIGHT_PANEL_BG);
  root.style.setProperty('--area-picker-light-dialog-title-color', THEME_3_LIGHT_SURFACE_TEXT);
  root.style.setProperty('--area-picker-light-dialog-field-text', THEME_3_LIGHT_SURFACE_TEXT);

  root.style.setProperty('--schedule-panel-bg', THEME_3_LIGHT_PANEL_BG);
  root.style.setProperty('--schedule-panel-border', '#C5CDD8');
  root.style.setProperty('--schedule-section-bg', THEME_3_TAB_PILL_GRADIENT);
  root.style.setProperty('--schedule-section-text', '#ffffff');
  root.style.setProperty('--schedule-panel-label', THEME_3_LIGHT_SURFACE_TEXT);
  root.style.setProperty('--schedule-page-heading-text', THEME_3_LIGHT_SURFACE_TEXT);
  root.style.setProperty('--schedule-modal-bg', THEME_3_LIGHT_PANEL_BG);
  root.style.setProperty('--schedule-modal-title-color', THEME_3_LIGHT_SURFACE_TEXT);
  root.style.setProperty('--schedule-modal-body-text', THEME_3_LIGHT_SURFACE_TEXT);
  root.style.setProperty('--schedule-modal-muted-text', 'rgba(26, 42, 66, 0.72)');
  root.style.setProperty('--schedule-modal-section-label-color', THEME_3_LIGHT_SURFACE_TEXT);
  root.style.setProperty('--schedule-select-bg', THEME_3_LIGHT_PANEL_BG);
  root.style.setProperty('--schedule-select-text', THEME_3_LIGHT_SURFACE_TEXT);
  root.style.setProperty('--schedule-select-menu-bg', THEME_3_LIGHT_PANEL_BG);
  root.style.setProperty('--schedule-select-menu-text', THEME_3_LIGHT_SURFACE_TEXT);
  root.style.setProperty('--schedule-select-menu-hover', 'rgba(61, 74, 92, 0.16)');
  root.style.setProperty('--schedule-select-menu-selected-hover', '#2f3a4a');
  root.style.setProperty('--schedule-modal-item-selected-bg', THEME_3_BUTTON_SOLID);
  root.style.setProperty('--schedule-modal-item-selected-text', '#ffffff');
  root.style.setProperty('--quick-control-page-text', THEME_3_LIGHT_SURFACE_TEXT);
  root.style.setProperty('--quick-control-radio-border', THEME_3_BUTTON_SOLID);
  root.style.setProperty('--quick-control-radio-checked-fill', THEME_3_BUTTON_SOLID);
  root.style.setProperty('--quick-control-radio-unchecked-fill', '#ffffff');

  root.style.setProperty('--settings-color-swatch-selected-stroke', THEME_3_BUTTON_SOLID);
  root.style.setProperty('--home-tab-active-color', THEME_3_BUTTON_SOLID);
  root.style.setProperty('--home-field-surface-bg', THEME_3_LIGHT_SECTION_BG);
  root.style.setProperty('--home-field-border', '#C5CDD8');
}

export function applyTheme3HeatmapChrome(root) {
  root.style.setProperty('--heatmap-sidebar-panel-bg', 'rgba(61, 74, 92, 0.5)');
  root.style.setProperty('--heatmap-sidebar-panel-border', 'rgba(255, 255, 255, 0.2)');
  root.style.setProperty('--heatmap-sidebar-section-bg', THEME_3_TAB_PILL_GRADIENT);
  root.style.setProperty('--heatmap-sidebar-panel-label', '#ffffff');
  root.style.setProperty('--heatmap-sidebar-section-text', '#ffffff');
  root.style.setProperty('--heatmap-sidebar-section-label-bg', 'rgba(0, 0, 0, 0.12)');
  root.style.setProperty('--heatmap-sidebar-loading-overlay-bg', 'rgba(232, 236, 242, 0.94)');
  root.style.setProperty('--heatmap-sidebar-loading-spinner-color', THEME_3_BUTTON_SOLID);
  root.style.setProperty('--heatmap-sidebar-scrollbar-thumb', THEME_3_BUTTON_SOLID);
  root.style.setProperty('--heatmap-sidebar-scrollbar-thumb-hover', '#2f3948');
  root.style.setProperty('--heatmap-sidebar-scrollbar-track', 'rgba(0, 0, 0, 0.18)');
  applyHeatmapTabPillTokens(root, {
    pillBg: THEME_3_TAB_PILL_GRADIENT,
    activeText: THEME_3_BUTTON_SOLID,
    contrastSolid: THEME_3_BUTTON_SOLID,
  });
  root.style.setProperty('--heatmap-dialog-paper-bg', THEME_3_LIGHT_PANEL_BG);
  root.style.setProperty('--heatmap-dialog-section-bg', THEME_3_TAB_PILL_GRADIENT);
  root.style.setProperty('--heatmap-dialog-zone-card-bg', '#ffffff');
  root.style.setProperty('--heatmap-rename-dialog-bg', THEME_3_LIGHT_PANEL_BG);
  root.style.setProperty('--heatmap-legends-nav-bg', THEME_3_LIGHT_SECTION_BG);
  root.style.setProperty('--heatmap-legends-nav-text', THEME_3_LIGHT_SURFACE_TEXT);
  root.style.setProperty('--heatmap-select-menu-bg', THEME_3_LIGHT_SECTION_BG);
  root.style.setProperty('--heatmap-select-menu-hover', 'rgba(61, 74, 92, 0.12)');
  root.style.setProperty('--heatmap-select-menu-selected', 'rgba(61, 74, 92, 0.22)');
  root.style.setProperty('--heatmap-select-menu-selected-hover', 'rgba(61, 74, 92, 0.28)');
}

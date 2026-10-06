import { alpha, darken, lighten } from '@mui/material/styles';
import { isLightSurface, onContentColors } from './themeOnSurface';
import {
  buildAppPageBackground,
  buildCustomDashboardSurfaceGradient,
  buildCustomNavbarGradient,
  normalizeThemeHex,
  resolveCustomNavbarSolid,
  resolveCustomThemePanelBg,
  resolveCustomThemeSectionBg,
} from './themePageBackground';
import { applySettingsSidebarTypographyVars } from './settingsSidebarTabStyles';
import { applyCustomPremiumThemeTokens } from './premiumThemeTokens';
import { applyHeatmapTabPillTokens } from '../../../shared/theme/utils/applyHeatmapTabPillTokens';
import { resolveWordmarkLogoFilter } from '../../../shared/theme/utils/resolveWordmarkLogoFilter';

/**
 * Applies CSS variables for custom hex-picker themes (not Gold / Blue / Brown presets).
 */
export function applyDynamicThemeTokens(
  root,
  { background, content, button, buttonStyle, customImageUrl }
) {
  const resolvedBackground = normalizeThemeHex(background) || '#6f809d';
  const resolvedContent = normalizeThemeHex(content) || '#3d4a5c';
  const lightPage = isLightSurface(resolvedBackground);
  const pageOn = onContentColors(resolvedBackground);
  const panelBg = resolveCustomThemePanelBg(resolvedBackground, resolvedContent);
  const sectionBg = resolveCustomThemeSectionBg(panelBg, resolvedBackground, resolvedContent);
  const panelOn = onContentColors(panelBg);
  const sectionOn = onContentColors(sectionBg);
  const whiteFieldOn = onContentColors('#ffffff');
  const lightFieldOn = onContentColors('#eeeeee');
  const dashboardSurfaceGradient = buildCustomDashboardSurfaceGradient(background);
  const dashboardSurfaceSolid = resolveCustomNavbarSolid(background);
  const accentGradient = dashboardSurfaceGradient;
  const accentSolid = buttonStyle?.solid || dashboardSurfaceSolid;
  const accentText = buttonStyle?.text || '#ffffff';
  const border = alpha(panelOn.primary, 0.28);
  const mutedText = panelOn.secondary;
  const pageBackground = buildAppPageBackground(background);
  const footerBackground = pageBackground;

  root.style.setProperty('--app-button-background', accentGradient);
  root.style.setProperty('--app-button', accentSolid);
  root.style.setProperty('--app-button-text', accentText);

  root.style.setProperty('--dashboard-card-background', dashboardSurfaceGradient);
  root.style.setProperty('--dashboard-chart-header-text', onContentColors(dashboardSurfaceSolid).primary);
  root.style.setProperty('--app-page-text', pageOn.primary);
  root.style.setProperty('--app-page-muted-text', pageOn.secondary);
  root.style.setProperty('--app-page-background', pageBackground);
  root.style.setProperty('--footer-background', footerBackground);
  root.style.setProperty('--footer-background-color', background);
  root.style.removeProperty('--footer-background-image');
  root.style.setProperty('--footer-text-color', pageOn.primary);
  root.style.setProperty('--footer-logo-filter', resolveWordmarkLogoFilter(resolvedBackground));

  const navbarGradient = buildCustomNavbarGradient(background);
  root.style.setProperty('--topbar-navbar-background', navbarGradient);
  root.style.setProperty('--topbar-nav-pill-bg', alpha(panelBg, 0.95));
  root.style.setProperty('--topbar-nav-active-text', panelOn.primary);
  root.style.setProperty('--topbar-nav-inactive-text', '#ffffff');
  root.style.setProperty('--topbar-profile-trigger-text', '#ffffff');
  root.style.setProperty('--topbar-profile-menu-bg', panelBg);
  root.style.setProperty('--topbar-profile-menu-text', panelOn.primary);
  root.style.setProperty('--topbar-profile-menu-border', border);
  root.style.setProperty('--topbar-profile-menu-hover-bg', sectionBg);
  root.style.setProperty('--topbar-profile-menu-icon', panelOn.icon);

  root.style.setProperty('--schedule-grid-bg', accentSolid);
  root.style.setProperty('--schedule-panel-bg', panelBg);
  root.style.setProperty('--schedule-panel-border', border);
  root.style.setProperty('--schedule-section-bg', sectionBg);
  root.style.setProperty('--schedule-section-text', sectionOn.primary);
  root.style.setProperty('--schedule-panel-label', panelOn.primary);
  root.style.setProperty('--schedule-page-heading-text', pageOn.primary);
  root.style.setProperty('--schedule-modal-bg', panelBg);
  root.style.setProperty('--schedule-modal-title-color', panelOn.primary);
  root.style.setProperty('--schedule-modal-body-text', panelOn.primary);
  root.style.setProperty('--schedule-modal-muted-text', mutedText);
  root.style.setProperty('--schedule-modal-section-label-color', panelOn.primary);
  root.style.setProperty('--schedule-modal-item-selected-bg', accentSolid);
  root.style.setProperty('--schedule-modal-item-selected-text', accentText);
  root.style.setProperty('--schedule-today-bg', '#ffffff');
  root.style.setProperty('--schedule-today-text', whiteFieldOn.primary);
  root.style.setProperty(
    '--schedule-event-active-bg',
    `linear-gradient(90deg, ${sectionBg} 0%, ${panelBg} 100%)`
  );
  root.style.setProperty('--schedule-event-active-text', panelOn.primary);
  root.style.setProperty('--schedule-status-text', panelOn.primary);
  root.style.setProperty('--schedule-select-bg', panelBg);
  root.style.setProperty('--schedule-select-text', panelOn.primary);
  root.style.setProperty('--schedule-select-menu-bg', panelBg);
  root.style.setProperty('--schedule-select-menu-text', panelOn.primary);
  root.style.setProperty('--schedule-select-menu-hover', alpha(accentSolid, 0.16));
  root.style.setProperty('--schedule-select-menu-selected-hover', darken(accentSolid, 0.1));

  root.style.setProperty('--quick-control-page-text', pageOn.primary);
  root.style.setProperty('--quick-control-radio-border', accentSolid);
  root.style.setProperty('--quick-control-radio-checked-fill', accentSolid);
  root.style.setProperty('--quick-control-radio-unchecked-fill', '#ffffff');

  root.style.setProperty('--settings-panel-inner-bg', panelBg);
  root.style.setProperty('--settings-theme-card-bg', panelBg);
  root.style.setProperty('--settings-theme-dialog-bg', panelBg);
  root.style.setProperty('--settings-panel-outer-bg', sectionBg);
  root.style.setProperty('--settings-panel-border', border);
  root.style.setProperty('--settings-panel-text', panelOn.primary);
  root.style.setProperty('--settings-panel-muted-text', mutedText);
  root.style.setProperty('--settings-panel-button-text', sectionOn.primary);
  root.style.setProperty('--settings-panel-button-bg', sectionBg);
  root.style.setProperty('--settings-sidebar-text', lightPage ? panelOn.primary : pageOn.primary);
  root.style.setProperty('--settings-sidebar-title-color', lightPage ? panelOn.primary : pageOn.primary);
  root.style.setProperty('--settings-sidebar-active-bg', accentGradient);
  root.style.setProperty('--settings-sidebar-active-text', accentText);
  root.style.setProperty('--settings-sidebar-hover-bg', alpha(panelOn.primary, 0.12));
  applySettingsSidebarTypographyVars(root);
  root.style.setProperty('--settings-theme-pill-active-bg', accentGradient);
  root.style.setProperty('--settings-theme-pill-active-text', accentText);
  root.style.setProperty('--settings-theme-pill-inactive-border', border);
  root.style.setProperty('--settings-theme-action-button-bg', accentGradient);
  root.style.setProperty('--settings-theme-action-button-text', accentText);
  root.style.setProperty('--settings-color-swatch-selected-stroke', accentSolid);
  root.style.setProperty('--settings-form-section-bg', sectionBg);
  root.style.setProperty('--settings-form-control-bg', '#ffffff');
  root.style.setProperty('--settings-form-control-text', whiteFieldOn.primary);
  root.style.setProperty('--settings-form-label-color', panelOn.primary);

  root.style.setProperty('--users-table-container-bg', sectionBg);
  root.style.setProperty('--users-table-head-bg', sectionBg);
  root.style.setProperty('--users-table-row-bg', '#ffffff');
  root.style.setProperty('--users-modal-bg', panelBg);
  root.style.setProperty('--users-modal-inner-bg', '#ffffff');
  root.style.setProperty('--users-modal-info-bg', sectionBg);
  root.style.setProperty('--users-input-bg', '#ffffff');
  root.style.setProperty('--users-input-text', whiteFieldOn.primary);
  root.style.setProperty('--users-input-label-text', panelOn.secondary);
  root.style.setProperty('--users-input-placeholder-text', whiteFieldOn.secondary);
  root.style.setProperty('--users-readonly-field-bg', '#f0f2f5');
  root.style.setProperty('--users-readonly-field-text', panelOn.primary);
  root.style.setProperty('--users-select-menu-bg', '#ffffff');
  root.style.setProperty('--users-select-menu-hover', sectionBg);
  root.style.setProperty('--users-select-menu-checkbox-color', panelOn.secondary);
  root.style.setProperty('--users-select-menu-checkbox-checked-color', accentSolid);
  root.style.setProperty('--users-chip-bg', sectionBg);
  root.style.setProperty('--users-confirm-dialog-bg', panelBg);
  root.style.setProperty('--users-border', border);

  root.style.setProperty('--area-groups-panel-bg', panelBg);
  root.style.setProperty('--area-groups-inner-bg', sectionBg);
  root.style.setProperty('--area-groups-chip-bg', sectionBg);
  root.style.setProperty('--area-groups-border', border);
  root.style.setProperty('--area-group-on-surface-text', panelOn.primary);
  root.style.setProperty('--area-group-inner-text', sectionOn.primary);

  root.style.setProperty('--activity-report-table-head-bg', sectionBg);
  root.style.setProperty('--activity-report-table-container-bg', panelBg);
  root.style.setProperty('--activity-report-table-row-bg', '#ffffff');
  root.style.setProperty('--activity-report-table-row-alt-bg', sectionBg);
  root.style.setProperty('--activity-report-table-text', panelOn.primary);
  root.style.setProperty('--activity-report-table-head-text', panelOn.primary);
  root.style.setProperty('--activity-report-page-text', pageOn.primary);
  root.style.setProperty('--activity-report-page-muted-text', pageOn.secondary);
  root.style.setProperty('--activity-report-page-disabled-text', pageOn.disabled);
  root.style.setProperty('--activity-report-pagination-text', pageOn.primary);
  root.style.setProperty('--activity-report-chip-border', border);
  root.style.setProperty('--activity-report-filter-field-bg', '#ffffff');
  root.style.setProperty('--activity-report-filter-field-border', border);
  root.style.setProperty('--activity-report-filter-field-text', whiteFieldOn.primary);

  root.style.setProperty(
    '--area-picker-light-dialog-bg',
    lightPage ? panelBg : accentGradient
  );
  root.style.setProperty(
    '--area-picker-light-dialog-title-color',
    lightPage ? panelOn.primary : '#ffffff'
  );
  root.style.setProperty('--area-picker-light-dialog-field-text', panelOn.primary);
  root.style.setProperty(
    '--area-picker-confirm-dialog-body-text',
    lightPage ? mutedText : 'rgba(255, 255, 255, 0.92)'
  );

  root.style.setProperty('--dashboard-control-accent', accentSolid);
  root.style.setProperty('--dashboard-select-option-bg', panelBg);
  root.style.setProperty('--dashboard-select-option-text', panelOn.primary);
  root.style.setProperty('--dashboard-select-option-selected-bg', accentSolid);
  root.style.setProperty('--dashboard-select-option-selected-text', accentText);
  root.style.setProperty('--dashboard-select-menu-hover', alpha(panelOn.primary, 0.12));
  root.style.setProperty('--dashboard-select-menu-selected-hover', alpha(panelOn.primary, 0.22));
  root.style.setProperty('--dashboard-select-field-bg', '#ffffff');
  root.style.setProperty('--dashboard-select-field-text', whiteFieldOn.primary);
  root.style.setProperty('--dashboard-select-field-border', border);
  root.style.setProperty('--dashboard-alert-filter-hover-bg', alpha(panelOn.primary, 0.08));
  root.style.setProperty('--dashboard-area-tree-hover-bg', sectionBg);
  root.style.setProperty('--dashboard-alert-filter-bg', '#ffffff');
  root.style.setProperty('--dashboard-alert-filter-menu-bg', panelBg);
  root.style.setProperty('--dashboard-alert-filter-border', border);
  root.style.setProperty('--dashboard-alert-filter-checked-bg', sectionBg);
  root.style.setProperty('--dashboard-alert-filter-text', panelOn.primary);

  root.style.setProperty('--alerts-panel-bg', accentGradient);
  root.style.setProperty('--alerts-panel-text', '#ffffff');
  root.style.setProperty('--alerts-panel-muted-text', 'rgba(255, 255, 255, 0.9)');
  root.style.setProperty('--alerts-table-container-bg', panelBg);
  root.style.setProperty('--alerts-table-head-bg', sectionBg);
  root.style.setProperty('--alerts-table-head-text', sectionOn.primary);
  root.style.setProperty('--alerts-table-row-bg', '#ffffff');
  root.style.setProperty('--alerts-table-row-alt-bg', sectionBg);
  root.style.setProperty('--alerts-table-text', panelOn.primary);
  root.style.setProperty('--alerts-table-border', border);
  root.style.setProperty('--alerts-pagination-bg', sectionBg);
  root.style.setProperty('--alerts-pagination-text', sectionOn.primary);
  root.style.setProperty('--alerts-pagination-border', border);
  root.style.setProperty('--alerts-pagination-item-bg', '#ffffff');
  root.style.setProperty('--alerts-pagination-item-text', whiteFieldOn.primary);
  root.style.setProperty('--alerts-pagination-item-hover-bg', sectionBg);
  root.style.setProperty('--alerts-pagination-item-selected-bg', accentSolid);
  root.style.setProperty('--alerts-pagination-item-selected-text', accentText);
  root.style.setProperty('--alerts-pagination-item-disabled-text', panelOn.disabled);
  root.style.setProperty('--alerts-menu-hover', sectionBg);
  root.style.setProperty('--alerts-menu-bg', panelBg);
  root.style.setProperty('--alerts-menu-text', panelOn.primary);
  root.style.setProperty('--alerts-menu-selected', alpha(panelOn.primary, 0.18));
  root.style.setProperty('--alerts-menu-field-bg', '#ffffff');
  root.style.setProperty('--alerts-export-menu-bg', panelBg);
  root.style.setProperty('--alerts-export-menu-border', border);
  root.style.setProperty('--alerts-export-menu-text', panelOn.primary);

  root.style.setProperty('--auth-page-background-image', 'none');
  root.style.setProperty('--auth-card-bg', panelBg);
  root.style.setProperty('--auth-card-text', panelOn.primary);
  root.style.setProperty('--auth-card-subtext', mutedText);
  root.style.setProperty('--auth-card-caption', panelOn.disabled);
  root.style.setProperty('--auth-card-border', border);
  root.style.setProperty('--auth-card-shadow', `0 8px 24px ${alpha(panelOn.primary, 0.14)}`);
  root.style.setProperty('--auth-field-bg', '#ffffff');
  root.style.setProperty('--auth-field-text', whiteFieldOn.primary);
  root.style.setProperty('--auth-field-border', border);
  root.style.setProperty('--auth-field-border-focus', accentSolid);
  /* Always dark when auth fields are white — password eye must stay visible */
  root.style.setProperty('--auth-password-icon-color', whiteFieldOn.primary);
  root.style.setProperty('--auth-button-bg', accentSolid);
  root.style.setProperty('--auth-button-background', accentGradient);
  root.style.setProperty('--auth-button-text', accentText);
  root.style.setProperty('--auth-button-hover-bg', darken(accentSolid, 0.12));
  root.style.setProperty('--auth-icon-color', panelOn.primary);
  root.style.setProperty('--auth-logo-filter', resolveWordmarkLogoFilter(resolvedBackground));

  root.style.setProperty('--floor-tool-field-bg', '#ffffff');
  root.style.setProperty('--floor-tool-field-text', whiteFieldOn.primary);
  root.style.setProperty('--floor-tool-field-border', border);

  root.style.setProperty('--help-download-available-bg', panelBg);
  root.style.setProperty('--help-download-available-hover-bg', sectionBg);
  root.style.setProperty('--help-download-available-text', panelOn.primary);
  root.style.setProperty('--help-download-available-border', accentSolid);
  root.style.setProperty('--help-download-unavailable-bg', 'transparent');
  root.style.setProperty('--help-download-unavailable-text', panelOn.disabled);
  root.style.setProperty('--help-download-unavailable-border', border);

  root.style.setProperty('--home-tab-active-color', accentSolid);
  root.style.setProperty('--home-field-surface-bg', sectionBg);
  root.style.setProperty('--home-field-border', border);
  root.style.setProperty('--home-editor-text', lightFieldOn.primary);

  const heatmapSectionBg = accentGradient;
  const dashboardTabPillBg = dashboardSurfaceGradient;
  root.style.setProperty('--heatmap-sidebar-panel-bg', alpha(accentSolid, 0.55));
  root.style.setProperty('--heatmap-sidebar-panel-border', 'rgba(255, 255, 255, 0.2)');
  root.style.setProperty('--heatmap-sidebar-section-bg', heatmapSectionBg);
  root.style.setProperty('--heatmap-sidebar-panel-label', '#ffffff');
  root.style.setProperty('--heatmap-sidebar-section-text', '#ffffff');
  root.style.setProperty('--heatmap-sidebar-section-label-bg', 'rgba(0, 0, 0, 0.15)');
  root.style.setProperty(
    '--heatmap-sidebar-loading-overlay-bg',
    alpha(panelBg, 0.94)
  );
  root.style.setProperty('--heatmap-sidebar-loading-spinner-color', accentSolid);
  root.style.setProperty('--heatmap-sidebar-scrollbar-thumb', accentSolid);
  root.style.setProperty('--heatmap-sidebar-scrollbar-thumb-hover', darken(accentSolid, 0.12));
  root.style.setProperty('--heatmap-sidebar-scrollbar-track', 'rgba(0, 0, 0, 0.18)');
  applyHeatmapTabPillTokens(root, {
    pillBg: dashboardTabPillBg,
    activeText: dashboardSurfaceSolid,
    contrastSolid: dashboardSurfaceSolid,
  });
  root.style.setProperty('--heatmap-dialog-paper-bg', panelBg);
  root.style.setProperty('--heatmap-dialog-section-bg', heatmapSectionBg);
  root.style.setProperty('--heatmap-dialog-zone-card-bg', '#ffffff');
  root.style.setProperty('--heatmap-dialog-close-text', accentSolid);
  root.style.setProperty('--heatmap-rename-dialog-bg', panelBg);
  root.style.setProperty('--heatmap-rename-dialog-title-color', panelOn.primary);
  root.style.setProperty('--heatmap-rename-dialog-border', border);
  root.style.setProperty('--heatmap-rename-dialog-field-bg', '#ffffff');
  root.style.setProperty('--heatmap-rename-dialog-field-text', whiteFieldOn.primary);
  root.style.setProperty('--heatmap-rename-dialog-field-border', border);
  root.style.setProperty('--heatmap-rename-dialog-label-color', panelOn.primary);
  root.style.setProperty('--heatmap-rename-dialog-label-bg', panelBg);
  root.style.setProperty('--heatmap-rename-dialog-cancel-color', panelOn.primary);
  root.style.setProperty('--heatmap-rename-dialog-cancel-border', border);
  root.style.setProperty('--heatmap-legends-nav-bg', panelBg);
  root.style.setProperty('--heatmap-legends-nav-text', panelOn.primary);
  root.style.setProperty('--heatmap-select-menu-bg', sectionBg);
  root.style.setProperty('--heatmap-select-menu-hover', alpha(panelOn.primary, 0.12));
  root.style.setProperty('--heatmap-select-menu-selected', alpha(panelOn.primary, 0.22));
  root.style.setProperty('--heatmap-select-menu-selected-hover', alpha(panelOn.primary, 0.28));

  root.style.setProperty('--dashboard-chart-tooltip-bg', dashboardSurfaceGradient);
  root.style.setProperty('--dashboard-chart-tooltip-border-color', 'rgba(255, 255, 255, 0.85)');
  root.style.setProperty('--dashboard-chart-tooltip-text', '#ffffff');
  root.style.setProperty('--dashboard-chart-loading-bg', alpha(dashboardSurfaceSolid, 0.35));
  root.style.setProperty(
    '--dashboard-chart-loading-spinner-track',
    alpha(dashboardSurfaceSolid, 0.45)
  );
  root.style.setProperty('--dashboard-chart-loading-spinner-head', dashboardSurfaceSolid);

  root.style.setProperty("--app-background-image", "none");
  if (customImageUrl) {
    root.style.setProperty("--auth-page-background-image", `url(${customImageUrl})`);
  } else {
    root.style.setProperty("--auth-page-background-image", "none");
  }

  applyCustomPremiumThemeTokens(root, accentSolid);

  document.documentElement.classList.remove('gold-theme', 'theme-3-page', 'theme-4-page');
  document.documentElement.classList.add('custom-theme');
}

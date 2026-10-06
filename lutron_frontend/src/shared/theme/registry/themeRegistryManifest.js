/**
 * Advanced theme CSS variable registry (metadata only).
 * Generated from advanced preset/token writers and consumers — do not edit entries by hand.
 * Regenerate: node scripts/generate-registry-scan.js
 */
/* eslint-disable max-lines */

export const THEME_REGISTRY_CATEGORIES = Object.freeze([
  "core",
  "background",
  "navigation",
  "settings",
  "dashboard",
  "charts",
  "heatmap",
  "schedule",
  "users",
  "alerts",
  "activityReport",
  "premium",
  "typography",
]);

export const THEME_REGISTRY_PRESETS = Object.freeze([
  "gold",
  "theme3",
  "theme4",
  "custom",
  "default",
  "consumerOnly",
]);

export const THEME_REGISTRY_WRITERS = Object.freeze([
  "applyAdvancedCssVariables.js",
  "dynamicThemeTokens.js",
  "theme3PageChrome.js",
  "premiumThemeTokens.js",
  "dashboardChartChrome.js",
  "settingsSidebarTabStyles.js",
  "gold.js",
  "theme3.js",
  "theme4.js",
  "defaultSlate.js",
]);

/** @type {ReadonlyArray<{ variable: string, category: string, presetOwners: string[], writers: string[], consumers: string[] }>} */
export const THEME_REGISTRY_ENTRIES = Object.freeze(
  [
  {
    variable: "activity-report-chip-border",
    category: "activityReport",
    presetOwners: [
      "custom",
      "gold",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/screens/activityReport/ActivityReport.jsx"
    ]
  },
  {
    variable: "activity-report-filter-field-bg",
    category: "activityReport",
    presetOwners: [
      "custom",
      "gold",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/activityReport/ActivityReport.jsx"
    ]
  },
  {
    variable: "activity-report-filter-field-border",
    category: "activityReport",
    presetOwners: [
      "custom",
      "gold",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/activityReport/ActivityReport.jsx"
    ]
  },
  {
    variable: "activity-report-filter-field-text",
    category: "activityReport",
    presetOwners: [
      "custom"
    ],
    writers: [
      "dynamicThemeTokens.js"
    ],
    consumers: []
  },
  {
    variable: "activity-report-page-disabled-text",
    category: "activityReport",
    presetOwners: [
      "custom",
      "gold",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/screens/activityReport/ActivityReport.jsx"
    ]
  },
  {
    variable: "activity-report-page-muted-text",
    category: "activityReport",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/screens/activityReport/ActivityReport.jsx"
    ]
  },
  {
    variable: "activity-report-page-text",
    category: "activityReport",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/activityReport/ActivityReport.jsx",
      "variants/advanced/screens/activityReport/ActivityReportTable.jsx"
    ]
  },
  {
    variable: "activity-report-pagination-text",
    category: "activityReport",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/activityReport/ActivityReportTable.jsx"
    ]
  },
  {
    variable: "activity-report-table-container-bg",
    category: "activityReport",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/activityReport/ActivityReportTable.jsx"
    ]
  },
  {
    variable: "activity-report-table-head-bg",
    category: "activityReport",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/activityReport/ActivityReportTable.jsx"
    ]
  },
  {
    variable: "activity-report-table-head-text",
    category: "activityReport",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/activityReport/ActivityReportTable.jsx"
    ]
  },
  {
    variable: "activity-report-table-row-alt-bg",
    category: "activityReport",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/activityReport/ActivityReportTable.jsx"
    ]
  },
  {
    variable: "activity-report-table-row-bg",
    category: "activityReport",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/activityReport/ActivityReportTable.jsx"
    ]
  },
  {
    variable: "activity-report-table-text",
    category: "activityReport",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/activityReport/ActivityReportTable.jsx"
    ]
  },
  {
    variable: "alerts-export-menu-bg",
    category: "alerts",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/utils/chartExportMenuStyles.js"
    ]
  },
  {
    variable: "alerts-export-menu-border",
    category: "alerts",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/utils/chartExportMenuStyles.js"
    ]
  },
  {
    variable: "alerts-export-menu-text",
    category: "alerts",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/utils/chartExportMenuStyles.js"
    ]
  },
  {
    variable: "alerts-menu-bg",
    category: "alerts",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/dashboard/Alerts.jsx"
    ]
  },
  {
    variable: "alerts-menu-field-bg",
    category: "alerts",
    presetOwners: [
      "custom",
      "gold",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/screens/dashboard/Alerts.jsx"
    ]
  },
  {
    variable: "alerts-menu-hover",
    category: "alerts",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/dashboard/Alerts.jsx"
    ]
  },
  {
    variable: "alerts-menu-selected",
    category: "alerts",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/index.css"
    ]
  },
  {
    variable: "alerts-menu-text",
    category: "alerts",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/dashboard/Alerts.jsx"
    ]
  },
  {
    variable: "alerts-pagination-bg",
    category: "alerts",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/dashboard/Alerts.jsx"
    ]
  },
  {
    variable: "alerts-pagination-border",
    category: "alerts",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/dashboard/Alerts.jsx"
    ]
  },
  {
    variable: "alerts-pagination-item-bg",
    category: "alerts",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/dashboard/Alerts.jsx"
    ]
  },
  {
    variable: "alerts-pagination-item-disabled-text",
    category: "alerts",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/dashboard/Alerts.jsx"
    ]
  },
  {
    variable: "alerts-pagination-item-hover-bg",
    category: "alerts",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/dashboard/Alerts.jsx"
    ]
  },
  {
    variable: "alerts-pagination-item-selected-bg",
    category: "alerts",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/dashboard/Alerts.jsx"
    ]
  },
  {
    variable: "alerts-pagination-item-selected-text",
    category: "alerts",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/dashboard/Alerts.jsx"
    ]
  },
  {
    variable: "alerts-pagination-item-text",
    category: "alerts",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/dashboard/Alerts.jsx"
    ]
  },
  {
    variable: "alerts-pagination-text",
    category: "alerts",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/dashboard/Alerts.jsx"
    ]
  },
  {
    variable: "alerts-panel-bg",
    category: "alerts",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/dashboard/Alerts.jsx"
    ]
  },
  {
    variable: "alerts-panel-muted-text",
    category: "alerts",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/dashboard/Alerts.jsx"
    ]
  },
  {
    variable: "alerts-panel-text",
    category: "alerts",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/dashboard/Alerts.jsx"
    ]
  },
  {
    variable: "alerts-table-border",
    category: "alerts",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/dashboard/Alerts.jsx"
    ]
  },
  {
    variable: "alerts-table-container-bg",
    category: "alerts",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/dashboard/Alerts.jsx"
    ]
  },
  {
    variable: "alerts-table-head-bg",
    category: "alerts",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/dashboard/Alerts.jsx"
    ]
  },
  {
    variable: "alerts-table-head-text",
    category: "alerts",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/dashboard/Alerts.jsx"
    ]
  },
  {
    variable: "alerts-table-row-alt-bg",
    category: "alerts",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/dashboard/Alerts.jsx"
    ]
  },
  {
    variable: "alerts-table-row-bg",
    category: "alerts",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/dashboard/Alerts.jsx"
    ]
  },
  {
    variable: "alerts-table-text",
    category: "alerts",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/dashboard/Alerts.jsx"
    ]
  },
  {
    variable: "app-background",
    category: "core",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "applyAdvancedCssVariables.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/auth/authFormStyles.js"
    ]
  },
  {
    variable: "app-background-image",
    category: "core",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "applyAdvancedCssVariables.js"
    ],
    consumers: [
      "variants/advanced/layouts/MainLayout.jsx",
      "variants/advanced/screens/auth/authFormStyles.js"
    ]
  },
  {
    variable: "app-button",
    category: "core",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "applyAdvancedCssVariables.js"
    ],
    consumers: [
      "variants/advanced/screens/area-size-load/AreaSizeLoad.jsx",
      "variants/advanced/screens/create-area-model/SelectAreaDialog.jsx",
      "variants/advanced/screens/quickcontrols/AreaTreeDialog.jsx",
      "variants/advanced/screens/quickcontrols/CreateQuickControl.jsx",
      "variants/advanced/screens/quickcontrols/QuickControlDetails.jsx",
      "variants/advanced/screens/schedule/AddEvent.jsx",
      "variants/advanced/screens/schedule/ScheduleComponent.jsx",
      "variants/advanced/screens/schedule/ScheduleDetails.jsx",
      "variants/advanced/screens/schedule/ScheduleFormPanel.jsx",
      "variants/advanced/screens/schedule/UpdatePreconfigurdEvent.jsx",
      "variants/advanced/screens/settings/Users/CreateUser.jsx",
      "variants/advanced/screens/settings/Users/UpdateUser.jsx",
      "variants/advanced/screens/settings/floor/CreateFloor.jsx",
      "variants/advanced/screens/settings/floor/EditFloor.jsx",
      "variants/advanced/screens/settings/floor/ProcessorSelectionDialog.jsx",
      "variants/advanced/screens/settings/floor/floorToolStyles.js",
      "variants/advanced/screens/settings/processors/AddByIpDialog.jsx",
      "variants/advanced/styles/HexColorPicker.css",
      "variants/advanced/utils/FeedbackUI.jsx",
      "variants/advanced/utils/areaSizeLoadStyles.js",
      "variants/advanced/utils/scheduleCreateStyles.js"
    ]
  },
  {
    variable: "app-button-background",
    category: "core",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "applyAdvancedCssVariables.js"
    ],
    consumers: [
      "variants/advanced/index.css"
    ]
  },
  {
    variable: "app-button-text",
    category: "core",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "applyAdvancedCssVariables.js"
    ],
    consumers: [
      "variants/advanced/index.css"
    ]
  },
  {
    variable: "app-content",
    category: "core",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "applyAdvancedCssVariables.js"
    ],
    consumers: []
  },
  {
    variable: "app-page-background",
    category: "background",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/components/TopbarComponent.jsx",
      "variants/advanced/index.css",
      "variants/advanced/layouts/MainLayout.jsx",
      "variants/advanced/screens/auth/authFormStyles.js"
    ]
  },
  {
    variable: "app-page-muted-text",
    category: "background",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js",
      "theme3.js",
      "theme4.js"
    ],
    consumers: []
  },
  {
    variable: "app-page-text",
    category: "background",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js",
      "theme3.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/index.css"
    ]
  },
  {
    variable: "area-groups-border",
    category: "users",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/create-area-model/SelectAreaDialog.jsx",
      "variants/advanced/screens/manageAreaGroup/CreateAreaGroup.jsx",
      "variants/advanced/screens/manageAreaGroup/ManageAreaGroup.jsx",
      "variants/advanced/screens/manageAreaGroup/UpdateAreaGroup.jsx",
      "variants/advanced/screens/settings/fofp/fofpSettingsUi.js",
      "variants/advanced/screens/settings/help/CreateHelp.jsx",
      "variants/advanced/screens/settings/renameWidget/RenameWidget.jsx",
      "variants/advanced/screens/userAreaGroup/CreateUserAreaGroup.jsx",
      "variants/advanced/screens/userAreaGroup/UpdateUserAreaGroup.jsx"
    ]
  },
  {
    variable: "area-groups-chip-bg",
    category: "users",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/manageAreaGroup/ManageAreaGroup.jsx"
    ]
  },
  {
    variable: "area-groups-inner-bg",
    category: "users",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/create-area-model/SelectAreaDialog.jsx",
      "variants/advanced/screens/manageAreaGroup/CreateAreaGroup.jsx",
      "variants/advanced/screens/manageAreaGroup/UpdateAreaGroup.jsx",
      "variants/advanced/screens/quickcontrols/AreaTreeDialog.jsx",
      "variants/advanced/screens/settings/floor/CreateFloor.jsx",
      "variants/advanced/screens/settings/floor/EditFloor.jsx",
      "variants/advanced/screens/settings/fofp/fofpSettingsUi.js",
      "variants/advanced/screens/settings/help/CreateHelp.jsx",
      "variants/advanced/screens/userAreaGroup/CreateUserAreaGroup.jsx",
      "variants/advanced/screens/userAreaGroup/UpdateUserAreaGroup.jsx"
    ]
  },
  {
    variable: "area-groups-panel-bg",
    category: "users",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/manageAreaGroup/CreateAreaGroup.jsx",
      "variants/advanced/screens/manageAreaGroup/UpdateAreaGroup.jsx",
      "variants/advanced/screens/userAreaGroup/CreateUserAreaGroup.jsx",
      "variants/advanced/screens/userAreaGroup/UpdateUserAreaGroup.jsx"
    ]
  },
  {
    variable: "area-picker-confirm-dialog-body-text",
    category: "core",
    presetOwners: [
      "custom",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/create-area-model/SelectAreaDialog.jsx",
      "variants/advanced/screens/settings/fofp/FOFPComponent.jsx"
    ]
  },
  {
    variable: "area-picker-light-dialog-bg",
    category: "core",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/create-area-model/SelectAreaDialog.jsx",
      "variants/advanced/screens/quickcontrols/AreaTreeDialog.jsx",
      "variants/advanced/screens/settings/floor/CreateFloor.jsx",
      "variants/advanced/screens/settings/floor/EditFloor.jsx",
      "variants/advanced/screens/settings/floor/ProcessorSelectionDialog.jsx",
      "variants/advanced/screens/settings/fofp/FOFPComponent.jsx",
      "variants/advanced/screens/settings/processors/AddByIpDialog.jsx"
    ]
  },
  {
    variable: "area-picker-light-dialog-field-text",
    category: "core",
    presetOwners: [
      "custom",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/create-area-model/SelectAreaDialog.jsx",
      "variants/advanced/screens/quickcontrols/AreaTreeDialog.jsx",
      "variants/advanced/screens/settings/floor/CreateFloor.jsx"
    ]
  },
  {
    variable: "area-picker-light-dialog-title-color",
    category: "core",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/create-area-model/SelectAreaDialog.jsx",
      "variants/advanced/screens/quickcontrols/AreaTreeDialog.jsx",
      "variants/advanced/screens/settings/floor/CreateFloor.jsx",
      "variants/advanced/screens/settings/fofp/FOFPComponent.jsx"
    ]
  },
  {
    variable: "auth-button-background",
    category: "background",
    presetOwners: [
      "custom",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/auth/authFormStyles.js"
    ]
  },
  {
    variable: "auth-button-bg",
    category: "background",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/auth/authFormStyles.js"
    ]
  },
  {
    variable: "auth-button-hover-bg",
    category: "background",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/auth/authFormStyles.js",
      "variants/advanced/screens/settings/floor/floorToolStyles.js"
    ]
  },
  {
    variable: "auth-button-text",
    category: "background",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/auth/authFormStyles.js"
    ]
  },
  {
    variable: "auth-card-bg",
    category: "background",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/auth/authFormStyles.js"
    ]
  },
  {
    variable: "auth-card-border",
    category: "background",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/auth/authFormStyles.js"
    ]
  },
  {
    variable: "auth-card-caption",
    category: "background",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/auth/authFormStyles.js"
    ]
  },
  {
    variable: "auth-card-shadow",
    category: "background",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/auth/authFormStyles.js"
    ]
  },
  {
    variable: "auth-card-subtext",
    category: "background",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/auth/authFormStyles.js"
    ]
  },
  {
    variable: "auth-card-text",
    category: "background",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/auth/Login.jsx",
      "variants/advanced/screens/auth/authFormStyles.js"
    ]
  },
  {
    variable: "auth-field-bg",
    category: "background",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/auth/authFormStyles.js"
    ]
  },
  {
    variable: "auth-field-border",
    category: "background",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/auth/authFormStyles.js"
    ]
  },
  {
    variable: "auth-field-border-focus",
    category: "background",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/auth/authFormStyles.js"
    ]
  },
  {
    variable: "auth-field-text",
    category: "background",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/auth/ChangePassword.jsx",
      "variants/advanced/screens/auth/Login.jsx",
      "variants/advanced/screens/auth/authFormStyles.js"
    ]
  },
  {
    variable: "auth-icon-color",
    category: "background",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/auth/authFormStyles.js"
    ]
  },
  {
    variable: "auth-logo-filter",
    category: "background",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/auth/Login.jsx"
    ]
  },
  {
    variable: "auth-page-background-image",
    category: "background",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/auth/authFormStyles.js"
    ]
  },
  {
    variable: "dashboard-alert-filter-bg",
    category: "dashboard",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/dashboard/Dashboard.jsx"
    ]
  },
  {
    variable: "dashboard-alert-filter-border",
    category: "dashboard",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/dashboard/Dashboard.jsx"
    ]
  },
  {
    variable: "dashboard-alert-filter-checked-bg",
    category: "dashboard",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/screens/dashboard/Dashboard.jsx"
    ]
  },
  {
    variable: "dashboard-alert-filter-hover-bg",
    category: "dashboard",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/index.css"
    ]
  },
  {
    variable: "dashboard-alert-filter-menu-bg",
    category: "dashboard",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/dashboard/Dashboard.jsx"
    ]
  },
  {
    variable: "dashboard-alert-filter-text",
    category: "dashboard",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/screens/dashboard/Dashboard.jsx"
    ]
  },
  {
    variable: "dashboard-area-tree-hover-bg",
    category: "dashboard",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/index.css"
    ]
  },
  {
    variable: "dashboard-card-background",
    category: "dashboard",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "applyAdvancedCssVariables.js"
    ],
    consumers: [
      "variants/advanced/config/themeConstants.js",
      "variants/advanced/index.css",
      "variants/advanced/screens/dashboard/Alerts.jsx"
    ]
  },
  {
    variable: "dashboard-chart-loading-bg",
    category: "charts",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "dashboardChartChrome.js"
    ],
    consumers: [
      "variants/advanced/config/themeConstants.js"
    ]
  },
  {
    variable: "dashboard-chart-loading-spinner-head",
    category: "charts",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "dashboardChartChrome.js"
    ],
    consumers: [
      "variants/advanced/config/themeConstants.js"
    ]
  },
  {
    variable: "dashboard-chart-loading-spinner-track",
    category: "charts",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "dashboardChartChrome.js"
    ],
    consumers: [
      "variants/advanced/config/themeConstants.js"
    ]
  },
  {
    variable: "dashboard-chart-tooltip-bg",
    category: "charts",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "dashboardChartChrome.js"
    ],
    consumers: [
      "variants/advanced/config/themeConstants.js"
    ]
  },
  {
    variable: "dashboard-chart-tooltip-border-color",
    category: "charts",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "dashboardChartChrome.js"
    ],
    consumers: [
      "variants/advanced/config/themeConstants.js",
      "variants/advanced/screens/dashboard/Dashboard.jsx"
    ]
  },
  {
    variable: "dashboard-chart-tooltip-text",
    category: "charts",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "dashboardChartChrome.js"
    ],
    consumers: [
      "variants/advanced/config/themeConstants.js",
      "variants/advanced/screens/dashboard/Dashboard.jsx"
    ]
  },
  {
    variable: "dashboard-control-accent",
    category: "dashboard",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/utils/dashboardSelectMenuProps.js"
    ]
  },
  {
    variable: "dashboard-select-field-bg",
    category: "dashboard",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/dashboard/Dashboard.jsx",
      "variants/advanced/utils/dashboardSelectMenuProps.js"
    ]
  },
  {
    variable: "dashboard-select-field-border",
    category: "dashboard",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/dashboard/Dashboard.jsx",
      "variants/advanced/utils/dashboardSelectMenuProps.js"
    ]
  },
  {
    variable: "dashboard-select-field-text",
    category: "dashboard",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js",
      "theme3.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/dashboard/Dashboard.jsx",
      "variants/advanced/utils/dashboardSelectMenuProps.js"
    ]
  },
  {
    variable: "dashboard-select-menu-hover",
    category: "dashboard",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/utils/dashboardSelectMenuProps.js"
    ]
  },
  {
    variable: "dashboard-select-menu-selected-hover",
    category: "dashboard",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/dashboard/Alerts.jsx",
      "variants/advanced/utils/dashboardSelectMenuProps.js"
    ]
  },
  {
    variable: "dashboard-select-option-bg",
    category: "dashboard",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/utils/dashboardSelectMenuProps.js"
    ]
  },
  {
    variable: "dashboard-select-option-selected-bg",
    category: "dashboard",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/dashboard/Alerts.jsx",
      "variants/advanced/utils/dashboardSelectMenuProps.js"
    ]
  },
  {
    variable: "dashboard-select-option-selected-text",
    category: "dashboard",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/dashboard/Alerts.jsx",
      "variants/advanced/utils/dashboardSelectMenuProps.js"
    ]
  },
  {
    variable: "dashboard-select-option-text",
    category: "dashboard",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/utils/dashboardSelectMenuProps.js"
    ]
  },
  {
    variable: "floor-tool-field-bg",
    category: "settings",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/settings/floor/EditFloor.jsx",
      "variants/advanced/screens/settings/floor/floorToolStyles.js"
    ]
  },
  {
    variable: "floor-tool-field-border",
    category: "settings",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/settings/floor/floorToolStyles.js"
    ]
  },
  {
    variable: "floor-tool-field-text",
    category: "settings",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/settings/floor/EditFloor.jsx",
      "variants/advanced/screens/settings/floor/floorToolStyles.js"
    ]
  },
  {
    variable: "footer-background",
    category: "background",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/components/Footer.jsx",
      "variants/advanced/index.css"
    ]
  },
  {
    variable: "footer-background-color",
    category: "background",
    presetOwners: [
      "custom",
      "gold"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js"
    ],
    consumers: [
      "variants/advanced/components/Footer.jsx",
      "variants/advanced/index.css"
    ]
  },
  {
    variable: "footer-logo-filter",
    category: "background",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/components/Footer.jsx"
    ]
  },
  {
    variable: "footer-text-color",
    category: "background",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/components/Footer.jsx"
    ]
  },
  {
    variable: "heatmap-dialog-close-text",
    category: "heatmap",
    presetOwners: [
      "custom"
    ],
    writers: [
      "dynamicThemeTokens.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/heatmap/AreaSettingsDialog.jsx"
    ]
  },
  {
    variable: "heatmap-dialog-paper-bg",
    category: "heatmap",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/heatmap/AreaSettingsDialog.jsx"
    ]
  },
  {
    variable: "heatmap-dialog-section-bg",
    category: "heatmap",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/heatmap/AreaSettingsDialog.jsx"
    ]
  },
  {
    variable: "heatmap-dialog-zone-card-bg",
    category: "heatmap",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/heatmap/AreaSettingsDialog.jsx"
    ]
  },
  {
    variable: "heatmap-legends-nav-bg",
    category: "heatmap",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/heatmap/HeatMap.jsx"
    ]
  },
  {
    variable: "heatmap-legends-nav-text",
    category: "heatmap",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/heatmap/HeatMap.jsx",
      "variants/advanced/screens/lutronwebsite page/LutronPublicHome.jsx"
    ]
  },
  {
    variable: "heatmap-rename-dialog-bg",
    category: "heatmap",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/heatmap/HeatMap.jsx"
    ]
  },
  {
    variable: "heatmap-rename-dialog-border",
    category: "heatmap",
    presetOwners: [
      "custom",
      "gold"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/heatmap/HeatMap.jsx"
    ]
  },
  {
    variable: "heatmap-rename-dialog-cancel-border",
    category: "heatmap",
    presetOwners: [
      "custom",
      "gold"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js"
    ],
    consumers: [
      "variants/advanced/screens/heatmap/HeatMap.jsx"
    ]
  },
  {
    variable: "heatmap-rename-dialog-cancel-color",
    category: "heatmap",
    presetOwners: [
      "custom",
      "gold"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js"
    ],
    consumers: [
      "variants/advanced/screens/heatmap/HeatMap.jsx"
    ]
  },
  {
    variable: "heatmap-rename-dialog-field-bg",
    category: "heatmap",
    presetOwners: [
      "custom",
      "gold"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js"
    ],
    consumers: [
      "variants/advanced/screens/heatmap/AreaSettingsDialog.jsx"
    ]
  },
  {
    variable: "heatmap-rename-dialog-field-border",
    category: "heatmap",
    presetOwners: [
      "custom",
      "gold"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/heatmap/AreaSettingsDialog.jsx"
    ]
  },
  {
    variable: "heatmap-rename-dialog-field-text",
    category: "heatmap",
    presetOwners: [
      "custom",
      "gold"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/heatmap/AreaSettingsDialog.jsx"
    ]
  },
  {
    variable: "heatmap-rename-dialog-label-bg",
    category: "heatmap",
    presetOwners: [
      "custom",
      "gold"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js"
    ],
    consumers: []
  },
  {
    variable: "heatmap-rename-dialog-label-color",
    category: "heatmap",
    presetOwners: [
      "custom",
      "gold"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/heatmap/HeatMap.jsx"
    ]
  },
  {
    variable: "heatmap-rename-dialog-shadow",
    category: "heatmap",
    presetOwners: [
      "gold"
    ],
    writers: [
      "gold.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/heatmap/HeatMap.jsx"
    ]
  },
  {
    variable: "heatmap-rename-dialog-title-color",
    category: "heatmap",
    presetOwners: [
      "custom",
      "gold"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/heatmap/HeatMap.jsx"
    ]
  },
  {
    variable: "heatmap-select-menu-bg",
    category: "heatmap",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/heatmap/HeatmapControls.jsx",
      "variants/advanced/utils/scheduleSelectMenuProps.js"
    ]
  },
  {
    variable: "heatmap-select-menu-hover",
    category: "heatmap",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/heatmap/HeatmapControls.jsx"
    ]
  },
  {
    variable: "heatmap-select-menu-selected",
    category: "heatmap",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/heatmap/HeatmapControls.jsx"
    ]
  },
  {
    variable: "heatmap-select-menu-selected-hover",
    category: "heatmap",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/heatmap/HeatmapControls.jsx"
    ]
  },
  {
    variable: "heatmap-sidebar-loading-overlay-bg",
    category: "heatmap",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/heatmap/AreaSettingsDialog.jsx"
    ]
  },
  {
    variable: "heatmap-sidebar-loading-spinner-color",
    category: "heatmap",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/heatmap/AreaSettingsDialog.jsx"
    ]
  },
  {
    variable: "heatmap-sidebar-panel-bg",
    category: "heatmap",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/heatmap/AreaSettingsDialog.jsx"
    ]
  },
  {
    variable: "heatmap-sidebar-panel-border",
    category: "heatmap",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/heatmap/AreaSettingsDialog.jsx"
    ]
  },
  {
    variable: "heatmap-sidebar-panel-label",
    category: "heatmap",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/heatmap/AreaSettingsDialog.jsx"
    ]
  },
  {
    variable: "heatmap-sidebar-section-bg",
    category: "heatmap",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/heatmap/AreaSettingsDialog.jsx"
    ]
  },
  {
    variable: "heatmap-sidebar-section-label-bg",
    category: "heatmap",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/heatmap/AreaSettingsDialog.jsx"
    ]
  },
  {
    variable: "heatmap-sidebar-section-text",
    category: "heatmap",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/heatmap/AreaSettingsDialog.jsx"
    ]
  },
  {
    variable: "heatmap-tab-active-text",
    category: "heatmap",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/dashboard/Dashboard.jsx",
      "variants/advanced/screens/heatmap/HeatmapControls.jsx"
    ]
  },
  {
    variable: "heatmap-tab-inactive-text",
    category: "heatmap",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/dashboard/Dashboard.jsx",
      "variants/advanced/screens/heatmap/HeatmapControls.jsx",
      "variants/advanced/screens/settings/home/HomeComponent.jsx"
    ]
  },
  {
    variable: "heatmap-tab-indicator-bg",
    category: "heatmap",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/heatmap/HeatmapControls.jsx"
    ]
  },
  {
    variable: "heatmap-tab-pill-bg",
    category: "heatmap",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/dashboard/Dashboard.jsx",
      "variants/advanced/screens/heatmap/HeatmapControls.jsx",
      "variants/advanced/screens/lutronwebsite page/LutronPublicHome.jsx",
      "variants/advanced/screens/settings/home/HomeComponent.jsx"
    ]
  },
  {
    variable: "help-download-available-bg",
    category: "settings",
    presetOwners: [
      "custom",
      "gold"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/settings/help/GetHelp.jsx"
    ]
  },
  {
    variable: "help-download-available-border",
    category: "settings",
    presetOwners: [
      "custom",
      "gold"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/settings/help/GetHelp.jsx"
    ]
  },
  {
    variable: "help-download-available-hover-bg",
    category: "settings",
    presetOwners: [
      "custom",
      "gold"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/settings/help/GetHelp.jsx"
    ]
  },
  {
    variable: "help-download-available-text",
    category: "settings",
    presetOwners: [
      "custom",
      "gold"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/settings/help/GetHelp.jsx"
    ]
  },
  {
    variable: "help-download-unavailable-bg",
    category: "settings",
    presetOwners: [
      "custom",
      "gold"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js"
    ],
    consumers: [
      "variants/advanced/index.css"
    ]
  },
  {
    variable: "help-download-unavailable-border",
    category: "settings",
    presetOwners: [
      "custom",
      "gold"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/settings/help/GetHelp.jsx"
    ]
  },
  {
    variable: "help-download-unavailable-text",
    category: "settings",
    presetOwners: [
      "custom",
      "gold"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/settings/help/GetHelp.jsx"
    ]
  },
  {
    variable: "home-editor-text",
    category: "users",
    presetOwners: [
      "custom",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/index.css"
    ]
  },
  {
    variable: "home-field-border",
    category: "users",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/settings/home/HomeComponent.jsx"
    ]
  },
  {
    variable: "home-field-surface-bg",
    category: "users",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/settings/home/HomeComponent.jsx"
    ]
  },
  {
    variable: "home-tab-active-color",
    category: "users",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/activityReport/ActivityReport.jsx",
      "variants/advanced/screens/create-area-model/SelectAreaDialog.jsx",
      "variants/advanced/screens/lutronwebsite page/LutronPublicHome.jsx",
      "variants/advanced/screens/manageAreaGroup/ManageAreaGroup.jsx",
      "variants/advanced/screens/schedule/ScheduleComponent.jsx",
      "variants/advanced/screens/settings/Users/userSelectMenuProps.js",
      "variants/advanced/screens/settings/changetheme/ThemeChangeWithFofp.jsx",
      "variants/advanced/screens/settings/floor/CreateFloor.jsx",
      "variants/advanced/screens/settings/floor/EditFloor.jsx",
      "variants/advanced/screens/settings/help/CreateHelp.jsx",
      "variants/advanced/screens/settings/home/HomeComponent.jsx",
      "variants/advanced/screens/settings/renameWidget/RenameWidget.jsx",
      "variants/advanced/utils/scheduleSelectMenuProps.js"
    ]
  },
  {
    variable: "premium-border-subtle",
    category: "premium",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "premiumThemeTokens.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/utils/scheduleCreateStyles.js"
    ]
  },
  {
    variable: "premium-button-shadow",
    category: "premium",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "premiumThemeTokens.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/utils/scheduleCreateStyles.js"
    ]
  },
  {
    variable: "premium-button-shadow-hover",
    category: "premium",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "premiumThemeTokens.js"
    ],
    consumers: [
      "variants/advanced/index.css"
    ]
  },
  {
    variable: "premium-card-border",
    category: "premium",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "premiumThemeTokens.js"
    ],
    consumers: [
      "variants/advanced/config/themeConstants.js",
      "variants/advanced/utils/scheduleCreateStyles.js"
    ]
  },
  {
    variable: "premium-card-shadow",
    category: "premium",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "premiumThemeTokens.js"
    ],
    consumers: [
      "variants/advanced/components/TopbarComponent.jsx",
      "variants/advanced/config/themeConstants.js",
      "variants/advanced/index.css",
      "variants/advanced/utils/areaSizeLoadStyles.js",
      "variants/advanced/utils/scheduleCreateStyles.js"
    ]
  },
  {
    variable: "premium-dialog-shadow",
    category: "premium",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "premiumThemeTokens.js"
    ],
    consumers: [
      "variants/advanced/index.css"
    ]
  },
  {
    variable: "premium-easing",
    category: "premium",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "premiumThemeTokens.js"
    ],
    consumers: [
      "variants/advanced/index.css"
    ]
  },
  {
    variable: "premium-motion-fast",
    category: "premium",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "premiumThemeTokens.js"
    ],
    consumers: [
      "variants/advanced/index.css"
    ]
  },
  {
    variable: "premium-motion-normal",
    category: "premium",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "premiumThemeTokens.js"
    ],
    consumers: []
  },
  {
    variable: "premium-panel-shadow",
    category: "premium",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "premiumThemeTokens.js"
    ],
    consumers: [
      "variants/advanced/index.css"
    ]
  },
  {
    variable: "premium-radius-lg",
    category: "premium",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "premiumThemeTokens.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/utils/scheduleCreateStyles.js"
    ]
  },
  {
    variable: "premium-radius-md",
    category: "premium",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "premiumThemeTokens.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/utils/scheduleCreateStyles.js"
    ]
  },
  {
    variable: "premium-radius-sm",
    category: "premium",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "premiumThemeTokens.js"
    ],
    consumers: []
  },
  {
    variable: "quick-control-page-text",
    category: "schedule",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme3.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/utils/quickControlTheme.js"
    ]
  },
  {
    variable: "quick-control-radio-border",
    category: "schedule",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/utils/quickControlTheme.js"
    ]
  },
  {
    variable: "quick-control-radio-checked-fill",
    category: "schedule",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/utils/quickControlTheme.js"
    ]
  },
  {
    variable: "quick-control-radio-unchecked-fill",
    category: "schedule",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/utils/quickControlTheme.js"
    ]
  },
  {
    variable: "schedule-event-active-bg",
    category: "schedule",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/schedule/ScheduleComponent.jsx"
    ]
  },
  {
    variable: "schedule-event-active-text",
    category: "schedule",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/schedule/ScheduleComponent.jsx"
    ]
  },
  {
    variable: "schedule-grid-bg",
    category: "schedule",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/schedule/ScheduleComponent.jsx"
    ]
  },
  {
    variable: "schedule-modal-bg",
    category: "schedule",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/quickcontrols/CreateQuickControl.jsx",
      "variants/advanced/screens/quickcontrols/QuickControlDetails.jsx",
      "variants/advanced/screens/quickcontrols/QuickControls.jsx",
      "variants/advanced/screens/schedule/AddEvent.jsx",
      "variants/advanced/screens/schedule/ScheduleDetails.jsx"
    ]
  },
  {
    variable: "schedule-modal-body-text",
    category: "schedule",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/quickcontrols/Action.jsx",
      "variants/advanced/utils/quickControlTheme.js"
    ]
  },
  {
    variable: "schedule-modal-item-selected-bg",
    category: "schedule",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/quickcontrols/Action.jsx",
      "variants/advanced/utils/scheduleSelectMenuProps.js"
    ]
  },
  {
    variable: "schedule-modal-item-selected-text",
    category: "schedule",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/quickcontrols/Action.jsx",
      "variants/advanced/utils/scheduleSelectMenuProps.js"
    ]
  },
  {
    variable: "schedule-modal-muted-text",
    category: "schedule",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/screens/quickcontrols/Action.jsx",
      "variants/advanced/screens/schedule/ScheduleDetails.jsx",
      "variants/advanced/utils/quickControlTheme.js"
    ]
  },
  {
    variable: "schedule-modal-section-label-color",
    category: "schedule",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/screens/quickcontrols/Action.jsx"
    ]
  },
  {
    variable: "schedule-modal-title-color",
    category: "schedule",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/quickcontrols/CreateQuickControl.jsx",
      "variants/advanced/screens/quickcontrols/QuickControlDetails.jsx",
      "variants/advanced/screens/quickcontrols/QuickControls.jsx",
      "variants/advanced/screens/schedule/AddEvent.jsx",
      "variants/advanced/screens/schedule/ScheduleDetails.jsx"
    ]
  },
  {
    variable: "schedule-page-heading-text",
    category: "schedule",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/schedule/ScheduleComponent.jsx",
      "variants/advanced/screens/schedule/ScheduleDetails.jsx"
    ]
  },
  {
    variable: "schedule-panel-bg",
    category: "schedule",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/utils/scheduleCreateStyles.js"
    ]
  },
  {
    variable: "schedule-panel-border",
    category: "schedule",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/create-area-model/SelectAreaDialog.jsx",
      "variants/advanced/screens/quickcontrols/AreaTreeDialog.jsx",
      "variants/advanced/screens/quickcontrols/QuickControlDetails.jsx",
      "variants/advanced/screens/schedule/ScheduleComponent.jsx",
      "variants/advanced/screens/schedule/ScheduleDetails.jsx",
      "variants/advanced/utils/scheduleCreateStyles.js",
      "variants/advanced/utils/scheduleSelectMenuProps.js"
    ]
  },
  {
    variable: "schedule-panel-label",
    category: "schedule",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/utils/scheduleCreateStyles.js"
    ]
  },
  {
    variable: "schedule-panel-muted-text",
    category: "schedule",
    presetOwners: [
      "consumerOnly"
    ],
    writers: [],
    consumers: [
      "variants/advanced/screens/quickcontrols/QuickControlDetails.jsx"
    ]
  },
  {
    variable: "schedule-section-bg",
    category: "schedule",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/schedule/ScheduleDetails.jsx",
      "variants/advanced/utils/scheduleCreateStyles.js"
    ]
  },
  {
    variable: "schedule-section-text",
    category: "schedule",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/utils/scheduleCreateStyles.js"
    ]
  },
  {
    variable: "schedule-select-bg",
    category: "schedule",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/quickcontrols/QuickControlDetails.jsx",
      "variants/advanced/screens/schedule/ScheduleComponent.jsx",
      "variants/advanced/screens/schedule/ScheduleDetails.jsx",
      "variants/advanced/utils/scheduleCreateStyles.js",
      "variants/advanced/utils/scheduleSelectMenuProps.js"
    ]
  },
  {
    variable: "schedule-select-menu-bg",
    category: "schedule",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/utils/scheduleSelectMenuProps.js"
    ]
  },
  {
    variable: "schedule-select-menu-hover",
    category: "schedule",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/utils/scheduleSelectMenuProps.js"
    ]
  },
  {
    variable: "schedule-select-menu-selected-hover",
    category: "schedule",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/utils/scheduleSelectMenuProps.js"
    ]
  },
  {
    variable: "schedule-select-menu-text",
    category: "schedule",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/utils/scheduleSelectMenuProps.js"
    ]
  },
  {
    variable: "schedule-select-text",
    category: "schedule",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/quickcontrols/Action.jsx",
      "variants/advanced/screens/schedule/ScheduleComponent.jsx",
      "variants/advanced/screens/schedule/ScheduleDetails.jsx",
      "variants/advanced/utils/scheduleSelectMenuProps.js"
    ]
  },
  {
    variable: "schedule-status-text",
    category: "schedule",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/schedule/ScheduleComponent.jsx"
    ]
  },
  {
    variable: "schedule-today-bg",
    category: "schedule",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/schedule/ScheduleComponent.jsx"
    ]
  },
  {
    variable: "schedule-today-text",
    category: "schedule",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/schedule/ScheduleComponent.jsx"
    ]
  },
  {
    variable: "settings-color-swatch-selected-stroke",
    category: "settings",
    presetOwners: [
      "custom",
      "gold",
      "theme3"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js"
    ],
    consumers: [
      "variants/advanced/utils/HexColorPicker.jsx"
    ]
  },
  {
    variable: "settings-form-control-bg",
    category: "settings",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/settings/floor/CreateFloor.jsx",
      "variants/advanced/screens/settings/floor/EditFloor.jsx"
    ]
  },
  {
    variable: "settings-form-control-text",
    category: "settings",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/settings/floor/CreateFloor.jsx",
      "variants/advanced/screens/settings/floor/EditFloor.jsx"
    ]
  },
  {
    variable: "settings-form-label-color",
    category: "settings",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/settings/floor/CreateFloor.jsx",
      "variants/advanced/screens/settings/floor/EditFloor.jsx"
    ]
  },
  {
    variable: "settings-form-section-bg",
    category: "settings",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/settings/floor/CreateFloor.jsx",
      "variants/advanced/screens/settings/floor/EditFloor.jsx"
    ]
  },
  {
    variable: "settings-panel-border",
    category: "settings",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme3.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/area-size-load/AreaSizeLoad.jsx",
      "variants/advanced/screens/settings/SettingsLayout.jsx",
      "variants/advanced/screens/settings/changetheme/ThemeChangeWithFofp.jsx",
      "variants/advanced/screens/settings/floor/EditFloor.jsx",
      "variants/advanced/screens/settings/floor/floorToolStyles.js",
      "variants/advanced/screens/settings/help/CreateHelp.jsx",
      "variants/advanced/styles/HexColorPicker.css"
    ]
  },
  {
    variable: "settings-panel-button-bg",
    category: "settings",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/screens/settings/renameWidget/RenameWidget.jsx"
    ]
  },
  {
    variable: "settings-panel-button-text",
    category: "settings",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/screens/settings/fofp/fofpSettingsUi.js",
      "variants/advanced/screens/settings/help/CreateHelp.jsx",
      "variants/advanced/screens/settings/renameWidget/RenameWidget.jsx"
    ]
  },
  {
    variable: "settings-panel-inner-bg",
    category: "settings",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/config/themeConstants.js",
      "variants/advanced/index.css",
      "variants/advanced/screens/settings/SettingsLayout.jsx",
      "variants/advanced/screens/settings/floor/EditFloor.jsx",
      "variants/advanced/screens/settings/floor/floorToolStyles.js",
      "variants/advanced/screens/settings/fofp/fofpSettingsUi.js",
      "variants/advanced/screens/settings/help/CreateHelp.jsx",
      "variants/advanced/screens/settings/home/HomeComponent.jsx"
    ]
  },
  {
    variable: "settings-panel-muted-text",
    category: "settings",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/create-area-model/SelectAreaDialog.jsx",
      "variants/advanced/screens/settings/Users/CreateUser.jsx",
      "variants/advanced/screens/settings/Users/UpdateUser.jsx",
      "variants/advanced/screens/settings/Users/userSelectMenuProps.js",
      "variants/advanced/screens/settings/alerts/AlertsComponent.jsx",
      "variants/advanced/screens/settings/changetheme/ThemeChangeWithFofp.jsx",
      "variants/advanced/screens/settings/floor/floorToolStyles.js",
      "variants/advanced/screens/settings/fofp/FOFPComponent.jsx",
      "variants/advanced/screens/settings/help/CreateHelp.jsx",
      "variants/advanced/screens/settings/processors/AddByIpDialog.jsx",
      "variants/advanced/screens/settings/renameWidget/RenameWidget.jsx",
      "variants/advanced/utils/FeedbackUI.jsx",
      "variants/advanced/utils/areaSizeLoadStyles.js"
    ]
  },
  {
    variable: "settings-panel-outer-bg",
    category: "settings",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/config/themeConstants.js",
      "variants/advanced/index.css",
      "variants/advanced/screens/manageAreaGroup/ManageAreaGroup.jsx",
      "variants/advanced/screens/settings/SettingsLayout.jsx",
      "variants/advanced/screens/settings/changetheme/ThemeChangeWithFofp.jsx",
      "variants/advanced/screens/settings/floor/CreateFloor.jsx",
      "variants/advanced/screens/settings/floor/EditFloor.jsx",
      "variants/advanced/screens/settings/fofp/fofpSettingsUi.js"
    ]
  },
  {
    variable: "settings-panel-text",
    category: "settings",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme3.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/create-area-model/SelectAreaDialog.jsx",
      "variants/advanced/screens/emailServer/EmailServer.jsx",
      "variants/advanced/screens/manageAreaGroup/CreateAreaGroup.jsx",
      "variants/advanced/screens/manageAreaGroup/ManageAreaGroup.jsx",
      "variants/advanced/screens/manageAreaGroup/UpdateAreaGroup.jsx",
      "variants/advanced/screens/settings/Users/CreateUser.jsx",
      "variants/advanced/screens/settings/Users/UpdateUser.jsx",
      "variants/advanced/screens/settings/Users/userSelectMenuProps.js",
      "variants/advanced/screens/settings/changetheme/ThemeChangeWithFofp.jsx",
      "variants/advanced/screens/settings/floor/CreateFloor.jsx",
      "variants/advanced/screens/settings/floor/EditFloor.jsx",
      "variants/advanced/screens/settings/floor/FloorComponent.jsx",
      "variants/advanced/screens/settings/floor/ProcessorSelectionDialog.jsx",
      "variants/advanced/screens/settings/floor/floorToolStyles.js",
      "variants/advanced/screens/settings/fofp/FOFPComponent.jsx",
      "variants/advanced/screens/settings/fofp/fofpSettingsUi.js",
      "variants/advanced/screens/settings/help/CreateHelp.jsx",
      "variants/advanced/screens/settings/processors/AddByIpDialog.jsx",
      "variants/advanced/screens/settings/processors/processorsTableStyles.js",
      "variants/advanced/screens/settings/renameWidget/RenameWidget.jsx",
      "variants/advanced/styles/HexColorPicker.css",
      "variants/advanced/utils/FeedbackUI.jsx",
      "variants/advanced/utils/areaSizeLoadStyles.js"
    ]
  },
  {
    variable: "settings-sidebar-active-bg",
    category: "settings",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme3.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/index.css"
    ]
  },
  {
    variable: "settings-sidebar-active-font-weight",
    category: "typography",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "settingsSidebarTabStyles.js"
    ],
    consumers: [
      "variants/advanced/index.css"
    ]
  },
  {
    variable: "settings-sidebar-active-text",
    category: "settings",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/components/SettingsSidebarNav.jsx",
      "variants/advanced/index.css"
    ]
  },
  {
    variable: "settings-sidebar-font-family",
    category: "typography",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "settingsSidebarTabStyles.js"
    ],
    consumers: [
      "variants/advanced/index.css"
    ]
  },
  {
    variable: "settings-sidebar-font-size",
    category: "typography",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "settingsSidebarTabStyles.js"
    ],
    consumers: [
      "variants/advanced/index.css"
    ]
  },
  {
    variable: "settings-sidebar-font-style",
    category: "typography",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "settingsSidebarTabStyles.js"
    ],
    consumers: [
      "variants/advanced/index.css"
    ]
  },
  {
    variable: "settings-sidebar-font-weight",
    category: "typography",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "settingsSidebarTabStyles.js"
    ],
    consumers: [
      "variants/advanced/index.css"
    ]
  },
  {
    variable: "settings-sidebar-hover-bg",
    category: "settings",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/index.css"
    ]
  },
  {
    variable: "settings-sidebar-letter-spacing",
    category: "typography",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "settingsSidebarTabStyles.js"
    ],
    consumers: [
      "variants/advanced/index.css"
    ]
  },
  {
    variable: "settings-sidebar-line-height",
    category: "typography",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "settingsSidebarTabStyles.js"
    ],
    consumers: [
      "variants/advanced/index.css"
    ]
  },
  {
    variable: "settings-sidebar-text",
    category: "settings",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/components/SettingsSidebarNav.jsx",
      "variants/advanced/index.css"
    ]
  },
  {
    variable: "settings-sidebar-title-color",
    category: "settings",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/index.css"
    ]
  },
  {
    variable: "settings-sidebar-title-font-size",
    category: "typography",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "settingsSidebarTabStyles.js"
    ],
    consumers: [
      "variants/advanced/index.css"
    ]
  },
  {
    variable: "settings-sidebar-title-font-weight",
    category: "typography",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "settingsSidebarTabStyles.js"
    ],
    consumers: [
      "variants/advanced/index.css"
    ]
  },
  {
    variable: "settings-theme-action-button-bg",
    category: "settings",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js",
      "theme3.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/index.css"
    ]
  },
  {
    variable: "settings-theme-action-button-text",
    category: "settings",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js",
      "theme3.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/index.css"
    ]
  },
  {
    variable: "settings-theme-card-bg",
    category: "settings",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/settings/changetheme/ThemeChangeWithFofp.jsx",
      "variants/advanced/screens/settings/changetheme/themePickerLayout.js",
      "variants/advanced/styles/HexColorPicker.css"
    ]
  },
  {
    variable: "settings-theme-dialog-bg",
    category: "settings",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/settings/fofp/FOFPComponent.jsx"
    ]
  },
  {
    variable: "settings-theme-pill-active-bg",
    category: "settings",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js",
      "theme3.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/index.css"
    ]
  },
  {
    variable: "settings-theme-pill-active-text",
    category: "settings",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "gold.js",
      "theme3.js",
      "theme4.js"
    ],
    consumers: [
      "variants/advanced/index.css"
    ]
  },
  {
    variable: "settings-theme-pill-inactive-border",
    category: "settings",
    presetOwners: [
      "custom",
      "theme3"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3.js"
    ],
    consumers: [
      "variants/advanced/index.css"
    ]
  },
  {
    variable: "topbar-nav-active-text",
    category: "navigation",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme3.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/components/TopbarComponent.jsx",
      "variants/advanced/index.css"
    ]
  },
  {
    variable: "topbar-nav-inactive-text",
    category: "navigation",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme3.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/components/TopbarComponent.jsx",
      "variants/advanced/index.css"
    ]
  },
  {
    variable: "topbar-nav-pill-bg",
    category: "navigation",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme3.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/components/TopbarComponent.jsx"
    ]
  },
  {
    variable: "topbar-nav-pill-shadow",
    category: "navigation",
    presetOwners: [
      "custom",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "premiumThemeTokens.js"
    ],
    consumers: [
      "variants/advanced/components/TopbarComponent.jsx"
    ]
  },
  {
    variable: "topbar-navbar-background",
    category: "navigation",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "theme4.js",
      "applyAdvancedCssVariables.js"
    ],
    consumers: []
  },
  {
    variable: "topbar-profile-menu-bg",
    category: "navigation",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme3.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/components/TopbarComponent.jsx",
      "variants/advanced/index.css"
    ]
  },
  {
    variable: "topbar-profile-menu-border",
    category: "navigation",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme3.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/components/TopbarComponent.jsx",
      "variants/advanced/index.css"
    ]
  },
  {
    variable: "topbar-profile-menu-hover-bg",
    category: "navigation",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme3.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/components/TopbarComponent.jsx",
      "variants/advanced/index.css"
    ]
  },
  {
    variable: "topbar-profile-menu-icon",
    category: "navigation",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme3.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/components/TopbarComponent.jsx"
    ]
  },
  {
    variable: "topbar-profile-menu-text",
    category: "navigation",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme3.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/components/TopbarComponent.jsx",
      "variants/advanced/index.css"
    ]
  },
  {
    variable: "topbar-profile-trigger-text",
    category: "navigation",
    presetOwners: [
      "custom"
    ],
    writers: [
      "dynamicThemeTokens.js"
    ],
    consumers: [
      "variants/advanced/components/TopbarComponent.jsx",
      "variants/advanced/index.css"
    ]
  },
  {
    variable: "users-border",
    category: "users",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/create-area-model/SelectAreaDialog.jsx",
      "variants/advanced/screens/settings/Users/CreateUser.jsx",
      "variants/advanced/screens/settings/Users/UpdateUser.jsx",
      "variants/advanced/screens/settings/Users/UsersComponent.jsx",
      "variants/advanced/screens/settings/Users/userSelectMenuProps.js",
      "variants/advanced/screens/settings/floor/CreateFloor.jsx",
      "variants/advanced/screens/settings/floor/FloorComponent.jsx",
      "variants/advanced/screens/settings/floor/ProcessorSelectionDialog.jsx",
      "variants/advanced/screens/settings/fofp/FOFPComponent.jsx",
      "variants/advanced/screens/settings/fofp/fofpSettingsUi.js",
      "variants/advanced/screens/settings/help/CreateHelp.jsx",
      "variants/advanced/screens/settings/processors/AddByIpDialog.jsx",
      "variants/advanced/screens/settings/processors/ProcessorsSettings.jsx",
      "variants/advanced/screens/settings/renameWidget/RenameWidget.jsx",
      "variants/advanced/utils/FeedbackUI.jsx",
      "variants/advanced/utils/areaSizeLoadStyles.js"
    ]
  },
  {
    variable: "users-chip-bg",
    category: "users",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/settings/Users/UsersComponent.jsx",
      "variants/advanced/screens/settings/floor/CreateFloor.jsx",
      "variants/advanced/screens/settings/floor/EditFloor.jsx",
      "variants/advanced/screens/settings/help/CreateHelp.jsx"
    ]
  },
  {
    variable: "users-confirm-dialog-bg",
    category: "users",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/utils/FeedbackUI.jsx"
    ]
  },
  {
    variable: "users-input-bg",
    category: "users",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/create-area-model/SelectAreaDialog.jsx",
      "variants/advanced/screens/settings/Users/CreateUser.jsx",
      "variants/advanced/screens/settings/Users/UpdateUser.jsx",
      "variants/advanced/screens/settings/Users/userSelectMenuProps.js",
      "variants/advanced/screens/settings/changetheme/ThemeChangeWithFofp.jsx",
      "variants/advanced/screens/settings/floor/CreateFloor.jsx",
      "variants/advanced/screens/settings/floor/EditFloor.jsx",
      "variants/advanced/screens/settings/floor/ProcessorSelectionDialog.jsx",
      "variants/advanced/screens/settings/help/CreateHelp.jsx",
      "variants/advanced/screens/settings/processors/AddByIpDialog.jsx",
      "variants/advanced/screens/settings/renameWidget/RenameWidget.jsx",
      "variants/advanced/styles/HexColorPicker.css",
      "variants/advanced/utils/FeedbackUI.jsx"
    ]
  },
  {
    variable: "users-input-label-text",
    category: "users",
    presetOwners: [
      "custom"
    ],
    writers: [
      "dynamicThemeTokens.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/settings/Users/userSelectMenuProps.js"
    ]
  },
  {
    variable: "users-input-placeholder-text",
    category: "users",
    presetOwners: [
      "custom"
    ],
    writers: [
      "dynamicThemeTokens.js"
    ],
    consumers: [
      "variants/advanced/screens/settings/Users/userSelectMenuProps.js"
    ]
  },
  {
    variable: "users-input-text",
    category: "users",
    presetOwners: [
      "custom"
    ],
    writers: [
      "dynamicThemeTokens.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/settings/Users/userSelectMenuProps.js"
    ]
  },
  {
    variable: "users-modal-bg",
    category: "users",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/settings/Users/CreateUser.jsx",
      "variants/advanced/screens/settings/Users/UpdateUser.jsx"
    ]
  },
  {
    variable: "users-modal-info-bg",
    category: "users",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/settings/Users/CreateUser.jsx",
      "variants/advanced/screens/settings/Users/UpdateUser.jsx"
    ]
  },
  {
    variable: "users-modal-inner-bg",
    category: "users",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/settings/Users/CreateUser.jsx",
      "variants/advanced/screens/settings/Users/UpdateUser.jsx"
    ]
  },
  {
    variable: "users-readonly-field-bg",
    category: "users",
    presetOwners: [
      "custom"
    ],
    writers: [
      "dynamicThemeTokens.js"
    ],
    consumers: [
      "variants/advanced/screens/settings/Users/userSelectMenuProps.js"
    ]
  },
  {
    variable: "users-readonly-field-text",
    category: "users",
    presetOwners: [
      "custom"
    ],
    writers: [
      "dynamicThemeTokens.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/settings/Users/userSelectMenuProps.js"
    ]
  },
  {
    variable: "users-select-menu-bg",
    category: "users",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/settings/Users/userSelectMenuProps.js",
      "variants/advanced/screens/settings/fofp/fofpSettingsUi.js",
      "variants/advanced/screens/settings/renameWidget/RenameWidget.jsx"
    ]
  },
  {
    variable: "users-select-menu-hover",
    category: "users",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/index.css",
      "variants/advanced/screens/settings/Users/userSelectMenuProps.js",
      "variants/advanced/screens/settings/fofp/fofpSettingsUi.js",
      "variants/advanced/screens/settings/help/CreateHelp.jsx"
    ]
  },
  {
    variable: "users-table-container-bg",
    category: "users",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/area-size-load/AreaSizeLoad.jsx",
      "variants/advanced/screens/settings/Users/UsersComponent.jsx",
      "variants/advanced/screens/settings/floor/FloorComponent.jsx",
      "variants/advanced/screens/settings/processors/ProcessorsSettings.jsx",
      "variants/advanced/utils/areaSizeLoadStyles.js"
    ]
  },
  {
    variable: "users-table-head-bg",
    category: "users",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/settings/Users/UsersComponent.jsx",
      "variants/advanced/screens/settings/floor/FloorComponent.jsx",
      "variants/advanced/screens/settings/processors/processorsTableStyles.js",
      "variants/advanced/utils/areaSizeLoadStyles.js"
    ]
  },
  {
    variable: "users-table-row-alt-bg",
    category: "users",
    presetOwners: [
      "consumerOnly"
    ],
    writers: [],
    consumers: [
      "variants/advanced/utils/areaSizeLoadStyles.js"
    ]
  },
  {
    variable: "users-table-row-bg",
    category: "users",
    presetOwners: [
      "custom",
      "default",
      "gold",
      "theme3",
      "theme4"
    ],
    writers: [
      "dynamicThemeTokens.js",
      "theme3PageChrome.js",
      "gold.js",
      "theme4.js",
      "defaultSlate.js"
    ],
    consumers: [
      "variants/advanced/screens/settings/Users/UsersComponent.jsx",
      "variants/advanced/screens/settings/floor/FloorComponent.jsx",
      "variants/advanced/screens/settings/processors/AddByIpDialog.jsx",
      "variants/advanced/screens/settings/processors/ProcessorsSettings.jsx"
    ]
  }
]
);

const entriesByVariable = new Map(
  THEME_REGISTRY_ENTRIES.map((entry) => [entry.variable, entry])
);

const entriesByCategory = THEME_REGISTRY_ENTRIES.reduce((acc, entry) => {
  if (!acc[entry.category]) acc[entry.category] = [];
  acc[entry.category].push(entry);
  return acc;
}, /** @type {Record<string, typeof THEME_REGISTRY_ENTRIES>} */ ({}));

const entriesByPreset = THEME_REGISTRY_PRESETS.reduce((acc, preset) => {
  acc[preset] = THEME_REGISTRY_ENTRIES.filter((entry) =>
    entry.presetOwners.includes(preset)
  );
  return acc;
}, /** @type {Record<string, typeof THEME_REGISTRY_ENTRIES>} */ ({}));

/**
 * @param {string} category
 * @returns {ReadonlyArray<typeof THEME_REGISTRY_ENTRIES[number]>}
 */
export function getVariablesByCategory(category) {
  return Object.freeze(entriesByCategory[category] ?? []);
}

/**
 * @param {string} preset
 * @returns {ReadonlyArray<typeof THEME_REGISTRY_ENTRIES[number]>}
 */
export function getVariablesByPreset(preset) {
  return Object.freeze(entriesByPreset[preset] ?? []);
}

/**
 * @param {string} variable CSS variable name without leading `--`
 * @returns {{ variable: string, category: string, presetOwners: string[], writers: string[], consumers: string[] } | undefined}
 */
export function getVariableOwners(variable) {
  const key = String(variable).replace(/^--/, "");
  return entriesByVariable.get(key);
}

/** @returns {ReadonlyArray<string>} */
export function getAllRegistryVariableNames() {
  return Object.freeze(THEME_REGISTRY_ENTRIES.map((entry) => entry.variable));
}

/** @returns {ReadonlyArray<string>} */
export function getRegistryWriterVariableNames() {
  return Object.freeze(
    THEME_REGISTRY_ENTRIES.filter((entry) => entry.writers.length > 0).map(
      (entry) => entry.variable
    )
  );
}

export function validateThemeRegistryManifest() {
  const errors = [];
  const seen = new Set();

  for (const entry of THEME_REGISTRY_ENTRIES) {
    if (seen.has(entry.variable)) {
      errors.push(`Duplicate registry entry: ${entry.variable}`);
    }
    seen.add(entry.variable);

    if (!THEME_REGISTRY_CATEGORIES.includes(entry.category)) {
      errors.push(`Unknown category for ${entry.variable}: ${entry.category}`);
    }

    for (const preset of entry.presetOwners) {
      if (!THEME_REGISTRY_PRESETS.includes(preset)) {
        errors.push(`Unknown preset owner for ${entry.variable}: ${preset}`);
      }
    }

    for (const writer of entry.writers) {
      if (!THEME_REGISTRY_WRITERS.includes(writer)) {
        errors.push(`Unknown writer for ${entry.variable}: ${writer}`);
      }
    }
  }

  for (const writer of THEME_REGISTRY_WRITERS) {
    const covered = THEME_REGISTRY_ENTRIES.some((entry) => entry.writers.includes(writer));
    if (!covered) {
      errors.push(`Writer not represented in registry: ${writer}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

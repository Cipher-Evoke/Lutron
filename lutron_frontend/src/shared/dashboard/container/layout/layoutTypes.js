export const ENERGY_LAYOUT_MODES = {
  DYNAMIC_ROWS: 'dynamic-rows',
  FIXED_GRID: 'fixed-grid',
  SORTABLE_GRID: 'sortable-grid',
};

export const WIDGET_SHELL_TYPES = {
  NONE: 'none',
  METRIC_PANEL: 'metric-panel',
  COMPACT_PANEL: 'compact-panel',
};

export const ENERGY_SLOT_KINDS = {
  WIDGET: 'widget',
  CUSTOM: 'custom',
};

export const DASHBOARD_SECTION_IDS = {
  OVERVIEW: 'overview',
  ENERGY: 'energy',
  ALERTS: 'alerts',
  CHARTS: 'charts',
};

export const DASHBOARD_TAB_IDS = {
  ...DASHBOARD_SECTION_IDS,
  SPACE_UTILIZATION: 'space-utilization',
};

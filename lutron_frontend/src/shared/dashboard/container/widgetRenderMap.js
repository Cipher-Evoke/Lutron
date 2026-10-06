import { OVERVIEW_TILE_TYPES } from '../widgets/overview/overviewTileTypes';

export const WIDGET_SECTIONS = {
  OVERVIEW: 'overview',
  ENERGY: 'energy',
};

export const WIDGET_RENDERER_TYPES = {
  UNIFIED_ENERGY: 'unified_energy',
  SAVINGS_BY_STRATEGY: 'savings_by_strategy',
  TOTAL_CONSUMPTION_BY_GROUP: 'total_consumption_by_group',
  LIGHT_POWER_DENSITY: 'light_power_density',
  PEAK_MIN_CONSUMPTION: 'peak_min_consumption',
  OVERVIEW_TILE: 'overview_tile',
  OVERVIEW_ALERTS: 'overview_alerts',
};

export const DASHBOARD_WIDGET_RENDER_MAP = {
  energy: {
    key: 'energy',
    type: WIDGET_RENDERER_TYPES.OVERVIEW_TILE,
    section: WIDGET_SECTIONS.OVERVIEW,
    tileType: OVERVIEW_TILE_TYPES.ENERGY,
    variants: ['basic', 'advanced', 'customized'],
  },
  alerts: {
    key: 'alerts',
    type: WIDGET_RENDERER_TYPES.OVERVIEW_ALERTS,
    section: WIDGET_SECTIONS.OVERVIEW,
    variants: ['basic', 'advanced', 'customized'],
  },
  schedules: {
    key: 'schedules',
    type: WIDGET_RENDERER_TYPES.OVERVIEW_TILE,
    section: WIDGET_SECTIONS.OVERVIEW,
    tileType: OVERVIEW_TILE_TYPES.SCHEDULES,
    variants: ['basic', 'advanced', 'customized'],
  },
  quick_controls: {
    key: 'quick_controls',
    type: WIDGET_RENDERER_TYPES.OVERVIEW_TILE,
    section: WIDGET_SECTIONS.OVERVIEW,
    tileType: OVERVIEW_TILE_TYPES.QUICK_CONTROLS,
    variants: ['basic', 'advanced', 'customized'],
  },
  floors: {
    key: 'floors',
    type: WIDGET_RENDERER_TYPES.OVERVIEW_TILE,
    section: WIDGET_SECTIONS.OVERVIEW,
    tileType: OVERVIEW_TILE_TYPES.FLOORS,
    variants: ['basic', 'advanced', 'customized'],
  },
  space_utilization: {
    key: 'space_utilization',
    type: WIDGET_RENDERER_TYPES.OVERVIEW_TILE,
    section: WIDGET_SECTIONS.OVERVIEW,
    tileType: OVERVIEW_TILE_TYPES.SPACE_UTILIZATION,
    variants: ['basic', 'advanced', 'customized'],
  },
  consumption: {
    key: 'consumption',
    type: WIDGET_RENDERER_TYPES.UNIFIED_ENERGY,
    section: WIDGET_SECTIONS.ENERGY,
    energyMode: 'consumption',
    variants: ['basic', 'advanced', 'customized'],
  },
  savings: {
    key: 'savings',
    type: WIDGET_RENDERER_TYPES.UNIFIED_ENERGY,
    section: WIDGET_SECTIONS.ENERGY,
    energyMode: 'savings',
    variants: ['basic', 'advanced', 'customized'],
  },
  savings_by_strategy: {
    key: 'savings_by_strategy',
    type: WIDGET_RENDERER_TYPES.SAVINGS_BY_STRATEGY,
    section: WIDGET_SECTIONS.ENERGY,
    variants: ['basic', 'advanced', 'customized'],
  },
  total_consumption_by_group: {
    key: 'total_consumption_by_group',
    type: WIDGET_RENDERER_TYPES.TOTAL_CONSUMPTION_BY_GROUP,
    section: WIDGET_SECTIONS.ENERGY,
    variants: ['basic', 'advanced', 'customized'],
  },
  light_power_density: {
    key: 'light_power_density',
    type: WIDGET_RENDERER_TYPES.LIGHT_POWER_DENSITY,
    section: WIDGET_SECTIONS.ENERGY,
    variants: ['basic', 'advanced', 'customized'],
  },
  peak_and_minimum_consumption: {
    key: 'peak_and_minimum_consumption',
    type: WIDGET_RENDERER_TYPES.PEAK_MIN_CONSUMPTION,
    section: WIDGET_SECTIONS.ENERGY,
    variants: ['basic', 'advanced', 'customized'],
  },
};

export const SUPPORTED_DASHBOARD_WIDGET_RENDERER_KEYS = Object.keys(
  DASHBOARD_WIDGET_RENDER_MAP
);

export function getWidgetRenderMapEntry(widgetKey) {
  if (!widgetKey) return null;
  return DASHBOARD_WIDGET_RENDER_MAP[widgetKey] || null;
}

export function isSupportedDashboardWidgetRendererKey(widgetKey) {
  return Boolean(getWidgetRenderMapEntry(widgetKey));
}

export function isWidgetRendererSupportedForVariant(widgetKey, variant) {
  const entry = getWidgetRenderMapEntry(widgetKey);
  if (!entry) return false;
  return entry.variants.includes(variant);
}

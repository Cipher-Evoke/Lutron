export const SPACE_WIDGET_RENDERER_TYPES = {
  LINE_CHART: 'line_chart',
  STACKED_BAR_CHART: 'stacked_bar_chart',
  INSTANT_OCCUPANCY_CHART: 'instant_occupancy_chart',
  PEAK_MIN_CARDS: 'peak_min_cards',
  UTILIZATION_BY_AREA_LIST: 'utilization_by_area_list',
};

export const SPACE_WIDGET_RENDER_MAP = {
  utilization: {
    key: 'utilization',
    type: SPACE_WIDGET_RENDERER_TYPES.LINE_CHART,
    variants: ['basic', 'advanced', 'customized'],
  },
  utilization_by_area_group: {
    key: 'utilization_by_area_group',
    type: SPACE_WIDGET_RENDERER_TYPES.STACKED_BAR_CHART,
    variants: ['basic', 'advanced', 'customized'],
  },
  utilization_by_area: {
    key: 'utilization_by_area',
    type: SPACE_WIDGET_RENDERER_TYPES.UTILIZATION_BY_AREA_LIST,
    variants: ['basic', 'advanced', 'customized'],
  },
  instant_occupancy_count: {
    key: 'instant_occupancy_count',
    type: SPACE_WIDGET_RENDERER_TYPES.INSTANT_OCCUPANCY_CHART,
    variants: ['basic', 'advanced', 'customized'],
  },
  peak_and_minimum_utilization: {
    key: 'peak_and_minimum_utilization',
    type: SPACE_WIDGET_RENDERER_TYPES.PEAK_MIN_CARDS,
    variants: ['basic', 'advanced', 'customized'],
  },
};

export const SUPPORTED_SPACE_WIDGET_RENDERER_KEYS = Object.keys(SPACE_WIDGET_RENDER_MAP);

export function getSpaceWidgetRenderMapEntry(widgetKey) {
  if (!widgetKey) return null;
  return SPACE_WIDGET_RENDER_MAP[widgetKey] || null;
}

export function isSupportedSpaceWidgetRendererKey(widgetKey) {
  return Boolean(getSpaceWidgetRenderMapEntry(widgetKey));
}

export function isSpaceWidgetRendererSupportedForVariant(widgetKey, variant) {
  const entry = getSpaceWidgetRenderMapEntry(widgetKey);
  if (!entry) return false;
  return entry.variants.includes(variant);
}

import {
  SPACE_LAYOUT_MODES,
  SPACE_SECTION_TYPES,
  SPACE_SLOT_KINDS,
  SPACE_CUSTOM_SLOT_IDS,
} from './spaceLayoutTypes';

export const BASIC_SPACE_LAYOUT_MODE = SPACE_LAYOUT_MODES.DYNAMIC_ROWS;

export const BASIC_SPACE_SLOT_REGISTRY = {
  instant_occupancy_count: {
    kind: SPACE_SLOT_KINDS.WIDGET,
    widgetKey: 'instant_occupancy_count',
    selectorMode: 'active',
  },
  [SPACE_CUSTOM_SLOT_IDS.INSTANT_UTILIZATION_COMBINED]: {
    kind: SPACE_SLOT_KINDS.CUSTOM,
  },
  utilization_by_area_group: {
    kind: SPACE_SLOT_KINDS.WIDGET,
    widgetKey: 'utilization_by_area_group',
    selectorMode: 'active',
  },
  utilization_by_area: {
    kind: SPACE_SLOT_KINDS.WIDGET,
    widgetKey: 'utilization_by_area',
    selectorMode: 'active',
  },
  peak_and_minimum_utilization: {
    kind: SPACE_SLOT_KINDS.WIDGET,
    widgetKey: 'peak_and_minimum_utilization',
    selectorMode: 'active',
  },
  utilization: {
    kind: SPACE_SLOT_KINDS.WIDGET,
    widgetKey: 'utilization',
    selectorMode: 'main',
  },
};

export const ADVANCED_SPACE_LAYOUT_MODE = SPACE_LAYOUT_MODES.FIXED_SECTIONS;

export const ADVANCED_SPACE_SLOT_REGISTRY = {
  instant_occupancy_count: {
    kind: SPACE_SLOT_KINDS.WIDGET,
    widgetKey: 'instant_occupancy_count',
    selectorMode: 'active',
  },
  utilization_by_area_group: {
    kind: SPACE_SLOT_KINDS.WIDGET,
    widgetKey: 'utilization_by_area_group',
    selectorMode: 'active',
  },
  utilization_by_area: {
    kind: SPACE_SLOT_KINDS.WIDGET,
    widgetKey: 'utilization_by_area',
    selectorMode: 'active',
  },
  peak_and_minimum_utilization: {
    kind: SPACE_SLOT_KINDS.WIDGET,
    widgetKey: 'peak_and_minimum_utilization',
    selectorMode: 'active',
  },
  utilization: {
    kind: SPACE_SLOT_KINDS.WIDGET,
    widgetKey: 'utilization',
    selectorMode: 'main',
  },
};

export const ADVANCED_SPACE_CHARTS_SECTIONS = [
  { type: SPACE_SECTION_TYPES.FULL, slots: ['instant_occupancy_count'] },
  {
    type: SPACE_SECTION_TYPES.SPLIT,
    leftColumn: { slots: ['utilization_by_area_group', 'peak_and_minimum_utilization'] },
    rightColumn: { slots: ['utilization_by_area'] },
  },
];

export const ADVANCED_SPACE_UTILIZATION_SECTIONS = [
  { type: SPACE_SECTION_TYPES.FULL, slots: ['utilization'] },
  {
    type: SPACE_SECTION_TYPES.SPLIT,
    leftColumn: { slots: ['utilization_by_area_group', 'peak_and_minimum_utilization'] },
    rightColumn: { slots: ['utilization_by_area'] },
  },
];

export const CUSTOMIZED_SPACE_LAYOUT_MODE = SPACE_LAYOUT_MODES.SORTABLE_GRID;

export const CUSTOMIZED_SPACE_SLOT_REGISTRY = {
  ...ADVANCED_SPACE_SLOT_REGISTRY,
};

export const CUSTOMIZED_SPACE_CHARTS_BUILTIN_SLOTS = [
  'instant_utilization_combined',
  'instant_occupancy_count',
  'utilization_by_area_group',
  'peak_and_minimum_utilization',
  'utilization_by_area',
];

export const CUSTOMIZED_SPACE_UTILIZATION_BUILTIN_SLOTS = [
  'utilization',
  'utilization_by_area_group',
  'peak_and_minimum_utilization',
  'utilization_by_area',
];

export function createBasicSpaceLayoutAdapter(overrides = {}) {
  return {
    variant: 'basic',
    layoutMode: BASIC_SPACE_LAYOUT_MODE,
    SLOT_REGISTRY: BASIC_SPACE_SLOT_REGISTRY,
    buildRows: overrides.buildRows,
    resolveRowSx: overrides.resolveRowSx,
    resolveSlotSx: overrides.resolveSlotSx,
    resolveStackSx: overrides.resolveStackSx,
    getSlotStorageKey: overrides.getSlotStorageKey,
  };
}

export function createAdvancedSpaceLayoutAdapter(overrides = {}) {
  return {
    variant: 'advanced',
    layoutMode: ADVANCED_SPACE_LAYOUT_MODE,
    SLOT_REGISTRY: ADVANCED_SPACE_SLOT_REGISTRY,
    CHARTS_SECTIONS: ADVANCED_SPACE_CHARTS_SECTIONS,
    UTILIZATION_SECTIONS: ADVANCED_SPACE_UTILIZATION_SECTIONS,
    resolveFullSectionSx: overrides.resolveFullSectionSx,
    resolveSplitSectionSx: overrides.resolveSplitSectionSx,
    resolveSplitColumnSx: overrides.resolveSplitColumnSx,
    resolveSplitLeftColumnSx: overrides.resolveSplitLeftColumnSx,
    resolveSplitRightColumnSx: overrides.resolveSplitRightColumnSx,
  };
}

export function createCustomizedSpaceLayoutAdapter(overrides = {}) {
  return {
    variant: 'customized',
    layoutMode: CUSTOMIZED_SPACE_LAYOUT_MODE,
    SLOT_REGISTRY: CUSTOMIZED_SPACE_SLOT_REGISTRY,
    CHARTS_SECTIONS: ADVANCED_SPACE_CHARTS_SECTIONS,
    UTILIZATION_SECTIONS: ADVANCED_SPACE_UTILIZATION_SECTIONS,
    CHARTS_BUILTIN_SLOTS: CUSTOMIZED_SPACE_CHARTS_BUILTIN_SLOTS,
    UTILIZATION_BUILTIN_SLOTS: CUSTOMIZED_SPACE_UTILIZATION_BUILTIN_SLOTS,
    resolveSortableGridSx: overrides.resolveSortableGridSx,
    isCustomGraphSlot: overrides.isCustomGraphSlot,
    ...overrides,
  };
}

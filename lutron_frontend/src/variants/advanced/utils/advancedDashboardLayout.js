export const ADVANCED_ENERGY_BUILTIN_CARD_KEYS = [
  'consumption_saving',
  'savings_by_strategy',
  'total_consumption_by_group',
  'consumption',
  'savings',
  'light_power_density',
  'peak_and_minimum_consumption',
];

export const ADVANCED_ENERGY_FORCE_FULL_WIDTH_SLOTS = new Set(['consumption_saving']);

export const ADVANCED_SPACE_CHARTS_SLOT_KEYS = [
  'instant_utilization_combined',
  'instant_occupancy_count',
  'utilization_by_area_group',
  'peak_and_minimum_utilization',
  'utilization_by_area',
];

export const ADVANCED_SPACE_UTILIZATION_SLOT_KEYS = [
  'utilization',
  'utilization_by_area_group',
  'peak_and_minimum_utilization',
  'utilization_by_area',
];

export const ADVANCED_SPACE_SPLIT_LEFT_SLOT_KEYS = [
  'utilization_by_area_group',
  'peak_and_minimum_utilization',
];

export const ADVANCED_SPACE_SPLIT_RIGHT_SLOT_KEY = 'utilization_by_area';

export const ADVANCED_SPACE_CARD_HEIGHT_PX = 560;

export function canUseAdvancedSpaceSplitLayout(order, getSpan) {
  if (typeof getSpan !== 'function') return false;
  const hasLeft = ADVANCED_SPACE_SPLIT_LEFT_SLOT_KEYS.every((key) => order.includes(key));
  const hasRight = order.includes(ADVANCED_SPACE_SPLIT_RIGHT_SLOT_KEY);
  if (!hasLeft || !hasRight) return false;
  return [...ADVANCED_SPACE_SPLIT_LEFT_SLOT_KEYS, ADVANCED_SPACE_SPLIT_RIGHT_SLOT_KEY].every(
    (key) => getSpan(key) === 1
  );
}

/** Preserve drag order while grouping split-column widgets like the legacy fixed layout. */
export function resolveAdvancedSpaceSortableLayout(order, getSpan) {
  const useSplit = canUseAdvancedSpaceSplitLayout(order, getSpan);

  const fullWidthIds = [];
  const splitLeftIds = [];
  const gridHalfIds = [];
  let splitRightId = null;

  for (const id of order) {
    if (getSpan(id) === 2) {
      fullWidthIds.push(id);
      continue;
    }
    if (useSplit && ADVANCED_SPACE_SPLIT_LEFT_SLOT_KEYS.includes(id)) {
      splitLeftIds.push(id);
      continue;
    }
    if (useSplit && id === ADVANCED_SPACE_SPLIT_RIGHT_SLOT_KEY) {
      splitRightId = id;
      continue;
    }
    gridHalfIds.push(id);
  }

  return {
    useSplit,
    fullWidthIds,
    splitLeftIds,
    splitRightId,
    gridHalfIds,
  };
}

export const ADVANCED_SPACE_SPLIT_SECTION_SX = {
  display: 'flex',
  gap: { xs: 2, sm: 3, md: 4, lg: 5.5, xl: 6 },
  flexWrap: 'wrap',
  flexDirection: { xs: 'column', lg: 'row' },
  width: '100%',
};

export const ADVANCED_SPACE_SPLIT_LEFT_COLUMN_SX = {
  width: { xs: '100%', lg: '48%' },
  display: 'flex',
  flexDirection: 'column',
  gap: { xs: 2, sm: 3, md: 4, lg: 5, xl: 6 },
  minWidth: 0,
};

export const ADVANCED_SPACE_SPLIT_RIGHT_COLUMN_SX = {
  width: { xs: '100%', lg: '48%' },
  display: 'flex',
  flexDirection: 'column',
  gap: { xs: 2, sm: 3, md: 4, lg: 5, xl: 6 },
  minWidth: 0,
};

export function resolveAdvancedSortableGridSx(gridColumns, options = {}) {
  const { gridAutoRows, alignItems = 'start', includePadding = true } = options;
  return {
    display: 'grid',
    gridTemplateColumns: {
      xs: '1fr',
      sm: gridColumns,
      md: gridColumns,
      lg: gridColumns,
      xl: gridColumns,
    },
    gridAutoRows: gridAutoRows || 'auto',
    rowGap: { xs: 2, sm: 2.5, md: 3 },
    columnGap: { xs: 2, sm: 2.5, md: 3 },
    ...(includePadding ? { p: { xs: 1, sm: 1.5, md: 2 }, mb: 2 } : {}),
    width: '100%',
    alignItems,
    gridAutoFlow: 'row dense',
  };
}

export function mergeAdvancedVisibleOrder(currentOrder, visibleKeys) {
  const order = Array.isArray(currentOrder) ? currentOrder : [];
  const keys = Array.isArray(visibleKeys) ? visibleKeys : [];
  return [
    ...order.filter((key) => keys.includes(key)),
    ...keys.filter((key) => !order.includes(key)),
  ];
}

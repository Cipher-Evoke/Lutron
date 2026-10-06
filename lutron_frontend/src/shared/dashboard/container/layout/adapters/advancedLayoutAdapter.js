import { ENERGY_LAYOUT_MODES, ENERGY_SLOT_KINDS, WIDGET_SHELL_TYPES } from '../layoutTypes';

export const ADVANCED_LAYOUT_MODE = ENERGY_LAYOUT_MODES.FIXED_GRID;

export const ADVANCED_ENERGY_FIXED_ROWS = [
  ['savings_by_strategy', 'total_consumption_by_group'],
  ['consumption', 'savings'],
  ['light_power_density', 'peak_and_minimum_consumption'],
];

export const ADVANCED_ENERGY_SLOT_REGISTRY = {
  savings_by_strategy: {
    kind: ENERGY_SLOT_KINDS.WIDGET,
    widgetKey: 'savings_by_strategy',
    shellType: WIDGET_SHELL_TYPES.NONE,
  },
  total_consumption_by_group: {
    kind: ENERGY_SLOT_KINDS.WIDGET,
    widgetKey: 'total_consumption_by_group',
    shellType: WIDGET_SHELL_TYPES.NONE,
  },
  consumption: {
    kind: ENERGY_SLOT_KINDS.WIDGET,
    widgetKey: 'consumption',
    shellType: WIDGET_SHELL_TYPES.NONE,
  },
  savings: {
    kind: ENERGY_SLOT_KINDS.WIDGET,
    widgetKey: 'savings',
    shellType: WIDGET_SHELL_TYPES.NONE,
  },
  light_power_density: {
    kind: ENERGY_SLOT_KINDS.WIDGET,
    widgetKey: 'light_power_density',
    shellType: WIDGET_SHELL_TYPES.METRIC_PANEL,
  },
  peak_and_minimum_consumption: {
    kind: ENERGY_SLOT_KINDS.WIDGET,
    widgetKey: 'peak_and_minimum_consumption',
    shellType: WIDGET_SHELL_TYPES.METRIC_PANEL,
  },
};

export function getAdvancedEnergySlotMeta(slotId) {
  return ADVANCED_ENERGY_SLOT_REGISTRY[slotId] || null;
}

export const ADVANCED_GRID_SPACING = { xs: 2, sm: 2, md: 3, lg: 4, xl: 5 };

export function resolveAdvancedGridRowSx(rowIndex) {
  return rowIndex === 2 ? { mt: 2 } : rowIndex === 0 ? { mb: 2 } : {};
}

export const ADVANCED_GRID_ITEM_PROPS = { xs: 12, md: 6, lg: 6, xl: 6 };

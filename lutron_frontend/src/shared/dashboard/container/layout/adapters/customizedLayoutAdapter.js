import { ENERGY_LAYOUT_MODES, WIDGET_SHELL_TYPES } from '../layoutTypes';

export const CUSTOMIZED_LAYOUT_MODE = ENERGY_LAYOUT_MODES.SORTABLE_GRID;

export const CUSTOMIZED_BUILTIN_ENERGY_CARD_KEYS = [
  'savings_by_strategy',
  'total_consumption_by_group',
  'consumption',
  'savings',
  'light_power_density',
  'peak_and_minimum_consumption',
];

export const CUSTOMIZED_BUILTIN_SHELL_TYPES = {
  light_power_density: WIDGET_SHELL_TYPES.COMPACT_PANEL,
  peak_and_minimum_consumption: WIDGET_SHELL_TYPES.COMPACT_PANEL,
};

export function resolveCustomizedSortableGridSx(gridColumns) {
  return {
    display: 'grid',
    gridTemplateColumns: {
      xs: '1fr',
      sm: gridColumns,
      md: gridColumns,
      lg: gridColumns,
      xl: gridColumns,
    },
    gridAutoRows: 'auto',
    gap: { xs: 2, sm: 2, md: 2.5 },
    p: { xs: 1, sm: 1.5, md: 2 },
    width: '100%',
    alignItems: 'start',
    gridAutoFlow: 'row dense',
    mb: 2,
  };
}

export function isCustomizedBuiltinEnergyCardKey(key) {
  return CUSTOMIZED_BUILTIN_ENERGY_CARD_KEYS.includes(key);
}

export function isCustomGraphEnergyCardKey(key) {
  return String(key).startsWith('custom_graph:');
}

import { buildEnergyDashboardRows } from '../../dashboardLayoutResolvers';
import { ENERGY_LAYOUT_MODES, ENERGY_SLOT_KINDS, WIDGET_SHELL_TYPES } from '../layoutTypes';

export const BASIC_LAYOUT_MODE = ENERGY_LAYOUT_MODES.DYNAMIC_ROWS;

export const BASIC_ENERGY_SLOT_REGISTRY = {
  consumption: {
    kind: ENERGY_SLOT_KINDS.WIDGET,
    widgetKey: 'consumption',
    shellType: WIDGET_SHELL_TYPES.NONE,
    storageKey: 'dashboard-energy-line-consumption',
  },
  consumption_saving: {
    kind: ENERGY_SLOT_KINDS.CUSTOM,
    storageKey: 'dashboard-energy-combined-consumption-saving',
  },
  savings: {
    kind: ENERGY_SLOT_KINDS.WIDGET,
    widgetKey: 'savings',
    shellType: WIDGET_SHELL_TYPES.NONE,
    storageKey: 'dashboard-energy-line-savings',
  },
  savings_by_strategy: {
    kind: ENERGY_SLOT_KINDS.WIDGET,
    widgetKey: 'savings_by_strategy',
    shellType: WIDGET_SHELL_TYPES.NONE,
    storageKey: 'dashboard-energy-donut-savings-strategy',
  },
  total_consumption_by_group: {
    kind: ENERGY_SLOT_KINDS.WIDGET,
    widgetKey: 'total_consumption_by_group',
    shellType: WIDGET_SHELL_TYPES.NONE,
    storageKey: 'dashboard-energy-donut-consumption-by-group',
  },
  light_power_density: {
    kind: ENERGY_SLOT_KINDS.WIDGET,
    widgetKey: 'light_power_density',
    shellType: WIDGET_SHELL_TYPES.METRIC_PANEL,
    storageKey: 'dashboard-energy-lpd',
  },
  peak_and_minimum_consumption: {
    kind: ENERGY_SLOT_KINDS.WIDGET,
    widgetKey: 'peak_and_minimum_consumption',
    shellType: WIDGET_SHELL_TYPES.METRIC_PANEL,
    storageKey: 'dashboard-energy-peak-min',
    shellLayout: 'header-body',
  },
};

export function buildBasicEnergyRowDescriptors(visibleSlotOrder) {
  return buildEnergyDashboardRows(visibleSlotOrder);
}

export function getBasicEnergySlotMeta(slotId) {
  return BASIC_ENERGY_SLOT_REGISTRY[slotId] || null;
}

export function resolveBasicSlotFullWidth(slotId) {
  return slotId === 'consumption_saving';
}

export function resolveBasicRowSx(rowIndex, totalRows) {
  return {
    display: 'flex',
    flexDirection: { xs: 'column', md: 'row' },
    gap: { xs: 2, sm: 2, md: 3, lg: 4, xl: 5 },
    width: '100%',
    mb: rowIndex === totalRows - 1 ? 0 : 2,
    mt: rowIndex > 0 ? 2 : 0,
    alignItems: 'flex-start',
  };
}

export function resolveBasicSlotColumnSx(slotId, pair, theme) {
  const aloneOnRow = pair.length === 1;
  const forceFullWidth = resolveBasicSlotFullWidth(slotId);

  if (forceFullWidth) {
    return {
      flex: '1 1 0',
      minWidth: 0,
      width: '100%',
      maxWidth: '100%',
      alignSelf: 'stretch',
    };
  }

  if (aloneOnRow) {
    return {
      flex: { xs: 'none', md: '0 0 auto' },
      minWidth: 0,
      width: {
        xs: '100%',
        sm: '100%',
        md: `calc((100% - ${theme.spacing(3)}) / 2)`,
        lg: `calc((100% - ${theme.spacing(4)}) / 2)`,
        xl: `calc((100% - ${theme.spacing(5)}) / 2)`,
      },
      maxWidth: {
        xs: '100%',
        sm: '100%',
        md: `calc((100% - ${theme.spacing(3)}) / 2)`,
        lg: `calc((100% - ${theme.spacing(4)}) / 2)`,
        xl: `calc((100% - ${theme.spacing(5)}) / 2)`,
      },
      alignSelf: { xs: 'stretch', md: 'flex-start' },
    };
  }

  return {
    flex: { xs: 'none', md: '1 1 0' },
    minWidth: 0,
    width: { xs: '100%', md: 'auto' },
  };
}

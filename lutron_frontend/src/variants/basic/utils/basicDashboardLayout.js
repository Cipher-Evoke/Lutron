import { buildDashboardRowsWithSpan } from '../../../shared/dashboard/container/dashboardLayoutResolvers';

export const BASIC_ENERGY_FORCE_FULL_WIDTH_SLOTS = new Set(['consumption_saving']);

export const BASIC_SPACE_CHARTS_FORCE_FULL_WIDTH_SLOTS = new Set([
  'instant_occupancy_count',
  'instant_utilization_combined',
]);

export const BASIC_SPACE_MAIN_FORCE_FULL_WIDTH_SLOTS = new Set(['utilization']);

export function isBasicEnergyForceFullWidth(slotId) {
  return BASIC_ENERGY_FORCE_FULL_WIDTH_SLOTS.has(slotId);
}

export function isBasicSpaceChartsForceFullWidth(slotId) {
  return BASIC_SPACE_CHARTS_FORCE_FULL_WIDTH_SLOTS.has(slotId);
}

export function isBasicSpaceMainForceFullWidth(slotId) {
  return BASIC_SPACE_MAIN_FORCE_FULL_WIDTH_SLOTS.has(slotId);
}

export function buildSpaceChartsDashboardRowsWithSpan(visibleIds, getSpan) {
  return buildDashboardRowsWithSpan(
    visibleIds,
    getSpan,
    BASIC_SPACE_CHARTS_FORCE_FULL_WIDTH_SLOTS
  );
}

export function resolveBasicDashboardSlotColumnSx(slotId, pair, theme, getSpan, isForceFullWidth) {
  const forceFullWidth =
    (typeof isForceFullWidth === 'function' && isForceFullWidth(slotId)) ||
    (typeof getSpan === 'function' && getSpan(slotId) === 12);
  const aloneOnRow = pair.length === 1;

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

export function resolveBasicSpaceChartsRowSlotSx(slotId, pair, theme, getSpan) {
  const forceFullWidth =
    isBasicSpaceChartsForceFullWidth(slotId) ||
    (typeof getSpan === 'function' && getSpan(slotId) === 12);
  const aloneOnRow = pair.length === 1;

  if (forceFullWidth) {
    return {
      flex: '1 1 0',
      minWidth: 0,
      width: '100%',
      maxWidth: '100%',
      alignSelf: 'stretch',
      boxSizing: 'border-box',
    };
  }

  if (aloneOnRow) {
    return {
      flex: { xs: 'none', md: '0 0 auto' },
      minWidth: 0,
      width: {
        xs: '100%',
        md: `calc((100% - ${theme.spacing(3)}) / 2)`,
        lg: `calc((100% - ${theme.spacing(4)}) / 2)`,
        xl: `calc((100% - ${theme.spacing(4)}) / 2)`,
      },
      maxWidth: {
        xs: '100%',
        md: `calc((100% - ${theme.spacing(3)}) / 2)`,
        lg: `calc((100% - ${theme.spacing(4)}) / 2)`,
        xl: `calc((100% - ${theme.spacing(4)}) / 2)`,
      },
      alignSelf: { xs: 'stretch', md: 'flex-start' },
      boxSizing: 'border-box',
    };
  }

  return {
    flex: { xs: 'none', md: '1 1 0' },
    minWidth: 0,
    width: { xs: '100%', md: 'auto' },
    boxSizing: 'border-box',
  };
}

export function resolveBasicSpaceMainSlotWrapperSx(slotId, theme, getSpan) {
  const isFull =
    isBasicSpaceMainForceFullWidth(slotId) ||
    (typeof getSpan === 'function' && getSpan(slotId) === 12);
  const halfColumn = !isFull
    ? {
        maxWidth: {
          xs: '100%',
          lg: `calc((100% - ${theme.spacing(5.5)}) / 2)`,
          xl: `calc((100% - ${theme.spacing(6)}) / 2)`,
        },
      }
    : { maxWidth: '100%' };

  return {
    width: '100%',
    display: 'flex',
    justifyContent: { xs: 'stretch', lg: isFull ? 'stretch' : 'flex-start' },
    ...halfColumn,
  };
}

import {
  occupancyByGroupToStackedBarRows,
  occupancyUtilizedAreaToStackedBarRows,
} from '../transforms/occupancyByGroupToStackedBarRows';

export const SPACE_STACKED_BAR_EMPTY_MESSAGE = 'No area group data available';
export const SPACE_STACKED_BAR_EMPTY_CRITERIA_MESSAGE =
  'No area group data available for the selected criteria';
export const SPACE_STACKED_BAR_ERROR_MESSAGE = 'Error loading area group data';
export const SPACE_STACKED_BAR_CATCH_ERROR_MESSAGE = 'Error loading stacked bar chart data';

export const STACKED_BAR_SERIES_ORDER = ['unoccupied', 'occupied'];
export const STACKED_BAR_LEGEND_LABELS = {
  unoccupied: 'Unoccupied',
  occupied: 'Occupied',
};

/**
 * Legacy status machine from variant StackedBarChartComponent.
 */
export function resolveSpaceStackedBarChartStatus({
  activeOccupancyByGroup,
  activeOccupancyByGroupLoading,
  anyLoading: _anyLoading,
  isLoading: _isLoading,
  globalLoadingProp: _globalLoadingProp,
}) {
  if (activeOccupancyByGroupLoading) {
    return 'loading';
  }
  if (activeOccupancyByGroup && activeOccupancyByGroup.status === 'error') {
    return 'error';
  }
  if (!activeOccupancyByGroup && !activeOccupancyByGroupLoading) {
    return 'empty';
  }
  if (!activeOccupancyByGroup) {
    return 'loading';
  }
  return 'ready';
}

export function buildSpaceStackedBarChartDataset(activeOccupancyByGroup, options = {}) {
  const stackedBarData = occupancyByGroupToStackedBarRows(activeOccupancyByGroup, options);
  const status =
    stackedBarData.length === 0 ? 'empty-criteria' : 'ready';
  return { stackedBarData, status };
}

export function buildSpaceStackedBarAreaModeDataset(activeSpaceUtilizationPerArea, options = {}) {
  const stackedBarData = occupancyUtilizedAreaToStackedBarRows(
    activeSpaceUtilizationPerArea,
    options
  );
  return {
    stackedBarData,
    status: stackedBarData.length === 0 ? 'empty-criteria' : 'ready',
  };
}

export function resolveStackedBarPlotHeight({ shellVariant, showChartsTab = false } = {}) {
  if (shellVariant === 'customized') {
    return { heightStyle: 'flexFill' };
  }
  if (shellVariant === 'basic' && showChartsTab) {
    return { heightStyle: 'chartsTabClamp' };
  }
  return { heightStyle: 'fixed400' };
}

export function legacySpaceStackedBarPipeline(activeOccupancyByGroup, options = {}) {
  return buildSpaceStackedBarChartDataset(activeOccupancyByGroup, options);
}

import React, { memo } from 'react';
import SpaceLineChartAdapter from '../../charts/space/SpaceLineChartAdapter';
import SpaceStackedBarChartAdapter from '../../charts/space/SpaceStackedBarChartAdapter';
import InstantOccupancyChartAdapter from '../../charts/space/InstantOccupancyChartAdapter';
import { SpacePeakMinCards, UtilizationByAreaList } from '../widgets';
import {
  resolveSpaceWidgetLoading,
  resolveSpaceWidgetProps,
  resolveSpaceWidgetRenderer,
  resolveSpaceWidgetVisibility,
} from './spaceWidgetSlotResolvers';
import { SPACE_WIDGET_RENDERER_TYPES } from './spaceWidgetRenderMap';
import { spaceWidgetRendererPropsAreEqual } from './spaceWidgetRendererMemoCompare';

function renderSpaceWidgetByType(rendererEntry, widgetProps) {
  if (!rendererEntry || !widgetProps) return null;

  switch (rendererEntry.type) {
    case SPACE_WIDGET_RENDERER_TYPES.LINE_CHART:
      return <SpaceLineChartAdapter {...widgetProps} />;
    case SPACE_WIDGET_RENDERER_TYPES.STACKED_BAR_CHART:
      return <SpaceStackedBarChartAdapter {...widgetProps} />;
    case SPACE_WIDGET_RENDERER_TYPES.INSTANT_OCCUPANCY_CHART:
      return <InstantOccupancyChartAdapter {...widgetProps} />;
    case SPACE_WIDGET_RENDERER_TYPES.PEAK_MIN_CARDS:
      return <SpacePeakMinCards {...widgetProps} />;
    case SPACE_WIDGET_RENDERER_TYPES.UTILIZATION_BY_AREA_LIST:
      return <UtilizationByAreaList {...widgetProps} />;
    default:
      return null;
  }
}

function SpaceWidgetRendererInner({
  widgetKey,
  context,
  overrides,
  visible,
  widgetProps: widgetPropsOverride,
  chartLoaderHeight,
}) {
  const rendererEntry = resolveSpaceWidgetRenderer(widgetKey);
  if (!rendererEntry) return null;

  const mergedContext = {
    ...context,
    overrides: {
      ...(context?.overrides || {}),
      [widgetKey]: {
        ...(context?.overrides?.[widgetKey] || {}),
        ...(overrides || {}),
      },
    },
  };

  const isVisible =
    visible !== undefined
      ? visible
      : resolveSpaceWidgetVisibility(widgetKey, mergedContext);

  if (!isVisible) return null;

  const widgetProps =
    widgetPropsOverride || resolveSpaceWidgetProps(widgetKey, mergedContext);

  if (!widgetProps) return null;

  const isLoading = resolveSpaceWidgetLoading(widgetKey, mergedContext);
  const ChartLoader = mergedContext.ChartLoader;

  if (isLoading && ChartLoader) {
    return <ChartLoader height={chartLoaderHeight} />;
  }

  return renderSpaceWidgetByType(rendererEntry, widgetProps);
}

const SpaceWidgetRenderer = memo(SpaceWidgetRendererInner, spaceWidgetRendererPropsAreEqual);

SpaceWidgetRenderer.displayName = 'SpaceWidgetRenderer';

export default SpaceWidgetRenderer;

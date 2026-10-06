import React, { memo } from 'react';
import UnifiedEnergyWidget from '../widgets/energy';
import SavingsByStrategyWidget from '../widgets/SavingsByStrategyWidget';
import TotalConsumptionByGroupWidget from '../widgets/TotalConsumptionByGroupWidget';
import LightPowerDensityWidget from '../widgets/LightPowerDensityWidget';
import PeakMinConsumptionWidget from '../widgets/peakmin';
import OverviewMetricTile from '../widgets/overview/OverviewMetricTile';
import {
  resolveWidgetProps,
  resolveWidgetRenderer,
  resolveWidgetVisibility,
} from './widgetSlotResolvers';
import { WIDGET_RENDERER_TYPES } from './widgetRenderMap';
import { dashboardWidgetRendererPropsAreEqual } from './widgetRendererMemoCompare';

function renderWidgetByType(rendererEntry, widgetProps) {
  if (!rendererEntry || !widgetProps) return null;

  switch (rendererEntry.type) {
    case WIDGET_RENDERER_TYPES.UNIFIED_ENERGY:
      return <UnifiedEnergyWidget {...widgetProps} />;
    case WIDGET_RENDERER_TYPES.SAVINGS_BY_STRATEGY:
      return <SavingsByStrategyWidget {...widgetProps} />;
    case WIDGET_RENDERER_TYPES.TOTAL_CONSUMPTION_BY_GROUP:
      return <TotalConsumptionByGroupWidget {...widgetProps} />;
    case WIDGET_RENDERER_TYPES.LIGHT_POWER_DENSITY:
      return <LightPowerDensityWidget {...widgetProps} />;
    case WIDGET_RENDERER_TYPES.PEAK_MIN_CONSUMPTION:
      return <PeakMinConsumptionWidget {...widgetProps} />;
    case WIDGET_RENDERER_TYPES.OVERVIEW_TILE:
      return <OverviewMetricTile {...widgetProps} />;
    case WIDGET_RENDERER_TYPES.OVERVIEW_ALERTS:
      return null;
    default:
      return null;
  }
}

function DashboardWidgetRendererInner({
  widgetKey,
  variant,
  context,
  visible,
  widgetProps: widgetPropsOverride,
}) {
  const rendererEntry = resolveWidgetRenderer(widgetKey);
  if (!rendererEntry) return null;

  const isVisible =
    visible !== undefined
      ? visible
      : resolveWidgetVisibility(widgetKey, { ...context, variant });

  if (!isVisible) return null;

  const widgetProps =
    widgetPropsOverride || resolveWidgetProps(widgetKey, { ...context, variant });

  if (!widgetProps) return null;

  return renderWidgetByType(rendererEntry, widgetProps);
}

const DashboardWidgetRenderer = memo(
  DashboardWidgetRendererInner,
  dashboardWidgetRendererPropsAreEqual
);

DashboardWidgetRenderer.displayName = 'DashboardWidgetRenderer';

export default DashboardWidgetRenderer;

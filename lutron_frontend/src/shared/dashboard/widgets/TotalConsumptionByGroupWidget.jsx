import React, { useMemo } from 'react';
import { TotalConsumptionByGroupCard } from './TotalConsumptionByGroupCard';
import {
  resolveTotalConsumptionByGroupTheme,
  TOTAL_CONSUMPTION_BY_GROUP_THEME_PRESETS,
  resolveTotalConsumptionByGroupLoading,
} from './totalConsumptionByGroupTheme';
import { totalConsumptionByGroupWidgetPropsAreEqual } from './totalConsumptionByGroupMemoCompare';
import {
  createEnergyExportActionMap,
  ENERGY_EXPORT_WIDGET_KEYS,
} from '../export/energyExportActionMap';

export function resolveTotalConsumptionByGroupExportActions(thunks) {
  const map = createEnergyExportActionMap(thunks);
  return map[ENERGY_EXPORT_WIDGET_KEYS.TOTAL_CONSUMPTION_BY_GROUP];
}

function TotalConsumptionByGroupWidgetInner({
  title,
  totalConsumptionByGroup,
  allEnergyChartsReady,
  chartLoadingTotalConsumptionByGroup = false,
  areaGroups = null,
  areaIdToDisplayName = null,
  shellVariant = TOTAL_CONSUMPTION_BY_GROUP_THEME_PRESETS.basic,
  chartSurface = 'dark',
  chartHeaderStyle = {},
  energyLightFullCardHeightPx = null,
  advancedSurface = null,
  customizedSurface = null,
  exportControl = null,
  ChartLoader = null,
}) {
  const isLoading = useMemo(
    () =>
      resolveTotalConsumptionByGroupLoading({
        chartLoadingTotalConsumptionByGroup,
        totalConsumptionByGroup,
      }),
    [chartLoadingTotalConsumptionByGroup, totalConsumptionByGroup]
  );

  const theme = useMemo(
    () =>
      resolveTotalConsumptionByGroupTheme({
        preset: shellVariant,
        chartSurface,
        chartHeaderStyle,
        energyLightFullCardHeightPx,
        advancedSurface,
        customizedSurface,
      }),
    [
      shellVariant,
      chartSurface,
      chartHeaderStyle,
      energyLightFullCardHeightPx,
      advancedSurface,
      customizedSurface,
    ]
  );

  return (
    <TotalConsumptionByGroupCard
      title={title}
      data={totalConsumptionByGroup}
      isLoading={isLoading}
      areaGroups={areaGroups}
      areaIdToDisplayName={areaIdToDisplayName}
      theme={theme}
      chartHeaderStyle={chartHeaderStyle}
      chartSurface={chartSurface}
      exportControl={exportControl}
      ChartLoader={ChartLoader}
    />
  );
}

export const TotalConsumptionByGroupWidget = React.memo(
  TotalConsumptionByGroupWidgetInner,
  totalConsumptionByGroupWidgetPropsAreEqual
);

export default TotalConsumptionByGroupWidget;

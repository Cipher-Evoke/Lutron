import React, { useMemo } from 'react';
import ConsumptionPieChartAdapter from '../charts/views/ConsumptionPieChartAdapter';
import { resolveTotalConsumptionByGroupTitleStyle } from './totalConsumptionByGroupTheme';
import { TOTAL_CONSUMPTION_BY_GROUP_THEME_PRESETS } from './totalConsumptionByGroupTheme';

export function TotalConsumptionByGroupCard({
  title,
  data,
  isLoading = false,
  areaGroups = null,
  areaIdToDisplayName = null,
  theme,
  chartHeaderStyle = {},
  chartSurface = 'dark',
  exportControl = null,
  ChartLoader = null,
}) {
  const titleStyleOverride = useMemo(() => {
    if (theme?.titleStyleOverride) {
      return theme.titleStyleOverride;
    }
    if (theme?.preset === TOTAL_CONSUMPTION_BY_GROUP_THEME_PRESETS.basic) {
      return resolveTotalConsumptionByGroupTitleStyle(chartHeaderStyle, chartSurface);
    }
    return chartHeaderStyle;
  }, [theme, chartHeaderStyle, chartSurface]);

  return (
    <ConsumptionPieChartAdapter
      title={title}
      data={data}
      isLoading={isLoading}
      chartSurface={theme?.chartSurface ?? chartSurface}
      areaGroups={areaGroups}
      areaIdToDisplayName={areaIdToDisplayName}
      shellVariant={theme?.shellVariant}
      exportControl={exportControl}
      ChartLoader={ChartLoader}
      outerStyleOverride={theme?.outerStyleOverride ?? {}}
      titleStyleOverride={titleStyleOverride}
      plotStyleOverride={theme?.plotStyleOverride ?? {}}
      cardShellStyle={theme?.cardShellStyle ?? {}}
      cardHeaderStyle={theme?.cardHeaderStyle ?? {}}
      cssTooltipStyle={theme?.cssTooltipStyle}
      resolveThemePalette={theme?.resolveThemePalette}
      resolveSegmentLabelColors={theme?.resolveSegmentLabelColors}
      loaderHeight={theme?.loaderHeight ?? '100%'}
      loaderLight={theme?.loaderLight ?? false}
      showFetchErrorState={theme?.showFetchErrorState ?? false}
      showZeroSegmentsState={theme?.showZeroSegmentsState ?? false}
    />
  );
}

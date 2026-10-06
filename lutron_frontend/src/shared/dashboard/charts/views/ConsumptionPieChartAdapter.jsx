import React, { useMemo } from 'react';
import {
  normalizeTotalConsumptionByGroupPayload,
  buildTotalConsumptionByGroupPieRows,
} from '../../utils/pieChartNormalizers';
import { resolvePieChartTheme, PIE_CHART_THEME_PRESETS } from '../themes/pieChartTheme';
import { resolveConsumptionPieSegmentColors } from '../config/consumptionPieChartConfig';
import { ConsumptionPieChartView } from './ConsumptionPieChartView';
import { PieChartCardShell } from '../shells/PieChartCardShell';
import { consumptionPieChartPropsAreEqual } from './consumptionPieChartMemoCompare';

const ZERO_SEGMENTS_MESSAGE =
  'Consumption data was returned but every segment is zero or could not be charted. Check the API response shape for /dashboard/total_consumption/by_group.';

/**
 * Shared consumption pie chart adapter — normalization + presentation.
 */
function ConsumptionPieChartAdapterInner({
  title,
  data,
  isLoading = false,
  chartSurface = 'dark',
  areaGroups = null,
  areaIdToDisplayName = null,
  shellVariant = 'basic-energy',
  exportControl = null,
  ChartLoader = null,
  outerStyleOverride = {},
  titleStyleOverride = {},
  plotStyleOverride = {},
  cardShellStyle = {},
  cardHeaderStyle = {},
  cssTooltipStyle = null,
  resolveThemePalette = null,
  resolveSegmentLabelColors = null,
  loaderHeight = '100%',
  loaderLight = false,
  showFetchErrorState = false,
  showZeroSegmentsState = false,
}) {
  const theme = useMemo(() => {
    if (shellVariant === 'advanced-card') {
      return resolvePieChartTheme({ preset: PIE_CHART_THEME_PRESETS.advanced });
    }
    if (shellVariant === 'customized-builtin') {
      return resolvePieChartTheme({ preset: PIE_CHART_THEME_PRESETS.customized });
    }
    return resolvePieChartTheme({ chartSurface });
  }, [shellVariant, chartSurface]);

  const areaLookup = areaIdToDisplayName instanceof Map ? areaIdToDisplayName : new Map();

  const normalizedData = useMemo(
    () => (data ? normalizeTotalConsumptionByGroupPayload(data) : null),
    [data]
  );

  const pieData = useMemo(
    () => buildTotalConsumptionByGroupPieRows(data, areaGroups, areaLookup),
    [data, areaGroups, areaLookup]
  );

  const segmentColors = useMemo(
    () =>
      resolveConsumptionPieSegmentColors(pieData.length, {
        resolveThemePalette: resolveThemePalette
          ? (count) => resolveThemePalette(count)
          : undefined,
      }),
    [pieData.length, resolveThemePalette]
  );

  const fetchError =
    showFetchErrorState && data && data.status === 'error'
      ? data.errorMessage || 'Failed to load consumption data'
      : null;

  const hasRawData =
    normalizedData &&
    ((normalizedData.special_area_groups && normalizedData.special_area_groups.length > 0) ||
      (normalizedData.data && Object.keys(normalizedData.data).length > 0));

  if (isLoading) {
    return (
      <PieChartCardShell
        status="loading"
        shellVariant={shellVariant}
        theme={theme}
        title={title}
        loaderMessage={`Loading ${title} data...`}
        loaderHeight={loaderHeight}
        loaderLight={loaderLight}
        LoaderComponent={ChartLoader}
        exportControl={exportControl}
        outerStyleOverride={shellVariant === 'customized-builtin' ? cardShellStyle : { ...outerStyleOverride, ...cardShellStyle }}
        titleStyleOverride={titleStyleOverride}
        cardHeaderStyle={cardHeaderStyle}
      />
    );
  }

  if (fetchError) {
    return (
      <PieChartCardShell
        status="error"
        shellVariant={shellVariant}
        theme={theme}
        title={title}
        errorMessage={fetchError}
        outerStyleOverride={shellVariant === 'customized-builtin' ? cardShellStyle : { ...outerStyleOverride, ...cardShellStyle }}
        titleStyleOverride={titleStyleOverride}
        cardHeaderStyle={cardHeaderStyle}
        plotStyleOverride={plotStyleOverride}
      />
    );
  }

  if (!hasRawData) {
    return (
      <PieChartCardShell
        status="empty"
        shellVariant={shellVariant}
        theme={theme}
        title={title}
        emptyMessage={`No data available for ${title}`}
        exportControl={exportControl}
        outerStyleOverride={shellVariant === 'customized-builtin' ? cardShellStyle : { ...outerStyleOverride, ...cardShellStyle }}
        titleStyleOverride={titleStyleOverride}
        cardHeaderStyle={cardHeaderStyle}
        plotStyleOverride={plotStyleOverride}
      />
    );
  }

  if (showZeroSegmentsState && pieData.length === 0) {
    return (
      <PieChartCardShell
        status="zero-segments"
        shellVariant={shellVariant}
        theme={theme}
        title={title}
        zeroSegmentsMessage={ZERO_SEGMENTS_MESSAGE}
        exportControl={exportControl}
        outerStyleOverride={shellVariant === 'customized-builtin' ? cardShellStyle : { ...outerStyleOverride, ...cardShellStyle }}
        titleStyleOverride={titleStyleOverride}
        cardHeaderStyle={cardHeaderStyle}
        plotStyleOverride={plotStyleOverride}
      />
    );
  }

  return (
    <PieChartCardShell
      status="ready"
      shellVariant={shellVariant}
      theme={theme}
      title={title}
      exportControl={exportControl}
      outerStyleOverride={shellVariant === 'customized-builtin' ? cardShellStyle : { ...outerStyleOverride, ...cardShellStyle }}
      titleStyleOverride={titleStyleOverride}
      cardHeaderStyle={cardHeaderStyle}
      plotStyleOverride={plotStyleOverride}
    >
      <ConsumptionPieChartView
        pieData={pieData}
        segmentColors={segmentColors}
        theme={theme}
        resolveSegmentLabelColors={resolveSegmentLabelColors}
        cssTooltipStyle={cssTooltipStyle}
      />
    </PieChartCardShell>
  );
}

export const ConsumptionPieChartAdapter = React.memo(
  ConsumptionPieChartAdapterInner,
  consumptionPieChartPropsAreEqual
);

export { consumptionPieChartPropsAreEqual } from './consumptionPieChartMemoCompare';

export default ConsumptionPieChartAdapter;

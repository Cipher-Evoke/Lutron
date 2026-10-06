import React, { useMemo, useCallback } from 'react';
import { formatEnergyXAxisLabel } from '../transforms/formatEnergyXAxisLabel';
import {
  getEnergyLineChartConfig,
  resolveEnergyLineSeriesNames,
  resolveEnergyLineSeriesColors,
  generateEnergyLineColorPalette,
  resolveEnergyLineChartKind,
  resolveEnergyChartTheme,
  ENERGY_CHART_THEME_PRESETS,
} from '../energy';
import { EnergyLineChartView, EnergyLineChartLegendLabel } from './EnergyLineChartView';
import { EnergyChartCardShell } from '../shells/EnergyChartCardShell';
import { energyLineChartPropsAreEqual } from './energyLineChartMemoCompare';

/**
 * Shared energy line chart adapter — transforms + presentation.
 * Data fetching/selectors remain in Dashboard.jsx; passed via props/context.
 */
const DEFAULT_CONSUMPTION_LINE_COLORS = ['#e57373', '#64b5f6', '#81c784', '#ffd54f'];
const DEFAULT_SAVINGS_LINE_COLORS = ['#50c878', '#90EE90', '#98FB98', '#87CEEB'];

function EnergyLineChartAdapterInner({
  title,
  data,
  colors,
  isLoading = false,
  chartSurface = 'dark',
  emptyStateVariant = 'message',
  legendSeriesName = null,
  energyMode = null,
  transformDataForCharts,
  selectedDuration,
  currentDate,
  currentYear,
  selectedAreas = [],
  shellVariant = 'basic-energy',
  strokeWidthProfile = 'standard',
  dynamicUnitFallback = '',
  exportControl = null,
  emptyStateExtras = null,
  blankChartPreview = null,
  ChartLoader = null,
  outerStyleOverride = {},
  titleStyleOverride = {},
  plotStyleOverride = {},
  cardShellStyle = {},
  cardHeaderStyle = {},
  cssTooltipStyle = null,
  resolveThemePalette = null,
  loaderHeight = '100%',
  loaderLight = false,
}) {
  const chartKind =
    energyMode === 'savings'
      ? 'savings'
      : energyMode === 'consumption'
        ? 'consumption'
        : resolveEnergyLineChartKind({ title, legendSeriesName });
  const chartType = chartKind === 'consumption' ? 'consumption' : 'other';
  const resolvedColors =
    Array.isArray(colors) && colors.length > 0
      ? colors
      : chartKind === 'savings'
        ? DEFAULT_SAVINGS_LINE_COLORS
        : DEFAULT_CONSUMPTION_LINE_COLORS;

  const theme = useMemo(() => {
    if (shellVariant === 'advanced-card') {
      return resolveEnergyChartTheme({ preset: ENERGY_CHART_THEME_PRESETS.advanced });
    }
    if (shellVariant === 'customized-builtin') {
      return resolveEnergyChartTheme({ preset: ENERGY_CHART_THEME_PRESETS.customized });
    }
    return resolveEnergyChartTheme({ chartSurface });
  }, [shellVariant, chartSurface]);

  const chartData = useMemo(() => {
    if (!data) return [];
    return transformDataForCharts(data, chartType);
  }, [data, chartType, transformDataForCharts]);

  const dynamicUnit = data?.unit || (chartKind === 'consumption' ? dynamicUnitFallback : '');
  const yAxisLimit = data?.max_limit;

  const formatXAxisLabel = useCallback(
    (value, index) =>
      formatEnergyXAxisLabel(value, index, {
        chartDataLength: chartData.length,
        selectedDuration,
        currentDate,
        currentYear,
      }),
    [chartData.length, selectedDuration, currentDate, currentYear]
  );

  const chartConfig = useMemo(
    () => getEnergyLineChartConfig(chartData, { strokeWidthProfile }),
    [chartData, strokeWidthProfile]
  );

  const seriesNames = useMemo(() => resolveEnergyLineSeriesNames(chartData), [chartData]);

  const seriesColors = useMemo(() => {
    const paletteKind = chartKind === 'savings' ? 'savings' : chartKind;
    const resolved = resolveEnergyLineSeriesColors(seriesNames, resolvedColors, (count) =>
      generateEnergyLineColorPalette(count, {
        chartKind: paletteKind,
        selectedAreaCount: selectedAreas.length,
        resolveThemePalette,
      })
    );
    if (legendSeriesName != null && shellVariant === 'customized-builtin' && resolved.length > 0) {
      const primary = resolved[0];
      return seriesNames.map(() => primary);
    }
    return resolved;
  }, [
    seriesNames,
    resolvedColors,
    chartKind,
    selectedAreas.length,
    resolveThemePalette,
    legendSeriesName,
    shellVariant,
  ]);

  const chartKey = `linechart-${title}-${selectedDuration}-${currentDate}-${chartKind}-${resolvedColors[0] ?? 'default'}`;

  if (isLoading) {
    return (
      <EnergyChartCardShell
        status="loading"
        shellVariant={shellVariant}
        theme={theme}
        title={title}
        dynamicUnit={dynamicUnit}
        loaderMessage={`Loading ${title} data...`}
        loaderHeight={loaderHeight}
        loaderLight={loaderLight}
        LoaderComponent={ChartLoader}
        outerStyleOverride={shellVariant === 'customized-builtin' ? cardShellStyle : { ...outerStyleOverride, ...cardShellStyle }}
        titleStyleOverride={titleStyleOverride}
        cardHeaderStyle={cardHeaderStyle}
      />
    );
  }

  if (!data || !data['x-axis']) {
    return (
      <EnergyChartCardShell
        status="empty"
        shellVariant={shellVariant}
        theme={theme}
        title={title}
        emptyMessage={`No data available for ${title}`}
        emptyStateVariant={emptyStateVariant}
        emptyStateExtras={emptyStateExtras}
        blankChartPreview={blankChartPreview}
        outerStyleOverride={shellVariant === 'customized-builtin' ? cardShellStyle : { ...outerStyleOverride, ...cardShellStyle }}
        titleStyleOverride={titleStyleOverride}
        cardHeaderStyle={cardHeaderStyle}
        plotStyleOverride={shellVariant === 'customized-builtin' ? plotStyleOverride : undefined}
      />
    );
  }

  return (
    <EnergyChartCardShell
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
      <EnergyLineChartView
        chartData={chartData}
        seriesNames={seriesNames}
        seriesColors={seriesColors}
        chartConfig={chartConfig}
        theme={theme}
        dynamicUnit={dynamicUnit}
        yAxisLimit={yAxisLimit}
        formatXAxisLabel={formatXAxisLabel}
        selectedDuration={selectedDuration}
        selectedAreaCount={selectedAreas.length}
        title={title}
        currentDate={currentDate}
        legendSeriesName={legendSeriesName}
        chartKey={chartKey}
        cssTooltipStyle={cssTooltipStyle}
      />
      {legendSeriesName != null && shellVariant === 'customized-builtin' ? (
        <EnergyLineChartLegendLabel
          legendSeriesName={legendSeriesName}
          color={seriesColors[0]}
        />
      ) : null}
    </EnergyChartCardShell>
  );
}

export const EnergyLineChartAdapter = React.memo(
  EnergyLineChartAdapterInner,
  energyLineChartPropsAreEqual
);

export { energyLineChartPropsAreEqual } from './energyLineChartMemoCompare';

export default EnergyLineChartAdapter;

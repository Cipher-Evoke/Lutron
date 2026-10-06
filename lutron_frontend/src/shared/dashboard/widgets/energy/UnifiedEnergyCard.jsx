import EnergyLineChartAdapter from '../../charts/views/EnergyLineChartAdapter';

export function UnifiedEnergyCard({
  title,
  data,
  isLoading = false,
  theme,
  mode,
  colors = [],
  transformDataForCharts,
  selectedDuration,
  currentDate,
  currentYear,
  selectedAreas = [],
  emptyStateVariant = 'message',
  exportControl = null,
  emptyStateExtras = null,
  blankChartPreview = null,
  ChartLoader = null,
}) {
  return (
    <EnergyLineChartAdapter
      title={title}
      data={data}
      colors={colors}
      energyMode={mode}
      isLoading={isLoading}
      chartSurface={theme?.chartSurface ?? 'dark'}
      emptyStateVariant={emptyStateVariant}
      legendSeriesName={theme?.legendSeriesName}
      transformDataForCharts={transformDataForCharts}
      selectedDuration={selectedDuration}
      currentDate={currentDate}
      currentYear={currentYear}
      selectedAreas={selectedAreas}
      shellVariant={theme?.shellVariant}
      strokeWidthProfile={theme?.strokeWidthProfile ?? 'standard'}
      dynamicUnitFallback={theme?.dynamicUnitFallback ?? ''}
      exportControl={exportControl}
      emptyStateExtras={emptyStateExtras}
      blankChartPreview={blankChartPreview}
      ChartLoader={ChartLoader}
      outerStyleOverride={theme?.outerStyleOverride ?? {}}
      titleStyleOverride={theme?.titleStyleOverride ?? {}}
      plotStyleOverride={theme?.plotStyleOverride ?? {}}
      cardShellStyle={theme?.cardShellStyle ?? {}}
      cardHeaderStyle={theme?.cardHeaderStyle ?? {}}
      cssTooltipStyle={theme?.cssTooltipStyle}
      resolveThemePalette={theme?.resolveThemePalette}
      loaderHeight={theme?.loaderHeight ?? '100%'}
      loaderLight={theme?.loaderLight ?? false}
    />
  );
}

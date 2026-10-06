import SavingsStrategyChartAdapter from '../charts/savings/SavingsStrategyChartAdapter';

export function SavingsByStrategyCard({
  title,
  savingsByStrategy,
  isLoading = false,
  globalLoading = false,
  theme,
  customDatesIncomplete = false,
  ChartLoader = null,
}) {
  return (
    <SavingsStrategyChartAdapter
      title={title}
      savingsByStrategy={savingsByStrategy}
      isLoading={isLoading}
      globalLoading={globalLoading}
      chartSurface={theme?.chartSurface ?? 'dark'}
      embedded={theme?.embedded ?? false}
      customDatesIncomplete={customDatesIncomplete}
      shellVariant={theme?.shellVariant}
      ChartLoader={ChartLoader}
      outerStyleOverride={theme?.outerStyleOverride ?? {}}
      plotStyleOverride={theme?.plotStyleOverride ?? {}}
      headerStyleOverride={theme?.headerStyleOverride ?? {}}
      cardShellStyle={theme?.cardShellStyle ?? {}}
      cardClassName={theme?.cardClassName}
      cssTooltipStyle={theme?.cssTooltipStyle}
      resolveThemeColor={theme?.resolveThemeColor}
      resolveSegmentLabelColors={theme?.resolveSegmentLabelColors}
      loaderHeight={theme?.loaderHeight ?? '100%'}
      loaderLight={theme?.loaderLight ?? false}
    />
  );
}

import React, { useMemo, useCallback } from 'react';
import {
  savingsStrategyToPieRows,
  savingsStrategyEntriesFromPayload,
  calculateTotalSavingsPercentage,
  isSavingsStrategyTransitionalData,
} from '../transforms/savingsStrategyToPieRows';
import {
  resolveSavingsStrategyTheme,
  SAVINGS_STRATEGY_THEME_PRESETS,
} from './savingsStrategyTheme';
import {
  resolveSavingsStrategyColor,
  calculateSavingsCenterLabelValue,
  SAVINGS_STRATEGY_EMPTY_NULL_MESSAGE,
  SAVINGS_STRATEGY_EMPTY_ZERO_MESSAGE,
} from './savingsStrategyConfig';
import { SavingsStrategyChartView } from './SavingsStrategyChartView';
import { savingsStrategyChartPropsAreEqual } from './savingsStrategyMemoCompare';

function SavingsStrategyChartAdapterInner({
  title,
  savingsByStrategy,
  isLoading = false,
  globalLoading = false,
  chartSurface = 'dark',
  embedded = false,
  customDatesIncomplete = false,
  shellVariant = 'basic-energy',
  ChartLoader = null,
  outerStyleOverride = {},
  plotStyleOverride = {},
  headerStyleOverride = {},
  cardShellStyle = {},
  cardClassName,
  cssTooltipStyle = null,
  resolveThemeColor = null,
  resolveSegmentLabelColors = null,
  loaderHeight = '100%',
  loaderLight = false,
  showHeader = true,
}) {
  const theme = useMemo(() => {
    // Advanced (standalone or embedded): keep white chrome/labels. Do not pass
    // embedded:true — that resolves to basicEmbedded dark text on dark cards.
    if (shellVariant === 'advanced-card') {
      return resolveSavingsStrategyTheme({
        preset: SAVINGS_STRATEGY_THEME_PRESETS.advanced,
      });
    }
    if (embedded && chartSurface === 'dark') {
      return resolveSavingsStrategyTheme({ preset: SAVINGS_STRATEGY_THEME_PRESETS.customized });
    }
    if (embedded) {
      return resolveSavingsStrategyTheme({ preset: SAVINGS_STRATEGY_THEME_PRESETS.basicEmbedded });
    }
    if (shellVariant === 'customized-builtin') {
      return resolveSavingsStrategyTheme({ preset: SAVINGS_STRATEGY_THEME_PRESETS.customized });
    }
    return resolveSavingsStrategyTheme({ chartSurface });
  }, [shellVariant, chartSurface, embedded]);

  const totalSavingsPercentage = useMemo(
    () => calculateTotalSavingsPercentage(savingsByStrategy),
    [savingsByStrategy]
  );

  const displayTitle = useMemo(() => {
    if (totalSavingsPercentage <= 0) return title;
    const accent =
      embedded || chartSurface === 'light' ? theme.header : theme.centerLabel;
    return (
      <span>
        {title}{' '}
        <span style={{ color: accent, fontWeight: 'bold' }}>
          ({Number(totalSavingsPercentage).toFixed(1)}%)
        </span>
      </span>
    );
  }, [title, totalSavingsPercentage, embedded, chartSurface, theme]);

  const pieData = useMemo(
    () => savingsStrategyToPieRows(savingsByStrategy),
    [savingsByStrategy]
  );

  const centerLabelValue = useMemo(() => calculateSavingsCenterLabelValue(pieData), [pieData]);

  const getSegmentColor = useCallback(
    (strategyName) =>
      resolveSavingsStrategyColor(strategyName, {
        paletteProfile: theme.paletteProfile,
        resolveThemeColor,
      }),
    [theme.paletteProfile, resolveThemeColor]
  );

  const status = useMemo(() => {
    if (customDatesIncomplete) return 'custom-range-placeholder';
    if (isLoading || globalLoading) return 'loading';
    if (!savingsByStrategy) return 'empty-null';
    if (isSavingsStrategyTransitionalData(savingsByStrategy)) return 'loading';
    const entries = savingsStrategyEntriesFromPayload(savingsByStrategy);
    const total = entries.reduce((s, d) => s + d.value, 0);
    if (total === 0) return 'empty-zero';
    return 'ready';
  }, [customDatesIncomplete, isLoading, globalLoading, savingsByStrategy]);

  const headerTitle = useMemo(() => {
    if (status === 'empty-null' || status === 'empty-zero') return displayTitle;
    return title;
  }, [status, title, displayTitle]);

  const outerStyle = shellVariant === 'customized-builtin'
    ? { ...cardShellStyle, ...outerStyleOverride }
    : {
        ...(theme.outerBg != null
          ? { backgroundColor: theme.outerBg, border: theme.outerBorder }
          : {}),
        ...outerStyleOverride,
        ...cardShellStyle,
      };

  const plotStyle = {
    ...(theme.plotBg != null ? { backgroundColor: theme.plotBg, border: theme.plotBorder } : {}),
    ...plotStyleOverride,
  };

  return (
    <SavingsStrategyChartView
      status={status}
      title={title}
      headerTitle={headerTitle}
      pieData={pieData}
      centerLabelValue={centerLabelValue}
      theme={theme}
      getSegmentColor={getSegmentColor}
      resolveSegmentLabelColors={resolveSegmentLabelColors}
      outerStyle={outerStyle}
      plotStyle={plotStyle}
      headerStyle={headerStyleOverride}
      showHeader={showHeader && !embedded}
      loaderMessage={`Loading ${title} data...`}
      emptyNullMessage={SAVINGS_STRATEGY_EMPTY_NULL_MESSAGE}
      emptyZeroMessage={SAVINGS_STRATEGY_EMPTY_ZERO_MESSAGE}
      LoaderComponent={ChartLoader}
      loaderHeight={loaderHeight}
      loaderLight={loaderLight}
      cssTooltipStyle={cssTooltipStyle}
      cardClassName={cardClassName}
    />
  );
}

export const SavingsStrategyChartAdapter = React.memo(
  SavingsStrategyChartAdapterInner,
  savingsStrategyChartPropsAreEqual
);

export { savingsStrategyChartPropsAreEqual } from './savingsStrategyMemoCompare';

export default SavingsStrategyChartAdapter;

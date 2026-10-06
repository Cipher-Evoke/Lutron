export const SAVINGS_BY_STRATEGY_WIDGET_KEY = 'savings_by_strategy';

export const SAVINGS_BY_STRATEGY_THEME_PRESETS = {
  basic: 'basic',
  advanced: 'advanced',
  customized: 'customized',
};

export const SAVINGS_BY_STRATEGY_ADAPTER_SHELL = {
  [SAVINGS_BY_STRATEGY_THEME_PRESETS.basic]: 'basic-energy',
  [SAVINGS_BY_STRATEGY_THEME_PRESETS.advanced]: 'advanced-card',
  [SAVINGS_BY_STRATEGY_THEME_PRESETS.customized]: 'customized-builtin',
};

const BASIC_SLOT_HEIGHT_PX = 460; // Match Basic Consumption By Area Groups card height
const BASIC_LIGHT_FULL_CARD_HEIGHT_PX = 488;

const BASIC_SLOT_OUTER_STYLE = {
  width: '100%',
  minHeight: BASIC_SLOT_HEIGHT_PX,
  height: BASIC_SLOT_HEIGHT_PX,
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'rgba(128, 120, 100, 0.6)',
  borderRadius: '8px',
  padding: '20px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  marginBottom: 0,
  border: '1px solid #ccc',
};

const BASIC_PLOT_FLEX_STYLE = {
  flex: 1,
  minHeight: 0,
  border: '1px solid #ddd',
  borderRadius: '4px',
  backgroundColor: '#767061',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  userSelect: 'none',
  WebkitUserSelect: 'none',
  MozUserSelect: 'none',
  msUserSelect: 'none',
};

const CUSTOMIZED_BUILTIN_CARD = {
  backgroundColor: 'rgba(128, 120, 100, 0.6)',
  borderRadius: '8px',
  padding: '20px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  marginBottom: '20px',
  border: '1px solid #ccc',
};

const CUSTOMIZED_BUILTIN_PLOT = {
  height: '360px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  backgroundColor: '#767061',
  padding: '24px 24px 16px',
  position: 'relative',
  userSelect: 'none',
  WebkitUserSelect: 'none',
  MozUserSelect: 'none',
  msUserSelect: 'none',
};

const CUSTOMIZED_BUILTIN_LOADER_HEIGHT = '300px';

export function resolveSavingsByStrategyLoading({
  chartLoadingSavingsByStrategy,
  savingsByStrategy,
  customDatesIncomplete = false,
}) {
  if (customDatesIncomplete) return false;
  if (chartLoadingSavingsByStrategy) return true;
  if (!savingsByStrategy) return true;
  return false;
}

export function resolveSavingsByStrategyHeaderStyle({
  chartHeaderStyle = {},
  chartSurface = 'dark',
  embedded = false,
}) {
  if (embedded) return { ...chartHeaderStyle, color: '#1565C0' };
  if (chartSurface === 'light') return { ...chartHeaderStyle, color: '#000000' };
  return chartHeaderStyle;
}

export function resolveSavingsByStrategyTheme({
  preset = SAVINGS_BY_STRATEGY_THEME_PRESETS.basic,
  chartSurface = 'dark',
  chartHeaderStyle = {},
  embedded = false,
  energyLightFullCardHeightPx = BASIC_LIGHT_FULL_CARD_HEIGHT_PX,
  advancedSurface = null,
  customizedSurface = null,
} = {}) {
  const shellVariant =
    SAVINGS_BY_STRATEGY_ADAPTER_SHELL[preset] ||
    SAVINGS_BY_STRATEGY_ADAPTER_SHELL[SAVINGS_BY_STRATEGY_THEME_PRESETS.basic];

  if (preset === SAVINGS_BY_STRATEGY_THEME_PRESETS.basic) {
    const light = chartSurface === 'light';

    let outerStyleOverride;
    if (embedded) {
      outerStyleOverride = {
        width: '100%',
        height: '100%',
        minHeight: 0,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'transparent',
        border: 'none',
        borderRadius: 0,
        padding: 0,
        boxShadow: 'none',
        marginBottom: 0,
        flex: 1,
      };
    } else if (light) {
      const cardHeight = Math.max(
        energyLightFullCardHeightPx || 0,
        BASIC_SLOT_HEIGHT_PX
      );
      outerStyleOverride = {
        ...BASIC_SLOT_OUTER_STYLE,
        backgroundColor: '#ffffff',
        border: '1px solid #e8e8e8',
        height: cardHeight,
        minHeight: cardHeight,
        overflow: 'visible',
      };
    } else {
      outerStyleOverride = {
        ...BASIC_SLOT_OUTER_STYLE,
        overflow: 'visible',
      };
    }

    let plotStyleOverride;
    if (embedded) {
      plotStyleOverride =
        chartSurface === 'dark'
          ? {
              ...BASIC_PLOT_FLEX_STYLE,
              flex: 1,
              height: '100%',
              minHeight: 0,
              backgroundColor: 'transparent',
              overflow: 'visible',
            }
          : {
              ...BASIC_PLOT_FLEX_STYLE,
              flex: 1,
              height: '100%',
              minHeight: 0,
              border: 'none',
              backgroundColor: 'transparent',
              overflow: 'visible',
            };
    } else if (light) {
      plotStyleOverride = {
        ...BASIC_PLOT_FLEX_STYLE,
        backgroundColor: '#ffffff',
        border: '1px solid #e0e0e0',
        overflow: 'visible',
        minHeight: 340,
      };
    } else {
      plotStyleOverride = {
        ...BASIC_PLOT_FLEX_STYLE,
        overflow: 'visible',
        minHeight: 340,
      };
    }

    return {
      preset,
      shellVariant,
      chartSurface,
      embedded,
      outerStyleOverride,
      plotStyleOverride,
      headerStyleOverride: resolveSavingsByStrategyHeaderStyle({
        chartHeaderStyle,
        chartSurface,
        embedded,
      }),
      loaderLight: light,
      loaderHeight: '100%',
      cardShellStyle: {},
      cardClassName: undefined,
      cssTooltipStyle: null,
      resolveThemeColor: null,
      resolveSegmentLabelColors: null,
    };
  }

  if (preset === SAVINGS_BY_STRATEGY_THEME_PRESETS.advanced) {
    const surface = advancedSurface || {};
    if (embedded) {
      return {
        preset,
        shellVariant,
        chartSurface: 'dark',
        embedded: true,
        outerStyleOverride: {
          width: '100%',
          height: '100%',
          minHeight: 0,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'transparent',
          border: 'none',
          borderRadius: 0,
          padding: 0,
          boxShadow: 'none',
          marginBottom: 0,
          flex: 1,
        },
        plotStyleOverride: {
          flex: 1,
          minHeight: 0,
          height: '100%',
          border: 'none',
          borderRadius: '4px',
          backgroundColor: 'transparent',
          userSelect: 'none',
          overflow: 'visible',
        },
        headerStyleOverride: chartHeaderStyle,
        loaderLight: false,
        loaderHeight: '100%',
        cardShellStyle: {},
        cardClassName: undefined,
        cssTooltipStyle: surface.cssTooltipStyle || null,
        resolveThemeColor: surface.resolveThemeColor || null,
        resolveSegmentLabelColors: surface.resolveSegmentLabelColors || null,
      };
    }
    return {
      preset,
      shellVariant,
      chartSurface: 'dark',
      embedded: false,
      outerStyleOverride: {
        background: surface.cardBackground,
        border: surface.cardBorder,
        boxShadow: surface.cardShadow,
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
      },
      plotStyleOverride: {
        height: '400px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        backgroundColor: 'transparent',
        userSelect: 'none',
        overflow: 'visible',
      },
      headerStyleOverride: chartHeaderStyle,
      loaderLight: false,
      loaderHeight: surface.loaderHeight || '300px',
      cardShellStyle: {},
      cardClassName: surface.cardClassName || 'chart-card-animated',
      cssTooltipStyle: surface.cssTooltipStyle || null,
      resolveThemeColor: surface.resolveThemeColor || null,
      resolveSegmentLabelColors: surface.resolveSegmentLabelColors || null,
    };
  }

  if (preset === SAVINGS_BY_STRATEGY_THEME_PRESETS.customized) {
    const surface = customizedSurface || {};
    return {
      preset,
      shellVariant,
      chartSurface: 'dark',
      embedded: false,
      outerStyleOverride: {},
      plotStyleOverride: surface.plotStyleOverride || CUSTOMIZED_BUILTIN_PLOT,
      headerStyleOverride: chartHeaderStyle,
      loaderLight: false,
      loaderHeight: surface.loaderHeight || CUSTOMIZED_BUILTIN_LOADER_HEIGHT,
      cardShellStyle: surface.cardShellStyle || CUSTOMIZED_BUILTIN_CARD,
      cardClassName: surface.cardClassName || 'chart-card-animated',
      cssTooltipStyle: null,
      resolveThemeColor: null,
      resolveSegmentLabelColors: null,
    };
  }

  return resolveSavingsByStrategyTheme({
    preset: SAVINGS_BY_STRATEGY_THEME_PRESETS.basic,
    chartSurface,
    chartHeaderStyle,
    embedded,
    energyLightFullCardHeightPx,
  });
}

export function resolveSavingsByStrategyExportActions(thunks) {
  return {
    label: 'Savings By Strategy',
    emailThunk: thunks.sendSavingsByStrategyEmail,
    downloadThunk: thunks.downloadSavingsByStrategy,
  };
}

export function resolveSavingsByStrategyApiPathExportActions(apiPath, thunks) {
  const path = String(apiPath || '').trim();
  if (!path.includes('/dashboard/saving_by_stratergy')) return null;
  return {
    label: 'Energy Savings',
    emailThunk: thunks.sendEnergySavingsEmail,
    downloadThunk: thunks.downloadEnergySavings,
  };
}

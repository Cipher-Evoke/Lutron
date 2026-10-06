import { resolvePieChartTheme } from '../charts/themes/pieChartTheme';

export const TOTAL_CONSUMPTION_BY_GROUP_WIDGET_KEY = 'total_consumption_by_group';

export const TOTAL_CONSUMPTION_BY_GROUP_THEME_PRESETS = {
  basic: 'basic',
  advanced: 'advanced',
  customized: 'customized',
};

export const TOTAL_CONSUMPTION_BY_GROUP_ADAPTER_SHELL = {
  [TOTAL_CONSUMPTION_BY_GROUP_THEME_PRESETS.basic]: 'basic-energy',
  [TOTAL_CONSUMPTION_BY_GROUP_THEME_PRESETS.advanced]: 'advanced-card',
  [TOTAL_CONSUMPTION_BY_GROUP_THEME_PRESETS.customized]: 'customized-builtin',
};

/** Legacy advanced/customized export loading key prefix (not the display title). */
export const TOTAL_CONSUMPTION_BY_GROUP_LEGACY_EXPORT_LABEL = 'Consumption by Group';

const CUSTOMIZED_BUILTIN_CARD = {
  backgroundColor: 'rgba(128, 120, 100, 0.6)',
  borderRadius: '8px',
  padding: '20px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  marginBottom: '20px',
  border: '1px solid #ccc',
};

const CUSTOMIZED_BUILTIN_HEADER = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
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

/**
 * Dropdown state key — basic uses widget key; advanced/customized use display title.
 */
export function resolveTotalConsumptionByGroupExportDropdownKey(preset, title) {
  if (preset === TOTAL_CONSUMPTION_BY_GROUP_THEME_PRESETS.basic) {
    return TOTAL_CONSUMPTION_BY_GROUP_WIDGET_KEY;
  }
  return title;
}

/**
 * Export loading state prefix — basic uses widget key; advanced/customized use legacy label.
 */
export function resolveTotalConsumptionByGroupExportLoadingPrefix(preset) {
  if (preset === TOTAL_CONSUMPTION_BY_GROUP_THEME_PRESETS.basic) {
    return TOTAL_CONSUMPTION_BY_GROUP_WIDGET_KEY;
  }
  return TOTAL_CONSUMPTION_BY_GROUP_LEGACY_EXPORT_LABEL;
}

export function resolveTotalConsumptionByGroupTheme({
  preset = TOTAL_CONSUMPTION_BY_GROUP_THEME_PRESETS.basic,
  chartSurface = 'dark',
  chartHeaderStyle = {},
  energyLightFullCardHeightPx = null,
  advancedSurface = null,
  customizedSurface = null,
} = {}) {
  const shellVariant =
    TOTAL_CONSUMPTION_BY_GROUP_ADAPTER_SHELL[preset] ||
    TOTAL_CONSUMPTION_BY_GROUP_ADAPTER_SHELL[TOTAL_CONSUMPTION_BY_GROUP_THEME_PRESETS.basic];

  if (preset === TOTAL_CONSUMPTION_BY_GROUP_THEME_PRESETS.basic) {
    const light = chartSurface === 'light';
    // Pie labels sit outside outerRadius (~110 + 35). Default basic-energy slot
    // (360px) clips the top leader-line text (e.g. WS). Tall enough for Basic only.
    const BASIC_CONSUMPTION_BY_GROUP_CARD_HEIGHT_PX = 460;
    const cardHeight = Math.max(
      energyLightFullCardHeightPx || 0,
      BASIC_CONSUMPTION_BY_GROUP_CARD_HEIGHT_PX
    );
    const outerStyleOverride = {
      height: cardHeight,
      minHeight: cardHeight,
      overflow: 'visible',
    };

    return {
      preset,
      shellVariant,
      chartSurface,
      outerStyleOverride,
      titleStyleOverride: null,
      loaderLight: light,
      showFetchErrorState: false,
      showZeroSegmentsState: false,
      resolveThemePalette: null,
      resolveSegmentLabelColors: null,
      cssTooltipStyle: null,
      cardShellStyle: {},
      cardHeaderStyle: {},
      plotStyleOverride: {
        overflow: 'visible',
        minHeight: 340,
      },
      loaderHeight: '100%',
    };
  }

  if (preset === TOTAL_CONSUMPTION_BY_GROUP_THEME_PRESETS.advanced) {
    const surface = advancedSurface || {};
    // Match Advanced Savings by Strategy plot height (400px) so side-by-side cards align.
    return {
      preset,
      shellVariant,
      chartSurface: 'dark',
      outerStyleOverride: {
        background: surface.cardBackground,
        border: surface.cardBorder,
        boxShadow: surface.cardShadow,
      },
      titleStyleOverride: chartHeaderStyle,
      loaderLight: false,
      showFetchErrorState: false,
      showZeroSegmentsState: false,
      resolveThemePalette: surface.resolveThemePalette || null,
      resolveSegmentLabelColors: surface.resolveSegmentLabelColors || null,
      cssTooltipStyle: surface.cssTooltipStyle || null,
      cardShellStyle: {},
      cardHeaderStyle: {},
      plotStyleOverride: {
        height: '400px',
      },
      loaderHeight: '100%',
    };
  }

  if (preset === TOTAL_CONSUMPTION_BY_GROUP_THEME_PRESETS.customized) {
    const surface = customizedSurface || {};
    return {
      preset,
      shellVariant,
      chartSurface: 'dark',
      outerStyleOverride: {},
      titleStyleOverride: null,
      loaderLight: false,
      showFetchErrorState: true,
      showZeroSegmentsState: true,
      resolveThemePalette: null,
      resolveSegmentLabelColors: null,
      cssTooltipStyle: null,
      cardShellStyle: surface.cardShellStyle || CUSTOMIZED_BUILTIN_CARD,
      cardHeaderStyle: surface.cardHeaderStyle || CUSTOMIZED_BUILTIN_HEADER,
      plotStyleOverride: surface.plotStyleOverride || CUSTOMIZED_BUILTIN_PLOT,
      loaderHeight: surface.loaderHeight || CUSTOMIZED_BUILTIN_LOADER_HEIGHT,
    };
  }

  return resolveTotalConsumptionByGroupTheme({
    preset: TOTAL_CONSUMPTION_BY_GROUP_THEME_PRESETS.basic,
    chartSurface,
    chartHeaderStyle,
    energyLightFullCardHeightPx,
  });
}

export function resolveTotalConsumptionByGroupTitleStyle(chartHeaderStyle, chartSurface) {
  const dc = resolvePieChartTheme({ chartSurface });
  return { ...chartHeaderStyle, color: dc.header };
}

export function resolveTotalConsumptionByGroupLoading({
  chartLoadingTotalConsumptionByGroup,
  totalConsumptionByGroup,
}) {
  if (chartLoadingTotalConsumptionByGroup) return true;
  if (!totalConsumptionByGroup) return true;
  return false;
}

import { resolveEnergyChartTheme } from '../../charts/themes/energyChartTheme';
import { calculatePeakMinFromChartData } from '../../charts/transforms/calculatePeakMinFromChartData';
import { formatPeakMinDisplay } from '../../charts/transforms/formatPeakMinDisplay';
import {
  createEnergyExportActionMap,
  ENERGY_EXPORT_WIDGET_KEYS,
} from '../../export/energyExportActionMap';
import {
  UNIFIED_ENERGY_WIDGET_MODES,
  resolveUnifiedEnergyChartType,
} from './energyWidgetModes';

export const UNIFIED_ENERGY_THEME_PRESETS = {
  basic: 'basic',
  advanced: 'advanced',
  customized: 'customized',
};

export const UNIFIED_ENERGY_ADAPTER_SHELL = {
  [UNIFIED_ENERGY_THEME_PRESETS.basic]: 'basic-energy',
  [UNIFIED_ENERGY_THEME_PRESETS.advanced]: 'advanced-card',
  [UNIFIED_ENERGY_THEME_PRESETS.customized]: 'customized-builtin',
};

const BASIC_LIGHT_FULL_CARD_HEIGHT_PX = 488;

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

const CUSTOMIZED_BUILTIN_LINE_PLOT = {
  height: '420px',
  minHeight: '380px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  backgroundColor: '#767061',
  padding: '10px',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  userSelect: 'none',
  WebkitUserSelect: 'none',
  MozUserSelect: 'none',
  msUserSelect: 'none',
};

const CUSTOMIZED_BUILTIN_LOADER_HEIGHT = '300px';

export function resolveUnifiedEnergyLoading({
  energyLoading,
  chartLoadingFlag,
  energyData,
  customDatesIncomplete = false,
}) {
  if (customDatesIncomplete) return false;
  if (energyLoading) return true;
  if (chartLoadingFlag) return true;
  if (!energyData) return true;
  return false;
}

export function resolveUnifiedEnergyData({
  energyData,
  customDatesIncomplete = false,
}) {
  if (customDatesIncomplete) return null;
  return energyData;
}

export function resolveUnifiedEnergyEmptyStateVariant(customDatesIncomplete = false) {
  return customDatesIncomplete ? 'blank' : 'message';
}

export function resolveUnifiedEnergyChartData(energyData, mode, transformDataForCharts) {
  if (!energyData || typeof transformDataForCharts !== 'function') return [];
  return transformDataForCharts(energyData, resolveUnifiedEnergyChartType(mode));
}

export function resolveUnifiedEnergyPeakMin(chartData) {
  if (!chartData || chartData.length === 0) {
    return { peak: { value: null, time: null }, min: { value: null, time: null } };
  }
  return calculatePeakMinFromChartData(chartData);
}

export function resolveUnifiedEnergyPeakMinDisplay(entry, options = {}) {
  return formatPeakMinDisplay(entry, options);
}

export function resolveUnifiedEnergyExportActions(mode, thunks) {
  const map = createEnergyExportActionMap(thunks);
  if (mode === UNIFIED_ENERGY_WIDGET_MODES.savings) {
    return map[ENERGY_EXPORT_WIDGET_KEYS.SAVINGS];
  }
  return map[ENERGY_EXPORT_WIDGET_KEYS.CONSUMPTION];
}

export function resolveUnifiedEnergyTheme({
  preset = UNIFIED_ENERGY_THEME_PRESETS.basic,
  mode = UNIFIED_ENERGY_WIDGET_MODES.consumption,
  chartSurface = 'dark',
  chartHeaderStyle = {},
  energyLightFullCardHeightPx = BASIC_LIGHT_FULL_CARD_HEIGHT_PX,
  advancedSurface = null,
  customizedSurface = null,
} = {}) {
  const shellVariant =
    UNIFIED_ENERGY_ADAPTER_SHELL[preset] ||
    UNIFIED_ENERGY_ADAPTER_SHELL[UNIFIED_ENERGY_THEME_PRESETS.basic];

  if (preset === UNIFIED_ENERGY_THEME_PRESETS.basic) {
    const light = chartSurface === 'light';
    const ec = resolveEnergyChartTheme({ chartSurface });
    const outerStyleOverride = light
      ? { height: energyLightFullCardHeightPx, minHeight: energyLightFullCardHeightPx }
      : {};

    return {
      preset,
      shellVariant,
      chartSurface,
      outerStyleOverride,
      plotStyleOverride: {},
      titleStyleOverride: { ...chartHeaderStyle, color: ec.header },
      loaderLight: light,
      loaderHeight: '100%',
      strokeWidthProfile: 'standard',
      dynamicUnitFallback: '',
      cardShellStyle: {},
      cardHeaderStyle: {},
      cardClassName: undefined,
      cssTooltipStyle: null,
      resolveThemePalette: null,
      legendSeriesName: null,
    };
  }

  if (preset === UNIFIED_ENERGY_THEME_PRESETS.advanced) {
    const surface = advancedSurface || {};
    return {
      preset,
      shellVariant,
      chartSurface: 'dark',
      outerStyleOverride: {
        background: surface.cardBackground,
        border: surface.cardBorder,
        boxShadow: surface.cardShadow,
      },
      plotStyleOverride: {},
      titleStyleOverride: chartHeaderStyle,
      loaderLight: false,
      loaderHeight: '100%',
      strokeWidthProfile: 'standard',
      dynamicUnitFallback: '',
      cardShellStyle: {},
      cardHeaderStyle: {},
      cardClassName: surface.cardClassName,
      cssTooltipStyle: surface.cssTooltipStyle || null,
      resolveThemePalette: surface.resolveThemePalette || null,
      legendSeriesName: null,
    };
  }

  if (preset === UNIFIED_ENERGY_THEME_PRESETS.customized) {
    const surface = customizedSurface || {};
    return {
      preset,
      shellVariant,
      chartSurface: 'dark',
      outerStyleOverride: {},
      plotStyleOverride: surface.plotStyleOverride || CUSTOMIZED_BUILTIN_LINE_PLOT,
      titleStyleOverride: chartHeaderStyle,
      loaderLight: false,
      loaderHeight: surface.loaderHeight || CUSTOMIZED_BUILTIN_LOADER_HEIGHT,
      strokeWidthProfile: 'bold',
      dynamicUnitFallback:
        mode === UNIFIED_ENERGY_WIDGET_MODES.consumption ? 'W' : '',
      cardShellStyle: surface.cardShellStyle || CUSTOMIZED_BUILTIN_CARD,
      cardHeaderStyle: surface.cardHeaderStyle || CUSTOMIZED_BUILTIN_HEADER,
      cardClassName: undefined,
      cssTooltipStyle: null,
      resolveThemePalette: null,
      legendSeriesName: surface.legendSeriesName || null,
    };
  }

  return resolveUnifiedEnergyTheme({
    preset: UNIFIED_ENERGY_THEME_PRESETS.basic,
    mode,
    chartSurface,
    chartHeaderStyle,
    energyLightFullCardHeightPx,
  });
}

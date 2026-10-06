import {
  resolveAdvancedEnergyExportMenuPreset,
  resolveEnergyExportMenuPresetFromTheme,
} from '../../export/components';
import {
  ENERGY_CHART_THEME_PRESETS,
  resolveEnergyChartTheme,
} from '../../charts/themes/energyChartTheme';

export const CONSUMPTION_SAVINGS_COMBINED_SHELL_VARIANTS = {
  basic: 'basic',
  advanced: 'advanced',
  customized: 'customized',
};

const DEFAULT_TITLE_STYLE = {
  margin: 0,
  fontSize: '18px',
  fontWeight: 600,
  color: '#000000',
};

/** Advanced/Customized combined card target (unchanged). */
export const CONSUMPTION_SAVINGS_COMBINED_MIN_HEIGHT_PX = 420 + 228;
/** Basic-only combined card — denser for ~15" laptop; header/filters + plot. */
export const BASIC_CONSUMPTION_SAVINGS_COMBINED_MIN_HEIGHT_PX = 300 + 180;

const BASIC_EXPORT_MENU_STYLES = {
  dropdownBg: '#ffffff',
  dropdownBorder: '1px solid rgba(0,0,0,0.15)',
  dropdownText: 'rgba(0, 0, 0, 0.87)',
  dropdownMuted: 'rgba(0, 0, 0, 0.45)',
  dropdownSep: 'rgba(0, 0, 0, 0.12)',
};

const BASIC_PLOT_STYLE = {
  // Match BASIC_CONSUMPTION_SAVINGS_COMBINED_MIN_HEIGHT_PX (300 + chrome) so the plot fills the card.
  height: '300px',
  minHeight: '280px',
  border: '1px solid #e5e7eb',
  borderRadius: '4px',
  backgroundColor: '#ffffff',
  padding: '6px',
  width: '100%',
  boxSizing: 'border-box',
};

/** Basic Savings By Strategy donut — taller so % callouts at top/bottom are not clipped. */
const BASIC_COMBINED_STRATEGY_PLOT_STYLE = {
  ...BASIC_PLOT_STYLE,
  height: '400px',
  minHeight: '400px',
  padding: '18px 12px 20px',
  position: 'relative',
  overflow: 'visible',
};

const LIGHT_CHART_AXIS = {
  gridStroke: '#e5e7eb',
  axisStroke: '#111827',
  tickFill: '#111827',
};

const DARK_CHART_AXIS = {
  gridStroke: '#ffffff',
  axisStroke: '#ffffff',
  tickFill: '#ffffff',
};

/** Matches advanced standalone Energy line chart plot (transparent on themed card). */
const ADVANCED_COMBINED_PLOT_STYLE = {
  height: '420px',
  minHeight: '380px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  backgroundColor: 'transparent',
  padding: '10px',
  width: '100%',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
};

const ADVANCED_COMBINED_STRATEGY_PLOT_STYLE = {
  ...ADVANCED_COMBINED_PLOT_STYLE,
  height: '400px',
  minHeight: '400px',
  padding: '24px 24px 16px',
  position: 'relative',
  overflow: 'visible',
};

/** Matches customized built-in Energy line chart plot (`BUILTIN_LINE_PLOT_BOX`). */
const CUSTOMIZED_COMBINED_PLOT_STYLE = {
  height: '420px',
  minHeight: '380px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  backgroundColor: '#767061',
  padding: '10px',
  width: '100%',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  userSelect: 'none',
  WebkitUserSelect: 'none',
  MozUserSelect: 'none',
  msUserSelect: 'none',
};

const CUSTOMIZED_COMBINED_STRATEGY_PLOT_STYLE = {
  ...CUSTOMIZED_COMBINED_PLOT_STYLE,
  height: '400px',
  minHeight: '400px',
  padding: '24px 24px 16px',
  position: 'relative',
  overflow: 'visible',
};

/**
 * @param {{
 *   shellVariant?: string,
 *   contentColor?: string,
 *   advancedSurface?: Record<string, unknown> | null,
 *   titleStyle?: Record<string, unknown>,
 * }} options
 */
export function resolveConsumptionSavingsCombinedChrome({
  shellVariant = CONSUMPTION_SAVINGS_COMBINED_SHELL_VARIANTS.basic,
  contentColor = 'rgba(128, 120, 100, 0.7)',
  advancedSurface = null,
  titleStyle = DEFAULT_TITLE_STYLE,
} = {}) {
  if (shellVariant === CONSUMPTION_SAVINGS_COMBINED_SHELL_VARIANTS.customized) {
    const surface = advancedSurface || {};
    const energyTheme = resolveEnergyChartTheme({
      preset: ENERGY_CHART_THEME_PRESETS.customized,
    });
    const exportMenuPreset = resolveEnergyExportMenuPresetFromTheme(
      {
        dropdownBg: energyTheme.dropdownBg,
        dropdownBorder: energyTheme.dropdownBorder,
        dropdownText: energyTheme.dropdownText,
        dropdownMuted: energyTheme.dropdownMuted,
        dropdownSep: energyTheme.dropdownSep,
      },
      { useEmoji: false }
    );

    return {
      shellVariant,
      shell: {
        background: surface.cardBackground || contentColor,
        border: surface.cardBorder || '1px solid #ccc',
        boxShadow: surface.cardShadow || '0 2px 4px rgba(0,0,0,0.1)',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '8px',
        boxSizing: 'border-box',
      },
      shellClassName: surface.cardClassName || 'chart-card-animated',
      divider: '1px solid rgba(255, 255, 255, 0.2)',
      titleStyle,
      tabActiveColor: '#87CEEB',
      tabInactiveColor: 'rgba(255, 255, 255, 0.65)',
      exportColor: energyTheme.exportBtn || '#fff',
      exportMenuPreset,
      exportMenuUseEmoji: false,
      plot: { ...CUSTOMIZED_COMBINED_PLOT_STYLE },
      plotEmpty: {
        ...CUSTOMIZED_COMBINED_PLOT_STYLE,
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        justifyContent: 'center',
        color: '#fff',
      },
      strategyPlot: {
        ...CUSTOMIZED_COMBINED_STRATEGY_PLOT_STYLE,
        display: 'flex',
        flexDirection: 'column',
      },
      chart: DARK_CHART_AXIS,
      summaryColor: titleStyle?.color || '#ffffff',
      loader: {
        border: '3px solid #555',
        borderTop: '3px solid #ffffff',
      },
    };
  }

  if (shellVariant === CONSUMPTION_SAVINGS_COMBINED_SHELL_VARIANTS.advanced) {
    const surface = advancedSurface || {};
    const energyTheme = resolveEnergyChartTheme({
      preset: ENERGY_CHART_THEME_PRESETS.advanced,
    });

    return {
      shellVariant,
      shell: {
        background: surface.cardBackground,
        border: surface.cardBorder || '1px solid #ccc',
        boxShadow: surface.cardShadow || '0 2px 4px rgba(0,0,0,0.1)',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '8px',
        boxSizing: 'border-box',
      },
      shellClassName: surface.cardClassName || 'chart-card-animated',
      divider: '1px solid rgba(255, 255, 255, 0.2)',
      titleStyle,
      tabActiveColor: '#87CEEB',
      tabInactiveColor: 'rgba(255, 255, 255, 0.65)',
      exportColor: energyTheme.exportBtn || '#87CEEB',
      exportMenuPreset: resolveAdvancedEnergyExportMenuPreset({ marginTop: '4px' }),
      exportMenuUseEmoji: false,
      plot: { ...ADVANCED_COMBINED_PLOT_STYLE },
      plotEmpty: {
        ...ADVANCED_COMBINED_PLOT_STYLE,
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        justifyContent: 'center',
        color: titleStyle?.color || '#ffffff',
      },
      strategyPlot: {
        ...ADVANCED_COMBINED_STRATEGY_PLOT_STYLE,
        display: 'flex',
        flexDirection: 'column',
      },
      chart: DARK_CHART_AXIS,
      summaryColor: titleStyle?.color || '#ffffff',
      loader: {
        border: '3px solid #555',
        borderTop: '3px solid #ffffff',
      },
    };
  }

  const exportMenuPreset = resolveEnergyExportMenuPresetFromTheme(BASIC_EXPORT_MENU_STYLES, {
    useEmoji: true,
  });

  return {
    shellVariant,
    shell: {
      backgroundColor: contentColor,
      borderRadius: '8px',
      padding: '10px 12px 6px 12px',
      boxShadow: '0 2px 12px rgba(15, 23, 42, 0.08)',
      marginBottom: '8px',
      border: '1px solid #e5e7eb',
      boxSizing: 'border-box',
    },
    shellClassName: undefined,
    divider: '1px solid #e5e7eb',
    titleStyle: {
      ...titleStyle,
      fontSize: titleStyle?.fontSize || '15px',
      fontWeight: titleStyle?.fontWeight ?? 600,
    },
    tabActiveColor: '#1565C0',
    tabInactiveColor: '#64748b',
    exportColor: '#1565C0',
    exportMenuPreset,
    exportMenuUseEmoji: true,
    plot: { ...BASIC_PLOT_STYLE, padding: '6px 6px 4px 6px' },
    plotEmpty: {
      ...BASIC_PLOT_STYLE,
      padding: '8px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
      justifyContent: 'center',
      color: 'rgba(0, 0, 0, 0.7)',
    },
    strategyPlot: {
      ...BASIC_COMBINED_STRATEGY_PLOT_STYLE,
      display: 'flex',
      flexDirection: 'column',
    },
    chart: LIGHT_CHART_AXIS,
    summaryColor: '#111827',
    loader: {
      border: '3px solid #555',
      borderTop: '3px solid #333',
    },
  };
}

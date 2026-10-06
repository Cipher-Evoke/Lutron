export const SPACE_INSTANT_UTILIZATION_COMBINED_SHELL_VARIANTS = {
  basic: 'basic',
  advanced: 'advanced',
  customized: 'customized',
};

const BASIC_TAB_ACTIVE = '#1565C0';
const BASIC_TAB_INACTIVE = '#64748b';

const DEFAULT_BASIC_TITLE_STYLE = {
  margin: 0,
  fontSize: '15px',
  fontWeight: 600,
  color: '#000000',
  fontFamily: 'inherit',
};

/**
 * @param {{
 *   shellVariant?: string,
 *   contentColor?: string,
 *   advancedSurface?: Record<string, unknown> | null,
 *   titleStyle?: Record<string, unknown>,
 * }} options
 */
export function resolveSpaceInstantUtilizationCombinedChrome({
  shellVariant = SPACE_INSTANT_UTILIZATION_COMBINED_SHELL_VARIANTS.basic,
  contentColor = 'rgba(128, 120, 100, 0.6)',
  advancedSurface = null,
  titleStyle = DEFAULT_BASIC_TITLE_STYLE,
} = {}) {
  if (shellVariant === SPACE_INSTANT_UTILIZATION_COMBINED_SHELL_VARIANTS.advanced) {
    const surface = advancedSurface || {};
    return {
      shellVariant,
      shellSx: {
        background: surface.cardBackground,
        border: surface.cardBorder || '1px solid #ccc',
        boxShadow: surface.cardShadow || '0 2px 4px rgba(0,0,0,0.1)',
        borderRadius: '8px',
        padding: { xs: 2, sm: 2.5, md: 3, lg: 4, xl: 5 },
        minHeight: 0,
        width: '100%',
        marginBottom: { xs: 0.5, sm: 1 },
        boxSizing: 'border-box',
      },
      shellClassName: surface.cardClassName || 'chart-card-animated',
      dividerBorder: '1px solid rgba(255, 255, 255, 0.2)',
      titleStyle,
      tabActiveColor: '#87CEEB',
      tabInactiveColor: 'rgba(255, 255, 255, 0.65)',
      exportColor: '#fff',
    };
  }

  if (shellVariant === SPACE_INSTANT_UTILIZATION_COMBINED_SHELL_VARIANTS.customized) {
    return {
      shellVariant,
      shellSx: {
        backgroundColor: contentColor,
        borderRadius: '8px',
        padding: { xs: 2, sm: 2.5, md: 3, lg: 4, xl: 5 },
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        border: '1px solid #ccc',
        minHeight: 0,
        width: '100%',
        marginBottom: { xs: 0.5, sm: 1 },
        boxSizing: 'border-box',
      },
      dividerBorder: '1px solid rgba(255, 255, 255, 0.2)',
      titleStyle,
      tabActiveColor: '#87CEEB',
      tabInactiveColor: 'rgba(255, 255, 255, 0.65)',
      exportColor: '#fff',
    };
  }

  return {
    shellVariant,
    shellSx: {
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      padding: { xs: '8px 10px 6px', sm: '10px 12px 6px' },
      boxShadow: '0 2px 12px rgba(15, 23, 42, 0.08)',
      border: '1px solid #e5e7eb',
      minHeight: 0,
      width: '100%',
      marginBottom: { xs: 0.5, sm: 1 },
      boxSizing: 'border-box',
    },
    dividerBorder: '1px solid #e5e7eb',
    titleStyle: {
      ...(titleStyle || DEFAULT_BASIC_TITLE_STYLE),
      fontSize: (titleStyle && titleStyle.fontSize) || DEFAULT_BASIC_TITLE_STYLE.fontSize,
    },
    tabActiveColor: BASIC_TAB_ACTIVE,
    tabInactiveColor: BASIC_TAB_INACTIVE,
    exportColor: BASIC_TAB_ACTIVE,
  };
}

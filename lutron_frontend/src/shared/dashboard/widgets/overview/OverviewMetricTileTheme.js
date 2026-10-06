export const OVERVIEW_THEME_VARIANTS = {
  BASIC: 'basic',
  GRID: 'grid',
  ADVANCED: 'advanced',
};

export const OVERVIEW_CARD_VARIANTS = {
  RESPONSIVE: 'responsive',
  FIXED: 'fixed',
};

export const OVERVIEW_SURFACE_VARIANTS = {
  DEFAULT: 'default',
};

const bodyTextDarkBasic = { color: '#64748b' };
const bodyTextMutedBasic = { color: '#94a3b8' };
const bodyTextDarkGrid = { color: '#374151' };
const bodyTextMutedGrid = { color: '#6b7280' };

const ADVANCED_OVERVIEW_ICON_COLORS = {
  'primary.main': '#ffb74d',
  'warning.main': '#ffb74d',
  'secondary.main': '#ce93d8',
};

function resolveAdvancedOverviewIconSx(token, fontSize = 88) {
  return {
    color: ADVANCED_OVERVIEW_ICON_COLORS[token] || token,
    fontSize,
  };
}

export function resolveOverviewMetricTileTheme({
  themeVariant = OVERVIEW_THEME_VARIANTS.BASIC,
  cardVariant = themeVariant === OVERVIEW_THEME_VARIANTS.BASIC
    ? OVERVIEW_CARD_VARIANTS.RESPONSIVE
    : OVERVIEW_CARD_VARIANTS.FIXED,
} = {}) {
  if (themeVariant === OVERVIEW_THEME_VARIANTS.BASIC) {
    return {
      themeVariant,
      cardVariant,
      titleStyle: {
        color: '#1565c0',
        fontWeight: 400,
        fontSize: { xs: '1.2rem', sm: '1.35rem' },
        lineHeight: 1.2,
        textAlign: 'left',
        width: '100%',
        boxSizing: 'border-box',
      },
      dividerSx: { my: 0.4, borderColor: '#e5e7eb' },
      bodyTextDark: bodyTextDarkBasic,
      bodyTextMuted: bodyTextMutedBasic,
      cardHeaderSx: {
        flexShrink: 0,
        width: '100%',
        minWidth: 0,
        minHeight: 0,
      },
      cardBodyMainSx: {
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        width: '100%',
        py: 0.2,
      },
      iconInTile: (color) => ({
        color,
        fontSize: 'clamp(1.1rem, 0.65rem + 3cqi, 1.85rem) !important',
        width: '1em !important',
        height: '1em !important',
        flexShrink: 0,
      }),
      iconInTileLarge: (color) => ({
        color,
        fontSize: 'clamp(2.4rem, 1.1rem + 4.5cqh + 2cqi, 4.5rem) !important',
        width: '1em !important',
        height: '1em !important',
        flexShrink: 0,
      }),
      floorsIconSx: {
        color: 'secondary.main',
        fontSize: 'clamp(3.2rem, 1.4rem + 5.5cqh + 2.5cqi, 6.5rem) !important',
        width: '1em !important',
        height: '1em !important',
        flexShrink: 0,
      },
      labelSmall: { fontSize: 'clamp(0.52rem, 0.34rem + 2.4cqi, 0.72rem)' },
      labelMeta: { fontSize: 'clamp(0.48rem, 0.3rem + 2.1cqi, 0.65rem)' },
      labelSchedule: { fontSize: 'clamp(0.52rem, 0.32rem + 2.3cqi, 0.72rem)' },
      energyHeaderLabelSx: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.25,
        flexShrink: 0,
        mb: 0.2,
        ...bodyTextDarkBasic,
        fontSize: 'clamp(0.55rem, 0.34rem + 2.2cqi, 0.72rem)',
      },
      energyCheckIconSx: {
        color: '#22c55e',
        fontSize: 'clamp(0.6em, 0.5em + 1.1cqi, 0.85em)',
      },
      ringMode: 'responsive',
      ringColorEnergy: '#4caf50',
      ringColorSpace: '#2196f3',
      ringSizeEnergy: null,
      ringSizeSpace: null,
      savingsValueColor: '#15803d',
      floorsCountSx: {
        color: '#1976d2',
        fontSize: 'clamp(2.1rem, 1.2rem + 6cqh + 3cqi, 3.2rem)',
        textAlign: 'center',
      },
      scheduleNextLabel: 'Next Event',
      scheduleNextLabelSx: {
        ...bodyTextMutedBasic,
        fontSize: 'clamp(0.48rem, 0.3rem + 2cqi, 0.65rem)',
      },
      scheduleEventSx: {
        color: '#1976d2',
        ...{ fontSize: 'clamp(0.52rem, 0.32rem + 2.3cqi, 0.72rem)' },
        mt: 0.15,
        lineHeight: 1.15,
      },
      emptyTextSx: { ...bodyTextDarkBasic, fontSize: '0.75rem' },
      spaceUtilCaptionSx: {
        flexShrink: 0,
        ...bodyTextDarkBasic,
        fontSize: 'clamp(0.48rem, 0.3rem + 2cqi, 0.65rem)',
        lineHeight: 1.15,
        px: 0.2,
      },
      quickControlsCaptionSx: {
        ...bodyTextDarkBasic,
        ...{ fontSize: 'clamp(0.48rem, 0.3rem + 2.1cqi, 0.65rem)' },
        lineHeight: 1.2,
      },
      footerBoxSx: { flexShrink: 0, width: '100%', pt: 0.25, px: 0.25 },
      floorsFooterSx: {
        flexShrink: 0,
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        pt: 0.2,
      },
    };
  }

  if (themeVariant === OVERVIEW_THEME_VARIANTS.ADVANCED) {
    const titleColor = 'var(--dashboard-chart-header-text, #ffffff)';
    const bodyTextLight = { color: titleColor };
    const bodyTextMutedLight = { color: 'rgba(255, 255, 255, 0.75)' };

    return {
      themeVariant: OVERVIEW_THEME_VARIANTS.ADVANCED,
      cardVariant: OVERVIEW_CARD_VARIANTS.FIXED,
      titleStyle: {
        color: titleColor,
        fontWeight: 'bold',
        fontSize: '1.7rem',
      },
      dividerSx: { mb: 1, borderColor: 'rgba(255, 255, 255, 0.22)' },
      bodyTextDark: bodyTextLight,
      bodyTextMuted: bodyTextMutedLight,
      cardHeaderSx: null,
      cardBodyMainSx: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        mb: 1.5,
      },
      iconInTile: (color) => resolveAdvancedOverviewIconSx(color),
      iconInTileLarge: (color) => resolveAdvancedOverviewIconSx(color),
      floorsIconSx: { color: '#ce93d8', fontSize: 88 },
      labelSmall: { fontSize: '1.2rem' },
      labelMeta: { fontSize: '1.2rem' },
      labelSchedule: { fontSize: '1.8rem' },
      energyHeaderLabelSx: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.5,
        mb: 1.25,
        ...bodyTextLight,
        fontSize: '1.35rem',
      },
      energyCheckIconSx: { color: '#86efac', fontSize: 26 },
      ringMode: 'fixed',
      ringColorEnergy: '#4caf50',
      ringColorSpace: '#64b5f6',
      ringSizeEnergy: 136,
      ringSizeSpace: 146,
      savingsValueColor: '#86efac',
      floorsCountSx: {
        color: '#90caf9',
        fontSize: '4.25rem',
        textAlign: 'center',
      },
      scheduleNextLabel: 'Next event',
      scheduleNextLabelSx: {
        ...bodyTextMutedLight,
        fontSize: '1.45rem',
        mt: 0.75,
      },
      scheduleEventSx: {
        color: '#90caf9',
        fontSize: '1.8rem',
        mt: 0.35,
      },
      emptyTextSx: { ...bodyTextLight, fontSize: '1.55rem', mt: 0.75 },
      spaceUtilCaptionSx: {
        mt: 1.2,
        flex: 1,
        ...bodyTextLight,
        fontSize: '1.55rem',
      },
      quickControlsCaptionSx: {
        flex: 1,
        ...bodyTextLight,
        fontSize: '1.55rem',
      },
      footerBoxSx: null,
      floorsFooterSx: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
      },
    };
  }

  return {
    themeVariant: OVERVIEW_THEME_VARIANTS.GRID,
    cardVariant: OVERVIEW_CARD_VARIANTS.FIXED,
    titleStyle: {
      color: '#1565c0',
      fontWeight: 'bold',
      fontSize: '1.7rem',
    },
    dividerSx: { mb: 1, borderColor: '#e5e7eb' },
    bodyTextDark: bodyTextDarkGrid,
    bodyTextMuted: bodyTextMutedGrid,
    cardHeaderSx: null,
    cardBodyMainSx: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 1,
      mb: 1.5,
    },
    iconInTile: (color) => ({ color, fontSize: 88 }),
    iconInTileLarge: (color) => ({ color, fontSize: 88 }),
    floorsIconSx: { color: 'secondary.main', fontSize: 88 },
    labelSmall: { fontSize: '1.2rem' },
    labelMeta: { fontSize: '1.2rem' },
    labelSchedule: { fontSize: '1.8rem' },
    energyHeaderLabelSx: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 0.5,
      mb: 1.25,
      ...bodyTextDarkGrid,
      fontSize: '1.35rem',
    },
    energyCheckIconSx: { color: '#22c55e', fontSize: 26 },
    ringMode: 'fixed',
    ringColorEnergy: '#4caf50',
    ringColorSpace: '#2196f3',
    ringSizeEnergy: 136,
    ringSizeSpace: 146,
    savingsValueColor: '#15803d',
    floorsCountSx: {
      color: '#1976d2',
      fontSize: '4.25rem',
      textAlign: 'center',
    },
    scheduleNextLabel: 'Next event',
    scheduleNextLabelSx: {
      ...bodyTextMutedGrid,
      fontSize: '1.45rem',
      mt: 0.75,
    },
    scheduleEventSx: {
      color: '#1976d2',
      fontSize: '1.8rem',
      mt: 0.35,
    },
    emptyTextSx: { ...bodyTextDarkGrid, fontSize: '1.55rem', mt: 0.75 },
    spaceUtilCaptionSx: {
      mt: 1.2,
      flex: 1,
      ...bodyTextDarkGrid,
      fontSize: '1.55rem',
    },
    quickControlsCaptionSx: {
      flex: 1,
      ...bodyTextDarkGrid,
      fontSize: '1.55rem',
    },
    footerBoxSx: null,
    floorsFooterSx: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flex: 1,
    },
  };
}

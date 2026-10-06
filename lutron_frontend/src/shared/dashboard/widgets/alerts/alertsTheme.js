export const ALERTS_THEME_PRESETS = {
  basic: 'basic',
  grid: 'grid',
  advanced: 'advanced',
  customized: 'customized',
};

const GRID_TITLE_STYLE = {
  color: '#1565c0',
  fontWeight: 'bold',
  fontSize: '1.7rem',
};

const BASIC_TITLE_STYLE = {
  color: '#1565c0',
  fontWeight: 400,
  fontSize: { xs: '1.2rem', sm: '1.35rem' },
  lineHeight: 1.2,
  textAlign: 'left',
  width: '100%',
  boxSizing: 'border-box',
};

export function resolveAlertsTheme({
  preset = ALERTS_THEME_PRESETS.grid,
} = {}) {
  if (preset === ALERTS_THEME_PRESETS.basic) {
    return {
      preset: ALERTS_THEME_PRESETS.basic,
      maxPreviewCount: 5,
      headerLayout: 'cardHeader',
      titleStyle: BASIC_TITLE_STYLE,
      titleGap: 0.5,
      bodyTextDark: { color: '#64748b' },
      bodyTextMuted: { color: '#94a3b8' },
      labelSmall: { fontSize: 'clamp(0.52rem, 0.34rem + 2.4cqi, 0.72rem)' },
      labelMeta: { fontSize: 'clamp(0.48rem, 0.3rem + 2.1cqi, 0.65rem)' },
      badgeSx: {
        bgcolor: 'error.main',
        color: 'white',
        borderRadius: '50%',
        minWidth: '1rem',
        height: '1rem',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.625rem',
        fontWeight: 'bold',
      },
      dividerSx: { my: 0.4, borderColor: '#e5e7eb' },
      listScrollable: true,
      alertRowMarginBottom: 0.35,
      alertTypeSx: { lineHeight: 1.2 },
      alertMetaSx: { lineHeight: 1.1, mt: 0.1 },
      truncateRows: true,
      emptyTextSx: { fontSize: '0.75rem' },
      moreAlertsSx: {
        flexShrink: 0,
        mt: 'auto',
        pt: 0.35,
        color: '#dc2626',
        cursor: 'pointer',
        fontWeight: 500,
        fontSize: 'clamp(0.48rem, 0.3rem + 2cqi, 0.65rem)',
        borderTop: '1px solid #f1f5f9',
      },
      moreAlertsVariant: 'body2',
      emptyTextVariant: 'body1',
      alertTypeVariant: 'body1',
      alertMetaVariant: 'body2',
    };
  }

  if (preset === ALERTS_THEME_PRESETS.advanced) {
    const titleColor = 'var(--dashboard-chart-header-text, #ffffff)';
    return {
      preset: ALERTS_THEME_PRESETS.advanced,
      maxPreviewCount: 3,
      headerLayout: 'inline',
      titleStyle: {
        color: titleColor,
        fontWeight: 'bold',
        fontSize: '1.7rem',
      },
      titleGap: 1,
      bodyTextDark: { color: titleColor },
      bodyTextMuted: { color: 'rgba(255, 255, 255, 0.75)' },
      labelSmall: {},
      labelMeta: {},
      badgeSx: {
        bgcolor: '#dc2626',
        color: '#ffffff',
        borderRadius: '50%',
        minWidth: 24,
        height: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 14,
        fontWeight: 'bold',
        border: '1px solid rgba(255, 255, 255, 0.85)',
      },
      dividerSx: { mb: 1, borderColor: 'rgba(255, 255, 255, 0.22)' },
      listScrollable: false,
      alertRowMarginBottom: 1,
      alertTypeSx: { fontSize: '1.3rem' },
      alertMetaSx: { fontSize: '1.15rem' },
      truncateRows: false,
      emptyTextSx: { fontSize: '1.3rem' },
      moreAlertsSx: {
        color: '#fca5a5',
        mt: 1,
        cursor: 'pointer',
        fontWeight: 500,
        fontSize: '1.3rem',
      },
      moreAlertsVariant: 'body1',
      emptyTextVariant: 'body1',
      alertTypeVariant: 'body1',
      alertMetaVariant: 'body2',
    };
  }

  return {
    preset:
      preset === ALERTS_THEME_PRESETS.customized
        ? ALERTS_THEME_PRESETS.customized
        : ALERTS_THEME_PRESETS.grid,
    maxPreviewCount: 3,
    headerLayout: 'inline',
    titleStyle: GRID_TITLE_STYLE,
    titleGap: 1,
    bodyTextDark: { color: '#374151' },
    bodyTextMuted: { color: '#6b7280' },
    labelSmall: {},
    labelMeta: {},
    badgeSx: {
      bgcolor: 'error.main',
      color: 'white',
      borderRadius: '50%',
      minWidth: 24,
      height: 24,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 14,
      fontWeight: 'bold',
    },
    dividerSx: { mb: 1, borderColor: '#e5e7eb' },
    listScrollable: false,
    alertRowMarginBottom: 1,
    alertTypeSx: { fontSize: '1.3rem' },
    alertMetaSx: { fontSize: '1.15rem' },
    truncateRows: false,
    emptyTextSx: { fontSize: '1.3rem' },
    moreAlertsSx: {
      color: '#dc2626',
      mt: 1,
      cursor: 'pointer',
      fontWeight: 500,
      fontSize: '1.3rem',
    },
    moreAlertsVariant: 'body1',
    emptyTextVariant: 'body1',
    alertTypeVariant: 'body1',
    alertMetaVariant: 'body2',
  };
}

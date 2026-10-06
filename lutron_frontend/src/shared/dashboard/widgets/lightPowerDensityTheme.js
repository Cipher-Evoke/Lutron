export const LIGHT_POWER_DENSITY_THEME_PRESETS = {
  basic: 'basic',
  advanced: 'advanced',
  customized: 'customized',
};

const ADVANCED_PANEL_BG = 'var(--dashboard-chart-loading-bg, #232323)';
const ADVANCED_SPINNER = {
  border: '3px solid var(--dashboard-chart-loading-spinner-track, #555555)',
  borderTop: '3px solid var(--dashboard-chart-loading-spinner-head, #ffffff)',
};

export function resolveLightPowerDensityTheme({
  preset = LIGHT_POWER_DENSITY_THEME_PRESETS.basic,
  chartSurface = 'dark',
  metricPanelBorder = null,
} = {}) {
  if (preset === LIGHT_POWER_DENSITY_THEME_PRESETS.basic) {
    const light = chartSurface === 'light';
    const innerBg = light ? '#1565C0' : '#232323';
    return {
      preset,
      panelBg: innerBg,
      loadingBorderRadius: '4px',
      readyBorderRadius: '12px',
      loadingPadding: '30px',
      readyPadding: '24px 20px',
      fillContainer: false,
      panelBorder: null,
      spinnerStyle: {
        width: '40px',
        height: '40px',
        border: `3px solid ${light ? 'rgba(255,255,255,0.35)' : '#555'}`,
        borderTop: '3px solid #fff',
      },
      valueColor: '#fff',
      subtitleColor: light ? 'rgba(255,255,255,0.85)' : '#ccc',
      showUnitSubtitle: false,
    };
  }

  if (preset === LIGHT_POWER_DENSITY_THEME_PRESETS.advanced) {
    const panelBorder = metricPanelBorder || null;
    return {
      preset,
      panelBg: ADVANCED_PANEL_BG,
      loadingBorderRadius: '12px',
      readyBorderRadius: '12px',
      loadingPadding: '30px',
      readyPadding: '24px 20px',
      fillContainer: false,
      panelBorder,
      spinnerStyle: {
        width: '40px',
        height: '40px',
        ...ADVANCED_SPINNER,
      },
      valueColor: '#fff',
      subtitleColor: '#ccc',
      showUnitSubtitle: false,
    };
  }

  if (preset === LIGHT_POWER_DENSITY_THEME_PRESETS.customized) {
    return {
      preset,
      panelBg: '#232323',
      loadingBorderRadius: '12px',
      readyBorderRadius: '12px',
      loadingPadding: '16px 14px',
      readyPadding: '16px 14px',
      fillContainer: true,
      panelBorder: null,
      spinnerStyle: {
        width: '40px',
        height: '40px',
        border: '3px solid #555',
        borderTop: '3px solid #fff',
      },
      valueColor: '#fff',
      subtitleColor: '#ccc',
      showUnitSubtitle: true,
    };
  }

  return resolveLightPowerDensityTheme({
    preset: LIGHT_POWER_DENSITY_THEME_PRESETS.basic,
    chartSurface,
  });
}

export const PEAK_MIN_CONSUMPTION_THEME_PRESETS = {
  basic: 'basic',
  advanced: 'advanced',
  customized: 'customized',
};

const ADVANCED_PANEL_BG = 'var(--dashboard-chart-loading-bg, #232323)';

export function resolvePeakMinConsumptionLoading({
  energyConsumptionLoading,
  peakMinConsumptionLoading,
  chartLoadingPeakMinConsumption = false,
}) {
  if (energyConsumptionLoading) return true;
  if (peakMinConsumptionLoading) return true;
  if (chartLoadingPeakMinConsumption) return true;
  return false;
}

export function resolvePeakMinConsumptionTheme({
  preset = PEAK_MIN_CONSUMPTION_THEME_PRESETS.basic,
  chartSurface = 'dark',
  metricPanelBorder = null,
} = {}) {
  if (preset === PEAK_MIN_CONSUMPTION_THEME_PRESETS.basic) {
    const light = chartSurface === 'light';
    return {
      preset,
      panelBg: light ? '#1565C0' : '#232323',
      panelBorder: null,
      panelLayout: 'basic-stretch',
      rowGap: '12px',
      timeColor: light ? 'rgba(255,255,255,0.85)' : '#ccc',
      loaderSpinnerStyle: {
        width: '20px',
        height: '20px',
        border: `2px solid ${light ? 'rgba(255,255,255,0.35)' : '#555'}`,
        borderTop: '2px solid #fff',
      },
    };
  }

  if (preset === PEAK_MIN_CONSUMPTION_THEME_PRESETS.advanced) {
    return {
      preset,
      panelBg: ADVANCED_PANEL_BG,
      panelBorder: metricPanelBorder || null,
      panelLayout: 'centered',
      rowGap: '15px',
      timeColor: '#ccc',
      loaderSpinnerStyle: {
        width: '20px',
        height: '20px',
        border: '2px solid #555',
        borderTop: '2px solid #fff',
      },
    };
  }

  if (preset === PEAK_MIN_CONSUMPTION_THEME_PRESETS.customized) {
    return {
      preset,
      panelBg: '#232323',
      panelBorder: null,
      panelLayout: 'centered',
      rowGap: '15px',
      timeColor: '#ccc',
      loaderSpinnerStyle: {
        width: '20px',
        height: '20px',
        border: '2px solid #555',
        borderTop: '2px solid #fff',
      },
    };
  }

  return resolvePeakMinConsumptionTheme({
    preset: PEAK_MIN_CONSUMPTION_THEME_PRESETS.basic,
    chartSurface,
  });
}

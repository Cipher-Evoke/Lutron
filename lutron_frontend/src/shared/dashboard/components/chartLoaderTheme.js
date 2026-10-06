export const DASHBOARD_CHART_LOADER_SHELL_VARIANTS = {
  BASIC: 'basic',
  ADVANCED: 'advanced',
  CUSTOMIZED: 'customized',
};

export const DASHBOARD_CHART_LOADER_DEFAULT_MESSAGE = 'Loading chart data...';

const SPINNER_DARK = {
  width: '40px',
  height: '40px',
  border: '3px solid #555',
  borderTop: '3px solid #fff',
};

const SPINNER_LIGHT = {
  width: '40px',
  height: '40px',
  border: '3px solid #e0e0e0',
  borderTop: '3px solid #1565C0',
};

const MESSAGE_DARK = {
  color: '#fff',
  fontSize: '14px',
};

const MESSAGE_LIGHT = {
  color: 'rgba(0, 0, 0, 0.87)',
  fontSize: '14px',
};

const SPINNER_WITH_MESSAGE = {
  marginBottom: '12px',
};

export const DASHBOARD_CHART_LOADER_PRESETS = {
  basic: {
    defaultHeight: '300px',
    defaultMessage: DASHBOARD_CHART_LOADER_DEFAULT_MESSAGE,
    dark: {
      container: {
        border: '1px solid #ddd',
        borderRadius: '4px',
        backgroundColor: '#767061',
      },
      spinner: SPINNER_DARK,
      message: MESSAGE_DARK,
    },
    light: {
      container: {
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        backgroundColor: '#ffffff',
      },
      spinner: SPINNER_LIGHT,
      message: MESSAGE_LIGHT,
    },
  },
  advanced: {
    defaultHeight: '300px',
    defaultMessage: DASHBOARD_CHART_LOADER_DEFAULT_MESSAGE,
    container: {
      border: '1px solid #ddd',
      borderRadius: '4px',
      backgroundColor: 'transparent',
    },
    spinner: SPINNER_DARK,
    spinnerWithMessage: SPINNER_WITH_MESSAGE,
    message: MESSAGE_DARK,
  },
  customized: {
    defaultHeight: '300px',
    defaultMessage: DASHBOARD_CHART_LOADER_DEFAULT_MESSAGE,
    container: {
      border: '1px solid #ddd',
      borderRadius: '4px',
      backgroundColor: '#767061',
    },
    spinner: SPINNER_DARK,
    spinnerWithMessage: SPINNER_WITH_MESSAGE,
    message: MESSAGE_DARK,
  },
};

export function resolveDashboardChartLoaderPreset(shellVariant, light = false) {
  const preset = DASHBOARD_CHART_LOADER_PRESETS[shellVariant] || DASHBOARD_CHART_LOADER_PRESETS.basic;

  if (shellVariant === 'basic') {
    const surface = light ? preset.light : preset.dark;
    return {
      defaultHeight: preset.defaultHeight,
      defaultMessage: preset.defaultMessage,
      container: surface.container,
      spinner: surface.spinner,
      spinnerWithMessage: SPINNER_WITH_MESSAGE,
      message: surface.message,
    };
  }

  return preset;
}

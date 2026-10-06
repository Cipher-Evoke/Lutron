export const CHART_LOADER_SHELL_VARIANTS = {
  BASIC: 'basic',
  ADVANCED: 'advanced',
  CUSTOMIZED: 'customized',
};

const SPINNER_DARK = {
  width: '40px',
  height: '40px',
  border: '3px solid #555',
  borderTop: '3px solid #fff',
};

const SPINNER_LIGHT = {
  width: '40px',
  height: '40px',
  border: '3px solid #e5e7eb',
  borderTop: '3px solid #9ca3af',
};

export const CHART_LOADER_PRESETS = {
  basic: {
    defaultHeight: '300px',
    container: {
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '4px',
    },
    spinner: SPINNER_LIGHT,
    spinnerWithMessage: {
      marginBottom: '12px',
    },
    message: {
      color: 'rgba(0, 0, 0, 0.87)',
      fontSize: '14px',
    },
  },
  advanced: {
    defaultHeight: '300px',
    container: {
      background: 'var(--dashboard-card-background, linear-gradient(180deg, #2a3445 0%, #1c2330 100%))',
      border: '1px solid #ddd',
      boxShadow: 'var(--premium-card-shadow, 0 2px 4px rgba(0, 0, 0, 0.1))',
      borderRadius: '4px',
    },
    spinner: SPINNER_DARK,
    spinnerWithMessage: {
      marginBottom: '12px',
    },
    message: {
      color: '#fff',
      fontSize: '14px',
    },
  },
  customized: {
    defaultHeight: '300px',
    container: {
      backgroundColor: '#767061',
      border: '1px solid #ddd',
      borderRadius: '4px',
    },
    spinner: SPINNER_DARK,
    spinnerWithMessage: {
      marginBottom: '12px',
    },
    message: {
      color: '#fff',
      fontSize: '14px',
    },
  },
};

export function resolveChartLoaderPreset(shellVariant) {
  return CHART_LOADER_PRESETS[shellVariant] || CHART_LOADER_PRESETS.basic;
}

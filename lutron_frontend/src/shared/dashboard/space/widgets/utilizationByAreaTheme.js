export const UTILIZATION_BY_AREA_THEME_PRESETS = {
  basic: 'basic',
  advanced: 'advanced',
  customized: 'customized',
};

export const UTILIZATION_BY_AREA_LAYOUT_MODES = {
  scroll: 'scroll',
  fill: 'fill',
  flex: 'flex',
};

export function resolveUtilizationByAreaLoading({
  dataLoading = false,
  anyLoading: _anyLoading = false,
  isLoading: _isLoading = false,
  globalLoadingProp: _globalLoadingProp = false,
}) {
  return Boolean(dataLoading);
}

export function resolveUtilizationByAreaViewState({
  payload,
  rows,
  dataLoading = false,
  anyLoading = false,
  isLoading = false,
  globalLoadingProp = false,
}) {
  if (
    resolveUtilizationByAreaLoading({
      dataLoading,
      anyLoading,
      isLoading,
      globalLoadingProp,
    })
  ) {
    return 'loading';
  }

  if (!payload && !dataLoading) {
    return 'empty';
  }

  if (!payload) {
    return 'pending';
  }

  if (!rows || rows.length === 0) {
    return 'no-rows';
  }

  return 'rows';
}

export function resolveUtilizationByAreaTheme({
  preset = UTILIZATION_BY_AREA_THEME_PRESETS.basic,
  chartSurface = 'dark',
  customizedTheme = 'default',
} = {}) {
  if (preset === UTILIZATION_BY_AREA_THEME_PRESETS.basic) {
    if (chartSurface === 'light') {
      return {
        preset,
        shellBorder: '1px solid #e5e7eb',
        shellBg: '#ffffff',
        textColor: '#111827',
        rowBorder: 'rgba(15, 23, 42, 0.08)',
        dividerColor: 'rgba(15, 23, 42, 0.12)',
        spinOuter: '#cbd5e1',
        spinTop: '#1565C0',
      };
    }
    return {
      preset,
      shellBorder: '1px solid #ddd',
      shellBg: 'var(--dashboard-card-background, #232323)',
      textColor: '#fff',
      rowBorder: 'rgba(255,255,255,0.2)',
      dividerColor: 'rgba(255,255,255,0.3)',
      spinOuter: '#555',
      spinTop: '#fff',
    };
  }

  if (preset === UTILIZATION_BY_AREA_THEME_PRESETS.advanced) {
    if (chartSurface === 'light') {
      return {
        preset,
        shellBorder: '1px solid #e5e7eb',
        shellBg: '#ffffff',
        textColor: '#111827',
        rowBorder: 'rgba(15, 23, 42, 0.08)',
        dividerColor: 'rgba(15, 23, 42, 0.12)',
        spinOuter: '#cbd5e1',
        spinTop: '#1565C0',
      };
    }
    return {
      preset,
      shellBorder: '1px solid #ddd',
      shellBg: 'var(--dashboard-card-background, #232323)',
      textColor: '#fff',
      rowBorder: 'rgba(255,255,255,0.2)',
      dividerColor: 'rgba(255,255,255,0.3)',
      spinOuter: '#555',
      spinTop: '#fff',
    };
  }

  if (preset === UTILIZATION_BY_AREA_THEME_PRESETS.customized) {
    if (chartSurface === 'light') {
      return {
        preset,
        shellBorder: '1px solid #e5e7eb',
        shellBg: '#ffffff',
        textColor: '#111827',
        rowBorder: 'rgba(15, 23, 42, 0.08)',
        dividerColor: 'rgba(15, 23, 42, 0.12)',
        spinOuter: '#cbd5e1',
        spinTop: '#1565C0',
      };
    }
    const isWhite = customizedTheme === 'default_white';
    return {
      preset,
      shellBorder: '1px solid #ddd',
      shellBg: isWhite ? '#f5f5f5' : '#767061',
      textColor: isWhite ? '#000' : '#fff',
      rowBorder: isWhite ? '1px solid #eee' : '1px solid rgba(255,255,255,0.2)',
      dividerColor: isWhite ? '#f0f0f0' : 'rgba(255,255,255,0.3)',
      spinOuter: '#555',
      spinTop: isWhite ? '#1565C0' : '#fff',
    };
  }

  return resolveUtilizationByAreaTheme({
    preset: UTILIZATION_BY_AREA_THEME_PRESETS.basic,
    chartSurface,
  });
}

export function resolveUtilizationByAreaShellSx(layoutMode, theme) {
  const base = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: theme.shellBorder,
    borderRadius: '4px',
    backgroundColor: theme.shellBg,
  };

  if (layoutMode === UTILIZATION_BY_AREA_LAYOUT_MODES.scroll) {
    return {
      ...base,
      minHeight: 200,
      maxHeight: 'min(520px, 58vh)',
      overflowY: 'auto',
      overflowX: 'hidden',
    };
  }

  if (layoutMode === UTILIZATION_BY_AREA_LAYOUT_MODES.fill) {
    return {
      ...base,
      height: 'calc(100% - 60px)',
    };
  }

  return {
    ...base,
    flex: 1,
    minHeight: 0,
  };
}

export function resolveUtilizationByAreaListShellSx(layoutMode, options = {}) {
  const { preset } = options;
  const isAdvanced = preset === UTILIZATION_BY_AREA_THEME_PRESETS.advanced;
  // Advanced list sits inside a bordered shell; inset labels from the left edge.
  const horizontalPad = isAdvanced
    ? { paddingLeft: '12px', paddingRight: '12px' }
    : { paddingRight: '8px' };

  if (layoutMode === UTILIZATION_BY_AREA_LAYOUT_MODES.scroll) {
    return {
      minHeight: 200,
      maxHeight: 'min(520px, 58vh)',
      overflowY: 'auto',
      overflowX: 'hidden',
      ...horizontalPad,
    };
  }

  if (layoutMode === UTILIZATION_BY_AREA_LAYOUT_MODES.fill) {
    return {
      height: 'calc(100% - 60px)',
      overflowY: 'auto',
      ...horizontalPad,
    };
  }

  return {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    ...horizontalPad,
  };
}

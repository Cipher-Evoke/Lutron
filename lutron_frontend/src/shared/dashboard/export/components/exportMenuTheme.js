export const EXPORT_MENU_COPY = {
  email: 'Send By Email',
  download: 'Download To PC',
};

export const ADVANCED_EXPORT_MENU_PANEL_CLASS = 'chart-export-dropdown';

export function resolveExportMenuLoadingLabels({ useEmoji = false } = {}) {
  return {
    sending: useEmoji ? '⏳ Sending...' : 'Sending...',
    downloading: useEmoji ? '⏳ Downloading...' : 'Downloading...',
  };
}

export function resolveSpaceExportMenuPreset(variant, isLargeScreen = false) {
  const padding = isLargeScreen ? '14px 18px' : '12px 16px';
  const fontSize = isLargeScreen ? '15px' : '14px';
  const minWidth = isLargeScreen ? '200px' : '180px';

  if (variant === 'advanced') {
    return {
      panel: {
        backgroundColor: 'var(--alerts-export-menu-bg, #d6dde8)',
        border: '1px solid var(--alerts-export-menu-border, #444)',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        zIndex: 1000,
        minWidth,
        padding: '8px 0',
        marginTop: 0,
      },
      item: {
        padding,
        fontSize,
        textColor: 'var(--alerts-export-menu-text, #000)',
        mutedColor: 'rgba(44, 40, 32, 0.45)',
        dividerColor: 'var(--alerts-export-menu-border, #444)',
      },
      panelDataAttribute: null,
      className: ADVANCED_EXPORT_MENU_PANEL_CLASS,
      useEmoji: false,
    };
  }

  if (variant === 'customized') {
    return {
      panel: {
        backgroundColor: '#CDC0A0',
        border: '1px solid #444',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        zIndex: 1000,
        minWidth,
        padding: '8px 0',
      },
      item: {
        padding,
        fontSize,
        textColor: '#fff',
        mutedColor: '#999',
        dividerColor: '#444',
      },
      panelDataAttribute: null,
      className: null,
      useEmoji: false,
    };
  }

  return {
    panel: {
      backgroundColor: '#ffffff',
      border: '1px solid rgba(0,0,0,0.15)',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      zIndex: 1000,
      minWidth,
      padding: '8px 0',
    },
    item: {
      padding,
      fontSize,
      textColor: 'rgba(0, 0, 0, 0.87)',
      mutedColor: 'rgba(0, 0, 0, 0.45)',
      dividerColor: 'rgba(0, 0, 0, 0.12)',
    },
    panelDataAttribute: 'data-export-dropdown-panel',
    className: null,
    useEmoji: false,
  };
}

export function resolveAdvancedEnergyExportMenuPreset(panelOverrides = {}) {
  return {
    panel: {
      backgroundColor: 'var(--alerts-export-menu-bg, #d6dde8)',
      border: '1px solid var(--alerts-export-menu-border, #444)',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      zIndex: 1000,
      minWidth: '180px',
      padding: '8px 0',
      marginTop: '4px',
      ...panelOverrides,
    },
    item: {
      padding: '12px 16px',
      fontSize: '14px',
      textColor: 'var(--alerts-export-menu-text, #000)',
      mutedColor: 'rgba(44, 40, 32, 0.45)',
      dividerColor: 'var(--alerts-export-menu-border, #444)',
    },
    panelDataAttribute: 'data-export-dropdown-panel',
    className: ADVANCED_EXPORT_MENU_PANEL_CLASS,
    useEmoji: false,
  };
}

export function resolveEnergyExportMenuPresetFromTheme(ec, { useEmoji = false } = {}) {
  return {
    panel: {
      backgroundColor: ec.dropdownBg,
      border: ec.dropdownBorder,
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      zIndex: 1000,
      minWidth: '180px',
      padding: '8px 0',
    },
    item: {
      padding: '12px 16px',
      fontSize: '14px',
      textColor: ec.dropdownText,
      mutedColor: ec.dropdownMuted,
      dividerColor: ec.dropdownSep,
    },
    panelDataAttribute: 'data-export-dropdown-panel',
    className: null,
    useEmoji,
  };
}

export function resolveCustomizedEnergyExportMenuPreset() {
  return {
    panel: {
      backgroundColor: '#CDC0A0',
      border: '1px solid #444',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      zIndex: 1000,
      minWidth: '180px',
      padding: '8px 0',
    },
    item: {
      padding: '12px 16px',
      fontSize: '14px',
      textColor: '#fff',
      mutedColor: '#999',
      dividerColor: '#444',
    },
    panelDataAttribute: 'data-export-dropdown-panel',
    className: null,
    useEmoji: true,
  };
}

export const SPACE_STATUS_SHELL_VARIANTS = {
  BASIC: 'basic',
  ADVANCED: 'advanced',
  CUSTOMIZED: 'customized',
};

export const SPACE_STATUS_TONES = {
  error: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid #ef4444',
    color: '#ef4444',
  },
  warning: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid #f59e0b',
    color: '#f59e0b',
  },
  loading: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid #3b82f6',
    color: '#3b82f6',
  },
  pending: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    border: '1px solid #ffc107',
    color: '#ffc107',
  },
  unavailable: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid #f59e0b',
    color: '#f59e0b',
  },
};

export const SPACE_STATUS_BANNER_LAYOUT = {
  borderRadius: '8px',
  padding: { xs: 2, sm: 2.5, md: 3, lg: 4, xl: 5 },
  fontSize: { xs: '14px', sm: '15px', md: '16px', lg: '18px', xl: '20px' },
  textAlign: 'center',
};

export const SPACE_STATUS_SUBTITLE_LAYOUT = {
  fontSize: { xs: '12px', sm: '13px', md: '14px', lg: '16px', xl: '18px' },
  marginTop: 1,
  opacity: 0.8,
};

export const SPACE_STATUS_SHELL_PRESETS = {
  basic: {
    banner: SPACE_STATUS_BANNER_LAYOUT,
    subtitle: SPACE_STATUS_SUBTITLE_LAYOUT,
    empty: {
      py: 4,
      px: 2,
      border: '1px dashed',
      borderColor: 'divider',
      borderRadius: 2,
      bgcolor: 'action.hover',
      titleColor: 'text.primary',
      bodyColor: 'text.secondary',
      bodyFontSize: 14,
    },
  },
  advanced: {
    banner: SPACE_STATUS_BANNER_LAYOUT,
    subtitle: SPACE_STATUS_SUBTITLE_LAYOUT,
    empty: {
      py: 4,
      px: 2,
      border: '1px dashed #ccc',
      borderRadius: 2,
      bgcolor: 'rgba(255, 255, 255, 0.04)',
      titleColor: '#fff',
      bodyColor: 'rgba(255, 255, 255, 0.75)',
      bodyFontSize: 14,
    },
  },
  customized: {
    banner: SPACE_STATUS_BANNER_LAYOUT,
    subtitle: SPACE_STATUS_SUBTITLE_LAYOUT,
    empty: {
      py: 4,
      px: 2,
      border: '1px dashed #999',
      borderRadius: 2,
      bgcolor: 'rgba(0, 0, 0, 0.15)',
      titleColor: '#fff',
      bodyColor: 'rgba(255, 255, 255, 0.8)',
      bodyFontSize: 14,
    },
  },
};

export function resolveSpaceStatusTone(tone) {
  return SPACE_STATUS_TONES[tone] || SPACE_STATUS_TONES.warning;
}

export function resolveSpaceStatusShellPreset(shellVariant) {
  return SPACE_STATUS_SHELL_PRESETS[shellVariant] || SPACE_STATUS_SHELL_PRESETS.basic;
}

/** Auth card + fields — colors from ThemeContext CSS variables (gold + default). */

export const authPageSx = {
  width: '100%',
  height: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  p: 2,
  backgroundColor: 'var(--app-background, #6f809d)',
  background: 'var(--app-page-background, var(--app-background, #6f809d))',
  backgroundImage: 'var(--auth-page-background-image, var(--app-background-image, none))',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundAttachment: 'fixed',
};

export const authCardSx = {
  borderRadius: '12px',
  background: 'var(--auth-card-bg, linear-gradient(135deg, #3D4A5C 0%, #4A586C 100%))',
  border: '1px solid var(--auth-card-border, #C5CDD8)',
  boxShadow: 'var(--auth-card-shadow, 0 8px 32px rgba(0, 0, 0, 0.18))',
};

export const authHeadingSx = {
  color: 'var(--auth-card-text, #ffffff)',
};

export const authSubtextSx = {
  color: 'var(--auth-card-subtext, rgba(214, 221, 232, 0.95))',
};

export const authCaptionSx = {
  color: 'var(--auth-card-caption, #D6DDE8)',
};

export const authFieldSx = {
  '& .MuiFilledInput-root': {
    backgroundColor: 'var(--auth-field-bg, #ffffff)',
    borderRadius: '8px',
    border: '1px solid var(--auth-field-border, #C5CDD8)',
    '&:hover': {
      backgroundColor: 'var(--auth-field-bg, #ffffff)',
      borderColor: 'var(--auth-field-border-focus, #3D4A5C)',
    },
    '&.Mui-focused': {
      backgroundColor: 'var(--auth-field-bg, #ffffff)',
      borderColor: 'var(--auth-field-border-focus, #3D4A5C)',
    },
    '&:before, &:after': {
      borderBottom: 'none',
    },
  },
  '& .MuiFilledInput-input': {
    color: 'var(--auth-field-text, #1c2330)',
    px: 1.5,
    py: 1,
  },
  /* Eye icon on white password fields — keep dark across all advanced themes */
  '& .MuiInputAdornment-root .MuiIconButton-root': {
    color: 'var(--auth-password-icon-color, #111111)',
  },
  '& .MuiInputAdornment-root .MuiIconButton-root .MuiSvgIcon-root': {
    color: 'var(--auth-password-icon-color, #111111)',
  },
};

/** Password show/hide toggle — dark on white field backgrounds */
export const authPasswordVisibilityIconSx = {
  color: 'var(--auth-password-icon-color, #111111) !important',
  '& .MuiSvgIcon-root': {
    color: 'var(--auth-password-icon-color, #111111) !important',
  },
};

export const authButtonSx = {
  background: 'var(--auth-button-background, var(--auth-button-bg, #1c2330))',
  backgroundColor: 'transparent',
  color: 'var(--auth-button-text, #ffffff)',
  textTransform: 'none',
  height: 48,
  borderRadius: '8px',
  boxShadow: 'none',
  border: 'none',
  '&:hover': {
    background: 'var(--auth-button-background, var(--auth-button-hover-bg, #3D4A5C))',
    backgroundColor: 'transparent',
    opacity: 0.92,
    filter: 'none',
  },
  '&:disabled': {
    background: 'var(--auth-button-background, var(--auth-button-bg, #1c2330))',
    backgroundColor: 'transparent',
    color: 'var(--auth-button-text, #ffffff)',
    opacity: 0.65,
  },
};

export const authIconSx = {
  color: 'var(--auth-icon-color, #D6DDE8)',
};

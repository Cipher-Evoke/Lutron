/** Top edge rule on settings pages inside the olive panel (customized). */
export const settingsPageShellSx = {
  width: '100%',
  maxWidth: '100%',
  margin: 0,
  boxSizing: 'border-box',
  borderTop: '1px solid rgba(255, 255, 255, 0.28)',
};

/** Grid shell aligned with Users / Floor settings pages. */
export const settingsGridContainerSx = {
  ml: '18px',
  alignItems: 'flex-start',
  maxWidth: '100%',
  boxSizing: 'border-box',
};

/** Left nav column — natural height so all tabs remain visible. */
export const settingsSidebarGridItemSx = {
  p: 2,
  borderTopLeftRadius: '10px',
  borderBottomLeftRadius: '10px',
};

export const SETTINGS_SIDEBAR_COLUMN_CLASS = 'settings-sidebar-column';
export const SETTINGS_HELP_CONTENT_COLUMN_CLASS = 'settings-help-content-column';

export const settingsTitleTypographySx = {
  mb: { xs: 0.8, sm: 1, md: 1.5, lg: 2 },
  fontSize: 24,
  fontWeight: 600,
  letterSpacing: 0.5,
  paddingTop: '18px',
  marginBottom: '16px',
  color: '#fff',
};

/** Outer shell — matches Settings → Help (`help-container`). */
export const settingsHelpLayoutShellSx = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  p: '18px',
  ml: '16px',
  boxSizing: 'border-box',
};

export const settingsHelpLayoutGridSx = {
  width: '100%',
  alignItems: 'flex-start',
};

export const settingsHelpLayoutGridContainerSx = {
  width: '100%',
  maxWidth: '100%',
  alignItems: 'flex-start',
  boxSizing: 'border-box',
};

/** Right column spacing — matches Help content column with scrolling for long content. */
export const settingsHelpLayoutContentColumnSx = {
  order: { xs: 1, lg: 2 },
  p: 2,
  minHeight: 0,
  maxHeight: { xs: 'none', md: 'calc(100vh - 200px)' },
  overflowY: { xs: 'visible', md: 'auto' },
  overflowX: 'hidden',
  width: '100%',
  boxSizing: 'border-box',
  scrollbarWidth: 'thin',
  scrollbarColor: 'rgba(255,255,255,0.4) rgba(0,0,0,0.15)',
  '&::-webkit-scrollbar': { width: '8px' },
  '&::-webkit-scrollbar-track': {
    background: 'rgba(0,0,0,0.12)',
    borderRadius: '8px',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: 'rgba(255,255,255,0.38)',
    borderRadius: '8px',
    border: '2px solid transparent',
    backgroundClip: 'padding-box',
  },
};

/** White panel — matches Help `Paper` (rounded, full width). */
export const settingsHelpWhitePaperSx = {
  p: 2,
  borderRadius: 2,
  width: '100%',
  maxWidth: 'none',
  bgcolor: '#fff',
  m: 0,
  boxSizing: 'border-box',
  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
};

/** Typography inside customized Settings white panels (Alerts / Processors / Maintenance). */
export const settingsHelpContentTypographySx = {
  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  color: 'rgba(0, 0, 0, 0.87)',
  '& .MuiTypography-root': {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  '& .MuiTypography-h4': {
    fontWeight: 'bold',
    fontSize: { xs: '14px', sm: '16px', md: '18px' },
    color: 'rgba(0, 0, 0, 0.87)',
  },
  '& .MuiTypography-h6, & .MuiTypography-subtitle1, & .MuiTypography-subtitle2': {
    fontWeight: 'bold',
    fontSize: { xs: 12, sm: 13, md: 14 },
    color: 'rgba(0, 0, 0, 0.87)',
  },
  '& .MuiTypography-body1, & .MuiTypography-body2': {
    fontSize: { xs: 12, sm: 13, md: 14 },
    fontWeight: 400,
    color: 'rgba(0, 0, 0, 0.87)',
  },
  '& .MuiTypography-caption': {
    fontSize: { xs: 11, sm: 12, md: 13 },
    fontWeight: 400,
  },
  '& .MuiFormControlLabel-label, & .MuiInputLabel-root, & .MuiSelect-select, & .MuiMenuItem-root': {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: { xs: 12, sm: 13, md: 14 },
    fontWeight: 500,
    color: 'rgba(0, 0, 0, 0.87)',
  },
  '& .MuiButton-root': {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: { xs: 12, sm: 13, md: 14 },
    textTransform: 'none',
  },
  '& .MuiChip-label': {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: { xs: 11, sm: 12, md: 13 },
    fontWeight: 500,
  },
};

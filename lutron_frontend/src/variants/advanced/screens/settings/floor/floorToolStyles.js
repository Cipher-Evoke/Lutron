/** Area Calculation / Correct Coordinate — gold + default via ThemeContext CSS vars. */

export const floorToolPageTitleSx = {
  color: 'var(--settings-panel-text, #1c2330)',
};

export const floorToolBackButtonSx = {
  color: 'var(--settings-panel-text, #1c2330)',
  borderColor: 'var(--settings-panel-border, #C5CDD8)',
  '&:hover': {
    borderColor: 'var(--settings-panel-text, #1c2330)',
    color: 'var(--settings-panel-text, #1c2330)',
  },
};

export const floorToolBackIconSx = {
  color: 'var(--settings-panel-text, #1c2330)',
};

export const floorToolPanelSx = {
  backgroundColor: 'var(--settings-panel-inner-bg, #f5f5f5)',
  color: 'var(--settings-panel-text, #1c2330)',
  border: '1px solid var(--settings-panel-border, #e0e0e0)',
  borderRadius: 2,
  boxShadow: 2,
};

export const floorToolHeadingSx = {
  color: 'var(--settings-panel-text, #1c2330)',
};

export const floorToolLabelSx = {
  color: 'var(--settings-panel-text, #1c2330)',
  fontWeight: 'bold',
};

export const floorToolMutedSx = {
  color: 'var(--settings-panel-muted-text, #4A586C)',
};

export const floorToolInputLabelSx = {
  color: 'var(--settings-panel-text, #1c2330)',
  '&.Mui-focused': {
    color: 'var(--settings-panel-text, #1c2330)',
  },
};

export const floorToolSelectSx = {
  backgroundColor: 'var(--floor-tool-field-bg, #ffffff)',
  color: 'var(--floor-tool-field-text, #1c2330)',
  borderRadius: 1,
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'var(--floor-tool-field-border, #C5CDD8)',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: 'var(--settings-panel-text, #1c2330)',
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: 'var(--settings-panel-text, #1c2330)',
  },
  '& .MuiSelect-select': {
    color: 'var(--floor-tool-field-text, #1c2330)',
  },
  '& .MuiSvgIcon-root': {
    color: 'var(--floor-tool-field-text, #1c2330)',
  },
  '& .MuiFilledInput-root': {
    backgroundColor: 'var(--floor-tool-field-bg, #ffffff)',
    borderRadius: 1,
    '&:before, &:after': { borderBottom: 'none' },
  },
  '& .MuiFilledInput-input': {
    color: 'var(--floor-tool-field-text, #1c2330)',
  },
};

export const floorToolTextFieldSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'var(--floor-tool-field-bg, #ffffff)',
    color: 'var(--floor-tool-field-text, #1c2330)',
    borderRadius: 1,
    '& fieldset': {
      borderColor: 'var(--floor-tool-field-border, #C5CDD8)',
    },
    '&:hover fieldset': {
      borderColor: 'var(--settings-panel-text, #1c2330)',
    },
    '&.Mui-focused fieldset': {
      borderColor: 'var(--settings-panel-text, #1c2330)',
    },
  },
  '& .MuiOutlinedInput-input': {
    color: 'var(--floor-tool-field-text, #1c2330)',
  },
  '& .MuiInputLabel-root': floorToolInputLabelSx,
  '& .MuiFormHelperText-root': {
    color: 'var(--settings-panel-muted-text, #4A586C)',
  },
};

export const floorToolApplyButtonSx = {
  backgroundColor: 'var(--app-button, #424242)',
  color: '#ffffff',
  textTransform: 'none',
  borderRadius: '8px',
  '&:hover': {
    backgroundColor: 'var(--auth-button-hover-bg, #3D3629)',
    color: '#ffffff',
  },
  '&:disabled': {
    backgroundColor: 'var(--settings-panel-border, #ccc)',
    color: 'var(--settings-panel-muted-text, #666)',
  },
};

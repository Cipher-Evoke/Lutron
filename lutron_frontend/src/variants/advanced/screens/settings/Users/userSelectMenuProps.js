const usersInputText = 'var(--users-input-text, rgba(0, 0, 0, 0.87))';
const usersInputLabelText = 'var(--users-input-label-text, rgba(0, 0, 0, 0.6))';
const usersInputPlaceholderText = 'var(--users-input-placeholder-text, rgba(0, 0, 0, 0.42))';

export const outlinedSelectInputSurface = 'var(--users-input-bg, #fff)';

export const outlinedSelectLabelSx = {
  zIndex: 1,
  color: usersInputLabelText,
  '&.Mui-focused': { color: usersInputText },
  '&.MuiInputLabel-shrink': {
    backgroundColor: outlinedSelectInputSurface,
    px: 0.75,
  },
};

export const outlinedSelectFloorsLabelSx = {
  zIndex: 1,
  color: usersInputLabelText,
  '&.Mui-focused': { color: usersInputText },
  backgroundColor: outlinedSelectInputSurface,
  px: 0.75,
};

/** Outlined TextField / Select surfaces on white modal fields. */
export const usersFormFieldSx = {
  backgroundColor: 'var(--users-input-bg, #fff)',
  borderRadius: 1,
  color: usersInputText,
  '& .MuiOutlinedInput-root': {
    color: usersInputText,
  },
  '& .MuiOutlinedInput-input': {
    color: usersInputText,
    WebkitTextFillColor: usersInputText,
  },
  '& .MuiOutlinedInput-input::placeholder': {
    color: usersInputPlaceholderText,
    opacity: 1,
  },
  '& .MuiSelect-select': {
    color: usersInputText,
  },
  '& .MuiSelect-icon': {
    color: usersInputLabelText,
  },
  '& .MuiInputLabel-root': {
    color: usersInputLabelText,
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: usersInputText,
  },
  '& .MuiOutlinedInput-root fieldset': { borderColor: 'var(--users-border, #C5CDD8)' },
  '& .MuiOutlinedInput-root:hover fieldset': { borderColor: 'var(--home-tab-active-color, #3D4A5C)' },
};

export const usersReadonlyFieldSx = {
  backgroundColor: 'var(--users-readonly-field-bg, #f0f2f5)',
  borderRadius: 1,
  '& .MuiOutlinedInput-root': {
    color: 'var(--users-readonly-field-text, rgba(0, 0, 0, 0.87))',
  },
  '& .MuiOutlinedInput-input': {
    color: 'var(--users-readonly-field-text, rgba(0, 0, 0, 0.87))',
    WebkitTextFillColor: 'var(--users-readonly-field-text, rgba(0, 0, 0, 0.87))',
  },
  '& .MuiOutlinedInput-root fieldset': { borderColor: 'var(--users-border, #C5CDD8)' },
};

/** MUI Select menu styling — theme-aware via CSS vars (gold = cream panel). */
export const premiumSelectMenuProps = {
  autoFocus: false,
  PaperProps: {
    className: 'users-select-menu',
    sx: {
      backgroundColor: 'var(--users-select-menu-bg, #ffffff)',
      color: 'var(--settings-panel-text, #1c2330)',
      border: '1px solid var(--users-border, #C5CDD8)',
      borderRadius: '8px',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
      maxHeight: 320,
      '& .MuiCheckbox-root': {
        color:
          'var(--users-select-menu-checkbox-color, var(--settings-panel-muted-text, rgba(0, 0, 0, 0.55)))',
        '&.Mui-checked': {
          color:
            'var(--users-select-menu-checkbox-checked-color, var(--app-button, #3d4a5c))',
        },
      },
      '& .MuiMenuItem-root': {
        color: 'var(--settings-panel-text, #1c2330)',
        '&:hover': { backgroundColor: 'var(--users-select-menu-hover, #D6DDE8)' },
        '&.Mui-focusVisible': {
          backgroundColor: 'var(--users-select-menu-hover, #D6DDE8)',
        },
        '&.Mui-selected': {
          backgroundColor:
            'var(--users-select-menu-selected-bg, var(--dashboard-select-option-selected-bg, var(--users-select-menu-hover, #D6DDE8)))',
          color:
            'var(--users-select-menu-selected-text, var(--dashboard-select-option-selected-text, var(--settings-panel-text, #1c2330)))',
          '&:hover': {
            backgroundColor:
              'var(--users-select-menu-selected-hover-bg, var(--dashboard-select-menu-selected-hover, var(--users-border, #C5CDD8)))',
            color:
              'var(--users-select-menu-selected-text, var(--dashboard-select-option-selected-text, var(--settings-panel-text, #1c2330)))',
          },
          '&.Mui-focusVisible': {
            backgroundColor:
              'var(--users-select-menu-selected-hover-bg, var(--dashboard-select-menu-selected-hover, var(--users-border, #C5CDD8)))',
            color:
              'var(--users-select-menu-selected-text, var(--dashboard-select-option-selected-text, var(--settings-panel-text, #1c2330)))',
          },
          '& .MuiListItemText-primary': {
            color: 'inherit',
          },
          '& .MuiCheckbox-root': {
            color:
              'var(--users-select-menu-selected-text, var(--dashboard-select-option-selected-text, var(--settings-panel-muted-text, #4A586C)))',
            opacity: 0.85,
            '&.Mui-checked': {
              opacity: 1,
              color:
                'var(--users-select-menu-selected-text, var(--dashboard-select-option-selected-text, var(--app-button, #3d4a5c)))',
            },
          },
        },
        '&.Mui-disabled': {
          color: 'var(--settings-panel-muted-text, #4A586C)',
          opacity: 0.85,
        },
      },
      '& .MuiListSubheader-root': {
        backgroundColor: 'var(--users-select-menu-bg, #ffffff)',
        color: 'var(--settings-panel-text, #1c2330)',
      },
      '& .MuiListItemText-primary': {
        color: 'var(--settings-panel-text, #1c2330)',
      },
    },
  },
};

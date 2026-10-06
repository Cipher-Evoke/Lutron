const dashboardMenuItemSx = {
  color: 'var(--dashboard-select-option-text, #2c2820)',
  fontSize: 14,
  minHeight: 36,
  '&:hover': {
    backgroundColor:
      'var(--dashboard-select-menu-hover, rgba(74, 67, 52, 0.12)) !important',
  },
  '&.Mui-focusVisible': {
    backgroundColor:
      'var(--dashboard-select-menu-hover, rgba(74, 67, 52, 0.12)) !important',
  },
  '&.Mui-selected': {
    backgroundColor:
      'var(--dashboard-select-option-selected-bg, #4a4334) !important',
    color: 'var(--dashboard-select-option-selected-text, #fff) !important',
  },
  '&.Mui-selected:hover': {
    backgroundColor:
      'var(--dashboard-select-menu-selected-hover, rgba(74, 67, 52, 0.28)) !important',
    color: 'var(--dashboard-select-option-selected-text, #fff) !important',
  },
  '&.Mui-selected.Mui-focusVisible': {
    backgroundColor:
      'var(--dashboard-select-menu-selected-hover, rgba(74, 67, 52, 0.28)) !important',
    color: 'var(--dashboard-select-option-selected-text, #fff) !important',
  },
};

/** Shared MUI Select menu styling (Dashboard duration, lighting unit, etc.). */
export const dashboardSelectMenuProps = {
  PaperProps: {
    className: 'dashboard-filter-menu',
    sx: {
      backgroundColor: 'var(--dashboard-select-option-bg, #faf0d4)',
      borderRadius: '8px',
      mt: 0.5,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.18)',
      '& .MuiMenuItem-root': dashboardMenuItemSx,
    },
  },
  MenuListProps: {
    className: 'dashboard-filter-menu-list',
    sx: {
      py: 0.5,
      '& .MuiMenuItem-root': dashboardMenuItemSx,
    },
  },
};

/** Combined Energy / Space duration filter — extra gap under the closed select field. */
export const dashboardCombinedDurationSelectMenuProps = {
  ...dashboardSelectMenuProps,
  PaperProps: {
    ...dashboardSelectMenuProps.PaperProps,
    sx: {
      ...dashboardSelectMenuProps.PaperProps.sx,
      mt: 1.5,
    },
  },
};

export const dashboardSelectFieldSx = {
  width: '100%',
  fontSize: 12,
  fontWeight: 500,
  fontFamily: 'inherit',
  minHeight: 32,
  backgroundColor: 'var(--dashboard-select-field-bg, #ffffff)',
  color: 'var(--dashboard-select-field-text, #2c2820)',
  borderRadius: '4px',
  '& .MuiSelect-select': {
    color: 'var(--dashboard-select-field-text, #2c2820)',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'var(--dashboard-select-field-border, #ccc)',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: 'var(--dashboard-control-accent, #4a4334)',
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: 'var(--dashboard-control-accent, #4a4334)',
    borderWidth: '1px',
  },
  '& .MuiSelect-icon': {
    color: 'var(--dashboard-select-field-text, #2c2820)',
  },
};

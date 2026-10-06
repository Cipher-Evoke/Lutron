/** Shared layout for Settings → Theme color-picker columns (visible gap between cards). */

/** Advanced theme page hex picker — slightly shorter than default 220px height. */
export const ADVANCED_THEME_PICKER_HEX = {
  width: 200,
  height: 208,
  hexRadius: 8,
};

export const themePickerCardsGridSx = (columns = 3) => ({
  display: 'grid',
  width: '100%',
  alignItems: 'stretch',
  columnGap: { xs: 2, md: 3 },
  rowGap: { xs: 2, md: 3 },
  gridTemplateColumns: {
    xs: '1fr',
    md: columns === 2 ? 'repeat(2, minmax(0, 1fr))' : 'repeat(3, minmax(0, 1fr))',
  },
});

export const themePickerCardCellSx = {
  display: 'flex',
  minWidth: 0,
  width: '100%',
  height: '100%',
};

export const themePickerCardColumnSx = {
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
};

export const themePickerCardSurfaceSx = {
  backgroundColor: 'var(--settings-theme-card-bg, white)',
  padding: '1em',
  borderRadius: '1em',
  width: '100%',
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box',
  minHeight: 368,
};

export const themePickerActionsSx = {
  mt: 'auto',
  pt: 1.5,
  minHeight: 36,
  display: 'flex',
  alignItems: 'center',
};

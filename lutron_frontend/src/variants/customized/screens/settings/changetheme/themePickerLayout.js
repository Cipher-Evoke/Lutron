/** Customized Settings → Theme color-picker layout (scrollbar clearance on right). */

/** Reserve space so the right card does not sit under the settings panel scrollbar. */
export const CUSTOMIZED_THEME_SCROLLBAR_CLEARANCE_PX = 14;

export const CUSTOMIZED_THEME_PICKER_HEX = {
  width: 200,
  height: 232,
  hexRadius: 8,
};

export const themePickerCardsGridSx = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
  columnGap: 3,
  rowGap: 2,
  alignItems: 'flex-start',
  mt: '1em',
  mb: '1em',
  ml: '1em',
  mr: { xs: '1em', md: `calc(1em + ${CUSTOMIZED_THEME_SCROLLBAR_CLEARANCE_PX}px)` },
  width: {
    xs: 'calc(100% - 2em)',
    md: `calc(100% - 2em - ${CUSTOMIZED_THEME_SCROLLBAR_CLEARANCE_PX}px)`,
  },
  maxWidth: {
    xs: 'calc(100% - 2em)',
    md: `calc(100% - 2em - ${CUSTOMIZED_THEME_SCROLLBAR_CLEARANCE_PX}px)`,
  },
  boxSizing: 'border-box',
};

export const themePickerCardCellSx = {
  display: 'flex',
  minWidth: 0,
};

export const themePickerCardColumnSx = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
};

export const themePickerCardSx = {
  backgroundColor: 'white',
  padding: '1em',
  borderRadius: '1em',
  width: '100%',
  maxWidth: '100%',
  minHeight: 392,
  boxSizing: 'border-box',
};

export const customizedThemePageSx = {
  width: '100%',
  maxWidth: '100%',
  boxSizing: 'border-box',
  pr: { xs: 0, md: `${CUSTOMIZED_THEME_SCROLLBAR_CLEARANCE_PX}px` },
};

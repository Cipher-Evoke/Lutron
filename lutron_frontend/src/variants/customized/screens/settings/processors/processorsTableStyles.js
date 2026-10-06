import { isLightSurface } from '../../../utils/themeOnSurface';

/**
 * Processors table header — light theme: blue bar; gold/default: theme background (matches Floors).
 */
export function getProcessorsTableHeaderStyles(appTheme) {
  const contentColor = appTheme?.application_theme?.content;
  const backgroundColor = appTheme?.application_theme?.background || '#CDC0A0';
  const isLight = isLightSurface(contentColor);
  const headerBg = isLight ? '#0d6ebc' : backgroundColor;
  const headerText = isLight ? '#ffffff' : '#000000';

  const cellSx = {
    fontWeight: 600,
    fontSize: '13px',
    textAlign: 'center',
    color: headerText,
    backgroundColor: headerBg,
    borderBottom: isLight ? 'none' : '2px solid #ddd',
    whiteSpace: 'nowrap',
  };

  return {
    headerBg,
    headerText,
    rowSx: { backgroundColor: headerBg },
    cellSx,
  };
}

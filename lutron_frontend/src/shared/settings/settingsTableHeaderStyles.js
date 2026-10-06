/**
 * Settings table header — solid blue bar with white labels (Processors / User Management).
 */
export const SETTINGS_TABLE_HEADER_BG = '#0d6ebc';
export const SETTINGS_TABLE_HEADER_TEXT = '#ffffff';

export function getSettingsTableHeaderRowSx(isDefaultWhiteTheme, fallbackBg) {
  return {
    backgroundColor: isDefaultWhiteTheme ? SETTINGS_TABLE_HEADER_BG : fallbackBg,
  };
}

export function getSettingsTableHeaderCellSx(isDefaultWhiteTheme, fallbackBg, fallbackText) {
  return {
    fontWeight: 600,
    color: isDefaultWhiteTheme ? SETTINGS_TABLE_HEADER_TEXT : fallbackText,
    backgroundColor: isDefaultWhiteTheme ? SETTINGS_TABLE_HEADER_BG : fallbackBg,
    borderBottom: 'none',
  };
}

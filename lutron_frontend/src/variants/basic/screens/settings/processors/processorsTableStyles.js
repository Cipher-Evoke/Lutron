/**
 * Processors table header — matches Settings → Floors / Users (solid blue bar, white labels).
 */
export const PROCESSORS_TABLE_HEADER_BG = '#0d6ebc';
export const PROCESSORS_TABLE_HEADER_TEXT = '#ffffff';

export function getProcessorsTableHeaderRowSx() {
  return { backgroundColor: PROCESSORS_TABLE_HEADER_BG };
}

/**
 * Shared Processors settings table header cell styles (main list + Add by IP dialog).
 */
export function getProcessorsTableHeaderCellSx() {
  return {
    fontWeight: 600,
    textAlign: 'center',
    color: PROCESSORS_TABLE_HEADER_TEXT,
    backgroundColor: PROCESSORS_TABLE_HEADER_BG,
    borderBottom: 'none',
    whiteSpace: 'nowrap',
  };
}

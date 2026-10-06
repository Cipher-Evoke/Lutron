/** Horizontal gap between Edit/Add Action and row delete control (schedule + QC details). */
export const DETAILS_ROW_ACTION_CONTROLS_GAP = 12;

/** Trailing column for per-row edit + delete controls in details tables. */
export function detailsRowActionControlsStyle(trailingWidthPx = 180) {
  return {
    flex: `0 0 ${trailingWidthPx}px`,
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: DETAILS_ROW_ACTION_CONTROLS_GAP,
  };
}

import { SURFACE_ACCENT } from "../../../config/themeConstants";

/**
 * Processors table header — matches Settings → Floor table header (light blue-grey).
 */
export function getProcessorsTableHeaderCellSx() {
  return {
    fontWeight: 600,
    fontSize: "13px",
    textAlign: "center",
    borderBottom: "2px solid #ddd",
    backgroundColor: "var(--users-table-head-bg, #d6dde8)",
    color: "var(--settings-panel-text, #000)",
    whiteSpace: "nowrap",
  };
}
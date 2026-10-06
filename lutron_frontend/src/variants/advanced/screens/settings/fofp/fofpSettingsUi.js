/**
 * FOFP admin UI helpers aligned with Settings / application theme.
 */

import { isLightSurface } from "../../../utils/themeOnSurface";

/** SweetAlert2 options consistent with other Settings screens. */
export const getFofpSwalOptions = (theme) => {
  const background =
    theme?.palette?.custom?.containerBg ||
    theme?.palette?.background?.paper ||
    theme?.palette?.background?.default ||
    "#ffffff";
  // Light dialogs (e.g. white theme) must use dark title/body text — page chrome
  // often inherits white text and makes "Layout generated" invisible.
  const color = isLightSurface(background) ? "#111827" : "#ffffff";
  return {
    background,
    color,
    customClass: { popup: "custom-swal-radius" },
  };
};

/** Sticky toolbar shell inside Settings content panel. */
export const getFofpToolbarSx = (theme) => ({
  bgcolor: "var(--settings-panel-inner-bg, #ffffff)",
  border: "1px solid var(--area-groups-border, rgba(0, 0, 0, 0.12))",
  borderRadius: theme.shape?.borderRadius ?? 8,
  boxShadow: theme.shadows?.[2] ?? "0 4px 14px rgba(0, 0, 0, 0.08)",
  color: "var(--settings-panel-text, inherit)",
});

/** Primary action buttons using application theme button color. */
export const getFofpContainedButtonSx = (buttonColor) => ({
  backgroundColor: buttonColor,
  color: "var(--settings-panel-button-text, #fff)",
  textTransform: "none",
  fontWeight: 600,
  "&:hover": {
    backgroundColor: buttonColor,
    filter: "brightness(0.88)",
  },
  "&.Mui-disabled": {
    backgroundColor: buttonColor,
    color: "var(--settings-panel-button-text, #fff)",
    opacity: 0.45,
  },
});

/** Page title typography (matches Processors / Users settings). */
export const getFofpPageTitleSx = () => ({
  fontWeight: "bold",
  fontSize: { xs: "14px", sm: "16px", md: "18px" },
});

/** Floorplan viewer frame — light surface on gold/default white theme, dark canvas otherwise. */
export const getFofpViewerChromeSx = (isLightChrome = false) => ({
  bgcolor: isLightChrome
    ? "var(--area-groups-inner-bg, #f1f5f9)"
    : "#0f172a",
  border: isLightChrome
    ? "1px solid var(--area-groups-border, #e2e8f0)"
    : "1px solid #cbd5e1",
  borderRadius: "14px",
});

/** Floor select dropdown menu (Settings → FOFP). */
export const fofpFloorMenuProps = {
  PaperProps: {
    className: 'fofp-floor-select-menu',
    sx: {
      backgroundColor: "var(--users-select-menu-bg, #ffffff)",
      color: "var(--settings-panel-text, #1c2330)",
      borderRadius: "10px",
      mt: 0.5,
      boxShadow: "0 10px 24px rgba(0,0,0,0.22)",
      border: "1px solid var(--users-border, #C5CDD8)",
      "& .MuiMenuItem-root": {
        color: "var(--settings-panel-text, #1c2330)",
        minHeight: 34,
        "&:hover": { backgroundColor: "var(--users-select-menu-hover, #D6DDE8)" },
        "&.Mui-selected": { backgroundColor: "var(--users-select-menu-hover, #D6DDE8)" },
        "&.Mui-selected:hover": { backgroundColor: "var(--settings-panel-outer-bg, #C5CDD8)" },
      },
    },
  },
};

const FOFP_ZOOM_BAR_BLUE = "#1E75BB";
const FOFP_ZOOM_BAR_BLUE_BORDER = "#1565C0";

/** Floating zoom control bar on viewer. */
export const getFofpViewerZoomBarSx = () => ({
  bgcolor: FOFP_ZOOM_BAR_BLUE,
  border: `1px solid ${FOFP_ZOOM_BAR_BLUE_BORDER}`,
  borderRadius: 999,
  px: 1,
  py: 0.6,
  backdropFilter: "blur(8px)",
  opacity: 0.92,
  boxShadow: "0 2px 8px rgba(21, 101, 192, 0.25)",
});

export const getFofpViewerZoomButtonSx = (theme) => ({
  color: theme.palette.common.white,
  minWidth: 34,
  textTransform: "none",
  fontSize: theme.typography.body2?.fontSize,
  fontWeight: theme.typography.fontWeightMedium,
});

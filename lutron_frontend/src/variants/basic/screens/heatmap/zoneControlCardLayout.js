/** Shared width rules for zone control cards in the floorplan sidebar and area settings dialog. */
export const ZONE_CONTROL_CARD_WIDTH_SX = {
  width: "100%",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  alignSelf: "stretch",
};

export const ZONE_CONTROL_SLIDER_WRAP_SX = {
  position: "relative",
  // Narrower than full width so MUI thumbs at 0%/100% stay inside overflow-x:hidden zone lists.
  width: "85%",
  minWidth: 0,
  boxSizing: "border-box",
  pl: { xs: 1, md: 2 },
};

/** Slider track with room for a value chip above the thumb — compact for sidebar height. */
export const ZONE_CONTROL_SLIDER_WITH_THUMB_VALUE_SX = {
  position: "relative",
  // Match thumb track width; use margin (not padding) so left:% aligns with the thumb.
  width: "85%",
  minWidth: 0,
  boxSizing: "border-box",
  ml: { xs: 0.75, md: 1.25 },
  pt: 0.55,
  overflow: "visible",
};

/**
 * Second stacked slider (CCT under brightness) — tighter top gap so tracks sit closer.
 * Keep enough pt for the Kelvin chip without overlapping the brightness track.
 */
export const ZONE_CONTROL_FOLLOWING_SLIDER_SX = {
  ...ZONE_CONTROL_SLIDER_WITH_THUMB_VALUE_SX,
  mt: 0,
  pt: 0.45,
};

/** Kill MUI Slider default vertical padding so stacked tracks sit closer. */
export const ZONE_CONTROL_SIDEBAR_SLIDER_ROOT_SX = {
  paddingTop: 0,
  paddingBottom: 0,
  marginTop: 0,
  marginBottom: 0,
};

/**
 * Sidebar zone row: slider track + current value chip to the right (not above thumb).
 */
export const SIDEBAR_ZONE_SLIDER_ROW_SX = {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: { xs: 0.4, md: 0.6 },
  width: "100%",
  minWidth: 0,
  minHeight: { xs: 18, md: 20 },
  boxSizing: "border-box",
  pl: { xs: 0.5, md: 0.75 },
  pr: { xs: 0.75, md: 1 },
  mt: 0,
};

/** Second stacked slider row (CCT) — tight gap under brightness. */
export const SIDEBAR_ZONE_FOLLOWING_SLIDER_ROW_SX = {
  ...SIDEBAR_ZONE_SLIDER_ROW_SX,
  mt: 0.15,
};

export const SIDEBAR_ZONE_SLIDER_TRACK_SX = {
  flex: "1 1 auto",
  minWidth: 0,
  width: "auto",
  ...ZONE_CONTROL_SIDEBAR_SLIDER_ROOT_SX,
};

export const SIDEBAR_ZONE_SIDE_VALUE_CHIP_SX = {
  flexShrink: 0,
  minWidth: { xs: 28, md: 34 },
  mr: { xs: 0.35, md: 0.5 },
  textAlign: "center",
  display: "inline-block",
  px: 0.3,
  py: 0.05,
  borderRadius: 0.5,
  border: "1px solid #ddd",
  background: "#f5f5f5",
};

/** Compact White Tune / Dimmed zone card shell — content height (not stretched). */
export const SIDEBAR_ZONE_CARD_SHELL_SX = {
  mb: 0.25,
  flex: "0 0 auto",
  width: "100%",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

export const SIDEBAR_ZONE_CARD_INNER_SX = {
  bgcolor: "#fff",
  borderRadius: 0.5,
  p: { xs: 0.3, md: 0.4 },
  width: "100%",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-start",
  gap: 0.1,
  position: "relative",
  overflow: "visible",
};

export const SIDEBAR_ZONE_NAME_SX = {
  fontWeight: 600,
  fontSize: { xs: 10, sm: 11, md: 12 },
  lineHeight: 1.2,
  fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  minWidth: 0,
  width: "100%",
};

export const SIDEBAR_ZONE_VALUE_CHIP_FONT_SX = {
  fontSize: { xs: 8, sm: 9, md: 9 },
  fontWeight: 700,
  fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
  lineHeight: 1.1,
};

/** Shared sidebar UI font (section tabs, occupancy/energy body, switched names). */
export const SIDEBAR_UI_FONT_FAMILY = 'Arial, "Helvetica Neue", Helvetica, sans-serif';

export const SIDEBAR_SECTION_TAB_FONT_SX = {
  fontFamily: SIDEBAR_UI_FONT_FAMILY,
  fontWeight: 600,
  fontSize: { xs: 9, sm: 10, md: 11 },
  lineHeight: 1.15,
};

export const SIDEBAR_BODY_TEXT_SX = {
  fontFamily: SIDEBAR_UI_FONT_FAMILY,
  fontSize: { xs: 10, sm: 11, md: 12 },
  lineHeight: 1.25,
  fontWeight: 400,
};

/** 0–100 position of the thumb along the track for a given value. */
export function getZoneSliderThumbPercent(value, min, max) {
  const lo = Number(min);
  const hi = Number(max);
  const v = Number(value);
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi === lo || !Number.isFinite(v)) {
    return 0;
  }
  return Math.max(0, Math.min(100, ((v - lo) / (hi - lo)) * 100));
}

/** Absolute position for an editable % / Kelvin chip above the slider thumb. */
export function zoneSliderThumbValueSx(percent) {
  const p = Number(percent);
  let transform = "translateX(-50%)";
  if (p <= 8) transform = "translateX(0)";
  else if (p >= 92) transform = "translateX(-100%)";
  return {
    position: "absolute",
    top: 0,
    left: `${Number.isFinite(p) ? p : 0}%`,
    transform,
    zIndex: 2,
    pointerEvents: "auto",
  };
}

/** Classic vertical scrollbar styling (Chromium + Firefox) — zones list only. */
export const HEATMAP_SIDEBAR_SCROLLBAR_SX = {
  scrollbarWidth: "thin",
  scrollbarColor: "rgba(30, 116, 197, 0.75) rgba(0, 0, 0, 0.1)",
  paddingRight: "6px",
  boxSizing: "border-box",
  "&::-webkit-scrollbar": {
    width: "4px",
    display: "block",
  },
  "&::-webkit-scrollbar-track": {
    backgroundColor: "rgba(0, 0, 0, 0.06)",
    marginBlock: "2px",
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "rgba(30, 116, 197, 0.65)",
    borderRadius: "4px",
    minHeight: "24px",
  },
  "&::-webkit-scrollbar-thumb:hover": {
    backgroundColor: "rgba(30, 116, 197, 0.9)",
  },
};

/**
 * Sidebar shell fills the heatmap column and never scrolls as a whole.
 * Only the zones list is allowed to scroll when zone count is high.
 */
export const HEATMAP_STATUS_PANEL_OVERFLOW_SX = {
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  overflowX: "hidden",
  overflowY: "hidden",
  overscrollBehavior: "contain",
  minHeight: 0,
  height: "100%",
  maxHeight: "100%",
};

/** Fixed header — not part of any scrollport. */
export const HEATMAP_SIDEBAR_STICKY_HEADER_SX = {
  position: "relative",
  top: "auto",
  zIndex: 3,
  flexShrink: 0,
};

/** Kept for imports/tests. */
export const HEATMAP_SIDEBAR_BODY_SLOT_SX = {
  display: "flex",
  flexDirection: "column",
  flex: "1 1 0%",
  minHeight: 0,
  overflow: "hidden",
};

/** Body stacks sections; no outer scroll. */
export const HEATMAP_SIDEBAR_MAIN_SCROLL_SX = {
  display: "flex",
  flexDirection: "column",
  flex: "1 1 0%",
  height: 0,
  minHeight: 0,
  overflow: "hidden",
};

/**
 * Zones section is content-sized (paginated 2 CCT / 4 non-CCT).
 * Compact cards like Reception Area — do not stretch to fill leftover height.
 */
export const HEATMAP_ZONES_SECTION_SX = {
  flex: "0 0 auto",
  flexShrink: 0,
  minHeight: 0,
  overflow: "hidden",
};

/** Zone cards page — content height; no inner scrollbar. */
export const HEATMAP_ZONES_LIST_SCROLL_SX = {
  flex: "0 0 auto",
  minHeight: 0,
  overflow: "hidden",
  overflowY: "hidden",
  overflowX: "hidden",
  pr: { xs: 0.5, md: 0.75 },
  boxSizing: "border-box",
};

/** Paginated sidebar: 2 or 4 zone cards; content-sized. */
export const HEATMAP_ZONES_LIST_PAGINATED_SX = {
  flex: "0 0 auto",
  minHeight: 0,
  overflow: "hidden",
  overflowY: "hidden",
  overflowX: "hidden",
  // Keep % / K chips clear of scrollbar / pagination edge.
  pr: { xs: 0.5, md: 0.75 },
  boxSizing: "border-box",
};

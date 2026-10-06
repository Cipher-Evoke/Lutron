/** Shared width rules for zone control cards in the floorplan sidebar and area settings dialog. */
export const ZONE_CONTROL_CARD_WIDTH_SX = {
  width: "100%",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  alignSelf: "stretch",
};

export const ZONE_CONTROL_SLIDER_WRAP_SX = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
};

/** Slider track with room for a value chip above the thumb — compact for sidebar height. */
export const ZONE_CONTROL_SLIDER_WITH_THUMB_VALUE_SX = {
  position: "relative",
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

/**
 * Zones section is content-sized (paginated 2 CCT / 4 non-CCT).
 * Compact cards like Meeting Room — do not stretch to fill leftover height.
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
  pr: { xs: 0.5, md: 0.75 },
  boxSizing: "border-box",
};

/** Same as paginated — kept for imports. */
export const HEATMAP_ZONES_LIST_WITH_SHADES_SCROLL_SX = {
  ...HEATMAP_ZONES_LIST_PAGINATED_SX,
};

export const HEATMAP_ZONES_LIST_WITH_SHADES_PAGINATED_SX = {
  ...HEATMAP_ZONES_LIST_PAGINATED_SX,
};

/**
 * Advanced sidebar shell — fixed-height column; no outer scroll.
 */
export const ADVANCED_HEATMAP_SIDEBAR_SX = {
  flex: "0 0 auto",
  height: "100%",
  maxHeight: "100%",
  alignSelf: "stretch",
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
  overflow: "hidden",
};

/** Fixed header — body does not scroll underneath. */
export const ADVANCED_HEATMAP_SIDEBAR_STICKY_HEADER_SX = {
  flexShrink: 0,
  position: "relative",
  zIndex: 3,
};

/**
 * Body stacks sections with overflow hidden.
 * Zones list is the only scrollport (see HEATMAP_ZONES_LIST_*_SX).
 */
export const ADVANCED_HEATMAP_SIDEBAR_BODY_SX = {
  flex: "1 1 0%",
  height: 0,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  overflowX: "hidden",
  overflowY: "hidden",
  overscrollBehavior: "contain",
};

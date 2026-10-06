/**
 * @jest-environment node
 */

import {
  ZONE_CONTROL_CARD_WIDTH_SX,
  HEATMAP_STATUS_PANEL_OVERFLOW_SX,
  HEATMAP_SIDEBAR_MAIN_SCROLL_SX,
  HEATMAP_SIDEBAR_STICKY_HEADER_SX,
  HEATMAP_ZONES_SECTION_SX,
  HEATMAP_ZONES_LIST_SCROLL_SX,
  HEATMAP_ZONES_LIST_PAGINATED_SX,
  SIDEBAR_ZONE_CARD_SHELL_SX,
  SIDEBAR_ZONE_NAME_SX,
  SIDEBAR_SECTION_TAB_FONT_SX,
  ZONE_CONTROL_FOLLOWING_SLIDER_SX,
  ZONE_CONTROL_SIDEBAR_SLIDER_ROOT_SX,
  SIDEBAR_ZONE_SLIDER_ROW_SX,
  SIDEBAR_ZONE_SIDE_VALUE_CHIP_SX,
} from "./zoneControlCardLayout";

describe("zoneControlCardLayout", () => {
  it("uses full-width zone cards", () => {
    expect(ZONE_CONTROL_CARD_WIDTH_SX).toMatchObject({
      width: "100%",
      maxWidth: "100%",
      minWidth: 0,
    });
  });

  it("keeps zone cards compact (content height, not stretched)", () => {
    expect(SIDEBAR_ZONE_CARD_SHELL_SX.flex).toBe("0 0 auto");
    expect(SIDEBAR_ZONE_NAME_SX.fontSize).toMatchObject({ xs: 10, md: 12 });
    expect(SIDEBAR_SECTION_TAB_FONT_SX.fontFamily).toContain("Arial");
  });

  it("keeps stacked CCT slider tighter than the first slider", () => {
    expect(ZONE_CONTROL_FOLLOWING_SLIDER_SX.mt).toBe(0);
    expect(ZONE_CONTROL_FOLLOWING_SLIDER_SX.pt).toBeLessThanOrEqual(0.55);
    expect(ZONE_CONTROL_SIDEBAR_SLIDER_ROOT_SX.paddingTop).toBe(0);
  });

  it("places current value beside the slider track", () => {
    expect(SIDEBAR_ZONE_SLIDER_ROW_SX.display).toBe("flex");
    expect(SIDEBAR_ZONE_SLIDER_ROW_SX.flexDirection).toBe("row");
    expect(SIDEBAR_ZONE_SIDE_VALUE_CHIP_SX.flexShrink).toBe(0);
  });

  it("clips the status panel (no outer vertical scroll)", () => {
    expect(HEATMAP_STATUS_PANEL_OVERFLOW_SX).toMatchObject({
      overflow: "hidden",
      overflowY: "hidden",
      minHeight: 0,
    });
  });

  it("keeps the header fixed (not a sticky scroll companion)", () => {
    expect(HEATMAP_SIDEBAR_STICKY_HEADER_SX).toMatchObject({
      flexShrink: 0,
      position: "relative",
    });
  });

  it("makes the body a non-scrolling flex column", () => {
    expect(HEATMAP_SIDEBAR_MAIN_SCROLL_SX).toMatchObject({
      overflow: "hidden",
      flex: "1 1 0%",
      minHeight: 0,
    });
  });

  it("keeps the zones section content-sized (not stretched to fill leftover height)", () => {
    expect(HEATMAP_ZONES_SECTION_SX).toMatchObject({
      flex: "0 0 auto",
      flexShrink: 0,
      minHeight: 0,
      overflow: "hidden",
    });
  });

  it("does not scroll zone cards — pagination only", () => {
    expect(HEATMAP_ZONES_LIST_SCROLL_SX).toMatchObject({
      flex: "0 0 auto",
      overflowY: "hidden",
      overflowX: "hidden",
    });
    expect(HEATMAP_ZONES_LIST_PAGINATED_SX).toMatchObject({
      flex: "0 0 auto",
      overflowY: "hidden",
      overflowX: "hidden",
    });
  });
});

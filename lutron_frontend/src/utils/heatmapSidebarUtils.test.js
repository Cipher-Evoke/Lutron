import {
  buildShadesUpdatePayload,
  clampShadeLevel,
  getShadesForPage,
  getShadesPageCount,
  getShadeDisplayName,
  isShadePresetActive,
  parseShadeLevel,
  resolveShadeZoneId,
  SHADES_VISIBLE_PER_PAGE,
  SHADE_PRESET_LEVELS,
} from "./heatmapSidebarUtils";
import { getSlatColors } from "../components/heatmap/ShadeSlatIcon";

describe("heatmapSidebarUtils", () => {
  const shades = [
    { id: 1509, name: "Shade Group 1", type: "shade", level: "100%" },
    { id: 1521, name: "Shade Group 2", type: "shade", level: "75%" },
    { id: 1584, zone_id: 1584, name: "Shade Group 3", type: "shade", level: 50 },
  ];

  it("parses shade levels from strings and numbers", () => {
    expect(parseShadeLevel("100%")).toBe(100);
    expect(parseShadeLevel("25")).toBe(25);
    expect(parseShadeLevel(50)).toBe(50);
    expect(parseShadeLevel("bad")).toBe(0);
  });

  it("resolves shade zone ids from id or zone_id", () => {
    expect(resolveShadeZoneId({ id: 1509 })).toBe(1509);
    expect(resolveShadeZoneId({ zone_id: "1584" })).toBe(1584);
    expect(resolveShadeZoneId({})).toBeNull();
  });

  it("paginates shades two per page", () => {
    expect(getShadesForPage(shades, 0)).toHaveLength(2);
    expect(getShadesForPage(shades, 1)).toHaveLength(1);
    expect(getShadesPageCount(shades)).toBe(2);
    expect(SHADES_VISIBLE_PER_PAGE).toBe(2);
  });

  it("builds update payload with string local keys and numeric api ids", () => {
    const payload = buildShadesUpdatePayload(shades, {
      1509: 80,
      1521: 75,
      1584: 10,
    });

    expect(payload).toEqual([
      { zone_id: 1509, zone_type: "Shade", level: 80 },
      { zone_id: 1584, zone_type: "Shade", level: 10 },
    ]);
  });

  it("detects active preset across all shades", () => {
    expect(
      isShadePresetActive(shades, { 1509: 50, 1521: 50, 1584: 50 }, 50)
    ).toBe(true);
    expect(
      isShadePresetActive(shades, { 1509: 50, 1521: 75, 1584: 50 }, 50)
    ).toBe(false);
  });

  it("uses display names from api data", () => {
    expect(getShadeDisplayName(shades[0])).toBe("Shade Group 1");
    expect(SHADE_PRESET_LEVELS).toEqual([100, 75, 50, 25, 0]);
  });

  it("fills slats bottom-up for open percentage", () => {
    expect(getSlatColors(0, 7).every((color) => color === "#3a3a3a")).toBe(true);
    expect(getSlatColors(100, 7).every((color) => color === "#b8d4e8")).toBe(true);
    expect(getSlatColors(50, 7).filter((color) => color === "#b8d4e8")).toHaveLength(4);
  });

  it("clamps shade levels", () => {
    expect(clampShadeLevel(120)).toBe(100);
    expect(clampShadeLevel(-5)).toBe(0);
    expect(clampShadeLevel("42.6")).toBe(43);
  });
});

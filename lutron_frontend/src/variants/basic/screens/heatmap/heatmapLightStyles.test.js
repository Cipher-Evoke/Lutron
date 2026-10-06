/**
 * @jest-environment node
 */

import {
  clampLightLevel,
  getLightLevelFillColor,
  LIGHT_OFF_GREY_HEX,
  resolveLightModeFill,
} from "./heatmapLightStyles";

const THEME_LIGHT = "#f2ff00";

describe("clampLightLevel", () => {
  it("clamps and rounds", () => {
    expect(clampLightLevel(99.6)).toBe(100);
    expect(clampLightLevel(-5)).toBe(0);
    expect(clampLightLevel(150)).toBe(100);
  });

  it("returns null for invalid", () => {
    expect(clampLightLevel(null)).toBeNull();
    expect(clampLightLevel("")).toBeNull();
    expect(clampLightLevel(undefined)).toBeNull();
  });
});

describe("getLightLevelFillColor", () => {
  it("level 0 is grey off color", () => {
    expect(getLightLevelFillColor(0, THEME_LIGHT)).toBe("rgba(95, 95, 95, 0.5)");
  });

  it("level 100 uses theme light color", () => {
    expect(getLightLevelFillColor(100, THEME_LIGHT)).toBe(
      "rgba(242, 255, 0, 0.5)"
    );
  });

  it("level 50 is between grey and theme", () => {
    const mid = getLightLevelFillColor(50, THEME_LIGHT);
    expect(mid).toMatch(/^rgba\(\d+, \d+, \d+, 0\.5\)$/);
    expect(mid).not.toBe(getLightLevelFillColor(0, THEME_LIGHT));
    expect(mid).not.toBe(getLightLevelFillColor(100, THEME_LIGHT));
  });
});

describe("resolveLightModeFill", () => {
  it("uses light_level when present", () => {
    expect(
      resolveLightModeFill({ light_level: 25, light_status: "on" }, THEME_LIGHT)
    ).toBe(getLightLevelFillColor(25, THEME_LIGHT));
  });

  it("falls back to on as 100", () => {
    expect(resolveLightModeFill({ light_status: "on" }, THEME_LIGHT)).toBe(
      getLightLevelFillColor(100, THEME_LIGHT)
    );
  });

  it("falls back to off as 0", () => {
    expect(resolveLightModeFill({ light_status: "off" }, THEME_LIGHT)).toBe(
      getLightLevelFillColor(0, THEME_LIGHT)
    );
  });

  it("unknown status is transparent", () => {
    expect(resolveLightModeFill({}, THEME_LIGHT)).toBe("transparent");
  });

  it("unreachable processor is transparent (PDF original colors)", () => {
    expect(
      resolveLightModeFill(
        { processor_reachable: false, light_level: 80, light_status: "on" },
        THEME_LIGHT
      )
    ).toBe("transparent");
  });
});

describe("LIGHT_OFF_GREY_HEX", () => {
  it("matches legacy off rgba rgb", () => {
    expect(LIGHT_OFF_GREY_HEX).toBe("#5f5f5f");
  });
});

/**
 * @jest-environment node
 */
import {
  normalizeLightStatus,
  areaIdsMatch,
  deriveLightStatusFromZoneUpdates,
  maxFadeDelayMs,
  patchAreasLightStatus,
} from "./heatmapMapSync";

describe("heatmapMapSync", () => {
  describe("normalizeLightStatus", () => {
    it("normalizes On/Off and booleans", () => {
      expect(normalizeLightStatus("On")).toBe("on");
      expect(normalizeLightStatus("OFF")).toBe("off");
      expect(normalizeLightStatus(true)).toBe("on");
      expect(normalizeLightStatus(false)).toBe("off");
      expect(normalizeLightStatus(null)).toBeNull();
    });
  });

  describe("areaIdsMatch", () => {
    it("matches area_id or id", () => {
      expect(areaIdsMatch({ area_id: 10, id: 99 }, 10)).toBe(true);
      expect(areaIdsMatch({ id: 10 }, 10)).toBe(true);
      expect(areaIdsMatch({ area_id: 11 }, 10)).toBe(false);
    });
  });

  describe("deriveLightStatusFromZoneUpdates", () => {
    it("returns off when all dimmed levels are zero", () => {
      expect(
        deriveLightStatusFromZoneUpdates([
          { zone_type: "Dimmed", level: 0 },
          { zone_type: "WhiteTune", level: 0 },
        ])
      ).toBe("off");
    });

    it("returns on when any zone has level > 0", () => {
      expect(
        deriveLightStatusFromZoneUpdates([{ zone_type: "Dimmed", level: 50 }])
      ).toBe("on");
    });

    it("handles switched zones", () => {
      expect(
        deriveLightStatusFromZoneUpdates([
          { zone_type: "Switched", switched_state: "Off" },
        ])
      ).toBe("off");
      expect(
        deriveLightStatusFromZoneUpdates([
          { zone_type: "Switched", switched_state: "On" },
        ])
      ).toBe("on");
    });
  });

  describe("maxFadeDelayMs", () => {
    it("uses fade + delay seconds capped at 5s", () => {
      expect(maxFadeDelayMs([{ fade_time: "02", delay_time: "01" }])).toBe(3200);
      expect(maxFadeDelayMs([])).toBe(300);
    });
  });

  describe("patchAreasLightStatus", () => {
    it("updates only the matching area", () => {
      const areas = [
        { area_id: 10, light_status: "on" },
        { area_id: 11, light_status: "on" },
      ];
      const out = patchAreasLightStatus(areas, 10, "off");
      expect(out[0].light_status).toBe("off");
      expect(out[1].light_status).toBe("on");
    });
  });
});

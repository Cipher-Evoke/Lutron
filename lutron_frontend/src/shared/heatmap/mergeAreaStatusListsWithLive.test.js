import { mergeCachedAreaListsWithLiveStatus } from "./mergeAreaStatusListsWithLive";

describe("mergeCachedAreaListsWithLiveStatus", () => {
  it("uses cached scene list and live active_scene", () => {
    const cached = {
      area_scenes: [{ id: 1, name: "OFF" }, { id: 2, name: "ON" }],
      zones: [{ id: 10, name: "a", type: "dimmed", brightness: "100%" }],
    };
    const live = {
      active_scene: 1,
      light_status: "Off",
      area_scenes: [{ id: 99, name: "LEAP ONLY" }],
      zones: [{ id: 10, name: "a", type: "dimmed", brightness: "0%" }],
    };
    const merged = mergeCachedAreaListsWithLiveStatus(cached, live);
    expect(merged.area_scenes).toEqual(cached.area_scenes);
    expect(merged.active_scene).toBe(1);
    expect(merged.zones[0].brightness).toBe("0%");
    expect(merged.zones[0].name).toBe("a");
  });

  it("falls back to live zones when cache list is empty", () => {
    const cached = { area_scenes: [], zones: [] };
    const live = {
      zones: [{ id: 4777, name: "a", type: "whitetune", brightness: "25%" }],
    };
    const merged = mergeCachedAreaListsWithLiveStatus(cached, live);
    expect(merged.zones).toEqual(live.zones);
  });
});

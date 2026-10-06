/**
 * @jest-environment node
 */
jest.mock("../../../../BaseUrl", () => ({
  BaseUrl: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}));

import heatmapReducer, {
  fetchAreaStatus,
  updateZonesByArea,
  toggleAllZonesInArea,
} from "./HeatmapSlice";

const baseHeatmap = {
  areas: [
    { area_id: 10, id: 10, name: "A", light_status: "on" },
    { area_id: 11, id: 11, name: "B", light_status: "on" },
  ],
};

const baseState = {
  heatmapData: baseHeatmap,
  areaStatus: { area_id: 10, light_status: "On", zones: [] },
};

describe("heatmap map polygon sync reducers", () => {
  it("fetchAreaStatus.fulfilled normalizes light_status and matches by id", () => {
    const next = heatmapReducer(
      baseState,
      fetchAreaStatus.fulfilled({
        area_id: 10,
        light_status: "Off",
        occupancy_status: "Unoccupied",
      })
    );
    const a10 = next.heatmapData.areas.find((a) => a.area_id === 10);
    expect(a10.light_status).toBe("off");
    const a11 = next.heatmapData.areas.find((a) => a.area_id === 11);
    expect(a11.light_status).toBe("on");
  });

  it("updateZonesByArea.fulfilled optimistically sets light_status from zone commands", () => {
    const next = heatmapReducer(
      baseState,
      {
        type: updateZonesByArea.fulfilled.type,
        payload: { status: "success", message: "ok" },
        meta: {
          arg: {
            areaId: 10,
            zones: [{ zone_type: "Dimmed", level: 0, fade_time: "02" }],
          },
        },
      }
    );
    expect(next.heatmapData.areas.find((a) => a.area_id === 10).light_status).toBe(
      "off"
    );
    expect(next.heatmapData.areas.find((a) => a.area_id === 10).status).toBeUndefined();
  });

  it("toggleAllZonesInArea.fulfilled sets light_status from meta action", () => {
    const next = heatmapReducer(
      baseState,
      {
        type: toggleAllZonesInArea.fulfilled.type,
        payload: { status: "success" },
        meta: { arg: { areaId: 10, action: "Off" } },
      }
    );
    expect(next.heatmapData.areas.find((a) => a.area_id === 10).light_status).toBe(
      "off"
    );
  });
});

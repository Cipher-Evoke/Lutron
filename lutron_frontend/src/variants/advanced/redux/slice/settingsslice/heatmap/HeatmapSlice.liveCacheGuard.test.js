/**
 * @jest-environment node
 *
 * Click flicker: cache WS push must not paint while fetchAreaStatus is in flight.
 */
jest.mock("../../../../BaseUrl", () => ({
  BaseUrl: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}));

import heatmapReducer, { fetchAreaStatus } from "./HeatmapSlice";
import { applyHeatmapAreaStatusLive } from "../../../../../../shared/heatmap/heatmapLiveActions";

const receptionCacheOn = {
  area_id: 17,
  light_status: "On",
  zones: [
    { id: 1, type: "Dimmed", level: 100 },
    { id: 2, type: "Dimmed", level: 100 },
  ],
};

const receptionLiveOff = {
  area_id: 17,
  light_status: "Off",
  zones: [
    { id: 1, type: "Dimmed", level: 0 },
    { id: 2, type: "Dimmed", level: 0 },
  ],
};

describe("applyHeatmapAreaStatusLive click flicker guard", () => {
  it("ignores cache push while awaiting live=1 for the same area", () => {
    let state = {
      heatmapData: {
        areas: [{ area_id: 17, id: 17, name: "RECEPTION", light_status: "off", light_level: 0 }],
      },
      areaStatus: null,
      areaStatusFetchingId: null,
    };

    state = heatmapReducer(
      state,
      fetchAreaStatus.pending("", { areaId: 17 })
    );
    expect(state.areaStatusFetchingId).toBe(17);

    state = heatmapReducer(state, applyHeatmapAreaStatusLive(receptionCacheOn));
    expect(state.areaStatus).toBe(null);

    state = heatmapReducer(
      state,
      fetchAreaStatus.fulfilled(receptionLiveOff, "", { areaId: 17 })
    );
    expect(state.areaStatusFetchingId).toBe(null);
    expect(state.areaStatus?.light_status).toMatch(/off/i);
  });

  it("still applies cache push when no live read is in flight", () => {
    let state = {
      heatmapData: {
        areas: [{ area_id: 17, id: 17, name: "RECEPTION", light_status: "off", light_level: 0 }],
      },
      areaStatus: null,
      areaStatusFetchingId: null,
    };

    state = heatmapReducer(state, applyHeatmapAreaStatusLive(receptionCacheOn));
    expect(state.areaStatus?.area_id).toBe(17);
  });
});

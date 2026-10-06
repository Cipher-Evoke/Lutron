/**
 * @jest-environment node
 */

import {
  keepSidebarZonesIfIncomingEmpty,
  mergeHeatmapAreaStatusLive,
} from "./heatmapLiveStateMerge";

describe("keepSidebarZonesIfIncomingEmpty", () => {
  const previous = {
    area_id: 12,
    zones: [{ id: 1, name: "Lobby" }],
    consumption: 4,
  };

  it("keeps previous zones when incoming list is empty", () => {
    const incoming = { area_id: 12, zones: [], consumption: 1 };
    expect(keepSidebarZonesIfIncomingEmpty(previous, incoming).zones).toEqual(
      previous.zones
    );
  });

  it("uses incoming zones when they are present", () => {
    const incoming = {
      area_id: 12,
      zones: [{ id: 2, name: "Desk" }],
    };
    expect(keepSidebarZonesIfIncomingEmpty(previous, incoming).zones).toEqual(
      incoming.zones
    );
  });

  it("does not copy zones onto a different area", () => {
    const incoming = { area_id: 99, zones: [] };
    expect(keepSidebarZonesIfIncomingEmpty(previous, incoming).zones).toEqual([]);
  });
});

describe("mergeHeatmapAreaStatusLive", () => {
  it("does not wipe sidebar zones with an empty cache push", () => {
    const state = {
      areaStatus: {
        area_id: 12,
        zones: [{ id: 1, name: "Lobby" }],
        consumption: 4,
      },
      heatmapData: { areas: [{ area_id: 12, id: 12 }] },
    };
    mergeHeatmapAreaStatusLive(state, {
      area_id: 12,
      zones: [],
      light_status: "On",
      occupancy_status: "Occupied",
    });
    expect(state.areaStatus.zones).toEqual([{ id: 1, name: "Lobby" }]);
  });
});

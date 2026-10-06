import { shouldSkipAreaStatusRefetch } from "./shouldSkipAreaStatusRefetch";

describe("shouldSkipAreaStatusRefetch", () => {
  const areaStatus = {
    area_id: 12,
    light_status: "On",
    occupancy_status: "Occupied",
    zones: [{ id: 1, name: "a" }],
  };

  it("fetches when switching areas", () => {
    expect(
      shouldSkipAreaStatusRefetch({
        areaId: 99,
        areaStatus,
        areaStatusLoading: false,
        mapAreas: [{ id: 99, light_status: "On" }],
      })
    ).toBe(false);
  });

  it("skips same area with no map drift", () => {
    expect(
      shouldSkipAreaStatusRefetch({
        areaId: 12,
        areaStatus,
        areaStatusLoading: false,
        mapAreas: [{ area_id: 12, light_status: "on", occupancy_status: "occupied" }],
      })
    ).toBe(true);
  });

  it("fetches when map light drifted", () => {
    expect(
      shouldSkipAreaStatusRefetch({
        areaId: 12,
        areaStatus,
        areaStatusLoading: false,
        mapAreas: [{ id: 12, light_status: "Off", occupancy_status: "Occupied" }],
      })
    ).toBe(false);
  });

  it("fetches same area when sidebar zones are empty", () => {
    expect(
      shouldSkipAreaStatusRefetch({
        areaId: 12,
        areaStatus: { ...areaStatus, zones: [] },
        areaStatusLoading: false,
        mapAreas: [{ area_id: 12, light_status: "on", occupancy_status: "occupied" }],
      })
    ).toBe(false);
  });
});

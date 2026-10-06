/**
 * @jest-environment node
 */
import { configureStore } from "@reduxjs/toolkit";
import heatmapReducer, { renameArea } from "./HeatmapSlice";

const mockPost = jest.fn();

jest.mock("../../../../BaseUrl", () => ({
  BaseUrl: {
    post: (...args) => mockPost(...args),
  },
}));

const heatmapPreloaded = {
  selectedFloorId: 1,
  displayMode: "Light",
  searchTerm: "",
  heatmapData: {
    areas: [
      { area_id: 10, id: 10, name: "Meeting Old", area_name: "Meeting Old" },
      { area_id: 11, id: 11, name: "Other", area_name: "Other" },
    ],
  },
  pdfUrl: null,
  loading: false,
  error: null,
  areaStatus: {
    area_id: 10,
    area_name: "Meeting Old",
    floor_id: 1,
  },
  areaStatusLoading: false,
  areaStatusError: null,
  toggleAllZonesLoading: false,
  toggleAllZonesError: null,
};

describe("renameArea", () => {
  beforeEach(() => {
    mockPost.mockReset();
  });

  it("POSTs /area/rename and updates areaStatus and heatmap area labels on success", async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        status: "success",
        area_id: 10,
        processor_id: 3,
        area_code: "1392",
        name: "Conference West",
      },
    });

    const store = configureStore({
      reducer: { heatmap: heatmapReducer },
      preloadedState: { heatmap: heatmapPreloaded },
    });

    await store.dispatch(
      renameArea({ area_id: 10, new_name: "Conference West" })
    ).unwrap();

    expect(mockPost).toHaveBeenCalledWith("/area/rename", {
      area_id: 10,
      new_name: "Conference West",
    });

    const s = store.getState().heatmap;
    expect(s.areaStatus.area_name).toBe("Conference West");
    const a10 = s.heatmapData.areas.find((a) => a.area_id === 10);
    expect(a10.name).toBe("Conference West");
    expect(a10.area_name).toBe("Conference West");
    const a11 = s.heatmapData.areas.find((a) => a.area_id === 11);
    expect(a11.name).toBe("Other");
  });

  it("rejects with string detail from API", async () => {
    mockPost.mockRejectedValueOnce({
      response: { data: { detail: "Only Admin or Superadmin can rename areas." } },
      message: "Request failed",
    });

    const store = configureStore({
      reducer: { heatmap: heatmapReducer },
      preloadedState: { heatmap: heatmapPreloaded },
    });

    const action = await store.dispatch(
      renameArea({ area_id: 10, new_name: "X" })
    );

    expect(renameArea.rejected.match(action)).toBe(true);
    expect(action.payload).toBe("Only Admin or Superadmin can rename areas.");
  });
});

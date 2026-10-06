/**
 * @jest-environment node
 */

import { isAreaAwaitingLiveRead } from "./liveCachePushGuard";

test("false when nothing is fetching", () => {
  expect(isAreaAwaitingLiveRead({ areaStatusFetchingId: null }, 17)).toBe(false);
  expect(isAreaAwaitingLiveRead({}, 17)).toBe(false);
});

test("true when same area is awaiting live read", () => {
  expect(isAreaAwaitingLiveRead({ areaStatusFetchingId: 17 }, 17)).toBe(true);
  expect(isAreaAwaitingLiveRead({ areaStatusFetchingId: "17" }, 17)).toBe(true);
});

test("false when a different area is awaiting", () => {
  expect(isAreaAwaitingLiveRead({ areaStatusFetchingId: 10 }, 17)).toBe(false);
});

test("false for null/empty incoming area id", () => {
  expect(isAreaAwaitingLiveRead({ areaStatusFetchingId: 17 }, null)).toBe(false);
  expect(isAreaAwaitingLiveRead({ areaStatusFetchingId: 17 }, "")).toBe(false);
});

test("does not wedge when fetch cleared", () => {
  expect(
    isAreaAwaitingLiveRead({ areaStatusFetchingId: null }, 17)
  ).toBe(false);
});

/**
 * @jest-environment node
 */

import {
  createTwoLineLabel,
  getHeatmapPolygonLabelCenter,
  getHeatmapLabelFontSize,
} from "./createTwoLineLabel";

test("splits Conference Room into two uppercase lines", () => {
  expect(createTwoLineLabel("Conference Room")).toEqual(["CONFERENCE", "ROOM"]);
});

test("splits Ladies Washroom into two full words", () => {
  expect(createTwoLineLabel("Ladies Washroom")).toEqual(["LADIES", "WASHROOM"]);
});

test("keeps WS_1 as a single line", () => {
  expect(createTwoLineLabel("WS_1")).toEqual(["WS_1"]);
});

test("puts OS code on the second line and keeps slashes", () => {
  expect(createTwoLineLabel("Experiance Area OS-14/16")).toEqual([
    "EXPERIANCE AREA",
    "OS-14/16",
  ]);
  expect(createTwoLineLabel("OS-19/20/21")[0]).toContain("OS-19/20/21");
});

test("splits on first space when there is no OS token", () => {
  expect(createTwoLineLabel("Passage HS-1")).toEqual(["PASSAGE", "HS-1"]);
});

test("applies areaSize char limits", () => {
  const lines = createTwoLineLabel("Conference Room Extra Long Name", 30);
  expect(lines[0].length).toBeLessThanOrEqual(12);
  expect(lines[1].length).toBeLessThanOrEqual(10);
});

test("returns empty array for blank names", () => {
  expect(createTwoLineLabel("")).toEqual([]);
  expect(createTwoLineLabel(null)).toEqual([]);
});

test("vertex-averages polygon coordinates", () => {
  const coords = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 },
  ];
  const center = getHeatmapPolygonLabelCenter(coords, "WS_1");
  expect(center.x).toBeCloseTo(5);
  expect(center.y).toBeCloseTo(5);
});

test("PB OS-24 uses median of sorted coords when usePbOs24Fix is set", () => {
  const coords = [
    { x: 0, y: 0 },
    { x: 2, y: 10 },
    { x: 100, y: 4 },
  ];
  const center = getHeatmapPolygonLabelCenter(coords, "PB OS-24", {
    usePbOs24Fix: true,
  });
  expect(center.x).toBe(2);
  expect(center.y).toBe(4);
});

test("font is 6-9 SVG units, not divided by fitScale", () => {
  expect(getHeatmapLabelFontSize(120, 8)).toBe(8);
  expect(getHeatmapLabelFontSize(30, 8)).toBe(5);
  expect(getHeatmapLabelFontSize(60, 8)).toBe(6);
});

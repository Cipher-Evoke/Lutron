/** @jest-environment node */

import {
  clampMarkerSizeForShapeChange,
  findLargestContainedHalfAxes,
  hasValidAreaRings,
  isMarkerSizeContained,
} from "./markerContainment";

const SQUARE_RING = [
  { x: 100, y: 100 },
  { x: 300, y: 100 },
  { x: 300, y: 300 },
  { x: 100, y: 300 },
];

describe("markerContainment", () => {
  test("hasValidAreaRings rejects empty geometry", () => {
    expect(hasValidAreaRings([])).toBe(false);
    expect(hasValidAreaRings(null)).toBe(false);
    expect(hasValidAreaRings([SQUARE_RING])).toBe(true);
  });

  test("shape change circle to glowing_dot shrinks when halo exceeds area", () => {
    const rings = [SQUARE_RING];
    const cx = 200;
    const cy = 200;
    const half = 80;
    expect(
      isMarkerSizeContained("circle", cx, cy, half, half, rings)
    ).toBe(true);
    expect(
      isMarkerSizeContained("glowing_dot", cx, cy, half, half, rings)
    ).toBe(false);
    const patch = clampMarkerSizeForShapeChange({
      shape: "glowing_dot",
      cx,
      cy,
      halfX: half,
      halfY: half,
      rings,
    });
    expect(patch.shape_size_x).toBeLessThan(half);
    expect(patch.shape_size_x).toBeGreaterThanOrEqual(4);
  });

  test("shape change circle to square keeps size when still contained", () => {
    const patch = clampMarkerSizeForShapeChange({
      shape: "square",
      cx: 200,
      cy: 200,
      halfX: 50,
      halfY: 50,
      rings: [SQUARE_RING],
    });
    expect(patch.shape_size_x).toBe(50);
    expect(patch.shape_size_y).toBe(50);
  });

  test("shape change square to triangle shrink-to-fit", () => {
    const fitted = findLargestContainedHalfAxes({
      shape: "triangle",
      cx: 200,
      cy: 200,
      maxHalfX: 90,
      maxHalfY: 90,
      rings: [SQUARE_RING],
    });
    expect(
      isMarkerSizeContained(
        "triangle",
        200,
        200,
        fitted.halfX,
        fitted.halfY,
        [SQUARE_RING]
      )
    ).toBe(true);
  });

  test("shape change to bulb fits stem inside square", () => {
    const patch = clampMarkerSizeForShapeChange({
      shape: "bulb",
      cx: 200,
      cy: 200,
      halfX: 40,
      halfY: 40,
      rings: [SQUARE_RING],
    });
    expect(
      isMarkerSizeContained(
        "bulb",
        200,
        200,
        patch.shape_size_x,
        patch.shape_size_y,
        [SQUARE_RING]
      )
    ).toBe(true);
  });

  test("missing rings returns minimum size from findLargestContainedHalfAxes", () => {
    const fitted = findLargestContainedHalfAxes({
      shape: "circle",
      cx: 200,
      cy: 200,
      maxHalfX: 80,
      maxHalfY: 80,
      rings: [],
    });
    expect(fitted.halfX).toBe(4);
    expect(fitted.halfY).toBe(4);
  });
});

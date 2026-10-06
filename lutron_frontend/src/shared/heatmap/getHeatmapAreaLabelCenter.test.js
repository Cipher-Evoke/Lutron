/**
 * @jest-environment node
 */

import {
  getHeatmapAreaLabelCenter,
  getHeatmapAreaLabelPlacement,
} from "./getHeatmapAreaLabelCenter";

test("centers a rectangle at bbox midpoint (not skewed by dense edge)", () => {
  const ring = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 20, y: 0 },
    { x: 30, y: 0 },
    { x: 40, y: 0 },
    { x: 50, y: 0 },
    { x: 50, y: 40 },
    { x: 0, y: 40 },
  ];
  const center = getHeatmapAreaLabelCenter(ring, [ring]);
  expect(center.x).toBeCloseTo(25, 0);
  expect(center.y).toBeCloseTo(20, 0);
});

test("uses largest ring when multiple rings exist", () => {
  const small = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 },
  ];
  const large = [
    { x: 100, y: 100 },
    { x: 200, y: 100 },
    { x: 200, y: 180 },
    { x: 100, y: 180 },
  ];
  const center = getHeatmapAreaLabelCenter([], [small, large]);
  expect(center.x).toBeCloseTo(150, -1);
  expect(center.y).toBeCloseTo(140, -1);
});

test("falls back to bbox center for open polylines", () => {
  const coords = [
    { x: 10, y: 20 },
    { x: 30, y: 20 },
  ];
  const center = getHeatmapAreaLabelCenter(coords);
  expect(center.x).toBe(20);
  expect(center.y).toBe(20);
});

test("WS SHADES L-shape places label inside bottom strip with tight fit box", () => {
  const ring = [
    { x: 212, y: 1783 },
    { x: 141, y: 1762 },
    { x: 63, y: 1689 },
    { x: 34, y: 1594 },
    { x: 34, y: 624 },
    { x: 88, y: 624 },
    { x: 87, y: 1585 },
    { x: 110, y: 1653 },
    { x: 167, y: 1706 },
    { x: 223, y: 1722 },
    { x: 2078, y: 1723 },
    { x: 2074, y: 1775 },
    { x: 399, y: 1783 },
  ];
  const place = getHeatmapAreaLabelPlacement(ring, [ring]);

  expect(place.y).toBeGreaterThan(1680);
  expect(place.y).toBeLessThan(1790);
  expect(place.x).toBeGreaterThan(250);
  expect(place.x).toBeLessThan(2000);
  expect(place.fitHeight).toBeLessThan(120);
  expect(place.fitWidth).toBeGreaterThan(400);
});

test("RECEPTION AREA C-shape places label in open body not top corridor", () => {
  // 1st Floor RECEPTION AREA — wraps around training/meeting rooms.
  const ring = [
    { x: 1921.7, y: 290.5 },
    { x: 2128.1, y: 290.5 },
    { x: 2128.1, y: 1876.6 },
    { x: 252.8, y: 1881.7 },
    { x: 136.2, y: 1829.6 },
    { x: 91.3, y: 1766.2 },
    { x: 72.9, y: 1691.6 },
    { x: 34.0, y: 1689.6 },
    { x: 34.0, y: 1049.8 },
    { x: 1691.7, y: 1062.1 },
    { x: 1686.6, y: 507.1 },
    { x: 1921.7, y: 507.1 },
  ];
  const place = getHeatmapAreaLabelPlacement(ring, [ring]);

  // Open body sits below the inner cut (~y 1062); avoid the top-of-opening corridor.
  expect(place.y).toBeGreaterThan(1200);
  expect(place.y).toBeLessThan(1750);
  expect(place.x).toBeGreaterThan(400);
  expect(place.x).toBeLessThan(1900);
  // Fit box should reflect open room, not the thin top-right notch alone.
  expect(place.fitHeight).toBeGreaterThan(400);
  expect(place.fitWidth).toBeGreaterThan(800);
});

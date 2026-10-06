/**
 * @jest-environment node
 */

import { alertMarkerHitRadius } from "./alertMarker";

test("hit radius grows when zoomed out", () => {
  const atFit = alertMarkerHitRadius(12, 1);
  const zoomedOut = alertMarkerHitRadius(12, 0.25);
  expect(zoomedOut).toBeGreaterThan(atFit);
});

test("hit radius shrinks when zoomed in but stays above triangle", () => {
  const zoomedIn = alertMarkerHitRadius(12, 4);
  expect(zoomedIn).toBeGreaterThanOrEqual(8);
  expect(zoomedIn).toBeLessThan(alertMarkerHitRadius(12, 1));
});

test("invalid inputs fall back safely", () => {
  expect(alertMarkerHitRadius(null, null)).toBeGreaterThan(0);
});

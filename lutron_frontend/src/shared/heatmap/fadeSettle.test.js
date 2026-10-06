/**
 * @jest-environment node
 */

import {
  DEFAULT_FADE_SETTLE_MS,
  MAX_FADE_SETTLE_MS,
  fadeSettleMsFromZones,
  parseFadeSeconds,
} from "./fadeSettle";

test("parseFadeSeconds handles padded strings and rejects junk", () => {
  expect(parseFadeSeconds("02")).toBe(2);
  expect(parseFadeSeconds(1.5)).toBe(1.5);
  expect(parseFadeSeconds("")).toBe(null);
  expect(parseFadeSeconds("x")).toBe(null);
});

test("defaults to 2s when zones lack fade/delay fields", () => {
  expect(fadeSettleMsFromZones([{ level: 0 }])).toBe(DEFAULT_FADE_SETTLE_MS);
  expect(fadeSettleMsFromZones([])).toBe(DEFAULT_FADE_SETTLE_MS);
  expect(fadeSettleMsFromZones(null)).toBe(DEFAULT_FADE_SETTLE_MS);
});

test("uses max fade+delay across zones", () => {
  expect(
    fadeSettleMsFromZones([
      { fade_time: "01", delay_time: "00" },
      { fadeTime: "03", delayTime: "01" },
    ])
  ).toBe(4000);
});

test("caps at 5s", () => {
  expect(
    fadeSettleMsFromZones([{ fade_time: "10", delay_time: "10" }])
  ).toBe(MAX_FADE_SETTLE_MS);
});

test("no 300ms floor — sub-second fades are honored", () => {
  expect(fadeSettleMsFromZones([{ fade_time: "0.5", delay_time: "0" }])).toBe(
    500
  );
});

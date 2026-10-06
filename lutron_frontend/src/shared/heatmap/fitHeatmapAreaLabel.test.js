/**
 * @jest-environment node
 */

import {
  createHeatmapAreaLabelLines,
  fitHeatmapAreaLabel,
} from "./fitHeatmapAreaLabel";

test("splits meeting room style names into two lines", () => {
  const lines = createHeatmapAreaLabelLines("MEETING ROOM (OS-3)");
  expect(lines[0]).toContain("MEETING");
  expect(lines.length).toBeGreaterThanOrEqual(1);
});

test("puts ladies / gents washroom on two full words", () => {
  expect(createHeatmapAreaLabelLines("Ladies Washroom")).toEqual([
    "LADIES",
    "WASHROOM",
  ]);
  expect(createHeatmapAreaLabelLines("Gents Washroom")).toEqual([
    "GENTS",
    "WASHROOM",
  ]);
  expect(createHeatmapAreaLabelLines("Central Passage")).toEqual([
    "CENTRAL",
    "PASSAGE",
  ]);
});

test("keeps full HANDWASH (no mid-word clip via ellipsis)", () => {
  const fit = fitHeatmapAreaLabel({
    name: "HANDWASH",
    bboxWidth: 55,
    bboxHeight: 40,
    baseFont: 8,
  });
  expect(fit.shouldShowText).toBe(true);
  expect(fit.lines.join("")).toBe("HANDWASH");
  expect(fit.lines.some((l) => l.includes("…"))).toBe(false);
});

test("fits ladies washroom without dropping WASHROOM", () => {
  const fit = fitHeatmapAreaLabel({
    name: "LADIES WASHROOM",
    bboxWidth: 70,
    bboxHeight: 55,
    baseFont: 8,
  });
  expect(fit.shouldShowText).toBe(true);
  const text = fit.lines.join(" ");
  expect(text).toContain("LADIES");
  expect(text).toContain("WASHROOM");
});

test("fits central passage without truncating to CENT", () => {
  const fit = fitHeatmapAreaLabel({
    name: "CENTRAL PASSAGE",
    bboxWidth: 45,
    bboxHeight: 80,
    baseFont: 8,
  });
  expect(fit.shouldShowText).toBe(true);
  const text = fit.lines.join(" ");
  expect(text).toContain("CENTRAL");
  expect(text).toContain("PASSAGE");
  expect(text).not.toMatch(/\bCENT\b/);
});

test("grows font for short names in large areas", () => {
  const fit = fitHeatmapAreaLabel({
    name: "WS_2",
    bboxWidth: 200,
    bboxHeight: 160,
    baseFont: 8,
  });
  expect(fit.shouldShowText).toBe(true);
  expect(fit.fontSize).toBeGreaterThan(12);
  expect(fit.lines[0]).toContain("WS");
});

test("shrinks font for long names in tight areas", () => {
  const fit = fitHeatmapAreaLabel({
    name: "MIDDLE TABLE LINEAR",
    bboxWidth: 70,
    bboxHeight: 40,
    baseFont: 8,
  });
  expect(fit.shouldShowText).toBe(true);
  expect(fit.fontSize).toBeLessThanOrEqual(14);
});

test("hides text only for tiny polygons", () => {
  const fit = fitHeatmapAreaLabel({
    name: "WS_2",
    bboxWidth: 5,
    bboxHeight: 5,
    baseFont: 8,
  });
  expect(fit.shouldShowText).toBe(false);
});

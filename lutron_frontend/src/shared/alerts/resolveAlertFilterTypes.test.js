/**
 * @jest-environment node
 */

import {
  CANONICAL_ALERT_FILTER_ORDER,
  resolveAlertFilterTypes,
} from "./resolveAlertFilterTypes";

test("empty alerts → empty dropdown even when Settings has types", () => {
  expect(
    resolveAlertFilterTypes({
      apiTypes: ["Ballast Failure", "Device Not Responding"],
      alerts: [],
    })
  ).toEqual([]);
});

test("intersects active alerts with Settings-ON types", () => {
  expect(
    resolveAlertFilterTypes({
      apiTypes: [
        "Processor Not Responding",
        "Device Not Responding",
        "Ballast Failure",
        "Lamp Failure",
        "Other Warnings",
      ],
      alerts: [
        { alert_type: "Device Not Responding" },
        { alert_type: "Ballast Failure" },
        { alert_type: "Lamp Failure" },
      ],
    })
  ).toEqual(["Device Not Responding", "Ballast Failure", "Lamp Failure"]);
});

test("Settings-OFF types never appear even if present on alerts", () => {
  expect(
    resolveAlertFilterTypes({
      apiTypes: ["Device Not Responding"],
      alerts: [
        { alert_type: "Device Not Responding" },
        { alert_type: "Ballast Failure" },
      ],
    })
  ).toEqual(["Device Not Responding"]);
});

test("case-insensitive match; keeps canonical order", () => {
  const types = resolveAlertFilterTypes({
    apiTypes: ["Other Warnings", "Processor Not Responding", "Ballast Failure"],
    alerts: [
      { alert_type: "ballast failure" },
      { alert_type: "processor not responding" },
    ],
  });
  expect(types).toEqual(["Processor Not Responding", "Ballast Failure"]);
  expect(CANONICAL_ALERT_FILTER_ORDER).toContain("Lamp Failure");
});

test("empty Settings types → empty dropdown", () => {
  expect(
    resolveAlertFilterTypes({
      apiTypes: [],
      alerts: [{ alert_type: "Ballast Failure" }],
    })
  ).toEqual([]);
});

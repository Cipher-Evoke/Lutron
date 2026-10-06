/**
 * @jest-environment node
 */

import { formatFofpMarkerTooltip } from "./fofpZoneInteraction";

describe("formatFofpMarkerTooltip", () => {
  it("shows ballast failure for driver alerts", () => {
    expect(
      formatFofpMarkerTooltip("Lobby", null, {
        driverAlert: true,
        driverAlertType: "Ballast Failure",
      })
    ).toBe("Lobby — Ballast Failure");
  });

  it("shows lamp failure for driver alerts", () => {
    expect(
      formatFofpMarkerTooltip("Desk", null, {
        driverAlert: true,
        driverAlertType: "Lamp Failure",
      })
    ).toBe("Desk — Lamp Failure");
  });

  it("falls back to driver fault when alert flag set without type", () => {
    expect(formatFofpMarkerTooltip("Zone 1", null, { driverAlert: true })).toBe(
      "Zone 1 — Driver fault"
    );
  });

  it("shows light level when no alert", () => {
    expect(formatFofpMarkerTooltip("Office", 42)).toBe("Office — 42%");
  });
});

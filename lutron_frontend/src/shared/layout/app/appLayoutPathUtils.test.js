import {
  normalizeLayoutPathname,
  isDashboardRoute,
  isSettingsMainLayoutRoute,
  getSettingsPathForRole,
} from "./appLayoutPathUtils";

describe("appLayoutPathUtils", () => {
  it("normalizes layout paths", () => {
    expect(normalizeLayoutPathname("/users/")).toBe("/users");
  });

  it("detects dashboard routes", () => {
    expect(isDashboardRoute("/dashboard/energy")).toBe(true);
    expect(isDashboardRoute("/users")).toBe(false);
  });

  it("detects settings layout routes via manifest", () => {
    expect(isSettingsMainLayoutRoute("/users", "basic")).toBe(true);
    expect(isSettingsMainLayoutRoute("/widgets/", "customized")).toBe(true);
  });

  it("returns canonical settings path", () => {
    expect(getSettingsPathForRole("Admin")).toBe("/main");
  });
});

import {
  normalizeSettingsPath,
  isPathActive,
  getActiveSettingsRouteItem,
} from "./settingsPathUtils";

describe("settingsPathUtils", () => {
  it("normalizes trailing slashes", () => {
    expect(normalizeSettingsPath("/users/")).toBe("/users");
    expect(normalizeSettingsPath("/")).toBe("/");
  });

  it("matches active settings nav paths", () => {
    const items = [
      { label: "Users", path: "/users" },
      { label: "Schedule", path: "/schedule" },
    ];
    expect(isPathActive("/users", "/users")).toBe(true);
    expect(isPathActive("/schedule/details/1", "/schedule")).toBe(true);
    expect(getActiveSettingsRouteItem("/users", items)).toEqual(items[0]);
  });
});

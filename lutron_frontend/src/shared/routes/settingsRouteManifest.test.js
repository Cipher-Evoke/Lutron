import {
  SETTINGS_ROUTE_IDS,
  getSettingsPathForVariant,
  getSettingsNavItemsForVariant,
  isSettingsRoutePath,
  canAccessSettingsRoute,
  getActiveSettingsRouteId,
} from "./settingsRouteManifest";

describe("settingsRouteManifest", () => {
  it("preserves canonical settings paths per variant", () => {
    expect(getSettingsPathForVariant(SETTINGS_ROUTE_IDS.USERS, "basic")).toBe("/setting/users");
    expect(getSettingsPathForVariant(SETTINGS_ROUTE_IDS.SCHEDULE, "advanced")).toBe("/schedule");
    expect(getSettingsPathForVariant(SETTINGS_ROUTE_IDS.WIDGETS, "customized")).toBe("/widgets/");
    expect(getSettingsPathForVariant(SETTINGS_ROUTE_IDS.WIDGETS, "basic")).toBe("/setting/rename-widget/");
  });

  it("builds sidebar nav items with RBAC metadata", () => {
    const items = getSettingsNavItemsForVariant("basic");
    const users = items.find((i) => i.id === SETTINGS_ROUTE_IDS.USERS);
    expect(users).toMatchObject({ path: "/setting/users", roles: expect.arrayContaining(["Operator"]) });
  });

  it("detects active settings routes including related paths", () => {
    expect(isSettingsRoutePath("/setting/users", "basic")).toBe(true);
    expect(isSettingsRoutePath("/schedule/details/42", "basic")).toBe(true);
    expect(getActiveSettingsRouteId("/schedule/add-event", "customized")).toBe(
      SETTINGS_ROUTE_IDS.SCHEDULE
    );
  });

  it("enforces RBAC rules unchanged from manifest", () => {
    expect(canAccessSettingsRoute(SETTINGS_ROUTE_IDS.THEME, "Admin")).toBe(true);
    expect(canAccessSettingsRoute(SETTINGS_ROUTE_IDS.THEME, "Operator")).toBe(false);
    expect(canAccessSettingsRoute(SETTINGS_ROUTE_IDS.USERS, "Operator")).toBe(true);
    expect(canAccessSettingsRoute(SETTINGS_ROUTE_IDS.SENSORS, "Admin")).toBe(false);
  });
});

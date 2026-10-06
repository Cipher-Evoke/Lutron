/**
 * Whether a main top-navbar item matches the current route (shared by desktop + drawer).
 */
export function isTopbarNavItemActive(item, pathname, settingsPath) {
  if (pathname === item.path) return true;

  if (
    (item.path === "/dashboard/overview" ||
      item.path === "/dashboard" ||
      item.label === "Home" ||
      item.label === "Dashboard") &&
    pathname.startsWith("/dashboard")
  ) {
    return true;
  }

  if (
    item.path === "/heatmap" &&
    (pathname === "/create-area-model" ||
      pathname.startsWith("/create-area-model/") ||
      pathname === "/user-area-groups" ||
      pathname.startsWith("/user-area-groups/") ||
      pathname === "/create-area-group" ||
      pathname.startsWith("/create-area-group/") ||
      pathname === "/create-area-groups" ||
      pathname.startsWith("/create-area-groups/") ||
      pathname.startsWith("/update-area-groups/") ||
      pathname.startsWith("/update-area-group/"))
  ) {
    return true;
  }

  if (
    item.path === "/schedule" &&
    (pathname === "/schedule/add-event" ||
      pathname.startsWith("/schedule/add-event/") ||
      pathname === "/schedule/details" ||
      pathname.startsWith("/schedule/details/") ||
      pathname === "/schedule/update-preconfigured-event" ||
      pathname.startsWith("/schedule/update-preconfigured-event/"))
  ) {
    return true;
  }

  if (
    item.path === "/quickcontrols" &&
    (pathname === "/quickcontrols/create" ||
      pathname.startsWith("/quickcontrols/create/") ||
      pathname === "/quickcontrols/details" ||
      pathname.startsWith("/quickcontrols/details/") ||
      (pathname.startsWith("/quickcontrols/") && pathname !== "/quickcontrols"))
  ) {
    return true;
  }

  if (
    item.path === settingsPath &&
    settingsPath.startsWith("/setting") &&
    (pathname === "/setting" ||
      pathname.startsWith("/setting/") ||
      pathname === "/createusers" ||
      pathname.startsWith("/createusers/") ||
      pathname === "/createfloor" ||
      pathname.startsWith("/createfloor/") ||
      pathname.startsWith("/editfloor/") ||
      pathname.startsWith("/correct-coordinate/") ||
      pathname.startsWith("/area-calculation/") ||
      pathname === "/get-help" ||
      pathname.startsWith("/get-help/"))
  ) {
    return true;
  }

  if (
    item.path === settingsPath &&
    (pathname === "/main" ||
      pathname === "/theme-change" ||
      pathname === "/rename-widget/" ||
      pathname.startsWith("/rename-widget/") ||
      pathname === "/widgets/" ||
      pathname.startsWith("/widgets/") ||
      pathname === "/manage-area-groups" ||
      pathname.startsWith("/manage-area-groups/") ||
      pathname === "/area-size-load" ||
      pathname.startsWith("/area-size-load/") ||
      pathname === "/email-server/" ||
      pathname.startsWith("/email-server/") ||
      pathname === "/users" ||
      pathname.startsWith("/users/") ||
      pathname === "/floor" ||
      pathname.startsWith("/floor/") ||
      pathname === "/create-help/" ||
      pathname.startsWith("/create-help/") ||
      pathname === "/manage-sensors" ||
      pathname.startsWith("/manage-sensors/") ||
      pathname === "/manage-modules" ||
      pathname.startsWith("/manage-modules/") ||
      pathname === "/processors" ||
      pathname.startsWith("/processors/") ||
      pathname === "/maintenance" ||
      pathname.startsWith("/maintenance/") ||
      pathname === "/alerts" ||
      pathname.startsWith("/alerts/") ||
      pathname === "/fofp" ||
      pathname.startsWith("/fofp/"))
  ) {
    return true;
  }

  return false;
}

/** True when pathname is any Settings section route (matches topbar Settings active state). */
export function isSettingsAppRoute(pathname, settingsPath = "/main") {
  return isTopbarNavItemActive({ path: settingsPath }, pathname, settingsPath);
}

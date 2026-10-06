/**
 * Whether a main top-navbar item matches the current route (shared by desktop + drawer).
 */
import { isAdvancedSettingsAppRoute } from "./advancedSettingsPaths";

export function isTopbarNavItemActive(item, pathname, settingsPath) {
  if (pathname === item.path) return true;

  if (item.path === "/dashboard/overview" && pathname.startsWith("/dashboard")) {
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

  if (item.path === settingsPath && isAdvancedSettingsAppRoute(pathname, settingsPath)) {
    return true;
  }

  return false;
}

/** True when pathname is any Settings section route (matches topbar Settings active state). */
export function isSettingsAppRoute(pathname, settingsPath = "/setting/main") {
  return isTopbarNavItemActive({ path: settingsPath }, pathname, settingsPath);
}

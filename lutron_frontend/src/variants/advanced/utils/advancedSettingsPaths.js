/**
 * Advanced variant settings URL prefix — `/setting/...`
 */

export const ADVANCED_SETTINGS_PREFIX = "/setting";

export const ADVANCED_SETTINGS_HOME_PATH = `${ADVANCED_SETTINGS_PREFIX}/main`;

export const ADVANCED_SETTINGS_SIDEBAR_PATHS = {
  Home: ADVANCED_SETTINGS_HOME_PATH,
  Theme: `${ADVANCED_SETTINGS_PREFIX}/theme-change`,
  Widgets: `${ADVANCED_SETTINGS_PREFIX}/rename-widget/`,
  "Manage Area Groups": `${ADVANCED_SETTINGS_PREFIX}/manage-area-groups`,
  "Area Size & Load": `${ADVANCED_SETTINGS_PREFIX}/area-size-load`,
  "Email Server": `${ADVANCED_SETTINGS_PREFIX}/email-server/`,
  Users: `${ADVANCED_SETTINGS_PREFIX}/users`,
  Floor: `${ADVANCED_SETTINGS_PREFIX}/floor`,
  "Manage Sensors": `${ADVANCED_SETTINGS_PREFIX}/manage-sensors`,
  "Manage Modules": `${ADVANCED_SETTINGS_PREFIX}/manage-modules`,
  Alerts: `${ADVANCED_SETTINGS_PREFIX}/alerts`,
  Processors: `${ADVANCED_SETTINGS_PREFIX}/processors`,
  Maintenance: `${ADVANCED_SETTINGS_PREFIX}/maintenance`,
  "Application Monitoring": `${ADVANCED_SETTINGS_PREFIX}/application-monitoring`,
  FOFP: `${ADVANCED_SETTINGS_PREFIX}/fofp`,
  Help: `${ADVANCED_SETTINGS_PREFIX}/create-help/`,
};

export const ADVANCED_MANAGE_AREA_GROUPS_PATH =
  ADVANCED_SETTINGS_SIDEBAR_PATHS["Manage Area Groups"];
export const ADVANCED_FLOOR_PATH = ADVANCED_SETTINGS_SIDEBAR_PATHS.Floor;

function normalizePathname(pathname) {
  if (!pathname || typeof pathname !== "string") return "/";
  let p = pathname;
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p || "/";
}

function isAdvancedSettingsRelatedRoute(pathname) {
  const p = normalizePathname(pathname);
  return (
    p === "/createusers" ||
    p.startsWith("/createusers/") ||
    p === "/createfloor" ||
    p.startsWith("/createfloor/") ||
    p.startsWith("/editfloor/") ||
    p.startsWith("/correct-coordinate/") ||
    p.startsWith("/area-calculation/") ||
    p === "/get-help" ||
    p.startsWith("/get-help/")
  );
}

export function isAdvancedSettingsAppRoute(
  pathname,
  settingsPath = ADVANCED_SETTINGS_HOME_PATH
) {
  if (settingsPath !== ADVANCED_SETTINGS_HOME_PATH) return false;
  const p = normalizePathname(pathname);
  if (p === ADVANCED_SETTINGS_PREFIX || p.startsWith(`${ADVANCED_SETTINGS_PREFIX}/`)) {
    return true;
  }
  return isAdvancedSettingsRelatedRoute(pathname);
}

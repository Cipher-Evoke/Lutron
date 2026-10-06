/**
 * Customized variant settings URL prefix — `/setting/...`
 */

export const CUSTOMIZED_SETTINGS_PREFIX = "/setting";

export const CUSTOMIZED_SETTINGS_HOME_PATH = `${CUSTOMIZED_SETTINGS_PREFIX}/main`;

export const CUSTOMIZED_SETTINGS_SIDEBAR_PATHS = {
  Home: CUSTOMIZED_SETTINGS_HOME_PATH,
  Theme: `${CUSTOMIZED_SETTINGS_PREFIX}/theme-change`,
  Widgets: `${CUSTOMIZED_SETTINGS_PREFIX}/widgets/`,
  "Manage Area Groups": `${CUSTOMIZED_SETTINGS_PREFIX}/manage-area-groups`,
  "Area Size & Load": `${CUSTOMIZED_SETTINGS_PREFIX}/area-size-load`,
  "Email Server": `${CUSTOMIZED_SETTINGS_PREFIX}/email-server/`,
  Users: `${CUSTOMIZED_SETTINGS_PREFIX}/users`,
  Floor: `${CUSTOMIZED_SETTINGS_PREFIX}/floor`,
  "Manage Sensors": `${CUSTOMIZED_SETTINGS_PREFIX}/manage-sensors`,
  "Manage Modules": `${CUSTOMIZED_SETTINGS_PREFIX}/manage-modules`,
  Alerts: `${CUSTOMIZED_SETTINGS_PREFIX}/alerts`,
  Processors: `${CUSTOMIZED_SETTINGS_PREFIX}/processors`,
  Maintenance: `${CUSTOMIZED_SETTINGS_PREFIX}/maintenance`,
  "Application Monitoring": `${CUSTOMIZED_SETTINGS_PREFIX}/application-monitoring`,
  FOFP: `${CUSTOMIZED_SETTINGS_PREFIX}/fofp`,
  Help: `${CUSTOMIZED_SETTINGS_PREFIX}/create-help/`,
};

export function isCustomizedSettingsAppRoute(
  pathname,
  settingsPath = CUSTOMIZED_SETTINGS_HOME_PATH
) {
  if (settingsPath !== CUSTOMIZED_SETTINGS_HOME_PATH) return false;
  const p = (pathname || "").replace(/\/$/, "") || "/";
  if (p === CUSTOMIZED_SETTINGS_PREFIX || p.startsWith(`${CUSTOMIZED_SETTINGS_PREFIX}/`)) {
    return true;
  }
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

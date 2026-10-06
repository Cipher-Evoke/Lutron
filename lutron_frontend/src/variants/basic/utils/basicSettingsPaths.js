/**
 * Basic variant settings URL prefix — `/setting/...`
 * Other variants keep root-level settings paths.
 */

export const BASIC_SETTINGS_PREFIX = "/setting";

export const BASIC_SETTINGS_HOME_PATH = `${BASIC_SETTINGS_PREFIX}/main`;

export const BASIC_SETTINGS_SIDEBAR_PATHS = {
  Home: BASIC_SETTINGS_HOME_PATH,
  Theme: `${BASIC_SETTINGS_PREFIX}/theme-change`,
  "Rename Widget": `${BASIC_SETTINGS_PREFIX}/rename-widget/`,
  "Manage Area Groups": `${BASIC_SETTINGS_PREFIX}/manage-area-groups`,
  "Area Size & Load": `${BASIC_SETTINGS_PREFIX}/area-size-load`,
  "Email Server": `${BASIC_SETTINGS_PREFIX}/email-server/`,
  Users: `${BASIC_SETTINGS_PREFIX}/users`,
  Floor: `${BASIC_SETTINGS_PREFIX}/floor`,
  "Manage Sensors": `${BASIC_SETTINGS_PREFIX}/manage-sensors`,
  "Manage Modules": `${BASIC_SETTINGS_PREFIX}/manage-modules`,
  Alerts: `${BASIC_SETTINGS_PREFIX}/alerts`,
  Processors: `${BASIC_SETTINGS_PREFIX}/processors`,
  Maintenance: `${BASIC_SETTINGS_PREFIX}/maintenance`,
  "Application Monitoring": `${BASIC_SETTINGS_PREFIX}/application-monitoring`,
  FOFP: `${BASIC_SETTINGS_PREFIX}/fofp`,
  Help: `${BASIC_SETTINGS_PREFIX}/create-help/`,
};

export const BASIC_MANAGE_AREA_GROUPS_PATH =
  BASIC_SETTINGS_SIDEBAR_PATHS["Manage Area Groups"];
export const BASIC_FLOOR_PATH = BASIC_SETTINGS_SIDEBAR_PATHS.Floor;

function normalizePathname(pathname) {
  if (!pathname || typeof pathname !== "string") return "/";
  let p = pathname;
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p || "/";
}

/** Root-level Area Groups create/edit flows owned by Settings (not Floor/Heatmap). */
export function isBasicAreaGroupSettingsChildRoute(pathname) {
  const p = normalizePathname(pathname);
  return (
    p === "/create-area-groups" ||
    p.startsWith("/create-area-groups/") ||
    p === "/create-area-group" ||
    p.startsWith("/create-area-group/") ||
    p.startsWith("/update-area-groups/") ||
    p.startsWith("/update-area-group/")
  );
}

/** Public Help page (`/get-help`) — scrollable content, not the fixed settings panel shell. */
export function isBasicGetHelpRoute(pathname) {
  const p = normalizePathname(pathname);
  return p === "/get-help" || p.startsWith("/get-help/");
}

/** Child routes that stay at root but belong to settings (floor/users/area-group flows). */
function isBasicSettingsRelatedRoute(pathname) {
  const p = normalizePathname(pathname);
  return (
    p === "/createusers" ||
    p.startsWith("/createusers/") ||
    p === "/createfloor" ||
    p.startsWith("/createfloor/") ||
    p.startsWith("/editfloor/") ||
    p.startsWith("/correct-coordinate/") ||
    p.startsWith("/area-calculation/") ||
    isBasicAreaGroupSettingsChildRoute(p)
  );
}

export function isBasicSettingsAppRoute(pathname, settingsPath = BASIC_SETTINGS_HOME_PATH) {
  if (settingsPath !== BASIC_SETTINGS_HOME_PATH) return false;
  const p = normalizePathname(pathname);
  if (p === BASIC_SETTINGS_PREFIX || p.startsWith(`${BASIC_SETTINGS_PREFIX}/`)) {
    return true;
  }
  return isBasicSettingsRelatedRoute(pathname);
}

export function getBasicSettingsSectionLabel(pathname) {
  if (!pathname || typeof pathname !== "string") return "";
  const p = normalizePathname(pathname);

  if (p === normalizePathname(BASIC_SETTINGS_HOME_PATH)) return "Home";
  if (p === `${BASIC_SETTINGS_PREFIX}/alerts` || p.startsWith(`${BASIC_SETTINGS_PREFIX}/alerts/`)) {
    return "Alerts";
  }
  if (
    p === `${BASIC_SETTINGS_PREFIX}/email-server` ||
    p.startsWith(`${BASIC_SETTINGS_PREFIX}/email-server/`)
  ) {
    return "Email Server";
  }
  if (
    p === `${BASIC_SETTINGS_PREFIX}/theme-change` ||
    p.startsWith(`${BASIC_SETTINGS_PREFIX}/theme-change/`)
  ) {
    return "Theme";
  }
  if (p === `${BASIC_SETTINGS_PREFIX}/users` || p.startsWith(`${BASIC_SETTINGS_PREFIX}/users/`)) {
    return "User Management";
  }
  if (
    p === `${BASIC_SETTINGS_PREFIX}/area-size-load` ||
    p.startsWith(`${BASIC_SETTINGS_PREFIX}/area-size-load/`)
  ) {
    return "Area Size for Energy";
  }
  if (
    p === BASIC_MANAGE_AREA_GROUPS_PATH ||
    p.startsWith(`${BASIC_MANAGE_AREA_GROUPS_PATH}/`) ||
    isBasicAreaGroupSettingsChildRoute(p)
  ) {
    return "Area Groups";
  }
  if (
    p === `${BASIC_SETTINGS_PREFIX}/rename-widget` ||
    p.startsWith(`${BASIC_SETTINGS_PREFIX}/rename-widget/`)
  ) {
    return "Widgets";
  }
  if (p === BASIC_FLOOR_PATH || p.startsWith(`${BASIC_FLOOR_PATH}/`)) {
    return "Floors";
  }
  if (
    p.startsWith("/createfloor") ||
    p.startsWith("/editfloor/") ||
    p.startsWith("/correct-coordinate/") ||
    p.startsWith("/area-calculation/")
  ) {
    return "Floors";
  }
  if (
    p === `${BASIC_SETTINGS_PREFIX}/processors` ||
    p.startsWith(`${BASIC_SETTINGS_PREFIX}/processors/`)
  ) {
    return "Processors";
  }
  if (
    p === `${BASIC_SETTINGS_PREFIX}/maintenance` ||
    p.startsWith(`${BASIC_SETTINGS_PREFIX}/maintenance/`)
  ) {
    return "Maintenance";
  }
  if (
    p === `${BASIC_SETTINGS_PREFIX}/application-monitoring` ||
    p.startsWith(`${BASIC_SETTINGS_PREFIX}/application-monitoring/`)
  ) {
    return "Application Monitoring";
  }
  if (
    p === `${BASIC_SETTINGS_PREFIX}/fofp` ||
    p.startsWith(`${BASIC_SETTINGS_PREFIX}/fofp/`)
  ) {
    return "FOFP";
  }
  if (
    p === `${BASIC_SETTINGS_PREFIX}/create-help` ||
    p.startsWith(`${BASIC_SETTINGS_PREFIX}/create-help/`) ||
    p === "/get-help" ||
    p.startsWith("/get-help/")
  ) {
    return "Help";
  }
  if (
    p === `${BASIC_SETTINGS_PREFIX}/manage-sensors` ||
    p.startsWith(`${BASIC_SETTINGS_PREFIX}/manage-sensors/`)
  ) {
    return "Manage Sensors";
  }
  if (
    p === `${BASIC_SETTINGS_PREFIX}/manage-modules` ||
    p.startsWith(`${BASIC_SETTINGS_PREFIX}/manage-modules/`)
  ) {
    return "Manage Modules";
  }
  return "";
}

export function isBasicMaintenanceRoute(pathname) {
  return normalizePathname(pathname) === BASIC_SETTINGS_SIDEBAR_PATHS.Maintenance;
}

/** Application Monitoring — tall content; use scrollable shell so Resource Usage isn't clipped. */
export function isBasicApplicationMonitoringRoute(pathname) {
  const p = normalizePathname(pathname);
  const base = BASIC_SETTINGS_SIDEBAR_PATHS["Application Monitoring"];
  return p === base || p.startsWith(`${base}/`);
}

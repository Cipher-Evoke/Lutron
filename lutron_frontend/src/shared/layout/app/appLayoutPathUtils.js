/**
 * Shared app layout path helpers — Phase 5.3
 */

import { isSettingsRoutePath } from "../../routes/settingsRouteManifest";

export function normalizeLayoutPathname(pathname) {
  if (!pathname) return "";
  let p = pathname;
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p;
}

export function isDashboardRoute(pathname) {
  return pathname === "/dashboard" || pathname?.startsWith("/dashboard/");
}

export function isHeatmapRoute(pathname) {
  return pathname === "/heatmap";
}

export function isLutronWebsiteRoute(pathname) {
  return pathname === "/lutronwebsite-page" || pathname === "/lutron";
}

export function isActivityReportRoute(pathname) {
  return pathname === "/activity-report";
}

export function isScheduleRoute(pathname) {
  return pathname === "/schedule" || pathname?.startsWith("/schedule/");
}

export function isQuickControlsRoute(pathname) {
  return pathname === "/quickcontrols" || pathname?.startsWith("/quickcontrols/");
}

/** Settings routes that use the white content shell (basic variant). */
export function isSettingsMainLayoutRoute(pathname, variant = "basic") {
  return isSettingsRoutePath(pathname, variant);
}

export function getSettingsPathForRole(role) {
  return "/main";
}

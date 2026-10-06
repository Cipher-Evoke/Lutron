/**
 * Settings route path helpers — Phase 5.2
 */

export function normalizeSettingsPath(pathname) {
  if (!pathname || typeof pathname !== "string") return "/";
  let p = pathname;
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p || "/";
}

export function isPathActive(pathname, itemPath) {
  if (!itemPath) return false;
  const current = normalizeSettingsPath(pathname);
  const target = normalizeSettingsPath(String(itemPath));
  if (current === target) return true;
  if (target !== "/" && current.startsWith(`${target}/`)) return true;
  return false;
}

export function getActiveSettingsRouteItem(pathname, items = []) {
  const list = Array.isArray(items) ? items : [];
  const match = list.find((item) => item?.path && isPathActive(pathname, item.path));
  return match || null;
}

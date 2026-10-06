/** Normalize settings route paths for comparison. */
export function normalizeSettingsPath(path) {
  const s = String(path ?? '').replace(/\/+$/, '');
  return s === '' ? '/' : s;
}

/** Compare route to sidebar `item.path` (exact or nested segment match). */
export function isSettingsSidebarNavActive(pathname, itemPath) {
  if (!itemPath || typeof pathname !== 'string') return false;
  const current = normalizeSettingsPath(pathname);
  const target = normalizeSettingsPath(itemPath);
  if (current === target) return true;
  if (target === '/') return false;
  return current.startsWith(`${target}/`);
}

/**
 * Resolve the active Settings sidebar label for the current pathname.
 * Uses longest matching path prefix when nested routes are open.
 */
export function getSettingsSidebarActiveLabel(pathname, visibleSidebarItemsWithPaths) {
  if (!Array.isArray(visibleSidebarItemsWithPaths)) return '';
  const current = normalizeSettingsPath(pathname);

  let bestMatch = null;
  let bestLen = -1;

  for (const item of visibleSidebarItemsWithPaths) {
    const itemPath = normalizeSettingsPath(item?.path);
    if (!itemPath || !item?.label) continue;
    const isMatch =
      current === itemPath ||
      (itemPath !== '/' && current.startsWith(`${itemPath}/`));
    if (isMatch && itemPath.length > bestLen) {
      bestLen = itemPath.length;
      bestMatch = item;
    }
  }

  return bestMatch?.label ? String(bestMatch.label) : '';
}

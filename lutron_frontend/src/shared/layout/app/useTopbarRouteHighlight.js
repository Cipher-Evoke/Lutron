/**
 * Topbar / drawer route highlighting — Phase 5.3
 */
import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { getSettingsPathForRole } from "./appLayoutPathUtils";

/**
 * @param {object} params
 * @param {Array<{label:string,path:string}>} params.navItems
 * @param {string} [params.settingsPath]
 * @param {(item:object, pathname:string, settingsPath:string)=>boolean} params.isNavItemActive
 */
export function useTopbarRouteHighlight({
  navItems = [],
  settingsPath,
  isNavItemActive,
}) {
  const location = useLocation();
  const resolvedSettingsPath = settingsPath ?? getSettingsPathForRole();

  const activeItem = useMemo(() => {
    for (const item of navItems) {
      if (isNavItemActive(item, location.pathname, resolvedSettingsPath)) {
        return item;
      }
    }
    return null;
  }, [navItems, location.pathname, resolvedSettingsPath, isNavItemActive]);

  const isItemActive = (item) =>
    isNavItemActive(item, location.pathname, resolvedSettingsPath);

  return {
    activeItem,
    activeLabel: activeItem?.label ?? null,
    isItemActive,
    pathname: location.pathname,
    settingsPath: resolvedSettingsPath,
  };
}

export default useTopbarRouteHighlight;

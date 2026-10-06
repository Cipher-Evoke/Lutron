/**
 * Shared settings navigation contract — Phase 5.2
 *
 * Renders sidebar items via injected NavigationComponent (variant nav UI).
 * Supplies filtered items from RBAC and active-route detection.
 */

import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { getActiveSettingsRouteItem } from "./settingsPathUtils";

/**
 * @param {object} props
 * @param {Array<{label:string,path:string}>} props.items
 * @param {React.ComponentType<{items:Array}>} props.NavigationComponent
 * @param {(items:Array)=>Array} [props.filterItems]
 */
export function SharedSettingsNavigation({
  items = [],
  NavigationComponent,
  filterItems,
}) {
  const location = useLocation();

  const navItems = useMemo(() => {
    const base = (items || []).filter((item) => item?.label && item?.path);
    return typeof filterItems === "function" ? filterItems(base) : base;
  }, [items, filterItems]);

  const activeItem = useMemo(
    () => getActiveSettingsRouteItem(location.pathname, navItems),
    [location.pathname, navItems]
  );

  if (!NavigationComponent) return null;

  return (
    <NavigationComponent
      items={navItems}
      activeLabel={activeItem?.label ?? null}
      pathname={location.pathname}
    />
  );
}

export default SharedSettingsNavigation;

/**
 * Mobile sidebar drawer state — Phase 5.3
 */
import { useCallback, useState } from "react";

export function useSidebarDrawer(initialOpen = false) {
  const [drawerOpen, setDrawerOpen] = useState(initialOpen);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setDrawerOpen((v) => !v), []);

  return {
    drawerOpen,
    setDrawerOpen,
    openDrawer,
    closeDrawer,
    toggleDrawer,
  };
}

export default useSidebarDrawer;

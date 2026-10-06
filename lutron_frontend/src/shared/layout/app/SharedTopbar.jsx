import React from "react";

/**
 * Shared topbar utilities shell — Phase 5.3
 *
 * Variant TopbarComponent files remain the branding/theme owners.
 * This module exports shared drawer + highlight hooks used by all variants.
 */

export { default as SharedSidebar } from "./SharedSidebar";
export { useSidebarDrawer } from "./useSidebarDrawer";
export { useTopbarRouteHighlight } from "./useTopbarRouteHighlight";
export { getSettingsPathForRole, normalizeLayoutPathname } from "./appLayoutPathUtils";

/**
 * Frame wrapper for variant topbars that opt into shared test id.
 */
export function SharedTopbarFrame({ children, className }) {
  return (
    <div
      className={className ?? "shared-topbar-frame"}
      data-testid="shared-topbar-frame"
    >
      {children}
    </div>
  );
}

export default SharedTopbarFrame;

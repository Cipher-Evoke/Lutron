/**
 * Shared application shell — Phase 5.2 infrastructure
 *
 * Does not replace MainLayout. Provides composable frame for future consolidation:
 * - layout frame (page background slot)
 * - settings frame (optional SharedSettingsShell)
 * - route outlet
 */

import React from "react";
import { Outlet } from "react-router-dom";

/**
 * @param {object} props
 * @param {React.ReactNode} [props.topbar] — e.g. TopbarComponent (variant-owned)
 * @param {React.ReactNode} [props.footer]
 * @param {React.ReactNode} [props.settingsShell] — wraps outlet when inside settings routes
 * @param {boolean} [props.useSettingsShell]
 * @param {object} [props.frameSx] — outer page frame sx
 * @param {object} [props.contentSx] — inner content area sx
 */
export function SharedAppShell({
  topbar = null,
  footer = null,
  settingsShell = null,
  useSettingsShell = false,
  useOutlet = true,
  children = null,
  frameSx = {},
  contentSx = {},
}) {
  const outlet = useOutlet ? <Outlet /> : null;
  const content =
    children ??
    (useSettingsShell && settingsShell
      ? React.cloneElement(settingsShell, {}, outlet)
      : outlet);

  return (
    <div className="shared-app-shell" data-testid="shared-app-shell">
      {topbar}
      <div className="shared-app-shell-frame" style={{ width: "100%", ...frameSx }}>
        <div className="shared-app-shell-content" style={{ width: "100%", ...contentSx }}>
          {content}
        </div>
      </div>
      {footer}
    </div>
  );
}

export default SharedAppShell;

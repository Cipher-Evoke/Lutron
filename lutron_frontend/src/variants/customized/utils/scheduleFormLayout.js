/** MainLayout olive panel — width synced to navbar via useSyncPanelToTopbar (customized). */
export const TOPBAR_ALIGNED_CONTENT_PANEL_CLASS = 'topbar-aligned-content-panel';

/** Dashboard Alerts tab — filter bar + System Alerts card (customized only). */
export const DASHBOARD_ALERTS_SHELL_CLASS = 'dashboard-alerts-shell';

/**
 * Floating navbar card (customized): top margin so the full rounded box is visible,
 * not clipped flush to the viewport edge.
 */
export const CUSTOMIZED_TOPBAR_MARGIN_TOP_PX = 15;
/** AppBar height at the xs breakpoint — matches TopbarComponent. */
export const CUSTOMIZED_TOPBAR_BAR_HEIGHT_PX = 60;
/** Fixed chrome under the topbar (filters, etc.) — margin + bar height. */
export const CUSTOMIZED_TOPBAR_STACK_OFFSET_PX =
  CUSTOMIZED_TOPBAR_MARGIN_TOP_PX + CUSTOMIZED_TOPBAR_BAR_HEIGHT_PX;

/** Match TopbarComponent inner `px` — used by MainLayout only (customized). */
export const layoutHorizontalPx = {
  xs: 2,
  sm: 3,
  md: 4,
  lg: 5,
  xl: 6,
  xxl: 8,
  '2xl': 10,
  '3xl': 12,
  '4xl': 16,
  '5xl': 20,
  '6xl': 24,
};

export function isScheduleDetailsPath(pathname) {
  return pathname.startsWith('/schedule/details/');
}

/** Quick Control details page (`/quickcontrols/:id`), not list/create. */
export function isQuickControlDetailsPath(pathname) {
  const p = String(pathname || '').replace(/\/$/, '');
  return /^\/quickcontrols\/\d+$/.test(p);
}

export function isQuickControlCreatePath(pathname) {
  const p = String(pathname || '').replace(/\/$/, '');
  return p === '/quickcontrols/create' || p.startsWith('/quickcontrols/create/');
}

export function isDetailsWithFixedActionBarPath(pathname) {
  return (
    isScheduleDetailsPath(pathname) ||
    isQuickControlDetailsPath(pathname) ||
    isQuickControlCreatePath(pathname)
  );
}

/** Quick Controls list, create, and details (customized topbar width sync). */
export function isQuickControlsFormPath(pathname) {
  return pathname === '/quickcontrols' || pathname.startsWith('/quickcontrols/');
}

/** Activity Report (customized topbar width sync). */
export function isActivityReportPath(pathname) {
  return pathname === '/activity-report' || pathname.startsWith('/activity-report/');
}

export function isScheduleFormPath(pathname) {
  return (
    isScheduleDetailsPath(pathname) ||
    pathname === '/schedule/add-event' ||
    pathname.startsWith('/schedule/update-preconfigured-event')
  );
}

/** Inner form layout — Schedule details and similar stacked pages */
export function getScheduleFormShellStyle({ isLargeScreen, isDesktop }) {
  return {
    width: '100%',
    maxWidth: '100%',
    margin: 0,
    boxSizing: 'border-box',
    padding: isLargeScreen ? 40 : isDesktop ? 32 : 24,
    borderRadius: 20,
    minHeight: 500,
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 0,
  };
}

/**
 * Schedule / Quick Control details — fill MainLayout panel and scroll the table inside
 * (customized only; avoids fixed action bar overlapping rows).
 */
export function getScheduleDetailsViewportShellStyle({ isLargeScreen, isDesktop }) {
  return {
    ...getScheduleFormShellStyle({ isLargeScreen, isDesktop }),
    height: '100%',
    minHeight: 0,
    maxHeight: '100%',
  };
}

/** Bottom action row inside the details shell (not position:fixed). */
export function getScheduleDetailsActionBarStyle(
  isLargeScreen,
  isDesktop,
  isTablet = false
) {
  return {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: isLargeScreen ? 20 : isDesktop ? 18 : 16,
    flexWrap: isTablet ? 'wrap' : 'nowrap',
    flexShrink: 0,
    marginTop: 'auto',
    paddingTop: 12,
    paddingBottom: 4,
  };
}

/** Add Event — two-column row layout (matches advanced AddEvent.jsx) */
export function getScheduleAddEventShellStyle({ isLargeScreen, isDesktop }) {
  return {
    width: '100%',
    maxWidth: '100%',
    margin: 0,
    boxSizing: 'border-box',
    padding: isLargeScreen ? 40 : isDesktop ? 32 : 24,
    borderRadius: 20,
    minHeight: 500,
    position: 'relative',
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: isLargeScreen ? 32 : isDesktop ? 24 : 20,
  };
}

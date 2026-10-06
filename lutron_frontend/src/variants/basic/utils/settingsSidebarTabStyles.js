/**
 * Settings sidebar (light / md+): a single right divider on the sidebar column (perfectly straight),
 * and the active row masks that segment to create the “open tab” gap. Rows are stacked flush on md+.
 */

const SETTINGS_SIDEBAR_VERT_RULE = "1px solid #e5e7eb";

/** Default white theme: settings sidebar tab text color. */
export const SETTINGS_SIDEBAR_TAB_BLUE = "#1E75BB";

/**
 * White-theme sidebar display labels (canonical RBAC keys unchanged in UseAuth).
 * Matches breadcrumb / reference UI (Widgets, Area Groups, User Management, Floors).
 */
const WHITE_THEME_SIDEBAR_LABEL_OVERRIDES = {
  "Rename Widget": "Widgets",
  "Manage Area Groups": "Area Groups",
  "Area Size & Load": "Area Size for Energy",
  Users: "User Management",
  Floor: "Floors",
};

/**
 * Settings sidebar item order (reference UI). RBAC filters first; this only sorts visible items.
 * FOFP stays before Help for Superadmin; Manage Sensors/Modules last if ever shown.
 */
export const SETTINGS_SIDEBAR_ITEM_ORDER = [
  "Home",
  "Alerts",
  "Email Server",
  "Theme",
  "Users",
  "Area Size & Load",
  "Manage Area Groups",
  "Rename Widget",
  "Floor",
  "Processors",
  "Maintenance",
  "Application Monitoring",
  "FOFP",
  "Help",
  "Manage Sensors",
  "Manage Modules",
];

/** Sort `{ label, path }[]` or canonical label strings to SETTINGS_SIDEBAR_ITEM_ORDER. */
export function sortSettingsSidebarNavItems(items) {
  if (!Array.isArray(items) || items.length === 0) return items;
  const rank = new Map(SETTINGS_SIDEBAR_ITEM_ORDER.map((label, index) => [label, index]));
  return [...items].sort((a, b) => {
    const labelA = a?.label != null ? a.label : a;
    const labelB = b?.label != null ? b.label : b;
    return (rank.get(labelA) ?? 999) - (rank.get(labelB) ?? 999);
  });
}

/** Sidebar tab label for UI only — routes and permissions keep the canonical `label`. */
export function getSettingsSidebarNavDisplayLabel(label, isLightChrome) {
  if (!isLightChrome || label == null) return label;
  const key = String(label);
  return WHITE_THEME_SIDEBAR_LABEL_OVERRIDES[key] ?? key;
}

/** Reference UI: 14px regular Roboto tabs on default white theme. */
export const SETTINGS_SIDEBAR_TAB_TYPOGRAPHY_SX = {
  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  fontSize: "14px",
  fontWeight: 400,
  fontStyle: "normal",
  lineHeight: "20px",
  letterSpacing: "0.15px",
};

/**
 * Shared settings sidebar row text + colors. Spread into nav row `sx` after layout (px, py, mb).
 */
export function getSettingsSidebarNavItemSx(isLightChrome, theme, isActive) {
  if (!isLightChrome) {
    return {
      backgroundColor: isActive
        ? theme.palette.custom?.containerBg || "#f5f5f5"
        : "transparent",
      color: isActive ? theme.palette.text.primary : theme.palette.text.secondary,
      fontSize: 14,
      fontWeight: isActive ? 600 : 400,
      textDecoration: "none",
      cursor: "pointer",
      "&:hover": {
        backgroundColor: theme.palette.custom?.containerBg || "#f5f5f5",
        color: theme.palette.text.primary,
      },
    };
  }
  return {
    backgroundColor: "transparent",
    color: SETTINGS_SIDEBAR_TAB_BLUE,
    textAlign: "left",
    textDecoration: "none",
    cursor: "pointer",
    "&:hover": {
      backgroundColor: "transparent",
      color: SETTINGS_SIDEBAR_TAB_BLUE,
    },
  };
}

export {
  isSettingsSidebarNavActive,
  getSettingsSidebarActiveLabel,
} from '../../../utils/settingsSidebarNavPath';

/** White-theme sidebar typography + full-height column divider on md+. */
export function settingsSidebarColumnDividerSx(isDefaultWhiteTheme, mdUp) {
  if (!isDefaultWhiteTheme) return {};
  const typography = { ...SETTINGS_SIDEBAR_TAB_TYPOGRAPHY_SX };
  if (!mdUp) return typography;
  return {
    ...typography,
    position: "relative",
    pr: { xs: 0, md: 0 },
    borderRight: { xs: "none", md: SETTINGS_SIDEBAR_VERT_RULE },
    overflow: "visible",
    isolation: "isolate",
  };
}

/** @deprecated Kept for existing spreads; stacking not required with per-row borders. */
export function settingsSidebarMainContentColumnStackingSx(_a, _b) {
  return {};
}

/**
 * Settings sidebar nav row.
 * Pass `isActive` from `isSettingsSidebarNavActive(location.pathname, item.path)`.
 */
export function settingsSidebarNavRowDividerSx(isLightChrome, theme, isActive = false) {
  if (!isLightChrome) return { borderBottom: "none" };
  if (!theme) {
    return { borderBottom: "1px solid #e5e7eb" };
  }
  const columnPadMd = theme.spacing(0);
  const baseStretch = {
    boxSizing: "border-box",
    position: "relative",
    overflow: "visible",
    alignSelf: "stretch",
    width: "100%",
    marginRight: { xs: 0, md: `calc(-1 * ${columnPadMd})` },
    flexShrink: 0,
    zIndex: isActive ? 1 : 0,
  };

  const insetLeft = theme.spacing(1.5);

  const horizontalRule = {
    content: '""',
    position: "absolute",
    left: insetLeft,
    right: { xs: 0, md: `calc(-1 * ${columnPadMd})` },
    bottom: 0,
    height: "1px",
    backgroundColor: "#e5e7eb",
    pointerEvents: "none",
    zIndex: 3,
  };

  /** Stack rows flush from md up so the vertical rule is not drawn in row gaps. */
  const flushRowsMd = {
    mb: { xs: 0.8, md: 0 },
  };

  if (isActive) {
    return {
      ...baseStretch,
      ...flushRowsMd,
      borderRadius: 0,
      borderBottom: "none",
      borderRight: { xs: "none", md: "none" },
      "&::before": horizontalRule,
      [theme.breakpoints.up("md")]: {
        backgroundColor: "#ffffff",
        "&::after": {
          content: '""',
          position: "absolute",
          top: 0,
          bottom: 0,
          right: "-2px",
          width: "4px",
          backgroundColor: "#ffffff",
          pointerEvents: "none",
          zIndex: 6,
        },
      },
    };
  }

  return {
    ...baseStretch,
    ...flushRowsMd,
    borderBottom: "none",
    borderRight: { xs: "none", md: "none" },
    "&::before": horizontalRule,
  };
}

/** @deprecated No-op; vertical rule is per inactive row. */
export function settingsSidebarNavItemBridgeSx(_opts) {
  return {};
}

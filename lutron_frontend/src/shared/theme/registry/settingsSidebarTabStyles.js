import { getSettingsSidebarDisplayLabel } from '../../../utils/settingsSidebarDisplayLabel';

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
  "Theme",
  "Rename Widget",
  "Manage Area Groups",
  "Area Size & Load",
  "Email Server",
  "Users",
  "Floor",
  "Alerts",
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
  if (label == null) return label;
  const key = String(label);
  const universal = getSettingsSidebarDisplayLabel(key);
  if (universal !== key) return universal;
  if (!isLightChrome) return key;
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

/** Settings sidebar heading typography for gold / blue / brown themed chrome. */
export function settingsSidebarHeadingSx(useThemedSidebarChrome) {
  if (!useThemedSidebarChrome) {
    return {
      fontSize: 24,
      fontWeight: 600,
      letterSpacing: 0.5,
    };
  }
  return {
    color: "var(--settings-sidebar-title-color, #2c2820)",
    fontFamily: "var(--settings-sidebar-font-family, \"Roboto\", \"Helvetica\", \"Arial\", sans-serif)",
    fontSize: "var(--settings-sidebar-title-font-size, 24px)",
    fontWeight: "var(--settings-sidebar-title-font-weight, 600)",
    fontStyle: "normal",
    letterSpacing: "0.15px",
  };
}

/** Gold, Theme 3 (blue), Theme 4 (brown), or custom hex-picker theme settings sidebar chrome. */
export function usesThemedSettingsSidebarChrome({
  isGoldTheme,
  isTheme3Page,
  isTheme4Page,
  isCustomTheme,
}) {
  return Boolean(isGoldTheme || isTheme3Page || isTheme4Page || isCustomTheme);
}

/** Apply shared sidebar typography tokens (gold / blue / brown settings chrome). */
export function applySettingsSidebarTypographyVars(root) {
  if (!root?.style) return;
  root.style.setProperty("--settings-sidebar-font-family", '"Roboto", "Helvetica", "Arial", sans-serif');
  root.style.setProperty("--settings-sidebar-font-size", "14px");
  root.style.setProperty("--settings-sidebar-font-weight", "400");
  root.style.setProperty("--settings-sidebar-active-font-weight", "400");
  root.style.setProperty("--settings-sidebar-font-style", "normal");
  root.style.setProperty("--settings-sidebar-line-height", "20px");
  root.style.setProperty("--settings-sidebar-letter-spacing", "0.15px");
  root.style.setProperty("--settings-sidebar-title-font-size", "24px");
  root.style.setProperty("--settings-sidebar-title-font-weight", "600");
}

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
      fontWeight: 500,
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

/** Normalize settings route paths for comparison. */
function normalizeSettingsPath(path) {
  const s = String(path ?? "").replace(/\/+$/, "");
  return s === "" ? "/" : s;
}

/** Compare route to sidebar `item.path` (exact or nested segment match). */
export function isSettingsSidebarNavActive(pathname, itemPath) {
  if (!itemPath || typeof pathname !== "string") return false;
  const current = normalizeSettingsPath(pathname);
  const target = normalizeSettingsPath(itemPath);
  if (current === target) return true;
  if (target === "/") return false;
  return current.startsWith(`${target}/`);
}

/**
 * Resolve the active Settings sidebar label for the current pathname.
 * Uses longest matching path prefix when nested routes are open.
 */
export function getSettingsSidebarActiveLabel(pathname, visibleSidebarItemsWithPaths) {
  if (!Array.isArray(visibleSidebarItemsWithPaths)) return "";
  const current = normalizeSettingsPath(pathname);

  let bestMatch = null;
  let bestLen = -1;

  for (const item of visibleSidebarItemsWithPaths) {
    const itemPath = normalizeSettingsPath(item?.path);
    if (!itemPath || !item?.label) continue;
    const isMatch =
      current === itemPath ||
      (itemPath !== "/" && current.startsWith(`${itemPath}/`));
    if (isMatch && itemPath.length > bestLen) {
      bestLen = itemPath.length;
      bestMatch = item;
    }
  }

  return bestMatch?.label ? String(bestMatch.label) : "";
}

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

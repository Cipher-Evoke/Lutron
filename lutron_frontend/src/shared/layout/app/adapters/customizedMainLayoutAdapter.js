/**
 * Customized variant MainLayout adapter — Phase 5.3
 */

import {
  isDashboardRoute,
  isHeatmapRoute,
  isLutronWebsiteRoute,
} from "../appLayoutPathUtils";

function isCustomizedAreaGroupPath(pathname = "") {
  // Create/update/edit flows only — do NOT match settings list
  // `/setting/manage-area-groups` (contains "area-group" as a substring).
  return /\/(create-area-groups|update-area-groups|update-area-group|create-area-model|create-user-area-group|update-user-area-group)(\/|$)/i.test(
    pathname
  );
}

export const customizedMainLayoutAdapter = {
  variant: "customized",

  getFrameSx(ctx) {
    return {
      width: "100%",
      minHeight: "calc(100dvh - 100px)",
      backgroundColor: ctx.backgroundColor,
      backgroundImage: "var(--app-background-image, none)",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundAttachment: "fixed",
      backgroundRepeat: "no-repeat",
    };
  },

  getContainerPx(ctx) {
    return ctx.layoutHorizontalPx ?? {
      xs: 2,
      sm: 3,
      md: 4,
      lg: 5,
      xl: 6,
    };
  },

  buildContext({ location, appTheme, scheduleFormLayout }) {
    const {
      isScheduleFormPath,
      isQuickControlsFormPath,
      isActivityReportPath,
      isDetailsWithFixedActionBarPath,
      TOPBAR_ALIGNED_CONTENT_PANEL_CLASS,
    } = scheduleFormLayout;

    const backgroundColor =
      appTheme?.application_theme?.background || "#d2c4a2";
    const contentColor =
      appTheme?.application_theme?.content || "rgba(128, 120, 100, 0.7)";
    const isDashboard = isDashboardRoute(location.pathname);
    const isScheduleFormRoute = isScheduleFormPath(location.pathname);
    const isQuickControlsFormRoute = isQuickControlsFormPath(location.pathname);
    const isActivityReportRoute = isActivityReportPath(location.pathname);
    const isFullBleedFormRoute =
      isScheduleFormRoute || isQuickControlsFormRoute || isActivityReportRoute;
    const isDetailsWithActionBar = isDetailsWithFixedActionBarPath(location.pathname);
    const isAreaGroupRoute = isCustomizedAreaGroupPath(location.pathname);

    return {
      isDashboard,
      backgroundColor,
      contentColor,
      layoutHorizontalPx: scheduleFormLayout?.layoutHorizontalPx,
      isHeatmap: isHeatmapRoute(location.pathname),
      isLutronWebsite: isLutronWebsiteRoute(location.pathname),
      showSecondaryRibbon: false,
      isFullBleedFormRoute,
      isDetailsWithActionBar,
      isAreaGroupRoute,
      contentPanelClassName: TOPBAR_ALIGNED_CONTENT_PANEL_CLASS,
      usesMainContentPanel: !isDashboard,
    };
  },

  getContentPaddingTop() {
    // AppBar height + floating margin so content clears the full navbar card.
    return {
      xs: "78px",
      sm: "80px",
      md: "82px",
      lg: "84px",
      xl: "86px",
      xxl: "88px",
      "3xl": "90px",
      "4xl": "92px",
    };
  },

  shouldBypassContentPanel(ctx) {
    return ctx.isDashboard;
  },

  useDashboardRouteClass() {
    return false;
  },

  getContentPanelSx({ ctx, location, contentPanelRadius }) {
    const pathname = location.pathname;
    const base = {
      width: "100%",
      backgroundColor: ctx.contentColor,
      borderRadius: contentPanelRadius,
      flexGrow: 1,
      overflowX: "hidden",
      mx: 0,
      maxWidth: "100%",
      boxSizing: "border-box",
      minHeight:
        pathname === "/dashboard"
          ? "calc(100dvh - 50px)"
          : pathname === "/lutronwebsite-page"
            ? "calc(100dvh - 200px)"
            : pathname === "/heatmap"
              ? { xs: "calc(100dvh - 167px)", sm: "calc(100dvh - 150px)", md: "calc(100dvh - 180px)" }
              : "calc(100dvh - 120px)",
    };

    // Area group pages: fill to footer with white shell so theme contentColor
    // does not show as a taupe band below the white area-group card.
    if (ctx.isAreaGroupRoute) {
      return {
        ...base,
        backgroundColor: "#ffffff",
        p: 0,
        overflowY: "auto",
        height: "calc(100dvh - 120px)",
        minHeight: "calc(100dvh - 120px)",
        maxHeight: "none",
        mb: 0,
        display: "flex",
        flexDirection: "column",
      };
    }

    if (ctx.isFullBleedFormRoute) {
      if (ctx.isDetailsWithActionBar) {
        return {
          ...base,
          p: 0,
          overflowY: "hidden",
          height: "calc(100dvh - 180px)",
          maxHeight: "calc(100dvh - 180px)",
          mb: 0,
          display: "flex",
          flexDirection: "column",
        };
      }
      return {
        ...base,
        p: 0,
        overflowY: "auto",
        height: "auto",
        maxHeight: "none",
        mb: 0,
      };
    }

    return {
      ...base,
      overflowY:
        pathname === "/lutronwebsite-page" ||
          pathname.includes("/settings") ||
          pathname.startsWith("/setting") ||
          pathname === "/heatmap"
          ? "hidden"
          : "auto",
      height:
        pathname === "/lutronwebsite-page" ||
          pathname.includes("/settings") ||
          pathname.startsWith("/setting") ||
          pathname === "/heatmap"
          ? "calc(100dvh - 200px)"
          : "auto",
      maxHeight:
        pathname === "/lutronwebsite-page" ||
          pathname.includes("/settings") ||
          pathname.startsWith("/setting") ||
          pathname === "/heatmap"
          ? "calc(100dvh - 200px)"
          : "none",
      mb:
        pathname === "/lutron"
          ? { xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 4, "3xl": 5, "4xl": 6 }
          : 0,
      p:
        pathname === "/lutron"
          ? { xs: 2, sm: 2, md: 3, lg: 3, xl: 4, xxl: 5, "3xl": 6, "4xl": 7 }
          : pathname === "/schedule"
            ? { xs: 2, sm: 2, md: 3, lg: 3, xl: 4, xxl: 5, "3xl": 6, "4xl": 7 }
            : 0,
    };
  },
};

export default customizedMainLayoutAdapter;

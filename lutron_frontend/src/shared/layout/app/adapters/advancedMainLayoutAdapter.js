/**
 * Advanced variant MainLayout adapter — Phase 5.3
 */

import {
  isDashboardRoute,
  isHeatmapRoute,
  isLutronWebsiteRoute,
} from "../appLayoutPathUtils";
import { ADVANCED_VIEWPORT_GUTTER_PX } from "../../../../variants/advanced/utils/advancedViewportGutters";
import {
  ADVANCED_SETTINGS_HOME_PATH,
  isAdvancedSettingsAppRoute,
} from "../../../../variants/advanced/utils/advancedSettingsPaths";

const ZERO_GUTTER_PX = {
  xs: 0,
  sm: 0,
  md: 0,
  lg: 0,
  xl: 0,
  xxl: 0,
  "3xl": 0,
  "4xl": 0,
};

export const advancedMainLayoutAdapter = {
  variant: "advanced",

  getFrameSx(ctx) {
    const useNaturalHeight = ctx.isDashboard || ctx.isSettingsLayout;
    return {
      width: "100%",
      minHeight: useNaturalHeight ? "auto" : "calc(100dvh - 100px)",
      "--advanced-frame-page-bg": ctx.pageBackground,
      backgroundImage:
        "var(--app-background-image, none), var(--app-page-background, var(--advanced-frame-page-bg))",
      backgroundSize: "cover, cover",
      backgroundPosition: "center, center",
      backgroundAttachment: "fixed, fixed",
      backgroundRepeat: "no-repeat, no-repeat",
    };
  },

  getContainerPx(ctx) {
    if (ctx?.isDashboard) {
      return ZERO_GUTTER_PX;
    }
    return ADVANCED_VIEWPORT_GUTTER_PX;
  },

  buildContext({ location, appTheme, themeUtils }) {
    const { buildAppPageBackground } = themeUtils;
    const bgColor = appTheme?.application_theme?.background || "#6f809d";
    const pageBackground = buildAppPageBackground(bgColor);
    const isDashboard = isDashboardRoute(location.pathname);
    const isLutronWebsite = isLutronWebsiteRoute(location.pathname);
    const isSettingsLayout = isAdvancedSettingsAppRoute(
      location.pathname,
      ADVANCED_SETTINGS_HOME_PATH
    );

    return {
      isDashboard,
      isSettingsLayout,
      pageBackground,
      contentColor: appTheme?.application_theme?.content || "#3d4a5c",
      isHeatmap: isHeatmapRoute(location.pathname),
      isLutronWebsite,
      showSecondaryRibbon: false,
      useFixedContentViewport: false,
      mainContentPanelBg: "transparent",
    };
  },

  getContentPaddingTop() {
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

  getContentPanelClassName() {
    return "main-layout-page-shell";
  },

  getContentPanelSx({ ctx, location, contentPanelRadius }) {
    const isLutronWebsite = ctx.isLutronWebsite;
    const pathname = location.pathname;

    if (ctx.isSettingsLayout) {
      return {
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        mx: "auto",
        backgroundColor: ctx.mainContentPanelBg,
        borderRadius: contentPanelRadius,
        flexGrow: 0,
        overflowX: "hidden",
        overflowY: { xs: "visible", md: "hidden" },
        height: { xs: "auto", md: "calc(100dvh - 200px)" },
        maxHeight: { xs: "none", md: "calc(100dvh - 200px)" },
        minHeight: { xs: "auto", md: 0 },
        mb: 0,
        p: 0,
      };
    }

    return {
      width: "100%",
      maxWidth: "100%",
      minWidth: 0,
      mx: "auto",
      backgroundColor: ctx.mainContentPanelBg,
      borderRadius: contentPanelRadius,
      flexGrow: 1,
      overflowY:
        isLutronWebsite || pathname === "/heatmap"
          ? "hidden"
          : "auto",
      overflowX: "hidden",
      height:
        isLutronWebsite || pathname === "/heatmap"
          ? { xs: "auto", md: "calc(100dvh - 200px)" }
          : "auto",
      maxHeight:
        isLutronWebsite || pathname === "/heatmap"
          ? { xs: "none", md: "calc(100dvh - 200px)" }
          : "none",
      minHeight:
        pathname === "/dashboard"
          ? { xs: "calc(100dvh - 80px)", md: "calc(100dvh - 50px)" }
          : isLutronWebsite
            ? { xs: "auto", md: "calc(100dvh - 200px)" }
            : pathname === "/heatmap"
              ? { xs: "calc(100dvh - 167px)", sm: "calc(100dvh - 150px)", md: "calc(100dvh - 180px)" }
              : { xs: "auto", md: "calc(100dvh - 120px)" },
      mb:
        pathname === "/dashboard" || pathname === "/lutron"
          ? { xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 4, "3xl": 5, "4xl": 6 }
          : 0,
      p:
        pathname === "/dashboard"
          ? { xs: 2, sm: 2, md: 3, lg: 3, xl: 4, xxl: 5, "3xl": 6, "4xl": 7 }
          : pathname === "/lutron"
            ? { xs: 1, sm: 1.5, md: 2, lg: 2, xl: 2.5, xxl: 3, "3xl": 3.5, "4xl": 4 }
            : pathname === "/schedule"
              ? { xs: 2, sm: 2, md: 3, lg: 3, xl: 4, xxl: 5, "3xl": 6, "4xl": 7 }
              : 0,
    };
  },
};

export default advancedMainLayoutAdapter;

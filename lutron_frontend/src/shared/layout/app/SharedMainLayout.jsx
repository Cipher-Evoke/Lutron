/**
 * Shared main application layout — Phase 5.3
 *
 * Composes SharedAppShell with adapter-driven frame, ribbon, content panel, and outlet.
 */

import React, { useEffect, useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Box } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import SharedAppShell from "../SharedAppShell";
import { getAppLayoutBindings } from "./bindAppLayoutModule";
import { dispatchFetchApplicationThemeOnce } from "../../utils/bootstrapFetchGuards";
import { selectThemeSettings } from "../../theme/selectors/themeSelectors";

const contentPanelRadius = {
  xs: "8px",
  sm: "10px",
  md: "12px",
  lg: "14px",
  xl: "16px",
  xxl: "18px",
  "3xl": "20px",
  "4xl": "22px",
};

/**
 * @param {object} props
 * @param {object} props.adapter — variant MainLayout adapter
 */
export function SharedMainLayout({ adapter }) {
  const location = useLocation();
  const dispatch = useDispatch();
  const {
    themeSlice: { fetchApplicationTheme, selectApplicationTheme },
    themeUtils,
    breadcrumbUtils,
    homeSlice,
    components: {
      TopbarComponent,
      Footer,
      HeatmapControls,
      HeatMap,
      ScheduleHeaderDropdown,
    },
    hooks: { useSyncPanelToTopbar } = {},
    scheduleFormLayout,
  } = getAppLayoutBindings();

  const appTheme = useSelector(selectApplicationTheme);
  const themeSettings = useSelector(selectThemeSettings);
  const clientData = useSelector(homeSlice.homeDataClient);
  const projectData = useSelector(homeSlice.homeDataProject);

  useEffect(() => {
    // Basic: always attempt once-per-session fetch. Seeded application_theme in Redux
    // must not skip refetch after SPA logout→login (guards reset on logout).
    if (adapter.variant === "basic") {
      dispatchFetchApplicationThemeOnce(dispatch, fetchApplicationTheme);
      return;
    }
    if (!appTheme || !appTheme.application_theme) {
      dispatchFetchApplicationThemeOnce(dispatch, fetchApplicationTheme);
    }
  }, [dispatch, appTheme, fetchApplicationTheme, adapter.variant]);

  const ctx = useMemo(
    () =>
      adapter.buildContext({
        location,
        appTheme,
        themeUtils,
        breadcrumbUtils,
        clientData,
        projectData,
        scheduleFormLayout,
        themeSettings,
      }),
    [
      adapter,
      location,
      appTheme,
      themeSettings,
      themeUtils,
      breadcrumbUtils,
      clientData,
      projectData,
      scheduleFormLayout,
    ]
  );

  useEffect(() => {
    if (!adapter.useDashboardRouteClass?.(ctx)) return undefined;
    const html = document.documentElement;
    if (ctx.isDashboard) {
      html.classList.add("dashboard-route-shell");
    } else {
      html.classList.remove("dashboard-route-shell");
    }
    return () => html.classList.remove("dashboard-route-shell");
  }, [adapter, ctx]);

  useSyncPanelToTopbar?.(
    ctx.usesMainContentPanel,
    ctx.contentPanelClassName ? `.${ctx.contentPanelClassName}` : undefined
  );

  const frameSx = adapter.getFrameSx(ctx);
  const containerPx = adapter.getContainerPx(ctx);
  const paddingTop = adapter.getContentPaddingTop(ctx);
  const bypassPanel = adapter.shouldBypassContentPanel(ctx);

  const contentPanelSx =
    adapter.getContentPanelSx?.({ ctx, location, contentPanelRadius }) ??
    buildDefaultContentPanelSx({ ctx, location });

  const mainContent = (
    <Box sx={{ width: "100%", mx: "auto", px: containerPx }}>
      {ctx.showSecondaryRibbon && !ctx.isHeatmap && (
        <SecondaryRibbon
          ctx={ctx}
          containerPx={containerPx}
          ScheduleHeaderDropdown={ScheduleHeaderDropdown}
          top={adapter.secondaryRibbonTop || "50px"}
        />
      )}

      <Box sx={{ paddingTop, width: "100%" }}>
        {ctx.isHeatmap && <HeatmapControls />}

        {bypassPanel ? (
          <Outlet />
        ) : (
          <Box
            className={adapter.getContentPanelClassName?.(ctx) ?? ctx.contentPanelClassName}
            sx={contentPanelSx}
            data-testid="shared-main-layout-content-panel"
          >
            {ctx.isHeatmap ? <HeatMap /> : <Outlet />}
          </Box>
        )}
      </Box>

      <Footer />
    </Box>
  );

  return (
    <Box sx={frameSx} data-testid="shared-main-layout" data-variant={adapter.variant}>
      <SharedAppShell topbar={<TopbarComponent />} useOutlet={false}>
        {mainContent}
      </SharedAppShell>
    </Box>
  );
}

function SecondaryRibbon({ ctx, containerPx, ScheduleHeaderDropdown, top = "50px" }) {
  const showEmptyRibbon = Boolean(ctx.keepEmptySecondaryRibbon);
  if (!ctx.secondaryRibbonBreadcrumbRestDisplay && !showEmptyRibbon) return null;
  return (
    <Box
      sx={{
        bgcolor: "#1E74C5",
        position: "fixed",
        top,
        left: 0,
        right: 0,
        zIndex: 10001,
        px: containerPx,
        py: "10px",
        minHeight: 48,
        height: "auto",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        overflow: "visible",
      }}
      data-testid="shared-secondary-ribbon"
    >
      <Box
        title={ctx.secondaryRibbonBreadcrumbText}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          whiteSpace: "nowrap",
          overflow: "visible",
          maxWidth: { xs: "100%", sm: "100%", md: "100%" },
          lineHeight: "22px",
          width: "100%",
        }}
      >
        {ctx.secondaryRibbonBreadcrumbText ? (
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            lineHeight: "22px",
            overflow: "visible",
            py: "2px",
          }}
        >
          {(() => {
            const segments = ctx.secondaryRibbonBreadcrumbText.split(" > ");
            const first = segments[0];
            const rest = segments.slice(1).join(" › ");
            return (
              <>
                <Box
                  component="span"
                  sx={{
                    color: "#ffffff",
                    fontSize: { xs: "14px", md: "15px" },
                    fontWeight: 400,
                    lineHeight: "22px",
                    display: "inline-block",
                  }}
                >
                  {first}
                </Box>
                {rest && (
                  <>
                    <Box
                      component="span"
                      sx={{
                        color: "rgba(255, 255, 255, 0.66)",
                        fontSize: "15px",
                        lineHeight: "22px",
                        display: "inline-block",
                      }}
                    >
                      ›
                    </Box>
                    <Box
                      component="span"
                      sx={{
                        color: "rgba(255, 255, 255, 0.66)",
                        fontSize: { xs: 10, sm: 10, md: 11 },
                        fontWeight: 500,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        lineHeight: "18px",
                        display: "inline-block",
                        maxWidth: "min(72vw, 420px)",
                        verticalAlign: "middle",
                      }}
                    >
                      {rest}
                    </Box>
                  </>
                )}
              </>
            );
          })()}
        </Box>
        ) : null}
        {ctx.showScheduleHeaderDropdown && ScheduleHeaderDropdown && (
            <>
              <Box
                component="span"
                sx={{ color: "rgba(255, 255, 255, 0.66)", fontSize: "15px", lineHeight: 1 }}
              >
                ›
              </Box>
              <ScheduleHeaderDropdown />
            </>
          )}
      </Box>
    </Box>
  );
}

function buildDefaultContentPanelSx({ ctx, location }) {
  const pathname = location.pathname;
  return {
    width: "100%",
    mx: "auto",
    backgroundColor: ctx.mainContentPanelBg,
    borderRadius: contentPanelRadius,
    flexGrow: 1,
    overflowY: ctx.useFixedContentViewport ? "hidden" : "auto",
    overflowX: "hidden",
    height: ctx.useFixedContentViewport ? "calc(100vh - 187px)" : "auto",
    maxHeight: ctx.useFixedContentViewport ? "calc(100vh - 187px)" : "none",
    minHeight:
      pathname === "/dashboard"
        ? "calc(100vh - 50px)"
        : pathname === "/lutronwebsite-page"
          ? "calc(100vh - 187px)"
          : pathname === "/heatmap"
            ? "calc(100vh - 167px)"
            : "calc(100vh - 107px)",
    mb:
      pathname === "/dashboard" || pathname === "/lutron"
        ? { xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 4, "3xl": 5, "4xl": 6 }
        : 0,
    p:
      pathname === "/dashboard" || pathname === "/lutron" || pathname === "/schedule"
        ? { xs: 2, sm: 2, md: 3, lg: 3, xl: 4, xxl: 5, "3xl": 6, "4xl": 7 }
        : 0,
  };
}

export default SharedMainLayout;

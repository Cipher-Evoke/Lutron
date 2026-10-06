/**
 * Shared settings layout shell — Phase 5.2
 *
 * Adapter-driven grid: heading, sidebar column, content panel.
 * Variant supplies theme hooks, NavigationComponent, and layout adapter config.
 */

import React, { useMemo } from "react";
import { Box, Grid, Typography, useTheme, useMediaQuery } from "@mui/material";
import { useSelector } from "react-redux";
import SharedSettingsNavigation from "./SharedSettingsNavigation";

/**
 * @typedef {object} SettingsLayoutAdapter
 * @property {string} variant — basic | advanced | customized
 * @property {(ctx:object)=>object} [getRootGridSx]
 * @property {(ctx:object)=>object} [getHeadingSx]
 * @property {boolean} [headingInSidebar]
 * @property {boolean} [showContentHeader]
 * @property {(ctx:object)=>object} [getSidebarGridSx]
 * @property {(ctx:object)=>object} [getContentOuterSx]
 * @property {(ctx:object)=>object} [getContentInnerSx]
 * @property {(items:Array)=>Array} [filterSidebarItems]
 * @property {(ctx:object)=>string|undefined} [getRootClassName]
 * @property {(ctx:object)=>string|undefined} [getSidebarClassName]
 * @property {(ctx:object)=>string|undefined} [getContentOuterClassName]
 * @property {(ctx:object)=>string|undefined} [getContentInnerClassName]
 */

/**
 * @param {object} props
 * @param {SettingsLayoutAdapter} props.adapter
 * @param {React.ComponentType} props.NavigationComponent
 * @param {Array<{label:string,path:string}>} props.sidebarItems
 * @param {React.ReactNode} props.children
 * @param {object} [props.themeContext] — { contentColor, isDefaultWhiteTheme, useThemedSidebarChrome, ... }
 */
export function SharedSettingsShell({
  adapter,
  NavigationComponent,
  sidebarItems = [],
  children,
  themeContext = {},
}) {
  const theme = useTheme();
  const settingsSidebarMdUp = useMediaQuery(theme.breakpoints.up("md"));

  const ctx = useMemo(
    () => ({
      theme,
      settingsSidebarMdUp,
      ...themeContext,
    }),
    [theme, settingsSidebarMdUp, themeContext]
  );

  const rootSx = adapter.getRootGridSx?.(ctx) ?? { ml: "18px", p: "18px" };
  const headingSx = adapter.getHeadingSx?.(ctx) ?? {
    color: theme.palette.text.secondary,
    fontSize: 24,
    fontWeight: 600,
    letterSpacing: 0.5,
    mb: 1,
  };
  const sidebarSx = adapter.getSidebarGridSx?.(ctx) ?? { md: 2 };
  const contentOuterSx = adapter.getContentOuterSx?.(ctx) ?? {
    backgroundColor: themeContext.isDefaultWhiteTheme ? "#ffffff" : themeContext.contentColor,
    p: 3,
    borderTopRightRadius: "10px",
    borderBottomRightRadius: "10px",
  };
  const contentInnerSx = adapter.getContentInnerSx?.(ctx) ?? {
    backgroundColor: "#fff",
    borderRadius: { xs: "4px", sm: "6px", md: "8px", lg: "10px" },
    p: { xs: 0.5, sm: 0.8, md: 1.2, lg: 1.5 },
    width: "100%",
    flex: 1,
    minHeight: { xs: "auto", md: "calc(100vh - 120px)" },
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  };

  const heading = (
    <Typography variant="h6" className="settings-sidebar-heading" sx={headingSx}>
      Settings
    </Typography>
  );

  return (
    <Grid
      container
      className={adapter.getRootClassName?.(ctx) ?? "settings-layout-root"}
      sx={rootSx}
    >
      {adapter.showContentHeader && !adapter.headingInSidebar ? (
        <Grid item xs={12} sx={{ pt: "18px", mb: 1.5 }}>
          {heading}
          <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <Box sx={{ height: "1px", width: "100%", backgroundColor: "#e5e7eb" }} />
            <Box sx={{ height: "1px", width: "100%", backgroundColor: "#e5e7eb" }} />
          </Box>
        </Grid>
      ) : null}

      <Grid
        item
        xs={12}
        md={sidebarSx.md ?? 2}
        sx={sidebarSx}
        data-testid="settings-sidebar-nav"
        className={adapter.getSidebarClassName?.(ctx)}
      >
        {adapter.headingInSidebar ? heading : null}
        <SharedSettingsNavigation
          items={sidebarItems}
          NavigationComponent={NavigationComponent}
          filterItems={adapter.filterSidebarItems}
        />
      </Grid>

      <Grid
        item
        xs={12}
        md={sidebarSx.contentMd ?? (sidebarSx.md === 3 ? 9 : 10)}
        className={adapter.getContentOuterClassName?.(ctx) ?? "settings-main-outer-panel"}
        sx={contentOuterSx}
      >
        <Box
          data-testid="settings-layout-content"
          className={adapter.getContentInnerClassName?.(ctx) ?? "settings-main-inner-panel"}
          sx={contentInnerSx}
        >
          {children}
        </Box>
      </Grid>
    </Grid>
  );
}

export default SharedSettingsShell;

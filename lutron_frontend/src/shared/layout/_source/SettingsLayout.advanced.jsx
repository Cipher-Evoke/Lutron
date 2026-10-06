/**
 * Shared Settings shell: left nav + content panel (FOFP, etc.).
 * Sidebar matches Help / Processors / Alerts (no full-width header rules).
 */

import React from "react";
import { Box, Grid, Typography, useTheme, useMediaQuery } from "@mui/material";
import { useSelector } from "react-redux";
import { UseAuth, getVisibleSidebarItemsWithPaths } from "../../customhooks/UseAuth";
import { selectApplicationTheme } from "../../redux/slice/theme/themeSlice";
import { isGoldApplicationTheme, isLightSurface } from "../../utils/themeOnSurface";
import {
  usesCustomApplicationTheme,
  usesTheme3PageGradient,
  usesTheme4PageGradient,
} from "../../utils/themePageBackground";
import {
  settingsSidebarColumnDividerSx,
  settingsSidebarHeadingSx,
  usesThemedSettingsSidebarChrome,
} from "../../utils/settingsSidebarTabStyles";
import SettingsSidebarNav from "../../components/SettingsSidebarNav";

const isPathActive = (pathname, itemPath) => {
  if (!itemPath) return false;
  const current = pathname.replace(/\/$/, "") || "/";
  const target = String(itemPath).replace(/\/$/, "") || "/";
  return current === target;
};

const SettingsLayout = ({ children }) => {
  const theme = useTheme();
  const settingsSidebarMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const { role } = UseAuth();
  const visibleSidebarItemsWithPaths = getVisibleSidebarItemsWithPaths(role);
  const appTheme = useSelector(selectApplicationTheme);
  const contentColor = appTheme?.application_theme?.content || "#ffffff";
  const themeBackground = appTheme?.application_theme?.background;
  const isGoldTheme = isGoldApplicationTheme(themeBackground);
  const isTheme3Page = usesTheme3PageGradient(themeBackground);
  const isTheme4Page = usesTheme4PageGradient(themeBackground);
  const isCustomTheme = usesCustomApplicationTheme(themeBackground);
  const isDefaultWhiteTheme = isLightSurface(contentColor) && !isGoldTheme;
  const useThemedSidebarChrome = usesThemedSettingsSidebarChrome({
    isGoldTheme,
    isTheme3Page,
    isTheme4Page,
    isCustomTheme,
  });

  const sidebarItems = visibleSidebarItemsWithPaths.filter(
    (item) =>
      item?.label &&
      item?.path &&
      item.label !== "Manage Sensors" &&
      item.label !== "Manage Modules"
  );

  return (
    <Grid
      container
      className="settings-layout-root"
      sx={{
        ml: { xs: 0, sm: 0.5, md: "18px" },
        p: { xs: 0.5, sm: 1, md: "18px" },
        alignItems: "flex-start",
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        boxSizing: "border-box",
      }}
    >
      <Grid
        item
        xs={12}
        md={3}
        sx={{
          order: { xs: 1, md: 1 },
          p: { xs: 0.3, sm: 0.5, md: 1, lg: 1.5 },
          ...settingsSidebarColumnDividerSx(isDefaultWhiteTheme, settingsSidebarMdUp),
          position: { xs: "static", md: "sticky" },
          top: { xs: "auto", md: "20px" },
          alignSelf: "flex-start",
        }}
        data-testid="settings-sidebar-nav"
        className={useThemedSidebarChrome ? "settings-sidebar-column" : undefined}
      >
        <Typography
          variant="h6"
          className="settings-sidebar-heading"
          sx={{
            mb: { xs: 0.8, sm: 1, md: 1.5, lg: 2 },
            ...(useThemedSidebarChrome
              ? settingsSidebarHeadingSx(true)
              : {
                  color: theme.palette.text.secondary,
                  ...settingsSidebarHeadingSx(false),
                }),
          }}
        >
          Settings
        </Typography>

        <SettingsSidebarNav items={sidebarItems} />
      </Grid>

      <Grid
        item
        xs={12}
        md={9}
        className="settings-main-outer-panel"
        sx={{
          order: { xs: 2, md: 2 },
          backgroundColor: useThemedSidebarChrome
            ? "var(--settings-panel-outer-bg, #f5e8bc)"
            : isDefaultWhiteTheme
              ? "#ffffff"
              : contentColor,
          border: useThemedSidebarChrome
            ? "1px solid var(--settings-panel-border, rgba(74, 67, 52, 0.28))"
            : undefined,
          p: { xs: 1, sm: 1.5, md: 2, lg: 3 },
          borderTopRightRadius: "10px",
          borderBottomRightRadius: "10px",
        }}
      >
        <Box
          data-testid="settings-layout-content"
          className="settings-main-inner-panel"
          sx={{
            backgroundColor: "var(--settings-panel-inner-bg, #fff)",
            borderRadius: { xs: "4px", sm: "6px", md: "8px", lg: "10px" },
            p: { xs: 0.5, sm: 0.8, md: 1.2, lg: 1.5 },
            width: "100%",
            flex: 1,
            minHeight: { xs: "auto", md: "calc(100vh - 120px)" },
            display: "flex",
            flexDirection: "column",
            overflow: { xs: "auto", md: "hidden" },
            minWidth: 0,
            maxWidth: "100%",
          }}
        >
          {children}
        </Box>
      </Grid>
    </Grid>
  );
};

export default SettingsLayout;
export { isPathActive };

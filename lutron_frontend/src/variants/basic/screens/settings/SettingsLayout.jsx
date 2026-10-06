/**
 * Basic SettingsLayout — Phase 5.2 thin wrapper over SharedSettingsShell
 */
import React from "react";
import { useTheme, useMediaQuery } from "@mui/material";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { UseAuth, getVisibleSidebarItemsWithPaths } from "../../customhooks/UseAuth";
import { selectApplicationTheme } from "../../redux/slice/theme/themeSlice";
import { isLightSurface } from "../../utils/themeOnSurface";
import { settingsSidebarColumnDividerSx } from "../../utils/settingsSidebarTabStyles";
import SettingsSidebarNav from "../../components/SettingsSidebarNav";
import SharedSettingsShell from "../../../../shared/layout/SharedSettingsShell";
import { basicSettingsLayoutAdapter } from "../../../../shared/layout/adapters/basicSettingsLayoutAdapter";
import { selectThemeSettings } from "../../../../shared/theme/selectors/themeSelectors";
import { hasActiveUserThemeBackgroundImage } from "../../../../shared/theme/utils/themeBackgroundImage";
import { isBasicApplicationMonitoringRoute } from "../../utils/basicSettingsPaths";

const SettingsLayout = ({ children }) => {
  const theme = useTheme();
  const location = useLocation();
  const settingsSidebarMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const { role } = UseAuth();
  const sidebarItems = getVisibleSidebarItemsWithPaths(role);
  const appTheme = useSelector(selectApplicationTheme);
  const themeSettings = useSelector(selectThemeSettings);
  const contentColor = appTheme?.application_theme?.content || "#ffffff";
  const isDefaultWhiteTheme = isLightSurface(contentColor);
  const isApplicationMonitoring = isBasicApplicationMonitoringRoute(location.pathname);

  return (
    <SharedSettingsShell
      adapter={{
        ...basicSettingsLayoutAdapter,
        getSidebarGridSx: (ctx) => ({
          md: 2,
          contentMd: 10,
          ...settingsSidebarColumnDividerSx(isDefaultWhiteTheme, settingsSidebarMdUp),
          position: { xs: "static", md: "sticky" },
          top: { xs: "auto", md: "20px" },
          alignSelf: "flex-start",
        }),
      }}
      NavigationComponent={SettingsSidebarNav}
      sidebarItems={sidebarItems}
      themeContext={{
        contentColor,
        isDefaultWhiteTheme,
        settingsSidebarMdUp,
        settingsSidebarColumnDividerSx,
        theme,
        isApplicationMonitoring,
        hasActiveUserThemeBackgroundImage: hasActiveUserThemeBackgroundImage(
          themeSettings?.background_image,
          appTheme?.application_theme?.background_image,
          appTheme?.background_image
        ),
      }}
    >
      {children}
    </SharedSettingsShell>
  );
};

export default SettingsLayout;
export { isPathActive, normalizeSettingsPath, getActiveSettingsRouteItem } from "../../../../shared/layout/settingsPathUtils";

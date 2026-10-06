/**
 * Advanced SettingsLayout — Phase 5.2 thin wrapper over SharedSettingsShell
 */
import React from "react";
import { useTheme, useMediaQuery } from "@mui/material";
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
import SharedSettingsShell from "../../../../shared/layout/SharedSettingsShell";
import { advancedSettingsLayoutAdapter } from "../../../../shared/layout/adapters/advancedSettingsLayoutAdapter";
import { selectThemeSettings } from "../../../../shared/theme/selectors/themeSelectors";
import { hasActiveUserThemeBackgroundImage } from "../../../../shared/theme/utils/themeBackgroundImage";

const SettingsLayout = ({ children }) => {
  const theme = useTheme();
  const settingsSidebarMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const { role } = UseAuth();
  const sidebarItems = getVisibleSidebarItemsWithPaths(role);
  const appTheme = useSelector(selectApplicationTheme);
  const themeSettings = useSelector(selectThemeSettings);
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

  return (
    <SharedSettingsShell
      adapter={{
        ...advancedSettingsLayoutAdapter,
        getSidebarGridSx: (ctx) => ({
          md: 3,
          contentMd: 9,
          order: { xs: 1, md: 1 },
          p: { xs: 0.3, sm: 0.5, md: 1, lg: 1.5 },
          ...settingsSidebarColumnDividerSx(isDefaultWhiteTheme, settingsSidebarMdUp),
          borderRight: { xs: "none", md: "none" },
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
        useThemedSidebarChrome,
        settingsSidebarMdUp,
        settingsSidebarColumnDividerSx,
        settingsSidebarHeadingSx,
        theme,
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

import React from 'react';
import { useTheme, useMediaQuery } from '@mui/material';
import { useSelector } from 'react-redux';
import SharedSettingsShell from '../../../shared/layout/SharedSettingsShell';
import { customizedSettingsLayoutAdapter } from '../utils/customizedSettingsLayoutAdapter';
import { isLightSurface } from '../../../shared/theme/utils/themeOnSurface';
import { selectApplicationTheme } from '../redux/slice/theme/themeSlice';

/**
 * Settings page grid shell for customized variant (sidebar title + nav in left column).
 */
export function CustomizedSettingsPageShell({
  children,
  sidebarItems,
  NavigationComponent,
  contentColor: contentColorProp,
}) {
  const theme = useTheme();
  const settingsSidebarMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const appTheme = useSelector(selectApplicationTheme);
  const contentColor =
    contentColorProp || appTheme?.application_theme?.content || 'rgba(128, 120, 100, 0.7)';
  const isDefaultWhiteTheme = isLightSurface(contentColor);

  return (
    <SharedSettingsShell
      adapter={customizedSettingsLayoutAdapter}
      NavigationComponent={NavigationComponent}
      sidebarItems={sidebarItems}
      themeContext={{
        contentColor,
        isDefaultWhiteTheme,
        settingsSidebarMdUp,
        theme,
      }}
    >
      {children}
    </SharedSettingsShell>
  );
}

export default CustomizedSettingsPageShell;

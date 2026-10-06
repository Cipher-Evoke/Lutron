import React from 'react';
import Box from '@mui/material/Box';
import {
  SETTINGS_SIDEBAR_TAB_BLUE,
  SETTINGS_SIDEBAR_TAB_TYPOGRAPHY_SX,
  getSettingsSidebarNavDisplayLabel,
} from './settingsSidebarTabStyles';

/**
 * Settings sidebar tab label — white theme uses fixed 14px / weight 400 (reference UI).
 * Active white-theme item: blue underline under text only (not full row width).
 */
export function SettingsSidebarNavLabel({ label, isLightChrome, isActive, thickness }) {
  const displayLabel = getSettingsSidebarNavDisplayLabel(label, isLightChrome);
  if (!isLightChrome) return displayLabel;
  return (
    <Box
      component="span"
      sx={{
        ...SETTINGS_SIDEBAR_TAB_TYPOGRAPHY_SX,
        color: 'inherit',
        ...(isActive
          ? {
              textDecoration: 'underline',
              textDecorationColor: SETTINGS_SIDEBAR_TAB_BLUE,
              textUnderlineOffset: '4px',
              textDecorationThickness: thickness ?? '1px',
            }
          : {}),
      }}
    >
      {displayLabel}
    </Box>
  );
}

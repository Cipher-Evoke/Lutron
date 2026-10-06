import React from 'react';
import { BASIC_SETTINGS_HOME_PATH } from '../../../utils/basicSettingsPaths';
import { Navigate } from 'react-router-dom';
import {
  Grid,
  Box,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useSelector } from 'react-redux';
import { selectApplicationTheme } from '../../../redux/slice/theme/themeSlice';
import { isLightSurface } from '../../../utils/themeOnSurface';
import { settingsSidebarColumnDividerSx } from '../../../utils/settingsSidebarTabStyles';
import SettingsSidebarNav from '../../../components/SettingsSidebarNav';
import { ConfirmDialog } from '../../../utils/FeedbackUI';
import { getVisibleSidebarItemsWithPaths, UseAuth } from '../../../customhooks/UseAuth';
import FloorSettingsContent from '../../../../../shared/settings/floor/FloorSettingsContent';
import {
  getSettingsTableHeaderCellSx,
  getSettingsTableHeaderRowSx,
} from '../../../../../shared/settings/settingsTableHeaderStyles';
import {
  fetchFloors,
  deleteFloor,
  setFloorSortMode,
  reorderFloors,
  selectFloors,
  selectManualSortEnabled,
} from '../../../redux/slice/floor/floorSlice';

export default function FloorComponent() {
  const theme = useTheme();
  const appTheme = useSelector(selectApplicationTheme);
  const backgroundColor = appTheme?.application_theme?.background || '#ffffff';
  const contentColor = appTheme?.application_theme?.content || '#ffffff';
  const buttonColor = appTheme?.application_theme?.button || '#232323';
  const isDefaultWhiteTheme = isLightSurface(contentColor);
  const actionBlue = isDefaultWhiteTheme ? '#1565C0' : buttonColor;
  const tableHeaderText = isLightSurface(backgroundColor) ? '#000000' : '#ffffff';
  const tableHeaderRowSx = getSettingsTableHeaderRowSx(isDefaultWhiteTheme, backgroundColor);
  const tableHeaderCellSx = getSettingsTableHeaderCellSx(
    isDefaultWhiteTheme,
    backgroundColor,
    tableHeaderText
  );

  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const settingsSidebarMdUp = useMediaQuery(theme.breakpoints.up('md'));

  const { role } = UseAuth();
  const visibleSidebarItemsWithPaths = getVisibleSidebarItemsWithPaths(role);

  if (role !== 'Superadmin') return <Navigate to={BASIC_SETTINGS_HOME_PATH} replace />;

  return (
    <Grid
      container
      className="settings-layout-root"
      sx={{
        maxWidth: '100%',
        borderRadius: '10px',
        alignItems: 'flex-start',
        p: '18px',
        ml: '18px',
      }}
    >
      <Grid item xs={12} sx={{ pt: '18px', mb: 1.5 }}>
        <Typography
          variant="h6"
          sx={{
            color: theme.palette.text.secondary,
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: 0.5,
            mb: 1,
          }}
        >
          Settings
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <Box sx={{ height: '1px', width: '100%', backgroundColor: '#e5e7eb' }} />
          <Box sx={{ height: '1px', width: '100%', backgroundColor: '#e5e7eb' }} />
        </Box>
      </Grid>

      <Grid
        item
        xs={12}
        md={2}
        sx={{
          p: 0,
          ...settingsSidebarColumnDividerSx(isDefaultWhiteTheme, settingsSidebarMdUp && !isTablet),
        }}
      >
        <SettingsSidebarNav items={visibleSidebarItemsWithPaths} />
      </Grid>

      <Grid
        item
        xs={12}
        md={10}
        className="settings-main-content-column"
        sx={{
          backgroundColor: isDefaultWhiteTheme ? '#ffffff' : contentColor,
          p: 3,
          borderTopRightRadius: '10px',
          borderBottomRightRadius: '10px',
        }}
      >
        <FloorSettingsContent
          buttonColor={actionBlue}
          fetchFloors={fetchFloors}
          deleteFloor={deleteFloor}
          setFloorSortMode={setFloorSortMode}
          reorderFloors={reorderFloors}
          selectFloors={selectFloors}
          selectManualSortEnabled={selectManualSortEnabled}
          ConfirmDialog={ConfirmDialog}
          tableHeaderRowSx={tableHeaderRowSx}
          tableHeaderCellSx={tableHeaderCellSx}
          // Solid blue header + overflow:hidden clips the last cell; keep sort icon fully visible.
          tableHeaderSortCellSx={{
            width: 56,
            minWidth: 56,
            maxWidth: 64,
            px: 1,
            pr: 2,
            py: 0.75,
            boxSizing: 'border-box',
          }}
          headerSortIconColor="#ffffff"
          headerSortIconActiveColor="#ffffff"
        />
      </Grid>
    </Grid>
  );
}

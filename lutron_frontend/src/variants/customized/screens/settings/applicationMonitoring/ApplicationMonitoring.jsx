import React from "react";
import { Box, Grid, Paper } from "@mui/material";
import { useSelector } from "react-redux";
import { BaseUrl } from "../../../BaseUrl";
import { UseAuth, getVisibleSidebarItemsWithPaths } from "../../../customhooks/UseAuth";
import SettingsSidebar from "../../../components/SettingsSidebar";
import { selectApplicationTheme } from "../../../redux/slice/theme/themeSlice";
import { ApplicationMonitoringPage } from "../../../../../shared/monitoring";
import {
  settingsHelpLayoutShellSx,
  settingsHelpLayoutGridSx,
  settingsHelpLayoutContentColumnSx,
  settingsHelpWhitePaperSx,
  settingsHelpContentTypographySx,
} from "../../../utils/settingsPageLayout";

/**
 * Customized settings screen — same sidebar shell, white panel, and type as
 * Alerts / Processors / Maintenance.
 */
export default function ApplicationMonitoring() {
  const { role: currentUserRole } = UseAuth();
  const visibleSidebarItemsWithPaths = getVisibleSidebarItemsWithPaths(currentUserRole);
  const appTheme = useSelector(selectApplicationTheme);
  const buttonColor = appTheme?.application_theme?.button || "#232323";

  return (
    <Box className="help-container" sx={settingsHelpLayoutShellSx}>
      <Grid container spacing={{ xs: 0.3, sm: 0.5, md: 1, lg: 1.5 }} sx={settingsHelpLayoutGridSx}>
        <SettingsSidebar items={visibleSidebarItemsWithPaths} />
        <Grid item xs={12} md={9} lg={9} className="settings-help-content-column" sx={settingsHelpLayoutContentColumnSx}>
          <Paper
            sx={{
              ...settingsHelpWhitePaperSx,
              ...settingsHelpContentTypographySx,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <ApplicationMonitoringPage
              BaseUrl={BaseUrl}
              buttonColor={buttonColor}
              disableRootPaper
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

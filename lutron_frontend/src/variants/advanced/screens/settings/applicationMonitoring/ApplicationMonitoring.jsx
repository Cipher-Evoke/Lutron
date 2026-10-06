import React from "react";
import { Box } from "@mui/material";
import { useSelector } from "react-redux";
import { BaseUrl } from "../../../BaseUrl";
import SettingsLayout from "../SettingsLayout";
import { selectApplicationTheme } from "../../../redux/slice/theme/themeSlice";
import { getThemeButtonColor } from "../../../utils/themePageBackground";
import { ApplicationMonitoringPage } from "../../../../../shared/monitoring";

/** Match Advanced Alerts / Processors / Maintenance settings panel type. */
const advancedSettingsMonitoringTypeSx = {
  width: "100%",
  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  color: "var(--settings-panel-text, rgba(0, 0, 0, 0.87))",
  "& .MuiTypography-root": {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  "& .MuiTypography-h4": {
    fontWeight: "bold !important",
    fontSize: { xs: "14px !important", sm: "16px !important", md: "18px !important" },
    color: "var(--settings-panel-text, rgba(0, 0, 0, 0.87)) !important",
    backgroundColor: "transparent !important",
  },
  "& .MuiTypography-h6, & .MuiTypography-subtitle1, & .MuiTypography-subtitle2": {
    fontWeight: "bold !important",
    fontSize: { xs: "12px !important", sm: "13px !important", md: "14px !important" },
    color: "var(--settings-panel-text, rgba(0, 0, 0, 0.87)) !important",
    backgroundColor: "transparent !important",
  },
  "& .MuiTypography-body1, & .MuiTypography-body2": {
    fontSize: { xs: "12px !important", sm: "13px !important", md: "14px !important" },
    fontWeight: "400 !important",
  },
  "& .MuiTypography-caption": {
    fontSize: { xs: "11px !important", sm: "12px !important", md: "13px !important" },
    fontWeight: "400 !important",
  },
  "& .MuiFormControlLabel-label, & .MuiInputLabel-root, & .MuiSelect-select, & .MuiMenuItem-root": {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: { xs: "12px !important", sm: "13px !important", md: "14px !important" },
    fontWeight: "500 !important",
  },
  "& .MuiButton-root": {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: { xs: 12, sm: 13, md: 14 },
    textTransform: "none",
  },
  "& .MuiChip-label": {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: { xs: 11, sm: 12, md: 13 },
    fontWeight: 500,
  },
};

/**
 * Advanced settings screen — same SettingsLayout shell and type as Alerts / Processors.
 */
export default function ApplicationMonitoring() {
  const appTheme = useSelector(selectApplicationTheme);
  const buttonColor = getThemeButtonColor(
    appTheme?.application_theme?.button,
    appTheme?.application_theme?.background
  );

  return (
    <SettingsLayout>
      <Box sx={advancedSettingsMonitoringTypeSx}>
        <ApplicationMonitoringPage
          BaseUrl={BaseUrl}
          buttonColor={buttonColor}
          disableRootPaper
        />
      </Box>
    </SettingsLayout>
  );
}

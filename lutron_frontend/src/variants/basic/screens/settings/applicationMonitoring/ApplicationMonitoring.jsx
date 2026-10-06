import React from "react";
import { useSelector } from "react-redux";
import { BaseUrl } from "../../../BaseUrl";
import SettingsLayout from "../SettingsLayout";
import { selectApplicationTheme } from "../../../redux/slice/theme/themeSlice";
import { getThemeButtonColor } from "../../../utils/themePageBackground";
import { ApplicationMonitoringPage } from "../../../../../shared/monitoring";

/**
 * Basic settings screen — wraps SettingsLayout like other settings pages.
 */
export default function ApplicationMonitoring() {
  const appTheme = useSelector(selectApplicationTheme);
  const buttonColor = getThemeButtonColor(
    appTheme?.application_theme?.button,
    appTheme?.application_theme?.background
  );

  return (
    <SettingsLayout>
      <ApplicationMonitoringPage
        BaseUrl={BaseUrl}
        buttonColor={buttonColor}
        disableRootPaper
      />
    </SettingsLayout>
  );
}

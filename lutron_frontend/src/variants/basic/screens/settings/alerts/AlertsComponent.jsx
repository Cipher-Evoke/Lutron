import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Grid,
  Typography,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Alert,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import { UseAuth, getVisibleSidebarItemsWithPaths } from "../../../customhooks/UseAuth";
import { selectApplicationTheme } from "../../../redux/slice/theme/themeSlice";
import { isLightSurface } from "../../../utils/themeOnSurface";
import { settingsSidebarColumnDividerSx } from "../../../utils/settingsSidebarTabStyles";
import SettingsSidebarNav from "../../../components/SettingsSidebarNav";
import {
  disableAlerts,
  fetchAlertsDisplayStatus,
  selectAlertsDisplayError,
  selectAlertsDisplayLoading,
  selectAlertsDisplayToggles,
  selectAlertsDisplayUpdating,
  selectAlertsDisplayUpdateError,
} from "../../../redux/slice/settingsslice/alerts/alertsDisplaySlice";
import { fetchAlertTypes } from "../../../redux/slice/dashboard/alertsSlice";
import {
  dispatchFetchAlertTypesOnce,
  invalidateAlertTypesBootstrap,
} from "../../../../../shared/utils/bootstrapFetchGuards";

const ALERT_TYPES_ORDER = [
  "Ballast Failure",
  "Device Not Responding",
  "Lamp Failure",
  "Processor Not Responding",
  "Other Warnings",
];

const normalizeType = (type) => (type ? String(type).toLowerCase() : "");

const AlertsComponent = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const settingsSidebarMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const appTheme = useSelector(selectApplicationTheme);
  const contentColor = appTheme?.application_theme?.content || "#ffffff";
  const isDefaultWhiteTheme = isLightSurface(contentColor);

  const { role } = UseAuth();
  const visibleSidebarItemsWithPaths = getVisibleSidebarItemsWithPaths(role);

  const toggles = useSelector(selectAlertsDisplayToggles);
  const loading = useSelector(selectAlertsDisplayLoading);
  const updating = useSelector(selectAlertsDisplayUpdating);
  const error = useSelector(selectAlertsDisplayError);
  const updateError = useSelector(selectAlertsDisplayUpdateError);

  const togglesByType = useMemo(() => {
    const map = new Map();
    for (const t of toggles) map.set(normalizeType(t.alert_type), Boolean(t.display));
    return map;
  }, [toggles]);

  // Keep track of switch interactions to prevent rapid-fire toggles.
  const [locallyUpdatingType, setLocallyUpdatingType] = useState(null);

  useEffect(() => {
    // Only Superadmin can change visibility; route guard should cover this,
    // but we keep it defensive.
    if (role && role.toLowerCase() !== "superadmin" && role.toLowerCase() !== "super admin") return;
    dispatch(fetchAlertsDisplayStatus());
  }, [dispatch, role]);

  if (!role) return null;
  if (role.toLowerCase() !== "superadmin" && role.toLowerCase() !== "super admin") return null;

  const handleToggleChange = async (alertType) => {
    if (updating || locallyUpdatingType) return;

    setLocallyUpdatingType(alertType);

    try {
      // Backend persists global "future visibility" via disable_alerts.
      // For a proper toggle, send the *desired next* display state:
      //   - if currently Off (display:false) -> send display:true (turn On)
      //   - if currently On  (display:true)  -> send display:false (turn Off)
      const currentDisplay = Boolean(togglesByType.get(normalizeType(alertType)));
      const desiredDisplay = !currentDisplay;

      await dispatch(disableAlerts({ alert_type: alertType, display: desiredDisplay })).unwrap();
      await dispatch(fetchAlertsDisplayStatus());
      // Keep Alerts page filter in sync with Settings visibility toggles.
      invalidateAlertTypesBootstrap();
      dispatchFetchAlertTypesOnce(dispatch, fetchAlertTypes, { force: true });
    } finally {
      setLocallyUpdatingType(null);
    }
  };

  return (
    <Grid container className="settings-layout-root" sx={{ ml: '18px', p: '18px', alignItems: 'flex-start' }}>
      {/* Full-width header (title + 2 horizontal dividers) */}
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

      {/* Sidebar — match Manage Area Groups (ManageAreaGroup.jsx) */}
      <Grid
        item
        xs={12}
        md={2}
        sx={{
          ...settingsSidebarColumnDividerSx(isDefaultWhiteTheme, settingsSidebarMdUp),
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
            <Box
              sx={{
                backgroundColor: "#fff",
                borderRadius: { xs: "4px", sm: "6px", md: "8px", lg: "10px" },
                p: { xs: 0.5, sm: 0.8, md: 1.2, lg: 1.5 },
                width: "100%",
                height: "auto",
                minHeight: "fit-content",
                overflow: "visible",
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 0.5 }}>
                <Typography variant="h4" sx={{ fontWeight: "bold", fontSize: { xs: "14px", sm: "16px", md: "18px" } }}>
                  Alerts Visibility
                </Typography>
              </Box>
              <Typography sx={{ mb: 1, color: theme.palette.text.secondary, fontSize: { xs: 12, sm: 13, md: 14 } }}>
                Choose which alert types you want to monitor.
              </Typography>

              {loading && (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress />
                </Box>
              )}

              {error && !loading && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {!loading && !error && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                  {ALERT_TYPES_ORDER.map((alertType) => {
                    const checked = Boolean(togglesByType.get(normalizeType(alertType)));
                    const isUpdatingThis = locallyUpdatingType === alertType && updating;

                    return (
                      <Box
                        key={alertType}
                        sx={{
                          width: "100%",
                          py: 1.2,
                          px: 1,
                          borderBottom: "1px solid #eaeaea",
                        }}
                      >
                        <FormControlLabel
                          sx={{ m: 0, alignItems: "center", gap: 1 }}
                          control={
                            <Checkbox
                              checked={checked}
                              disabled={Boolean(isUpdatingThis)}
                              onChange={() => handleToggleChange(alertType)}
                              disableRipple
                              inputProps={{ "aria-label": alertType }}
                              size="small"
                            />
                          }
                          label={
                            <Typography sx={{ fontSize: { xs: 12, sm: 13, md: 14 }, fontWeight: 500 }}>
                              {alertType}
                            </Typography>
                          }
                        />
                      </Box>
                    );
                  })}
                </Box>
              )}

              {updateError && !loading && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {updateError}
                </Alert>
              )}
            </Box>
          </Grid>
    </Grid>
  );
};

export default AlertsComponent;


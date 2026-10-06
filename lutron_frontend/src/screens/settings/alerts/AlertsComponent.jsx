import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Grid,
  Typography,
  Switch,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import { UseAuth, getVisibleSidebarItemsWithPaths } from "../../../customhooks/UseAuth";
import {
  disableAlerts,
  fetchAlertsDisplayStatus,
  selectAlertsDisplayError,
  selectAlertsDisplayLoading,
  selectAlertsDisplayToggles,
  selectAlertsDisplayUpdating,
  selectAlertsDisplayUpdateError,
} from "../../../redux/slice/settingsslice/alerts/alertsDisplaySlice";

const ALERT_TYPES_ORDER = [
  "Processor Not Responding",
  "Device Not Responding",
  "Ballast Failure",
  "Lamp Failure",
  "Other Warnings",
];

const normalizeType = (type) => (type ? String(type).toLowerCase() : "");

/** Red track/thumb when off, green when on (MUI Switch). */
const alertsVisibilitySwitchSx = {
  "& .MuiSwitch-switchBase": {
    color: "#e53935",
  },
  "& .MuiSwitch-switchBase + .MuiSwitch-track": {
    backgroundColor: "#ffcdd2",
    opacity: 1,
  },
  "& .MuiSwitch-switchBase.Mui-checked": {
    color: "#43a047",
  },
  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
    backgroundColor: "#a5d6a7",
    opacity: 1,
  },
  "& .MuiSwitch-switchBase.Mui-disabled": {
    color: "#bdbdbd",
  },
  "& .MuiSwitch-switchBase.Mui-disabled + .MuiSwitch-track": {
    backgroundColor: "#e0e0e0",
    opacity: 1,
  },
};

const AlertsComponent = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

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
    } finally {
      setLocallyUpdatingType(null);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", p: { xs: 0.3, sm: 0.5, md: 1, lg: 1.5 }, position: "relative" }}>
      <Box sx={{ width: "100%", mx: "auto", px: { xs: 0.3, sm: 0.5, md: 1, lg: 1.5 } }}>
        <Grid container spacing={{ xs: 0.3, sm: 0.5, md: 1, lg: 1 }}>
          <Grid item xs={12} md={3} sx={{ order: { xs: 1, md: 1 }, p: { xs: 0.3, sm: 0.5, md: 1, lg: 1.5 }, borderRadius: { xs: "4px", lg: "8px" }, mb: { xs: 0.3, lg: 0 } }}>
            <Typography
              variant="h6"
              sx={{
                mb: { xs: 0.8, sm: 1, md: 1.5, lg: 2 },
                color: theme.palette.text.secondary,
                fontSize: { xs: "12px", sm: "14px", md: "16px", lg: "20px" },
              }}
            >
              Settings
            </Typography>

            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                flexWrap: "nowrap",
                gap: 0,
                justifyContent: "flex-start",
                alignItems: "stretch",
              }}
            >
              {visibleSidebarItemsWithPaths.map((item) => (
                <Box
                  key={item.label}
                  onClick={() => {
                    if (item.path) navigate(item.path);
                  }}
                  sx={{
                    backgroundColor:
                      location.pathname === item.path ? theme.palette.custom?.containerBg || "#f5f5f5" : "transparent",
                    color:
                      location.pathname === item.path ? theme.palette.text.primary : theme.palette.text.secondary,
                    px: 1.5,
                    py: 0.8,
                    borderRadius: "4px",
                    mb: 0.8,
                    fontSize: { xs: "9px", sm: "10px", md: "12px", lg: "14px" },
                    fontWeight: location.pathname === item.path ? 600 : 400,
                    cursor: "pointer",
                    textAlign: "left",
                    whiteSpace: "nowrap",
                    "&:hover": {
                      backgroundColor: theme.palette.custom?.containerBg || "#f5f5f5",
                    },
                  }}
                >
                  {item.label}
                </Box>
              ))}
            </Box>
          </Grid>

          <Grid item xs={12} lg={9} sx={{ order: { xs: 2, lg: 2 } }}>
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
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          py: 1.2,
                          px: 1,
                          borderBottom: "1px solid #eaeaea",
                        }}
                      >
                        <Typography sx={{ fontSize: { xs: 12, sm: 13, md: 14 }, fontWeight: 500 }}>
                          {alertType}
                        </Typography>
                        <Switch
                          checked={checked}
                          disabled={Boolean(isUpdatingThis)}
                          onChange={() => handleToggleChange(alertType)}
                          inputProps={{ "aria-label": alertType }}
                          sx={alertsVisibilitySwitchSx}
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
      </Box>
    </Box>
  );
};

export default AlertsComponent;


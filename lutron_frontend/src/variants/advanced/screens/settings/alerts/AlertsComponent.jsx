import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Typography,
  Switch,
  CircularProgress,
  Alert,
} from "@mui/material";

import { UseAuth } from "../../../customhooks/UseAuth";
import SettingsLayout from "../SettingsLayout";
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

  const { role } = UseAuth();

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
      invalidateAlertTypesBootstrap();
      dispatchFetchAlertTypesOnce(dispatch, fetchAlertTypes, { force: true });
    } finally {
      setLocallyUpdatingType(null);
    }
  };

  return (
    <SettingsLayout>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 0.5 }}>
                <Typography variant="h4" sx={{ fontWeight: "bold", fontSize: { xs: "14px", sm: "16px", md: "18px" } }}>
                  Alerts Visibility
                </Typography>
              </Box>
              <Typography sx={{ mb: 1, color: 'var(--settings-panel-muted-text, rgba(0, 0, 0, 0.6))', fontSize: { xs: 12, sm: 13, md: 14 } }}>
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
    </SettingsLayout>
  );
};

export default AlertsComponent;


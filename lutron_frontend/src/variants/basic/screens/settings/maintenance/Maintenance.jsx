import React, { useCallback, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  FormGroup,
  Snackbar,
  Typography,
} from "@mui/material";
import FileDownloadOutlined from "@mui/icons-material/FileDownloadOutlined";
import { useSelector } from "react-redux";

import SettingsLayout from "../SettingsLayout";
import { BaseUrl } from "../../../BaseUrl";
import { selectApplicationTheme } from "../../../redux/slice/theme/themeSlice";
import { isLightSurface } from "../../../utils/themeOnSurface";
import { getThemeButtonColor } from "../../../utils/themePageBackground";
import {
  DEVICE_TYPE_OPTIONS,
  OCCUPANCY_TYPE_OPTION,
  downloadCsvFile,
  formatPartialProcessorsWarning,
  getMaintenanceErrorMessage,
  isOccupancyReportSelected,
  onCategoryToggle,
} from "../../../../../shared/settings/maintenanceReport";

const Maintenance = () => {
  const appTheme = useSelector(selectApplicationTheme);
  const backgroundColor = appTheme?.application_theme?.background || "#ffffff";
  const contentColor = appTheme?.application_theme?.content || "#f5f5f5";

  const isLightChrome = isLightSurface(contentColor);
  const buttonColor = getThemeButtonColor(appTheme?.application_theme?.button, backgroundColor);
  const textColor = isLightChrome ? "#111827" : "#ffffff";
  const mutedColor = isLightChrome ? "#6b7280" : "#cbd5e1";

  const [selectedTypes, setSelectedTypes] = useState(["devices"]);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const occupancySelected = isOccupancyReportSelected(selectedTypes);

  const showSnackbar = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleCategoryToggle = (value) => {
    setSelectedTypes((current) => onCategoryToggle(current, value));
    setDownloadError(null);
  };

  const handleDownload = async () => {
    if (!selectedTypes.length) {
      setDownloadError("Select at least one report category.");
      return;
    }

    setDownloading(true);
    setDownloadError(null);

    try {
      const response = await BaseUrl.post("/settings/maintenance", {
        types: selectedTypes,
      });

      const data = response.data;
      if (!data?.csv) {
        throw new Error("Maintenance report did not include CSV data.");
      }

      downloadCsvFile(data.csv, data.filename);

      if (data.status === "partial") {
        const warning = formatPartialProcessorsWarning(data.processors_not_responding);
        if (warning) {
          showSnackbar(warning, "warning");
        } else {
          showSnackbar("Maintenance report downloaded successfully.", "success");
        }
      } else {
        showSnackbar("Maintenance report downloaded successfully.", "success");
      }
    } catch (err) {
      const message = getMaintenanceErrorMessage(err);
      setDownloadError(message);
      showSnackbar(message, "error");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <SettingsLayout>
      <Box
        className="basic-maintenance-page"
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1.25,
          p: { xs: 1, sm: 1.25, md: 1.5 },
          maxWidth: 980,
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.25 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: "bold",
                fontSize: { xs: "14px", sm: "16px", md: "18px" },
                color: textColor,
              }}
            >
              Maintenance Report
            </Typography>
          </Box>
          <Typography
            sx={{
              mb: 0.5,
              color: mutedColor,
              fontSize: { xs: 12, sm: 13, md: 14 },
            }}
          >
            Generate a live report from all processors. Select device categories or area occupancy mode.
          </Typography>
        </Box>

        <Box
          sx={
            isLightChrome
              ? {
                  borderRadius: 2,
                  border: "1px solid var(--users-border, #C5CDD8)",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
                  backgroundColor: "var(--users-table-container-bg, #ffffff)",
                  overflow: "hidden",
                }
              : {
                  borderRadius: 2,
                  border: "1px solid rgba(255,255,255,0.18)",
                  backgroundColor: "rgba(255,255,255,0.04)",
                  overflow: "hidden",
                }
          }
        >
          <Box
            sx={
              isLightChrome
                ? {
                    px: { xs: 2, sm: 2.5 },
                    py: 1.25,
                    backgroundColor: "#0d6ebc",
                    borderBottom: "1px solid #0a5a9c",
                  }
                : {
                    px: 2,
                    py: 1.25,
                    borderBottom: "1px solid rgba(255,255,255,0.12)",
                  }
            }
          >
            <Typography
              sx={{
                color: isLightChrome ? "#ffffff" : textColor,
                fontWeight: "bold",
                fontSize: { xs: 12, sm: 13, md: 14 },
              }}
            >
              Device Categories
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
              p: { xs: 1.5, sm: 2 },
            }}
          >
            <FormGroup>
              {DEVICE_TYPE_OPTIONS.map((opt) => (
                <FormControlLabel
                  key={opt.value}
                  control={
                    <Checkbox
                      checked={selectedTypes.includes(opt.value)}
                      onChange={() => handleCategoryToggle(opt.value)}
                      disabled={occupancySelected}
                      size="small"
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: { xs: 12, sm: 13, md: 14 }, fontWeight: 500, color: textColor }}>
                      {opt.label}
                    </Typography>
                  }
                  sx={{ m: 0, alignItems: "center", gap: 1 }}
                />
              ))}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={occupancySelected}
                    onChange={() => handleCategoryToggle(OCCUPANCY_TYPE_OPTION.value)}
                    disabled={selectedTypes.some((type) => type !== OCCUPANCY_TYPE_OPTION.value)}
                    size="small"
                  />
                }
                label={
                  <Typography sx={{ fontSize: { xs: 12, sm: 13, md: 14 }, fontWeight: 500, color: textColor }}>
                    {OCCUPANCY_TYPE_OPTION.label}
                  </Typography>
                }
                sx={{ m: 0, alignItems: "center", gap: 1 }}
              />
            </FormGroup>

            {occupancySelected && (
              <Typography sx={{ color: mutedColor, fontSize: { xs: 11, sm: 12, md: 13 } }}>
                Occupancy mode reports may take a few minutes to complete.
              </Typography>
            )}

            {downloadError && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {downloadError}
              </Alert>
            )}
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              px: { xs: 1.5, sm: 2 },
              py: 1,
              borderTop: isLightChrome
                ? "1px solid var(--users-border, #C5CDD8)"
                : "1px solid rgba(255,255,255,0.12)",
              backgroundColor: isLightChrome ? "#f8fafc" : "transparent",
            }}
          >
            <Button
              variant="contained"
              onClick={handleDownload}
              disabled={downloading || !selectedTypes.length}
              startIcon={downloading ? <CircularProgress size={18} color="inherit" /> : <FileDownloadOutlined />}
              sx={{
                backgroundColor: buttonColor,
                color: "#fff",
                textTransform: "none",
                "&:hover": {
                  backgroundColor: buttonColor,
                  filter: "brightness(0.95)",
                },
              }}
            >
              {downloading ? "Preparing Report…" : "Download Report"}
            </Button>
          </Box>
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        autoHideDuration={5000}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </SettingsLayout>
  );
};

export default Maintenance;

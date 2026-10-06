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
import { darken } from "@mui/material/styles";

import SettingsLayout from "../SettingsLayout";
import { BaseUrl } from "../../../BaseUrl";
import { selectApplicationTheme } from "../../../redux/slice/theme/themeSlice";
import { getThemeButtonColor } from "../../../utils/themePageBackground";
import { isLightSurface } from "../../../utils/themeOnSurface";
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

  const panelText = "var(--settings-panel-text, #111827)";
  const panelMuted = "var(--settings-panel-muted-text, #6b7280)";

  const buttonColor = getThemeButtonColor(appTheme?.application_theme?.button, backgroundColor);
  // Theme accent for checkbox border/check — avoid near-white accents on light panels.
  const checkboxColor = (() => {
    const button = String(buttonColor || "").trim();
    const background = String(backgroundColor || "").trim();
    if (button && !isLightSurface(button)) return button;
    if (background && !isLightSurface(background)) return background;
    return button || "#374151";
  })();

  const checkboxSx = {
    color: checkboxColor,
    p: 0.5,
    "&.Mui-checked": { color: checkboxColor },
    "&.MuiCheckbox-indeterminate": { color: checkboxColor },
    "&.Mui-disabled": { color: checkboxColor, opacity: 0.4 },
    "& .MuiSvgIcon-root": { fontSize: 20 },
  };

  // Match Advanced Alerts / Processors settings typography (theme Roboto; no custom stack).
  const titleSx = {
    fontWeight: "bold",
    fontSize: { xs: "14px", sm: "16px", md: "18px" },
  };
  const bodyMutedSx = {
    mb: 1,
    color: panelMuted,
    fontSize: { xs: 12, sm: 13, md: 14 },
  };
  const sectionHeadingSx = {
    fontWeight: "bold",
    fontSize: { xs: 12, sm: 13, md: 14 },
    color: panelText,
  };
  const categoryLabelSx = {
    color: panelText,
    alignItems: "center",
    ml: 0,
    mr: 0,
    "& .MuiFormControlLabel-label": {
      fontSize: { xs: 12, sm: 13, md: 14 },
      fontWeight: 500,
    },
  };
  const hintSx = {
    color: panelMuted,
    fontSize: { xs: 11, sm: 12, md: 13 },
  };
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
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          p: 2,
          maxWidth: 980,
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 0.5 }}>
            <Typography variant="h4" sx={titleSx}>
              Maintenance Report
            </Typography>
          </Box>
          <Typography sx={bodyMutedSx}>
            Generate a live report from all processors. Select device categories or area occupancy mode.
          </Typography>
        </Box>

        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "var(--settings-panel-border, #e5e7eb)",
            backgroundColor: "var(--settings-panel-inner-bg, #ffffff)",
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Typography sx={sectionHeadingSx}>
              Device Categories
            </Typography>

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
                      sx={checkboxSx}
                    />
                  }
                  label={opt.label}
                  sx={categoryLabelSx}
                />
              ))}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={occupancySelected}
                    onChange={() => handleCategoryToggle(OCCUPANCY_TYPE_OPTION.value)}
                    disabled={selectedTypes.some((type) => type !== OCCUPANCY_TYPE_OPTION.value)}
                    size="small"
                    sx={checkboxSx}
                  />
                }
                label={OCCUPANCY_TYPE_OPTION.label}
                sx={categoryLabelSx}
              />
            </FormGroup>

            {occupancySelected && (
              <Typography sx={hintSx}>
                Occupancy mode reports may take a few minutes to complete.
              </Typography>
            )}

            {downloadError && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {downloadError}
              </Alert>
            )}
          </Box>

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
            <Button
              variant="contained"
              onClick={handleDownload}
              disabled={downloading || !selectedTypes.length}
              startIcon={downloading ? <CircularProgress size={18} color="inherit" /> : <FileDownloadOutlined />}
              sx={{
                backgroundColor: buttonColor,
                color: "#fff",
                textTransform: "none",
                "&:hover": { backgroundColor: darken(buttonColor, 0.12) },
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

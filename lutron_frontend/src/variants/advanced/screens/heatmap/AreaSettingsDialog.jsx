import React, { useEffect, useState, useMemo, useRef } from "react";
import { createSingleFlight } from "../../../../shared/utils/createSingleFlight";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, CircularProgress, OutlinedInput, Select, MenuItem, Slider, TextField
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import {
  
  fetchLockStatus,
  updateLockStatus,
  selectAreaSettings,
  selectAreaSettingsLoading,
  selectAreaSettingsLockLoading,
  selectLockStatus,
  fetchOccupancyMode,
  updateOccupancyMode,
  selectOccupancy,
  fetchAreaScenes,
  fetchSceneStatus,
  editScene,
  selectAreaScenes,
  selectSceneStatus,
  selectEditSceneLoading,
  fetchTunningSettings,
  updateZoneTuning,
  selectTunningZones,
  selectTunningSettingsLoading,
  selectZoneTuningUpdateLoading,
} from "../../redux/slice/settingsslice/heatmap/areaSettingsSlice";
import { normalizeOccupancyModeString } from "../../redux/slice/settingsslice/heatmap/occupancyModeUtils";
import { fetchAreaStatus, updateAreaScene, selectAreaStatus } from "../../redux/slice/settingsslice/heatmap/HeatmapSlice";
import { useMediaQuery, useTheme } from "@mui/material";
import { selectApplicationTheme } from "../../redux/slice/theme/themeSlice";
import { isWhiteAreaPickerChrome } from "../../utils/themeOnSurface";
import { BaseUrl } from "../../BaseUrl";
import Swal from "sweetalert2";
import tuningSettingsIcon from "../../assets/images/tuning-settings-icon.jpg";
import { getThemeButtonColor, usesGoldPageTheme, usesTheme4PageGradient } from '../../utils/themePageBackground';

/** High End trim allowed range (inclusive) for tuning save */
const HIGH_END_TRIM_MIN = 56;
const HIGH_END_TRIM_MAX = 100;

/** Must sit above app chrome: TopbarComponent outer Box uses z-index 10002; mobile Drawer uses 10003. MUI Dialog defaults to ~1300. */
const AREA_SETTINGS_DIALOG_Z_INDEX = 11000;

const AREA_SETTINGS_BLUE = "#3d4a5c";
const AREA_SETTINGS_SECTION_BG = "var(--heatmap-dialog-section-bg, #3d4a5c)";
/** White inner cards (zone sliders, tuning inputs) inside area settings sections */
const ASD_ZONE_CARD_BG = "var(--heatmap-dialog-zone-card-bg, #ffffff)";
/** Text on white zone cards / tuning inputs inside area settings dialog */
const ZONE_CARD_TEXT_COLOR = "#111";
const ZONE_CARD_MUTED_TEXT_COLOR = "#3d4a5c";

const ASD_ZONE_VALUE_CHIP_SX = {
  color: `${ZONE_CARD_TEXT_COLOR} !important`,
  WebkitTextFillColor: ZONE_CARD_TEXT_COLOR,
  backgroundColor: "#f5f5f5",
  px: 0.3,
  py: 0.1,
  borderRadius: 0.5,
  border: "1px solid #ddd",
  textAlign: "center",
  flexShrink: 0,
  cursor: "text",
  lineHeight: 1.4,
  "& .MuiInputBase-root": {
    color: `${ZONE_CARD_TEXT_COLOR} !important`,
  },
  "& .MuiInputBase-input": {
    color: `${ZONE_CARD_TEXT_COLOR} !important`,
    WebkitTextFillColor: ZONE_CARD_TEXT_COLOR,
    caretColor: ZONE_CARD_TEXT_COLOR,
  },
  "& .MuiInput-input": {
    color: `${ZONE_CARD_TEXT_COLOR} !important`,
  },
};

const ASD_ZONE_VALUE_INPUT_PROPS = {
  inputMode: "numeric",
  pattern: "[0-9]*",
  style: {
    textAlign: "center",
    fontWeight: 700,
    fontSize: 10,
    color: ZONE_CARD_TEXT_COLOR,
    WebkitTextFillColor: ZONE_CARD_TEXT_COLOR,
  },
};

/** Heatmap area sidebar + settings dialog palette (Schedule Details / Add Event alignment). */
export const HEATMAP_AREA_SIDEBAR = {
  panelBg: "var(--heatmap-sidebar-panel-bg, #d6dde8)",
  panelBorder: "var(--heatmap-sidebar-panel-border, #b8c5d6)",
  sectionBg: "var(--heatmap-sidebar-section-bg, #4a586c)",
  sectionText: "var(--heatmap-sidebar-section-text, #ffffff)",
  panelLabel: "var(--heatmap-sidebar-panel-label, #1a2a42)",
  sectionLabelBg: "var(--heatmap-sidebar-section-label-bg, rgba(0, 0, 0, 0.12))",
  loadingOverlayBg:
    "var(--heatmap-sidebar-loading-overlay-bg, rgba(214, 221, 232, 0.85))",
};

/** Spinner on heatmap sidebar / settings — avoids default MUI primary blue. */
export const HEATMAP_SIDEBAR_SPINNER_SX = {
  color: "var(--heatmap-sidebar-loading-spinner-color, #4a586c)",
};

export const HEATMAP_SETTINGS_DIALOG_PAPER_BG =
  "var(--heatmap-dialog-paper-bg, #d6dde8)";

/** Typography / buttons aligned with heatmap right panel (`HeatMap.jsx` status sidebar) */
const ASD_DIALOG_TITLE_SX_DARK = {
  fontWeight: 700,
  fontSize: { xs: 11, sm: 12, md: 13, lg: 14 },
  bgcolor: AREA_SETTINGS_BLUE,
  color: "#fff",
  lineHeight: 1.2,
  letterSpacing: 0.3,
};
const ASD_DIALOG_TITLE_SX_LIGHT = {
  ...ASD_DIALOG_TITLE_SX_DARK,
  bgcolor: "#fff",
  color: "#111",
};
/** @deprecated alias — heatmap area dialogs use dark chrome */
const ASD_DIALOG_TITLE_SX = ASD_DIALOG_TITLE_SX_DARK;
const ASD_SECTION_TITLE_SX = {
  fontWeight: 700,
  fontSize: { xs: 13, sm: 14, md: 15 },
  color: "#fff",
  lineHeight: 1.2,
};
/** Occupancy mode pills inside settings dialog — must beat theme `MuiButton-contained !important` rules. */
const asdOccupancyModeBtnSx = (isSelected, buttonColor) => {
  const accent = buttonColor || "var(--app-button, #3d4a5c)";
  if (isSelected) {
    return {
      borderRadius: "999px",
      fontWeight: 700,
      fontSize: 13,
      textTransform: "uppercase",
      px: 2,
      minWidth: 0,
      boxShadow: "none !important",
      backgroundImage: "none !important",
      background: `${accent} !important`,
      backgroundColor: `${accent} !important`,
      color: "#ffffff !important",
      WebkitTextFillColor: "#ffffff",
      border: `2px solid #ffffff !important`,
      outline: `2px solid ${accent}`,
      outlineOffset: 0,
      filter: "none !important",
      opacity: "1 !important",
      "&:hover": {
        background: `${accent} !important`,
        backgroundColor: `${accent} !important`,
        backgroundImage: "none !important",
        color: "#ffffff !important",
        WebkitTextFillColor: "#ffffff",
        border: `2px solid #ffffff !important`,
        opacity: "1 !important",
        filter: "none !important",
      },
    };
  }
  return {
    borderRadius: "999px",
    fontWeight: 700,
    fontSize: 13,
    textTransform: "uppercase",
    px: 2,
    minWidth: 0,
    boxShadow: "none !important",
    backgroundImage: "none !important",
    background: "#ffffff !important",
    backgroundColor: "#ffffff !important",
    /* Near-black on white — readable on dark section chrome regardless of theme accent */
    color: "#111111 !important",
    WebkitTextFillColor: "#111111",
    border: `2px solid ${accent} !important`,
    outline: "none",
    filter: "none !important",
    opacity: "1 !important",
    "&:hover": {
      background: "#f3f3f3 !important",
      backgroundColor: "#f3f3f3 !important",
      backgroundImage: "none !important",
      color: "#111111 !important",
      WebkitTextFillColor: "#111111",
      border: `2px solid ${accent} !important`,
      opacity: "1 !important",
      filter: "none !important",
    },
  };
};
const ASD_APPLY_BTN_SX = {
  background: "#222",
  color: "#fff",
  borderRadius: 2,
  fontSize: { xs: 10, sm: 11, md: 12 },
  fontWeight: 400,
  px: { xs: 1.5, md: 2 },
  py: { xs: 0.3, md: 0.5 },
  textTransform: "none",
  boxShadow: 1,
  "&:hover": { background: "#111" },
};
/** Matches `EmailServer.jsx` Cancel on light settings forms. */
const ASD_SETTINGS_FORM_CANCEL_BTN_SX_LIGHT = {
  textTransform: "none",
  backgroundColor: "#fff",
  color: "#1565C0",
  borderColor: "#1565C0",
  "&:hover": { borderColor: "#0d47a1", backgroundColor: "rgba(21, 101, 192, 0.06)" },
};
/** Outlined cancel on dark heatmap panels (matches right sidebar). */
const ASD_SETTINGS_FORM_CANCEL_BTN_SX_DARK = {
  textTransform: "none",
  backgroundColor: "transparent",
  color: "#fff",
  borderColor: "rgba(255, 255, 255, 0.85)",
  "&:hover": { borderColor: "#fff", backgroundColor: "rgba(255, 255, 255, 0.1)" },
};
const ASD_SETTINGS_FORM_CANCEL_BTN_SX = ASD_SETTINGS_FORM_CANCEL_BTN_SX_DARK;
const ASD_SELECT_INPUT_FS = { xs: 11, sm: 12, md: 13 };

/** Shared outlined field styling (Select / TextField) inside area dialogs */
export const ASD_OUTLINED_FIELD_SX = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "#fff",
    borderRadius: "2px",
    height: { xs: 32, md: 36 },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "#ddd",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "#bbb",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderWidth: "1px",
      borderColor: AREA_SETTINGS_BLUE,
    },
  },
  "& .MuiOutlinedInput-input": {
    fontSize: ASD_SELECT_INPUT_FS,
    fontWeight: 400,
    color: "#111",
    py: { xs: 0.6, md: 0.75 },
  },
  "& .MuiInputLabel-root": {
    fontSize: ASD_SELECT_INPUT_FS,
    fontWeight: 400,
    color: "rgba(0, 0, 0, 0.6)",
    bgcolor: "#fff",
    px: 0.5,
    "&.Mui-focused": { color: AREA_SETTINGS_BLUE },
  },
  "& .MuiOutlinedInput-notchedOutline legend": {
    fontSize: "0.75em",
  },
};

/** Rename-area modal input (label is a separate Typography above the field). */
export const ASD_RENAME_FIELD_SX = {
  mt: 0,
  "& .MuiOutlinedInput-root": {
    bgcolor: "var(--heatmap-rename-dialog-field-bg, rgba(0, 0, 0, 0.22))",
    borderRadius: "8px",
    color: "var(--heatmap-rename-dialog-field-text, #fff)",
    "& fieldset": {
      borderColor: "var(--heatmap-rename-dialog-field-border, rgba(255, 255, 255, 0.45))",
    },
    "&:hover fieldset": {
      borderColor: "var(--heatmap-rename-dialog-field-border, rgba(255, 255, 255, 0.6))",
    },
    "&.Mui-focused fieldset": {
      borderColor: "var(--heatmap-rename-dialog-field-border, rgba(255, 255, 255, 0.85))",
      borderWidth: "1px",
    },
  },
  "& .MuiOutlinedInput-input": {
    color: "var(--heatmap-rename-dialog-field-text, #fff)",
    fontSize: ASD_SELECT_INPUT_FS,
    py: { xs: 1, md: 1.1 },
  },
};

export const asdRenameSaveBtnSx = (panelBg = AREA_SETTINGS_BLUE) => ({
  textTransform: "none",
  bgcolor: "#fff",
  color: panelBg,
  borderRadius: "8px",
  fontWeight: 600,
  fontSize: { xs: 11, sm: 12, md: 13 },
  px: { xs: 2, md: 2.5 },
  py: { xs: 0.5, md: 0.65 },
  boxShadow: "none",
  minWidth: 0,
  "&:hover": { bgcolor: "#f2f2f2" },
  "&.Mui-disabled": { bgcolor: "rgba(255,255,255,0.5) !important", color: "rgba(0,0,0,0.4)" },
});

export {
  ASD_DIALOG_TITLE_SX,
  ASD_DIALOG_TITLE_SX_DARK,
  ASD_DIALOG_TITLE_SX_LIGHT,
  ASD_SECTION_TITLE_SX,
  ASD_SETTINGS_FORM_CANCEL_BTN_SX,
  ASD_SETTINGS_FORM_CANCEL_BTN_SX_DARK,
  ASD_SETTINGS_FORM_CANCEL_BTN_SX_LIGHT,
  ASD_SELECT_INPUT_FS,
  ASD_APPLY_BTN_SX,
  AREA_SETTINGS_BLUE,
};

/** Row from `/area/scene_list` may use `scene_id` and/or `id`. */
function getAreaSceneRowId(sceneRow) {
  if (!sceneRow) return null;
  const raw =
    sceneRow.scene_id != null && sceneRow.scene_id !== ""
      ? sceneRow.scene_id
      : sceneRow.id;
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

// Normalize zone fields coming from backend (strings vs numbers, casing, extra spaces).
const normalizeZoneName = (name) => (name ?? "").toString().trim().toLowerCase();
const normalizeZoneType = (type) =>
  (type ?? "").toString().trim().toLowerCase().replace(/[\s_-]/g, "");

// Helper functions for zone type detection
const isWhitening = (type) => ['whitening', 'white tune', 'whitetune', 'white_tune', 'White Tune', 'WhiteTune'].includes((type || '').toLowerCase());
const isDimmed = (type) => (type || '').toLowerCase() === 'dimmed';
const isSwitched = (type) => (type || '').toLowerCase() === 'switched';

function TuningSettingsHeaderIcon() {
  return (
    <Box
      component="img"
      src={tuningSettingsIcon}
      alt=""
      sx={{
        width: { xs: 18, sm: 20, md: 22 },
        height: { xs: 18, sm: 20, md: 22 },
        objectFit: "contain",
        flexShrink: 0,
        display: "block",
      }}
      aria-hidden
    />
  );
}

export default function AreaSettingsDialog({ open, onClose, areaId, canUpdateAreaStatus, canModifyDeviceSettings, canViewAreaSettings, canEditScene, currentUserRole, userProfile, selectedFloorId }) {
  const dispatch = useDispatch();
  const runApplySceneOnce = useMemo(() => createSingleFlight(), []);
  const runSaveTuningOnce = useMemo(() => createSingleFlight(), []);
  const theme = useTheme();
  const isSuperAdmin = typeof currentUserRole === 'string' && (
    currentUserRole.toLowerCase().trim() === 'superadmin' ||
    currentUserRole.toLowerCase().trim() === 'super admin'
  );
  
  // Responsive breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // < 600px
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md')); // 600px - 900px
  const isDesktop = useMediaQuery(theme.breakpoints.up('md')); // >= 900px
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg')); // >= 1200px
  const is1440Screen = useMediaQuery('(min-width:1440px)'); // >= 1440px
  const isUltraWide = useMediaQuery(theme.breakpoints.up('xl')); // >= 1920px
  const is2560Screen = useMediaQuery('(min-width:2560px)'); // >= 2560px

  const areaSettings = useSelector(selectAreaSettings);
  const loading = useSelector(selectAreaSettingsLoading);
  const lockLoading = useSelector(selectAreaSettingsLockLoading);
  const { locked, buttoncode } = useSelector(selectLockStatus);
  const { mode: occupancyMode, loading: occupancyLoading } = useSelector(selectOccupancy);
  const areaScenes = useSelector(selectAreaScenes);
  const { details: sceneDetails, loading: sceneStatusLoading } = useSelector(selectSceneStatus);
  const editSceneLoading = useSelector(selectEditSceneLoading);
  const tuningZones = useSelector(selectTunningZones);
  const tunningSettingsLoading = useSelector(selectTunningSettingsLoading);
  const zoneTuningUpdateLoading = useSelector(selectZoneTuningUpdateLoading);
  const areaStatus = useSelector(selectAreaStatus); // Get area status to access zones
  const appTheme = useSelector(selectApplicationTheme);
  const buttonColor = getThemeButtonColor(appTheme?.application_theme?.button, appTheme?.application_theme?.background);
  const themeBackground = appTheme?.application_theme?.background;
  const dialogCloseColor = `var(--heatmap-dialog-close-text, ${buttonColor})`;
  const contentColorForChrome = appTheme?.application_theme?.content || AREA_SETTINGS_BLUE;
  const settingsFormActionBlue = isWhiteAreaPickerChrome(contentColorForChrome) ? "#1565C0" : buttonColor;
  const usesPresetDarkSections =
    usesGoldPageTheme(themeBackground) || usesTheme4PageGradient(themeBackground);
  const asdSceneApplyBtnSx = isWhiteAreaPickerChrome(contentColorForChrome)
    ? {
        ...ASD_APPLY_BTN_SX,
        background: settingsFormActionBlue,
        "&:hover": { background: settingsFormActionBlue },
      }
    : usesPresetDarkSections
      ? {
          ...ASD_APPLY_BTN_SX,
          background: buttonColor,
          color: "#fff",
          "&:hover": { background: buttonColor, opacity: 0.92 },
        }
      : ASD_APPLY_BTN_SX;

  const [selectedScene, setSelectedScene] = useState(null);
  const [sceneZoneValues, setSceneZoneValues] = useState({});
  const [areaZones, setAreaZones] = useState([]); // Store area zones for zone_id mapping
  const modeOptions = ["Disabled", "Auto", "Vacancy"];
  const [localOccupancyMode, setLocalOccupancyMode] = useState("");
  const [pendingOccupancy, setPendingOccupancy] = useState(false);
  const [justAppliedScene, setJustAppliedScene] = useState(false); // Flag to prevent re-initialization after save

  // Tuning Settings (superadmin only): one selected zone + High End trim only
  const [selectedTuningZoneId, setSelectedTuningZoneId] = useState(null);
  const [draftHighEndTrim, setDraftHighEndTrim] = useState('');
  // Avoid re-POST /area/zone_status when fetchAreaStatus updates Redux areaStatus.
  const areaStatusZonesRef = useRef(areaStatus?.zones);
  areaStatusZonesRef.current = areaStatus?.zones;
  // Dedupe /setting/scene_status for the same area+scene while dialog is open.
  const lastSceneStatusKeyRef = useRef('');

  const sanitizeTrimInput = (value) => {
    const s = value === null || value === undefined ? '' : String(value);
    if (s === '') return '';
    const cleaned = s.replace(/[^\d.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length <= 2) return cleaned;
    return `${parts[0]}.${parts.slice(1).join('')}`;
  };

  const trimmedHighEndDraft = String(draftHighEndTrim ?? '').trim();
  const showHighEndRangeWarning =
    trimmedHighEndDraft.length >= 2 &&
    (() => {
      const n = Number(trimmedHighEndDraft);
      return Number.isNaN(n) || n < HIGH_END_TRIM_MIN || n > HIGH_END_TRIM_MAX;
    })();

  const sceneSelectValue = useMemo(() => {
    if (!open || selectedScene == null) return "";
    const n = Number(selectedScene);
    if (!Number.isFinite(n)) return "";
    if (!(areaScenes || []).some((s) => getAreaSceneRowId(s) === n)) return "";
    return n;
  }, [open, selectedScene, areaScenes]);

  // Stale `active_scene` (e.g. 40) vs current scene list (219/220) must not be passed to MUI Select.
  useEffect(() => {
    if (!open) return;
    if (!Array.isArray(areaScenes) || areaScenes.length === 0) return;
    if (selectedScene == null) return;
    const n = Number(selectedScene);
    if (Number.isFinite(n) && areaScenes.some((s) => getAreaSceneRowId(s) === n)) return;
    setSelectedScene(null);
  }, [open, areaScenes, selectedScene]);

  // Prefill editor from backend active scene when it exists in the loaded list.
  useEffect(() => {
    if (!open || !areaId || justAppliedScene) return;
    if (!areaStatus || Number(areaStatus.area_id) !== Number(areaId)) return;
    if (selectedScene != null) return;
    if (!Array.isArray(areaScenes) || areaScenes.length === 0) return;
    const ac = areaStatus.active_scene;
    if (ac == null || ac === "") return;
    const n = Number(ac);
    if (!Number.isFinite(n) || !areaScenes.some((s) => getAreaSceneRowId(s) === n)) return;
    setSelectedScene(n);
  }, [
    open,
    areaId,
    justAppliedScene,
    areaStatus?.area_id,
    areaStatus?.active_scene,
    areaScenes,
    selectedScene,
  ]);


  useEffect(() => {
    if (open && areaId) {
      dispatch(fetchLockStatus(areaId));
      dispatch(fetchOccupancyMode(areaId));
      dispatch(fetchAreaScenes(areaId));
      // HeatMap sidebar already loads full_area_status for the selected area — skip duplicate.
      const areaAlreadyLoaded =
        areaStatus && Number(areaStatus.area_id) === Number(areaId);
      if (!areaAlreadyLoaded) {
        dispatch(fetchAreaStatus(areaId));
      }

      // Reset tuning UI state on open/area change
      setSelectedTuningZoneId(null);
      setDraftHighEndTrim('');
      lastSceneStatusKeyRef.current = '';

      if (isSuperAdmin) {
        dispatch(fetchTunningSettings(areaId));
      }

      setSelectedScene(null);
      setSceneZoneValues({});
    }
  }, [open, areaId, dispatch, isSuperAdmin]);

  // Pick a default zone once tuning data is loaded
  useEffect(() => {
    if (!open || !isSuperAdmin) return;
    if (tuningZones && tuningZones.length > 0) {
      setSelectedTuningZoneId((prev) => prev ?? tuningZones[0].zone_id);
    }
  }, [open, isSuperAdmin, tuningZones]);

  // Populate drafts when the user selects a zone
  useEffect(() => {
    if (!open || !isSuperAdmin) return;
    const zone = tuningZones?.find((z) => Number(z.zone_id) === Number(selectedTuningZoneId));
    if (!zone) return;
    setDraftHighEndTrim(zone.high_end_trim ?? '');
  }, [open, isSuperAdmin, tuningZones, selectedTuningZoneId]);

  // Fetch and store area zones when the dialog opens.
  // This is important after backend reconciliation because `areaStatus.zones` can be temporarily stale.
  useEffect(() => {
    if (!open || !areaId) return;

    let cancelled = false;

    const loadZones = async () => {
      try {
        const res = await BaseUrl.post("/area/zone_status", { area_id: areaId });
        if (!cancelled) {
          setAreaZones(res.data?.zones || []);
        }
      } catch (err) {
        console.error("Failed to fetch zones:", err);
        if (!cancelled) {
          setAreaZones(areaStatusZonesRef.current || []);
        }
      }
    };

    loadZones();

    return () => {
      cancelled = true;
    };
  }, [open, areaId]);

  // When occupancyMode (or area status) changes, keep local state in sync with a canonical label.
  // occupancy_status from floor APIs is *detection* (occupied/unoccupied), not mode; mode comes from occupancy_setting.
  useEffect(() => {
    if (!open) return;

    const nRedux = normalizeOccupancyModeString(occupancyMode);
    const fromStatus =
      areaStatus && Number(areaStatus.area_id) === Number(areaId)
        ? normalizeOccupancyModeString(
            areaStatus.active_mode ?? areaStatus.occupancy_mode
          )
        : "";

    if (pendingOccupancy) {
      const nLocal = normalizeOccupancyModeString(localOccupancyMode);
      if (
        nRedux &&
        nLocal &&
        nRedux.toLowerCase() === nLocal.toLowerCase()
      ) {
        setPendingOccupancy(false);
      }
      return;
    }

    if (nRedux) {
      setLocalOccupancyMode(nRedux);
    } else if (fromStatus) {
      setLocalOccupancyMode(fromStatus);
    }
  }, [occupancyMode, open, pendingOccupancy, areaId, areaStatus]);

  useEffect(() => {
    if (!open) {
      lastSceneStatusKeyRef.current = '';
      return;
    }
    const inList = (id) => {
      if (id == null) return false;
      const n = Number(id);
      if (!Number.isFinite(n)) return false;
      return (areaScenes || []).some((s) => getAreaSceneRowId(s) === n);
    };
    if (selectedScene && areaId && inList(selectedScene)) {
      const key = `${areaId}:${Number(selectedScene)}`;
      if (lastSceneStatusKeyRef.current === key) {
        return;
      }
      lastSceneStatusKeyRef.current = key;
      setSceneZoneValues({});
      dispatch(fetchSceneStatus({ areaId, sceneId: Number(selectedScene) }));
    } else {
      setSceneZoneValues({});
      if (selectedScene == null) {
        lastSceneStatusKeyRef.current = '';
      }
    }
  }, [open, selectedScene, areaId, dispatch, areaScenes]);
  // Helper function to get zone_id from scene detail
  // CRITICAL: Use zone_id from backend response if available, otherwise match by exact name
  // Backend now includes zone_id in the response, so we can use it directly
  const getZoneIdFromSceneDetail = (sceneDetail, areaZones) => {
    // First, try to use zone_id from backend response (most reliable)
    if (sceneDetail.zone_id !== undefined && sceneDetail.zone_id !== null) {
      return sceneDetail.zone_id;
    }
    
    // Fallback: Match by zone name and type using normalized string comparisons.
    // Backend reconciliation may change casing/spacing, so avoid strict equality here.
    if (areaZones.length > 0 && sceneDetail.zone_name) {
      const matchingZone = areaZones.find(z => {
        const nameMatch = normalizeZoneName(z.name) === normalizeZoneName(sceneDetail.zone_name);
        const typeMatch = normalizeZoneType(z.type) === normalizeZoneType(sceneDetail.zone_type);
        return nameMatch && typeMatch;
      });
      
      if (matchingZone && matchingZone.id) {
        return matchingZone.id;
      } else {
        // Log warning if zone not found - this helps debug zone matching issues
        console.warn(`Zone not found: name="${sceneDetail.zone_name}", type="${sceneDetail.zone_type}"`, {
          availableZones: areaZones.map(z => ({ name: z.name, type: z.type, id: z.id }))
        });
      }
    }
    return null;
  };

  // Helper function to generate a unique key for each zone
  // CRITICAL: Use zone_id as the PRIMARY key since it's stable and doesn't change
  // assignment_href can change when backend creates new assignments, but zone_id remains constant
  // This ensures user edits are preserved even when assignment_href changes
  const getZoneKey = (d, idx) => {
    // CRITICAL: Use zone_id as the primary identifier (it's stable)
    // zone_id uniquely identifies each zone and doesn't change when assignments are updated
    const zoneId = d.zone_id;
    
    if (zoneId) {
      // Use zone_id alone as the key - this is stable and won't change
      // Format: "zone_123" where 123 is the zone_id
      return `zone_${zoneId}`;
    }
    
    // Fallback 1: If zone_id is missing, try to get it from areaZones
    if (!zoneId && areaZones.length > 0) {
      const foundZoneId = getZoneIdFromSceneDetail(d, areaZones);
      if (foundZoneId) {
        return `zone_${foundZoneId}`;
      }
    }
    
    // Fallback 2: Use assignment_href if zone_id not available
    // This is less ideal but necessary for backwards compatibility
    const assignmentHref = d.assignment_href || '';
    if (assignmentHref) {
      console.warn(`Using assignment_href as key (zone_id missing) for zone: ${d.zone_name}`, {
        assignment_href: assignmentHref,
        zone_name: d.zone_name
      });
      return assignmentHref;
    }
    
    // Fallback 3: If all else fails, use zone_name + zone_type + index
    // This should never happen in production
    const name = (d.zone_name || '').toString();
    const type = (d.zone_type || '').toString();
    console.error(`Using fallback key for zone: ${name}`, {
      zone_name: name,
      zone_type: type,
      index: idx
    });
    return `fallback_${name}_${type}_${idx}`;
  };

  useEffect(() => {
    // CRITICAL: If we just applied scene changes, don't re-initialize from backend
    // The user's edits are already saved and we don't want to overwrite them with potentially stale backend data
    if (justAppliedScene) {
      setJustAppliedScene(false); // Reset flag
      return;
    }
    
    if (sceneDetails && Array.isArray(sceneDetails) && sceneDetails.length > 0) {
      // Avoid initializing scene zone values until we have a zone list for fallback matching.
      // If backend scene details arrive before `/area/zone_status`, some details might not have `zone_id`.
      const anySceneDetailMissingZoneId = sceneDetails.some((d) => d.zone_id == null);
      if ((!areaZones || areaZones.length === 0) && anySceneDetailMissingZoneId) {
        return;
      }
      
      // CRITICAL: Always reinitialize from backend values when dialog is opened
      // Use zone_id as the key to ensure correct zone matching regardless of order
      setSceneZoneValues(prev => {
        const updated = {};
        const zoneKeys = []; // Track keys to detect duplicates
        const seenZoneIds = new Set(); // Track zone_ids to prevent duplicates
        
      sceneDetails.forEach((d, idx) => {
          // CRITICAL: Get zone_id from scene detail (backend includes it)
          const zoneId = d.zone_id || getZoneIdFromSceneDetail(d, areaZones);
          
          // Validate zone_id exists
          if (!zoneId) {
            console.error('ERROR: Missing zone_id for zone:', d.zone_name, d);
            return; // Skip zones without zone_id
          }
          
          // CRITICAL: Use zone_id as the key (stable, doesn't change)
          const zoneKey = `zone_${zoneId}`;
          
          // Check for duplicate zone_ids (should not happen, but safeguard)
          if (seenZoneIds.has(zoneId)) {
            console.error('ERROR: Duplicate zone_id detected:', zoneId, 'Zone:', d);
            return; // Skip duplicate zones
          }
          seenZoneIds.add(zoneId);
          
          // Check for duplicate keys (should not happen if zone_id is unique)
          if (zoneKeys.includes(zoneKey)) {
            console.error('ERROR: Duplicate zone key detected:', zoneKey, 'Zone:', d);
            return; // Skip this zone
          }
          zoneKeys.push(zoneKey);
          
          // CRITICAL: Always use backend values when initializing from scene details
          // The backend values (fadeTime, delayTime) are the source of truth
          // We should NOT preserve existing state values here because:
          // 1. When dialog opens, we want fresh data from backend
          // 2. When scene changes, we want that scene's values
          // 3. User edits are preserved during editing via handleZoneValueChange
          
          // Get existing values ONLY if they exist and belong to the exact same zone
          // This is for preserving user edits DURING editing session (before Apply)
          const existingValues = prev[zoneKey];
          const shouldPreserveEdit = existingValues && 
                                    existingValues.zone_id === zoneId && 
                                    existingValues.zone_name === d.zone_name;
          
        if (d.zone_type === "switched") {
            // Always use backend value for switched zones
            updated[zoneKey] = {
              on_off: d.SwitchedLevel,
              zone_name: d.zone_name,
              zone_id: zoneId,
              assignment_href: d.assignment_href
            };
        } else if (d.zone_type === "dimmed") {
            // CRITICAL: Always use backend values for fadeTime and delayTime
            // These are the saved values from the backend and should never be overwritten with old state
            // Only brightness can be preserved if user is currently editing
            updated[zoneKey] = {
              brightness: (shouldPreserveEdit && existingValues.brightness !== undefined) 
                ? existingValues.brightness 
                : (d.Level ?? 0),
              fadeTime: d.FadeTime || "02", // ALWAYS from backend - never preserve old state
              delayTime: d.DelayTime || "00", // ALWAYS from backend - never preserve old state
              zone_name: d.zone_name,
              zone_id: zoneId,
              assignment_href: d.assignment_href
            };
            
        } else if (d.zone_type === "whitetune") {
            // CRITICAL: Always use backend values for fadeTime and delayTime
            updated[zoneKey] = {
              brightness: (shouldPreserveEdit && existingValues.brightness !== undefined) 
                ? existingValues.brightness 
                : (d.Level ?? 0),
              cct: (shouldPreserveEdit && existingValues.cct !== undefined)
                ? existingValues.cct
                : (d.WhiteTuningLevel?.Kelvin || 2700),
              fadeTime: d.FadeTime || "02", // ALWAYS from backend - never preserve old state
              delayTime: d.DelayTime || "00", // ALWAYS from backend - never preserve old state
              zone_name: d.zone_name,
              zone_id: zoneId,
              assignment_href: d.assignment_href
            };
            
          }
        });
        
        
        return updated;
      });
    } else if (!sceneDetails || (Array.isArray(sceneDetails) && sceneDetails.length === 0)) {
      // If no scene details, clear the state
      setSceneZoneValues({});
    }
  }, [sceneDetails, areaZones]);

  const handleLockToggle = () => {
    if (!buttoncode || !canModifyDeviceSettings) return;
    dispatch(updateLockStatus({ area_id: areaId, buttoncode }))
      .then(() => dispatch(fetchLockStatus(areaId)));
  };

  const handleOccupancyChange = (mode) => {
    if (!canModifyDeviceSettings) return;
    setLocalOccupancyMode(mode); // highlight immediately
    setPendingOccupancy(true);   // mark as pending
    dispatch(updateOccupancyMode({ areaId, mode }))
      .then(() => {
        dispatch(fetchOccupancyMode(areaId)); // fetch the latest state from backend
      });
  };

  const handleZoneValueChange = (zoneKey, changed) => {
    if (!canEditScene) return;
    
    // Debug: Log which zone is being updated
    const currentValues = sceneZoneValues[zoneKey];
    
    // CRITICAL: Only update the specific zone identified by zoneKey
    // Ensure we're not accidentally updating multiple zones
    setSceneZoneValues(prev => {
      const updated = {
      ...prev,
      [zoneKey]: { ...prev[zoneKey], ...changed },
      };
      
      
      return updated;
    });
  };

  const handleApplyScene = async () => runApplySceneOnce(async () => {
    if (!canEditScene) return;
    
    
    // CRITICAL: Match zones by zone_id explicitly, not by array order
    // This ensures each zone is correctly matched to its updated values regardless of order
    const details = sceneDetails.map((d, idx) => {
      // CRITICAL: Get zone_id from scene detail (backend includes it)
      const zoneId = d.zone_id || getZoneIdFromSceneDetail(d, areaZones);
      
      if (!zoneId) {
        console.error('ERROR: Missing zone_id for zone:', d.zone_name, d);
        return null;
      }
      
      // CRITICAL: Use zone_id to build the key (same as state storage)
      // This ensures we match the correct zone regardless of array order
      const zoneKey = `zone_${zoneId}`;
      const zoneValues = sceneZoneValues[zoneKey];
      
      
      if (!zoneValues) {
        console.error('ERROR: No zone values found for key:', zoneKey);
        console.error('Expected zone_id:', zoneId);
        console.error('Expected zone_name:', d.zone_name);
        console.error('Available keys:', Object.keys(sceneZoneValues));
        console.error('Available zone_ids in state:', Object.values(sceneZoneValues).map(v => v.zone_id));
        return null; // Skip if no values found for this zone
      }
      
      // CRITICAL: Verify we're updating the correct zone by zone_id
      // This is a safety check to ensure zone_id matches
      if (zoneValues.zone_id != null && zoneId != null && Number(zoneValues.zone_id) !== Number(zoneId)) {
        console.error('CRITICAL ERROR: Zone ID mismatch!', {
          expected_zone_id: zoneId,
          found_zone_id: zoneValues.zone_id,
          expected_zone_name: d.zone_name,
          found_zone_name: zoneValues.zone_name,
          zoneKey: zoneKey
        });
        return null; // Don't update wrong zone
      }
      
      // CRITICAL: Verify zone_name matches as well (additional safety check)
      if (zoneValues.zone_name && d.zone_name && zoneValues.zone_name !== d.zone_name) {
        console.warn('Zone name mismatch (but zone_id matches):', {
          zone_id: zoneId,
          expected_name: d.zone_name,
          found_name: zoneValues.zone_name
        });
        // Continue anyway since zone_id is the primary identifier
      }
      
      // CRITICAL: Use the assignment_href from the CURRENT scene detail (d)
      // assignment_href may have changed after backend updates, so always use the latest one
      const assignmentHref = d.assignment_href;
      
      if (!assignmentHref) {
        console.error('ERROR: Missing assignment_href in scene detail:', d);
        return null;
      }
      
      // Log if assignment_href changed (this is normal after updates)
      if (zoneValues.assignment_href && zoneValues.assignment_href !== assignmentHref) {
      }
      
      if (d.zone_type === "switched") {
        return {
          zone_type: "switched",
          SwitchedLevel: zoneValues.on_off,
          assignment_href: assignmentHref, // CRITICAL: Use original from backend
        };
      }
      if (d.zone_type === "dimmed") {
        const result = {
          zone_type: "dimmed",
          Level: zoneValues.brightness,
          FadeTime: zoneValues.fadeTime,
          DelayTime: zoneValues.delayTime,
          assignment_href: assignmentHref, // CRITICAL: Use original from backend
        };
        return result;
      }
      if (d.zone_type === "whitetune") {
        const result = {
          zone_type: "whitetune",
          Level: zoneValues.brightness,
          WhiteTuningLevel: { Kelvin: zoneValues.cct },
          FadeTime: zoneValues.fadeTime,
          DelayTime: zoneValues.delayTime,
          assignment_href: assignmentHref, // CRITICAL: Use original from backend
        };
        return result;
      }
      return null;
    }).filter(Boolean);
    
    // Debug: Log all details being sent with zone_id for verification
    
    details.forEach((d, idx) => {
      // Find the matching scene detail to get zone_id and zone_name
      const matchingSceneDetail = sceneDetails.find(sd => sd.assignment_href === d.assignment_href);
      const zoneId = matchingSceneDetail?.zone_id || getZoneIdFromSceneDetail(matchingSceneDetail || d, areaZones);
      
      
      // CRITICAL: Verify this detail matches the correct zone
      if (zoneId) {
        const zoneKey = `zone_${zoneId}`;
        const storedValues = sceneZoneValues[zoneKey];
        if (storedValues) {
          
          // Verify values match
          if (String(storedValues.fadeTime) !== String(d.FadeTime)) {
            console.error(`  ERROR: fadeTime mismatch! Stored: "${storedValues.fadeTime}", Sending: "${d.FadeTime}"`);
          }
          if (String(storedValues.delayTime) !== String(d.DelayTime)) {
            console.error(`  ERROR: delayTime mismatch! Stored: "${storedValues.delayTime}", Sending: "${d.DelayTime}"`);
          }
        } else {
          console.error(`  ERROR: No stored values found for zone_id ${zoneId}`);
        }
      }
    });

    const selectedSceneObj = areaScenes.find(
      (s) => getAreaSceneRowId(s) === Number(selectedScene)
    );
    const sceneId = selectedSceneObj
      ? getAreaSceneRowId(selectedSceneObj)
      : selectedScene;

    try {
      // Build a map of assignment_href to zone_id from sceneDetails for reference
      const assignmentToZoneIdMap = {};
      sceneDetails.forEach(sd => {
        if (sd.assignment_href && sd.zone_id) {
          assignmentToZoneIdMap[sd.assignment_href] = sd.zone_id;
        }
      });
      
      
      // First, save the scene definition
      const editResult = await dispatch(editScene({ areaId, sceneId, details })).unwrap();
      
      // CRITICAL: Set flag to prevent re-initialization when fetchSceneStatus updates Redux state
      // This ensures user's edits are preserved after save
      setJustAppliedScene(true);
      
      // CRITICAL: Add a small delay to ensure backend has processed the update
      // This prevents race conditions where we fetch scene status before backend updates
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refresh scene status to confirm the edit and verify saved values
      const refreshedSceneStatus = await dispatch(fetchSceneStatus({ areaId, sceneId })).unwrap();

      // Refresh area status zones after backend reconciliation so the UI immediately reflects new/reconciled zones.
      const refreshedAreaStatus = await dispatch(fetchAreaStatus(areaId)).unwrap();
      setAreaZones(refreshedAreaStatus?.zones || []);
      
      if (refreshedSceneStatus && refreshedSceneStatus.details) {
        
        // Verify that saved values match what we sent
        // Build maps by zone_id (preferred) and assignment_href (fallback)
        const savedValuesByZoneId = {};
        const savedValuesByAssignmentHref = {};
        refreshedSceneStatus.details.forEach(d => {
          const savedValue = {
            fadeTime: d.FadeTime,
            delayTime: d.DelayTime
          };
          
          if (d.zone_id) {
            savedValuesByZoneId[d.zone_id] = savedValue;
          }
          if (d.assignment_href) {
            savedValuesByAssignmentHref[d.assignment_href] = savedValue;
          }
        });
        
        const sentValuesByZoneId = {};
        const sentValuesByAssignmentHref = {};
        details.forEach(d => {
          const sentValue = {
            fadeTime: d.FadeTime,
            delayTime: d.DelayTime
          };
          
          // Try to get zone_id from the detail we're sending
          // First try to find matching scene detail by assignment_href
          const matchingSceneDetail = sceneDetails.find(sd => sd.assignment_href === d.assignment_href);
          let zoneId = matchingSceneDetail?.zone_id;
          
          // If not found, try to extract from assignment_href or use getZoneIdFromSceneDetail
          if (!zoneId && matchingSceneDetail) {
            zoneId = getZoneIdFromSceneDetail(matchingSceneDetail, areaZones);
          }
          
          if (zoneId) {
            sentValuesByZoneId[zoneId] = sentValue;
          }
          if (d.assignment_href) {
            sentValuesByAssignmentHref[d.assignment_href] = sentValue;
          }
        });
        
        
        // Check for mismatches by zone_id (preferred method)
        Object.keys(sentValuesByZoneId).forEach(zoneId => {
          const sentValue = sentValuesByZoneId[zoneId];
          const savedValue = savedValuesByZoneId[zoneId];
          
          if (savedValue) {
            // Normalize values for comparison (pad to 2 digits, handle strings/numbers)
            const sentFade = String(sentValue.fadeTime || '').padStart(2, '0');
            const savedFade = String(savedValue.fadeTime || '').padStart(2, '0');
            const sentDelay = String(sentValue.delayTime || '').padStart(2, '0');
            const savedDelay = String(savedValue.delayTime || '').padStart(2, '0');
            
            const fadeMatch = sentFade === savedFade;
            const delayMatch = sentDelay === savedDelay;
            
            if (!fadeMatch || !delayMatch) {
              // Find the zone name for better error message
              const zoneDetail = refreshedSceneStatus.details.find(d => d.zone_id === parseInt(zoneId));
              const zoneName = zoneDetail?.zone_name || `zone_id_${zoneId}`;
              
              console.error(`MISMATCH for zone "${zoneName}" (zone_id: ${zoneId}):`, {
                sent: {
                  fadeTime: `"${sentValue.fadeTime}" (normalized: "${sentFade}")`,
                  delayTime: `"${sentValue.delayTime}" (normalized: "${sentDelay}")`
                },
                received: {
                  fadeTime: `"${savedValue.fadeTime}" (normalized: "${savedFade}")`,
                  delayTime: `"${savedValue.delayTime}" (normalized: "${savedDelay}")`
                },
                fadeMatch,
                delayMatch,
                assignment_href: zoneDetail?.assignment_href
              });
              
              // CRITICAL: Check if another zone has the value we sent
              Object.keys(savedValuesByZoneId).forEach(otherZoneId => {
                if (otherZoneId !== zoneId) {
                  const otherSavedValue = savedValuesByZoneId[otherZoneId];
                  if (otherSavedValue) {
                    const otherSavedFade = String(otherSavedValue.fadeTime || '').padStart(2, '0');
                    const otherSavedDelay = String(otherSavedValue.delayTime || '').padStart(2, '0');
                    
                    if (otherSavedFade === sentFade && otherSavedDelay === sentDelay) {
                      const otherZoneDetail = refreshedSceneStatus.details.find(d => d.zone_id === parseInt(otherZoneId));
                      console.error(`  WARNING: The values we sent for "${zoneName}" appear to be saved on another zone:`, {
                        otherZone: otherZoneDetail?.zone_name || `zone_id_${otherZoneId}`,
                        otherZoneId: otherZoneId,
                        otherAssignmentHref: otherZoneDetail?.assignment_href,
                        values: otherSavedValue
                      });
                    }
                  }
                }
              });
            } else {
            }
          } else {
            console.warn(`Zone ${zoneId} not found in backend response (by zone_id)`);
          }
        });
        
        // Also check by assignment_href as fallback
        Object.keys(sentValuesByAssignmentHref).forEach(assignmentHref => {
          const sentValue = sentValuesByAssignmentHref[assignmentHref];
          const savedValue = savedValuesByAssignmentHref[assignmentHref];
          
          if (savedValue) {
            const fadeMatch = String(savedValue.fadeTime || '').padStart(2, '0') === String(sentValue.fadeTime || '').padStart(2, '0');
            const delayMatch = String(savedValue.delayTime || '').padStart(2, '0') === String(sentValue.delayTime || '').padStart(2, '0');
            
            if (!fadeMatch || !delayMatch) {
              console.warn(`MISMATCH for assignment_href ${assignmentHref}:`, {
                sent: sentValue,
                received: savedValue,
                fadeMatch,
                delayMatch
              });
            }
          }
        });
        
        // CRITICAL: If backend values match what we sent, update sceneZoneValues with confirmed backend values
        // This ensures UI reflects the saved values, including any formatting backend might apply
        setSceneZoneValues(prev => {
          const updated = { ...prev };
          refreshedSceneStatus.details.forEach(d => {
            if (d.zone_id) {
              const zoneKey = `zone_${d.zone_id}`;
              const existing = updated[zoneKey];
              
              if (existing) {
                // Update fade/delay times with confirmed backend values
                updated[zoneKey] = {
                  ...existing,
                  fadeTime: String(d.FadeTime || '02').padStart(2, '0'),
                  delayTime: String(d.DelayTime || '00').padStart(2, '0'),
                  assignment_href: d.assignment_href // Update assignment_href if it changed
                };
              }
            }
          });
          return updated;
        });
      }
      
      // Check if this scene is currently active by fetching area status
      const areaStatusResult = await dispatch(fetchAreaStatus(areaId)).unwrap();
      
      // If the edited scene is currently active, re-activate it to apply the changes to zones
      if (areaStatusResult && areaStatusResult.active_scene === sceneId) {
        // Re-activate the scene to apply the changes to zones
        await dispatch(updateAreaScene({ area_id: areaId, scene_code: sceneId })).unwrap();
        
        // Refresh area status to trigger fade/delay time update in HeatMap
        // The HeatMap useEffect will fetch active scene details and update zoneLocalValues
        await dispatch(fetchAreaStatus(areaId)).unwrap();
      } else {
        // Even if scene is not active, refresh area status to ensure HeatMap has latest data
        // This ensures that when the scene is activated later, it will have the correct fade/delay times
        await dispatch(fetchAreaStatus(areaId)).unwrap();
      }
    } catch (error) {
      console.error("Error applying scene:", error);
    }
  });

  const handleSaveTuning = async () => runSaveTuningOnce(async () => {
    if (!isSuperAdmin) return;
    if (!selectedTuningZoneId) return;

    const trimmed = String(draftHighEndTrim ?? '').trim();
    if (trimmed === '') {
      await Swal.fire({
        icon: 'warning',
        title: 'High End trim required',
        text: 'Please enter a value between ' + HIGH_END_TRIM_MIN + ' and ' + HIGH_END_TRIM_MAX + '.',
      });
      return;
    }
    const high = Number(trimmed);
    if (Number.isNaN(high)) {
      await Swal.fire({
        icon: 'warning',
        title: 'Invalid number',
        text: 'Please enter a valid number for High End trim.',
      });
      return;
    }
    if (high < HIGH_END_TRIM_MIN || high > HIGH_END_TRIM_MAX) {
      await Swal.fire({
        icon: 'warning',
        title: 'Out of range',
        text: `High End trim must be between ${HIGH_END_TRIM_MIN} and ${HIGH_END_TRIM_MAX} (inclusive).`,
      });
      return;
    }

    try {
      await dispatch(updateZoneTuning({ zone_id: selectedTuningZoneId, HighEndTrim: high })).unwrap();
      await dispatch(fetchTunningSettings(areaId)).unwrap();
    } catch (err) {
      console.error('Error saving tuning settings:', err);
    }
  });

  if (!open) return null;

  return (
    <Dialog 
      open={open} 
      onClose={() => {}} 
      maxWidth={false}
      fullWidth={false}
      disableEscapeKeyDown={true}
      sx={{ zIndex: AREA_SETTINGS_DIALOG_Z_INDEX }}
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }
      }}
      PaperProps={{ 
        className: 'heatmap-area-settings-dialog',
        sx: { 
          borderRadius: 1,
          background: HEATMAP_SETTINGS_DIALOG_PAPER_BG,
          minWidth: 250,
          maxWidth: 300,
          p: 0,
          position: 'relative',
        } 
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: 18, background: HEATMAP_SETTINGS_DIALOG_PAPER_BG, p: "12px 18px 8px 18px", letterSpacing: 0.5 }} />
      <DialogContent sx={{ p: "0 12px 0 12px", background: HEATMAP_SETTINGS_DIALOG_PAPER_BG }}>
        

        
        {loading || !areaSettings ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={100}>
            <CircularProgress sx={HEATMAP_SIDEBAR_SPINNER_SX} />
          </Box>
        ) : (
          <>
            {/* Device Settings - Only show if keypad is present (buttoncode exists) */}
            {buttoncode && (
            <Box sx={{ background: AREA_SETTINGS_SECTION_BG, borderRadius: "4px", p: "8px 12px", mb: 1, display: "flex", alignItems: "center", gap: 1, minHeight: 38, width: "100%" }}>
              <Box sx={{ flex: 1 }}>
                <Typography fontWeight={600} fontSize={15} sx={{ color: "#fff", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", mb: 0, mt: 0 }}>
                  Device Settings
                </Typography>
              </Box>
              {canModifyDeviceSettings ? (
                <Box 
                  onClick={lockLoading ? undefined : handleLockToggle} 
                  sx={{ 
                    width: 90, 
                    height: 24, // Reduced height
                    borderRadius: 999, 
                    background: '#fff', // White background
                    border: '1px solid #000', // Thin black border
                    display: 'flex', 
                    alignItems: 'center', 
                    cursor: lockLoading ? 'not-allowed' : 'pointer', 
                    transition: 'all 0.2s', 
                    position: 'relative', 
                    opacity: lockLoading ? 0.5 : 1, 
                    px: 1, 
                    boxSizing: 'border-box' 
                  }}
                >
                  <Box 
                    sx={{ 
                      width: 20, 
                      height: 20, 
                      borderRadius: '50%', 
                      background: locked ? '#f44336' : '#4caf50', // Red for locked, green for unlocked
                      position: 'absolute', 
                      left: locked ? 2 : 68, // Adjusted positioning
                      top: 2, 
                      transition: 'all 0.2s', 
                      boxShadow: '0 1px 4px rgba(0,0,0,0.2)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      zIndex: 2 
                    }} 
                  />
                  <Typography 
                    sx={{ 
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      color: buttonColor, 
                      fontWeight: 600, 
                      fontSize: 9, // Smaller font
                      zIndex: 2, 
                      letterSpacing: 0.5, 
                      userSelect: 'none',
                      textAlign: 'center',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {locked ? 'LOCKED' : 'UNLOCKED'}
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ 
                  width: 90, 
                  height: 24, // Reduced height
                  borderRadius: 999, 
                  background: '#fff', // White background
                  border: '1px solid #000', // Thin black border
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  opacity: 0.6, 
                  px: 1, 
                  boxSizing: 'border-box' 
                }}>
                  <Typography sx={{ 
                    color: buttonColor, 
                    fontWeight: 600, 
                    fontSize: 9, // Smaller font
                    letterSpacing: 0.5, 
                    userSelect: 'none',
                    textAlign: 'center'
                  }}>
                    {locked ? 'LOCKED' : 'UNLOCKED'}
                  </Typography>
                </Box>
              )}
            </Box>
            )}

            {/* Edit Occupancy */}
            <Box sx={{ background: AREA_SETTINGS_SECTION_BG, borderRadius: "4px", p: "12px 12px", mb: 2 }}>
              <Typography fontWeight={700} fontSize={15} mb={1} sx={{ color: "#fff" }}>Edit Occupancy</Typography>
              {canModifyDeviceSettings ? (
                <Box display="flex" gap={1}>
                  {modeOptions.map(opt => {
                    const n = normalizeOccupancyModeString(localOccupancyMode);
                    const isSelected = n !== "" && n === opt;
                    return (
                      <Button
                        key={opt}
                        className={
                          isSelected
                            ? "asd-occupancy-mode-btn asd-occupancy-mode-btn--active"
                            : "asd-occupancy-mode-btn"
                        }
                        variant="contained"
                        disableElevation
                        onClick={() => handleOccupancyChange(opt)}
                        disabled={occupancyLoading}
                        sx={asdOccupancyModeBtnSx(isSelected, buttonColor)}
                      >
                        {opt}
                      </Button>
                    );
                  })}
                </Box>
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  bgcolor: 'rgba(255,255,255,0.1)', 
                  borderRadius: 1, 
                  p: 2,
                  minHeight: 40
                }}>
                  <Typography sx={{ color: "#fff", fontSize: 13, opacity: 0.8, textAlign: 'center' }}>
                    {normalizeOccupancyModeString(localOccupancyMode) || 'Auto'} Mode
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Edit Scene */}
            <Box sx={{ background: AREA_SETTINGS_SECTION_BG, borderRadius: "4px", p: "12px 12px" }}>
              <Typography fontWeight={700} fontSize={15} mb={1} sx={{ color: "#fff" }}>Edit Scene</Typography>
              <Select
                fullWidth
                value={sceneSelectValue === "" ? "" : sceneSelectValue}
                onChange={(e) => {
                  const v = e.target.value;
                  setSelectedScene(
                    v === "" || v == null ? null : Number(v)
                  );
                }}
                displayEmpty
                disabled={!canEditScene}
                MenuProps={{
                  sx: { zIndex: AREA_SETTINGS_DIALOG_Z_INDEX + 1 },
                  PaperProps: {
                    sx: {
                      maxHeight: "min(50vh, 320px)",
                      overflowY: "auto",
                      bgcolor: "#fff",
                    },
                  },
                  MenuListProps: {
                    dense: false,
                    sx: { py: 0.5 },
                  },
                }}
                input={
                  <OutlinedInput
                    sx={{
                      fontSize: ASD_SELECT_INPUT_FS,
                      height: { xs: 32, md: 36 },
                      color: canEditScene ? "#111" : "#999",
                      bgcolor: canEditScene ? "#fff" : "#f5f5f5",
                      borderRadius: "2px",
                      pl: 2
                    }}
                  />
                }
                sx={{
                  width: "100%",
                  fontSize: ASD_SELECT_INPUT_FS,
                  height: { xs: 32, md: 36 },
                  color: canEditScene ? "#111" : "#999",
                  bgcolor: canEditScene ? "#fff" : "#f5f5f5",
                  borderRadius: "2px",
                  mb: 2,
                  "& .MuiSelect-icon": { color: canEditScene ? "#111" : "#999" },
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: canEditScene ? "#ddd" : "#ddd" }
                }}
                renderValue={(selected) => {
                  if (selected === "" || selected == null) {
                    return (
                      <span style={{ color: canEditScene ? "#aaa" : "#999" }}>Select Scene To Edit</span>
                    );
                  }
                  const scene = areaScenes.find(
                    (s) => getAreaSceneRowId(s) === Number(selected)
                  );
                  return scene ? scene.name : "";
                }}
              >
                {areaScenes.map((scene) => {
                  const rid = getAreaSceneRowId(scene);
                  if (rid == null) return null;
                  return (
                    <MenuItem key={rid} value={rid} sx={{ bgcolor: "#fff" }}>
                      {scene.name}
                    </MenuItem>
                  );
                })}
              </Select>
              {selectedScene && !sceneStatusLoading && sceneDetails.length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                 {sceneDetails.map((d, idx) => {
                    // CRITICAL: Get zone_id first and validate it exists
                    const zoneId = d.zone_id || getZoneIdFromSceneDetail(d, areaZones);
                    
                    if (!zoneId) {
                      console.error('ERROR: Cannot render zone without zone_id:', d.zone_name, d);
                      return null; // Skip zones without zone_id
                    }
                    
                    // CRITICAL: Use zone_id as the key (stable, doesn't change)
                    // Format: "zone_123" where 123 is the zone_id
                    const zoneKey = `zone_${zoneId}`;
                    
                    // Find the matching zone in areaZones to get min/max values
                    // CRITICAL: Use zone_id for matching (most reliable)
                    const matchedZone = areaZones.find(z => Number(z.id) === Number(zoneId));
                    
                    if (!matchedZone) {
                      console.warn(`Warning: Zone not found in areaZones for zone_id ${zoneId}, zone_name: ${d.zone_name}`);
                    }
                    
                    const matchedTypeNormalized = normalizeZoneType(matchedZone?.type);
                    const detailTypeNormalized = normalizeZoneType(d.zone_type);
                    const rawType = matchedTypeNormalized || detailTypeNormalized;

                    // ZoneControlCard decides UI based on exact canonical types:
                    // `switched` => toggle, `dimmed` => brightness slider, `whitetune`/`cct` => brightness + CCT slider.
                    const canonicalType =
                      rawType === "dimmed" ? "dimmed" :
                      rawType === "switched" ? "switched" :
                      rawType === "cct" ? "cct" :
                      rawType === "whitetune" ? "whitetune" :
                      rawType || d.zone_type;

                    const zone = {
                      id: zoneId, // Always use zone_id
                      name: d.zone_name,
                      type: canonicalType,
                      brightness_min: matchedZone?.brightness_min || d.brightness_min,
                      brightness_max: matchedZone?.brightness_max || d.brightness_max,
                      cct_min: matchedZone?.cct_min || d.cct_min,
                      cct_max: matchedZone?.cct_max || d.cct_max,
                    };
                    
                    // Get values from state using zone_id-based key
                    // CRITICAL: Ensure we're getting values for the correct zone_id
                    const storedValues = sceneZoneValues[zoneKey];
                    
                    // Validate that stored values belong to this zone (safety check)
                    const storedZoneId = storedValues?.zone_id;
                    if (storedValues && storedZoneId != null && Number(storedZoneId) !== Number(zoneId)) {
                      console.error('ERROR: Stored values zone_id mismatch!', {
                        expected: zoneId,
                        found: storedZoneId,
                        zone_name: d.zone_name,
                        zoneKey: zoneKey
                      });
                    }
                    
                    const values = {
                      ...storedValues,
                      brightness: storedValues?.brightness ?? d.Level ?? 0,
                      cct: storedValues?.cct ?? d.WhiteTuningLevel?.Kelvin ?? 2700,
                      fadeTime: storedValues?.fadeTime ?? d.FadeTime ?? "02",
                      delayTime: storedValues?.delayTime ?? d.DelayTime ?? "00",
                      on_off: storedValues?.on_off ?? d.SwitchedLevel ?? "Off",
                    };

                      return (
                      <ZoneControlCard
                        key={zoneKey}
                        zone={zone}
                        values={values}
                        onChange={(changed) => handleZoneValueChange(zoneKey, changed)}
                              disabled={editSceneLoading || !canEditScene}
                        isMobile={isMobile}
                        isTablet={isTablet}
                        isDesktop={isDesktop}
                        isLargeScreen={isLargeScreen}
                        is1440Screen={is1440Screen}
                        isUltraWide={isUltraWide}
                        is2560Screen={is2560Screen}
                        backgroundColor="#fff"
                        contentColor="rgba(30, 116, 197, 0.12)"
                        buttonColor={AREA_SETTINGS_BLUE}
                        zoneCardBg={ASD_ZONE_CARD_BG}
                      />
                    );
                  })}

                  <Box sx={{ display: "flex", justifyContent: "flex-end"}}>
                    <Button 
                      variant="contained" 
                      sx={{ 
                        ...asdSceneApplyBtnSx,
                        "&.Mui-disabled": { background: "#666 !important", color: "#fff" },
                      }} 
                      onClick={handleApplyScene} 
                      disabled={editSceneLoading || !canEditScene}
                    >
                      Apply
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>

            {/* Tuning Settings (superadmin only): one selected zone + trim inputs */}
            {isSuperAdmin && (
              <Box sx={{ background: AREA_SETTINGS_SECTION_BG, borderRadius: "4px", p: "12px 12px", mt: 1 }}>
                <Typography fontWeight={700} fontSize={15} mb={1} sx={{ color: "#fff" }}>
                  Tuning Settings
                </Typography>

                {tunningSettingsLoading ? (
                  <Box display="flex" justifyContent="center" alignItems="center" py={1}>
                    <CircularProgress size={20} sx={HEATMAP_SIDEBAR_SPINNER_SX} />
                  </Box>
                ) : (
                  <>
                    <Select
                      value={selectedTuningZoneId ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        setSelectedTuningZoneId(v ? Number(v) : null);
                      }}
                      displayEmpty
                      disabled={!tuningZones || tuningZones.length === 0 || zoneTuningUpdateLoading}
                      MenuProps={{
                        // Keep the menu within the dialog stacking context and ensure it renders above
                        // the dialog/topbar z-index overrides used in this app.
                        disablePortal: true,
                        PaperProps: {
                          sx: {
                            zIndex: AREA_SETTINGS_DIALOG_Z_INDEX + 1,
                            minWidth: 260,
                            bgcolor: "#fff",
                          },
                        },
                      }}
                      input={
                        <OutlinedInput
                          sx={{
                            fontSize: ASD_SELECT_INPUT_FS,
                            height: { xs: 32, md: 36 },
                            color: "#232323",
                            bgcolor: "#fff",
                            borderRadius: "2px",
                            pl: 2,
                          }}
                        />
                      }
                      sx={{
                        width: "100%",
                        fontSize: ASD_SELECT_INPUT_FS,
                        height: { xs: 32, md: 36 },
                        color: "#232323",
                        bgcolor: "#fff",
                        borderRadius: "2px",
                        mb: 1.5,
                        "& .MuiSelect-icon": { color: "#232323" },
                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "#ddd" },
                      }}
                      renderValue={(selected) => {
                        if (!selected) {
                          return <span style={{ color: "#aaa" }}>Select Zone</span>;
                        }
                        const zone = tuningZones.find((z) => Number(z.zone_id) === Number(selected));
                        if (!zone) return "";
                        return zone.zone_name || "";
                      }}
                    >
                      <MenuItem disabled value="" sx={{ bgcolor: "#fff" }}>
                        <span style={{ color: "#aaa" }}>Select Zone</span>
                      </MenuItem>
                      {tuningZones.map((zone) => (
                        <MenuItem key={zone.zone_id} value={Number(zone.zone_id)} sx={{ bgcolor: "#fff" }}>
                          {zone.zone_name}
                        </MenuItem>
                      ))}
                    </Select>

                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Typography fontWeight={700} fontSize={14} sx={{ color: "#fff" }}>
                          High End Trim
                        </Typography>
                        <OutlinedInput
                          value={draftHighEndTrim}
                          disabled={!selectedTuningZoneId || zoneTuningUpdateLoading}
                          onChange={(e) => setDraftHighEndTrim(sanitizeTrimInput(e.target.value))}
                          inputProps={{ inputMode: "decimal", min: HIGH_END_TRIM_MIN, max: HIGH_END_TRIM_MAX }}
                          sx={{
                            width: 95,
                            bgcolor: "#fff",
                            color: ZONE_CARD_TEXT_COLOR,
                            borderRadius: 1,
                            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#ddd" },
                            "& input": {
                              textAlign: "center",
                              fontSize: ASD_SELECT_INPUT_FS,
                              py: 0.6,
                              color: ZONE_CARD_TEXT_COLOR,
                              WebkitTextFillColor: ZONE_CARD_TEXT_COLOR,
                            },
                          }}
                        />
                      </Box>
                      {showHighEndRangeWarning && (
                        <Typography fontSize={11} sx={{ color: "#ffcdd2", px: 0.25 }}>
                          Value must be between {HIGH_END_TRIM_MIN} and {HIGH_END_TRIM_MAX}.
                        </Typography>
                      )}
                    </Box>

                    <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1.5 }}>
                      <Button
                        variant="contained"
                        sx={{
                          borderRadius: 1,
                          fontWeight: 700,
                          bgcolor: zoneTuningUpdateLoading ? "#999" : buttonColor,
                          color: "#fff",
                          px: 2,
                          py: 0.2,
                          fontSize: 12,
                          boxShadow: 0,
                          minWidth: 0,
                        }}
                        onClick={handleSaveTuning}
                        disabled={zoneTuningUpdateLoading || !selectedTuningZoneId}
                      >
                        {zoneTuningUpdateLoading ? "Saving..." : "Save"}
                      </Button>
                    </Box>
                  </>
                )}
              </Box>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ p: "6px 18px", background: HEATMAP_SETTINGS_DIALOG_PAPER_BG }}>
        <Button
          className="heatmap-area-settings-close-btn"
          onClick={onClose}
          sx={{ fontWeight: 700, fontSize: 12, color: dialogCloseColor, borderRadius: 1, px: 1.5, py: 0.2, minWidth: 0 }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ZoneControlCard component - same as in HeatMap.jsx
function ZoneControlCard({ zone, values, onChange, disabled, isMobile, isTablet, isDesktop, isLargeScreen, is1440Screen, isUltraWide, is2560Screen, backgroundColor, contentColor, buttonColor, zoneCardBg = ASD_ZONE_CARD_BG }) {
  const isSwitchType = isSwitched(zone.type);
  const isWhitetuneType = isWhitening(zone.type);
  const isDimmedType = isDimmed(zone.type);

  const safeValues = values || { on_off: zone.status || zone.on_off || 'Off' };

  const [brightnessEdit, setBrightnessEdit] = useState({ isEditing: false, value: "" });
  const [cctEdit, setCctEdit] = useState({ isEditing: false, value: "" });

  const beginBrightnessEdit = (currentValue) => {
    setBrightnessEdit({ isEditing: true, value: String(currentValue ?? "") });
  };

  const cancelBrightnessEdit = () => {
    setBrightnessEdit({ isEditing: false, value: "" });
  };

  const commitBrightnessEdit = ({ min = 0, max = 100 }) => {
    const raw = String(brightnessEdit.value ?? "").trim();
    if (raw === "") {
      cancelBrightnessEdit();
      return;
    }
    const n = Math.round(Number(raw));
    if (Number.isNaN(n)) {
      cancelBrightnessEdit();
      return;
    }
    const clamped = Math.max(Number(min), Math.min(Number(max), n));
    onChange({ brightness: clamped });
    cancelBrightnessEdit();
  };

  const beginCctEdit = (currentValue) => {
    setCctEdit({ isEditing: true, value: String(currentValue ?? "") });
  };

  const cancelCctEdit = () => {
    setCctEdit({ isEditing: false, value: "" });
  };

  const commitCctEdit = ({ min = 2700, max = 7000 }) => {
    const raw = String(cctEdit.value ?? "").trim();
    if (raw === "") {
      cancelCctEdit();
      return;
    }
    const n = Math.round(Number(raw));
    if (Number.isNaN(n)) {
      cancelCctEdit();
      return;
    }
    const clamped = Math.max(Number(min), Math.min(Number(max), n));
    onChange({ cct: clamped });
    cancelCctEdit();
  };

  const renderZoneCctKelvin = (displayValue, { min, max }) => (
    <Typography
      component="div"
      className="advanced-zone-value-chip"
      fontSize={{ xs: 8, sm: 9, md: 10 }}
      fontWeight={700}
      sx={{
        ...ASD_ZONE_VALUE_CHIP_SX,
        minWidth: 36,
        cursor: disabled ? "default" : "text",
      }}
      onClick={() => {
        if (disabled) return;
        beginCctEdit(displayValue);
      }}
    >
      {cctEdit.isEditing && !disabled ? (
        <TextField
          value={cctEdit.value}
          size="small"
          variant="standard"
          inputProps={{
            ...ASD_ZONE_VALUE_INPUT_PROPS,
            style: { ...ASD_ZONE_VALUE_INPUT_PROPS.style, width: 34 },
          }}
          sx={{
            "& .MuiInputBase-input": {
              color: `${ZONE_CARD_TEXT_COLOR} !important`,
              WebkitTextFillColor: ZONE_CARD_TEXT_COLOR,
            },
          }}
          onChange={(e) => {
            const next = e.target.value.replace(/[^\d]/g, "");
            setCctEdit((prev) => ({ ...prev, value: next }));
          }}
          onBlur={() => commitCctEdit({ min, max })}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitCctEdit({ min, max });
            } else if (e.key === "Escape") {
              e.preventDefault();
              cancelCctEdit();
            }
          }}
        />
      ) : (
        `${displayValue}K`
      )}
    </Typography>
  );

  const renderZoneBrightnessValue = (displayValue, { min, max }) => (
    <Typography
      component="div"
      className="advanced-zone-value-chip"
      fontSize={{ xs: 8, sm: 9, md: 10 }}
      fontWeight={700}
      sx={{
        ...ASD_ZONE_VALUE_CHIP_SX,
        minWidth: 24,
        cursor: disabled ? "default" : "text",
      }}
      onClick={() => {
        if (disabled) return;
        beginBrightnessEdit(displayValue);
      }}
    >
      {brightnessEdit.isEditing && !disabled ? (
        <TextField
          value={brightnessEdit.value}
          size="small"
          variant="standard"
          inputProps={{
            ...ASD_ZONE_VALUE_INPUT_PROPS,
            style: { ...ASD_ZONE_VALUE_INPUT_PROPS.style, width: 26 },
          }}
          sx={{
            "& .MuiInputBase-input": {
              color: `${ZONE_CARD_TEXT_COLOR} !important`,
              WebkitTextFillColor: ZONE_CARD_TEXT_COLOR,
            },
          }}
          onChange={(e) => {
            const next = e.target.value.replace(/[^\d]/g, "");
            setBrightnessEdit((prev) => ({ ...prev, value: next }));
          }}
          onBlur={() => commitBrightnessEdit({ min, max })}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitBrightnessEdit({ min, max });
            } else if (e.key === "Escape") {
              e.preventDefault();
              cancelBrightnessEdit();
            }
          }}
        />
      ) : (
        `${displayValue}%`
      )}
    </Typography>
  );

  if (isSwitchType) {
    const isOn = safeValues.on_off === 'On';
    return (
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <Typography fontWeight="bold" fontSize={{ xs: 11, md: 13 }} sx={{ minWidth: 20, mr: 1, color: "#fff" }}>
          {zone.name}
        </Typography>
        <Box
          onClick={() => !disabled && onChange({ on_off: isOn ? 'Off' : 'On' })}
          sx={{
            width: { xs: 40, md: 48 }, // Increased width
            height: { xs: 16, md: 20 }, // Reduced height
            borderRadius: 999,
            background: disabled ? '#ddd' : '#fff', // White background
            border: `1px solid ${disabled ? '#ddd' : '#000'}`, // Thin black border
            display: 'flex',
            alignItems: 'center',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            padding: 1,
            position: 'relative',
            minWidth: { xs: 40, md: 48 }, // Increased width
            ml: 1,
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <Box
            sx={{
              width: { xs: 12, md: 16 }, // Adjusted thumb size
              height: { xs: 12, md: 16 }, // Adjusted thumb size
              borderRadius: '50%',
              background: disabled ? '#bbb' : (isOn ? '#4caf50' : '#f44336'), // Green for ON, red for OFF
              transform: isOn ? `translateX(${isMobile ? 20 : 24}px)` : 'translateX(0)', // Adjusted transform
              transition: 'all 0.2s',
              boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
              position: 'absolute',
              left: 2,
              top: 2,
            }}
          />
          <Typography
            sx={{
              position: 'absolute',
              left: isOn ? 4 : (isMobile ? 18 : 22), // Position text on opposite side of circle
              top: '50%',
              transform: 'translateY(-50%)',
              color: disabled ? '#999' : buttonColor || '#222',
              fontWeight: 600,
              fontSize: { xs: 9, md: 11 }, // Smaller font
              transition: 'all 0.2s',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              maxWidth: { xs: 20, md: 24 }, // Account for circle size
            }}
          >
            {isOn ? 'ON' : 'OFF'}
          </Typography>
        </Box>
      </Box>
    );
  }

  if (isWhitetuneType) {
    const brightnessMin = zone.brightness_min !== undefined ? zone.brightness_min : 0;
    const brightnessMax = zone.brightness_max !== undefined ? zone.brightness_max : 100;
    const cctMin = zone.cct_min !== undefined ? zone.cct_min : 2700;
    const cctMax = zone.cct_max !== undefined ? zone.cct_max : 7000;

    return (
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 1, mb: 0.5 }}>
        <Box
          className="asd-zone-control-card"
          sx={{
          flex: 1,
          bgcolor: zoneCardBg,
          color: ZONE_CARD_TEXT_COLOR,
          borderRadius: 0.5,
          p: { xs: 0.5, md: 1 },
          width: { xs: 140, sm: 150, md: 160 },
          minWidth: { xs: 140, sm: 150, md: 160 },
          maxWidth: { xs: 140, sm: 150, md: 160 },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 0.5, // Reduced margin bottom
            height: 16, // Reduced height
            lineHeight: 1.2,
          }}>
            <Typography
              fontWeight="bold"
              fontSize={{ xs: 9, sm: 10, md: 11 }}
              sx={{
                color: ZONE_CARD_TEXT_COLOR,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
                mr: 0.5
              }}
            >
              {zone.name}
            </Typography>
            {renderZoneBrightnessValue(
              safeValues.brightness !== undefined ? safeValues.brightness : brightnessMin,
              { min: brightnessMin, max: brightnessMax }
            )}
          </Box>

          {/* Brightness Slider - Fixed positioning */}
          <Box sx={{ position: 'relative', width: '85%', mt: 0.5, pl: { xs: 1, md: 2 } }}>
            <Slider
              min={brightnessMin}
              max={brightnessMax}
              value={safeValues.brightness}
              onChange={(_, v) => onChange({ brightness: v })}
              disabled={disabled}
              sx={{
                color: '#222',
                height: { xs: 2, md: 3 },
                '& .MuiSlider-thumb': {
                  width: { xs: 8, md: 10 },
                  height: { xs: 8, md: 10 },
                  bgcolor: '#222',
                  boxShadow: 'none',
                },
                '& .MuiSlider-rail': {
                  height: { xs: 2, md: 3 },
                  borderRadius: 1.5,
                },
                '& .MuiSlider-track': {
                  height: { xs: 2, md: 3 },
                  borderRadius: 1.5,
                },
              }}
            />
          </Box>

          {/* CCT value box — same style/behavior as brightness % */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              mt: 0.8,
              mb: 0.3,
              height: 16,
              lineHeight: 1.2,
              pr: { xs: 0.5, md: 1 },
            }}
          >
            {renderZoneCctKelvin(
              safeValues.cct !== undefined ? safeValues.cct : cctMin,
              { min: cctMin, max: cctMax }
            )}
          </Box>

          {/* CCT Slider - Fixed positioning */}
          <Box sx={{ position: 'relative', width: '85%', mt: 0.2, pl: { xs: 1, md: 2 } }}>
            <Slider
              min={cctMin}
              max={cctMax}
              value={safeValues.cct}
              onChange={(_, v) => onChange({ cct: v })}
              disabled={disabled}
              sx={{
                color: '#FFD600',
                height: { xs: 2, md: 3 },
                '& .MuiSlider-thumb': {
                  width: { xs: 8, md: 10 },
                  height: { xs: 8, md: 10 },
                  bgcolor: '#FFD600',
                  boxShadow: 'none',
                },
                '& .MuiSlider-rail': {
                  height: { xs: 2, md: 3 },
                  borderRadius: 1.5,
                },
                '& .MuiSlider-track': {
                  height: { xs: 2, md: 3 },
                  borderRadius: 1.5,
                },
              }}
            />
          </Box>

          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            mt: 0.8,
          }}>
            <Typography
              component="span"
              className="asd-zone-cct-range-label"
              fontSize={{ xs: 7, md: 9 }}
              sx={{ color: ZONE_CARD_MUTED_TEXT_COLOR, WebkitTextFillColor: ZONE_CARD_MUTED_TEXT_COLOR }}
            >
              {cctMin}K
            </Typography>
            <Typography
              component="span"
              className="asd-zone-cct-range-label"
              fontSize={{ xs: 7, md: 9 }}
              sx={{ color: ZONE_CARD_MUTED_TEXT_COLOR, WebkitTextFillColor: ZONE_CARD_MUTED_TEXT_COLOR }}
            >
              {cctMax}K
            </Typography>
          </Box>
        </Box>

        {/* Fade/Delay Time inputs */}
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: { xs: 0.5, md: 1 }, alignItems: 'flex-start', justifyContent: 'center', ml: 1, width: { xs: 80, sm: 90, md: 100 } }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography fontSize={{ xs: 9, md: 11 }} fontWeight={700} sx={{ mb: 0.2, textAlign: 'center', color: '#fff' }}>Fade</Typography>
            <Typography fontSize={{ xs: 9, md: 11 }} fontWeight={700} sx={{ mb: 0.2, textAlign: 'center', color: '#fff' }}>Time</Typography>
            <input
              type="text"
              value={safeValues.fadeTime || '02'}
              onChange={e => onChange({ fadeTime: e.target.value.replace(/\D/g, '').slice(0, 2) })}
              style={{
                width: isMobile ? 26 : 30,
                height: isMobile ? 16 : 20,
                fontSize: isMobile ? 10 : 12,
                textAlign: 'center',
                borderRadius: 2,
                border: '1px solid #ccc',
                background: '#fff',
                fontWeight: 600,
                color: '#222'
              }}
              disabled={disabled}
            />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography fontSize={{ xs: 9, md: 11 }} fontWeight={700} sx={{ mb: 0.2, textAlign: 'center', color: '#fff' }}>Delay</Typography>
            <Typography fontSize={{ xs: 9, md: 11 }} fontWeight={700} sx={{ mb: 0.2, textAlign: 'center', color: '#fff' }}>Time</Typography>
            <input
              type="text"
              value={safeValues.delayTime || '00'}
              onChange={e => onChange({ delayTime: e.target.value.replace(/\D/g, '').slice(0, 2) })}
              style={{
                width: isMobile ? 26 : 30,
                height: isMobile ? 16 : 20,
                fontSize: isMobile ? 10 : 12,
                textAlign: 'center',
                borderRadius: 2,
                border: '1px solid #ccc',
                background: '#fff',
                fontWeight: 600,
                color: '#222'
              }}
              disabled={disabled}
            />
          </Box>
        </Box>
      </Box>
    );
  }

  if (isDimmedType) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 1, mb: 0.5 }}>
        <Box
          className="asd-zone-control-card"
          sx={{
          flex: 1,
          bgcolor: zoneCardBg,
          color: ZONE_CARD_TEXT_COLOR,
          borderRadius: 0.5,
          pt:0.5,
          pb:0,
          pl:0.5,
          pr:0.5,
          width: { xs: 140, sm: 150, md: 160 },
          minWidth: { xs: 140, sm: 150, md: 160 },
          maxWidth: { xs: 140, sm: 150, md: 160 },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start'
        }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 0.5, // Reduced margin bottom
            height: 16, // Reduced height
            lineHeight: 1.2,
          }}>
            <Typography
              fontWeight="bold"
              fontSize={{ xs: 9, sm: 10, md: 11 }}
              sx={{
                color: ZONE_CARD_TEXT_COLOR,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
                mr: 0.5
              }}
            >
              {zone.name}
            </Typography>
            {renderZoneBrightnessValue(safeValues.brightness, { min: 0, max: 100 })}
          </Box>
          <Box sx={{ position: 'relative', width: '85%', mt: 0.5, ml: { xs: 1, md: 2 } }}>
            <Slider
              min={0}
              max={100}
              value={safeValues.brightness}
              onChange={(_, v) => onChange({ brightness: v })}
              disabled={disabled}
              sx={{
                color: '#222',
                height: { xs: 2, md: 3 },
                '& .MuiSlider-thumb': {
                  width: { xs: 8, md: 10 },
                  height: { xs: 8, md: 10 },
                  bgcolor: '#222',
                  boxShadow: 'none',
                },
                '& .MuiSlider-rail': {
                  height: { xs: 2, md: 3 },
                  borderRadius: 1.5,
                },
                '& .MuiSlider-track': {
                  height: { xs: 2, md: 3 },
                  borderRadius: 1.5,
                },
              }}
            />
          </Box>
        </Box>

        {/* Fade/Delay Time inputs for dimmed */}
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, alignItems: 'flex-start', justifyContent: 'center', ml: 1, width: { xs: 80, sm: 90, md: 100 } }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography fontSize={{ xs: 9, md: 11 }} sx={{ mb: 0.2, textAlign: 'center', color: '#fff' }}>Fade</Typography>
            <Typography fontSize={{ xs: 9, md: 11 }} sx={{ mb: 0.2, textAlign: 'center', color: '#fff' }}>Time</Typography>
            <input
              type="text"
              value={safeValues.fadeTime || '02'}
              onChange={e => onChange({ fadeTime: e.target.value.replace(/\D/g, '').slice(0, 2) })}
              style={{
                width: 30,
                height: 20,
                fontSize: 12,
                textAlign: 'center',
                borderRadius: 2,
                border: '1px solid #ccc',
                background: '#fff',
                fontWeight: 600,
                color: '#222'
              }}
              disabled={disabled}
            />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography fontSize={{ xs: 9, md: 11 }} sx={{ mb: 0.2, textAlign: 'center', color: '#fff' }}>Delay</Typography>
            <Typography fontSize={{ xs: 9, md: 11 }} sx={{ mb: 0.2, textAlign: 'center', color: '#fff' }}>Time</Typography>
            <input
              type="text"
              value={safeValues.delayTime || '00'}
              onChange={e => onChange({ delayTime: e.target.value.replace(/\D/g, '').slice(0, 2) })}
              style={{
                width: 30,
                height: 20,
                fontSize: 12,
                textAlign: 'center',
                borderRadius: 2,
                border: '1px solid #ccc',
                background: '#fff',
                fontWeight: 600,
                color: '#222'
              }}
              disabled={disabled}
            />
          </Box>
        </Box>
      </Box>
    );
  }
}
/**
 * FOFP Admin Settings Page
 *
 * Superadmin-only settings screen that drives the new isolated /fofp/* admin
 * APIs. It does NOT touch the live floor visualization, occupancy widgets, or
 * energy widgets.
 *
 * Capabilities:
 *   - Floor selector
 *   - Generate layout (POST /fofp/generate-layout) with confirmation modal
 *   - Layout viewer (PDF + SVG overlay) via FOFPLayoutViewer
 *   - Edit mode with drag (local state only, no autosave)
 *   - Bulk save (PUT /fofp/layout) — only modified positions
 *   - Unsaved-changes protection on refresh / floor-switch
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createSingleFlight } from "../../../../../shared/utils/createSingleFlight";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  FormControlLabel,
  Stack,
  Switch,
  useTheme,
  Grid,
} from "@mui/material";
import { alpha, darken } from "@mui/material/styles";
import Swal from "sweetalert2";

import { UseAuth, getVisibleSidebarItemsWithPaths } from "../../../customhooks/UseAuth";
import { BaseUrl } from "../../../BaseUrl";
import { resolveFloorPlanMediaUrl } from "../../../../../shared/pdf/floorPlanPdf";
import { dispatchFetchFloorsOnce } from "../../../../../shared/utils/bootstrapFetchGuards";
import { getFloorsList } from "../../../../../shared/utils/floorList";
import { fetchFloors, selectFloors, selectFloorLoading } from "../../../redux/slice/floor/floorSlice";
import { selectApplicationTheme } from "../../../redux/slice/theme/themeSlice";
import { isLightSurface } from "../../../utils/themeOnSurface";
import SettingsSidebar from "../../../components/SettingsSidebar";
import {
  settingsHelpLayoutShellSx,
  settingsHelpLayoutGridSx,
  settingsHelpLayoutContentColumnSx,
} from "../../../utils/settingsPageLayout";
import FOFPLayoutViewer from "./FOFPLayoutViewer";
import {
  getFofpSwalOptions,
  getFofpToolbarSx,
  getFofpContainedButtonSx,
} from "./fofpSettingsUi";
import {
  fetchFofpLayout,
  fetchFofpConfig,
  updateFofpConfig,
  generateFofpLayout,
  saveFofpLayout,
  selectFofpPositions,
  selectFofpLoading,
  selectFofpError,
  selectFofpGenerating,
  selectFofpGenerateError,
  selectFofpSaving,
  selectFofpSaveError,
  selectFofpConfig,
  selectFofpConfigSaving,
  selectFofpEffectiveMarkerColor,
  selectFofpFloorId,
  clearFofpState,
  mergeFofpConfigFields,
} from "../../../redux/slice/fofp/fofpSlice";
import {
  positionsArrayToMap,
  positionsMapToArray,
  updatePositionInMap,
  patchPositionInMap,
} from "../../../features/fofp/editor/positionsMap";

const isSuperadmin = (role) => {
  if (!role) return false;
  const r = String(role).toLowerCase();
  return r === "superadmin" || r === "super admin";
};

/** Numeric equality with tolerance for floating-point drift during drag. */
const numEq = (a, b) => Math.abs(Number(a) - Number(b)) < 1e-3;

const FOFPComponent = () => {
  const dispatch = useDispatch();
  const runSaveOnce = useMemo(() => createSingleFlight(), []);
  const theme = useTheme();
  const { role } = UseAuth();
  const visibleSidebarItemsWithPaths = getVisibleSidebarItemsWithPaths(role);
  const appTheme = useSelector(selectApplicationTheme);
  const contentColor = appTheme?.application_theme?.content || "#ffffff";
  const isDefaultWhiteTheme = isLightSurface(contentColor);
  const buttonColor =
    appTheme?.application_theme?.button || theme.palette.primary.main;
  const swalOptions = getFofpSwalOptions(theme);
  const containedBtnSx = getFofpContainedButtonSx(buttonColor);
  /** Enable toggle uses application theme button color. */
  const fofpEnableSwitchSx = useMemo(
    () => ({
      "& .MuiSwitch-switchBase.Mui-checked": {
        color: buttonColor,
      },
      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
        backgroundColor: alpha(buttonColor, 0.45),
        opacity: 1,
      },
    }),
    [buttonColor]
  );

  const positions = useSelector(selectFofpPositions);
  const loadedFloorId = useSelector(selectFofpFloorId);
  const loading = useSelector(selectFofpLoading);
  const error = useSelector(selectFofpError);
  const generating = useSelector(selectFofpGenerating);
  const generateError = useSelector(selectFofpGenerateError);
  const saving = useSelector(selectFofpSaving);
  const saveError = useSelector(selectFofpSaveError);
  const fofpConfig = useSelector(selectFofpConfig);
  const configSaving = useSelector(selectFofpConfigSaving);
  const effectiveMarkerColor = useSelector(selectFofpEffectiveMarkerColor);
  const floors = getFloorsList(useSelector(selectFloors));
  const floorStatus = useSelector(selectFloorLoading);
  const floorsLoading = floorStatus === "loading";
  const floorsError = useSelector((state) => state.floor?.error) || null;
  const [selectedFloorId, setSelectedFloorId] = useState("");

  const [floorMeta, setFloorMeta] = useState(null);
  const [floorMetaLoading, setFloorMetaLoading] = useState(false);
  const [floorMetaError, setFloorMetaError] = useState(null);

  const [workingMap, setWorkingMap] = useState(() => new Map());
  const [originalMap, setOriginalMap] = useState(() => new Map());
  const [isEditing, setIsEditing] = useState(false);

  const workingPositions = useMemo(
    () => positionsMapToArray(workingMap),
    [workingMap]
  );

  const [confirmGenerateOpen, setConfirmGenerateOpen] = useState(false);
  const [pendingFloorId, setPendingFloorId] = useState(null);

  // -------------------- derived dirty state --------------------

  const [selectedZoneId, setSelectedZoneId] = useState(null);

  const dirtyMap = useMemo(() => {
    const map = new Map();
    for (const p of workingMap.values()) {
      const orig = originalMap.get(p.zone_id);
      if (!orig) continue;
      const moved = !numEq(orig.x, p.x) || !numEq(orig.y, p.y);
      const shapeChanged =
        (orig.marker_shape || null) !== (p.marker_shape || null);
      const sizeChanged = Number(orig.shape_size) !== Number(p.shape_size);
      const sizeXChanged =
        Number(orig.shape_size_x ?? orig.shape_size) !==
        Number(p.shape_size_x ?? p.shape_size);
      const sizeYChanged =
        Number(orig.shape_size_y ?? orig.shape_size) !==
        Number(p.shape_size_y ?? p.shape_size);
      if (moved || shapeChanged || sizeChanged || sizeXChanged || sizeYChanged) {
        map.set(p.zone_id, p);
      }
    }
    return map;
  }, [workingMap, originalMap]);

  const dirty = dirtyMap.size > 0;

  useEffect(() => {
    dispatch(fetchFofpConfig());
  }, [dispatch]);

  // -------------------- floor list (shared Redux; skip if already loaded) --------------------

  useEffect(() => {
    dispatchFetchFloorsOnce(dispatch, fetchFloors, Boolean(floors?.length));
  }, [dispatch, floors?.length]);

  // -------------------- floor metadata (pdf + polygons) --------------------

  const loadFloorMeta = useCallback(async (floorId) => {
    if (!floorId) {
      setFloorMeta(null);
      return;
    }
    setFloorMetaLoading(true);
    setFloorMetaError(null);
    try {
      // /floor/light_status returns floor_plan (pdf path) + areas with polygons.
      // We only consume the read-only geometry/image; we ignore live light state.
      const res = await BaseUrl.get(`/floor/light_status?floor_id=${floorId}`);
      const data = res?.data || {};
      const rawPath = data.floor_plan || data.floor_image || "";
      let pdfUrl = "";
      if (rawPath) {
        const base = resolveFloorPlanMediaUrl(rawPath);
        const sep = base.includes("?") ? "&" : "?";
        pdfUrl = `${base}${sep}t=${Date.now()}`;
      }
      const viewportBounds = {
        x_left: data.x_left ?? data.boundary_values?.x_left,
        x_right: data.x_right ?? data.boundary_values?.x_right,
        y_top: data.y_top ?? data.boundary_values?.y_top,
        y_bottom: data.y_bottom ?? data.boundary_values?.y_bottom,
      };
      setFloorMeta({
        pdfUrl,
        areas: Array.isArray(data.areas) ? data.areas : [],
        viewportBounds,
      });

      // Sync marker_color (and shape/size) from floor payload into Redux without a PUT.
      if (data?.fofp_config && typeof data.fofp_config === "object") {
        dispatch(mergeFofpConfigFields(data.fofp_config));
      }
    } catch (err) {
      setFloorMetaError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Failed to load floor metadata"
      );
      setFloorMeta(null);
    } finally {
      setFloorMetaLoading(false);
    }
  }, [dispatch]);

  // -------------------- load layout when floor changes --------------------

  const applyFloorSelection = useCallback(
    (floorId) => {
      const id = floorId != null && floorId !== "" ? String(floorId) : "";
      setSelectedFloorId(id);
      setIsEditing(false);
      setSelectedZoneId(null);
      setWorkingMap(new Map());
      setOriginalMap(new Map());
      if (!id) {
        dispatch(clearFofpState());
        setFloorMeta(null);
        return;
      }
      loadFloorMeta(id);
      dispatch(fetchFofpLayout(id));
    },
    [dispatch, loadFloorMeta]
  );

  // Push fetched positions into original + working snapshots.
  useEffect(() => {
    if (!selectedFloorId) return;
    if (loadedFloorId != null && String(loadedFloorId) !== String(selectedFloorId)) {
      return;
    }
    const snap = positionsArrayToMap(positions);
    setOriginalMap(snap);
    setWorkingMap(new Map(snap));
  }, [positions, selectedFloorId, loadedFloorId]);

  // -------------------- dirty-state protection (refresh / close) --------------------

  useEffect(() => {
    if (!dirty) return;
    const handler = (e) => {
      e.preventDefault();
      // Most browsers require returnValue to be set to trigger the prompt.
      e.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // Intercept sidebar / in-app navigation while dirty. Uses the History API,
  // not react-router's useBlocker (kept stable across versions).
  useEffect(() => {
    if (!dirty) return;

    const onPopState = () => {
      Swal.fire({
        title: "Unsaved FOFP changes",
        text: "You have unsaved layout changes. Save or cancel them before leaving.",
        icon: "warning",
        confirmButtonText: "OK",
        ...swalOptions,
      });
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [dirty, swalOptions]);

  // -------------------- floor selector with dirty protection --------------------

  const requestFloorSwitch = (nextFloorId) => {
    if (String(nextFloorId) === String(selectedFloorId)) return;
    if (dirty) {
      setPendingFloorId(nextFloorId);
      return;
    }
    applyFloorSelection(nextFloorId);
  };

  const confirmFloorSwitch = () => {
    const next = pendingFloorId;
    setPendingFloorId(null);
    if (next != null) applyFloorSelection(next);
  };

  const cancelFloorSwitch = () => setPendingFloorId(null);

  // -------------------- drag callback --------------------

  const handlePositionChange = useCallback((zoneId, x, y) => {
    setWorkingMap((prev) => {
      const before = prev.get(Number(zoneId));
      if (!before) return prev;
      if (numEq(before.x, x) && numEq(before.y, y)) return prev;
      return updatePositionInMap(prev, zoneId, x, y);
    });
  }, []);

  const handleZoneSelect = useCallback((zoneId) => {
    setSelectedZoneId(zoneId != null ? Number(zoneId) : null);
  }, []);

  const handleMarkerStyleChange = useCallback((zoneId, patch) => {
    if (!zoneId || !patch) return;
    setWorkingMap((prev) => patchPositionInMap(prev, zoneId, patch));
  }, []);

  const handleFofpEnabledToggle = (e) => {
    dispatch(updateFofpConfig({ fofp_enabled: e.target.checked }));
  };

  // -------------------- generate flow --------------------

  const handleOpenGenerate = () => setConfirmGenerateOpen(true);

  const handleConfirmGenerate = async () => {
    setConfirmGenerateOpen(false);
    if (!selectedFloorId) return;
    try {
      const res = await dispatch(generateFofpLayout(selectedFloorId)).unwrap();
      await Swal.fire({
        title: "Layout generated",
        text: `Created ${res.generated}, skipped ${res.skipped}, failed ${res.failed}.`,
        icon: "success",
        ...swalOptions,
        timer: 2400,
        showConfirmButton: false,
      });
      dispatch(fetchFofpConfig());
      // Refresh layout after generation (manual placements are preserved by the backend).
      dispatch(fetchFofpLayout(selectedFloorId));
    } catch (msg) {
      Swal.fire({
        title: "Generate failed",
        text: typeof msg === "string" ? msg : "Failed to generate layout",
        icon: "error",
        ...swalOptions,
      });
    }
  };

  // -------------------- save flow --------------------

  const handleSave = async () => runSaveOnce(async () => {
    if (!selectedFloorId || !dirty) return;
    const modified = Array.from(dirtyMap.values()).map((p) => {
      const row = {
        zone_id: p.zone_id,
        area_id: p.area_id,
        x: p.x,
        y: p.y,
      };
      if (p.marker_shape != null) row.marker_shape = p.marker_shape;
      if (p.shape_size != null) row.shape_size = p.shape_size;
      if (p.shape_size_x != null) row.shape_size_x = p.shape_size_x;
      if (p.shape_size_y != null) row.shape_size_y = p.shape_size_y;
      return row;
    });
    try {
      const res = await dispatch(
        saveFofpLayout({ floorId: selectedFloorId, positions: modified })
      ).unwrap();
      await Swal.fire({
        title: "Layout saved",
        text: `Updated ${res.updated}, created ${res.created}.`,
        icon: "success",
        ...swalOptions,
        timer: 2200,
        showConfirmButton: false,
      });
      // Re-fetch to align originals with the now-persisted state.
      dispatch(fetchFofpLayout(selectedFloorId));
      setIsEditing(false);
    } catch (msg) {
      Swal.fire({
        title: "Save failed",
        text: typeof msg === "string" ? msg : "Failed to save layout",
        icon: "error",
        ...swalOptions,
      });
    }
  });

  const handleDiscard = () => {
    setWorkingMap(new Map(originalMap));
    setIsEditing(false);
    setSelectedZoneId(null);
  };

  const handleRetry = () => {
    if (!selectedFloorId) return;
    dispatch(fetchFofpLayout(selectedFloorId));
    loadFloorMeta(selectedFloorId);
  };

  // Defensive guard in addition to the route-level AuthGuard. Placed after all
  // hooks to comply with the Rules of Hooks.
  if (!role) return null;
  if (!isSuperadmin(role)) return null;

  return (
    <Box className="help-container" sx={{ position: "relative", ...settingsHelpLayoutShellSx }}>
      <Grid
        container
        spacing={{ xs: 0.3, sm: 0.5, md: 1, lg: 1.5 }}
        sx={settingsHelpLayoutGridSx}
      >
        <SettingsSidebar items={visibleSidebarItemsWithPaths} />

        <Grid item xs={12} lg={9} className="settings-help-content-column" sx={settingsHelpLayoutContentColumnSx}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
          gap: 1.2,
        }}
      >
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          ...getFofpToolbarSx(theme),
          px: { xs: 1.2, md: 1.6 },
          py: 1.2,
          flexShrink: 0,
        }}
      >
        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={1.2}
          alignItems={{ xs: "stretch", lg: "center" }}
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={1.2} alignItems="center" minWidth={0}>
            <FormControlLabel
              sx={{ m: 0, flexShrink: 0 }}
              control={
                <Switch
                  size="small"
                  checked={fofpConfig?.fofp_enabled === true}
                  onChange={handleFofpEnabledToggle}
                  disabled={configSaving}
                  inputProps={{ "data-testid": "fofp-enable-toggle" }}
                  sx={fofpEnableSwitchSx}
                />
              }
              label={
                <Typography variant="body2" fontWeight={600} noWrap>
                  Enable FOFP
                </Typography>
              }
            />
            {dirty && (
              <Chip
                label="Unsaved changes"
                color="warning"
                variant="outlined"
                size="small"
                data-testid="fofp-dirty-chip"
              />
            )}
          </Stack>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1}
            alignItems={{ xs: "stretch", md: "center" }}
          >
            <FormControl size="small" sx={{ minWidth: { xs: "100%", md: 240 } }}>
              <InputLabel id="fofp-floor-select-label">Floor</InputLabel>
              <Select
                labelId="fofp-floor-select-label"
                label="Floor"
                value={selectedFloorId || ""}
                disabled={floorsLoading || generating || saving}
                onChange={(e) => requestFloorSwitch(e.target.value)}
                inputProps={{ "data-testid": "fofp-floor-select" }}
              >
                <MenuItem value="">
                  <em>Select floor</em>
                </MenuItem>
                {(floors || []).map((f) => (
                  <MenuItem key={f.id} value={String(f.id)}>
                    {f.floor_name || f.name || `Floor ${f.id}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", md: "block" } }} />

            <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
              <Button
                variant="outlined"
                disabled={!selectedFloorId || generating || saving}
                onClick={handleOpenGenerate}
                data-testid="fofp-generate-btn"
              >
                {generating ? "Generating..." : "Generate"}
              </Button>
              <Button
                variant={isEditing ? "contained" : "outlined"}
                disabled={!selectedFloorId || loading || generating}
                onClick={() => {
                  setIsEditing((v) => {
                    if (v) setSelectedZoneId(null);
                    return !v;
                  });
                }}
                data-testid="fofp-edit-btn"
                sx={
                  isEditing
                    ? {
                        ...containedBtnSx,
                        backgroundColor: darken(buttonColor, 0.25),
                        "&:hover": {
                          backgroundColor: darken(buttonColor, 0.35),
                          filter: "none",
                        },
                      }
                    : undefined
                }
              >
                {isEditing ? "Exit Edit" : "Edit"}
              </Button>
              <Button
                variant="contained"
                disabled={!dirty || saving}
                onClick={handleSave}
                data-testid="fofp-save-btn"
                sx={containedBtnSx}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button
                variant="text"
                color="inherit"
                disabled={!dirty || saving}
                onClick={handleDiscard}
                data-testid="fofp-discard-btn"
              >
                Discard
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Box>

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          minHeight: { xs: 480, md: 520 },
          display: "flex",
          flexDirection: "column",
          gap: 1,
          overflow: "hidden",
        }}
      >
          <Stack spacing={0.8}>
            {floorsError && (
              <Alert severity="error" action={<Button onClick={() => window.location.reload()}>Retry</Button>}>
                {floorsError}
              </Alert>
            )}
            {error && (
              <Alert severity="error" action={<Button onClick={handleRetry}>Retry</Button>}>
                {error}
              </Alert>
            )}
            {floorMetaError && <Alert severity="warning">{floorMetaError}</Alert>}
            {generateError && <Alert severity="error">{generateError}</Alert>}
            {saveError && <Alert severity="error">{saveError}</Alert>}
            {selectedFloorId && !loading && !error && workingPositions.length === 0 && (
              <Alert severity="info" data-testid="fofp-empty-layout">
                No FOFP positions saved yet for this floor. Click "Generate" to create them.
              </Alert>
            )}
            {isEditing && (
              <Typography variant="caption" color="text.secondary" data-testid="fofp-edit-hint">
                Right-click a marker to change shape or resize. Hold and drag to move. Marker color is
                set under Settings → Theme.
              </Typography>
            )}
          </Stack>

          <Box
            sx={{
              position: "relative",
              flex: 1,
              minHeight: { xs: 520, md: 400 },
              display: "flex",
              flexDirection: "column",
            }}
          >
            {(loading || floorMetaLoading) && (
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 10,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: alpha(theme.palette.common.white, 0.72),
                  borderRadius: "14px",
                }}
              >
                <CircularProgress size={28} />
              </Box>
            )}

            {selectedFloorId ? (
              <FOFPLayoutViewer
                pdfUrl={floorMeta?.pdfUrl || ""}
                areas={floorMeta?.areas || []}
                positions={workingPositions}
                isEditing={isEditing}
                onPositionChange={handlePositionChange}
                selectedZoneId={selectedZoneId}
                onZoneSelect={handleZoneSelect}
                onMarkerStyleChange={handleMarkerStyleChange}
                markerShape={fofpConfig?.shape}
                markerSize={fofpConfig?.marker_size}
                markerBaseColor={effectiveMarkerColor}
                viewportBounds={floorMeta?.viewportBounds}
                isLightChrome={isDefaultWhiteTheme}
                buttonColor={buttonColor}
              />
            ) : (
              <Box
                data-testid="fofp-empty-state"
                sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
              >
                <FOFPLayoutViewer
                  positions={[]}
                  areas={[]}
                  isEditing={false}
                  isLightChrome={isDefaultWhiteTheme}
                  buttonColor={buttonColor}
                />
              </Box>
            )}
          </Box>
      </Box>
      </Box>
        </Grid>
      </Grid>

      {/* Confirm generate */}
      <Dialog open={confirmGenerateOpen} onClose={() => setConfirmGenerateOpen(false)}>
        <DialogTitle>Generate FOFP layout?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            This will auto-place markers for any zones on this floor that do not already have a saved
            position. Manual placements are preserved.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmGenerateOpen(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmGenerate}
            variant="contained"
            data-testid="fofp-confirm-generate"
            sx={containedBtnSx}
          >
            Generate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm floor switch with dirty changes */}
      <Dialog open={pendingFloorId != null} onClose={cancelFloorSwitch}>
        <DialogTitle>Discard unsaved FOFP changes?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Switching floors will discard your unsaved layout edits. Continue?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelFloorSwitch}>Keep editing</Button>
          <Button onClick={confirmFloorSwitch} color="warning" variant="contained">
            Discard & switch
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FOFPComponent;

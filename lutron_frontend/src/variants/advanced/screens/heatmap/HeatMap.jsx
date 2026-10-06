import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  dispatchFetchFloorsOnce,
  dispatchFetchApplicationThemeOnce,
  dispatchFetchHeatMapThemeOnce,
} from "../../../../shared/utils/bootstrapFetchGuards";
import { createSingleFlight } from "../../../../shared/utils/createSingleFlight";
import {
  Box,
  CircularProgress,
  IconButton,
  Typography,
  Slider,
  Badge,
  Button,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from "@mui/material";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import FitScreenIcon from "@mui/icons-material/FitScreen";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { Document, Page } from "react-pdf";
import { configurePdfJsWorker, buildPdfDocumentFile } from "../../../../shared/pdf/floorPlanPdf";
import {
  getPolygonRings,
  flattenAreaCoords,
  resolveFloorPlanPageDims,
  pageDimsEqual,
  getPolygonBoundingBox,
} from '../../utils/floorplanCoordinates';
import {
  fetchFloorMapData,
  fetchAreaOccupancyStatus,
  fetchAreaEnergyConsumption,
  selectPdfUrl,
  selectHeatmapData,
  selectSelectedFloorId,
  selectDisplayMode,
  setSelectedFloorId,
  fetchAreaStatus,
  selectAreaStatus,
  selectAreaStatusLoading,
  selectAreaStatusError,
  selectAreaStatusFetchingId,
  updateAreaLightStatus,
  updateZonesByArea,
  toggleAllZonesInArea,
  updateAreaScene,
  renameArea,
  refreshAllHeatmapData,
  selectHeatmapLoading,
  selectHeatmapError,
  optimisticallyUpdateAreaStatus,
  selectHeatmapSearchTerm, // added
} from '../../redux/slice/settingsslice/heatmap/HeatmapSlice';
import { fetchActiveAlerts, selectAlerts } from '../../redux/slice/dashboard/alertsSlice';
import { fetchSceneStatus } from '../../redux/slice/settingsslice/heatmap/areaSettingsSlice';
import { fetchFloors, selectFloors } from "../../redux/slice/floor/floorSlice";
import { BaseUrl } from '../../BaseUrl'
import CloseIcon from "@mui/icons-material/Close";
import SettingsIcon from "@mui/icons-material/Settings";
import EditIcon from "@mui/icons-material/Edit";
import Switch from "@mui/material/Switch";
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { fetchProcessors } from '../../redux/slice/processor/processorSlice';

import AreaSettingsDialog, {
  HEATMAP_AREA_SIDEBAR,
  HEATMAP_SIDEBAR_SPINNER_SX,
  ASD_RENAME_FIELD_SX,
  asdRenameSaveBtnSx,
  AREA_SETTINGS_BLUE,
} from '../heatmap/AreaSettingsDialog';
import { HeatmapFooterActions } from './HeatmapControls';

import { fetchApplicationTheme, fetchHeatMapTheme, selectApplicationTheme, selectHeatMapTheme } from "../../redux/slice/theme/themeSlice";
import { readAdvancedApplicationThemePin } from "../../utils/advancedApplicationThemePersist";
import { isLightSurface, isWhiteAreaPickerChrome, onContentColors } from "../../utils/themeOnSurface";
//import SearchComponent from "../../layouts/SearchComponent"; // adjust path as needed

import { UseAuth } from '../../customhooks/UseAuth'; // Add this import

import { interpolateHexColor, arraylargest } from '../../utils/colorScale';
import FOFPOverlay, { FOFPOverlayBoundary } from './FOFPOverlay';
import {
  findFofpZoneIndexInPanelList,
  isFofpZonePanelHighlighted,
} from './fofpZoneInteraction';
import { fetchFofpConfig, selectFofpConfig } from '../../redux/slice/fofp/fofpSlice';
import { getThemeButtonColor } from '../../utils/themePageBackground';
import {
  getLightLevelFillColor,
  resolveLightModeFill,
} from './heatmapLightStyles';
import { isMapProcessorUnreachable } from '../../../../shared/heatmap/processorReachable';
import {
  buildAlertFocusPayload,
  findAlertForFloorplanArea,
  hasActiveAlertForArea,
} from '../../../../shared/heatmap/alertAreaMatch';
import { alertMarkerHitRadius } from '../../../../shared/heatmap/alertMarker';
import { usePanDrag } from '../../../../shared/heatmap/usePanDrag';
import {
  createTwoLineLabel,
  getHeatmapPolygonLabelCenter,
  getHeatmapLabelFontSize,
} from '../../../../shared/heatmap/createTwoLineLabel';
import { areaNameMatchesSearch } from '../../../../shared/heatmap/areaNameSearch';
import { useHeatmapLiveStatusSync } from '../../../../shared/heatmap/useHeatmapLiveStatusSync';
import { getHeatmapSceneStatusKey } from '../../../../shared/heatmap/heatmapSceneStatusDedupe';
import { areaLiveFieldsAlreadyOnMap } from '../../../../shared/heatmap/patchOpenAreaLiveStatus';
import { shouldSkipAreaStatusRefetch } from '../../../../shared/heatmap/shouldSkipAreaStatusRefetch';
import {
  fadeSettleMsFromZones,
  waitForFadeSettle,
} from '../../../../shared/heatmap/fadeSettle';
import {
  ZONE_CONTROL_CARD_WIDTH_SX,
  SIDEBAR_ZONE_SLIDER_ROW_SX,
  SIDEBAR_ZONE_FOLLOWING_SLIDER_ROW_SX,
  SIDEBAR_ZONE_SLIDER_TRACK_SX,
  SIDEBAR_ZONE_SIDE_VALUE_CHIP_SX,
  SIDEBAR_ZONE_CARD_SHELL_SX,
  SIDEBAR_ZONE_CARD_INNER_SX,
  SIDEBAR_ZONE_NAME_SX,
  SIDEBAR_ZONE_VALUE_CHIP_FONT_SX,
  SIDEBAR_SECTION_TAB_FONT_SX,
  SIDEBAR_BODY_TEXT_SX,
  HEATMAP_ZONES_SECTION_SX,
  HEATMAP_ZONES_LIST_SCROLL_SX,
  HEATMAP_ZONES_LIST_PAGINATED_SX,
  HEATMAP_ZONES_LIST_WITH_SHADES_SCROLL_SX,
  HEATMAP_ZONES_LIST_WITH_SHADES_PAGINATED_SX,
  ADVANCED_HEATMAP_SIDEBAR_SX,
  ADVANCED_HEATMAP_SIDEBAR_STICKY_HEADER_SX,
  ADVANCED_HEATMAP_SIDEBAR_BODY_SX,
} from './zoneControlCardLayout';
import {
  buildShadesUpdatePayload,
  formatSidebarEnergyWatts,
  parseShadeLevel,
  resolveShadeZoneId,
} from '../../../../utils/heatmapSidebarUtils';
import HeatmapShadesPanel from '../../../../components/heatmap/HeatmapShadesPanel';
import { normalizeHeatmapColor } from '../../../../shared/utils/normalizeHeatmapColor';

const normalizeZoneType = (type) =>
  (type ?? "")
    .toString()
    .trim()
    .toLowerCase()
    // backend may return `white tune`, `white_tune`, `white-tune`, etc.
    .replace(/[\s_-]/g, "");

const isWhitening = (type) => ["whitening", "whitetune"].includes(normalizeZoneType(type));
const isDimmed = (type) => normalizeZoneType(type) === "dimmed";
const isSwitched = (type) => normalizeZoneType(type) === "switched";

/** Sidebar zone list: 2/page when CCT (White Tune) is present, else 4/page — no inner scroll. */
const getSidebarZonesPerPage = (zones) => {
  const list = zones || [];
  const hasCct = list.some((z) => isWhitening(z.type));
  return hasCct ? 2 : 4;
};

const buildSidebarZonesToShow = (zones) => {
  return (zones || []).filter((z) => normalizeZoneType(z.type) !== "shade");
};

// Add the missing TOP_PADDING constant
const TOP_PADDING = 60; // Adjust this value based on your header height

configurePdfJsWorker();

function toTitleCase(str) {
  return str.replace(/\w\S*/g, (txt) =>
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

const HeatMap = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const theme = useTheme();

  // Get current user role and permissions
  const { role: currentUserRole } = UseAuth();

  // Get user profile from Redux state
  const userProfile = useSelector(state => state.user.profile);

  const pdfUrl = useSelector(selectPdfUrl);
  const heatmapData = useSelector(selectHeatmapData);
  const selectedFloorId = useSelector(selectSelectedFloorId);
  const displayMode = useSelector(selectDisplayMode);
  const floors = useSelector(selectFloors);
  const areaStatus = useSelector(selectAreaStatus);
  const areaStatusLoading = useSelector(selectAreaStatusLoading);
  const areaStatusError = useSelector(selectAreaStatusError);
  const areaStatusFetchingId = useSelector(selectAreaStatusFetchingId);
  const heatmapLoading = useSelector(selectHeatmapLoading);
  const heatmapError = useSelector(selectHeatmapError);
  const searchTerm = useSelector(selectHeatmapSearchTerm); // added
  const activeAlerts = useSelector(selectAlerts); // added for alert indicators

  // Function to check if user can access a specific floor
  const canAccessFloor = (floorId) => {
    // Superadmin and Admin can access all floors
    if (currentUserRole === 'Superadmin' || currentUserRole === 'Admin') {
      return true;
    }

    // For Operators, check if they have access to this floor
    if (currentUserRole === 'Operator' && userProfile && userProfile.floors) {
      return userProfile.floors.some(f => f.floor_id === floorId);
    }

    // Default: can access
    return true;
  };

  // Function to get available floors based on user permissions
  const getAvailableFloors = () => {
    // Superadmin and Admin can see all floors
    if (currentUserRole === 'Superadmin' || currentUserRole === 'Admin') {
      return floors;
    }

    // For Operators, only show floors they have access to
    if (currentUserRole === 'Operator' && userProfile && userProfile.floors) {
      const operatorFloorIds = userProfile.floors.map(f => f.floor_id);
      return floors.filter(floor => operatorFloorIds.includes(floor.id));
    }

    // Default: return all floors
    return floors;
  };

  // Function to check if user can update area status (scenes, zones, shades)
  const canUpdateAreaStatus = () => {
    // Superadmin and Admin can always update area status
    if (currentUserRole === 'Superadmin' || currentUserRole === 'Admin') {
      return true;
    }

    // For Operators, check if they have the required permissions for the current floor
    if (currentUserRole === 'Operator' && selectedFloorId && userProfile && userProfile.floors) {
      const currentFloorPermission = userProfile.floors.find(f => f.floor_id === selectedFloorId);

      if (currentFloorPermission) {
        const permission = currentFloorPermission.floor_permission;
        // Allow updates for both "monitor_control" (Monitoring and Control) AND "monitor_control_edit" (Monitoring, Control and Edit)
        // NOT for "monitor" (Monitoring only)
        return permission === 'monitor_control' || permission === 'monitor_control_edit';
      }
    }

    // Default: Operators cannot update area status
    return false;
  };

  // Function to check if user can modify device lock and occupancy settings
  const canModifyDeviceSettings = () => {
    // Superadmin and Admin can always modify device settings
    if (currentUserRole === 'Superadmin' || currentUserRole === 'Admin') {
      return true;
    }

    // For Operators, check if they have the required permissions for the current floor
    if (currentUserRole === 'Operator' && selectedFloorId && userProfile && userProfile.floors) {
      const currentFloorPermission = userProfile.floors.find(f => f.floor_id === selectedFloorId);

      if (currentFloorPermission) {
        const permission = currentFloorPermission.floor_permission;
        // Allow modifications for "monitor_control" (Monitoring and Control) AND "monitor_control_edit" (Monitoring, Control and Edit)
        // NOT for "monitoring" (Monitoring only)
        return permission === 'monitor_control' || permission === 'monitor_control_edit';
      }
    }

    // Default: Operators cannot modify device settings
    return false;
  };

  // Function to check if user can edit scenes
  const canEditScene = () => {
    // Superadmin and Admin can always edit scenes
    if (currentUserRole === 'Superadmin' || currentUserRole === 'Admin') {
      return true;
    }

    // For Operators, check if they have the required permissions for the current floor
    if (currentUserRole === 'Operator' && selectedFloorId && userProfile && userProfile.floors) {
      const currentFloorPermission = userProfile.floors.find(f => f.floor_id === selectedFloorId);

      if (currentFloorPermission) {
        const permission = currentFloorPermission.floor_permission;
        // Only allow scene editing for "monitor_control_edit" (Monitoring, Control and Edit)
        // NOT for "monitor_control" (Monitoring and Control only)
        return permission === 'monitor_control_edit';
      }
    }

    // Default: Operators cannot edit scenes
    return false;
  };

  // Function to check if user can view area settings (even if they can't modify them)
  const canViewAreaSettings = () => {
    // All authenticated users can view area settings
    // This includes Superadmin, Admin, and all Operators regardless of floor permissions
    return true;
  };

  const canRenameArea = () =>
    currentUserRole === "Superadmin" || currentUserRole === "Admin";

  // Responsive breakpoints - optimized for better coverage including ultra-wide screens
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // < 600px
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md')); // 600px - 900px
  const isDesktop = useMediaQuery(theme.breakpoints.up('md')); // >= 900px
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg')); // >= 1200px
  const is1440Screen = useMediaQuery('(min-width:1440px)'); // >= 1440px
  const isUltraWide = useMediaQuery(theme.breakpoints.up('xl')); // >= 1920px
  const is2560Screen = useMediaQuery('(min-width:2560px)'); // >= 2560px

  // A4 dimensions in pixels (at 96 DPI) - fallback values
  const A4_WIDTH = 794;  // 8.27 inches * 96 DPI
  const A4_HEIGHT = 1123; // 11.69 inches * 96 DPI

  const [scale, setScale] = useState(1.0); // Default scale - will be set to fit window
  const [hasFit, setHasFit] = useState(false);
  const containerRef = useRef();

  // Measure the actual PDF viewport element (client box = drawable area).
  const getContainerDimensions = () => {
    if (!containerRef.current) return { width: 0, height: 0 };

    const container = containerRef.current;
    const width = container.clientWidth || container.offsetWidth || 0;
    const height = container.clientHeight || container.offsetHeight || 0;

    if (!width || !height) {
      const parent = container.parentElement;
      if (parent) {
        return {
          width: Math.max(parent.clientWidth || 300, 300),
          height: Math.max(parent.clientHeight || 200, 200),
        };
      }
    }

    const result = {
      width: Math.max(width, 300),
      height: Math.max(height, 200),
    };

    return result;
  };
  const [selectedAreaId, setSelectedAreaId] = useState(null);
  useHeatmapLiveStatusSync({
    dispatch,
    selectedFloorId,
    displayMode,
    selectedAreaId,
    areaStatus,
    fetchFloorMapData,
    fetchAreaOccupancyStatus,
    fetchAreaStatus,
  });
  /** FOFP marker selection for sidebar zone highlight (zoneName matches panel zones). */
  const [highlightedFofpZone, setHighlightedFofpZone] = useState(null);
  const fofpConfigFromStore = useSelector(selectFofpConfig);
  const [scenePage, setScenePage] = useState(0);
  const SCENES_PER_PAGE = isMobile ? 6 : isTablet ? 8 : 9;
  const [lightOn, setLightOn] = useState(areaStatus && areaStatus.light_status === "On");
  const [shadesGroups, setShadesGroups] = useState([
    { name: "Group 1", value: 50 },
    { name: "Group 2", value: 50 },
    { name: "Group 3", value: 50 },
  ]);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [zonePage, setZonePage] = useState(0);
  const [updating, setUpdating] = useState(false);
  const [zoneLocalValues, setZoneLocalValues] = React.useState({});
  const [zoneUpdating, setZoneUpdating] = React.useState(false);
  const [mainToggleUpdating, setMainToggleUpdating] = useState(false);
  const [lastOccupancyStatus, setLastOccupancyStatus] = useState({});
  const [lastEnergyStatus, setLastEnergyStatus] = useState({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [areaRenameOpen, setAreaRenameOpen] = useState(false);
  const [areaRenameValue, setAreaRenameValue] = useState("");
  const [areaRenameError, setAreaRenameError] = useState("");
  const [areaRenameSaving, setAreaRenameSaving] = useState(false);
  const [shadesLocalValues, setShadesLocalValues] = useState({});
  const [shadesUpdating, setShadesUpdating] = useState(false);

  useEffect(() => {
    setAreaRenameOpen(false);
    setAreaRenameError("");
    setScenePage(0);
  }, [selectedAreaId]);

  const closeAreaPanel = () => {
    setSelectedAreaId(null);
    setHighlightedFofpZone(null);
  };
  const [fitScale, setFitScale] = useState(1.0); // Default fit scale - will be calculated
  const [filteredAreas, setFilteredAreas] = useState(heatmapData.areas || []);

  const appTheme = useSelector(selectApplicationTheme);
  const backgroundColor = appTheme?.application_theme?.background || '#ffffff';
  const contentColor = appTheme?.application_theme?.content || '#f5f5f5';
  const buttonColor = getThemeButtonColor(appTheme?.application_theme?.button, appTheme?.application_theme?.background);
  const {
    panelBg: areaSidebarPanelBg,
    panelBorder: areaSidebarPanelBorder,
    sectionBg: areaSidebarSectionBg,
    sectionText: areaSidebarSectionText,
    panelLabel: areaSidebarPanelLabel,
    sectionLabelBg: areaSidebarSectionLabelBg,
    loadingOverlayBg: areaSidebarLoadingOverlayBg,
  } = HEATMAP_AREA_SIDEBAR;

  const [refreshing, setRefreshing] = useState(false);
  const layoutRef = useRef(null);
  const [availableHeight, setAvailableHeight] = useState(null);
  const [pan, setPan] = useState({ x: 0, y: 0 }); // added: pan state for dragging
  const [highlightedAreaId, setHighlightedAreaId] = useState(null); // added: popup highlight target
  const [isDragging, setIsDragging] = useState(false); // added: drag state
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 }); // added: drag start position
  const [searchBounceAnimation, setSearchBounceAnimation] = useState(false); // added: search bounce animation

  // Add a loading state for the PDF
  const [pdfLoading, setPdfLoading] = useState(false);
  // Bounding box of all areas (used to crop PDF whitespace)
  const [contentBBox, setContentBBox] = useState(null);
  // Track when the PDF page dimensions are actually loaded
  const [pdfLoaded, setPdfLoaded] = useState(false);
  // Boundary values for zoom fit-to-window
  const [boundaryValues, setBoundaryValues] = useState(null);

  const [pageDims, setPageDims] = useState(null);

  // Reset PDF layout when floor plan file changes so fit uses correct page size.
  useEffect(() => {
    setPageDims(null);
    setPdfLoaded(false);
    setPan({ x: 0, y: 0 });
    setHasFit(false);
    setContentBBox(null);
  }, [pdfUrl]);

  // Ensure floors are loaded (once-guarded)
  useEffect(() => {
    dispatchFetchFloorsOnce(dispatch, fetchFloors, Boolean(floors?.length));
  }, [dispatch, floors?.length]);

  // Fetch active alerts on component mount
  useEffect(() => {
    dispatch(fetchActiveAlerts()).then(() => {
    });
  }, [dispatch]);

  // Component mount handling
  useEffect(() => {
    // Component mounted
  }, []);

  // Note: Floor selection initialization is handled by HeatmapControls.jsx
  // to prevent conflicts and infinite loops between components

  // Initial fit when component mounts to ensure proper coverage
  useEffect(() => {
    // Only attempt to fit if we have pageDims (PDF has loaded)
    if (!pageDims) return;

    const initialFit = () => {
      if (containerRef.current && pageDims) {
        applyFitToScreen({ force: true });
      }
    };

    // Try to fit after a short delay to ensure everything is rendered
    const timeoutId = setTimeout(initialFit, 100);

    // Fallback fit attempt if the first one doesn't work
    const fallbackTimeoutId = setTimeout(() => {
      if (!hasFit && containerRef.current && pageDims) {
        applyFitToScreen({ force: true });
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(fallbackTimeoutId);
    };
  }, [pageDims, hasFit, boundaryValues, isMobile, isTablet, is2560Screen, is1440Screen]); // Added dependencies for consistent scale calculation

  // Removed unused constants for better space utilization

  // Responsive zones per page based on screen size
  const getZonesPerPage = () => {
    if (isMobile) return 1;
    if (isTablet) return 2;
    if (isLargeScreen) return 3;
    if (isUltraWide) return 4;
    if (is2560Screen) return 5;
    return 2; // Default for desktop
  };

  const ZONES_PER_PAGE = getZonesPerPage();

  const shades = areaStatus?.zones?.filter(z => (z.type || '').toLowerCase() === 'shade') || [];

  //heatmap api calling
  const heatMapTheme = useSelector(selectHeatMapTheme);
  const lightColor = normalizeHeatmapColor(heatMapTheme?.application_theme?.light || '#f2ff00');
  const occupancyColor = normalizeHeatmapColor(heatMapTheme?.application_theme?.occupancy || '#ea3ebf');
  const energyBaseColor = normalizeHeatmapColor(heatMapTheme?.application_theme?.energy || '#a71ee6');

  // Monitor theme changes
  useEffect(() => {
    // Theme change handling
  }, [heatMapTheme, lightColor, occupancyColor, energyBaseColor]);
  useEffect(() => {
    dispatchFetchHeatMapThemeOnce(dispatch, fetchHeatMapTheme);
    // Do not soft-fetch application theme when Advanced pin/colors already exist —
    // that race was overwriting Gold/Brown page chrome after refresh.
    const pin = readAdvancedApplicationThemePin();
    if (pin?.background || pin?.content || pin?.button) return;
    if (appTheme?.application_theme?.background || appTheme?.application_theme?.content) {
      return;
    }
    dispatchFetchApplicationThemeOnce(dispatch, fetchApplicationTheme);
  }, [dispatch, appTheme]);

  const lastFloorMapFloorIdRef = useRef(null);
  const displayModeRef = useRef(displayMode);
  displayModeRef.current = displayMode;
  const prevDisplayModeRef = useRef(displayMode);
  const lastAreaStatusSnapshotRef = useRef({
    areaId: null,
    light: null,
    occ: null,
    scene: null,
  });
  const lastSceneStatusKeyRef = useRef('');

  useEffect(() => {
    lastSceneStatusKeyRef.current = '';
  }, [selectedAreaId]);

  const applyButtonSx = {
    background: '#222',
    color: '#fff',
    borderRadius: 2,
    fontSize: { xs: 10, sm: 11, md: 12 },
    fontWeight: 400,
    px: { xs: 1.5, md: 2 },
    py: { xs: 0.3, md: 0.5 },
    minWidth: { xs: 50, md: 60 },
    minHeight: { xs: 22, md: 25 },
    alignSelf: 'flex-end',
    mb: 1,
    textTransform: 'none',
    boxShadow: 1,
    '&:hover': { background: '#111' },
  };

  const scaledWidth = (pageDims?.width || A4_WIDTH) * scale;
  const scaledHeight = (pageDims?.height || A4_HEIGHT) * scale;
  const MIN_SCALE = 0.2;
  // Dynamic MAX_SCALE based on screen size for better ultra-wide support
  const MAX_SCALE = is2560Screen ? 4.0 : isUltraWide ? 3.0 : 2.0;
  const SCALE_STEP = 0.05;
  // Add extra zoom out capability for tablets and ultra-wide screens
  const MIN_SCALE_TABLET = isTablet ? 0.1 : is2560Screen ? 0.05 : 0.2;

  // Keep a small gap above the PDF so it never clips
  const TOP_PADDING = isMobile ? 6 : isTablet ? 8 : is2560Screen ? 15 : 10;

  // Dynamic max scale: how big we can render without cropping the container
  const getDynamicMaxScale = () => {
    const { width: cw, height: ch } = getContainerDimensions();
    if (!cw || !ch) return MAX_SCALE;
    const viewW = pageDims?.width || A4_WIDTH;
    const viewH = pageDims?.height || A4_HEIGHT;
    const sw = cw / viewW;
    const sh = ch / viewH;
    return Math.max(sw, sh) + 0.01;
  };

  // Effect A — floor change only (do not re-hit light_status on mode switch).
  // After map areas load, fetch occupancy/energy so they merge into the new floor
  // (avoids racing energy_status vs light_status and wiping energy colors).
  useEffect(() => {
    if (!selectedFloorId) return;
    if (lastFloorMapFloorIdRef.current === selectedFloorId) return;
    lastFloorMapFloorIdRef.current = selectedFloorId;
    lastAreaStatusSnapshotRef.current = {
      areaId: null,
      light: null,
      occ: null,
      scene: null,
    };

    const floorIdForRequest = selectedFloorId;

    setPdfLoaded(false);
    setPdfLoading(true);
    setFilteredAreas([]);
    setHasFit(false);

    dispatch(fetchFloorMapData({ floorId: floorIdForRequest }))
      .then((action) => {
        if (lastFloorMapFloorIdRef.current !== floorIdForRequest) return;

        const bv = action?.payload?.boundary_values;
        if (action?.meta?.requestStatus === 'fulfilled' && bv) {
          setBoundaryValues(bv);
        } else {
          setBoundaryValues(null);
        }
        setPdfLoading(false);

        if (action?.meta?.requestStatus !== 'fulfilled') return;
        const mode = displayModeRef.current;
        if (mode === 'Occupancy') {
          dispatch(fetchAreaOccupancyStatus({ floorId: floorIdForRequest }));
        } else if (mode === 'Energy') {
          dispatch(fetchAreaEnergyConsumption({ floorId: floorIdForRequest }));
        }
      })
      .catch(() => {
        if (lastFloorMapFloorIdRef.current === floorIdForRequest) {
          setPdfLoading(false);
        }
      });
  }, [dispatch, selectedFloorId]);

  // Effect B — mode switch only (floor changes are handled by Effect A after map load)
  useEffect(() => {
    if (!selectedFloorId) return;
    if (prevDisplayModeRef.current === displayMode) return;
    prevDisplayModeRef.current = displayMode;
    if (displayMode === 'Occupancy') {
      dispatch(fetchAreaOccupancyStatus({ floorId: selectedFloorId }));
    } else if (displayMode === 'Energy') {
      dispatch(fetchAreaEnergyConsumption({ floorId: selectedFloorId }));
    }
  }, [dispatch, selectedFloorId, displayMode]);

  // Sidebar / heatmap column height = remaining viewport below this layout (do not subtract header again; `top` already accounts for it).
  useEffect(() => {
    const recalc = () => {
      if (!layoutRef.current) return;
      const top = layoutRef.current.getBoundingClientRect().top;
      const footerReserve = 28;
      const h = Math.max(240, Math.floor(window.innerHeight - top - footerReserve));
      setAvailableHeight(h);
    };
    recalc();
    window.addEventListener('resize', recalc);
    return () => window.removeEventListener('resize', recalc);
  }, []);

  // Keep map fitted to container on window resize with optimized timing
  useEffect(() => {
    const onResize = () => {
      setHasFit(false);
      // Use different timing for different screen sizes to ensure proper fitting
      const timeout = isMobile ? 100 : isTablet ? 75 : is2560Screen ? 25 : 50;
      setTimeout(() => {
        applyFitToScreen({ force: true });
      }, timeout);
    };

    // Debounced resize handler for better performance
    let resizeTimeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(onResize, 100);
    };

    window.addEventListener('resize', debouncedResize);
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(resizeTimeout);
    };
  }, [isMobile, isTablet, is2560Screen, boundaryValues, pageDims]);

  // Re-fit map when available space changes (but NOT when area is selected)
  useEffect(() => {
    if (pageDims) { // Only re-fit if PDF is loaded
      setHasFit(false);
      // Use responsive timing for better fitting across different screen sizes
      const timeout = isMobile ? 100 : isTablet ? 75 : is2560Screen ? 25 : 50;
      const timeoutId = setTimeout(() => {
        applyFitToScreen({ force: true });
      }, timeout);
      return () => clearTimeout(timeoutId);
    }
  }, [availableHeight, isMobile, isTablet, is2560Screen, pageDims, boundaryValues]); // Added boundaryValues dependency

  useEffect(() => {
    if (!pdfLoaded || !pageDims) return;
    setHasFit(false);
    const timeout = isMobile ? 100 : isTablet ? 75 : is2560Screen ? 25 : 50;
    const timeoutId = setTimeout(() => {
      applyFitToScreen({ force: true });
    }, timeout);
    return () => clearTimeout(timeoutId);
  }, [pdfLoaded, pageDims, availableHeight, isMobile, isTablet, is2560Screen, boundaryValues]); // Added boundaryValues dependency

  // Trigger fit when pageDims change (PDF loads)
  useEffect(() => {
    if (pageDims && !hasFit) {
      // Small delay to ensure container is ready
      const timeoutId = setTimeout(() => {
        if (containerRef.current) {
          applyFitToScreen({ force: true });
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [pageDims, hasFit, boundaryValues, isMobile, isTablet, is2560Screen, is1440Screen]);

  // Fallback: ensure fit happens even if other mechanisms fail
  useEffect(() => {
    if (pageDims && !hasFit && containerRef.current) {
      const timeoutId = setTimeout(() => {
        if (!hasFit && containerRef.current) {
          applyFitToScreen({ force: true });
        }
      }, 1000); // 1 second delay as last resort
      return () => clearTimeout(timeoutId);
    }
  }, [pageDims, hasFit, boundaryValues, isMobile, isTablet, is2560Screen, is1440Screen]);

  // Auto zoom out when area is clicked to fit entire floor plan to screen
  const [previousSelectedAreaId, setPreviousSelectedAreaId] = useState(null);
  const [defaultFitScale, setDefaultFitScale] = useState(1); // Store the default fit scale

  // Calculate consistent scale for all scenarios (default, fit-to-window, tab changes, area clicks)
  const calculateConsistentScale = () => {
    const { width: cw, height: ch } = getContainerDimensions();
    if (!cw || !ch || !pageDims) return 1.0;

    // Priority: content bounding box (real areas) > backend boundary values > full PDF page.
    let viewW, viewH;

    const hasValidContentBBox =
      contentBBox &&
      Number.isFinite(contentBBox.width) &&
      Number.isFinite(contentBBox.height) &&
      contentBBox.width > 0 &&
      contentBBox.height > 0;

    const hasValidBoundary =
      boundaryValues &&
      Number.isFinite(Number(boundaryValues.x_left)) &&
      Number.isFinite(Number(boundaryValues.x_right)) &&
      Number.isFinite(Number(boundaryValues.y_top)) &&
      Number.isFinite(Number(boundaryValues.y_bottom)) &&
      Number(boundaryValues.x_right) > Number(boundaryValues.x_left) &&
      Number(boundaryValues.y_bottom) > Number(boundaryValues.y_top);

    viewW = pageDims.width;
    viewH = pageDims.height;

    if (!Number.isFinite(viewW) || !Number.isFinite(viewH) || viewW <= 0 || viewH <= 0) {
      viewW = pageDims.width;
      viewH = pageDims.height;
    }

    // Calculate scale ratios
    const scaleX = cw / viewW;
    const scaleY = ch / viewH;

    let fitScale;

    // Use consistent fit logic for all scenarios
    if (isMobile || isTablet) {
      // Mobile/tablet: fit within container with minimal margin
      const marginFactor = isMobile ? 0.95 : 0.96;
      fitScale = Math.min(scaleX, scaleY) * marginFactor;
    } else {
      // Desktop and large screens: fit to window with proper margins
      const marginFactor = is2560Screen ? 0.97 : is1440Screen ? 0.97 : 0.98;
      fitScale = Math.min(scaleX, scaleY) * marginFactor;
    }

    // Ensure minimum scale
    fitScale = Number.isFinite(fitScale) ? Math.max(0.1, fitScale) : 1.0;

    return fitScale;
  };

  const calculateFitPan = () => ({ x: 0, y: 0 });

  const isAtFitView = () => {
    const scaleClose = Math.abs(scale - fitScale) < 0.001;
    const panClose = Math.abs(pan.x) < 0.5 && Math.abs(pan.y) < 0.5;
    return scaleClose && panClose;
  };

  // force=true: Fit button, floor change, window resize, area panel open/close.
  // force=false: background observers — skip if user has zoomed/panned away from fit.
  const applyFitToScreen = ({ force = false } = {}) => {
    if (!pageDims || !containerRef.current) return;
    if (!force && hasFit && !isAtFitView()) return;

    const consistentScale = calculateConsistentScale();
    const fitPan = calculateFitPan();
    setFitScale(consistentScale);
    setScale(consistentScale);
    setPan(fitPan);
    setHasFit(true);
    setDefaultFitScale(consistentScale);
  };

  useEffect(() => {
    if (!containerRef.current || !pageDims || typeof ResizeObserver === 'undefined') return;

    let timeoutId;
    const observer = new ResizeObserver(() => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        applyFitToScreen({ force: false });
      }, 75);
    });

    observer.observe(containerRef.current);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [pageDims, boundaryValues, contentBBox, availableHeight, isMobile, isTablet, is2560Screen, is1440Screen]);

  useEffect(() => {
    if (!pageDims || !contentBBox || contentBBox.width <= 0 || contentBBox.height <= 0) return;
    if (hasFit) return;
    const timeoutId = setTimeout(() => {
      applyFitToScreen({ force: true });
    }, 50);
    return () => clearTimeout(timeoutId);
  }, [contentBBox, pageDims, hasFit]);

  useEffect(() => {
    if (pageDims && containerRef.current) {
      // When an area is clicked (selected), use the same consistent scale
      if (selectedAreaId && selectedAreaId !== previousSelectedAreaId) {
        applyFitToScreen({ force: true });
      }

      // Update the previous selected area ID
      setPreviousSelectedAreaId(selectedAreaId);
    }
  }, [selectedAreaId, pageDims, isMobile, isTablet, is2560Screen, is1440Screen, boundaryValues]); // Added boundaryValues dependency

  // Return to default fit when status panel is closed
  useEffect(() => {
    if (pageDims && containerRef.current && !selectedAreaId && previousSelectedAreaId) {
      // Status panel was closed, return to default fit-to-window
      applyFitToScreen({ force: true });
    }
  }, [selectedAreaId, previousSelectedAreaId, pageDims, boundaryValues, isMobile, isTablet, is2560Screen, is1440Screen]);

  useEffect(() => {
    if (heatmapData.areas) {
      setLastOccupancyStatus(prev => {
        const updated = { ...prev };
        heatmapData.areas.forEach(area => {
          const occ = (area.occupancy_status || '').toLowerCase();
          if (occ === 'occupied' || occ === 'unoccupied') {
            updated[area.area_id || area.id] = occ;
          }
        });
        return updated;
      });
    }
  }, [heatmapData.areas]);

  useEffect(() => {
    if (heatmapData.areas) {
      setLastEnergyStatus(prev => {
        const updated = { ...prev };
        heatmapData.areas.forEach(area => {
          const power = area.energy_status;
          if (power !== null && power !== undefined && power !== 'Unknown') {
            updated[area.area_id || area.id] = power;
          }
        });
        return updated;
      });
    }
  }, [heatmapData.areas]);
  useEffect(() => {
    const q = (searchTerm || '').trim().toLowerCase();
    if (!q || !heatmapData?.areas?.length) {
      setHighlightedAreaId(null);
      return;
    }

    const searchArea = (area) => areaNameMatchesSearch(area, searchTerm);

    // Find all matching areas
    const matches = heatmapData.areas.filter(searchArea);

    if (matches.length === 0) {
      setHighlightedAreaId(null);
      return;
    }

    // Highlight the first matching area
    const match = matches[0];

    const flatCoords = flattenAreaCoords(match);
    const hasCoords = Array.isArray(flatCoords) && flatCoords.some(pt => typeof pt?.x === 'number' && typeof pt?.y === 'number');
    if (!hasCoords) {
      setHighlightedAreaId(null);
      return;
    }
    setHighlightedAreaId(match.area_id || match.id || null);

    // Trigger continuous bounce animation for searched areas
    if (matches.length > 0) {
      setSearchBounceAnimation(true);
    } else {
      setSearchBounceAnimation(false);
    }
  }, [searchTerm, heatmapData.areas]);

  // Update filtered areas when heatmap data changes - always show all areas
  useEffect(() => {
    if (heatmapData.areas) {
      setFilteredAreas(heatmapData.areas);
    }
  }, [heatmapData.areas]);

  useEffect(() => {
    if (areaStatus && areaStatus.zones) {
      // Check for duplicate zone IDs (should not happen, but safeguard)
      const zoneIds = areaStatus.zones.map(z => z.id);
      const duplicateIds = zoneIds.filter((id, index) => zoneIds.indexOf(id) !== index);
      if (duplicateIds.length > 0) {
        console.warn('Warning: Duplicate zone IDs detected:', duplicateIds);
      }

      setZoneLocalValues(prev => {
        const updated = { ...prev };
        areaStatus.zones.forEach(zone => {
          // Ensure zone.id exists and is valid
          if (!zone.id) {
            console.warn('Warning: Zone missing ID:', zone);
            return; // Skip zones without IDs
          }

          if (isSwitched(zone.type)) {
            updated[zone.id] = {
              on_off: (zone.status || zone.on_off || 'Off'),
            };
          } else {
            let backendBrightness = 0;
            if (typeof zone.brightness === 'string') {
              backendBrightness = parseInt(zone.brightness);
            } else if (typeof zone.brightness === 'number') {
              backendBrightness = zone.brightness;
            }

            let backendCct = 0;
            if (zone.cct) {
              backendCct = typeof zone.cct === 'string' ? parseInt(zone.cct) : zone.cct;
            } else if (zone.temperature) {
              backendCct = typeof zone.temperature === 'string' ? parseInt(zone.temperature) : zone.temperature;
            } else if (zone.color_temp) {
              backendCct = typeof zone.color_temp === 'string' ? parseInt(zone.color_temp) : zone.color_temp;
            } else {
              backendCct = 2700;
            }

            // CRITICAL: Preserve existing fade/delay times from local state
            // areaStatus.zones typically doesn't include fade_time/delay_time (they come from scene)
            // We will fetch scene details below if there's an active scene to get the correct fade/delay times
            // For now, preserve existing values or use defaults, but they will be updated from scene if active scene exists
            const existingValues = prev[zone.id] || {};

            // If there's an active scene, we'll fetch its details below to get fade/delay times
            // So we can use defaults here, but they'll be overwritten by scene values
            // If no active scene, preserve existing values or use defaults
            updated[zone.id] = {
              brightness: backendBrightness,
              cct: backendCct,
              // Preserve existing fade/delay times if they exist (from previous scene or user edits)
              // Otherwise use zone.fade_time/delay_time if available, or defaults
              // NOTE: These will be updated from active scene details below if active scene exists
              fadeTime: existingValues.fadeTime || (zone.fade_time ? String(zone.fade_time).padStart(2, '0') : '02'),
              delayTime: existingValues.delayTime || (zone.delay_time ? String(zone.delay_time).padStart(2, '0') : '00'),
            };
          }
        });
        return updated;
      });
    }
  }, [areaStatus?.zones, areaStatus?.area_id]);

  useEffect(() => {
    if (settingsOpen) return;
    if (!areaStatus?.active_scene || !areaStatus?.area_id || !areaStatus?.zones?.length) {
      return;
    }

    const key = getHeatmapSceneStatusKey(areaStatus.area_id, areaStatus.active_scene);
    if (!key || lastSceneStatusKeyRef.current === key) {
      return;
    }
    lastSceneStatusKeyRef.current = key;

    dispatch(fetchSceneStatus({
      areaId: areaStatus.area_id,
      sceneId: areaStatus.active_scene,
    }))
      .unwrap()
      .then((sceneStatusResponse) => {
        const sceneDetails = sceneStatusResponse?.details || sceneStatusResponse || [];

        if (sceneDetails && Array.isArray(sceneDetails) && sceneDetails.length > 0) {
          setZoneLocalValues((prev) => {
            const updated = { ...prev };

            sceneDetails.forEach((detail) => {
              const rawZoneId =
                detail.zone_id ??
                detail.ZoneId ??
                detail.Zone_ID ??
                detail.zoneID;
              const parsedZoneId =
                rawZoneId !== undefined && rawZoneId !== null && rawZoneId !== ''
                  ? Number(rawZoneId)
                  : NaN;
              const hasNumericZoneId = Number.isFinite(parsedZoneId);

              let zone = null;
              if (hasNumericZoneId) {
                zone = areaStatus.zones?.find((z) => Number(z.id) === parsedZoneId);
                if (!zone) {
                  console.warn(`Zone not found by zone_id ${parsedZoneId} for scene detail:`, detail);
                }
              }

              if (!zone && detail.zone_name) {
                zone = areaStatus.zones?.find((z) => z.name === detail.zone_name);
              }

              if (zone) {
                const zoneType = (detail.zone_type || detail.ZoneType || '').toLowerCase();
                if (zoneType === 'dimmed' || zoneType === 'whitetune') {
                  const existingZoneValues = updated[zone.id] || {};
                  const fadeTime = detail.FadeTime ? String(detail.FadeTime).padStart(2, '0') : '02';
                  const delayTime = detail.DelayTime ? String(detail.DelayTime).padStart(2, '0') : '00';

                  updated[zone.id] = {
                    ...existingZoneValues,
                    fadeTime,
                    delayTime,
                  };
                }
              } else {
                console.warn(`Zone not found for scene detail:`, {
                  zone_id: detail.zone_id,
                  zone_name: detail.zone_name,
                  zone_type: detail.zone_type,
                  availableZones: areaStatus.zones?.map((z) => ({ id: z.id, name: z.name })),
                });
              }
            });

            return updated;
          });
        } else {
          console.warn('Scene details not found or invalid');
        }
      })
      .catch((error) => {
        console.error('Failed to fetch active scene details for fade/delay times:', error);
      });
  }, [
    areaStatus?.area_id,
    areaStatus?.active_scene,
    areaStatus?.zones?.length,
    dispatch,
    settingsOpen,
  ]);

  useEffect(() => {
    if (
      highlightedFofpZone &&
      Number(highlightedFofpZone.areaId) === Number(selectedAreaId)
    ) {
      return;
    }
    setZonePage(0);
  }, [selectedAreaId, areaStatus?.zones?.length, highlightedFofpZone]);

  useEffect(() => {
    if (!highlightedFofpZone || !areaStatus?.zones?.length) return;
    if (Number(areaStatus.area_id) !== Number(highlightedFofpZone.areaId)) return;

    const idx = findFofpZoneIndexInPanelList(areaStatus.zones, highlightedFofpZone);
    if (idx >= 0) {
      const perPage = getSidebarZonesPerPage(buildSidebarZonesToShow(areaStatus.zones));
      setZonePage(Math.floor(idx / perPage));
    }
  }, [
    areaStatus,
    highlightedFofpZone,
  ]);

  useEffect(() => {
    dispatch(fetchFofpConfig());
  }, [dispatch]);

  useEffect(() => {
    if (areaStatus && areaStatus.zones) {
      setShadesLocalValues(
        shades.reduce((acc, shade) => {
          const zoneId = resolveShadeZoneId(shade);
          if (zoneId == null) return acc;
          acc[zoneId] = parseShadeLevel(shade.level);
          return acc;
        }, {})
      );
    }
  }, [areaStatus]);

  useEffect(() => {
    setFilteredAreas(heatmapData.areas || []);
  }, [heatmapData.areas]);

  // Compute crop bbox from all area coordinates (trim PDF outer whitespace)
  useEffect(() => {
    const all = (heatmapData.areas || [])
      .flatMap(a => flattenAreaCoords(a)
        .filter(pt => typeof pt?.x === 'number' && typeof pt?.y === 'number'));
    if (!all.length) {
      setContentBBox(null);
      return;
    }
    const raw = getPolygonBoundingBox(all);
    const pad = 8;
    // Use actual PDF dimensions for bounding box calculation, fallback to A4 if not available
    const maxWidth = pageDims?.width || A4_WIDTH;
    const maxHeight = pageDims?.height || A4_HEIGHT;
    const minX = Math.max(0, raw.minX - pad);
    const minY = Math.max(0, raw.minY - pad);
    const maxX = Math.min(maxWidth, raw.maxX + pad);
    const maxY = Math.min(maxHeight, raw.maxY + pad);
    const newBBox = { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
    setContentBBox(newBBox);
  }, [heatmapData.areas, pageDims]);

  // Refresh floor mode data only after controls change status on the *same* area.
  // Area click/select must not re-hit light_status / occupancy / energy.
  useEffect(() => {
    if (!areaStatus?.area_id || !selectedFloorId) return;

    const prev = lastAreaStatusSnapshotRef.current;
    const next = {
      areaId: areaStatus.area_id,
      light: areaStatus.light_status,
      occ: areaStatus.occupancy_status,
      scene: areaStatus.active_scene,
    };

    if (prev.areaId !== next.areaId) {
      lastAreaStatusSnapshotRef.current = next;
      return;
    }

    const statusChanged =
      prev.light !== next.light ||
      prev.occ !== next.occ ||
      prev.scene !== next.scene;

    lastAreaStatusSnapshotRef.current = next;
    if (!statusChanged) return;

    if (
      prev.scene === next.scene &&
      areaLiveFieldsAlreadyOnMap(
        heatmapData?.areas,
        next.areaId,
        next.light,
        next.occ
      )
    ) {
      return;
    }

    const refreshMapData = async () => {
      try {
        if (displayMode === "Occupancy") {
          await dispatch(fetchAreaOccupancyStatus({ floorId: selectedFloorId }));
        } else if (displayMode === "Energy") {
          await dispatch(fetchAreaEnergyConsumption({ floorId: selectedFloorId }));
        } else {
          await dispatch(fetchFloorMapData({ floorId: selectedFloorId }));
        }
      } catch (error) {
        // Failed to refresh map data
      }
    };

    const timeoutId = setTimeout(refreshMapData, 1000);
    return () => clearTimeout(timeoutId);
  }, [areaStatus?.area_id, areaStatus?.light_status, areaStatus?.occupancy_status, areaStatus?.active_scene, dispatch, selectedFloorId, displayMode, heatmapData?.areas]);

  const handleZoom = (direction) => {
    setScale((prev) => {
      let next = +(prev + direction * SCALE_STEP).toFixed(2);
      const minScale = isTablet ? MIN_SCALE_TABLET : is2560Screen ? 0.05 : MIN_SCALE;
      const cap = Math.max(MAX_SCALE, getDynamicMaxScale());
      next = Math.max(minScale, Math.min(next, cap));
      return next;
    });
  };

  // Center zoom function for zoom controls
  const handleCenterZoom = (direction) => {
    // Use the existing handleZoom function instead of handleWheel
    handleZoom(direction);
  };

  const getMaxAllowedScale = () => {
    const container = containerRef.current;
    if (!container) return 1.0;
    const viewW = pageDims?.width || A4_WIDTH;
    const viewH = pageDims?.height || A4_HEIGHT;
    const maxScaleX = container.offsetWidth / viewW;
    const maxScaleY = container.offsetHeight / viewH;
    return Math.min(maxScaleX, maxScaleY);
  };

  const handleFit = () => {
    applyFitToScreen({ force: true });
  };
  const handleFitButtonClick = () => {
    handleFit();
  };
  const getCentroid = (pts) => {
    const x = pts.reduce((sum, p) => sum + p.x, 0) / pts.length;
    const y = pts.reduce((sum, p) => sum + p.y, 0) / pts.length;
    return { x, y };
  };

  // Helper function to calculate Energy color for a given savings percentage (0-100)
  const getEnergyColor = (savingsPercent) => {
    if (savingsPercent === undefined || Number.isNaN(savingsPercent)) {
      return 'transparent';
    }

    const pct = Math.min(1, Math.max(0, savingsPercent / 100));

    // Use the energy color from API
    const hex = energyBaseColor.replace('#', '');
    const [rBase, gBase, bBase] = [
      parseInt(hex.substr(0, 2), 16),
      parseInt(hex.substr(2, 2), 16),
      parseInt(hex.substr(4, 2), 16),
    ];
    // Blend with white but keep a minimum presence of the base color at 0%
    const minBaseWeight = 0.15; // 15% of base color at 0%
    const baseWeight = minBaseWeight + (1 - minBaseWeight) * pct;
    const whiteWeight = 1 - baseWeight;
    const r = Math.round(whiteWeight * 255 + baseWeight * rBase);
    const g = Math.round(whiteWeight * 255 + baseWeight * gBase);
    const b = Math.round(whiteWeight * 255 + baseWeight * bBase);
    return `rgba(${r}, ${g}, ${b}, 0.7)`;
  };

  const getFill = (area) => {
    if (isMapProcessorUnreachable(area)) {
      return 'transparent';
    }
    if (displayMode === 'Occupancy') {
      const occ = (area.occupancy_status || '').toLowerCase().trim();
      if (occ === 'occupied') {
        // Convert hex to rgba with opacity
        const hex = occupancyColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        return `rgba(${r}, ${g}, ${b}, 0.5)`;
      } else if (occ === 'unoccupied') {
        return 'rgba(95,95,95,0.5)';
      }
      return 'transparent';
    } else if (displayMode === 'Light') {
      return resolveLightModeFill(area, lightColor);
    } else if (displayMode === 'Energy') {
      // Compute savings percentage using (maxpower - instantaneous) / maxpower * 100
      const current = Number(area.instantaneous_power);
      const max = Number(area.instantaneous_max_power);
      const hasInstant = !Number.isNaN(current) && !Number.isNaN(max) && max > 0;

      let rawPercent;
      if (hasInstant) {
        // Calculate savings percentage: (max - current) / max * 100
        rawPercent = ((max - current) / max) * 100;
      } else if (
        area.load_percentage !== null &&
        area.load_percentage !== undefined &&
        area.load_percentage !== 'Unknown'
      ) {
        // If no instantaneous data, use load_percentage as savings
        rawPercent = Number(area.load_percentage);
      }

      // Use the helper function to calculate color
      return getEnergyColor(rawPercent);
    }
    return 'transparent';
  };

  const handleFloorChange = (direction) => {
    if (!floors || floors.length === 0) return;

    // Get available floors for current user
    const availableFloors = getAvailableFloors();
    if (availableFloors.length === 0) return;

    const currentIndex = availableFloors.findIndex(floor => floor.id === selectedFloorId);
    if (currentIndex === -1) return;

    let newIndex = currentIndex + direction;
    if (newIndex < 0) newIndex = availableFloors.length - 1;
    if (newIndex >= availableFloors.length) newIndex = 0;

    const newFloorId = availableFloors[newIndex].id;
    const newFloorName = availableFloors[newIndex].floor_name;

    // Check if user can access this floor
    if (!canAccessFloor(newFloorId)) {
      return;
    }

    dispatch(setSelectedFloorId(newFloorId));

    // Note: The useEffect will handle data fetching when selectedFloorId changes
  };

  const handleAreaClick = async (area) => {
    setHighlightedFofpZone(null);
    const areaId = Number(area.area_id ?? area.id);
    if (!Number.isFinite(areaId)) return;
    if (
      Number(selectedAreaId) === areaId &&
      shouldSkipAreaStatusRefetch({
        areaId,
        areaStatus,
        areaStatusLoading,
        mapAreas: heatmapData?.areas,
      })
    ) {
      return;
    }
    setSelectedAreaId(areaId);
    dispatch(fetchAreaStatus(areaId));
  };

  const scenes = areaStatus?.area_scenes || [];
  const totalPages = Math.ceil(scenes.length / SCENES_PER_PAGE);
  const currentScenes = scenes.slice(scenePage * SCENES_PER_PAGE, (scenePage + 1) * SCENES_PER_PAGE);

  const refreshAllData = async () => {
    if (!areaStatus?.area_id || !areaStatus?.floor_id) return;

    const floorId = areaStatus.floor_id;
    const tasks = [dispatch(fetchAreaStatus(areaStatus.area_id))];
    if (displayMode === "Occupancy") {
      tasks.push(dispatch(fetchAreaOccupancyStatus({ floorId })));
    } else if (displayMode === "Energy") {
      tasks.push(dispatch(fetchAreaEnergyConsumption({ floorId })));
    } else {
      tasks.push(dispatch(fetchFloorMapData({ floorId })));
    }
    await Promise.all(tasks);
  };

  const refreshAllDataAndMap = async () => {
    if (!selectedFloorId) return;

    try {
      await dispatch(refreshAllHeatmapData({
        floorId: selectedFloorId,
        areaId: areaStatus?.area_id || null,
        displayMode,
      })).unwrap();
    } catch (error) {
      // Failed to refresh heatmap data
    }
  };

  const handleManualRefresh = async () => {
    if (!selectedFloorId) return;

    setRefreshing(true);
    try {
      await refreshAllDataAndMap();
    } catch (error) {
      // Manual refresh failed
    } finally {
      setRefreshing(false);
    }
  };

  const handleMainToggle = async () => {
    if (!areaStatus) return;

    // Check if user has permission to update area status
    if (!canUpdateAreaStatus()) {
      return;
    }

    setMainToggleUpdating(true);
    const newStatus = areaStatus.light_status === 'On' ? 'Off' : 'On';
    try {
      await dispatch(toggleAllZonesInArea({ areaId: areaStatus.area_id, action: newStatus })).unwrap();
      // Wait for zone fade before live confirm — immediate read lands mid-fade.
      await waitForFadeSettle(fadeSettleMsFromZones(areaStatus.zones));
      await dispatch(fetchAreaStatus(areaStatus.area_id));
      await dispatch(fetchProcessors());
    } catch (e) {
      // Optionally show error
    } finally {
      setMainToggleUpdating(false);
    }
  };

  function getDefaultZoneValues(zone) {
    return {
      brightness: parseInt(zone.brightness) || 0,
      cct: zone.cct || zone.color_temp || 1600,
      fadeTime: '02',
      delayTime: '00',
    };
  }

  function handleZoneValueChange(zoneId, changed) {
    setZoneLocalValues(prev => ({
      ...prev,
      [zoneId]: { ...prev[zoneId], ...changed },
    }));
  }

  // Track initial zone values to detect actual user changes
  const [initialZoneValues, setInitialZoneValues] = React.useState({});

  // Store initial values when area status is first loaded
  React.useEffect(() => {
    if (areaStatus && areaStatus.zones) {
      const initial = {};
      areaStatus.zones.forEach(zone => {
        if (!isSwitched(zone.type)) {
          const existingLocal = zoneLocalValues[zone.id];
          if (existingLocal) {
            initial[zone.id] = {
              brightness: existingLocal.brightness,
              cct: existingLocal.cct,
              fadeTime: existingLocal.fadeTime,
              delayTime: existingLocal.delayTime,
            };
          }
        }
      });
      setInitialZoneValues(initial);
    }
  }, [areaStatus?.area_id]); // Only update when area changes

  async function handleApplyZones() {
    // Check if user has permission to update area status
    if (!canUpdateAreaStatus()) {
      return;
    }

    setZoneUpdating(true);

    // Only get zones that have been modified (have local values different from initial)
    const sidebarZones = buildSidebarZonesToShow(areaStatus.zones);
    const perPage = getSidebarZonesPerPage(sidebarZones);
    const zonesToUpdate = sidebarZones
      .slice(zonePage * perPage, (zonePage + 1) * perPage)
      .filter(zone => {
        const localValues = zoneLocalValues[zone.id];
        const initialValues = initialZoneValues[zone.id];
        if (!localValues) return false; // No local changes

        // Check if any value has actually changed
        if (isSwitched(zone.type)) {
          const localOnOff = localValues.on_off;
          const originalOnOff = zone.on_off || zone.status || 'Off';
          return localOnOff !== originalOnOff;
        }

        if (isDimmed(zone.type)) {
          const localBrightness = localValues.brightness;
          const originalBrightness = parseInt(zone.brightness) || 0;

          // Only check fade/delay if they exist in initial values (user modified them)
          let fadeChanged = false;
          let delayChanged = false;
          if (initialValues) {
            fadeChanged = localValues.fadeTime !== initialValues.fadeTime;
            delayChanged = localValues.delayTime !== initialValues.delayTime;
          }

          return localBrightness !== originalBrightness || fadeChanged || delayChanged;
        }

        if (isWhitening(zone.type)) {
          const localBrightness = localValues.brightness;
          const originalBrightness = parseInt(zone.brightness) || 0;
          const localCct = localValues.cct;
          const originalCct = zone.cct || zone.color_temp || 2700;

          // Only check fade/delay if they exist in initial values (user modified them)
          let fadeChanged = false;
          let delayChanged = false;
          if (initialValues) {
            fadeChanged = localValues.fadeTime !== initialValues.fadeTime;
            delayChanged = localValues.delayTime !== initialValues.delayTime;
          }

          return localBrightness !== originalBrightness ||
            localCct !== originalCct ||
            fadeChanged ||
            delayChanged;
        }

        return false; // No changes detected
      })
      .map(zone => {
        const values = zoneLocalValues[zone.id];

        if (isSwitched(zone.type)) {
          const localOnOff = values.on_off ?? (zone.on_off || zone.status);
          return {
            zone_id: zone.id,
            zone_type: "Switched",
            switched_state: localOnOff
          };
        }

        if (isDimmed(zone.type)) {
          return {
            zone_id: zone.id,
            zone_type: "Dimmed",
            level: Number(values.brightness),
            fade_time: values.fadeTime || "02",
            delay_time: values.delayTime || "00"
          };
        }

        if (isWhitening(zone.type)) {
          return {
            zone_id: zone.id,
            zone_type: "WhiteTune",
            level: Number(values.brightness),
            kelvin: Number(values.cct),
            fade_time: values.fadeTime || "02",
            delay_time: values.delayTime || "00"
          };
        }

        return {
          zone_id: zone.id,
          zone_type: zone.type || "Unknown",
          ...values
        };
      });

    // Only proceed if there are actually changes to apply
    if (zonesToUpdate.length === 0) {
      setZoneUpdating(false);
      return;
    }

    try {
      await dispatch(updateZonesByArea({
        areaId: selectedAreaId,
        zones: zonesToUpdate,
      })).unwrap();

      // Confirm after fade settles so read is not mid-transition.
      await waitForFadeSettle(fadeSettleMsFromZones(zonesToUpdate));
      await dispatch(fetchAreaStatus(selectedAreaId));

      // Update initial values after successful apply to track new baseline
      setInitialZoneValues(prev => {
        const updated = { ...prev };
        zonesToUpdate.forEach(zoneUpdate => {
          const zoneId = zoneUpdate.zone_id;
          const localValues = zoneLocalValues[zoneId];
          if (localValues) {
            updated[zoneId] = {
              brightness: localValues.brightness,
              cct: localValues.cct,
              fadeTime: localValues.fadeTime,
              delayTime: localValues.delayTime,
            };
          }
        });
        return updated;
      });

    } catch (e) {
      // Optionally show error
    } finally {
      setZoneUpdating(false);
    }
  }

  const selectedAreaObj = heatmapData.areas?.find(
    a => (a.area_id || a.id) === selectedAreaId
  );

  const getCurrentAreaDisplayName = () =>
    areaStatus?.area_name || selectedAreaObj?.name || selectedAreaObj?.area_name || "Zone";

  const openAreaRenameDialog = () => {
    if (!canRenameArea()) return;
    setAreaRenameError("");
    setAreaRenameValue(getCurrentAreaDisplayName());
    setAreaRenameOpen(true);
  };

  const closeAreaRenameDialog = () => {
    setAreaRenameOpen(false);
    setAreaRenameError("");
    setAreaRenameSaving(false);
  };

  const handleAreaRenameSubmit = async () => {
    const trimmed = areaRenameValue.trim();
    if (!trimmed) {
      setAreaRenameError("Name must not be empty.");
      return;
    }
    if (trimmed.length > 512) {
      setAreaRenameError("Name must be at most 512 characters.");
      return;
    }
    const areaId = areaStatus?.area_id ?? selectedAreaObj?.area_id ?? selectedAreaObj?.id;
    if (areaId == null || Number(areaId) < 1) {
      setAreaRenameError("Unable to determine area.");
      return;
    }
    setAreaRenameSaving(true);
    setAreaRenameError("");
    try {
      await dispatch(
        renameArea({ area_id: Number(areaId), new_name: trimmed })
      ).unwrap();
      closeAreaRenameDialog();
    } catch (e) {
      setAreaRenameError(typeof e === "string" ? e : "Failed to rename area");
    } finally {
      setAreaRenameSaving(false);
    }
  };

  const fetchSettingsApi = async (areaId) => {
    return {
      locked: false,
      mode: "Auto",
      selectedScene: 1,
      scenes: [
        { id: 1, name: "Scene 1" },
        { id: 2, name: "Scene 2" }
      ],
      zones: [
        { id: 1, name: "Downlight", brightness: 40, brightnessMin: 0, brightnessMax: 100 },
        { id: 2, name: "Front Row", brightness: 60, brightnessMin: 0, brightnessMax: 100 }
      ]
    };
  };

  const handleShadeSlider = (id, value) => {
    setShadesLocalValues(prev => ({
      ...prev,
      [id]: Math.round(value), // Round to whole number
    }));
  };

  const handleShadesPreset = (percent) => {
    setShadesLocalValues(
      shades.reduce((acc, shade) => {
        const zoneId = resolveShadeZoneId(shade);
        if (zoneId == null) return acc;
        acc[zoneId] = percent;
        return acc;
      }, {})
    );
  };

  const runApplyShadesOnce = useMemo(() => createSingleFlight(), []);
  const handleApplyShades = () =>
    runApplyShadesOnce(async () => {
    // Check if user has permission to update area status
    if (!canUpdateAreaStatus()) {
      return;
    }

    setShadesUpdating(true);
    try {
      const shadesToUpdate = buildShadesUpdatePayload(shades, shadesLocalValues);
      if (shadesToUpdate.length === 0) {
        setShadesUpdating(false);
        return;
      }

      await dispatch(updateZonesByArea({
        areaId: areaStatus.area_id,
        zones: shadesToUpdate,
      })).unwrap();

      // Only refresh the specific area status, not all heatmap data
      // This prevents all zones from showing as "updated" in logs
      await dispatch(fetchAreaStatus(areaStatus.area_id));
    } catch (e) {
      // Optionally show error
    } finally {
      setShadesUpdating(false);
    }
  });

  const zonesToShow = buildSidebarZonesToShow(areaStatus?.zones);
  const zonesPerPage = getSidebarZonesPerPage(zonesToShow);
  const totalZonePages = Math.ceil(zonesToShow.length / zonesPerPage) || 1;
  // Paginated list — no inner scrollbar (2 CCT zones or 4 non-CCT zones per page).
  const sidebarZoneListSx = HEATMAP_ZONES_LIST_PAGINATED_SX;
  const visibleSidebarZones = zonesToShow.slice(
    zonePage * zonesPerPage,
    (zonePage + 1) * zonesPerPage
  );

  useEffect(() => {
    const maxPage = Math.max(0, totalZonePages - 1);
    if (zonePage > maxPage) {
      setZonePage(maxPage);
    }
  }, [zonePage, totalZonePages]);

  const fofpOverlayConfig = useMemo(() => {
    const fromFloor = heatmapData?.fofp_config;
    if (!fromFloor && !fofpConfigFromStore) return null;
    return {
      ...(fofpConfigFromStore || {}),
      ...(fromFloor || {}),
      marker_color:
        fromFloor?.marker_color ?? fofpConfigFromStore?.marker_color,
    };
  }, [heatmapData?.fofp_config, fofpConfigFromStore]);

  const handleFofpZoneClick = useCallback(
    ({ zoneId, areaId, zoneName, lightLevel }) => {
      if (areaId == null) return;
      const highlight = {
        areaId: Number(areaId),
        zoneId: zoneId != null ? Number(zoneId) : null,
        zoneName: zoneName || "",
        lightLevel: lightLevel ?? null,
      };
      setHighlightedFofpZone(highlight);
      setSelectedAreaId(Number(areaId));

      const jumpToZonePage = (zones) => {
        if (!zones?.length) return;
        const idx = findFofpZoneIndexInPanelList(zones, highlight);
        if (idx >= 0) {
          const perPage = getSidebarZonesPerPage(buildSidebarZonesToShow(zones));
          setZonePage(Math.floor(idx / perPage));
        }
      };

      if (
        areaStatus?.area_id != null &&
        Number(areaStatus.area_id) === highlight.areaId &&
        areaStatus.zones?.length
      ) {
        jumpToZonePage(areaStatus.zones);
      }

      dispatch(fetchAreaStatus(Number(areaId)));
    },
    [dispatch, areaStatus]
  );

  // Match alerts by LEAP area_code (never by leaf name)
  const hasActiveAlert = (area) =>
    hasActiveAlertForArea(activeAlerts, area, selectedFloorId);

  const findAlertForArea = (area) =>
    findAlertForFloorplanArea(activeAlerts, area, selectedFloorId);

  const navIconSx = {
    bgcolor: '#fff',
    borderRadius: '50%',
    boxShadow: 1,
    width: { xs: 24, md: 28 },
    height: { xs: 24, md: 28 },
    minWidth: { xs: 24, md: 28 },
    minHeight: { xs: 24, md: 28 },
    p: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '&:hover': { bgcolor: '#eee' }
  };

  const heatmapLegendLabelSx = {
    color: 'var(--heatmap-legends-nav-text, #000)',
    textShadow: 'none',
  };

  return (
    <>
      {/* CSS Animation for continuous search bounce - centered scale only */}
      <style>
        {`
          @keyframes searchBounce {
            0% { transform: scale(1); }
            50% { transform: scale(0.95); }
            100% { transform: scale(1); }
          }
        `}

      </style>
      <Box
        ref={layoutRef}
        className="heatmap-container"
        sx={{
          width: '100%',
          height: availableHeight
            ? `${availableHeight}px`
            : { xs: 'auto', sm: 'auto', md: 'calc(100dvh - 140px)' },
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          overflow: { xs: 'auto', sm: 'hidden' },
          p: 0,
          m: 0,
          bgcolor: 'transparent',
          // Ensure no gaps between columns
          gap: 0,
          // Force full width utilization
          maxWidth: '100%',
          boxSizing: 'border-box',
          // Ensure the container takes full available height (matches customized)
          minHeight: { xs: 'auto', sm: 'calc(100dvh - 140px)' },
          position: 'relative', // Add relative positioning for absolute legends
        }}
      >
        {/* Heatmap and Legends/Navigation Column */}
        <Box
          sx={{
            flex: '1 1 100%', // Always take full available space
            minWidth: 0,
            height: { xs: 'auto', sm: '100%' },
            minHeight: { xs: 280, sm: '100%' },
            display: 'flex',
            flexDirection: 'column',
            p: 0,
            m: 0,
            position: 'relative',
            overflow: 'hidden',
            bgcolor: 'transparent',
            // Force the heatmap to utilize all available space
            width: '100%',
            maxWidth: '100%',
            // Additional properties to ensure full space utilization
            flexGrow: 1,
            flexShrink: 1,
            flexBasis: '100%',
            // Ensure the container takes full available height
            minHeight: '100%',
          }}
        >
          {/* Floor Plan Container with Left/Right Padding and Zoom Controls - Reduced Height */}
          <Box
            sx={{
              flex: '0 0 auto', // Don't grow, fixed height
              height: '95%', // Reduced from 100% to 75%
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              bgcolor: 'rgba(255, 255, 255, 1)', // 0% opaque White,
              borderRadius: 1,
              border: '1px solid rgba(0,0,0,0.1)',
              p: { xs: 1, sm: 1.5, md: 2, lg: 2.5 },
              gap: { xs: 1, sm: 1.5, md: 2 },
            }}
          >
            {/* Zoom Controls - Left Wall of PDF */}
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 1,
              alignItems: 'center',
              minWidth: { xs: 50, sm: 60, md: 70 },
              flexShrink: 0,
            }}>
              <IconButton
                onClick={() => handleCenterZoom(1)}
                disabled={scale >= 5.0}
                size={isMobile ? 'small' : 'medium'}
                sx={{ bgcolor: 'rgba(255,255,255,0.9)', boxShadow: 1 }}
              >
                <ZoomInIcon fontSize={isMobile ? 'small' : 'medium'} />
              </IconButton>
              <IconButton
                onClick={() => handleCenterZoom(-1)}
                disabled={scale <= 0.1}
                size={isMobile ? 'small' : 'medium'}
                sx={{ bgcolor: 'rgba(255,255,255,0.9)', boxShadow: 1 }}
              >
                <ZoomOutIcon fontSize={isMobile ? 'small' : 'medium'} />
              </IconButton>
              <IconButton
                onClick={handleFitButtonClick}
                size={isMobile ? 'small' : 'medium'}
                title="Reset to fit position"
                sx={{ bgcolor: 'rgba(255,255,255,0.9)', boxShadow: 1 }}
              >
                <FitScreenIcon fontSize={isMobile ? 'small' : 'medium'} />
              </IconButton>
            </Box>

            {/* PDF Container - Takes remaining space with padding */}
            <Box
              sx={{
                flex: 1,
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                bgcolor: 'transparent',
                minWidth: 0,
                minHeight: 0,
                // Add padding to wrap the floor plan properly
                pl: { xs: 2, sm: 3, md: 4 }, // Left padding - prevents legend text clipping
                pr: { xs: 2, sm: 3, md: 4 }, // Right padding
                pb: { xs: 2, sm: 3, md: 4 }, // Bottom padding
              }}
            >
              {heatmapError ? (
                <Alert severity="error" sx={{ maxWidth: 480, m: 2 }}>
                  {heatmapError}
                </Alert>
              ) : (
              <HeatmapPdfSvgViewer
                containerRef={containerRef}
                pdfUrl={pdfUrl}
                pageDims={pageDims}
                setPageDims={setPageDims}
                setPdfLoaded={setPdfLoaded}
                scale={scale}
                setScale={setScale}
                fitScale={fitScale}
                hasFit={hasFit}
                handleFit={handleFit}
                areas={filteredAreas}
                getFill={getFill}
                handleAreaClick={handleAreaClick}
                searchTerm={searchTerm}
                pan={pan}
                setPan={setPan}
                isDragging={isDragging}
                setIsDragging={setIsDragging}
                dragStart={dragStart}
                setDragStart={setDragStart}
                contentBBox={contentBBox}
                boundaryValues={boundaryValues}
                containerFitMode
                highlightedAreaId={highlightedAreaId}
                searchBounceAnimation={searchBounceAnimation}
                hasActiveAlert={hasActiveAlert}
                findAlertForArea={findAlertForArea}
                navigate={navigate}
                fofpEnabled={heatmapData?.fofp_enabled === true}
                fofpPositions={heatmapData?.fofp_positions}
                fofpConfig={fofpOverlayConfig}
                onFofpZoneClick={handleFofpZoneClick}
                highlightedFofpZone={highlightedFofpZone}
              />
              )}
            </Box>

            {/* Legends and Floor navigation - Positioned directly on heatmap container */}
            <Box
              className="heatmap-legends-nav"
              sx={{
                position: 'absolute',
                bottom: { xs: 8, sm: 12, md: 16 },
                left: { xs: 8, sm: 12, md: 16 },
                right: { xs: 8, sm: 12, md: 16 },
                zIndex: 10,
                width: 'auto',
                maxWidth: '100%',
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'stretch', sm: 'center' },
                justifyContent: 'space-between',
                gap: { xs: 1, sm: 1.5 },
                minHeight: { xs: 'auto', sm: 44 },
                background: 'var(--heatmap-legends-nav-bg, #fff)',
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                px: { xs: 1.5, sm: 2, md: 2.5 },
                py: { xs: 1, sm: 0.75 },
                flexShrink: 0,
              }}
            >
              {/* Display mode legend — left */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0, overflow: 'visible', position: 'relative', zIndex: 2 }}>
                <Typography
                  fontSize={{ xs: 16, sm: 17, md: 18 }}
                  fontWeight={600}
                  sx={{
                    color: 'var(--heatmap-legends-nav-text, #000)',
                    textShadow: 'none',
                  }}
                >
                  {displayMode === 'Energy' ? 'Energy Savings' : displayMode}:
                </Typography>
                {displayMode === 'Light' && (() => {
                  const brightColor = getLightLevelFillColor(100, lightColor);
                  const mediumColor = getLightLevelFillColor(50, lightColor);
                  const offColor = getLightLevelFillColor(0, lightColor);

                  return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box sx={{ width: 12, height: 12, bgcolor: brightColor, borderRadius: 0.5 }} />
                      <Typography
                        fontSize={{ xs: 15, sm: 16, md: 17 }}
                        sx={heatmapLegendLabelSx}
                      >
                        Bright
                      </Typography>
                      <Box sx={{ width: 12, height: 12, bgcolor: mediumColor, borderRadius: 0.5 }} />
                      <Typography
                        fontSize={{ xs: 15, sm: 16, md: 17 }}
                        sx={heatmapLegendLabelSx}
                      >
                        Medium
                      </Typography>
                      <Box sx={{ width: 12, height: 12, bgcolor: offColor, borderRadius: 0.5 }} />
                      <Typography
                        fontSize={{ xs: 15, sm: 16, md: 17 }}
                        sx={heatmapLegendLabelSx}
                      >
                        Off
                      </Typography>
                    </Box>
                  );
                })()}
                {displayMode === 'Occupancy' && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 12, height: 12, bgcolor: occupancyColor, borderRadius: 0.5 }} />
                    <Typography
                      fontSize={{ xs: 15, sm: 16, md: 17 }}
                      sx={heatmapLegendLabelSx}
                    >
                      Occupied
                    </Typography>
                    <Box sx={{ width: 12, height: 12, bgcolor: 'rgba(95,95,95,0.5)', borderRadius: 0.5 }} />
                    <Typography
                      fontSize={{ xs: 15, sm: 16, md: 17 }}
                      sx={heatmapLegendLabelSx}
                    >
                      Unoccupied
                    </Typography>
                  </Box>
                )}
                {displayMode === 'Energy' && (() => {
                  // Use the same helper function to calculate colors for legend
                  // This ensures legend colors exactly match floorplan colors
                  const highColor = getEnergyColor(100); // 100% savings
                  const mediumColor = getEnergyColor(50);  // 50% savings
                  const lowColor = getEnergyColor(0);      // 0% savings

                  return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box sx={{ width: 12, height: 12, bgcolor: highColor, borderRadius: 0.5 }} />
                      <Typography
                        fontSize={{ xs: 15, sm: 16, md: 17 }}
                        sx={heatmapLegendLabelSx}
                      >
                        High
                      </Typography>
                      <Box sx={{ width: 12, height: 12, bgcolor: mediumColor, borderRadius: 0.5 }} />
                      <Typography
                        fontSize={{ xs: 15, sm: 16, md: 17 }}
                        sx={heatmapLegendLabelSx}
                      >
                        Medium
                      </Typography>
                      <Box sx={{ width: 12, height: 12, bgcolor: lowColor, borderRadius: 0.5 }} />
                      <Typography
                        fontSize={{ xs: 15, sm: 16, md: 17 }}
                        sx={heatmapLegendLabelSx}
                      >
                        Low
                      </Typography>
                    </Box>
                  );
                })()}
              </Box>

              {/* Floor navigation — visually centered between legend and actions */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  justifyContent: 'center',
                  flexShrink: 0,
                  alignSelf: { xs: 'center', sm: 'center' },
                  position: { xs: 'static', sm: 'absolute' },
                  left: { sm: '50%' },
                  transform: { sm: 'translateX(-50%)' },
                }}
              >
                <IconButton
                  size="small"
                  onClick={() => handleFloorChange(-1)}
                  disabled={!floors || floors.length === 0}
                  sx={{ ...navIconSx }}
                >
                  <ArrowBackIcon fontSize="small" />
                </IconButton>
                <Typography
                  fontSize={{ xs: 11, sm: 12, md: 13 }}
                  fontWeight={700}
                  sx={{
                    minWidth: { xs: 72, sm: 100, md: 120 },
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                    ...heatmapLegendLabelSx,
                  }}
                >
                  {floors?.find(f => f.id === selectedFloorId)?.floor_name || 'Floor'}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => handleFloorChange(1)}
                  disabled={!floors || floors.length === 0}
                  sx={{ ...navIconSx }}
                >
                  <ArrowForwardIcon fontSize="small" />
                </IconButton>
              </Box>

              <HeatmapFooterActions />
            </Box>
          </Box>
        </Box>
        {/* Status Panel - responsive based on screen size */}
        {selectedAreaId && (
          <Box
            className="heatmap-area-sidebar"
            sx={{
              ...ADVANCED_HEATMAP_SIDEBAR_SX,
              width: { xs: '100%', sm: '38%', md: '22%', lg: '20%', xl: '18%' },
              minWidth: { xs: 0, sm: 260, md: 320, lg: 360, xl: 400 },
              maxWidth: { xs: '100%', sm: 380, md: 380, lg: 420, xl: 480 },
              maxHeight: { xs: '50vh', sm: 'none', md: '100%' },
              background: areaSidebarPanelBg,
              border: `1px solid ${areaSidebarPanelBorder}`,
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
              p: 0,
              m: 0,
              boxSizing: 'border-box',
              zIndex: 2,
              transition: 'width 0.3s',
              borderRadius: '14px 0 0 14px',
              position: 'static',
            }}
          >
            {/* Fixed header — body below scrolls */}
            <Box sx={{
              ...ADVANCED_HEATMAP_SIDEBAR_STICKY_HEADER_SX,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: { xs: 1, sm: 1.5, md: 2 },
              py: { xs: 0.5, sm: 0.75, md: 1 },
              minHeight: { xs: 25, sm: 28, md: 32 },
              bgcolor: areaSidebarPanelBg,
              width: '100%',
              gap: 1,
            }}>
              {/* Left side with toggle and area name */}
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5, // Reduced gap
                flex: 1,
                minWidth: 0,
                overflow: 'hidden' // Ensure container doesn't overflow
              }}>
                {areaStatus && (
                  <MainAreaToggle
                    isOn={areaStatus.light_status === 'On'}
                    onClick={handleMainToggle}
                    isMobile={isMobile}
                    disabled={!canUpdateAreaStatus()}
                    backgroundColor={backgroundColor}
                    contentColor={contentColor}
                    buttonColor={buttonColor}
                  />
                )}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    minWidth: 0,
                    flex: 1,
                    gap: 0.25,
                  }}
                >
                  <Typography
                    fontWeight={500}
                    fontSize={{ xs: 7, sm: 8, md: 9, lg: 10 }}
                    sx={{
                      color: areaSidebarPanelLabel,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      flex: 1,
                      minWidth: 0,
                      maxWidth: "100%",
                      lineHeight: 1.2,
                    }}
                  >
                    {areaStatus?.area_name || selectedAreaObj?.name || selectedAreaObj?.area_name || "Zone"}
                  </Typography>
                  {canRenameArea() && (
                    <IconButton
                      size="small"
                      onClick={openAreaRenameDialog}
                      aria-label="Rename area"
                      title="Rename area"
                      sx={{
                        flexShrink: 0,
                        fontSize: { xs: 11, sm: 12, md: 13, lg: 14 },
                        p: { xs: 0.15, sm: 0.2, md: 0.25 },
                        color: areaSidebarPanelLabel,
                        bgcolor: "rgba(255,255,255,0.65)",
                        borderRadius: 1,
                        "&:hover": { bgcolor: "rgba(255,255,255,0.85)" },
                      }}
                    >
                      <EditIcon sx={{ fontSize: "inherit" }} />
                    </IconButton>
                  )}
                </Box>
              </Box>

              {/* Right side with icons */}
              <Box sx={{
                display: 'flex',
                gap: 0.5,
                flexShrink: 0,
                alignItems: 'center'
              }}>
                {canViewAreaSettings() && (
                  <IconButton
                    size="small"
                    onClick={() => {
                      // Check if user has any permissions before opening settings
                      if (canViewAreaSettings()) {
                        setSettingsOpen(true);
                      }
                    }}
                    sx={{
                      fontSize: { xs: 12, sm: 14, md: 16, lg: 18 }, // Reduced icon sizes
                      p: { xs: 0.2, sm: 0.3, md: 0.4, lg: 0.5 }, // Reduced padding
                      color: areaSidebarPanelLabel,
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.65)' },
                    }}
                    title="Area Settings"
                  >
                    <SettingsIcon fontSize={isMobile ? 'small' : 'medium'} />
                  </IconButton>
                )}
                <IconButton
                  size="small"
                  onClick={closeAreaPanel}
                  sx={{
                    fontSize: { xs: 12, sm: 14, md: 16, lg: 18 }, // Reduced icon sizes
                    p: { xs: 0.2, sm: 0.3, md: 0.4, lg: 0.5 }, // Reduced padding
                    color: areaSidebarPanelLabel,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.65)' },
                  }}
                >
                  <CloseIcon fontSize={isMobile ? 'small' : 'medium'} />
                </IconButton>
              </Box>
            </Box>

            {/* Body — no outer scroll; zones list scrolls when needed */}
            <Box
              className="heatmap-area-sidebar-body"
              sx={{
              ...ADVANCED_HEATMAP_SIDEBAR_BODY_SX,
              gap: { xs: 0.35, sm: 0.4, md: 0.5 },
              p: { xs: 0.4, sm: 0.5, md: 0.75 },
              pr: { xs: 0.75, sm: 1, md: 1.25 },
              pb: { xs: 0.75, md: 1 },
              boxSizing: 'border-box',
              position: 'relative',
            }}>
              {areaStatusLoading ? (
                <Box
                  className="heatmap-area-sidebar-loading"
                  sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: areaSidebarLoadingOverlayBg,
                  zIndex: 10
                }}
                >
                  <CircularProgress
                    size={isMobile ? 24 : 36}
                    sx={HEATMAP_SIDEBAR_SPINNER_SX}
                  />
                </Box>
              ) : areaStatusError ? (
                <Alert severity="warning" sx={{ m: 1.5 }}>
                  {areaStatusError}
                </Alert>
              ) : (
                <>
                  {/* Scene Section */}
                  <Box sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'stretch',
                    background: areaSidebarSectionBg,
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 1.5,
                    boxShadow: 'none',
                    minHeight: { xs: 36, sm: 40, md: 44, lg: 48, xl: 48 },
                    flexShrink: 0,
                    p: 0,
                    m: 0,
                    boxSizing: 'border-box',
                  }}>
                    <Box sx={{
                      writingMode: 'vertical-rl',
                      ...SIDEBAR_SECTION_TAB_FONT_SX,
                      color: areaSidebarSectionText,
                      px: { xs: 0.3, sm: 0.4, md: 0.5 },
                      py: 0.2,
                      minWidth: { xs: 16, sm: 18, md: 20, lg: 24 },
                      textAlign: 'center',
                      bgcolor: areaSidebarSectionLabelBg,
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '0 12px 12px 0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transform: 'rotate(180deg)',
                    }}>
                      Scene
                    </Box>
                    <Box sx={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      p: { xs: 0.5, md: 1 },
                      minHeight: 0,
                      overflow: 'hidden',
                    }}>
                      {/* Left arrow */}
                      {scenePage > 0 && (
                        <IconButton
                          size="small"
                          onClick={() => setScenePage(scenePage - 1)}
                          sx={{ ...navIconSx, mr: 0.5 }}
                        >
                          <ArrowBackIosNewIcon sx={{ color: '#222', fontSize: { xs: 14, md: 18 } }} />
                        </IconButton>
                      )}

                      {/* Scene Grid */}
                      <Box sx={{
                        flex: 1,
                        display: 'grid',
                        gridTemplateColumns: {
                          xs: 'repeat(2, 1fr)',
                          sm: 'repeat(3, 1fr)'
                        },
                        gridTemplateRows: 'repeat(3, 1fr)',
                        gap: { xs: 0.15, sm: 0.2, md: 0.25, lg: 0.3 },
                        minHeight: 0,
                      }}>
                        {(areaStatus && Array.isArray(areaStatus.area_scenes) ? areaStatus.area_scenes : [])
                          .slice(scenePage * SCENES_PER_PAGE, (scenePage + 1) * SCENES_PER_PAGE)
                          .map((scene, idx) => (
                            <Button
                              key={scene.id}
                              size="small"
                              variant={scene.id === areaStatus?.active_scene ? "contained" : "outlined"}
                              disabled={!canUpdateAreaStatus()}
                              sx={{
                                fontSize: { xs: 7, sm: 8, md: 9, lg: 10 },
                                minWidth: 0,
                                p: { xs: 0.05, sm: 0.1, md: 0.15, lg: 0.2 },
                                borderRadius: 1,
                                height: { xs: 16, sm: 18, md: 20, lg: 22 },
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                background: scene.id === areaStatus?.active_scene ? '#222' : '#fff',
                                color: scene.id === areaStatus?.active_scene ? '#fff' : '#222',
                                border: scene.id === areaStatus?.active_scene ? 'none' : '1px solid #222',
                                fontWeight: scene.id === areaStatus?.active_scene ? 700 : 400,
                                maxWidth: { xs: 50, sm: 55, md: 60, lg: 70 },
                                textTransform: 'uppercase',
                                opacity: !canUpdateAreaStatus() ? 0.5 : 1,
                                cursor: !canUpdateAreaStatus() ? 'not-allowed' : 'pointer',
                              }}
                              onClick={async () => {
                                if (!areaStatus?.area_id || scene.id == null) return;

                                // Check if user has permission to update area status
                                if (!canUpdateAreaStatus()) {
                                  return;
                                }
                                if (Number(scene.id) === Number(areaStatus.active_scene)) {
                                  return;
                                }

                                try {
                                  lastSceneStatusKeyRef.current = getHeatmapSceneStatusKey(
                                    areaStatus.area_id,
                                    scene.id
                                  );

                                  // Activate the scene
                                  await dispatch(updateAreaScene({
                                    area_id: areaStatus.area_id,
                                    scene_code: scene.id
                                  })).unwrap();

                                  // Fetch scene details to get fade/delay times
                                  const sceneStatusResponse = await dispatch(fetchSceneStatus({
                                    areaId: areaStatus.area_id,
                                    sceneId: scene.id
                                  })).unwrap();

                                  // The response structure: { status: "success", area_id: ..., scene_id: ..., details: [...] }
                                  // Redux stores details in state.sceneStatus, but unwrap() returns the full response
                                  const sceneDetails = sceneStatusResponse?.details || sceneStatusResponse || [];

                                  // Update zone local values with fade/delay times from the scene
                                  // CRITICAL: Use zone_id for matching instead of zone_name for reliability
                                  if (sceneDetails && Array.isArray(sceneDetails) && sceneDetails.length > 0) {
                                    setZoneLocalValues(prev => {
                                      const updated = { ...prev };
                                      sceneDetails.forEach(detail => {
                                        // CRITICAL: Match by zone_id first (most reliable), fallback to zone_name
                                        const zoneId = detail.zone_id;
                                        let zone = null;

                                        if (zoneId != null) {
                                          zone = areaStatus.zones?.find(z => Number(z.id) === Number(zoneId));
                                        }

                                        // Fallback: match by name if zone_id not available
                                        if (!zone && detail.zone_name) {
                                          const wanted = String(detail.zone_name).trim().toLowerCase();
                                          zone = areaStatus.zones?.find(z => String(z.name).trim().toLowerCase() === wanted);
                                        }

                                        if (zone) {
                                          const zoneType = (detail.zone_type || '').toLowerCase();
                                          if (zoneType === 'dimmed') {
                                            updated[zone.id] = {
                                              ...updated[zone.id],
                                              brightness: detail.Level || 0,
                                              fadeTime: detail.FadeTime || '02',
                                              delayTime: detail.DelayTime || '00',
                                            };
                                          } else if (zoneType === 'whitetune') {
                                            updated[zone.id] = {
                                              ...updated[zone.id],
                                              brightness: detail.Level || 0,
                                              cct: detail.WhiteTuningLevel?.Kelvin || 2700,
                                              fadeTime: detail.FadeTime || '02',
                                              delayTime: detail.DelayTime || '00',
                                            };
                                          } else if (zoneType === 'switched') {
                                            updated[zone.id] = {
                                              ...updated[zone.id],
                                              on_off: detail.SwitchedLevel || 'Off',
                                            };
                                          }
                                        } else {
                                          console.warn(`Zone not found for scene detail:`, {
                                            zone_id: detail.zone_id,
                                            zone_name: detail.zone_name,
                                            zone_type: detail.zone_type
                                          });
                                        }
                                      });
                                      return updated;
                                    });

                                    // Update initial values to match the new scene values
                                    setInitialZoneValues(prev => {
                                      const updated = { ...prev };
                                      sceneDetails.forEach(detail => {
                                        // CRITICAL: Match by zone_id first
                                        const zoneId = detail.zone_id;
                                        let zone = null;

                                        if (zoneId != null) {
                                          zone = areaStatus.zones?.find(z => Number(z.id) === Number(zoneId));
                                        }

                                        // Fallback: match by name
                                        if (!zone && detail.zone_name) {
                                          const wanted = String(detail.zone_name).trim().toLowerCase();
                                          zone = areaStatus.zones?.find(z => String(z.name).trim().toLowerCase() === wanted);
                                        }

                                        if (zone) {
                                          const zoneType = (detail.zone_type || '').toLowerCase();
                                          if (zoneType === 'dimmed' || zoneType === 'whitetune') {
                                            updated[zone.id] = {
                                              brightness: detail.Level || 0,
                                              cct: detail.WhiteTuningLevel?.Kelvin || 2700,
                                              fadeTime: detail.FadeTime || '02',
                                              delayTime: detail.DelayTime || '00',
                                            };
                                          }
                                        }
                                      });
                                      return updated;
                                    });
                                  }

                                  // Refresh area status to update brightness/temperature values
                                  await dispatch(fetchAreaStatus(areaStatus.area_id));
                                } catch (e) {
                                  console.error("Error activating scene:", e);
                                }
                              }}
                            >
                              <span style={{
                                display: 'block',
                                width: '100%',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}>
                                {scene.name}
                              </span>
                            </Button>
                          ))}
                      </Box>

                      {/* Right arrow */}
                      {areaStatus && Array.isArray(areaStatus.area_scenes) && (scenePage + 1) * SCENES_PER_PAGE < areaStatus.area_scenes.length && (
                        <IconButton
                          size="small"
                          onClick={() => setScenePage(scenePage + 1)}
                          sx={{ ...navIconSx, ml: 0.5 }}
                        >
                          <ArrowForwardIosIcon sx={{ color: '#222', fontSize: { xs: 14, md: 18 } }} />
                        </IconButton>
                      )}
                    </Box>
                  </Box>

                  {/* Zones Section — compact content height (not stretched) */}
                  <Box sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'stretch',
                    background: areaSidebarSectionBg,
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 1.5,
                    boxShadow: 'none',
                    ...HEATMAP_ZONES_SECTION_SX,
                    p: 0,
                    m: 0,
                    boxSizing: 'border-box',
                  }}>
                    <Box sx={{
                      writingMode: 'vertical-rl',
                      ...SIDEBAR_SECTION_TAB_FONT_SX,
                      color: areaSidebarSectionText,
                      px: { xs: 0.3, sm: 0.4, md: 0.5 },
                      py: 0.2,
                      minWidth: { xs: 16, sm: 18, md: 20, lg: 24 },
                      textAlign: 'center',
                      bgcolor: areaSidebarSectionLabelBg,
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '0 12px 12px 0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transform: 'rotate(180deg)',
                      mr: { xs: 0.5, md: 1 },
                      flexShrink: 0,
                    }}>
                      Zones
                    </Box>
                    <Box sx={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'stretch',
                      p: { xs: 0.3, md: 0.5 },
                      minHeight: 0,
                      position: 'relative',
                      gap: { xs: 0.6, md: 0.85 },
                      overflow: 'hidden',
                    }}>
                      {/* Zone controls */}
                      <Box sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                        alignItems: 'stretch',
                        width: '100%',
                        minWidth: 0,
                        minHeight: 0,
                        overflow: 'hidden',
                      }}>
                        {zonesToShow.length > 0 ? (
                          <>
                            <Box
                              className="heatmap-area-sidebar-zones-list"
                              sx={{
                              ...sidebarZoneListSx,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: { xs: 0.25, md: 0.35 },
                              alignItems: 'stretch',
                              width: '100%',
                            }}>
                              {visibleSidebarZones.map((zone) => {
                                const values = zoneLocalValues[zone.id] || getDefaultZoneValues(zone);
                                return (
                                  <ZoneControlCard
                                    key={zone.id}
                                    zone={zone}
                                    values={values}
                                    highlighted={isFofpZonePanelHighlighted(
                                      zone,
                                      highlightedFofpZone,
                                      areaStatus?.zones
                                    )}
                                    onChange={(changed) => handleZoneValueChange(zone.id, changed)}
                                    disabled={zoneUpdating || !canUpdateAreaStatus()}
                                    isMobile={isMobile}
                                    isTablet={isTablet}
                                    isDesktop={isDesktop}
                                    isLargeScreen={isLargeScreen}
                                    is1440Screen={is1440Screen}
                                    isUltraWide={isUltraWide}
                                    is2560Screen={is2560Screen}
                                    backgroundColor={backgroundColor}
                                    contentColor={contentColor}
                                    buttonColor={buttonColor}
                                  />
                                );
                              })}
                            </Box>
                            <Box sx={{
                              display: 'flex',
                              justifyContent: 'flex-end',
                              width: '100%',
                              mt: 0.25,
                              flexShrink: 0,
                            }}>
                              <Button
                                size="small"
                                variant="contained"
                                onClick={handleApplyZones}
                                disabled={zoneUpdating || !canUpdateAreaStatus()}
                                sx={{
                                  ...applyButtonSx,
                                  opacity: !canUpdateAreaStatus() ? 0.5 : 1,
                                  cursor: !canUpdateAreaStatus() ? 'not-allowed' : 'pointer',
                                }}
                              >
                                {zoneUpdating ? 'Applying...' : 'Apply'}
                              </Button>
                            </Box>
                          </>
                        ) : (
                          <Typography
                            sx={{ color: areaSidebarSectionText, fontSize: { xs: 12, md: 15 } }}
                          >
                            No zones available
                          </Typography>
                        )}
                      </Box>

                      {/* Pagination arrows */}
                      {totalZonePages > 1 && (
                        <Box sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          height: '100%',
                          gap: 0.5,
                          minWidth: 40,
                        }}>
                          {zonePage > 0 && (
                            <IconButton
                              size="small"
                              onClick={() => setZonePage((page) => page - 1)}
                              sx={{ ...navIconSx }}
                            >
                              <ArrowBackIosNewIcon sx={{ color: '#222', fontSize: { xs: 14, md: 18 } }} />
                            </IconButton>
                          )}
                          {zonePage < totalZonePages - 1 && (
                            <IconButton
                              size="small"
                              onClick={() => setZonePage((page) => page + 1)}
                              sx={{ ...navIconSx }}
                            >
                              <ArrowForwardIosIcon sx={{ color: '#222', fontSize: { xs: 14, md: 18 } }} />
                            </IconButton>
                          )}
                        </Box>
                      )}
                    </Box>
                  </Box>

                  {/* Occupancy Section */}
                  <Box sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'stretch',
                    background: areaSidebarSectionBg,
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 1.5,
                    boxShadow: 'none',
                    minHeight: { xs: 28, sm: 32, md: 36, lg: 36, xl: 36 },
                    flexShrink: 0,
                    p: 0,
                    m: 0,
                    boxSizing: 'border-box',
                  }}>
                    <Box sx={{
                      writingMode: 'vertical-rl',
                      ...SIDEBAR_SECTION_TAB_FONT_SX,
                      color: areaSidebarSectionText,
                      px: 0.5,
                      py: 0.2,
                      minWidth: { xs: 20, md: 24 },
                      textAlign: 'center',
                      bgcolor: areaSidebarSectionLabelBg,
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '0 12px 12px 0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transform: 'rotate(180deg)',
                      mr: 1,
                    }}>
                      Occupancy
                    </Box>
                    <Box sx={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      p: { xs: 0.5, md: 1 },
                      minHeight: 0,
                    }}>
                      {areaStatusLoading || !areaStatus ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                          <CircularProgress
                            size={isMobile ? 16 : 20}
                            sx={HEATMAP_SIDEBAR_SPINNER_SX}
                          />
                        </Box>
                      ) : (
                        <>
                          {areaStatus.occupancy_status === 'Occupied' && (
                            <Box sx={{ bgcolor: '#fff', borderRadius: 2, p: { xs: 0.3, md: 0.5 }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <PersonIcon sx={{ fontSize: { xs: 20, md: 25 }, color: '#222' }} />
                              <CheckCircleIcon sx={{ fontSize: { xs: 12, md: 15 }, color: '#222', ml: -0.7, mt: 0.7 }} />
                            </Box>
                          )}
                          {areaStatus.occupancy_status === 'Unoccupied' && (
                            <Box sx={{ bgcolor: '#fff', borderRadius: 2, p: { xs: 0.3, md: 0.5 }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <PersonIcon sx={{ fontSize: { xs: 20, md: 25 }, color: '#222' }} />
                              <CancelIcon sx={{ fontSize: { xs: 12, md: 15 }, color: '#d32f2f', ml: -0.7, mt: 0.7 }} />
                            </Box>
                          )}
                          <Typography sx={{ ...SIDEBAR_BODY_TEXT_SX, color: '#fff' }}>
                            {areaStatus.occupancy_status || 'Unknown'}
                          </Typography>
                        </>
                      )}
                    </Box>
                  </Box>

                  {/* Energy Section */}
                  <Box sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'stretch',
                    background: areaSidebarSectionBg,
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 1.5,
                    boxShadow: 'none',
                    minHeight: { xs: 32, sm: 36, md: 40, lg: 40, xl: 40 },
                    flexShrink: 0,
                    p: 0,
                    m: 0,
                    boxSizing: 'border-box',
                  }}>
                    <Box sx={{
                      writingMode: 'vertical-rl',
                      ...SIDEBAR_SECTION_TAB_FONT_SX,
                      color: areaSidebarSectionText,
                      px: 0.5,
                      py: 0.2,
                      minWidth: { xs: 20, md: 24 },
                      textAlign: 'center',
                      bgcolor: areaSidebarSectionLabelBg,
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '0 12px 12px 0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transform: 'rotate(180deg)',
                      mr: 1,
                    }}>
                      Energy Saving
                    </Box>
                    <Box sx={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-around',
                      p: { xs: 0.5, md: 1 },
                      minHeight: 0,
                    }}>
                      {areaStatusLoading || !areaStatus ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                          <CircularProgress
                            size={isMobile ? 16 : 20}
                            sx={HEATMAP_SIDEBAR_SPINNER_SX}
                          />
                        </Box>
                      ) : (
                        <>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: { xs: 60, md: 80 } }}>
                            <Typography sx={{ ...SIDEBAR_BODY_TEXT_SX, color: '#fff', letterSpacing: 1 }}>Consumption</Typography>
                            <Typography sx={{ ...SIDEBAR_BODY_TEXT_SX, color: '#fff', fontWeight: 700, mt: 0.5 }}>
                              {formatSidebarEnergyWatts(areaStatus?.consumption)}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: { xs: 60, md: 80 } }}>
                            <Typography sx={{ ...SIDEBAR_BODY_TEXT_SX, color: '#fff', letterSpacing: 1 }}>Savings</Typography>
                            <Typography sx={{ ...SIDEBAR_BODY_TEXT_SX, color: '#fff', fontWeight: 700, mt: 0.5 }}>
                              {formatSidebarEnergyWatts(areaStatus?.savings)}
                            </Typography>
                          </Box>
                        </>
                      )}
                    </Box>
                  </Box>

                  {/* Shades Section - pinned at bottom; only zones list scrolls */}
                  {shades.length > 0 && (
                    <Box sx={{ flexShrink: 0, minHeight: 0 }}>
                    <HeatmapShadesPanel
                      variant="advanced"
                      panelClassName="advanced-heatmap-shades-panel"
                      shadeCardClassName="advanced-heatmap-shade-card"
                      shades={shades}
                      shadesLocalValues={shadesLocalValues}
                      onShadeChange={handleShadeSlider}
                      onPreset={handleShadesPreset}
                      onApply={handleApplyShades}
                      shadesUpdating={shadesUpdating}
                      canUpdate={canUpdateAreaStatus()}
                      isMobile={isMobile}
                      applyButtonSx={applyButtonSx}
                      navIconSx={navIconSx}
                      themeOverrides={{
                        sectionBg: areaSidebarSectionBg,
                        sectionBorder: '1px solid rgba(255, 255, 255, 0.12)',
                        labelColor: areaSidebarSectionText,
                        labelBg: areaSidebarSectionLabelBg,
                        navIconColor: '#fff',
                        cardBg: 'var(--heatmap-dialog-zone-card-bg, #ffffff)',
                        cardText: '#111111',
                        cardBorder: '1px solid rgba(0, 0, 0, 0.12)',
                        cardShadow: '0 1px 3px rgba(0,0,0,0.08)',
                      }}
                    />
                    </Box>
                  )}
                </>
              )}
            </Box>
          </Box>
        )}

        <Dialog
          open={areaRenameOpen}
          onClose={areaRenameSaving ? undefined : closeAreaRenameDialog}
          className="heatmap-rename-area-dialog"
          maxWidth={false}
          BackdropProps={{
            sx: { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
          }}
          PaperProps={{
            sx: {
              backgroundColor: 'transparent',
              boxShadow: 'none',
              maxWidth: { xs: 'calc(100% - 32px)', sm: 380 },
              width: '100%',
              m: 2,
            },
          }}
        >
          <Box
            className="heatmap-rename-area-dialog-panel"
            sx={{
              px: 2.5,
              py: 2,
              borderRadius: '14px',
              background:
                'var(--heatmap-rename-dialog-bg, linear-gradient(160deg, #0a1428 0%, #152238 45%, #1a2d4a 100%))',
              border:
                '1px solid var(--heatmap-rename-dialog-border, rgba(255, 255, 255, 0.35))',
              boxShadow:
                'var(--heatmap-rename-dialog-shadow, 0 0 0 1px rgba(120, 200, 255, 0.22), 0 12px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1))',
            }}
          >
            <DialogTitle
              sx={{
                px: 0,
                pt: 0,
                pb: 1,
                fontWeight: 700,
                fontSize: 15,
                color: 'var(--heatmap-rename-dialog-title-color, #ffffff)',
              }}
            >
              Rename area
            </DialogTitle>
            <DialogContent sx={{ px: 0, pt: 1, pb: 2 }}>
              {areaRenameError ? (
                <Alert
                  severity="error"
                  sx={{
                    mb: 2,
                    backgroundColor: 'rgba(211, 47, 47, 0.15)',
                    color: '#ffcdd2',
                    border: '1px solid rgba(255, 138, 128, 0.4)',
                    '& .MuiAlert-icon': { color: '#ff8a80' },
                  }}
                >
                  {areaRenameError}
                </Alert>
              ) : null}
              <Box sx={{ mt: 0.5 }}>
                <Typography
                  component="label"
                  htmlFor="heatmap-area-rename-input"
                  className="heatmap-rename-area-label"
                  sx={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    lineHeight: 1.35,
                    mb: 0.75,
                    color: 'var(--heatmap-rename-dialog-label-color, rgba(255, 255, 255, 0.9))',
                  }}
                >
                  Area name
                </Typography>
                <TextField
                  id="heatmap-area-rename-input"
                  autoFocus
                  hiddenLabel
                  margin="dense"
                  fullWidth
                  value={areaRenameValue}
                  onChange={(e) => setAreaRenameValue(e.target.value)}
                  disabled={areaRenameSaving}
                  inputProps={{ maxLength: 512, 'aria-label': 'Area name' }}
                  variant="outlined"
                  className="heatmap-rename-area-field"
                  sx={ASD_RENAME_FIELD_SX}
                />
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 0, pb: 0, pt: 0, gap: 1 }}>
              <Button
                onClick={closeAreaRenameDialog}
                disabled={areaRenameSaving}
                variant="outlined"
                className="heatmap-rename-cancel-btn"
                sx={{
                  color: 'var(--heatmap-rename-dialog-cancel-color, #ffffff)',
                  borderColor:
                    'var(--heatmap-rename-dialog-cancel-border, rgba(255, 255, 255, 0.45))',
                  textTransform: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    borderColor:
                      'var(--heatmap-rename-dialog-cancel-border, rgba(255, 255, 255, 0.65))',
                    backgroundColor: 'rgba(74, 67, 52, 0.08)',
                  },
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAreaRenameSubmit}
                variant="contained"
                disabled={areaRenameSaving}
                className="heatmap-rename-save-btn"
                sx={asdRenameSaveBtnSx(AREA_SETTINGS_BLUE)}
              >
                {areaRenameSaving ? 'Saving...' : 'Save'}
              </Button>
            </DialogActions>
          </Box>
        </Dialog>

        {/* Area Settings Dialog */}
        <AreaSettingsDialog
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          areaId={selectedAreaId}
          fetchSettingsApi={fetchSettingsApi}
          canUpdateAreaStatus={canUpdateAreaStatus()}
          canModifyDeviceSettings={canModifyDeviceSettings()}
          canViewAreaSettings={canViewAreaSettings()}
          canEditScene={canEditScene()}
          currentUserRole={currentUserRole}
          userProfile={userProfile}
          selectedFloorId={selectedFloorId}
        />

      </Box>
    </>
  );
};

function MainAreaToggle({ isOn, onClick, isMobile, disabled = false, backgroundColor, contentColor, buttonColor }) {
  const getSize = () => {
    if (window.innerWidth < 600) return { width: 41, height: 16, thumbSize: 12, fontSize: 8 }; // Minimal width increase
    if (window.innerWidth < 900) return { width: 47, height: 20, thumbSize: 16, fontSize: 9 }; // Minimal width increase
    return { width: 53, height: 24, thumbSize: 20, fontSize: 10 }; // Minimal width increase
  };

  const { width, height, thumbSize, fontSize } = getSize();

  return (
    <div
      onClick={disabled ? undefined : onClick}
      style={{
        width,
        height,
        borderRadius: 999,
        background: disabled ? '#ddd' : '#fff', // White background
        border: `1px solid ${disabled ? '#ddd' : '#000'}`, // Thin black border
        display: 'flex',
        alignItems: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        padding: 2,
        position: 'relative',
        minWidth: width,
        flexShrink: 0,
        overflow: 'hidden', // Ensure toggle doesn't overflow
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div
        style={{
          width: thumbSize,
          height: thumbSize,
          borderRadius: '50%',
          background: disabled ? '#bbb' : (isOn ? '#4caf50' : '#f44336'), // Green for ON, red for OFF
          transform: isOn ? `translateX(${width - thumbSize - 4}px)` : 'translateX(0)',
          transition: 'all 0.2s',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          position: 'absolute',
          left: 2,
          top: 2,
        }}
      />
      <span
        style={{
          position: 'absolute',
          left: isOn ? 4 : width - thumbSize - 4, // Position text on opposite side of circle
          top: '50%',
          transform: 'translateY(-50%)',
          color: buttonColor || '#222',
          fontWeight: 600,
          fontSize: fontSize, // Use the increased font size
          transition: 'all 0.2s',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: width - thumbSize - 8, // Increased max width to show full text
          lineHeight: 1,
          textAlign: 'center',
        }}
      >
        {isOn ? 'ON' : 'OFF'}
      </span>
    </div>
  );
}

/** FOFP-selected zone card in area sidebar (gold border + glow). */
function buildFofpSidebarHighlightSx(highlighted) {
  const base = {
    boxSizing: "border-box",
    borderRadius: 0.5,
  };
  if (!highlighted) {
    return { ...base, border: "2px solid transparent", boxShadow: "none" };
  }
  return {
    ...base,
    border: "2px solid #FFC928",
    boxShadow:
      "0 0 8px rgba(255, 201, 40, 0.45), 0 0 20px rgba(255, 201, 40, 0.25)",
  };
}

const SIDEBAR_ZONE_CARD_TEXT_COLOR = "#111";
const SIDEBAR_ZONE_CARD_MUTED_TEXT_COLOR = "#3d4a5c";
const SIDEBAR_ZONE_VALUE_CHIP_BG = "#f5f5f5";

const SIDEBAR_ZONE_VALUE_CHIP_SX = {
  ...SIDEBAR_ZONE_VALUE_CHIP_FONT_SX,
  ...SIDEBAR_ZONE_SIDE_VALUE_CHIP_SX,
  color: `${SIDEBAR_ZONE_CARD_TEXT_COLOR} !important`,
  WebkitTextFillColor: SIDEBAR_ZONE_CARD_TEXT_COLOR,
  backgroundColor: SIDEBAR_ZONE_VALUE_CHIP_BG,
  cursor: "text",
  "& .MuiInputBase-root": {
    color: `${SIDEBAR_ZONE_CARD_TEXT_COLOR} !important`,
  },
  "& .MuiInputBase-input": {
    color: `${SIDEBAR_ZONE_CARD_TEXT_COLOR} !important`,
    WebkitTextFillColor: SIDEBAR_ZONE_CARD_TEXT_COLOR,
    caretColor: SIDEBAR_ZONE_CARD_TEXT_COLOR,
  },
  "& .MuiInput-input": {
    color: `${SIDEBAR_ZONE_CARD_TEXT_COLOR} !important`,
  },
};

const SIDEBAR_ZONE_VALUE_INPUT_PROPS = {
  inputMode: "numeric",
  pattern: "[0-9]*",
  style: {
    textAlign: "center",
    fontWeight: 700,
    fontSize: 10,
    color: SIDEBAR_ZONE_CARD_TEXT_COLOR,
    WebkitTextFillColor: SIDEBAR_ZONE_CARD_TEXT_COLOR,
  },
};

function ZoneControlCard({ zone, values, onChange, disabled, highlighted = false, isMobile, isTablet, isDesktop, isLargeScreen, is1440Screen, isUltraWide, is2560Screen, backgroundColor, contentColor, buttonColor }) {
  const highlightSx = buildFofpSidebarHighlightSx(highlighted);
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
      sx={{
        ...SIDEBAR_ZONE_VALUE_CHIP_SX,
        minWidth: { xs: 34, md: 40 },
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
            ...SIDEBAR_ZONE_VALUE_INPUT_PROPS,
            style: { ...SIDEBAR_ZONE_VALUE_INPUT_PROPS.style, width: 34 },
          }}
          sx={{
            "& .MuiInputBase-input": {
              color: `${SIDEBAR_ZONE_CARD_TEXT_COLOR} !important`,
              WebkitTextFillColor: SIDEBAR_ZONE_CARD_TEXT_COLOR,
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
      sx={{
        ...SIDEBAR_ZONE_VALUE_CHIP_SX,
        minWidth: 24,
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
            ...SIDEBAR_ZONE_VALUE_INPUT_PROPS,
            style: { ...SIDEBAR_ZONE_VALUE_INPUT_PROPS.style, width: 26 },
          }}
          sx={{
            "& .MuiInputBase-input": {
              color: `${SIDEBAR_ZONE_CARD_TEXT_COLOR} !important`,
              WebkitTextFillColor: SIDEBAR_ZONE_CARD_TEXT_COLOR,
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
      <Box
        sx={{
          bgcolor: '#fff',
          color: SIDEBAR_ZONE_CARD_TEXT_COLOR,
          borderRadius: 0.5,
          pt: 0.5,
          pb: 0.5,
          pl: 0.5,
          pr: 0.5,
          ...ZONE_CONTROL_CARD_WIDTH_SX,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 1,
          mb: 0.25,
          justifyContent: 'flex-start',
          boxSizing: 'border-box',
          ...highlightSx,
        }}
      >
        <Typography
          sx={{
            ...SIDEBAR_ZONE_NAME_SX,
            flex: 1,
            minWidth: 20,
            mr: 0.5,
            color: SIDEBAR_ZONE_CARD_TEXT_COLOR,
          }}
        >
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
            ml: 'auto',
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
    const cctValue = safeValues.cct !== undefined ? safeValues.cct : cctMin;

    return (
      <Box sx={{
        ...SIDEBAR_ZONE_CARD_SHELL_SX,
        ...highlightSx,
      }}>
        <Box
          className="advanced-sidebar-zone-control-card"
          sx={{
            flex: 1,
            ...SIDEBAR_ZONE_CARD_INNER_SX,
            color: SIDEBAR_ZONE_CARD_TEXT_COLOR,
          }}
        >
          <Box sx={{
            display: "flex",
            alignItems: "center",
            mb: 0.05,
            minHeight: 14,
            lineHeight: 1.15,
            width: "100%",
            overflow: "hidden",
            minWidth: 0,
          }}>
            <Typography
              sx={{
                ...SIDEBAR_ZONE_NAME_SX,
                color: SIDEBAR_ZONE_CARD_TEXT_COLOR,
              }}
            >
              {zone.name}
            </Typography>
          </Box>

          <Box sx={SIDEBAR_ZONE_SLIDER_ROW_SX}>
            <Slider
              min={brightnessMin}
              max={brightnessMax}
              value={safeValues.brightness !== undefined ? safeValues.brightness : brightnessMin}
              onChange={(_, v) => onChange({ brightness: v })}
              disabled={disabled}
              sx={{
                ...SIDEBAR_ZONE_SLIDER_TRACK_SX,
                color: "#222",
                height: { xs: 2, md: 3 },
                "& .MuiSlider-thumb": {
                  width: { xs: 8, md: 10 },
                  height: { xs: 8, md: 10 },
                  bgcolor: "#3d4a5c",
                  boxShadow: "none",
                },
                "& .MuiSlider-rail": {
                  height: { xs: 2, md: 3 },
                  borderRadius: 1.5,
                },
                "& .MuiSlider-track": {
                  height: { xs: 2, md: 3 },
                  borderRadius: 1.5,
                },
              }}
            />
            {renderZoneBrightnessValue(
              safeValues.brightness !== undefined ? safeValues.brightness : brightnessMin,
              { min: brightnessMin, max: brightnessMax }
            )}
          </Box>

          {/* CCT: Kelvin chip beside track (right). */}
          <Box sx={SIDEBAR_ZONE_FOLLOWING_SLIDER_ROW_SX}>
            <Slider
              min={cctMin}
              max={cctMax}
              value={cctValue}
              onChange={(_, v) => onChange({ cct: v })}
              disabled={disabled}
              title={`${cctMin}K – ${cctMax}K`}
              sx={{
                ...SIDEBAR_ZONE_SLIDER_TRACK_SX,
                color: "#FFD600",
                height: { xs: 2, md: 3 },
                "& .MuiSlider-thumb": {
                  width: { xs: 8, md: 10 },
                  height: { xs: 8, md: 10 },
                  bgcolor: "#FFD600",
                  boxShadow: "none",
                },
                "& .MuiSlider-rail": {
                  height: { xs: 2, md: 3 },
                  borderRadius: 1.5,
                },
                "& .MuiSlider-track": {
                  height: { xs: 2, md: 3 },
                  borderRadius: 1.5,
                },
              }}
            />
            {renderZoneCctKelvin(cctValue, { min: cctMin, max: cctMax })}
          </Box>
        </Box>
      </Box>
    );
  }


  if (isDimmedType) {
    return (
      <Box sx={{
        ...SIDEBAR_ZONE_CARD_SHELL_SX,
        ...highlightSx,
      }}>
        <Box
          className="advanced-sidebar-zone-control-card"
          sx={{
            flex: 1,
            ...SIDEBAR_ZONE_CARD_INNER_SX,
            pb: 0.15,
            color: SIDEBAR_ZONE_CARD_TEXT_COLOR,
          }}
        >
          <Box sx={{
            display: "flex",
            alignItems: "center",
            mb: 0.05,
            minHeight: 14,
            lineHeight: 1.15,
            minWidth: 0,
          }}>
            <Typography
              sx={{
                ...SIDEBAR_ZONE_NAME_SX,
                color: SIDEBAR_ZONE_CARD_TEXT_COLOR,
              }}
            >
              {zone.name}
            </Typography>
          </Box>
          <Box sx={SIDEBAR_ZONE_SLIDER_ROW_SX}>
            <Slider
              min={0}
              max={100}
              value={safeValues.brightness}
              onChange={(_, v) => onChange({ brightness: v })}
              disabled={disabled}
              sx={{
                ...SIDEBAR_ZONE_SLIDER_TRACK_SX,
                color: '#222',
                height: { xs: 2, md: 3 },
                '& .MuiSlider-thumb': {
                  width: { xs: 8, md: 10 },
                  height: { xs: 8, md: 10 },
                  bgcolor: '#3d4a5c',
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
            {renderZoneBrightnessValue(safeValues.brightness, { min: 0, max: 100 })}
          </Box>
        </Box>
      </Box>
    );
  }

}

// Helper function to find the largest value in an array
function arrayLargest(arr) {
  if (!arr || arr.length === 0) return 0;
  return Math.max(...arr);
}

function truncateText(text, maxChars) {
  if (text.length <= maxChars) return text;
  return text.slice(0, Math.max(0, maxChars - 1)) + '…';
}

function HeatmapPdfSvgViewer({
  containerRef,
  pdfUrl,
  pageDims,
  setPageDims,
  setPdfLoaded,
  scale,
  setScale,
  fitScale,
  hasFit,
  handleFit,
  areas,
  getFill,
  handleAreaClick,
  searchTerm,
  pan,
  setPan,
  searchBounceAnimation,
  isDragging: _legacyIsDragging,
  setIsDragging: _legacySetIsDragging,
  dragStart: _legacyDragStart,
  setDragStart: _legacySetDragStart,
  contentBBox,
  boundaryValues,
  getContainerDimensions,
  containerFitMode,
  highlightedAreaId,
  hasActiveAlert,
  findAlertForArea,
  navigate,
  fofpEnabled = false,
  fofpPositions = null,
  fofpConfig = null,
  onFofpZoneClick = null,
  highlightedFofpZone = null,
}) {

  const pdfFile = useMemo(() => buildPdfDocumentFile(pdfUrl), [pdfUrl]);

  // Use A4 dimensions as fallback for consistent rendering
  const A4_WIDTH = 794;
  const A4_HEIGHT = 1123;

  const transformedContentRef = React.useRef(null);
  const pdfPageRef = React.useRef(null);

  const handlePdfPageLoad = (page) => {
    // Prefer rotated viewport when CSV coords match the visible page (/Rotate 90|270).
    // Falls back to MediaBox for unrotated floors so existing CSVs stay aligned.
    pdfPageRef.current = page;
    setPageDims(resolveFloorPlanPageDims(page, areas));
    setPdfLoaded(true);
  };

  useEffect(() => {
    pdfPageRef.current = null;
  }, [pdfUrl]);

  useEffect(() => {
    if (!pdfPageRef.current) return;
    const next = resolveFloorPlanPageDims(pdfPageRef.current, areas);
    setPageDims((prev) => (pageDimsEqual(prev, next) ? prev : next));
  }, [areas, setPageDims]);

  // Pan/drag: only after 4px move so clicks on markers/areas still fire
  const {
    isDragging,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
  } = usePanDrag({ scale, fitScale, pan, setPan });

  // Scroll-based zoom functionality with mouse-centered zoom
  const handleWheel = (e) => {
    // Prevent default behavior and stop propagation
    if (e.cancelable) {
      e.preventDefault();
    }
    e.stopPropagation();

    // Define zoom limits
    const MIN_SCALE = 0.1;
    const MAX_SCALE = 5.0;

    // Determine zoom direction and factor
    const delta = e.deltaY > 0 ? -1 : 1;
    const zoomFactor = 0.15;
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale + delta * zoomFactor));

    // Get container dimensions and mouse position
    const rect = e.currentTarget.getBoundingClientRect();
    const containerCenterX = rect.width / 2;
    const containerCenterY = rect.height / 2;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate mouse position relative to container center
    const mouseRelativeToCenterX = mouseX - containerCenterX;
    const mouseRelativeToCenterY = mouseY - containerCenterY;

    // Calculate the point in the PDF coordinate system that the mouse is pointing at
    // The PDF transform is: translate(-50%, -50%) translate(pan.x, pan.y) scale(scale)
    // So to get the PDF point: (mouse - pan) / scale
    const pdfPointX = (mouseRelativeToCenterX - pan.x) / scale;
    const pdfPointY = (mouseRelativeToCenterY - pan.y) / scale;

    // Calculate new pan values to keep the PDF point under the mouse cursor
    // New transform: translate(-50%, -50%) translate(newPan.x, newPan.y) scale(newScale)
    // So: mouse = newPan + (pdfPoint * newScale)
    const newPanX = mouseRelativeToCenterX - pdfPointX * newScale;
    const newPanY = mouseRelativeToCenterY - pdfPointY * newScale;

    // Apply the new scale and pan
    setScale(newScale);
    setPan({ x: newPanX, y: newPanY });
  };

  // Compute a base, zoom-independent font size normalized by the floorplan "content width"
  // This keeps label sizes consistent across different PDFs with different coordinate scales.
  const getNormalizedBaseFont = () => {
    // Effective content width from backend boundary if available; otherwise use PDF width
    const contentWidth = boundaryValues
      ? Math.max(1, (boundaryValues.x_right || 0) - (boundaryValues.x_left || 0))
      : Math.max(1, (pageDims?.width || A4_WIDTH));

    // Reference width chosen from common drawings; use sqrt to smooth extremes
    const REFERENCE_WIDTH = 3000;
    const normalization = Math.sqrt(REFERENCE_WIDTH / contentWidth);

    // Smaller, tighter labels
    const base = Math.max(6, Math.min(9, Math.round(7.5 * normalization)));
    return base;
  };

  // Attach wheel event listener with { passive: false } to allow preventDefault
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const wheelHandler = (e) => {
      handleWheel(e);
    };

    container.addEventListener('wheel', wheelHandler, { passive: false });

    return () => {
      container.removeEventListener('wheel', wheelHandler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale, pan]);

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        flex: '1 1 auto',
        minHeight: 0,
        minWidth: 0,
        overflow: 'hidden',
        bgcolor: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexGrow: 1,
        flexShrink: 1,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
      }}
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {/* Centered PDF container with proper scaling */}
      <Box
        ref={transformedContentRef}
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: '50% 50%',
          width: pageDims ? `${pageDims.width}px` : 'auto',
          height: pageDims ? `${pageDims.height}px` : 'auto',
          maxWidth: 'none',
          maxHeight: 'none',
          overflow: 'visible',
          display: 'block',
          pointerEvents: isDragging ? 'none' : 'auto',
        }}
      >
        {/* Render full PDF with proper scaling */}
        <Box
          sx={{
            position: 'relative',
            width: pageDims ? `${pageDims.width}px` : 'auto',
            height: pageDims ? `${pageDims.height}px` : 'auto',
            lineHeight: 0,
            overflow: 'visible',
          }}
        >
          {pdfUrl ? (
            <Document file={pdfFile} key={pdfUrl}>
              <Page
                pageNumber={1}
                width={pageDims ? pageDims.width : A4_WIDTH}
                rotate={
                  pageDims?.source === 'rotated'
                    ? Number(pageDims.rotate) || 0
                    : 0
                }
                renderAnnotationLayer={false}
                renderTextLayer={false}
                onLoadSuccess={handlePdfPageLoad}
              />
            </Document>
          ) : (
            <CircularProgress />
          )}
          {pageDims && (
            <svg
              width={pageDims.width}
              height={pageDims.height}
              viewBox={`0 0 ${pageDims.width} ${pageDims.height}`}
              style={{ position: 'absolute', top: 0, left: 0, zIndex: 2, pointerEvents: 'auto' }}
            >
              {(areas || []).map((area, index) => {
                const rings = getPolygonRings(area);
                const flat = flattenAreaCoords(area);
                if (!rings.length) return null;

                // Labels/bbox use all points; each ring is drawn as its own polygon
                // so multi-piece areas are not mashed into one shape.
                const scaledCoords = flat.length ? flat : rings.flat();

                const displayAreaName = area.name || area.area_name || '';
                const center = getHeatmapPolygonLabelCenter(scaledCoords, displayAreaName, {
                  usePbOs24Fix: true,
                });
                const bbox = getPolygonBoundingBox(scaledCoords);

                const isHighlightedSearch = areaNameMatchesSearch(area, searchTerm);
                const isHighlightedById = highlightedAreaId && ((area.area_id || area.id) === highlightedAreaId);
                const isHighlighted = !!isHighlightedById || !!isHighlightedSearch;

                // Auto-fit would shrink L-shaped rooms to empty chips; use zoom-safe font instead.
                const areaSize = Math.min(bbox.width, bbox.height);
                const ZOOM_THRESHOLD = 1.13;
                const isZoomedIn = scale > ZOOM_THRESHOLD;

                const baseFont = getNormalizedBaseFont();
                const fontSize = getHeatmapLabelFontSize(areaSize, baseFont);
                const padding = fontSize * 0.25;
                const lineHeight = fontSize * 1.15;
                const finalLines = createTwoLineLabel(displayAreaName, areaSize);
                const shouldShowText =
                  finalLines.length > 0 && (areaSize >= 20 || isZoomedIn);

                const areaHasAlert = hasActiveAlert && hasActiveAlert(area);

                const charWidth = fontSize * 0.5;
                const maxLineWidth = Math.max(
                  0,
                  ...finalLines.map((line) => line.length * charWidth)
                );

                const backgroundWidth = Math.min(
                  maxLineWidth + padding * 2,
                  Math.max(0, bbox.width * 0.9)
                );
                const backgroundHeight = Math.min(
                  finalLines.length * lineHeight + padding * 2,
                  Math.max(0, bbox.height * 0.9)
                );

                return (
                  <g key={index}>
                    {/* Define clipping path for this area (union of rings) */}
                    <defs>
                      <clipPath id={`clip-${index}`}>
                        {rings.map((ring, ri) => (
                          <polygon
                            key={ri}
                            points={ring.map((p) => `${p.x},${p.y}`).join(' ')}
                          />
                        ))}
                      </clipPath>
                    </defs>

                    {/* One polygon per ring so multi-piece areas stay separate */}
                    {rings.map((ring, ri) => (
                      <polygon
                        key={ri}
                        points={ring.map((p) => `${p.x},${p.y}`).join(' ')}
                        fill={getFill(area)}
                        stroke={'#000'}
                        strokeWidth={2}
                        vectorEffect="non-scaling-stroke"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAreaClick(area);
                        }}
                        style={{
                          cursor: 'pointer',
                          pointerEvents: 'auto'
                        }}
                      >
                        {/* Tooltip showing full area name on hover */}
                        <title>{displayAreaName}</title>
                      </polygon>
                    ))}
                    {displayAreaName && finalLines.length > 0 && shouldShowText && (
                      <g clipPath={`url(#clip-${index})`} style={{ pointerEvents: 'none' }}>
                          <rect
                            x={center.x - (backgroundWidth / 2)}
                            y={center.y - (backgroundHeight / 2)}
                            width={backgroundWidth}
                            height={backgroundHeight}
                            fill="white"
                            fillOpacity="0.9"
                            stroke="none"
                            rx="2"
                            ry="2"
                          />
                          {finalLines.map((line, lineIndex) => {
                            const textX = center.x;
                            const textY = center.y - (finalLines.length * lineHeight / 2) + (lineIndex * lineHeight) + (lineHeight / 2);

                            return (
                              <text
                                key={lineIndex}
                                x={textX}
                                y={textY}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fontSize={fontSize}
                                fill={areaHasAlert ? '#d32f2f' : (isHighlighted ? '#b71c1c' : '#000')}
                                stroke="none"
                                fontWeight="600"
                                style={{
                                  pointerEvents: 'none',
                                  userSelect: 'none',
                                  fontFamily: 'Arial, sans-serif',
                                }}
                              >
                                {line}
                              </text>
                            );
                          })}
                      </g>
                    )}

                    {/* Red alert icon overlay for areas with active alerts */}
                    <g
                      key={area.area_id || area.id || index}
                      style={{ cursor: "pointer" }}
                    >
                      {/* ALERT ICON */}
                      {hasActiveAlert(area) && center.x && center.y && (
                        <g
                          onClick={(e) => {
                            e.stopPropagation(); // prevents area click
                            const matchedAlert = findAlertForArea(area);
                            navigate("/dashboard/alerts", {
                              state: {
                                focusAlert: buildAlertFocusPayload(area, matchedAlert),
                              }
                            });
                          }}
                          style={{
                            cursor: "pointer",
                            pointerEvents: "all", // critical
                          }}
                        >
                          {/* invisible bigger click area (VERY IMPORTANT) */}
                          <circle
                            cx={center.x + fontSize * 3.2}
                            cy={center.y + fontSize * 2.0}
                            r={alertMarkerHitRadius(fontSize, scale)}
                            fill="transparent"
                            style={{ pointerEvents: "all" }}
                          />

                          {/* triangle */}
                          <polygon
                            points={`
          ${center.x + fontSize * 3.2},${center.y + fontSize * 1.2}
          ${center.x + fontSize * 2.4},${center.y + fontSize * 2.6}
          ${center.x + fontSize * 4.0},${center.y + fontSize * 2.6}
        `}
                            fill="red"
                            stroke="#fff"
                            strokeWidth="2"
                            style={{ pointerEvents: "all" }}
                          />

                          {/* exclamation */}
                          <text
                            x={center.x + fontSize * 3.2}
                            y={center.y + fontSize * 2.1}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize={fontSize * 0.9}
                            fill="#fff"
                            style={{ pointerEvents: "none" }}
                          >
                            !
                          </text>
                        </g>
                      )}
                    </g>
                    {/* {areaHasAlert && center.x && center.y && (
                    <g style={{ pointerEvents: 'none' }}> */}
                    {/* Warning triangle icon */}
                    {/* <polygon
                        points={`
    			  ${center.x + fontSize * 3.2},${center.y + fontSize * 1.2}
    			  ${center.x + fontSize * 2.4},${center.y + fontSize * 2.6}
    			  ${center.x + fontSize * 4.0},${center.y + fontSize * 2.6}
  		      	`}
                        fill="#ff0000"
                        stroke="#ffffff"
                        strokeWidth="1"
                        opacity="0.95"
                      /> */}

                    {/* Exclamation mark */}
                    {/* <text
                        x={center.x + fontSize * 3.2}
                        y={center.y + fontSize * 2.1}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={fontSize * 0.9}
                        fill="#ffffff"
                        fontWeight="bold"
                        style={{
                          pointerEvents: 'none',
                          fontFamily: 'Arial, sans-serif'
                        }}
                      >
                        !
                      </text>
                    </g>
                  )} */}

                    {/* Enhanced highlight overlay with red color, thicker border, and continuous bounce animation */}
                    {isHighlighted && (
                      <g
                        style={{
                          pointerEvents: 'none',
                          animation: searchBounceAnimation ? 'searchBounce 1.5s ease-in-out infinite' : 'none'
                        }}
                      >
                        {rings.map((ring, ri) => (
                          <polygon
                            key={`hl-outer-${ri}`}
                            points={ring.map((p) => `${p.x},${p.y}`).join(' ')}
                            fill={'none'}
                            stroke={'#ff0000'}
                            strokeWidth={8}
                            vectorEffect="non-scaling-stroke"
                            strokeDasharray="10,5"
                            opacity={1.0}
                          />
                        ))}
                        {/* Additional inner highlight for better visibility */}
                        {rings.map((ring, ri) => (
                          <polygon
                            key={`hl-inner-${ri}`}
                            points={ring.map((p) => `${p.x},${p.y}`).join(' ')}
                            fill={'rgba(255, 0, 0, 0.15)'}
                            stroke={'#ff0000'}
                            strokeWidth={4}
                            vectorEffect="non-scaling-stroke"
                            opacity={0.8}
                          />
                        ))}
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          )}
          {fofpEnabled && pageDims && (
            <FOFPOverlayBoundary>
              <FOFPOverlay
                enabled={fofpEnabled}
                positions={fofpPositions}
                config={fofpConfig}
                width={pageDims.width}
                height={pageDims.height}
                onZoneClick={onFofpZoneClick}
              />
            </FOFPOverlayBoundary>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default HeatMap;


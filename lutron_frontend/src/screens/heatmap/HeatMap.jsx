import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch, useStore } from "react-redux";
import {
  Box, CircularProgress, IconButton, Typography, Slider, Badge, Button, useMediaQuery, useTheme
} from "@mui/material";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import FitScreenIcon from "@mui/icons-material/FitScreen";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { Document, Page, pdfjs } from "react-pdf";
import { formatSidebarEnergyWatts } from "../../utils/heatmapSidebarUtils";
import { getPolygonRings, flattenAreaCoords } from '../../utils/floorplanCoordinates';
import { areaNameMatchesSearch } from '../../shared/heatmap/areaNameSearch';
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
  updateAreaLightStatus,
  updateZoneSettings,
  updateZonesByArea,
  toggleAllZonesInArea,
  updateAreaScene,
  refreshAllHeatmapData,
  selectHeatmapLoading,
  optimisticallyUpdateAreaStatus,
  selectHeatmapSearchTerm, // added
} from '../../redux/slice/settingsslice/heatmap/HeatmapSlice';
import { fetchActiveAlerts, selectAlerts } from '../../redux/slice/dashboard/alertsSlice';
import { fetchSceneStatus } from '../../redux/slice/settingsslice/heatmap/areaSettingsSlice';
import { selectFloors } from "../../redux/slice/floor/floorSlice";
import CloseIcon from "@mui/icons-material/Close";
import SettingsIcon from "@mui/icons-material/Settings";
import Switch from "@mui/material/Switch";
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { fetchProcessors } from '../../redux/slice/processor/processorSlice';

import AreaSettingsDialog from '../heatmap/AreaSettingsDialog '// Adjust path as needed

import { selectApplicationTheme, selectHeatMapTheme } from "../../redux/slice/theme/themeSlice";
import {
  dispatchFetchFloorsOnce,
  dispatchFetchApplicationThemeOnce,
  dispatchFetchHeatMapThemeOnce,
} from '../../utils/bootstrapFetchGuards';
//import SearchComponent from "../../layouts/SearchComponent"; // adjust path as needed

import { UseAuth } from '../../customhooks/UseAuth'; // Add this import

import { interpolateHexColor, arraylargest } from '../../utils/colorScale';


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


// Add the missing TOP_PADDING constant
const TOP_PADDING = 60; // Adjust this value based on your header height

pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs?pdfworker=2`;

function toTitleCase(str) {
  return str.replace(/\w\S*/g, (txt) =>
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

const HeatMap = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const store = useStore();


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
  const heatmapLoading = useSelector(selectHeatmapLoading);
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

  // Enhanced container reference with better dimension detection
  const getContainerDimensions = () => {
    if (!containerRef.current) return { width: 0, height: 0 };

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();

    // Get the actual container dimensions
    const width = rect.width || container.offsetWidth || container.clientWidth || container.scrollWidth;
    const height = rect.height || container.offsetHeight || container.clientHeight || container.scrollHeight;

    // Use the actual container dimensions and ensure they're not zero
    if (!width || !height) {
      // Fallback to parent container dimensions
      const parent = container.parentElement;
      if (parent) {
        const parentRect = parent.getBoundingClientRect();
        return {
          width: Math.max(parentRect.width, 300),
          height: Math.max(parentRect.height, 200)
        };
      }
    }

    const result = {
      width: Math.max(width, 300),
      height: Math.max(height, 200)
    };

    return result;
  };
  const [selectedAreaId, setSelectedAreaId] = useState(null);
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
  const [shadesLocalValues, setShadesLocalValues] = useState({});
  const [shadesUpdating, setShadesUpdating] = useState(false);
  const [fitScale, setFitScale] = useState(1.0); // Default fit scale - will be calculated
  const [filteredAreas, setFilteredAreas] = useState(heatmapData.areas || []);

  const appTheme = useSelector(selectApplicationTheme);
  const backgroundColor = appTheme?.application_theme?.background || '#d2c4a2';
  const contentColor = appTheme?.application_theme?.content || 'rgba(128, 120, 100, 0.7)';
  const buttonColor = appTheme?.application_theme?.button || '#232323'

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
  // Tracks which floor's light_status map is loaded (drives mode-only fetches)
  const [floorMapReadyFor, setFloorMapReadyFor] = useState(null);
  const lastFloorMapFloorIdRef = useRef(null);

  const [pageDims, setPageDims] = useState(null);

  // Ensure floors are loaded (once)
  useEffect(() => {
    dispatchFetchFloorsOnce(dispatch, store.getState);
  }, [dispatch, store]);

  // Ensure a floor is selected so map fetch can run (controls also set this; belt-and-suspenders)
  useEffect(() => {
    if (selectedFloorId) return;
    const available = getAvailableFloors();
    if (available && available.length > 0) {
      dispatch(setSelectedFloorId(available[0].id));
    }
  }, [dispatch, selectedFloorId, floors, currentUserRole, userProfile]);

  // Fetch active alerts on component mount
  useEffect(() => {
    dispatch(fetchActiveAlerts());
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
        const consistentScale = calculateConsistentScale();
        setScale(consistentScale);
        setPan({ x: 0, y: 0 });
        setHasFit(true);
        setDefaultFitScale(consistentScale);
      }
    };

    // Try to fit after a short delay to ensure everything is rendered
    const timeoutId = setTimeout(initialFit, 100);

    // Fallback fit attempt if the first one doesn't work
    const fallbackTimeoutId = setTimeout(() => {
      if (!hasFit && containerRef.current && pageDims) {
        const consistentScale = calculateConsistentScale();
        setScale(consistentScale);
        setPan({ x: 0, y: 0 });
        setHasFit(true);
        setDefaultFitScale(consistentScale);
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
  const SHADES_PER_PAGE = isMobile ? 2 : isTablet ? 3 : 4;

  const [shadesPage, setShadesPage] = useState(0);

  const shades = areaStatus?.zones?.filter(z => (z.type || '').toLowerCase() === 'shade') || [];
  const pagedShades = shades.slice(shadesPage * SHADES_PER_PAGE, (shadesPage + 1) * SHADES_PER_PAGE);

  //heatmap api calling
  const heatMapTheme = useSelector(selectHeatMapTheme);
  const normalizeColor = (color) => {
    if (!color) {
      return '#e88330'; // Default fallback
    }

    if (typeof color === 'string' && color.startsWith('hsl')) {
      const [h, s, l] = color.match(/\d+/g).map(Number);
      const hexColor = hslToHex(h, s, l);
      return hexColor;
    }

    // Ensure it's a valid hex color
    if (typeof color === 'string' && color.startsWith('#')) {
      return color;
    }

    return '#e88330'; // Default fallback
  };

  const hslToHex = (h, s, l) => {
    s /= 100;
    l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r, g, b;
    if (0 <= h && h < 60) [r, g, b] = [c, x, 0];
    else if (60 <= h && h < 120) [r, g, b] = [x, c, 0];
    else if (120 <= h && h < 180) [r, g, b] = [0, c, x];
    else if (180 <= h && h < 240) [r, g, b] = [0, x, c];
    else if (240 <= h && h < 300) [r, g, b] = [x, 0, c];
    else[r, g, b] = [c, 0, x];
    const toHex = n => {
      const hex = Math.round((n + m) * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };
  const lightColor = normalizeColor(heatMapTheme?.application_theme?.light || '#f2ff00');
  const occupancyColor = normalizeColor(heatMapTheme?.application_theme?.occupancy || '#ea3ebf');
  const energyBaseColor = normalizeColor(heatMapTheme?.application_theme?.energy || '#a71ee6');

  // Monitor theme changes
  useEffect(() => {
    // Theme change handling
  }, [heatMapTheme, lightColor, occupancyColor, energyBaseColor]);
  useEffect(() => {
    dispatchFetchHeatMapThemeOnce(dispatch, store.getState);
    dispatchFetchApplicationThemeOnce(dispatch, store.getState);
  }, [dispatch, store]);

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
    '&:hover': { background: '#111' }
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

  // P0-1 Effect A: floor change only → light_status / floor map (+ boundaries from payload)
  useEffect(() => {
    if (!selectedFloorId) return;

    let cancelled = false;
    setPdfLoaded(false);
    setPdfLoading(true);
    setFilteredAreas([]);
    setFloorMapReadyFor(null);
    setHasFit(false);

    dispatch(fetchFloorMapData({ floorId: selectedFloorId }))
      .then((action) => {
        if (cancelled) return;
        const payload = action?.payload;
        if (payload?.boundary_values) {
          setBoundaryValues(payload.boundary_values);
        } else {
          setBoundaryValues(null);
        }
        lastFloorMapFloorIdRef.current = selectedFloorId;
        setFloorMapReadyFor(selectedFloorId);
      })
      .catch(() => {
        if (!cancelled) {
          setBoundaryValues(null);
          setFloorMapReadyFor(null);
        }
      })
      .finally(() => {
        if (!cancelled) setPdfLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [dispatch, selectedFloorId]);

  // P0-1 Effect B: mode change only — never re-hit light_status when map for this floor is ready
  useEffect(() => {
    if (!selectedFloorId) return;
    if (floorMapReadyFor !== selectedFloorId) return;
    if (displayMode === 'Light') return;

    let cancelled = false;
    setPdfLoading(true);
    const request =
      displayMode === 'Occupancy'
        ? dispatch(fetchAreaOccupancyStatus({ floorId: selectedFloorId }))
        : displayMode === 'Energy'
          ? dispatch(fetchAreaEnergyConsumption({ floorId: selectedFloorId }))
          : Promise.resolve();

    Promise.resolve(request)
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setPdfLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [dispatch, displayMode, selectedFloorId, floorMapReadyFor]);

  // Calculate available height so the heatmap column fits the viewport exactly
  useEffect(() => {
    const recalc = () => {
      if (!layoutRef.current) return;
      const top = layoutRef.current.getBoundingClientRect().top;
      // Use full viewport height minus the top offset to prevent scrolling
      // Account for header height, footer height, and small padding
      const headerHeight = 60; // Adjust based on your header height
      const footerHeight = 40; // Further reduced footer height
      const padding = 10; // Further reduced padding for better space utilization
      const h = Math.max(0, window.innerHeight - top - headerHeight - footerHeight - padding);
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
        const consistentScale = calculateConsistentScale();
        setScale(consistentScale);
        setPan({ x: 0, y: 0 });
        setHasFit(true);
        setDefaultFitScale(consistentScale);
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
        const consistentScale = calculateConsistentScale();
        setScale(consistentScale);
        setPan({ x: 0, y: 0 });
        setHasFit(true);
        setDefaultFitScale(consistentScale);
      }, timeout);
      return () => clearTimeout(timeoutId);
    }
  }, [availableHeight, isMobile, isTablet, is2560Screen, pageDims, boundaryValues]); // Added boundaryValues dependency

  useEffect(() => {
    if (pdfLoaded) return;
    setHasFit(false);
    const timeout = isMobile ? 100 : isTablet ? 75 : is2560Screen ? 25 : 50;
    const timeoutId = setTimeout(() => {
      const consistentScale = calculateConsistentScale();
      setScale(consistentScale);
      setPan({ x: 0, y: 0 });
      setHasFit(true);
      setDefaultFitScale(consistentScale);
    }, timeout);
    return () => clearTimeout(timeoutId);
  }, [pdfLoaded, availableHeight, isMobile, isTablet, is2560Screen, boundaryValues]); // Added boundaryValues dependency

  // Trigger fit when pageDims change (PDF loads)
  useEffect(() => {
    if (pageDims && !hasFit) {
      // Small delay to ensure container is ready
      const timeoutId = setTimeout(() => {
        if (containerRef.current) {
          const consistentScale = calculateConsistentScale();
          setScale(consistentScale);
          setPan({ x: 0, y: 0 });
          setHasFit(true);
          setDefaultFitScale(consistentScale);
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
          const consistentScale = calculateConsistentScale();
          setScale(consistentScale);
          setPan({ x: 0, y: 0 });
          setHasFit(true);
          setDefaultFitScale(consistentScale);
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

    // Use boundary values for zoom fit-to-window if available, otherwise use full PDF dimensions
    let viewW, viewH;
    if (boundaryValues) {
      // Use boundary values to focus on the actual floor plan area
      viewW = boundaryValues.x_right - boundaryValues.x_left;
      viewH = boundaryValues.y_bottom - boundaryValues.y_top;
    } else {
      // Fallback to full PDF dimensions
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
      const marginFactor = is2560Screen ? 0.9 : is1440Screen ? 0.9 : 0.9;
      fitScale = Math.min(scaleX, scaleY) * marginFactor;
    }

    // Ensure minimum scale
    fitScale = Math.max(0.1, fitScale);

    return fitScale;
  };

  useEffect(() => {
    if (pageDims && containerRef.current) {
      // When an area is clicked (selected), use the same consistent scale
      if (selectedAreaId && selectedAreaId !== previousSelectedAreaId) {
        const consistentScale = calculateConsistentScale();

        // Apply the consistent scale and center the floor plan
        setScale(consistentScale);
        setPan({ x: 0, y: 0 });
      }

      // Update the previous selected area ID
      setPreviousSelectedAreaId(selectedAreaId);
    }
  }, [selectedAreaId, pageDims, isMobile, isTablet, is2560Screen, is1440Screen, boundaryValues]); // Added boundaryValues dependency

  // Return to default fit when status panel is closed
  useEffect(() => {
    if (pageDims && containerRef.current && !selectedAreaId && previousSelectedAreaId) {
      // Status panel was closed, return to default fit-to-window
      // Use the consistent scale calculation
      const consistentScale = calculateConsistentScale();
      setScale(consistentScale);
      setPan({ x: 0, y: 0 });
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

      // CRITICAL: If there's an active scene, fetch its details to get fade/delay times
      // This ensures fade/delay times are loaded when area status is refreshed
      // Fade/delay times are stored in the scene definition, not in area status zones
      if (areaStatus.active_scene && areaStatus.area_id) {
        dispatch(fetchSceneStatus({
          areaId: areaStatus.area_id,
          sceneId: areaStatus.active_scene
        }))
          .unwrap()
          .then(sceneStatusResponse => {
            // The response structure: { status: "success", area_id: ..., scene_id: ..., details: [...] }
            // Redux stores details in state.sceneStatus, but unwrap() returns the full response
            const sceneDetails = sceneStatusResponse?.details || sceneStatusResponse || [];

            if (sceneDetails && Array.isArray(sceneDetails) && sceneDetails.length > 0) {
              setZoneLocalValues(prev => {
                const updated = { ...prev };

                sceneDetails.forEach(detail => {
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

                  // Fallback: match by name if zone_id missing or did not match area zones
                  if (!zone && detail.zone_name) {
                    zone = areaStatus.zones?.find((z) => z.name === detail.zone_name);
                  }

                  if (zone) {
                    const zoneType = (detail.zone_type || detail.ZoneType || '').toLowerCase();
                    if (zoneType === 'dimmed' || zoneType === 'whitetune') {
                      // CRITICAL: Update fade/delay times from scene (these are the source of truth)
                      // Always use scene values - these are the saved values from the backend
                      const existingZoneValues = updated[zone.id] || {};

                      // Format fade/delay times to ensure they're 2-digit strings
                      const fadeTime = detail.FadeTime ? String(detail.FadeTime).padStart(2, '0') : '02';
                      const delayTime = detail.DelayTime ? String(detail.DelayTime).padStart(2, '0') : '00';

                      updated[zone.id] = {
                        ...existingZoneValues, // Preserve brightness, cct, etc. from areaStatus
                        fadeTime: fadeTime, // ALWAYS use scene value
                        delayTime: delayTime, // ALWAYS use scene value
                      };
                    }
                  } else {
                    console.warn(`Zone not found for scene detail:`, {
                      zone_id: detail.zone_id,
                      zone_name: detail.zone_name,
                      zone_type: detail.zone_type,
                      availableZones: areaStatus.zones?.map(z => ({ id: z.id, name: z.name }))
                    });
                  }
                });

                return updated;
              });
            } else {
              console.warn('Scene details not found or invalid');
            }
          })
          .catch(error => {
            console.error('Failed to fetch active scene details for fade/delay times:', error);
          });
      } else {
        console.log('No active scene found, using default fade/delay times');
      }
    }
  }, [areaStatus, selectedAreaId, dispatch]);

  useEffect(() => {
    setZonePage(0);
  }, [selectedAreaId, areaStatus?.zones?.length]);

  useEffect(() => {
    if (areaStatus && areaStatus.zones) {
      setShadesLocalValues(
        shades.reduce((acc, shade) => {
          let val = shade.level;
          if (typeof val === "string" && val.endsWith("%")) val = parseInt(val);
          if (typeof val === "string") val = parseInt(val);
          if (typeof val !== "number" || isNaN(val)) val = 0;
          acc[shade.id] = Math.round(val); // Round to whole number
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
      .flatMap(a => (a.coordinates || [])
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
    setContentBBox({ minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY });
  }, [heatmapData.areas, pageDims]);

  // P0-2: after area control changes, refresh only current display mode (+ area already updated)
  useEffect(() => {
    if (areaStatus && areaStatus.area_id && selectedFloorId) {
      const refreshMapData = async () => {
        try {
          if (displayMode === 'Light') {
            const action = await dispatch(fetchFloorMapData({ floorId: selectedFloorId }));
            if (action?.payload?.boundary_values) {
              setBoundaryValues(action.payload.boundary_values);
            }
          } else if (displayMode === 'Occupancy') {
            await dispatch(fetchAreaOccupancyStatus({ floorId: selectedFloorId }));
          } else if (displayMode === 'Energy') {
            await dispatch(fetchAreaEnergyConsumption({ floorId: selectedFloorId }));
          }
        } catch (error) {
          // Failed to refresh map data
        }
      };

      const timeoutId = setTimeout(refreshMapData, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [areaStatus?.light_status, areaStatus?.occupancy_status, areaStatus?.active_scene, dispatch, selectedFloorId, displayMode]);

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
    const maxScaleX = container.offsetWidth / A4_WIDTH;
    const maxScaleY = container.offsetHeight / A4_HEIGHT;
    return Math.min(maxScaleX, maxScaleY);
  };

  const handleFit = () => {
    const consistentScale = calculateConsistentScale();
    const fitPan = { x: 0, y: 0 };

    setFitScale(consistentScale);
    setScale(consistentScale);
    setPan(fitPan);
    setHasFit(true);

    // Always store the fit scale as default (for when status panel closes)
    setDefaultFitScale(consistentScale);
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
      const light = (area.light_status || '').toLowerCase().trim();
      if (light === 'on') {
        // Convert hex to rgba with opacity
        const hex = lightColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        return `rgba(${r}, ${g}, ${b}, 0.5)`;
      } else if (light === 'off') {
        return 'rgba(95,95,95,0.5)';
      }
      return 'transparent';
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

  const handleAreaClick = (area) => {
    setSelectedAreaId(area.area_id || area.id);
    if (!area.area_id) {
      return;
    }

    dispatch(fetchAreaStatus(area.area_id));

    if (selectedFloorId) {
      if (displayMode === "Light") {
        dispatch(fetchFloorMapData({ floorId: selectedFloorId }));
      } else if (displayMode === "Occupancy") {
        dispatch(fetchAreaOccupancyStatus({ floorId: selectedFloorId }));
      } else if (displayMode === "Energy") {
        dispatch(fetchAreaEnergyConsumption({ floorId: selectedFloorId }));
      }
    }
  };


  const scenes = areaStatus?.area_scenes || [];
  const totalPages = Math.ceil(scenes.length / SCENES_PER_PAGE);
  const currentScenes = scenes.slice(scenePage * SCENES_PER_PAGE, (scenePage + 1) * SCENES_PER_PAGE);

  const refreshAllData = async () => {
    if (!areaStatus?.area_id || !areaStatus?.floor_id) return;

    const floorId = areaStatus.floor_id;
    await dispatch(fetchAreaStatus(areaStatus.area_id));
    if (displayMode === 'Light') {
      const action = await dispatch(fetchFloorMapData({ floorId }));
      if (action?.payload?.boundary_values) {
        setBoundaryValues(action.payload.boundary_values);
      }
    } else if (displayMode === 'Occupancy') {
      await dispatch(fetchAreaOccupancyStatus({ floorId }));
    } else if (displayMode === 'Energy') {
      await dispatch(fetchAreaEnergyConsumption({ floorId }));
    }
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
      // Only refresh the specific area status since we're toggling all zones in this area
      // This prevents other areas from showing as "updated" in logs
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
    const zonesToUpdate = areaStatus.zones
      .slice(zonePage * ZONES_PER_PAGE, (zonePage + 1) * ZONES_PER_PAGE)
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

      // Only refresh the specific area status, not all heatmap data
      // This prevents all zones from showing as "updated" in logs
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
        acc[shade.id] = percent;
        return acc;
      }, {})
    );
  };

  const handleApplyShades = async () => {
    // Check if user has permission to update area status
    if (!canUpdateAreaStatus()) {
      return;
    }

    setShadesUpdating(true);
    try {
      // Only get shades that have been modified (have local values different from original)
      const shadesToUpdate = Object.entries(shadesLocalValues)
        .filter(([id, position]) => {
          const shade = shades.find(s => s.id === id);
          if (!shade) return false;

          // Get original level value
          let originalLevel = shade.level;
          if (typeof originalLevel === "string" && originalLevel.endsWith("%")) {
            originalLevel = parseInt(originalLevel);
          }
          if (typeof originalLevel === "string") {
            originalLevel = parseInt(originalLevel);
          }
          if (typeof originalLevel !== "number" || isNaN(originalLevel)) {
            originalLevel = 0;
          }

          // Check if the position has actually changed
          return Math.round(position) !== Math.round(originalLevel);
        })
        .map(([id, position]) => ({
          zone_id: id,
          zone_type: "Shade",
          level: position
        }));

      // Only proceed if there are actually changes to apply
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
  };

  const switchedZones = areaStatus?.zones?.filter(z => isSwitched(z.type)) || [];
  const whiteTuneZones = areaStatus?.zones?.filter(z => isWhitening(z.type)) || [];
  const dimmedZones = areaStatus?.zones?.filter(z => isDimmed(z.type)) || [];

  // Show ALL reconciled zones on the sidebar:
  // - CCT/WhiteTune first
  // - then Dimmed
  // - then Switched
  // This ensures newly reconciled switching zones (e.g. SW_2/4) are visible outside the Edit Scene dialog.
  const zonesToShow = [...whiteTuneZones, ...dimmedZones, ...switchedZones];

  // Pagination: keep existing responsive behavior
  let zonesPerPage = ZONES_PER_PAGE;
  if (is1440Screen || isUltraWide || is2560Screen) {
    zonesPerPage = 4;
  } else {
    zonesPerPage = 2;
  }
  const totalZonePages = Math.ceil(zonesToShow.length / zonesPerPage);


  // Helper function to check if an area has active alerts
  const hasActiveAlert = (areaName) => {
    if (!activeAlerts || !Array.isArray(activeAlerts) || activeAlerts.length === 0) {
      return false;
    }

    // Normalize area name for comparison
    const normalizedAreaName = (areaName || '').toLowerCase().trim();

    // Check if any alert's location matches this area
    return activeAlerts.some(alert => {
      const alertLocation = (alert.location || '').toLowerCase().trim();

      // Match 1: Exact match (for backward compatibility)
      if (alertLocation === normalizedAreaName) {
        return true;
      }

      // Match 2: Check if alert location ends with the area name
      // Example: "tower a fourth floor/dining room" ends with "dining room"
      if (alertLocation.endsWith(normalizedAreaName)) {
        return true;
      }

      // Match 3: Extract the last part after "/" and match
      // Example: "tower a fourth floor/dining room" -> "dining room"
      const alertLocationParts = alertLocation.split('/');
      const lastPart = alertLocationParts[alertLocationParts.length - 1].trim();
      if (lastPart === normalizedAreaName) {
        return true;
      }

      return false;
    });
  };

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
          height: availableHeight ? `${availableHeight}px` : 'calc(100vh - 180px)', // Slightly increased height to match settings better
          display: 'flex',
          flexDirection: 'row',
          overflow: 'hidden',
          p: 0,
          m: 0,
          bgcolor: 'transparent',
          // Ensure no gaps between columns
          gap: 0,
          // Force full width utilization
          maxWidth: '100%',
          boxSizing: 'border-box',
          // Ensure the container takes full available height
          minHeight: 'calc(100vh - 180px)', // Slightly increased height to match settings better
          position: 'relative', // Add relative positioning for absolute legends
        }}
      >
        {/* Heatmap and Legends/Navigation Column */}
        <Box
          sx={{
            flex: '1 1 100%', // Always take full available space
            minWidth: 0,
            height: '100%',
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
                onClick={() => {
                  const consistentScale = calculateConsistentScale();
                  setScale(consistentScale);
                  setPan({ x: 0, y: 0 });
                  setFitScale(consistentScale);
                  setHasFit(true);
                  setDefaultFitScale(consistentScale);
                }}
                size={isMobile ? 'small' : 'medium'}
                title="Reset to fit position"
                sx={{ bgcolor: 'rgba(255,255,255,0.9)', boxShadow: 1 }}
              >
                <FitScreenIcon fontSize={isMobile ? 'small' : 'medium'} />
              </IconButton>
            </Box>

            {/* PDF Container - Takes remaining space with padding */}
            <Box
              ref={containerRef}
              sx={{
                flex: 1,
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                bgcolor: 'transparent',
                // Add padding to wrap the floor plan properly
                pl: { xs: 2, sm: 3, md: 4 }, // Left padding - prevents legend text clipping
                pr: { xs: 2, sm: 3, md: 4 }, // Right padding
                pb: { xs: 2, sm: 3, md: 4 }, // Bottom padding
              }}
            >
              <HeatmapPdfSvgViewer
                pdfUrl={pdfUrl}
                pageDims={pageDims}
                setPageDims={setPageDims}
                scale={scale}
                setScale={setScale}
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
                navigate={navigate}

              />
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: { xs: 0.3, sm: 0.5 },
                height: 40,
                background: 'none',
                backgroundColor: 'transparent',
                px: { xs: 1.5, sm: 2, md: 2.5 },
                flexShrink: 0,
                py: 0.1,
                minWidth: { xs: 200, sm: 250, md: 300 },
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
              }}
            >
              {/* Display Mode Legend - Now on the left */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0, overflow: 'visible' }}>
                <Typography
                  fontSize={{ xs: 16, sm: 17, md: 18 }}
                  fontWeight={600}
                  sx={{
                    color: '#000',
                    textShadow: '1px 1px 2px rgba(255,255,255,0.8), -1px -1px 2px rgba(255,255,255,0.8), 1px -1px 2px rgba(255,255,255,0.8), -1px 1px 2px rgba(255,255,255,0.8)'
                  }}
                >
                  {displayMode === 'Energy' ? 'Energy Savings' : displayMode}:
                </Typography>
                {displayMode === 'Light' && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 12, height: 12, bgcolor: lightColor, borderRadius: 0.5 }} />
                    <Typography
                      fontSize={{ xs: 15, sm: 16, md: 17 }}
                      sx={{
                        color: '#000',
                        textShadow: '1px 1px 2px rgba(255,255,255,0.8), -1px -1px 2px rgba(255,255,255,0.8), 1px -1px 2px rgba(255,255,255,0.8), -1px 1px 2px rgba(255,255,255,0.8)'
                      }}
                    >
                      On
                    </Typography>
                    <Box sx={{ width: 12, height: 12, bgcolor: 'rgba(95,95,95,0.5)', borderRadius: 0.5 }} />
                    <Typography
                      fontSize={{ xs: 15, sm: 16, md: 17 }}
                      sx={{
                        color: '#000',
                        textShadow: '1px 1px 2px rgba(255,255,255,0.8), -1px -1px 2px rgba(255,255,255,0.8), 1px -1px 2px rgba(255,255,255,0.8), -1px 1px 2px rgba(255,255,255,0.8)'
                      }}
                    >
                      Off
                    </Typography>
                  </Box>
                )}
                {displayMode === 'Occupancy' && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 12, height: 12, bgcolor: occupancyColor, borderRadius: 0.5 }} />
                    <Typography
                      fontSize={{ xs: 15, sm: 16, md: 17 }}
                      sx={{
                        color: '#000',
                        textShadow: '1px 1px 2px rgba(255,255,255,0.8), -1px -1px 2px rgba(255,255,255,0.8), 1px -1px 2px rgba(255,255,255,0.8), -1px 1px 2px rgba(255,255,255,0.8)'
                      }}
                    >
                      Occupied
                    </Typography>
                    <Box sx={{ width: 12, height: 12, bgcolor: 'rgba(95,95,95,0.5)', borderRadius: 0.5 }} />
                    <Typography
                      fontSize={{ xs: 15, sm: 16, md: 17 }}
                      sx={{
                        color: '#000',
                        textShadow: '1px 1px 2px rgba(255,255,255,0.8), -1px -1px 2px rgba(255,255,255,0.8), 1px -1px 2px rgba(255,255,255,0.8), -1px 1px 2px rgba(255,255,255,0.8)'
                      }}
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
                        sx={{
                          color: '#000',
                          textShadow: '1px 1px 2px rgba(255,255,255,0.8), -1px -1px 2px rgba(255,255,255,0.8), 1px -1px 2px rgba(255,255,255,0.8), -1px 1px 2px rgba(255,255,255,0.8)'
                        }}
                      >
                        High
                      </Typography>
                      <Box sx={{ width: 12, height: 12, bgcolor: mediumColor, borderRadius: 0.5 }} />
                      <Typography
                        fontSize={{ xs: 15, sm: 16, md: 17 }}
                        sx={{
                          color: '#000',
                          textShadow: '1px 1px 2px rgba(255,255,255,0.8), -1px -1px 2px rgba(255,255,255,0.8), 1px -1px 2px rgba(255,255,255,0.8), -1px 1px 2px rgba(255,255,255,0.8)'
                        }}
                      >
                        Medium
                      </Typography>
                      <Box sx={{ width: 12, height: 12, bgcolor: lowColor, borderRadius: 0.5 }} />
                      <Typography
                        fontSize={{ xs: 15, sm: 16, md: 17 }}
                        sx={{
                          color: '#000',
                          textShadow: '1px 1px 2px rgba(255,255,255,0.8), -1px -1px 2px rgba(255,255,255,0.8), 1px -1px 2px rgba(255,255,255,0.8), -1px 1px 2px rgba(255,255,255,0.8)'
                        }}
                      >
                        Low
                      </Typography>
                    </Box>
                  );
                })()}
              </Box>

              {/* Floor Navigation - Now in the center */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton
                  size="small"
                  onClick={() => handleFloorChange(-1)}
                  disabled={!floors || floors.length === 0}
                  sx={{ ...navIconSx }}
                >
                  <ArrowBackIcon fontSize="small" />
                </IconButton>
                <Typography
                  fontSize={{ xs: 10, sm: 11, md: 12 }}
                  fontWeight={600}
                  sx={{
                    minWidth: { xs: 60, sm: 80 },
                    textAlign: 'center',
                    color: '#000',
                    textShadow: '1px 1px 2px rgba(255,255,255,0.8), -1px -1px 2px rgba(255,255,255,0.8), 1px -1px 2px rgba(255,255,255,0.8), -1px 1px 2px rgba(255,255,255,0.8)'
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

              {/* Empty space on the right for balance */}
              <Box sx={{ width: { xs: 100, sm: 120, md: 140 } }} />
            </Box>
          </Box>
        </Box>
        {/* Status Panel - responsive based on screen size */}
        {selectedAreaId && (
          <Box
            sx={{
              flex: '0 0 auto', // Don't grow or shrink, maintain fixed width
              width: {
                xs: '28%',  // Mobile - slightly wider for better usability
                sm: '25%',  // Small tablets
                md: '22%',  // Medium screens
                lg: '20%',  // Large screens
                xl: '18%'   // Ultra-wide screens
              },
              minWidth: {
                xs: 280,  // Mobile minimum width
                sm: 300,  // Small tablet minimum width
                md: 320,  // Medium screen minimum width
                lg: 360,  // Large screen minimum width
                xl: 400   // Ultra-wide minimum width
              },
              maxWidth: {
                xs: 320,  // Mobile maximum width
                sm: 350,  // Small tablet maximum width
                md: 380,  // Medium screen maximum width
                lg: 420,  // Large screen maximum width
                xl: 480   // Ultra-wide maximum width
              },
              height: '100%', // Same height as floorplan
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              minHeight: 0,
              boxShadow: '-2px 0 8px rgba(0,0,0,0.10)',
              background: '#a89e87',
              overflow: 'hidden',
              p: 0,
              m: 0,
              boxSizing: 'border-box',
              zIndex: 2,
              transition: 'width 0.3s',
              borderRadius: '10px 0 0 10px',
              position: 'static',
            }}
          >
            {/* Header */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: { xs: 1, sm: 1.5, md: 2 },
              py: { xs: 0.5, sm: 0.75, md: 1 },
              minHeight: { xs: 25, sm: 28, md: 32 },
              bgcolor: '#a89e87',
              flexShrink: 0,
              width: '100%',
              gap: 1, // Add gap between elements
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
                <Typography
                  fontWeight={400}
                  fontSize={{ xs: 7, sm: 8, md: 9, lg: 10 }} // Further reduced font sizes
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                    minWidth: 0,
                    maxWidth: '100%', // Ensure it doesn't exceed container
                    lineHeight: 1.2, // Tighter line height
                  }}
                >
                  {areaStatus?.area_name || selectedAreaObj?.name || selectedAreaObj?.area_name || 'Zone'}
                </Typography>
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
                    }}
                    title="Area Settings"
                  >
                    <SettingsIcon fontSize={isMobile ? 'small' : 'medium'} />
                  </IconButton>
                )}
                <IconButton
                  size="small"
                  onClick={() => setSelectedAreaId(null)}
                  sx={{
                    fontSize: { xs: 12, sm: 14, md: 16, lg: 18 }, // Reduced icon sizes
                    p: { xs: 0.2, sm: 0.3, md: 0.4, lg: 0.5 } // Reduced padding
                  }}
                >
                  <CloseIcon fontSize={isMobile ? 'small' : 'medium'} />
                </IconButton>
              </Box>
            </Box>

            {/* Main Content - Full height without scrolling */}
            <Box sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              gap: { xs: 0.1, sm: 0.15, md: 0.2, lg: 0.25 },
              p: { xs: 0.5, sm: 0.75, md: 1 },
              boxSizing: 'border-box',
              position: 'relative',
              overflowY: 'auto'
            }}>
              {areaStatusLoading ? (
                <Box sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(168,158,135,0.7)',
                  zIndex: 10
                }}>
                  <CircularProgress size={isMobile ? 24 : 36} />
                </Box>
              ) : (
                <>
                  {/* Scene Section */}
                  <Box sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'stretch',
                    bgcolor: '#807864',
                    borderRadius: 0,
                    minHeight: { xs: 45, sm: 50, md: 55, lg: 60, xl: 60 },
                    flexShrink: 0,
                    p: 0,
                    m: 0,
                    boxSizing: 'border-box',
                  }}>
                    <Box sx={{
                      writingMode: 'vertical-rl',
                      fontWeight: 'bold',
                      fontSize: { xs: 8, sm: 9, md: 10, lg: 12 },
                      color: '#222',
                      px: { xs: 0.3, sm: 0.4, md: 0.5 },
                      py: 0.2,
                      minWidth: { xs: 16, sm: 18, md: 20, lg: 24 },
                      textAlign: 'center',
                      bgcolor: '#fff',
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

                                try {
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

                                  console.log('Scene status response:', sceneStatusResponse);
                                  console.log('Scene details extracted:', sceneDetails);

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
                                            console.log(`Updated dimmed zone "${zone.name}" (zone_id: ${zone.id}) from scene:`, {
                                              fadeTime: detail.FadeTime || '02',
                                              delayTime: detail.DelayTime || '00',
                                              brightness: detail.Level || 0
                                            });
                                          } else if (zoneType === 'whitetune') {
                                            updated[zone.id] = {
                                              ...updated[zone.id],
                                              brightness: detail.Level || 0,
                                              cct: detail.WhiteTuningLevel?.Kelvin || 2700,
                                              fadeTime: detail.FadeTime || '02',
                                              delayTime: detail.DelayTime || '00',
                                            };
                                            console.log(`Updated whitetune zone "${zone.name}" (zone_id: ${zone.id}) from scene:`, {
                                              fadeTime: detail.FadeTime || '02',
                                              delayTime: detail.DelayTime || '00',
                                              brightness: detail.Level || 0,
                                              cct: detail.WhiteTuningLevel?.Kelvin || 2700
                                            });
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

                  {/* Zones Section - responsive height based on screen size */}
                  <Box sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'stretch',
                    bgcolor: '#807864',
                    borderRadius: 0,
                    minHeight: {
                      xs: 55,   // Mobile - reduced
                      sm: 65,   // Small tablet - reduced
                      md: 80,   // Laptop - reduced
                      lg: 95,   // Large screen - reduced
                      xl: 120   // Ultra-wide screen - reduced
                    },
                    flexShrink: 0,
                    p: 0,
                    m: 0,
                    boxSizing: 'border-box',
                  }}>
                    <Box sx={{
                      writingMode: 'vertical-rl',
                      fontWeight: 'bold',
                      fontSize: { xs: 8, sm: 9, md: 10, lg: 12 },
                      color: '#222',
                      px: { xs: 0.3, sm: 0.4, md: 0.5 },
                      py: 0.2,
                      minWidth: { xs: 16, sm: 18, md: 20, lg: 24 },
                      textAlign: 'center',
                      bgcolor: '#fff',
                      borderRadius: '0 12px 12px 0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transform: 'rotate(180deg)',
                      mr: { xs: 0.5, md: 1 },
                    }}>
                      Zones
                    </Box>
                    <Box sx={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      p: { xs: 0.3, md: 0.5 },
                      minHeight: 0,
                      position: 'relative',
                      gap: { xs: 0.3, md: 0.5 },
                    }}>
                      {/* Zone controls */}
                      <Box sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column', // Always use column layout to utilize full height
                        gap: { xs: 0.2, md: 0.3, lg: 0.4, xl: 0.5 }, // Reduced gap
                        justifyContent: 'flex-start',
                        alignItems: 'center',
                        minHeight: 0,
                        overflow: 'hidden',

                      }}>
                        {zonesToShow.length > 0 ? (
                          <>
                            {zonesToShow
                              .slice(zonePage * zonesPerPage, (zonePage + 1) * zonesPerPage)
                              .map((zone, idx) => {
                                const values = zoneLocalValues[zone.id] || getDefaultZoneValues(zone);
                                return (
                                  <ZoneControlCard
                                    key={zone.id}
                                    zone={zone}
                                    values={values}
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
                            <Box sx={{
                              display: 'flex',
                              justifyContent: 'flex-end',
                              width: '100%',
                              mt: 0.5
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
                            color="#fff"
                            fontSize={{ xs: 12, md: 15 }}
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
                          {zonePage > 0 ? (
                            <IconButton
                              size="small"
                              onClick={() => setZonePage(zonePage - 1)}
                              sx={{ ...navIconSx }}
                            >
                              <ArrowBackIosNewIcon sx={{ color: '#222', fontSize: { xs: 14, md: 18 } }} />
                            </IconButton>
                          ) : zonePage < totalZonePages - 1 ? (
                            <IconButton
                              size="small"
                              onClick={() => setZonePage(zonePage + 1)}
                              sx={{ ...navIconSx }}
                            >
                              <ArrowForwardIosIcon sx={{ color: '#222', fontSize: { xs: 14, md: 18 } }} />
                            </IconButton>
                          ) : null}
                        </Box>
                      )}
                    </Box>
                  </Box>

                  {/* Occupancy Section */}
                  <Box sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'stretch',
                    bgcolor: '#807864',
                    borderRadius: 0,
                    minHeight: { xs: 35, sm: 40, md: 45, lg: 45, xl: 45 },
                    flexShrink: 0,
                    p: 0,
                    m: 0,
                    boxSizing: 'border-box',
                  }}>
                    <Box sx={{
                      writingMode: 'vertical-rl',
                      fontWeight: 'bold',
                      fontSize: { xs: 10, md: 12 },
                      color: '#222',
                      px: 0.5,
                      py: 0.2,
                      minWidth: { xs: 20, md: 24 },
                      textAlign: 'center',
                      bgcolor: '#fff',
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
                          <CircularProgress size={isMobile ? 16 : 20} />
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
                          <Typography fontSize={{ xs: 11, md: 13 }} color="#fff" fontWeight="normal">
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
                    bgcolor: '#807864',
                    borderRadius: 0,
                    minHeight: { xs: 45, sm: 50, md: 55, lg: 55, xl: 55 },
                    flexShrink: 0,
                    p: 0,
                    m: 0,
                    boxSizing: 'border-box',
                  }}>
                    <Box sx={{
                      writingMode: 'vertical-rl',
                      fontWeight: 'bold',
                      fontSize: { xs: 10, md: 12 },
                      color: '#222',
                      px: 0.5,
                      py: 0.2,
                      minWidth: { xs: 20, md: 24 },
                      textAlign: 'center',
                      bgcolor: '#fff',
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
                          <CircularProgress size={isMobile ? 16 : 20} />
                        </Box>
                      ) : (
                        <>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: { xs: 60, md: 80 } }}>
                            <Typography fontSize={{ xs: 10, md: 12 }} color="#fff" fontWeight="normal" letterSpacing={1}>Consumption</Typography>
                            <Typography fontSize={{ xs: 10, md: 12 }} color="#fff" fontWeight="bold" mt={0.5}>
                              {formatSidebarEnergyWatts(areaStatus?.consumption)}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: { xs: 60, md: 80 } }}>
                            <Typography fontSize={{ xs: 10, md: 12 }} color="#fff" fontWeight="normal" letterSpacing={1}>Savings</Typography>
                            <Typography fontSize={{ xs: 10, md: 12 }} color="#fff" fontWeight="bold" mt={0.5}>
                              {formatSidebarEnergyWatts(areaStatus?.savings)}
                            </Typography>
                          </Box>
                        </>
                      )}
                    </Box>
                  </Box>

                  {/* Shades Section - Only show if shades are present */}
                  {shades.length > 0 && (
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'stretch',
                        bgcolor: '#807864',
                        borderRadius: 0,
                        minHeight: { xs: 110, md: 130 },
                        flexShrink: 0,
                        p: 0,
                        m: 0,
                        boxSizing: 'border-box',
                        position: 'relative',
                      }}
                    >
                      {/* Vertical label */}
                      <Box sx={{
                        writingMode: 'vertical-rl',
                        fontWeight: 'bold',
                        fontSize: { xs: 10, md: 12 },
                        color: '#222',
                        px: 0.5,
                        py: 0.2,
                        minWidth: { xs: 20, md: 24 },
                        textAlign: 'center',
                        bgcolor: '#fff',
                        borderRadius: '0 12px 12px 0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transform: 'rotate(180deg)',
                        mr: 1,
                      }}>
                        Shades
                      </Box>

                      {/* Preset buttons */}
                      <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: { xs: 0.1, md: 0.2 },
                        mr: 0.5,
                        justifyContent: 'center',
                        mb: { xs: 3, md: 4 }
                      }}>
                        {[100, 75, 25, 0].map((percent) => (
                          <Button
                            key={percent}
                            variant="contained"
                            onClick={() => handleShadesPreset(percent)}
                            disabled={!canUpdateAreaStatus()}
                            sx={{
                              background: !canUpdateAreaStatus() ? '#ddd' : '#222',
                              color: !canUpdateAreaStatus() ? '#999' : '#fff',
                              borderRadius: 0.8,
                              fontSize: { xs: 8, md: 10 },
                              fontWeight: 400,
                              px: { xs: 0.3, md: 0.5 },
                              py: { xs: 0.05, md: 0.1 },
                              textTransform: 'none',
                              boxShadow: 1,
                              minWidth: { xs: 32, md: 40 },
                              minHeight: { xs: 14, md: 16 },
                              lineHeight: 1.1,
                              padding: { xs: 0.6, md: 0.8 },
                              opacity: !canUpdateAreaStatus() ? 0.5 : 1,
                              cursor: !canUpdateAreaStatus() ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {percent}% open
                          </Button>
                        ))}
                      </Box>

                      {/* Sliders with paging */}
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 0.5,
                          flex: 1,
                          minHeight: 0,
                          justifyContent: 'flex-start',
                          position: 'relative',
                          height: '100%',
                        }}
                      >
                        {/* Left arrow */}
                        {shadesPage > 0 && (
                          <IconButton
                            size="small"
                            onClick={() => setShadesPage(shadesPage - 1)}
                            sx={{ ...navIconSx, mr: 0.5 }}
                          >
                            <ArrowBackIosNewIcon sx={{ color: '#222', fontSize: { xs: 14, md: 18 } }} />
                          </IconButton>
                        )}

                        {/* Sliders */}
                        {pagedShades.map((shade) => (
                          <Box
                            key={shade.id}
                            sx={{
                              bgcolor: '#fff',
                              borderRadius: 0.5,
                              minWidth: { xs: 32, md: 40 },
                              maxWidth: { xs: 42, md: 50 },
                              height: { xs: 80, md: 100 },
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              boxShadow: 2,
                              justifyContent: 'center',
                              p: { xs: 0.1, md: 0.2 },
                              mb: { xs: 3, md: 4 }
                            }}
                          >
                            <Typography
                              fontSize={{ xs: 8, md: 10 }}
                              fontWeight={500}
                              sx={{
                                mb: 0.1,
                                textAlign: 'center',
                                lineHeight: 1.1,
                                maxWidth: { xs: 32, md: 40 },
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {shade.name || 'Group'}
                            </Typography>
                            <div
                              style={{
                                height: isMobile ? 70 : 90,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <input
                                type="range"
                                min={0}
                                max={100}
                                step={1}
                                value={100 - (shadesLocalValues[shade.id] ?? 0)}
                                onChange={e => handleShadeSlider(shade.id, 100 - Number(e.target.value))}
                                disabled={shadesUpdating || !canUpdateAreaStatus()}
                                style={{
                                  writingMode: "vertical-lr",
                                  direction: "rtl",
                                  width: isMobile ? 10 : 12,
                                  height: isMobile ? 45 : 55,
                                  margin: 0,
                                  accentColor: "#222",
                                  transform: 'scaleY(-1)'
                                }}
                              />
                            </div>
                            <Typography fontSize={{ xs: 8, md: 10 }} fontWeight={500}>
                              {Math.round(shadesLocalValues[shade.id] ?? 0)}%
                            </Typography>
                          </Box>
                        ))}

                        {/* Right arrow */}
                        {shades.length > SHADES_PER_PAGE &&
                          (shadesPage + 1) * SHADES_PER_PAGE < shades.length && (
                            <IconButton
                              size="small"
                              onClick={() => setShadesPage(shadesPage + 1)}
                              sx={{ ...navIconSx, ml: 0.5 }}
                            >
                              <ArrowForwardIosIcon sx={{ color: '#222', fontSize: { xs: 14, md: 18 } }} />
                            </IconButton>
                          )}
                      </Box>

                      {/* Apply Button */}
                      <Box
                        sx={{
                          position: 'absolute',
                          right: { xs: 12, md: 16 },
                          bottom: 1,
                          zIndex: 2,
                          display: 'flex',
                          justifyContent: 'flex-end',
                          width: 'auto',
                        }}
                      >
                        <Button
                          size="small"
                          variant="contained"
                          onClick={handleApplyShades}
                          disabled={shadesUpdating || !canUpdateAreaStatus()}
                          sx={{
                            ...applyButtonSx,
                            opacity: !canUpdateAreaStatus() ? 0.5 : 1,
                            cursor: !canUpdateAreaStatus() ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {shadesUpdating ? 'Applying...' : 'Apply'}
                        </Button>
                      </Box>
                    </Box>
                  )}
                </>
              )}
            </Box>
          </Box>
        )}

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

function ZoneControlCard({ zone, values, onChange, disabled, isMobile, isTablet, isDesktop, isLargeScreen, is1440Screen, isUltraWide, is2560Screen, backgroundColor, contentColor, buttonColor }) {
  const isSwitchType = isSwitched(zone.type);
  const isWhitetuneType = isWhitening(zone.type);
  const isDimmedType = isDimmed(zone.type);

  const safeValues = values || { on_off: zone.status || zone.on_off || 'Off' };

  if (isSwitchType) {
    const isOn = safeValues.on_off === 'On';
    return (
      <Box
        sx={{
          bgcolor: '#fff',
          borderRadius: 0.5,
          pt: 0.5,
          pb: 0.5,
          pl: 0.5,
          pr: 0.5,
          width: { xs: 140, sm: 150, md: 160 },
          minWidth: { xs: 140, sm: 150, md: 160 },
          maxWidth: { xs: 140, sm: 150, md: 160 },
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 1,
          mb: 0.5,
          justifyContent: 'flex-start',
          boxSizing: 'border-box',
        }}
      >
        <Typography
          fontWeight="bold"
          fontSize={{ xs: 11, md: 13 }}
          sx={{
            flex: 1,
            minWidth: 20,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            mr: 0.5,
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

    return (
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 1, mb: 0.5 }}>
        <Box sx={{
          flex: 1,
          bgcolor: '#fff',
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
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
                mr: 0.5
              }}
            >
              {zone.name}
            </Typography>
            <Typography
              fontSize={{ xs: 8, sm: 9, md: 10 }}
              fontWeight={700}
              sx={{
                color: '#807864',
                background: '#f5f5f5',
                px: 0.3,
                py: 0.1,
                borderRadius: 0.5,
                border: '1px solid #ddd',
                minWidth: 24,
                textAlign: 'center',
                flexShrink: 0
              }}
            >
              {safeValues.brightness !== undefined ? safeValues.brightness : brightnessMin}%
            </Typography>
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

          {/* CCT Slider - Fixed positioning */}
          <Box sx={{ position: 'relative', width: '85%', mt: 0.8, pl: { xs: 1, md: 2 } }}>
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
            <Typography
              fontSize={{ xs: 8, sm: 9, md: 10 }}
              fontWeight={500}
              sx={{
                position: 'absolute',
                top: { xs: -18, sm: -20, md: -22 }, // Moved further up
                right: -8, // Moved further right
                color: '#333',
                background: '#fff',
                px: 0.4,
                py: 0.1,
                borderRadius: 0.5,
                border: '1px solid #ddd',
                minWidth: 32,
                textAlign: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              {safeValues.cct}K
            </Typography>
          </Box>

          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: { xs: 7, md: 9 },
            color: '#807864',
            mt: 0.8 // Increased margin top
          }}>
            <span>{cctMin}K</span>
            <span>{cctMax}K</span>
          </Box>
        </Box>

        {/* Fade/Delay Time inputs */}
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: { xs: 0.5, md: 1 }, alignItems: 'flex-start', justifyContent: 'center', ml: 1, width: { xs: 80, sm: 90, md: 100 } }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography fontSize={{ xs: 9, md: 11 }} fontWeight={700} sx={{ mb: 0.2, textAlign: 'center' }}>Fade</Typography>
            <Typography fontSize={{ xs: 9, md: 11 }} fontWeight={700} sx={{ mb: 0.2, textAlign: 'center' }}>Time</Typography>
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
            <Typography fontSize={{ xs: 9, md: 11 }} fontWeight={700} sx={{ mb: 0.2, textAlign: 'center' }}>Delay</Typography>
            <Typography fontSize={{ xs: 9, md: 11 }} fontWeight={700} sx={{ mb: 0.2, textAlign: 'center' }}>Time</Typography>
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
        <Box sx={{
          flex: 1,
          bgcolor: '#fff',
          borderRadius: 0.5,
          pt: 0.5,
          pb: 0,
          pl: 0.5,
          pr: 0.5,
          //p: { xs: 0.5, md: 0.6 },
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
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
                mr: 0.5
              }}
            >
              {zone.name}
            </Typography>
            <Typography
              fontSize={{ xs: 8, sm: 9, md: 10 }}
              fontWeight={700}
              sx={{
                color: '#807864',
                background: '#f5f5f5',
                px: 0.3,
                py: 0.1,
                borderRadius: 0.5,
                border: '1px solid #ddd',
                minWidth: 24,
                textAlign: 'center',
                flexShrink: 0
              }}
            >
              {safeValues.brightness}%
            </Typography>
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
            <Typography fontSize={{ xs: 9, md: 11 }} sx={{ mb: 0.2, textAlign: 'center' }}>Fade</Typography>
            <Typography fontSize={{ xs: 9, md: 11 }} sx={{ mb: 0.2, textAlign: 'center' }}>Time</Typography>
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
            <Typography fontSize={{ xs: 9, md: 11 }} sx={{ mb: 0.2, textAlign: 'center' }}>Delay</Typography>
            <Typography fontSize={{ xs: 9, md: 11 }} sx={{ mb: 0.2, textAlign: 'center' }}>Time</Typography>
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

function getPolygonBoundingBox(coords) {
  if (!coords.length) return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  const xs = coords.map(pt => pt.x);
  const ys = coords.map(pt => pt.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  return {
    minX, minY, maxX, maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
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
  pdfUrl,
  pageDims,
  setPageDims,
  scale,
  setScale,
  hasFit,
  handleFit,
  areas,
  getFill,
  handleAreaClick,
  searchTerm,
  pan,
  setPan,
  searchBounceAnimation,
  isDragging,
  setIsDragging,
  dragStart,
  setDragStart,
  contentBBox,
  boundaryValues,
  getContainerDimensions,
  containerFitMode,
  highlightedAreaId,
  hasActiveAlert,
  navigate
}) {


  // Use A4 dimensions as fallback for consistent rendering
  const A4_WIDTH = 794;
  const A4_HEIGHT = 1123;

  // Ref for wheel event listener
  const containerRef = React.useRef(null);

  // Pan/drag functionality
  const handleMouseDown = (e) => {
    if (e.button === 0) { // Left mouse button
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      e.preventDefault();
    }
  };


  const handleMouseMove = (e) => {
    if (isDragging) {
      const newPan = {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      };
      setPan(newPan);
      e.preventDefault();
    }
  };

  const handleMouseUp = (e) => {
    if (isDragging) {
      setIsDragging(false);
      e.preventDefault();
    }
  };

  const handleMouseLeave = (e) => {
    if (isDragging) {
      setIsDragging(false);
    }
  };

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
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          width: 'auto',
          height: 'auto',
          maxWidth: 'none',
          maxHeight: 'none',
          display: 'block',
          pointerEvents: isDragging ? 'none' : 'auto',
        }}
      >
        {/* Render full PDF with proper scaling */}
        <Box>
          {pdfUrl ? (
            <Document file={pdfUrl} key={pdfUrl}>
              <Page
                pageNumber={1}
                width={pageDims ? pageDims.width : A4_WIDTH}
                renderAnnotationLayer={false}
                renderTextLayer={false}
                onLoadSuccess={(page) => {
                  // Capture original PDF dimensions for coordinate scaling
                  const dimensions = { width: page.originalWidth, height: page.originalHeight };
                  setPageDims(dimensions);
                }}
              />
            </Document>
          ) : (
            <CircularProgress />
          )}
          <svg
            width={pageDims ? pageDims.width : A4_WIDTH}
            height={pageDims ? pageDims.height : A4_HEIGHT}
            style={{ position: 'absolute', top: 0, left: 0, zIndex: 2, pointerEvents: 'auto' }}
          >
            {(areas || []).map((area, index) => {
              const rings = getPolygonRings(area);
              const flat = flattenAreaCoords(area);
              if (!rings.length && !flat.length) return null;

              // Use coordinates directly - they should already be in the correct PDF coordinate system
              const scaledCoords = flat;

              const points = scaledCoords.map((p) => `${p.x},${p.y}`).join(' ');
              const center = scaledCoords.length > 0
                ? { x: scaledCoords.reduce((sum, p) => sum + p.x, 0) / scaledCoords.length, y: scaledCoords.reduce((sum, p) => sum + p.y, 0) / scaledCoords.length }
                : { x: 0, y: 0 };
              const bbox = getPolygonBoundingBox(scaledCoords);

              const isHighlightedSearch = areaNameMatchesSearch(area, searchTerm);
              const isHighlightedById = highlightedAreaId && ((area.area_id || area.id) === highlightedAreaId);
              const isHighlighted = !!isHighlightedById || !!isHighlightedSearch;

              // Calculate available space - use more space for larger areas
              const areaSize = Math.min(bbox.width, bbox.height);
              // Use more space for larger areas to show full text
              const spaceFactor = areaSize > 50 ? 0.9 : 0.8;
              const availableWidth = bbox.width * spaceFactor;
              const availableHeight = bbox.height * spaceFactor;

              // Dynamic zoom threshold - show abbreviated text by default, full names after 5 zoom-ins
              // Default scale ~0.88, after 5 clicks: 0.88 + (5 × 0.05) = 1.13
              const baseThreshold = 1.13; // Show full names after 5 zoom-ins from actual default scale

              // NO size adjustments - keep threshold consistent for all areas
              const sizeAdjustment = 0;

              const ZOOM_THRESHOLD = baseThreshold - sizeAdjustment;
              const isZoomedIn = scale > ZOOM_THRESHOLD;

              // Zoom-independent font sizes normalized by floorplan width.
              // Start from a PDF-wide base size, then apply slight adjustments for tiny areas.
              const baseFont = getNormalizedBaseFont();
              let fontSize = baseFont;
              if (areaSize < 40) fontSize = Math.max(5, baseFont - 3);
              else if (areaSize < 80) fontSize = Math.max(5, baseFont - 2);

              const padding = fontSize * 0.1;
              const lineHeight = fontSize * 1.1;

              // Two-line short label: MAIN + OS (or second token). Tooltip shows full name.
              const createTwoLineLabel = (text) => {
                if (!text) return [];
                const upper = text.toUpperCase();
                // Extract OS notation variants
                const osMatch = upper.match(/OS[-\s]?(\d+(?:-\d+)?)/) || upper.match(/\b(\d+-\d+)\b/);
                const os = osMatch ? (osMatch[0].startsWith('OS') ? osMatch[0] : `OS-${osMatch[1] || osMatch[0]}`) : '';
                // Main name: before space or '('; fallback to first token
                let main = upper.split('(')[0].trim();
                main = main.split(/\s+/)[0] || main;

                // Character limits vary with area size
                const mainLimit = areaSize < 40 ? 5 : areaSize < 80 ? 7 : 9;
                const secondLimit = areaSize < 40 ? 5 : areaSize < 80 ? 7 : 9;

                const line1 = main.slice(0, mainLimit);
                let line2 = os ? os.slice(0, secondLimit) : '';
                if (!line2) {
                  // Use next token as fallback
                  const tokens = upper.split(/\s+/);
                  if (tokens.length > 1) line2 = tokens[1].slice(0, secondLimit);
                }

                return line2 ? [line1, line2] : [line1];
              };

              const displayAreaName = area.name || area.area_name || '';
              const finalLines = createTwoLineLabel(displayAreaName);

              // For extremely small areas, show only essential info or skip text entirely
              const isExtremelySmallForText = areaSize < 20;
              const shouldShowText = !isExtremelySmallForText || (isExtremelySmallForText && isZoomedIn);

              // Check if this area has active alerts
              const areaHasAlert = hasActiveAlert && hasActiveAlert(displayAreaName);
              if (areaHasAlert) {
                console.log('!!! AREA WITH ALERT FOUND !!!', displayAreaName);
              }

              // Calculate background dimensions with improved text accommodation
              const charWidth = fontSize * 0.5; // Conservative character width estimation
              const maxLineWidth = Math.max(...finalLines.map(line => line.length * charWidth));

              // Set background dimensions based on area size (simplified since we only show abbreviated text)
              const isExtremelySmallForBg = areaSize < 30;
              const isVerySmallArea = areaSize < 60;
              const isSmallArea = areaSize < 120;

              let backgroundWidth, backgroundHeight;

              if (isExtremelySmallForBg) {
                // Extremely small areas - compact background
                backgroundWidth = Math.min(maxLineWidth + (padding * 4), availableWidth * 0.9);
                backgroundHeight = Math.min(finalLines.length * lineHeight + (padding * 4), availableHeight * 0.9);
              } else if (isVerySmallArea) {
                // Very small areas - compact background
                backgroundWidth = Math.min(maxLineWidth + (padding * 6), availableWidth * 0.9);
                backgroundHeight = Math.min(finalLines.length * lineHeight + (padding * 4), availableHeight * 0.9);
              } else if (isSmallArea) {
                // Small areas - balanced approach
                backgroundWidth = Math.min(maxLineWidth + (padding * 8), availableWidth * 0.9);
                backgroundHeight = Math.min(finalLines.length * lineHeight + (padding * 6), availableHeight * 0.9);
              } else {
                // Normal areas - standard spacing
                backgroundWidth = Math.min(maxLineWidth + (padding * 6), availableWidth * 0.9);
                backgroundHeight = Math.min(finalLines.length * lineHeight + (padding * 6), availableHeight * 0.9);
              }

              return (
                <g key={index}>
                  {/* Define clipping path for this area */}
                  <defs>
                    <clipPath id={`clip-${index}`}>
                      <polygon points={points} />
                    </clipPath>
                  </defs>

                  {/* Base polygon with tooltip - scales with zoom */}
                  <polygon
                    points={points}
                    fill={getFill(area)}
                    stroke={'#000'}
                    strokeWidth={2}
                    vectorEffect="non-scaling-stroke"
                    onClick={() => handleAreaClick(area)}
                    style={{
                      cursor: 'pointer',
                      pointerEvents: 'auto'
                    }}
                  >
                    {/* Tooltip showing full area name on hover */}
                    <title>{displayAreaName}</title>
                  </polygon>
                  {center.x && center.y && displayAreaName && finalLines.length > 0 && shouldShowText && (
                    <>
                      {/* Multi-line text - consistent size, positioned within the area with strict clipping */}
                      <g
                        clipPath={`url(#clip-${index})`}
                      >
                        {/* White background rectangle for text */}
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
                          // Simple centered text positioning
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
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              {line}
                            </text>
                          );
                        })}
                      </g>
                    </>
                  )}

                  {/* Red alert icon overlay for areas with active alerts */}
                  <g
                    key={area.area_id || area.id || index}
                    onClick={() => handleAreaClick(area)}
                    style={{ cursor: "pointer" }}
                  >
                    {/*AREA POLYGON */}
                    <polygon
                      points={points}
                      fill={getFill(area)}
                      stroke="#000"
                      strokeWidth="1"
                      style={{ pointerEvents: "all" }} // important
                    />

                    {/* ALERT ICON */}
                    {hasActiveAlert(area.name || area.area_name) && center.x && center.y && (
                      <g
                        onClick={(e) => {
                          e.stopPropagation(); // prevents area click
                          console.log("ALERT CLICKED");
                          navigate("/dashboard/alerts");
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
                          r={12}
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
                      <polygon
                        points={points}
                        fill={'none'}
                        stroke={'#ff0000'}
                        strokeWidth={8}
                        vectorEffect="non-scaling-stroke"
                        strokeDasharray="10,5"
                        opacity={1.0}
                      />
                      {/* Additional inner highlight for better visibility */}
                      <polygon
                        points={points}
                        fill={'rgba(255, 0, 0, 0.15)'}
                        stroke={'#ff0000'}
                        strokeWidth={4}
                        vectorEffect="non-scaling-stroke"
                        opacity={0.8}
                      />
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </Box>
      </Box>
    </Box>
  );
}

export default HeatMap;

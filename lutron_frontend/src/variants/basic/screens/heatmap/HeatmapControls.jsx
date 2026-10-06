import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Button, FormControl, IconButton, InputBase,
  MenuItem, Paper, Select, useMediaQuery, useTheme
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear'; // Add this import
import { styled, darken } from '@mui/material/styles';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFloors, selectFloors } from "../../redux/slice/floor/floorSlice";
import {
  setSelectedFloorId,
  setDisplayMode,
  setHeatmapSearchTerm,
  refreshAllHeatmapData,
} from '../../redux/slice/settingsslice/heatmap/HeatmapSlice'
import GroupOccupancyModel from '../heatmap/GroupOccupancymodel'

import { UseAuth } from '../../customhooks/UseAuth';
import { dispatchFetchFloorsOnce } from '../../../../shared/utils/bootstrapFetchGuards';
import {
  handleRovingTablistKeyDown,
} from '../../../../utils/keyboard/rovingTablistKeyboard';
import {
  registerPageSubNavHandler,
  requestTopbarNavFocus,
} from '../../../../utils/keyboard/pageSubNavBridge';
import { isKeyboardNavBlockedTarget } from '../../../../utils/keyboard/keyboardNavUtils';

const HEATMAP_MODE_KEYS = ['Light', 'Occupancy', 'Energy'];


/** Match dashboard energy strip / Topbar ribbon */
const HEATMAP_RIBBON_BLUE = "#1E74C5";
const HEATMAP_RIBBON_TEXT_MUTED = "rgba(255, 255, 255, 0.66)";

/** Shared with HeatmapFooterActions — keep permission rules in one place */
export function heatmapCanModifyDeviceSettings(currentUserRole, selectedFloorId, userProfile) {
  if (currentUserRole === 'Superadmin' || currentUserRole === 'Admin') {
    return true;
  }
  if (currentUserRole === 'Operator' && selectedFloorId && userProfile && userProfile.floors) {
    const currentFloorPermission = userProfile.floors.find(f => f.floor_id === selectedFloorId);
    if (currentFloorPermission) {
      const permission = currentFloorPermission.floor_permission;
      return permission === 'monitor_control' || permission === 'monitor_control_edit';
    }
  }
  return false;
}

export function heatmapCanCreateAreaGroup(currentUserRole, selectedFloorId, userProfile) {
  if (currentUserRole === 'Superadmin' || currentUserRole === 'Admin') {
    return true;
  }
  if (currentUserRole === 'Operator' && selectedFloorId) {
    if (userProfile && userProfile.floors && Array.isArray(userProfile.floors)) {
      const currentFloorPermission = userProfile.floors.find(f => f.floor_id === selectedFloorId);
      if (currentFloorPermission) {
        return currentFloorPermission.floor_permission === 'monitor_control_edit';
      }
    }
    return false;
  }
  return false;
}

const ribbonSelectSx = {
  color: HEATMAP_RIBBON_TEXT_MUTED,
  fontWeight: 500,
  "&:before": {
    borderBottom: "1px solid rgba(255,255,255,0.28)",
  },
  "&:hover:not(.Mui-disabled):before": {
    borderBottom: "1px solid rgba(255,255,255,0.45) !important",
  },
  "&:after": {
    borderBottom: "2px solid rgba(255,255,255,0.45)",
  },
  "&.Mui-disabled": {
    color: "rgba(255,255,255,0.35)",
  },
  "& .MuiSelect-icon": {
    color: HEATMAP_RIBBON_TEXT_MUTED,
  },
};

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    // Start text right after the search icon
    paddingLeft: theme.spacing(0.5),
    paddingRight: `calc(1em + ${theme.spacing(4)})`, // Add right padding for clear icon
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      width: '15ch',
    },
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
    [theme.breakpoints.up('lg')]: {
      width: '25ch',
    },
  },
}));

const HeatmapControls = () => {
  const dispatch = useDispatch();
  const theme = useTheme();

  // Get current user role and permissions
  const { role: currentUserRole } = UseAuth();

  // Get user profile from Redux state
  const userProfile = useSelector(state => state.user.profile);

  // Responsive breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isLaptop = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const floors = useSelector(selectFloors);
  const floorStatus = useSelector((state) => state.floor.status);

  // const { selectedFloorId, displayMode = 'Light' } = useSelector(state => state.heatmap || {});
  const { selectedFloorId, displayMode = 'Light', searchTerm = "" } = useSelector(state => state.heatmap || {});
  const displayModeRef = useRef(displayMode);
  displayModeRef.current = displayMode;
  const [searchInput, setSearchInput] = useState(searchTerm); // local input
  // Shared sizing tokens to keep everything aligned in one row - matching Dashboard
  const CONTROL_HEIGHT = { xs: 28, sm: 30, md: 34, lg: 36 };
  const CONTROL_FONT = { xs: '12px', sm: '13px', md: '14px', lg: '14px' };
  const CONTROL_FONT_WEIGHT = 600;


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

  const availableFloors = useMemo(() => getAvailableFloors(), [floors, currentUserRole, userProfile]);

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


  useEffect(() => {
    dispatchFetchFloorsOnce(dispatch, fetchFloors, Boolean(floors?.length));
  }, [dispatch, floors?.length]);

  useEffect(() => {
    if (!displayMode) dispatch(setDisplayMode('Light'));
  }, [dispatch, displayMode]);

  useEffect(() => { setSearchInput(searchTerm); }, [searchTerm]); // keep input in sync

  // Note: Data fetching is now handled entirely by HeatMap.jsx useEffect
  // This component only manages the UI controls (floor selection, display mode buttons)

  const handleFloorChange = (event) => {
    const floorId = event.target.value;
    const floorName = floors.find(f => f.id === floorId)?.floor_name;

    // Check if user can access this floor
    if (!canAccessFloor(floorId)) {
      return;
    }

    dispatch(setSelectedFloorId(floorId));
  };

  const handleDisplayModeChange = (mode) => {
    displayModeRef.current = mode;
    dispatch(setDisplayMode(mode));
  };

  const handleDisplayModeChangeRef = useRef(handleDisplayModeChange);
  handleDisplayModeChangeRef.current = handleDisplayModeChange;

  useEffect(() => {
    return registerPageSubNavHandler('heatmap', ({ tabKey = 'Light' } = {}) => {
      const key = HEATMAP_MODE_KEYS.includes(tabKey) ? tabKey : 'Light';
      handleDisplayModeChangeRef.current(key);
    });
  }, [dispatch]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' && event.key !== 'ArrowUp') return;
      if (isKeyboardNavBlockedTarget(event.target)) return;
      if (event.target?.closest?.('.topbar-main-nav')) return;

      event.preventDefault();
      event.stopPropagation();

      if (event.key === 'ArrowUp') {
        requestTopbarNavFocus('Floor');
        return;
      }

      handleRovingTablistKeyDown(
        { ...event, currentTarget: null },
        {
          itemKeys: HEATMAP_MODE_KEYS,
          activeKey: displayModeRef.current,
          keyRefs: { current: {} },
          orientation: 'horizontal',
          onActivate: (mode) => handleDisplayModeChangeRef.current(mode),
        }
      );
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [dispatch]);

  const handleClearSearch = async () => {
    // Clear the search term
    dispatch(setHeatmapSearchTerm(''));

    // Note: No need to manually refresh data here
    // The HeatMap.jsx useEffect will handle data fetching automatically
  };

  const handleManualRefresh = () => {
    if (selectedFloorId && displayMode) {
      // Force refresh all heatmap data
      dispatch(refreshAllHeatmapData({
        floorId: selectedFloorId,
        areaId: null,
        displayMode,
      }));
    }
  };

  // Auto-select a floor on mount even when floors were already loaded elsewhere
  // (e.g. Dashboard → Floor). The old "floorsChanged" ref gate skipped that
  // case, left selectedFloorId null, and never triggered /floor/light_status.
  useEffect(() => {
    if (!availableFloors || availableFloors.length === 0) {
      if (selectedFloorId !== null && selectedFloorId !== undefined) {
        dispatch(setSelectedFloorId(null));
      }
      return;
    }

    if (selectedFloorId === null || selectedFloorId === undefined || selectedFloorId === "") {
      dispatch(setSelectedFloorId(availableFloors[0].id));
      return;
    }

    const hasSelected = availableFloors.some(f => String(f.id) === String(selectedFloorId));
    if (!hasSelected) {
      dispatch(setSelectedFloorId(availableFloors[0].id));
    }
  }, [availableFloors, selectedFloorId, dispatch]);

  useEffect(() => {
    return () => {
      dispatch(setHeatmapSearchTerm(''));
    };
  }, [dispatch]);

  // Memoize selectValue to prevent unnecessary re-renders and infinite loops
  // Always return a valid value that exists in availableFloors to prevent onEmpty errors
  const selectValue = useMemo(() => {
    if (!availableFloors || availableFloors.length === 0) {
      return "";
    }
    // If selectedFloorId is valid, use it; otherwise use first available floor
    const isValidSelection = availableFloors.some(f => String(f.id) === String(selectedFloorId));
    if (isValidSelection) {
      return selectedFloorId;
    }
    // If no valid selection, return first available floor (but don't dispatch here to avoid loop)
    return availableFloors[0]?.id || "";
  }, [availableFloors, selectedFloorId]);

  return (
    <>
      <Box
        sx={{
          bgcolor: HEATMAP_RIBBON_BLUE,
          /* Bleed to viewport edges — matches MainLayout horizontal `px` on parent */
          mx: { xs: -2, sm: -3, md: -4, lg: -5, xl: -6, xxl: -8, "3xl": -10, "4xl": -12 },
          px: { xs: 2, sm: 3, md: 4, lg: 5, xl: 6, xxl: 8, "3xl": 10, "4xl": 12 },
          py: { xs: 0.75, sm: 1 },
          mb: 1,
        }}
      >
      <Box sx={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 0,
        mt: 0,
        pt: 0,
        pb: 0,
        px: 0,
        gap: { xs: 0.3, sm: 0.5, md: 0.8 },
        flexWrap: 'nowrap',
        overflow: 'hidden',
        minHeight: { xs: 36, sm: 38, md: 40 },
      }}>
        <Box sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: { xs: 0.3, sm: 0.5, md: 0.8, lg: 3 },
          flex: '1 1 auto',
          minWidth: 0,
          overflow: 'hidden',
        }}>
          {/* Floor Selection — ribbon style (no white field; muted text like dashboard energy) */}
          <FormControl
            variant="standard"
            size="small"
            sx={{
              minWidth: { xs: 140, sm: 160, md: 180, lg: 260 },
              maxWidth: { xs: 150, sm: 170, md: 190, lg: 320 },
              flexShrink: 0,
            }}
          >
            <Select
              variant="standard"
              value={selectValue}
              onChange={handleFloorChange}
              displayEmpty
              disabled={floorStatus === 'loading'}
              sx={{
                ...ribbonSelectSx,
                fontSize: CONTROL_FONT,
                height: CONTROL_HEIGHT,
                "& .MuiSelect-select": {
                  display: "flex",
                  alignItems: "center",
                  py: 0.25,
                },
              }}
              MenuProps={{
                PaperProps: { sx: { maxHeight: 360, bgcolor: "#fff" } },
              }}
            >
              {availableFloors.map(f => (
                <MenuItem key={f.id} value={f.id}>{f.floor_name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Search */}
          <Paper
            component="form"
            onSubmit={(e) => e.preventDefault()}
            sx={{
              p: { xs: '1px 2px', sm: '2px 3px' },
              gap: { xs: 0.3, sm: 0.5, md: 0.8, lg: 3 },
              display: 'flex',
              alignItems: 'center',
              width: { xs: 110, sm: 130, md: 200, lg: 280 },
              backgroundColor: 'transparent',
              border: '1px solid rgba(255,255,255,0.28)',
              height: CONTROL_HEIGHT,
              borderRadius: '4px',
              flexShrink: 0,
              position: 'relative', // Add position relative for absolute positioning of clear icon
            }}
          >
            <IconButton
              size="small"
              sx={{
                p: { xs: '2px', sm: '4px', md: '6px' },
                color: HEATMAP_RIBBON_TEXT_MUTED,
              }}
            >
              <SearchIcon fontSize={isMobile ? 'small' : 'medium'} />
            </IconButton>
            <StyledInputBase
              placeholder="Search Area"
              value={searchTerm}
              onChange={(e) => dispatch(setHeatmapSearchTerm(e.target.value))}
              sx={{
                fontSize: CONTROL_FONT,
                fontWeight: CONTROL_FONT_WEIGHT,
                color: "#fff",
                "& input::placeholder": {
                  color: "rgba(255,255,255,0.66)",
                  opacity: 1,
                },
              }}
              // Disable search if operator doesn't have access to current floor
              disabled={currentUserRole === 'Operator' && selectedFloorId && !canAccessFloor(selectedFloorId)}
            />
            {/* Clear icon - only show when there's text */}
            {searchTerm && (
              <IconButton
                size="small"
                onClick={handleClearSearch}
                sx={{
                  p: { xs: '2px', sm: '4px', md: '6px' },
                  position: 'absolute',
                  right: 0,
                  color: HEATMAP_RIBBON_TEXT_MUTED,
                  '&:hover': {
                    color: '#fff',
                    backgroundColor: 'rgba(255,255,255,0.10)',
                  },
                }}
              >
                <ClearIcon fontSize={isMobile ? 'small' : 'medium'} />
              </IconButton>
            )}
          </Paper>
        </Box>

        {/* Light / Occupancy / Energy — right side of ribbon */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
            ml: 'auto',
            pl: { xs: 0.5, sm: 1 },
          }}
        >
          <FormControl
            variant="standard"
            size="small"
            sx={{
              minWidth: { xs: 118, sm: 132, md: 150, lg: 168 }, // fits "Occupancy"
              maxWidth: { xs: 140, sm: 160, md: 180, lg: 200 },
            }}
          >
            <Select
              variant="standard"
              value={displayMode}
              onChange={(e) => handleDisplayModeChange(e.target.value)}
              sx={{
                ...ribbonSelectSx,
                fontSize: CONTROL_FONT,
                height: CONTROL_HEIGHT,
                "& .MuiSelect-select": {
                  display: "flex",
                  alignItems: "center",
                  py: 0.25,
                },
              }}
              MenuProps={{
                PaperProps: { sx: { maxHeight: 280, bgcolor: "#fff" } },
              }}
            >
              <MenuItem value="Light">Light</MenuItem>
              <MenuItem value="Occupancy">Occupancy</MenuItem>
              <MenuItem value="Energy">Energy</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>
      </Box>
    </>
  );
};

const FOOTER_ACTION_BTN_HEIGHT = { xs: 30, sm: 32, md: 34, lg: 36 };
const FOOTER_ACTION_BTN_FONT = { xs: '12px', sm: '13px', md: '14px', lg: '14px' };

/** Bottom bar next to heatmap legend / floor arrows (Create Area Group, Occupancy Settings) */
export function HeatmapFooterActions() {
  const navigate = useNavigate();
  const [showOccupancyModal, setShowOccupancyModal] = useState(false);
  const { role: currentUserRole } = UseAuth();
  const userProfile = useSelector((state) => state.user.profile);
  const { selectedFloorId, displayMode = 'Light' } = useSelector((state) => state.heatmap || {});

  const showCreate =
    displayMode === 'Light' &&
    heatmapCanCreateAreaGroup(currentUserRole, selectedFloorId, userProfile);
  const showOccupancyBtn =
    displayMode === 'Occupancy' &&
    heatmapCanModifyDeviceSettings(currentUserRole, selectedFloorId, userProfile);

  return (
    <>
      {(showCreate || showOccupancyBtn) && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 1,
            flexShrink: 0,
            flexWrap: 'wrap',
            width: { xs: '100%', sm: 'auto' },
            ml: { xs: 0, sm: 'auto' },
            zIndex: 1,
          }}
        >
          {showCreate && (
            <Button
              size="small"
              variant="contained"
              disableElevation
              onClick={() => navigate('/create-area-model')}
              sx={{
                backgroundColor: HEATMAP_RIBBON_BLUE,
                color: '#fff',
                textTransform: 'none',
                borderRadius: '4px',
                fontSize: FOOTER_ACTION_BTN_FONT,
                fontWeight: 600,
                px: { xs: 1, sm: 1.25, md: 1.5 },
                py: { xs: 0.5, sm: 0.6 },
                minHeight: FOOTER_ACTION_BTN_HEIGHT,
                boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                '&:hover': {
                  backgroundColor: darken(HEATMAP_RIBBON_BLUE, 0.08),
                },
              }}
            >
              Create Area Group
            </Button>
          )}
          {showOccupancyBtn && (
            <Button
              size="small"
              variant="contained"
              disableElevation
              onClick={() => setShowOccupancyModal(true)}
              sx={{
                backgroundColor: HEATMAP_RIBBON_BLUE,
                color: '#fff',
                textTransform: 'none',
                borderRadius: '4px',
                fontSize: FOOTER_ACTION_BTN_FONT,
                fontWeight: 600,
                px: { xs: 1, sm: 1.25, md: 1.5 },
                py: { xs: 0.5, sm: 0.6 },
                minHeight: FOOTER_ACTION_BTN_HEIGHT,
                boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                '&:hover': {
                  backgroundColor: darken(HEATMAP_RIBBON_BLUE, 0.08),
                },
              }}
            >
              Occupancy Settings
            </Button>
          )}
        </Box>
      )}
      <GroupOccupancyModel
        open={showOccupancyModal}
        onClose={() => setShowOccupancyModal(false)}
        currentUserRole={currentUserRole}
      />
    </>
  );
}

export default HeatmapControls;


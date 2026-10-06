import React, { useEffect, useMemo, useState, useRef } from "react";
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
import { useNavigate } from "react-router-dom";
import GroupOccupancyModel from '../heatmap/GroupOccupancymodel'

import { UseAuth } from '../../customhooks/UseAuth'; // Add this import
import { useSlidingTabIndicator } from '../../hooks/useSlidingTabIndicator';

import { selectApplicationTheme } from "../../redux/slice/theme/themeSlice";
import { getThemeButtonColor } from '../../utils/themePageBackground';
import { dispatchFetchFloorsOnce } from '../../../../shared/utils/bootstrapFetchGuards';
import {
  getRovingTabIndex,
  handleRovingTablistKeyDown,
} from '../../utils/rovingTablistKeyboard';
import {
  registerPageSubNavHandler,
  requestTopbarNavFocus,
} from '../../utils/pageSubNavBridge';
import { isKeyboardNavBlockedTarget } from '../../utils/keyboardNavUtils';

const HEATMAP_MODE_KEYS = ['Light', 'Occupancy', 'Energy'];

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
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  const [showOccupancyModal, setShowOccupancyModal] = useState(false);

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
  const appTheme = useSelector(selectApplicationTheme);
  const contentColor = appTheme?.application_theme?.content || 'rgba(128, 120, 100, 0.7)';
  const buttonColor = getThemeButtonColor(appTheme?.application_theme?.button, appTheme?.application_theme?.background);
  const tabActiveTextColor = `var(--heatmap-tab-active-text, ${buttonColor})`;
  const tabInactiveTextColor = 'var(--heatmap-tab-inactive-text, #ffffff)';

  const { selectedFloorId, displayMode = 'Light', searchTerm = "" } = useSelector(state => state.heatmap || {});
  const [searchInput, setSearchInput] = useState(searchTerm); // local input

  // Refs and state for the sliding pill indicator on the display-mode tabs
  const tabsContainerRef = useRef(null);
  const tabRefs = useRef({});
  const displayModeRef = useRef(displayMode);
  const tabIndicator = useSlidingTabIndicator({
    activeKey: displayMode,
    tabRefs,
    containerRef: tabsContainerRef,
    enabled: true,
    layoutDeps: [isMobile, isTablet, isLaptop, isDesktop],
  });

  displayModeRef.current = displayMode;

  const handleDisplayModeChange = (mode) => {
    displayModeRef.current = mode;
    dispatch(setDisplayMode(mode));
  };

  const handleDisplayModeChangeRef = useRef(handleDisplayModeChange);
  handleDisplayModeChangeRef.current = handleDisplayModeChange;

  const handleDisplayModeTabKeyDown = (event) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      requestTopbarNavFocus('Floorplan');
      return;
    }

    handleRovingTablistKeyDown(event, {
      itemKeys: HEATMAP_MODE_KEYS,
      activeKey: displayModeRef.current,
      keyRefs: tabRefs,
      orientation: 'horizontal',
      onActivate: (mode) => handleDisplayModeChangeRef.current(mode),
    });
  };

  useEffect(() => {
    return registerPageSubNavHandler('heatmap', ({ tabKey = 'Light' } = {}) => {
      const key = HEATMAP_MODE_KEYS.includes(tabKey) ? tabKey : 'Light';
      handleDisplayModeChangeRef.current(key);
      requestAnimationFrame(() => {
        tabRefs.current[key]?.focus({ preventScroll: true });
      });
    });
  }, [dispatch]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' && event.key !== 'ArrowUp') return;
      if (isKeyboardNavBlockedTarget(event.target)) return;
      if (event.target?.closest?.('.topbar-main-nav')) return;
      if (event.target?.closest?.('.heatmap-mode-tab-btn')) return;

      event.preventDefault();
      event.stopPropagation();

      if (event.key === 'ArrowUp') {
        requestTopbarNavFocus('Floorplan');
        return;
      }

      handleRovingTablistKeyDown(
        { ...event, currentTarget: tabRefs.current[displayModeRef.current] },
        {
          itemKeys: HEATMAP_MODE_KEYS,
          activeKey: displayModeRef.current,
          keyRefs: tabRefs,
          orientation: 'horizontal',
          onActivate: (mode) => handleDisplayModeChangeRef.current(mode),
        }
      );
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [dispatch]);

  // Shared sizing tokens to keep everything aligned in one row - matching Dashboard
  const CONTROL_HEIGHT = { xs: 28, sm: 30, md: 34, lg: 36 };
  const CONTROL_FONT = { xs: '12px', sm: '13px', md: '14px', lg: '14px' };
  const CONTROL_FONT_WEIGHT = 600;


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

  // Function to check if user can create area groups
  const canCreateAreaGroup = () => {
    // Superadmin and Admin can always create area groups
    if (currentUserRole === 'Superadmin' || currentUserRole === 'Admin') {
      return true;
    }

    // For Operators, we need to check their floor permissions
    if (currentUserRole === 'Operator' && selectedFloorId) {
      if (userProfile && userProfile.floors && Array.isArray(userProfile.floors)) {
        // Find the current floor permission
        const currentFloorPermission = userProfile.floors.find(f => f.floor_id === selectedFloorId);

        if (currentFloorPermission) {
          // Check if permission is "monitor_control_edit" (Monitoring, edit and control)
          return currentFloorPermission.floor_permission === 'monitor_control_edit';
        }
      }

      // Fallback: If we can't determine floor permissions, 
      // assume the operator cannot create area groups for security
      return false;
    }

    // Default: Operators cannot create area groups
    return false;
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
  // (e.g. Dashboard → Floorplan). The old "floorsChanged" ref gate skipped that
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
      <Box sx={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 0,
        mt: 0,
        pt: 0,
        pb: '2px',
        px: { xs: 0.5, sm: 1, md: 0.5 },
        gap: { xs: 0.3, sm: 0.5, md: 0.8 },
        flexWrap: 'nowrap',
        overflow: { xs: 'visible', md: 'hidden' },
        minHeight: { xs: 36, sm: 38, md: 40 },
      }}>
        <Box sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: { xs: 0.3, sm: 0.5, md: 0.8, lg: 3 },
          flex: { xs: '1 1 100%', md: '1 1 auto' },
          minWidth: 0,
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
          overflow: { xs: 'visible', md: 'hidden' },
        }}>
          {/* Floor Selection */}
          <FormControl
            variant="outlined"
            size="small"
            sx={{
              minWidth: { xs: 140, sm: 160, md: 180, lg: 260 },
              maxWidth: { xs: 150, sm: 170, md: 190, lg: 320 },
              flexShrink: 0,
            }}
          >
            <Select
              value={selectValue}
              onChange={handleFloorChange}
              displayEmpty
              disabled={floorStatus === 'loading'}
              sx={{
                backgroundColor: '#fff',
                color: '#000',
                fontSize: CONTROL_FONT,
                fontWeight: CONTROL_FONT_WEIGHT,
                height: CONTROL_HEIGHT,
                borderRadius: '4px',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderRadius: '4px',
                },
              }}
              MenuProps={{
                PaperProps: {
                  className: 'heatmap-floor-select-menu',
                  sx: {
                    backgroundColor: 'var(--heatmap-select-menu-bg, #d6dde8)',
                    borderRadius: '10px',
                    mt: 0.5,
                    boxShadow: '0 10px 24px rgba(0,0,0,0.22)',
                    '& .MuiMenuItem-root': {
                      color: '#000',
                      fontSize: CONTROL_FONT,
                      minHeight: 34,
                      '&:hover': {
                        backgroundColor: 'var(--heatmap-select-menu-hover, rgba(61, 74, 92, 0.12))',
                      },
                      '&.Mui-selected': {
                        backgroundColor: 'var(--heatmap-select-menu-selected, rgba(61, 74, 92, 0.22))',
                      },
                      '&.Mui-selected:hover': {
                        backgroundColor: 'var(--heatmap-select-menu-selected-hover, rgba(61, 74, 92, 0.28))',
                      },
                    },
                  },
                },
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
              backgroundColor: 'white',
              height: CONTROL_HEIGHT,
              borderRadius: '4px',
              flexShrink: 0,
              position: 'relative', // Add position relative for absolute positioning of clear icon
            }}
          >
            <IconButton size="small" sx={{ p: { xs: '2px', sm: '4px', md: '6px' } }}>
              <SearchIcon fontSize={isMobile ? 'small' : 'medium'} />
            </IconButton>
            <StyledInputBase
              placeholder="Search Area"
              value={searchTerm}
              onChange={(e) => dispatch(setHeatmapSearchTerm(e.target.value))}
              sx={{
                fontSize: CONTROL_FONT,
                fontWeight: CONTROL_FONT_WEIGHT
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
                  color: '#666',
                  '&:hover': {
                    color: '#333',
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                <ClearIcon fontSize={isMobile ? 'small' : 'medium'} />
              </IconButton>
            )}
          </Paper>

          {/* Display Mode Buttons */}
          <Box
            ref={tabsContainerRef}
            className="heatmap-display-mode-tabs"
            role="tablist"
            aria-label="Floorplan display mode"
            sx={{
              background: 'var(--heatmap-tab-pill-bg, #3d4a5c)',
              borderRadius: '999px',
              p: '4px',
              display: 'inline-flex',
              flexDirection: 'row',
              gap: 0,
              alignItems: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
              flexShrink: 0,
              position: 'relative',
              maxWidth: '100%',
              flexWrap: { xs: 'wrap', sm: 'nowrap' },
            }}
          >
            {/* Sliding indicator pill - animates between active modes */}
            <Box
              aria-hidden="true"
              className="heatmap-tab-indicator"
              sx={{
                position: 'absolute',
                top: { xs: '2px', sm: '2px', md: '4px', lg: '4px' },
                bottom: { xs: '2px', sm: '2px', md: '4px', lg: '4px' },
                left: `${tabIndicator.left}px`,
                width: `${tabIndicator.width}px`,
                backgroundColor: 'var(--heatmap-tab-indicator-bg, #ffffff)',
                borderRadius: '999px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                transition: tabIndicator.ready
                  ? 'left 0.6s cubic-bezier(0.4, 0, 0.2, 1), width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                  : 'none',
                opacity: tabIndicator.ready ? 1 : 0,
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />
            {['Light', 'Occupancy', 'Energy'].map((mode) => {
              const isActive = displayMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  className={`heatmap-mode-tab-btn${isActive ? ' heatmap-mode-tab-btn--active' : ''}`}
                  role="tab"
                  aria-selected={isActive}
                  tabIndex={getRovingTabIndex(isActive)}
                  ref={(el) => { tabRefs.current[mode] = el; }}
                  onKeyDown={handleDisplayModeTabKeyDown}
                  onClick={() => handleDisplayModeChange(mode)}
                  style={{
                    border: 'none',
                    borderRadius: '999px',
                    backgroundColor: 'transparent',
                    color: isActive ? tabActiveTextColor : tabInactiveTextColor,
                    cursor: 'pointer',
                    fontWeight: CONTROL_FONT_WEIGHT,
                    fontSize: isDesktop ? '14px' : isLaptop ? '14px' : isTablet ? '13px' : '12px',
                    fontFamily: 'inherit',
                    lineHeight: 1.2,
                    minHeight: typeof CONTROL_HEIGHT === 'object' ? CONTROL_HEIGHT.md : 34,
                    minWidth: isDesktop ? 75 : isLaptop ? 65 : isTablet ? 40 : 32,
                    padding: isDesktop
                      ? '8px 24px'
                      : isLaptop
                        ? '8px 20px'
                        : isTablet
                          ? '6px 14px'
                          : '6px 10px',
                    textTransform: 'none',
                    boxShadow: 'none',
                    position: 'relative',
                    zIndex: 1,
                    transition: 'color 0.6s ease',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {mode}
                </button>
              );
            })}
          </Box>
        </Box>


        {/* Action Buttons */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          flexShrink: 0,
          ml: 'auto',
        }}>
          {displayMode === 'Light' && canCreateAreaGroup() && (
            <Button
              size="small"
              variant="contained"
              disableElevation
              onClick={() => navigate('/create-area-model')}
              sx={{
                backgroundColor: buttonColor,
                color: '#fff',
                textTransform: 'none',
                borderRadius: '4px',
                fontSize: CONTROL_FONT,
                fontWeight: CONTROL_FONT_WEIGHT,
                px: { xs: 0.8, sm: 1.1, md: 1.3, lg: 1.6 },
                py: { xs: 0.35, sm: 0.5, md: 0.6, lg: 0.7 },
                minWidth: { xs: 90, sm: 105, md: 115, lg: 125 },
                height: CONTROL_HEIGHT,
                '&:hover': {
                  backgroundColor: darken(buttonColor, 0.12),
                },
              }}
            >
              Create Area Group
            </Button>
          )}

          {displayMode === 'Occupancy' && canModifyDeviceSettings() && (
            <Button
              size="small"
              variant="contained"
              disableElevation
              onClick={() => setShowOccupancyModal(true)}
              sx={{
                backgroundColor: buttonColor,
                color: '#fff',
                textTransform: 'none',
                borderRadius: '4px',
                fontSize: CONTROL_FONT,
                fontWeight: CONTROL_FONT_WEIGHT,
                px: { xs: 0.8, sm: 1.1, md: 1.3, lg: 1.6 },
                py: { xs: 0.35, sm: 0.5, md: 0.6, lg: 0.7 },
                minWidth: { xs: 90, sm: 105, md: 115, lg: 125 },
                height: CONTROL_HEIGHT,
                '&:hover': { backgroundColor: darken(buttonColor, 0.12) }
              }}
            >
              Occupancy Settings
            </Button>
          )}
        </Box>
      </Box>

      {/* Occupancy Modal */}
      <GroupOccupancyModel
        open={showOccupancyModal}
        onClose={() => setShowOccupancyModal(false)}
        currentUserRole={currentUserRole}
      />
    </>
  );
};


export default HeatmapControls;

/** Named export used by HeatMap.jsx — placeholder to satisfy the import. */
export const HeatmapFooterActions = () => null;

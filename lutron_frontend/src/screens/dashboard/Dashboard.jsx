/**
 * Dashboard Component
 * 
 * Operator Floor Access:
 * - Floor filtering is handled automatically by the backend API
 * - The /floor/list endpoint uses require_operator_permission_for_scope
 * - Operators only see floors they have been assigned to
 * - No additional frontend filtering is required
 * - If an operator has no floors assigned, appropriate messages are shown
 * 
 * Default Data Display:
 * - All user roles (Superadmin, Admin, Operator) see project data by default
 * - Data is automatically fetched for all accessible areas without requiring user selection
 * - Users can still filter by specific floors/areas if desired
 * - Project data includes all areas the user has permission to access
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useDispatch, useSelector, shallowEqual, useStore } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Label
} from 'recharts'
import {
  setSelectedFloor,
  setSelectedAreas,
  setSelectedFloorIds,
  setSelectedGroups,
  setSelectedGroupIds,
  setSelectedDuration,
  setCustomDateRange,
  setCurrentDate,
  setCurrentYear,
  setGlobalLoading,
  setFilteredData,
  setIsNavigating,
  fetchTotalConsumptionByGroup,
  fetchLightPowerDensity,
  fetchOccupancyCount,
  fetchOccupancyByGroup,
  fetchSpaceUtilizationPerArea,
  // fetchPeakMinOccupancy, // Commented out - not using peak min max API for space utilization
  fetchInstantOccupancyCount,
  fetchOccupancyByGroupFromLogs,
  fetchSpaceUtilizationPerFromLogs,
  fetchSavingsByStrategy,
  downloadEnergyConsumption,
  downloadEnergySavings,
  downloadPeakMinConsumption,
  downloadTotalConsumptionByGroup,
  downloadOccupancyCount,
  downloadOccupancyByGroup,
  downloadSpaceUtilizationPer,
  // downloadPeakMinOccupancy, // Commented out - not using peak min max API for space utilization
  sendEnergyConsumptionEmail,
  sendEnergySavingsEmail,
  sendPeakMinConsumptionEmail,
  sendTotalConsumptionByGroupEmail,
  sendOccupancyCountEmail,
  sendOccupancyByGroupEmail,
  sendSpaceUtilizationPerEmail,
  // sendPeakMinOccupancyEmail, // Commented out - not using peak min max API for space utilization
  selectSelectedFloor,
  selectSelectedAreas,
  selectSelectedFloorIds,
  selectSelectedGroups,
  selectSelectedGroupIds,
  selectSelectedDuration,
  selectCustomDateRange,
  selectIsNavigating,
  selectGlobalLoading,
  selectCurrentDate,
  selectCurrentYear,
  selectFilteredData,
  selectTotalConsumptionByGroup,
  selectLightPowerDensity,
  selectOccupancyCount,
  selectOccupancyByGroup,
  selectInstantOccupancyCount,
  selectInstantOccupancyCountLoading,
  selectInstantOccupancyCountError,
  selectSavingsByStrategy,
  selectAreaGroups,
  selectDashboardStatus,
  selectDashboardLoading,
  selectDashboardError,
  selectEmailLoading,
  selectEmailError,
  selectEmailSuccess,
  clearDashboardData,
  clearDataCache
} from '../../redux/slice/dashboard/dashboardSlice'

import {
  fetchUnifiedEnergyConsumptionSavingsData,
  selectUnifiedEnergyConsumption,
  selectUnifiedEnergySavings,
  selectUnifiedPeakMinConsumption,
  selectUnifiedEnergyConsumptionLoading,
  selectUnifiedEnergySavingsLoading,
  selectUnifiedPeakMinConsumptionLoading
} from '../../redux/slice/dashboard/unifiedEnergySlice'
import { fetchFloors, getLeafByFloorID, selectFloors, selectAreaTree, selectFloorsLoading, selectAreaTreeLoading } from '../../redux/slice/floor/floorSlice'
import { getDashboardOverview, selectDashboardOverview, selectDashboardOverviewLoading, selectDashboardOverviewError } from '../../redux/slice/home/homeSlice'
import { selectProfile, selectProfileLoading, fetchProfile } from '../../redux/slice/auth/userlogin'
import SpaceUtilization from './SpaceUtilization'
import DashboardOverview from './DashboardOverview'

import { Grid, Box, useTheme, useMediaQuery, Snackbar, Alert, Typography, Button } from '@mui/material'; // Add useTheme and useMediaQuery
import { AddBoxOutlined, IndeterminateCheckBoxOutlined } from '@mui/icons-material';
import Alerts from './Alerts'
import {
  fetchAlertTypes,
  fetchActiveAlerts,
  selectAlertTypes,
  selectSelectedAlertType,
  setSelectedAlertType,
} from '../../redux/slice/dashboard/alertsSlice'
import { selectApplicationTheme } from '../../redux/slice/theme/themeSlice'
import { UseAuth } from '../../customhooks/UseAuth'
import { fetchEmailConfigs, getWidgetList } from '../../redux/slice/settingsslice/heatmap/groupOccupancySlice'
import {
  dispatchFetchAreaGroupsOnce,
  dispatchFetchWidgetTitlesOnce,
} from '../../utils/bootstrapFetchGuards'

const formatDateForState = (dateInput) => {
  if (!dateInput) {
    return '';
  }

  const date =
    dateInput instanceof Date
      ? new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate())
      : new Date(dateInput);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const MONTH_NAME_TO_INDEX = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

const parseDateFromState = (value) => {
  if (!value) {
    return new Date();
  }

  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    }

    const normalized = value.split('T')[0];
    const [year, month, day] = normalized.split('-').map(Number);
    if (year && month && day) {
      return new Date(year, month - 1, day);
    }
  }

  return new Date();
};

function Dashboard() {
  // Note: Floor filtering is handled automatically by the backend API
  // Operators will only see floors they have been assigned to
  // The /floor/list endpoint uses require_operator_permission_for_scope
  // to filter floors based on user permissions

  const dispatch = useDispatch()
  const store = useStore()
  const theme = useTheme()
  const isMediumScreen = useMediaQuery(theme.breakpoints.up('md'))
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'))
  const isXLargeScreen = useMediaQuery(theme.breakpoints.up('xl'))
  const is2XLargeScreen = useMediaQuery('(min-width: 1600px)')

  const chartHeaderStyle = useMemo(() => ({
    margin: 0,
    color: '#fff',
    fontWeight: 600,
    fontFamily: 'inherit',
    fontSize: isLargeScreen ? '18px' : '16px'
  }), [isLargeScreen])

  // User authentication
  const { user } = UseAuth()

  // Add CSS animation for spinner
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes pulse {
        0%, 100% { opacity: 0.4; }
        50% { opacity: 0.8; }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Chart Loader Component

  const alertTypes = useSelector(selectAlertTypes)
  const selectedAlertType = useSelector(selectSelectedAlertType)
  const widgetList = useSelector(getWidgetList)

  // Local state for multi-select dropdown
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedAlertTypes, setSelectedAlertTypes] = useState([])
  const [filterKey, setFilterKey] = useState(0) // Force re-render key
  const [reloadTrigger, setReloadTrigger] = useState(0) // Trigger for automatic reload on login
  const dropdownRef = useRef(null)
  const areaDropdownRef = useRef(null) // Add ref for area dropdown
  const areaTreeContainerRef = useRef(null) // Add ref for area tree container

  // Redux selectors
  const floors = useSelector((state) => state.floor.floors)
  const floorStatus = useSelector((state) => state.floor.status)
  const areaTree = useSelector((state) => state.floor.leafData)
  const floorLoading = useSelector((state) => state.floor.loading)

  const selectedFloor = useSelector(selectSelectedFloor)
  const selectedAreas = useSelector(selectSelectedAreas)
  const selectedFloorIds = useSelector(selectSelectedFloorIds) // Add this to get floor IDs from Redux
  const selectedGroups = useSelector(selectSelectedGroups)
  const selectedGroupIds = useSelector(selectSelectedGroupIds)

  // User profile for email functionality and floor filtering
  const userProfile = useSelector((state) => state.user?.profile)
  const profileLoading = useSelector((state) => state.user?.profileLoading)



  // State to track which floors have areas selected (for checkbox display)
  const [floorsWithSelectedAreas, setFloorsWithSelectedAreas] = useState(new Set())

  // State to track which specific floors are selected (for floor-level selection) - CHANGED TO ARRAY
  const [localSelectedFloorIds, setLocalSelectedFloorIds] = useState([]);

  // Local state to track selected areas before Set button is clicked
  const [localSelectedAreas, setLocalSelectedAreas] = useState([]);

  // Local state to track selected groups before Set button is clicked
  const [localSelectedGroups, setLocalSelectedGroups] = useState([]);

  // Separate state for floor expansion (independent of floor selection)
  const [expandedFloorId, setExpandedFloorId] = useState(null);

  // Fetch user profile on component mount
  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  // Set default behavior to show data for all areas
  useEffect(() => {
    if (floors.length > 0 && localSelectedFloorIds.length === 0 && selectedAreas.length === 0) {
      // Don't select any floor by default - show data for all areas
      // This will trigger the API calls with no specific areas selected
      // Backend will return data for all accessible areas
    }
  }, [floors, localSelectedFloorIds.length, selectedAreas.length, dispatch]);


  // Update floorsWithSelectedAreas when localSelectedFloorIds changes
  useEffect(() => {
    if (localSelectedFloorIds.length > 0) {
      setFloorsWithSelectedAreas(new Set(localSelectedFloorIds));
    } else {
      setFloorsWithSelectedAreas(new Set());
    }
  }, [localSelectedFloorIds]);
  const selectedDuration = useSelector(selectSelectedDuration)
  const customDateRange = useSelector(selectCustomDateRange)
  const isNavigating = useSelector(selectIsNavigating)
  const globalLoading = useSelector(selectGlobalLoading)
  const filteredData = useSelector(selectFilteredData)
  // Use shallowEqual to prevent re-renders when other Redux state changes
  const energyConsumption = useSelector(selectUnifiedEnergyConsumption, shallowEqual)
  const energySavings = useSelector(selectUnifiedEnergySavings, shallowEqual)
  const peakMinConsumption = useSelector(selectUnifiedPeakMinConsumption, shallowEqual)
  const energyConsumptionLoading = useSelector(selectUnifiedEnergyConsumptionLoading)
  const energySavingsLoading = useSelector(selectUnifiedEnergySavingsLoading)
  const peakMinConsumptionLoading = useSelector(selectUnifiedPeakMinConsumptionLoading)
  const totalConsumptionByGroup = useSelector(selectTotalConsumptionByGroup)
  const lightPowerDensity = useSelector(selectLightPowerDensity)
  const occupancyCount = useSelector(selectOccupancyCount)
  const instantOccupancyCount = useSelector(selectInstantOccupancyCount)
  const instantOccupancyCountLoading = useSelector(selectInstantOccupancyCountLoading)
  const instantOccupancyCountError = useSelector(selectInstantOccupancyCountError)
  const dashboardStatus = useSelector(selectDashboardStatus)
  const dashboardLoading = useSelector(selectDashboardLoading)
  const dashboardError = useSelector(selectDashboardError)

  const appTheme = useSelector(selectApplicationTheme);
  const backgroundColor = appTheme?.application_theme?.background || '#d2c4a2';
  const contentColor = appTheme?.application_theme?.content || 'rgba(128, 120, 100, 0.7)';
  const buttonColor = appTheme?.application_theme?.button || '#232323'

  const savingsByStrategy = useSelector(selectSavingsByStrategy)
  const areaGroups = useSelector(selectAreaGroups)


  // Navigation state selectors
  const currentDate = useSelector(selectCurrentDate)
  const currentYear = useSelector(selectCurrentYear)
  // Email state selectors
  const emailLoading = useSelector(selectEmailLoading)
  const emailError = useSelector(selectEmailError)
  const emailSuccess = useSelector(selectEmailSuccess)

  const overviewData = useSelector(selectDashboardOverview)
  const overviewLoading = useSelector(selectDashboardOverviewLoading)
  const overviewError = useSelector(selectDashboardOverviewError)
  const navigate = useNavigate()

  // Local state
  const [activeTab, setActiveTab] = useState('overview') // Default to "Overview" tab

  // Fetch and auto-refresh dashboard overview when Overview tab is active
  useEffect(() => {
    if (activeTab !== 'overview') return

    // Fetch immediately when Overview becomes active
    dispatch(getDashboardOverview())

    // Auto-refresh every 5 minutes while still on Overview
    const intervalId = setInterval(() => {
      dispatch(getDashboardOverview())
    }, 5 * 60 * 1000)

    // Cleanup when leaving Overview or unmounting Dashboard
    return () => clearInterval(intervalId)
  }, [activeTab, dispatch])

  // Close area tree and dropdown when tab changes
  useEffect(() => {
    if (expandedFloorId !== null) {
      setExpandedFloorId(null);
      setExpandedNodes(new Set());
    }
    if (showAreaDropdown) {
      setShowAreaDropdown(false);
    }
  }, [activeTab]);

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    return `${months[now.getMonth()]} ${now.getFullYear()}`
  })
  const [selectedMonthForData, setSelectedMonthForData] = useState(() => {
    const now = new Date()
    return {
      year: now.getFullYear(),
      month: now.getMonth()
    }
  })
  const [showDurationDropdown, setShowDurationDropdown] = useState(false)
  const [showAreaDropdown, setShowAreaDropdown] = useState(false)
  const [expandedNodes, setExpandedNodes] = useState(new Set())

  // Close area tree when clicking outside (including tabs and anywhere else)
  useEffect(() => {
    const handleClickOutside = (event) => {
      // If area tree is open, check if click is outside
      if (expandedFloorId !== null) {
        // Check if click is inside the entire area dropdown
        const isInsideDropdown = areaDropdownRef.current && areaDropdownRef.current.contains(event.target);

        // If click is completely outside the dropdown, close everything immediately
        if (!isInsideDropdown) {
          setExpandedFloorId(null);
          setExpandedNodes(new Set());
          if (showAreaDropdown) {
            setShowAreaDropdown(false);
          }
          return;
        }

        // If click is inside dropdown, don't close - let the user interact with the tree
        // Only close when clicking outside the dropdown
      }
    };

    // Add event listener when area tree is open
    if (expandedFloorId !== null) {
      // Use setTimeout to avoid immediate closure when opening the tree
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [expandedFloorId, showAreaDropdown]);

  const [showExportDropdown, setShowExportDropdown] = useState({}) // Track export dropdown state for each chart
  const [lightingUnit, setLightingUnit] = useState('Watt / Sq ft') // Add this for lighting power density unit
  const [allAreasLoaded, setAllAreasLoaded] = useState(false) // Track if all areas have been loaded
  const isInitialLoad = useRef(true) // Track if this is the initial load
  const [exportLoading, setExportLoading] = useState({}) // Track loading state for each export operation

  // Unified loading state - show single loader during navigation
  const [isDataLoading, setIsDataLoading] = useState(false)

  // Track when we're switching tabs to clear old data - removed to prevent flickering

  // Force refresh state for Set button - removed to prevent flickering

  // Chart loading states - track individual chart loading (for internal use)
  const [chartLoading, setChartLoading] = useState({
    energyConsumption: false,
    energySavings: false,
    peakMinConsumption: false,
    totalConsumptionByGroup: false,
    lightPowerDensity: false,
    occupancyCount: false,
    occupancyByGroup: false,
    spaceUtilizationPerArea: false,
    // peakMinOccupancy: false, // Commented out - not using peak min max API for space utilization
    instantOccupancyCount: false,
    savingsByStrategy: false
  })

  // Snackbar state for email notifications
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState('success')

  // Email dialog state - removed as emails are now sent directly to logged-in user

  // Snackbar handlers
  const handleSnackbarClose = () => {
    setSnackbarOpen(false)
  }

  const showSnackbar = (message, severity = 'success') => {
    setSnackbarMessage(message)
    setSnackbarSeverity(severity)
    setSnackbarOpen(true)
  }

  // Chart Loader Component
  const ChartLoader = ({ height = "300px", message = "Loading chart data..." }) => (
    <div style={{
      height: height,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid #ddd',
      borderRadius: '4px',
      backgroundColor: '#767061',
      color: '#fff',
      fontSize: '14px'
    }}>
      <div
        style={{
          width: '40px',
          height: '40px',
          border: '3px solid #555',
          borderTop: '3px solid #fff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '12px'
        }}
      />
      {message}
    </div>
  )

  // Email dialog handlers - removed as emails are now sent directly to logged-in user

  // Fetch alert options/data when Alerts tab is active
  useEffect(() => {
    if (activeTab === 'alerts') {
      dispatch(fetchAlertTypes())
      // Note: fetchActiveAlerts is handled by the Alerts component itself
    }
  }, [activeTab, dispatch])

  // Fetch rename widgets when Dashboard mounts (once-guarded)
  useEffect(() => {
    dispatchFetchWidgetTitlesOnce(dispatch, store.getState)
  }, [dispatch, store])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    // Use capture phase to catch clicks before stopPropagation
    document.addEventListener('click', handleClickOutside, true)
    return () => document.removeEventListener('click', handleClickOutside, true)
  }, [])

  // Close area dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only handle if dropdown is open
      if (showAreaDropdown && areaDropdownRef.current && !areaDropdownRef.current.contains(event.target)) {
        // Close dropdown and expanded tree when clicking outside
        setShowAreaDropdown(false);
        if (expandedFloorId !== null) {
          setExpandedFloorId(null);
          setExpandedNodes(new Set());
        }
      }
    }
    // Use passive listener to prevent flickering
    document.addEventListener('click', handleClickOutside, { passive: true })
    return () => document.removeEventListener('click', handleClickOutside)
  }, [expandedFloorId, showAreaDropdown])

  const handleTypeToggle = (type) => {
    setSelectedAlertTypes(prev => {
      const newSelection = prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type];
      return newSelection;
    });
    // Force immediate re-render
    setFilterKey(prev => prev + 1);

    // Close and reopen dropdown to update the display
    setShowDropdown(false);
    setTimeout(() => {
      setShowDropdown(true);
    }, 100);
  }
  // Fetch floors on component mount
  // Note: The backend automatically filters floors based on user permissions
  // Operators will only receive floors they have access to
  useEffect(() => {
    // if (floors.length === 0 && floorStatus !== 'loading') {
    dispatch(fetchFloors())
    // }
  }, [dispatch])

  // Clear dashboard data and set default duration when component mounts
  // This ensures each user starts with a clean state
  useEffect(() => {
    // Clear any existing dashboard data from previous user
    dispatch(clearDashboardData())

    // Set default duration to 'this-day' for new users
    dispatch(setSelectedDuration('this-day'))
  }, [dispatch]) // Remove selectedDuration from dependencies to prevent infinite loop

  // Get current user role for floor filtering
  const { role: currentUserRole } = UseAuth()
  const isOperator = currentUserRole === 'Operator'

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



  // Set default duration if none is selected
  useEffect(() => {
    if (!selectedDuration) {
      dispatch(setSelectedDuration('this-day'))
    }
  }, [selectedDuration, dispatch])

  // Use a ref to track previous floors/userProfile to detect actual changes
  const prevFloorsRef = useRef(null);
  const prevUserProfileRef = useRef(null);

  // Track if we've done the initial reload on login
  const hasInitialReloadRef = useRef(false);

  // Load all areas from all floors when floors are loaded
  useEffect(() => {
    // Only run if floors or userProfile actually changed (not just reference)
    const floorsChanged = prevFloorsRef.current !== floors;
    const profileChanged = prevUserProfileRef.current !== userProfile;

    // Skip if nothing changed (but allow first run)
    if (prevFloorsRef.current !== null && !floorsChanged && !profileChanged) {
      return; // Don't do anything if nothing actually changed
    }

    // Update refs
    prevFloorsRef.current = floors;
    prevUserProfileRef.current = userProfile;

    const availableFloors = getAvailableFloors();
    if (availableFloors.length > 0 && !allAreasLoaded && selectedAreas.length === 0) {
      loadAllAreasFromAllFloors()
    } else if (!allAreasLoaded) {
      // No floors yet, floors empty, or areas already selected — never block dashboard APIs
      setAllAreasLoaded(true)
    }
  }, [floors, userProfile, allAreasLoaded, selectedAreas.length])

  // Helper function to filter chart data for this_week to show only "0" hour points
  const filterWeeklyChartData = (chartData, xAxisLabels) => {
    if (selectedDuration !== 'this-week') {
      return { filteredData: chartData, filteredLabels: xAxisLabels };
    }

    // Filter to show only "0" hour points (Sun 0, Mon 0, Tue 0, etc.)
    const filteredLabels = xAxisLabels.filter(label => label.endsWith(' 0'));
    const filteredData = chartData.map(series => {
      const filteredValues = [];
      xAxisLabels.forEach((label, index) => {
        if (label.endsWith(' 0')) {
          filteredValues.push(series[index]);
        }
      });
      return filteredValues;
    });

    return { filteredData, filteredLabels };
  };

  // Function to load all areas from all floors (only accessible floors for operators)
  const loadAllAreasFromAllFloors = async () => {
    try {
      // Prevent multiple calls
      if (allAreasLoaded) {
        return
      }

      // For operators, this will only include floors they have access to

      // Check if areas are already selected
      if (selectedAreas.length > 0) {
        setAllAreasLoaded(true)
        return
      }

      const allAreaIds = []

      // Fetch area tree for each floor and collect all area IDs
      // Only fetch areas from floors the user has access to
      for (const floor of getAvailableFloors()) {
        const result = await dispatch(getLeafByFloorID(floor.id))

        if (result.payload && (result.payload.tree || result.payload.areas)) {
          const areas = flattenAreaTree(result.payload)
          areas.forEach(area => {
            if (!allAreaIds.includes(area.id)) {
              allAreaIds.push(area.id)
            }
          })
        }
      }

      // Don't select areas by default - wait for user to click Set button
    } catch (error) {
      console.warn('[Dashboard] loadAllAreasFromAllFloors failed:', error);
    } finally {
      // Always unblock dashboard APIs, even if leaf fetches fail
      setAllAreasLoaded(true)
    }
  }



  // Handle floor name click - just expand/collapse without affecting checkbox
  const handleFloorChange = async (floorId) => {
    const floor = getAvailableFloors().find(f => f.id === parseInt(floorId))

    if (floor) {
      // If same floor is clicked, toggle expansion
      if (expandedFloorId === floor.id) {
        // Already expanded, collapse it
        setExpandedFloorId(null);
        setExpandedNodes(new Set());
      } else {
        // Different floor - just expand it (don't affect checkbox or selection)
        try {
          const result = await dispatch(getLeafByFloorID(floor.id))
          setExpandedFloorId(floor.id);
          const nodeId = `floor-${floor.id}`
          setExpandedNodes(new Set([nodeId]))

          // Don't select any areas automatically - just show the tree
        } catch (error) {
          // Error fetching floor areas
        }
      }
    }
  }

  // Floor checkbox click handler - selects multiple floors and their areas
  const handleFloorCheckboxClick = async (floorId, event) => {
    event.stopPropagation() // Prevent floor selection

    // Add debounce to prevent multiple rapid API calls
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    const floor = floors.find(f => f.id === parseInt(floorId))

    if (floor) {
      // Check if this floor is currently selected
      const isThisFloorSelected = localSelectedFloorIds.includes(floor.id);

      if (isThisFloorSelected) {
        // If this floor is selected, remove it from selection
        const newSelectedFloorIds = localSelectedFloorIds.filter(id => id !== floor.id);
        setLocalSelectedFloorIds(newSelectedFloorIds);
        setFloorsWithSelectedAreas(new Set(newSelectedFloorIds));

        // Don't update Redux state immediately - only update when Set button is clicked
        // dispatch(setSelectedFloorIds(newSelectedFloorIds));

        // Also remove areas from this floor, but only if they don't belong to other selected floors
        // Get all area IDs that belong to this specific floor
        const floorAreaIds = getAreasForFloor(floorId);

        // Check which areas belong to other selected floors
        const otherSelectedFloorIds = newSelectedFloorIds; // This is the updated floor list (without the deselected floor)
        const areasFromOtherFloors = new Set();

        // Get areas from all other selected floors
        for (const otherFloorId of otherSelectedFloorIds) {
          const otherFloorAreaIds = getAreasForFloor(otherFloorId);
          otherFloorAreaIds.forEach(id => areasFromOtherFloors.add(id));
        }

        // Only remove areas that belong to this floor AND don't belong to other selected floors
        const newSelectedAreas = localSelectedAreas.filter(id => {
          const belongsToThisFloor = floorAreaIds.includes(id);
          const belongsToOtherFloors = areasFromOtherFloors.has(id);

          // Keep the area if it doesn't belong to this floor, OR if it belongs to other floors
          return !belongsToThisFloor || belongsToOtherFloors;
        });

        setLocalSelectedAreas(newSelectedAreas);
      } else {
        // If this floor is not selected, add it to selection
        const newSelectedFloorIds = [...localSelectedFloorIds, floor.id];
        setLocalSelectedFloorIds(newSelectedFloorIds);
        setFloorsWithSelectedAreas(new Set(newSelectedFloorIds));

        // Don't update Redux state immediately - only update when Set button is clicked
        // dispatch(setSelectedFloorIds(newSelectedFloorIds));

        // Also expand the floor to show areas
        setExpandedFloorId(floor.id);
        const nodeId = `floor-${floor.id}`
        setExpandedNodes(new Set([nodeId]))

        // CORRECTED: Auto-select all areas when floor is selected
        // This provides the expected hierarchical selection behavior
        try {
          const result = await dispatch(getLeafByFloorID(floor.id));

          if (result.payload && (result.payload.tree || result.payload.areas)) {
            // Auto-add all areas from this floor to show them as selected
            const floorAreaIds = getAllAreaIdsFromFloor(result.payload);
            if (floorAreaIds.length > 0) {
              const newSelectedAreas = [...localSelectedAreas, ...floorAreaIds];
              setLocalSelectedAreas(newSelectedAreas);
            } else {
              // Fallback: get areas from current area tree
              const fallbackAreaIds = getAreasForFloor(floorId);
              if (fallbackAreaIds.length > 0) {
                const newSelectedAreas = [...localSelectedAreas, ...fallbackAreaIds];
                setLocalSelectedAreas(newSelectedAreas);
              }
            }
          } else {
            // Fallback: get areas from current area tree
            const fallbackAreaIds = getAreasForFloor(floorId);
            if (fallbackAreaIds.length > 0) {
              const newSelectedAreas = [...localSelectedAreas, ...fallbackAreaIds];
              setLocalSelectedAreas(newSelectedAreas);
            }
          }
        } catch (error) {
          // Fallback: get areas from current area tree
          const floorAreaIds = getAreasForFloor(floorId);
          if (floorAreaIds.length > 0) {
            const newSelectedAreas = [...localSelectedAreas, ...floorAreaIds];
            setLocalSelectedAreas(newSelectedAreas);
          }
        }
      }
    }
  }


  // Helper function to get all area IDs for a specific floor
  const getAreasForFloor = (floorId) => {
    const allAreaIds = [];

    // If we have area tree data, get all areas from it
    // Since the area tree is loaded for a specific floor, all areas in it belong to that floor
    if (areaTree && (areaTree.tree || areaTree.areas)) {
      const traverseNode = (node) => {
        // Get all area IDs from this node
        if (node.area_id) {
          allAreaIds.push(node.area_id);
        }

        // Recursively check children
        if (node.children && node.children.length > 0) {
          node.children.forEach(traverseNode);
        }

        if (node.areas && node.areas.length > 0) {
          node.areas.forEach(traverseNode);
        }
      };

      if (areaTree.tree) {
        areaTree.tree.forEach(traverseNode);
      } else if (areaTree.areas) {
        areaTree.areas.forEach(traverseNode);
      }
    }

    return allAreaIds;
  };

  // Add helper function to get only direct child area IDs from a floor
  const getDirectChildAreaIdsFromFloor = (floorData) => {
    const directChildAreaIds = []

    const traverseDirectChildren = (node) => {
      // Only get direct children that have area_id (leaf nodes)
      if (node.children && node.children.length > 0) {
        node.children.forEach(child => {
          if (child.area_id) {
            directChildAreaIds.push(child.area_id)
          }
        })
      }

      if (node.areas && node.areas.length > 0) {
        node.areas.forEach(area => {
          if (area.area_id) {
            directChildAreaIds.push(area.area_id)
          }
        })
      }
    }

    if (floorData.tree) {
      floorData.tree.forEach(traverseDirectChildren)
    } else if (floorData.areas) {
      floorData.areas.forEach(traverseDirectChildren)
    }

    // Remove area limit to allow selecting all areas
    // if (directChildAreaIds.length > 20) {
    //   return directChildAreaIds.slice(0, 15)
    // }

    return directChildAreaIds
  }

  // Auto-expand area tree when it's loaded
  useEffect(() => {
    if (areaTree && (areaTree.tree || areaTree.areas) && selectedFloor) {
      // Area tree loaded for floor
    }
  }, [areaTree, selectedFloor])

  // Fetch area groups on component mount (once-guarded)
  useEffect(() => {
    dispatchFetchAreaGroupsOnce(dispatch, store.getState)
  }, [dispatch, store])

  // Handle area selection
  const handleAreaChange = (areaIds) => {
    // Filter out any invalid or duplicate area IDs
    const validAreaIds = areaIds.filter(id => id && typeof id === 'number');

    // Don't update Redux state immediately - wait for Set button
    // Prevent selecting too many areas
    // if (validAreaIds.length > 20) {
    //   const limitedAreaIds = validAreaIds.slice(0, 15)
    //   dispatch(setSelectedAreas(limitedAreaIds));
    // } else {
    // dispatch(setSelectedAreas(validAreaIds));
    // }
    // Don't close the dropdown immediately to allow multiple selections
    // setShowAreaDropdown(false);
  }

  // Add the missing handleToggleNode function
  const handleToggleNode = (nodeId) => {
    setExpandedNodes(prev => {
      if (prev.has(nodeId)) {
        const newSet = new Set(prev);
        newSet.delete(nodeId);
        return newSet;
      } else {
        return new Set([...prev, nodeId]);
      }
    });
  };

  // Function to check if any children of a node are selected
  const checkIfChildrenSelected = (node) => {
    if (!node) return false;

    // Check direct children
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        // If child is an area and is selected
        if (child.area_id && localSelectedAreas.includes(child.area_id)) {
          return true;
        }
        // If child is a floor and is selected
        if (child.floor_id && localSelectedFloorIds.includes(child.floor_id)) {
          return true;
        }
        // If child is a group and is selected
        if (child.group_id && localSelectedGroups.includes(child.group_id)) {
          return true;
        }
        // Recursively check grandchildren
        if (checkIfChildrenSelected(child)) {
          return true;
        }
      }
    }

    // Check areas array
    if (node.areas && node.areas.length > 0) {
      for (const area of node.areas) {
        if (area.area_id && localSelectedAreas.includes(area.area_id)) {
          return true;
        }
        // Recursively check area children
        if (checkIfChildrenSelected(area)) {
          return true;
        }
      }
    }

    return false;
  };

  // Function to check if all children of a node are selected
  const checkIfAllChildrenSelected = (node) => {
    if (!node) return false;

    let totalChildren = 0;
    let selectedChildren = 0;

    // Check direct children
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        totalChildren++;
        // If child is an area and is selected
        if (child.area_id && localSelectedAreas.includes(child.area_id)) {
          selectedChildren++;
        }
        // If child is a floor and is selected
        else if (child.floor_id && localSelectedFloorIds.includes(child.floor_id)) {
          selectedChildren++;
        }
        // If child is a group and is selected
        else if (child.group_id && localSelectedGroups.includes(child.group_id)) {
          selectedChildren++;
        }
        // If child has children, check if all its children are selected
        else if (checkIfAllChildrenSelected(child)) {
          selectedChildren++;
        }
      }
    }

    // Check areas array
    if (node.areas && node.areas.length > 0) {
      for (const area of node.areas) {
        totalChildren++;
        if (area.area_id && localSelectedAreas.includes(area.area_id)) {
          selectedChildren++;
        }
        // If area has children, check if all its children are selected
        else if (checkIfAllChildrenSelected(area)) {
          selectedChildren++;
        }
      }
    }

    return totalChildren > 0 && selectedChildren === totalChildren;
  };

  // Render tree node function with comprehensive selection options
  const renderTreeNode = (node, level = 0) => {
    // Use a more stable ID generation
    const nodeId = `node-${node.id || node.area_id || node.name || 'unknown'}`;
    const isExpanded = expandedNodes.has(nodeId);
    const hasChildren = (node.children && node.children.length > 0) || (node.areas && node.areas.length > 0);

    // Check if this node is selected (for areas, floors, or groups)
    const isAreaSelected = node.area_id && localSelectedAreas.includes(node.area_id);
    const isFloorSelected = node.floor_id && localSelectedFloorIds.includes(node.floor_id);
    const isGroupSelected = node.group_id && localSelectedGroups.includes(node.group_id);

    // Check if any children are selected (for parent nodes)
    const hasSelectedChildren = hasChildren && checkIfChildrenSelected(node);

    // Check if all children are selected (for complete selection)
    const allChildrenSelected = hasChildren && checkIfAllChildrenSelected(node);

    const isSelected = isAreaSelected || isFloorSelected || isGroupSelected || allChildrenSelected;
    const isIndeterminate = hasSelectedChildren && !allChildrenSelected;

    // Determine if this is a floor, area, group, or intermediate parent node
    const isFloorNode = node.floor_id && !node.area_id;
    const isAreaNode = node.area_id;
    const isGroupNode = node.group_id && !node.area_id && !node.floor_id;
    const isIntermediateParent = hasChildren && !isFloorNode && !isAreaNode && !isGroupNode;

    return (
      <div key={nodeId} style={{ marginLeft: `${level * 20}px` }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '4px 0',
          whiteSpace: 'nowrap',
          minWidth: 'fit-content'
        }}>
          {/* Universal checkbox for all node types */}
          <input
            type="checkbox"
            checked={isSelected}
            ref={(el) => {
              if (el) {
                el.indeterminate = isIndeterminate;
              }
            }}
            onChange={(e) => {
              e.stopPropagation();
              if (isAreaNode) {
                handleAreaCheckboxChange(node.area_id, node.name, node);
              } else if (isFloorNode) {
                handleFloorCheckboxClick(node.floor_id, e);
              } else if (isGroupNode) {
                handleGroupCheckboxChange(node.group_id, node.name, node);
              } else if (isIntermediateParent) {
                handleIntermediateParentCheckboxChange(node, e);
              }
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
            style={{
              marginRight: '8px',
              cursor: 'pointer',
              pointerEvents: 'auto'
            }}
          />

          {/* Node name - clickable for expansion */}
          <span
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren) {
                handleToggleNode(nodeId);
              }
            }}
            style={{
              fontSize: '13px',
              color: '#333',
              cursor: hasChildren ? 'pointer' : 'default',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: node.name && node.name.length > 40 ? '40ch' : '500px',
              padding: hasChildren ? '2px 4px' : '2px 0',
              borderRadius: hasChildren ? '2px' : '0',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (hasChildren) {
                e.target.style.backgroundColor = '#f5f5f5';
              }
            }}
            onMouseLeave={(e) => {
              if (hasChildren) {
                e.target.style.backgroundColor = 'transparent';
              }
            }}
            title={node.name}
          >
            {hasChildren && (
              <span style={{ marginRight: '4px', fontSize: '12px' }}>
                {isExpanded ? '▼' : '▶'}
              </span>
            )}
            {node.name}
          </span>
        </div>

        {/* Render children if expanded */}
        {isExpanded && hasChildren && (
          <div>
            {node.children && node.children.map(child => renderTreeNode(child, level + 1))}
            {node.areas && node.areas.map(area => renderTreeNode(area, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Update the handleAreaCheckboxChange function for individual area selection
  const handleAreaCheckboxChange = (areaId, areaName, node) => {
    // Add debounce to prevent multiple rapid API calls
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    let newSelection = [...localSelectedAreas];

    if (localSelectedAreas.includes(areaId)) {
      // Remove the area if it's already selected
      newSelection = localSelectedAreas.filter(id => id !== areaId);

      // If this area has children, also remove all its descendants
      if (node.children && node.children.length > 0) {
        const childIds = getAllChildAreaIds(node);
        newSelection = newSelection.filter(id => !childIds.includes(id));
      }
      if (node.areas && node.areas.length > 0) {
        const childIds = getAllChildAreaIds(node);
        newSelection = newSelection.filter(id => !childIds.includes(id));
      }
    } else {
      // Add the area if it's not selected
      newSelection.push(areaId);

      // If this area has children, also add all its descendants
      if (node.children && node.children.length > 0) {
        const childIds = getAllChildAreaIds(node);
        childIds.forEach(childId => {
          if (!newSelection.includes(childId)) {
            newSelection.push(childId);
          }
        });
      }
      if (node.areas && node.areas.length > 0) {
        const childIds = getAllChildAreaIds(node);
        childIds.forEach(childId => {
          if (!newSelection.includes(childId)) {
            newSelection.push(childId);
          }
        });
      }
    }

    // Update local state only - don't update Redux until Set button is clicked
    setLocalSelectedAreas(newSelection);

    // Clear floor selection when individual areas are selected
    if (newSelection.length > 0) {
      setLocalSelectedFloorIds([]);
      setFloorsWithSelectedAreas(new Set());
    }
  };

  // Handle group checkbox change for group selection
  const handleGroupCheckboxChange = (groupId, groupName, node) => {
    // Add debounce to prevent multiple rapid API calls
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    let newGroupSelection = [...localSelectedGroups];
    let newAreaSelection = [...localSelectedAreas];

    if (localSelectedGroups.includes(groupId)) {
      // Remove the group if it's already selected
      newGroupSelection = localSelectedGroups.filter(id => id !== groupId);

      // Also remove all areas in this group across all floors
      const childIds = getAllAreasFromGroup(groupId);
      newAreaSelection = newAreaSelection.filter(id => !childIds.includes(id));
    } else {
      // Add the group if it's not selected
      newGroupSelection.push(groupId);

      // Also add all areas in this group across all floors
      const childIds = getAllAreasFromGroup(groupId);
      childIds.forEach(childId => {
        if (!newAreaSelection.includes(childId)) {
          newAreaSelection.push(childId);
        }
      });
    }

    // Update local state only - don't update Redux until Set button is clicked
    setLocalSelectedGroups(newGroupSelection);
    setLocalSelectedAreas(newAreaSelection);

    // Clear floor selection when groups are selected
    if (newGroupSelection.length > 0) {
      setLocalSelectedFloorIds([]);
      setFloorsWithSelectedAreas(new Set());
    }
  };

  // Handle intermediate parent checkbox change - select all descendant leaf nodes
  const handleIntermediateParentCheckboxChange = (node, event) => {
    // Add debounce to prevent multiple rapid API calls
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Get all descendant leaf area IDs from this intermediate parent
    const allDescendantAreaIds = getAllChildAreaIds(node);

    let newAreaSelection = [...localSelectedAreas];

    // Check if this intermediate parent is currently "selected" (all its descendants are selected)
    const allDescendantsSelected = allDescendantAreaIds.every(id => localSelectedAreas.includes(id));

    if (allDescendantsSelected) {
      // Deselect: Remove all descendant areas
      newAreaSelection = newAreaSelection.filter(id => !allDescendantAreaIds.includes(id));
    } else {
      // Select: Add all descendant areas
      allDescendantAreaIds.forEach(areaId => {
        if (!newAreaSelection.includes(areaId)) {
          newAreaSelection.push(areaId);
        }
      });
    }

    // Update local state only - don't update Redux until Set button is clicked
    setLocalSelectedAreas(newAreaSelection);

    // Clear floor selection when intermediate parent areas are selected
    if (newAreaSelection.length > 0) {
      setLocalSelectedFloorIds([]);
      setFloorsWithSelectedAreas(new Set());
    }
  };

  // Update the getAllChildAreaIds function to properly traverse the tree
  const getAllChildAreaIds = (node) => {
    let childIds = [];

    // Check if node has direct children
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        if (child.area_id) {
          childIds.push(child.area_id);
        }
        // Recursively get children of children
        const grandChildIds = getAllChildAreaIds(child);
        childIds = [...childIds, ...grandChildIds];
      });
    }

    // Check if node has areas (alternative structure)
    if (node.areas && node.areas.length > 0) {
      node.areas.forEach(area => {
        if (area.area_id) {
          childIds.push(area.area_id);
        }
        // Recursively get children of areas
        const grandChildIds = getAllChildAreaIds(area);
        childIds = [...childIds, ...grandChildIds];
      });
    }

    // For intermediate parent nodes, also check for group IDs in the last child
    if (!node.area_id && !node.floor_id && !node.group_id && node.children && node.children.length > 0) {
      // Find the last child and check if it has a group_id
      const lastChild = node.children[node.children.length - 1];
      if (lastChild && lastChild.group_id) {
        // Use the last child's group_id to get all areas in that group
        const groupAreas = getAllAreasFromGroup(lastChild.group_id);
        childIds = [...childIds, ...groupAreas];
      }
    }

    // Remove area limit to allow selecting all areas from groups
    // if (childIds.length > 20) {
    //   return childIds.slice(0, 15)
    // }

    return childIds;
  };

  // Helper function to get all areas from a group
  const getAllAreasFromGroup = (groupId) => {
    const groupAreas = [];


    // Find the group in the area tree data
    const findGroupInTree = (nodes, floorName = 'unknown') => {
      for (const node of nodes) {

        if (node.group_id === groupId) {
          // Found the group, get all areas from this group
          if (node.areas && node.areas.length > 0) {
            node.areas.forEach(area => {
              if (area.area_id) {
                groupAreas.push(area.area_id);
              }
            });
          }
          return true;
        }

        // Recursively search in children
        if (node.children && node.children.length > 0) {
          if (findGroupInTree(node.children, floorName)) {
            return true;
          }
        }

        // Also check in areas if they have children
        if (node.areas && node.areas.length > 0) {
          for (const area of node.areas) {
            if (area.children && area.children.length > 0) {
              if (findGroupInTree(area.children, floorName)) {
                return true;
              }
            }
          }
        }
      }
      return false;
    };

    return groupAreas;
  };

  // Add function to get all area IDs from a floor
  const getAllAreaIdsFromFloor = (floorData) => {
    const allAreaIds = [];

    const traverseNode = (node) => {
      if (node.area_id) {
        allAreaIds.push(node.area_id);
      }

      if (node.children && node.children.length > 0) {
        node.children.forEach(traverseNode);
      }

      if (node.areas && node.areas.length > 0) {
        node.areas.forEach(traverseNode);
      }
    };

    if (floorData.tree) {
      floorData.tree.forEach(traverseNode);
    } else if (floorData.areas) {
      floorData.areas.forEach(traverseNode);
    }

    return allAreaIds;
  };

  const handleDurationChange = (e) => {
    const newDuration = e.target.value;

    // Only set loading if duration actually changed
    if (newDuration !== selectedDuration) {
      // Show global loader immediately when duration changes
      setGlobalLoading(true);

      // Immediately clear old data and show loaders
      setChartLoading({
        energyConsumption: true,
        energySavings: true,
        peakMinConsumption: true,
        totalConsumptionByGroup: true,
        lightPowerDensity: true,
        occupancyCount: true,
        occupancyByGroup: true,
        spaceUtilizationPerArea: true,
        // peakMinOccupancy: true, // Commented out - not using peak min max API for space utilization
        savingsByStrategy: true
      });
      setIsDataLoading(true);

      // Reset to current date when changing duration
      const today = new Date();

      // Batch multiple Redux actions together
      dispatch((dispatch) => {
        dispatch(setCurrentDate(formatDateForState(today)));
        dispatch(setCurrentYear(today.getFullYear()));
        dispatch(setCustomDateRange({ startDate: null, endDate: null }));
        dispatch(setIsNavigating(false));
        dispatch(setSelectedDuration(newDuration));
      });
    }

    setShowDurationDropdown(false);
  }

  // Fetch energy data from backend
  const customStartDate = useSelector((state) => state.dashboard.customStartDate) || '';
  const customEndDate = useSelector((state) => state.dashboard.customEndDate) || '';

  // Create a stable date reference to prevent unnecessary re-renders
  const stableDateRef = useRef(new Date());

  // Helper function to calculate date parameters based on navigation state
  const calculateDateParameters = () => {

    // If custom date range is set, always use it regardless of selectedDuration
    // This ensures consistency when switching between tabs
    if (customDateRange.startDate && customDateRange.endDate &&
      customDateRange.startDate.trim() !== '' && customDateRange.endDate.trim() !== '') {
      return {
        timeRange: 'custom',
        startDate: customDateRange.startDate,
        endDate: customDateRange.endDate
      };
    }

    // For navigation, use the custom date range that was set by navigation handlers
    if (isNavigating && customDateRange.startDate && customDateRange.endDate) {
      return {
        timeRange: 'custom',
        startDate: customDateRange.startDate,
        endDate: customDateRange.endDate
      };
    }

    // For non-custom time ranges, use current date for regular API calls
    // Only use currentDate for navigation when isNavigating is true
    const targetDate = isNavigating ? parseDateFromState(currentDate) : stableDateRef.current;
    let startDate, endDate;

    if (selectedDuration === 'this-day') {
      // Use the navigated date for this-day - format without time to avoid millisecond differences
      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');
      const day = String(targetDate.getDate()).padStart(2, '0');
      startDate = `${year}-${month}-${day}`;
      endDate = `${year}-${month}-${day}`;
    } else if (selectedDuration === 'this-week') {
      // Calculate week based on navigated date - send FULL WEEK range
      const startOfWeek = new Date(targetDate);
      startOfWeek.setDate(targetDate.getDate() - targetDate.getDay()); // Start of week (Sunday)
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week (Saturday)

      const startYear = startOfWeek.getFullYear();
      const startMonth = String(startOfWeek.getMonth() + 1).padStart(2, '0');
      const startDay = String(startOfWeek.getDate()).padStart(2, '0');
      startDate = `${startYear}-${startMonth}-${startDay}`;

      const endYear = endOfWeek.getFullYear();
      const endMonth = String(endOfWeek.getMonth() + 1).padStart(2, '0');
      const endDay = String(endOfWeek.getDate()).padStart(2, '0');
      endDate = `${endYear}-${endMonth}-${endDay}`;
    } else if (selectedDuration === 'this-month') {
      // Calculate month based on navigated date - send FULL MONTH range
      // This automatically handles different month lengths (28, 29, 30, 31 days)
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth();

      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0); // Day 0 of next month = last day of current month

      const startYear = startOfMonth.getFullYear();
      const startMonth = String(startOfMonth.getMonth() + 1).padStart(2, '0');
      const startDay = String(startOfMonth.getDate()).padStart(2, '0');
      startDate = `${startYear}-${startMonth}-${startDay}`;

      const endYear = endOfMonth.getFullYear();
      const endMonth = String(endOfMonth.getMonth() + 1).padStart(2, '0');
      const endDay = String(endOfMonth.getDate()).padStart(2, '0');
      endDate = `${endYear}-${endMonth}-${endDay}`;

    } else if (selectedDuration === 'this-year') {
      // Calculate year based on navigated year - send FULL YEAR range
      const startOfYear = new Date(currentYear, 0, 1);
      const endOfYear = new Date(currentYear, 11, 31);

      const startYear = startOfYear.getFullYear();
      const startMonth = String(startOfYear.getMonth() + 1).padStart(2, '0');
      const startDay = String(startOfYear.getDate()).padStart(2, '0');
      startDate = `${startYear}-${startMonth}-${startDay}`;

      const endYear = endOfYear.getFullYear();
      const endMonth = String(endOfYear.getMonth() + 1).padStart(2, '0');
      const endDay = String(endOfYear.getDate()).padStart(2, '0');
      endDate = `${endYear}-${endMonth}-${endDay}`;
    } else {
      // Default to current date
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      startDate = `${year}-${month}-${day}`;
      endDate = `${year}-${month}-${day}`;
    }

    // If we're navigating (using custom dates), always use 'custom' timeRange
    // This ensures the backend uses our specific dates instead of datetime.now()
    if (isNavigating || (customDateRange.startDate && customDateRange.endDate)) {
      return {
        timeRange: 'custom',
        startDate: startDate,
        endDate: endDate
      };
    }

    // For regular (non-navigation) calls, use the original timeRange
    return {
      timeRange: selectedDuration,
      startDate: startDate,
      endDate: endDate
    };
  };

  // Helper function to calculate date parameters for current date (used when switching tabs)
  const calculateCurrentDateParameters = () => {
    // If custom date range is set, always use it regardless of selectedDuration
    // This ensures consistency when switching between tabs
    if (customDateRange.startDate && customDateRange.endDate &&
      customDateRange.startDate.trim() !== '' && customDateRange.endDate.trim() !== '') {
      return {
        timeRange: 'custom',
        startDate: customDateRange.startDate,
        endDate: customDateRange.endDate
      };
    }

    // For navigation, use the custom date range that was set by navigation handlers
    if (isNavigating && customDateRange.startDate && customDateRange.endDate) {
      return {
        timeRange: 'custom',
        startDate: customDateRange.startDate,
        endDate: customDateRange.endDate
      };
    }

    // Use currentDate from Redux state to maintain date consistency across tabs
    // This ensures that when you navigate to a previous week and switch tabs, 
    // the same date range is maintained
    const targetDate = parseDateFromState(currentDate);
    let startDate, endDate;

    if (selectedDuration === 'this-day') {
      // Use target date for this-day - format without time to avoid millisecond differences
      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');
      const day = String(targetDate.getDate()).padStart(2, '0');
      startDate = `${year}-${month}-${day}`;
      endDate = `${year}-${month}-${day}`;
    } else if (selectedDuration === 'this-week') {
      // Calculate week based on target date - send FULL WEEK range
      const startOfWeek = new Date(targetDate);
      startOfWeek.setDate(targetDate.getDate() - targetDate.getDay()); // Start of week (Sunday)
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week (Saturday)

      const startYear = startOfWeek.getFullYear();
      const startMonth = String(startOfWeek.getMonth() + 1).padStart(2, '0');
      const startDay = String(startOfWeek.getDate()).padStart(2, '0');
      startDate = `${startYear}-${startMonth}-${startDay}`;

      const endYear = endOfWeek.getFullYear();
      const endMonth = String(endOfWeek.getMonth() + 1).padStart(2, '0');
      const endDay = String(endOfWeek.getDate()).padStart(2, '0');
      endDate = `${endYear}-${endMonth}-${endDay}`;
    } else if (selectedDuration === 'this-month') {
      // Calculate month based on target date - send FULL MONTH range
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth();

      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0); // Day 0 of next month = last day of current month

      const startYear = startOfMonth.getFullYear();
      const startMonth = String(startOfMonth.getMonth() + 1).padStart(2, '0');
      const startDay = String(startOfMonth.getDate()).padStart(2, '0');
      startDate = `${startYear}-${startMonth}-${startDay}`;

      const endYear = endOfMonth.getFullYear();
      const endMonth = String(endOfMonth.getMonth() + 1).padStart(2, '0');
      const endDay = String(endOfMonth.getDate()).padStart(2, '0');
      endDate = `${endYear}-${endMonth}-${endDay}`;

    } else if (selectedDuration === 'this-year') {
      // Calculate year based on target date - send FULL YEAR range
      const currentYear = targetDate.getFullYear();
      const startOfYear = new Date(currentYear, 0, 1);
      const endOfYear = new Date(currentYear, 11, 31);

      const startYear = startOfYear.getFullYear();
      const startMonth = String(startOfYear.getMonth() + 1).padStart(2, '0');
      const startDay = String(startOfYear.getDate()).padStart(2, '0');
      startDate = `${startYear}-${startMonth}-${startDay}`;

      const endYear = endOfYear.getFullYear();
      const endMonth = String(endOfYear.getMonth() + 1).padStart(2, '0');
      const endDay = String(endOfYear.getDate()).padStart(2, '0');
      endDate = `${endYear}-${endMonth}-${endDay}`;
    } else {
      // Default to target date
      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');
      const day = String(targetDate.getDate()).padStart(2, '0');
      startDate = `${year}-${month}-${day}`;
      endDate = `${year}-${month}-${day}`;
    }

    return {
      timeRange: selectedDuration, // Use original timeRange for current date
      startDate,
      endDate
    };
  };



  // Memoize the date parameters to prevent unnecessary recalculations
  const dateParams = useMemo(() => {
    const params = calculateDateParameters();
    return params;
  }, [selectedDuration, customDateRange.startDate, customDateRange.endDate, isNavigating]);

  // Memoize the API parameters to prevent unnecessary re-renders
  const apiParams = useMemo(() => {
    if (!selectedDuration) {
      return null;
    }

    // Don't call APIs for custom until both dates are set
    if (selectedDuration === 'custom' && (!customStartDate || !customEndDate)) {
      return null;
    }

    // Do NOT wait for allAreasLoaded — empty areaIds means full project and must
    // still fire immediately so widgets never sit on Loading with zero network calls.

    // Use selected areas from Redux state (only updated when Set button is clicked)
    // Don't use local selectedAreaCodes here to prevent immediate API calls
    let areasToUse = selectedAreas;
    let floorsToUse = selectedFloorIds;
    let groupsToUse = selectedGroupIds;

    // CRITICAL FIX: Allow API calls with no parameters (full project data) on initial load
    // But prevent API calls when local state changes (dropdown selections)
    // This is handled by the useEffect dependency on apiParams vs local state

    // CRITICAL FIX: When floors are selected, prioritize floor-level filtering
    // This ensures area group consumption works correctly
    if (floorsToUse && floorsToUse.length > 0) {
      // Floor selected - use floor-level filtering, ignore individual areas
      areasToUse = null;
    }

    // Use memoized date parameters
    const { timeRange, startDate, endDate } = dateParams;

    // Use the calculated timeRange (which will be 'custom' when navigating)
    const params = {
      // CRITICAL FIX: When floors are selected, send ONLY floorIds, NOT areaIds
      areaIds: (floorsToUse && floorsToUse.length > 0) ? null : (areasToUse && areasToUse.length > 0 ? areasToUse : null),
      floorIds: floorsToUse && floorsToUse.length > 0 ? floorsToUse : null,
      timeRange: timeRange,
      startDate: startDate,
      endDate: endDate,
      isNavigating: isNavigating
    };



    return params;
  }, [selectedAreas, selectedFloorIds, selectedGroupIds, selectedDuration, dateParams, isNavigating, customStartDate, customEndDate]);

  // Add request cancellation to prevent race conditions
  const abortControllerRef = useRef(null);
  const debounceTimeoutRef = useRef(null);
  const previousApiParamsRef = useRef(null);
  const isApiCallInProgressRef = useRef(false);
  const apiCallTimeoutRef = useRef(null);

  useEffect(() => {
    if (!apiParams) {
      return;
    }

    // Check if parameters have actually changed
    // Only compare apiParams, not activeTab, to prevent duplicate calls
    const currentParams = { ...apiParams };
    const previousParams = previousApiParamsRef.current ? { ...previousApiParamsRef.current } : null;

    const paramsString = JSON.stringify(currentParams);
    const previousParamsString = JSON.stringify(previousParams);

    if (paramsString === previousParamsString) {
      return;
    }

    // Additional check: if this is a navigation call and we just had a navigation call, skip
    if (currentParams.isNavigating && previousParams && previousParams.isNavigating) {
      return;
    }


    previousApiParamsRef.current = { ...apiParams };

    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Clear any existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Clear any existing API call timeout
    if (apiCallTimeoutRef.current) {
      clearTimeout(apiCallTimeoutRef.current);
    }

    // Debounce the actual API call to prevent rapid successive calls
    debounceTimeoutRef.current = setTimeout(() => {
      // Only proceed if parameters are still valid and no other call is in progress
      if (!isApiCallInProgressRef.current) {
        isApiCallInProgressRef.current = true;

        // Trigger the API call after debounce
        apiCallTimeoutRef.current = setTimeout(() => {
          // This will be handled by the separate useEffect
          isApiCallInProgressRef.current = false;
        }, 100);
      }
    }, 300); // 300ms debounce for better stability

    // Don't set global loading states to prevent flickering
    // Loading states are handled by individual API calls

    // Cleanup function to abort request on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (apiCallTimeoutRef.current) {
        clearTimeout(apiCallTimeoutRef.current);
      }
    };
  }, [apiParams, dispatch]);

  // Track unified API params to prevent duplicate calls - use stable string comparison
  const unifiedApiParamsRef = useRef(null);
  const lastApiParamsStringRef = useRef(null);
  const lastActiveTabRef = useRef(null);

  // Refs for batching loading state updates to prevent line chart re-renders
  const pendingLoadingUpdatesRef = useRef(new Set());
  const updateScheduledRef = useRef(false);

  // Create stable string representation of apiParams to prevent unnecessary re-runs
  // This memoization ensures the string only changes when actual values change
  const apiParamsString = useMemo(() => {
    if (!apiParams) return null;
    return JSON.stringify({
      areaIds: apiParams.areaIds,
      floorIds: apiParams.floorIds,
      timeRange: apiParams.timeRange,
      startDate: apiParams.startDate,
      endDate: apiParams.endDate,
      isNavigating: apiParams.isNavigating
    });
  }, [apiParams]);

  // Separate useEffect to handle tab changes and trigger API calls for active tab only
  useEffect(() => {
    if (!apiParams || !apiParamsString) {
      return;
    }

    // CRITICAL FIX: Only run if apiParams or activeTab actually changed
    // This prevents re-running when donut chart loading states update
    if (lastApiParamsStringRef.current === apiParamsString && lastActiveTabRef.current === activeTab) {
      return;
    }

    // If a batch is in flight but params/tab changed, supersede it — do not drop the update
    // (previous bug updated refs then returned on in-progress, permanently skipping the fetch)
    if (isApiCallInProgressRef.current) {
      isApiCallInProgressRef.current = false;
    }

    // Update refs to track current state
    lastApiParamsStringRef.current = apiParamsString;
    lastActiveTabRef.current = activeTab;

    // Set flag to prevent duplicate calls
    isApiCallInProgressRef.current = true;

    // Safety: never leave the dashboard permanently blocked if a request hangs
    if (apiCallTimeoutRef.current) {
      clearTimeout(apiCallTimeoutRef.current);
    }
    apiCallTimeoutRef.current = setTimeout(() => {
      if (isApiCallInProgressRef.current) {
        console.warn('[Dashboard] API batch timeout — releasing in-progress lock and clearing loaders');
        isApiCallInProgressRef.current = false;
        setGlobalLoading(false);
        setChartLoading((prev) => {
          const cleared = { ...prev };
          Object.keys(cleared).forEach((k) => {
            cleared[k] = false;
          });
          return cleared;
        });
      }
    }, 90000);

    // CRITICAL FIX: Only show global loader when we have valid API parameters
    // Don't show loader when apiParams is null (no selection made yet)
    // Allow API calls with no parameters (full project data) but don't show loader for initial load
    if (apiParams && (apiParams.areaIds || apiParams.floorIds)) {
      setGlobalLoading(true);
    }

    // Only trigger API calls when tab changes or when we have new parameters
    const fetchDataForActiveTab = async () => {
      try {
        if (activeTab === 'overview') {
          setGlobalLoading(false);
          isApiCallInProgressRef.current = false;
          return;
        }

        const requestId = Math.random().toString(36).substr(2, 9);
        const isLargeDateRange = ['this-month', 'this-year'].includes(selectedDuration);

        // Set loading states for all charts that will be called
        // Loading states are handled by individual API calls

        // Call APIs for active tab only - each chart renders as soon as its own data is ready
        if (activeTab === 'energy') {
          const isLargeDateRange = ['this-week', 'this-month', 'this-year'].includes(selectedDuration);

          let apiCalls = [];

          // Always refetch unified when params changed OR when returning to energy (ref cleared on tab change)
          const unifiedParamsKey = apiParamsString;
          const shouldCallUnified = unifiedApiParamsRef.current !== unifiedParamsKey;

          if (shouldCallUnified) {
            unifiedApiParamsRef.current = unifiedParamsKey;
            apiCalls.push({
              name: 'unifiedEnergyData',
              promise: dispatch(
                fetchUnifiedEnergyConsumptionSavingsData({ ...apiParams, forceRefresh: true })
              ),
            });
          }

          // Always call donut chart APIs in parallel
          apiCalls.push(
            { name: 'totalConsumptionByGroup', promise: dispatch(fetchTotalConsumptionByGroup(apiParams)) },
            { name: 'lightPowerDensity', promise: dispatch(fetchLightPowerDensity(apiParams)) },
            { name: 'savingsByStrategy', promise: dispatch(fetchSavingsByStrategy(apiParams)) }
          );

          // Set loading states for all APIs that will be called
          setChartLoading(prev => {
            const newState = { ...prev };
            if (shouldCallUnified) {
              newState.energyConsumption = true;
              newState.energySavings = true;
              newState.peakMinConsumption = true;
            }
            newState.totalConsumptionByGroup = true;
            newState.lightPowerDensity = true;
            newState.savingsByStrategy = true;
            return newState;
          });

          const clearChartLoadingForApi = (apiName) => {
            setChartLoading(prev => {
              const newState = { ...prev };
              if (apiName === 'unifiedEnergyData') {
                newState.energyConsumption = false;
                newState.energySavings = false;
                newState.peakMinConsumption = false;
              } else {
                newState[apiName] = false;
              }
              return newState;
            });
          };

          // Clear each chart's loader as soon as its own API settles
          apiCalls.forEach(apiCall => {
            apiCall.promise
              .then(() => {
                clearChartLoadingForApi(apiCall.name);
              })
              .catch((err) => {
                console.warn(`[Dashboard] ${apiCall.name} failed:`, err);
                clearChartLoadingForApi(apiCall.name);
              });
          });

          // Use Promise.allSettled to reset in-progress flag when all calls complete
          Promise.allSettled(apiCalls.map(apiCall => apiCall.promise))
            .then(() => {
              isApiCallInProgressRef.current = false;
              setGlobalLoading(false);
            });
        } else if (activeTab === 'space-utilization') {
          // Space Utilization APIs - PARALLEL EXECUTION FOR MAXIMUM SPEED
          const spaceUtilizationApis = [
            { name: 'occupancyCount', promise: dispatch(fetchOccupancyCount(apiParams)) },
            { name: 'occupancyByGroup', promise: dispatch(fetchOccupancyByGroup(apiParams)) },
            { name: 'spaceUtilizationPerArea', promise: dispatch(fetchSpaceUtilizationPerArea(apiParams)) }
            // { name: 'peakMinOccupancy', promise: dispatch(fetchPeakMinOccupancy(apiParams)) } // Commented out - not using peak min max API for space utilization
          ];

          // Set loading states for all space utilization APIs
          setChartLoading(prev => ({
            ...prev,
            occupancyCount: true,
            occupancyByGroup: true,
            spaceUtilizationPerArea: true
            // peakMinOccupancy: true // Commented out - not using peak min max API for space utilization
          }));

          // Execute all space utilization API calls in parallel but handle each completion individually
          spaceUtilizationApis.forEach(api => {
            api.promise
              .then(() => {
                // Update loading state immediately when this specific API completes
                setChartLoading(prev => ({ ...prev, [api.name]: false }));
              })
              .catch((error) => {
                // Handle individual API errors
                // Space API call failed
                setChartLoading(prev => ({ ...prev, [api.name]: false }));
              });
          });

          // Use Promise.allSettled to reset global states when all calls complete
          Promise.allSettled(spaceUtilizationApis.map(api => api.promise))
            .then(() => {
              // Reset global states when all calls complete
              setGlobalLoading(false);
              isApiCallInProgressRef.current = false;
            });
        } else if (activeTab === 'charts') {
          // Charts tab - Instant Occupancy Count, Occupancy By Group from logs, and Space Utilization Per Area from logs APIs
          const chartsApis = [
            { name: 'instantOccupancyCount', promise: dispatch(fetchInstantOccupancyCount(apiParams)) },
            { name: 'occupancyByGroupFromLogs', promise: dispatch(fetchOccupancyByGroupFromLogs(apiParams)) },
            { name: 'spaceUtilizationPerFromLogs', promise: dispatch(fetchSpaceUtilizationPerFromLogs(apiParams)) }
          ];

          // Set loading states for all charts APIs
          setChartLoading(prev => ({
            ...prev,
            instantOccupancyCount: true,
            occupancyByGroupFromLogs: true,
            spaceUtilizationPerFromLogs: true
          }));

          // Execute all charts API calls in parallel but handle each completion individually
          chartsApis.forEach(api => {
            api.promise
              .then(() => {
                // Update loading state immediately when this specific API completes
                setChartLoading(prev => ({ ...prev, [api.name]: false }));
              })
              .catch((error) => {
                // Handle individual API errors
                setChartLoading(prev => ({ ...prev, [api.name]: false }));
              });
          });

          // Use Promise.allSettled to reset global states when all calls complete
          Promise.allSettled(chartsApis.map(api => api.promise))
            .then(() => {
              // Reset global states when all calls complete
              setGlobalLoading(false);
              isApiCallInProgressRef.current = false;
            });
        }
      } catch (error) {
        console.warn('[Dashboard] fetchDataForActiveTab failed:', error);
        isApiCallInProgressRef.current = false;
        setGlobalLoading(false);
        setChartLoading((prev) => {
          const cleared = { ...prev };
          Object.keys(cleared).forEach((k) => {
            cleared[k] = false;
          });
          return cleared;
        });
      }
    };

    fetchDataForActiveTab();

    // Cleanup function - don't reset flag here, let API handlers manage it
    return () => {
      // Cleanup handled by individual API completion handlers
    };
  }, [activeTab, apiParamsString, dispatch, reloadTrigger, selectedDuration]);


  // Automatic reload on login for all roles - trigger once when data is ready
  useEffect(() => {
    // Only reload once per login session
    if (hasInitialReloadRef.current) {
      return;
    }

    // Wait for essential data to be ready
    const floorsReady = floorStatus === 'succeeded' && floors.length >= 0;
    const profileReady = isOperator ? (userProfile !== null && !profileLoading) : true;
    const durationReady = selectedDuration !== null && selectedDuration !== undefined;
    const areasReady = allAreasLoaded || getAvailableFloors().length === 0; // Allow reload even if no floors

    // Only proceed if all conditions are met and we have API params
    if (floorsReady && profileReady && durationReady && areasReady && apiParams && !isApiCallInProgressRef.current) {
      // Mark as reloaded immediately to prevent multiple reloads
      hasInitialReloadRef.current = true;

      // Small delay to ensure all state is settled, then trigger reload
      const reloadTimer = setTimeout(() => {
        // Force a data reload by clearing cache and resetting flags
        dispatch(clearDataCache());
        isApiCallInProgressRef.current = false;

        // Trigger reload by incrementing reloadTrigger
        // This will cause the useEffect that handles apiParams to run again
        setReloadTrigger(prev => prev + 1);
      }, 500); // Delay to ensure everything is ready

      return () => clearTimeout(reloadTimer);
    }
  }, [floorStatus, floors.length, profileLoading, userProfile, selectedDuration, allAreasLoaded, isOperator, apiParams, dispatch]);

  // Remove the filterData and related mock data logic entirely

  const handleTabChange = (tab) => {
    // Close area tree and dropdown when switching tabs
    if (expandedFloorId !== null) {
      setExpandedFloorId(null);
      setExpandedNodes(new Set());
    }
    if (showAreaDropdown) {
      setShowAreaDropdown(false);
    }

    setActiveTab(tab);

    // Show global loader immediately when tab changes
    setGlobalLoading(true);

    // Tab switching state removed to prevent flickering

    // Reset API call progress flag to allow new API calls for the new tab
    isApiCallInProgressRef.current = false;
    // Force unified + tab APIs to re-fire when returning to a tab
    unifiedApiParamsRef.current = null;
    lastApiParamsStringRef.current = null;
    lastActiveTabRef.current = null;

    // Clear data cache when switching tabs to prevent stale data
    dispatch(clearDataCache());

    // Set loading states for all charts when switching tabs
    setChartLoading({
      energyConsumption: true,
      energySavings: true,
      peakMinConsumption: true,
      totalConsumptionByGroup: true,
      lightPowerDensity: true,
      occupancyCount: true,
      occupancyByGroup: true,
      spaceUtilizationPerArea: true,
      // peakMinOccupancy: true, // Commented out - not using peak min max API for space utilization
      savingsByStrategy: true
    });

    // Trigger API calls for the new tab if we have the required parameters
    // Use selected areas if available, otherwise use all accessible areas from floors
    let areasToUse = selectedAreas;
    let floorsToUse = selectedFloorIds;

    // Always proceed with API calls if we have duration - let backend handle area filtering
    if (selectedDuration) {
      // Don't call APIs for custom until both dates are set
      if (selectedDuration === 'custom' && (!customStartDate || !customEndDate)) {
        return;
      }

      // Calculate date parameters for current date (not navigated date)
      const { startDate, endDate } = calculateCurrentDateParameters();

      // Use the selectedDuration directly - let the Redux slice handle the time_range mapping
      const params = {
        // CORRECT LOGIC: If floor is selected, send ONLY floorIds, NOT areaIds
        areaIds: (floorsToUse && floorsToUse.length > 0) ? null : (areasToUse.length > 0 ? areasToUse : null),
        floorIds: floorsToUse && floorsToUse.length > 0 ? floorsToUse : null,
        timeRange: selectedDuration,
        startDate: startDate,
        endDate: endDate,
        isNavigating: false // Reset navigation flag when switching tabs
      };

      // Don't call APIs directly here - let the useEffect handle it
      // This prevents multiple API calls that overwrite the complete data
    }
  }

  // Update the navigation handlers to properly handle week navigation
  const handlePrevious = () => {
    if (selectedDuration === 'this-day') {
      const newDate = parseDateFromState(currentDate);
      newDate.setDate(newDate.getDate() - 1);

      // Keep UI showing "this-day" but set custom date range for data fetching
      // Create dates in local timezone to avoid UTC conversion issues
      const year = newDate.getFullYear();
      const month = newDate.getMonth();
      const day = newDate.getDate();

      // Use simple date format without time to avoid timezone issues
      const startDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const endDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      // Set loading state and trigger data refresh
      setChartLoading({
        energyConsumption: true,
        energySavings: true,
        peakMinConsumption: true,
        totalConsumptionByGroup: true,
        lightPowerDensity: true,
        occupancyCount: true,
        occupancyByGroup: true,
        spaceUtilizationPerArea: true,
        // peakMinOccupancy: true, // Commented out - not using peak min max API for space utilization
        savingsByStrategy: true
      });
      setIsDataLoading(true);

      // Don't change selectedDuration, just update custom date range and current date
      dispatch(setCustomDateRange({
        startDate: startDateStr,
        endDate: endDateStr
      }));
      dispatch(setCurrentDate(formatDateForState(newDate)));
      dispatch(setIsNavigating(true));
    } else if (selectedDuration === 'this-week') {
      const newDate = parseDateFromState(currentDate);
      newDate.setDate(newDate.getDate() - 7); // Go back 7 days

      // Set loading state and trigger data refresh
      setChartLoading({
        energyConsumption: true,
        energySavings: true,
        peakMinConsumption: true,
        totalConsumptionByGroup: true,
        lightPowerDensity: true,
        occupancyCount: true,
        occupancyByGroup: true,
        spaceUtilizationPerArea: true,
        // peakMinOccupancy: true, // Commented out - not using peak min max API for space utilization
        savingsByStrategy: true
      });
      setIsDataLoading(true);

      // Keep UI showing "this-week" but set custom date range for data fetching
      const startOfWeek = new Date(newDate);
      startOfWeek.setDate(newDate.getDate() - newDate.getDay()); // Start of week (Sunday)
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week (Saturday)
      endOfWeek.setHours(23, 59, 59, 999);

      // Use simple date format without time to avoid timezone issues
      const startDateStr = `${startOfWeek.getFullYear()}-${String(startOfWeek.getMonth() + 1).padStart(2, '0')}-${String(startOfWeek.getDate()).padStart(2, '0')}`;
      const endDateStr = `${endOfWeek.getFullYear()}-${String(endOfWeek.getMonth() + 1).padStart(2, '0')}-${String(endOfWeek.getDate()).padStart(2, '0')}`;

      // Don't change selectedDuration, just update custom date range and current date
      dispatch(setCustomDateRange({
        startDate: startDateStr,
        endDate: endDateStr
      }));
      dispatch(setCurrentDate(formatDateForState(newDate)));
      dispatch(setIsNavigating(true));
    } else if (selectedDuration === 'this-month') {
      const newDate = parseDateFromState(currentDate);
      newDate.setMonth(newDate.getMonth() - 1);

      // Set loading state and trigger data refresh
      setChartLoading({
        energyConsumption: true,
        energySavings: true,
        peakMinConsumption: true,
        totalConsumptionByGroup: true,
        lightPowerDensity: true,
        occupancyCount: true,
        occupancyByGroup: true,
        spaceUtilizationPerArea: true,
        // peakMinOccupancy: true, // Commented out - not using peak min max API for space utilization
        savingsByStrategy: true
      });
      setIsDataLoading(true);

      // Keep UI showing "this-month" but set custom date range for data fetching
      // This automatically handles different month lengths (28, 29, 30, 31 days)
      const year = newDate.getFullYear();
      const month = newDate.getMonth();

      const startOfMonth = new Date(year, month, 1, 0, 0, 0, 0);
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999); // Day 0 of next month = last day of current month

      // Use simple date format without time to avoid timezone issues
      const startDateStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const endDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(endOfMonth.getDate()).padStart(2, '0')}`;


      // Don't change selectedDuration, just update custom date range and current date
      dispatch(setCustomDateRange({
        startDate: startDateStr,
        endDate: endDateStr
      }));
      dispatch(setCurrentDate(formatDateForState(newDate)));
      dispatch(setIsNavigating(true));
      setSelectedMonthForData({
        year: year,
        month: month
      });
    } else if (selectedDuration === 'this-year') {
      const newYear = currentYear - 1;

      // Set loading state and trigger data refresh
      setChartLoading({
        energyConsumption: true,
        energySavings: true,
        peakMinConsumption: true,
        totalConsumptionByGroup: true,
        lightPowerDensity: true,
        occupancyCount: true,
        occupancyByGroup: true,
        spaceUtilizationPerArea: true,
        // peakMinOccupancy: true, // Commented out - not using peak min max API for space utilization
        savingsByStrategy: true
      });
      setIsDataLoading(true);

      // Keep UI showing "this-year" but set custom date range for data fetching
      const startOfYear = new Date(newYear, 0, 1);
      startOfYear.setHours(0, 0, 0, 0);
      const endOfYear = new Date(newYear, 11, 31);
      endOfYear.setHours(23, 59, 59, 999);

      // Use simple date format without time to avoid timezone issues
      const startDateStr = `${newYear}-01-01`;
      const endDateStr = `${newYear}-12-31`;

      // Don't change selectedDuration, just update custom date range and current year
      dispatch(setCustomDateRange({
        startDate: startDateStr,
        endDate: endDateStr
      }));
      dispatch(setCurrentYear(newYear));
      dispatch(setIsNavigating(true));
    } else if (selectedDuration === 'custom') {
      // Set loading state and trigger data refresh
      setChartLoading({
        energyConsumption: true,
        energySavings: true,
        peakMinConsumption: true,
        totalConsumptionByGroup: true,
        lightPowerDensity: true,
        occupancyCount: true,
        occupancyByGroup: true,
        spaceUtilizationPerArea: true,
        // peakMinOccupancy: true, // Commented out - not using peak min max API for space utilization
        savingsByStrategy: true
      });
      setIsDataLoading(true);

      // Handle custom date range navigation
      const currentStartDate = new Date(customDateRange.startDate);
      const currentEndDate = new Date(customDateRange.endDate);
      const dayDiff = Math.ceil((currentEndDate - currentStartDate) / (1000 * 60 * 60 * 24)) + 1;

      const newStartDate = new Date(currentStartDate);
      newStartDate.setDate(newStartDate.getDate() - dayDiff);
      const newEndDate = new Date(currentEndDate);
      newEndDate.setDate(newEndDate.getDate() - dayDiff);

      // Use simple date format without time to avoid timezone issues
      const startDateStr = `${newStartDate.getFullYear()}-${String(newStartDate.getMonth() + 1).padStart(2, '0')}-${String(newStartDate.getDate()).padStart(2, '0')}`;
      const endDateStr = `${newEndDate.getFullYear()}-${String(newEndDate.getMonth() + 1).padStart(2, '0')}-${String(newEndDate.getDate()).padStart(2, '0')}`;

      dispatch(setCustomDateRange({
        startDate: startDateStr,
        endDate: endDateStr
      }));
      dispatch(setCurrentDate(formatDateForState(newStartDate)));
      dispatch(setIsNavigating(true));
    }
  };

  const handleNext = () => {

    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    if (selectedDuration === 'this-day') {
      const newDate = parseDateFromState(currentDate);
      newDate.setDate(newDate.getDate() + 1);

      // Don't allow navigation to future dates
      if (newDate <= today) {
        // Set loading state and trigger data refresh
        setChartLoading({
          energyConsumption: true,
          energySavings: true,
          peakMinConsumption: true,
          totalConsumptionByGroup: true,
          lightPowerDensity: true,
          occupancyCount: true,
          occupancyByGroup: true,
          spaceUtilizationPerArea: true,
          // peakMinOccupancy: true, // Commented out - not using peak min max API for space utilization
          savingsByStrategy: true
        });
        setIsDataLoading(true);

        // Keep UI showing "this-day" but set custom date range for data fetching
        // Create dates in local timezone to avoid UTC conversion issues
        const year = newDate.getFullYear();
        const month = newDate.getMonth();
        const day = newDate.getDate();

        // Use simple date format without time to avoid timezone issues
        const startDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const endDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        // Don't change selectedDuration, just update custom date range and current date
        dispatch(setCustomDateRange({
          startDate: startDateStr,
          endDate: endDateStr
        }));
        dispatch(setCurrentDate(formatDateForState(newDate)));
        dispatch(setIsNavigating(true));
      }
    } else if (selectedDuration === 'this-week') {
      const newDate = parseDateFromState(currentDate);
      newDate.setDate(newDate.getDate() + 7); // Go forward 7 days

      // Don't allow navigation to future weeks
      if (newDate <= today) {
        // Set loading state and trigger data refresh
        setChartLoading({
          energyConsumption: true,
          energySavings: true,
          peakMinConsumption: true,
          totalConsumptionByGroup: true,
          lightPowerDensity: true,
          occupancyCount: true,
          occupancyByGroup: true,
          spaceUtilizationPerArea: true,
          // peakMinOccupancy: true, // Commented out - not using peak min max API for space utilization
          savingsByStrategy: true
        });
        setIsDataLoading(true);

        // Keep UI showing "this-week" but set custom date range for data fetching
        const startOfWeek = new Date(newDate);
        startOfWeek.setDate(newDate.getDate() - newDate.getDay()); // Start of week (Sunday)
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week (Saturday)
        endOfWeek.setHours(23, 59, 59, 999);

        // Convert to local timezone to avoid UTC conversion issues
        const startDateStr = `${startOfWeek.getFullYear()}-${String(startOfWeek.getMonth() + 1).padStart(2, '0')}-${String(startOfWeek.getDate()).padStart(2, '0')}T00:00:00`;
        const endDateStr = `${endOfWeek.getFullYear()}-${String(endOfWeek.getMonth() + 1).padStart(2, '0')}-${String(endOfWeek.getDate()).padStart(2, '0')}T23:59:59`;

        // Don't change selectedDuration, just update custom date range and current date
        dispatch(setCustomDateRange({
          startDate: startDateStr,
          endDate: endDateStr
        }));
        dispatch(setCurrentDate(formatDateForState(newDate)));
        dispatch(setIsNavigating(true));
      }
    } else if (selectedDuration === 'this-month') {
      const newDate = parseDateFromState(currentDate);
      newDate.setMonth(newDate.getMonth() + 1);

      // Don't allow navigation to future months
      if (newDate <= today) {
        // Set loading state and trigger data refresh
        setChartLoading({
          energyConsumption: true,
          energySavings: true,
          peakMinConsumption: true,
          totalConsumptionByGroup: true,
          lightPowerDensity: true,
          occupancyCount: true,
          occupancyByGroup: true,
          spaceUtilizationPerArea: true,
          // peakMinOccupancy: true, // Commented out - not using peak min max API for space utilization
          savingsByStrategy: true
        });
        setIsDataLoading(true);

        // Keep UI showing "this-month" but set custom date range for data fetching
        // This automatically handles different month lengths (28, 29, 30, 31 days)
        const year = newDate.getFullYear();
        const month = newDate.getMonth();

        const startOfMonth = new Date(year, month, 1, 0, 0, 0, 0);
        const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999); // Day 0 of next month = last day of current month

        // Convert to local timezone to avoid UTC conversion issues
        const startDateStr = `${year}-${String(month + 1).padStart(2, '0')}-01T00:00:00`;
        const endDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(endOfMonth.getDate()).padStart(2, '0')}T23:59:59`;

        // Don't change selectedDuration, just update custom date range and current date
        dispatch(setCustomDateRange({
          startDate: startDateStr,
          endDate: endDateStr
        }));
        dispatch(setCurrentDate(formatDateForState(newDate)));
        dispatch(setIsNavigating(true));
        setSelectedMonthForData({
          year: year,
          month: month
        });
      }
    } else if (selectedDuration === 'this-year') {
      const newYear = currentYear + 1;

      // Don't allow navigation to future years
      if (newYear <= today.getFullYear()) {
        // Set loading state and trigger data refresh
        setChartLoading({
          energyConsumption: true,
          energySavings: true,
          peakMinConsumption: true,
          totalConsumptionByGroup: true,
          lightPowerDensity: true,
          occupancyCount: true,
          occupancyByGroup: true,
          spaceUtilizationPerArea: true,
          // peakMinOccupancy: true, // Commented out - not using peak min max API for space utilization
          savingsByStrategy: true
        });
        setIsDataLoading(true);

        // Keep UI showing "this-year" but set custom date range for data fetching
        const startOfYear = new Date(newYear, 0, 1);
        startOfYear.setHours(0, 0, 0, 0);
        const endOfYear = new Date(newYear, 11, 31);
        endOfYear.setHours(23, 59, 59, 999);

        // Convert to local timezone to avoid UTC conversion issues
        const startDateStr = `${newYear}-01-01T00:00:00`;
        const endDateStr = `${newYear}-12-31T23:59:59`;

        // Don't change selectedDuration, just update custom date range and current year
        dispatch(setCustomDateRange({
          startDate: startDateStr,
          endDate: endDateStr
        }));
        dispatch(setCurrentYear(newYear));
        dispatch(setIsNavigating(true));
      }
    } else if (selectedDuration === 'custom') {
      // Set loading state and trigger data refresh
      setChartLoading({
        energyConsumption: true,
        energySavings: true,
        peakMinConsumption: true,
        totalConsumptionByGroup: true,
        lightPowerDensity: true,
        occupancyCount: true,
        occupancyByGroup: true,
        spaceUtilizationPerArea: true,
        // peakMinOccupancy: true, // Commented out - not using peak min max API for space utilization
        savingsByStrategy: true
      });
      setIsDataLoading(true);

      // Handle custom date range navigation
      const currentStartDate = new Date(customDateRange.startDate);
      const currentEndDate = new Date(customDateRange.endDate);
      const dayDiff = Math.ceil((currentEndDate - currentStartDate) / (1000 * 60 * 60 * 24)) + 1;

      const newStartDate = new Date(currentStartDate);
      newStartDate.setDate(newStartDate.getDate() + dayDiff);
      const newEndDate = new Date(currentEndDate);
      newEndDate.setDate(newEndDate.getDate() + dayDiff);

      // Don't allow navigation to future dates
      if (newEndDate <= today) {
        dispatch(setCustomDateRange({
          startDate: newStartDate.toISOString(),
          endDate: newEndDate.toISOString()
        }));
        dispatch(setCurrentDate(formatDateForState(newStartDate)));
        dispatch(setIsNavigating(true));
      }
    }
  };

  // Update the getCurrentSelectionText function to handle week display
  const getCurrentSelectionText = () => {
    // Convert currentDate string to Date object
    const currentDateObj = parseDateFromState(currentDate);

    if (selectedDuration === 'this-day') {
      return currentDateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } else if (selectedDuration === 'this-week') {
      // Calculate the start and end of the week
      const startOfWeek = new Date(currentDateObj);
      startOfWeek.setDate(currentDateObj.getDate() - currentDateObj.getDay()); // Start of week (Sunday)

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week (Saturday)

      return `${startOfWeek.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })} - ${endOfWeek.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })}`;
    } else if (selectedDuration === 'this-month') {
      return currentDateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      });
    } else if (selectedDuration === 'this-year') {
      return currentYear.toString();
    }
    return '';
  };
  // Update the useEffect to reset current date when duration changes
  useEffect(() => {

    // Only reset on initial load or when duration changes for the first time
    if (isInitialLoad.current) {
      if (selectedDuration === 'this-day') {
        dispatch(setCurrentDate(formatDateForState(new Date())));
      } else if (selectedDuration === 'this-week') {
        dispatch(setCurrentDate(formatDateForState(new Date())));
      } else if (selectedDuration === 'this-month') {
        dispatch(setCurrentDate(formatDateForState(new Date())));
        setSelectedMonthForData({
          year: new Date().getFullYear(),
          month: new Date().getMonth()
        });
      } else if (selectedDuration === 'this-year') {
        dispatch(setCurrentYear(new Date().getFullYear()));
      }
      isInitialLoad.current = false;
    }
  }, [selectedDuration, dispatch]);

  // Helper function to flatten area tree and get all selectable areas
  const flattenAreaTree = (treeData) => {
    const areas = []
    const processNode = (node) => {
      if (node.children && node.children.length > 0) {
        node.children.forEach(processNode)
      } else if (node.area_id) {
        // Only add nodes that have area_id (selectable areas)
        areas.push({
          id: node.area_id,
          name: node.name,
          area_code: node.area_code
        })
      }
    }

    if (treeData && treeData.tree) {
      treeData.tree.forEach(processNode)
    } else if (treeData && treeData.areas) {
      treeData.areas.forEach(processNode)
    }

    // Limit the number of areas to prevent selecting too many areas
    if (areas.length > 100) {
      return areas.slice(0, 15)
    }

    return areas
  }

  // Copy the exact helper functions from AreaTreeDialog.jsx
  const getAllAreaCodes = (node) => {
    let codes = [node.area_code];
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        codes = codes.concat(getAllAreaCodes(child));
      });
    }

    // Limit the number of area codes to prevent selecting too many areas
    if (codes.length > 20) {
      return codes.slice(0, 15)
    }

    return codes;
  };

  const getAllLeafNodes = (node) => {
    if (!node.children || node.children.length === 0) {
      return [node];
    }
    return node.children.flatMap(getAllLeafNodes);
  };

  // Helper to get all area IDs under a node (including itself and ALL descendants)
  const getAllAreaIds = (node) => {
    let areaIds = [];
    if (node.area_id) {
      areaIds.push(node.area_id);
    }
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        areaIds = areaIds.concat(getAllAreaIds(child));
      });
    }

    // Limit the number of area IDs to prevent selecting too many areas
    if (areaIds.length > 20) {
      return areaIds.slice(0, 15)
    }

    return areaIds;
  };






  const availableAreas = flattenAreaTree(areaTree)
  const isLoading = floorStatus === 'loading'
  const hasError = dashboardError || (floorStatus === 'failed')

  // Update the transformDataForCharts function to handle combined areas
  const transformDataForCharts = useCallback((data, chartType = 'consumption') => {
    if (!data || !data['x-axis'] || !data['y-axis']) {
      return [];
    }


    let xAxis = data['x-axis'] || data.x_axis || [];
    let yAxis = data['y-axis'] || data.y_axis || {};

    // Add additional null/undefined checks
    if (!xAxis || !yAxis || !Array.isArray(xAxis) || typeof yAxis !== 'object') {
      return [];
    }
    if (xAxis.length === 0 || Object.keys(yAxis).length === 0) {
      return [];
    }

    // If we have fewer than 5 areas selected and the backend returned "Combined Areas",
    // we need to show individual area names instead of "Combined Areas"
    if (selectedAreas.length < 5 && selectedAreas.length > 0 && yAxis['Combined Areas']) {
      // Get area names from the selected areas
      const areaNames = selectedAreas.map(areaId => {
        // Find the area name from the area tree
        const findAreaName = (nodes, targetId) => {
          for (const node of nodes) {
            if (node.area_id === targetId) {
              return node.name || node.area_name || `Area ${targetId}`;
            }
            if (node.children) {
              const found = findAreaName(node.children, targetId);
              if (found) return found;
            }
            if (node.areas) {
              const found = findAreaName(node.areas, targetId);
              if (found) return found;
            }
          }
          return `Area ${targetId}`;
        };

        if (areaTree && (areaTree.tree || areaTree.areas)) {
          const nodes = areaTree.tree || areaTree.areas;
          return findAreaName(nodes, areaId);
        }
        return `Area ${areaId}`;
      });

      // For now, show the combined data but with individual area names in the legend
      // Each area will show the same combined data (this is a limitation of the current backend)
      const combinedValues = yAxis['Combined Areas'];
      const newYAxis = {};

      // Each area shows the same combined data
      areaNames.forEach((areaName, index) => {
        newYAxis[areaName] = combinedValues;
      });

      yAxis = newYAxis;
    }

    // For "this_week", handle duplicate "Sun 0" entries and ensure proper data format
    if (selectedDuration === 'this-week') {
      // Check if we have the expected 29 data points with duplicate "Sun 0"
      if (xAxis.length === 29 && xAxis[0] === 'Sun 0' && xAxis[28] === 'Sun 0') {
        // Remove the duplicate "Sun 0" at the end to get 28 unique data points
        xAxis = xAxis.slice(0, 28);

        // Create a new yAxis object to avoid modifying read-only properties
        const newYAxis = {};
        Object.keys(yAxis).forEach(key => {
          if (yAxis[key].length === 29) {
            newYAxis[key] = yAxis[key].slice(0, 28);
          } else {
            newYAxis[key] = yAxis[key];
          }
        });
        yAxis = newYAxis;
      }
    }

    // Special handling for "this-month" when backend returns hourly data instead of daily data
    if (selectedDuration === 'this-month' && xAxis.length === 24 && xAxis[0] === '00:00') {
      // Backend returned hourly data for month view - we need to convert to daily data
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      // Create daily labels in backend format (day/month)
      const dailyLabels = [];
      for (let day = 1; day <= daysInMonth; day++) {
        dailyLabels.push(`${day}/${month + 1}`);
      }

      // Create new yAxis with daily aggregated data
      const newYAxis = {};
      Object.keys(yAxis).forEach(key => {
        const hourlyValues = yAxis[key];
        const dailyValues = [];

        // For each day, calculate average of hourly values
        for (let day = 0; day < daysInMonth; day++) {
          // For simplicity, use the first hour's value for each day
          // In a real implementation, you might want to aggregate all 24 hours
          const hourIndex = day % 24; // Cycle through hours for each day
          const hourValue = hourlyValues[hourIndex];
          // Keep null values as null, don't convert to 0
          dailyValues.push(hourValue !== undefined ? hourValue : null);
        }

        newYAxis[key] = dailyValues;
      });

      xAxis = dailyLabels;
      yAxis = newYAxis;
    }

    const transformedData = xAxis.map((label, index) => {
      // Use processed labels
      const dataPoint = {
        date: label
      };

      // Add safety check before Object.keys
      if (yAxis && typeof yAxis === 'object') {
        Object.keys(yAxis).forEach(key => {
          let value = yAxis[key][index];
          // Keep null values as null so no data points are drawn for missing data
          // Only convert undefined to null for consistency
          if (value === undefined) {
            value = null;
          }

          // Use raw backend key names without any processing
          dataPoint[key] = value;
        });
      }

      return dataPoint;
    });

    return transformedData;
  }, [selectedDuration, selectedAreas, areaTree]);

  // Calculate peak and min values from consumption chart data
  const calculatePeakMinFromChartData = (chartData) => {
    if (!chartData || chartData.length === 0) {
      return { peak: { value: 0, time: null }, min: { value: 0, time: null } };
    }

    const entries = [];
    let entryIndex = 0;

    chartData.forEach((point) => {
      let hasSeries = false;

      Object.keys(point).forEach(key => {
        if (key !== 'date') {
          hasSeries = true;
          const rawValue = point[key];
          if (rawValue === null || rawValue === undefined) {
            return;
          }

          const numericValue = Number(rawValue);
          if (!Number.isNaN(numericValue)) {
            entries.push({
              value: numericValue,
              time: point.date,
              index: entryIndex++
            });
          }
        }
      });
    });

    if (entries.length === 0) {
      return { peak: { value: 0, time: null }, min: { value: 0, time: null } };
    }

    const tolerance = 1e-6;
    const zeroEntries = entries.filter(entry => Math.abs(entry.value) <= tolerance);

    const peakEntry = entries.reduce((max, curr) => {
      if (curr.value > max.value) return curr;
      if (curr.value === max.value) {
        return curr.index < max.index ? curr : max;
      }
      return max;
    }, entries[0]);

    let minEntry;
    if (zeroEntries.length > 0) {
      minEntry = zeroEntries.reduce((best, curr) => (curr.index < best.index ? curr : best));
    } else {
      minEntry = entries.reduce((min, curr) => {
        if (curr.value < min.value) return curr;
        if (curr.value === min.value) {
          return curr.index < min.index ? curr : min;
        }
        return min;
      }, entries[0]);
    }

    return {
      peak: {
        value: peakEntry.value,
        time: peakEntry.time
      },
      min: {
        value: minEntry.value,
        time: minEntry.time
      }
    };
  };

  const energyConsumptionChartData = useMemo(() => {
    if (!energyConsumption) return [];
    return transformDataForCharts(energyConsumption, 'consumption');
  }, [energyConsumption, transformDataForCharts]);

  const formatPeakMinDisplay = useCallback(
    (entry) => {
      if (!entry || entry.value === null || entry.value === undefined || entry.value === '') {
        return { valueText: 'No data', timeText: '' };
      }

      const numericValue = Number(entry.value);
      const displayValue = Number.isFinite(numericValue)
        ? numericValue.toLocaleString(undefined, { maximumFractionDigits: 2 })
        : entry.value;

      const unit = energyConsumption?.unit || '';
      const unitText = unit ? ` ${unit}` : '';
      const valueText = `${displayValue}${unitText}`;

      let timeLabel = '';
      if (entry.time !== undefined && entry.time !== null && entry.time !== '') {
        let formattedTime = entry.time;

        // If it's the current week and time contains date format, convert to weekday
        if (selectedDuration === 'this-week') {
          const targetDate = parseDateFromState(currentDate);
          const selectionStart = new Date(targetDate);
          selectionStart.setHours(0, 0, 0, 0);
          selectionStart.setDate(selectionStart.getDate() - selectionStart.getDay());

          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const currentWeekStart = new Date(today);
          currentWeekStart.setDate(today.getDate() - today.getDay());

          const isSelectedWeekCurrent = selectionStart.getTime() === currentWeekStart.getTime();

          // Check if time contains date format (e.g., "10/11 18" or "10/11")
          const dateTimeMatch = entry.time.match(/^(\d{1,2})\/(\d{1,2})(?:\s+(\d+))?$/);
          if (dateTimeMatch && isSelectedWeekCurrent) {
            const dayNum = Number(dateTimeMatch[1]);
            const monthNum = Number(dateTimeMatch[2]);
            const hour = dateTimeMatch[3];

            const baseDate = parseDateFromState(currentDate);
            const resolvedDate = (() => {
              const candidate = new Date(baseDate.getFullYear(), monthNum - 1, dayNum);
              const diffDays = (candidate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24);
              if (diffDays > 180) {
                candidate.setFullYear(candidate.getFullYear() - 1);
              } else if (diffDays < -180) {
                candidate.setFullYear(candidate.getFullYear() + 1);
              }
              return candidate;
            })();

            const weekdayName = resolvedDate.toLocaleDateString('en-US', { weekday: 'short' });
            formattedTime = hour ? `${weekdayName} ${hour}` : weekdayName;
          }
        }

        timeLabel = `at ${formattedTime}`;
      }

      return {
        valueText,
        timeText: timeLabel
      };
    },
    [energyConsumption, selectedDuration, currentDate]
  );

  const energyConsumptionPeakMin = useMemo(() => {
    if (!energyConsumptionChartData.length) {
      return { peak: { value: null, time: null }, min: { value: null, time: null } };
    }
    return calculatePeakMinFromChartData(energyConsumptionChartData);
  }, [energyConsumptionChartData]);

  const peakConsumptionDisplay = useMemo(
    () => formatPeakMinDisplay(energyConsumptionPeakMin?.peak),
    [energyConsumptionPeakMin, formatPeakMinDisplay]
  );

  const minConsumptionDisplay = useMemo(
    () => formatPeakMinDisplay(energyConsumptionPeakMin?.min),
    [energyConsumptionPeakMin, formatPeakMinDisplay]
  );

  // Loading only while a request is in flight — missing data is empty/error, not infinite Loading
  const consumptionIsLoading = useMemo(() =>
    energyConsumptionLoading || chartLoading.energyConsumption,
    [energyConsumptionLoading, chartLoading.energyConsumption]
  );

  const savingsIsLoading = useMemo(() =>
    energySavingsLoading || chartLoading.energySavings,
    [energySavingsLoading, chartLoading.energySavings]
  );

  // Memoize colors arrays to prevent re-renders
  const consumptionColors = useMemo(() => ['#ff6b6b', '#ff8a80', '#ffcdd2', '#fecaca'], []);
  const savingsColors = useMemo(() => ['#50c878', '#90EE90', '#98FB98', '#87CEEB'], []);

  // Use refs to track previous data and only update when data actually changes
  // This prevents re-renders when parent component re-renders due to donut chart updates
  const prevEnergyConsumptionRef = useRef(null);
  const prevEnergySavingsRef = useRef(null);

  // Only update memoized data if it actually changed (deep comparison)
  const memoizedEnergyConsumption = useMemo(() => {
    const currentStr = JSON.stringify(energyConsumption);
    const prevStr = JSON.stringify(prevEnergyConsumptionRef.current);
    if (currentStr === prevStr && prevEnergyConsumptionRef.current !== null) {
      return prevEnergyConsumptionRef.current; // Return previous reference if data unchanged
    }
    prevEnergyConsumptionRef.current = energyConsumption;
    return energyConsumption;
  }, [energyConsumption]);

  const memoizedEnergySavings = useMemo(() => {
    const currentStr = JSON.stringify(energySavings);
    const prevStr = JSON.stringify(prevEnergySavingsRef.current);
    if (currentStr === prevStr && prevEnergySavingsRef.current !== null) {
      return prevEnergySavingsRef.current; // Return previous reference if data unchanged
    }
    prevEnergySavingsRef.current = energySavings;
    return energySavings;
  }, [energySavings]);


  // Don't include globalLoading - it causes re-renders when other charts complete
  const isPeakMinLoading = useMemo(() =>
    energyConsumptionLoading ||
    peakMinConsumptionLoading ||
    chartLoading.peakMinConsumption,
    [energyConsumptionLoading, peakMinConsumptionLoading, chartLoading.peakMinConsumption]
  );

  const renderPeakMinLoader = () => (
    <div
      style={{
        width: '20px',
        height: '20px',
        border: '2px solid #555',
        borderTop: '2px solid #fff',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto'
      }}
    />
  );

  // Isolated wrapper component for line charts - completely isolated from parent re-renders
  const IsolatedLineChart = React.memo(({ chartProps }) => {
    return <EnergyLineChart {...chartProps} />;
  }, (prevProps, nextProps) => {
    // Only re-render if props object reference changed (which we control via useMemo)
    return prevProps.chartProps === nextProps.chartProps;
  });

  // Update the EnergyLineChart component to handle combined areas
  // Memoized to prevent re-renders when other charts update
  const EnergyLineChart = React.memo(({ title, data, colors = ['#e57373', '#64b5f6', '#81c784', '#ffd54f'], onEmail, onDownload, isLoading = false }) => {
    const chartType = title === 'Consumption' ? 'consumption' : 'other';

    // Memoize the chart data transformation to prevent unnecessary recalculations
    const chartData = useMemo(() => {
      if (!data) return [];
      return transformDataForCharts(data, chartType);
    }, [data, chartType, transformDataForCharts]);

    // Get dynamic unit from API response - no fallback, use only what backend provides
    const dynamicUnit = data?.unit || '';

    // Get max_limit from API response for y-axis domain (consumption and savings charts)
    const yAxisLimit = data?.max_limit;

    // Calculate peak/min from chart data for consumption charts
    const calculatedPeakMin = useMemo(() => {
      return chartType === 'consumption' ? calculatePeakMinFromChartData(chartData) : null;
    }, [chartData, chartType]);

    const formatXAxisLabel = useCallback((value, index) => {
      if (!value) {
        return value;
      }

      const parseLabelToDate = (label) => {
        const baseDate = parseDateFromState(currentDate);
        let match = label.match(/^(\d{1,2})\/(\d{1,2})(?:\s+\d+)?$/);
        if (match) {
          const day = Number(match[1]);
          const monthIndex = Number(match[2]) - 1;
          if (monthIndex >= 0) {
            const candidate = new Date(baseDate.getFullYear(), monthIndex, day);
            const diffDays = (candidate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24);
            if (diffDays > 180) {
              candidate.setFullYear(candidate.getFullYear() - 1);
            } else if (diffDays < -180) {
              candidate.setFullYear(candidate.getFullYear() + 1);
            }
            return candidate;
          }
        }

        match = label.match(/^([A-Za-z]{3})-([1-4])$/);
        if (match) {
          const monthIndex = MONTH_NAME_TO_INDEX[match[1]];
          if (monthIndex !== undefined) {
            return new Date(currentYear, monthIndex, 1);
          }
        }

        match = label.match(/^(\d{1,2})\/(\d{4})-([1-4])$/);
        if (match) {
          const monthIndex = Number(match[1]) - 1;
          const year = Number(match[2]);
          if (monthIndex >= 0) {
            return new Date(year, monthIndex, 1);
          }
        }

        return null;
      };

      if (selectedDuration === 'this-week') {
        const targetDate = parseDateFromState(currentDate);
        const selectionStart = new Date(targetDate);
        selectionStart.setHours(0, 0, 0, 0);
        selectionStart.setDate(selectionStart.getDate() - selectionStart.getDay());

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const currentWeekStart = new Date(today);
        currentWeekStart.setDate(today.getDate() - today.getDay());

        const isSelectedWeekCurrent = selectionStart.getTime() === currentWeekStart.getTime();

        const weekEnd = new Date(selectionStart);
        weekEnd.setDate(selectionStart.getDate() + 6);

        const labelDate = parseLabelToDate(value);
        if (labelDate && (labelDate < selectionStart || labelDate > weekEnd)) {
          return '';
        }

        if (isSelectedWeekCurrent && value.includes('/')) {
          if (labelDate) {
            return labelDate.toLocaleDateString('en-US', { weekday: 'short' });
          }
        }
      }

      const isCustomOrWeekOrYear = selectedDuration === 'custom' || selectedDuration === 'this-week' || selectedDuration === 'this-year';

      if (isCustomOrWeekOrYear) {
        const leadingDayMatch = value.match(/^([A-Za-z]{3})/);
        if (leadingDayMatch) {
          return leadingDayMatch[1];
        }

        const customDateMatch = value.match(/^(\d{1,2}\/\d{1,2})/);
        if (customDateMatch) {
          return customDateMatch[1];
        }
      }

      if (selectedDuration === 'this-day') {
        // For this-day, only show hourly labels (00:00, 01:00, ..., 23:00)
        // Hide 23:59 label but keep the data point visible in the graph
        if (value === '23:59') {
          return ''; // Hide 23:59 label - data point will still be rendered in graph
        }
        // Only show labels that are on the hour (minutes are 00)
        const timeMatch = value.match(/^(\d{2}):(\d{2})$/);
        if (timeMatch) {
          const minutes = parseInt(timeMatch[2], 10);
          // Show only hourly labels (00:00, 01:00, 02:00, ..., 23:00)
          // This ensures exactly 24 labels while all data points (including 23:59) are shown in graph
          if (minutes === 0) {
            return value;
          }
          return ''; // Hide non-hourly labels (15, 30, 45 minutes) - data points still rendered
        }
        return value;
      } else if (chartData.length === 28) {
        const dayHourMatch = value.match(/^(\w+)\s+(\d+)$/);
        if (dayHourMatch) {
          const dayName = dayHourMatch[1];
          return dayName;
        }
        const dateHourMatch = value.match(/^(\d+)\/(\d+)\s+(\d+)$/);
        if (dateHourMatch) {
          const dayNum = Number(dateHourMatch[1]);
          const monthNum = Number(dateHourMatch[2]);
          const hour = dateHourMatch[3];

          const baseDate = parseDateFromState(currentDate);
          const resolvedDate = (() => {
            const candidate = new Date(baseDate.getFullYear(), monthNum - 1, dayNum);
            const diffDays = (candidate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24);
            if (diffDays > 15) {
              candidate.setFullYear(candidate.getFullYear() - 1);
            } else if (diffDays < -15) {
              candidate.setFullYear(candidate.getFullYear() + 1);
            }
            return candidate;
          })();

          const startOfWeek = new Date(baseDate);
          startOfWeek.setDate(baseDate.getDate() - baseDate.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          endOfWeek.setHours(23, 59, 59, 999);

          const isCurrentWeekRange =
            selectedDuration === 'this-week' &&
            resolvedDate >= startOfWeek &&
            resolvedDate <= endOfWeek;

          if (isCurrentWeekRange) {
            const dayLabel = resolvedDate.toLocaleDateString('en-US', { weekday: 'short' });
            return dayLabel;
          }

          const fallbackLabel = `${dayNum}/${monthNum}`;
          return fallbackLabel;
        }
      } else if (value.includes('/') && value.includes('-')) {
        const quarterlyMatch = value.match(/^(\d+)\/(\d+)-(\d+)$/);
        if (quarterlyMatch) {
          const month = quarterlyMatch[1];
          const year = quarterlyMatch[2];
          const quarter = quarterlyMatch[3];
          return quarter === '1' ? `${month}/${year}` : '';
        }
      } else if (chartData.length === 48 || selectedDuration === 'this-year') {
        const yearStart = new Date(currentYear, 0, 1);
        const yearEnd = new Date(currentYear, 11, 31);
        const labelDate = parseLabelToDate(value);
        if (labelDate && (labelDate < yearStart || labelDate > yearEnd)) {
          return '';
        }

        if (value.includes('-') && !value.includes('/')) {
          const yearMatch = value.match(/^(\w+)-(\d+)$/);
          if (yearMatch) {
            const monthName = yearMatch[1];
            const quarter = yearMatch[2];
            return quarter === '1' ? monthName : '';
          }
        }
        return value;
      }

      return value;
    }, [chartData.length, selectedDuration, currentDate]);

    // Remove unnecessary chartKey re-render to prevent flickering
    // The chart will re-render automatically when data changes

    // Show loading state if chart is loading
    if (isLoading) {
      return (
        <div style={{
          backgroundColor: 'rgba(128, 120, 100, 0.6)',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '20px',
          border: '1px solid #ccc',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h3 style={chartHeaderStyle}>{title}</h3>
            <div style={{ position: 'relative' }}>
              {/* Export button hidden */}
              {/* <button
                onClick={() => setShowExportDropdown(prev => ({ ...prev, [title]: !prev[title] }))}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                Export
              </button> */}
            </div>
          </div>
          <ChartLoader height="300px" message={`Loading ${title} data...`} />
        </div>
      );
    }

    // Chart configuration based on data point count and format
    const getChartConfig = () => {
      const dataPointCount = chartData.length;

      // Check if we have date/hour format (e.g., "1/8 6", "1/8 12") or quarterly format (e.g., "8/2025-1")
      const hasDateHourFormat = chartData.length > 0 && chartData[0].date &&
        (chartData[0].date.includes(' ') || chartData[0].date.includes('-'));


      // This Day & Previous Day: 96 or 97 points (24 hours × 4 intervals per hour, + optional 23:59)
      // Show 24 hourly labels on x-axis (00:00, 01:00, ..., 23:00) while displaying all data points in the graph
      if (dataPointCount === 96 || dataPointCount === 97) {
        return {
          xAxisInterval: 3, // Show every 4th tick (every hour: 00:00, 01:00, 02:00, ..., 23:00)
          xAxisTickCount: 24, // Show 24 hourly ticks (excludes 23:59 if present)
          xAxisFontSize: 10,
          dotSize: 1.5,
          activeDotSize: 3,
          strokeWidth: 1.5
        };
      }
      // Week data: 28-29 points (7 days × 4 hours per day, with possible extra point)
      else if (dataPointCount === 28 || dataPointCount === 29) {
        // Check if we have date/hour format (previous week) or day names (current week)
        const hasDateHourFormat = chartData.length > 0 && chartData[0].date && chartData[0].date.includes('/');

        if (hasDateHourFormat) {
          // Previous week: Show only date labels (31/8, 1/9, 2/9, etc.) but keep all data points in graph
          return {
            xAxisInterval: 3, // Show every 4th tick (every day - first time value of each day)
            xAxisTickCount: 7, // Show 7 ticks for 7 days
            xAxisFontSize: 10,
            dotSize: 3,
            activeDotSize: 5,
            strokeWidth: 2
          };
        } else {
          // Current week: Show only main day points (Sun 0, Mon 0, Tue 0, etc.)
          return {
            xAxisInterval: 3, // Show every 4th tick (every day)
            xAxisTickCount: 7, // Show 7 ticks for 7 days
            xAxisFontSize: 10,
            dotSize: 4,
            activeDotSize: 6,
            strokeWidth: 2
          };
        }
      }
      // Monthly data: 30-31 points (daily format) - show all days
      // This applies to both "This Month" and "Previous Month" navigation
      else if (dataPointCount >= 30 && dataPointCount <= 31) {
        return {
          xAxisInterval: 0, // Show all ticks (all days)
          xAxisTickCount: dataPointCount, // Show all ticks for all days
          xAxisFontSize: 8, // Smaller font for more labels
          dotSize: 3,
          activeDotSize: 5,
          strokeWidth: 2
        };
      }
      // This Year: 48 points (12 months × 4 intervals per month)
      else if (dataPointCount === 48) {
        return {
          xAxisInterval: 3, // Show every 4th tick (every month)
          xAxisTickCount: 12, // Show 12 ticks for 12 months
          xAxisFontSize: 8, // Smaller font for quarterly labels
          dotSize: 2,
          activeDotSize: 4,
          strokeWidth: 2
        };
      }
      // Custom period with quarterly format (8/2025-1, 8/2025-2, etc.)
      else if (hasDateHourFormat && chartData.length > 0 && chartData[0].date && chartData[0].date.includes('/') && chartData[0].date.includes('-')) {
        return {
          xAxisInterval: 3, // Show every 4th tick (one per month)
          xAxisTickCount: Math.ceil(dataPointCount / 4), // Show one tick per month
          xAxisFontSize: 8,
          dotSize: 2,
          activeDotSize: 4,
          strokeWidth: 2
        };
      }
      // Custom period with more than 31 days: Quarterly format (8/2025-1, 8/2025-2, etc.)
      else if (dataPointCount > 31 && hasDateHourFormat) {
        return {
          xAxisInterval: 3, // Show every 4th tick (one per month)
          xAxisTickCount: Math.ceil(dataPointCount / 4), // Show one tick per month
          xAxisFontSize: 8,
          dotSize: 2,
          activeDotSize: 4,
          strokeWidth: 2
        };
      }
      // Custom year data: Multiple months with date/hour format
      else if (dataPointCount > 48 && hasDateHourFormat) {
        return {
          xAxisInterval: 3, // Show every 4th tick (every month)
          xAxisTickCount: Math.ceil(dataPointCount / 4), // Approximate months
          xAxisFontSize: 8,
          dotSize: 2,
          activeDotSize: 4,
          strokeWidth: 2
        };
      }
      // Default configuration for other cases
      else {
        return {
          xAxisInterval: 0,
          xAxisTickCount: Math.min(dataPointCount, 12),
          xAxisFontSize: 10,
          dotSize: 3,
          activeDotSize: 5,
          strokeWidth: 2
        };
      }
    };

    const chartConfig = getChartConfig();

    // Generate a larger color palette to avoid repetition
    const generateColorPalette = (count) => {
      // Special handling for Savings chart - only use green colors for combined areas (5+ areas)
      if (title === 'Savings' && selectedAreas.length >= 5) {
        const greenColors = ['#10B981', '#059669', '#047857', '#065f46', '#064e3b', '#22C55E', '#16A34A', '#15803D', '#166534', '#14532D', '#052e16', '#0f172a'];
        return greenColors.slice(0, count);
      }

      // Special handling for Consumption chart - only use red colors for combined areas (5+ areas)
      if (title === 'Consumption' && selectedAreas.length >= 5) {
        const redColors = ['#EF4444', '#DC2626', '#B91C1C', '#991B1B', '#7f1d1d', '#F87171', '#FCA5A5', '#FECACA', '#FEE2E2', '#FEF2F2', '#450a0a', '#7f1d1d'];
        return redColors.slice(0, count);
      }

      // Check if we have less than 5 areas for diverse colors, or 5+ for themed colors
      // FIXED: Changed from 4 to 5 to match the user's requirement
      const hasLessThan5Areas = selectedAreas.length < 5;
      const has5OrMoreAreas = selectedAreas.length >= 5;


      if (hasLessThan5Areas) {
        // Use diverse colors for less than 5 areas
        const diverseColors = [
          '#e57373', '#64b5f6', '#81c784', '#ffd54f', '#ba68c8', '#4db6ac',
          '#ff8a65', '#7986cb', '#aed581', '#ffb74d', '#f06292', '#4fc3f7',
          '#81c784', '#fff176', '#e1bee7', '#b2dfdb', '#ffcc02', '#ff8a80',
          '#82b1ff', '#b9f6ca', '#ffe082', '#d1c4e9', '#c8e6c9', '#ffcdd2',
          '#bbdefb', '#c5cae9', '#f8bbd9', '#dcedc8', '#fff9c4', '#ffecb3'
        ];

        // Return diverse colors based on count needed
        if (count <= diverseColors.length) {
          return diverseColors.slice(0, count);
        }

        // Generate additional diverse colors if needed
        const additionalColors = [];
        for (let i = diverseColors.length; i < count; i++) {
          const hue = (i * 137.508) % 360; // Golden angle approximation for good distribution
          const saturation = 60 + (i % 20); // Vary saturation between 60-80%
          const lightness = 50 + (i % 20); // Vary lightness between 50-70%
          additionalColors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
        }

        return [...diverseColors, ...additionalColors];
      } else if (has5OrMoreAreas) {
        // Use themed colors for 5 or more areas: Red for consumption, Green for savings
        if (title === 'Savings') {
          return ['#10B981', '#059669', '#047857', '#065f46', '#064e3b', '#064e3b', '#064e3b', '#064e3b', '#064e3b', '#064e3b']; // Green shades for savings
        } else if (title === 'Consumption') {
          return ['#EF4444', '#DC2626', '#B91C1C', '#991B1B', '#7f1d1d', '#7f1d1d', '#7f1d1d', '#7f1d1d', '#7f1d1d', '#7f1d1d']; // Red shades for consumption
        }
      }

      // Default fallback colors for other charts or edge cases
      const baseColors = [
        '#e57373', '#64b5f6', '#81c784', '#ffd54f', '#ba68c8', '#4db6ac',
        '#ff8a65', '#7986cb', '#aed581', '#ffb74d', '#f06292', '#4fc3f7',
        '#81c784', '#fff176', '#e1bee7', '#b2dfdb', '#ffcc02', '#ff8a80',
        '#82b1ff', '#b9f6ca', '#ffe082', '#d1c4e9', '#c8e6c9', '#ffcdd2',
        '#bbdefb', '#c5cae9', '#f8bbd9', '#dcedc8', '#fff9c4', '#ffecb3'
      ];

      // If we need more colors than available, generate them dynamically
      if (count <= baseColors.length) {
        return baseColors.slice(0, count);
      }

      // Generate additional colors if needed
      const additionalColors = [];
      for (let i = baseColors.length; i < count; i++) {
        const hue = (i * 137.508) % 360; // Golden angle approximation for good distribution
        const saturation = 60 + (i % 20); // Vary saturation between 60-80%
        const lightness = 50 + (i % 20); // Vary lightness between 50-70%
        additionalColors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
      }

      return [...baseColors, ...additionalColors];
    };
    // Custom tooltip formatter - ensure exact time display
    const CustomTooltip = ({ active, payload, label }) => {
      if (active && payload && payload.length) {
        // Format tooltip label - convert date format to weekday for current week
        const formatTooltipLabel = (tooltipLabel) => {
          if (!tooltipLabel) return tooltipLabel;

          // If it's the current week and label contains date format, convert to weekday
          if (selectedDuration === 'this-week') {
            const targetDate = parseDateFromState(currentDate);
            const selectionStart = new Date(targetDate);
            selectionStart.setHours(0, 0, 0, 0);
            selectionStart.setDate(selectionStart.getDate() - selectionStart.getDay());

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const currentWeekStart = new Date(today);
            currentWeekStart.setDate(today.getDate() - today.getDay());

            const isSelectedWeekCurrent = selectionStart.getTime() === currentWeekStart.getTime();

            // Check if label contains date format (e.g., "10/11 18" or "10/11")
            const dateTimeMatch = tooltipLabel.match(/^(\d{1,2})\/(\d{1,2})(?:\s+(\d+))?$/);
            if (dateTimeMatch && isSelectedWeekCurrent) {
              const dayNum = Number(dateTimeMatch[1]);
              const monthNum = Number(dateTimeMatch[2]);
              const hour = dateTimeMatch[3];

              const baseDate = parseDateFromState(currentDate);
              const resolvedDate = (() => {
                const candidate = new Date(baseDate.getFullYear(), monthNum - 1, dayNum);
                const diffDays = (candidate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24);
                if (diffDays > 180) {
                  candidate.setFullYear(candidate.getFullYear() - 1);
                } else if (diffDays < -180) {
                  candidate.setFullYear(candidate.getFullYear() + 1);
                }
                return candidate;
              })();

              const weekdayName = resolvedDate.toLocaleDateString('en-US', { weekday: 'short' });
              return hour ? `${weekdayName} ${hour}` : weekdayName;
            }
          }

          return tooltipLabel;
        };

        const formattedLabel = formatTooltipLabel(label);

        return (
          <div style={{
            backgroundColor: '#807864',
            border: '1px solid #fff',
            borderRadius: '4px',
            padding: '10px',
            color: '#fff',
            fontSize: '12px'
          }}>
            <p style={{
              margin: '0 0 8px 0',
              fontWeight: 'bold',
              borderBottom: '1px solid #fff',
              paddingBottom: '4px'
            }}>
              {formattedLabel} {/* This will show the time period label (e.g., "0", "1", "2" for hours or "Sun", "Mon" for days) */}
            </p>
            {payload.map((entry, index) => (
              <p key={index} style={{
                margin: '4px 0',
                color: '#fff',
                fontWeight: '500'
              }}>
                {entry.name}: {entry.value}{dynamicUnit ? ` ${dynamicUnit}` : ''}
              </p>
            ))}
          </div>
        );
      }
      return null;
    };


    // Show loading state if data is being fetched
    if (isLoading) {
      return (
        <div style={{
          padding: '20px',
          backgroundColor: 'rgba(128, 120, 100, 0.6)',
          borderRadius: '8px',
          textAlign: 'center',
          color: '#fff',
          marginBottom: '20px',
          border: '1px solid #ccc'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h3 style={chartHeaderStyle}>{title}</h3>
          </div>
          <div style={{
            height: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: '#767061',
            color: '#fff',
            fontSize: '14px'
          }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '3px solid #555',
                borderTop: '3px solid #fff',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
          </div>
        </div>
      );
    }

    // Only show "No data available" if data has loaded but is empty
    if (!data || !data['x-axis']) {
      return (
        <div style={{
          padding: '20px',
          backgroundColor: 'rgba(128, 120, 100, 0.6)',
          borderRadius: '8px',
          textAlign: 'center',
          color: '#fff',
          marginBottom: '20px',
          border: '1px solid #ccc'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h3 style={chartHeaderStyle}>{title}</h3>
          </div>
          <div style={{
            height: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: '#767061',
            color: '#fff',
            fontSize: '14px'
          }}>
            No data available for {title}
          </div>
        </div>
      );
    }

    const seriesNames = chartData[0] && typeof chartData[0] === 'object'
      ? Object.keys(chartData[0]).filter(key => key !== 'date')
      : [];

    // Debug: Log series names and selected areas to understand the data structure

    // For now, let's use all chart data to see the full x-axis
    // We'll filter later if needed
    const filteredChartData = chartData;

    // Check if we have any non-null values in the entire dataset
    const hasAnyData = chartData.some(dataPoint => {
      return seriesNames.some(seriesName => dataPoint[seriesName] !== null && dataPoint[seriesName] !== undefined);
    });

    // Use the colors prop passed to the component instead of generating new colors
    let uniqueColors = colors.slice(0, seriesNames.length);

    // If we don't have enough colors, extend with generated colors
    if (uniqueColors.length < seriesNames.length) {
      const additionalColors = generateColorPalette(seriesNames.length - uniqueColors.length);
      uniqueColors = [...uniqueColors, ...additionalColors];
    }

    return (
      <div style={{
        backgroundColor: 'rgba(128, 120, 100, 0.6)',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '20px',
        border: '1px solid #ccc',

      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3 style={chartHeaderStyle}>{title}</h3>
          </div>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowExportDropdown(prev => ({ ...prev, [title]: !prev[title] }))}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              📤 Export
            </button>
            {showExportDropdown[title] && (
              <div
                ref={el => exportDropdownRefs.current[title] = el}
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  backgroundColor: '#CDC0A0',
                  border: '1px solid #444',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  zIndex: 1000,
                  minWidth: '180px',
                  padding: '8px 0'
                }}
              >
                <button
                  onClick={onEmail}
                  disabled={exportLoading[`${title}_email`]}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    background: 'none',
                    cursor: exportLoading[`${title}_email`] ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    fontSize: '14px',
                    color: exportLoading[`${title}_email`] ? '#999' : '#fff',
                    fontWeight: '500',
                    borderBottom: '1px solid #444',
                    opacity: exportLoading[`${title}_email`] ? 0.6 : 1
                  }}
                >
                  {exportLoading[`${title}_email`] ? '⏳ Sending...' : 'Send By Email'}
                </button>
                <button
                  onClick={onDownload}
                  disabled={exportLoading[`${title}_download`]}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    background: 'none',
                    cursor: exportLoading[`${title}_download`] ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    fontSize: '14px',
                    color: exportLoading[`${title}_download`] ? '#999' : '#fff',
                    fontWeight: '500',
                    opacity: exportLoading[`${title}_download`] ? 0.6 : 1
                  }}
                >
                  {exportLoading[`${title}_download`] ? '⏳ Downloading...' : 'Download To PC'}
                </button>
              </div>
            )}
          </div>
        </div>
        <div
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}
          onMouseUp={(e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}
          onDoubleClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}
          style={{
            height: '420px',
            minHeight: '380px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: '#767061',
            padding: '10px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none'
          }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={filteredChartData}
              key={`linechart-${title}-${selectedDuration}-${currentDate}`}
              margin={{ top: 20, right: 20, left: 20, bottom: selectedAreas.length <= 2 ? 20 : 40 }}
            >
              <CartesianGrid stroke="#fff" strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                stroke="#fff"
                fontSize={chartConfig.xAxisFontSize}
                tick={{
                  fill: '#fff',
                  fontWeight: 600,
                  fontSize: chartConfig.xAxisFontSize
                }}
                tickFormatter={(value, index) => formatXAxisLabel(value, index)}
                axisLine={{ stroke: '#fff' }}
                tickLine={{ stroke: '#fff' }}
                interval={selectedDuration === 'this-month' ? 0 : (selectedAreas.length <= 2 ? Math.max(chartConfig.xAxisInterval, 1) : chartConfig.xAxisInterval)}
                angle={-45}
                textAnchor="end"
                height={selectedAreas.length <= 2 ? 60 : 50}
                type="category"
                key={`xaxis-${title}-${selectedDuration}`}
                tickCount={chartConfig.xAxisTickCount}
                allowDuplicatedCategory={false}
                scale="point"
                marginLeft={15}
                label={{
                  value: '(Time)',
                  position: 'insideBottomLeft',
                  offset: -5,
                  style: {
                    textAnchor: 'start',
                    fill: '#fff',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }
                }}
              />
              <YAxis
                stroke="#fff"
                fontSize={chartConfig.xAxisFontSize}
                tick={{ fill: '#fff', fontWeight: 600, fontSize: chartConfig.xAxisFontSize }}
                axisLine={{ stroke: '#fff' }}
                tickLine={{ stroke: '#fff' }}
                width={50}
                tickCount={8}
                domain={yAxisLimit !== undefined && yAxisLimit !== null ? [0, yAxisLimit] : undefined}
                label={{
                  value: dynamicUnit ? `(${dynamicUnit})` : '',
                  angle: -90,
                  position: 'insideLeft',
                  offset: 15,
                  style: { textAnchor: 'middle', fill: '#fff', fontSize: '12px', fontWeight: 'bold' }
                }}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: '#fff', strokeWidth: 1 }}
              />
              <Legend
                wrapperStyle={{
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 600,
                  marginTop: '40px',
                  marginBottom: '10px',
                  paddingTop: '10px',
                  paddingBottom: '10px',
                  lineHeight: '1.8'
                }}
                iconType="circle"
              />
              {seriesNames.map((seriesName, index) => (
                <Line
                  key={seriesName}
                  type="monotone"
                  dataKey={seriesName}
                  stroke={uniqueColors[index]}
                  strokeWidth={chartConfig.strokeWidth}
                  dot={(props) => {
                    // Only show dots for non-null values
                    if (props.payload && props.payload[seriesName] !== null && props.payload[seriesName] !== undefined) {
                      return (
                        <circle
                          key={`dot-${index}-${props.index}`}
                          cx={props.cx}
                          cy={props.cy}
                          r={chartConfig.dotSize}
                          fill={uniqueColors[index]}
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      );
                    }
                    return null;
                  }}
                  activeDot={{
                    r: chartConfig.activeDotSize,
                    stroke: '#fff',
                    strokeWidth: 1
                  }}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }, (prevProps, nextProps) => {
    // Custom comparison to prevent re-renders when props haven't meaningfully changed
    // This prevents re-renders when other charts (donut charts) update
    if (prevProps.title !== nextProps.title) return false;
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.colors !== nextProps.colors) return false;
    if (prevProps.onEmail !== nextProps.onEmail) return false;
    if (prevProps.onDownload !== nextProps.onDownload) return false;

    // Deep comparison for data - only re-render if data content actually changed
    // This handles cases where Redux might create new object references with same content
    if (prevProps.data !== nextProps.data) {
      // If references are different, check if content is the same
      if (prevProps.data && nextProps.data) {
        try {
          const prevDataStr = JSON.stringify(prevProps.data);
          const nextDataStr = JSON.stringify(nextProps.data);
          if (prevDataStr === nextDataStr) {
            return true; // Content is same, don't re-render
          }
        } catch (e) {
          // If JSON.stringify fails, fall back to reference equality
        }
      }
      return false; // Data changed, need to re-render
    }

    // All props are equal, don't re-render
    return true;
  });

  // Handle export actions - DISABLED
  const handleExport = async (action, chartTitle, widgetKey = null) => {
    // Export functionality is now enabled
  };

  // Add refs to track export dropdown containers
  const exportDropdownRefs = useRef({})

  // Helper functions for EnergyLineChart export actions - memoized to prevent unnecessary re-renders
  const handleConsumptionEmail = useCallback(async () => {
    try {
      setExportLoading(prev => ({ ...prev, 'Consumption_email': true }));
      setShowExportDropdown(prev => ({ ...prev, 'Consumption': false })); // Close dropdown

      if (!userProfile?.email) {
        showSnackbar('User email not found. Please log in again.', 'error');
        return;
      }

      // CRITICAL FIX: When floors are selected, prioritize floor-level filtering
      const apiParams = {
        // CORRECT LOGIC: If floor is selected, send ONLY floorIds, NOT areaIds
        areaIds: (selectedFloorIds && selectedFloorIds.length > 0) ? [] : (selectedAreas.length > 0 ? selectedAreas : []),
        floorIds: selectedFloorIds && selectedFloorIds.length > 0 ? selectedFloorIds : [],
        timeRange: selectedDuration,
        startDate: customStartDate,
        endDate: customEndDate,
        isNavigating: isNavigating
      };


      const result = await dispatch(sendEnergyConsumptionEmail({
        toEmail: userProfile.email,
        ...apiParams
      }));

      if (result.type.endsWith('/fulfilled')) {
        // Check if payload contains error status
        if (result.payload && typeof result.payload === 'object' && (result.payload.status === 'error' || result.payload.state === 'error')) {
          // API returned error in payload even though action was fulfilled
          const errorMessage = result.payload.message || 'Unknown error occurred';
          showSnackbar(`Email sending failed. Following is the error: ${errorMessage}`, 'error');
        } else {
          // Success
          showSnackbar('Energy Consumption report sent successfully!', 'success');
        }
      } else {
        const errorMessage = result.payload?.message || result.payload || 'Unknown error occurred';
        showSnackbar(`Email sending failed. Following is the error: ${errorMessage}`, 'error');
      }
    } catch (error) {
      // Error sending energy consumption email
      showSnackbar('Failed to send email. Please try again.', 'error');
    } finally {
      setExportLoading(prev => ({ ...prev, 'Consumption_email': false }));
    }
  }, [userProfile, selectedAreas, selectedFloorIds, selectedDuration, customStartDate, customEndDate, isNavigating, dispatch, showSnackbar, setExportLoading]);

  const handleConsumptionDownload = useCallback(async () => {
    try {
      setExportLoading(prev => ({ ...prev, 'Consumption_download': true }));
      setShowExportDropdown(prev => ({ ...prev, 'Consumption': false })); // Close dropdown

      const apiParams = {
        // CRITICAL FIX: When floors are selected, prioritize floor-level filtering
        areaIds: (selectedFloorIds && selectedFloorIds.length > 0) ? [] : (selectedAreas.length > 0 ? selectedAreas : []),
        floorIds: selectedFloorIds && selectedFloorIds.length > 0 ? selectedFloorIds : [],
        timeRange: selectedDuration,
        startDate: customStartDate,
        endDate: customEndDate,
        isNavigating: isNavigating
      };

      const result = await dispatch(downloadEnergyConsumption(apiParams));

      if (result.type.endsWith('/fulfilled')) {
        showSnackbar('Energy Consumption report downloaded successfully!', 'success');
      } else {
        showSnackbar(result.payload || 'Failed to download report. Please try again.', 'error');
      }
    } catch (error) {
      // Error downloading energy consumption
      showSnackbar('Failed to download report. Please try again.', 'error');
    } finally {
      setExportLoading(prev => ({ ...prev, 'Consumption_download': false }));
    }
  }, [selectedAreas, selectedFloorIds, selectedDuration, customStartDate, customEndDate, isNavigating, dispatch, showSnackbar, setExportLoading]);

  const handleSavingsEmail = useCallback(async () => {
    try {
      setExportLoading(prev => ({ ...prev, 'Savings_email': true }));
      setShowExportDropdown(prev => ({ ...prev, 'Savings': false })); // Close dropdown

      if (!userProfile?.email) {
        showSnackbar('User email not found. Please log in again.', 'error');
        return;
      }

      const apiParams = {
        // CRITICAL FIX: When floors are selected, prioritize floor-level filtering
        areaIds: (selectedFloorIds && selectedFloorIds.length > 0) ? [] : (selectedAreas.length > 0 ? selectedAreas : []),
        floorIds: selectedFloorIds && selectedFloorIds.length > 0 ? selectedFloorIds : [],
        timeRange: selectedDuration,
        startDate: customStartDate,
        endDate: customEndDate,
        isNavigating: isNavigating
      };

      const result = await dispatch(sendEnergySavingsEmail({
        toEmail: userProfile.email,
        ...apiParams
      }));

      if (result.type.endsWith('/fulfilled')) {
        // Check if payload contains error status
        if (result.payload && typeof result.payload === 'object' && (result.payload.status === 'error' || result.payload.state === 'error')) {
          // API returned error in payload even though action was fulfilled
          const errorMessage = result.payload.message || 'Unknown error occurred';
          showSnackbar(`Email sending failed. Following is the error: ${errorMessage}`, 'error');
        } else {
          // Success
          showSnackbar('Energy Savings report sent successfully!', 'success');
        }
      } else {
        const errorMessage = result.payload?.message || result.payload || 'Unknown error occurred';
        showSnackbar(`Email sending failed. Following is the error: ${errorMessage}`, 'error');
      }
    } catch (error) {
      // Error sending energy savings email
      showSnackbar('Failed to send email. Please try again.', 'error');
    } finally {
      setExportLoading(prev => ({ ...prev, 'Savings_email': false }));
    }
  }, [userProfile, selectedAreas, selectedFloorIds, selectedDuration, customStartDate, customEndDate, isNavigating, dispatch, showSnackbar, setExportLoading]);

  const handleSavingsDownload = useCallback(async () => {
    try {
      setExportLoading(prev => ({ ...prev, 'Savings_download': true }));
      setShowExportDropdown(prev => ({ ...prev, 'Savings': false })); // Close dropdown

      const apiParams = {
        // CRITICAL FIX: When floors are selected, prioritize floor-level filtering
        areaIds: (selectedFloorIds && selectedFloorIds.length > 0) ? [] : (selectedAreas.length > 0 ? selectedAreas : []),
        floorIds: selectedFloorIds && selectedFloorIds.length > 0 ? selectedFloorIds : [],
        timeRange: selectedDuration,
        startDate: customStartDate,
        endDate: customEndDate,
        isNavigating: isNavigating
      };

      const result = await dispatch(downloadEnergySavings(apiParams));

      if (result.type.endsWith('/fulfilled')) {
        showSnackbar('Energy Savings report downloaded successfully!', 'success');
      } else {
        showSnackbar(result.payload || 'Failed to download report. Please try again.', 'error');
      }
    } catch (error) {
      // Error downloading energy savings
      showSnackbar('Failed to download report. Please try again.', 'error');
    } finally {
      setExportLoading(prev => ({ ...prev, 'Savings_download': false }));
    }
  }, [selectedAreas, selectedFloorIds, selectedDuration, customStartDate, customEndDate, isNavigating, dispatch, showSnackbar, setExportLoading]);

  const handleConsumptionByGroupEmail = async () => {
    try {
      setExportLoading(prev => ({ ...prev, 'Consumption by Group_email': true }));
      setShowExportDropdown(prev => ({ ...prev, 'Consumption By Area Groups': false })); // Close dropdown

      if (!userProfile?.email) {
        showSnackbar('User email not found. Please log in again.', 'error');
        return;
      }

      // Use calculateDateParameters to get correct dates based on selected duration and navigation
      const { startDate, endDate, timeRange } = calculateDateParameters();

      const apiParams = {
        // CRITICAL FIX: When floors are selected, prioritize floor-level filtering
        areaIds: (selectedFloorIds && selectedFloorIds.length > 0) ? [] : (selectedAreas.length > 0 ? selectedAreas : []),
        floorIds: selectedFloorIds && selectedFloorIds.length > 0 ? selectedFloorIds : [],
        timeRange: timeRange,
        startDate: startDate,
        endDate: endDate
      };

      const result = await dispatch(sendTotalConsumptionByGroupEmail({
        toEmail: userProfile.email,
        ...apiParams
      }));

      if (result.type.endsWith('/fulfilled')) {
        // Check if payload contains error status
        if (result.payload && typeof result.payload === 'object' && (result.payload.status === 'error' || result.payload.state === 'error')) {
          // API returned error in payload even though action was fulfilled
          const errorMessage = result.payload.message || 'Unknown error occurred';
          showSnackbar(`Email sending failed. Following is the error: ${errorMessage}`, 'error');
        } else {
          // Success
          showSnackbar('Consumption by Group report sent successfully!', 'success');
        }
      } else {
        const errorMessage = result.payload?.message || result.payload || 'Unknown error occurred';
        showSnackbar(`Email sending failed. Following is the error: ${errorMessage}`, 'error');
      }
    } catch (error) {
      // Error sending consumption by group email
      showSnackbar('Failed to send email. Please try again.', 'error');
    } finally {
      setExportLoading(prev => ({ ...prev, 'Consumption by Group_email': false }));
    }
  };

  const handleConsumptionByGroupDownload = async () => {
    try {
      setExportLoading(prev => ({ ...prev, 'Consumption by Group_download': true }));
      setShowExportDropdown(prev => ({ ...prev, 'Consumption By Area Groups': false })); // Close dropdown

      // Use calculateDateParameters to get correct dates based on selected duration and navigation
      const { startDate, endDate, timeRange } = calculateDateParameters();

      const apiParams = {
        // CRITICAL FIX: When floors are selected, prioritize floor-level filtering
        areaIds: (selectedFloorIds && selectedFloorIds.length > 0) ? [] : (selectedAreas.length > 0 ? selectedAreas : []),
        floorIds: selectedFloorIds && selectedFloorIds.length > 0 ? selectedFloorIds : [],
        timeRange: timeRange,
        startDate: startDate,
        endDate: endDate
      };

      const result = await dispatch(downloadTotalConsumptionByGroup(apiParams));

      if (result.type.endsWith('/fulfilled')) {
        showSnackbar('Consumption by Group report downloaded successfully!', 'success');
      } else {
        showSnackbar(result.payload || 'Failed to download report. Please try again.', 'error');
      }
    } catch (error) {
      // Error downloading consumption by group
      showSnackbar('Failed to download report. Please try again.', 'error');
    } finally {
      setExportLoading(prev => ({ ...prev, 'Consumption by Group_download': false }));
    }
  };








  // Add click outside handler to close export dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if the click is on an export button
      const exportButton = event.target.closest('button');
      const isExportButton = exportButton && exportButton.textContent.includes('📤 Export');

      // Check if the click is inside any export dropdown
      const isInsideDropdown = event.target.closest('div[style*="position: absolute"]') &&
        (event.target.closest('div[style*="position: absolute"]').style.backgroundColor === 'rgb(205, 192, 160)' ||
          event.target.closest('div[style*="position: absolute"]').style.backgroundColor === '#CDC0A0');

      // If not clicking on export button or inside dropdown, close all dropdowns
      if (!isExportButton && !isInsideDropdown) {
        setShowExportDropdown({})
      }
    }

    // Use passive listener to prevent flickering
    document.addEventListener('click', handleClickOutside, { passive: true })
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [])


  // Update the ConsumptionPieChart component to maintain same height
  const ConsumptionPieChart = ({ title, data, onEmail, onDownload, isLoading = false }) => {

    // Show loading state if chart is loading
    if (isLoading) {
      return (
        <div style={{
          backgroundColor: 'rgba(128, 120, 100, 0.6)',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '20px',
          border: '1px solid #ccc'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h3 style={chartHeaderStyle}>{title}</h3>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowExportDropdown(prev => ({ ...prev, [title]: !prev[title] }))}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                📤 Export
              </button>

              {showExportDropdown[title] && (
                <div
                  ref={el => exportDropdownRefs.current[title] = el}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    backgroundColor: '#CDC0A0',
                    border: '1px solid #444',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    zIndex: 1000,
                    minWidth: '180px',
                    padding: '8px 0'
                  }}
                >
                  <button
                    onClick={onEmail}
                    disabled={exportLoading[`${title}_email`]}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'none',
                      border: 'none',
                      color: '#333',
                      cursor: exportLoading[`${title}_email`] ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      opacity: exportLoading[`${title}_email`] ? 0.6 : 1
                    }}
                  >
                    {exportLoading[`${title}_email`] ? '⏳ Sending...' : '📧 Send by Email'}
                  </button>
                  <button
                    onClick={onDownload}
                    disabled={exportLoading[`${title}_download`]}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'none',
                      border: 'none',
                      color: '#333',
                      cursor: exportLoading[`${title}_download`] ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      opacity: exportLoading[`${title}_download`] ? 0.6 : 1
                    }}
                  >
                    {exportLoading[`${title}_download`] ? '⏳ Downloading...' : '💾 Download To PC'}
                  </button>
                </div>
              )}
            </div>
          </div>
          <ChartLoader height="300px" message={`Loading ${title} data...`} />
        </div>
      );
    }

    // Only show "No data available" if data has loaded but is empty (not during loading)
    // Handle both data formats: special_area_groups (old) and data (new backend format)
    const hasData = data && (
      (data.special_area_groups && data.special_area_groups.length > 0) ||
      (data.data && Object.keys(data.data).length > 0)
    );

    if (!hasData) {
      return (
        <div style={{
          backgroundColor: 'rgba(128, 120, 100, 0.6)',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '20px',
          border: '1px solid #ccc'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px'
          }}>
            <h3 style={chartHeaderStyle}>{title}</h3>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowExportDropdown(prev => ({ ...prev, [title]: !prev[title] }))}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                📤 Export
              </button>

              {showExportDropdown[title] && (
                <div
                  ref={el => exportDropdownRefs.current[title] = el}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    backgroundColor: '#CDC0A0',
                    border: '1px solid #444',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    zIndex: 1000,
                    minWidth: '180px',
                    padding: '8px 0'
                  }}
                >
                  <button
                    onClick={onEmail}
                    disabled={exportLoading[`${title}_email`]}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'none',
                      border: 'none',
                      color: '#333',
                      cursor: exportLoading[`${title}_email`] ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      opacity: exportLoading[`${title}_email`] ? 0.6 : 1
                    }}
                  >
                    {exportLoading[`${title}_email`] ? '⏳ Sending...' : '📧 Send by Email'}
                  </button>
                  <button
                    onClick={onDownload}
                    disabled={exportLoading[`${title}_download`]}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'none',
                      border: 'none',
                      color: '#333',
                      cursor: exportLoading[`${title}_download`] ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      opacity: exportLoading[`${title}_download`] ? 0.6 : 1
                    }}
                  >
                    {exportLoading[`${title}_download`] ? '⏳ Downloading...' : '💾 Download To PC'}
                  </button>
                </div>
              )}
            </div>
          </div>
          <div style={{
            height: '300px', // Back to original height
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: '#767061',
            color: '#fff',
            fontSize: '14px'
          }}>
            No data available for {title}
          </div>
        </div>
      );
    }

    // Handle both data formats: special_area_groups (old) and data (new backend format)
    let pieData = [];

    if (data.special_area_groups) {
      // Old format: special_area_groups array (already grouped)
      pieData = data.special_area_groups.map(item => {
        const energyValue = parseFloat(item.actual_energy?.replace(' Wh', '') || '0');
        const backendPercentage = parseFloat(item.consumption_percentage?.replace(' %', '') || '0');
        return {
          name: item.name,
          value: backendPercentage, // Use percentage for chart visualization, not absolute value
          percentage: backendPercentage,
          actual_energy: item.actual_energy,
          consumption_percentage: item.consumption_percentage
        };
      });
    } else if (data.data && areaGroups) {
      // New format: data object with individual area names as keys - GROUP BY AREA GROUPS
      const totalConsumption = Object.values(data.data).reduce((sum, value) => sum + value, 0);

      // Group individual areas by area groups
      const groupedData = {};

      // Initialize grouped data with special area groups
      if (areaGroups.special_area_groups) {
        areaGroups.special_area_groups.forEach(group => {
          groupedData[group.name] = {
            totalConsumption: 0,
            areas: []
          };
        });
      }

      // Group individual areas by their area groups
      Object.entries(data.data).forEach(([areaName, consumptionValue]) => {
        // Find which area group this area belongs to
        let foundGroup = null;

        if (areaGroups.special_area_groups) {
          for (const group of areaGroups.special_area_groups) {
            if (group.areas && group.areas.some(area => area.name === areaName)) {
              foundGroup = group.name;
              break;
            }
          }
        }

        if (foundGroup) {
          groupedData[foundGroup].totalConsumption += consumptionValue;
          groupedData[foundGroup].areas.push({ name: areaName, consumption: consumptionValue });
        } else {
          // If area doesn't belong to any group, create an "Other" group
          if (!groupedData["Other"]) {
            groupedData["Other"] = { totalConsumption: 0, areas: [] };
          }
          groupedData["Other"].totalConsumption += consumptionValue;
          groupedData["Other"].areas.push({ name: areaName, consumption: consumptionValue });
        }
      });

      // Convert grouped data to pie chart format
      pieData = Object.entries(groupedData)
        .filter(([groupName, groupData]) => groupData.totalConsumption > 0) // Only show groups with consumption
        .map(([groupName, groupData]) => {
          // Calculate percentage from totalConsumption relative to overall totalConsumption
          const percentageValue = totalConsumption > 0
            ? (groupData.totalConsumption / totalConsumption * 100)
            : 0;

          // Format actual energy for display
          let actualEnergy;
          if (groupData.totalConsumption >= 1000000) {
            actualEnergy = `${(groupData.totalConsumption / 1000000).toFixed(2)} MWh`;
          } else if (groupData.totalConsumption >= 1000) {
            actualEnergy = `${(groupData.totalConsumption / 1000).toFixed(2)} kWh`;
          } else {
            actualEnergy = `${groupData.totalConsumption.toFixed(2)} Wh`;
          }

          return {
            name: groupName,
            value: percentageValue, // Use percentage value for chart visualization
            percentage: percentageValue,
            actual_energy: actualEnergy,
            consumption_percentage: `${percentageValue.toFixed(2)} %`
          };
        });
    } else if (data.data) {
      // Fallback: if no area groups available, show individual areas
      const totalConsumption = Object.values(data.data).reduce((sum, value) => sum + value, 0);

      pieData = Object.entries(data.data).map(([areaName, consumptionValue]) => {
        const percentage = totalConsumption > 0 ? (consumptionValue / totalConsumption * 100) : 0;
        let actualEnergy;
        if (consumptionValue >= 1000000) {
          actualEnergy = `${(consumptionValue / 1000000).toFixed(2)} MWh`;
        } else if (consumptionValue >= 1000) {
          actualEnergy = `${(consumptionValue / 1000).toFixed(2)} kWh`;
        } else {
          actualEnergy = `${consumptionValue.toFixed(2)} Wh`;
        }

        return {
          name: areaName,
          value: percentage, // Use percentage value for chart visualization
          percentage: percentage,
          actual_energy: actualEnergy,
          consumption_percentage: `${percentage.toFixed(2)} %`
        };
      });
    }

    // Processed pie chart data

    // Color palette for pie chart segments - Bright, vivid colors for better visibility
    const COLORS = ['#E53935', '#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#E91E63', '#00BCD4', '#FFC107'];

    // renderCustomizedLabel function to show backend percentages on pie chart segments
    const renderCustomizedLabel = ({
      cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value
    }) => {
      const RADIAN = Math.PI / 180;

      // Show label for all slices, even small ones - but adjust positioning for very small slices
      if (percent < 0.01) return null; // Only hide if extremely small (less than 1%)

      // Position label outside the arc with more distance
      const radius = outerRadius + 35;
      const x = cx + radius * Math.cos(-midAngle * RADIAN);
      const y = cy + radius * Math.sin(-midAngle * RADIAN);

      // Calculate line end points (where the line connects to the pie slice)
      const lineEndX = cx + (outerRadius + 5) * Math.cos(-midAngle * RADIAN);
      const lineEndY = cy + (outerRadius + 5) * Math.sin(-midAngle * RADIAN);

      // Get the color for this segment
      const segmentColor = COLORS[index % COLORS.length];

      return (
        <g>
          {/* Connecting line */}
          <line
            x1={lineEndX}
            y1={lineEndY}
            x2={x}
            y2={y}
            stroke={segmentColor}
            strokeWidth={2}
            strokeDasharray="none"
          />
          {/* Label text with same color as segment */}
          <text
            x={x}
            y={y}
            fill={segmentColor}
            textAnchor={x > cx ? 'start' : 'end'}
            dominantBaseline="central"
            fontSize={14}
            fontWeight={600}
          >
            {(() => {
              // Find the corresponding item to get backend actual_energy and percentage
              const item = pieData.find(item => item.name === name);
              return `${item?.actual_energy ?? ''} (${item?.consumption_percentage || value + '%'})`;
            })()}
          </text>
        </g>
      );
    };

    return (
      <div style={{
        backgroundColor: 'rgba(128, 120, 100, 0.6)',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '20px',
        border: '1px solid #ccc'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={chartHeaderStyle}>{title}</h3>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowExportDropdown(prev => ({ ...prev, [title]: !prev[title] }))}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              📤 Export
            </button>
            {showExportDropdown[title] && (
              <div
                ref={el => exportDropdownRefs.current[title] = el}
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  backgroundColor: '#CDC0A0',
                  border: '1px solid #444',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  zIndex: 1000,
                  minWidth: '180px',
                  padding: '8px 0'
                }}
              >
                <button
                  onClick={onEmail}
                  disabled={exportLoading[`${title}_email`]}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    background: 'none',
                    cursor: exportLoading[`${title}_email`] ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    fontSize: '14px',
                    color: exportLoading[`${title}_email`] ? '#999' : '#fff',
                    fontWeight: '500',
                    borderBottom: '1px solid #444',
                    opacity: exportLoading[`${title}_email`] ? 0.6 : 1
                  }}
                >
                  {exportLoading[`${title}_email`] ? '⏳ Sending...' : ' Send By Email'}
                </button>
                <button
                  onClick={onDownload}
                  disabled={exportLoading[`${title}_download`]}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    background: 'none',
                    cursor: exportLoading[`${title}_download`] ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    fontSize: '14px',
                    color: exportLoading[`${title}_download`] ? '#999' : '#fff',
                    fontWeight: '500',
                    opacity: exportLoading[`${title}_download`] ? 0.6 : 1
                  }}
                >
                  {exportLoading[`${title}_download`] ? '⏳ Downloading...' : ' Download To PC'}
                </button>
              </div>
            )}
          </div>
        </div>
        <div
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}
          onMouseUp={(e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}
          onDoubleClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}
          style={{
            height: '360px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: '#767061',
            padding: '24px 24px 16px',
            position: 'relative',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none'
          }}>
          <ResponsiveContainer width="100%" height="97%">
            <PieChart margin={{ top: 80, right: 140, bottom: 80, left: 140 }}>
              <Pie
                data={pieData}
                cx="44%"
                cy="52%"
                innerRadius={60}
                outerRadius={110}
                paddingAngle={5}
                dataKey="value"
                labelLine={false}
                label={renderCustomizedLabel}
                isAnimationActive={false}
              >
                {/* Center label for 100% */}
                <Label
                  value="100 %"
                  position="center"
                  fill="#fff"
                  fontSize={34}
                  fontWeight={700}
                  style={{ textShadow: '0 1px 4px #232323' }}
                />
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#807864',
                  border: '1px solid #fff',
                  borderRadius: '4px',
                  color: '#fff',
                  fontSize: '12px'
                }}
                formatter={(value, name) => {
                  const item = pieData.find(item => item.name === name);
                  // Show exact values from backend JSON
                  return [
                    `${item?.actual_energy} (${item?.consumption_percentage})`,
                    name
                  ];
                }}
                labelStyle={{
                  color: '#fff'
                }}
              />
              <Legend
                wrapperStyle={{
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 600,
                  right: 0,
                  top: 0,
                  lineHeight: '1.8'
                }}
                iconType="circle"
                align="right"
                verticalAlign="middle"
                layout="vertical"
                formatter={(value) => value}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Add Savings Strategy Chart component
  // Add Savings Strategy Donut (Recharts, same style as Utilization)
  const SavingsStrategyChart = ({ title, isLoading = false }) => {
    // Show loading state only for this chart's own request
    if (isLoading) {
      return (
        <div style={{
          backgroundColor: 'rgba(128, 120, 100, 0.6)',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '20px',
          border: '1px solid #ccc'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h3 style={chartHeaderStyle}>{title}</h3>
          </div>
          <ChartLoader height="300px" message={`Loading ${title} data...`} />
        </div>
      );
    }

    // Calculate total savings percentage for title (excluding consumption)
    const calculateTotalSavingsPercentage = () => {
      if (!savingsByStrategy) return 0;

      // Handle the API response structure: {status: 'success', data: {...}}
      const raw = savingsByStrategy?.data || savingsByStrategy || {};
      const dataToUse = (!raw || typeof raw !== 'object' || Object.keys(raw).length === 0) ? {
        "Keypad": 0,
        "Sensors": 0,
        "Schedule": 0,
        "GUI": 0,
        "Consumption": 0
      } : raw;

      const entries = Object.entries(dataToUse)
        .map(([name, value]) => ({ name, value: Number(value || 0) }))
        .filter(entry => entry.name !== 'Consumption'); // Exclude Consumption from savings calculation

      const total = entries.reduce((s, d) => s + d.value, 0);
      // Return the exact value from API without rounding
      return total;
    };

    const totalSavingsPercentage = calculateTotalSavingsPercentage();
    const displayTitle = totalSavingsPercentage > 0 ? (
      <span>
        {title} <span style={{ color: '#fff', fontWeight: 'bold' }}>({Number(totalSavingsPercentage).toFixed(1)}%)</span>
      </span>
    ) : title;

    if (!savingsByStrategy) {
      return (
        <div style={{
          backgroundColor: 'rgba(128, 120, 100, 0.6)',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '20px',
          border: '1px solid #ccc'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h3 style={chartHeaderStyle}>{displayTitle}</h3>
            {/* <button
              onClick={() => setShowExportDropdown(prev => ({ ...prev, [title]: !prev[title] }))}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              📤 Export
            </button> */}
          </div>
          <div style={{
            height: '300px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: '#767061',
            color: '#fff',
            fontSize: '14px'
          }}>
            No data available for the selected areas and time range
          </div>
        </div>
      );
    }

    // Handle the API response structure: {status: 'success', data: {...}}
    const raw = savingsByStrategy?.data || savingsByStrategy || {};

    // Check if data is in a transitional state (e.g., during tab switches or duration changes)
    const isTransitionalData = !raw || typeof raw !== 'object' || Object.keys(raw).length === 0 ||
      (raw.status && raw.status === 'error') ||
      (typeof raw === 'object' && Object.values(raw).every(val => val === 0 || val === null || val === undefined));

    // If data is transitional, invalid, or we're in a loading state, show loading instead of rendering with wrong colors
    if (isTransitionalData || isLoading) {
      return (
        <div style={{
          backgroundColor: 'rgba(128, 120, 100, 0.6)',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '20px',
          border: '1px solid #ccc'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h3 style={chartHeaderStyle}>{title}</h3>
          </div>
          <ChartLoader height="300px" message={`Loading ${title} data...`} />
        </div>
      );
    }

    // If raw is empty, use default structure
    const dataToUse = raw;

    const entries = Object.entries(dataToUse)
      .map(([name, value]) => ({ name, value: Number(value || 0) }));

    const total = entries.reduce((s, d) => s + d.value, 0);

    // Show "No data available" message only when data has loaded but total is 0
    if (total === 0) {
      return (
        <div style={{
          backgroundColor: 'rgba(128, 120, 100, 0.6)',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '20px',
          border: '1px solid #ccc'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h3 style={chartHeaderStyle}>{displayTitle}</h3>
            {/* <button
              onClick={() => setShowExportDropdown(prev => ({ ...prev, [title]: !prev[title] }))}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              📤 Export
            </button> */}
          </div>
          <div style={{
            height: '300px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: '#767061',
            color: '#fff',
            fontSize: '14px'
          }}>
            No savings data available for the selected areas and time range
          </div>
        </div>
      );
    }

    // Include only actual API data, no duplicates or extra segments
    const pieData = entries
      .filter(d => d.value > 0) // Only include segments with positive values
      .map(d => ({
        name: d.name,
        value: d.value, // Use exact value from API
        percentage: d.value // Show the exact percentage value from API
      }));


    // Color palette for savings strategy chart - Match legend colors exactly
    const getColorForStrategy = (strategyName) => {
      // Normalize the strategy name to handle variations
      const normalizedName = String(strategyName || '').toLowerCase().trim();

      // ONLY show red for explicit consumption data
      if (normalizedName === 'consumption' || normalizedName.includes('consumption')) {
        return '#E53935'; // Bright red ONLY for consumption
      }

      // Create specific mappings for known strategies - bright colors for visibility
      const strategyColorMap = {
        'keypad': '#4CAF50',     // Green - matches legend
        'sensors': '#2196F3',    // Blue - matches legend
        'schedule': '#FF9800',   // Orange - matches legend
        'gui': '#9C27B0',        // Purple - matches legend
        'combined areas': '#4CAF50', // Green
        'selected areas': '#FFC107', // Amber
        'manual': '#00BCD4',     // Cyan
        'automatic': '#E91E63',  // Pink
        'daylight': '#00ACC1',   // Darker Cyan
        'occupancy': '#7B1FA2',  // Purple
        'timer': '#43A047',      // Green
        'scene': '#F4511E'       // Deep Orange
      };

      // Check if we have a specific mapping for this strategy
      if (strategyColorMap[normalizedName]) {
        return strategyColorMap[normalizedName];
      }

      // Fallback color palette for unknown strategies - bright colors
      const fallbackColors = [
        '#4CAF50', // Green
        '#2196F3', // Blue
        '#FF9800', // Orange
        '#9C27B0', // Purple
        '#E91E63', // Pink
        '#00BCD4', // Cyan
        '#FFC107', // Amber
        '#E53935', // Red
        '#00ACC1', // Darker Cyan
        '#7B1FA2', // Purple
        '#43A047', // Green
        '#F4511E', // Deep Orange
        '#5C6BC0', // Indigo
        '#AD1457', // Pink
        '#00897B', // Teal
        '#D84315'  // Deep Orange
      ];

      // For unknown strategies, use hash-based assignment
      let hash = 0;
      for (let i = 0; i < normalizedName.length; i++) {
        hash = ((hash << 5) - hash + normalizedName.charCodeAt(i)) & 0xffffffff;
      }

      const selectedColor = fallbackColors[Math.abs(hash) % fallbackColors.length];

      // Always return a color for savings strategies
      return selectedColor;
    };
    // Calculate the total from pie data (including consumption)
    const pieTotal = pieData ? pieData.reduce((s, d) => s + d.value, 0) : 0;

    // Calculate savings total (excluding consumption) for center label
    const savingsData = pieData ? pieData.filter(d => d.name.toLowerCase() !== 'consumption') : [];
    const savingsTotal = savingsData.reduce((s, d) => s + d.value, 0);

    // Use the savings percentage for the center label
    const actualSavingsPercentage = savingsTotal;

    // Custom label renderer for pie chart segments - matching Consumption By Area Groups style
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, index }) => {
      const RADIAN = Math.PI / 180;
      const percent = value;

      // Show label only for positive values to prevent overlapping
      if (percent <= 0) return null; // Hide if zero or negative

      // Position label outside the arc with adequate distance to prevent overlapping
      const radius = outerRadius + 35;
      const x = cx + radius * Math.cos(-midAngle * RADIAN);
      const y = cy + radius * Math.sin(-midAngle * RADIAN);

      // Calculate line end points (where the line connects to the pie slice)
      const lineEndX = cx + (outerRadius + 5) * Math.cos(-midAngle * RADIAN);
      const lineEndY = cy + (outerRadius + 5) * Math.sin(-midAngle * RADIAN);

      // Get the color for this segment - use the same color as the segment
      const segmentColor = getColorForStrategy(pieData && pieData[index]?.name);

      // Determine text anchor based on position to prevent cutoff
      let textAnchor = 'middle';
      if (x > cx + 20) textAnchor = 'start';
      else if (x < cx - 20) textAnchor = 'end';

      return (
        <g>
          {/* Connecting line */}
          <line
            x1={lineEndX}
            y1={lineEndY}
            x2={x}
            y2={y}
            stroke={segmentColor}
            strokeWidth={2}
            strokeDasharray="none"
          />
          {/* Label text with same color as segment */}
          <text
            x={x}
            y={y}
            fill={segmentColor}
            textAnchor={textAnchor}
            dominantBaseline="central"
            fontSize={12}
            fontWeight={600}
            style={{
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              pointerEvents: 'none'
            }}
          >
            {`${Number(value).toFixed(1)}%`}
          </text>
        </g>
      );
    };

    return (
      <div style={{
        backgroundColor: 'rgba(128, 120, 100, 0.6)',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '20px',
        border: '1px solid #ccc'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={chartHeaderStyle}>{title}</h3>
        </div>

        <div
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}
          onMouseUp={(e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}
          onDoubleClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}
          style={{
            height: '360px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: '#767061',
            padding: '24px 24px 16px',
            position: 'relative',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none'
          }}>
          <ResponsiveContainer width="100%" height="97%">
            <PieChart margin={{ top: 80, right: 140, bottom: 80, left: 140 }}>
              <Pie
                data={pieData || []}
                cx="44%"
                cy="52%"
                innerRadius={60}
                outerRadius={110}
                paddingAngle={5}
                dataKey="value"
                labelLine={true}
                label={renderCustomizedLabel}
                isAnimationActive={false}
                minAngle={1}
              >
                <Label
                  value={`${Number(actualSavingsPercentage).toFixed(1)} %`}
                  position="center"
                  fill="#fff"
                  fontSize={30}
                  fontWeight={700}
                  style={{ textShadow: '0 1px 4px #232323' }}
                />
                {pieData && pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColorForStrategy(entry.name)} />
                ))}
              </Pie>

              <Tooltip
                contentStyle={{
                  backgroundColor: '#807864',
                  border: '1px solid #fff',
                  borderRadius: '4px',
                  color: '#fff',
                  fontSize: '12px'
                }}
                formatter={(value, name) => [
                  `${Number(value).toFixed(2)}%`,
                  name
                ]}
                labelStyle={{
                  color: '#fff'
                }}
              />

              <Legend
                wrapperStyle={{
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 600,
                  right: 0,
                  top: 0,
                  lineHeight: '1.8'
                }}
                iconType="circle"
                align="right"
                verticalAlign="middle"
                layout="vertical"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Add the missing renderLightingPowerDensity function
  const renderLightingPowerDensity = () => {
    // Show loading state only while this chart's own request is in flight
    if (chartLoading.lightPowerDensity) {
      return (
        <div style={{
          backgroundColor: '#232323',
          borderRadius: '4px',
          padding: '30px',
          textAlign: 'center',
        }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid #555',
              borderTop: '3px solid #fff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
        </div>
      );
    }

    // Handle the actual API response structure
    let value = 0;
    let unit = lightingUnit;

    if (lightPowerDensity && lightPowerDensity.status === 'success') {
      if (lightingUnit === 'Watt / Sq ft') {
        // Use the exact API value and unit from backend
        value = lightPowerDensity.watt_per_sqft;
        unit = lightPowerDensity.unit || '';
      } else if (lightingUnit === 'Watt / Sq m') {
        // Use the exact API value and unit from backend
        value = lightPowerDensity.watt_per_sqm;
        unit = lightPowerDensity.unit || '';
      }

      // Handle null/undefined values
      if (value === null || value === undefined) {
        value = 'No data';
        unit = '';
      }
    } else {
      // When no data is available, show "No data"
      value = 'No data';
      unit = '';
    }

    return (
      <div style={{
        backgroundColor: '#232323',
        borderRadius: '12px',
        padding: '24px 20px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{
          fontSize: isLargeScreen ? '20px' : '18px',
          fontWeight: 700,
          color: '#fff',
          marginBottom: '6px',
          lineHeight: 1.25,
          wordWrap: 'break-word',
          overflow: 'hidden',
          fontFamily: 'inherit'
        }}>
          {value} {unit}
        </div>
        <div style={{
          fontSize: isLargeScreen ? '12px' : '11px',
          color: '#ccc',
          fontWeight: 500,
          fontFamily: 'inherit'
        }}>
          {/* Additional context can be added here */}
        </div>
      </div>
    );
  };

  // Add the missing getAreaSelectionText function
  const getAreaSelectionText = () => {
    // Priority 1: Check Redux state first for committed selections
    // If floors are selected in Redux (already committed with Set button)
    if (selectedFloorIds && selectedFloorIds.length > 0) {
      if (selectedFloorIds.length === 1) {
        const floor = floors.find(f => f.id === selectedFloorIds[0]);
        if (floor) {
          return floor.floor_name || floor.name || `Floor ${selectedFloorIds[0]}`;
        }
      } else {
        // Show count for multiple floors
        return `${selectedFloorIds.length} Floors Selected`;
      }
    }

    // Priority 2: Check local state for pending selections (before Set button)
    // If floors are selected locally, show floor names (even if areas are also selected)
    if (localSelectedFloorIds.length > 0) {
      if (localSelectedFloorIds.length === 1) {
        const floor = floors.find(f => f.id === localSelectedFloorIds[0]);
        if (floor) {
          return floor.floor_name || floor.name || `Floor ${localSelectedFloorIds[0]}`;
        }
      } else {
        // Show count for multiple floors
        return `${localSelectedFloorIds.length} Floors Selected`;
      }
    }

    // Priority 3: If groups are selected, show group info
    if (localSelectedGroups.length > 0) {
      if (localSelectedGroups.length === 1) {
        return `1 Group Selected`;
      } else {
        return `${localSelectedGroups.length} Groups Selected`;
      }
    }

    // Priority 4: If individual areas are selected, show area info
    // Use localSelectedAreas for display, but fall back to Redux selectedAreas for actual data
    const displayAreas = localSelectedAreas.length > 0 ? localSelectedAreas : selectedAreas;

    // Check if no areas are selected and no floor selected, show project name
    if (displayAreas.length === 0 && localSelectedFloorIds.length === 0 && localSelectedGroups.length === 0 && (!selectedFloorIds || selectedFloorIds.length === 0)) {
      // Show the first project name available in the list
      if (areaTree && areaTree.tree && areaTree.tree.length > 0) {
        return areaTree.tree[0].name || 'Project Name';
      }
      return 'Project Name';
    } else if (displayAreas.length === 1) {
      // For single area, try to find the specific area name
      if (areaTree && areaTree.tree && areaTree.tree.length > 0) {
        const findAreaName = (nodes, targetAreaId) => {
          for (const node of nodes) {
            // Check if this node is the target area
            if (node.area_id === targetAreaId) {
              return node.name || `Area ${targetAreaId}`;
            }
            // Check if this node has the target area as a child
            if (node.children && node.children.length > 0) {
              const childResult = findAreaName(node.children, targetAreaId);
              if (childResult) return childResult;
            }
          }
          return null;
        };

        const areaName = findAreaName(areaTree.tree, displayAreas[0]);
        if (areaName) {
          return areaName;
        }
      }
      return '1 Area Selected';
    } else {
      // For multiple areas, try to find the most specific parent that contains ALL areas under it
      if (areaTree && areaTree.tree && areaTree.tree.length > 0) {
        const findCompleteParent = (nodes, selectedAreaIds) => {
          let bestMatch = null;

          const checkNode = (node) => {
            // Get all area IDs under this node
            const getAllAreaIds = (node) => {
              let areaIds = [];
              if (node.area_id) {
                areaIds.push(node.area_id);
              }
              if (node.children && node.children.length > 0) {
                node.children.forEach(child => {
                  areaIds = areaIds.concat(getAllAreaIds(child));
                });
              }
              return areaIds;
            };

            const nodeAreaIds = getAllAreaIds(node);

            // Only consider this node if ALL areas under it are selected (not just some)
            const allAreasUnderNodeSelected = nodeAreaIds.every(areaId => displayAreas.includes(areaId));
            const allSelectedAreasUnderNode = displayAreas.every(areaId => nodeAreaIds.includes(areaId));

            if (allAreasUnderNodeSelected && allSelectedAreasUnderNode && displayAreas.length > 0) {
              // This node has ALL its areas selected and ALL selected areas are under it
              if (!bestMatch || nodeAreaIds.length < getAllAreaIds(bestMatch).length) {
                bestMatch = node;
              }
            }

            // Check children
            if (node.children && node.children.length > 0) {
              node.children.forEach(checkNode);
            }
          };

          nodes.forEach(checkNode);
          return bestMatch ? (bestMatch.name || bestMatch.area_code) : null;
        };

        // Use selected area IDs directly
        const completeParent = findCompleteParent(areaTree.tree, displayAreas);
        if (completeParent) {
          return completeParent;
        }
      }

      // For multiple areas, show "Combined Areas" if 5 or more areas are selected
      if (displayAreas.length >= 5) {
        return 'Combined Areas';
      } else {
        return `${displayAreas.length} Areas Selected`;
      }
    }
  };

  // Add the missing getNavigationButtonText function
  const getNavigationButtonText = (direction) => {
    return direction === 'previous' ? 'Previous' : 'Next';
  };

  // Helper function to get widget titles from rename settings
  const getWidgetTitle = (widgetKey, fallbackTitle) => {
    if (!widgetList?.titles) return fallbackTitle;

    const widget = widgetList.titles.find(w => w.key === widgetKey);
    return widget?.title || fallbackTitle;
  };

  // Memoize entire props objects for line charts to prevent re-renders when other charts update
  // Use refs to track previous props and only create new object if something actually changed
  const prevConsumptionPropsRef = useRef(null);
  const prevSavingsPropsRef = useRef(null);

  const consumptionChartProps = useMemo(() => {
    const newProps = {
      title: getWidgetTitle('consumption', 'Consumption'),
      data: memoizedEnergyConsumption,
      colors: consumptionColors,
      onEmail: handleConsumptionEmail,
      onDownload: handleConsumptionDownload,
      isLoading: consumptionIsLoading
    };

    // Compare with previous props - only return new object if something changed
    if (prevConsumptionPropsRef.current) {
      const prev = prevConsumptionPropsRef.current;
      if (
        prev.title === newProps.title &&
        prev.data === newProps.data &&
        prev.colors === newProps.colors &&
        prev.onEmail === newProps.onEmail &&
        prev.onDownload === newProps.onDownload &&
        prev.isLoading === newProps.isLoading
      ) {
        return prevConsumptionPropsRef.current; // Return previous reference if nothing changed
      }
    }

    prevConsumptionPropsRef.current = newProps;
    return newProps;
  }, [memoizedEnergyConsumption, consumptionColors, handleConsumptionEmail, handleConsumptionDownload, consumptionIsLoading, widgetList]);

  const savingsChartProps = useMemo(() => {
    const newProps = {
      title: getWidgetTitle('savings', 'Savings'),
      data: memoizedEnergySavings,
      colors: savingsColors,
      onEmail: handleSavingsEmail,
      onDownload: handleSavingsDownload,
      isLoading: savingsIsLoading
    };

    // Compare with previous props - only return new object if something changed
    if (prevSavingsPropsRef.current) {
      const prev = prevSavingsPropsRef.current;
      if (
        prev.title === newProps.title &&
        prev.data === newProps.data &&
        prev.colors === newProps.colors &&
        prev.onEmail === newProps.onEmail &&
        prev.onDownload === newProps.onDownload &&
        prev.isLoading === newProps.isLoading
      ) {
        return prevSavingsPropsRef.current; // Return previous reference if nothing changed
      }
    }

    prevSavingsPropsRef.current = newProps;
    return newProps;
  }, [memoizedEnergySavings, savingsColors, handleSavingsEmail, handleSavingsDownload, savingsIsLoading, widgetList]);

  // Add the missing getCurrentPeriodText function
  const getCurrentPeriodText = () => {
    // Convert currentDate string to Date object
    const currentDateObj = parseDateFromState(currentDate);

    if (selectedDuration === 'this-day') {
      return currentDateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } else if (selectedDuration === 'this-week') {
      const startOfWeek = new Date(currentDateObj);
      startOfWeek.setDate(currentDateObj.getDate() - currentDateObj.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      // Check if both dates are in the same month
      if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
        // Same month: "Sep 14-20, 2025"
        return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}-${endOfWeek.getDate()}, ${startOfWeek.getFullYear()}`;
      } else {
        // Different months: "Sep 30 - Oct 6, 2025"
        return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${startOfWeek.getFullYear()}`;
      }
    } else if (selectedDuration === 'this-month') {
      return currentDateObj.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      });
    } else if (selectedDuration === 'this-year') {
      return currentYear.toString();
    } else if (selectedDuration === 'custom') {
      if (customStartDate && customEndDate) {
        const startDate = new Date(customStartDate);
        const endDate = new Date(customEndDate);
        if (startDate.toDateString() === endDate.toDateString()) {
          return startDate.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        } else {
          // Check if both dates are in the same month and year
          if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
            // Same month and year: "Sep 14-20, 2025"
            return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}-${endDate.getDate()}, ${startDate.getFullYear()}`;
          } else if (startDate.getFullYear() === endDate.getFullYear()) {
            // Same year, different months: "Sep 30 - Oct 6, 2025"
            return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${startDate.getFullYear()}`;
          } else {
            // Different years: "Dec 30, 2024 - Jan 5, 2025"
            return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
          }
        }
      }
    }
    return '';
  };


  return (
    <div onClick={(e) => e.stopPropagation()}>
      {/* Fixed Header Section - Static Controls */}
      <Box
        sx={{
          position: 'fixed',
          top: '60px',
          left: 0,
          right: 0,
          backgroundColor: backgroundColor,
          p: 0,
          zIndex: 999,

        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: '100%',
            mx: 'auto',
            px: { xs: 1, sm: 2, md: 3, lg: 6, xl: 8, '2xl': 10 },
            py: { xs: 1, md: 2 },


          }}
        >
          {/* Top Row - Dropdowns and Tabs Side by Side */}
          <Grid
            container
            spacing={{ xs: 1, sm: 2, md: 2, lg: 3, xl: 4 }}
            alignItems="center"
            wrap="wrap"


          >
            {/* Select Floor and Areas Dropdown */}
            {activeTab !== 'alerts' && activeTab !== 'overview' && (
              <Grid item xs={12} sm={6} md={3} lg={3} xl={2}>
                <div style={{ width: '100%', position: 'relative' }} ref={areaDropdownRef}>
                  <div
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowAreaDropdown(!showAreaDropdown);
                    }}
                    style={{
                      width: '100%',
                      minWidth: '240px',
                      padding: '8px 10px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      backgroundColor: 'white',
                      fontSize: '13px',
                      fontWeight: 600,
                      fontFamily: 'inherit',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span
                      style={{
                        flex: 1,
                        whiteSpace: 'nowrap',
                        marginRight: '6px',
                        fontSize: '12px',
                        minWidth: '180px',
                        display: 'inline-block'
                      }}
                      title={getAreaSelectionText()}
                    >
                      {getAreaSelectionText()}
                    </span>
                    <span>▼</span>
                  </div>

                  {showAreaDropdown && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: 'white',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      zIndex: 1002,
                      marginTop: '2px',
                      maxHeight: '400px',
                      overflowY: 'auto',
                      minWidth: isLargeScreen ? '600px' : '550px',
                      width: isLargeScreen ? '600px' : '550px'
                    }}>
                      {floorStatus === 'loading' ? (
                        <div style={{ padding: '10px', textAlign: 'center' }}>
                          Loading floors...
                        </div>
                      ) : hasError ? (
                        <div style={{ padding: '10px', textAlign: 'center', color: 'red' }}>
                          Error loading data. Please try again.
                        </div>
                      ) : getAvailableFloors().length > 0 ? (
                        <>
                          {getAvailableFloors().map(floor => (
                            <div key={floor.id}>
                              <div
                                ref={expandedFloorId === floor.id ? areaTreeContainerRef : null}
                                style={{
                                  padding: '8px 12px',
                                  cursor: 'pointer',
                                  borderBottom: '1px solid #eee',
                                  backgroundColor: localSelectedFloorIds.includes(floor.id) ? '#f8f9fa' : 'transparent',
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  flexDirection: 'column'
                                }}
                              >
                                {/* Floor row */}
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  width: '100%',
                                  marginBottom: localSelectedFloorIds.includes(floor.id) ? '8px' : '0'
                                }}>
                                  {/* Floor checkbox */}
                                  <input
                                    type="checkbox"
                                    className="floor-checkbox"
                                    checked={localSelectedFloorIds.includes(floor.id)}
                                    ref={(el) => {
                                      if (el && localSelectedFloorIds.includes(floor.id) && areaTree) {
                                        const floorAreaIds = getAllAreaIdsFromFloor(areaTree);
                                        const selectedFromThisFloor = floorAreaIds.filter(id => selectedAreas.includes(id));
                                        el.indeterminate = selectedFromThisFloor.length > 0 && selectedFromThisFloor.length < floorAreaIds.length;
                                      }
                                    }}
                                    onChange={(event) => {
                                      event.stopPropagation();
                                      handleFloorCheckboxClick(floor.id, event);
                                    }}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                    }}
                                    style={{
                                      marginRight: '8px',
                                      transform: 'scale(0.8)',
                                      cursor: 'pointer'
                                    }}
                                  />
                                  {/* Floor name */}
                                  <span
                                    data-floor-name="true"
                                    style={{
                                      flex: '1',
                                      cursor: 'pointer',
                                      fontSize: '14px',
                                      fontWeight: 600,
                                      color: '#333',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      maxWidth: '200px'
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleFloorChange(floor.id);
                                    }}
                                    title={floor.floor_name || floor.name}
                                  >
                                    {floor.floor_name || floor.name}
                                  </span>
                                </div>

                                {/* Show area tree if this floor is expanded */}
                                {expandedFloorId === floor.id && areaTree && (
                                  <div style={{
                                    width: '100%',
                                    paddingLeft: '20px',
                                    borderLeft: '2px solid #e0e0e0',
                                    minWidth: '550px'
                                  }}>
                                    {floorLoading ? (
                                      <div style={{ padding: '5px 0', color: '#666', fontSize: '11px' }}>
                                        Loading areas...
                                      </div>
                                    ) : (areaTree.tree || areaTree.areas || []).length > 0 ? (
                                      <div style={{
                                        maxHeight: '200px',
                                        overflowY: 'auto',
                                        overflowX: 'hidden',
                                        padding: '4px 0',
                                        minWidth: '530px'
                                      }}>
                                        {(areaTree.tree || areaTree.areas || []).map(node => renderTreeNode(node))}
                                      </div>
                                    ) : (
                                      <div style={{ padding: '5px 0', color: '#666', fontSize: '11px' }}>
                                        No areas available
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}

                          {/* Clear All and Set buttons if floors, areas, or groups are selected */}
                          {(localSelectedAreas.length > 0 || localSelectedFloorIds.length > 0 || localSelectedGroups.length > 0) && (
                            <div style={{
                              padding: '8px 12px',
                              borderTop: '1px solid #eee',
                              backgroundColor: '#f8f9fa',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  // Clear local state
                                  setLocalSelectedFloorIds([]);
                                  setFloorsWithSelectedAreas(new Set());
                                  setLocalSelectedAreas([]);
                                  setLocalSelectedGroups([]);
                                  setExpandedFloorId(null); // Clear expansion state
                                  setExpandedNodes(new Set()); // Clear expanded nodes

                                  // Clear Redux state to show full project data
                                  dispatch(clearDataCache());
                                  dispatch(setSelectedAreas([]));
                                  dispatch(setSelectedFloorIds([]));
                                  dispatch(setSelectedGroups([]));
                                  dispatch(setSelectedGroupIds([]));
                                  dispatch(setSelectedFloor(null)); // Clear floor selection

                                  // Force API call by clearing previous params
                                  previousApiParamsRef.current = null;

                                  // Close the dropdown after clearing
                                  setShowAreaDropdown(false);
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#666',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                Clear All
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();


                                  // Clear data cache when selection changes to prevent stale data
                                  dispatch(clearDataCache());

                                  // Determine what to send to backend
                                  // CRITICAL FIX: Prioritize floor selection over individual area selection
                                  if (localSelectedFloorIds.length > 0) {
                                    // CASE 1: Floor checkboxes selected
                                    // Send ONLY floor_ids, clear area_ids (even if areas are visually checked)
                                    dispatch(setSelectedAreas([]));
                                    dispatch(setSelectedFloorIds(localSelectedFloorIds));
                                    // Set the first floor for expansion if needed
                                    if (localSelectedFloorIds.length > 0) {
                                      const firstFloor = floors.find(f => f.id === localSelectedFloorIds[0]);
                                      if (firstFloor) {
                                        dispatch(setSelectedFloor(firstFloor));
                                      }
                                    }
                                  } else if (localSelectedAreas.length > 0 || localSelectedGroups.length > 0) {
                                    // CASE 2: Individual areas or groups selected (no floors selected)
                                    // Send ONLY area_ids, clear floor_ids
                                    const finalAreaIds = localSelectedAreas; // Remove area limit to allow all selected areas
                                    // Clear floor selection FIRST to avoid resetting selectedAreas
                                    dispatch(setSelectedFloor(null)); // Clear floor selection
                                    dispatch(setSelectedFloorIds([]));
                                    dispatch(setSelectedAreas(finalAreaIds));

                                    // Handle area groups
                                    if (localSelectedGroups.length > 0) {

                                      // Get all area IDs from selected groups
                                      const allGroupAreaIds = [];
                                      localSelectedGroups.forEach(groupId => {
                                        const groupAreas = getAllAreasFromGroup(groupId);
                                        allGroupAreaIds.push(...groupAreas);
                                      });


                                      // Combine individual areas with group areas
                                      const combinedAreaIds = [...finalAreaIds, ...allGroupAreaIds];
                                      const uniqueAreaIds = [...new Set(combinedAreaIds)]; // Remove duplicates


                                      // Update Redux state with combined areas
                                      dispatch(setSelectedAreas(uniqueAreaIds));
                                      dispatch(setSelectedGroups(localSelectedGroups));
                                      dispatch(setSelectedGroupIds(localSelectedGroups));
                                    } else {
                                      dispatch(setSelectedGroups([]));
                                      dispatch(setSelectedGroupIds([]));
                                    }
                                  } else {
                                    // CASE 3: Nothing selected - clear both
                                    dispatch(setSelectedAreas([]));
                                    dispatch(setSelectedFloorIds([]));
                                    dispatch(setSelectedFloor(null)); // Clear floor selection
                                  }

                                  // Force API call by clearing previous params
                                  previousApiParamsRef.current = null;

                                  // Close the dropdown after setting selection
                                  setShowAreaDropdown(false);
                                }}
                                style={{
                                  background: '#4CAF50',
                                  border: 'none',
                                  color: 'white',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontWeight: 'bold'
                                }}
                              >
                                Set
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div style={{ padding: '10px', textAlign: 'center', color: '#666' }}>
                          {isOperator && floorStatus === 'succeeded'
                            ? 'No floors assigned to your operator account. Please contact your administrator.'
                            : 'No floors available'
                          }
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Grid>
            )}

            {/* Duration Dropdown with Date Navigation below */}
            {activeTab !== 'alerts' && activeTab !== 'overview' && (
              <Grid item xs={12} sm={6} md={3} lg={3} xl={2}>
                <div style={{ width: '100%' }}>
                  {/* Duration Dropdown */}
                  <div style={{ position: 'relative', width: '100%', marginBottom: '3px' }}>
                    <select
                      value={selectedDuration}
                      onChange={handleDurationChange}
                      disabled={globalLoading}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        backgroundColor: globalLoading ? '#f5f5f5' : 'white',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: globalLoading ? 'not-allowed' : 'pointer',
                        opacity: globalLoading ? 0.6 : 1,
                        fontFamily: 'inherit',
                        appearance: 'none',
                        backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 4 5\'><path fill=\'%23666\' d=\'M2 0L0 2h4zm0 5L0 3h4z\'/></svg>")',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 8px center',
                        backgroundSize: '10px',
                        paddingRight: '28px',
                        minHeight: '32px'
                      }}
                    >
                      <option value="">Select Duration</option>
                      <option value="this-day">This Day</option>
                      <option value="this-week">This Week</option>
                      <option value="this-month">This Month</option>
                      <option value="this-year">This Year</option>
                      <option value="custom">Custom Period</option>
                    </select>
                  </div>

                  {/* Date Navigation - positioned directly below duration dropdown */}
                  <div
                    style={{
                      background: 'white',
                      borderRadius: '4px',
                      padding: '4px 6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      border: '1px solid #ccc',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      flexWrap: 'nowrap',
                      minHeight: '32px',
                    }}
                  >
                    {selectedDuration === 'custom' ? (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: isLargeScreen ? '6px' : (isMediumScreen ? '4px' : '2px'),
                        width: '100%',
                        justifyContent: 'center',
                        flexWrap: 'nowrap',
                        minWidth: 0
                      }}>
                        <input
                          type="date"
                          value={customStartDate || ''}
                          onChange={e => dispatch(setCustomDateRange({
                            startDate: e.target.value,
                            endDate: customEndDate
                          }))}
                          style={{
                            padding: isLargeScreen ? '6px' : (isMediumScreen ? '4px' : '3px'),
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            backgroundColor: 'white',
                            fontSize: isLargeScreen ? '12px' : (isMediumScreen ? '11px' : '10px'),
                            fontWeight: 600,
                            fontFamily: 'inherit',
                            minWidth: 0,
                            flex: '1 1 auto',
                            maxWidth: '45%'
                          }}
                        />
                        <span style={{
                          fontWeight: 600,
                          color: '#333',
                          fontSize: isLargeScreen ? '12px' : (isMediumScreen ? '11px' : '10px'),
                          flexShrink: 0,
                          whiteSpace: 'nowrap'
                        }}>to</span>
                        <input
                          type="date"
                          value={customEndDate || ''}
                          onChange={e => dispatch(setCustomDateRange({
                            startDate: customStartDate,
                            endDate: e.target.value
                          }))}
                          style={{
                            padding: isLargeScreen ? '6px' : (isMediumScreen ? '4px' : '3px'),
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            backgroundColor: 'white',
                            fontSize: isLargeScreen ? '12px' : (isMediumScreen ? '11px' : '10px'),
                            fontWeight: 600,
                            fontFamily: 'inherit',
                            minWidth: 0,
                            flex: '1 1 auto',
                            maxWidth: '45%'
                          }}
                        />
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={globalLoading ? undefined : (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handlePrevious();
                          }}
                          disabled={globalLoading}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: globalLoading ? '#ccc' : '#666',
                            cursor: globalLoading ? 'not-allowed' : 'pointer',
                            fontWeight: 500,
                            fontSize: '12px',
                            fontFamily: 'inherit',
                            userSelect: 'none',
                            textAlign: 'center',
                            opacity: globalLoading ? 0.5 : 1,
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            padding: '2px 6px',
                            borderRadius: '2px',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (!globalLoading) {
                              e.target.style.backgroundColor = '#f5f5f5';
                              e.target.style.color = '#333';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                            e.target.style.color = '#666';
                          }}
                          title="Previous"
                        >
                          ‹ Previous
                        </button>
                        <span
                          style={{
                            color: '#333',
                            fontWeight: 500,
                            fontSize: '13px',
                            fontFamily: 'inherit',
                            textAlign: 'center',
                            display: 'inline-block',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            flex: 1,
                            padding: '0 8px',
                          }}
                          title={getCurrentPeriodText()}
                        >
                          {getCurrentPeriodText()}
                        </span>
                        <button
                          onClick={globalLoading ? undefined : (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleNext();
                          }}
                          disabled={globalLoading}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: globalLoading ? '#ccc' : '#666',
                            cursor: globalLoading ? 'not-allowed' : 'pointer',
                            fontWeight: 500,
                            fontSize: '12px',
                            fontFamily: 'inherit',
                            userSelect: 'none',
                            textAlign: 'center',
                            opacity: globalLoading ? 0.5 : 1,
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            padding: '2px 6px',
                            borderRadius: '2px',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (!globalLoading) {
                              e.target.style.backgroundColor = '#f5f5f5';
                              e.target.style.color = '#333';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                            e.target.style.color = '#666';
                          }}
                          title="Next"
                        >
                          Next ›
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </Grid>
            )}

            {/* Alerts Type dropdown – only on Alerts tab */}
            {activeTab === 'alerts' && (
              <Grid item xs={12} sm={6} md={3} lg={3} xl={2}>
                <div style={{ minWidth: 220, position: 'relative' }} ref={dropdownRef}>
                  <div
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation(); // Prevent click outside handler from firing
                      setShowDropdown(!showDropdown);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      backgroundColor: 'white',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontFamily: 'inherit',
                    }}
                  >
                    <span>
                      {selectedAlertTypes.length === 0
                        ? "Alerts Type"
                        : selectedAlertTypes.length === 1
                          ? selectedAlertTypes[0]
                          : `${selectedAlertTypes.length} types selected`
                      }
                    </span>
                    <span>▼</span>
                  </div>

                  {showDropdown && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: 'white',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      zIndex: 1002,
                      marginTop: '2px',
                      maxHeight: '200px',
                      overflowY: 'auto'
                    }}>
                      {alertTypes.map((type) => {
                        const isChecked = selectedAlertTypes.includes(type);
                        return (
                          <div
                            key={type}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation(); // Prevent dropdown toggle
                              handleTypeToggle(type);
                            }}
                            style={{
                              padding: '8px 12px',
                              cursor: 'pointer',
                              borderBottom: '1px solid #eee',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              backgroundColor: isChecked ? '#e3f2fd' : 'transparent'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => { }} // Controlled by parent click
                              style={{
                                margin: 0,
                                cursor: 'pointer',
                                transform: 'scale(1.2)'
                              }}
                            />
                            <span style={{ fontSize: '14px', color: '#333', fontWeight: isChecked ? '600' : '400' }}>
                              {type}
                            </span>
                          </div>
                        );
                      })}
                      {selectedAlertTypes.length > 0 && (
                        <div style={{
                          padding: '8px 12px',
                          borderTop: '1px solid #eee',
                          backgroundColor: '#f8f9fa'
                        }}>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation(); // Prevent dropdown toggle
                              setSelectedAlertTypes([]);
                              setFilterKey(prev => prev + 1);

                              // Close and reopen dropdown to update the display
                              setShowDropdown(false);
                              setTimeout(() => {
                                setShowDropdown(true);
                              }, 100);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#666',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Clear All
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Grid>
            )}

            {/* Empty Grid container for alerts tab - same size as duration section */}
            {activeTab === 'alerts' && (
              <Grid item xs={12} sm={6} md={3} lg={3} xl={2}>
                <div style={{ width: '100%', height: '40px' }}></div>
              </Grid>
            )}

            <Grid
              item
              xs={12}
              md={6}
              lg={6}
              xl={6}
              sx={{
                mt: { xs: 1, sm: 0 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 12,
                flexWrap: 'wrap'
              }}
            >
              {/* Tabs - hidden on Overview so widget area fills space */}
              {activeTab !== 'overview' && (
              <div
                style={{
                  display: 'inline-flex',
                  gap: isLargeScreen ? '12px' : (isMediumScreen ? '10px' : '6px'),
                  backgroundColor: "#807864",
                  borderRadius: "5px",
                  padding: isLargeScreen ? '5px 10px' : (isMediumScreen ? '4px 8px' : '3px 6px'),
                  minWidth: 0,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                  backgroundColor: contentColor,
                  maxWidth: '100%',
                  flexWrap: 'nowrap',
                }}
              >
                <button
                  onClick={globalLoading ? undefined : (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleTabChange('overview');
                  }}
                  disabled={globalLoading}
                  style={{
                    padding: isLargeScreen ? '10px 30px' : (isMediumScreen ? '8px 25px' : '6px 20px'),
                    border: `1px solid ${buttonColor}`,
                    borderRadius: '50%',
                    backgroundColor: activeTab === 'overview' ? '#fff' : buttonColor,
                    color: activeTab === 'overview' ? buttonColor : '#fff',
                    cursor: globalLoading ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    fontSize: isLargeScreen ? '14px' : (isMediumScreen ? '13px' : '12px'),
                    fontFamily: 'inherit',
                    transition: 'all 0.2s ease',
                    boxShadow: activeTab === 'overview'
                      ? `0 2px 6px ${buttonColor}33`
                      : 'none',
                    opacity: globalLoading ? 0.5 : 1,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  Overview
                </button>
                <button
                  onClick={globalLoading ? undefined : (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleTabChange('energy');
                  }}
                  disabled={globalLoading}
                  style={{
                    padding: isLargeScreen ? '10px 30px' : (isMediumScreen ? '8px 25px' : '6px 20px'),
                    border: `1px solid ${buttonColor}`,
                    borderRadius: '50%',
                    backgroundColor: activeTab === 'energy' ? '#fff' : buttonColor,
                    color: activeTab === 'energy' ? buttonColor : '#fff',
                    cursor: globalLoading ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    fontSize: isLargeScreen ? '14px' : (isMediumScreen ? '13px' : '12px'),
                    fontFamily: 'inherit',
                    transition: 'all 0.2s ease',
                    boxShadow: activeTab === 'energy'
                      ? `0 2px 6px ${buttonColor}33`
                      : 'none',
                    opacity: globalLoading ? 0.5 : 1,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  Energy
                </button>
                {false && (
                  <button
                    onClick={globalLoading ? undefined : (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleTabChange('space-utilization');
                    }}
                    disabled={globalLoading}
                    style={{
                      padding: isLargeScreen ? '10px 30px' : (isMediumScreen ? '8px 25px' : '6px 20px'),
                      border: `1px solid ${buttonColor}`,
                      borderRadius: '50%',
                      backgroundColor: activeTab === 'space-utilization' ? '#fff' : buttonColor,
                      color: activeTab === 'space-utilization' ? buttonColor : '#fff',
                      cursor: globalLoading ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                      fontSize: isLargeScreen ? '14px' : (isMediumScreen ? '13px' : '12px'),
                      fontFamily: 'inherit',
                      transition: 'all 0.2s ease',
                      boxShadow: activeTab === 'space-utilization'
                        ? `0 2px 6px ${buttonColor}33`
                        : 'none',
                      opacity: globalLoading ? 0.5 : 1,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {isLargeScreen ? 'Space Utilization' : (isMediumScreen ? 'Space Util' : 'Space')}
                  </button>
                )}
                <button
                  onClick={globalLoading ? undefined : (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleTabChange('charts');
                  }}
                  disabled={globalLoading}
                  style={{
                    padding: isLargeScreen ? '10px 30px' : (isMediumScreen ? '8px 25px' : '6px 20px'),
                    border: `1px solid ${buttonColor}`,
                    borderRadius: '50%',
                    backgroundColor: activeTab === 'charts' ? '#fff' : buttonColor,
                    color: activeTab === 'charts' ? buttonColor : '#fff',
                    cursor: globalLoading ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    fontSize: isLargeScreen ? '14px' : (isMediumScreen ? '13px' : '12px'),
                    fontFamily: 'inherit',
                    transition: 'all 0.2s ease',
                    boxShadow: activeTab === 'charts'
                      ? `0 2px 6px ${buttonColor}33`
                      : 'none',
                    opacity: globalLoading ? 0.5 : 1,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {isLargeScreen ? 'Space Utilization' : (isMediumScreen ? 'Space Util' : 'Space')}
                </button>
                <button
                  onClick={globalLoading ? undefined : (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleTabChange('alerts');
                  }}
                  disabled={globalLoading}
                  style={{
                    padding: isLargeScreen ? '10px 30px' : (isMediumScreen ? '8px 25px' : '6px 20px'),
                    border: `1px solid ${buttonColor}`,
                    borderRadius: '50%',
                    backgroundColor: activeTab === 'alerts' ? '#fff' : buttonColor,
                    color: activeTab === 'alerts' ? buttonColor : '#fff',
                    cursor: globalLoading ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    fontSize: isLargeScreen ? '14px' : (isMediumScreen ? '13px' : '12px'),
                    fontFamily: 'inherit',
                    transition: 'all 0.2s ease',
                    boxShadow: activeTab === 'alerts'
                      ? `0 2px 6px ${buttonColor}33`
                      : 'none',
                    opacity: globalLoading ? 0.5 : 1,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  Alerts
                </button>
              </div>
              )}
            </Grid>
          </Grid>

        </Box>
      </Box>

      {/* Scrollable Content Area */}
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          // Reduce top/bottom gap for Overview so widgets fit in one viewport
          mt: activeTab === 'overview' ? 2 : 12,
          py: activeTab === 'overview' ? 2 : 3
        }}
      >
        <Box
          onClick={(e) => e.stopPropagation()}
          sx={{
            width: '100%',
            maxWidth: '100%',
            mx: 'auto',
            px: { xs: 1, sm: 2, md: 3, lg: 0.5, xl: 6, '2xl': 8 },
          }}
        >
          <Box
            onClick={(e) => e.stopPropagation()}
            sx={{
              backgroundColor: backgroundColor,
              borderRadius: 2,
              minHeight: 400,
              width: '100%',
              maxWidth: '100%',
              position: 'relative',
              // pb: 4, // Add bottom padding to ensure content is not cut off
            }}
          >
            {/* Data Container for your next section */}
            <Box mt={activeTab === 'alerts' ? 0 : 3}>
              {activeTab === 'overview' && (
                <DashboardOverview
                  data={overviewData}
                  loading={overviewLoading}
                  error={overviewError}
                  onNavigateToEnergy={() => handleTabChange('energy')}
                  onNavigateToAlerts={() => handleTabChange('alerts')}
                  onNavigateToSpaceUtilization={() => handleTabChange('charts')}
                  onNavigateToSchedule={() => navigate('/schedule')}
                  onNavigateToFloor={() => navigate('/heatmap')}
                  onNavigateToQuickControls={() => navigate('/quickcontrols')}
                />
              )}
              {activeTab === 'energy' && (
                <>
                  {/* 2-Grid Layout for Charts */}
                  <Grid
                    container
                    spacing={{ xs: 2, sm: 2, md: 3, lg: 4, xl: 5 }}
                    sx={{ mb: 2 }}
                    direction={{ xs: 'column', md: 'row' }}
                    width="100%"



                  >
                    <Grid item xs={12} md={6} lg={6} xl={6} >
                      <SavingsStrategyChart
                        title={getWidgetTitle('savings_by_strategy', 'Savings By Strategy')}
                        isLoading={chartLoading.savingsByStrategy}
                      />
                    </Grid>

                    <Grid item xs={12} md={6} lg={6} xl={6} >
                      <ConsumptionPieChart
                        title={getWidgetTitle('total_consumption_by_group', 'Consumption By Area Groups')}
                        data={totalConsumptionByGroup}
                        onEmail={handleConsumptionByGroupEmail}
                        onDownload={handleConsumptionByGroupDownload}
                        isLoading={chartLoading.totalConsumptionByGroup}
                      />
                    </Grid>
                  </Grid>

                  {/* Existing Line Charts */}
                  <Grid
                    container
                    spacing={{ xs: 2, sm: 2, md: 3, lg: 4, xl: 5 }}
                    direction={{ xs: 'column', md: 'row' }}
                    width="100%"
                  >
                    <Grid item xs={12} md={6} lg={6} xl={6}>
                      <IsolatedLineChart chartProps={consumptionChartProps} />
                    </Grid>
                    <Grid item xs={12} md={6} lg={6} xl={6}>
                      <IsolatedLineChart chartProps={savingsChartProps} />
                    </Grid>
                  </Grid>

                  {/* Lighting Power Density and Peak & Minimum Consumption */}
                  <Grid
                    container
                    spacing={{ xs: 2, sm: 2, md: 3, lg: 4, xl: 5 }}
                    sx={{ mt: 2 }}
                    direction={{ xs: 'column', md: 'row' }}
                    width="100%"
                  >
                    <Grid item xs={12} md={6} lg={6} xl={6}>
                      {/* Lighting Power Density Panel */}
                      <div style={{
                        backgroundColor: 'rgba(128, 120, 100, 0.6)',
                        borderRadius: '8px',
                        padding: '20px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        height: '200px',
                        display: 'flex',
                        flexDirection: 'column'
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '20px',
                        }}>
                          <h3 style={chartHeaderStyle}>{getWidgetTitle('light_power_density', 'Lighting Power Density')}</h3>
                          <select
                            value={lightingUnit}
                            onChange={(e) => setLightingUnit(e.target.value)}
                            style={{
                              padding: '5px 10px',
                              border: '1px solid #ccc',
                              borderRadius: '4px',
                              backgroundColor: 'white',
                              fontSize: '14px',
                              color: '#333',
                            }}
                          >
                            <option value="Watt / Sq ft">Watt / Sq ft</option>
                            <option value="Watt / Sq m">Watt / Sq m</option>
                          </select>
                        </div>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', backgroundColor: '#232323', border: 'none', borderRadius: '12px' }}>
                          {renderLightingPowerDensity()}
                        </div>
                      </div>
                    </Grid>
                    <Grid item xs={12} md={6} lg={6} xl={6}>
                      {/* Peak & Minimum Consumption Panel */}
                      <div style={{
                        backgroundColor: 'rgba(128, 120, 100, 0.6)',
                        borderRadius: '8px',
                        padding: '20px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        position: 'relative',
                        height: '200px',
                        display: 'flex',
                        flexDirection: 'column'
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '20px'
                        }}>
                          <h3 style={chartHeaderStyle}>
                            {getWidgetTitle('peak_and_minimum_consumption', 'Peak & Minimum Consumption')}
                          </h3>
                          <div style={{ position: 'relative' }}>
                            {/* <button
                              onClick={() => setShowExportDropdown(prev => ({ ...prev, 'peakMin': !prev['peakMin'] }))}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '16px',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}
                            >
                              Export
                            </button> */}
                            {/* {showExportDropdown['peakMin'] && ( */}
                            {/*   <div
                                ref={el => exportDropdownRefs.current['peakMin'] = el}
                                style={{
                                  position: 'absolute',
                                  top: '100%',
                                  right: 0,
                                  backgroundColor: '#CDC0A0',
                                  border: '1px solid #444',
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                  zIndex: 1000,
                                  minWidth: '180px',
                                  padding: '8px 0'
                                }}
                              >
                                <button
                                  onClick={() => handleExport('email', 'Peak & Minimum Consumption')}
                                  disabled={exportLoading['Peak & Minimum Consumption_email']}
                                  style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: 'none',
                                    background: 'none',
                                    cursor: exportLoading['Peak & Minimum Consumption_email'] ? 'not-allowed' : 'pointer',
                                    textAlign: 'left',
                                    fontSize: '14px',
                                    color: exportLoading['Peak & Minimum Consumption_email'] ? '#999' : '#fff',
                                    fontWeight: '500',
                                    borderBottom: '1px solid #444',
                                    opacity: exportLoading['Peak & Minimum Consumption_email'] ? 0.6 : 1,
                                  }}
                                >
                                  {exportLoading['Peak & Minimum Consumption_email'] ? 'Sending...' : 'Send By Email'}
                                </button>
                                <button
                                  onClick={() => handleExport('download', 'Peak & Minimum Consumption')}
                                  disabled={exportLoading['Peak & Minimum Consumption_download']}
                                  style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: 'none',
                                    background: 'none',
                                    cursor: exportLoading['Peak & Minimum Consumption_download'] ? 'not-allowed' : 'pointer',
                                    textAlign: 'left',
                                    fontSize: '14px',
                                    color: exportLoading['Peak & Minimum Consumption_download'] ? '#999' : '#fff',
                                    fontWeight: '500',
                                    opacity: exportLoading['Peak & Minimum Consumption_download'] ? 0.6 : 1
                                  }}
                                >
                                  {exportLoading['Peak & Minimum Consumption_download'] ? 'Downloading...' : 'Download To PC'}
                                </button>
                              </div> */}
                            {/* )} */}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '15px', flex: 1, alignItems: 'center' }}>
                          {/* Peak Load */}
                          <div style={{
                            flex: 1,
                            backgroundColor: '#232323',
                            borderRadius: '12px',
                            padding: '16px 14px',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center'
                          }}>
                            <div style={{
                              fontSize: isLargeScreen ? '14px' : '13px',
                              color: '#fff',
                              fontWeight: 600,
                              marginBottom: '8px',
                              fontFamily: 'inherit'
                            }}>
                              Peak Load
                            </div>
                            <div style={{
                              fontSize: isLargeScreen ? '20px' : '18px',
                              fontWeight: 700,
                              color: '#fff',
                              marginBottom: '6px',
                              lineHeight: 1.25,
                              wordWrap: 'break-word',
                              overflow: 'hidden',
                              fontFamily: 'inherit'
                            }}>
                              {isPeakMinLoading
                                ? renderPeakMinLoader()
                                : peakConsumptionDisplay.valueText}
                            </div>
                            <div style={{
                              fontSize: isLargeScreen ? '12px' : '11px',
                              color: '#ccc',
                              fontWeight: 500,
                              fontFamily: 'inherit',
                              minHeight: '1em'
                            }}>
                              {isPeakMinLoading ? '' : peakConsumptionDisplay.timeText}
                            </div>
                          </div>
                          {/* Min Load */}
                          <div style={{
                            flex: 1,
                            backgroundColor: '#232323',
                            borderRadius: '12px',
                            padding: '16px 14px',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center'
                          }}>
                            <div style={{
                              fontSize: isLargeScreen ? '14px' : '13px',
                              color: '#fff',
                              fontWeight: 600,
                              marginBottom: '8px',
                              fontFamily: 'inherit'
                            }}>
                              Min Load
                            </div>
                            <div style={{
                              fontSize: isLargeScreen ? '20px' : '18px',
                              fontWeight: 700,
                              color: '#fff',
                              marginBottom: '6px',
                              lineHeight: 1.25,
                              wordWrap: 'break-word',
                              overflow: 'hidden',
                              fontFamily: 'inherit'
                            }}>
                              {isPeakMinLoading
                                ? renderPeakMinLoader()
                                : minConsumptionDisplay.valueText}
                            </div>
                            <div style={{
                              fontSize: isLargeScreen ? '12px' : '11px',
                              color: '#ccc',
                              fontWeight: 500,
                              fontFamily: 'inherit',
                              minHeight: '1em'
                            }}>
                              {isPeakMinLoading ? '' : minConsumptionDisplay.timeText}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Grid>
                  </Grid>
                </>
              )}

              {activeTab === 'space-utilization' && false && (
                <div style={{ padding: '0px' }}>
                  <SpaceUtilization
                    title={getWidgetTitle('utilization', 'Utilization')}
                    data={occupancyCount}
                    isLoading={false}
                  />
                </div>
              )}

              {activeTab === 'charts' && (
                <div style={{ padding: '0px' }}>
                  <SpaceUtilization
                    title={getWidgetTitle('instant_occupancy_count', 'Instant Occupancy Count')}
                    data={instantOccupancyCount}
                    showChartsTab={true}
                  />
                </div>
              )}

              {activeTab === 'alerts' && (
                <Alerts
                  key={`alerts-${filterKey}`}
                  selectedTypes={selectedAlertTypes}
                />
              )}


              {/* Show message when operator has no floors assigned */}
              {/* Only show this message after both floors and profile are loaded to prevent race condition */}
              {/* Use getAvailableFloors() instead of floors.length to properly check operator permissions */}
              {isOperator && getAvailableFloors().length === 0 && floorStatus === 'succeeded' && !dashboardLoading && !profileLoading && userProfile !== null && (
                <div style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  backgroundColor: 'rgba(255, 235, 238, 0.8)',
                  borderRadius: '8px',
                  border: '1px solid #ffcdd2',
                  margin: '20px 0'
                }}>
                  <h3 style={{ color: '#d32f2f', margin: '0 0 16px 0' }}>
                    No Floors Available
                  </h3>
                  <p style={{ color: '#d32f2f', margin: '0 0 16px 0', fontSize: '16px' }}>
                    Your operator account does not have access to any floors.
                    Please contact your administrator to assign floors to your account.
                  </p>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    This ensures you can only view and manage areas within your assigned scope.
                  </div>
                </div>
              )}

              {/* Show error state if there's an error */}
              {dashboardError && (
                <div style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: '#d32f2f',
                  backgroundColor: '#ffebee',
                  borderRadius: '4px'
                }}>
                  Error: {typeof dashboardError === 'string' ? dashboardError : 'An error occurred'}
                </div>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Material-UI Snackbar for email notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{
            width: '100%',
            backgroundColor: 'white',
            color: 'black',
            border: snackbarSeverity === 'error'
              ? '1px solid #f44336'
              : snackbarSeverity === 'warning'
                ? '1px solid #ff9800'
                : '1px solid #4CAF50',
            '& .MuiAlert-icon': {
              color: snackbarSeverity === 'error'
                ? '#f44336'
                : snackbarSeverity === 'warning'
                  ? '#ff9800'
                  : '#4CAF50'
            }
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Email Input Dialog - removed as emails are now sent directly to logged-in user */}
    </div>
  )
}

export default Dashboard
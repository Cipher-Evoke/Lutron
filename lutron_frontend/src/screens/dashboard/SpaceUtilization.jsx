import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
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
  Label,
  BarChart,
  Bar
} from 'recharts'
import { useSelector, useDispatch, useStore } from 'react-redux'
import { UseAuth } from '../../customhooks/UseAuth'
import { Box, useTheme, useMediaQuery, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Typography, Button } from '@mui/material'
import {
  fetchOccupancyByGroup,
  fetchSpaceUtilizationPerArea,
  fetchOccupancyCount,
  fetchInstantOccupancyCount,
  fetchOccupancyByGroupFromLogs,
  fetchSpaceUtilizationPerFromLogs,
  downloadOccupancyCount,
  downloadInstantOccupancyCount,
  downloadOccupancyByGroup,
  downloadOccupancyByGroupFromLogs,
  downloadSpaceUtilizationPer,
  downloadSpaceUtilizationPerFromLogs,
  // downloadPeakMinOccupancy, // Commented out - not using peak min max API for space utilization
  sendOccupancyCountEmail,
  sendInstantOccupancyCountEmail,
  sendOccupancyByGroupEmail,
  sendOccupancyByGroupFromLogsEmail,
  sendSpaceUtilizationPerEmail,
  sendSpaceUtilizationPerFromLogsEmail,
  // sendPeakMinOccupancyEmail, // Commented out - not using peak min max API for space utilization
  selectOccupancyByGroup,
  selectSpaceUtilizationPerArea,
  selectOccupancyByGroupFromLogs,
  selectSpaceUtilizationPerFromLogs,
  selectOccupancyByGroupFromLogsLoading,
  selectSpaceUtilizationPerFromLogsLoading,
  selectSelectedAreas,
  selectSelectedFloorIds,
  selectSelectedDuration,
  selectCustomDateRange,
  selectOccupancyCount,
  selectInstantOccupancyCount,
  selectInstantOccupancyCountLoading,
  selectInstantOccupancyCountError,
  setSelectedAreas,
  selectCurrentDate,
  selectCurrentYear,
  selectEmailLoading,
  selectIsNavigating,
  clearDataCache
} from '../../redux/slice/dashboard/dashboardSlice'
import { fetchEmailConfigs, getWidgetList } from '../../redux/slice/settingsslice/heatmap/groupOccupancySlice'
import {
  dispatchFetchFloorsOnce,
  dispatchFetchWidgetTitlesOnce,
} from '../../utils/bootstrapFetchGuards'
import { fetchProfile } from '../../redux/slice/auth/userlogin'

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

/**
 * SpaceUtilization Component
 * 
 * Default Data Display:
 * - All user roles (Superadmin, Admin, Operator) see project data by default
 * - Data is automatically fetched for all accessible areas without requiring user selection
 * - Users can still filter by specific floors/areas if desired
 * - Project data includes all areas the user has permission to access
 */

// Updated colors - Light, subtle colors for better visual comfort
const COLORS = ['#FFB3B3', '#87CEEB', '#98FB98', '#FFD4A3', '#DDA0DD', '#FFB6C1', '#AFEEEE', '#F0E68C']

const SpaceUtilization = ({ title, data, showOnlyInstantChart = false, showChartsTab = false }) => {
  const dispatch = useDispatch()
  const store = useStore()
  const theme = useTheme()
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

  // Add CSS animation for spinner
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Chart Loader Component
  const ChartLoader = ({ height = '300px' }) => (
    <div
      style={{
        height: height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#767061',
        borderRadius: '4px',
        border: '1px solid #ddd',
      }}
    >
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

  const [showExportDropdown, setShowExportDropdown] = useState({ line: false, pie: false, table: false, peak: false, instant: false })
  const exportDropdownRef = useRef(null)
  const [hasInitialized, setHasInitialized] = useState(false)
  // REMOVED: allAreasLoaded and allAvailableAreas state - no longer needed
  const [exportLoading, setExportLoading] = useState({}) // Track loading state for each export operation

  // Use global loading state from Redux for time range changes

  // Snackbar state for email notifications
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState('success')

  // Email dialog state - DISABLED: No popup, using saved email only
  // State variables kept for compatibility but not used
  const [emailDialogOpen] = useState(false)
  const [emailInput] = useState('')
  const [pendingEmailAction] = useState(null)

  // Snackbar handlers
  const handleSnackbarClose = () => {
    setSnackbarOpen(false)
  }

  const showSnackbar = (message, severity = 'success') => {
    setSnackbarMessage(message)
    setSnackbarSeverity(severity)
    setSnackbarOpen(true)
  }

  // Email dialog handlers - Send email directly to logged-in user
  const handleEmailDialogOpen = async (action) => {
    // Check if mail server is configured first
    try {
      const result = await dispatch(fetchEmailConfigs()).unwrap()

      // Check if we have email configurations and they are properly set up
      if (!Array.isArray(result) || result.length === 0) {
        showSnackbar('Email Server settings not configured', 'error')
        return
      }

      const latestConfig = result[0]
      const hasServerName = latestConfig.server_name && latestConfig.server_name.trim() !== ''
      const hasPort = latestConfig.port && latestConfig.port > 0
      const hasServerEmail = latestConfig.server_email && latestConfig.server_email.trim() !== ''
      const hasSenderName = latestConfig.sender_name && latestConfig.sender_name.trim() !== ''

      if (!hasServerName || !hasPort || !hasServerEmail || !hasSenderName) {
        showSnackbar('Email Server settings not configured', 'error')
        return
      }
    } catch (error) {
      showSnackbar('Email Server settings not configured', 'error')
      return
    }

    // Use logged-in user's email from profile
    if (userProfile && userProfile.email && userProfile.email.trim() !== '') {
      if (typeof action === 'function') {
        action(userProfile.email.trim())
      }
      return
    }

    // If no user email in profile, show error
    showSnackbar('No email address found for logged-in user. Please check your profile.', 'error')
  }

  const selectedAreas = useSelector(selectSelectedAreas)
  const selectedFloorIds = useSelector(selectSelectedFloorIds)
  const selectedDuration = useSelector(selectSelectedDuration)
  const customDateRange = useSelector(selectCustomDateRange)
  const isNavigating = useSelector(selectIsNavigating)
  const currentDate = useSelector(selectCurrentDate)
  const currentYear = useSelector(selectCurrentYear)
  const occupancyByGroup = useSelector(selectOccupancyByGroup)
  const spaceUtilizationPerArea = useSelector(selectSpaceUtilizationPerArea)
  const occupancyByGroupFromLogs = useSelector(selectOccupancyByGroupFromLogs)
  const spaceUtilizationPerFromLogs = useSelector(selectSpaceUtilizationPerFromLogs)
  const occupancyByGroupFromLogsLoading = useSelector(selectOccupancyByGroupFromLogsLoading)
  const spaceUtilizationPerFromLogsLoading = useSelector(selectSpaceUtilizationPerFromLogsLoading)

  const occupancyCount = useSelector(selectOccupancyCount)
  const emailLoading = useSelector(selectEmailLoading)
  const widgetList = useSelector(getWidgetList)

  // User profile for email functionality
  const userProfile = useSelector((state) => state.user?.profile)
  const profileLoading = useSelector((state) => state.user?.profileLoading)

  // Get loading and error states
  const dashboardStatus = useSelector((state) => state.dashboard.status)
  const dashboardLoading = useSelector((state) => state.dashboard.loading)
  const dashboardError = useSelector((state) => state.dashboard.error)

  // Get individual chart loading states - Use specific loading states for each API call
  const occupancyCountLoading = useSelector((state) => state.dashboard.occupancyCountLoading || false)
  const occupancyByGroupLoading = useSelector((state) => state.dashboard.occupancyByGroupLoading || false)
  const spaceUtilizationLoading = useSelector((state) => state.dashboard.spaceUtilizationLoading || false)

  // Use _from_logs data when in Charts tab, otherwise use regular data
  const activeOccupancyByGroup = showChartsTab ? occupancyByGroupFromLogs : occupancyByGroup
  const activeSpaceUtilizationPerArea = showChartsTab ? spaceUtilizationPerFromLogs : spaceUtilizationPerArea
  const activeOccupancyByGroupLoading = showChartsTab ? occupancyByGroupFromLogsLoading : occupancyByGroupLoading
  const activeSpaceUtilizationLoading = showChartsTab ? spaceUtilizationPerFromLogsLoading : spaceUtilizationLoading
  // const peakMinOccupancyLoading = useSelector((state) => state.dashboard.peakMinOccupancyLoading || false) // Commented out - not using peak min max API for space utilization
  const instantOccupancyCountLoading = useSelector((state) => state.dashboard.instantOccupancyCountLoading || false)
  const instantOccupancyCountError = useSelector((state) => state.dashboard.instantOccupancyCountError || null)
  const instantOccupancyCount = useSelector((state) => state.dashboard.instantOccupancyCount || null)

  // Check for specific API errors
  const hasApiErrors = () => {
    return (
      (activeOccupancyByGroup && activeOccupancyByGroup.status === 'error') ||
      (activeSpaceUtilizationPerArea && activeSpaceUtilizationPerArea.status === 'error')
    )
  }

  // Get floors from Redux store
  const floors = useSelector((state) => state.floor.floors)
  const floorStatus = useSelector((state) => state.floor.status)
  const areaTree = useSelector((state) => state.floor.leafData)

  // Add this helper function at the top of your component (after imports)
  const mapTimeRangeToBackend = (timeRange) => {
    if (!timeRange) return "this_day";
    if (timeRange === "this-day") return "this_day";
    if (timeRange === "this-week") return "this_week";
    if (timeRange === "this-month") return "this_month";
    if (timeRange === "this-year") return "this_year";
    return timeRange; // custom or already correct
  };

  // REMOVED: loadAllAreasFromAllFloors function to prevent duplicate API calls
  // The Dashboard component handles all area loading and API calls
  // SpaceUtilization should only display data, not make API calls

  // REMOVED: flattenAreaTree function - no longer needed since we don't load areas here

  // Fetch floors on component mount (once-guarded; Dashboard may already have loaded)
  useEffect(() => {
    dispatchFetchFloorsOnce(dispatch, store.getState)
  }, [dispatch, store])

  // Widget titles owned by Dashboard bootstrap — reuse store if already loaded
  useEffect(() => {
    dispatchFetchWidgetTitlesOnce(dispatch, store.getState)
  }, [dispatch, store])

  // Fetch user profile on component mount
  useEffect(() => {
    dispatch(fetchProfile())
  }, [dispatch])

  // REMOVED: useEffect that was calling loadAllAreasFromAllFloors
  // This was causing duplicate API calls when switching tabs
  // The Dashboard component handles all area loading and API calls

  // FIXED: Removed clearDataCache call to prevent triggering unnecessary API calls
  // The Dashboard component handles data caching and API calls
  // SpaceUtilization should only display data, not manage API calls

  // Helper function to calculate date parameters based on navigation state - Updated to match Dashboard logic
  const calculateDateParameters = () => {
    // If custom date range is set, always use it regardless of selectedDuration
    // This ensures consistency when switching between tabs
    if (customDateRange.startDate && customDateRange.endDate &&
      customDateRange.startDate.trim() !== '' && customDateRange.endDate.trim() !== '') {
      // Validate dates before using them
      const startDate = new Date(customDateRange.startDate);
      const endDate = new Date(customDateRange.endDate);

      // Check if dates are valid
      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        showSnackbar('Please select valid dates', 'error');
        // Return a safe default date range to prevent errors
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const defaultEnd = new Date(today);
        defaultEnd.setHours(23, 59, 59, 999);
        return {
          timeRange: 'custom',
          startDate: today.toISOString(),
          endDate: defaultEnd.toISOString()
        };
      }

      // Check if start date is after end date
      if (startDate > endDate) {
        showSnackbar('Please select valid dates', 'error');
        // Return a safe default date range to prevent errors
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const defaultEnd = new Date(today);
        defaultEnd.setHours(23, 59, 59, 999);
        return {
          timeRange: 'custom',
          startDate: today.toISOString(),
          endDate: defaultEnd.toISOString()
        };
      }

      return {
        timeRange: 'custom',
        startDate: customDateRange.startDate,
        endDate: customDateRange.endDate
      };
    }

    // For predefined time ranges, only use custom dates when we're navigating (previous/next buttons)
    // Otherwise, use the predefined time range to get proper backend formatting (24-hour format for this-day, etc.)
    if (isNavigating) {
      // We're navigating, so use the customDateRange that was set by the navigation handlers
      // This ensures we use the correct dates even if currentDate hasn't been updated yet
      if (customDateRange.startDate && customDateRange.endDate) {
        // Validate dates before using them
        const startDate = new Date(customDateRange.startDate);
        const endDate = new Date(customDateRange.endDate);

        // Check if dates are valid
        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
          showSnackbar('Please select valid dates', 'error');
          // Return a safe default date range to prevent errors
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const defaultEnd = new Date(today);
          defaultEnd.setHours(23, 59, 59, 999);
          return {
            timeRange: 'custom',
            startDate: today.toISOString(),
            endDate: defaultEnd.toISOString()
          };
        }

        // Check if start date is after end date
        if (startDate > endDate) {
          showSnackbar('Please select valid dates', 'error');
          // Return a safe default date range to prevent errors
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const defaultEnd = new Date(today);
          defaultEnd.setHours(23, 59, 59, 999);
          return {
            timeRange: 'custom',
            startDate: today.toISOString(),
            endDate: defaultEnd.toISOString()
          };
        }

        // Using custom date range for navigation
        return {
          timeRange: 'custom',
          startDate: customDateRange.startDate,
          endDate: customDateRange.endDate
        };
      }

      // Fallback: calculate custom dates for the specific day/week/month/year
      // Use the currentDate from Redux state which should be updated by navigation
      const now = parseDateFromState(currentDate);
      // Calculating date parameters for navigation
      let startDate, endDate;

      switch (selectedDuration) {
        case 'this-day':
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'this-week':
          // Calculate start of week (Sunday) - send FULL WEEK range
          startDate = new Date(now);
          startDate.setDate(now.getDate() - now.getDay());
          startDate.setHours(0, 0, 0, 0);
          // Calculate end of week (Saturday) - send FULL WEEK range
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'this-month':
          // Calculate start of month - send FULL MONTH range
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          startDate.setHours(0, 0, 0, 0);
          // Calculate end of month - send FULL MONTH range
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'this-year':
          // Calculate start of year - send FULL YEAR range
          startDate = new Date(now.getFullYear(), 0, 1);
          startDate.setHours(0, 0, 0, 0);
          // Calculate end of year - send FULL YEAR range
          endDate = new Date(now.getFullYear(), 11, 31);
          endDate.setHours(23, 59, 59, 999);
          break;
        default:
          startDate = new Date(now);
          endDate = new Date(now);
      }

      return {
        timeRange: 'custom',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };
    } else {
      // We're not navigating, but we should still use currentDate from Redux state
      // to maintain consistency when switching between tabs
      const targetDate = parseDateFromState(currentDate);
      let startDate, endDate;

      switch (selectedDuration) {
        case 'this-day':
          startDate = new Date(targetDate);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(targetDate);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'this-week':
          // Calculate start of week (Sunday) - send FULL WEEK range
          startDate = new Date(targetDate);
          startDate.setDate(targetDate.getDate() - targetDate.getDay());
          startDate.setHours(0, 0, 0, 0);
          // Calculate end of week (Saturday) - send FULL WEEK range
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'this-month':
          // Calculate start of month
          startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
          startDate.setHours(0, 0, 0, 0);
          // Calculate end of month
          endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'this-year':
          // Calculate start of year
          startDate = new Date(targetDate.getFullYear(), 0, 1);
          startDate.setHours(0, 0, 0, 0);
          // Calculate end of year
          endDate = new Date(targetDate.getFullYear(), 11, 31);
          endDate.setHours(23, 59, 59, 999);
          break;
        default:
          // Default to target date
          startDate = new Date(targetDate);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(targetDate);
          endDate.setHours(23, 59, 59, 999);
      }

      return {
        timeRange: 'custom', // Use custom to ensure we use the calculated dates
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };
    }
  };

  // Note: This component should NOT make API calls - Dashboard component handles all API calls
  // This useEffect only handles component initialization and data display
  useEffect(() => {
    // Mark as initialized when component mounts
    if (!hasInitialized) {
      setHasInitialized(true);
    }
  }, [hasInitialized]);

  // Navigation handlers - Enable export for all users
  const handlePrevious = () => {
    const now = parseDateFromState(currentDate);
    let newDate;

    switch (selectedDuration) {
      case 'this-day':
        newDate = new Date(now);
        newDate.setDate(now.getDate() - 1);

        // Keep UI showing "this-day" but set custom date range for data fetching
        const startDate = new Date(newDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(newDate);
        endDate.setHours(23, 59, 59, 999);

        // Use simple date format without time to avoid timezone issues
        const startDateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
        const endDateStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

        // Don't change selectedDuration, just update custom date range and current date
        dispatch(setCustomDateRange({
          startDate: startDateStr,
          endDate: endDateStr
        }));
        dispatch(setCurrentDate(formatDateForState(newDate)));
        dispatch(setIsNavigating(true));
        return;
      case 'this-week':
        newDate = new Date(now);
        newDate.setDate(now.getDate() - 7);

        // Keep UI showing "this-week" but set custom date range for data fetching
        const startOfWeek = new Date(newDate);
        startOfWeek.setDate(newDate.getDate() - newDate.getDay()); // Start of week (Sunday)
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week (Saturday)
        endOfWeek.setHours(23, 59, 59, 999);

        // Use simple date format without time to avoid timezone issues
        const startOfWeekStr = `${startOfWeek.getFullYear()}-${String(startOfWeek.getMonth() + 1).padStart(2, '0')}-${String(startOfWeek.getDate()).padStart(2, '0')}`;
        const endOfWeekStr = `${endOfWeek.getFullYear()}-${String(endOfWeek.getMonth() + 1).padStart(2, '0')}-${String(endOfWeek.getDate()).padStart(2, '0')}`;

        // Don't change selectedDuration, just update custom date range and current date
        dispatch(setCustomDateRange({
          startDate: startOfWeekStr,
          endDate: endOfWeekStr
        }));
        dispatch(setCurrentDate(formatDateForState(newDate)));
        dispatch(setIsNavigating(true));
        return;
      case 'this-month':
        newDate = new Date(now);
        newDate.setMonth(now.getMonth() - 1);

        // Keep UI showing "this-month" but set custom date range for data fetching
        const startOfMonth = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);
        const endOfMonth = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);

        // Use local time components instead of toISOString()
        const startOfMonthStr = `${startOfMonth.getFullYear()}-${String(startOfMonth.getMonth() + 1).padStart(2, '0')}-${String(startOfMonth.getDate()).padStart(2, '0')}T${String(startOfMonth.getHours()).padStart(2, '0')}:${String(startOfMonth.getMinutes()).padStart(2, '0')}:${String(startOfMonth.getSeconds()).padStart(2, '0')}`;
        const endOfMonthStr = `${endOfMonth.getFullYear()}-${String(endOfMonth.getMonth() + 1).padStart(2, '0')}-${String(endOfMonth.getDate()).padStart(2, '0')}T${String(endOfMonth.getHours()).padStart(2, '0')}:${String(endOfMonth.getMinutes()).padStart(2, '0')}:${String(endOfMonth.getSeconds()).padStart(2, '0')}`;

        // Don't change selectedDuration, just update custom date range and current date
        dispatch(setCustomDateRange({
          startDate: startOfMonthStr,
          endDate: endOfMonthStr
        }));
        dispatch(setCurrentDate(formatDateForState(newDate)));
        dispatch(setIsNavigating(true));
        return;
      case 'this-year':
        newDate = new Date(now);
        newDate.setFullYear(now.getFullYear() - 1);

        // Keep UI showing "this-year" but set custom date range for data fetching
        const startOfYear = new Date(newDate.getFullYear(), 0, 1);
        startOfYear.setHours(0, 0, 0, 0);
        const endOfYear = new Date(newDate.getFullYear(), 11, 31);
        endOfYear.setHours(23, 59, 59, 999);

        // Use local time components instead of toISOString()
        const startOfYearStr = `${startOfYear.getFullYear()}-${String(startOfYear.getMonth() + 1).padStart(2, '0')}-${String(startOfYear.getDate()).padStart(2, '0')}T${String(startOfYear.getHours()).padStart(2, '0')}:${String(startOfYear.getMinutes()).padStart(2, '0')}:${String(startOfYear.getSeconds()).padStart(2, '0')}`;
        const endOfYearStr = `${endOfYear.getFullYear()}-${String(endOfYear.getMonth() + 1).padStart(2, '0')}-${String(endOfYear.getDate()).padStart(2, '0')}T${String(endOfYear.getHours()).padStart(2, '0')}:${String(endOfYear.getMinutes()).padStart(2, '0')}:${String(endOfYear.getSeconds()).padStart(2, '0')}`;

        // Don't change selectedDuration, just update custom date range and current date
        // Setting custom date range for previous year
        dispatch(setCustomDateRange({
          startDate: startOfYearStr,
          endDate: endOfYearStr
        }));
        dispatch(setCurrentDate(formatDateForState(newDate)));
        dispatch(setIsNavigating(true));
        return;
      case 'custom':
        // Handle custom date range navigation
        if (!customDateRange.startDate || !customDateRange.endDate) {
          showSnackbar('Please select valid dates', 'error');
          return;
        }

        const currentStartDate = new Date(customDateRange.startDate);
        const currentEndDate = new Date(customDateRange.endDate);

        // Validate dates
        if (Number.isNaN(currentStartDate.getTime()) || Number.isNaN(currentEndDate.getTime())) {
          showSnackbar('Please select valid dates', 'error');
          return;
        }

        if (currentStartDate > currentEndDate) {
          showSnackbar('Please select valid dates', 'error');
          return;
        }

        const dayDiff = Math.ceil((currentEndDate - currentStartDate) / (1000 * 60 * 60 * 24)) + 1;

        const newStartDate = new Date(currentStartDate);
        newStartDate.setDate(newStartDate.getDate() - dayDiff);
        const newEndDate = new Date(currentEndDate);
        newEndDate.setDate(newEndDate.getDate() - dayDiff);

        // Use local time components instead of toISOString()
        const newStartDateStr = `${newStartDate.getFullYear()}-${String(newStartDate.getMonth() + 1).padStart(2, '0')}-${String(newStartDate.getDate()).padStart(2, '0')}T${String(newStartDate.getHours()).padStart(2, '0')}:${String(newStartDate.getMinutes()).padStart(2, '0')}:${String(newStartDate.getSeconds()).padStart(2, '0')}`;
        const newEndDateStr = `${newEndDate.getFullYear()}-${String(newEndDate.getMonth() + 1).padStart(2, '0')}-${String(newEndDate.getDate()).padStart(2, '0')}T${String(newEndDate.getHours()).padStart(2, '0')}:${String(newEndDate.getMinutes()).padStart(2, '0')}:${String(newEndDate.getSeconds()).padStart(2, '0')}`;

        dispatch(setCustomDateRange({
          startDate: newStartDateStr,
          endDate: newEndDateStr
        }));
        dispatch(setCurrentDate(formatDateForState(newStartDate)));
        dispatch(setIsNavigating(true));
        return;
      default:
        newDate = new Date(now);
        newDate.setDate(now.getDate() - 1);
    }

    dispatch(setCurrentDate(formatDateForState(newDate)));
    dispatch(setIsNavigating(true));
  };

  const handleNext = () => {
    const now = parseDateFromState(currentDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    let newDate;

    switch (selectedDuration) {
      case 'this-day':
        newDate = new Date(now);
        newDate.setDate(now.getDate() + 1);

        // Don't allow navigation to future dates
        if (newDate <= today) {
          // Keep UI showing "this-day" but set custom date range for data fetching
          const startDate = new Date(newDate);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(newDate);
          endDate.setHours(23, 59, 59, 999);

          // Use local time components instead of toISOString()
          const startDateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}T${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}:${String(startDate.getSeconds()).padStart(2, '0')}`;
          const endDateStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}T${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}:${String(endDate.getSeconds()).padStart(2, '0')}`;

          // Don't change selectedDuration, just update custom date range and current date
          dispatch(setCustomDateRange({
            startDate: startDateStr,
            endDate: endDateStr
          }));
          dispatch(setCurrentDate(formatDateForState(newDate)));
          dispatch(setIsNavigating(true));
        }
        return;
      case 'this-week':
        newDate = new Date(now);
        newDate.setDate(now.getDate() + 7);

        // Don't allow navigation to future weeks
        if (newDate <= today) {
          // Keep UI showing "this-week" but set custom date range for data fetching
          const startOfWeek = new Date(newDate);
          startOfWeek.setDate(newDate.getDate() - newDate.getDay()); // Start of week (Sunday)
          startOfWeek.setHours(0, 0, 0, 0);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week (Saturday)
          endOfWeek.setHours(23, 59, 59, 999);

          // Use local time components instead of toISOString()
          const startOfWeekStr = `${startOfWeek.getFullYear()}-${String(startOfWeek.getMonth() + 1).padStart(2, '0')}-${String(startOfWeek.getDate()).padStart(2, '0')}T${String(startOfWeek.getHours()).padStart(2, '0')}:${String(startOfWeek.getMinutes()).padStart(2, '0')}:${String(startOfWeek.getSeconds()).padStart(2, '0')}`;
          const endOfWeekStr = `${endOfWeek.getFullYear()}-${String(endOfWeek.getMonth() + 1).padStart(2, '0')}-${String(endOfWeek.getDate()).padStart(2, '0')}T${String(endOfWeek.getHours()).padStart(2, '0')}:${String(endOfWeek.getMinutes()).padStart(2, '0')}:${String(endOfWeek.getSeconds()).padStart(2, '0')}`;

          // Don't change selectedDuration, just update custom date range and current date
          dispatch(setCustomDateRange({
            startDate: startOfWeekStr,
            endDate: endOfWeekStr
          }));
          dispatch(setCurrentDate(formatDateForState(newDate)));
          dispatch(setIsNavigating(true));
        }
        return;
      case 'this-month':
        newDate = new Date(now);
        newDate.setMonth(now.getMonth() + 1);

        // Don't allow navigation to future months
        if (newDate <= today) {
          // Keep UI showing "this-month" but set custom date range for data fetching
          const startOfMonth = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
          startOfMonth.setHours(0, 0, 0, 0);
          const endOfMonth = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0);
          endOfMonth.setHours(23, 59, 59, 999);

          // Use local time components instead of toISOString()
          const startOfMonthStr = `${startOfMonth.getFullYear()}-${String(startOfMonth.getMonth() + 1).padStart(2, '0')}-${String(startOfMonth.getDate()).padStart(2, '0')}T${String(startOfMonth.getHours()).padStart(2, '0')}:${String(startOfMonth.getMinutes()).padStart(2, '0')}:${String(startOfMonth.getSeconds()).padStart(2, '0')}`;
          const endOfMonthStr = `${endOfMonth.getFullYear()}-${String(endOfMonth.getMonth() + 1).padStart(2, '0')}-${String(endOfMonth.getDate()).padStart(2, '0')}T${String(endOfMonth.getHours()).padStart(2, '0')}:${String(endOfMonth.getMinutes()).padStart(2, '0')}:${String(endOfMonth.getSeconds()).padStart(2, '0')}`;

          // Don't change selectedDuration, just update custom date range and current date
          dispatch(setCustomDateRange({
            startDate: startOfMonthStr,
            endDate: endOfMonthStr
          }));
          dispatch(setCurrentDate(formatDateForState(newDate)));
          dispatch(setIsNavigating(true));
        }
        return;
      case 'this-year':
        newDate = new Date(now);
        newDate.setFullYear(now.getFullYear() + 1);

        // Don't allow navigation to future years
        if (newDate.getFullYear() <= today.getFullYear()) {
          // Keep UI showing "this-year" but set custom date range for data fetching
          const startOfYear = new Date(newDate.getFullYear(), 0, 1);
          startOfYear.setHours(0, 0, 0, 0);
          const endOfYear = new Date(newDate.getFullYear(), 11, 31);
          endOfYear.setHours(23, 59, 59, 999);

          // Use local time components instead of toISOString()
          const startOfYearStr = `${startOfYear.getFullYear()}-${String(startOfYear.getMonth() + 1).padStart(2, '0')}-${String(startOfYear.getDate()).padStart(2, '0')}T${String(startOfYear.getHours()).padStart(2, '0')}:${String(startOfYear.getMinutes()).padStart(2, '0')}:${String(startOfYear.getSeconds()).padStart(2, '0')}`;
          const endOfYearStr = `${endOfYear.getFullYear()}-${String(endOfYear.getMonth() + 1).padStart(2, '0')}-${String(endOfYear.getDate()).padStart(2, '0')}T${String(endOfYear.getHours()).padStart(2, '0')}:${String(endOfYear.getMinutes()).padStart(2, '0')}:${String(endOfYear.getSeconds()).padStart(2, '0')}`;

          // Don't change selectedDuration, just update custom date range and current date
          dispatch(setCustomDateRange({
            startDate: startOfYearStr,
            endDate: endOfYearStr
          }));
          dispatch(setCurrentDate(formatDateForState(newDate)));
          dispatch(setIsNavigating(true));
        }
        return;
      case 'custom':
        // Handle custom date range navigation
        if (!customDateRange.startDate || !customDateRange.endDate) {
          showSnackbar('Please select valid dates', 'error');
          return;
        }

        const currentStartDate = new Date(customDateRange.startDate);
        const currentEndDate = new Date(customDateRange.endDate);

        // Validate dates
        if (Number.isNaN(currentStartDate.getTime()) || Number.isNaN(currentEndDate.getTime())) {
          showSnackbar('Please select valid dates', 'error');
          return;
        }

        if (currentStartDate > currentEndDate) {
          showSnackbar('Please select valid dates', 'error');
          return;
        }

        const dayDiff = Math.ceil((currentEndDate - currentStartDate) / (1000 * 60 * 60 * 24)) + 1;

        const newStartDate = new Date(currentStartDate);
        newStartDate.setDate(newStartDate.getDate() + dayDiff);
        const newEndDate = new Date(currentEndDate);
        newEndDate.setDate(newEndDate.getDate() + dayDiff);

        // Don't allow navigation to future dates
        if (newEndDate <= today) {
          // Use local time components instead of toISOString()
          const newStartDateStr = `${newStartDate.getFullYear()}-${String(newStartDate.getMonth() + 1).padStart(2, '0')}-${String(newStartDate.getDate()).padStart(2, '0')}T${String(newStartDate.getHours()).padStart(2, '0')}:${String(newStartDate.getMinutes()).padStart(2, '0')}:${String(newStartDate.getSeconds()).padStart(2, '0')}`;
          const newEndDateStr = `${newEndDate.getFullYear()}-${String(newEndDate.getMonth() + 1).padStart(2, '0')}-${String(newEndDate.getDate()).padStart(2, '0')}T${String(newEndDate.getHours()).padStart(2, '0')}:${String(newEndDate.getMinutes()).padStart(2, '0')}:${String(newEndDate.getSeconds()).padStart(2, '0')}`;

          dispatch(setCustomDateRange({
            startDate: newStartDateStr,
            endDate: newEndDateStr
          }));
          dispatch(setCurrentDate(formatDateForState(newStartDate)));
          dispatch(setIsNavigating(true));
        }
        return;
      default:
        newDate = new Date(now);
        newDate.setDate(now.getDate() + 1);
    }

    dispatch(setCurrentDate(formatDateForState(newDate)));
    dispatch(setIsNavigating(true));
  };

  // Helper functions for navigation display
  const getCurrentPeriodText = () => {
    if (selectedDuration === 'custom') {
      return 'Custom Date Range';
    }

    const now = parseDateFromState(currentDate);
    switch (selectedDuration) {
      case 'this-day':
        return now.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      case 'this-week':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case 'this-month':
        return now.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long'
        });
      case 'this-year':
        return now.getFullYear().toString();
      default:
        return 'Select Time Period';
    }
  };

  const getCurrentSelectionText = () => {
    if (selectedAreas.length === 0) {
      return 'All Areas (Project View)';
    }

    const areaNames = selectedAreas.map(areaId => {
      // Find area name from floors data
      const findAreaName = (nodes, targetAreaCode) => {
        for (const node of nodes) {
          if (node.area_code === targetAreaCode) {
            return node.area_name;
          }
          if (node.children && node.children.length > 0) {
            const found = findAreaName(node.children, targetAreaCode);
            if (found) return found;
          }
        }
        return targetAreaCode;
      };

      return findAreaName(floors, areaId);
    });

    return areaNames.join(', ');
  };

  const getNavigationButtonText = (direction) => {
    if (direction === 'previous') {
      switch (selectedDuration) {
        case 'this-day': return '← Previous Day';
        case 'this-week': return '← Previous Week';
        case 'this-month': return '← Previous Month';
        case 'this-year': return '← Previous Year';
        default: return '← Previous';
      }
    } else {
      switch (selectedDuration) {
        case 'this-day': return 'Next Day →';
        case 'this-week': return 'Next Week →';
        case 'this-month': return 'Next Month →';
        case 'this-year': return 'Next Year →';
        default: return 'Next →';
      }
    }
  };

  // Helper function to get widget titles from rename settings
  const getWidgetTitle = (widgetKey, fallbackTitle) => {
    if (!widgetList?.titles) return fallbackTitle;

    const widget = widgetList.titles.find(w => w.key === widgetKey);
    return widget?.title || fallbackTitle;
  };

  // Handle export actions
  const handleExport = async (action, chartTitle, dropdownKey = null) => {
    try {
      if (dropdownKey) {
        setShowExportDropdown(prev => ({ ...prev, [dropdownKey]: false }));
      }

      setExportLoading(prev => ({ ...prev, [`${chartTitle}_${action}`]: true }));

      // Build API parameters - Use same logic as Dashboard component
      const apiParams = {
        // CORRECT LOGIC: If floor is selected, send ONLY floorIds, NOT areaIds
        areaIds: (selectedFloorIds && selectedFloorIds.length > 0) ? [] : (selectedAreas.length > 0 ? selectedAreas : []),
        floorIds: selectedFloorIds && selectedFloorIds.length > 0 ? selectedFloorIds : [],
        timeRange: selectedDuration,
        startDate: customDateRange.startDate,
        endDate: customDateRange.endDate,
        isNavigating: isNavigating
      };


      if (action === 'email') {
        // Handle email export
        const emailAction = async (email) => {
          try {
            let result;
            // Use dropdownKey and chartTitle to identify the chart type
            if (dropdownKey === 'instant' || chartTitle.includes('Instant Occupancy Count') || chartTitle.includes('instant_occupancy_count')) {
              // Instant Occupancy Count chart - Use instant endpoint for Charts tab
              if (showChartsTab) {
                result = await dispatch(sendInstantOccupancyCountEmail({ toEmail: email, ...apiParams }));
              } else {
                result = await dispatch(sendOccupancyCountEmail({ toEmail: email, ...apiParams }));
              }
            } else if (dropdownKey === 'pie' && showChartsTab) {
              // Occupancy by Group chart in Charts tab - Use _from_logs endpoint
              result = await dispatch(sendOccupancyByGroupFromLogsEmail({ toEmail: email, ...apiParams }));
            } else if (dropdownKey === 'pie' && !showChartsTab) {
              // Utilization By Area Groups chart in Space Utilization tab - Use regular endpoint
              result = await dispatch(sendOccupancyByGroupEmail({ toEmail: email, ...apiParams }));
            } else if (chartTitle.includes('utilization_by_area_group') || chartTitle.includes('Occupancy by Group') || (chartTitle.includes('Area Groups') && !chartTitle.includes('Utilization By Area'))) {
              // Occupancy by Group chart - Use _from_logs endpoint for Charts tab, regular endpoint for Space Utilization tab
              if (showChartsTab) {
                result = await dispatch(sendOccupancyByGroupFromLogsEmail({ toEmail: email, ...apiParams }));
              } else {
                result = await dispatch(sendOccupancyByGroupEmail({ toEmail: email, ...apiParams }));
              }
            } else if (chartTitle.includes('Utilization By Area') && !chartTitle.includes('Groups')) {
              // Utilization By Area chart - Use _from_logs endpoint for Charts tab
              if (showChartsTab) {
                result = await dispatch(sendSpaceUtilizationPerFromLogsEmail({ toEmail: email, ...apiParams }));
              } else {
                result = await dispatch(sendSpaceUtilizationPerEmail({ toEmail: email, ...apiParams }));
              }
            } else if (chartTitle.includes('Utilization') && !chartTitle.includes('Area') && !chartTitle.includes('Occupancy by Group')) {
              // Utilization chart (occupancy count) - regular endpoint for Space Utilization tab
              result = await dispatch(sendOccupancyCountEmail({ toEmail: email, ...apiParams }));
            }

            if (result.type.endsWith('/fulfilled')) {
              // Check if payload contains error status
              if (result.payload && typeof result.payload === 'object' && (result.payload.status === 'error' || result.payload.state === 'error')) {
                // API returned error in payload even though action was fulfilled
                const errorMessage = result.payload.message || 'Unknown error occurred';
                showSnackbar(`Email sending failed. Following is the error: ${errorMessage}`, 'error');
              } else {
                // Success
                showSnackbar('Email sent successfully!', 'success');
              }
            } else {
              const errorMessage = result.payload?.message || result.payload || 'Unknown error occurred';
              showSnackbar(`Email sending failed. Following is the error: ${errorMessage}`, 'error');
            }
          } catch (error) {
            showSnackbar('Failed to send email. Please try again.', 'error');
          } finally {
            setExportLoading(prev => ({ ...prev, [`${chartTitle}_email`]: false }));
          }
        };

        await handleEmailDialogOpen(emailAction);
      } else if (action === 'download') {
        // Handle download export
        try {
          let result;
          // Use dropdownKey and chartTitle to identify the chart type
          if (dropdownKey === 'instant' || chartTitle.includes('Instant Occupancy Count') || chartTitle.includes('instant_occupancy_count')) {
            // Instant Occupancy Count chart - Use instant endpoint for Charts tab
            if (showChartsTab) {
              result = await dispatch(downloadInstantOccupancyCount(apiParams));
            } else {
              result = await dispatch(downloadOccupancyCount(apiParams));
            }
          } else if (dropdownKey === 'pie' && showChartsTab) {
            // Occupancy by Group chart in Charts tab - Use _from_logs endpoint
            result = await dispatch(downloadOccupancyByGroupFromLogs(apiParams));
          } else if (dropdownKey === 'pie' && !showChartsTab) {
            // Utilization By Area Groups chart in Space Utilization tab - Use regular endpoint
            result = await dispatch(downloadOccupancyByGroup(apiParams));
          } else if (chartTitle.includes('utilization_by_area_group') || chartTitle.includes('Occupancy by Group') || (chartTitle.includes('Area Groups') && !chartTitle.includes('Utilization By Area'))) {
            // Occupancy by Group chart - Use _from_logs endpoint for Charts tab, regular endpoint for Space Utilization tab
            if (showChartsTab) {
              result = await dispatch(downloadOccupancyByGroupFromLogs(apiParams));
            } else {
              result = await dispatch(downloadOccupancyByGroup(apiParams));
            }
          } else if (chartTitle.includes('Utilization By Area') && !chartTitle.includes('Groups')) {
            // Utilization By Area chart - Use _from_logs endpoint for Charts tab
            if (showChartsTab) {
              result = await dispatch(downloadSpaceUtilizationPerFromLogs(apiParams));
            } else {
              result = await dispatch(downloadSpaceUtilizationPer(apiParams));
            }
          } else if (chartTitle.includes('Utilization') && !chartTitle.includes('Area') && !chartTitle.includes('Occupancy by Group')) {
            // Utilization chart (occupancy count) - regular endpoint for Space Utilization tab
            result = await dispatch(downloadOccupancyCount(apiParams));
          }

          if (result.type.endsWith('/fulfilled')) {
            showSnackbar('Download started successfully!', 'success');
          } else {
            showSnackbar(result.payload || 'Failed to start download. Please try again.', 'error');
          }
        } catch (error) {
          showSnackbar('Failed to start download. Please try again.', 'error');
        } finally {
          setExportLoading(prev => ({ ...prev, [`${chartTitle}_download`]: false }));
        }
      }
    } catch (error) {
      showSnackbar('Export failed. Please try again.', 'error');
      setExportLoading(prev => ({ ...prev, [`${chartTitle}_${action}`]: false }));
    }
  };

  // Add click outside handler to close export dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      try {
        const isExportButton = event.target.closest('button') &&
          event.target.closest('button').textContent &&
          event.target.closest('button').textContent.includes('   Export')

        const isInsideDropdown = event.target.closest('div[style*="position: absolute"]') &&
          event.target.closest('div[style*="position: absolute"]').style &&
          event.target.closest('div[style*="position: absolute"]').style.backgroundColor === 'rgb(205, 192, 160)'

        if (!isExportButton && !isInsideDropdown) {
          setShowExportDropdown({ line: false, pie: false, table: false, peak: false, instant: false })
        }
      } catch (error) {
        // Fallback: close all dropdowns on error
        setShowExportDropdown({ line: false, pie: false, table: false, peak: false })
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Process data for area list - Remove hardcoded data, use real API data
  const processAreaData = () => {

    try {
      // Check if API returned an error
      if (activeSpaceUtilizationPerArea && activeSpaceUtilizationPerArea.status === 'error') {
        return []
      }

      // Handle the wrapped data format from API
      let areaDataArray = activeSpaceUtilizationPerArea
      if (activeSpaceUtilizationPerArea && activeSpaceUtilizationPerArea.utilized_area) {
        areaDataArray = activeSpaceUtilizationPerArea
      } else if (!activeSpaceUtilizationPerArea) {
        return []
      }

      // Ensure we have the utilized_area array
      if (!areaDataArray.utilized_area || !Array.isArray(areaDataArray.utilized_area)) {
        return []
      }

      return areaDataArray.utilized_area
        .filter(area => area && typeof area === 'object' && area.name && typeof area.occupied === 'number')
        .map(area => ({
          name: area.name || 'Unknown Area',
          percentage: Math.min(area.occupied || 0, 100) // Cap percentage at 100%
        }))
        .sort((a, b) => b.percentage - a.percentage)
    } catch (error) {
      return []
    }
  }

  const areaData = processAreaData()


  // Helper function to calculate peak and min values from chart data
  // Uses instantOccupancyCount for Charts tab, occupancyCount for Space Utilization tab
  const calculatePeakMinFromChartData = () => {
    try {
      // Determine which data source to use based on showChartsTab
      const dataSource = showChartsTab ? instantOccupancyCount : occupancyCount;

      // Check if we have data
      if (!dataSource || dataSource.status === 'error') {
        return { peak: null, min: null, peakTime: null, minTime: null };
      }

      // Handle the data format from API
      let chartData = dataSource;
      if (dataSource && dataSource['x-axis'] && dataSource['y-axis']) {
        chartData = dataSource;
      } else {
        return { peak: null, min: null, peakTime: null, minTime: null };
      }

      // Get the occupancy values and corresponding times
      // Updated to match backend data structure - backend returns y-axis.data instead of y-axis.Combined Areas
      const occupancyValues = chartData['y-axis']['data'] || [];
      const timeLabels = chartData['x-axis'] || [];

      // Filter out null/undefined values and create valid data points
      const validDataPoints = [];
      for (let i = 0; i < occupancyValues.length; i++) {
        const value = occupancyValues[i];
        const time = timeLabels[i];

        if (value !== null && value !== undefined && time) {
          validDataPoints.push({ value, time, index: i });
        }
      }

      if (validDataPoints.length === 0) {
        return { peak: null, min: null, peakTime: null, minTime: null };
      }

      // Find peak (maximum) and min (minimum) values
      const peakPoint = validDataPoints.reduce((max, current) =>
        current.value > max.value ? current : max
      );

      const minPoint = validDataPoints.reduce((min, current) =>
        current.value < min.value ? current : min
      );

      return {
        peak: peakPoint.value,
        min: minPoint.value,
        peakTime: peakPoint.time,
        minTime: minPoint.time
      };
    } catch (error) {
      return { peak: null, min: null, peakTime: null, minTime: null };
    }
  }

  // Helper function to format peak/min time - convert date format to weekday for current week
  const formatPeakMinTime = useCallback((timeString) => {
    if (!timeString) {
      return timeString;
    }

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
      const dateTimeMatch = timeString.match(/^(\d{1,2})\/(\d{1,2})(?:\s+(\d+))?$/);
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

    return timeString;
  }, [selectedDuration, currentDate]);

  // Helper function to validate data structure
  const validateDataStructure = (data, expectedKeys) => {
    try {
      if (!data || typeof data !== 'object') return false
      return expectedKeys.every(key => data.hasOwnProperty(key))
    } catch (error) {
      return false
    }
  }


  const ExportDropdown = ({ isOpen, onClose, chartTitle, dropdownKey }) => {
    const emailLoadingKey = `${chartTitle}_email`;
    const downloadLoadingKey = `${chartTitle}_download`;
    const isEmailLoading = exportLoading[emailLoadingKey] || false;
    const isDownloadLoading = exportLoading[downloadLoadingKey] || false;

    return (
      isOpen && (
        <div
          ref={exportDropdownRef}
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            backgroundColor: '#CDC0A0',
            border: '1px solid #444',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 1000,
            minWidth: isLargeScreen ? '200px' : '180px',
            padding: '8px 0'
          }}
        >
          <button
            onClick={() => handleExport('email', chartTitle, dropdownKey)}
            disabled={isEmailLoading}
            style={{
              width: '100%',
              padding: isLargeScreen ? '14px 18px' : '12px 16px',
              border: 'none',
              background: 'none',
              cursor: isEmailLoading ? 'not-allowed' : 'pointer',
              textAlign: 'left',
              fontSize: isLargeScreen ? '15px' : '14px',
              color: isEmailLoading ? '#999' : '#fff',
              fontWeight: '500',
              borderBottom: '1px solid #444',
              opacity: isEmailLoading ? 0.6 : 1,
            }}
          >
            {isEmailLoading ? 'Sending...' : 'Send By Email'}
          </button>
          <button
            onClick={() => handleExport('download', chartTitle, dropdownKey)}
            disabled={isDownloadLoading}
            style={{
              width: '100%',
              padding: isLargeScreen ? '14px 18px' : '12px 16px',
              border: 'none',
              background: 'none',
              cursor: isDownloadLoading ? 'not-allowed' : 'pointer',
              textAlign: 'left',
              fontSize: isLargeScreen ? '15px' : '14px',
              color: isDownloadLoading ? '#999' : '#fff',
              fontWeight: '500',
              opacity: isDownloadLoading ? 0.6 : 1,
            }}
          >
            {isDownloadLoading ? 'Downloading...' : 'Download To PC'}
          </button>
        </div>
      )
    )
  }

  // Line Chart Component - Remove hardcoded sample data
  const LineChartComponent = () => {
    try {
      // Show loading state when data is being fetched
      if (occupancyCountLoading) {
        return (
          <div style={{
            height: '350px',
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
        )
      }

      // Check if API returned an error
      if (occupancyCount && occupancyCount.status === 'error') {
        return (
          <div style={{
            height: '350px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: '#767061',
            color: '#fff',
            fontSize: '14px'
          }}>
            Error loading occupancy data
          </div>
        )
      }


      // Handle the data format from API
      let chartData = occupancyCount
      if (occupancyCount && occupancyCount['x-axis'] && occupancyCount['y-axis']) {
        chartData = occupancyCount
      } else if (!occupancyCount && !occupancyCountLoading) {
        return (
          <div style={{
            height: '350px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: '#767061',
            color: '#fff',
            fontSize: '14px'
          }}>
            No occupancy data available for Utilization
          </div>
        )
      } else if (!occupancyCount) {
        // Show loading when data is being fetched
        return (
          <div style={{
            height: '350px',
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
        )
      }

      // Process data based on selected duration
      // Updated to match backend data structure - backend returns y-axis.data instead of y-axis.Combined Areas
      const allData = chartData['x-axis'].map((date, index) => ({
        date: date,
        occupancy: chartData['y-axis']['data'][index] ?? null
      }))

      let processedChartData = allData;

      // For day view, ensure all 24 hours are shown with proper spacing
      if (selectedDuration === 'this-day') {
        // Create a map of all actual data points by time for quick lookup
        const dataMap = new Map();
        allData.forEach(item => {
          if (item.date) {
            dataMap.set(item.date, item);
          }
        });

        // Start with ALL actual data points - no purging, no merging
        const complete24HourData = [];

        // Add all actual data points exactly as received from backend
        allData.forEach(item => {
          complete24HourData.push({
            date: item.date,
            occupancy: item.occupancy !== null && item.occupancy !== undefined ? item.occupancy : null
          });
        });

        // Now ensure all 24 hours (00:00 to 23:00) are present for x-axis display
        // Add hour markers only if they don't already exist in the data
        for (let hour = 0; hour < 24; hour++) {
          const hourLabel = `${hour.toString().padStart(2, '0')}:00`;

          // Check if this hour already exists in the data
          const hourExists = complete24HourData.some(item => item.date === hourLabel);

          // If hour doesn't exist, add it with null value to maintain x-axis structure
          if (!hourExists) {
            complete24HourData.push({
              date: hourLabel,
              occupancy: null
            });
          }
        }

        // Sort by time to ensure proper ordering and line connection
        processedChartData = complete24HourData.sort((a, b) => {
          const timeA = a.date || '';
          const timeB = b.date || '';
          return timeA.localeCompare(timeB);
        });
      } else if (selectedDuration === 'this-week') {
        // For week view, ensure all 7 days are shown on x-axis
        // Map all data points preserving null values
        const dataMap = new Map();
        allData.forEach(item => {
          if (item.date) {
            dataMap.set(item.date, item);
          }
        });

        // Expected days for a week: Sun, Mon, Tue, Wed, Thu, Fri, Sat
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const timeSlots = [0, 6, 12, 18]; // Expected time slots per day
        const completeWeekData = [];

        // Build complete week structure
        dayNames.forEach(dayName => {
          timeSlots.forEach(timeSlot => {
            const expectedLabel = `${dayName} ${timeSlot}`;
            if (dataMap.has(expectedLabel)) {
              const item = dataMap.get(expectedLabel);
              completeWeekData.push({
                date: expectedLabel,
                occupancy: item.occupancy !== null && item.occupancy !== undefined ? item.occupancy : null
              });
            } else {
              // Add missing time slot with null value to maintain x-axis structure
              completeWeekData.push({
                date: expectedLabel,
                occupancy: null
              });
            }
          });
        });

        // Add any additional data points that don't match the expected structure
        allData.forEach(item => {
          if (item.date && !completeWeekData.some(d => d.date === item.date)) {
            completeWeekData.push({
              date: item.date,
              occupancy: item.occupancy !== null && item.occupancy !== undefined ? item.occupancy : null
            });
          }
        });

        // Sort by day and time
        processedChartData = completeWeekData.sort((a, b) => {
          const dayOrder = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };
          const matchA = a.date.match(/^(\w+)\s+(\d+)$/);
          const matchB = b.date.match(/^(\w+)\s+(\d+)$/);

          if (matchA && matchB) {
            const dayA = dayOrder[matchA[1]] ?? 99;
            const dayB = dayOrder[matchB[1]] ?? 99;
            if (dayA !== dayB) return dayA - dayB;
            return parseInt(matchA[2]) - parseInt(matchB[2]);
          }
          return (a.date || '').localeCompare(b.date || '');
        });
      } else if (selectedDuration === 'this-year') {
        // For year view, ensure all 12 months × 4 quarters = 48 data points are shown even if they have no data
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // Create a map of existing data points by month-quarter key (e.g., "Jan-0", "Jan-1", "Jan-2", "Jan-3")
        const dataMap = new Map();
        allData.forEach(item => {
          if (item.date) {
            // Handle both formats: "Jan-0", "Jan-1", "Dec-3" or "1/2025-0", "12/2025-3"
            const monthQuarterMatch = String(item.date).match(/^([A-Za-z]{3})-(\d+)$/) || String(item.date).match(/^(\d{1,2})\/(\d{4})-(\d+)$/);
            if (monthQuarterMatch) {
              let monthIndex;
              let quarter;

              if (monthQuarterMatch[1].length === 3) {
                // Month name format (Jan, Feb, etc.)
                monthIndex = MONTH_NAME_TO_INDEX[monthQuarterMatch[1]];
                quarter = parseInt(monthQuarterMatch[2]);
              } else {
                // Number format (1, 2, etc.)
                monthIndex = parseInt(monthQuarterMatch[1]) - 1;
                quarter = parseInt(monthQuarterMatch[3]);
              }

              if (monthIndex !== undefined && monthIndex >= 0 && monthIndex < 12 && quarter >= 0 && quarter <= 3) {
                const monthKey = `${monthNames[monthIndex]}-${quarter}`;
                dataMap.set(monthKey, {
                  date: `${monthNames[monthIndex]}-${quarter}`,
                  occupancy: item.occupancy !== null && item.occupancy !== undefined ? item.occupancy : null
                });
              }
            }
          }
        });

        // Build complete year data with all 12 months × 4 quarters = 48 data points
        const completeYearData = [];
        monthNames.forEach(monthName => {
          // Add all 4 quarters for each month
          for (let quarter = 0; quarter < 4; quarter++) {
            const monthQuarterKey = `${monthName}-${quarter}`;
            if (dataMap.has(monthQuarterKey)) {
              completeYearData.push(dataMap.get(monthQuarterKey));
            } else {
              // Add quarter with null value if no data exists
              completeYearData.push({
                date: `${monthName}-${quarter}`,
                occupancy: null
              });
            }
          }
        });

        processedChartData = completeYearData;
      } else if (selectedDuration === 'this-month') {
        // For month view, ensure all days of the month are shown (28/30/31 days)
        const targetDate = parseDateFromState(currentDate);
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Create a map of existing data points by day
        const dataMap = new Map();
        allData.forEach(item => {
          if (item.date) {
            const dateStr = String(item.date).trim();
            // Handle format: just day number like "1", "2", "3", etc.
            const dayOnlyMatch = dateStr.match(/^(\d{1,2})$/);
            if (dayOnlyMatch) {
              const day = parseInt(dayOnlyMatch[1]);
              if (day >= 1 && day <= daysInMonth) {
                dataMap.set(day, {
                  date: String(day), // Keep original format as "1", "2", etc.
                  occupancy: item.occupancy !== null && item.occupancy !== undefined ? item.occupancy : null
                });
              }
            } else {
              // Handle date formats like "1/12", "15/12", "31/12"
              const dateMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})(?:\s+\d+)?$/);
              if (dateMatch) {
                const day = parseInt(dateMatch[1]);
                const dataMonth = parseInt(dateMatch[2]);
                // Check if the date matches the current month
                if (dataMonth === month + 1 && day >= 1 && day <= daysInMonth) {
                  dataMap.set(day, {
                    date: String(day), // Convert to day number format to match API response
                    occupancy: item.occupancy !== null && item.occupancy !== undefined ? item.occupancy : null
                  });
                }
              }
            }
          }
        });

        // Build complete month data with all days
        const completeMonthData = [];
        for (let day = 1; day <= daysInMonth; day++) {
          if (dataMap.has(day)) {
            completeMonthData.push(dataMap.get(day));
          } else {
            // Add missing day with null value to maintain x-axis structure
            completeMonthData.push({
              date: String(day), // Use day number format like "1", "2", etc. to match API response
              occupancy: null
            });
          }
        }

        processedChartData = completeMonthData;
      } else if (selectedDuration === 'custom') {
        // Check if custom period is a week (7 days) or month (28-31 days)
        let isWeekPeriod = false;
        let isMonthPeriod = false;
        let customStartDate = null;
        let customEndDate = null;
        let diffDays = 0;

        if (customDateRange.startDate && customDateRange.endDate) {
          try {
            const startDate = new Date(customDateRange.startDate);
            const endDate = new Date(customDateRange.endDate);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(0, 0, 0, 0);
            customStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
            customEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
            const diffTime = customEndDate.getTime() - customStartDate.getTime();
            diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
            // Consider 2-7 day periods as week periods (to show only 0th positions)
            isWeekPeriod = diffDays >= 2 && diffDays <= 7;
            // Check if it's a month period (28-31 days)
            isMonthPeriod = diffDays >= 28 && diffDays <= 31;
          } catch (error) {
            isWeekPeriod = false;
            isMonthPeriod = false;
          }
        }

        if (isWeekPeriod) {
          // CRITICAL: First filter allData to only include 0th positions before processing
          // This ensures we never add non-0th positions to the chart data
          const filteredAllData = allData.filter(item => {
            if (!item.date) return false;
            const dateStr = String(item.date).trim();
            const match = dateStr.match(/^([A-Za-z]{3})\s+(\d+)$/);
            // Only include 0th positions
            return match && parseInt(match[2]) === 0;
          });

          // Use filtered data instead of allData
          const dataMap = new Map();
          filteredAllData.forEach(item => {
            if (item.date) {
              dataMap.set(item.date, item);
            }
          });

          // Expected days for a week: Sun, Mon, Tue, Wed, Thu, Fri, Sat
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const timeSlots = [0]; // Only show 0th position for each day
          const completeWeekData = [];

          // Build complete week structure - only 0th position for each day
          dayNames.forEach(dayName => {
            timeSlots.forEach(timeSlot => {
              const expectedLabel = `${dayName} ${timeSlot}`;
              if (dataMap.has(expectedLabel)) {
                const item = dataMap.get(expectedLabel);
                // Preserve zero values - convert null/undefined to 0, but keep actual 0 values
                const occupancyValue = item.occupancy !== null && item.occupancy !== undefined ? item.occupancy : 0;
                completeWeekData.push({
                  date: expectedLabel,
                  occupancy: occupancyValue
                });
              } else {
                // Add missing time slot with 0 value to maintain x-axis structure
                completeWeekData.push({
                  date: expectedLabel,
                  occupancy: 0
                });
              }
            });
          });

          // Add any additional data points that don't match the expected structure
          // But only include 0th positions for custom week periods (already filtered above)
          filteredAllData.forEach(item => {
            if (item.date && !completeWeekData.some(d => d.date === item.date)) {
              // Only add if it's a 0th position (already filtered, but double-check)
              const match = String(item.date).match(/^([A-Za-z]{3})\s+(\d+)$/);
              if (match && parseInt(match[2]) === 0) {
                const occupancyValue = item.occupancy !== null && item.occupancy !== undefined ? item.occupancy : 0;
                completeWeekData.push({
                  date: item.date,
                  occupancy: occupancyValue
                });
              }
            }
          });

          // Sort by day and time, then filter to ensure only 0th positions
          processedChartData = completeWeekData
            .filter(item => {
              // Only include 0th positions (e.g., "Sun 0", "Mon 0", etc.)
              const match = item.date && String(item.date).match(/^([A-Za-z]{3})\s+(\d+)$/);
              return match && parseInt(match[2]) === 0;
            })
            .sort((a, b) => {
              const dayOrder = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };
              const matchA = a.date.match(/^(\w+)\s+(\d+)$/);
              const matchB = b.date.match(/^(\w+)\s+(\d+)$/);

              if (matchA && matchB) {
                const dayA = dayOrder[matchA[1]] ?? 99;
                const dayB = dayOrder[matchB[1]] ?? 99;
                if (dayA !== dayB) return dayA - dayB;
                return parseInt(matchA[2]) - parseInt(matchB[2]);
              }
              return (a.date || '').localeCompare(b.date || '');
            });
        } else if (isMonthPeriod && customStartDate && customEndDate) {
          // For custom month period, show ALL days in the range (1, 2, 3, 4, 5, 6, etc.)
          const dataMap = new Map();
          allData.forEach(item => {
            if (item.date) {
              const dateStr = String(item.date).trim();
              dataMap.set(dateStr, {
                date: dateStr,
                occupancy: item.occupancy !== null && item.occupancy !== undefined ? item.occupancy : null
              });
            }
          });

          // Build complete month data with ALL days in the custom range
          const completeMonthData = [];
          const currentDate = new Date(customStartDate);

          while (currentDate <= customEndDate) {
            const dayOfMonth = currentDate.getDate();
            const dayStr = String(dayOfMonth);

            // Try to find data for this day in various formats
            let foundData = null;

            // First try exact day number match
            if (dataMap.has(dayStr)) {
              foundData = dataMap.get(dayStr);
            } else {
              // Try date format like "11/12" or "22/12"
              const monthDay = currentDate.getMonth() + 1;
              const dateFormat1 = `${dayOfMonth}/${monthDay}`;
              const dateFormat2 = `${dayOfMonth}/${String(monthDay).padStart(2, '0')}`;

              if (dataMap.has(dateFormat1)) {
                foundData = dataMap.get(dateFormat1);
                foundData.date = dayStr; // Normalize to day number format
              } else if (dataMap.has(dateFormat2)) {
                foundData = dataMap.get(dateFormat2);
                foundData.date = dayStr; // Normalize to day number format
              }
            }

            if (foundData) {
              completeMonthData.push(foundData);
            } else {
              // Add missing day with null value to maintain x-axis structure
              completeMonthData.push({
                date: dayStr,
                occupancy: null
              });
            }

            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
          }

          processedChartData = completeMonthData;
        } else if (customStartDate && customEndDate) {
          // For other custom periods, ensure ALL days in the range are included
          // This ensures all day labels (11, 12, 13, 14, 15, 16, etc.) are displayed
          const dataMap = new Map();
          allData.forEach(item => {
            if (item.date) {
              const dateStr = String(item.date).trim();
              dataMap.set(dateStr, {
                date: dateStr,
                occupancy: item.occupancy !== null && item.occupancy !== undefined ? item.occupancy : null
              });
            }
          });

          // Build complete data with ALL days in the custom range
          const completeCustomData = [];
          const currentDate = new Date(customStartDate);

          while (currentDate <= customEndDate) {
            const dayOfMonth = currentDate.getDate();
            const dayStr = String(dayOfMonth);

            // Try to find data for this day in various formats
            let foundData = null;

            // First try exact day number match
            if (dataMap.has(dayStr)) {
              foundData = dataMap.get(dayStr);
            } else {
              // Try date format like "11/12" or "22/12"
              const monthDay = currentDate.getMonth() + 1;
              const dateFormat1 = `${dayOfMonth}/${monthDay}`;
              const dateFormat2 = `${dayOfMonth}/${String(monthDay).padStart(2, '0')}`;

              if (dataMap.has(dateFormat1)) {
                foundData = dataMap.get(dateFormat1);
                foundData.date = dayStr; // Normalize to day number format
              } else if (dataMap.has(dateFormat2)) {
                foundData = dataMap.get(dateFormat2);
                foundData.date = dayStr; // Normalize to day number format
              }
            }

            if (foundData) {
              completeCustomData.push(foundData);
            } else {
              // Add missing day with null value to maintain x-axis structure
              completeCustomData.push({
                date: dayStr,
                occupancy: null
              });
            }

            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
          }

          processedChartData = completeCustomData;
        } else {
          // No custom date range, but check if it's a week period anyway
          // This handles cases where customDateRange might not be set but duration is custom
          // Consider 2-7 day periods as week periods (to show only 0th positions)
          if (diffDays >= 2 && diffDays <= 7) {
            // Filter to only 0th positions for week periods
            processedChartData = allData
              .filter(item => {
                if (!item.date) return false;
                const match = String(item.date).match(/^([A-Za-z]{3})\s+(\d+)$/);
                // Only keep items that match day format and are 0th position
                return match && parseInt(match[2]) === 0;
              })
              .map(item => ({
                date: item.date,
                occupancy: item.occupancy !== null && item.occupancy !== undefined ? item.occupancy : 0
              }));
          } else {
            // Use data as-is
            let mappedData = allData.map(item => ({
              date: item.date,
              occupancy: item.occupancy !== null && item.occupancy !== undefined ? item.occupancy : null
            }));
            processedChartData = mappedData;
          }
        }
      } else {
        // For other durations (non-custom), preserve null values - don't convert to 0
        // Remove trailing null values so chart only shows data up to where it actually exists
        let mappedData = allData.map(item => ({
          date: item.date,
          occupancy: item.occupancy !== null && item.occupancy !== undefined ? item.occupancy : null
        }));

        // Remove trailing null values from the end
        while (mappedData.length > 0 && (mappedData[mappedData.length - 1].occupancy === null || mappedData[mappedData.length - 1].occupancy === undefined)) {
          mappedData.pop();
        }

        processedChartData = mappedData;
      }

      // Always show the chart with the data received from backend
      // No need for complex stale data checking - just display what we have

      // Always show the chart with the data received from backend (like Energy dashboard)
      // No need for strict validation - just display what the backend provides

      // Always show the chart with x-axis labels and grid lines, even for null data (like Energy dashboard)
      // The chart library will handle null values naturally

      // Check if we have any non-null values from the limited 24-hour data
      const limitedOccupancyValues = processedChartData.map(item => item.occupancy)
      const nonNullValues = limitedOccupancyValues.filter(val => val !== null && val !== undefined)
      const maxOccupancy = nonNullValues.length > 0 ? Math.max(...nonNullValues.map(val => val), 1) : 1

      // Helper function to determine if we should show percentage or count
      const shouldShowPercentage = () => {
        if (selectedDuration === 'this-day') {
          return false; // Day view shows count
        }
        if (selectedDuration === 'custom') {
          // For custom, check if it's a single day or longer
          if (customDateRange.startDate && customDateRange.endDate) {
            try {
              const startDate = new Date(customDateRange.startDate);
              const endDate = new Date(customDateRange.endDate);
              startDate.setHours(0, 0, 0, 0);
              endDate.setHours(0, 0, 0, 0);
              const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
              const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
              const diffTime = endDateOnly.getTime() - startDateOnly.getTime();
              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
              return diffDays > 1; // More than 1 day = percentage, 1 day = count
            } catch (error) {
              return true; // Default to percentage for custom
            }
          }
          return true; // Default to percentage for custom
        }
        // Week, month, year all show percentage
        return true;
      };

      const showPercentage = shouldShowPercentage();

      // Chart configuration based on data point count and format
      const getChartConfig = () => {
        const dataPointCount = processedChartData.length;

        // Check if custom period is a week (7 days) or month (28-31 days)
        let isCustomWeek = false;
        let isCustomMonth = false;
        if (selectedDuration === 'custom' && customDateRange.startDate && customDateRange.endDate) {
          try {
            const startDate = new Date(customDateRange.startDate);
            const endDate = new Date(customDateRange.endDate);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(0, 0, 0, 0);
            const diffTime = endDate.getTime() - startDate.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
            // Consider 2-7 day periods as week periods (to show only 0th positions)
            isCustomWeek = diffDays >= 2 && diffDays <= 7;
            // Check if it's a month period (28-31 days)
            isCustomMonth = diffDays >= 28 && diffDays <= 31;
          } catch (error) {
            isCustomWeek = false;
            isCustomMonth = false;
          }
        }

        // Determine configuration based on selected duration and data point count
        if (selectedDuration === 'this-day') {
          // 24-hour data: 96 points = 24 hours × 4 intervals per hour
          return {
            xAxisInterval: 3, // Show every 4th tick (every hour)
            xAxisTickCount: 24, // Show 24 ticks for 24 hours
            xAxisFontSize: 10
          };
        } else if (selectedDuration === 'this-week' || isCustomWeek) {
          // Week data: 7 points = 7 days × 1 interval per day (only 0th position for custom)
          return {
            xAxisInterval: isCustomWeek ? 0 : 3, // Show all ticks for custom week, every 4th for regular week
            xAxisTickCount: 7, // Show 7 ticks for 7 days
            xAxisFontSize: 10
          };
        } else if (selectedDuration === 'this-month' || isCustomMonth) {
          // Month data: varies, but typically 30-31 points
          // For custom month, show all days (interval 0) to display all points
          return {
            xAxisInterval: isCustomMonth ? 0 : 2, // Show all ticks for custom month, every 3rd for regular month
            xAxisTickCount: isCustomMonth ? dataPointCount : Math.min(10, Math.ceil(dataPointCount / 3)), // Show all ticks for custom month
            xAxisFontSize: 9
          };
        } else if (selectedDuration === 'this-year') {
          // Year data: 48 points = 12 months × 4 quarters per month
          // Show month names only for the first quarter (0) of each month
          return {
            xAxisInterval: 0, // Show all ticks, but formatXAxisLabel will filter to show only quarter 0
            xAxisTickCount: 12, // Show 12 ticks for 12 months (one per month)
            xAxisFontSize: 9
          };
        } else if (selectedDuration === 'custom') {
          // Custom periods - show ALL day labels (interval 0) to display all points
          return {
            xAxisInterval: 0, // Show all ticks to display all day labels
            xAxisTickCount: dataPointCount, // Show all ticks for all days in range
            xAxisFontSize: 9
          };
        } else {
          // Other durations
          return {
            xAxisInterval: 2,
            xAxisTickCount: Math.min(10, Math.ceil(dataPointCount / 3)),
            xAxisFontSize: 10
          };
        }
      };

      // Final safety filter: For custom week periods (2-7 days), ensure only 0th positions are in the data
      // This MUST run before getChartConfig to ensure correct data point count
      if (selectedDuration === 'custom' && customDateRange.startDate && customDateRange.endDate) {
        try {
          const startDate = new Date(customDateRange.startDate);
          const endDate = new Date(customDateRange.endDate);
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(0, 0, 0, 0);
          const diffTime = endDate.getTime() - startDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
          // For week-like periods (2-7 days), filter to only 0th positions
          if (diffDays >= 2 && diffDays <= 7) {
            // Filter to only 0th positions (Sun 0, Mon 0, Tue 0, etc.)
            // This is a critical filter to prevent showing all time slots
            const filteredData = processedChartData.filter(item => {
              if (!item.date) return false;
              const dateStr = String(item.date).trim();
              // Match format like "Fri 0", "Sat 6", "Sun 12", etc.
              const match = dateStr.match(/^([A-Za-z]{3})\s+(\d+)$/);
              if (match) {
                // Only keep items that are 0th position
                const timeSlot = parseInt(match[2]);
                return timeSlot === 0;
              }
              // If it doesn't match the pattern, exclude it (shouldn't happen for week data)
              return false;
            });
            // Only update if we actually filtered something (safety check)
            if (filteredData.length > 0) {
              processedChartData = filteredData;
            }
          }
        } catch (error) {
          // Ignore errors, use data as-is
        }
      }

      const chartConfig = getChartConfig();

      const formatXAxisLabel = useCallback((value) => {
        if (!value && value !== 0) {
          return '';
        }

        const valueStr = String(value || '');

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

          match = label && typeof label === 'string' ? label.match(/^([A-Za-z]{3})-([0-3])$/) : null;
          if (match) {
            const monthIndex = MONTH_NAME_TO_INDEX[match[1]];
            if (monthIndex !== undefined) {
              return new Date(currentYear, monthIndex, 1);
            }
          }

          match = label && typeof label === 'string' ? label.match(/^(\d{1,2})\/(\d{4})-([0-3])$/) : null;
          if (match) {
            const monthIndex = Number(match[1]) - 1;
            const year = Number(match[2]);
            if (monthIndex >= 0) {
              return new Date(year, monthIndex, 1);
            }
          }

          return null;
        };

        if (selectedDuration === 'this-day') {
          // For this-day, show hourly labels only (00:00, 01:00, etc.)
          const timeMatch = value.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
          if (timeMatch) {
            const hours = parseInt(timeMatch[1]);
            const minutes = parseInt(timeMatch[2]);
            // Only show label for hourly intervals (minutes === 00)
            if (minutes === 0) {
              // Return in HH:00 format
              return `${hours.toString().padStart(2, '0')}:00`;
            }
            // For non-hourly intervals, return empty string to hide
            return '';
          }
          return value;
        }

        // Check if custom period is a week (7 days)
        let isCustomWeek = false;
        if (selectedDuration === 'custom' && customDateRange.startDate && customDateRange.endDate) {
          try {
            const startDate = new Date(customDateRange.startDate);
            const endDate = new Date(customDateRange.endDate);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(0, 0, 0, 0);
            const diffTime = endDate.getTime() - startDate.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
            // Consider 2-7 day periods as week periods (to show only 0th positions)
            isCustomWeek = diffDays >= 2 && diffDays <= 7;
          } catch (error) {
            isCustomWeek = false;
          }
        }

        if (selectedDuration === 'this-week' || isCustomWeek) {
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

          // If it's the current week and value contains a date, convert to weekday name
          if (isSelectedWeekCurrent && value.includes('/')) {
            if (labelDate) {
              return labelDate.toLocaleDateString('en-US', { weekday: 'short' });
            }
          }

          // For week periods (both this-week and custom week), only show labels for 0th positions (Sun 0, Mon 0, etc.)
          // This prevents duplicate labels like "Sat Sat Sat Sat" when navigating to previous weeks
          const dayHourMatch = value.match(/^([A-Za-z]{3})\s+(\d+)$/);
          if (dayHourMatch) {
            const timeSlot = parseInt(dayHourMatch[2]);
            // Only show label for 0th position
            if (timeSlot === 0) {
              return dayHourMatch[1];
            }
            return ''; // Hide labels for non-0th positions
          }

          // Fallback: if value doesn't match day+time format, try to extract day name
          const dayMatch = value.match(/^([A-Za-z]{3})/);
          if (dayMatch) {
            return dayMatch[1];
          }

          const dateHourMatch = value.match(/^(\d{1,2}\/\d{1,2})/);
          if (dateHourMatch) {
            return dateHourMatch[1];
          }

          return value.replace(/\s+\d+$/, '').replace(/-\d+$/, '');
        }

        if (selectedDuration === 'this-month') {
          const dateMatch = value.match(/^(\d{1,2}\/\d{1,2})$/);
          if (dateMatch) {
            return value;
          }

          const dateTimeMatch = value.match(/^(\d{1,2}\/\d{1,2})\s+\d+$/);
          if (dateTimeMatch) {
            return dateTimeMatch[1];
          }

          return value;
        }

        if (selectedDuration === 'this-year') {
          const yearStart = new Date(currentYear, 0, 1);
          const yearEnd = new Date(currentYear, 11, 31);
          const labelDate = parseLabelToDate(value);
          if (labelDate && (labelDate < yearStart || labelDate > yearEnd)) {
            return '';
          }

          const valueStr = String(value || '');

          // Handle month-quarter format: "Jan-0", "Jan-1", "Jan-2", "Jan-3" - only show month name for quarter 0
          const monthQuarterMatch = valueStr.match(/^(\w+)-(\d+)$/);
          if (monthQuarterMatch) {
            const quarter = parseInt(monthQuarterMatch[2]);
            // Only show month name for the first quarter (0) of each month
            if (quarter === 0) {
              return monthQuarterMatch[1];
            }
            return ''; // Hide label for quarters 1, 2, 3
          }

          // Handle month/year-quarter format: "1/2025-0", "1/2025-1", etc. - only show month/year for quarter 0
          const monthYearMatch = valueStr.match(/^(\d{1,2}\/\d{4})-(\d+)$/);
          if (monthYearMatch) {
            const quarter = parseInt(monthYearMatch[2]);
            // Only show month/year for the first quarter (0) of each month
            if (quarter === 0) {
              return monthYearMatch[1];
            }
            return ''; // Hide label for quarters 1, 2, 3
          }

          return valueStr.replace(/\s+\d+$/, '').replace(/-\d+$/, '');
        }

        if (selectedDuration === 'custom') {
          const dayMatch = value.match(/^([A-Za-z]{3})/);
          if (dayMatch) {
            return dayMatch[1];
          }

          const dateMatch = value.match(/^(\d{1,2}\/\d{1,2})/);
          if (dateMatch) {
            return dateMatch[1];
          }

          // For custom periods, show all day number labels (11, 12, 13, 14, 15, 16, etc.)
          const dayOnlyMatch = value.match(/^(\d{1,2})$/);
          if (dayOnlyMatch) {
            return value;
          }

          return value.replace(/\s+\d+$/, '').replace(/-\d+$/, '');
        }

        return value;
      }, [selectedDuration, currentDate, currentYear, customDateRange]);

      // Custom tooltip formatter - convert date format to weekday for current week
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
              if (typeof tooltipLabel === 'string') {
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
            }

            return tooltipLabel;
          };

          const formattedLabel = formatTooltipLabel(label);

          // Determine if we should show percentage or count
          const shouldShowPercentageForTooltip = () => {
            if (selectedDuration === 'this-day') {
              return false; // Day view shows count
            }
            if (selectedDuration === 'custom') {
              // For custom, check if it's a single day or longer
              if (customDateRange.startDate && customDateRange.endDate) {
                try {
                  const startDate = new Date(customDateRange.startDate);
                  const endDate = new Date(customDateRange.endDate);
                  startDate.setHours(0, 0, 0, 0);
                  endDate.setHours(0, 0, 0, 0);
                  const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
                  const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
                  const diffTime = endDateOnly.getTime() - startDateOnly.getTime();
                  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
                  return diffDays > 1; // More than 1 day = percentage, 1 day = count
                } catch (error) {
                  return true; // Default to percentage for custom
                }
              }
              return true; // Default to percentage for custom
            }
            // Week, month, year all show percentage
            return true;
          };

          const showPercentageInTooltip = shouldShowPercentageForTooltip();

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
                {formattedLabel}
              </p>
              {payload.map((entry, index) => (
                <p key={index} style={{
                  margin: '4px 0',
                  color: '#fff',
                  fontWeight: '500'
                }}>
                  Occupancy: {entry.value}{showPercentageInTooltip ? ' %' : ''}
                </p>
              ))}
            </div>
          );
        }
        return null;
      };

      return (
        <div
          onMouseDown={(e) => {
            if (e && typeof e.preventDefault === 'function') {
              e.preventDefault();
            }
            if (e && typeof e.stopPropagation === 'function') {
              e.stopPropagation();
            }
            return false;
          }}
          onMouseUp={(e) => {
            if (e && typeof e.preventDefault === 'function') {
              e.preventDefault();
            }
            if (e && typeof e.stopPropagation === 'function') {
              e.stopPropagation();
            }
            return false;
          }}
          onClick={(e) => {
            if (e && typeof e.preventDefault === 'function') {
              e.preventDefault();
            }
            if (e && typeof e.stopPropagation === 'function') {
              e.stopPropagation();
            }
            return false;
          }}
          onDoubleClick={(e) => {
            if (e && typeof e.preventDefault === 'function') {
              e.preventDefault();
            }
            if (e && typeof e.stopPropagation === 'function') {
              e.stopPropagation();
            }
            return false;
          }}
          onContextMenu={(e) => {
            if (e && typeof e.preventDefault === 'function') {
              e.preventDefault();
            }
            if (e && typeof e.stopPropagation === 'function') {
              e.stopPropagation();
            }
            return false;
          }}
          onTouchStart={(e) => {
            if (e && typeof e.preventDefault === 'function') {
              e.preventDefault();
            }
            if (e && typeof e.stopPropagation === 'function') {
              e.stopPropagation();
            }
            return false;
          }}
          onTouchEnd={(e) => {
            if (e && typeof e.preventDefault === 'function') {
              e.preventDefault();
            }
            if (e && typeof e.stopPropagation === 'function') {
              e.stopPropagation();
            }
            return false;
          }}
          style={{
            height: '350px', // Increased height to accommodate full Y-axis label
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: '#767061',
            padding: '10px',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none'
          }}>
          <ResponsiveContainer
            onMouseDown={(e) => {
              if (e && typeof e.stopPropagation === 'function') {
                e.stopPropagation();
              }
            }}
            onMouseUp={(e) => {
              if (e && typeof e.stopPropagation === 'function') {
                e.stopPropagation();
              }
            }}
            onClick={(e) => {
              if (e && typeof e.stopPropagation === 'function') {
                e.stopPropagation();
              }
            }}
            onDoubleClick={(e) => {
              if (e && typeof e.stopPropagation === 'function') {
                e.stopPropagation();
              }
            }}
            onContextMenu={(e) => {
              if (e && typeof e.stopPropagation === 'function') {
                e.stopPropagation();
              }
            }}
            width="100%" height="100%">
            <LineChart
              onMouseDown={(e) => {
                if (e && typeof e.stopPropagation === 'function') {
                  e.stopPropagation();
                }
              }}
              onMouseUp={(e) => {
                if (e && typeof e.stopPropagation === 'function') {
                  e.stopPropagation();
                }
              }}
              onClick={(e) => {
                if (e && typeof e.stopPropagation === 'function') {
                  e.stopPropagation();
                }
              }}
              onDoubleClick={(e) => {
                if (e && typeof e.stopPropagation === 'function') {
                  e.stopPropagation();
                }
              }}
              onContextMenu={(e) => {
                if (e && typeof e.stopPropagation === 'function') {
                  e.stopPropagation();
                }
              }}
              data={processedChartData}
              key={`linechart-${selectedDuration}-${currentDate}-${isNavigating}`}
              margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
            >
              <CartesianGrid stroke="#fff" strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                stroke="#fff"
                fontSize={selectedDuration === 'this-day' ? 9 : chartConfig.xAxisFontSize}
                tick={{
                  fill: '#fff',
                  fontWeight: 600,
                  fontSize: selectedDuration === 'this-day' ? 9 : chartConfig.xAxisFontSize,
                  angle: selectedDuration === 'this-day' ? -45 : 0,
                  textAnchor: selectedDuration === 'this-day' ? 'end' : 'middle'
                }}
                tickFormatter={formatXAxisLabel}
                axisLine={{ stroke: '#fff' }}
                tickLine={{ stroke: '#fff' }}
                interval={selectedDuration === 'this-month' || selectedDuration === 'this-year' || selectedDuration === 'custom' ? 0 : (selectedDuration === 'this-day' ? 0 : chartConfig.xAxisInterval)}
                tickCount={selectedDuration === 'this-day' ? 24 : chartConfig.xAxisTickCount}
                ticks={selectedDuration === 'this-day' ? (() => {
                  const ticks = [];
                  for (let hour = 0; hour < 24; hour++) {
                    ticks.push(`${hour.toString().padStart(2, '0')}:00`);
                  }
                  return ticks;
                })() : selectedDuration === 'this-year' ? (() => {
                  // Return all 48 data points (12 months × 4 quarters) for year view
                  // formatXAxisLabel will filter to show only month names for quarter 0
                  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  const allQuarters = [];
                  monthNames.forEach(monthName => {
                    for (let quarter = 0; quarter < 4; quarter++) {
                      allQuarters.push(`${monthName}-${quarter}`);
                    }
                  });
                  return allQuarters;
                })() : selectedDuration === 'custom' ? (() => {
                  // For custom periods, return all day values to ensure all labels are displayed
                  // For custom week periods, filter to only show 0th positions (Sun 0, Mon 0, etc.)
                  let isCustomWeekLocal = false;
                  if (customDateRange.startDate && customDateRange.endDate) {
                    try {
                      const startDate = new Date(customDateRange.startDate);
                      const endDate = new Date(customDateRange.endDate);
                      startDate.setHours(0, 0, 0, 0);
                      endDate.setHours(0, 0, 0, 0);
                      const diffTime = endDate.getTime() - startDate.getTime();
                      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
                      // Consider 2-7 day periods as week periods (to show only 0th positions)
                      isCustomWeekLocal = diffDays >= 2 && diffDays <= 7;
                    } catch (error) {
                      isCustomWeekLocal = false;
                    }
                  }
                  if (isCustomWeekLocal) {
                    return processedChartData
                      .filter(item => {
                        const match = item.date && String(item.date).match(/^([A-Za-z]{3})\s+(\d+)$/);
                        return match && parseInt(match[2]) === 0;
                      })
                      .map(item => item.date);
                  }
                  // For other custom periods, return all dates
                  return processedChartData.map(item => item.date);
                })() : undefined}
                type={selectedDuration === 'this-day' || selectedDuration === 'this-year' || selectedDuration === 'custom' ? 'category' : undefined}
              />
              <YAxis
                stroke="#fff"
                fontSize={12}
                tick={{ fill: '#fff', fontWeight: 600, fontSize: 12 }}
                axisLine={{ stroke: '#fff' }}
                tickLine={{ stroke: '#fff' }}
                domain={[0, maxOccupancy]}
                padding={{ right: 20 }}
                label={{
                  value: showPercentage ? '(Occupancy %)' : '(Occupancy Count)',
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#fff',
                  offset: -70, // Increased offset to center the label properly
                  style: { textAnchor: 'middle', fontSize: '12px', fontWeight: '600' }
                }}
                hide={nonNullValues.length === 0} // Hide Y-axis when no data (like Energy dashboard)
              />
              <Tooltip
                onMouseDown={(e) => {
                  // Allow tooltip interactions
                  if (e && typeof e.stopPropagation === 'function') {
                    e.stopPropagation();
                  }
                }}
                onMouseUp={(e) => {
                  // Allow tooltip interactions
                  if (e && typeof e.stopPropagation === 'function') {
                    e.stopPropagation();
                  }
                }}
                onClick={(e) => {
                  // Allow tooltip interactions
                  if (e && typeof e.stopPropagation === 'function') {
                    e.stopPropagation();
                  }
                }}
                content={<CustomTooltip />}
                cursor={{ stroke: '#fff', strokeWidth: 1 }}
              />
              <Line
                type="monotone"
                dataKey="occupancy"
                stroke="#87CEEB"
                strokeWidth={2}
                connectNulls={true}
                dot={(props) => {
                  // Show dots for all data points, including null values (for year view to show all months)
                  if (props.payload) {
                    // For year view, show dots for all months (even with null values) to indicate data points exist
                    if (selectedDuration === 'this-year') {
                      return (
                        <circle
                          key={`dot-${props.index}`}
                          cx={props.cx} cy={props.cy} r={props.payload.occupancy !== null && props.payload.occupancy !== undefined ? 3 : 2}
                          fill={props.payload.occupancy !== null && props.payload.occupancy !== undefined ? "#87CEEB" : "transparent"}
                          stroke={props.payload.occupancy !== null && props.payload.occupancy !== undefined ? "#fff" : "#87CEEB"}
                          strokeWidth={props.payload.occupancy !== null && props.payload.occupancy !== undefined ? 0.5 : 1}
                          opacity={props.payload.occupancy !== null && props.payload.occupancy !== undefined ? 1 : 0.5}
                        />
                      );
                    }
                    // For other views, only show dots for non-null values
                    if (props.payload.occupancy !== null && props.payload.occupancy !== undefined) {
                      return (
                        <circle
                          key={`dot-${props.index}`}
                          cx={props.cx} cy={props.cy} r={3}
                          fill="#87CEEB" stroke="#fff" strokeWidth={0.5}
                        />
                      );
                    }
                  }
                  return null;
                }}
                activeDot={{
                  r: 4,
                  stroke: '#fff',
                  strokeWidth: 1
                }}
                name="Occupancy"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )
    } catch (error) {
      return (
        <div style={{
          height: '350px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #ddd',
          borderRadius: '4px',
          backgroundColor: '#767061',
          color: '#fff',
          fontSize: '14px'
        }}>
          Error loading occupancy data
        </div>
      )
    }
  }

  // Pie Chart Component for Area Groups - Updated to use percentages
  const StackedBarChartComponent = () => {
    try {
      // Show loading state when data is being fetched
      if (activeOccupancyByGroupLoading) {
        return (
          <div style={{
            height: '400px',
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
        )
      }

      // Check if API returned an error
      if (activeOccupancyByGroup && activeOccupancyByGroup.status === 'error') {
        return (
          <div style={{
            height: '400px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: '#767061',
            color: '#fff',
            fontSize: '14px'
          }}>
            Error loading area group data
          </div>
        )
      }

      if (!activeOccupancyByGroup && !activeOccupancyByGroupLoading) {
        return (
          <div style={{
            height: '400px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: '#767061',
            color: '#fff',
            fontSize: '14px'
          }}>
            No area group data available
          </div>
        )
      } else if (!activeOccupancyByGroup) {
        // Show loading when data is being fetched
        return (
          <div style={{
            height: '400px',
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
        )
      }

      // Process data for stacked bar chart - Handle both response formats
      const processStackedBarData = () => {
        try {
          // Check if API returned an error
          if (activeOccupancyByGroup && activeOccupancyByGroup.status === 'error') {
            return []
          }

          // Handle the API response structure
          let groupDataArray = []
          if (activeOccupancyByGroup && Array.isArray(activeOccupancyByGroup)) {
            groupDataArray = activeOccupancyByGroup
          } else if (activeOccupancyByGroup && activeOccupancyByGroup.data && Array.isArray(activeOccupancyByGroup.data)) {
            groupDataArray = activeOccupancyByGroup.data
          } else {
            return []
          }

          // Process data for stacked bar chart - Handle both formats:
          // 1. _from_logs format: has occupied_percentage and unoccupied_percentage directly
          // 2. Regular format: has total_possible and total_occupied (calculate percentages)
          const processedData = groupDataArray
            .filter(group => {
              const isValid = group && typeof group === 'object' && group.area_group_name
              return isValid
            })
            .map((group, index) => {
              let occupiedPercentage = 0
              let unoccupiedPercentage = 0
              let total = 0

              // Check if data has percentages directly (_from_logs format)
              if (group.occupied_percentage !== undefined && group.unoccupied_percentage !== undefined) {
                // Use percentages directly from API response
                occupiedPercentage = group.occupied_percentage || 0
                unoccupiedPercentage = group.unoccupied_percentage || 0
                // Use total_time_seconds for sorting if available, otherwise use a calculated total
                total = group.total_time_seconds || (occupiedPercentage + unoccupiedPercentage)
              } else {
                // Regular format: calculate percentages from raw counts
                const totalPossible = group.total_possible || 0
                const totalOccupied = group.total_occupied || 0
                const unoccupied = totalPossible - totalOccupied
                total = totalPossible

                if (totalPossible > 0) {
                  occupiedPercentage = (totalOccupied / totalPossible) * 100
                  unoccupiedPercentage = (unoccupied / totalPossible) * 100

                  // Cap percentages at 100% to prevent floating point precision issues
                  occupiedPercentage = Math.min(occupiedPercentage, 100)
                  unoccupiedPercentage = Math.min(unoccupiedPercentage, 100)
                } else {
                  occupiedPercentage = 0
                  unoccupiedPercentage = 0
                }
              }

              const result = {
                name: group.area_group_name || `Group ${index + 1}`,
                occupied: Math.round(occupiedPercentage * 100) / 100, // Round to 2 decimal places
                unoccupied: Math.round(unoccupiedPercentage * 100) / 100, // Round to 2 decimal places
                total: total,
                color: COLORS[index % COLORS.length]
              }

              return result
            })
            .sort((a, b) => b.total - a.total) // Sort by total

          return processedData
        } catch (error) {
          return []
        }
      }

      const stackedBarData = processStackedBarData()


      if (stackedBarData.length === 0) {
        return (
          <div style={{
            height: '400px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: '#767061',
            color: '#fff',
            fontSize: '14px'
          }}>
            No area group data available for the selected criteria
          </div>
        )
      }

      // Custom tooltip for stacked bar chart
      const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {

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
                {label}
              </p>
              {payload.map((entry, index) => (
                <p key={index} style={{
                  margin: '4px 0',
                  color: entry.color,
                  fontWeight: '500'
                }}>
                  {entry.name}: {entry.value}%
                </p>
              ))}
            </div>
          );
        }
        return null;
      };

      return (
        <div
          onMouseDown={(e) => {
            if (e && typeof e.preventDefault === 'function') {
              e.preventDefault();
            }
            if (e && typeof e.stopPropagation === 'function') {
              e.stopPropagation();
            }
            return false;
          }}
          onMouseUp={(e) => {
            if (e && typeof e.preventDefault === 'function') {
              e.preventDefault();
            }
            if (e && typeof e.stopPropagation === 'function') {
              e.stopPropagation();
            }
            return false;
          }}
          onClick={(e) => {
            if (e && typeof e.preventDefault === 'function') {
              e.preventDefault();
            }
            if (e && typeof e.stopPropagation === 'function') {
              e.stopPropagation();
            }
            return false;
          }}
          onDoubleClick={(e) => {
            if (e && typeof e.preventDefault === 'function') {
              e.preventDefault();
            }
            if (e && typeof e.stopPropagation === 'function') {
              e.stopPropagation();
            }
            return false;
          }}
          onContextMenu={(e) => {
            if (e && typeof e.preventDefault === 'function') {
              e.preventDefault();
            }
            if (e && typeof e.stopPropagation === 'function') {
              e.stopPropagation();
            }
            return false;
          }}
          onTouchStart={(e) => {
            if (e && typeof e.preventDefault === 'function') {
              e.preventDefault();
            }
            if (e && typeof e.stopPropagation === 'function') {
              e.stopPropagation();
            }
            return false;
          }}
          onTouchEnd={(e) => {
            if (e && typeof e.preventDefault === 'function') {
              e.preventDefault();
            }
            if (e && typeof e.stopPropagation === 'function') {
              e.stopPropagation();
            }
            return false;
          }}
          style={{
            height: '400px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: '#767061',
            padding: '10px',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none'
          }}>
          <ResponsiveContainer
            onMouseDown={(e) => {
              if (e && typeof e.stopPropagation === 'function') {
                e.stopPropagation();
              }
            }}
            onMouseUp={(e) => {
              if (e && typeof e.stopPropagation === 'function') {
                e.stopPropagation();
              }
            }}
            onClick={(e) => {
              if (e && typeof e.stopPropagation === 'function') {
                e.stopPropagation();
              }
            }}
            onDoubleClick={(e) => {
              if (e && typeof e.stopPropagation === 'function') {
                e.stopPropagation();
              }
            }}
            onContextMenu={(e) => {
              if (e && typeof e.stopPropagation === 'function') {
                e.stopPropagation();
              }
            }}
            width="100%" height="100%">
            <BarChart
              onMouseDown={(e) => {
                if (e && typeof e.stopPropagation === 'function') {
                  e.stopPropagation();
                }
              }}
              onMouseUp={(e) => {
                if (e && typeof e.stopPropagation === 'function') {
                  e.stopPropagation();
                }
              }}
              onClick={(e) => {
                if (e && typeof e.stopPropagation === 'function') {
                  e.stopPropagation();
                }
              }}
              onDoubleClick={(e) => {
                if (e && typeof e.stopPropagation === 'function') {
                  e.stopPropagation();
                }
              }}
              onContextMenu={(e) => {
                if (e && typeof e.stopPropagation === 'function') {
                  e.stopPropagation();
                }
              }}
              data={stackedBarData}
              margin={{ top: 20, right: 30, left: 80, bottom: 5 }}
              key={`stacked-bar-${JSON.stringify(activeOccupancyByGroup)}`} // Force re-render when data changes
            >
              <CartesianGrid stroke="#fff" strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                stroke="#fff"
                fontSize={12}
                tick={{ fill: '#fff', fontWeight: 600, fontSize: 12 }}
                axisLine={{ stroke: '#fff' }}
                tickLine={{ stroke: '#fff' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                stroke="#fff"
                fontSize={12}
                tick={{ fill: '#fff', fontWeight: 600, fontSize: 12 }}
                axisLine={{ stroke: '#fff' }}
                tickLine={{ stroke: '#fff' }}
                label={{ value: 'Utilization (%)', angle: -90, position: 'insideLeft', fill: '#fff', offset: -50 }}
                domain={[0, 100]}
                padding={{ right: 20 }}
              />
              <Tooltip
                onMouseDown={(e) => {
                  // Allow tooltip interactions
                  if (e && typeof e.stopPropagation === 'function') {
                    e.stopPropagation();
                  }
                }}
                onMouseUp={(e) => {
                  // Allow tooltip interactions
                  if (e && typeof e.stopPropagation === 'function') {
                    e.stopPropagation();
                  }
                }}
                onClick={(e) => {
                  // Allow tooltip interactions
                  if (e && typeof e.stopPropagation === 'function') {
                    e.stopPropagation();
                  }
                }}
                content={<CustomTooltip />}
              />
              {/* Unoccupied segment (top) - Light red color */}
              <Bar
                dataKey="unoccupied"
                stackId="a"
                fill="#FFB3B3"
                name="Unoccupied"
                stroke="#fff"
                strokeWidth={1}
                barSize={40}
              />
              {/* Occupied segment (bottom) - Light green color */}
              <Bar
                dataKey="occupied"
                stackId="a"
                fill="#98FB98"
                name="Occupied"
                stroke="#fff"
                strokeWidth={1}
                barSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )
    } catch (error) {
      return (
        <div style={{
          height: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #ddd',
          borderRadius: '4px',
          backgroundColor: '#767061',
          color: '#fff',
          fontSize: '14px'
        }}>
          Error loading stacked bar chart data
        </div>
      )
    }
  }

  // Instant Occupancy Count Chart Component
  const InstantOccupancyChartComponent = () => {
    try {
      // Show loading state when data is being fetched
      if (instantOccupancyCountLoading) {
        return (
          <div style={{
            height: '350px',
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
        )
      }

      // Check if API returned an error
      if (instantOccupancyCountError) {
        return (
          <div style={{
            height: '350px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: '#767061',
            color: '#fff',
            fontSize: '14px'
          }}>
            Error loading instant occupancy data
          </div>
        )
      }

      // Handle the data format from API
      let chartData = instantOccupancyCount
      if (!instantOccupancyCount || !instantOccupancyCount['x-axis'] || !instantOccupancyCount['y-axis']) {
        return (
          <div style={{
            height: '350px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: '#767061',
            color: '#fff',
            fontSize: '14px'
          }}>
            No instant occupancy data available
          </div>
        )
      }

      // Process data based on selected duration - Show all data points with dots for intermediate points
      // Map x-axis to y-axis data exactly as received from API
      const allData = chartData['x-axis'].map((date, index) => ({
        date: date,
        occupancy: chartData['y-axis']['data']?.[index] ?? null
      }))

      let processedChartData = allData;

      // For day view, ensure all 24 hours are shown with proper spacing
      if (selectedDuration === 'this-day') {
        // Helper function to convert time string to minutes since midnight
        const timeToMinutes = (timeStr) => {
          const match = timeStr.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
          if (match) {
            const hours = parseInt(match[1]);
            const minutes = parseInt(match[2]);
            return hours * 60 + minutes;
          }
          return 0;
        };

        // Start with ALL actual data points - no purging, no merging
        // Convert time to numeric value for proper x-axis positioning
        const complete24HourData = [];

        // Add all actual data points exactly as received from backend
        allData.forEach(item => {
          if (item.date) {
            const timeMatch = item.date.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
            const isHourly = timeMatch && parseInt(timeMatch[2]) === 0;
            const timeMinutes = timeToMinutes(item.date);

            complete24HourData.push({
              date: item.date,
              timeMinutes: timeMinutes, // Numeric value for x-axis positioning
              occupancy: item.occupancy !== null && item.occupancy !== undefined ? item.occupancy : null,
              isHourly: isHourly
            });
          }
        });

        // Now ensure all 24 hours (00:00 to 23:00) are present for x-axis display
        // Add hour markers only if they don't already exist in the data
        for (let hour = 0; hour < 24; hour++) {
          const hourLabel = `${hour.toString().padStart(2, '0')}:00`;
          const hourMinutes = hour * 60;

          // Check if this hour already exists in the data
          const hourExists = complete24HourData.some(item => item.date === hourLabel);

          // If hour doesn't exist, add it with null value to maintain x-axis structure
          if (!hourExists) {
            complete24HourData.push({
              date: hourLabel,
              timeMinutes: hourMinutes,
              occupancy: null,
              isHourly: true
            });
          }
        }

        // Sort by timeMinutes to ensure proper ordering and line connection
        processedChartData = complete24HourData.sort((a, b) => {
          return (a.timeMinutes || 0) - (b.timeMinutes || 0);
        });
      } else if (selectedDuration === 'this-week') {
        // For week view, ensure all 7 days are shown on x-axis with 4 points each
        const dataMap = new Map();
        allData.forEach(item => {
          if (item.date) {
            dataMap.set(item.date, item);
          }
        });

        // Expected days for a week: Sun, Mon, Tue, Wed, Thu, Fri, Sat
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const timeSlots = [0, 6, 12, 18]; // Expected time slots per day
        const completeWeekData = [];

        // Build complete week structure
        dayNames.forEach(dayName => {
          timeSlots.forEach(timeSlot => {
            const expectedLabel = `${dayName} ${timeSlot}`;
            if (dataMap.has(expectedLabel)) {
              const item = dataMap.get(expectedLabel);
              completeWeekData.push({
                date: expectedLabel,
                occupancy: item.occupancy !== null && item.occupancy !== undefined ? item.occupancy : null,
                isHourly: false
              });
            } else {
              // Add missing time slot with null value to maintain x-axis structure
              completeWeekData.push({
                date: expectedLabel,
                occupancy: null,
                isHourly: false
              });
            }
          });
        });

        // Add any additional data points that don't match the expected structure
        allData.forEach(item => {
          if (item.date && !completeWeekData.some(d => d.date === item.date)) {
            completeWeekData.push({
              date: item.date,
              occupancy: item.occupancy !== null && item.occupancy !== undefined ? item.occupancy : null,
              isHourly: false
            });
          }
        });

        // Sort by day and time
        processedChartData = completeWeekData.sort((a, b) => {
          const dayOrder = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };
          const matchA = a.date.match(/^(\w+)\s+(\d+)$/);
          const matchB = b.date.match(/^(\w+)\s+(\d+)$/);

          if (matchA && matchB) {
            const dayA = dayOrder[matchA[1]] ?? 99;
            const dayB = dayOrder[matchB[1]] ?? 99;
            if (dayA !== dayB) return dayA - dayB;
            return parseInt(matchA[2]) - parseInt(matchB[2]);
          }
          return (a.date || '').localeCompare(b.date || '');
        });
      } else if (selectedDuration === 'this-month') {
        // For month view, ensure all days of the month are shown (28/30/31 days)
        const targetDate = parseDateFromState(currentDate);
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Create a map of existing data points by day
        const dataMap = new Map();
        allData.forEach(item => {
          if (item.date) {
            const dateStr = String(item.date).trim();
            // Handle format: just day number like "1", "2", "3", etc.
            const dayOnlyMatch = dateStr.match(/^(\d{1,2})$/);
            if (dayOnlyMatch) {
              const day = parseInt(dayOnlyMatch[1]);
              if (day >= 1 && day <= daysInMonth) {
                dataMap.set(day, {
                  date: String(day), // Keep original format as "1", "2", etc.
                  occupancy: item.occupancy !== null && item.occupancy !== undefined ? item.occupancy : null,
                  isHourly: false
                });
              }
            } else {
              // Handle date formats like "1/12", "15/12", "31/12"
              const dateMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})(?:\s+\d+)?$/);
              if (dateMatch) {
                const day = parseInt(dateMatch[1]);
                const dataMonth = parseInt(dateMatch[2]);
                // Check if the date matches the current month
                if (dataMonth === month + 1 && day >= 1 && day <= daysInMonth) {
                  dataMap.set(day, {
                    date: String(day), // Convert to day number format to match API response
                    occupancy: item.occupancy !== null && item.occupancy !== undefined ? item.occupancy : null,
                    isHourly: false
                  });
                }
              }
            }
          }
        });

        // Build complete month data with all days
        const completeMonthData = [];
        for (let day = 1; day <= daysInMonth; day++) {
          if (dataMap.has(day)) {
            completeMonthData.push(dataMap.get(day));
          } else {
            // Add missing day with null value to maintain x-axis structure
            completeMonthData.push({
              date: String(day), // Use day number format like "1", "2", etc. to match API response
              occupancy: null,
              isHourly: false
            });
          }
        }

        processedChartData = completeMonthData;
      } else if (selectedDuration === 'this-year') {
        // For year view, ensure all 12 months × 4 quarters = 48 data points are shown even if they have no data
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // Create a map of existing data points by month-quarter key (e.g., "Jan-0", "Jan-1", "Jan-2", "Jan-3")
        const dataMap = new Map();
        allData.forEach(item => {
          if (item.date) {
            // Handle both formats: "Jan-0", "Jan-1", "Dec-3" or "1/2025-0", "12/2025-3"
            const monthQuarterMatch = String(item.date).match(/^([A-Za-z]{3})-(\d+)$/) || String(item.date).match(/^(\d{1,2})\/(\d{4})-(\d+)$/);
            if (monthQuarterMatch) {
              let monthIndex;
              let quarter;

              if (monthQuarterMatch[1].length === 3) {
                // Month name format (Jan, Feb, etc.)
                monthIndex = MONTH_NAME_TO_INDEX[monthQuarterMatch[1]];
                quarter = parseInt(monthQuarterMatch[2]);
              } else {
                // Number format (1, 2, etc.)
                monthIndex = parseInt(monthQuarterMatch[1]) - 1;
                quarter = parseInt(monthQuarterMatch[3]);
              }

              if (monthIndex !== undefined && monthIndex >= 0 && monthIndex < 12 && quarter >= 0 && quarter <= 3) {
                const monthKey = `${monthNames[monthIndex]}-${quarter}`;
                dataMap.set(monthKey, {
                  date: `${monthNames[monthIndex]}-${quarter}`,
                  occupancy: item.occupancy !== null && item.occupancy !== undefined ? item.occupancy : null,
                  isHourly: false
                });
              }
            }
          }
        });

        // Build complete year data with all 12 months × 4 quarters = 48 data points
        const completeYearData = [];
        monthNames.forEach(monthName => {
          // Add all 4 quarters for each month
          for (let quarter = 0; quarter < 4; quarter++) {
            const monthQuarterKey = `${monthName}-${quarter}`;
            if (dataMap.has(monthQuarterKey)) {
              completeYearData.push(dataMap.get(monthQuarterKey));
            } else {
              // Add quarter with null value if no data exists
              completeYearData.push({
                date: `${monthName}-${quarter}`,
                occupancy: null,
                isHourly: false
              });
            }
          }
        });

        processedChartData = completeYearData;
      } else {
        // For other durations, convert null to 0 for zero values
        processedChartData = allData.map(item => ({
          date: item.date,
          occupancy: item.occupancy !== null && item.occupancy !== undefined ? item.occupancy : 0,
          isHourly: false
        }));
      }

      // Check if we have any non-null values
      const limitedOccupancyValues = processedChartData.map(item => item.occupancy)
      const nonNullValues = limitedOccupancyValues.filter(val => val !== null && val !== undefined)
      const maxOccupancy = nonNullValues.length > 0 ? Math.max(...nonNullValues.map(val => val), 1) : 1

      // Helper function to determine if we should show percentage or count
      const shouldShowPercentage = () => {
        if (selectedDuration === 'this-day') {
          return false; // Day view shows count
        }
        if (selectedDuration === 'custom') {
          // For custom, check if it's a single day or longer
          if (customDateRange.startDate && customDateRange.endDate) {
            try {
              const startDate = new Date(customDateRange.startDate);
              const endDate = new Date(customDateRange.endDate);
              startDate.setHours(0, 0, 0, 0);
              endDate.setHours(0, 0, 0, 0);
              const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
              const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
              const diffTime = endDateOnly.getTime() - startDateOnly.getTime();
              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
              return diffDays > 1; // More than 1 day = percentage, 1 day = count
            } catch (error) {
              return true; // Default to percentage for custom
            }
          }
          return true; // Default to percentage for custom
        }
        // Week, month, year all show percentage
        return true;
      };

      const showPercentage = shouldShowPercentage();

      // Chart configuration based on data point count and format
      const getChartConfig = () => {
        const dataPointCount = processedChartData.length;

        // Determine configuration based on selected duration and data point count
        if (selectedDuration === 'this-day') {
          // For minute-by-minute data (1440 points), calculate interval to show hourly labels
          // If we have minute data, show every 60th point (hourly) = interval 59
          // If we have 15-min data (96 points), show every 4th point (hourly) = interval 3
          // If we have other interval data, calculate to show approximately 24 ticks
          let xAxisInterval = 0;
          // Since we've added hourly markers (24 markers), set interval to 0
          // This will show all ticks, and formatXAxisLabel will filter to show only hourly labels
          xAxisInterval = 0;

          return {
            xAxisInterval: xAxisInterval,
            xAxisTickCount: 24, // Show 24 ticks for 24 hours
            xAxisFontSize: 10
          };
        } else if (selectedDuration === 'this-week') {
          return {
            xAxisInterval: 3, // Show every 4th tick (every day)
            xAxisTickCount: 7, // Show 7 ticks for 7 days
            xAxisFontSize: 10
          };
        } else if (selectedDuration === 'this-month') {
          return {
            xAxisInterval: 2, // Show every 3rd tick
            xAxisTickCount: Math.min(10, Math.ceil(dataPointCount / 3)), // Show up to 10 ticks
            xAxisFontSize: 9
          };
        } else if (selectedDuration === 'this-year') {
          // Year data: 48 points = 12 months × 4 quarters per month
          // Show month names only for the first quarter (0) of each month
          return {
            xAxisInterval: 0, // Show all ticks, but formatXAxisLabel will filter to show only quarter 0
            xAxisTickCount: 12, // Show 12 ticks for 12 months (one per month)
            xAxisFontSize: 9
          };
        } else {
          // Custom or other durations
          return {
            xAxisInterval: 2,
            xAxisTickCount: Math.min(10, Math.ceil(dataPointCount / 3)),
            xAxisFontSize: 10
          };
        }
      };

      const chartConfig = getChartConfig();


      const formatXAxisLabel = useCallback((value) => {
        if (!value) {
          return '';
        }

        // For this-day, show all hourly labels clearly - Match Utilization chart
        if (selectedDuration === 'this-day') {
          // Value is now numeric (minutes since midnight) for Instant Occupancy chart
          if (typeof value === 'number') {
            const hours = Math.floor(value / 60);
            const minutes = value % 60;
            // Only show label for hourly intervals (minutes === 0)
            if (minutes === 0 && hours >= 0 && hours < 24) {
              return `${hours.toString().padStart(2, '0')}:00`;
            }
            return '';
          }
          // Fallback for string values (for other chart types)
          const timeMatch = value && typeof value === 'string' ? value.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/) : null;
          if (timeMatch) {
            const hours = parseInt(timeMatch[1]);
            const minutes = parseInt(timeMatch[2]);
            // Only show label for hourly intervals (minutes === 00)
            if (minutes === 0) {
              return `${hours.toString().padStart(2, '0')}:00`;
            }
            return '';
          }
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

          match = label && typeof label === 'string' ? label.match(/^([A-Za-z]{3})-([0-3])$/) : null;
          if (match) {
            const monthIndex = MONTH_NAME_TO_INDEX[match[1]];
            if (monthIndex !== undefined) {
              return new Date(currentYear, monthIndex, 1);
            }
          }

          match = label && typeof label === 'string' ? label.match(/^(\d{1,2})\/(\d{4})-([0-3])$/) : null;
          if (match) {
            const monthIndex = Number(match[1]) - 1;
            const year = Number(match[2]);
            if (monthIndex >= 0) {
              return new Date(year, monthIndex, 1);
            }
          }

          return null;
        };

        if (selectedDuration === 'this-day') {
          return value;
        }

        // Check if custom period is a week (7 days)
        let isCustomWeek = false;
        if (selectedDuration === 'custom' && customDateRange.startDate && customDateRange.endDate) {
          try {
            const startDate = new Date(customDateRange.startDate);
            const endDate = new Date(customDateRange.endDate);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(0, 0, 0, 0);
            const diffTime = endDate.getTime() - startDate.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
            // Consider 2-7 day periods as week periods (to show only 0th positions)
            isCustomWeek = diffDays >= 2 && diffDays <= 7;
          } catch (error) {
            isCustomWeek = false;
          }
        }

        if (selectedDuration === 'this-week' || isCustomWeek) {
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

          // If it's the current week and value contains a date, convert to weekday name
          if (isSelectedWeekCurrent && value.includes('/')) {
            if (labelDate) {
              return labelDate.toLocaleDateString('en-US', { weekday: 'short' });
            }
          }

          // For week periods (both this-week and custom week), only show labels for 0th positions (Sun 0, Mon 0, etc.)
          // This prevents duplicate labels like "Sat Sat Sat Sat" when navigating to previous weeks
          const dayHourMatch = value.match(/^([A-Za-z]{3})\s+(\d+)$/);
          if (dayHourMatch) {
            const timeSlot = parseInt(dayHourMatch[2]);
            // Only show label for 0th position
            if (timeSlot === 0) {
              return dayHourMatch[1];
            }
            return ''; // Hide labels for non-0th positions
          }

          // Fallback: if value doesn't match day+time format, try to extract day name
          const dayMatch = value.match(/^([A-Za-z]{3})/);
          if (dayMatch) {
            return dayMatch[1];
          }

          const dateHourMatch = value.match(/^(\d{1,2}\/\d{1,2})/);
          if (dateHourMatch) {
            return dateHourMatch[1];
          }

          return value.replace(/\s+\d+$/, '').replace(/-\d+$/, '');
        }

        if (selectedDuration === 'this-month') {
          const dateMatch = value.match(/^(\d{1,2}\/\d{1,2})$/);
          if (dateMatch) {
            return value;
          }

          const dateTimeMatch = value.match(/^(\d{1,2}\/\d{1,2})\s+\d+$/);
          if (dateTimeMatch) {
            return dateTimeMatch[1];
          }

          return value;
        }

        if (selectedDuration === 'this-year') {
          const yearStart = new Date(currentYear, 0, 1);
          const yearEnd = new Date(currentYear, 11, 31);
          const labelDate = parseLabelToDate(value);
          if (labelDate && (labelDate < yearStart || labelDate > yearEnd)) {
            return '';
          }

          const valueStr = String(value || '');

          // Handle month-quarter format: "Jan-0", "Jan-1", "Jan-2", "Jan-3" - only show month name for quarter 0
          const monthQuarterMatch = valueStr.match(/^(\w+)-(\d+)$/);
          if (monthQuarterMatch) {
            const quarter = parseInt(monthQuarterMatch[2]);
            // Only show month name for the first quarter (0) of each month
            if (quarter === 0) {
              return monthQuarterMatch[1];
            }
            return ''; // Hide label for quarters 1, 2, 3
          }

          // Handle month/year-quarter format: "1/2025-0", "1/2025-1", etc. - only show month/year for quarter 0
          const monthYearMatch = valueStr.match(/^(\d{1,2}\/\d{4})-(\d+)$/);
          if (monthYearMatch) {
            const quarter = parseInt(monthYearMatch[2]);
            // Only show month/year for the first quarter (0) of each month
            if (quarter === 0) {
              return monthYearMatch[1];
            }
            return ''; // Hide label for quarters 1, 2, 3
          }

          return valueStr.replace(/\s+\d+$/, '').replace(/-\d+$/, '');
        }

        if (selectedDuration === 'custom') {
          const dayMatch = value.match(/^([A-Za-z]{3})/);
          if (dayMatch) {
            return dayMatch[1];
          }

          const dateMatch = value.match(/^(\d{1,2}\/\d{1,2})/);
          if (dateMatch) {
            return dateMatch[1];
          }

          // For custom periods, show all day number labels (11, 12, 13, 14, 15, 16, etc.)
          const dayOnlyMatch = value.match(/^(\d{1,2})$/);
          if (dayOnlyMatch) {
            return value;
          }

          return value.replace(/\s+\d+$/, '').replace(/-\d+$/, '');
        }

        return value;
      }, [selectedDuration, currentDate, currentYear, customDateRange]);

      // Custom tooltip formatter
      const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
          // Format tooltip label - convert date format to weekday for current week
          const formatTooltipLabel = (tooltipLabel) => {
            if (!tooltipLabel && tooltipLabel !== 0) return tooltipLabel;

            // For this-day view, format time clearly
            if (selectedDuration === 'this-day') {
              // If it's a number (minutes since midnight), convert to time
              if (typeof tooltipLabel === 'number') {
                const hours = Math.floor(tooltipLabel / 60);
                const minutes = tooltipLabel % 60;
                return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
              }
              // Check if label is a time string (e.g., "12:00" or "12:00:00")
              if (typeof tooltipLabel === 'string') {
                const timeMatch = tooltipLabel.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
                if (timeMatch) {
                  const hours = timeMatch[1].padStart(2, '0');
                  const minutes = timeMatch[2];
                  return `${hours}:${minutes}`;
                }
              }
              return tooltipLabel;
            }

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
              if (typeof tooltipLabel === 'string') {
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
            }

            return tooltipLabel;
          };

          const formattedLabel = formatTooltipLabel(label);

          // Determine if we should show percentage or count
          const shouldShowPercentageForTooltip = () => {
            if (selectedDuration === 'this-day') {
              return false; // Day view shows count
            }
            if (selectedDuration === 'custom') {
              // For custom, check if it's a single day or longer
              if (customDateRange.startDate && customDateRange.endDate) {
                try {
                  const startDate = new Date(customDateRange.startDate);
                  const endDate = new Date(customDateRange.endDate);
                  startDate.setHours(0, 0, 0, 0);
                  endDate.setHours(0, 0, 0, 0);
                  const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
                  const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
                  const diffTime = endDateOnly.getTime() - startDateOnly.getTime();
                  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
                  return diffDays > 1; // More than 1 day = percentage, 1 day = count
                } catch (error) {
                  return true; // Default to percentage for custom
                }
              }
              return true; // Default to percentage for custom
            }
            // Week, month, year all show percentage
            return true;
          };

          const showPercentageInTooltip = shouldShowPercentageForTooltip();

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
                {formattedLabel}
              </p>
              {payload.map((entry, index) => (
                <p key={index} style={{
                  margin: '4px 0',
                  color: '#fff',
                  fontWeight: '500'
                }}>
                  Occupancy: {entry.value}{showPercentageInTooltip ? ' %' : ''}
                </p>
              ))}
            </div>
          );
        }
        return null;
      };

      return (
        <div
          onMouseDown={(e) => {
            if (e && typeof e.preventDefault === 'function') {
              e.preventDefault();
            }
            if (e && typeof e.stopPropagation === 'function') {
              e.stopPropagation();
            }
            return false;
          }}
          onMouseUp={(e) => {
            if (e && typeof e.preventDefault === 'function') {
              e.preventDefault();
            }
            if (e && typeof e.stopPropagation === 'function') {
              e.stopPropagation();
            }
            return false;
          }}
          onClick={(e) => {
            if (e && typeof e.preventDefault === 'function') {
              e.preventDefault();
            }
            if (e && typeof e.stopPropagation === 'function') {
              e.stopPropagation();
            }
            return false;
          }}
          onDoubleClick={(e) => {
            if (e && typeof e.preventDefault === 'function') {
              e.preventDefault();
            }
            if (e && typeof e.stopPropagation === 'function') {
              e.stopPropagation();
            }
            return false;
          }}
          onContextMenu={(e) => {
            if (e && typeof e.preventDefault === 'function') {
              e.preventDefault();
            }
            if (e && typeof e.stopPropagation === 'function') {
              e.stopPropagation();
            }
            return false;
          }}
          onTouchStart={(e) => {
            if (e && typeof e.preventDefault === 'function') {
              e.preventDefault();
            }
            if (e && typeof e.stopPropagation === 'function') {
              e.stopPropagation();
            }
            return false;
          }}
          onTouchEnd={(e) => {
            if (e && typeof e.preventDefault === 'function') {
              e.preventDefault();
            }
            if (e && typeof e.stopPropagation === 'function') {
              e.stopPropagation();
            }
            return false;
          }}
          style={{
            height: '350px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: '#767061',
            padding: '10px',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none'
          }}>
          <ResponsiveContainer
            onMouseDown={(e) => {
              if (e && typeof e.stopPropagation === 'function') {
                e.stopPropagation();
              }
            }}
            onMouseUp={(e) => {
              if (e && typeof e.stopPropagation === 'function') {
                e.stopPropagation();
              }
            }}
            onClick={(e) => {
              if (e && typeof e.stopPropagation === 'function') {
                e.stopPropagation();
              }
            }}
            onDoubleClick={(e) => {
              if (e && typeof e.stopPropagation === 'function') {
                e.stopPropagation();
              }
            }}
            onContextMenu={(e) => {
              if (e && typeof e.stopPropagation === 'function') {
                e.stopPropagation();
              }
            }}
            width="100%" height="100%">
            <LineChart
              onMouseDown={(e) => {
                if (e && typeof e.stopPropagation === 'function') {
                  e.stopPropagation();
                }
              }}
              onMouseUp={(e) => {
                if (e && typeof e.stopPropagation === 'function') {
                  e.stopPropagation();
                }
              }}
              onClick={(e) => {
                if (e && typeof e.stopPropagation === 'function') {
                  e.stopPropagation();
                }
              }}
              onDoubleClick={(e) => {
                if (e && typeof e.stopPropagation === 'function') {
                  e.stopPropagation();
                }
              }}
              onContextMenu={(e) => {
                if (e && typeof e.stopPropagation === 'function') {
                  e.stopPropagation();
                }
              }}
              data={processedChartData}
              key={`instant-occupancy-chart-${selectedDuration}-${currentDate}-${isNavigating}`}
              margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
            >
              <CartesianGrid stroke="#fff" strokeDasharray="3 3" />
              <XAxis
                dataKey={selectedDuration === 'this-day' ? 'timeMinutes' : 'date'}
                stroke="#fff"
                fontSize={selectedDuration === 'this-day' ? 9 : chartConfig.xAxisFontSize}
                tick={{
                  fill: '#fff',
                  fontWeight: 600,
                  fontSize: selectedDuration === 'this-day' ? 9 : chartConfig.xAxisFontSize,
                  angle: selectedDuration === 'this-day' ? -45 : 0,
                  textAnchor: selectedDuration === 'this-day' ? 'end' : 'middle'
                }}
                tickFormatter={formatXAxisLabel}
                axisLine={{ stroke: '#fff' }}
                tickLine={{ stroke: '#fff' }}
                interval={selectedDuration === 'this-month' || selectedDuration === 'this-year' || selectedDuration === 'custom' ? 0 : (selectedDuration === 'this-day' ? 0 : chartConfig.xAxisInterval)}
                tickCount={selectedDuration === 'this-day' ? 24 : chartConfig.xAxisTickCount}
                ticks={selectedDuration === 'this-day' ? (() => {
                  // Return numeric values in minutes (0, 60, 120, ..., 1380) for 24 hours
                  const ticks = [];
                  for (let hour = 0; hour < 24; hour++) {
                    ticks.push(hour * 60);
                  }
                  return ticks;
                })() : selectedDuration === 'this-year' ? (() => {
                  // Return all 48 data points (12 months × 4 quarters) for year view
                  // formatXAxisLabel will filter to show only month names for quarter 0
                  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  const allQuarters = [];
                  monthNames.forEach(monthName => {
                    for (let quarter = 0; quarter < 4; quarter++) {
                      allQuarters.push(`${monthName}-${quarter}`);
                    }
                  });
                  return allQuarters;
                })() : selectedDuration === 'custom' ? (() => {
                  // For custom periods, return all day values to ensure all labels are displayed
                  // For custom week periods, filter to only show 0th positions (Sun 0, Mon 0, etc.)
                  let isCustomWeekLocal = false;
                  if (customDateRange.startDate && customDateRange.endDate) {
                    try {
                      const startDate = new Date(customDateRange.startDate);
                      const endDate = new Date(customDateRange.endDate);
                      startDate.setHours(0, 0, 0, 0);
                      endDate.setHours(0, 0, 0, 0);
                      const diffTime = endDate.getTime() - startDate.getTime();
                      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
                      // Consider 2-7 day periods as week periods (to show only 0th positions)
                      isCustomWeekLocal = diffDays >= 2 && diffDays <= 7;
                    } catch (error) {
                      isCustomWeekLocal = false;
                    }
                  }
                  if (isCustomWeekLocal) {
                    return processedChartData
                      .filter(item => {
                        const match = item.date && String(item.date).match(/^([A-Za-z]{3})\s+(\d+)$/);
                        return match && parseInt(match[2]) === 0;
                      })
                      .map(item => item.date);
                  }
                  // For other custom periods, return all dates
                  return processedChartData.map(item => item.date);
                })() : undefined}
                type={selectedDuration === 'this-day' ? 'number' : (selectedDuration === 'this-year' || selectedDuration === 'custom' ? 'category' : undefined)}
                domain={selectedDuration === 'this-day' ? [0, 1440] : undefined}
              />
              <YAxis
                stroke="#fff"
                fontSize={12}
                tick={{ fill: '#fff', fontWeight: 600, fontSize: 12 }}
                axisLine={{ stroke: '#fff' }}
                tickLine={{ stroke: '#fff' }}
                domain={[0, maxOccupancy]}
                padding={{ right: 20 }}
                label={{
                  value: showPercentage ? '(Occupancy %)' : '(Occupancy Count)',
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#fff',
                  offset: -50,
                  style: { textAnchor: 'middle', fontSize: '14px', fontWeight: '600' }
                }}
                hide={nonNullValues.length === 0}
              />
              <Tooltip
                onMouseDown={(e) => {
                  if (e && typeof e.stopPropagation === 'function') {
                    e.stopPropagation();
                  }
                }}
                onMouseUp={(e) => {
                  if (e && typeof e.stopPropagation === 'function') {
                    e.stopPropagation();
                  }
                }}
                onClick={(e) => {
                  if (e && typeof e.stopPropagation === 'function') {
                    e.stopPropagation();
                  }
                }}
                content={<CustomTooltip />}
                cursor={{ stroke: '#fff', strokeWidth: 1 }}
              />
              <Line
                type="monotone"
                dataKey="occupancy"
                stroke="#87CEEB"
                strokeWidth={2}
                connectNulls={true}
                dot={(props) => {
                  // Only show dots for intermediate points (non-hourly) and non-null values
                  if (props.payload && props.payload.occupancy !== null && props.payload.occupancy !== undefined) {
                    // Check if this is an hourly point (for X-axis labels) - don't show dot
                    const isHourly = props.payload.isHourly === true;
                    if (!isHourly) {
                      return (
                        <circle
                          key={`dot-${props.index}`}
                          cx={props.cx} cy={props.cy} r={1}
                          fill="#87CEEB" stroke="#fff" strokeWidth={0.3}
                        />
                      );
                    }
                  }
                  return null;
                }}
                activeDot={{
                  r: 3,
                  stroke: '#fff',
                  strokeWidth: 1
                }}
                name="Occupancy"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )
    } catch (error) {
      return (
        <div style={{
          height: '350px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #ddd',
          borderRadius: '4px',
          backgroundColor: '#767061',
          color: '#fff',
          fontSize: '14px'
        }}>
          Error loading instant occupancy data
        </div>
      )
    }
  }


  return (
    <Box
      onMouseDown={(e) => {
        if (e && typeof e.stopPropagation === 'function') {
          e.stopPropagation();
        }
      }}
      onMouseUp={(e) => {
        if (e && typeof e.stopPropagation === 'function') {
          e.stopPropagation();
        }
      }}
      onClick={(e) => {
        if (e && typeof e.stopPropagation === 'function') {
          e.stopPropagation();
        }
      }}
      onDoubleClick={(e) => {
        if (e && typeof e.stopPropagation === 'function') {
          e.stopPropagation();
        }
      }}
      onContextMenu={(e) => {
        if (e && typeof e.stopPropagation === 'function') {
          e.stopPropagation();
        }
      }}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: { xs: 2, sm: 3, md: 4, lg: 0.5, xl: 6 },
        width: '100%',
        maxWidth: '100%'
      }}>
      {/* Error Display */}
      {dashboardError && (
        <Box sx={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid #ef4444',
          borderRadius: '8px',
          padding: { xs: 2, sm: 2.5, md: 3, lg: 4, xl: 5 },
          color: '#ef4444',
          fontSize: { xs: '14px', sm: '15px', md: '16px', lg: '18px', xl: '20px' },
          textAlign: 'center'
        }}>
          Error: {dashboardError}
          <Box sx={{ fontSize: { xs: '12px', sm: '13px', md: '14px', lg: '16px', xl: '18px' }, marginTop: 1, opacity: 0.8 }}>
            Check console for detailed debugging information
          </Box>
        </Box>
      )}

      {/* API Error Display */}
      {hasApiErrors() && (
        <Box sx={{
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid #f59e0b',
          borderRadius: '8px',
          padding: { xs: 2, sm: 2.5, md: 3, lg: 4, xl: 5 },
          color: '#f59e0b',
          fontSize: { xs: '14px', sm: '15px', md: '16px', lg: '18px', xl: '20px' },
          textAlign: 'center'
        }}>
          Some data endpoints are experiencing issues
          <Box sx={{ fontSize: { xs: '12px', sm: '13px', md: '14px', lg: '16px', xl: '18px' }, marginTop: 1, opacity: 0.8 }}>
            Some charts may display limited or no data. Please try again later.
          </Box>
        </Box>
      )}

      {/* Loading State Display */}
      {/* {dashboardLoading && (
        <Box sx={{
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid #3b82f6',
          borderRadius: '8px',
          padding: { xs: 2, sm: 2.5, md: 3, lg: 4, xl: 5 },
          color: '#3b82f6',
          fontSize: { xs: '14px', sm: '15px', md: '16px', lg: '18px', xl: '20px' },
          textAlign: 'center'
        }}>
          Loading dashboard data...
          <Box sx={{ fontSize: { xs: '12px', sm: '13px', md: '14px', lg: '16px', xl: '18px' }, marginTop: 1, opacity: 0.8 }}>
            Please wait while we fetch the latest information
          </Box>
        </Box>
      )} */}



      {/* Area Loading State Display */}
      {/* {!allAreasLoaded && floors.length > 0 && (
        <Box sx={{
          backgroundColor: 'rgba(255, 193, 7, 0.1)',
          border: '1px solid #ffc107',
          borderRadius: '8px',
          padding: { xs: 2, sm: 2.5, md: 3, lg: 4, xl: 5 },
          color: '#ffc107',
          fontSize: { xs: '14px', sm: '15px', md: '16px', lg: '18px', xl: '20px' },
          textAlign: 'center'
        }}>
          Loading areas...
          <Box sx={{ fontSize: { xs: '12px', sm: '13px', md: '14px', lg: '16px', xl: '18px' }, marginTop: 1, opacity: 0.8 }}>
            Please wait while we load all available areas for export functionality
          </Box>
        </Box>
      )} */}

      {/* Charts Tab Mode - Show Instant Occupancy Count, Occupancy by Group, and Utilization By Area */}
      {showChartsTab && (
        <>
          {/* Top Section: Instant Occupancy Count Chart */}
          <Box
            onMouseDown={(e) => {
              if (e && typeof e.stopPropagation === 'function') {
                e.stopPropagation();
              }
            }}
            onMouseUp={(e) => {
              if (e && typeof e.stopPropagation === 'function') {
                e.stopPropagation();
              }
            }}
            onClick={(e) => {
              if (e && typeof e.stopPropagation === 'function') {
                e.stopPropagation();
              }
            }}
            onDoubleClick={(e) => {
              if (e && typeof e.stopPropagation === 'function') {
                e.stopPropagation();
              }
            }}
            onContextMenu={(e) => {
              if (e && typeof e.stopPropagation === 'function') {
                e.stopPropagation();
              }
            }}
            sx={{
              backgroundColor: 'rgba(128, 120, 100, 0.6)',
              borderRadius: '8px',
              padding: { xs: 2, sm: 2.5, md: 3, lg: 4, xl: 5 },
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              border: '1px solid #ccc',
              minHeight: { xs: '400px', sm: '430px', md: '450px', lg: '470px', xl: '500px' }
            }}>
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: { xs: 2, sm: 2.5, md: 3, lg: 4, xl: 5 }
            }}>
              <Box component="h3" sx={chartHeaderStyle}>
                {getWidgetTitle('instant_occupancy_count', 'Instant Occupancy Count')}
              </Box>
              <Box sx={{ position: 'relative' }}>
                <button
                  onClick={() => setShowExportDropdown(prev => ({ ...prev, instant: !prev.instant }))}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: isLargeScreen ? '16px' : '14px',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '9px',
                    padding: isLargeScreen ? '8px 12px' : '6px 10px',
                    borderRadius: '4px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  📤 Export
                </button>
                <ExportDropdown
                  isOpen={showExportDropdown.instant}
                  onClose={() => setShowExportDropdown(prev => ({ ...prev, instant: false }))}
                  chartTitle={getWidgetTitle('instant_occupancy_count', 'Instant Occupancy Count')}
                  dropdownKey="instant"
                />
              </Box>
            </Box>
            {(instantOccupancyCountLoading) ? (
              <ChartLoader height="350px" />
            ) : (
              <InstantOccupancyChartComponent />
            )}
          </Box>

          {/* Main Content: Two columns for Occupancy by Group and Utilization By Area */}
          <Box sx={{
            display: 'flex',
            gap: { xs: 2, sm: 3, md: 4, lg: 5.5, xl: 6 },
            flexWrap: 'wrap',
            flexDirection: { xs: 'column', lg: 'row' },
            width: '100%'
          }}>
            {/* Left Column: Occupancy by Group */}
            <Box sx={{
              width: { xs: '100%', lg: '48%' },
              display: 'flex',
              flexDirection: 'column',
              gap: { xs: 2, sm: 3, md: 4, lg: 5, xl: 6 }
            }}>
              <Box
                onMouseDown={(e) => {
                  if (e && typeof e.stopPropagation === 'function') {
                    e.stopPropagation();
                  }
                }}
                onMouseUp={(e) => {
                  if (e && typeof e.stopPropagation === 'function') {
                    e.stopPropagation();
                  }
                }}
                onClick={(e) => {
                  if (e && typeof e.stopPropagation === 'function') {
                    e.stopPropagation();
                  }
                }}
                onDoubleClick={(e) => {
                  if (e && typeof e.stopPropagation === 'function') {
                    e.stopPropagation();
                  }
                }}
                onContextMenu={(e) => {
                  if (e && typeof e.stopPropagation === 'function') {
                    e.stopPropagation();
                  }
                }}
                sx={{
                  backgroundColor: 'rgba(128, 120, 100, 0.6)',
                  borderRadius: '8px',
                  padding: { xs: 2, sm: 2.5, md: 3, lg: 4, xl: 5 },
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  border: '1px solid #ccc',
                  minHeight: { xs: '350px', sm: '380px', md: '400px', lg: '420px', xl: '450px' }
                }}>
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: { xs: 1.5, sm: 2, md: 2.5, lg: 3, xl: 3.5 }
                }}>
                  <Box component="h3" sx={chartHeaderStyle}>
                    {getWidgetTitle('utilization_by_area_group', 'Occupancy by Group')}
                  </Box>
                  <Box sx={{ position: 'relative' }}>
                    <button
                      onClick={() => setShowExportDropdown(prev => ({ ...prev, pie: !prev.pie }))}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: isLargeScreen ? '16px' : '14px',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '9px',
                        padding: isLargeScreen ? '8px 12px' : '6px 10px',
                        borderRadius: '4px',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      📤 Export
                    </button>
                    <ExportDropdown
                      isOpen={showExportDropdown.pie}
                      onClose={() => setShowExportDropdown(prev => ({ ...prev, pie: false }))}
                      chartTitle={getWidgetTitle('utilization_by_area_group', 'Occupancy by Group')}
                      dropdownKey="pie"
                    />
                  </Box>
                </Box>
                {(activeOccupancyByGroupLoading) ? (
                  <ChartLoader height="400px" />
                ) : (
                  <StackedBarChartComponent />
                )}
              </Box>

              {/* Peak & Minimum Utilization Cards */}
              <Box
                onMouseDown={(e) => {
                  if (e && typeof e.stopPropagation === 'function') {
                    e.stopPropagation();
                  }
                }}
                onMouseUp={(e) => {
                  if (e && typeof e.stopPropagation === 'function') {
                    e.stopPropagation();
                  }
                }}
                onClick={(e) => {
                  if (e && typeof e.stopPropagation === 'function') {
                    e.stopPropagation();
                  }
                }}
                onDoubleClick={(e) => {
                  if (e && typeof e.stopPropagation === 'function') {
                    e.stopPropagation();
                  }
                }}
                onContextMenu={(e) => {
                  if (e && typeof e.stopPropagation === 'function') {
                    e.stopPropagation();
                  }
                }}
                sx={{
                  backgroundColor: 'rgba(128, 120, 100, 0.6)',
                  borderRadius: '8px',
                  padding: { xs: 2, sm: 2.5, md: 3, lg: 4, xl: 5 },
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  border: '1px solid #ccc',
                  minHeight: { xs: '200px', sm: '220px', md: '240px', lg: '260px', xl: '280px' }
                }}>
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: { xs: 1.5, sm: 2, md: 2.5, lg: 3, xl: 3.5 }
                }}>
                  <Box component="h3" sx={chartHeaderStyle}>
                    {getWidgetTitle('peak_and_minimum_utilization', 'Peak & Minimum Utilization')}
                  </Box>
                </Box>

                {(instantOccupancyCountLoading) ? (
                  <Box sx={{ display: 'flex', gap: { xs: 1.5, sm: 2, md: 2.5, lg: 3, xl: 3.5 } }}>
                    {/* Peak Occupancy Card - Loading */}
                    <Box
                      sx={{
                        flex: 1,
                        backgroundColor: '#232323',
                        borderRadius: '12px',
                        padding: '16px 14px',
                        textAlign: 'center',
                        color: '#fff',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '120px'
                      }}
                    >
                      <Box
                        component="h4"
                        sx={{
                          margin: '0 0 8px 0',
                          fontSize: isLargeScreen ? '14px' : '13px',
                          color: '#fff',
                          fontWeight: 600,
                          fontFamily: 'inherit'
                        }}
                      >
                        Peak Occupancy
                      </Box>
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          border: '2px solid #555',
                          borderTop: '2px solid #fff',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite',
                        }}
                      />
                    </Box>

                    {/* Min Occupancy Card - Loading */}
                    <Box
                      sx={{
                        flex: 1,
                        backgroundColor: '#232323',
                        borderRadius: '12px',
                        padding: '16px 14px',
                        textAlign: 'center',
                        color: '#fff',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '120px'
                      }}
                    >
                      <Box
                        component="h4"
                        sx={{
                          margin: '0 0 8px 0',
                          fontSize: isLargeScreen ? '14px' : '13px',
                          color: '#fff',
                          fontWeight: 600,
                          fontFamily: 'inherit'
                        }}
                      >
                        Min Occupancy
                      </Box>
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          border: '2px solid #555',
                          borderTop: '2px solid #fff',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite',
                        }}
                      />
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', gap: { xs: 1.5, sm: 2, md: 2.5, lg: 3, xl: 3.5 } }}>
                    {/* Peak Occupancy Card - Calculate from instant occupancy count chart data */}
                    <Box
                      sx={{
                        flex: 1,
                        backgroundColor: '#232323',
                        borderRadius: '12px',
                        padding: '16px 14px',
                        textAlign: 'center',
                        color: '#fff',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                      }}
                    >
                      <Box
                        component="h4"
                        sx={{
                          margin: '0 0 8px 0',
                          fontSize: isLargeScreen ? '14px' : '13px',
                          color: '#fff',
                          fontWeight: 600,
                          fontFamily: 'inherit'
                        }}
                      >
                        Peak Occupancy
                      </Box>
                      <Box
                        sx={{
                          fontSize: isLargeScreen ? '20px' : '18px',
                          fontWeight: 700,
                          color: '#fff',
                          marginBottom: '6px',
                          lineHeight: 1.25,
                          wordWrap: 'break-word',
                          overflow: 'hidden',
                          fontFamily: 'inherit'
                        }}
                      >
                        {(() => {
                          const peakMinData = calculatePeakMinFromChartData();
                          return peakMinData.peak !== null ? peakMinData.peak : 'No data';
                        })()}
                      </Box>
                      <Box
                        sx={{
                          fontSize: isLargeScreen ? '12px' : '11px',
                          color: '#ccc',
                          fontWeight: 500,
                          fontFamily: 'inherit'
                        }}
                      >
                        {(() => {
                          const peakMinData = calculatePeakMinFromChartData();
                          return peakMinData.peakTime ? `at ${formatPeakMinTime(peakMinData.peakTime)}` : 'No data';
                        })()}
                      </Box>
                    </Box>

                    {/* Min Occupancy Card - Calculate from instant occupancy count chart data */}
                    <Box
                      sx={{
                        flex: 1,
                        backgroundColor: '#232323',
                        borderRadius: '12px',
                        padding: '16px 14px',
                        textAlign: 'center',
                        color: '#fff',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                      }}
                    >
                      <Box
                        component="h4"
                        sx={{
                          margin: '0 0 8px 0',
                          fontSize: isLargeScreen ? '14px' : '13px',
                          color: '#fff',
                          fontWeight: 600,
                          fontFamily: 'inherit'
                        }}
                      >
                        Min Occupancy
                      </Box>
                      <Box
                        sx={{
                          fontSize: isLargeScreen ? '20px' : '18px',
                          fontWeight: 700,
                          color: '#fff',
                          marginBottom: '6px',
                          lineHeight: 1.25,
                          wordWrap: 'break-word',
                          overflow: 'hidden',
                          fontFamily: 'inherit'
                        }}
                      >
                        {(() => {
                          const peakMinData = calculatePeakMinFromChartData();
                          return peakMinData.min !== null ? peakMinData.min : 'No data';
                        })()}
                      </Box>
                      <Box
                        sx={{
                          fontSize: isLargeScreen ? '12px' : '11px',
                          color: '#ccc',
                          fontWeight: 500,
                          fontFamily: 'inherit'
                        }}
                      >
                        {(() => {
                          const peakMinData = calculatePeakMinFromChartData();
                          return peakMinData.minTime ? `at ${formatPeakMinTime(peakMinData.minTime)}` : 'No data';
                        })()}
                      </Box>
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Right Column: Utilization By Area */}
            <Box sx={{
              width: { xs: '100%', lg: '48%' },
              display: 'flex',
              flexDirection: 'column',
              gap: { xs: 2, sm: 3, md: 4, lg: 5, xl: 6 }
            }}>
              <Box
                onMouseDown={(e) => {
                  if (e && typeof e.stopPropagation === 'function') {
                    e.stopPropagation();
                  }
                }}
                onMouseUp={(e) => {
                  if (e && typeof e.stopPropagation === 'function') {
                    e.stopPropagation();
                  }
                }}
                onClick={(e) => {
                  if (e && typeof e.stopPropagation === 'function') {
                    e.stopPropagation();
                  }
                }}
                onDoubleClick={(e) => {
                  if (e && typeof e.stopPropagation === 'function') {
                    e.stopPropagation();
                  }
                }}
                onContextMenu={(e) => {
                  if (e && typeof e.stopPropagation === 'function') {
                    e.stopPropagation();
                  }
                }}
                sx={{
                  width: '100%',
                  backgroundColor: 'rgba(128, 120, 100, 0.6)',
                  borderRadius: '8px',
                  padding: { xs: 2, sm: 2.5, md: 3, lg: 4, xl: 5 },
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  border: '1px solid #ccc',
                  height: { xs: '600px', sm: '650px', md: '700px', lg: '850px', xl: '900px' }
                }}>
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: { xs: 2, sm: 2.5, md: 3, lg: 4, xl: 5 }
                }}>
                  <Box component="h3" sx={chartHeaderStyle}>
                    {getWidgetTitle('utilization_by_area', 'Utilization By Area')}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Box sx={{ position: 'relative' }}>
                      <button
                        onClick={() => setShowExportDropdown(prev => ({ ...prev, table: !prev.table }))}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: isLargeScreen ? '16px' : '14px',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: isLargeScreen ? '8px 12px' : '6px 10px',
                          borderRadius: '4px',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        📤 Export
                      </button>
                      <ExportDropdown
                        isOpen={showExportDropdown.table}
                        onClose={() => setShowExportDropdown(prev => ({ ...prev, table: false }))}
                        chartTitle={getWidgetTitle('utilization_by_area', 'Utilization By Area')}
                        dropdownKey="table"
                      />
                    </Box>
                  </Box>
                </Box>

                {(activeSpaceUtilizationLoading) ? (
                  <Box sx={{
                    height: 'calc(100% - 60px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: '#767061',
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
                  </Box>
                ) : !activeSpaceUtilizationPerArea && !activeSpaceUtilizationLoading ? (
                  <Box sx={{
                    height: 'calc(100% - 60px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: '#767061',
                    color: '#fff',
                    fontSize: { xs: '12px', sm: '13px', md: '14px', lg: '15px', xl: '16px' }
                  }}>
                    No data available for Utilization By Area
                  </Box>
                ) : !activeSpaceUtilizationPerArea ? (
                  <Box sx={{
                    height: 'calc(100% - 60px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: '#767061',
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
                  </Box>
                ) : areaData.length === 0 ? (
                  <Box sx={{
                    height: 'calc(100% - 60px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: '#767061',
                    color: '#fff',
                    fontSize: { xs: '12px', sm: '13px', md: '14px', lg: '15px', xl: '16px' }
                  }}>
                    No data available for Utilization By Area
                  </Box>
                ) : (
                  <Box sx={{
                    height: 'calc(100% - 60px)',
                    overflowY: 'auto',
                    paddingRight: '8px'
                  }}>
                    {areaData.map((area, index) => (
                      <Box key={index} sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: { xs: '8px 0', sm: '10px 0', md: '12px 0', lg: '14px 0', xl: '16px 0' },
                        borderBottom: '1px solid rgba(255,255,255,0.2)',
                        color: '#fff'
                      }}>
                        <Box component="span" sx={{
                          fontSize: { xs: '12px', sm: '13px', md: '14px', lg: '15px', xl: '16px' },
                          fontWeight: '500'
                        }}>
                          {area.name || 'Unknown Area'}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: '8px', sm: '10px', md: '12px', lg: '14px', xl: '16px' } }}>
                          <Box sx={{
                            flex: 1,
                            height: { xs: '1px', sm: '1.5px', md: '2px', lg: '2.5px', xl: '3px' },
                            backgroundColor: 'rgba(255,255,255,0.3)',
                            borderRadius: '1px'
                          }} />
                          <Box component="span" sx={{
                            fontSize: { xs: '12px', sm: '13px', md: '14px', lg: '15px', xl: '16px' },
                            fontWeight: '600'
                          }}>
                            {area.percentage || 0}%
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </>
      )}

      {/* Space Utilization Tab Mode - Show all regular charts */}
      {!showChartsTab && !showOnlyInstantChart && (
        <>
          {/* Top Section: Line Chart for Utilization */}
          <Box
            onMouseDown={(e) => {
              if (e && typeof e.stopPropagation === 'function') {
                e.stopPropagation();
              }
            }}
            onMouseUp={(e) => {
              if (e && typeof e.stopPropagation === 'function') {
                e.stopPropagation();
              }
            }}
            onClick={(e) => {
              if (e && typeof e.stopPropagation === 'function') {
                e.stopPropagation();
              }
            }}
            onDoubleClick={(e) => {
              if (e && typeof e.stopPropagation === 'function') {
                e.stopPropagation();
              }
            }}
            onContextMenu={(e) => {
              if (e && typeof e.stopPropagation === 'function') {
                e.stopPropagation();
              }
            }}
            sx={{
              backgroundColor: 'rgba(128, 120, 100, 0.6)',
              borderRadius: '8px',
              padding: { xs: 2, sm: 2.5, md: 3, lg: 4, xl: 5 },
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              border: '1px solid #ccc',
              minHeight: { xs: '400px', sm: '430px', md: '450px', lg: '470px', xl: '500px' }
            }}>
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: { xs: 2, sm: 2.5, md: 3, lg: 4, xl: 5 }
            }}>
              <Box component="h3" sx={chartHeaderStyle}>
                {getWidgetTitle('utilization', 'Utilization')}
              </Box>
              <Box sx={{ position: 'relative' }}>
                <button
                  onClick={() => setShowExportDropdown(prev => ({ ...prev, line: !prev.line }))}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: isLargeScreen ? '16px' : '14px',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: isLargeScreen ? '8px 12px' : '6px 10px',
                    borderRadius: '4px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  📤 Export
                </button>
                <ExportDropdown
                  isOpen={showExportDropdown.line}
                  onClose={() => setShowExportDropdown(prev => ({ ...prev, line: false }))}
                  chartTitle={getWidgetTitle('utilization', 'Utilization')}
                  dropdownKey="line"
                />
              </Box>
            </Box>
            {(occupancyCountLoading) ? (
              <ChartLoader height="350px" />
            ) : (
              <LineChartComponent />
            )}
          </Box>

          {/* Main Content: Two columns */}
          <Box sx={{
            display: 'flex',
            gap: { xs: 2, sm: 3, md: 4, lg: 5.5, xl: 6 },
            flexWrap: 'wrap',
            flexDirection: { xs: 'column', lg: 'row' },
            width: '100%'
          }}>
            {/* Left Column: Pie Chart Container - 50% width */}
            <Box sx={{
              width: { xs: '100%', lg: '48%' },
              display: 'flex',
              flexDirection: 'column',
              gap: { xs: 2, sm: 3, md: 4, lg: 5, xl: 6 }
            }}>

              {/* Top Container: Pie Chart for Area Groups */}
              <Box
                onMouseDown={(e) => {
                  if (e && typeof e.stopPropagation === 'function') {
                    e.stopPropagation();
                  }
                }}
                onMouseUp={(e) => {
                  if (e && typeof e.stopPropagation === 'function') {
                    e.stopPropagation();
                  }
                }}
                onClick={(e) => {
                  if (e && typeof e.stopPropagation === 'function') {
                    e.stopPropagation();
                  }
                }}
                onDoubleClick={(e) => {
                  if (e && typeof e.stopPropagation === 'function') {
                    e.stopPropagation();
                  }
                }}
                onContextMenu={(e) => {
                  if (e && typeof e.stopPropagation === 'function') {
                    e.stopPropagation();
                  }
                }}
                sx={{
                  backgroundColor: 'rgba(128, 120, 100, 0.6)',
                  borderRadius: '8px',
                  padding: { xs: 2, sm: 2.5, md: 3, lg: 4, xl: 5 },
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  border: '1px solid #ccc',
                  minHeight: { xs: '350px', sm: '380px', md: '400px', lg: '420px', xl: '450px' }
                }}>
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: { xs: 1.5, sm: 2, md: 2.5, lg: 3, xl: 3.5 }
                }}>
                  <Box component="h3" sx={chartHeaderStyle}>
                    {getWidgetTitle('utilization_by_area_group', 'Utilization By Area Groups')}
                  </Box>
                  <Box sx={{ position: 'relative' }}>
                    <button
                      onClick={() => setShowExportDropdown(prev => ({ ...prev, pie: !prev.pie }))}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: isLargeScreen ? '16px' : '14px',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '9px',
                        padding: isLargeScreen ? '8px 12px' : '6px 10px',
                        borderRadius: '4px',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      📤 Export
                    </button>
                    <ExportDropdown
                      isOpen={showExportDropdown.pie}
                      onClose={() => setShowExportDropdown(prev => ({ ...prev, pie: false }))}
                      chartTitle={getWidgetTitle('utilization_by_area_group', 'Utilization By Area Groups')}
                      dropdownKey="pie"
                    />
                  </Box>
                </Box>
                {(occupancyByGroupLoading) ? (
                  <ChartLoader height="400px" />
                ) : (
                  <StackedBarChartComponent />
                )}
              </Box>

              {/* Bottom Container: Peak & Minimum Utilization */}
              <Box
                onMouseDown={(e) => {
                  if (e && typeof e.stopPropagation === 'function') {
                    e.stopPropagation();
                  }
                }}
                onMouseUp={(e) => {
                  if (e && typeof e.stopPropagation === 'function') {
                    e.stopPropagation();
                  }
                }}
                onClick={(e) => {
                  if (e && typeof e.stopPropagation === 'function') {
                    e.stopPropagation();
                  }
                }}
                onDoubleClick={(e) => {
                  if (e && typeof e.stopPropagation === 'function') {
                    e.stopPropagation();
                  }
                }}
                onContextMenu={(e) => {
                  if (e && typeof e.stopPropagation === 'function') {
                    e.stopPropagation();
                  }
                }}
                sx={{
                  backgroundColor: 'rgba(128, 120, 100, 0.6)',
                  borderRadius: '8px',
                  padding: { xs: 2, sm: 2.5, md: 3, lg: 4, xl: 5 },
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  border: '1px solid #ccc',
                  minHeight: { xs: '200px', sm: '220px', md: '240px', lg: '260px', xl: '280px' }
                }}>
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: { xs: 1.5, sm: 2, md: 2.5, lg: 3, xl: 3.5 }
                }}>
                  <Box component="h3" sx={chartHeaderStyle}>
                    {getWidgetTitle('peak_and_minimum_utilization', 'Peak & Minimum Utilization')}
                  </Box>
                  <Box sx={{ position: 'relative' }}>
                    {/* Export button - Available for all user roles (Superadmin, Admin, Operator) */}
                    {/* <button 
                  onClick={() => setShowExportDropdown(prev => ({ ...prev, peak: !prev.peak }))}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: isLargeScreen ? '16px' : '14px',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: isLargeScreen ? '8px 12px' : '6px 10px',
                    borderRadius: '4px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  Export
                </button>
                <ExportDropdown 
                  isOpen={showExportDropdown.peak} 
                  onClose={() => setShowExportDropdown(prev => ({ ...prev, peak: false }))}
                  chartTitle={getWidgetTitle('peak_and_minimum_utilization', 'Peak & Minimum Utilization')}
                /> */}
                  </Box>
                </Box>

                {(occupancyCountLoading) ? ( // Peak/min derive from occupancy count data
                  <Box sx={{ display: 'flex', gap: { xs: 1.5, sm: 2, md: 2.5, lg: 3, xl: 3.5 } }}>
                    {/* Peak Occupancy Card - Loading */}
                    <Box
                      sx={{
                        flex: 1,
                        backgroundColor: '#232323',
                        borderRadius: '12px',
                        padding: '16px 14px',
                        textAlign: 'center',
                        color: '#fff',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '120px'
                      }}
                    >
                      <Box
                        component="h4"
                        sx={{
                          margin: '0 0 8px 0',
                          fontSize: isLargeScreen ? '14px' : '13px',
                          color: '#fff',
                          fontWeight: 600,
                          fontFamily: 'inherit'
                        }}
                      >
                        Peak Occupancy
                      </Box>
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          border: '2px solid #555',
                          borderTop: '2px solid #fff',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite',
                        }}
                      />
                    </Box>

                    {/* Min Occupancy Card - Loading */}
                    <Box
                      sx={{
                        flex: 1,
                        backgroundColor: '#232323',
                        borderRadius: '12px',
                        padding: '16px 14px',
                        textAlign: 'center',
                        color: '#fff',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '120px'
                      }}
                    >
                      <Box
                        component="h4"
                        sx={{
                          margin: '0 0 8px 0',
                          fontSize: isLargeScreen ? '14px' : '13px',
                          color: '#fff',
                          fontWeight: 600,
                          fontFamily: 'inherit'
                        }}
                      >
                        Min Occupancy
                      </Box>
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          border: '2px solid #555',
                          borderTop: '2px solid #fff',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite',
                        }}
                      />
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', gap: { xs: 1.5, sm: 2, md: 2.5, lg: 3, xl: 3.5 } }}>
                    {/* Peak Occupancy Card - Calculate from chart data */}
                    <Box
                      sx={{
                        flex: 1,
                        backgroundColor: '#232323',
                        borderRadius: '12px',
                        padding: '16px 14px',
                        textAlign: 'center',
                        color: '#fff',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                      }}
                    >
                      <Box
                        component="h4"
                        sx={{
                          margin: '0 0 8px 0',
                          fontSize: isLargeScreen ? '14px' : '13px',
                          color: '#fff',
                          fontWeight: 600,
                          fontFamily: 'inherit'
                        }}
                      >
                        Peak Occupancy
                      </Box>
                      <Box
                        sx={{
                          fontSize: isLargeScreen ? '20px' : '18px',
                          fontWeight: 700,
                          color: '#fff',
                          marginBottom: '6px',
                          lineHeight: 1.25,
                          wordWrap: 'break-word',
                          overflow: 'hidden',
                          fontFamily: 'inherit'
                        }}
                      >
                        {(() => {
                          const peakMinData = calculatePeakMinFromChartData();
                          return peakMinData.peak !== null ? peakMinData.peak : 'No data';
                        })()}
                      </Box>
                      <Box
                        sx={{
                          fontSize: isLargeScreen ? '12px' : '11px',
                          color: '#ccc',
                          fontWeight: 500,
                          fontFamily: 'inherit'
                        }}
                      >
                        {(() => {
                          const peakMinData = calculatePeakMinFromChartData();
                          return peakMinData.peakTime ? `at ${formatPeakMinTime(peakMinData.peakTime)}` : 'No data';
                        })()}
                      </Box>
                    </Box>

                    {/* Min Occupancy Card - Calculate from chart data */}
                    <Box
                      sx={{
                        flex: 1,
                        backgroundColor: '#232323',
                        borderRadius: '12px',
                        padding: '16px 14px',
                        textAlign: 'center',
                        color: '#fff',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                      }}
                    >
                      <Box
                        component="h4"
                        sx={{
                          margin: '0 0 8px 0',
                          fontSize: isLargeScreen ? '14px' : '13px',
                          color: '#fff',
                          fontWeight: 600,
                          fontFamily: 'inherit'
                        }}
                      >
                        Min Occupancy
                      </Box>
                      <Box
                        sx={{
                          fontSize: isLargeScreen ? '20px' : '18px',
                          fontWeight: 700,
                          color: '#fff',
                          marginBottom: '6px',
                          lineHeight: 1.25,
                          wordWrap: 'break-word',
                          overflow: 'hidden',
                          fontFamily: 'inherit'
                        }}
                      >
                        {(() => {
                          const peakMinData = calculatePeakMinFromChartData();
                          return peakMinData.min !== null ? peakMinData.min : 'No data';
                        })()}
                      </Box>
                      <Box
                        sx={{
                          fontSize: isLargeScreen ? '12px' : '11px',
                          color: '#ccc',
                          fontWeight: 500,
                          fontFamily: 'inherit'
                        }}
                      >
                        {(() => {
                          const peakMinData = calculatePeakMinFromChartData();
                          return peakMinData.minTime ? `at ${formatPeakMinTime(peakMinData.minTime)}` : 'No data';
                        })()}
                      </Box>
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Right Container: Utilization By Area List - Height to match Peak & Min container */}
            <Box
              onMouseDown={(e) => {
                if (e && typeof e.stopPropagation === 'function') {
                  e.stopPropagation();
                }
              }}
              onMouseUp={(e) => {
                if (e && typeof e.stopPropagation === 'function') {
                  e.stopPropagation();
                }
              }}
              onClick={(e) => {
                if (e && typeof e.stopPropagation === 'function') {
                  e.stopPropagation();
                }
              }}
              onDoubleClick={(e) => {
                if (e && typeof e.stopPropagation === 'function') {
                  e.stopPropagation();
                }
              }}
              onContextMenu={(e) => {
                if (e && typeof e.stopPropagation === 'function') {
                  e.stopPropagation();
                }
              }}
              sx={{
                width: { xs: '100%', lg: '48%' },
                backgroundColor: 'rgba(128, 120, 100, 0.6)',
                borderRadius: '8px',
                padding: { xs: 2, sm: 2.5, md: 3, lg: 4, xl: 5 },
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                border: '1px solid #ccc',
                height: { xs: '600px', sm: '650px', md: '700px', lg: '850px', xl: '900px' }
              }}>
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: { xs: 2, sm: 2.5, md: 3, lg: 4, xl: 5 }
              }}>
                <Box component="h3" sx={chartHeaderStyle}>
                  {getWidgetTitle('utilization_by_area', 'Utilization By Area')}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Box sx={{ position: 'relative' }}>
                    <button
                      onClick={() => setShowExportDropdown(prev => ({ ...prev, table: !prev.table }))}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: isLargeScreen ? '16px' : '14px',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: isLargeScreen ? '8px 12px' : '6px 10px',
                        borderRadius: '4px',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      📤 Export
                    </button>
                    <ExportDropdown
                      isOpen={showExportDropdown.table}
                      onClose={() => setShowExportDropdown(prev => ({ ...prev, table: false }))}
                      chartTitle={getWidgetTitle('utilization_by_area', 'Utilization By Area')}
                      dropdownKey="table"
                    />
                  </Box>
                </Box>
              </Box>

              {(spaceUtilizationLoading) ? (
                <Box sx={{
                  height: 'calc(100% - 60px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: '#767061',
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
                </Box>
              ) : !spaceUtilizationPerArea && !spaceUtilizationLoading ? (
                <Box sx={{
                  height: 'calc(100% - 60px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: '#767061',
                  color: '#fff',
                  fontSize: { xs: '12px', sm: '13px', md: '14px', lg: '15px', xl: '16px' }
                }}>
                  No data available for Utilization By Area
                </Box>
              ) : !spaceUtilizationPerArea ? (
                // Show loading when data is being fetched
                <Box sx={{
                  height: 'calc(100% - 60px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: '#767061',
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
                </Box>
              ) : areaData.length === 0 ? (
                <Box sx={{
                  height: 'calc(100% - 60px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: '#767061',
                  color: '#fff',
                  fontSize: { xs: '12px', sm: '13px', md: '14px', lg: '15px', xl: '16px' }
                }}>
                  No data available for Utilization By Area
                </Box>
              ) : (
                <Box sx={{
                  height: 'calc(100% - 60px)',
                  overflowY: 'auto',
                  paddingRight: '8px'
                }}>
                  {areaData.map((area, index) => (
                    <Box key={index} sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: { xs: '8px 0', sm: '10px 0', md: '12px 0', lg: '14px 0', xl: '16px 0' },
                      borderBottom: '1px solid rgba(255,255,255,0.2)',
                      color: '#fff'
                    }}>
                      <Box component="span" sx={{
                        fontSize: { xs: '12px', sm: '13px', md: '14px', lg: '15px', xl: '16px' },
                        fontWeight: '500'
                      }}>
                        {area.name || 'Unknown Area'}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: '8px', sm: '10px', md: '12px', lg: '14px', xl: '16px' } }}>
                        <Box sx={{
                          flex: 1,
                          height: { xs: '1px', sm: '1.5px', md: '2px', lg: '2.5px', xl: '3px' },
                          backgroundColor: 'rgba(255,255,255,0.3)',
                          borderRadius: '1px'
                        }} />
                        <Box component="span" sx={{
                          fontSize: { xs: '12px', sm: '13px', md: '14px', lg: '15px', xl: '16px' },
                          fontWeight: '600'
                        }}>
                          {area.percentage || 0}%
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        </>
      )}

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
      {/* Email Input Dialog - DISABLED: No popup, using saved email only */}
    </Box>
  )
}

export default SpaceUtilization

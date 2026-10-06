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

import React, { useState, useEffect, useLayoutEffect, useCallback, useRef, useMemo } from 'react'
import { handleRovingTablistKeyDown } from '../../../../utils/keyboard/rovingTablistKeyboard'
import { registerPageSubNavHandler, requestTopbarNavFocus } from '../../../../utils/keyboard/pageSubNavBridge'
import { isKeyboardNavBlockedTarget } from '../../../../utils/keyboard/keyboardNavUtils'
import { useDispatch, useSelector, shallowEqual, useStore } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
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
  setCustomDateRangeImmediate,
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
  fetchAreaGroups,
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
import ConsumptionSavingsCombinedChart from './ConsumptionSavingsCombinedChart'
import DashboardDurationFilterBar from './DashboardDurationFilterBar'

import { Grid, Box, useTheme, useMediaQuery, Snackbar, Alert, Typography, Button } from '@mui/material'; // Add useTheme and useMediaQuery
import { AddBoxOutlined, IndeterminateCheckBoxOutlined } from '@mui/icons-material';
import Alerts from './Alerts'
import {
  fetchAlertTypes,
  fetchActiveAlerts,
  selectAlertTypes,
  selectAlerts,
  selectSelectedAlertType,
  setSelectedAlertType,
} from '../../redux/slice/dashboard/alertsSlice'
import { selectApplicationTheme } from '../../redux/slice/theme/themeSlice'
import { UseAuth, isSuperadminRole } from '../../customhooks/UseAuth'
import {
  fetchRenameWidgets,
  getWidgetList,
  fetchEmailConfigs,
  fetchDashboardChartOrder,
  fetchWidgetConfiguration,
  saveDashboardChartOrder,
  selectDashboardChartOrder,
  selectDashboardChartOrderStatus,
  selectWidgetConfigurationStatus,
  fetchCustomGraphs,
  selectCustomGraphs,
} from '../../redux/slice/settingsslice/heatmap/groupOccupancySlice'
import { ENABLE_CUSTOM_ENERGY_SPACE_GRAPHS } from '../../config/featureFlags'
import { useCustomGraphDashboardData } from '../../../../shared/dashboard/customGraphs/useCustomGraphDashboardData'
import { isCustomGraphVisible } from '../../../../shared/dashboard/customGraphs/customGraphVisibility'
import { CUSTOM_GRAPH_VARIANTS, CUSTOM_GRAPHS_UPDATED_EVENT } from '../../../../shared/dashboard/customGraphs/customGraphConstants'
import { buildCustomGraphWidgetKey } from '../../../../shared/dashboard/customGraphs/customGraphStorage'
import EnergyCustomGraphCard from '../../../customized/components/dashboard/EnergyCustomGraphCard'
import { BaseUrl } from '../../BaseUrl'
import {
  useDashboardWidgetVisibility,
} from '../../utils/dashboardWidgetVisibility'
import { ENERGY_CHART_ORDER_STORAGE_KEY } from '../../../../shared/dashboard/container/dashboardLayoutResolvers'
import BasicDashboardCardChrome from '../../components/dashboard/BasicDashboardCardChrome'
import SortableDashboardItem from '../../components/dashboard/SortableDashboardItem'
import BasicDashboardSortableProvider from '../../components/dashboard/BasicDashboardSortableProvider'
import { useBasicDashboardSortableSensors } from '../../hooks/useBasicDashboardSortableSensors'
import {
  isBasicEnergyForceFullWidth,
  resolveBasicDashboardSlotColumnSx,
} from '../../utils/basicDashboardLayout'
import { liftedFullOrderFromVisibleReorder } from '../../utils/draggableReflowOrder'
import { DEFAULT_APP_BACKGROUND, DEFAULT_APP_CONTENT, isLightSurface } from '../../utils/themeOnSurface'
import {
  formatDateForState,
  parseDateFromState,
} from '../../../../shared/dashboard/utils/dashboardDateState'
import { attachEnergyTabIndependentCompletion } from '../../../../shared/dashboard/utils/attachEnergyTabIndependentCompletion'
import { abortSingletonDashboardGets } from '../../../../shared/dashboard/utils/coalesceDashboardHttpGet'
import { useDashboardApiParams } from '../../../../shared/dashboard/hooks/useDashboardApiParams'
import {
  dispatchFetchAreaGroupsOnce,
  dispatchFetchAlertTypesOnce,
  dispatchFetchCustomGraphsOnce,
  dispatchFetchFloorsOnce,
  dispatchFetchProfileOnce,
  dispatchFetchWidgetConfigurationOnce,
  dispatchFetchWidgetTitlesOnce,
} from '../../../../shared/utils/bootstrapFetchGuards'
import { resolveAlertFilterTypes } from '../../../../shared/alerts/resolveAlertFilterTypes'
import { transformDataForCharts as sharedTransformDataForCharts } from '../../../../shared/dashboard/charts/transforms/transformDataForCharts'
import { consumptionSavingMergedData as sharedConsumptionSavingMergedData } from '../../../../shared/dashboard/charts/transforms/consumptionSavingMergedData'
import { formatEnergyXAxisLabel } from '../../../../shared/dashboard/charts/transforms/formatEnergyXAxisLabel'
import { useAreaTreeSelection } from '../../../../shared/dashboard/hooks/useAreaTreeSelection'
import {
  flattenAreaTree,
  getAllAreaIdsFromFloor,
  getAreasForFloor as getAreasForFloorFromTree,
  getAllChildAreaIds as getAllChildAreaIdsFromNode,
  getAllAreasFromGroup as resolveAreasFromGroup,
  checkIfChildrenSelected as checkIfChildrenSelectedHelper,
  checkIfAllChildrenSelected as checkIfAllChildrenSelectedHelper,
  getAreaSelectionText as resolveAreaSelectionText,
  buildClearAllResolution,
  buildSelectAllResolution,
  shouldSkipLoadAllAreas,
  processFloorPayloadForAreaLoad,
  collectFloorCheckboxAreaIds,
  resolveAreaToggleSelection,
  resolveGroupToggleSelection,
  resolveIntermediateParentToggle,
  resolveFloorDeselectAreas,
  resolveFloorSelectAreas,
} from '../../../../shared/dashboard/filters'
import SavingsByStrategyWidget from '../../../../shared/dashboard/widgets/SavingsByStrategyWidget'
import { resolvePieChartTheme } from '../../../../shared/dashboard/charts/themes/pieChartTheme'
import { resolveEnergyChartTheme } from '../../../../shared/dashboard/charts/themes/energyChartTheme'
import {
  DashboardWidgetRenderer,
  DashboardContainer,
  useDashboardContainer,
  useDashboardAreaTreeOrchestration,
  basicDashboardContainerAdapter,
  buildBasicEnergyWidgetRenderContext,
} from '../../../../shared/dashboard/container'
import {
  BASIC_LAYOUT_MODE,
  BASIC_ENERGY_SLOT_REGISTRY,
  getBasicEnergySlotMeta,
  resolveBasicRowSx,
} from '../../../../shared/dashboard/container/layout'
import {
  applyAlertTypeToggle,
  createStandardTransformDataForCharts,
  buildStandardTransformChartOptions,
} from '../../../../shared/dashboard/container/helpers'
import { bindDashboardChartLoader } from '../../../../shared/dashboard/components'
import {
  DashboardAreaTreeInlineStatus,
  DashboardErrorBanner,
  DashboardOperatorNoFloorsPanel,
} from '../../../../shared/dashboard/components/status'
import { resolveEnergyExportMenuPresetFromTheme } from '../../../../shared/dashboard/export/components'
import { BasicEnergyExportControl } from './basicEnergyExportControl'
import {
  DEFAULT_CONSUMPTION_EXPORT_KEYS,
  DEFAULT_SAVINGS_EXPORT_KEYS,
} from '../../../../shared/dashboard/container/hooks/exportMenuState'

const ChartLoader = bindDashboardChartLoader('basic')

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

/** Same base as `TopbarComponent` ribbonBg — overview sub-header blends ribbon → sky above hero image */
const DASHBOARD_RIBBON_BLUE = '#1E74C5'
/** Matches `TopbarComponent` ribbonMuted / inactive `navTextSx` links */
const DASHBOARD_RIBBON_TEXT_MUTED = 'rgba(255, 255, 255, 0.66)'
/** Matches `TopbarComponent` ribbonBright / active nav label */
const DASHBOARD_RIBBON_TEXT_BRIGHT = '#ffffff'
const dashboardOverviewFixedHeaderBg = `linear-gradient(180deg, ${DASHBOARD_RIBBON_BLUE} 0%, #3588cc 32%, #5ba6db 58%, #87c0ec 82%, #a8d8f5 100%)`
/** Ribbon toolbar is 64px; the 2px band below it was theme bg (reads as a white hairline). */
const DASHBOARD_RIBBON_TOOLBAR_PX = 64
/** Overview, Energy, Space Utilization: fixed sub-header abuts the 50px ribbon (avoids the hairline). */
const DASHBOARD_SUBHEADER_RIBBON_TOP = ['overview', 'energy', 'charts', 'alerts']
/** Compact Energy/Charts sub-header row below the 50px topbar (fixed ribbon height). */
const BASIC_ENERGY_COMPACT_SUBHEADER_PX = 48
/** Standalone duration filter (DashboardDurationFilterBar 80px + vertical padding). */
const BASIC_ENERGY_DURATION_FILTER_BAR_PX = 96

const AREA_SELECTION_RIBBON_MAX_CHARS = 20
const truncateAreaSelectionLabel = (s) => {
  if (s == null) return ''
  const str = String(s)
  return str.length <= AREA_SELECTION_RIBBON_MAX_CHARS
    ? str
    : str.slice(0, AREA_SELECTION_RIBBON_MAX_CHARS) + '\u2026'
}

const TOTAL_CONSUMPTION_BY_GROUP_EXPORT_KEY = 'total_consumption_by_group'
const ENERGY_DRAG_TRANSLATE_KEYS = [
  'dashboard-energy-line-consumption',
  'dashboard-energy-combined-consumption-saving',
  'dashboard-energy-line-savings',
  'dashboard-energy-donut-savings-strategy',
  'dashboard-energy-donut-consumption-by-group',
  'dashboard-energy-lpd',
  'dashboard-energy-peak-min',
]

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
    fontSize: isLargeScreen ? '16px' : '14px'
  }), [isLargeScreen])

  // User authentication
  const { user, role: dashboardUserRole } = UseAuth()
  /** Superadmin may long-press reorder; Admin/Operator see the same layout (shared localStorage / API order) without reordering */
  const energyReflowLocked = !isSuperadminRole(dashboardUserRole)
  const [energyFullscreenCardId, setEnergyFullscreenCardId] = useState(null)

  const toggleEnergyFullscreen = useCallback((slotId) => {
    setEnergyFullscreenCardId((prev) => (String(prev) === String(slotId) ? null : String(slotId)))
  }, [])

  useEffect(() => {
    if (!energyFullscreenCardId) return undefined
    const onKeyDown = (e) => {
      if (e?.key === 'Escape') setEnergyFullscreenCardId(null)
    }
    window.addEventListener('keydown', onKeyDown)
    const prevOverflow = document?.body?.style?.overflow
    if (document?.body?.style) document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      if (document?.body?.style) document.body.style.overflow = prevOverflow || ''
    }
  }, [energyFullscreenCardId])

  const alertTypesFromApi = useSelector(selectAlertTypes)
  const activeAlertsList = useSelector(selectAlerts)
  const alertTypes = useMemo(
    () =>
      resolveAlertFilterTypes({
        apiTypes: alertTypesFromApi,
        alerts: activeAlertsList,
      }),
    [alertTypesFromApi, activeAlertsList]
  )
  const selectedAlertType = useSelector(selectSelectedAlertType)
  const widgetList = useSelector(getWidgetList)
  const dashboardChartOrder = useSelector(selectDashboardChartOrder)
  const dashboardChartOrderStatus = useSelector(selectDashboardChartOrderStatus)
  const { isWidgetVisible, visibilityMap } = useDashboardWidgetVisibility()

  // Local state for multi-select dropdown
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedAlertTypes, setSelectedAlertTypes] = useState([])
  const [filterKey, setFilterKey] = useState(0) // Force re-render key
  const [reloadTrigger, setReloadTrigger] = useState(0) // Trigger for automatic reload on login
  const dropdownRef = useRef(null)
  const areaDropdownRef = useRef(null) // Add ref for area dropdown
  const areaTreeContainerRef = useRef(null) // Add ref for area tree container
  const previousApiParamsRef = useRef(null)

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



  const {
    floorsWithSelectedAreas,
    setFloorsWithSelectedAreas,
    localSelectedFloorIds,
    setLocalSelectedFloorIds,
    localSelectedAreas,
    setLocalSelectedAreas,
    localSelectedGroups,
    setLocalSelectedGroups,
    expandedFloorId,
    setExpandedFloorId,
  } = useAreaTreeSelection();

  const [showDurationDropdown, setShowDurationDropdown] = useState(false)
  const [showAreaDropdown, setShowAreaDropdown] = useState(false)
  const [expandedNodes, setExpandedNodes] = useState(new Set())

  const {
    areaTreeSelectionState,
    getAreasForFloor,
    getAllAreasFromGroup,
    getAllChildAreaIds,
    checkIfChildrenSelected,
    checkIfAllChildrenSelected,
    applyAreaTreeClearAll,
    applyAreaTreeSet,
    getAreaSelectionText,
  } = useDashboardAreaTreeOrchestration({
    variant: 'basic',
    dispatch,
    reduxActions: {
      clearDataCache,
      setSelectedAreas,
      setSelectedFloorIds,
      setSelectedGroups,
      setSelectedGroupIds,
      setSelectedFloor,
    },
    floors,
    areaTree,
    selectedFloorIds,
    selectedAreas,
    localSelectedFloorIds,
    setLocalSelectedFloorIds,
    localSelectedAreas,
    setLocalSelectedAreas,
    localSelectedGroups,
    setLocalSelectedGroups,
    setFloorsWithSelectedAreas,
    setExpandedFloorId,
    setExpandedNodes,
    previousApiParamsRef,
    setShowAreaDropdown,
  });

  // Fetch user profile on component mount (Topbar may already own this)
  useEffect(() => {
    dispatchFetchProfileOnce(dispatch, fetchProfile);
  }, [dispatch]);

  // Set default behavior to show data for all areas
  useEffect(() => {
    if (floors.length > 0 && localSelectedFloorIds.length === 0 && selectedAreas.length === 0) {
      // Don't select any floor by default - show data for all areas
      // This will trigger the API calls with no specific areas selected
      // Backend will return data for all accessible areas
    }
  }, [floors, localSelectedFloorIds.length, selectedAreas.length, dispatch]);


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
  const backgroundColor = appTheme?.application_theme?.background || DEFAULT_APP_BACKGROUND;
  const contentColor = appTheme?.application_theme?.content || DEFAULT_APP_CONTENT;
  const buttonColor = appTheme?.application_theme?.button || '#232323'
  /** Default / white content theme: Energy line charts use white plot + black axis (match Lumyn Background reference). */
  const energyLineChartSurface = isLightSurface(contentColor) ? 'light' : 'dark'
  /** Light theme: Lighting Power Density + Peak/Min cards — white outer shell, blue inner metric panels (app accent). */
  const energyMetricLight = energyLineChartSurface === 'light'
  const energyMetricOuterBg = energyMetricLight ? '#ffffff' : 'rgba(128, 120, 100, 0.6)'
  const energyMetricOuterBorder = energyMetricLight ? '1px solid #e8e8e8' : 'none'
  const energyMetricInnerBg = energyMetricLight ? '#1565C0' : '#232323'

  const savingsByStrategy = useSelector(selectSavingsByStrategy)
  const areaGroups = useSelector(selectAreaGroups)

  const customStartDate = useSelector((state) => state.dashboard.customStartDate) || '';
  const customEndDate = useSelector((state) => state.dashboard.customEndDate) || '';

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
  const location = useLocation()

  const getTabFromPath = useCallback((pathname) => {
    if (pathname === '/dashboard/alerts') return 'alerts'
    if (pathname === '/dashboard/energy') return 'energy'
    if (pathname === '/dashboard/spaceutilization' || pathname === '/dashboard/space-utilization') return 'charts'
    return 'overview'
  }, [])

  const getPathFromTab = useCallback((tab) => {
    if (tab === 'alerts') return '/dashboard/alerts'
    if (tab === 'energy') return '/dashboard/energy'
    if (tab === 'charts' || tab === 'space-utilization') return '/dashboard/spaceutilization'
    return '/dashboard/overview'
  }, [])

  const focusAlertFromLocation = location.state?.focusAlert || null

  // Local state
  const [activeTab, setActiveTab] = useState(() => getTabFromPath(location.pathname))
  const activeTabRef = useRef(activeTab)
  activeTabRef.current = activeTab
  const dashboardTabKeys = useMemo(
    () => ['overview', 'energy', 'charts', 'alerts'],
    []
  )
  const tabRefs = useRef({})

  // Keep dashboard tab synced with URL path for deep links and refresh.
  useEffect(() => {
    const tabFromPath = getTabFromPath(location.pathname)
    if (activeTab !== tabFromPath) {
      setActiveTab(tabFromPath)
    }
  }, [location.pathname, activeTab, getTabFromPath])

  // Overview has no chart APIs — never leave the global loader stuck from other tabs.
  useEffect(() => {
    if (activeTab !== 'overview') return
    dispatch(setGlobalLoading(false))
  }, [activeTab, dispatch])

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

  // Overview: lock page scroll so the full-bleed background and grid fit the window
  useEffect(() => {
    if (activeTab !== 'overview') return
    const html = document.documentElement
    const body = document.body
    const prevHtml = html.style.overflow
    const prevBody = body.style.overflow
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    return () => {
      html.style.overflow = prevHtml
      body.style.overflow = prevBody
    }
  }, [activeTab])

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

  useEffect(() => {
    if (!focusAlertFromLocation) return

    // Always show the alerts list for floorplan-driven alert navigation.
    if (activeTab !== 'alerts') {
      setActiveTab('alerts')
    }
    setSelectedAlertTypes([])
    setFilterKey(prev => prev + 1)
  }, [focusAlertFromLocation, activeTab])

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

  const [lightingUnit, setLightingUnit] = useState('Watt / Sq ft') // Add this for lighting power density unit
  const [allAreasLoaded, setAllAreasLoaded] = useState(false) // Track if all areas have been loaded
  const isInitialLoad = useRef(true) // Track if this is the initial load

  // Unified loading state - show single loader during navigation
  const [isDataLoading, setIsDataLoading] = useState(false)

  // Track when we're switching tabs to clear old data - removed to prevent flickering

  // Force refresh state for Set button - removed to prevent flickering

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

  const orchestration = useDashboardContainer(basicDashboardContainerAdapter, {
    dispatch,
    visibilityMap,
    isWidgetVisible,
    energyReflowLocked,
    saveDashboardChartOrder,
    dashboardChartOrder,
    dashboardChartOrderStatus,
    widgetList,
    energyDragTranslateKeys: ENERGY_DRAG_TRANSLATE_KEYS,
    energyConsumption,
    energySavings,
    energyConsumptionLoading,
    energySavingsLoading,
    savingsByStrategy,
    globalLoading,
    selectedDuration,
    customStartDate,
    customEndDate,
    backgroundColor,
    dateActions: {
      setCustomDateRange,
      setCurrentDate,
      setCurrentYear,
      setIsNavigating,
    },
    customDateRange,
    isNavigating,
    currentDate,
    currentYear,
    setIsDataLoading,
    setSelectedMonthForData,
    showSnackbar,
    userProfile,
    fetchEmailConfigs,
    selectedAreas,
    selectedFloorIds,
    exportThunks: {
      sendEnergyConsumptionEmail,
      downloadEnergyConsumption,
      sendEnergySavingsEmail,
      downloadEnergySavings,
      sendPeakMinConsumptionEmail,
      downloadPeakMinConsumption,
      sendTotalConsumptionByGroupEmail,
      downloadTotalConsumptionByGroup,
      sendOccupancyCountEmail,
      downloadOccupancyCount,
      sendOccupancyByGroupEmail,
      downloadOccupancyByGroup,
      sendSpaceUtilizationPerEmail,
      downloadSpaceUtilizationPer,
    },
  })

  const {
    visibility: {
      energyVisibleSlotOrder,
      showEnergyStandaloneDurationFilter,
      energyDashboardRows,
      setEnergyChartOrder,
      getEnergySlotSpan,
      setEnergyCardSpan,
      writeEnergyCardSpan,
    },
    widgets: {
      chartLoading,
      setChartLoading,
      allEnergyChartsReady,
      setAllEnergyChartsReady,
      energyWidgetTitles,
      getWidgetTitle,
      memoizedEnergyConsumption,
      memoizedEnergySavings,
      consumptionColors,
      savingsColors,
      consumptionIsLoading,
      savingsIsLoading,
      embeddedSavingsByStrategyLoading,
      startEnergyTabLoading,
      completeEnergyWidgetLoading,
      planEnergyTabApiCalls,
    },
    dates: {
      dateParams,
      getCurrentDateParameters,
      calculateDateParameters,
      calculateCurrentDateParameters,
      energyCustomNeedsDates,
      handlePrevious,
      handleNext,
      getCurrentPeriodText,
    },
    exports: {
      exportDropdownRefs,
      showExportDropdown,
      setShowExportDropdown,
      exportLoading,
      handleExport,
      handleConsumptionEmail,
      handleConsumptionDownload,
      handleSavingsEmail,
      handleSavingsDownload,
      handleConsumptionByGroupEmail,
      handleConsumptionByGroupDownload,
    },
  } = orchestration

  const toggleEnergyCardSpan = useCallback(
    (slotId) => {
      setEnergyCardSpan((prev) => {
        const next = prev && typeof prev === 'object' && !Array.isArray(prev) ? { ...prev } : {};
        const cur = next?.[slotId];
        const curSpan = cur === 12 || cur === '12' ? 12 : 6;
        next[slotId] = curSpan === 12 ? 6 : 12;
        writeEnergyCardSpan(next);
        return next;
      });
    },
    [setEnergyCardSpan, writeEnergyCardSpan]
  )

  const onReorderEnergySlots = useCallback((nextVisible) => {
    if (energyReflowLocked) return
    setEnergyChartOrder((prev) => {
      const merged = liftedFullOrderFromVisibleReorder(prev, nextVisible)
      try {
        localStorage.setItem(ENERGY_CHART_ORDER_STORAGE_KEY, JSON.stringify(merged))
      } catch {
        /* ignore */
      }
      dispatch(saveDashboardChartOrder({ energy_slot_order: merged }))
      return merged
    })
  }, [energyReflowLocked, dispatch, setEnergyChartOrder])

  const {
    consumption: consumptionTitle,
    savings: savingsTitle,
    savingsByStrategy: savingsByStrategyTitle,
    totalConsumptionByGroup: totalConsumptionByGroupTitle,
  } = energyWidgetTitles

  // Email dialog handlers - removed as emails are now sent directly to logged-in user

  // Fetch alert options/data when Alerts tab is active (force so Settings toggles apply)
  useEffect(() => {
    if (activeTab === 'alerts') {
      dispatchFetchAlertTypesOnce(dispatch, fetchAlertTypes, { force: true })
      // Note: fetchActiveAlerts is handled by the Alerts component itself
    }
  }, [activeTab, dispatch])

  // Fetch rename widgets when Dashboard mounts (only if not already loaded)
  useEffect(() => {
    if (!widgetList || (Array.isArray(widgetList) && widgetList.length === 0) || (widgetList && !widgetList.titles)) {
      dispatchFetchWidgetTitlesOnce(dispatch, fetchRenameWidgets)
    }
  }, [dispatch, widgetList])

  useEffect(() => {
    dispatch(fetchDashboardChartOrder())
  }, [dispatch])

  const widgetConfigurationStatus = useSelector(selectWidgetConfigurationStatus)
  useEffect(() => {
    if (widgetConfigurationStatus === 'idle') {
      dispatchFetchWidgetConfigurationOnce(dispatch, fetchWidgetConfiguration)
    }
  }, [dispatch, widgetConfigurationStatus])

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

      // Handle alerts dropdown closing on click outside
      if (showDropdown) {
        // Check both refs since alerts dropdown can be in breadcrumb (areaDropdownRef) or separate (dropdownRef)
        const isClickInsideAlerts =
          (areaDropdownRef.current && areaDropdownRef.current.contains(event.target)) ||
          (dropdownRef.current && dropdownRef.current.contains(event.target));

        if (!isClickInsideAlerts) {
          setShowDropdown(false);
        }
      }
    }
    // Use passive listener to prevent flickering
    document.addEventListener('click', handleClickOutside, { passive: true })
    return () => document.removeEventListener('click', handleClickOutside)
  }, [expandedFloorId, showAreaDropdown, showDropdown])

  const handleTypeToggle = (type) => {
    applyAlertTypeToggle({
      type,
      setSelectedAlertTypes,
      setFilterKey,
      setShowDropdown,
    });
  }
  // Fetch floors on component mount
  // Note: The backend automatically filters floors based on user permissions
  // Operators will only receive floors they have access to
  useEffect(() => {
    dispatchFetchFloorsOnce(dispatch, fetchFloors, Boolean(floors?.length))
  }, [dispatch, floors?.length])

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
    if (isSuperadminRole(currentUserRole) || currentUserRole === 'Admin') {
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
  const loadAllAreasInFlightRef = useRef(false);

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
    } else if (availableFloors.length > 0 && selectedAreas.length > 0) {
      // If areas are already selected, mark as loaded to prevent re-running
      setAllAreasLoaded(true)
    } else if (availableFloors.length === 0 && !allAreasLoaded) {
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
      if (loadAllAreasInFlightRef.current) {
        return;
      }
      if (
        shouldSkipLoadAllAreas({
          allAreasLoaded,
          selectedAreasLength: selectedAreas.length,
          variant: 'basic',
        })
      ) {
        if (selectedAreas.length > 0 && !allAreasLoaded) {
          setAllAreasLoaded(true);
        }
        return;
      }

      loadAllAreasInFlightRef.current = true;
      let allAreaIds = [];

      for (const floor of getAvailableFloors()) {
        const result = await dispatch(getLeafByFloorID(floor.id));

        if (result.payload && (result.payload.tree || result.payload.areas)) {
          const processed = processFloorPayloadForAreaLoad({
            payload: result.payload,
            floorId: floor.id,
            variant: 'basic',
            existingAreaIds: allAreaIds,
          });
          allAreaIds = processed.areaIds;
        }
      }

      setAllAreasLoaded(true);
    } catch (error) {
      // Error loading all areas
    } finally {
      loadAllAreasInFlightRef.current = false;
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
        const deselectResolution = resolveFloorDeselectAreas({
          floorId: floor.id,
          localSelectedFloorIds,
          localSelectedAreas,
          getAreasForFloor,
        });
        setLocalSelectedFloorIds(deselectResolution.localSelectedFloorIds);
        setFloorsWithSelectedAreas(new Set(deselectResolution.floorsWithSelectedAreas));
        setLocalSelectedAreas(deselectResolution.localSelectedAreas);
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
            const floorAreaIds = collectFloorCheckboxAreaIds(result.payload);
            if (floorAreaIds.length > 0) {
              setLocalSelectedAreas(
                resolveFloorSelectAreas({
                  localSelectedAreas,
                  floorAreaIds,
                })
              );
            } else {
              const fallbackAreaIds = getAreasForFloor(floorId);
              if (fallbackAreaIds.length > 0) {
                setLocalSelectedAreas(
                  resolveFloorSelectAreas({
                    localSelectedAreas,
                    floorAreaIds: fallbackAreaIds,
                  })
                );
              }
            }
          } else {
            // Fallback: get areas from current area tree
            const fallbackAreaIds = getAreasForFloor(floorId);
            if (fallbackAreaIds.length > 0) {
              setLocalSelectedAreas(
                resolveFloorSelectAreas({
                  localSelectedAreas,
                  floorAreaIds: fallbackAreaIds,
                })
              );
            }
          }
        } catch (error) {
          const floorAreaIds = getAreasForFloor(floorId);
          if (floorAreaIds.length > 0) {
            setLocalSelectedAreas(
              resolveFloorSelectAreas({
                localSelectedAreas,
                floorAreaIds,
              })
            );
          }
        }
      }
    }
  }


  // Auto-expand area tree when it's loaded
  useEffect(() => {
    if (areaTree && (areaTree.tree || areaTree.areas) && selectedFloor) {
      // Area tree loaded for floor
    }
  }, [areaTree, selectedFloor])

  // Fetch area groups on component mount
  useEffect(() => {
    if (!areaGroups) {
      dispatchFetchAreaGroupsOnce(dispatch, fetchAreaGroups);
    }
  }, [dispatch, areaGroups])

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
          minWidth: 0,
          maxWidth: '100%'
        }}>
          {/* Universal checkbox for all node types */}
          <input
            type="checkbox"
            checked={Boolean(isSelected)}
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
              minWidth: 0,
              flex: 1,
              maxWidth: '100%',
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
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    const toggleResolution = resolveAreaToggleSelection({
      areaId,
      node,
      localSelectedAreas,
      getChildAreaIds: getAllChildAreaIds,
    });

    setLocalSelectedAreas(toggleResolution.localSelectedAreas);

    if (toggleResolution.clearFloorSelection) {
      setLocalSelectedFloorIds([]);
      setFloorsWithSelectedAreas(new Set());
    }
  };

  // Handle group checkbox change for group selection
  const handleGroupCheckboxChange = (groupId, groupName, node) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    const toggleResolution = resolveGroupToggleSelection({
      groupId,
      localSelectedGroups,
      localSelectedAreas,
      getAllAreasFromGroup,
    });

    setLocalSelectedGroups(toggleResolution.localSelectedGroups);
    setLocalSelectedAreas(toggleResolution.localSelectedAreas);

    if (toggleResolution.clearFloorSelection) {
      setLocalSelectedFloorIds([]);
      setFloorsWithSelectedAreas(new Set());
    }
  };

  // Handle intermediate parent checkbox change - select all descendant leaf nodes
  const handleIntermediateParentCheckboxChange = (node, event) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    const toggleResolution = resolveIntermediateParentToggle({
      node,
      localSelectedAreas,
      getChildAreaIds: getAllChildAreaIds,
    });

    setLocalSelectedAreas(toggleResolution.localSelectedAreas);

    if (toggleResolution.clearFloorSelection) {
      setLocalSelectedFloorIds([]);
      setFloorsWithSelectedAreas(new Set());
    }
  };

  const handleDurationChange = (e) => {
    const newDuration = e.target.value;

    // Only set loading if duration actually changed
    if (newDuration !== selectedDuration) {
      // Custom Period: don't enter a loading state until both dates are selected.
      // Otherwise the Energy tab can get stuck showing a spinner and the date inputs
      // become hard to use (matches Space Utilization behavior).
      if (newDuration === 'custom') {
        const today = new Date();

        setGlobalLoading(false);
        setIsDataLoading(false);
        setAllEnergyChartsReady(true);
        setChartLoading({
          energyConsumption: false,
          energySavings: false,
          peakMinConsumption: false,
          totalConsumptionByGroup: false,
          lightPowerDensity: false,
          occupancyCount: false,
          occupancyByGroup: false,
          spaceUtilizationPerArea: false,
          // peakMinOccupancy: false, // Commented out - not using peak min max API for space utilization
          savingsByStrategy: false
        });

        dispatch((dispatch) => {
          dispatch(setCurrentDate(formatDateForState(today)));
          dispatch(setCurrentYear(today.getFullYear()));
          dispatch(setCustomDateRange({ startDate: '', endDate: '' }));
          // Clear the non-throttled custom dates immediately so Custom Period never renders old graph data.
          dispatch(setCustomDateRangeImmediate({ startDate: '', endDate: '' }));
          dispatch(setIsNavigating(false));
          dispatch(setSelectedDuration(newDuration));
        });

        setShowDurationDropdown(false);
        return;
      }

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

  const { apiParams, apiParamsString } = useDashboardApiParams({
    selectedDuration,
    customDateRange,
    customStartDate,
    customEndDate,
    selectedAreas,
    selectedFloorIds,
    allAreasLoaded,
    dateParams,
    isNavigating,
  });

  const customGraphs = useSelector(selectCustomGraphs);

  useEffect(() => {
    if (!ENABLE_CUSTOM_ENERGY_SPACE_GRAPHS || activeTab !== 'energy') return undefined;
    dispatchFetchCustomGraphsOnce(dispatch, fetchCustomGraphs);
    const onUpdate = () => dispatchFetchCustomGraphsOnce(dispatch, fetchCustomGraphs, { force: true });
    window.addEventListener(CUSTOM_GRAPHS_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(CUSTOM_GRAPHS_UPDATED_EVENT, onUpdate);
  }, [activeTab, dispatch]);

  const energyCustomGraphs = useMemo(
    () =>
      ENABLE_CUSTOM_ENERGY_SPACE_GRAPHS && activeTab === 'energy'
        ? (Array.isArray(customGraphs) ? customGraphs : []).filter(
            (g) =>
              String(g?.page || '').toLowerCase() === 'energy' &&
              isCustomGraphVisible(CUSTOM_GRAPH_VARIANTS.basic, 'energy', g?.id, true)
          )
        : [],
    [customGraphs, activeTab]
  );

  const { customGraphData, customGraphLoading, customGraphError } = useCustomGraphDashboardData({
    customGraphs: energyCustomGraphs,
    apiParams: activeTab === 'energy' ? apiParams : null,
    apiParamsKey: activeTab === 'energy' ? apiParamsString : '',
    dispatch,
    store,
    baseUrlClient: BaseUrl,
    dispatchThunks: false,
  });

  /* Phase 6.1A — date/api param logic in shared/dashboard/hooks */

  // Add request cancellation to prevent race conditions
  const abortControllerRef = useRef(null);
  const debounceTimeoutRef = useRef(null);
  const isApiCallInProgressRef = useRef(false);
  const apiCallTimeoutRef = useRef(null);

  // Leaving Dashboard (e.g. Activity Report): clear loader + scroll lock so the next route can render.
  useEffect(() => {
    return () => {
      dispatch(setGlobalLoading(false));
      isApiCallInProgressRef.current = false;
      if (abortControllerRef.current) {
        try {
          abortControllerRef.current.abort();
        } catch {
          /* ignore */
        }
        abortControllerRef.current = null;
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
      if (apiCallTimeoutRef.current) {
        clearTimeout(apiCallTimeoutRef.current);
        apiCallTimeoutRef.current = null;
      }
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [dispatch]);

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

  useEffect(() => {
    if (activeTab !== 'energy') {
      unifiedApiParamsRef.current = null;
    }
  }, [activeTab]);

  // Refs for batching loading state updates to prevent line chart re-renders
  const pendingLoadingUpdatesRef = useRef(new Set());
  const updateScheduledRef = useRef(false);

  // Create stable string representation of apiParams to prevent unnecessary re-runs
  // This memoization ensures the string only changes when actual values change

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

    // Update refs to track current state
    lastApiParamsStringRef.current = apiParamsString;
    lastActiveTabRef.current = activeTab;

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

        // Call APIs for active tab only - WAIT FOR ALL CHARTS BEFORE SHOWING
        if (activeTab === 'energy') {
          const {
            shouldCallUnified,
            nextUnifiedApiParamsRef,
            totalApis,
          } = planEnergyTabApiCalls(apiParamsString, unifiedApiParamsRef.current);

          if (shouldCallUnified) {
            unifiedApiParamsRef.current = nextUnifiedApiParamsRef;
          }

          abortSingletonDashboardGets();

          const apiCalls = [];

          if (shouldCallUnified) {
            apiCalls.push({
              name: 'unifiedEnergyData',
              promise: dispatch(fetchUnifiedEnergyConsumptionSavingsData({ ...apiParams, forceRefresh: true })),
            });
          }

          apiCalls.push(
            {
              name: 'totalConsumptionByGroup',
              promise: dispatch(fetchTotalConsumptionByGroup(apiParams)),
            },
            { name: 'lightPowerDensity', promise: dispatch(fetchLightPowerDensity(apiParams)) },
            { name: 'savingsByStrategy', promise: dispatch(fetchSavingsByStrategy(apiParams)) }
          );

          startEnergyTabLoading(shouldCallUnified);
          dispatch(setGlobalLoading(false));

          attachEnergyTabIndependentCompletion({
            apiCalls,
            completeEnergyWidgetLoading,
            onAllSettled: () => {
              dispatch(setGlobalLoading(false));
              isApiCallInProgressRef.current = false;
            },
          });
        } else if (activeTab === 'alerts') {
          dispatch(setGlobalLoading(false));
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
            });
        } else {
          dispatch(setGlobalLoading(false));
        }
      } catch (error) {
        dispatch(setGlobalLoading(false));
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

    activeTabRef.current = tab;
    setActiveTab(tab);

    const nextPath = getPathFromTab(tab);
    if (location.pathname !== nextPath) {
      navigate(nextPath);
    }

    // Show global loader immediately when tab changes
    setGlobalLoading(true);

    // Tab switching state removed to prevent flickering

    // Reset API call progress flag to allow new API calls for the new tab
    isApiCallInProgressRef.current = false;

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

  const handleTabChangeRef = useRef(handleTabChange);
  handleTabChangeRef.current = handleTabChange;

  useEffect(() => {
    return registerPageSubNavHandler('dashboard', ({ tabKey = 'energy' } = {}) => {
      const key = dashboardTabKeys.includes(tabKey) ? tabKey : 'energy';
      handleTabChangeRef.current(key);
      requestAnimationFrame(() => {
        tabRefs.current[key]?.focus({ preventScroll: true });
      });
    });
  }, [dashboardTabKeys]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (activeTabRef.current === 'overview') return;
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' && event.key !== 'ArrowUp') return;
      if (isKeyboardNavBlockedTarget(event.target)) return;
      if (event.target?.closest?.('.topbar-main-nav')) return;
      if (event.target?.closest?.('.nav-tab-btn')) return;

      event.preventDefault();
      event.stopPropagation();

      if (event.key === 'ArrowUp') {
        requestTopbarNavFocus('Home');
        return;
      }

      handleRovingTablistKeyDown(
        { ...event, currentTarget: tabRefs.current[activeTabRef.current] },
        {
          itemKeys: dashboardTabKeys,
          activeKey: activeTabRef.current,
          keyRefs: tabRefs,
          orientation: 'horizontal',
          onActivate: (tab) => handleTabChangeRef.current(tab),
        }
      );
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [dashboardTabKeys]);

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







  const availableAreas = flattenAreaTree(areaTree)
  const isLoading = floorStatus === 'loading'
  const hasError = dashboardError || (floorStatus === 'failed')

    const transformDataForCharts = useCallback(
    createStandardTransformDataForCharts(
      sharedTransformDataForCharts,
      buildStandardTransformChartOptions({ selectedDuration, selectedAreas, areaTree })
    ),
    [selectedDuration, selectedAreas, areaTree]
  );

  const combinedConsumptionSavingUnit = useMemo(
    () => energyConsumption?.unit || energySavings?.unit || '',
    [energyConsumption, energySavings]
  )

  const consumptionSavingMergedData = useMemo(() => {
    const consumptionSeries = energyConsumption ? transformDataForCharts(energyConsumption, 'consumption') : []
    const savingsSeries = energySavings ? transformDataForCharts(energySavings, 'other') : []
    return sharedConsumptionSavingMergedData(consumptionSeries, savingsSeries)
  }, [energyConsumption, energySavings, transformDataForCharts])

  const extraBasicEnergyGraphCards = useMemo(
    () =>
      energyCustomGraphs.map((g, idx) => {
        const id = String(g?.id ?? '');
        return (
          <Box
            key={buildCustomGraphWidgetKey(id || `idx_${idx}`)}
            sx={{ width: '100%', mb: 2 }}
          >
            <EnergyCustomGraphCard
              g={g}
              shellVariant="basic"
              chartSurface={energyLineChartSurface}
              chartHeaderStyle={chartHeaderStyle}
              customGraphData={customGraphData}
              customGraphLoading={customGraphLoading}
              customGraphError={customGraphError}
              transformDataForCharts={transformDataForCharts}
              areaGroups={areaGroups}
              dashboardApiParams={apiParams}
            />
          </Box>
        );
      }),
    [
      energyCustomGraphs,
      energyLineChartSurface,
      chartHeaderStyle,
      customGraphData,
      customGraphLoading,
      customGraphError,
      transformDataForCharts,
      areaGroups,
      apiParams,
    ]
  );

  /** Energy tab only (slots under `renderEnergyDraggableSlot`): uniform card footprint per chart. */
  const ENERGY_CHART_SLOT_HEIGHT_PX = 300
  /** Matches Basic `ConsumptionSavingsCombinedChart` inner plot box height. */
  const ENERGY_LIGHT_PLOT_AREA_HEIGHT_PX = 220
  /** Total card height for white-theme standalone slots — combined Energy chrome + same plot as Basic combined chart. */
  const ENERGY_LIGHT_FULL_CARD_HEIGHT_PX = ENERGY_LIGHT_PLOT_AREA_HEIGHT_PX + 180
  const energyChartSlotOuterStyle = {
    width: '100%',
    minHeight: ENERGY_CHART_SLOT_HEIGHT_PX,
    height: ENERGY_CHART_SLOT_HEIGHT_PX,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'rgba(128, 120, 100, 0.6)',
    borderRadius: '8px',
    padding: '14px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: 0,
    border: '1px solid #ccc',
  }
  const energyChartHeaderRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    flexShrink: 0,
  }
  const energyChartPlotFlexStyle = {
    flex: 1,
    minHeight: 0,
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: '#767061',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    MozUserSelect: 'none',
    msUserSelect: 'none',
  }

  // Isolated wrapper removed — consumption/savings use UnifiedEnergyWidget

  const renderEnergyLineChartEmptyExtras = () => (
            <div style={{ width: '100%', maxWidth: 330, margin: '0 auto 10px auto' }}>
              <div style={{ position: 'relative', width: '100%', marginBottom: '8px' }}>
                <select
                  value={selectedDuration || ''}
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
                    backgroundImage:
                      'url("data:image/svg+xml;charset=US-ASCII,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 4 5\'><path fill=\'%231565C0\' d=\'M2 0L0 2h4zm0 5L0 3h4z\'/></svg>")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 8px center',
                    backgroundSize: '10px',
                    paddingRight: '28px',
                    minHeight: '32px',
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
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: isLargeScreen ? '6px' : isMediumScreen ? '4px' : '2px',
                      width: '100%',
                      justifyContent: 'center',
                      flexWrap: 'nowrap',
                      minWidth: 0,
                    }}
                  >
                    <div style={{ position: 'relative', minWidth: 0, flex: '1 1 auto', maxWidth: '45%' }}>
                      {!((customDateRange.startDate || '').split('T')[0]) && (
                        <span
                          style={{
                            position: 'absolute',
                            left: isLargeScreen ? 8 : 6,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#333',
                            fontSize: isLargeScreen ? '12px' : '11px',
                            fontWeight: 700,
                            fontFamily: 'inherit',
                            pointerEvents: 'none',
                            userSelect: 'none',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          DD-MM-YYYY
                        </span>
                      )}
                      <input
                        type="date"
                        value={(customDateRange.startDate || '').split('T')[0]}
                        onChange={(e) =>
                          dispatch(
                            setCustomDateRangeImmediate({
                              startDate: e.target.value,
                              endDate: (customDateRange.endDate || '').split('T')[0],
                            })
                          )
                        }
                        style={{
                          padding: isLargeScreen ? '6px' : isMediumScreen ? '4px' : '3px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          backgroundColor: 'white',
                          fontSize: isLargeScreen ? '12px' : '11px',
                          fontWeight: 600,
                          fontFamily: 'inherit',
                          minWidth: 0,
                          width: '100%',
                          boxSizing: 'border-box',
                          color: ((customDateRange.startDate || '').split('T')[0]) ? undefined : 'transparent',
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontWeight: 600,
                        color: '#333',
                        fontSize: isLargeScreen ? '12px' : isMediumScreen ? '11px' : '10px',
                        flexShrink: 0,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      to
                    </span>
                    <div style={{ position: 'relative', minWidth: 0, flex: '1 1 auto', maxWidth: '45%' }}>
                      {!((customDateRange.endDate || '').split('T')[0]) && (
                        <span
                          style={{
                            position: 'absolute',
                            left: isLargeScreen ? 8 : 6,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#333',
                            fontSize: isLargeScreen ? '12px' : '11px',
                            fontWeight: 700,
                            fontFamily: 'inherit',
                            pointerEvents: 'none',
                            userSelect: 'none',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          DD-MM-YYYY
                        </span>
                      )}
                      <input
                        type="date"
                        value={(customDateRange.endDate || '').split('T')[0]}
                        onChange={(e) =>
                          dispatch(
                            setCustomDateRangeImmediate({
                              startDate: (customDateRange.startDate || '').split('T')[0],
                              endDate: e.target.value,
                            })
                          )
                        }
                        style={{
                          padding: isLargeScreen ? '6px' : isMediumScreen ? '4px' : '3px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          backgroundColor: 'white',
                          fontSize: isLargeScreen ? '12px' : '11px',
                          fontWeight: 600,
                          fontFamily: 'inherit',
                          minWidth: 0,
                          width: '100%',
                          boxSizing: 'border-box',
                          color: ((customDateRange.endDate || '').split('T')[0]) ? undefined : 'transparent',
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={
                        globalLoading
                          ? undefined
                          : (e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handlePrevious()
                          }
                      }
                      disabled={globalLoading}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: globalLoading ? '#ccc' : '#1565C0',
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
                        transition: 'all 0.2s ease',
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
                      onClick={
                        globalLoading
                          ? undefined
                          : (e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleNext()
                          }
                      }
                      disabled={globalLoading}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: globalLoading ? '#ccc' : '#1565C0',
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
                        transition: 'all 0.2s ease',
                      }}
                      title="Next"
                    >
                      Next ›
                    </button>
                  </>
                )}
              </div>
            </div>
  );

  const renderEnergyLineBlankPreview = (ec) => (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={Array.from({ length: 24 }, (_, i) => ({ date: `${String(i).padStart(2, '0')}:00` }))}
                  margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                >
                  <CartesianGrid stroke={ec.grid} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    stroke={ec.axis}
                    fontSize={10}
                    tick={{ fill: ec.tick, fontWeight: 600, fontSize: 10 }}
                    axisLine={{ stroke: ec.axis }}
                    tickLine={{ stroke: ec.axis }}
                    interval={3}
                    angle={-45}
                    textAnchor="end"
                    height={44}
                    type="category"
                  />
                  <YAxis
                    stroke={ec.axis}
                    fontSize={10}
                    tick={{ fill: ec.tick, fontWeight: 600, fontSize: 10 }}
                    axisLine={{ stroke: ec.axis }}
                    tickLine={{ stroke: ec.axis }}
                    width={50}
                    tickCount={6}
                  />
                </LineChart>
              </ResponsiveContainer>
  );

  // Add the missing getNavigationButtonText function
  const getNavigationButtonText = (direction) => {
    return direction === 'previous' ? 'Previous' : 'Next';
  };

  const consumptionExportControl = useMemo(() => {
    const ec = resolveEnergyChartTheme({ chartSurface: energyLineChartSurface });
    const exportMenuKey = DEFAULT_CONSUMPTION_EXPORT_KEYS.menuCloseKey;
    return (
      <BasicEnergyExportControl
        exportMenuKey={exportMenuKey}
        loadingPrefix={DEFAULT_CONSUMPTION_EXPORT_KEYS.loadingPrefix}
        showExportDropdown={showExportDropdown}
        setShowExportDropdown={setShowExportDropdown}
        exportLoading={exportLoading}
        exportDropdownRefs={exportDropdownRefs}
        onEmail={handleConsumptionEmail}
        onDownload={handleConsumptionDownload}
        preset={resolveEnergyExportMenuPresetFromTheme(ec, { useEmoji: true })}
        exportBtnColor={ec.exportBtn}
        isLargeScreen={isLargeScreen}
      />
    );
  }, [energyLineChartSurface, showExportDropdown, exportLoading, setShowExportDropdown, handleConsumptionEmail, handleConsumptionDownload, isLargeScreen]);

  const savingsExportControl = useMemo(() => {
    const ec = resolveEnergyChartTheme({ chartSurface: energyLineChartSurface });
    const exportMenuKey = DEFAULT_SAVINGS_EXPORT_KEYS.menuCloseKey;
    return (
      <BasicEnergyExportControl
        exportMenuKey={exportMenuKey}
        loadingPrefix={DEFAULT_SAVINGS_EXPORT_KEYS.loadingPrefix}
        showExportDropdown={showExportDropdown}
        setShowExportDropdown={setShowExportDropdown}
        exportLoading={exportLoading}
        exportDropdownRefs={exportDropdownRefs}
        onEmail={handleSavingsEmail}
        onDownload={handleSavingsDownload}
        preset={resolveEnergyExportMenuPresetFromTheme(ec, { useEmoji: true })}
        exportBtnColor={ec.exportBtn}
        isLargeScreen={isLargeScreen}
      />
    );
  }, [energyLineChartSurface, showExportDropdown, exportLoading, setShowExportDropdown, handleSavingsEmail, handleSavingsDownload, isLargeScreen]);

  const consumptionBlankPreview = useMemo(() => {
    if (!energyCustomNeedsDates) return null;
    const ec = resolveEnergyChartTheme({ chartSurface: energyLineChartSurface });
    return renderEnergyLineBlankPreview(ec);
  }, [energyCustomNeedsDates, energyLineChartSurface]);

  const totalConsumptionByGroupExportControl = useMemo(() => {
    const dc = resolvePieChartTheme({ chartSurface: energyLineChartSurface });
    const exportMenuKey = TOTAL_CONSUMPTION_BY_GROUP_EXPORT_KEY;

    return (
      <BasicEnergyExportControl
        exportMenuKey={exportMenuKey}
        loadingPrefix={exportMenuKey}
        showExportDropdown={showExportDropdown}
        setShowExportDropdown={setShowExportDropdown}
        exportLoading={exportLoading}
        exportDropdownRefs={exportDropdownRefs}
        onEmail={handleConsumptionByGroupEmail}
        onDownload={handleConsumptionByGroupDownload}
        preset={resolveEnergyExportMenuPresetFromTheme(dc, { useEmoji: true })}
        exportBtnColor={dc.exportBtn}
        isLargeScreen={isLargeScreen}
      />
    );
  }, [energyLineChartSurface, showExportDropdown, exportLoading, setShowExportDropdown, handleConsumptionByGroupEmail, handleConsumptionByGroupDownload, isLargeScreen]);

  const energyWidgetRenderContext = useMemo(
    () =>
      buildBasicEnergyWidgetRenderContext(orchestration, {
        widgetList,
        energyConsumption,
        energySavings,
        peakMinConsumption,
        energyConsumptionLoading,
        energySavingsLoading,
        peakMinConsumptionLoading,
        savingsByStrategy,
        totalConsumptionByGroup,
        lightPowerDensity,
        lightingUnit,
        globalLoading,
        selectedDuration,
        currentDate,
        currentYear,
        selectedAreas,
        areaGroups,
        isLargeScreen,
        chartHeaderStyle,
        ChartLoader,
        transformDataForCharts,
        energyLineChartSurface,
        energyMetricLight,
        consumptionExportControl,
        savingsExportControl,
        totalConsumptionByGroupExportControl,
        consumptionBlankPreview,
        showEnergyStandaloneDurationFilter,
        renderEnergyLineChartEmptyExtras,
        ENERGY_LIGHT_FULL_CARD_HEIGHT_PX,
      }),
    [
      orchestration,
      widgetList,
      energyConsumption,
      energySavings,
      peakMinConsumption,
      energyConsumptionLoading,
      energySavingsLoading,
      peakMinConsumptionLoading,
      savingsByStrategy,
      totalConsumptionByGroup,
      lightPowerDensity,
      lightingUnit,
      globalLoading,
      selectedDuration,
      currentDate,
      currentYear,
      selectedAreas,
      areaGroups,
      isLargeScreen,
      chartHeaderStyle,
      transformDataForCharts,
      energyLineChartSurface,
      energyMetricLight,
      consumptionExportControl,
      savingsExportControl,
      totalConsumptionByGroupExportControl,
      consumptionBlankPreview,
      showEnergyStandaloneDurationFilter,
      ENERGY_LIGHT_FULL_CARD_HEIGHT_PX,
    ]
  );

  const basicEnergyLayoutAdapter = useMemo(
    () => ({
      SLOT_REGISTRY: BASIC_ENERGY_SLOT_REGISTRY,
      resolveRowSx: resolveBasicRowSx,
      resolveSlotColumnSx: (slotId, pair, theme) =>
        resolveBasicDashboardSlotColumnSx(
          slotId,
          pair,
          theme,
          getEnergySlotSpan,
          isBasicEnergyForceFullWidth
        ),
      getSlotMeta: getBasicEnergySlotMeta,
    }),
    [getEnergySlotSpan]
  );

  const energyDurationFilterElement = (
    <DashboardDurationFilterBar
      selectedDuration={selectedDuration}
      onDurationChange={handleDurationChange}
      customDateRange={customDateRange}
      onCustomStartDateChange={(startDate) =>
        dispatch(
          setCustomDateRangeImmediate({
            startDate,
            endDate: (customDateRange.endDate || '').split('T')[0],
          })
        )
      }
      onCustomEndDateChange={(endDate) =>
        dispatch(
          setCustomDateRangeImmediate({
            startDate: (customDateRange.startDate || '').split('T')[0],
            endDate,
          })
        )
      }
      globalLoading={globalLoading}
      periodLabel={getCurrentPeriodText()}
      onPrevious={handlePrevious}
      onNext={handleNext}
      isLargeScreen={isLargeScreen}
      isMediumScreen={isMediumScreen}
    />
  );

  const energySortableSensors = useBasicDashboardSortableSensors();

  const wrapEnergyLayout = useCallback(
    (layout) => (
      <BasicDashboardSortableProvider
        items={energyVisibleSlotOrder}
        sensors={energySortableSensors}
        locked={energyReflowLocked}
        onReorder={onReorderEnergySlots}
      >
        {layout}
      </BasicDashboardSortableProvider>
    ),
    [
      energyVisibleSlotOrder,
      energySortableSensors,
      energyReflowLocked,
      onReorderEnergySlots,
    ]
  );

  const basicEnergyLayoutRuntime = useMemo(
    () => ({
      wrapSlot: (slotId, content) => {
        const meta = getBasicEnergySlotMeta(slotId);
        const card = (
          <BasicDashboardCardChrome
            span={getEnergySlotSpan(slotId)}
            showSpanToggle={
              !energyReflowLocked && !isBasicEnergyForceFullWidth(slotId)
            }
            onToggleSpan={() => {
              if (energyReflowLocked) return
              toggleEnergyCardSpan(slotId)
            }}
            showHeightToggle={!energyReflowLocked}
            isFullscreen={String(energyFullscreenCardId || '') === String(slotId)}
            onToggleFullscreen={() => {
              if (energyReflowLocked) return
              toggleEnergyFullscreen(slotId)
            }}
          >
            {content}
          </BasicDashboardCardChrome>
        );
        if (!meta) return card;
        return (
          <SortableDashboardItem id={String(slotId)} disabled={energyReflowLocked}>
            {card}
          </SortableDashboardItem>
        );
      },
      renderCustomSlot: (slotId) => {
        if (slotId !== 'consumption_saving') return null;
        return (
          <ConsumptionSavingsCombinedChart
            title={getWidgetTitle('consumption_saving', 'Energy')}
            mergedData={energyCustomNeedsDates ? [] : consumptionSavingMergedData}
            unit={combinedConsumptionSavingUnit}
            isLoading={energyCustomNeedsDates ? false : (consumptionIsLoading || savingsIsLoading)}
            selectedDuration={selectedDuration}
            contentColor="#ffffff"
            onEmail={handleConsumptionEmail}
            onDownloadReport={handleConsumptionDownload}
            exportEmailLoading={!!exportLoading['Consumption_email']}
            exportDownloadLoading={!!exportLoading['Consumption_download']}
            emptyStateVariant={energyCustomNeedsDates ? 'blank' : 'message'}
            topControls={
              <Box
                sx={{
                  width: '100%',
                  maxWidth: '100%',
                  minWidth: 0,
                  flexShrink: 0,
                  boxSizing: 'border-box',
                }}
              >
                {energyDurationFilterElement}
              </Box>
            }
            strategyContent={
              <SavingsByStrategyWidget
                title={savingsByStrategyTitle}
                savingsByStrategy={savingsByStrategy}
                allEnergyChartsReady={allEnergyChartsReady}
                chartLoadingSavingsByStrategy={chartLoading.savingsByStrategy}
                globalLoading={globalLoading}
                shellVariant="basic"
                chartSurface={energyLineChartSurface}
                chartHeaderStyle={chartHeaderStyle}
                embedded
                customDatesIncomplete={energyCustomNeedsDates}
                energyLightFullCardHeightPx={ENERGY_LIGHT_FULL_CARD_HEIGHT_PX}
                ChartLoader={ChartLoader}
              />
            }
            strategyLoading={
              energyCustomNeedsDates ? false : embeddedSavingsByStrategyLoading
            }
          />
        );
      },
      getShellProps: (slotId) => {
        if (slotId === 'light_power_density') {
          return {
            outerStyle: {
              backgroundColor: energyMetricOuterBg,
              border: energyMetricOuterBorder,
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              height: '200px',
              width: '100%',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
            },
            headerTitle: getWidgetTitle('light_power_density', 'Lighting Power Density'),
            headerTitleStyle: {
              ...chartHeaderStyle,
              ...(energyMetricLight ? { color: '#000000' } : {}),
            },
            headerControl: (
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
            ),
            bodyContent: (
              <DashboardWidgetRenderer
                widgetKey="light_power_density"
                variant="basic"
                context={energyWidgetRenderContext}
              />
            ),
            bodyStyle: {
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              backgroundColor: energyMetricInnerBg,
              border: 'none',
              borderRadius: '12px',
            },
          };
        }
        if (slotId === 'peak_and_minimum_consumption') {
          return {
            useBoxOuter: true,
            shellLayout: 'header-body',
            outerSx: {
              backgroundColor: energyMetricOuterBg,
              border: energyMetricOuterBorder,
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              height: '200px',
              width: '100%',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
            },
            headerTitle: (
              <Box
                component="h3"
                sx={{
                  ...chartHeaderStyle,
                  ...(energyMetricLight ? { color: '#000000' } : {}),
                }}
              >
                {getWidgetTitle('peak_and_minimum_consumption', 'Peak & Minimum Consumption')}
              </Box>
            ),
            headerMarginBottom: '12px',
            headerTrailing: <Box sx={{ position: 'relative' }} />,
            headerRowStyle: { flexShrink: 0 },
          };
        }
        return {};
      },
    }),
    [
      energyReflowLocked,
      getEnergySlotSpan,
      toggleEnergyCardSpan,
      toggleEnergyFullscreen,
      energyFullscreenCardId,
      getWidgetTitle,
      energyCustomNeedsDates,
      consumptionSavingMergedData,
      combinedConsumptionSavingUnit,
      consumptionIsLoading,
      savingsIsLoading,
      selectedDuration,
      handleConsumptionEmail,
      handleConsumptionDownload,
      exportLoading,
      energyDurationFilterElement,
      savingsByStrategyTitle,
      savingsByStrategy,
      allEnergyChartsReady,
      chartLoading.savingsByStrategy,
      globalLoading,
      energyLineChartSurface,
      chartHeaderStyle,
      embeddedSavingsByStrategyLoading,
      ENERGY_LIGHT_FULL_CARD_HEIGHT_PX,
      energyMetricOuterBg,
      energyMetricOuterBorder,
      energyMetricLight,
      lightingUnit,
      energyMetricInnerBg,
      energyWidgetRenderContext,
    ]
  );

  /** Energy, Space Utilization + Alerts: ~1/3 vertical size of the fixed blue sub-header strip */
  const compactEnergyChartsChrome = activeTab === 'energy' || activeTab === 'charts' || activeTab === 'alerts'

  const [spaceChartsFilterPinned, setSpaceChartsFilterPinned] = useState(false)
  const handleChartsDurationFilterPinnedChange = useCallback((pinned) => {
    setSpaceChartsFilterPinned(Boolean(pinned))
  }, [])

  const pinBasicDashboardScrollChrome =
    (activeTab === 'energy' && showEnergyStandaloneDurationFilter) ||
    (activeTab === 'charts' && spaceChartsFilterPinned)

  const basicPinnedFilterRef = useRef(null)
  const [basicPinnedFilterBottomPx, setBasicPinnedFilterBottomPx] = useState(0)

  const syncBasicPinnedFilterChrome = useCallback(() => {
    const el = basicPinnedFilterRef.current
    if (!el) return
    setBasicPinnedFilterBottomPx(el.getBoundingClientRect().bottom)
  }, [])

  useLayoutEffect(() => {
    if (!pinBasicDashboardScrollChrome) {
      setBasicPinnedFilterBottomPx(0)
      return undefined
    }

    syncBasicPinnedFilterChrome()
    const el = basicPinnedFilterRef.current
    if (!el) return undefined

    let resizeObserver
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(syncBasicPinnedFilterChrome)
      resizeObserver.observe(el)
    }

    window.addEventListener('resize', syncBasicPinnedFilterChrome)
    return () => {
      resizeObserver?.disconnect()
      window.removeEventListener('resize', syncBasicPinnedFilterChrome)
    }
  }, [
    pinBasicDashboardScrollChrome,
    syncBasicPinnedFilterChrome,
    selectedDuration,
    customDateRange,
    showAreaDropdown,
    spaceChartsFilterPinned,
    showEnergyStandaloneDurationFilter,
    activeTab,
  ])

  const basicPinnedFilterBottomOffsetPx =
    basicPinnedFilterBottomPx > 0
      ? basicPinnedFilterBottomPx
      : DASHBOARD_RIBBON_TOOLBAR_PX +
        BASIC_ENERGY_COMPACT_SUBHEADER_PX +
        BASIC_ENERGY_DURATION_FILTER_BAR_PX

  const pinnedDurationFilterTop = `${DASHBOARD_RIBBON_TOOLBAR_PX + BASIC_ENERGY_COMPACT_SUBHEADER_PX}px`
  const pinnedDurationFilterScrollOffset = `${BASIC_ENERGY_COMPACT_SUBHEADER_PX + BASIC_ENERGY_DURATION_FILTER_BAR_PX}px`
  const pinnedDurationFilterBarSx = {
    position: 'fixed',
    top: pinnedDurationFilterTop,
    left: 0,
    right: 0,
    zIndex: 998,
    backgroundColor: backgroundColor,
    py: 1,
    display: 'flex',
    justifyContent: 'center',
    boxSizing: 'border-box',
    ...(pinBasicDashboardScrollChrome
      ? {
          borderBottom: '1px solid #ccc',
        }
      : {}),
  }

  return (
    <div
      style={
        activeTab === 'overview'
          ? { overflowY: 'auto', overflowX: 'hidden', minHeight: 0, maxHeight: '100dvh' }
          : pinBasicDashboardScrollChrome
            /* Do not use overflow:hidden here — it clips position:fixed breadcrumb chrome
               (Energy/Charts pinned filter mode). Scroll locking stays on the content Box. */
            ? { overflowX: 'hidden', overflowY: 'visible' }
            : activeTab === 'charts'
              ? { minHeight: 0, height: 'auto' }
              : undefined
      }
    >
      {/* Fixed Header Section - Static Controls */}
      <Box
        sx={{
          position: 'fixed',
          top: DASHBOARD_SUBHEADER_RIBBON_TOP.includes(activeTab)
            ? `${DASHBOARD_RIBBON_TOOLBAR_PX}px`
            : '66px',
          left: 0,
          right: 0,
          p: 0,
          zIndex: 10001,
          border: 'none',
          outline: 'none',
          boxShadow: 'none',
          overflow: 'visible',
          ...(activeTab === 'overview'
            ? { background: dashboardOverviewFixedHeaderBg }
            : activeTab === 'energy' || activeTab === 'charts' || activeTab === 'alerts'
              ? { backgroundColor: DASHBOARD_RIBBON_BLUE }
              : { backgroundColor: backgroundColor }),
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: '100%',
            mx: 'auto',
            px: { xs: 1, sm: 2, md: 3, lg: 6, xl: 8, '2xl': 10 },
            py: compactEnergyChartsChrome ? '10px' : { xs: 1, md: 2 },
            minHeight: compactEnergyChartsChrome
              ? `${BASIC_ENERGY_COMPACT_SUBHEADER_PX}px`
              : undefined,
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            overflow: 'visible',
          }}
        >
          {/* Top row — floor/area (ribbon); alerts filter. Duration/date live below ribbon in content. */}
          <Grid
            container
            /* spacing={0} on compact chrome — MUI Grid negative margins pull glyphs under the topbar */
            spacing={
              compactEnergyChartsChrome
                ? 0
                : { xs: 1, sm: 2, md: 2, lg: 3, xl: 4 }
            }
            alignItems="center"
            wrap="wrap"
            sx={{
              width: '100%',
              ...(compactEnergyChartsChrome ? { margin: 0 } : {}),
            }}
          >
            {/* Select Floor and Areas Dropdown */}
            {(activeTab === 'energy' || activeTab === 'charts' || (activeTab === 'alerts' && energyMetricLight)) && (
              <Grid
                item
                xs={12}
                sm="auto"
                md="auto"
                lg="auto"
                xl="auto"
                sx={{ maxWidth: '100%', minWidth: 0 }}
              >
                <div
                  ref={areaDropdownRef}
                  style={{
                    width: 'fit-content',
                    maxWidth: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flexWrap: 'nowrap',
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      color: DASHBOARD_RIBBON_TEXT_BRIGHT,
                      fontWeight: 400,
                      fontSize: isMediumScreen ? '15px' : '14px',
                      fontFamily: 'inherit',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      lineHeight: '22px',
                      display: 'inline-block',
                      paddingTop: 2,
                      paddingBottom: 2,
                    }}
                  >
                    {activeTab === 'energy' ? 'Energy' : activeTab === 'alerts' ? 'Alerts' : 'Space Utilization'}
                  </span>
                  <span
                    aria-hidden
                    style={{
                      color: DASHBOARD_RIBBON_TEXT_MUTED,
                      fontSize: isMediumScreen ? '15px' : '14px',
                      fontWeight: 500,
                      fontFamily: 'inherit',
                      flexShrink: 0,
                      lineHeight: '22px',
                      display: 'inline-block',
                      padding: '2px 2px',
                    }}
                  >
                    ›
                  </span>
                  <div
                    style={{
                      flex: '0 1 auto',
                      width: 'fit-content',
                      minWidth: 0,
                      maxWidth: '100%',
                      position: 'relative',
                    }}
                  >
                    <div
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (activeTab === 'alerts') {
                          setShowDropdown(!showDropdown);
                        } else {
                          setShowAreaDropdown(!showAreaDropdown);
                        }
                      }}
                      style={{
                        width: 'max-content',
                        maxWidth: '100%',
                        minWidth: 0,
                        boxSizing: 'border-box',
                        padding: compactEnergyChartsChrome ? '4px 2px' : '8px 4px',
                        border: 'none',
                        borderBottom: '1px solid rgba(255,255,255,0.28)',
                        borderRadius: 0,
                        backgroundColor: 'transparent',
                        color: DASHBOARD_RIBBON_TEXT_MUTED,
                        fontSize: isMediumScreen ? '11px' : '10px',
                        fontWeight: 500,
                        fontFamily: 'inherit',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'flex-start',
                        alignItems: 'center',
                        gap: 8,
                        lineHeight: '18px',
                        overflow: 'visible',
                      }}
                    >
                      <span
                        style={{
                          flex: '0 1 auto',
                          whiteSpace: 'nowrap',
                          minWidth: 0,
                          fontSize: 'inherit',
                          fontWeight: 500,
                          color: DASHBOARD_RIBBON_TEXT_MUTED,
                          display: 'inline-block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          textAlign: 'left',
                          maxWidth: 'min(72vw, 420px)',
                          lineHeight: '18px',
                          verticalAlign: 'middle',
                        }}
                        title={getAreaSelectionText()}
                      >
                        {activeTab === 'alerts'
                          ? (selectedAlertTypes.length === 0
                            ? "Alerts Type"
                            : selectedAlertTypes.length === 1
                              ? selectedAlertTypes[0]
                              : `${selectedAlertTypes.length} types selected`)
                          : truncateAreaSelectionLabel(getAreaSelectionText())}
                      </span>
                      <span style={{ color: DASHBOARD_RIBBON_TEXT_MUTED, flexShrink: 0 }}>▼</span>
                    </div>

                    {(activeTab === 'alerts' ? showDropdown : showAreaDropdown) && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        width: 'max-content',
                        minWidth: '100%',
                        maxWidth: 'min(92vw, 520px)',
                        boxSizing: 'border-box',
                        backgroundColor: 'white',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        zIndex: 1002,
                        marginTop: '2px',
                        maxHeight: activeTab === 'alerts' ? '200px' : '400px',
                        overflowY: 'auto',
                        overflowX: 'hidden'
                      }}>
                        {activeTab === 'alerts' ? (
                          <>
                            {alertTypes.map((type) => {
                              const isChecked = selectedAlertTypes.includes(type);
                              return (
                                <div
                                  key={type}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
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
                                    onChange={() => { }}
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
                                    e.stopPropagation();
                                    setSelectedAlertTypes([]);
                                    setFilterKey(prev => prev + 1);
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
                          </>
                        ) : floorStatus === 'loading' ? (
                          <DashboardAreaTreeInlineStatus mode="loading" />
                        ) : hasError ? (
                          <DashboardAreaTreeInlineStatus mode="error" />
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
                                      minWidth: 0,
                                      maxWidth: '100%',
                                      paddingLeft: '20px',
                                      borderLeft: '2px solid #e0e0e0',
                                      boxSizing: 'border-box'
                                    }}>
                                      {floorLoading ? (
                                        <div style={{ padding: '5px 0', color: '#666', fontSize: '11px' }}>
                                          Loading areas...
                                        </div>
                                      ) : (areaTree.tree || areaTree.areas || []).length > 0 ? (
                                        <div style={{
                                          maxHeight: '200px',
                                          overflowY: 'auto',
                                          overflowX: 'auto',
                                          padding: '4px 0',
                                          width: '100%',
                                          minWidth: 0
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
                                    applyAreaTreeClearAll();
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
                                    applyAreaTreeSet();
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
                          <DashboardAreaTreeInlineStatus
                            mode="empty"
                            isOperator={isOperator}
                            floorStatus={floorStatus}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Grid>
            )}

            {activeTab === 'alerts' && !energyMetricLight && (
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

          </Grid>

        </Box>
      </Box>

      {activeTab === 'energy' && showEnergyStandaloneDurationFilter && (
        <Box ref={basicPinnedFilterRef} sx={pinnedDurationFilterBarSx}>
          <Box sx={{ width: 'min(330px, 100%)', maxWidth: '100%' }}>
            {energyDurationFilterElement}
          </Box>
        </Box>
      )}

      {activeTab === 'charts' && (
        <Box
          ref={spaceChartsFilterPinned ? basicPinnedFilterRef : null}
          id="basic-space-charts-pinned-duration-filter"
          sx={{
            ...pinnedDurationFilterBarSx,
            display: spaceChartsFilterPinned ? 'flex' : 'none',
          }}
        />
      )}

      {/* Scrollable Content Area */}
      <Box
        sx={{
          ...(pinBasicDashboardScrollChrome
            ? {
                position: 'fixed',
                top: `${basicPinnedFilterBottomOffsetPx}px`,
                left: 0,
                right: 0,
                bottom: 0,
                overflowY: 'auto',
                overflowX: 'hidden',
                boxSizing: 'border-box',
                // borderTop: `1px solid ${buttonColor}`,
                py: activeTab === 'charts' ? 1 : 3,
                zIndex: 1,
              }
            : {
                /* Default 12 clears the tall fixed strip; compact chrome shrinks the strip (~1/3) but body still needs ~7 units (~56px) so charts do not sit under the bar */
                mt:
                  activeTab === 'overview'
                    ? 0
                    : (activeTab === 'energy' && showEnergyStandaloneDurationFilter) ||
                        (activeTab === 'charts' && spaceChartsFilterPinned)
                      ? pinnedDurationFilterScrollOffset
                      : compactEnergyChartsChrome
                        ? 6.5
                        : 12,
                py: activeTab === 'overview' ? 0 : activeTab === 'charts' ? 1 : 3,
              }),
          ...(activeTab === 'overview'
            ? {
              overflow: 'hidden',
              // rem tracks browser zoom; ~121px at default 16px root
              height: 'calc(100dvh - 7.5625rem)',
              maxHeight: 'calc(100dvh - 7.5625rem)',
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
              /* In-flow start is y=0 while the sub-header is position:fixed — pad so tiles clear it (stops first row title crop) */
              pt: { xs: 5, sm: 5.5, md: 6 },
            }
            : {}),
          ...(activeTab === 'charts' && !pinBasicDashboardScrollChrome
            ? {
              flex: '0 0 auto',
              minHeight: 0,
              height: 'auto',
              width: '100%',
            }
            : {}),
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: '100%',
            mx: 'auto',
            px:
              activeTab === 'overview'
                ? 0
                : { xs: 1, sm: 2, md: 3, lg: 0.5, xl: 6, '2xl': 8 },
            ...(activeTab === 'overview' ? { flex: 1, minHeight: 0 } : {}),
            ...(activeTab === 'charts' && !pinBasicDashboardScrollChrome
              ? { flex: '0 0 auto', minHeight: 0, height: 'auto', width: '100%' }
              : {}),
          }}
        >
          <Box
            sx={{
              ...(activeTab === 'overview'
                ? {
                  backgroundColor: 'transparent',
                  borderRadius: 0,
                  minHeight: 0,
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 0,
                }
                : {
                  backgroundColor: backgroundColor,
                  borderRadius: 2,
                  ...(activeTab === 'energy' || activeTab === 'charts'
                    ? { minHeight: 0 }
                    : { minHeight: 320 }),
                  ...(activeTab === 'charts' && !pinBasicDashboardScrollChrome
                    ? {
                      height: 'fit-content',
                      maxHeight: 'none',
                      minHeight: 0,
                      flex: '0 0 auto',
                      alignSelf: 'flex-start',
                      display: 'flex',
                      flexDirection: 'column',
                      width: '100%',
                    }
                    : {}),
                }),
              width: '100%',
              maxWidth: '100%',
              position: 'relative',
            }}
          >
            {/* Data Container for your next section */}
            <Box
              mt={
                activeTab === 'overview' || activeTab === 'alerts'
                  ? 0
                  : pinBasicDashboardScrollChrome
                    ? 0
                    : activeTab === 'energy' || activeTab === 'charts'
                      ? 1
                      : 3
              }
              sx={
                activeTab === 'overview'
                  ? { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }
                  : activeTab === 'charts' && !pinBasicDashboardScrollChrome
                    ? { flex: '0 0 auto', minHeight: 0, width: '100%' }
                    : undefined
              }
            >
              <DashboardContainer
                variant="basic"
                adapter={basicDashboardContainerAdapter}
                activeTab={activeTab}
                orchestration={orchestration}
                runtime={{
                  DashboardOverview,
                  SpaceUtilization,
                  Alerts,
                  theme,
                  overviewData,
                  overviewLoading,
                  overviewError,
                  handleTabChange,
                  navigate,
                  instantOccupancyCount,
                  instantOccupancyCountLoading,
                  globalLoading,
                  filterKey,
                  selectedAlertTypes,
                  focusAlertFromLocation,
                  energyLayoutAdapter: basicEnergyLayoutAdapter,
                  energyLayoutRuntime: basicEnergyLayoutRuntime,
                  wrapEnergyLayout,
                  energyDurationFilterElement,
                  widgetList,
                  energyConsumption,
                  energySavings,
                  peakMinConsumption,
                  energyConsumptionLoading,
                  energySavingsLoading,
                  peakMinConsumptionLoading,
                  savingsByStrategy,
                  totalConsumptionByGroup,
                  lightPowerDensity,
                  lightingUnit,
                  selectedDuration,
                  currentDate,
                  currentYear,
                  selectedAreas,
                  areaGroups,
                  isLargeScreen,
                  chartHeaderStyle,
                  ChartLoader,
                  transformDataForCharts,
                  energyLineChartSurface,
                  energyMetricLight,
                  consumptionExportControl,
                  savingsExportControl,
                  totalConsumptionByGroupExportControl,
                  consumptionBlankPreview,
                  showEnergyStandaloneDurationFilter,
                  renderEnergyLineChartEmptyExtras,
                  ENERGY_LIGHT_FULL_CARD_HEIGHT_PX,
                  pinChartsDurationFilterInHeader: true,
                  onChartsDurationFilterPinnedChange: handleChartsDurationFilterPinnedChange,
                }}
              />

              {activeTab === 'energy' &&
              ENABLE_CUSTOM_ENERGY_SPACE_GRAPHS &&
              extraBasicEnergyGraphCards.length > 0
                ? extraBasicEnergyGraphCards
                : null}

              {/* Show message when operator has no floors assigned */}
              {/* Only show this message after both floors and profile are loaded to prevent race condition */}
              {/* Use getAvailableFloors() instead of floors.length to properly check operator permissions */}
              {isOperator && getAvailableFloors().length === 0 && floorStatus === 'succeeded' && !dashboardLoading && !profileLoading && userProfile !== null && (
                <DashboardOperatorNoFloorsPanel />
              )}

              <DashboardErrorBanner error={dashboardError} />
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
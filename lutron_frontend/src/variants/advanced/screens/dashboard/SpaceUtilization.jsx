import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useSelector, useDispatch, useStore } from 'react-redux'
import { Box, useTheme, useMediaQuery, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Typography, Button } from '@mui/material'
import { CARD_BACKGROUND, CARD_SHADOW, DASHBOARD_CHART_LOADING_BG, ADVANCED_SPACE_CHART_PLOT_BORDER } from '../../config/themeConstants'
import {
  SpaceLayoutRenderer,
  SpaceUtilizationContainer,
  useSpaceUtilizationContainer,
  advancedSpaceContainerAdapter,
  resolveSpaceActiveTab,
  createAdvancedSpaceLayoutAdapter,
} from '../../../../shared/dashboard/space/container'
import { bindChartLoader } from '../../../../shared/dashboard/space/components'
import { SpaceErrorPanel, SpaceStatusPanel } from '../../../../shared/dashboard/space/components/status'
import SPACE_CHART_DEFAULT_COLORS from '../../../../shared/dashboard/space/constants/chartPalette'
import { SpaceChartExportMenu } from '../../../../shared/dashboard/export/components'
import {
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
  selectCurrentDate,
  selectCurrentYear,
  selectEmailLoading,
  selectIsNavigating,
  selectGlobalLoading,
  setSelectedDuration,
  setCustomDateRange,
  setCurrentDate,
  setCurrentYear,
  setIsNavigating,
} from '../../redux/slice/dashboard/dashboardSlice'
import { fetchFloors } from '../../redux/slice/floor/floorSlice'
import { fetchEmailConfigs, getWidgetList, fetchRenameWidgets, fetchWidgetConfiguration, selectWidgetConfigurationStatus, fetchCustomGraphs, selectCustomGraphs, selectAreaGroups, fetchDashboardChartOrder, saveDashboardChartOrder, selectDashboardChartOrder, selectDashboardChartOrderStatus } from '../../redux/slice/settingsslice/heatmap/groupOccupancySlice'
import { ENABLE_CUSTOM_ENERGY_SPACE_GRAPHS } from '../../config/featureFlags'
import { useDashboardApiParams } from '../../../../shared/dashboard/hooks/useDashboardApiParams'
import { useCustomGraphDashboardData } from '../../../../shared/dashboard/customGraphs/useCustomGraphDashboardData'
import { isCustomGraphVisible } from '../../../../shared/dashboard/customGraphs/customGraphVisibility'
import { CUSTOM_GRAPH_VARIANTS, CUSTOM_GRAPHS_UPDATED_EVENT } from '../../../../shared/dashboard/customGraphs/customGraphConstants'
import { buildCustomGraphWidgetKey } from '../../../../shared/dashboard/customGraphs/customGraphStorage'
import {
  dispatchFetchCustomGraphsOnce,
  dispatchFetchFloorsOnce,
  dispatchFetchProfileOnce,
  dispatchFetchWidgetConfigurationOnce,
  dispatchFetchWidgetTitlesOnce,
} from '../../../../shared/utils/bootstrapFetchGuards'
import EnergyCustomGraphCard from '../../../customized/components/dashboard/EnergyCustomGraphCard'
import { transformDataForCharts as sharedTransformDataForCharts } from '../../../../shared/dashboard/charts/transforms/transformDataForCharts'
import {
  createStandardTransformDataForCharts,
  buildStandardTransformChartOptions,
} from '../../../../shared/dashboard/container/helpers'
import { BaseUrl } from '../../BaseUrl'
import { useDashboardWidgetVisibility } from '../../utils/dashboardWidgetVisibility'
import { UseAuth, isSuperadminRole } from '../../customhooks/UseAuth'
import { fetchProfile } from '../../redux/slice/auth/userlogin'
import { selectApplicationTheme } from '../../redux/slice/theme/themeSlice'
import {
  getThemeAwareLineSeriesColor,
  getThemeAwareMetricPanelBorder,
  getThemeAwarePieColors,
  getThemeAwareStackedBarPair,
} from '../../utils/dashboardChartColors'
import { isLightSurface } from '../../utils/themeOnSurface'

import {
  renderAdvancedSpaceWidgetSlot,
  createAdvancedSpaceLayoutAdapterStyles,
} from './advancedSpaceLayoutSlots'
import {
  AdvancedSpaceSortableSection,
  useAdvancedSpaceSortableLayoutState,
} from './AdvancedSpaceSortableSection'
import { useAdvancedDashboardSortableSensors } from '../../hooks/useAdvancedDashboardSortableSensors'
import DashboardDurationFilterBar from '../../../basic/screens/dashboard/DashboardDurationFilterBar'
import { dashboardSelectFieldSx, dashboardCombinedDurationSelectMenuProps } from '../../utils/dashboardSelectMenuProps'
import {
  formatDateForState,
  parseDateFromState,
} from '../../../../shared/dashboard/utils/dashboardDateState'

const ChartLoader = bindChartLoader('advanced')

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
const DEFAULT_CHART_COLORS = SPACE_CHART_DEFAULT_COLORS

const SpaceUtilization = ({
  title,
  data,
  isLoading = false,
  globalLoadingProp = false,
  showOnlyInstantChart = false,
  showChartsTab = false,
  getCurrentPeriodText: getCurrentPeriodTextProp,
  handlePrevious: handlePreviousProp,
  handleNext: handleNextProp,
}) => {
  const dispatch = useDispatch()
  const store = useStore()
  const { role: spaceUtilUserRole } = UseAuth()
  /** Superadmin may rearrange/resize Space cards; Admin/Operator see shared layout only. */
  const spaceLayoutLocked = !isSuperadminRole(spaceUtilUserRole)
  const theme = useTheme()
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'))
  const isMediumScreen = useMediaQuery(theme.breakpoints.up('md'))
  const isXLargeScreen = useMediaQuery(theme.breakpoints.up('xl'))
  const is2XLargeScreen = useMediaQuery('(min-width: 1600px)')
  const chartHeaderStyle = useMemo(() => ({
    margin: 0,
    color: 'var(--dashboard-chart-header-text, #ffffff)',
    fontWeight: 600,
    fontFamily: 'inherit',
    fontSize: isLargeScreen ? '18px' : '16px'
  }), [isLargeScreen])

  const appTheme = useSelector(selectApplicationTheme)
  const themeBackground = appTheme?.application_theme?.background || '#d2c4a2'
  const contentColor = appTheme?.application_theme?.content || '#ffffff'
  const spaceUtilLight = useMemo(() => isLightSurface(contentColor), [contentColor])
  const chartPalette = useMemo(
    () => getThemeAwarePieColors(themeBackground, 8) || DEFAULT_CHART_COLORS,
    [themeBackground]
  )
  const occupancyLineColor = useMemo(
    () => getThemeAwareLineSeriesColor(themeBackground, 1) || '#87CEEB',
    [themeBackground]
  )
  const stackedBarColors = useMemo(() => {
    const pair = getThemeAwareStackedBarPair(themeBackground)
    return pair || { unoccupied: '#FFB3B3', occupied: '#98FB98' }
  }, [themeBackground])
  const metricPanelBorder = useMemo(
    () => getThemeAwareMetricPanelBorder(themeBackground),
    [themeBackground]
  )

  const exportDropdownRef = useRef(null)
  const [hasInitialized, setHasInitialized] = useState(false)

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

  const userProfile = useSelector((state) => state.user?.profile)
  const profileLoading = useSelector((state) => state.user?.profileLoading)

  const selectedAreas = useSelector(selectSelectedAreas)
  const selectedFloorIds = useSelector(selectSelectedFloorIds)
  const selectedDuration = useSelector(selectSelectedDuration)
  const customDateRange = useSelector(selectCustomDateRange)
  const isNavigating = useSelector(selectIsNavigating)
  const globalLoading = useSelector(selectGlobalLoading)
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

  const dashboardError = useSelector((state) => state.dashboard.error)
  const occupancyCountLoading = useSelector((state) => state.dashboard.occupancyCountLoading || false)
  const occupancyByGroupLoading = useSelector((state) => state.dashboard.occupancyByGroupLoading || false)
  const spaceUtilizationLoading = useSelector((state) => state.dashboard.spaceUtilizationLoading || false)
  const instantOccupancyCountLoading = useSelector((state) => state.dashboard.instantOccupancyCountLoading || false)
  const instantOccupancyCountError = useSelector((state) => state.dashboard.instantOccupancyCountError || null)
  const instantOccupancyCount = useSelector((state) => state.dashboard.instantOccupancyCount || null)

  const activeOccupancyByGroup = showChartsTab ? occupancyByGroupFromLogs : occupancyByGroup
  const activeSpaceUtilizationPerArea = showChartsTab ? spaceUtilizationPerFromLogs : spaceUtilizationPerArea

  const containerRuntime = useMemo(
    () => ({
      showChartsTab,
      showOnlyInstantChart,
      isLoading,
      globalLoadingProp,
      dispatch,
      showSnackbar,
      userProfile,
      fetchEmailConfigs,
      selectedAreas,
      selectedFloorIds,
      selectedDuration,
      customDateRange,
      isNavigating,
      globalLoading,
      currentDate,
      currentYear,
      occupancyByGroup,
      spaceUtilizationPerArea,
      occupancyByGroupFromLogs,
      spaceUtilizationPerFromLogs,
      occupancyByGroupFromLogsLoading,
      spaceUtilizationPerFromLogsLoading,
      occupancyCount,
      instantOccupancyCount,
      instantOccupancyCountError,
      instantOccupancyCountLoading,
      occupancyCountLoading,
      occupancyByGroupLoading,
      spaceUtilizationLoading,
      widgetList,
      occupancyLineColor,
      stackedBarColors,
      chartPalette,
      cardBackground: CARD_BACKGROUND,
      cardBorder: ADVANCED_SPACE_CHART_PLOT_BORDER,
      cardShadow: CARD_SHADOW,
      metricPanelBorder,
      isLargeScreen,
      spaceUtilLight,
      ChartLoader,
      exportThunks: {
        sendInstantOccupancyCountEmail,
        downloadInstantOccupancyCount,
        sendOccupancyCountEmail,
        downloadOccupancyCount,
        sendOccupancyByGroupFromLogsEmail,
        downloadOccupancyByGroupFromLogs,
        sendOccupancyByGroupEmail,
        downloadOccupancyByGroup,
        sendSpaceUtilizationPerFromLogsEmail,
        downloadSpaceUtilizationPerFromLogs,
        sendSpaceUtilizationPerEmail,
        downloadSpaceUtilizationPer,
      },
    }),
    [
      showChartsTab,
      showOnlyInstantChart,
      isLoading,
      globalLoadingProp,
      dispatch,
      showSnackbar,
      selectedAreas,
      selectedFloorIds,
      selectedDuration,
      customDateRange,
      isNavigating,
      globalLoading,
      currentDate,
      currentYear,
      occupancyByGroup,
      spaceUtilizationPerArea,
      occupancyByGroupFromLogs,
      spaceUtilizationPerFromLogs,
      occupancyByGroupFromLogsLoading,
      spaceUtilizationPerFromLogsLoading,
      occupancyCount,
      instantOccupancyCount,
      instantOccupancyCountError,
      instantOccupancyCountLoading,
      occupancyCountLoading,
      occupancyByGroupLoading,
      spaceUtilizationLoading,
      widgetList,
      occupancyLineColor,
      stackedBarColors,
      chartPalette,
      metricPanelBorder,
      isLargeScreen,
      spaceUtilLight,
    ]
  );

  const orchestration = useSpaceUtilizationContainer(
    advancedSpaceContainerAdapter,
    containerRuntime
  );

  const {
    exports: {
      showExportDropdown,
      setShowExportDropdown,
      exportLoading,
      handleExport,
    },
  } = orchestration;

  const hasApiErrors = () => {
    return (
      (activeOccupancyByGroup && activeOccupancyByGroup.status === 'error') ||
      (activeSpaceUtilizationPerArea && activeSpaceUtilizationPerArea.status === 'error')
    )
  }

  const floors = useSelector((state) => state.floor.floors)
  const floorStatus = useSelector((state) => state.floor.status)
  const widgetConfigurationStatus = useSelector(selectWidgetConfigurationStatus)

  // Fetch floors on component mount
  useEffect(() => {
    dispatchFetchFloorsOnce(dispatch, fetchFloors, Boolean(floors?.length))
  }, [dispatch, floors?.length])

  // Fetch rename widgets when component mounts (only if not already loaded)
  useEffect(() => {
    if (!widgetList || widgetList.length === 0) {
      dispatchFetchWidgetTitlesOnce(dispatch, fetchRenameWidgets)
    }
  }, [dispatch, widgetList])

  useEffect(() => {
    if (widgetConfigurationStatus === 'idle') {
      dispatchFetchWidgetConfigurationOnce(dispatch, fetchWidgetConfiguration)
    }
  }, [dispatch, widgetConfigurationStatus])

  // Profile is owned by Topbar; join if already in flight
  useEffect(() => {
    dispatchFetchProfileOnce(dispatch, fetchProfile)
  }, [dispatch])

  // Note: This component should NOT make API calls - Dashboard component handles all API calls
  // This useEffect only handles component initialization and data display
  useEffect(() => {
    if (!hasInitialized) {
      setHasInitialized(true);
    }
  }, [hasInitialized]);

  const getWidgetTitle = (widgetKey, fallbackTitle) => {
    if (!widgetList?.titles) return fallbackTitle;

    const widget = widgetList.titles.find(w => w.key === widgetKey);
    return widget?.title || fallbackTitle;
  };

  const ExportDropdown = ({ isOpen, chartTitle, dropdownKey }) => (
    <SpaceChartExportMenu
      isOpen={isOpen}
      chartTitle={chartTitle}
      dropdownKey={dropdownKey}
      exportLoading={exportLoading}
      onExport={handleExport}
      innerRef={exportDropdownRef}
      shellVariant="advanced"
      isLargeScreen={isLargeScreen}
    />
  )

  const advancedSpaceLayoutAdapter = useMemo(
    () => createAdvancedSpaceLayoutAdapter(createAdvancedSpaceLayoutAdapterStyles()),
    []
  );

  const spaceSortableSensors = useAdvancedDashboardSortableSensors();
  const { isWidgetVisible } = useDashboardWidgetVisibility();
  const shouldRenderWidget = useCallback((key) => isWidgetVisible(key), [isWidgetVisible]);
  const spaceSortableLayoutState = useAdvancedSpaceSortableLayoutState({
    showChartsTab,
    shouldRenderWidget,
    dispatch,
    saveDashboardChartOrder,
    layoutLocked: spaceLayoutLocked,
  });
  const dashboardChartOrder = useSelector(selectDashboardChartOrder);
  const dashboardChartOrderStatus = useSelector(selectDashboardChartOrderStatus);

  useEffect(() => {
    dispatch(fetchDashboardChartOrder());
  }, [dispatch]);

  useEffect(() => {
    if (dashboardChartOrderStatus !== 'succeeded') return;
    const blob = dashboardChartOrder?.advanced_dashboard_order;
    if (blob && typeof spaceSortableLayoutState.hydrateSpaceLayoutFromApi === 'function') {
      spaceSortableLayoutState.hydrateSpaceLayoutFromApi(blob);
    }
  }, [dashboardChartOrder, dashboardChartOrderStatus, spaceSortableLayoutState.hydrateSpaceLayoutFromApi]);

  const handleSpaceChartsDurationChange = useCallback(
    (e) => {
      e.stopPropagation();
      const newDuration = e.target.value;
      if (!newDuration || newDuration === selectedDuration) return;
      const today = new Date();
      dispatch(setCurrentDate(formatDateForState(today)));
      dispatch(setCurrentYear(today.getFullYear()));
      dispatch(setCustomDateRange({ startDate: null, endDate: null }));
      dispatch(setIsNavigating(false));
      dispatch(setSelectedDuration(newDuration));
    },
    [dispatch, selectedDuration]
  );

  const handlePrevious = handlePreviousProp ?? (() => dispatch(setIsNavigating(true)));
  const handleNext = handleNextProp ?? (() => dispatch(setIsNavigating(true)));

  const getCurrentPeriodText = useCallback(() => {
    if (typeof getCurrentPeriodTextProp === 'function') {
      return getCurrentPeriodTextProp();
    }
    const currentDateObj = parseDateFromState(currentDate);

    if (selectedDuration === 'this-day') {
      return currentDateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
    if (selectedDuration === 'this-week') {
      const startOfWeek = new Date(currentDateObj);
      startOfWeek.setDate(currentDateObj.getDate() - currentDateObj.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
        return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}-${endOfWeek.getDate()}, ${startOfWeek.getFullYear()}`;
      }
      return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${startOfWeek.getFullYear()}`;
    }
    if (selectedDuration === 'this-month') {
      return currentDateObj.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });
    }
    if (selectedDuration === 'this-year') {
      return currentYear.toString();
    }
    if (selectedDuration === 'custom' && customDateRange.startDate && customDateRange.endDate) {
      const startDate = new Date(customDateRange.startDate);
      const endDate = new Date(customDateRange.endDate);
      if (startDate.toDateString() === endDate.toDateString()) {
        return startDate.toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      }
      if (
        startDate.getMonth() === endDate.getMonth() &&
        startDate.getFullYear() === endDate.getFullYear()
      ) {
        return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}-${endDate.getDate()}, ${startDate.getFullYear()}`;
      }
      if (startDate.getFullYear() === endDate.getFullYear()) {
        return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${startDate.getFullYear()}`;
      }
      return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return '';
  }, [
    currentDate,
    currentYear,
    customDateRange.endDate,
    customDateRange.startDate,
    selectedDuration,
    getCurrentPeriodTextProp,
  ]);

  const spaceChartsDurationFilterElement = useMemo(
    () => (
      <DashboardDurationFilterBar
        selectedDuration={selectedDuration}
        onDurationChange={handleSpaceChartsDurationChange}
        customDateRange={customDateRange}
        onCustomStartDateChange={(startDate) =>
          dispatch(
            setCustomDateRange({
              startDate,
              endDate: (customDateRange.endDate || '').split('T')[0],
            })
          )
        }
        onCustomEndDateChange={(endDate) =>
          dispatch(
            setCustomDateRange({
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
        themedSelect
        selectMenuProps={dashboardCombinedDurationSelectMenuProps}
        selectFieldSx={dashboardSelectFieldSx}
      />
    ),
    [
      selectedDuration,
      handleSpaceChartsDurationChange,
      customDateRange,
      dispatch,
      globalLoading,
      getCurrentPeriodText,
      handlePrevious,
      handleNext,
      isLargeScreen,
      isMediumScreen,
    ]
  );

  const dateParams = useMemo(
    () => ({
      startDate: customDateRange?.startDate,
      endDate: customDateRange?.endDate,
    }),
    [customDateRange]
  );

  const { apiParams } = useDashboardApiParams({
    selectedDuration,
    customDateRange,
    customStartDate: customDateRange?.startDate,
    customEndDate: customDateRange?.endDate,
    selectedAreas,
    selectedFloorIds,
    allAreasLoaded: true,
    dateParams,
    isNavigating,
  });

  const customGraphs = useSelector(selectCustomGraphs);
  const areaGroups = useSelector(selectAreaGroups);

  useEffect(() => {
    if (!ENABLE_CUSTOM_ENERGY_SPACE_GRAPHS) return undefined;
    dispatchFetchCustomGraphsOnce(dispatch, fetchCustomGraphs);
    const onUpdate = () => dispatchFetchCustomGraphsOnce(dispatch, fetchCustomGraphs, { force: true });
    window.addEventListener(CUSTOM_GRAPHS_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(CUSTOM_GRAPHS_UPDATED_EVENT, onUpdate);
  }, [dispatch]);

  const spaceCustomGraphs = useMemo(
    () =>
      ENABLE_CUSTOM_ENERGY_SPACE_GRAPHS
        ? (Array.isArray(customGraphs) ? customGraphs : []).filter(
            (g) =>
              String(g?.page || '').toLowerCase() === 'space' &&
              isCustomGraphVisible(CUSTOM_GRAPH_VARIANTS.advanced, 'space', g?.id, true)
          )
        : [],
    [customGraphs]
  );

  const { customGraphData, customGraphLoading, customGraphError } = useCustomGraphDashboardData({
    customGraphs: spaceCustomGraphs,
    apiParams,
    dispatch,
    store,
    baseUrlClient: BaseUrl,
    dispatchThunks: false,
  });

  const transformDataForCharts = useCallback(
    createStandardTransformDataForCharts(
      sharedTransformDataForCharts,
      buildStandardTransformChartOptions({ selectedDuration, selectedAreas, areaTree: null })
    ),
    [selectedDuration, selectedAreas]
  );

  const spaceCustomGraphAdvancedSurface = useMemo(
    () => ({
      cardBackground: CARD_BACKGROUND,
      cardBorder: '1px solid #ccc',
      cardShadow: CARD_SHADOW,
      cardClassName: 'chart-card-animated',
    }),
    []
  );

  const spaceSlotRenderApi = useMemo(
    () => ({
      chartHeaderStyle,
      isLargeScreen,
      getWidgetTitle,
      ExportDropdown,
      showExportDropdown,
      setShowExportDropdown,
      spaceChartsDurationFilterElement,
      isWidgetVisible,
    }),
    [
      chartHeaderStyle,
      isLargeScreen,
      showExportDropdown,
      setShowExportDropdown,
      spaceChartsDurationFilterElement,
      isWidgetVisible,
    ]
  );

  const spaceLayoutRuntime = useMemo(
    () => ({
      renderWidgetSlot: (slotId, meta, layoutContext) =>
        renderAdvancedSpaceWidgetSlot(slotId, meta, layoutContext, spaceSlotRenderApi),
    }),
    [spaceSlotRenderApi]
  );

  const renderAdvancedSpaceSection = useCallback(
    ({ orchestration: spaceOrchestration, activeTab }) => (
      <>
        <AdvancedSpaceSortableSection
          activeTab={activeTab}
          showChartsTab={showChartsTab}
          sensors={spaceSortableSensors}
          layoutState={spaceSortableLayoutState}
          layoutLocked={spaceLayoutLocked}
          renderSlot={(slotId, layoutOverrides) => {
            const layoutContext = {
              ...spaceOrchestration.layoutContext,
              selectorMode: layoutOverrides?.selectorMode,
              widgetRenderContext: spaceOrchestration.layoutContext?.widgetRenderContext,
            };
            if (slotId === 'instant_utilization_combined') {
              return renderAdvancedSpaceWidgetSlot(
                slotId,
                { kind: 'custom' },
                layoutContext,
                spaceSlotRenderApi
              );
            }
            const meta = advancedSpaceLayoutAdapter.SLOT_REGISTRY?.[slotId];
            if (!meta) return null;
            return renderAdvancedSpaceWidgetSlot(slotId, meta, layoutContext, spaceSlotRenderApi);
          }}
        />
        {ENABLE_CUSTOM_ENERGY_SPACE_GRAPHS && spaceCustomGraphs.length > 0 ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(12, 1fr)' },
              gap: 2,
              mt: 2,
              width: '100%',
            }}
          >
            {spaceCustomGraphs.map((g, idx) => {
              const id = String(g?.id ?? '');
              return (
                <Box
                  key={buildCustomGraphWidgetKey(id || `idx_${idx}`)}
                  sx={{ gridColumn: { xs: '1 / -1', sm: 'span 6' } }}
                >
                  <EnergyCustomGraphCard
                    g={g}
                    shellVariant="advanced"
                    advancedSurface={spaceCustomGraphAdvancedSurface}
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
            })}
          </Box>
        ) : null}
      </>
    ),
    [
      showChartsTab,
      spaceSortableSensors,
      spaceSortableLayoutState,
      spaceLayoutLocked,
      advancedSpaceLayoutAdapter,
      spaceSlotRenderApi,
      spaceCustomGraphs,
      spaceCustomGraphAdvancedSurface,
      chartHeaderStyle,
      customGraphData,
      customGraphLoading,
      customGraphError,
      transformDataForCharts,
      areaGroups,
      apiParams,
    ]
  );

  const containerPresentationRuntime = useMemo(
    () => ({
      SpaceLayoutRenderer,
      layoutAdapter: advancedSpaceLayoutAdapter,
      layoutRuntime: spaceLayoutRuntime,
      renderSpaceSection: renderAdvancedSpaceSection,
    }),
    [advancedSpaceLayoutAdapter, spaceLayoutRuntime, renderAdvancedSpaceSection]
  );

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
      <SpaceErrorPanel message={dashboardError} shellVariant="advanced" />

      {/* API Error Display */}
      {hasApiErrors() && (
        <SpaceStatusPanel
          tone="warning"
          shellVariant="advanced"
          title="Some data endpoints are experiencing issues"
          subtitle="Some charts may display limited or no data. Please try again later."
        />
      )}

      {(showChartsTab || (!showChartsTab && !showOnlyInstantChart)) && (
        <SpaceUtilizationContainer
          variant="advanced"
          adapter={advancedSpaceContainerAdapter}
          activeTab={resolveSpaceActiveTab({ showChartsTab })}
          orchestration={orchestration}
          runtime={containerPresentationRuntime}
        />
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

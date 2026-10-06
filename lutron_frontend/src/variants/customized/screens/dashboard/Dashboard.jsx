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
import { createPortal } from 'react-dom'
import {
  getRovingTabIndex,
  handleRovingTablistKeyDown,
} from '../../../../utils/keyboard/rovingTablistKeyboard'
import { registerPageSubNavHandler, requestTopbarNavFocus } from '../../../../utils/keyboard/pageSubNavBridge'
import { isKeyboardNavBlockedTarget } from '../../../../utils/keyboard/keyboardNavUtils'
import { useDispatch, useSelector, useStore, shallowEqual } from 'react-redux'
import { useLocation, useNavigate } from "react-router-dom";

// import AreaGroupFilter from "./AreaGroupFilter";
// import AreaGroupFilter from "../../redux/slice/settingsslice/heatmap/AreaGroupFilter";
import { DndContext, PointerSensor, MouseSensor, TouchSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core'
import { SortableContext, useSortable, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { resolveOccupancySeriesKeyToGroupName } from '../../utils/areaGroupNameLookup'
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
  setIsNavigating,
  setCustomWidgetFilters,
  fetchTotalConsumptionByGroup,
  fetchLightPowerDensity,
  fetchOccupancyCount,
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
  selectSelectedGroupIds,
  selectSelectedDuration,
  selectCustomDateRange,
  selectIsNavigating,
  selectGlobalLoading,
  selectCurrentDate,
  selectCurrentYear,
  selectTotalConsumptionByGroup,
  selectLightPowerDensity,
  selectSavingsByStrategy,
  selectAreaGroups,
  selectDashboardLoading,
  selectDashboardError,
  selectCustomWidgetFilters,
  clearDashboardData,
  clearDataCache,
  buildOccupancyCountSearchParams,
  buildTotalConsumptionByGroupSearchParamsFromApiParams,
} from '../../redux/slice/dashboard/dashboardSlice'

import {
  fetchUnifiedEnergyConsumptionSavingsData,
  selectUnifiedEnergyConsumption,
  selectUnifiedEnergySavings,
  selectUnifiedEnergyConsumptionLoading,
  selectUnifiedEnergySavingsLoading,
  selectUnifiedPeakMinConsumptionLoading
} from '../../redux/slice/dashboard/unifiedEnergySlice'
import { fetchFloors, getLeafByFloorID } from '../../redux/slice/floor/floorSlice'
import { getDashboardOverview, selectDashboardOverview, selectDashboardOverviewLoading, selectDashboardOverviewError } from '../../redux/slice/home/homeSlice'
import { fetchProfile } from '../../redux/slice/auth/userlogin'
import SpaceUtilization from './SpaceUtilization'
import DashboardOverview from './DashboardOverview'
import {
  DASHBOARD_DEFAULT_PATH,
  DASHBOARD_OVERVIEW_ENABLED,
} from '../../utils/dashboardLanding'
import { DASHBOARD_ALERTS_SHELL_CLASS, CUSTOMIZED_TOPBAR_STACK_OFFSET_PX } from '../../utils/scheduleFormLayout'
import { useSyncPanelToTopbar } from '../../utils/useSyncPanelToTopbar'
import EnergyCustomGraphCard from '../../components/dashboard/EnergyCustomGraphCard'
import { readBuiltinWidgetOverrides, normalizeBuiltinApiPath, shouldRenderBuiltinWidgetAsCustomGraph } from '../../utils/builtinWidgetOverrides'
import {
  BUILTIN_CHART_CARD,
  BUILTIN_CHART_HEADER_ROW,
  BUILTIN_CHART_LOADER_HEIGHT,
  BUILTIN_PIE_PLOT_BOX,
  BUILTIN_LINE_PLOT_BOX,
  BUILTIN_COMPACT_PANEL,
  BUILTIN_COMPACT_INNER,
} from '../../utils/advancedBuiltinChartStyles'
import {
  buildDashboardChartAxiosParams,
  pickEnergyBucketTimeParams,
} from '../../utils/buildDashboardChartQueryParams'
import { aggregateEnergyConsumptionApiResponseToTotal } from '../../utils/sumEnergyConsumptionPayload'
import { applyCustomGraphGroupScopedParams } from '../../utils/applyCustomGraphGroupScopedParams'
import { intersectDashboardAreasWithGraphFloorCeiling, readCustomGraphScopeDraft } from '../../utils/mergeCustomGraphScopeIntoApiParams'
import {
  intersectDashboardAndGraphFloors,
  normalizeDashboardFloorIds,
  orderPerFloorIdsByGraphFloorIds,
} from '../../utils/intersectDashboardGraphFloors'
import { resolveDashboardThunkForCustomGraphPath } from '../../utils/dashboardCustomGraphThunkResolver'
import { sumAbsoluteWhFromTotalConsumptionByGroupPayload } from '../../utils/normalizeTotalConsumptionByGroupPayload'
import { getEffectiveBuiltinDashboardPage } from '../../utils/builtinWidgetDashboardPage'
import { Grid, Box, useTheme, useMediaQuery, Snackbar, Alert } from '@mui/material'
import { FileUpload as FileUploadIcon } from '@mui/icons-material'
import Alerts from './Alerts'
import {
  fetchAlertTypes,
  selectAlertTypes,
  selectAlerts,
} from '../../redux/slice/dashboard/alertsSlice'
import { selectApplicationTheme } from '../../redux/slice/theme/themeSlice'
import { UseAuth, isSuperadminRole } from '../../customhooks/UseAuth'
import {
  fetchRenameWidgets,
  getWidgetList,
  fetchEmailConfigs,
  fetchCustomGraphs,
  selectCustomGraphs,
  fetchDashboardChartOrder,
  saveDashboardChartOrder,
  selectDashboardChartOrder,
  selectDashboardChartOrderStatus,
  fetchWidgetConfiguration,
  selectWidgetConfiguration,
  selectWidgetConfigurationStatus,
} from '../../redux/slice/settingsslice/heatmap/groupOccupancySlice'
import { BaseUrl } from '../../BaseUrl'
import { meanOccupancyFromChartPayload } from '../../utils/meanOccupancyFromChartPayload'
import { getFloorDisplayLabel } from '../../utils/floorDisplayLabel'
import { sumEnergySavingsPayload } from '../../utils/sumEnergySavingsPayload'
import {
  buildFloorBucketsFromSelectedAreaIds,
  buildMixedWidgetEnergyFloorBuckets,
} from '../../utils/aggregateEnergyConsumptionByFloorScope'
import { mergeLeafPayloadIntoAreaFloorMap } from '../../utils/mergeLeafPayloadIntoAreaFloorMap'
import {
  buildCustomWidgetFilterFloorBuckets,
  perFloorBucketAxisAndTooltipTitle,
} from '../../utils/customWidgetFloorBuckets'
import {
  formatDateForState,
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
  dispatchFetchWidgetTitlesOnce,
} from '../../../../shared/utils/bootstrapFetchGuards'
import { resolveAlertFilterTypes } from '../../../../shared/alerts/resolveAlertFilterTypes'
import { transformDataForCharts as sharedTransformDataForCharts } from '../../../../shared/dashboard/charts/transforms/transformDataForCharts'
import { formatEnergyXAxisLabel } from '../../../../shared/dashboard/charts/transforms/formatEnergyXAxisLabel'
import { consumptionSavingMergedData as sharedConsumptionSavingMergedData } from '../../../../shared/dashboard/charts/transforms/consumptionSavingMergedData'
import ConsumptionSavingsCombinedChart from '../../../basic/screens/dashboard/ConsumptionSavingsCombinedChart'
import DashboardDurationFilterBar from '../../../basic/screens/dashboard/DashboardDurationFilterBar'
import SavingsByStrategyWidget from '../../../../shared/dashboard/widgets/SavingsByStrategyWidget'
import { CONSUMPTION_SAVINGS_COMBINED_SHELL_VARIANTS } from '../../../../shared/dashboard/widgets/energy/consumptionSavingsCombinedChrome'
import { useAreaTreeSelection } from '../../../../shared/dashboard/hooks/useAreaTreeSelection'
import {
  getAllAreaIdsFromFloor,
  getAllAreasFromGroup as resolveAreasFromGroup,
  shouldSkipLoadAllAreas,
  processFloorPayloadForAreaLoad,
  resolveAreaToggleSelection,
  resolveGroupToggleSelection,
  resolveIntermediateParentToggle,
  resolveFloorDeselectAreas,
} from '../../../../shared/dashboard/filters'
import {
  DashboardWidgetRenderer,
  DashboardContainer,
  useDashboardContainer,
  useDashboardAreaTreeOrchestration,
  customizedDashboardContainerAdapter,
  buildEnergyWidgetRenderContext,
} from '../../../../shared/dashboard/container'
import {
  EnergyLayoutRenderer,
  CUSTOMIZED_LAYOUT_MODE,
  resolveCustomizedSortableGridSx,
} from '../../../../shared/dashboard/container/layout'
import {
  applyAlertTypeToggle,
  createCustomizedTransformDataForCharts,
  buildCustomizedTransformChartOptions,
} from '../../../../shared/dashboard/container/helpers'
import { bindDashboardChartLoader } from '../../../../shared/dashboard/components'
import {
  DashboardAreaTreeInlineStatus,
  DashboardErrorBanner,
  DashboardOperatorNoFloorsPanel,
} from '../../../../shared/dashboard/components/status'
import {
  EnergyChartExportMenuControl,
  resolveCustomizedEnergyExportMenuPreset,
} from '../../../../shared/dashboard/export/components'
import {
  DEFAULT_CONSUMPTION_EXPORT_KEYS,
  DEFAULT_SAVINGS_EXPORT_KEYS,
  createAdvancedGroupExportKeys,
} from '../../../../shared/dashboard/container/hooks/exportMenuState'

function isPerFloorEnergyConsumptionApiPath(pathLower) {
  if (!pathLower) return false
  if (pathLower.includes('energy_consumption')) return true
  if (pathLower.includes('unified_energy_consumption_savings')) return true
  return false
}

function isPerFloorEnergySavingsApiPath(pathLower) {
  if (!pathLower) return false
  return pathLower.includes('energy_savings')
}

/**
 * When a custom widget uses whole floors in `floor_ids` and areas (other floors) in `area_ids`,
 * merged `effectiveQp.floorIds` only lists the whole floors — not floors implied by `area_ids` only.
 * Union those implied floor ids so per-bucket fetches (mixed scope) are not dropped by the filter.
 */
function extendDashboardFloorIdsWithWidgetAreaFloors(
  dFloors,
  widgetScopeDraft,
  areaIdToFloorMap
) {
  const base = normalizeDashboardFloorIds(dFloors)
  const m =
    areaIdToFloorMap instanceof Map
      ? areaIdToFloorMap
      : new Map(Object.entries(areaIdToFloorMap || {}))
  const extra = new Set()
  for (const aid of widgetScopeDraft?.area_ids || []) {
    const n =
      typeof aid === 'number' && !Number.isNaN(aid) ? aid : parseInt(String(aid), 10)
    if (!Number.isFinite(n)) continue
    const f = m.get(n) ?? m.get(String(n))
    const fn = Number(f)
    if (Number.isFinite(fn)) extra.add(fn)
  }
  if (extra.size === 0) return base
  return [...new Set([...base, ...extra])].sort((a, b) => a - b)
}

/** Match Manage Area Groups record shape (floors[].area_ids and/or areas[]). */
function collectAreaIdsFromAreaGroupRecord(group) {
  if (!group || typeof group !== 'object') return []
  const fromFloors = Array.isArray(group.floors)
    ? group.floors.flatMap((f) => f.area_ids || [])
    : []
  if (fromFloors.length > 0) return fromFloors
  if (Array.isArray(group.areas) && group.areas.length > 0) {
    const out = []
    for (const a of group.areas) {
      if (a == null) continue
      const raw =
        typeof a === 'number'
          ? a
          : typeof a === 'object'
            ? a.area_id ?? a.areaId ?? a.id
            : null
      if (raw == null) continue
      const n = typeof raw === 'number' && !Number.isNaN(raw) ? raw : parseInt(String(raw), 10)
      if (Number.isFinite(n)) out.push(n)
    }
    return out
  }
  return []
}

/**
 * Area IDs for custom energy pie/table when the widget inherits dashboard scope (no saved floor_ids/area_ids).
 * Uses dashboard area selection; then group selection (expanded via area groups); else floors; else project (all areas in map).
 */
function resolveAreaIdsForCustomEnergyPieTable(effectiveQp, areaIdToFloorIdMap, areaGroupsState) {
  const norm = (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return []
    const out = []
    for (const x of arr) {
      const n = typeof x === 'number' && !Number.isNaN(x) ? x : parseInt(String(x), 10)
      if (Number.isFinite(n)) out.push(n)
    }
    return out
  }
  const floorIds = norm(effectiveQp?.floorIds)
  const areaIds = norm(effectiveQp?.areaIds)
  if (areaIds.length >= 1) return areaIds

  const groupIds = norm(effectiveQp?.groupIds)
  if (groupIds.length >= 1 && areaGroupsState && typeof areaGroupsState === 'object') {
    const lists = [
      ...(areaGroupsState.special_area_groups || []),
      ...(areaGroupsState.user_area_groups || []),
    ]
    const combined = []
    for (const gid of groupIds) {
      const g = lists.find(
        (x) =>
          x &&
          (x.group_id === gid ||
            x.group_id === Number(gid) ||
            String(x.group_id) === String(gid) ||
            x.id === gid ||
            x.id === Number(gid) ||
            String(x.id) === String(gid))
      )
      if (g) combined.push(...collectAreaIdsFromAreaGroupRecord(g))
    }
    const unique = [...new Set(combined.map((n) => Number(n)).filter((n) => Number.isFinite(n)))]
    if (unique.length >= 1) return unique.sort((x, y) => x - y)
  }

  const m = areaIdToFloorIdMap instanceof Map ? areaIdToFloorIdMap : new Map(Object.entries(areaIdToFloorIdMap || {}))
  if (floorIds.length >= 1) {
    const allow = new Set(floorIds.map(Number))
    const out = []
    const seen = new Set()
    m.forEach((floorId, areaId) => {
      const a = Number(areaId)
      const f = Number(floorId)
      if (!Number.isFinite(a) || !Number.isFinite(f) || !allow.has(f)) return
      if (!seen.has(a)) {
        seen.add(a)
        out.push(a)
      }
    })
    return out.sort((x, y) => x - y)
  }
  const out = []
  const seen = new Set()
  m.forEach((floorId, areaId) => {
    const a = Number(areaId)
    if (Number.isFinite(a) && !seen.has(a)) {
      seen.add(a)
      out.push(a)
    }
  })
  return out.sort((x, y) => x - y)
}

const ChartLoader = bindDashboardChartLoader('customized')

function SortableDashboardItem({
  id,
  disabled,
  showSpanToggle,
  span,
  onToggleSpan,
  showHeightToggle,
  isFullscreen,
  onToggleFullscreen,
  rowSpan,
  children,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled });
  const [isHovered, setIsHovered] = React.useState(false);
  const showControls = Boolean(isFullscreen || isHovered);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : (isFullscreen ? 0.35 : 1),
    cursor: disabled ? 'default' : 'grab',
    touchAction: 'none',
    width: '100%',
    height: 'auto',
    minHeight: 0,
    minWidth: 0,
    position: 'relative',
    boxSizing: 'border-box',
    // Match SpaceUtilization.jsx: when "full width", span the full grid row.
    gridColumn: span === 12 ? '1 / -1' : undefined,
    gridRow: rowSpan && Number(rowSpan) > 1 ? `span ${Number(rowSpan)}` : undefined,
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...(!disabled ? listeners : {})}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {(showSpanToggle || showHeightToggle) ? (
          <div
            style={{
              opacity: showControls ? 1 : 0,
              pointerEvents: showControls ? 'auto' : 'none',
              transition: 'opacity 150ms ease',
            }}
          >
            {showSpanToggle ? (
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (typeof onToggleSpan === 'function') onToggleSpan(id);
                }}
                title={span === 12 ? 'Make half width' : 'Make full width'}
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  zIndex: 5,
                  border: '1px solid rgba(255,255,255,0.25)',
                  background: 'rgba(0,0,0,0.35)',
                  color: '#fff',
                  borderRadius: 999,
                  padding: '4px 8px',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {span === 12 ? '½' : '↔'}
              </button>
            ) : null}
            {showHeightToggle ? (
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (typeof onToggleFullscreen === 'function') onToggleFullscreen(id);
                }}
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                style={{
                  position: 'absolute',
                  top: 36,
                  right: 8,
                  zIndex: 5,
                  border: '1px solid rgba(255,255,255,0.25)',
                  background: 'rgba(0,0,0,0.35)',
                  color: '#fff',
                  borderRadius: 999,
                  padding: '4px 8px',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                ↕
              </button>
            ) : null}
          </div>
        ) : null}
        {children}
      </div>

      {isFullscreen && typeof document !== 'undefined'
        ? createPortal(
            <div
              className="dashboard-fullscreen-overlay"
              onClick={(e) => {
                if (e.target === e.currentTarget && typeof onToggleFullscreen === 'function') {
                  onToggleFullscreen(id);
                }
              }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 999999,
                backgroundColor: 'rgba(0, 0, 0, 0.78)',
                backdropFilter: 'blur(6px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                boxSizing: 'border-box',
              }}
            >
              <div
                className="dashboard-fullscreen-card-modal"
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  maxWidth: '1680px',
                  maxHeight: '94vh',
                  borderRadius: 14,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 0,
                  minWidth: 0,
                  boxShadow: '0 25px 60px rgba(0, 0, 0, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backgroundColor: '#1b2430',
                  filter: 'saturate(1.25) brightness(1.05)',
                }}
              >
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof onToggleFullscreen === 'function') onToggleFullscreen(id);
                  }}
                  title="Close"
                  aria-label="Close"
                  style={{
                    position: 'absolute',
                    top: 14,
                    right: 14,
                    zIndex: 100000,
                    border: '1px solid rgba(255,255,255,0.7)',
                    background: 'rgba(0,0,0,0.75)',
                    color: '#fff',
                    borderRadius: 999,
                    padding: '8px 14px',
                    fontSize: 15,
                    fontWeight: 900,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(6px)',
                  }}
                >
                  ✕
                </button>
                <div
                  className="dashboard-fullscreen-card-inner"
                  style={{
                    flex: 1,
                    minHeight: 0,
                    minWidth: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    boxSizing: 'border-box',
                    padding: '16px',
                  }}
                >
                  {children}
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}

function Dashboard() {
  // Note: Floor filtering is handled automatically by the backend API
  // Operators will only see floors they have been assigned to
  // The /floor/list endpoint uses require_operator_permission_for_scope
  // to filter floors based on user permissions

  const [activeTab, setActiveTab] = useState(DASHBOARD_OVERVIEW_ENABLED ? "overview" : "energy");
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;
  const dashboardTabKeys = useMemo(
    () => (DASHBOARD_OVERVIEW_ENABLED
      ? ['overview', 'energy', 'space-utilization', 'alerts']
      : ['energy', 'space-utilization', 'alerts']),
    []
  );
  const tabRefs = useRef({});
  const isAlertsTab = activeTab === 'alerts';

  useSyncPanelToTopbar(isAlertsTab, `.${DASHBOARD_ALERTS_SHELL_CLASS}`);

  const [energyFullscreenCardId, setEnergyFullscreenCardId] = useState(null);

  function getAreaIdsFromGroup(group) {
    if (!group || typeof group !== 'object') return [];
    const fromFloors = Array.isArray(group.floors)
      ? group.floors.flatMap((f) => f.area_ids || [])
      : [];
    if (fromFloors.length > 0) return fromFloors;
    if (Array.isArray(group.areas) && group.areas.length > 0) {
      const out = [];
      for (const a of group.areas) {
        if (a == null) continue;
        const raw =
          typeof a === 'number'
            ? a
            : typeof a === 'object'
              ? a.area_id ?? a.areaId ?? a.id
              : null;
        if (raw == null) continue;
        const n = typeof raw === 'number' && !Number.isNaN(raw) ? raw : parseInt(String(raw), 10);
        if (Number.isFinite(n)) out.push(n);
      }
      return out;
    }
    return [];
  }

  // Press & hold to start dragging (no Edit/Done toggle).
  // Touchpads often jitter a bit while holding, so use a larger tolerance + sane delay.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { delay: 1000, tolerance: 20 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 1000, tolerance: 20 } }),
    useSensor(PointerSensor, { activationConstraint: { delay: 1000, tolerance: 20 } }),
  );

  const toggleEnergyFullscreen = useCallback((key) => {
    setEnergyFullscreenCardId((prev) => (String(prev) === String(key) ? null : String(key)));
  }, []);

  useEffect(() => {
    if (!energyFullscreenCardId) return;
    const onKeyDown = (e) => {
      if (e?.key === 'Escape') setEnergyFullscreenCardId(null);
    };
    window.addEventListener('keydown', onKeyDown);
    const prevOverflow = document?.body?.style?.overflow;
    if (document?.body?.style) document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      if (document?.body?.style) document.body.style.overflow = prevOverflow || '';
    };
  }, [energyFullscreenCardId]);

  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const store = useStore();

  const handleNavigateToEnergy = () => {
    navigate("/dashboard/energy");
  };

  const handleNavigateToSpace = () => {
    navigate("/dashboard/space-utilization");
  };


  useEffect(() => {
    const path = location.pathname;

    if (path === "/dashboard") {
      setActiveTab(DASHBOARD_OVERVIEW_ENABLED ? "overview" : "energy");
    } else if (path === "/dashboard/alerts") {
      setActiveTab("alerts");
    } else if (path === "/dashboard/energy") {
      setActiveTab("energy");
    } else if (path === "/dashboard/space-utilization") {
      setActiveTab("space-utilization");
    }
  }, [location.pathname]);


  // useEffect(() => {
  //   setActiveTab(getTabFromPath());
  // }, [location.pathname]);

  const theme = useTheme()
  const isMediumScreen = useMediaQuery(theme.breakpoints.up('md'))
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'))
  const isTabletViewport = useMediaQuery(theme.breakpoints.between('sm', 'lg'))

  const chartHeaderStyle = useMemo(() => ({
    margin: 0,
    color: '#fff',
    fontWeight: 600,
    fontFamily: 'inherit',
    fontSize: isLargeScreen ? '18px' : '16px'
  }), [isLargeScreen])

  // User authentication
  const { role: currentUserRole } = UseAuth()
  const isOperator = currentUserRole === 'Operator'
  /** Superadmin may rearrange/resize Energy cards; Admin/Operator see shared layout only. */
  const energyLayoutLocked = !isSuperadminRole(currentUserRole)
  const dashboardChartOrder = useSelector(selectDashboardChartOrder)
  const dashboardChartOrderStatus = useSelector(selectDashboardChartOrderStatus)

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
  const widgetList = useSelector(getWidgetList)
  const customGraphs = useSelector(selectCustomGraphs)
  const widgetConfiguration = useSelector(selectWidgetConfiguration)
  const widgetConfigurationStatus = useSelector(selectWidgetConfigurationStatus)
  const [customGraphData, setCustomGraphData] = useState({})
  const [customGraphLoading, setCustomGraphLoading] = useState({})
  const [customGraphError, setCustomGraphError] = useState({})

  // Selectors and States moved to top to prevent initialization errors
  const areaGroups = useSelector(selectAreaGroups);
  const savingsByStrategy = useSelector(selectSavingsByStrategy);
  const areaTree = useSelector((state) => state.floor.leafData)
  const [persistentAreaNames, setPersistentAreaNames] = useState(new Map());
  const [areaIdToFloorId, setAreaIdToFloorId] = useState(new Map());
  const [currentTreeFloorId, setCurrentTreeFloorId] = useState(null);

  // Accumulate area names as floors are opened/expanded and areaTree changes.
  // This prevents losing names for areas on floors that are no longer the current 'leafData'.
  useEffect(() => {
    // Priority: use floor_id from the tree payload itself, then fall back to currentTreeFloorId
    const fid = areaTree?.floor_id || currentTreeFloorId;

    if (areaTree && fid) {
      setAreaIdToFloorId(prev => {
        const next = new Map(prev);
        let changed = false;
        const walk = (nodes) => {
          if (!Array.isArray(nodes)) return;
          for (const node of nodes) {
            if (node.area_id != null) {
              const aid = Number(node.area_id);
              if (next.get(aid) !== fid) {
                next.set(aid, fid);
                changed = true;
              }
            }
            if (node.children?.length) walk(node.children);
            if (node.areas?.length) walk(node.areas);
          }
        };
        if (areaTree?.tree) walk(areaTree.tree);
        if (areaTree?.areas) walk(areaTree.areas);
        return changed ? next : prev;
      });

      setPersistentAreaNames(prev => {
        let changed = false;
        const next = new Map(prev);

        const walk = (nodes) => {
          if (!Array.isArray(nodes)) return;
          for (const node of nodes) {
            if (!node || typeof node !== 'object') continue;
            if (node.area_id != null) {
              const id = Number(node.area_id);
              const baseLabel = node.name || node.area_name || `Area ${id}`;
              const fullLabel = baseLabel;

              const existing = next.get(id);
              if (existing !== fullLabel) {
                next.set(id, fullLabel);
                next.set(String(node.area_id), fullLabel);
                // Also map the original name to the full label for easy lookup by string
                if (baseLabel) {
                  next.set(baseLabel, fullLabel);
                }
                changed = true;
              }
            }
            if (node.children?.length) walk(node.children);
            if (node.areas?.length) walk(node.areas);
          }
        };
        if (areaTree?.tree) walk(areaTree.tree);
        if (areaTree?.areas) walk(areaTree.areas);
        return changed ? next : prev;
      });
    }
  }, [areaTree, currentTreeFloorId, store]);

  const areaIdToDisplayName = persistentAreaNames;

  /** When Manage Area Groups finish loading, refetch by-group charts so Redux can attach group_ids. */
  const areaGroupScopeSignature = useMemo(() => {
    const lists = [
      ...(areaGroups?.special_area_groups || []),
      ...(areaGroups?.user_area_groups || []),
    ];
    const ids = lists
      .map((g) => g?.group_id ?? g?.id)
      .filter((x) => x != null)
      .map((x) => String(x))
      .sort();
    return ids.join(',');
  }, [areaGroups]);

  const customGraphNeedsAreaGroups = useCallback((apiPath) => {
    const p = String(apiPath || '').trim().toLowerCase()
    if (!p) return false
    // These endpoints often require explicit `group_ids` derived from Manage Area Groups.
    return (
      p.includes('occupancy_by_group') ||
      p.includes('total_consumption/by_group') ||
      p.includes('total_consumption%2fby_group')
    )
  }, [])

  const customWidgetFilters = useSelector(selectCustomWidgetFilters)

  // Retained for energy custom-graph wiring (SpaceUtilization calls its own copy).
  // eslint-disable-next-line no-unused-vars
  const fetchCustomGraphData = useCallback(async (g, qp) => {
    const id = String(g?.id ?? g?.name ?? '')
    const path = String(g?.api_path ?? '').trim()
    if (!id || !path) return
    setCustomGraphLoading((p) => ({ ...p, [id]: true }))
    setCustomGraphError((p) => ({ ...p, [id]: null }))
    try {
      // Ensure area groups are loaded before hitting by-group APIs; otherwise backend can return empty payloads
      // when `group_ids` is omitted (and we can't derive group ids without the areaGroups list).
      if (customGraphNeedsAreaGroups(path)) {
        const hasAny =
          Boolean(areaGroups?.user_area_groups?.length) ||
          Boolean(areaGroups?.special_area_groups?.length)
        const loading = Boolean(store.getState()?.groupOccupancy?.areaGroupsLoading)
        if (!hasAny && !loading) {
          try {
            await dispatch(fetchAreaGroups()).unwrap()
          } catch (e) {
            // If area groups fetch fails, proceed with request anyway (will likely show no data).
          }
        }
      }

      let effectiveQp = applyCustomGraphGroupScopedParams(() => store.getState(), qp, g)
      effectiveQp = intersectDashboardAreasWithGraphFloorCeiling(effectiveQp, g, areaIdToFloorId)
      const graphType = String(g?.graph_type || '').toLowerCase().trim()
      const pathLower = path.toLowerCase()

      // --- CASE: Area Group Widget (Isolated Logic) ---
      if (g?.is_area_group_widget && Array.isArray(g.custom_area_group_ids) && g.custom_area_group_ids.length > 0) {
        const groupIds = g.custom_area_group_ids.filter(id => id !== 37);
        const metric = pathLower.includes('savings') ? 'savings' : (pathLower.includes('occupancy') ? 'occupancy' : 'energy');
        const unit = metric === 'savings' ? '%' : (metric === 'occupancy' ? 'Count' : 'Wh');

        const paramsObj = buildDashboardChartAxiosParams(qp);
        delete paramsObj.group_ids; // Using ID in URL path
        paramsObj.storage = 'custom';

        const results = await Promise.all(
          groupIds.map(async (gid) => {
            try {
              const res = await BaseUrl.get(`/dashboard/custom_area_group/${gid}/occupancy_and_energy`, { params: paramsObj });
              const label = resolveOccupancySeriesKeyToGroupName(gid, areaGroups);
              const d = res.data;
              let mData = null;
              if (metric === 'energy') mData = d.energy ?? d.consumption ?? d.consumption_wh;
              else if (metric === 'occupancy') mData = d.occupancy ?? d.total_occupied;
              else if (metric === 'savings') mData = d.savings ?? d.energy_savings;

              const mUnit = (metric === 'energy' && (d.energy_unit || d.unit)) || unit;
              return { gid, label, data: mData, unit: mUnit };
            } catch (e) {
              return { gid, label: `Group ${gid}`, data: null, unit: unit };
            }
          })
        );

        if (graphType === 'line') {
          // Time series merge: x-axis should be common, y-axis is map of labels -> arrays
          let mergedXAxis = [];
          const series = {};
          results.forEach(r => {
            if (!r.data || typeof r.data !== 'object') return;
            const rd = r.data;
            const x = Array.isArray(rd['x-axis']) ? rd['x-axis'] : [];
            const y = Array.isArray(rd['y-axis']?.data) ? rd['y-axis'].data : (Array.isArray(rd['y-axis']) ? rd['y-axis'] : (Array.isArray(rd) ? rd : []));
            if (x.length > mergedXAxis.length) mergedXAxis = x;
            series[r.label] = y;
          });
          if (mergedXAxis.length === 0) mergedXAxis = [''];
          // Ensure all series have the same length as mergedXAxis
          Object.keys(series).forEach(k => {
            while (series[k].length < mergedXAxis.length) series[k].push(null);
          });

          setCustomGraphData((p) => ({
            ...p,
            [id]: { 'x-axis': mergedXAxis, 'y-axis': series, unit: results[0]?.unit || unit }
          }));
        } else {
          // Bar/Pie summary: x-axis contains group labels, y-axis data contains single totals
          const xAxis = [];
          const values = [];
          results.forEach(r => {
            xAxis.push(r.label);
            const val = Number(r.data) || 0;
            values.push(val);
          });

          setCustomGraphData((p) => ({
            ...p,
            [id]: { 'x-axis': xAxis, 'y-axis': { data: values }, unit: results[0]?.unit || unit }
          }));
        }

        setCustomGraphLoading((p) => ({ ...p, [id]: false }));
        return;
      }

      const widgetScopeDraft = readCustomGraphScopeDraft(g)
      let perFloorFloorIdsRaw = effectiveQp?.floorIds || []
      let perAreaIdsForIteration = Array.isArray(effectiveQp?.areaIds) ? effectiveQp.areaIds : []
      // Priority: Widget explicit settings > Dashboard global filters
      if (widgetScopeDraft.floor_ids.length > 0 || widgetScopeDraft.area_ids.length > 0) {
        perFloorFloorIdsRaw = widgetScopeDraft.floor_ids
        perAreaIdsForIteration = widgetScopeDraft.area_ids

        // If widget only has areas, derive floors for the 'By Floor' aggregation logic
        if (perFloorFloorIdsRaw.length === 0 && perAreaIdsForIteration.length > 0 && areaIdToFloorId) {
          const m = new Map(areaIdToFloorId)
          const fids = new Set()
          perAreaIdsForIteration.forEach(aid => {
            const fid = m.get(Number(aid)) || m.get(String(aid));
            if (fid != null) fids.add(Number(fid));
          })
          perFloorFloorIdsRaw = Array.from(fids)
        }
      }
      const intersected = intersectDashboardAndGraphFloors(qp, g)
      if (intersected != null && intersected.length > 0 && normalizeDashboardFloorIds(qp?.floorIds).length > 0) {
        // Only use intersection if we want to stay within the widget's allowed scope
        // BUT most users expect the dropdown to override. 
        // We'll stick to effectiveQp for now as it already handles the "Project View fallback" logic.
      }
      const perFloorFloorIds = orderPerFloorIdsByGraphFloorIds(perFloorFloorIdsRaw, g?.floor_ids)
      let perFloorMetric = null
      if (isPerFloorEnergyConsumptionApiPath(pathLower)) perFloorMetric = 'consumption'
      else if (isPerFloorEnergySavingsApiPath(pathLower)) perFloorMetric = 'savings'
      else if (pathLower.includes('occupancy_count') && !pathLower.includes('instant')) perFloorMetric = 'occupancy'
      // Line + unified energy path otherwise shows a 24h combined series; bar+line both use per-floor totals here.
      const perGroupIds = effectiveQp?.groupIds || []
      const perAreaIds = perAreaIdsForIteration
      // Custom graphs with inherit scope (no floor_ids / area_ids saved in Widgets) must use the same
      // time-series shape as a normal `/dashboard/energy_*` fetch — not one bar per area/floor.
      // Per-entity aggregation is only for graphs that explicitly limit scope in widget settings.
      const widgetHasExplicitFloorOrAreaScope =
        widgetScopeDraft.floor_ids.length > 0 || widgetScopeDraft.area_ids.length > 0
      const isEnergyBarPieTable =
        graphType === 'bar' ||
        graphType === 'pie' ||
        graphType === 'circular' ||
        graphType === 'table' ||
        graphType === ''
      // Inherit widgets: a bare GET often returns one combined series across all floors. For bar/pie/table,
      // aggregate per dashboard floor/area/group when location is set. Line charts keep the old rule (explicit
      // widget scope only) so they stay a single time series unless limited in Widgets.
      const hasLocationForPerEntity =
        perFloorFloorIds.length >= 1 || perGroupIds.length >= 1 || perAreaIds.length >= 1
      const wantsPerFloorMetricBars =
        (graphType === 'bar' || graphType === 'line' || graphType === 'pie' || graphType === 'circular' || graphType === 'table' || graphType === '') &&
        perFloorMetric != null &&
        effectiveQp &&
        (hasLocationForPerEntity ||
          (isEnergyBarPieTable &&
            (perFloorMetric === 'consumption' || perFloorMetric === 'savings' || perFloorMetric === 'occupancy') &&
            widgetHasExplicitFloorOrAreaScope)) &&
        (graphType !== 'line' || widgetHasExplicitFloorOrAreaScope || perFloorMetric === 'occupancy')

      if (wantsPerFloorMetricBars) {
        const floorsList = store.getState()?.floor?.floors
        const apiEndpoint = perFloorMetric === 'savings' ? '/dashboard/energy_savings' : '/dashboard/energy_consumption'
        const sumPayload =
          perFloorMetric === 'savings' ? sumEnergySavingsPayload : aggregateEnergyConsumptionApiResponseToTotal

        // Widget `area_ids` must map to floors before bucket builders run; partial floors need trees loaded.
        let areaMapForEnergyBuckets = areaIdToFloorId
        if (
          (perFloorMetric === 'consumption' || perFloorMetric === 'savings') &&
          widgetScopeDraft.area_ids.length > 0
        ) {
          const need = []
          for (const x of widgetScopeDraft.area_ids) {
            const n = typeof x === 'number' && !Number.isNaN(x) ? x : parseInt(String(x), 10)
            if (Number.isFinite(n)) need.push(n)
          }
          const uniqueNeed = [...new Set(need)]
          const m = new Map(areaIdToFloorId)
          const isMapped = (id) => m.has(id) || m.has(String(id))
          const stillMissing = () => uniqueNeed.filter((id) => !isMapped(id))
          const floorIdsToFetch = new Set()
          if (Array.isArray(floorsList)) {
            floorsList.forEach((row) => {
              const fid = Number(row?.id)
              if (Number.isFinite(fid)) floorIdsToFetch.add(fid)
            })
          }
          widgetScopeDraft.floor_ids.forEach((raw) => {
            const n = typeof raw === 'number' && !Number.isNaN(raw) ? raw : parseInt(String(raw), 10)
            if (Number.isFinite(n)) floorIdsToFetch.add(n)
          })
          if (uniqueNeed.length > 0 && stillMissing().length > 0 && floorIdsToFetch.size > 0) {
            for (const fid of floorIdsToFetch) {
              if (stillMissing().length === 0) break
              if (!Number.isFinite(Number(fid))) continue
              try {
                const payload = await dispatch(getLeafByFloorID(fid)).unwrap()
                mergeLeafPayloadIntoAreaFloorMap(payload, fid, m)
              } catch (_) {
                // try other floors
              }
            }
            areaMapForEnergyBuckets = m
          }
        }

        const filterEnergyBucketsByDashboardFloors = (buckets) => {
          if (!Array.isArray(buckets) || buckets.length === 0) return buckets
          const dFloors = normalizeDashboardFloorIds(effectiveQp?.floorIds)
          if (dFloors.length === 0) return buckets
          const extended = extendDashboardFloorIdsWithWidgetAreaFloors(
            effectiveQp?.floorIds,
            widgetScopeDraft,
            areaMapForEnergyBuckets
          )
          if (extended.length === 0) return buckets
          const allow = new Set(extended.map(Number))
          return buckets.filter((b) => allow.has(Number(b.floorId)))
        }

        // Order: group → widget explicit scope (consumption only) → dashboard area → dashboard floor.
        // Custom graphs with no widget scope keep the previous dashboard-driven behavior.
        let iterationType = 'floor'
        let items = perFloorFloorIds

        // CASE C: Mixed selection — customWidgetFilters only (isolated from built-in dashboard scope)
        if (
          customWidgetFilters &&
          (customWidgetFilters.floor_ids?.length > 0 || customWidgetFilters.area_ids?.length > 0)
        ) {
          const mergedBuckets = buildCustomWidgetFilterFloorBuckets(
            customWidgetFilters,
            areaMapForEnergyBuckets,
            floorsList
          )
          if (mergedBuckets.length >= 1) {
            iterationType = 'floor_bucket'
            items = mergedBuckets
          }
        } else if (perGroupIds.length >= 1) {
          iterationType = 'group'
          items = perGroupIds
        } else if (
          (perFloorMetric === 'consumption' || perFloorMetric === 'savings') &&
          (widgetScopeDraft.floor_ids.length > 0 || widgetScopeDraft.area_ids.length > 0)
        ) {
          const wf = widgetScopeDraft.floor_ids
          const wa = widgetScopeDraft.area_ids
          if (wf.length > 0 && wa.length > 0) {
            const mixedBuckets = buildMixedWidgetEnergyFloorBuckets(g, areaMapForEnergyBuckets, floorsList)
            if (mixedBuckets.length >= 1) {
              iterationType = 'floor_bucket'
              items = filterEnergyBucketsByDashboardFloors(mixedBuckets)
            } else {
              const floorBuckets = buildFloorBucketsFromSelectedAreaIds(
                wa,
                areaMapForEnergyBuckets,
                floorsList
              )
              if (floorBuckets.length >= 1) {
                iterationType = 'floor_bucket'
                items = filterEnergyBucketsByDashboardFloors(floorBuckets)
              } else {
                iterationType = 'area'
                items = wa
              }
            }
          } else if (wa.length > 0) {
            const floorBuckets = buildFloorBucketsFromSelectedAreaIds(
              wa,
              areaMapForEnergyBuckets,
              floorsList
            )
            if (floorBuckets.length >= 1) {
              iterationType = 'floor_bucket'
              items = filterEnergyBucketsByDashboardFloors(floorBuckets)
            } else {
              iterationType = 'area'
              items = wa
            }
          } else if (wf.length > 0) {
            const intersected = intersectDashboardAndGraphFloors(effectiveQp, g)
            let floorsToIterate = orderPerFloorIdsByGraphFloorIds(wf, g?.floor_ids)
            if (intersected != null) {
              floorsToIterate =
                intersected.length > 0
                  ? orderPerFloorIdsByGraphFloorIds(intersected, g?.floor_ids)
                  : []
            }
            iterationType = 'floor'
            items = floorsToIterate
          }
        } else if (perAreaIds.length >= 1) {
          const floorBuckets = buildFloorBucketsFromSelectedAreaIds(
            perAreaIds,
            areaIdToFloorId,
            floorsList
          )
          if (floorBuckets.length >= 1) {
            iterationType = 'floor_bucket'
            items = floorBuckets
          } else {
            iterationType = 'area'
            items = perAreaIds
          }
        } else if (perFloorFloorIds.length >= 1) {
          iterationType = 'floor'
          items = perFloorFloorIds
        }

        const calculateVal = (raw) => {
          if (perFloorMetric === 'savings') {
            // For savings (%), use mean across time/areas
            if (!raw || typeof raw !== 'object') return 0;
            const y = raw['y-axis'];
            if (y && typeof y === 'object' && !Array.isArray(y)) {
              let total = 0;
              let count = 0;
              for (const arr of Object.values(y)) {
                if (Array.isArray(arr)) {
                  for (const v of arr) {
                    const n = Number(v);
                    if (Number.isFinite(n)) {
                      total += n;
                      count++;
                    }
                  }
                }
              }
              return count > 0 ? total / count : 0;
            }
            if (Array.isArray(raw.savings)) {
              const filtered = raw.savings.map(Number).filter(Number.isFinite);
              return filtered.length > 0 ? filtered.reduce((a, b) => a + b, 0) / filtered.length : 0;
            }
            return 0;
          }
          if (perFloorMetric === 'occupancy') {
            return meanOccupancyFromChartPayload(raw);
          }
          // For consumption (Wh), use sum
          return sumPayload(raw);
        };

        // LINE CHART SPECIAL CASE: fetch full time-series per floor/bucket and merge as separate series
        // instead of aggregating into single totals (which produces a flat line).
        if (graphType === 'line') {
          const extractTimeSeries = (raw) => {
            if (!raw || typeof raw !== 'object') return { xAxis: [], values: [] }
            const x = Array.isArray(raw['x-axis']) ? raw['x-axis'] : []
            const y = raw['y-axis']
            if (y && typeof y === 'object' && !Array.isArray(y)) {
              const firstArr = Object.values(y).find((v) => Array.isArray(v))
              return { xAxis: x, values: firstArr ? firstArr.map((v) => { const n = Number(v); return Number.isFinite(n) ? n : null }) : [] }
            }
            if (Array.isArray(y)) {
              return { xAxis: x, values: y.map((v) => { const n = Number(v); return Number.isFinite(n) ? n : null }) }
            }
            if (Array.isArray(raw.consumption)) {
              return { xAxis: x, values: raw.consumption.map((v) => { const n = Number(v); return Number.isFinite(n) ? n : null }) }
            }
            if (Array.isArray(raw.savings)) {
              return { xAxis: x, values: raw.savings.map((v) => { const n = Number(v); return Number.isFinite(n) ? n : null }) }
            }
            if (Array.isArray(raw.data)) {
              return { xAxis: x, values: raw.data.map((v) => { const n = Number(v); return Number.isFinite(n) ? n : null }) }
            }
            if (Array.isArray(raw.occupancy)) {
              return { xAxis: x, values: raw.occupancy.map((v) => { const n = Number(v); return Number.isFinite(n) ? n : null }) }
            }
            return { xAxis: x, values: [] }
          }

          const lineItems = iterationType === 'floor_bucket' ? items : items.map((itemId) => {
            if (iterationType === 'floor') return { mode: 'floor', floorId: itemId, areaIds: [] }
            if (iterationType === 'area') return { mode: 'areas', floorId: null, areaIds: [itemId] }
            return { mode: 'floor', floorId: itemId, areaIds: [] }
          })

          const perFloorSeries = await Promise.all(
            lineItems.map(async (bucket) => {
              const isFloorMode = bucket.mode === 'floor' && bucket.floorId != null && Number.isFinite(Number(bucket.floorId))
              const isAreaMode = bucket.mode === 'areas' && Array.isArray(bucket.areaIds) && bucket.areaIds.length > 0
              const qpOne = {
                ...effectiveQp,
                areaIds: isAreaMode ? bucket.areaIds : null,
                floorIds: isFloorMode ? [Number(bucket.floorId)] : null,
                groupIds: null,
              }
              const paramsObj = buildDashboardChartAxiosParams(qpOne)
              const res = await BaseUrl.get(apiEndpoint, { params: paramsObj })
              const floorLabel = bucket.floorId != null
                ? getFloorDisplayLabel(floorsList, bucket.floorId)
                : (iterationType === 'area' ? (persistentAreaNames.get(bucket.areaIds?.[0]) || `Area ${bucket.areaIds?.[0]}`) : 'Data')
              const { xAxis, values } = extractTimeSeries(res.data)
              return { label: floorLabel, xAxis, values }
            })
          )

          // Merge into multi-series: use the longest x-axis as the common timeline
          let mergedXAxis = []
          for (const s of perFloorSeries) {
            if (s.xAxis.length > mergedXAxis.length) mergedXAxis = s.xAxis
          }
          if (mergedXAxis.length === 0) mergedXAxis = ['']

          const yAxisMulti = {}
          for (const s of perFloorSeries) {
            const padded = [...s.values]
            while (padded.length < mergedXAxis.length) padded.push(null)
            yAxisMulti[s.label] = padded
          }

          setCustomGraphData((p) => ({
            ...p,
            [id]: {
              'x-axis': mergedXAxis,
              'y-axis': yAxisMulti,
              unit: perFloorMetric === 'savings' ? '%' : (perFloorMetric === 'occupancy' ? 'Count' : 'Wh'),
            },
          }))
          setCustomGraphLoading((p) => ({ ...p, [id]: false }))
          return
        }

        let combined
        if (iterationType === 'floor_bucket') {
          const qpBaseForBuckets =
            perFloorMetric === 'consumption'
              ? pickEnergyBucketTimeParams(effectiveQp)
              : effectiveQp
          combined = await Promise.all(
            items.map(async (bucket) => {
              const hasAreaIds =
                bucket.mode === 'areas' &&
                Array.isArray(bucket.areaIds) &&
                bucket.areaIds.length > 0
              const hasFloorId =
                bucket.mode === 'floor' &&
                bucket.floorId != null &&
                Number.isFinite(Number(bucket.floorId))
              const qpOne = {
                ...qpBaseForBuckets,
                areaIds: hasAreaIds ? bucket.areaIds : null,
                floorIds: hasFloorId ? [Number(bucket.floorId)] : null,
                groupIds: null,
              }
              const paramsObj = buildDashboardChartAxiosParams(qpOne)
              const res = await BaseUrl.get(apiEndpoint, { params: paramsObj })
              const { label, tooltipTitle } = perFloorBucketAxisAndTooltipTitle(
                bucket,
                floorsList,
                areaIdToDisplayName
              )
              return {
                label,
                tooltipTitle,
                total: calculateVal(res.data),
              }
            })
          )
        } else {
          combined = await Promise.all(
            items.map(async (id) => {
              const qpOne = {
                ...effectiveQp,
                areaIds: iterationType === 'area' ? [id] : null,
                floorIds: iterationType === 'floor' ? [id] : null,
                groupIds:
                  iterationType === 'group'
                    ? [id]
                    : iterationType === 'floor' &&
                      Array.isArray(effectiveQp?.groupIds) &&
                      effectiveQp.groupIds.length > 0
                      ? effectiveQp.groupIds
                      : null,
              }
              const paramsObj = buildDashboardChartAxiosParams(qpOne)
              const res = await BaseUrl.get(apiEndpoint, { params: paramsObj })

              const label = iterationType === 'area'
                ? (persistentAreaNames.get(id) || `Area ${id}`)
                : iterationType === 'floor'
                  ? getFloorDisplayLabel(floorsList, id)
                  : (() => {
                    const gRec = [...(areaGroups?.user_area_groups || []), ...(areaGroups?.special_area_groups || [])].find(x => x.id === id || x.group_id === id);
                    return gRec?.name || `Group ${id}`;
                  })();

              return {
                label,
                total: calculateVal(res.data),
              }
            })
          )
        }
        let overallTotal
        if (perFloorMetric === 'savings') {
          const valid = combined.map((x) => x.total).filter(Number.isFinite)
          overallTotal =
            valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : 0
        } else {
          overallTotal = combined.reduce((sum, item) => sum + (item.total || 0), 0)
        }

        setCustomGraphData((p) => ({
          ...p,
          [id]: {
            'x-axis': combined.map((r) => r.label),
            'y-axis': (() => {
              const multi = {};
              combined.forEach((r, i) => {
                const vals = new Array(combined.length).fill(null);
                vals[i] = r.total === null || r.total === undefined ? null : r.total;
                multi[r.label] = vals;
              });
              return multi;
            })(),
            __isPerFloorEnergyData: true,
            __perFloorTooltipTitles: combined.map((r) => r.tooltipTitle ?? r.label),
            unit: perFloorMetric === 'savings' ? '%' : 'Wh',
            overallTotal,
            __perFloorOverallAggregate: perFloorMetric === 'savings' ? 'mean' : 'sum',
          },
        }))
        setCustomGraphLoading((p) => ({ ...p, [id]: false }))
        return
      }

      // Custom graph: inherit widget scope (no floor_ids/area_ids in Widgets) + pie/table/circular energy —
      // aggregate by area so slices/rows show area names, not 1st/2nd/3rd Floor from a single API response.
      const wantsPerAreaEnergyPieTableInherit =
        (graphType === 'pie' || graphType === 'circular' || graphType === 'table') &&
        perFloorMetric != null &&
        effectiveQp &&
        !widgetHasExplicitFloorOrAreaScope

      if (wantsPerAreaEnergyPieTableInherit) {
        const areaIdsForSlices = resolveAreaIdsForCustomEnergyPieTable(effectiveQp, areaIdToFloorId, areaGroups)
        if (areaIdsForSlices.length >= 1) {
          const apiEndpoint = perFloorMetric === 'savings' ? '/dashboard/energy_savings' : '/dashboard/energy_consumption'
          const sumPayload =
            perFloorMetric === 'savings'
              ? sumEnergySavingsPayload
              : (raw) => {
                if (!raw || typeof raw !== 'object') return 0
                const y = raw['y-axis']
                if (y && typeof y === 'object' && !Array.isArray(y)) {
                  let total = 0
                  for (const arr of Object.values(y)) {
                    if (Array.isArray(arr)) {
                      for (const v of arr) {
                        const n = Number(v)
                        total += Number.isFinite(n) ? n : 0
                      }
                    }
                  }
                  return total
                }
                if (Array.isArray(raw.consumption)) {
                  return raw.consumption.reduce((acc, v) => acc + (Number(v) || 0), 0)
                }
                return 0
              }

          const floorsListInherit = store.getState()?.floor?.floors
          const inheritBuckets =
            (perFloorMetric === 'consumption' || perFloorMetric === 'savings')
              ? buildFloorBucketsFromSelectedAreaIds(
                areaIdsForSlices,
                areaIdToFloorId,
                floorsListInherit
              )
              : []

          const calculateInheritVal = (raw) => {
            if (perFloorMetric === 'savings') {
              if (!raw || typeof raw !== 'object') return 0
              const y = raw['y-axis']
              if (y && typeof y === 'object' && !Array.isArray(y)) {
                let total = 0
                let count = 0
                for (const arr of Object.values(y)) {
                  if (Array.isArray(arr)) {
                    for (const v of arr) {
                      const n = Number(v)
                      if (Number.isFinite(n)) {
                        total += n
                        count++
                      }
                    }
                  }
                }
                return count > 0 ? total / count : 0
              }
              if (Array.isArray(raw.savings)) {
                const filtered = raw.savings.map(Number).filter(Number.isFinite)
                return filtered.length > 0 ? filtered.reduce((a, b) => a + b, 0) / filtered.length : 0
              }
              return 0
            }
            return sumPayload(raw)
          }

          let combined
          const qpBaseInherit =
            perFloorMetric === 'consumption'
              ? pickEnergyBucketTimeParams(effectiveQp)
              : effectiveQp
          if (inheritBuckets.length >= 1) {
            combined = await Promise.all(
              inheritBuckets.map(async (bucket) => {
                const hasAreaIds =
                  bucket.mode === 'areas' &&
                  Array.isArray(bucket.areaIds) &&
                  bucket.areaIds.length > 0
                const hasFloorId =
                  bucket.mode === 'floor' &&
                  bucket.floorId != null &&
                  Number.isFinite(Number(bucket.floorId))
                const qpOne = {
                  ...qpBaseInherit,
                  areaIds: hasAreaIds ? bucket.areaIds : null,
                  floorIds: hasFloorId ? [Number(bucket.floorId)] : null,
                  groupIds: null,
                }
                const paramsObj = buildDashboardChartAxiosParams(qpOne)
                const res = await BaseUrl.get(apiEndpoint, { params: paramsObj })
                const { label, tooltipTitle } = perFloorBucketAxisAndTooltipTitle(
                  bucket,
                  floorsListInherit,
                  areaIdToDisplayName
                )
                return {
                  label,
                  tooltipTitle,
                  total: calculateInheritVal(res.data),
                }
              })
            )
          } else {
            combined = await Promise.all(
              areaIdsForSlices.map(async (aid) => {
                const qpOne = {
                  ...effectiveQp,
                  areaIds: [aid],
                  floorIds: null,
                  groupIds: null,
                }
                const paramsObj = buildDashboardChartAxiosParams(qpOne)
                const res = await BaseUrl.get(apiEndpoint, { params: paramsObj })

                const label =
                  areaIdToDisplayName instanceof Map
                    ? areaIdToDisplayName.get(aid) ||
                    areaIdToDisplayName.get(String(aid)) ||
                    `Area ${aid}`
                    : (areaIdToDisplayName && areaIdToDisplayName[aid]) || `Area ${aid}`

                return {
                  label,
                  tooltipTitle: label,
                  total: calculateInheritVal(res.data),
                }
              })
            )
          }
          let overallTotalInherit
          if (perFloorMetric === 'savings') {
            const valid = combined.map((x) => x.total).filter(Number.isFinite)
            overallTotalInherit =
              valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : 0
          } else {
            overallTotalInherit = combined.reduce(
              (sum, item) => sum + (item.total || 0),
              0
            )
          }

          setCustomGraphData((p) => ({
            ...p,
            [id]: {
              'x-axis': combined.map((r) => r.label),
              'y-axis': {
                data: combined.map((r) =>
                  r.total === null || r.total === undefined ? null : r.total
                ),
              },
              __isPerFloorEnergyData: true,
              __perFloorTooltipTitles: combined.map((r) => r.tooltipTitle ?? r.label),
              unit: perFloorMetric === 'savings' ? '%' : 'Wh',
              overallTotal: overallTotalInherit,
              __perFloorOverallAggregate:
                perFloorMetric === 'savings' ? 'mean' : 'sum',
            },
          }))
          setCustomGraphLoading((p) => ({ ...p, [id]: false }))
          return
        }
      }

      const occupancyUsesCustomWidgetLocation =
        pathLower.includes('occupancy_count') &&
        !pathLower.includes('instant_occupancy_count') &&
        effectiveQp &&
        customWidgetFilters &&
        (customWidgetFilters.floor_ids?.length > 0 ||
          customWidgetFilters.area_ids?.length > 0) &&
        (graphType === 'bar' ||
          graphType === 'pie' ||
          graphType === 'circular' ||
          graphType === 'table' ||
          graphType === '')

      if (occupancyUsesCustomWidgetLocation) {
        const floorsListOcc = store.getState()?.floor?.floors
        const buckets = buildCustomWidgetFilterFloorBuckets(
          customWidgetFilters,
          areaIdToFloorId,
          floorsListOcc
        )
        if (buckets.length >= 1) {
          const combined = await Promise.all(
            buckets.map(async (bucket) => {
              const hasAreaIds =
                bucket.mode === 'areas' &&
                Array.isArray(bucket.areaIds) &&
                bucket.areaIds.length > 0
              const hasFloorId =
                bucket.mode === 'floor' &&
                bucket.floorId != null &&
                Number.isFinite(Number(bucket.floorId))
              const params = buildOccupancyCountSearchParams({
                ...effectiveQp,
                areaIds: hasAreaIds ? bucket.areaIds : null,
                floorIds: hasFloorId ? [Number(bucket.floorId)] : null,
                groupIds: null,
              })
              const res = await BaseUrl.get(`/dashboard/occupancy_count?${params}`)
              const { label, tooltipTitle } = perFloorBucketAxisAndTooltipTitle(
                bucket,
                floorsListOcc,
                areaIdToDisplayName
              )
              return {
                label,
                tooltipTitle,
                mean: meanOccupancyFromChartPayload(res.data),
              }
            })
          )
          setCustomGraphData((p) => ({
            ...p,
            [id]: {
              'x-axis': combined.map((r) => r.label),
              'y-axis': {
                data: combined.map((r) =>
                  r.mean === null || r.mean === undefined ? null : r.mean
                ),
              },
              __isPerFloorEnergyData: true,
              __perFloorTooltipTitles: combined.map((r) => r.tooltipTitle ?? r.label),
            },
          }))
          setCustomGraphLoading((p) => ({ ...p, [id]: false }))
          return
        }
      }

      // Settings → Widgets: same graph with both whole floors and specific areas (non–instant occupancy)
      if (
        pathLower.includes('occupancy_count') &&
        !pathLower.includes('instant_occupancy_count') &&
        effectiveQp &&
        widgetScopeDraft.floor_ids.length > 0 &&
        widgetScopeDraft.area_ids.length > 0 &&
        (graphType === 'bar' ||
          graphType === 'pie' ||
          graphType === 'circular' ||
          graphType === 'table' ||
          graphType === '')
      ) {
        const floorsListWidgetOcc = store.getState()?.floor?.floors
        const mixedWidgetOccBuckets = buildMixedWidgetEnergyFloorBuckets(g, areaIdToFloorId, floorsListWidgetOcc)
        const rawOccFloors = normalizeDashboardFloorIds(effectiveQp?.floorIds)
        const dFloorsForOcc =
          rawOccFloors.length > 0
            ? extendDashboardFloorIdsWithWidgetAreaFloors(
              effectiveQp?.floorIds,
              widgetScopeDraft,
              areaIdToFloorId
            )
            : rawOccFloors
        const filteredWidgetOcc =
          dFloorsForOcc.length > 0
            ? mixedWidgetOccBuckets.filter((b) => dFloorsForOcc.includes(Number(b.floorId)))
            : mixedWidgetOccBuckets
        if (filteredWidgetOcc.length >= 1) {
          const combined = await Promise.all(
            filteredWidgetOcc.map(async (bucket) => {
              const hasAreaIds =
                bucket.mode === 'areas' &&
                Array.isArray(bucket.areaIds) &&
                bucket.areaIds.length > 0
              const hasFloorId =
                bucket.mode === 'floor' &&
                bucket.floorId != null &&
                Number.isFinite(Number(bucket.floorId))
              const params = buildOccupancyCountSearchParams({
                ...effectiveQp,
                areaIds: hasAreaIds ? bucket.areaIds : null,
                floorIds: hasFloorId ? [Number(bucket.floorId)] : null,
                groupIds: null,
              })
              const res = await BaseUrl.get(`/dashboard/occupancy_count?${params}`)
              const { label, tooltipTitle } = perFloorBucketAxisAndTooltipTitle(
                bucket,
                floorsListWidgetOcc,
                areaIdToDisplayName
              )
              return {
                label,
                tooltipTitle,
                mean: meanOccupancyFromChartPayload(res.data),
              }
            })
          )
          setCustomGraphData((p) => ({
            ...p,
            [id]: {
              'x-axis': combined.map((r) => r.label),
              'y-axis': {
                data: combined.map((r) =>
                  r.mean === null || r.mean === undefined ? null : r.mean
                ),
              },
              __isPerFloorEnergyData: true,
              __perFloorTooltipTitles: combined.map((r) => r.tooltipTitle ?? r.label),
            },
          }))
          setCustomGraphLoading((p) => ({ ...p, [id]: false }))
          return
        }
      }

      const isOccupancyCountMultiFloor =
        pathLower.includes('occupancy_count') &&
        !pathLower.includes('instant_occupancy_count') &&
        effectiveQp &&
        Array.isArray(effectiveQp.floorIds) &&
        effectiveQp.floorIds.length > 1 &&
        !(
          widgetScopeDraft.floor_ids.length > 0 && widgetScopeDraft.area_ids.length > 0
        )

      if (isOccupancyCountMultiFloor) {
        const floorsList = store.getState()?.floor?.floors
        const combined = await Promise.all(
          effectiveQp.floorIds.map(async (fid) => {
            const params = buildOccupancyCountSearchParams({
              ...effectiveQp,
              areaIds: null,
              floorIds: [fid],
              groupIds: effectiveQp.groupIds?.length ? effectiveQp.groupIds : null,
            })
            const res = await BaseUrl.get(`/dashboard/occupancy_count?${params}`)
            return {
              floorLabel: getFloorDisplayLabel(floorsList, fid),
              mean: meanOccupancyFromChartPayload(res.data),
            }
          })
        )
        setCustomGraphData((p) => ({
          ...p,
          [id]: {
            'x-axis': combined.map((r) => r.floorLabel),
            'y-axis': {
              data: combined.map((r) =>
                r.mean === null || r.mean === undefined ? null : r.mean
              ),
            },
          },
        }))
        return
      }

      const isTotalConsumptionByGroupMultiFloor =
        (pathLower.includes('total_consumption/by_group') ||
          pathLower.includes('total_consumption%2fby_group')) &&
        effectiveQp &&
        Array.isArray(effectiveQp.floorIds) &&
        effectiveQp.floorIds.length > 1 &&
        (graphType === 'bar' || graphType === 'line' || graphType === 'pie' || graphType === 'circular' || graphType === '')

      if (isTotalConsumptionByGroupMultiFloor) {
        const floorsList = store.getState()?.floor?.floors
        const orderedFloors = orderPerFloorIdsByGraphFloorIds(
          normalizeDashboardFloorIds(effectiveQp.floorIds),
          g?.floor_ids
        )
        if (orderedFloors.length >= 2) {
          const combined = await Promise.all(
            orderedFloors.map(async (fid) => {
              const qpOne = {
                ...effectiveQp,
                areaIds: null,
                floorIds: [fid],
              }
              const params = buildTotalConsumptionByGroupSearchParamsFromApiParams(
                store.getState,
                qpOne
              )
              const res = await BaseUrl.get(`/dashboard/total_consumption/by_group?${params}`)
              return {
                floorLabel: getFloorDisplayLabel(floorsList, fid),
                totalWh: sumAbsoluteWhFromTotalConsumptionByGroupPayload(res.data),
              }
            })
          )
          setCustomGraphData((p) => ({
            ...p,
            [id]: {
              'x-axis': combined.map((r) => r.floorLabel),
              'y-axis': {
                data: combined.map((r) =>
                  r.totalWh === null || r.totalWh === undefined ? null : r.totalWh
                ),
              },
              unit: 'Wh',
              widget_title: g?.name,
            },
          }))
          return
        }
      }

      const rule = resolveDashboardThunkForCustomGraphPath(path)
      if (rule && effectiveQp) {
        const arg = rule.mapArgs ? rule.mapArgs(effectiveQp) : effectiveQp
        await dispatch(rule.thunk(arg)).unwrap()
        const data = rule.select(store.getState())
        setCustomGraphData((p) => ({ ...p, [id]: data }))
      } else {
        const paramsObj = buildDashboardChartAxiosParams(effectiveQp)
        const res = await BaseUrl.get(path, { params: paramsObj })
        setCustomGraphData((p) => ({ ...p, [id]: res.data }))
      }
    } catch (e) {
      setCustomGraphError((p) => ({ ...p, [id]: e?.message || 'Failed to load' }))
    } finally {
      setCustomGraphLoading((p) => ({ ...p, [id]: false }))
    }
  }, [dispatch, store, customGraphNeedsAreaGroups, areaIdToDisplayName, areaGroups, areaIdToFloorId, customWidgetFilters])

  // Local state for multi-select dropdown
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedAlertTypes, setSelectedAlertTypes] = useState([])
  const [filterKey, setFilterKey] = useState(0) // Force re-render key
  const focusAlertFromLocation = location.state?.focusAlert || null
  const [reloadTrigger, setReloadTrigger] = useState(0) // Trigger for automatic reload on login
  const [, setBuiltinOverridesTick] = useState(0)
  const dropdownRef = useRef(null)
  const areaDropdownRef = useRef(null) // Add ref for area dropdown
  const areaTreeContainerRef = useRef(null) // Add ref for area tree container
  const previousApiParamsRef = useRef(null)

  // Redux selectors
  const floors = useSelector((state) => state.floor.floors)
  const floorStatus = useSelector((state) => state.floor.status)

  const floorLoading = useSelector((state) => state.floor.loading)

  const selectedFloor = useSelector(selectSelectedFloor)
  const selectedAreas = useSelector(selectSelectedAreas)

  // Proactively resolve floor->area mappings for selected areas in dashboard/graphs
  useEffect(() => {
    // Collect area IDs from dashboard filter + from any custom graph widget-specific scope
    const allAreaIds = Array.isArray(selectedAreas) ? selectedAreas.map(Number) : [];
    if (Array.isArray(customGraphs)) {
      customGraphs.forEach(c => {
        if (Array.isArray(c.area_ids)) {
          allAreaIds.push(...c.area_ids.map(Number));
        }
      });
    }
    const uniqueAreaIds = [...new Set(allAreaIds)];

    if (floors.length > 0 && uniqueAreaIds.length > 0) {
      const missing = uniqueAreaIds.filter(id => !areaIdToFloorId.has(id));
      if (missing.length > 0) {
        const resolveAll = async () => {
          for (const f of floors) {
            const stillMissing = uniqueAreaIds.filter(id => !areaIdToFloorId.has(id));
            if (stillMissing.length === 0) break;
            setCurrentTreeFloorId(f.id);
            await dispatch(getLeafByFloorID(f.id));
          }
        };
        resolveAll();
      }
    }
  }, [floors, selectedAreas, customGraphs, areaIdToFloorId.size, dispatch]);

  const selectedFloorIds = useSelector(selectSelectedFloorIds) // Add this to get floor IDs from Redux
  const selectedGroupIds = useSelector(selectSelectedGroupIds)

  // User profile for email functionality and floor filtering
  const userProfile = useSelector((state) => state.user?.profile)
  const profileLoading = useSelector((state) => state.user?.profileLoading)



  const {
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

  const [showAreaDropdown, setShowAreaDropdown] = useState(false)
  const [expandedNodes, setExpandedNodes] = useState(new Set())

  const getAllAreasFromGroupOverride = useCallback(
    (groupId) =>
      resolveAreasFromGroup(groupId, {
        areaTree,
        areaGroups,
        searchTree: true,
        resolveGroupRecordAreas: getAreaIdsFromGroup,
      }),
    [areaTree, areaGroups]
  );

  const {
    getAreasForFloor,
    getAllAreasFromGroup,
    getAllChildAreaIds,
    checkIfChildrenSelected,
    checkIfAllChildrenSelected,
    applyAreaTreeClearAll,
    applyAreaTreeSet,
    getAreaSelectionText,
  } = useDashboardAreaTreeOrchestration({
    variant: 'customized',
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
    clearAllOptions: { includeCustomWidgetFilters: true },
    selectAllContextExtras: { areaIdToFloorId },
    selectionTextExtras: { areaGroups, selectedGroupIds },
    getAllAreasFromGroupOverride,
    extraReduxActions: { setCustomWidgetFilters },
  });

  // Separate state for floor expansion (independent of floor selection)
  const [, setExpandedFloorIds] = useState(new Set());

  // Fetch user profile on component mount (Topbar may already own this)
  useEffect(() => {
    dispatchFetchProfileOnce(dispatch, fetchProfile);
  }, [dispatch]);

  useEffect(() => {
    const handler = () => {
      dispatchFetchWidgetTitlesOnce(dispatch, fetchRenameWidgets, { force: true });
    };

    window.addEventListener("widgetTitlesUpdated", handler);

    return () => {
      window.removeEventListener("widgetTitlesUpdated", handler);
    };
  }, [dispatch]);

  useEffect(() => {
    const onBuiltinOv = () => setBuiltinOverridesTick((t) => t + 1);
    window.addEventListener("builtinWidgetOverridesUpdated", onBuiltinOv);
    return () => window.removeEventListener("builtinWidgetOverridesUpdated", onBuiltinOv);
  }, []);

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
  // Use shallowEqual to prevent re-renders when other Redux state changes
  const energyConsumption = useSelector(selectUnifiedEnergyConsumption, shallowEqual)
  const energySavings = useSelector(selectUnifiedEnergySavings, shallowEqual)
  const energyConsumptionLoading = useSelector(selectUnifiedEnergyConsumptionLoading)
  const energySavingsLoading = useSelector(selectUnifiedEnergySavingsLoading)
  const peakMinConsumptionLoading = useSelector(selectUnifiedPeakMinConsumptionLoading)

  const customStartDate = useSelector((state) => state.dashboard.customStartDate) || '';
  const customEndDate = useSelector((state) => state.dashboard.customEndDate) || '';

  const totalConsumptionByGroup = useSelector(selectTotalConsumptionByGroup)
  const lightPowerDensity = useSelector(selectLightPowerDensity)
  const dashboardLoading = useSelector(selectDashboardLoading)
  const dashboardError = useSelector(selectDashboardError)

  const appTheme = useSelector(selectApplicationTheme);
  const backgroundColor = appTheme?.application_theme?.background || '#d2c4a2';
  const contentColor = appTheme?.application_theme?.content || 'rgba(128, 120, 100, 0.7)';
  const buttonColor = appTheme?.application_theme?.button || '#232323'


  // Navigation state selectors
  const currentDate = useSelector(selectCurrentDate)
  const currentYear = useSelector(selectCurrentYear)

  const overviewData = useSelector(selectDashboardOverview)
  const overviewLoading = useSelector(selectDashboardOverviewLoading)
  const overviewError = useSelector(selectDashboardOverviewError)
  // const navigate = useNavigate()

  // Local state
  // const [activeTab, setActiveTab] = useState('overview') // Default to "Overview" tab

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

  const [, setSelectedMonthForData] = useState(() => {
    const now = new Date()
    return {
      year: now.getFullYear(),
      month: now.getMonth()
    }
  })
  const [, setShowDurationDropdown] = useState(false)

  // Close area dropdown / floor tree when clicking outside (capture phase — dashboard shell uses stopPropagation on click).
  useEffect(() => {
    if (!showAreaDropdown) return;

    const handleClickOutside = (event) => {
      if (areaDropdownRef.current?.contains(event.target)) return;

      setShowAreaDropdown(false);
      if (expandedFloorId !== null) {
        setExpandedFloorId(null);
        setExpandedNodes(new Set());
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside, true);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [expandedFloorId, showAreaDropdown]);

  const [lightingUnit, setLightingUnit] = useState('Watt / Sq ft') // Add this for lighting power density unit
  const [allAreasLoaded, setAllAreasLoaded] = useState(false) // Track if all areas have been loaded
  const isInitialLoad = useRef(true) // Track if this is the initial load

  // Unified loading state - show single loader during navigation
  const [, setIsDataLoading] = useState(false)

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

  const orchestration = useDashboardContainer(customizedDashboardContainerAdapter, {
    locationPathname: location.pathname,
    getEffectiveBuiltinDashboardPage,
    dispatch,
    fetchRenameWidgets,
    fetchCustomGraphs,
    fetchWidgetConfiguration,
    widgetConfiguration,
    widgetConfigurationStatus,
    saveDashboardChartOrder,
    energyLayoutLocked,
    widgetList,
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
      shouldShowEnergyWidget,
      isSpaceCombinedVisible,
      setEnergyCardOrder,
      setEnergyCardSpan,
      getEnergyCardCol,
      resolveEnergyCardLayout,
      writeEnergyCardOrder,
      writeEnergyCardSpan,
      hydrateEnergyLayoutFromApi,
      energyGridColumnTemplate,
      widgetVisibility,
    },
    widgets: {
      chartLoading,
      setChartLoading,
      allEnergyChartsReady,
      energyWidgetTitles,
      getWidgetTitle,
      getWidgetTitleWithAliases,
      totalConsumptionGroupAliases,
      memoizedEnergyConsumption,
      memoizedEnergySavings,
      consumptionColors,
      savingsColors,
      consumptionIsLoading,
      savingsIsLoading,
      embeddedSavingsByStrategyLoading,
      energyCustomNeedsDates,
      startEnergyTabLoading,
      completeEnergyWidgetLoading,
      planEnergyTabApiCalls,
    },
    dates: {
      dateParams,
      handlePrevious,
      handleNext,
      getCurrentPeriodText,
    },
    exports: {
      exportDropdownRefs,
      showExportDropdown,
      setShowExportDropdown,
      exportLoading,
      handleConsumptionEmail,
      handleConsumptionDownload,
      handleSavingsEmail,
      handleSavingsDownload,
      handleConsumptionByGroupEmail,
      handleConsumptionByGroupDownload,
      handleEnergyCustomGraphExport,
    },
  } = orchestration

  const {
    consumption: consumptionTitle,
    savings: savingsTitle,
    savingsByStrategy: savingsByStrategyTitle,
  } = energyWidgetTitles

  const toggleEnergyCardSpan = useCallback(
    (key) => {
      if (energyLayoutLocked) return;
      setEnergyCardSpan((prev) => {
        const next = prev && typeof prev === 'object' && !Array.isArray(prev) ? { ...prev } : {};
        const cur = next?.[key];
        const curSpan = cur === 12 || cur === '12' ? 12 : 6;
        next[key] = curSpan === 12 ? 6 : 12;
        writeEnergyCardSpan(next);
        return next;
      });
    },
    [energyLayoutLocked, setEnergyCardSpan, writeEnergyCardSpan]
  )

  useEffect(() => {
    dispatch(fetchDashboardChartOrder())
  }, [dispatch])

  useEffect(() => {
    if (dashboardChartOrderStatus !== 'succeeded') return
    const blob = dashboardChartOrder?.customized_dashboard_order
    if (blob && typeof hydrateEnergyLayoutFromApi === 'function') {
      hydrateEnergyLayoutFromApi(blob)
    }
  }, [dashboardChartOrder, dashboardChartOrderStatus, hydrateEnergyLayoutFromApi])

  // Email dialog handlers - removed as emails are now sent directly to logged-in user

  // Fetch alert options/data when Alerts tab is active (force so Settings toggles apply)
  useEffect(() => {
    if (activeTab === 'alerts') {
      dispatchFetchAlertTypesOnce(dispatch, fetchAlertTypes, { force: true })
      // Note: fetchActiveAlerts is handled by the Alerts component itself
    }
  }, [activeTab, dispatch])

  useEffect(() => {
    if (!focusAlertFromLocation) return

    if (activeTab !== 'alerts') {
      setActiveTab('alerts')
    }
    setSelectedAlertTypes([])
    setFilterKey(prev => prev + 1)
  }, [focusAlertFromLocation, activeTab])

  // Fetch rename widgets when Dashboard mounts (only if not already loaded)
  useEffect(() => {
    if (!widgetList || (Array.isArray(widgetList) && widgetList.length === 0) || (widgetList && !widgetList.titles)) {
      dispatchFetchWidgetTitlesOnce(dispatch, fetchRenameWidgets)
    }
  }, [dispatch, widgetList])

  useEffect(() => {
    dispatchFetchCustomGraphsOnce(dispatch, fetchCustomGraphs)
  }, [dispatch])

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
  // (role / isOperator / energyLayoutLocked declared with UseAuth above)

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

  // useEffect(() => {
  //   if (hasAutoSelectedDefaultFloorRef.current) return;
  //   const available = getAvailableFloors();
  //   if (!available.length) return;
  //   if (
  //     selectedFloorIds.length > 0 ||
  //     selectedAreas.length > 0 ||
  //     selectedGroupIds.length > 0
  //   ) {
  //     return;
  //   }
  //   const sorted = [...available].sort(
  //     (a, b) => Number(a?.id ?? 0) - Number(b?.id ?? 0)
  //   );
  //   const firstId = sorted[0]?.id;
  //   if (firstId == null) return;
  //   hasAutoSelectedDefaultFloorRef.current = true;
  //   dispatch(setSelectedFloorIds([firstId]));
  //   setLocalSelectedFloorIds([firstId]);
  //   setFloorsWithSelectedAreas(new Set([firstId]));
  // }, [
  //   floors,
  //   userProfile,
  //   currentUserRole,
  //   selectedFloorIds.length,
  //   selectedAreas.length,
  //   selectedGroupIds.length,
  //   dispatch,
  // ]);

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
    if (availableFloors.length > 0 && (!allAreasLoaded || areaIdToFloorId.size === 0)) {
      loadAllAreasFromAllFloors()
    }
  }, [floors, userProfile, allAreasLoaded, selectedAreas.length])

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
          variant: 'customized',
          areaIdToFloorIdSize: areaIdToFloorId.size,
          persistentAreaNamesSize: persistentAreaNames.size,
        })
      ) {
        return;
      }

      loadAllAreasInFlightRef.current = true;
      const allAreaIds = [];
      const availableFloors = getAvailableFloors();

      for (const floor of availableFloors) {
        const result = await dispatch(getLeafByFloorID(floor.id));

        if (result.payload && (result.payload.tree || result.payload.areas)) {
          const processed = processFloorPayloadForAreaLoad({
            payload: result.payload,
            floorId: floor.id,
            variant: 'customized',
            flattenOptions: { includeAreaName: true },
            existingAreaIds: allAreaIds,
          });
          allAreaIds.splice(0, allAreaIds.length, ...processed.areaIds);

          if (processed.mappings) {
            setAreaIdToFloorId((prev) => {
              const next = new Map(prev);
              processed.mappings.areaIdToFloorIdEntries.forEach(([key, value]) => {
                next.set(key, value);
              });
              return next;
            });

            setPersistentAreaNames((prev) => {
              const next = new Map(prev);
              processed.mappings.persistentAreaNameEntries.forEach(([key, value]) => {
                next.set(key, value);
              });
              return next;
            });
          }
        }
      }

      setAllAreasLoaded(true);
    } catch (error) {
      setAllAreasLoaded(true);
    } finally {
      loadAllAreasInFlightRef.current = false;
    }
  };

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
        // Different floor - expand it additively
        try {
          setCurrentTreeFloorId(floor.id);
          await dispatch(getLeafByFloorID(floor.id))
          setExpandedFloorIds(prev => new Set([...prev, floor.id]));
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
        setLocalSelectedFloorIds(prev => [...prev, floor.id]);
        setFloorsWithSelectedAreas(prev => new Set([...prev, floor.id]));

        // Expand the floor so the user can pick individual areas (or rely on floor-only scope via Set)
        setExpandedFloorId(floor.id);
        const nodeId = `floor-${floor.id}`
        setExpandedNodes(new Set([nodeId]))

        // Prefetch leaf data for the tree; do not auto-check every area (allows selecting a single area)
        try {
          setCurrentTreeFloorId(floor.id);
          await dispatch(getLeafByFloorID(floor.id));
        } catch {
          // ignore
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

  // Fetch area groups when Dashboard mounts. Initial Redux `areaGroups` is always a truthy
  // object (empty arrays), so the previous `if (!areaGroups)` guard never ran and groups
  // never loaded until another screen called fetchAreaGroups.
  useEffect(() => {
    dispatchFetchAreaGroupsOnce(dispatch, fetchAreaGroups);
  }, [dispatch])

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
  const renderTreeNode = (node, level = 0, floorName = "") => {
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
            title={isAreaNode && floorName ? `${floorName}/${node.name}` : node.name}
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
            title={isAreaNode && floorName ? `${floorName}/${node.name}` : node.name}
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
            {node.children && node.children.map(child => renderTreeNode(child, level + 1, floorName))}
            {node.areas && node.areas.map(area => renderTreeNode(area, level + 1, floorName))}
          </div>
        )}
      </div>
    );
  };

  const handleAreaCheckboxChange = (areaId, areaName, node) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    const wasSelected = localSelectedAreas.includes(areaId);
    const toggleResolution = resolveAreaToggleSelection({
      areaId,
      node,
      localSelectedAreas,
      getChildAreaIds: getAllChildAreaIds,
    });

    if (!wasSelected) {
      setPersistentAreaNames(prev => {
        const next = new Map(prev);
        let changed = false;

        const walk = (n) => {
          if (n.area_id) {
            const baseLabel = n.name || n.area_name || `Area ${n.area_id}`;
            const fullLabel = baseLabel;
            if (next.get(Number(n.area_id)) !== fullLabel) {
              next.set(Number(n.area_id), fullLabel);
              changed = true;
            }
          }
          if (n.children) n.children.forEach(walk);
          if (n.areas) n.areas.forEach(walk);
        };
        walk(node);
        return changed ? next : prev;
      });
    }

    setLocalSelectedAreas(toggleResolution.localSelectedAreas);

    if (toggleResolution.clearFloorSelection) {
      setLocalSelectedFloorIds([]);
      setFloorsWithSelectedAreas(new Set());
    }
  };

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

  const handleIntermediateParentCheckboxChange = (node, event) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    const allDescendantAreaIds = getAllChildAreaIds(node);
    const allDescendantsSelected = allDescendantAreaIds.every((id) =>
      localSelectedAreas.includes(id)
    );

    const toggleResolution = resolveIntermediateParentToggle({
      node,
      localSelectedAreas,
      getChildAreaIds: getAllChildAreaIds,
    });

    if (!allDescendantsSelected) {
      setPersistentAreaNames(prev => {
        const next = new Map(prev);
        let changed = false;

        const walk = (n) => {
          if (n.area_id) {
            const baseLabel = n.name || n.area_name || `Area ${n.area_id}`;
            const fullLabel = baseLabel;
            if (next.get(Number(n.area_id)) !== fullLabel) {
              next.set(Number(n.area_id), fullLabel);
              changed = true;
            }
          }
          if (n.children) n.children.forEach(walk);
          if (n.areas) n.areas.forEach(walk);
        };
        walk(node);
        return changed ? next : prev;
      });
    }

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

  // Add request cancellation to prevent race conditions
  const abortControllerRef = useRef(null);
  const debounceTimeoutRef = useRef(null);
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
  const lastAreaGroupScopeSigRef = useRef('');

  useEffect(() => {
    if (activeTab !== 'energy') {
      unifiedApiParamsRef.current = null;
    }
  }, [activeTab]);

  // Create stable string representation of apiParams to prevent unnecessary re-runs
  // This memoization ensures the string only changes when actual values change

  // Separate useEffect to handle tab changes and trigger API calls for active tab only
  useEffect(() => {
    if (!apiParams || !apiParamsString) {
      return;
    }

    // CRITICAL FIX: Only run if apiParams, activeTab, or loaded area groups actually changed
    // This prevents re-running when donut chart loading states update
    if (
      lastApiParamsStringRef.current === apiParamsString &&
      lastActiveTabRef.current === activeTab &&
      lastAreaGroupScopeSigRef.current === areaGroupScopeSignature
    ) {
      return;
    }

    // Update refs to track current state
    lastApiParamsStringRef.current = apiParamsString;
    lastActiveTabRef.current = activeTab;
    lastAreaGroupScopeSigRef.current = areaGroupScopeSignature;

    // Prevent duplicate API calls by checking if we're already in the middle of a request
    // But allow reload if reloadTrigger has changed (automatic reload on login)
    if (isApiCallInProgressRef.current && reloadTrigger === 0) {
      return;
    }

    // Set flag to prevent duplicate calls
    isApiCallInProgressRef.current = true;

    // CRITICAL FIX: Only show global loader when we have valid API parameters
    // Don't show loader when apiParams is null (no selection made yet)
    // Allow API calls with no parameters (full project data) but don't show loader for initial load
    // Include group-only scope (dashboard / user / special area groups use group_ids on chart APIs)
    if (
      apiParams &&
      (apiParams.areaIds ||
        apiParams.floorIds ||
        (apiParams.groupIds && apiParams.groupIds.length > 0))
    ) {
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

        // Set loading states for all charts that will be called
        // Loading states are handled by individual API calls

        // Energy tab: fire chart APIs in parallel; each widget renders when its own request finishes.
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
              isApiCallInProgressRef.current = false;
            },
          });
        } else if (activeTab === 'space-utilization') {
          abortSingletonDashboardGets();

          // Charts tab consumes occupancy_count, instant occupancy, and from_logs
          // series only. occupancy_by_group / space_utilization_per remain on
          // basic/advanced (and this variant's endpoints stay available).
          const spaceUtilizationApis = [
            { name: 'occupancyCount', promise: dispatch(fetchOccupancyCount(apiParams)) },
            { name: 'instantOccupancyCount', promise: dispatch(fetchInstantOccupancyCount(apiParams)) },
            { name: 'occupancyByGroupFromLogs', promise: dispatch(fetchOccupancyByGroupFromLogs(apiParams)) },
            { name: 'spaceUtilizationPerFromLogs', promise: dispatch(fetchSpaceUtilizationPerFromLogs(apiParams)) },
          ]

          setChartLoading((prev) => ({
            ...prev,
            occupancyCount: true,
            occupancyByGroup: false,
            spaceUtilizationPerArea: false,
            instantOccupancyCount: true,
            occupancyByGroupFromLogs: true,
            spaceUtilizationPerFromLogs: true,
          }))

          spaceUtilizationApis.forEach((api) => {
            api.promise
              .then(() => {
                setChartLoading((prev) => ({ ...prev, [api.name]: false }))
              })
              .catch(() => {
                setChartLoading((prev) => ({ ...prev, [api.name]: false }))
              })
          })

          Promise.allSettled(spaceUtilizationApis.map((api) => api.promise)).then(() => {
            setGlobalLoading(false)
            isApiCallInProgressRef.current = false
          })
        } else if (activeTab === 'alerts') {
          setGlobalLoading(false)
          isApiCallInProgressRef.current = false
        } else {
          setGlobalLoading(false)
          isApiCallInProgressRef.current = false
        }
      } catch (error) {
        // Handle errors silently
        setGlobalLoading(false)
        isApiCallInProgressRef.current = false
      }
    };

    fetchDataForActiveTab();

    // Cleanup function - don't reset flag here, let API handlers manage it
    return () => {
      // Cleanup handled by individual API completion handlers
    };
  }, [activeTab, apiParamsString, areaGroupScopeSignature, dispatch, reloadTrigger, selectedDuration]);


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
    if (tab === "overview") {
      navigate(DASHBOARD_OVERVIEW_ENABLED ? "/dashboard" : DASHBOARD_DEFAULT_PATH);
    } else {
      navigate(`/dashboard/${tab}`);
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
    // Always proceed with API calls if we have duration - let backend handle area filtering
    if (selectedDuration) {
      // Don't call APIs for custom until both dates are set
      if (selectedDuration === 'custom' && (!customStartDate || !customEndDate)) {
        return;
      }
      // Don't call APIs directly here - let the useEffect handle it
      // This prevents multiple API calls that overwrite the complete data
    }
  }

  const handleDashboardTabKeyDown = (event) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      requestTopbarNavFocus('Dashboard');
      return;
    }

    handleRovingTablistKeyDown(event, {
      itemKeys: dashboardTabKeys,
      activeKey: activeTabRef.current,
      keyRefs: tabRefs,
      orientation: 'horizontal',
      onActivate: (tab) => handleTabChange(tab),
    });
  };

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
        requestTopbarNavFocus('Dashboard');
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

  const hasError = dashboardError || (floorStatus === 'failed')

    const transformDataForCharts = useCallback(
    createCustomizedTransformDataForCharts(
      sharedTransformDataForCharts,
      buildCustomizedTransformChartOptions({
        selectedDuration,
        selectedAreas,
        selectedFloorIds,
        selectedGroupIds,
        areaTree,
        areaGroups,
        floors,
      })
    ),
    [selectedDuration, selectedAreas, areaTree, selectedGroupIds, areaGroups, selectedFloorIds, floors]
  );

  // Isolated wrapper removed — consumption/savings use UnifiedEnergyWidget

  const consumptionCustomizedSurface = useMemo(
    () => ({
      cardShellStyle: BUILTIN_CHART_CARD,
      cardHeaderStyle: BUILTIN_CHART_HEADER_ROW,
      plotStyleOverride: BUILTIN_LINE_PLOT_BOX,
      loaderHeight: BUILTIN_CHART_LOADER_HEIGHT,
      legendSeriesName: consumptionTitle,
    }),
    [consumptionTitle]
  );

  const savingsCustomizedSurface = useMemo(
    () => ({
      cardShellStyle: BUILTIN_CHART_CARD,
      cardHeaderStyle: BUILTIN_CHART_HEADER_ROW,
      plotStyleOverride: BUILTIN_LINE_PLOT_BOX,
      loaderHeight: BUILTIN_CHART_LOADER_HEIGHT,
      legendSeriesName: savingsTitle,
    }),
    [savingsTitle]
  );

  const customizedExportButtonStyle = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  };

  const consumptionExportControl = useMemo(
    () => {
      const exportMenuKey = DEFAULT_CONSUMPTION_EXPORT_KEYS.menuCloseKey;
      return (
        <EnergyChartExportMenuControl
          exportMenuKey={exportMenuKey}
          loadingPrefix={DEFAULT_CONSUMPTION_EXPORT_KEYS.loadingPrefix}
          showExportDropdown={showExportDropdown}
          setShowExportDropdown={setShowExportDropdown}
          exportLoading={exportLoading}
          exportDropdownRefs={exportDropdownRefs}
          onEmail={handleConsumptionEmail}
          onDownload={handleConsumptionDownload}
          preset={resolveCustomizedEnergyExportMenuPreset()}
          renderTrigger={({ onClick }) => (
            <button type="button" data-export-menu="true" onClick={onClick} style={customizedExportButtonStyle}>
              <FileUploadIcon fontSize="small" /> Export
            </button>
          )}
        />
      );
    },
    [showExportDropdown, exportLoading, setShowExportDropdown, handleConsumptionEmail, handleConsumptionDownload]
  );

  const savingsExportControl = useMemo(
    () => {
      const exportMenuKey = DEFAULT_SAVINGS_EXPORT_KEYS.menuCloseKey;
      return (
        <EnergyChartExportMenuControl
          exportMenuKey={exportMenuKey}
          loadingPrefix={DEFAULT_SAVINGS_EXPORT_KEYS.loadingPrefix}
          showExportDropdown={showExportDropdown}
          setShowExportDropdown={setShowExportDropdown}
          exportLoading={exportLoading}
          exportDropdownRefs={exportDropdownRefs}
          onEmail={handleSavingsEmail}
          onDownload={handleSavingsDownload}
          preset={resolveCustomizedEnergyExportMenuPreset()}
          renderTrigger={({ onClick }) => (
            <button type="button" data-export-menu="true" onClick={onClick} style={customizedExportButtonStyle}>
              <FileUploadIcon fontSize="small" /> Export
            </button>
          )}
        />
      );
    },
    [showExportDropdown, exportLoading, setShowExportDropdown, handleSavingsEmail, handleSavingsDownload]
  );

  const savingsByStrategyCustomizedSurface = useMemo(
    () => ({
      cardShellStyle: BUILTIN_CHART_CARD,
      plotStyleOverride: BUILTIN_PIE_PLOT_BOX,
      loaderHeight: BUILTIN_CHART_LOADER_HEIGHT,
      cardClassName: 'chart-card-animated',
    }),
    []
  );

  const totalConsumptionByGroupCustomizedSurface = useMemo(
    () => ({
      cardShellStyle: BUILTIN_CHART_CARD,
      cardHeaderStyle: BUILTIN_CHART_HEADER_ROW,
      plotStyleOverride: BUILTIN_PIE_PLOT_BOX,
      loaderHeight: BUILTIN_CHART_LOADER_HEIGHT,
      cardClassName: 'chart-card-animated',
    }),
    []
  );

  const totalConsumptionByGroupExportControl = useMemo(
    () => {
      const groupExportKeys = createAdvancedGroupExportKeys();
      const exportMenuKey = groupExportKeys.menuCloseKey;
      return (
        <EnergyChartExportMenuControl
          exportMenuKey={exportMenuKey}
          loadingPrefix={groupExportKeys.loadingPrefix}
          showExportDropdown={showExportDropdown}
          setShowExportDropdown={setShowExportDropdown}
          exportLoading={exportLoading}
          exportDropdownRefs={exportDropdownRefs}
          onEmail={handleConsumptionByGroupEmail}
          onDownload={handleConsumptionByGroupDownload}
          preset={resolveCustomizedEnergyExportMenuPreset()}
          emailLabel=" Send By Email"
          downloadLabel=" Download To PC"
          renderTrigger={({ onClick }) => (
            <button type="button" data-export-menu="true" onClick={onClick} style={customizedExportButtonStyle}>
              <FileUploadIcon fontSize="small" /> Export
            </button>
          )}
        />
      );
    },
    [showExportDropdown, exportLoading, setShowExportDropdown, handleConsumptionByGroupEmail, handleConsumptionByGroupDownload]
  );

  const combinedConsumptionSavingUnit = useMemo(
    () => energyConsumption?.unit || energySavings?.unit || '',
    [energyConsumption, energySavings]
  );

  const consumptionSavingMergedData = useMemo(() => {
    const consumptionSeries = memoizedEnergyConsumption
      ? transformDataForCharts(memoizedEnergyConsumption, 'consumption')
      : [];
    const savingsSeries = memoizedEnergySavings
      ? transformDataForCharts(memoizedEnergySavings, 'other')
      : [];
    return sharedConsumptionSavingMergedData(consumptionSeries, savingsSeries);
  }, [memoizedEnergyConsumption, memoizedEnergySavings, transformDataForCharts]);

  const ENERGY_LIGHT_FULL_CARD_HEIGHT_PX = 648;

  const hideCustomizedHeaderDuration =
    (activeTab === 'energy' && shouldShowEnergyWidget('consumption_saving')) ||
    (activeTab === 'space-utilization' && isSpaceCombinedVisible);

  const customizedEnergyCombinedSurface = useMemo(
    () => ({
      cardBackground: contentColor,
      cardBorder: '1px solid #ccc',
      cardShadow: '0 2px 4px rgba(0,0,0,0.1)',
      cardClassName: 'chart-card-animated',
    }),
    [contentColor]
  );

  const energyCombinedDurationFilter = useMemo(
    () => (
      <DashboardDurationFilterBar
        selectedDuration={selectedDuration}
        onDurationChange={handleDurationChange}
        customDateRange={customDateRange}
        onCustomStartDateChange={(startDate) =>
          dispatch(
            setCustomDateRange({
              startDate,
              endDate: (customEndDate || '').split('T')[0],
            })
          )
        }
        onCustomEndDateChange={(endDate) =>
          dispatch(
            setCustomDateRange({
              startDate: (customStartDate || '').split('T')[0],
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
    ),
    [
      selectedDuration,
      handleDurationChange,
      customDateRange,
      customStartDate,
      customEndDate,
      dispatch,
      globalLoading,
      getCurrentPeriodText,
      handlePrevious,
      handleNext,
      isLargeScreen,
      isMediumScreen,
    ]
  );

  const energyWidgetRenderContext = useMemo(
    () =>
      buildEnergyWidgetRenderContext({
        variant: 'customized',
        titles: energyWidgetTitles,
        widgetList,
        getWidgetTitle,
        data: {
          memoizedEnergyConsumption,
          memoizedEnergySavings,
          savingsByStrategy,
          totalConsumptionByGroup,
          lightPowerDensity,
          lightingUnit,
        },
        loading: {
          energyConsumptionLoading,
          energySavingsLoading,
          peakMinConsumptionLoading,
        },
        chartLoading,
        allEnergyChartsReady,
        globalLoading,
        colors: { consumption: consumptionColors, savings: savingsColors },
        chartHeaderStyle,
        ChartLoader,
        transformDataForCharts,
        selectedDuration,
        currentDate,
        currentYear,
        selectedAreas,
        isLargeScreen,
        areaGroups,
        areaIdToDisplayName,
        widgetVisibility,
        getEffectiveBuiltinDashboardPage,
        overrides: {
          consumption: {
            customizedSurface: consumptionCustomizedSurface,
            exportControl: consumptionExportControl,
          },
          savings: {
            customizedSurface: savingsCustomizedSurface,
            exportControl: savingsExportControl,
          },
          savings_by_strategy: { customizedSurface: savingsByStrategyCustomizedSurface },
          total_consumption_by_group: {
            customizedSurface: totalConsumptionByGroupCustomizedSurface,
            exportControl: totalConsumptionByGroupExportControl,
          },
          light_power_density: {},
          peak_and_minimum_consumption: {},
        },
      }),
    [
      energyWidgetTitles,
      widgetList,
      getWidgetTitle,
      memoizedEnergyConsumption,
      memoizedEnergySavings,
      savingsByStrategy,
      totalConsumptionByGroup,
      lightPowerDensity,
      lightingUnit,
      energyConsumptionLoading,
      energySavingsLoading,
      peakMinConsumptionLoading,
      chartLoading,
      allEnergyChartsReady,
      globalLoading,
      consumptionColors,
      savingsColors,
      chartHeaderStyle,
      transformDataForCharts,
      selectedDuration,
      currentDate,
      currentYear,
      selectedAreas,
      isLargeScreen,
      areaGroups,
      areaIdToDisplayName,
      widgetVisibility,
      consumptionCustomizedSurface,
      savingsCustomizedSurface,
      savingsByStrategyCustomizedSurface,
      totalConsumptionByGroupCustomizedSurface,
      consumptionExportControl,
      savingsExportControl,
      totalConsumptionByGroupExportControl,
    ]
  );

  const renderLightingPowerDensity = () => (
    <DashboardWidgetRenderer
      widgetKey="light_power_density"
      variant="customized"
      context={energyWidgetRenderContext}
      visible
    />
  );

  const renderEnergySection = useCallback(
    (_orchestration) => {
      const builtinOv = readBuiltinWidgetOverrides();
      const buildEnergyBuiltinRender = (widgetKey, fallbackTitle, defaultRender) => {
        return () => {
          const o = builtinOv[widgetKey];
          if (!shouldRenderBuiltinWidgetAsCustomGraph(widgetKey, o)) return defaultRender();
          const displayName =
            widgetKey === 'total_consumption_by_group'
              ? getWidgetTitleWithAliases(
                'total_consumption_by_group',
                totalConsumptionGroupAliases.filter(
                  (key) => key !== 'total_consumption_by_group'
                ),
                'Consumption By Area Groups'
              )
              : getWidgetTitle(widgetKey, fallbackTitle);
          const virtualG = {
            id: `builtin_${widgetKey}`,
            name: displayName,
            graph_type: o.graph_type,
            api_path: normalizeBuiltinApiPath(o.api_path),
            ...(Array.isArray(o?.floor_ids) && o.floor_ids.length ? { floor_ids: o.floor_ids } : {}),
            ...(Array.isArray(o?.area_ids) && o.area_ids.length ? { area_ids: o.area_ids } : {}),
            ...(o?.group_scope ? { group_scope: o.group_scope } : {}),
            page: 'energy',
          };
          return (
            <EnergyCustomGraphCard
              g={virtualG}
              chartHeaderStyle={chartHeaderStyle}
              customGraphData={customGraphData}
              customGraphLoading={customGraphLoading}
              customGraphError={customGraphError}
              transformDataForCharts={transformDataForCharts}
              onExport={handleEnergyCustomGraphExport}
              areaGroups={areaGroups}
              areaIdToDisplayName={areaIdToDisplayName}
              areaIdToFloorId={areaIdToFloorId}
              dashboardApiParams={apiParams}
              floors={floors}
            />
          );
        };
      };
      const energyCards = [
        {
          key: 'consumption_saving',
          render: () => (
            <ConsumptionSavingsCombinedChart
              title={getWidgetTitle('consumption_saving', 'Energy (Combined)')}
              mergedData={energyCustomNeedsDates ? [] : consumptionSavingMergedData}
              unit={combinedConsumptionSavingUnit}
              isLoading={
                energyCustomNeedsDates ? false : consumptionIsLoading || savingsIsLoading
              }
              selectedDuration={selectedDuration}
              formatXAxisLabel={(v) => formatEnergyXAxisLabel(v, selectedDuration)}
              onEmail={handleConsumptionEmail}
              onDownloadReport={handleConsumptionDownload}
              exportEmailLoading={!!exportLoading['Consumption_email']}
              exportDownloadLoading={!!exportLoading['Consumption_download']}
              emptyStateVariant={energyCustomNeedsDates ? 'blank' : 'message'}
              shellVariant={CONSUMPTION_SAVINGS_COMBINED_SHELL_VARIANTS.customized}
              advancedSurface={customizedEnergyCombinedSurface}
              titleStyle={chartHeaderStyle}
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
                  {energyCombinedDurationFilter}
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
                  chartSurface="dark"
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
          ),
        },
        {
          key: 'savings_by_strategy',
          render: buildEnergyBuiltinRender('savings_by_strategy', 'Savings By Strategy', () => (
            <DashboardWidgetRenderer
              widgetKey="savings_by_strategy"
              variant="customized"
              context={energyWidgetRenderContext}
              visible
            />
          )),
        },
        {
          key: 'total_consumption_by_group',
          render: () => (
            <DashboardWidgetRenderer
              widgetKey="total_consumption_by_group"
              variant="customized"
              context={energyWidgetRenderContext}
              visible
            />
          ),
        },
        {
          key: 'consumption',
          render: buildEnergyBuiltinRender('consumption', 'Consumption', () => (
            <DashboardWidgetRenderer
              widgetKey="consumption"
              variant="customized"
              context={energyWidgetRenderContext}
              visible
            />
          )),
        },
        {
          key: 'savings',
          render: buildEnergyBuiltinRender('savings', 'Savings', () => (
            <DashboardWidgetRenderer
              widgetKey="savings"
              variant="customized"
              context={energyWidgetRenderContext}
              visible
            />
          )),
        },
        {
          key: 'light_power_density',
          render: buildEnergyBuiltinRender('light_power_density', 'Lighting Power Density', () => (
            <div style={BUILTIN_COMPACT_PANEL}>
              <div style={BUILTIN_CHART_HEADER_ROW}>
                <h3 style={chartHeaderStyle}>
                  {getWidgetTitle(
                    'light_power_density',
                    'Lighting Power Density'
                  )}
                </h3>
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
              <div style={BUILTIN_COMPACT_INNER}>
                {renderLightingPowerDensity()}
              </div>
            </div>
          )),
        },
        {
          key: 'peak_and_minimum_consumption',
          render: buildEnergyBuiltinRender('peak_and_minimum_consumption', 'Peak & Minimum Consumption', () => (
            <div style={{ ...BUILTIN_COMPACT_PANEL, position: 'relative' }}>
              <div style={BUILTIN_CHART_HEADER_ROW}>
                <h3 style={chartHeaderStyle}>
                  {getWidgetTitle(
                    'peak_and_minimum_consumption',
                    'Peak & Minimum Consumption'
                  )}
                </h3>
              </div>
              <DashboardWidgetRenderer
                widgetKey="peak_and_minimum_consumption"
                variant="customized"
                context={energyWidgetRenderContext}
                visible
              />
            </div>
          )),
        },
      ];

      const customKeyPrefix = 'custom_graph:'
      const energyCustomCards = (Array.isArray(customGraphs) ? customGraphs : [])
        .filter((g) => String(g?.page || '').toLowerCase() === 'energy')
        .map((g, idx) => {
          const id = String(g?.id ?? '')
          return {
            key: `${customKeyPrefix}${id || `idx_${idx}`}`,
            render: () => (
              <EnergyCustomGraphCard
                g={g}
                chartHeaderStyle={chartHeaderStyle}
                customGraphData={customGraphData}
                customGraphLoading={customGraphLoading}
                customGraphError={customGraphError}
                transformDataForCharts={transformDataForCharts}
                onExport={handleEnergyCustomGraphExport}
                areaGroups={areaGroups}
                areaIdToDisplayName={areaIdToDisplayName}
                areaIdToFloorId={areaIdToFloorId}
                dashboardApiParams={apiParams}
                floors={floors}
              />
            ),
          };
        });

      const visibleEnergyCards = energyCards
        .filter((c) => shouldShowEnergyWidget(c.key))
        .concat(
          energyCustomCards.filter((c) => shouldShowEnergyWidget(c.key))
        );

      const {
        mergedOrder,
        orderedCards: orderedEnergyCards,
        visibleCount,
      } = resolveEnergyCardLayout(visibleEnergyCards);

      const energyGridCols = energyGridColumnTemplate(visibleCount);

      return (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(event) => {
            if (energyLayoutLocked) return;
            const activeId = String(event?.active?.id ?? '');
            const overId = String(event?.over?.id ?? '');
            if (!activeId || !overId || activeId === overId) return;
            const oldIndex = mergedOrder.indexOf(activeId);
            const newIndex = mergedOrder.indexOf(overId);
            if (oldIndex < 0 || newIndex < 0) return;
            const next = arrayMove(mergedOrder, oldIndex, newIndex);
            setEnergyCardOrder(next);
            writeEnergyCardOrder(next);
          }}
        >
          <SortableContext items={mergedOrder} strategy={rectSortingStrategy}>
            <EnergyLayoutRenderer
              variant="customized"
              layoutMode={CUSTOMIZED_LAYOUT_MODE}
              cards={orderedEnergyCards}
              adapter={{
                resolveSortableGridSx: resolveCustomizedSortableGridSx,
              }}
              adapterRuntime={{
                getCardCol: (key, visibleCount) =>
                  getEnergyCardCol(key, visibleCount),
                wrapCard: (key, col, content) => {
                  const isFullscreen =
                    String(energyFullscreenCardId || '') === String(key);
                  return (
                    <SortableDashboardItem
                      id={key}
                      disabled={energyLayoutLocked}
                      showSpanToggle={!energyLayoutLocked && key !== 'consumption_saving'}
                      span={col}
                      onToggleSpan={toggleEnergyCardSpan}
                      showHeightToggle={!energyLayoutLocked}
                      isFullscreen={isFullscreen}
                      onToggleFullscreen={
                        energyLayoutLocked ? undefined : toggleEnergyFullscreen
                      }
                      rowSpan={1}
                    >
                      <Box
                        sx={{
                          width: '100%',
                          minWidth: 0,
                          boxSizing: 'border-box',
                          ...(isFullscreen
                            ? {
                                height: '100%',
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                              }
                            : {}),
                        }}
                      >
                        {content}
                      </Box>
                    </SortableDashboardItem>
                  );
                },
              }}
              gridOptions={{
                gridColumns: energyGridCols,
                visibleCount,
              }}
            />
          </SortableContext>
        </DndContext>
      );
    },
    [
      allEnergyChartsReady,
      areaGroups,
      areaIdToDisplayName,
      areaIdToFloorId,
      apiParams,
      chartHeaderStyle,
      chartLoading,
      combinedConsumptionSavingUnit,
      consumptionIsLoading,
      consumptionSavingMergedData,
      customizedEnergyCombinedSurface,
      customGraphData,
      customGraphError,
      customGraphLoading,
      customGraphs,
      embeddedSavingsByStrategyLoading,
      energyCombinedDurationFilter,
      energyCustomNeedsDates,
      energyFullscreenCardId,
      energyGridColumnTemplate,
      energyWidgetRenderContext,
      exportLoading,
      floors,
      getEnergyCardCol,
      getWidgetTitle,
      getWidgetTitleWithAliases,
      globalLoading,
      handleConsumptionDownload,
      handleConsumptionEmail,
      handleEnergyCustomGraphExport,
      lightingUnit,
      renderLightingPowerDensity,
      resolveEnergyCardLayout,
      savingsByStrategy,
      savingsByStrategyTitle,
      savingsIsLoading,
      selectedDuration,
      sensors,
      setEnergyCardOrder,
      shouldShowEnergyWidget,
      toggleEnergyCardSpan,
      toggleEnergyFullscreen,
      totalConsumptionGroupAliases,
      transformDataForCharts,
      writeEnergyCardOrder,
    ]
  );

  const pinCustomizedDashboardScrollChrome =
    !isTabletViewport &&
    (activeTab === 'energy' || activeTab === 'space-utilization' || activeTab === 'alerts');
  const CUSTOMIZED_DASHBOARD_CHROME_HEADER_FALLBACK_PX = 120;
  // Keep name for chrome fallback math; value tracks floating topbar stack offset.
  const CUSTOMIZED_DASHBOARD_TOOLBAR_PX = CUSTOMIZED_TOPBAR_STACK_OFFSET_PX;
  const customizedDashboardChromeRef = useRef(null);
  const [customizedDashboardChromeBottomPx, setCustomizedDashboardChromeBottomPx] = useState(0);

  const syncCustomizedDashboardChromeHeight = useCallback(() => {
    const el = customizedDashboardChromeRef.current;
    if (!el) return;
    setCustomizedDashboardChromeBottomPx(el.getBoundingClientRect().bottom);
  }, []);

  useLayoutEffect(() => {
    if (!pinCustomizedDashboardScrollChrome) {
      setCustomizedDashboardChromeBottomPx(0);
      return undefined;
    }

    syncCustomizedDashboardChromeHeight();
    const el = customizedDashboardChromeRef.current;
    if (!el) return undefined;

    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(syncCustomizedDashboardChromeHeight);
      resizeObserver.observe(el);
    }

    window.addEventListener('resize', syncCustomizedDashboardChromeHeight);
    window.addEventListener('orientationchange', syncCustomizedDashboardChromeHeight);
    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', syncCustomizedDashboardChromeHeight);
      window.removeEventListener('orientationchange', syncCustomizedDashboardChromeHeight);
    };
  }, [
    pinCustomizedDashboardScrollChrome,
    syncCustomizedDashboardChromeHeight,
    showAreaDropdown,
    isLargeScreen,
    isMediumScreen,
    selectedDuration,
  ]);

  const customizedDashboardChromeBottomOffsetPx =
    customizedDashboardChromeBottomPx > 0
      ? customizedDashboardChromeBottomPx
      : CUSTOMIZED_DASHBOARD_TOOLBAR_PX + CUSTOMIZED_DASHBOARD_CHROME_HEADER_FALLBACK_PX;

  return (
    <div
      className="customized-dashboard-root"
      onClick={(e) => e.stopPropagation()}
      style={pinCustomizedDashboardScrollChrome ? { overflow: 'hidden' } : undefined}
    >
      {/* Fixed Header Section - Static Controls */}
      <Box
        ref={customizedDashboardChromeRef}
        sx={{
          position: 'fixed',
          top: `${CUSTOMIZED_TOPBAR_STACK_OFFSET_PX}px`,
          left: 0,
          right: 0,
          backgroundColor: pinCustomizedDashboardScrollChrome ? 'transparent' : backgroundColor,
          p: 0,
          zIndex: 999,
          boxSizing: 'border-box',
          ...(pinCustomizedDashboardScrollChrome
            ? {
                // borderBottom: `1px solid ${buttonColor}`,
              }
            : {}),
        }}
      >
        <Box
          className={isAlertsTab ? DASHBOARD_ALERTS_SHELL_CLASS : undefined}
          sx={{
            width: '100%',
            maxWidth: '100%',
            mx: 'auto',
            boxSizing: 'border-box',
            py: { xs: 1, md: 2 },
            px: isAlertsTab
              ? 0
              : { xs: 1, sm: 2, md: 3, lg: 6, xl: 8, '2xl': 10 },
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
                    {(() => {
                      const selectionLabel = getAreaSelectionText();
                      return (
                        <span
                          style={{
                            flex: 1,
                            minWidth: 0,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            marginRight: '6px',
                            fontSize: '12px',
                            display: 'block',
                          }}
                          title={selectionLabel}
                        >
                          {selectionLabel}
                        </span>
                      );
                    })()}
                    <span>▼</span>
                  </div>

                  {showAreaDropdown && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      backgroundColor: 'white',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      zIndex: 1002,
                      marginTop: '2px',
                      maxHeight: '400px',
                      overflowY: 'auto',
                      width: 'max-content',
                      minWidth: '100%',
                      maxWidth: isLargeScreen ? '600px' : '550px',
                    }}>
                      {floorStatus === 'loading' ? (
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
                                    title={floor.floor_name || floor.name}
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
                                      whiteSpace: 'nowrap'
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
                                    width: 'max-content',
                                    minWidth: '100%',
                                    paddingLeft: '20px',
                                    borderLeft: '2px solid #e0e0e0',
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
                                        width: 'max-content',
                                        minWidth: '100%',
                                      }}>
                                        {(areaTree.tree || areaTree.areas || []).map(node => renderTreeNode(node, 0, floor.floor_name || floor.name))}
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
              </Grid>
            )}

            {/* Duration Dropdown with Date Navigation below */}
            {activeTab !== 'alerts' && activeTab !== 'overview' && !hideCustomizedHeaderDuration && (
              <Grid item xs={12} sm={6} md={3} lg={3} xl={2}>
                <div style={{ width: '100%' }}>
                  {/* Duration Dropdown */}
                  <div style={{ position: 'relative', width: '100%', marginBottom: '3px' }}>
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
                        <div style={{ position: 'relative', minWidth: 0, flex: '1 1 auto', maxWidth: '45%' }}>
                          {!((customStartDate || '').split('T')[0]) && (
                            <span
                              style={{
                                position: 'absolute',
                                left: isLargeScreen ? 8 : 6,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#333',
                                fontSize: isLargeScreen ? '12px' : (isMediumScreen ? '11px' : '10px'),
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
                            value={(customStartDate || '').split('T')[0]}
                            onChange={e => dispatch(setCustomDateRange({
                              startDate: e.target.value,
                              endDate: (customEndDate || '').split('T')[0],
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
                              width: '100%',
                              boxSizing: 'border-box',
                              color: ((customStartDate || '').split('T')[0]) ? undefined : 'transparent',
                            }}
                          />
                        </div>
                        <span style={{
                          fontWeight: 600,
                          color: '#333',
                          fontSize: isLargeScreen ? '12px' : (isMediumScreen ? '11px' : '10px'),
                          flexShrink: 0,
                          whiteSpace: 'nowrap'
                        }}>to</span>
                        <div style={{ position: 'relative', minWidth: 0, flex: '1 1 auto', maxWidth: '45%' }}>
                          {!((customEndDate || '').split('T')[0]) && (
                            <span
                              style={{
                                position: 'absolute',
                                left: isLargeScreen ? 8 : 6,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#333',
                                fontSize: isLargeScreen ? '12px' : (isMediumScreen ? '11px' : '10px'),
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
                            value={(customEndDate || '').split('T')[0]}
                            onChange={e => dispatch(setCustomDateRange({
                              startDate: (customStartDate || '').split('T')[0],
                              endDate: e.target.value,
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
                              width: '100%',
                              boxSizing: 'border-box',
                              color: ((customEndDate || '').split('T')[0]) ? undefined : 'transparent',
                            }}
                          />
                        </div>
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
                          Next›
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
                <div
                  style={{
                    width: '100%',
                    minHeight: '67px',
                    display: 'flex',
                    alignItems: 'flex-start',
                  }}
                  ref={dropdownRef}
                >
                  <div style={{ minWidth: 220, position: 'relative', width: '100%' }}>
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
                </div>
              </Grid>
            )}

            {/* Placeholder column on Alerts — matches duration column height on Energy/Space */}
            {activeTab === 'alerts' && (
              <Grid item xs={12} sm={6} md={3} lg={3} xl={2} sx={{ display: { xs: 'none', sm: 'block' } }}>
                <div style={{ width: '100%', minHeight: '67px' }} aria-hidden="true" />
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
                flexWrap: 'wrap',
              }}
            >
              {/* Tabs - hidden on Overview so widget area fills space */}
              {activeTab !== 'overview' && (
                <div
                  style={{
                    display: 'inline-flex',
                    gap: isLargeScreen ? '12px' : (isMediumScreen ? '10px' : '6px'),
                    borderRadius: "5px",
                    padding: isLargeScreen ? '5px 10px' : (isMediumScreen ? '4px 8px' : '3px 6px'),
                    minWidth: 0,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                    backgroundColor: contentColor,
                    maxWidth: '100%',
                    flexWrap: 'nowrap',
                  }}
                >
                  {DASHBOARD_OVERVIEW_ENABLED && (
                    <button
                      ref={(el) => { tabRefs.current.overview = el; }}
                      className={`nav-tab-btn${activeTab === 'overview' ? ' nav-tab-btn-active' : ''}`}
                      role="tab"
                      aria-selected={activeTab === 'overview'}
                      tabIndex={getRovingTabIndex(activeTab === 'overview')}
                      onKeyDown={handleDashboardTabKeyDown}
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
                  )}
                  <button
                    ref={(el) => { tabRefs.current.energy = el; }}
                    className={`nav-tab-btn${activeTab === 'energy' ? ' nav-tab-btn-active' : ''}`}
                    role="tab"
                    aria-selected={activeTab === 'energy'}
                    tabIndex={getRovingTabIndex(activeTab === 'energy')}
                    onKeyDown={handleDashboardTabKeyDown}
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
                    ref={(el) => { tabRefs.current['space-utilization'] = el; }}
                    className={`nav-tab-btn${activeTab === 'space-utilization' ? ' nav-tab-btn-active' : ''}`}
                    role="tab"
                    aria-selected={activeTab === 'space-utilization'}
                    tabIndex={getRovingTabIndex(activeTab === 'space-utilization')}
                    onKeyDown={handleDashboardTabKeyDown}
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
                  <button
                    ref={(el) => { tabRefs.current.alerts = el; }}
                    className={`nav-tab-btn${activeTab === 'alerts' ? ' nav-tab-btn-active' : ''}`}
                    role="tab"
                    aria-selected={activeTab === 'alerts'}
                    tabIndex={getRovingTabIndex(activeTab === 'alerts')}
                    onKeyDown={handleDashboardTabKeyDown}
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
        className="customized-dashboard-scroll-pane"
        onClick={(e) => e.stopPropagation()}
        sx={{
          ...(pinCustomizedDashboardScrollChrome
            ? {
                position: 'fixed',
                top: `${customizedDashboardChromeBottomOffsetPx}px`,
                left: 0,
                right: 0,
                bottom: 0,
                overflowY: 'auto',
                overflowX: 'hidden',
                boxSizing: 'border-box',
                py: activeTab === 'space-utilization' || activeTab === 'alerts' ? 1 : 3,
                zIndex: 1,
              }
            : {
                // Reduce top/bottom gap for Overview so widgets fit in one viewport
                mt: activeTab === 'overview' ? 2 : 12,
                py: activeTab === 'overview' ? 2 : 3,
              }),
        }}
      >
        <Box
          onClick={(e) => e.stopPropagation()}
          sx={{
            width: '100%',
            maxWidth: '100%',
            mx: 'auto',
            px: isAlertsTab
              ? 0
              : { xs: 1, sm: 2, md: 3, lg: 0.5, xl: 6, '2xl': 8 },
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
            <Box mt={(activeTab === 'alerts' || pinCustomizedDashboardScrollChrome) ? 0 : 3}>
              <DashboardContainer
                variant="customized"
                adapter={customizedDashboardContainerAdapter}
                activeTab={activeTab}
                orchestration={orchestration}
                runtime={{
                  DashboardOverview,
                  SpaceUtilization,
                  Alerts,
                  overviewData,
                  overviewLoading,
                  overviewError,
                  navigate,
                  handleNavigateToEnergy,
                  handleNavigateToSpace,
                  globalLoading,
                  apiParams,
                  filterKey,
                  selectedAlertTypes,
                  focusAlertFromLocation,
                  renderEnergySection,
                  alertsShellClassName: DASHBOARD_ALERTS_SHELL_CLASS,
                }}
              />


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
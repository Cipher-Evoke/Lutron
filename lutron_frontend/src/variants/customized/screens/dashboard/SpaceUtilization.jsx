import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
// import AreaGroupFilter from "./AreaGroupFilter";
// import { normalizeAreaGroupListPayload } from "utils/areaGroupListNormalize.js
// import { normalizeAreaGroupListPayload } from "../../utils/normalizeAreaGroupListPayload";
// import AreaGroupFilter from "../../redux/slice/settingsslice/heatmap/AreaGroupFilter";
// import { useSelector } from "react-redux";

import { DndContext, PointerSensor, MouseSensor, TouchSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core'
import { SortableContext, useSortable, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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
import { UseAuth, isSuperadminRole } from '../../customhooks/UseAuth'
import { FileUpload as FileUploadIcon } from '@mui/icons-material';
import { Box, useTheme, useMediaQuery, Snackbar, Alert, Typography } from '@mui/material'
import { BaseUrl } from '../../BaseUrl'
import { coalesceDashboardHttpGet } from '../../../../shared/dashboard/utils/coalesceDashboardHttpGet'
import {
  dispatchFetchAreaGroupsOnce,
  dispatchFetchCustomGraphsOnce,
  dispatchFetchFloorsOnce,
  dispatchFetchProfileOnce,
  dispatchFetchWidgetConfigurationOnce,
  dispatchFetchWidgetTitlesOnce,
} from '../../../../shared/utils/bootstrapFetchGuards'
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
  selectSelectedGroupIds,
  selectSelectedDuration,
  selectCustomDateRange,
  selectOccupancyCount,
  selectInstantOccupancyCount,
  setCustomDateRange,
  setCurrentDate,
  setCurrentYear,
  setSelectedDuration,
  setIsNavigating,
  selectCurrentDate,
  selectCurrentYear,
  selectIsNavigating,
  selectGlobalLoading,
  buildOccupancyCountSearchParams,
  selectCustomWidgetFilters,
} from '../../redux/slice/dashboard/dashboardSlice'
import { fetchFloors, getLeafByFloorID } from '../../redux/slice/floor/floorSlice'
import {
  fetchEmailConfigs,
  getWidgetList,
  fetchRenameWidgets,
  fetchCustomGraphs,
  fetchAreaGroups,
  selectCustomGraphs,
  selectAreaGroups,
  selectAreaGroupsLoading,
  selectAreaGroupsError,
  fetchDashboardChartOrder,
  saveDashboardChartOrder,
  selectDashboardChartOrder,
  selectDashboardChartOrderStatus,
  fetchWidgetConfiguration,
  selectWidgetConfiguration,
} from '../../redux/slice/settingsslice/heatmap/groupOccupancySlice'
import {
  applyVariantDashboardOrderBlob,
  persistCustomizedLayoutAndBuildApiPayload,
  DASHBOARD_ORDER_STORAGE_KEY,
} from '../../../../shared/dashboard/container/dashboardLayoutApiSync'
import {
  pinWidgetFirstInOrder,
  SPACE_COMBINED_WIDGET_KEY,
} from '../../../../shared/dashboard/container/dashboardLayoutResolvers'
import { fetchProfile } from '../../redux/slice/auth/userlogin'
import { readBuiltinWidgetOverrides, normalizeBuiltinApiPath } from '../../utils/builtinWidgetOverrides'
import { buildAreaGroupIdNameMap, resolveOccupancyGroupDisplayName } from '../../utils/areaGroupNameLookup'
import { buildDashboardChartAxiosParams } from '../../utils/buildDashboardChartQueryParams'
import { applyCustomGraphGroupScopedParams } from '../../utils/applyCustomGraphGroupScopedParams'
import { inferUnitFromApiPath, inferUnitFromChartTitle } from '../../utils/inferDashboardUnitFallback'
import { buildTotalConsumptionByGroupPieRows, isTotalConsumptionByGroupApiPath } from '../../utils/buildTotalConsumptionByGroupPieRows'
import { resolveDashboardThunkForCustomGraphPath } from '../../utils/dashboardCustomGraphThunkResolver'
import {
  getEffectiveBuiltinDashboardPage,
  ENERGY_BUILTIN_KEYS,
} from '../../utils/builtinWidgetDashboardPage'
import {
  parseCustomizedWidgetVisibilityRoot,
  CUSTOMIZED_WIDGET_VISIBILITY_STORAGE_KEY,
  hydrateCustomizedVisibilityFromApiItems,
} from '../../utils/customizedOverviewWidgetVisibility'
import { resolveCustomizedSpaceWidgetVisible } from '../../../../shared/dashboard/container/hooks/widgetVisibilityResolvers'
import CustomGroupScopeTooltip, { buildAreaNameToGroupNameMap } from '../../components/charts/CustomGroupScopeTooltip'
import { DASHBOARD_CHART_PLOT_BACKGROUND } from '../../utils/dashboardChartPlotSurface'
import { SHOW_SPACE_UTILIZATION_LINE_CHART } from '../../utils/dashboardLanding'
import { isAreaGroupChartScope } from '../../utils/filterGroupIdsByAreaGroupScope'
import { isSpecialAreaGroup } from '../../utils/areaGroupFlags'
import { meanOccupancyFromChartPayload } from '../../utils/meanOccupancyFromChartPayload'
import { getFloorDisplayLabel } from '../../utils/floorDisplayLabel'
import {
  buildCustomWidgetFilterFloorBuckets,
  perFloorBucketAxisAndTooltipTitle,
} from '../../utils/customWidgetFloorBuckets'
import { readCustomGraphScopeDraft } from '../../utils/mergeCustomGraphScopeIntoApiParams'
import { buildMixedWidgetEnergyFloorBuckets, buildFloorBucketsFromSelectedAreaIds } from '../../utils/aggregateEnergyConsumptionByFloorScope'
import { mergeLeafPayloadIntoAreaFloorMap } from '../../utils/mergeLeafPayloadIntoAreaFloorMap'
import { normalizeDashboardFloorIds } from '../../utils/intersectDashboardGraphFloors'
import { calculatePeakMinFromOccupancyPayload } from '../../../../shared/dashboard/charts/transforms/calculatePeakMinFromOccupancyPayload'
import { formatPeakMinTimeLabel } from '../../../../shared/dashboard/charts/transforms/formatPeakMinTimeLabel'
import {
  SpaceLayoutRenderer,
  SpaceWidgetRenderer,
  SpaceUtilizationContainer,
  useSpaceUtilizationContainer,
  customizedSpaceContainerAdapter,
  createCustomizedSpaceLayoutAdapter,
  SPACE_TAB_IDS,
} from '../../../../shared/dashboard/space/container'
import { bindChartLoader } from '../../../../shared/dashboard/space/components'
import { SpaceErrorPanel, SpaceStatusPanel } from '../../../../shared/dashboard/space/components/status'
import { SpaceChartExportMenu } from '../../../../shared/dashboard/export/components'
import SPACE_CHART_DEFAULT_COLORS from '../../../../shared/dashboard/space/constants/chartPalette'
import {
  renderCustomizedSpaceWidgetSlot,
  createCustomizedSpaceLayoutAdapterStyles,
} from './customizedSpaceLayoutSlots'
import { formatDateForState, parseDateFromState } from '../../../../shared/dashboard/utils/dashboardDateState'
import DashboardDurationFilterBar from '../../../basic/screens/dashboard/DashboardDurationFilterBar'

function extendDashboardFloorIdsWithWidgetAreaIds(dFloors, widgetScopeDraft, areaIdToFloorMap) {
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

const ChartLoader = bindChartLoader('customized')

const DASHBOARD_PALETTE = [
  '#2196f3', // Blue (for 1st floor)
  '#4caf50', // Green (for 2nd floor)
  '#ff9800', // Orange (for 3rd floor)
  '#f44336', // Red (for 4th floor)
  '#9c27b0', // Purple (for 5th floor)
  '#00bcd4', // Cyan (for 6th floor)
  '#e91e63', // Pink
  '#009688', // Teal
  '#673ab7', // Deep Purple
  '#3f51b5', // Indigo
  '#ffc107', // Amber
  '#8bc34a', // Light Green
  '#03a9f4', // Light Blue
  '#ff5722', // Deep Orange
  '#607d8b', // Blue Grey
  '#795548', // Brown
  '#CDDC39', // Lime
  '#64FFDA', // Accent Teal
  '#FF4081', // Accent Pink
  '#536DFE', // Accent Blue
  '#FFAB40', // Accent Orange
  '#FF5252', // Accent Red
  '#B2FF59', // Accent Light Green
  '#E040FB', // Accent Purple
];

function getColorForName(name) {
  if (!name) return DASHBOARD_PALETTE[0];
  const s = String(name).toLowerCase().trim();

  // High-priority matching for floors to ensure consistency with system graphs
  if (s.includes("1st floor") || s.includes("floor 1") || s.includes("floor 01") || s === "1") return DASHBOARD_PALETTE[0]; // Blue
  if (s.includes("2nd floor") || s.includes("floor 2") || s.includes("floor 02") || s === "2") return DASHBOARD_PALETTE[1]; // Green
  if (s.includes("3rd floor") || s.includes("floor 3") || s.includes("floor 03") || s === "3") return DASHBOARD_PALETTE[2]; // Orange
  if (s.includes("4th floor") || s.includes("floor 4") || s.includes("floor 04") || s === "4") return DASHBOARD_PALETTE[3]; // Red
  if (s.includes("5th floor") || s.includes("floor 5") || s.includes("floor 05") || s === "5") return DASHBOARD_PALETTE[4]; // Purple
  if (s.includes("6th floor") || s.includes("floor 6") || s.includes("floor 06") || s === "6") return DASHBOARD_PALETTE[5]; // Cyan

  // Hash-based fallback for area names to maintain deterministic colors
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = s.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Use colors from index 6 onwards to avoid clashing with primary floor colors
  const index = Math.abs(hash) % (DASHBOARD_PALETTE.length - 6) + 6;
  return DASHBOARD_PALETTE[index];
}

/** Same rule as built-in occupancy line chart: day ? count; week/month/year ? %; custom range ? % if longer than one day. */
function shouldShowOccupancyPercentageForCustomGraph(selectedDuration, customDateRange) {
  if (selectedDuration === 'this-day') {
    return false
  }
  if (selectedDuration === 'custom') {
    if (customDateRange?.startDate && customDateRange?.endDate) {
      try {
        const startDate = new Date(customDateRange.startDate)
        const endDate = new Date(customDateRange.endDate)
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(0, 0, 0, 0)
        const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
        const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
        const diffTime = endDateOnly.getTime() - startDateOnly.getTime()
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1
        return diffDays > 1
      } catch {
        return true
      }
    }
    return true
  }
  return true
}

function isOccupancyByGroupApiPath(apiPath) {
  const p = String(apiPath || '').trim().toLowerCase().split('?')[0]
  return p.includes('/dashboard/occupancy_by_group')
}

// buildAreaNameToGroupNameMap imported from shared tooltip helper.

function isOccupancyCountLineApiPath(apiPath) {
  const p = String(apiPath || '').trim().toLowerCase()
  return p.includes('occupancy_count') || p.includes('space_utilization_per')
}

/**
 * Heuristic to detect if X-axis contains time/date labels.
 * Categorical bar charts (floors/groups) should use individual bar colors.
 * Time-series charts should generally use a single color.
 */
function isTimeBased(rows) {
  if (!rows || !rows.length) return false;
  const firstX = String(rows[0].x || '').toLowerCase();
  // Match YYYY-MM-DD, HH:MM, or common date strings
  if (/^\d{4}-\d{2}-\d{2}/.test(firstX)) return true;
  if (/^\d{1,2}:\d{2}/.test(firstX)) return true;
  if (firstX.includes('jan') || firstX.includes('feb') || firstX.includes('mar')) return true;
  return false;
}

/**
 * Peak/min strip on custom occupancy graphs: same rules as `calculatePeakMinFromChartData`.
 * Charts tab: prefer instant for instant paths (and occupancy for occupancy paths), then fall back to the
 * other series if the primary has no computable points ? matches built-in widgets when one fetch is empty.
 * Space Utilization tab: primary series only. Falls back to `raw` if Redux is not yet available.
 */
function peakMinForOccupancyCustomGraphCard(apiPathStr, raw, instantOccupancyCount, occupancyCount, showChartsTab) {
  const p = String(apiPathStr || '')
  const tryReduxPayload = (chartData) => {
    if (!chartData || typeof chartData !== 'object') return null
    if (String(chartData.status || '').toLowerCase() === 'error') return null
    if (!chartData['x-axis'] || !chartData['y-axis']) return null
    return calculatePeakMinFromOccupancyPayload(chartData)
  }

  let fromRedux = null
  if (p.includes('/dashboard/instant_occupancy_count')) {
    fromRedux = tryReduxPayload(instantOccupancyCount)
    if (
      showChartsTab &&
      (!fromRedux || (fromRedux.peak === null && fromRedux.min === null))
    ) {
      const alt = tryReduxPayload(occupancyCount)
      if (alt && (alt.peak !== null || alt.min !== null)) {
        fromRedux = alt
      }
    }
  } else if (p.includes('/dashboard/occupancy_count')) {
    fromRedux = tryReduxPayload(occupancyCount)
    if (
      showChartsTab &&
      (!fromRedux || (fromRedux.peak === null && fromRedux.min === null))
    ) {
      const alt = tryReduxPayload(instantOccupancyCount)
      if (alt && (alt.peak !== null || alt.min !== null)) {
        fromRedux = alt
      }
    }
  }
  if (fromRedux && (fromRedux.peak !== null || fromRedux.min !== null)) {
    return fromRedux
  }
  if (raw && typeof raw === 'object') {
    return calculatePeakMinFromOccupancyPayload(raw)
  }
  return null
}

/** Manage Area Groups name tokens ? used only by built-in Utilization by area list. */
/** Walk areaTree or floors array to find an area name by ID and normalize it to a "Parent / Name" path. */
function resolveAreaNameFromTree(id, tree, allFloors) {
  const search = (node, parentName = '') => {
    if (!node) return null
    if (Array.isArray(node)) {
      for (const item of node) {
        const found = search(item, parentName)
        if (found) return found
      }
      return null
    }
    const name = String(node.name || '').trim()
    if (String(node.id) === String(id)) {
      return parentName ? `${parentName} / ${name}` : name
    }
    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        const found = search(child, name)
        if (found) return found
      }
    }
    return null
  }
  let fullName = search(tree)

  // Fallback to the flat floors array if tree search failed
  if (!fullName && Array.isArray(allFloors)) {
    for (const f of allFloors) {
      const floorName = String(f.name || f.floor_name || '').trim()
      if (Array.isArray(f.areas)) {
        const match = f.areas.find(a => String(a.id || a.area_id) === String(id))
        if (match) {
          fullName = `${floorName} / ${String(match.name || match.area_name || '').trim()}`
          break
        }
      }
    }
  }

  return fullName ? fullName.replace(/\s*[>/]\s*/g, ' / ').trim().toLowerCase() : null
}

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
const COLORS = SPACE_CHART_DEFAULT_COLORS

/**
 * Isolated color picker portal ? holds its own state so opening/closing it
 * does NOT re-render SpaceUtilization or any chart component (prevents scroll-to-top).
 * Controlled imperatively via a ref: colorPickerRef.current.toggle(graphId, seriesName, x, y)
 */
const ColorPickerPortal = React.memo(React.forwardRef(function ColorPickerPortal(
  { getSeriesColor, setCustomColor, palette },
  ref
) {
  const [state, setState] = React.useState(null); // { graphId, seriesName, anchorX, anchorY }

  React.useImperativeHandle(ref, () => ({
    toggle(graphId, seriesName, anchorX, anchorY) {
      setState(prev =>
        prev?.graphId === graphId && prev?.seriesName === seriesName
          ? null
          : { graphId, seriesName, anchorX, anchorY }
      );
    },
    close() { setState(null); },
  }), []);

  if (!state) return null;

  const { graphId, seriesName, anchorX, anchorY } = state;
  const currentColor = getSeriesColor(graphId, seriesName);
  const pickerH = 180;
  const viewH = window.innerHeight || 800;
  const viewW = window.innerWidth || 800;
  const hasRoomBelow = anchorY + pickerH + 24 < viewH;

  return createPortal(
    <>
      {/* Transparent backdrop ? click anywhere outside to close */}
      <div
        onClick={() => setState(null)}
        style={{ position: 'fixed', inset: 0, zIndex: 99998, background: 'transparent', cursor: 'default' }}
      />
      {/* Color swatch grid */}
      <div
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: hasRoomBelow ? anchorY + 22 : Math.max(8, anchorY - pickerH - 10),
          left: Math.min(Math.max(8, anchorX - 10), viewW - 220),
          zIndex: 99999,
          backgroundColor: '#1e1e1e',
          border: '1px solid rgba(255,255,255,0.25)',
          borderRadius: '10px',
          padding: '12px',
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '8px',
          boxShadow: '0 16px 40px rgba(0,0,0,0.8)',
          minWidth: '180px',
        }}
      >
        {palette.map((c) => (
          <div
            key={c}
            onClick={(e) => { e.stopPropagation(); setCustomColor(graphId, seriesName, c); setState(null); }}
            style={{
              width: 24, height: 24, borderRadius: '6px',
              backgroundColor: c, cursor: 'pointer',
              border: currentColor === c ? '2px solid #fff' : '2px solid transparent',
              transition: 'transform 0.1s, border 0.1s',
              boxSizing: 'border-box',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.border = '2px solid #fff'; e.currentTarget.style.transform = 'scale(1.15)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.border = currentColor === c ? '2px solid #fff' : '2px solid transparent'; e.currentTarget.style.transform = 'scale(1)'; }}
          />
        ))}
      </div>
    </>,
    document.body
  );
}));

const SpaceUtilization = ({
  title,
  data,
  isLoading = false,
  globalLoadingProp = false,
  showOnlyInstantChart = false,
  showChartsTab = false,
  /** When set by Dashboard, custom graphs use the same `apiParams` as built-in chart thunks. `null` = wait / do not fetch. */
  dashboardApiParams,
}) => {
  const { role: spaceUtilUserRole } = UseAuth()
  /** Superadmin may rearrange/resize Space cards; Admin/Operator see shared layout only. */
  const spaceLayoutLocked = !isSuperadminRole(spaceUtilUserRole)
  const dispatch = useDispatch()
  const dashboardChartOrder = useSelector(selectDashboardChartOrder)
  const dashboardChartOrderStatus = useSelector(selectDashboardChartOrderStatus)

  function SortableDashboardItem({
    id,
    disabled,
    order,
    span,
    showSpanToggle,
    onToggleSpan,
    showHeightToggle,
    isFullscreen,
    onToggleFullscreen,
    rowSpan,
    children,
  }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
      useSortable({ id, disabled })
    const [isHovered, setIsHovered] = React.useState(false)
    const showControls = Boolean(isFullscreen || isHovered)

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.85 : (isFullscreen ? 0.35 : 1),
      cursor: disabled ? 'default' : 'grab',
      touchAction: 'none',
      width: '100%',
      height: id === 'peak_and_minimum_utilization' ? 'auto' : '100%',
      // Compact card: align to top of the grid cell instead of stretching
      alignSelf: id === 'peak_and_minimum_utilization' ? 'flex-start' : undefined,
      order: typeof order === 'number' ? order : undefined,
      gridColumn: span === 2 ? '1 / -1' : undefined,
      gridRow: rowSpan && Number(rowSpan) > 1 ? `span ${Number(rowSpan)}` : undefined,
      minHeight: 0,
      minWidth: 0,
      boxSizing: 'border-box',
      position: 'relative',
    }

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
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (typeof onToggleSpan === 'function') onToggleSpan(id)
                  }}
                  title={span === 2 ? 'Make half width' : 'Make full width'}
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
                  {span === 2 ? '½' : '↔'}
                </button>
              ) : null}
              {showHeightToggle ? (
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (typeof onToggleFullscreen === 'function') onToggleFullscreen(id)
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
                    onToggleFullscreen(id)
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
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (typeof onToggleFullscreen === 'function') onToggleFullscreen(id)
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
    )
  }

  const store = useStore()
  const theme = useTheme()
  const isMediumScreen = useMediaQuery(theme.breakpoints.up('md'))
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'))

  // Get floors and area data from Redux (Moved up to avoid TDZ errors in renderCustomGraphCard)
  const floors = useSelector((state) => state.floor.floors)
  const areaTree = useSelector((state) => state.floor.leafData)

  const areaIdToFloorId = useMemo(() => {
    const map = new Map()
    if (!Array.isArray(floors)) return map

    const traverse = (node, fid) => {
      if (!node || typeof node !== 'object') return
        // Map all possible ID variants to the floor ID
        ;['id', 'area_id', 'areaId', 'area_code', 'areaCode'].forEach((key) => {
          const val = node[key]
          if (val != null) map.set(String(val), String(fid))
        })
      // Also map by name (lowercase trim) as a fallback lookup key
      const name = String(node.name || node.area_name || '').trim().toLowerCase()
      if (name) map.set(name, String(fid))

      const children = node.areas || node.children || node.area_list
      if (Array.isArray(children)) {
        children.forEach((child) => traverse(child, fid))
      }
    }

    floors.forEach((f) => {
      const fid = f.id || f.floor_id || f.floorId
      if (!fid) return
      // Floor ID itself maps to itself
      map.set(String(fid), String(fid))
      const children = f.areas || f.children || f.area_list
      if (Array.isArray(children)) {
        children.forEach((a) => traverse(a, fid))
      }
    })
    return map
  }, [floors])

  const dashboardError = useSelector((state) => state.dashboard.error)
  const occupancyCountLoading = useSelector((state) => state.dashboard.occupancyCountLoading || false)
  const occupancyByGroupLoading = useSelector((state) => state.dashboard.occupancyByGroupLoading || false)
  const spaceUtilizationLoading = useSelector((state) => state.dashboard.spaceUtilizationLoading || false)
  const instantOccupancyCountLoading = useSelector((state) => state.dashboard.instantOccupancyCountLoading || false)
  const instantOccupancyCountError = useSelector((state) => state.dashboard.instantOccupancyCountError || null)

  const occupancyByGroup = useSelector(selectOccupancyByGroup)
  const spaceUtilizationPerArea = useSelector(selectSpaceUtilizationPerArea)
  const occupancyByGroupFromLogs = useSelector(selectOccupancyByGroupFromLogs)
  const spaceUtilizationPerFromLogs = useSelector(selectSpaceUtilizationPerFromLogs)
  const occupancyByGroupFromLogsLoading = useSelector(selectOccupancyByGroupFromLogsLoading)
  const spaceUtilizationPerFromLogsLoading = useSelector(selectSpaceUtilizationPerFromLogsLoading)
  const selectedAreas = useSelector(selectSelectedAreas)
  const selectedFloorIds = useSelector(selectSelectedFloorIds)
  const selectedGroupIds = useSelector(selectSelectedGroupIds)
  const selectedDuration = useSelector(selectSelectedDuration)
  const customDateRange = useSelector(selectCustomDateRange)
  const occupancyCount = useSelector(selectOccupancyCount)
  const instantOccupancyCount = useSelector(selectInstantOccupancyCount)
  const currentDate = useSelector(selectCurrentDate)
  const currentYear = useSelector(selectCurrentYear)
  const isNavigating = useSelector(selectIsNavigating)
  const globalLoading = useSelector(selectGlobalLoading)
  const customWidgetFilters = useSelector(selectCustomWidgetFilters)
  const widgetList = useSelector(getWidgetList)
  const customGraphs = useSelector(selectCustomGraphs)
  const areaGroups = useSelector(selectAreaGroups)
  const areaGroupsLoading = useSelector(selectAreaGroupsLoading)
  const areaGroupsError = useSelector(selectAreaGroupsError)

  // Use _from_logs data when in Charts tab, otherwise use regular data
  const activeOccupancyByGroup = showChartsTab ? occupancyByGroupFromLogs : occupancyByGroup
  const activeSpaceUtilizationPerArea = showChartsTab ? spaceUtilizationPerFromLogs : spaceUtilizationPerArea

  const chartHeaderStyle = useMemo(() => ({
    margin: 0,
    color: '#fff',
    fontWeight: 600,
    fontFamily: 'inherit',
    fontSize: isLargeScreen ? '18px' : '16px'
  }), [isLargeScreen])

  const exportDropdownRef = useRef(null)
  const lastCustomFetchParamsRef = useRef('');
  const [hasInitialized, setHasInitialized] = useState(false)
  /** Same as Dashboard: "today" for non-navigating preset ranges (avoid customDateRange leaking custom + ISO). */
  const stableDateRef = useRef(new Date())

  // Export controls for custom graph cards
  const [customGraphExportOpenId, setCustomGraphExportOpenId] = useState(null)
  const customGraphExportDropdownRef = useRef(null)
  const [customGraphExportLoading, setCustomGraphExportLoading] = useState({})
  const [focusedCustomSeriesByGraph, setFocusedCustomSeriesByGraph] = useState({})

  // Custom color assignments per graph (localStorage-persisted, custom graphs only)
  const [customSeriesColors, setCustomSeriesColors] = useState(() => {
    try {
      const raw = localStorage.getItem('customGraphSeriesColors');
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  });
  // Ref to the isolated ColorPickerPortal ? open/close without re-rendering SpaceUtilization
  const colorPickerRef = useRef(null);

  const getCustomColor = useCallback((graphId, seriesName) => {
    return customSeriesColors?.[graphId]?.[seriesName] || null;
  }, [customSeriesColors]);

  const getSeriesColor = useCallback((graphId, seriesName) => {
    const key = String(seriesName || '').trim();
    if (!key) return DASHBOARD_PALETTE[0];

    // 1. Check for user-customized color from picker
    const custom = getCustomColor(graphId, key);
    if (custom) return custom;

    // 2. Default colors for generic series keys
    if (key === 'y' || key === 'Occupancy' || key === 'Utilization') return DASHBOARD_PALETTE[0];
    if (key === 'data' || key === 'Count') return DASHBOARD_PALETTE[1];

    // 3. Fallback to deterministic floor/area mapping
    return getColorForName(key);
  }, [getCustomColor]);

  const setCustomColor = useCallback((graphId, seriesName, color) => {
    setCustomSeriesColors((prev) => {
      const next = { ...prev, [graphId]: { ...(prev?.[graphId] || {}), [seriesName]: color } };
      try { localStorage.setItem('customGraphSeriesColors', JSON.stringify(next)); } catch { }
      return next;
    });
  }, []);

  const handleLegendClick = useCallback((graphId, e) => {
    const key = String(e?.dataKey ?? e?.value ?? '').trim();
    if (!key) return;
    setFocusedCustomSeriesByGraph((prev) => ({
      ...prev,
      [graphId]: prev?.[graphId] === key ? '' : key,
    }));
  }, []);


  // Use global loading state from Redux for time range changes

  // Snackbar state for email notifications
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState('success')

  // Email dialog state - DISABLED: No popup, using saved email only

  // Snackbar handlers
  const handleSnackbarClose = () => {
    setSnackbarOpen(false)
  }

  const showSnackbar = (message, severity = 'success') => {
    setSnackbarMessage(message)
    setSnackbarSeverity(severity)
    setSnackbarOpen(true)
  }

  // User profile for email functionality
  const userProfile = useSelector((state) => state.user?.profile)

  // Duplicated selectors removed to resolve TDZ issues

  // Ensure area groups are loaded so group_scope display names can resolve (office room, passage 2, etc.)
  useEffect(() => {
    const hasAnyGroups =
      Boolean(areaGroups?.user_area_groups?.length) ||
      Boolean(areaGroups?.special_area_groups?.length)
    if (!hasAnyGroups && !areaGroupsLoading && !areaGroupsError) {
      dispatchFetchAreaGroupsOnce(dispatch, fetchAreaGroups)
    }
  }, [dispatch, areaGroups, areaGroupsLoading, areaGroupsError])

  const allAreaGroupsForLookup = useMemo(
    () => buildAreaGroupIdNameMap(areaGroups),
    [areaGroups]
  )

  /** When occupancy_by_group API omits names, match group_id to Manage Area Groups list. */
  const resolveOccupancyGroupLabel = useCallback(
    (group, index) => resolveOccupancyGroupDisplayName(group, index, allAreaGroupsForLookup),
    [allAreaGroupsForLookup]
  )

  const [customGraphData, setCustomGraphData] = useState({})
  const [customGraphLoading, setCustomGraphLoading] = useState({})
  const [customGraphError, setCustomGraphError] = useState({})

  const [spaceCardOrder, setSpaceCardOrder] = useState([])
  const [spaceCardSpan, setSpaceCardSpan] = useState({})
  const [spaceFullscreenCardId, setSpaceFullscreenCardId] = useState(null)
  const [builtinOvTick, setBuiltinOvTick] = useState(0)
  const spaceMergedOrderRef = useRef([])

  useEffect(() => {
    const h = () => setBuiltinOvTick((t) => t + 1)
    window.addEventListener('builtinWidgetOverridesUpdated', h)
    return () => window.removeEventListener('builtinWidgetOverridesUpdated', h)
  }, [])

  const resolveCustomSpaceExport = useCallback((apiPath) => {
    const p = String(apiPath || '').trim()
    if (!p) return null

    if (p.includes('/dashboard/instant_occupancy_count')) {
      return {
        label: 'Instant Occupancy Count',
        emailThunk: sendInstantOccupancyCountEmail,
        downloadThunk: downloadInstantOccupancyCount,
      }
    }
    if (p.includes('/dashboard/occupancy_by_group_from_logs')) {
      return {
        label: 'Occupancy by Group (Charts)',
        emailThunk: sendOccupancyByGroupFromLogsEmail,
        downloadThunk: downloadOccupancyByGroupFromLogs,
      }
    }
    if (p.includes('/dashboard/occupancy_by_group')) {
      return {
        label: 'Occupancy by Group',
        emailThunk: sendOccupancyByGroupEmail,
        downloadThunk: downloadOccupancyByGroup,
      }
    }
    if (p.includes('/dashboard/space_utilization_per_from_logs')) {
      return {
        label: 'Utilization By Area (Charts)',
        emailThunk: sendSpaceUtilizationPerFromLogsEmail,
        downloadThunk: downloadSpaceUtilizationPerFromLogs,
      }
    }
    if (p.includes('/dashboard/space_utilization_per')) {
      return {
        label: 'Utilization By Area',
        emailThunk: sendSpaceUtilizationPerEmail,
        downloadThunk: downloadSpaceUtilizationPer,
      }
    }
    if (p.includes('/dashboard/occupancy_count')) {
      return {
        label: 'Utilization',
        emailThunk: sendOccupancyCountEmail,
        downloadThunk: downloadOccupancyCount,
      }
    }

    return null
  }, [
    downloadInstantOccupancyCount,
    sendInstantOccupancyCountEmail,
    downloadOccupancyByGroupFromLogs,
    sendOccupancyByGroupFromLogsEmail,
    downloadOccupancyByGroup,
    sendOccupancyByGroupEmail,
    downloadSpaceUtilizationPerFromLogs,
    sendSpaceUtilizationPerFromLogsEmail,
    downloadSpaceUtilizationPer,
    sendSpaceUtilizationPerEmail,
    downloadOccupancyCount,
    sendOccupancyCountEmail,
  ])

  const handleCustomGraphExport = useCallback(async (action, g) => {
    const id = String(g?.id ?? g?.name ?? '')
    const apiPath = String(g?.api_path || '')
    const resolved = resolveCustomSpaceExport(apiPath)
    if (!resolved) {
      showSnackbar('Export not supported for this graph.', 'error')
      return
    }

    const busyKey = `${id}_${action}`
    setCustomGraphExportOpenId(null)
    setCustomGraphExportLoading((prev) => ({ ...prev, [busyKey]: true }))

    try {
      // Use merged scope from widget settings + dashboard context
      const mergedParams = applyCustomGraphGroupScopedParams(() => store.getState(), {
        areaIds: selectedAreas.length > 0 ? selectedAreas : null,
        floorIds: selectedFloorIds && selectedFloorIds.length > 0 ? selectedFloorIds : null,
        groupIds: selectedGroupIds && selectedGroupIds.length > 0 ? selectedGroupIds : null,
        timeRange: selectedDuration,
        startDate: customDateRange.startDate,
        endDate: customDateRange.endDate,
        isNavigating: isNavigating,
      }, g);

      const apiParams = {
        ...mergedParams,
        // For exports, if it's a built-in virtual graph with no explicit widget-level scope,
        // we might still want to enforce floor > area priority to match UI.
        // But for custom widgets, we send exactly what mergedParams resolved.
        areaIds: (String(id).startsWith('builtin_') && mergedParams.floorIds && mergedParams.floorIds.length > 0)
          ? []
          : (mergedParams.areaIds || []),
        floorIds: mergedParams.floorIds || [],
        groupIds: mergedParams.groupIds || [],
      }

      if (action === 'download') {
        const result = await dispatch(resolved.downloadThunk(apiParams))
        if (result.type.endsWith('/fulfilled')) {
          showSnackbar(`${resolved.label} report downloaded successfully!`, 'success')
        } else {
          showSnackbar(result.payload || 'Failed to start download.', 'error')
        }
        return
      }

      // email
      const configs = await dispatch(fetchEmailConfigs()).unwrap()
      if (!Array.isArray(configs) || configs.length === 0) {
        showSnackbar('Email Server settings not configured', 'error')
        return
      }

      const latestConfig = configs[0]
      const hasServerName = latestConfig.server_name && latestConfig.server_name.trim() !== ''
      const hasPort = latestConfig.port && latestConfig.port > 0
      const hasServerEmail = latestConfig.server_email && latestConfig.server_email.trim() !== ''
      const hasSenderName = latestConfig.sender_name && latestConfig.sender_name.trim() !== ''

      if (!hasServerName || !hasPort || !hasServerEmail || !hasSenderName) {
        showSnackbar('Email Server settings not configured', 'error')
        return
      }

      const email = userProfile?.email?.trim()
      if (!email) {
        showSnackbar('No email address found for logged-in user. Please check your profile.', 'error')
        return
      }

      const result = await dispatch(
        resolved.emailThunk({
          toEmail: email,
          ...apiParams,
        })
      )

      if (result.type.endsWith('/fulfilled')) {
        showSnackbar(`${resolved.label} report sent successfully!`, 'success')
      } else {
        showSnackbar(result.payload || 'Failed to send email.', 'error')
      }
    } catch (e) {
      showSnackbar('Export failed. Please try again.', 'error')
    } finally {
      setCustomGraphExportLoading((prev) => ({ ...prev, [busyKey]: false }))
    }
  }, [
    dispatch,
    showSnackbar,
    userProfile,
    selectedFloorIds,
    selectedAreas,
    selectedGroupIds,
    selectedDuration,
    customDateRange,
    isNavigating,
    resolveCustomSpaceExport,
    downloadInstantOccupancyCount,
    sendInstantOccupancyCountEmail,
    downloadOccupancyByGroupFromLogs,
    sendOccupancyByGroupFromLogsEmail,
    downloadOccupancyByGroup,
    sendOccupancyByGroupEmail,
    downloadSpaceUtilizationPerFromLogs,
    sendSpaceUtilizationPerFromLogsEmail,
    downloadSpaceUtilizationPer,
    sendSpaceUtilizationPerEmail,
    downloadOccupancyCount,
    sendOccupancyCountEmail,
    store,
  ])

  const renderCustomGraphCard = useCallback(
    (g) => {
      const id = String(g?.id ?? g?.name ?? '')
      const graphType = String(g?.graph_type || 'bar').toLowerCase()
      const apiPathStr = String(g?.api_path ?? '')
      const isSpaceUtilizationPer = apiPathStr.includes('/dashboard/space_utilization_per')
      const occupancyCountLineChart = isOccupancyCountLineApiPath(apiPathStr)
      const showOccupancyPercentage =
        occupancyCountLineChart && shouldShowOccupancyPercentageForCustomGraph(selectedDuration, customDateRange)
      const exportCfg = resolveCustomSpaceExport(g?.api_path)
      const isLoading = Boolean(customGraphLoading[id])
      const err = customGraphError[id]
      const raw = customGraphData[id]

      const CenterMessage = ({ title, subtitle }) => (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            gap: 0.75,
            p: 2,
            boxSizing: 'border-box',
          }}
        >
          <Box sx={{ fontWeight: 900, fontSize: 16 }}>{title}</Box>
          {subtitle ? <Box sx={{ opacity: 0.8, fontSize: 12, lineHeight: 1.35 }}>{subtitle}</Box> : null}
        </Box>
      )

      const toNumberOrNull = (v) => {
        if (v === null || v === undefined) return null
        if (v === 'null' || v === 'None' || v === '') return null
        if (typeof v === 'string' && v.includes('%')) {
          const n = parseFloat(v.replace('%', ''));
          return Number.isFinite(n) ? n : null;
        }
        const n = Number(v)
        return Number.isFinite(n) ? n : null
      }

      const normalizeToXY = (r) => {
        if (!r) return { rows: [], seriesKeys: [] }

        // occupancy_by_group endpoints return arrays; normalize to category bars by group name.
        if (Array.isArray(r) || (r && typeof r === 'object' && Array.isArray(r.data))) {
          const scope = String(g?.group_scope || '').trim().toLowerCase()
          const arr0 = Array.isArray(r?.data) ? r.data : (Array.isArray(r) ? r : []);

          // Enforce dropdown scope on the response too (backend may return mixed groups).
          const lists = [
            ...(areaGroups?.special_area_groups || []),
            ...(areaGroups?.user_area_groups || []),
          ]
          const allowId = (() => {
            if (scope !== 'special_only' && scope !== 'user_only' && scope !== 'special_and_user') return null
            const allowed = new Set()
            for (const gr of lists) {
              if (!gr || typeof gr !== 'object') continue
              const ok =
                scope === 'special_only'
                  ? isSpecialAreaGroup(gr)
                  : scope === 'user_only'
                    ? !isSpecialAreaGroup(gr)
                    : true
              if (!ok) continue
              const idRaw = gr.group_id ?? gr.id
              const id = typeof idRaw === 'number' ? idRaw : parseInt(String(idRaw), 10)
              if (!Number.isNaN(id)) allowed.add(String(id))
            }
            return allowed.size ? allowed : null
          })()
          const allowName = (() => {
            if (scope !== 'special_only' && scope !== 'user_only' && scope !== 'special_and_user') return null
            const allowed = new Set()
            for (const gr of lists) {
              if (!gr || typeof gr !== 'object') continue
              const ok =
                scope === 'special_only'
                  ? isSpecialAreaGroup(gr)
                  : scope === 'user_only'
                    ? !isSpecialAreaGroup(gr)
                    : true
              if (!ok) continue
              const name = String(gr?.name ?? '').trim().toLowerCase()
              if (name) allowed.add(name)
            }
            return allowed.size ? allowed : null
          })()

          const filtered = allowId
            ? arr0.filter((row) => {
              const gid = row?.group_id ?? row?.area_group_id ?? row?.id ?? row?.groupId
              const rowName = String(row?.area_group_name ?? row?.name ?? row?.group_name ?? '').trim().toLowerCase()
              if (gid != null && allowId.has(String(gid))) return true
              if (allowName && rowName && allowName.has(rowName)) return true
              return false
            })
            : null

          // When a scope is selected, it must be authoritative.
          // If we can't match any rows for that scope, show no data rather than falling back to mixed groups.
          const arr = allowId ? (filtered || []) : arr0
          const seriesKeys = []
          const rowObj = { x: 'Occupancy' }

          arr
            .filter((x) => x && typeof x === 'object')
            .forEach((row, idx) => {
              const name = resolveOccupancyGroupLabel(row, idx)
              const occPct =
                row.occupied_percentage !== undefined
                  ? Number(row.occupied_percentage) || 0
                  : (() => {
                    const totalPossible = Number(row.total_possible) || 0
                    const totalOccupied = Number(row.total_occupied) || 0
                    return totalPossible > 0 ? Math.min((totalOccupied / totalPossible) * 100, 100) : 0
                  })()
              rowObj[name] = occPct
              seriesKeys.push(name)
            })

          return { rows: [rowObj], seriesKeys }
        }

        if (typeof r !== 'object' || !r) return { rows: [], seriesKeys: [] }

        // Support for /dashboard/space_utilization_per format: { utilized_area: [...] }
        if (r.utilized_area && Array.isArray(r.utilized_area)) {
          // For Bar and Line charts, aggregate by floor if multiple areas are present.
          if (graphType === 'bar' || graphType === 'line') {
            const floorMap = new Map()
            r.utilized_area.forEach((area) => {
              const nameStr = String(area.name || '').trim()
              const lowerName = nameStr.toLowerCase()

              // Skip aggregate/summary rows that don't represent specific floors or areas
              if (
                !lowerName ||
                lowerName === 'project' ||
                lowerName === 'total' ||
                lowerName === 'all areas' ||
                lowerName === 'combined areas' ||
                lowerName === 'all floors' ||
                lowerName === 'portfolio' ||
                lowerName === 'global' ||
                lowerName === 'summary'
              )
                return

              const aid = area.id || area.area_id || area.areaId || area.area_code
              const aidName = nameStr.toLowerCase()
              // Try matching by ID variants first, then by name, then by explicit floor fields
              const fid =
                (aid ? areaIdToFloorId.get(String(aid)) : null) ||
                (aidName ? areaIdToFloorId.get(aidName) : null) ||
                area.floor_id ||
                area.floorId

              let fName = null

              if (fid) {
                const f = floors?.find((x) => String(x.id || x.floor_id) === String(fid))
                if (f) fName = f.name || f.floor_name || null
              } else {
                // Fallback 1: check if the name itself matches a floor name
                const floorByName = floors?.find((f) => (f.name || f.floor_name) === nameStr)
                if (floorByName) {
                  fName = nameStr
                } else if (nameStr.includes(' / ')) {
                  // Fallback 2: extract floor from "Floor / Area" name
                  fName = nameStr.split(' / ')[0].trim()
                }
              }

              if (!fName) return // Remove the "Unknown Floor" bar by skipping unresolvable data points

              if (!floorMap.has(fName)) {
                floorMap.set(fName, { total: 0, count: 0, areaNames: [] })
              }
              const group = floorMap.get(fName)
              const val = toNumberOrNull(area.occupied ?? area.percentage ?? area.val)
              if (val !== null) {
                group.total += val
                group.count++
                let aName = area.name || `Area ${aid || '?'}`
                // Strip floor name prefix if present (e.g., "3rd Floor / Room" -> "Room") for cleaner tooltips
                const currentFloorLower = fName.trim().toLowerCase()
                if (aName.includes(' / ')) {
                  const parts = aName.split(' / ')
                  if (parts[0].trim().toLowerCase() === currentFloorLower) {
                    aName = parts.slice(1).join(' / ').trim()
                  }
                }
                group.areaNames.push(aName)
              }
            })

            const countLeafAreas = (node) => {
              if (!node || typeof node !== 'object') return 0
              const children = node.areas || node.children || node.area_list
              if (!Array.isArray(children) || children.length === 0) return 1
              return children.reduce((sum, child) => sum + countLeafAreas(child), 0)
            }

            const rows = Array.from(floorMap.entries()).map(([fName, data]) => {
              const trimmedFName = fName.trim().toLowerCase()
              const f = floors?.find((x) => {
                const fn = (x.name || x.floor_name || '').trim().toLowerCase()
                return fn === trimmedFName
              })
              const totalLeafAreas = f ? countLeafAreas(f) : 0

              // Selection is "Full Floor" if:
              // 1. Single summary row for the floor (count=1 and name matches)
              // 2. OR we have collected all leaf areas for this floor.
              const isFullFloor =
                (data.count === 1 && data.areaNames[0].trim().toLowerCase() === trimmedFName) ||
                (totalLeafAreas > 0 && data.count >= totalLeafAreas)

              // Show area names ONLY for partial selections (count > 0 and not full).
              const shouldShowAreaList = !isFullFloor && data.count > 0 && data.count <= 30

              return {
                x: fName,
                y: data.count > 0 ? data.total / data.count : 0,
                tooltipTitle: shouldShowAreaList
                  ? `${fName}: ${data.areaNames.join(', ')}`
                  : fName,
              }
            })

            // Sort floors by name to ensure consistent ordering
            rows.sort((a, b) => a.x.localeCompare(b.x))

            // Do not mutate `r` ? payloads from Redux/Immer are often non-extensible
            // (`Cannot add property __isPerFloorEnergyData`). Return flags with rows.
            return {
              rows,
              seriesKeys: ['y'],
              isPerFloorEnergyData: true,
              perFloorTooltipTitles: rows.map((row) => row.tooltipTitle),
            }
          }
          // For Pie and Circular charts, we want each area to be a distinct series/slice.
          const seriesKeys = []
          const rowObj = { x: 'Utilization' }
          r.utilized_area.forEach((area, idx) => {
            const name = area.name || `Area ${idx + 1}`
            const val = toNumberOrNull(area.occupied ?? area.percentage ?? area.val)
            rowObj[name] = val
            seriesKeys.push(name)
          })
          return { rows: [rowObj], seriesKeys }
        }

        const xAxis = Array.isArray(r?.['x-axis']) ? r['x-axis'] : null
        const yAxisObj = r?.['y-axis'] && typeof r?.['y-axis'] === 'object' && !Array.isArray(r?.['y-axis']) ? r['y-axis'] : null

        if (xAxis && yAxisObj) {
          let targetYAxisObj = yAxisObj;
          if (Array.isArray(yAxisObj.data)) {
            const isArrayOfObjects = yAxisObj.data.length > 0 && typeof yAxisObj.data[0] === 'object' && yAxisObj.data[0] !== null && 'data' in yAxisObj.data[0];
            if (isArrayOfObjects) {
              targetYAxisObj = {};
              yAxisObj.data.forEach(s => {
                if (s.name && Array.isArray(s.data)) {
                  targetYAxisObj[s.name] = s.data;
                }
              });
            }
          }

          const seriesKeys = Object.keys(targetYAxisObj)
          const len = xAxis.length
          const rows = Array.from({ length: len }).map((_, i) => {
            const row = { x: xAxis[i] }
            for (const k of seriesKeys) {
              const arr = targetYAxisObj?.[k]
              row[k] = toNumberOrNull(Array.isArray(arr) ? arr[i] : null)
            }
            if (Array.isArray(r?.__perFloorTooltipTitles) && r.__perFloorTooltipTitles[i]) {
              row.tooltipTitle = r.__perFloorTooltipTitles[i]
            }
            return row
          })
          return { rows, seriesKeys }
        }

        const seriesKey =
          Array.isArray(r?.consumption)
            ? 'consumption'
            : Array.isArray(r?.savings)
              ? 'savings'
              : Array.isArray(r?.utilization)
                ? 'utilization'
                : Array.isArray(r?.occupancy)
                  ? 'occupancy'
                  : null

        if (xAxis && seriesKey) {
          const y = r?.[seriesKey]
          const len = Math.min(xAxis.length, Array.isArray(y) ? y.length : 0)
          const rows = Array.from({ length: len }).map((_, i) => ({ x: xAxis[i], y: toNumberOrNull(y[i]) }))
          return { rows, seriesKeys: ['y'] }
        }

        return { rows: [], seriesKeys: [] }
      }

      const isAnyFullscreen = Boolean(spaceFullscreenCardId)

      // Fullscreen: also vary dash patterns to distinguish similar hues.
      const dashPatterns = ['0', '8 3', '3 3', '12 4', '2 4', '10 2 2 2', '14 5', '6 2 2 2']


      return (
        <>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: { xs: 1.5, sm: 2, md: 2.5, lg: 3, xl: 3.5 },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
              <Box
                component="h3"
                sx={{
                  ...chartHeaderStyle,
                  m: 0,
                  fontSize: 16,
                  letterSpacing: 0.2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {g?.name || 'Custom Graph'}
              </Box>
            </Box>

            {exportCfg ? (
              <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, position: 'relative' }}>
                <button
                  type="button"
                  data-custom-export-button="1"
                  onClick={() => {
                    setCustomGraphExportOpenId((prev) => (prev === id ? null : id))
                  }}
                  style={{
                    background: 'none',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.22)',
                    borderRadius: 10,
                    padding: '7px 12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontSize: 13,
                    letterSpacing: 0.2,
                  }}
                  title="Export this graph"
                >
                  <FileUploadIcon fontSize="small" /> Export
                </button>

                {customGraphExportOpenId === id ? (
                  <div
                    ref={customGraphExportDropdownRef}
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 10px)',
                      right: 0,
                      backgroundColor: '#CDC0A0',
                      border: '1px solid #444',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      zIndex: 1000,
                      minWidth: 200,
                      padding: '8px 0',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleCustomGraphExport('email', g)}
                      disabled={Boolean(customGraphExportLoading[`${id}_email`])}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: 'none',
                        background: 'none',
                        cursor: customGraphExportLoading[`${id}_email`] ? 'not-allowed' : 'pointer',
                        textAlign: 'left',
                        fontSize: 14,
                        color: customGraphExportLoading[`${id}_email`] ? '#999' : '#fff',
                        fontWeight: 700,
                        opacity: customGraphExportLoading[`${id}_email`] ? 0.7 : 1,
                        borderBottom: '1px solid #444',
                      }}
                    >
                      {customGraphExportLoading[`${id}_email`] ? 'Sending...' : 'Send By Email'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCustomGraphExport('download', g)}
                      disabled={Boolean(customGraphExportLoading[`${id}_download`])}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: 'none',
                        background: 'none',
                        cursor: customGraphExportLoading[`${id}_download`] ? 'not-allowed' : 'pointer',
                        textAlign: 'left',
                        fontSize: 14,
                        color: customGraphExportLoading[`${id}_download`] ? '#999' : '#fff',
                        fontWeight: 700,
                        opacity: customGraphExportLoading[`${id}_download`] ? 0.7 : 1,
                      }}
                    >
                      {customGraphExportLoading[`${id}_download`] ? 'Downloading...' : 'Download To PC'}
                    </button>
                  </div>
                ) : null}
              </Box>
            ) : null}
          </Box>

          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              alignItems: 'stretch',
              justifyContent: 'flex-start',
              backgroundColor: DASHBOARD_CHART_PLOT_BACKGROUND,
              borderRadius: '14px',
              color: '#fff',
              fontSize: '14px',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.10)',
            }}
          >
            {(() => {
              if (!id) return <CenterMessage title="No data" />
              if (isLoading) return <CenterMessage title="Loading?" subtitle="Fetching chart data" />
              if (err) return <CenterMessage title="Error" subtitle={String(err)} />
              if (raw == null) return <CenterMessage title="No data" />

              if (typeof raw === 'string') return <CenterMessage title={raw} />
              if (raw && typeof raw === 'object') {
                const st = String(raw.status || raw.state || '').toLowerCase()
                if (st === 'error') return <CenterMessage title="Error" subtitle={String(raw.message || raw.detail || 'Error')} />

                const {
                  rows,
                  seriesKeys,
                  isPerFloorEnergyData: normalizedPerFloor = false,
                  perFloorTooltipTitles: normalizedPerFloorTooltips,
                } = normalizeToXY(raw)
                const isPerFloorEnergyData =
                  normalizedPerFloor === true || raw?.__isPerFloorEnergyData === true
                const perFloorTooltipTitles = Array.isArray(normalizedPerFloorTooltips)
                  ? normalizedPerFloorTooltips
                  : raw?.__perFloorTooltipTitles
                let effectiveRows = rows
                let effectiveSeriesKeys = seriesKeys

                // Frontend aggregation (Option B): when group_scope is set but backend returns per-area series
                // (e.g. EL/TEST), aggregate areas into area-group names (office room/passage 2) for display.
                const scope = String(g?.group_scope || '').trim().toLowerCase()
                if (
                  isAreaGroupChartScope(scope) &&
                  Array.isArray(seriesKeys) &&
                  seriesKeys.length > 0 &&
                  seriesKeys[0] !== 'y'
                ) {
                  const areaNameToGroup = buildAreaNameToGroupNameMap(areaGroups, scope)
                  const hasAny = seriesKeys.some((k) => areaNameToGroup.has(String(k).trim()))
                  if (hasAny) {
                    const groupSet = new Set()
                    effectiveRows = (rows || []).map((r) => {
                      // Keep original per-area keys so tooltip can show group -> areas breakdown.
                      const next = { ...(r && typeof r === 'object' ? r : {}), x: r?.x }
                      for (const k of seriesKeys) {
                        const key = String(k).trim()
                        const gnames = areaNameToGroup.get(key)
                        if (!Array.isArray(gnames) || gnames.length === 0) continue
                        const v = Number(toNumberOrNull(r?.[k])) || 0
                        for (const gname of gnames) {
                          next[gname] = (Number(next[gname]) || 0) + v
                          groupSet.add(gname)
                        }
                      }
                      return next
                    })
                    effectiveSeriesKeys = Array.from(groupSet)
                  }
                }

                const focused = focusedCustomSeriesByGraph?.[id] || ''

                // Detect categorical charts (e.g. Single series like 'Count' or 'y' but across different floors/areas)
                // that should have per-category colors and a multi-item legend for individual color control.
                const isCategoricalChart =
                  (graphType === 'bar' || graphType === 'line' || graphType === 'pie' || graphType === 'circular') &&
                  effectiveSeriesKeys.length === 1 &&
                  effectiveRows.length > 0 &&
                  !isTimeBased(effectiveRows);

                const customLegendPayload = isCategoricalChart
                  ? effectiveRows.map((r, i) => ({
                    value: r.x,
                    type: 'rect',
                    color: getSeriesColor(id, r.x),
                    payload: { value: r.x, dataKey: r.x },
                    inactive: focused && focused !== r.x
                  }))
                  : (graphType === 'pie' || graphType === 'circular')
                    ? effectiveSeriesKeys.map((k) => ({
                      value: isOccupancyByGroupApiPath(String(g?.api_path ?? ''))
                        ? resolveOccupancyGroupDisplayName(areaGroups, k)
                        : k,
                      type: 'rect',
                      color: getSeriesColor(id, k),
                      payload: { value: k, dataKey: k },
                      inactive: focused && focused !== k
                    }))
                    : undefined;

                const renderCustomLegend = (props) => {
                  const { payload } = props;
                  if (!payload || !payload.length) return null;
                  return (
                    <Box sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'center',
                      gap: '12px 16px',
                      mt: 2,
                      px: 1,
                      maxHeight: '120px',
                      overflowY: 'auto',
                      width: '100%',
                      '&::-webkit-scrollbar': { width: '6px' },
                      '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '3px' }
                    }}>
                      {payload.map((entry, index) => {
                        const rawKey = String(entry.value);
                        const displayName = rawKey === 'y' ? 'Value' : (rawKey === 'data' ? 'Count' : rawKey);
                        const color = getSeriesColor(id, rawKey);

                        return (
                          <Box key={`legend-${index}`} sx={{ display: 'flex', alignItems: 'center', gap: 1, position: 'relative' }}>
                            <Box
                              onPointerDown={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                const rect = e.currentTarget.getBoundingClientRect();
                                colorPickerRef.current?.toggle(id, rawKey, rect.left, rect.top);
                              }}
                              sx={{
                                width: 14,
                                height: 14,
                                borderRadius: '50%',
                                backgroundColor: color,
                                cursor: 'pointer',
                                border: '2px solid rgba(255,255,255,0.5)',
                                flexShrink: 0,
                                '&:hover': { transform: 'scale(1.3)', border: '2px solid #fff' },
                                transition: 'transform 0.15s, border 0.15s'
                              }}
                              title="Click to change color"
                            />
                            <Typography
                              onClick={() => handleLegendClick && handleLegendClick(id, { value: rawKey })}
                              sx={{
                                fontSize: '12px',
                                color: '#fff',
                                cursor: 'pointer',
                                opacity: (focused && focused !== rawKey) ? 0.4 : 0.9,
                                fontWeight: focused === rawKey ? 900 : 600,
                                userSelect: 'none',
                                whiteSpace: 'nowrap',
                                '&:hover': { opacity: 1 }
                              }}
                            >
                              {isOccupancyByGroupApiPath(String(apiPathStr || '')) ? resolveOccupancyGroupDisplayName(areaGroups, displayName) : displayName}
                            </Typography>
                          </Box>
                        );
                      })}
                    </Box>
                  );
                };

                if (graphType === 'table') {
                  if (!effectiveRows.length) return <CenterMessage title="No data" />
                  const sk = (effectiveSeriesKeys && effectiveSeriesKeys.length) ? effectiveSeriesKeys[0] : 'y'
                  const totalValue = effectiveRows.reduce((acc, r) => acc + (Number(toNumberOrNull(r?.[sk])) || 0), 0)
                  const unit = String(raw.unit || inferUnitFromApiPath(g?.api_path) || inferUnitFromChartTitle(g?.name) || '').trim()

                  return (
                    <Box sx={{ width: '100%', height: '100%', overflow: 'auto', p: { xs: 1.5, sm: 2, md: 3 } }}>
                      <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: '1px solid rgba(255,255,255,0.2)',
                        pb: 1,
                        mb: 2.5
                      }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '13px', letterSpacing: '0.8px', color: '#fff', opacity: 0.9 }}>
                          TABLE BREAKDOWN
                        </Typography>
                        <Typography sx={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                          Total: {totalValue.toFixed(1)} {unit}
                        </Typography>
                      </Box>

                      {effectiveRows.slice(0, 50).map((r, i) => {
                        const val = Number(toNumberOrNull(r?.[sk])) || 0
                        const pct = totalValue > 0 ? (val / totalValue) * 100 : 0
                        const floorColor = getSeriesColor(id, String(r?.x ?? ''))
                        const label = isPerFloorEnergyData ? (perFloorTooltipTitles?.[i] ?? String(r?.x ?? '')) : String(r?.x ?? '')

                        return (
                          <Box key={`${id}_row_${i}`} sx={{ mb: 2.5, position: 'relative' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 0.8 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, maxWidth: '60%' }}>
                                <Box
                                  onPointerDown={(e) => e.stopPropagation()}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const rawKey = String(r?.x ?? '');
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    colorPickerRef.current?.toggle(id, rawKey, rect.left, rect.top);
                                  }}
                                  sx={{
                                    width: 14,
                                    height: 14,
                                    borderRadius: '50%',
                                    backgroundColor: floorColor,
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                    border: '2px solid rgba(255,255,255,0.5)',
                                    '&:hover': { transform: 'scale(1.3)', border: '2px solid #fff' },
                                    transition: 'transform 0.15s, border 0.15s'
                                  }}
                                  title="Click to change color"
                                />
                                <Typography sx={{
                                  fontSize: '14px',
                                  fontWeight: 600,
                                  color: '#fff',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}>
                                  {label}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Typography sx={{ fontSize: '14px', fontWeight: 900, color: '#fff' }}>
                                  {val.toFixed(1)} {unit}
                                </Typography>
                                <Box sx={{ borderBottom: `1px dashed ${floorColor}`, pb: 0.2 }}>
                                  <Typography sx={{ fontSize: '12px', fontWeight: 700, color: floorColor }}>
                                    {pct.toFixed(1)}%
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>
                            <Box sx={{
                              height: '4px',
                              width: '40%', // Matches the look of the reference image (shorter bars)
                              backgroundColor: 'rgba(255,255,255,0.1)',
                              borderRadius: '2px',
                              overflow: 'hidden'
                            }}>
                              <Box sx={{
                                height: '100%',
                                width: `${pct}%`,
                                backgroundColor: floorColor,
                                boxShadow: `0 0 8px ${floorColor}44`
                              }} />
                            </Box>
                          </Box>
                        )
                      })}
                    </Box>
                  )
                }

                if (graphType === 'pie' || graphType === 'circular') {
                  // Special case: by-group endpoints should display area-group names (office room, passage 2, etc.)
                  // instead of generic series keys like "data".
                  if (isTotalConsumptionByGroupApiPath(String(g?.api_path ?? ''))) {
                    const rowsForPie = buildTotalConsumptionByGroupPieRows(raw, areaGroups, new Map())
                    const slicesFromGroups = (rowsForPie || [])
                      .map((r) => ({ name: String(r?.name ?? ''), value: Number(r?.value ?? 0) }))
                      .filter((r) => r.name && Number(r.value) > 0)
                    if (!slicesFromGroups.length) return <CenterMessage title="No data" />
                    return (
                      <Box sx={{ width: '100%', height: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={slicesFromGroups}
                              dataKey="value"
                              nameKey="name"
                              innerRadius={graphType === 'circular' ? '60%' : 0}
                              outerRadius="85%"
                              paddingAngle={3}
                              stroke="rgba(255,255,255,0.15)"
                              label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                              labelLine={true}
                            >
                              {slicesFromGroups.map((slice, idx) => (
                                <Cell key={`${id}_cell_${idx}`} fill={getSeriesColor(id, slice?.name ?? idx)} />
                              ))}
                              {graphType === 'circular' && (
                                <Label
                                  position="center"
                                  content={({ viewBox }) => {
                                    const { cx, cy } = viewBox
                                    const total = slicesFromGroups.reduce((acc, s) => acc + s.value, 0)
                                    const avg = slicesFromGroups.length ? (total / slicesFromGroups.length).toFixed(2) : 0
                                    const displayValue = showOccupancyPercentage ? `${avg} %` : avg
                                    return (
                                      <text
                                        x={cx}
                                        y={cy}
                                        fill="#fff"
                                        textAnchor="middle"
                                        dominantBaseline="central"
                                        style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '0.5px' }}
                                      >
                                        {displayValue}
                                      </text>
                                    )
                                  }}
                                />
                              )}
                            </Pie>
                            <Tooltip />
                            <Legend payload={customLegendPayload} content={renderCustomLegend} />
                          </PieChart>
                        </ResponsiveContainer>
                      </Box>
                    )
                  }

                  // If multi-series, sum each series. If single series, sum y.
                  let slices = []
                  if (isPerFloorEnergyData && effectiveRows.length) {
                    const sk = (effectiveSeriesKeys && effectiveSeriesKeys.length) ? effectiveSeriesKeys[0] : 'y'
                    slices = effectiveRows.map((row, idx) => ({
                      name: row.x || `Item ${idx + 1}`,
                      value: Number(toNumberOrNull(row?.[sk])) || 0,
                      tooltipTitle: perFloorTooltipTitles?.[idx]
                    }))
                  } else if (effectiveRows.length && effectiveSeriesKeys.length && effectiveSeriesKeys[0] !== 'y') {
                    slices = effectiveSeriesKeys.map((k) => ({
                      name: isOccupancyByGroupApiPath(String(g?.api_path ?? ''))
                        ? resolveOccupancyGroupDisplayName(areaGroups, k)
                        : k,
                      value: effectiveRows.reduce((acc, row) => acc + (Number(toNumberOrNull(row?.[k])) || 0), 0),
                    }))
                  } else if (effectiveRows.length) {
                    slices = [
                      {
                        name: g?.name || 'Value',
                        value: effectiveRows.reduce((acc, row) => acc + (Number(toNumberOrNull(row?.y)) || 0), 0),
                      },
                    ]
                  }
                  slices = slices.filter((s) => Number(s.value) > 0)

                  // Map per-area slice names (EL/TEST) into group names for scoped area-group graphs.
                  const scopeForSlices = String(g?.group_scope || '').trim().toLowerCase()
                  if (isAreaGroupChartScope(scopeForSlices) && slices.length) {
                    const areaNameToGroup = buildAreaNameToGroupNameMap(areaGroups, scopeForSlices)
                    const hasAny = slices.some((s) => areaNameToGroup.has(String(s?.name ?? '').trim()))
                    if (hasAny) {
                      const acc = new Map()
                      for (const s of slices) {
                        const areaName = String(s?.name ?? '').trim()
                        const v = Number(toNumberOrNull(s?.value)) || 0
                        const gnames = areaNameToGroup.get(areaName)
                        if (!Array.isArray(gnames) || gnames.length === 0) continue
                        for (const gname of gnames) {
                          const n = String(gname || '').trim()
                          if (!n) continue
                          acc.set(n, (Number(acc.get(n)) || 0) + v)
                        }
                      }
                      slices = Array.from(acc.entries())
                        .map(([name, value]) => ({ name, value }))
                        .filter((s) => Number(s.value) > 0)
                    }
                  }

                  if (!slices.length) return <CenterMessage title="No data" subtitle="No positive values to display" />

                  return (
                    <Box sx={{ width: '100%', height: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={slices}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={graphType === 'circular' ? '60%' : 0}
                            outerRadius="85%"
                            paddingAngle={3}
                            stroke="rgba(255,255,255,0.15)"
                            label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                            labelLine={true}
                          >
                            {slices.map((slice, idx) => (
                              <Cell key={`${id}_cell_${idx}`} fill={getSeriesColor(id, slice?.name ?? idx)} />
                            ))}
                            {graphType === 'circular' && (
                              <Label
                                position="center"
                                content={({ viewBox }) => {
                                  const { cx, cy } = viewBox
                                  const total = slices.reduce((acc, s) => acc + s.value, 0)
                                  const avg = slices.length ? (total / slices.length).toFixed(2) : 0
                                  const displayValue = showOccupancyPercentage ? `${avg} %` : avg
                                  return (
                                    <text
                                      x={cx}
                                      y={cy}
                                      fill="#fff"
                                      textAnchor="middle"
                                      dominantBaseline="central"
                                      style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '0.5px' }}
                                    >
                                      {displayValue}
                                    </text>
                                  )
                                }}
                              />
                            )}
                          </Pie>
                          <Tooltip
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null
                              const hoveredName = String(payload?.[0]?.name ?? '').trim()
                              if (!hoveredName) return null
                              const displayName = hoveredName === 'data' ? 'Count' : hoveredName

                              const scopeForSlices = String(g?.group_scope || '').trim().toLowerCase()
                              const areaNameToGroup = isAreaGroupChartScope(scopeForSlices)
                                ? buildAreaNameToGroupNameMap(areaGroups, scopeForSlices)
                                : null

                              // When group_scope is active, show group -> areas breakdown.
                              // For pie/circular, the hovered payload doesn't include per-area values, so we sum
                              // each area's total across all rows.
                              if (areaNameToGroup && areaNameToGroup.size) {
                                const contributing = Array.from(areaNameToGroup.keys()).filter((a) => {
                                  const gnames = areaNameToGroup.get(a)
                                  return Array.isArray(gnames) && gnames.includes(hoveredName)
                                })

                                const areaTotals = new Map()
                                for (const a of contributing) {
                                  const total = (effectiveRows || []).reduce(
                                    (acc, row) => acc + (Number(toNumberOrNull(row?.[a])) || 0),
                                    0
                                  )
                                  areaTotals.set(a, total)
                                }
                                return (
                                  <div
                                    style={{
                                      backgroundColor: '#807864',
                                      border: '1px solid #fff',
                                      borderRadius: '4px',
                                      padding: '10px',
                                      color: '#fff',
                                      fontSize: '12px',
                                    }}
                                  >
                                    <div style={{ fontWeight: 800, marginBottom: 6 }}>{displayName}</div>
                                    {contributing.map((a) => (
                                      <div
                                        key={`${hoveredName}_${a}`}
                                        style={{ display: 'flex', justifyContent: 'space-between', gap: 12, margin: '2px 0' }}
                                      >
                                        <span>{a}</span>
                                        <span style={{ fontWeight: 700 }}>
                                          {areaTotals.get(a) ?? 0}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )
                              }

                              const v = payload?.[0]?.value ?? 0
                              const customTooltip = payload?.[0]?.payload?.tooltipTitle
                              return (
                                <div
                                  style={{
                                    backgroundColor: '#807864',
                                    border: '1px solid #fff',
                                    borderRadius: '4px',
                                    padding: '10px',
                                    color: '#fff',
                                    fontSize: '12px',
                                  }}
                                >
                                  <div style={{ fontWeight: 800, marginBottom: 2 }}>{customTooltip || displayName}</div>
                                  <div style={{ fontWeight: 700 }}>{v}</div>
                                </div>
                              )
                            }}
                          />
                          <Legend payload={customLegendPayload} content={renderCustomLegend} />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  )
                }

                if (!effectiveRows.length) {
                  const scalar = raw.value ?? raw.count ?? raw.y ?? raw.result ?? raw.data
                  if (typeof scalar === 'number' || (typeof scalar === 'string' && scalar.trim() !== '')) {
                    const unit = String(raw.unit || inferUnitFromApiPath(g?.api_path) || inferUnitFromChartTitle(g?.name) || '').trim()
                    return (
                      <Box
                        sx={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                          fontSize: 28,
                          fontWeight: 900,
                          p: 2,
                          boxSizing: 'border-box',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {unit ? `${String(scalar)} ${unit}` : String(scalar)}
                      </Box>
                    )
                  }
                  return <CenterMessage title="No data" />
                }

                const occupancyTooltipContent = (props) => {
                  const label = props?.label
                  // Direct lookup in effectiveRows to find the pre-calculated tooltip title
                  const row = (effectiveRows || []).find((r) => String(r.x) === String(label))
                  const title = row?.tooltipTitle || label

                  if (isSpaceUtilizationPer && !occupancyCountLineChart) {
                    const { active, payload } = props;
                    if (!active || !payload || !payload.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div
                        style={{
                          backgroundColor: '#807864',
                          border: '1px solid #fff',
                          borderRadius: '4px',
                          padding: '10px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      >
                        <div style={{ fontWeight: 800, marginBottom: 6 }}>{data.tooltipTitle || title}</div>
                        <div style={{ fontWeight: 700 }}>Utilization: {payload[0].value}%</div>
                      </div>
                    );
                  }

                  return (
                    <CustomGroupScopeTooltip
                      {...props}
                      label={title} // Pass the detailed floor/area list as the label/header
                      groupScope={g?.group_scope}
                      areaGroups={areaGroups}
                      row={
                        props?.payload?.[0]?.payload && typeof props.payload[0].payload === 'object'
                          ? props.payload[0].payload
                          : null
                      }
                      showPercent={Boolean(occupancyCountLineChart && showOccupancyPercentage)}
                    />
                  )
                }

                const occupancyYAxisLabel =
                  occupancyCountLineChart
                    ? {
                      value: showOccupancyPercentage ? '(Occupancy %)' : '(Occupancy Count)',
                      angle: -90,
                      position: 'insideLeft',
                      fill: '#fff',
                      offset: -12,
                      style: { textAnchor: 'middle', fontSize: '12px', fontWeight: '600' },
                    }
                    : undefined

                const peakMinCustom = occupancyCountLineChart
                  ? peakMinForOccupancyCustomGraphCard(apiPathStr, raw, instantOccupancyCount, occupancyCount, showChartsTab)
                  : null


                const showPeakMinStrip =
                  occupancyCountLineChart &&
                  peakMinCustom &&
                  (peakMinCustom.peak !== null || peakMinCustom.min !== null)

                return (
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      minHeight: 0,
                    }}
                  >
                    {showPeakMinStrip ? (
                      <Box
                        sx={{
                          display: 'flex',
                          gap: 1.25,
                          px: 1.25,
                          pt: 1.25,
                          pb: 0.75,
                          flexShrink: 0,
                          width: '100%',
                          boxSizing: 'border-box',
                        }}
                      >
                        <Box
                          sx={{
                            flex: '1 1 0',
                            minWidth: 0,
                            backgroundColor: DASHBOARD_CHART_PLOT_BACKGROUND,
                            borderRadius: '10px',
                            padding: '10px 8px',
                            textAlign: 'center',
                            color: '#fff',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Box
                            component="span"
                            sx={{
                              fontSize: isLargeScreen ? '12px' : '11px',
                              color: '#fff',
                              fontWeight: 600,
                              mb: 0.5,
                            }}
                          >
                            Peak Occupancy
                          </Box>
                          <Box sx={{ fontSize: isLargeScreen ? '16px' : '15px', fontWeight: 700, lineHeight: 1.2 }}>
                            {peakMinCustom.peak !== null ? peakMinCustom.peak : 'No data'}
                          </Box>
                          <Box sx={{ fontSize: '11px', color: '#ccc', fontWeight: 500, mt: 0.25 }}>
                            {peakMinCustom.peakTime
                              ? `at ${formatPeakMinTimeLabel(peakMinCustom.peakTime, selectedDuration, currentDate)}`
                              : 'No data'}
                          </Box>
                        </Box>
                        <Box
                          sx={{
                            flex: '1 1 0',
                            minWidth: 0,
                            backgroundColor: DASHBOARD_CHART_PLOT_BACKGROUND,
                            borderRadius: '10px',
                            padding: '10px 8px',
                            textAlign: 'center',
                            color: '#fff',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Box
                            component="span"
                            sx={{
                              fontSize: isLargeScreen ? '12px' : '11px',
                              color: '#fff',
                              fontWeight: 600,
                              mb: 0.5,
                            }}
                          >
                            Min Occupancy
                          </Box>
                          <Box sx={{ fontSize: isLargeScreen ? '16px' : '15px', fontWeight: 700, lineHeight: 1.2 }}>
                            {peakMinCustom.min !== null ? peakMinCustom.min : 'No data'}
                          </Box>
                          <Box sx={{ fontSize: '11px', color: '#ccc', fontWeight: 500, mt: 0.25 }}>
                            {peakMinCustom.minTime
                              ? `at ${formatPeakMinTimeLabel(peakMinCustom.minTime, selectedDuration, currentDate)}`
                              : 'No data'}
                          </Box>
                        </Box>
                      </Box>
                    ) : null}
                    <Box sx={{ flex: 1, minHeight: 0, width: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        {graphType === 'line' ? (
                          <LineChart data={effectiveRows}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                            <XAxis dataKey="x" tick={{ fill: '#fff' }} />
                            <YAxis
                              tick={{ fill: '#fff' }}
                              label={occupancyYAxisLabel}
                            />
                            <Tooltip content={occupancyTooltipContent} />
                            <Legend payload={customLegendPayload} content={renderCustomLegend} />
                            {(effectiveSeriesKeys.length && effectiveSeriesKeys[0] !== 'y' ? effectiveSeriesKeys : ['y']).map((k, idx) => (
                              <Line
                                key={k}
                                type="monotone"
                                dataKey={k}
                                stroke={getSeriesColor(id, k)}
                                strokeWidth={isAnyFullscreen ? 5 : 3}
                                strokeDasharray={isAnyFullscreen ? dashPatterns[idx % dashPatterns.length] : undefined}
                                dot={(dotProps) => {
                                  const { cx, cy, payload: dotPayload } = dotProps;
                                  if (!cx || !cy || !dotPayload) return null;
                                  const dotColor = isCategoricalChart ? getSeriesColor(id, dotPayload.x) : getSeriesColor(id, k);
                                  return (
                                    <circle
                                      cx={cx}
                                      cy={cy}
                                      r={isAnyFullscreen ? 8 : 5}
                                      fill={dotColor}
                                      stroke="#fff"
                                      strokeWidth={1}
                                    />
                                  );
                                }}
                                hide={Boolean(focused) && String(k) !== String(focused)}
                              />
                            ))}
                          </LineChart>
                        ) : (
                          <BarChart data={effectiveRows}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                            <XAxis dataKey="x" tick={{ fill: '#fff' }} />
                            <YAxis
                              tick={{ fill: '#fff' }}
                              label={occupancyYAxisLabel}
                            />
                            <Tooltip content={occupancyTooltipContent} />
                            <Legend payload={customLegendPayload} content={renderCustomLegend} />
                            {(effectiveSeriesKeys.length && effectiveSeriesKeys[0] !== 'y' ? effectiveSeriesKeys : ['y']).map((k, idx) => (
                              <Bar
                                key={k}
                                name={k}
                                dataKey={k}
                                stroke={getSeriesColor(id, k)}
                                fill={getSeriesColor(id, k)}
                                hide={Boolean(focused) && String(k) !== String(focused)}
                              >
                                {(isPerFloorEnergyData || isCategoricalChart) && effectiveRows.map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={getSeriesColor(id, entry.x || index)}
                                    stroke={getSeriesColor(id, entry.x || index)}
                                  />
                                ))}
                              </Bar>
                            ))}
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    </Box>
                  </Box>
                )
              }

              return <CenterMessage title="No data" />
            })()}
          </Box>
        </>
      )
    },
    [
      chartHeaderStyle,
      customGraphData,
      customGraphError,
      customGraphLoading,
      selectedDuration,
      customDateRange,
      currentDate,
      isLargeScreen,
      instantOccupancyCount,
      occupancyCount,
      focusedCustomSeriesByGraph,
      colorPickerRef,
      getSeriesColor,
      handleLegendClick,
      setCustomColor,
      floors,
      areaIdToFloorId,
      showChartsTab,
      areaGroups,
    ]
  )

  const readDashboardOrder = useCallback(() => {
    try {
      const raw = localStorage.getItem('dashboardOrder')
      const parsed = raw ? JSON.parse(raw) : null
      const list = parsed && typeof parsed === 'object' ? parsed?.space : null
      return Array.isArray(list) ? list : []
    } catch {
      return []
    }
  }, [])

  const readDashboardSpan = useCallback(() => {
    try {
      const raw = localStorage.getItem('dashboardOrder')
      const parsed = raw ? JSON.parse(raw) : null
      const map = parsed && typeof parsed === 'object' ? parsed?.spaceSpan : null
      return map && typeof map === 'object' && !Array.isArray(map) ? map : {}
    } catch {
      return {}
    }
  }, [])

  const writeDashboardOrder = useCallback((nextOrder) => {
    try {
      const order =
        Array.isArray(nextOrder) && nextOrder.includes(SPACE_COMBINED_WIDGET_KEY)
          ? pinWidgetFirstInOrder(nextOrder, SPACE_COMBINED_WIDGET_KEY)
          : Array.isArray(nextOrder)
            ? nextOrder
            : []
      const raw = localStorage.getItem('dashboardOrder')
      const parsed = raw ? JSON.parse(raw) : {}
      const obj = parsed && typeof parsed === 'object' ? parsed : {}
      obj.space = order
      localStorage.setItem('dashboardOrder', JSON.stringify(obj))
      setSpaceCardOrder(order)
      if (!spaceLayoutLocked && dispatch && saveDashboardChartOrder) {
        dispatch(
          saveDashboardChartOrder(
            persistCustomizedLayoutAndBuildApiPayload({ space: order })
          )
        )
      }
    } catch {
      // ignore
    }
  }, [spaceLayoutLocked, dispatch])

  const writeDashboardSpan = useCallback((nextSpan) => {
    try {
      const raw = localStorage.getItem('dashboardOrder')
      const parsed = raw ? JSON.parse(raw) : {}
      const obj = parsed && typeof parsed === 'object' ? parsed : {}
      obj.spaceSpan =
        nextSpan && typeof nextSpan === 'object' && !Array.isArray(nextSpan) ? nextSpan : {}
      localStorage.setItem('dashboardOrder', JSON.stringify(obj))
      if (!spaceLayoutLocked && dispatch && saveDashboardChartOrder) {
        dispatch(
          saveDashboardChartOrder(
            persistCustomizedLayoutAndBuildApiPayload({ spaceSpan: obj.spaceSpan })
          )
        )
      }
    } catch {
      // ignore
    }
  }, [spaceLayoutLocked, dispatch])

  // Press & hold to start dragging (no Edit/Done toggle).
  // Touchpads often jitter a bit while holding, so use a larger tolerance + sane delay.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { delay: 1000, tolerance: 20 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 1000, tolerance: 20 } }),
    useSensor(PointerSensor, { activationConstraint: { delay: 1000, tolerance: 20 } }),
  )

  useEffect(() => {
    setSpaceCardOrder(readDashboardOrder())
    const savedSpan = readDashboardSpan()
    // Reset peak_and_minimum_utilization to half-width (compact card) if previously saved as full-width
    if (savedSpan?.peak_and_minimum_utilization === 2 || savedSpan?.peak_and_minimum_utilization === '2') {
      const { peak_and_minimum_utilization: _removed, ...rest } = savedSpan
      setSpaceCardSpan(rest)
    } else {
      setSpaceCardSpan(savedSpan)
    }
  }, [readDashboardOrder, readDashboardSpan])

  useEffect(() => {
    dispatch(fetchDashboardChartOrder())
  }, [dispatch])

  useEffect(() => {
    if (dashboardChartOrderStatus !== 'succeeded') return
    const blob = dashboardChartOrder?.customized_dashboard_order
    if (!blob || typeof blob !== 'object') return
    const applied = applyVariantDashboardOrderBlob(DASHBOARD_ORDER_STORAGE_KEY, blob)
    if (!applied) return
    if (Array.isArray(applied.space)) {
      const space = applied.space.includes(SPACE_COMBINED_WIDGET_KEY)
        ? pinWidgetFirstInOrder(applied.space, SPACE_COMBINED_WIDGET_KEY)
        : applied.space
      setSpaceCardOrder(space)
    }
    if (applied.spaceSpan && typeof applied.spaceSpan === 'object') {
      setSpaceCardSpan(applied.spaceSpan)
    }
  }, [dashboardChartOrder, dashboardChartOrderStatus])

  // userProfile/profileLoading moved above (avoid TDZ crash)

  // Get loading and error states
  // Selectors moved to top of component to avoid TDZ errors


  // anyLoading moved to top of component

  // Check for specific API errors
  const hasApiErrors = () => {
    return (
      (activeOccupancyByGroup && activeOccupancyByGroup.status === 'error') ||
      (activeSpaceUtilizationPerArea && activeSpaceUtilizationPerArea.status === 'error')
    )
  }

  // Selectors moved to top of component

  // REMOVED: loadAllAreasFromAllFloors function to prevent duplicate API calls
  // The Dashboard component handles all area loading and API calls
  // SpaceUtilization should only display data, not make API calls

  // REMOVED: flattenAreaTree function - no longer needed since we don't load areas here

  // Fetch floors on component mount
  useEffect(() => {
    dispatchFetchFloorsOnce(dispatch, fetchFloors, Boolean(floors?.length))
  }, [dispatch, floors?.length])

  // Fetch widget titles when missing; widgetList is usually { titles: [...] } after normalize
  useEffect(() => {
    const needsFetch =
      !widgetList ||
      (Array.isArray(widgetList) && widgetList.length === 0) ||
      (widgetList &&
        typeof widgetList === 'object' &&
        !Array.isArray(widgetList) &&
        !Array.isArray(widgetList.titles));
    if (needsFetch) {
      dispatchFetchWidgetTitlesOnce(dispatch, fetchRenameWidgets);
    }
  }, [dispatch, widgetList]);

  useEffect(() => {
    const onWidgetTitlesUpdated = () =>
      dispatchFetchWidgetTitlesOnce(dispatch, fetchRenameWidgets, { force: true });
    window.addEventListener('widgetTitlesUpdated', onWidgetTitlesUpdated);
    return () =>
      window.removeEventListener('widgetTitlesUpdated', onWidgetTitlesUpdated);
  }, [dispatch]);

  useEffect(() => {
    dispatchFetchCustomGraphsOnce(dispatch, fetchCustomGraphs);
  }, [dispatch]);

  useEffect(() => {
    const onCustomGraphsUpdated = () =>
      dispatchFetchCustomGraphsOnce(dispatch, fetchCustomGraphs, { force: true });
    window.addEventListener('customGraphsUpdated', onCustomGraphsUpdated);
    return () =>
      window.removeEventListener('customGraphsUpdated', onCustomGraphsUpdated);
  }, [dispatch]);

  const customGraphNeedsAreaGroups = useCallback((apiPath) => {
    const p = String(apiPath || '').trim().toLowerCase();
    if (!p) return false;
    // These endpoints often require explicit `group_ids` derived from Manage Area Groups.
    return (
      p.includes('occupancy_by_group') ||
      p.includes('total_consumption/by_group') ||
      p.includes('total_consumption%2fby_group')
    );
  }, []);

  const fetchCustomGraphData = useCallback(async (g) => {
    const id = String(g?.id ?? g?.name ?? '')
    const path = String(g?.api_path ?? '').trim()
    if (!id || !path) return
    if (!showChartsTab) return

    setCustomGraphLoading((p) => ({ ...p, [id]: true }))
    setCustomGraphError((p) => ({ ...p, [id]: null }))

    try {
      // Ensure area groups are loaded before hitting by-group APIs; otherwise backend can return empty payloads
      // when `group_ids` is omitted (and we can't derive group ids without the areaGroups list).
      if (customGraphNeedsAreaGroups(path)) {
        const s = store.getState();
        const ag = s?.groupOccupancy?.areaGroups;
        const hasAny =
          Boolean(ag?.user_area_groups?.length) ||
          Boolean(ag?.special_area_groups?.length);
        const loading = Boolean(s?.groupOccupancy?.areaGroupsLoading);
        if (!hasAny && !loading) {
          try {
            await dispatchFetchAreaGroupsOnce(dispatch, fetchAreaGroups);
          } catch (e) {
            // If area groups fetch fails, proceed with request anyway (will likely show no data).
          }
        }
      }

      // Use Dashboard `apiParams` when the parent has a ready object (same as built-in thunks).
      // When `apiParams` is still null (e.g. waiting for allAreasLoaded) or prop omitted, fall back to
      // local date/selection so custom graphs still load ? previous behavior before dashboardApiParams.
      const effectiveApiParams =
        dashboardApiParams != null
          ? dashboardApiParams
          : (() => {
            const d = calculateDateParameters()
            let floorsToUse = selectedFloorIds
            let areasToUse = selectedAreas
            // Inherit dashboard priority: floors > areas.
            // Custom graph settings (mergedParams) can still override this to send both.
            if (floorsToUse?.length > 0) areasToUse = null
            return {
              areaIds: areasToUse?.length ? areasToUse : null,
              floorIds: floorsToUse?.length ? floorsToUse : null,
              groupIds: selectedGroupIds?.length ? selectedGroupIds : null,
              timeRange: d.timeRange,
              startDate: d.startDate,
              endDate: d.endDate,
              isNavigating,
            }
          })()

      const mergedParams = applyCustomGraphGroupScopedParams(() => store.getState(), effectiveApiParams, g)

      const pathLc = path.toLowerCase()
      const floorsList = store.getState()?.floor?.floors

      // Determine all unique floors involved in the selection
      const involvedFloorsSet = new Set()
      if (Array.isArray(mergedParams?.floorIds)) {
        mergedParams.floorIds.forEach(fid => involvedFloorsSet.add(String(fid)))
      }

      const areaGroups = store.getState().groupOccupancy?.areaGroups
      const allAreaGroupAreas = [
        ...(areaGroups?.special_area_groups || []),
        ...(areaGroups?.user_area_groups || []),
        ...(areaGroups?.dashboard_area_groups || [])
      ].flatMap(g => g.areas || [])

      const customW = store.getState().dashboard?.customWidgetFilters
      const useCustomW =
        customW &&
        ((customW.floor_ids?.length ?? 0) > 0 || (customW.area_ids?.length ?? 0) > 0)

      const buildAreaIdToFloorMapForCw = () => {
        const m = new Map()
        if (Array.isArray(floorsList)) {
          for (const f of floorsList) {
            const fid = Number(f?.id ?? f?.floor_id)
            if (!Number.isFinite(fid)) continue
            for (const a of f.areas || []) {
              const aid = Number(a?.id ?? a?.area_id ?? a?.areaId)
              if (Number.isFinite(aid)) {
                m.set(aid, fid)
                m.set(String(aid), fid)
              }
            }
          }
        }
        for (const a of allAreaGroupAreas) {
          const aid = Number(a?.id ?? a?.area_id ?? a?.areaId)
          const fid = Number(a?.floor_id ?? a?.floorId)
          if (Number.isFinite(aid) && Number.isFinite(fid)) {
            m.set(aid, fid)
            m.set(String(aid), fid)
          }
        }
        return m
      }

      if (
        useCustomW &&
        (pathLc.includes('occupancy_count') || pathLc.includes('space_utilization_per')) &&
        !pathLc.includes('instant_occupancy_count')
      ) {
        const areaMapCw = buildAreaIdToFloorMapForCw()
        const displayMapCw = new Map()
        if (Array.isArray(floorsList)) {
          for (const f of floorsList) {
            for (const a of f.areas || []) {
              const aid = Number(a?.id ?? a?.area_id ?? a?.areaId)
              if (!Number.isFinite(aid)) continue
              const nm = String(a?.name || a?.area_name || '').trim()
              if (nm) displayMapCw.set(aid, nm)
            }
          }
        }
        for (const aidRaw of customW.area_ids || []) {
          const n =
            typeof aidRaw === 'number' && !Number.isNaN(aidRaw)
              ? aidRaw
              : parseInt(String(aidRaw), 10)
          if (!Number.isFinite(n) || displayMapCw.has(n)) continue
          let resolved = resolveAreaNameFromTree(n, areaTree, floorsList)
          if (resolved && resolved.includes(' / ')) {
            resolved = resolved.split(' / ').pop()
          }
          const nm =
            resolved ||
            String(
              allAreaGroupAreas.find((x) => String(x?.id ?? x?.area_id ?? x?.areaId) === String(n))?.name ||
              ''
            ).trim() ||
            `Area ${n}`
          displayMapCw.set(n, nm)
        }

        const buckets = buildCustomWidgetFilterFloorBuckets(customW, areaMapCw, floorsList)
        if (buckets.length >= 1) {
          const graphTypeSp = String(g?.graph_type || '').toLowerCase().trim()
          if (graphTypeSp === 'line') {
            const extract = (resData) => {
              if (!resData || typeof resData !== 'object') return { xAxis: [], values: [] }
              const x = Array.isArray(resData['x-axis']) ? resData['x-axis'] : []
              const y = resData['y-axis']
              if (y && typeof y === 'object' && !Array.isArray(y)) {
                const firstArr = Object.values(y).find((v) => Array.isArray(v))
                return { xAxis: x, values: firstArr ? firstArr.map((v) => { const n = Number(v); return Number.isFinite(n) ? n : null }) : [] }
              }
              if (Array.isArray(y)) {
                return { xAxis: x, values: y.map((v) => { const n = Number(v); return Number.isFinite(n) ? n : null }) }
              }
              const d = Array.isArray(resData.data) ? resData.data : (Array.isArray(resData.occupancy) ? resData.occupancy : [])
              return { xAxis: x, values: d.map((v) => { const n = Number(v); return Number.isFinite(n) ? n : null }) }
            }

            const perFloorSeries = await Promise.all(
              buckets.map(async (bucket) => {
                const hasAreaIds = bucket.mode === 'areas' && Array.isArray(bucket.areaIds) && bucket.areaIds.length > 0
                const hasFloorId = bucket.mode === 'floor' && bucket.floorId != null && Number.isFinite(Number(bucket.floorId))
                const params = buildOccupancyCountSearchParams({
                  ...mergedParams,
                  areaIds: hasAreaIds ? bucket.areaIds : null,
                  floorIds: hasFloorId ? [Number(bucket.floorId)] : null,
                  groupIds: null,
                })
                const res = await coalesceDashboardHttpGet(BaseUrl, path, { params })
                const { label } = perFloorBucketAxisAndTooltipTitle(bucket, floorsList, displayMapCw)
                const { xAxis, values } = extract(res.data)
                return { label, xAxis, values }
              })
            )

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
                __isPerFloorEnergyData: true,
                __perFloorTooltipTitles: perFloorSeries.map((s) => s.label),
              },
            }))
            setCustomGraphLoading((p) => ({ ...p, [id]: false }))
            return
          }

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
                ...mergedParams,
                areaIds: hasAreaIds ? bucket.areaIds : null,
                floorIds: hasFloorId ? [Number(bucket.floorId)] : null,
                groupIds: null,
              })
              const res = await coalesceDashboardHttpGet(BaseUrl, path, { params })
              const { label, tooltipTitle } = perFloorBucketAxisAndTooltipTitle(
                bucket,
                floorsList,
                displayMapCw
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

      // Settings ? Widgets scope (not built-in) for /dashboard/occupancy_count
      const isBuiltinOverrideGraph = String(id).startsWith('builtin_')
      if (
        !isBuiltinOverrideGraph &&
        (pathLc.includes('occupancy_count') || pathLc.includes('space_utilization_per')) &&
        !pathLc.includes('instant_occupancy_count')
      ) {
        const widgetSp = readCustomGraphScopeDraft(g)
        const graphTypeSp = String(g?.graph_type || '').toLowerCase().trim()
        const spChartOk =
          graphTypeSp === 'bar' ||
          graphTypeSp === 'pie' ||
          graphTypeSp === 'circular' ||
          graphTypeSp === 'table' ||
          graphTypeSp === '' ||
          graphTypeSp === 'line'
        if (
          spChartOk &&
          (widgetSp.floor_ids.length > 0 || widgetSp.area_ids.length > 0)
        ) {
          const buildAreaIdToFloorMapForWidget = buildAreaIdToFloorMapForCw
          let areaMapWg = buildAreaIdToFloorMapForWidget()
          const dynamicallyFetchedNames = new Map()
          if (widgetSp.area_ids.length > 0) {
            const need = []
            for (const x of widgetSp.area_ids) {
              const n = typeof x === 'number' && !Number.isNaN(x) ? x : parseInt(String(x), 10)
              if (Number.isFinite(n)) need.push(n)
            }
            const uniqueNeed = [...new Set(need)]
            const m = new Map(areaMapWg)
            const isMapped = (a) => m.has(a) || m.has(String(a))
            const stillMissing = () => uniqueNeed.filter((a) => !isMapped(a))
            const floorIdsToFetch = new Set()
            if (Array.isArray(floorsList)) {
              floorsList.forEach((row) => {
                const fid = Number(row?.id)
                if (Number.isFinite(fid)) floorIdsToFetch.add(fid)
              })
            }
            widgetSp.floor_ids.forEach((raw) => {
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

                  const walkExtract = (nodes) => {
                    if (!Array.isArray(nodes)) return;
                    for (const node of nodes) {
                      if (!node) continue;
                      let aid = null;
                      if (node.area_id != null) aid = Number(node.area_id);
                      else if (node.id != null && (node.name != null || node.area_name != null)) aid = Number(node.id);

                      if (aid != null && Number.isFinite(aid)) {
                        const nm = String(node.name || node.area_name || '').trim();
                        if (nm) dynamicallyFetchedNames.set(aid, nm);
                      }
                      if (node.children?.length) walkExtract(node.children);
                      if (node.areas?.length) walkExtract(node.areas);
                    }
                  }
                  walkExtract(payload?.tree);
                  walkExtract(payload?.areas);
                } catch (_) { }
              }
              areaMapWg = m
            }
          }

          let mixedB = []
          if (widgetSp.floor_ids.length > 0 && widgetSp.area_ids.length > 0) {
            mixedB = buildMixedWidgetEnergyFloorBuckets(g, areaMapWg, floorsList)
          } else if (widgetSp.area_ids.length > 0) {
            mixedB = buildFloorBucketsFromSelectedAreaIds(
              widgetSp.area_ids,
              areaMapWg,
              floorsList
            )
          } else if (widgetSp.floor_ids.length > 0) {
            mixedB = widgetSp.floor_ids.map((fid) => ({
              mode: 'floor',
              floorId: Number(fid),
              areaIds: [],
            }))
          }
          const rawD = normalizeDashboardFloorIds(mergedParams?.floorIds)
          const dFloorsW =
            rawD.length > 0
              ? extendDashboardFloorIdsWithWidgetAreaIds(mergedParams?.floorIds, widgetSp, areaMapWg)
              : rawD
          const filteredB =
            dFloorsW.length > 0
              ? mixedB.filter((b) => dFloorsW.includes(Number(b.floorId)))
              : mixedB

          if (filteredB.length >= 1) {
            const displayMapWg = new Map()
            if (Array.isArray(floorsList)) {
              for (const f of floorsList) {
                for (const a of f.areas || []) {
                  const aid = Number(a?.id ?? a?.area_id ?? a?.areaId)
                  if (!Number.isFinite(aid)) continue
                  const nm = String(a?.name || a?.area_name || '').trim()
                  if (nm) displayMapWg.set(aid, nm)
                }
              }
            }
            for (const aidRaw of widgetSp.area_ids || []) {
              const n =
                typeof aidRaw === 'number' && !Number.isNaN(aidRaw)
                  ? aidRaw
                  : parseInt(String(aidRaw), 10)
              if (!Number.isFinite(n) || displayMapWg.has(n)) continue
              let nm = dynamicallyFetchedNames.get(n)
              if (!nm) {
                let resolved = resolveAreaNameFromTree(n, areaTree, floorsList)
                if (resolved && resolved.includes(' / ')) {
                  resolved = resolved.split(' / ').pop()
                }
                nm = resolved || String(
                  allAreaGroupAreas.find((x) => String(x?.id ?? x?.area_id ?? x?.areaId) === String(n))?.name || ''
                ).trim() ||
                  `Area ${n}`
              }
              displayMapWg.set(n, nm)
            }

            const combinedWg = await Promise.all(
              filteredB.map(async (bucket) => {
                const hasAreaIds =
                  bucket.mode === 'areas' &&
                  Array.isArray(bucket.areaIds) &&
                  bucket.areaIds.length > 0
                const hasFloorId =
                  bucket.mode === 'floor' &&
                  bucket.floorId != null &&
                  Number.isFinite(Number(bucket.floorId))
                const paramsWg = buildOccupancyCountSearchParams({
                  ...mergedParams,
                  areaIds: hasAreaIds ? bucket.areaIds : null,
                  floorIds: hasFloorId ? [Number(bucket.floorId)] : null,
                  groupIds: null,
                })
                const resWg = await coalesceDashboardHttpGet(BaseUrl, path, { params: paramsWg })
                const { label, tooltipTitle } = perFloorBucketAxisAndTooltipTitle(
                  bucket,
                  floorsList,
                  displayMapWg
                )
                return {
                  label,
                  tooltipTitle,
                  mean: meanOccupancyFromChartPayload(resWg.data),
                }
              })
            )
            setCustomGraphData((p) => ({
              ...p,
              [id]: {
                'x-axis': combinedWg.map((r) => r.label),
                'y-axis': {
                  data: combinedWg.map((r) =>
                    r.mean === null || r.mean === undefined ? null : r.mean
                  ),
                },
                __isPerFloorEnergyData: true,
                __perFloorTooltipTitles: combinedWg.map((r) => r.tooltipTitle ?? r.label),
              },
            }))
            setCustomGraphLoading((p) => ({ ...p, [id]: false }))
            return
          }
        }
      }

      if (Array.isArray(mergedParams?.areaIds) && mergedParams.areaIds.length > 0) {
        mergedParams.areaIds.forEach(aid => {
          const floor = floorsList?.find(f => f.areas?.some(a => String(a.id || a.area_id) === String(aid)))
          let fid = floor?.floor_id ?? floor?.id
          if (!fid) {
            const areaInGroup = allAreaGroupAreas.find(a => String(a.id || a.area_id || a.areaId) === String(aid))
            fid = areaInGroup?.floor_id ?? areaInGroup?.floorId
          }
          if (fid) involvedFloorsSet.add(String(fid))
        })
      }
      const allInvolvedFloorIds = Array.from(involvedFloorsSet)

      const isOccCountAggregatedPath =
        pathLc.includes('occupancy_count') &&
        !pathLc.includes('instant_occupancy_count') &&
        allInvolvedFloorIds.length > 0

      if (isOccCountAggregatedPath) {
        // One bar per floor; multiple areas on a floor are aggregated in that bar (tooltip lists areas).
        // Built-in graphs use the same shape as before; custom (non-builtin) adds per-floor tooltips.
        const isBuiltinId = String(id).startsWith('builtin_')
        let displayMapForFloorOcc = null
        if (!isBuiltinId && Array.isArray(mergedParams?.areaIds) && mergedParams.areaIds.length > 0) {
          displayMapForFloorOcc = new Map()
          if (Array.isArray(floorsList)) {
            for (const f of floorsList) {
              for (const a of f.areas || []) {
                const aid = Number(a?.id ?? a?.area_id ?? a?.areaId)
                if (!Number.isFinite(aid)) continue
                const nm = String(a?.name || a?.area_name || '').trim()
                if (nm) displayMapForFloorOcc.set(aid, nm)
              }
            }
          }
          for (const aidRaw of mergedParams.areaIds) {
            const n =
              typeof aidRaw === 'number' && !Number.isNaN(aidRaw)
                ? aidRaw
                : parseInt(String(aidRaw), 10)
            if (!Number.isFinite(n) || displayMapForFloorOcc.has(n)) continue
            let resolved = resolveAreaNameFromTree(n, areaTree, floorsList)
            if (resolved && resolved.includes(' / ')) {
              resolved = resolved.split(' / ').pop()
            }
            const nm =
              resolved ||
              String(
                allAreaGroupAreas.find((x) => String(x?.id ?? x?.area_id ?? x?.areaId) === String(n))?.name || ''
              ).trim() ||
              `Area ${n}`
            displayMapForFloorOcc.set(n, nm)
          }
        }

        const isPerFloor = true
        const graphTypeSp = String(g?.graph_type || '').toLowerCase().trim()
        if (graphTypeSp === 'line') {
          const extract = (resData) => {
            if (!resData || typeof resData !== 'object') return { xAxis: [], values: [] }
            const x = Array.isArray(resData['x-axis']) ? resData['x-axis'] : []
            const y = resData['y-axis']
            if (y && typeof y === 'object' && !Array.isArray(y)) {
              const firstArr = Object.values(y).find((v) => Array.isArray(v))
              return { xAxis: x, values: firstArr ? firstArr.map((v) => { const n = Number(v); return Number.isFinite(n) ? n : null }) : [] }
            }
            if (Array.isArray(y)) {
              return { xAxis: x, values: y.map((v) => { const n = Number(v); return Number.isFinite(n) ? n : null }) }
            }
            const d = Array.isArray(resData.data) ? resData.data : (Array.isArray(resData.occupancy) ? resData.occupancy : [])
            return { xAxis: x, values: d.map((v) => { const n = Number(v); return Number.isFinite(n) ? n : null }) }
          }

          const perFloorSeries = await Promise.all(
            allInvolvedFloorIds.map(async (entityId) => {
              const areasForThisEntity = mergedParams.areaIds?.filter((aid) => {
                const f = floorsList?.find(floor => floor.areas?.some(a => String(a.id || a.area_id) === String(aid)))
                let fid = f?.floor_id ?? f?.id
                if (!fid) {
                  const areaInGroup = allAreaGroupAreas.find(a => String(a.id || a.area_id || a.areaId) === String(aid))
                  fid = areaInGroup?.floor_id ?? areaInGroup?.floorId
                }
                return String(fid) === String(entityId)
              })
              const hasPartialAreas = areasForThisEntity?.length > 0
              const params = buildOccupancyCountSearchParams({
                ...mergedParams,
                floorIds: hasPartialAreas ? null : [entityId],
                areaIds: !hasPartialAreas ? null : areasForThisEntity,
              })
              const res = await coalesceDashboardHttpGet(BaseUrl, path, { params })
              const label = getFloorDisplayLabel(floorsList, entityId)
              const { xAxis, values } = extract(res.data)
              return { label, xAxis, values }
            })
          )

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
              ...(!isBuiltinId
                ? {
                  __isPerFloorEnergyData: true,
                  __perFloorTooltipTitles: perFloorSeries.map((s) => s.label),
                }
                : {}),
            },
          }))
          setCustomGraphLoading((p) => ({ ...p, [id]: false }))
          return
        }

        const combined = await Promise.all(
          allInvolvedFloorIds.map(async (entityId) => {
            const areasForThisEntity = isPerFloor
              ? mergedParams.areaIds?.filter((aid) => {
                const f = floorsList?.find(floor => floor.areas?.some(a => String(a.id || a.area_id) === String(aid)))
                let fid = f?.floor_id ?? f?.id
                if (!fid) {
                  const areaInGroup = allAreaGroupAreas.find(a => String(a.id || a.area_id || a.areaId) === String(aid))
                  fid = areaInGroup?.floor_id ?? areaInGroup?.floorId
                }
                return String(fid) === String(entityId)
              })
              : [entityId]

            const hasPartialAreas = isPerFloor && areasForThisEntity?.length > 0

            const params = pathLc.includes('occupancy_count')
              ? buildOccupancyCountSearchParams({
                ...mergedParams,
                floorIds: hasPartialAreas ? null : (isPerFloor ? [entityId] : mergedParams.floorIds),
                areaIds: (isPerFloor && !hasPartialAreas) ? null : areasForThisEntity,
              })
              : {
                ...mergedParams,
                floorIds: hasPartialAreas ? null : (isPerFloor ? [entityId] : mergedParams.floorIds),
                areaIds: (isPerFloor && !hasPartialAreas) ? null : areasForThisEntity,
              }

            const res = await coalesceDashboardHttpGet(BaseUrl, path, { params })
            const label = isPerFloor
              ? getFloorDisplayLabel(floorsList, entityId)
              : (resolveAreaNameFromTree(entityId, areaTree, floorsList) || `Area ${entityId}`)

            let tooltipTitle = label
            if (displayMapForFloorOcc && hasPartialAreas && areasForThisEntity?.length > 0) {
              const b = { mode: 'areas', floorId: Number(entityId), areaIds: areasForThisEntity }
              const r = perFloorBucketAxisAndTooltipTitle(b, floorsList, displayMapForFloorOcc)
              tooltipTitle = r.tooltipTitle ?? r.label
            }

            return {
              label,
              mean: meanOccupancyFromChartPayload(res.data),
              tooltipTitle,
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
            ...(!isBuiltinId
              ? {
                __isPerFloorEnergyData: true,
                __perFloorTooltipTitles: combined.map((r) => r.tooltipTitle ?? r.label),
              }
              : {}),
          },
        }))
      } else {
        const rule = resolveDashboardThunkForCustomGraphPath(path)
        const isBuiltin = String(id).startsWith('builtin_')
        // Use Redux thunk ONLY for built-in widgets to allow data sharing.
        // Custom (user-created) widgets fetch independently to avoid side-effects on built-ins.
        if (rule && isBuiltin) {
          const existing = rule.select(store.getState())
          if (existing != null) {
            setCustomGraphData((p) => ({ ...p, [id]: existing }))
          } else {
            const arg = rule.mapArgs ? rule.mapArgs(mergedParams) : mergedParams
            await dispatch(rule.thunk(arg)).unwrap()
            const data = rule.select(store.getState())
            setCustomGraphData((p) => ({ ...p, [id]: data }))
          }
        } else {
          // Direct fetch for custom widgets or unmapped paths.
          const finalParams = { ...mergedParams }
          // Built-in virtual widgets (overridden) still follow standard priority if they have no explicit scope.
          if (isBuiltin && finalParams.floorIds && finalParams.floorIds.length > 0) {
            finalParams.areaIds = null;
          }

          const mapped = buildDashboardChartAxiosParams(finalParams)
          const searchParams = new URLSearchParams()
          Object.entries(mapped).forEach(([key, val]) => {
            if (Array.isArray(val)) {
              val.forEach(v => searchParams.append(key, v))
            } else if (val !== null && val !== undefined) {
              searchParams.append(key, val)
            }
          })

          const res = await coalesceDashboardHttpGet(BaseUrl, path, { params: searchParams })
          const payload = res.data
          setCustomGraphData((p) => ({ ...p, [id]: payload }))
        }
      }
    } catch (err) {
      setCustomGraphError((p) => ({ ...p, [id]: err?.message || 'Failed to load' }))
    } finally {
      setCustomGraphLoading((p) => ({ ...p, [id]: false }))
    }
  }, [
    showChartsTab,
    selectedAreas,
    selectedFloorIds,
    selectedGroupIds,
    selectedDuration,
    customDateRange.startDate,
    customDateRange.endDate,
    isNavigating,
    dashboardApiParams,
    dispatch,
    store,
    customGraphNeedsAreaGroups,
    areaTree,
    customWidgetFilters,
  ])

  useEffect(() => {
    if (!showChartsTab) return

    const currentParamsStr = JSON.stringify({
      dashboardApiParams,
      customGraphs,
      customWidgetFilters,
      selectedDuration,
      startDate: customDateRange.startDate,
      endDate: customDateRange.endDate,
      areasLen: selectedAreas.length,
      floorsLen: selectedFloorIds.length,
      builtinOvTick
    });

    if (lastCustomFetchParamsRef.current === currentParamsStr) {
      return;
    }
    lastCustomFetchParamsRef.current = currentParamsStr;

    const list = Array.isArray(customGraphs) ? customGraphs : []
    list
      .filter((g) => {
        const p = String(g?.page || '')
          .toLowerCase()
          .replace(/_/g, '-')
          .replace(/\s+/g, '-');
        return p === 'space' || p === 'space-utilization' || p.startsWith('space-');
      })
      .forEach((g) => fetchCustomGraphData(g))

    const spaceBuiltinKeys = new Set([
      'utilization',
      'instant_occupancy_count',
      'utilization_by_area_group',
      'peak_and_minimum_utilization',
      'utilization_by_area',
    ])
    const ov = readBuiltinWidgetOverrides()
    Object.entries(ov).forEach(([k, val]) => {
      if (!val?.api_path?.trim() || !val?.graph_type) return
      if (!spaceBuiltinKeys.has(k)) return
      fetchCustomGraphData({
        id: `builtin_${k}`,
        name: k,
        graph_type: val.graph_type,
        api_path: normalizeBuiltinApiPath(val.api_path),
        ...(Array.isArray(val?.floor_ids) && val.floor_ids.length ? { floor_ids: val.floor_ids } : {}),
        ...(Array.isArray(val?.area_ids) && val.area_ids.length ? { area_ids: val.area_ids } : {}),
        ...(val?.group_scope ? { group_scope: val.group_scope } : {}),
        page: 'space',
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    showChartsTab,
    dashboardApiParams,
    customGraphs,
    selectedDuration,
    customDateRange.startDate,
    customDateRange.endDate,
    selectedAreas.length,
    selectedFloorIds.length,
    isNavigating,
    builtinOvTick,
    customWidgetFilters,
    fetchCustomGraphData,
  ])

  // Profile is owned by Topbar; join if already in flight
  useEffect(() => {
    dispatchFetchProfileOnce(dispatch, fetchProfile)
  }, [dispatch])

  // REMOVED: useEffect that was calling loadAllAreasFromAllFloors
  // This was causing duplicate API calls when switching tabs
  // The Dashboard component handles all area loading and API calls

  // FIXED: Removed clearDataCache call to prevent triggering unnecessary API calls
  // The Dashboard component handles data caching and API calls
  // SpaceUtilization should only display data, not manage API calls

  const formatYmdFromDate = (d) => {
    const x = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(x.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
  };

  // Align with Dashboard.jsx calculateDateParameters: semantic timeRange + YYYY-MM-DD (not custom + ISO for presets)
  const calculateDateParameters = () => {
    if (
      selectedDuration === 'custom' &&
      customDateRange.startDate &&
      customDateRange.endDate &&
      customDateRange.startDate.trim() !== '' &&
      customDateRange.endDate.trim() !== ''
    ) {
      const sd = new Date(customDateRange.startDate);
      const ed = new Date(customDateRange.endDate);

      if (Number.isNaN(sd.getTime()) || Number.isNaN(ed.getTime())) {
        showSnackbar('Please select valid dates', 'error');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const defaultEnd = new Date(today);
        defaultEnd.setHours(23, 59, 59, 999);
        return {
          timeRange: 'custom',
          startDate: formatYmdFromDate(today),
          endDate: formatYmdFromDate(defaultEnd),
        };
      }

      if (sd > ed) {
        showSnackbar('Please select valid dates', 'error');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const defaultEnd = new Date(today);
        defaultEnd.setHours(23, 59, 59, 999);
        return {
          timeRange: 'custom',
          startDate: formatYmdFromDate(today),
          endDate: formatYmdFromDate(defaultEnd),
        };
      }

      return {
        timeRange: 'custom',
        startDate: customDateRange.startDate,
        endDate: customDateRange.endDate,
      };
    }

    const targetDate = isNavigating ? parseDateFromState(currentDate) : stableDateRef.current;

    if (selectedDuration === 'this-day') {
      const y = targetDate.getFullYear();
      const m = String(targetDate.getMonth() + 1).padStart(2, '0');
      const day = String(targetDate.getDate()).padStart(2, '0');
      const dayStr = `${y}-${m}-${day}`;
      return { timeRange: 'this-day', startDate: dayStr, endDate: dayStr };
    }

    if (selectedDuration === 'this-week') {
      const startOfWeek = new Date(targetDate);
      startOfWeek.setDate(targetDate.getDate() - targetDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return {
        timeRange: 'this-week',
        startDate: formatYmdFromDate(startOfWeek),
        endDate: formatYmdFromDate(endOfWeek),
      };
    }

    if (selectedDuration === 'this-month') {
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth();
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0);
      return {
        timeRange: 'this-month',
        startDate: formatYmdFromDate(startOfMonth),
        endDate: formatYmdFromDate(endOfMonth),
      };
    }

    if (selectedDuration === 'this-year') {
      const y = targetDate.getFullYear();
      return {
        timeRange: 'this-year',
        startDate: `${y}-01-01`,
        endDate: `${y}-12-31`,
      };
    }

    const now = new Date();
    const s = formatYmdFromDate(now);
    return {
      timeRange: selectedDuration || 'this-day',
      startDate: s,
      endDate: s,
    };
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

  // Helper function to get widget titles from rename settings
  const parseWidgetVisibilityFromLocalStorage = () => parseCustomizedWidgetVisibilityRoot();

  const [widgetVisibility, setWidgetVisibility] = useState(() =>
    parseWidgetVisibilityFromLocalStorage()
  );

  const [builtinDashboardPageTick, setBuiltinDashboardPageTick] = useState(0);

  useEffect(() => {
    const refreshFromStorage = () => {
      setWidgetVisibility(parseWidgetVisibilityFromLocalStorage());
    };

    const onCustomEvent = () => refreshFromStorage();
    const onStorage = (e) => {
      if (!e || e.key === CUSTOMIZED_WIDGET_VISIBILITY_STORAGE_KEY) refreshFromStorage();
    };

    window.addEventListener("widgetVisibilityUpdated", onCustomEvent);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("widgetVisibilityUpdated", onCustomEvent);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // Load DB visibility for customized (source of truth) into local cache.
  // Share once-guard with Dashboard so configuration is not fetched twice.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const action = await dispatchFetchWidgetConfigurationOnce(
          dispatch,
          fetchWidgetConfiguration
        );
        if (cancelled) return;
        let items = null;
        if (action && fetchWidgetConfiguration.fulfilled.match(action)) {
          items = action.payload;
        } else {
          items = selectWidgetConfiguration(store.getState());
        }
        if (!Array.isArray(items) || items.length === 0) return;
        const root = hydrateCustomizedVisibilityFromApiItems(items);
        if (!root || cancelled) return;
        setWidgetVisibility(root);
        window.dispatchEvent(new CustomEvent('widgetVisibilityUpdated'));
      } catch {
        /* keep local cache */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dispatch, store]);

  useEffect(() => {
    const onPage = () => setBuiltinDashboardPageTick((t) => t + 1);
    window.addEventListener("builtinWidgetDashboardPageUpdated", onPage);
    return () => window.removeEventListener("builtinWidgetDashboardPageUpdated", onPage);
  }, []);

  const shouldShowWidget = useCallback(
    (widgetKey) =>
      resolveCustomizedSpaceWidgetVisible(
        widgetKey,
        widgetVisibility,
        getEffectiveBuiltinDashboardPage,
        { showUtilizationLineChart: SHOW_SPACE_UTILIZATION_LINE_CHART }
      ),
    [widgetVisibility]
  );

  const spaceCustomGraphs = useMemo(() => {
    const list = Array.isArray(customGraphs) ? customGraphs : []
    return list
      .filter(
        (g) =>
          String(g?.page || '').toLowerCase().replace(/_/g, '-').replace(/\s+/g, '-') === 'space' ||
          String(g?.page || '').toLowerCase().replace(/_/g, '-').replace(/\s+/g, '-').startsWith('space-')
      )
      .filter((g) => shouldShowWidget(`custom_graph:${String(g?.id ?? '')}`))
  }, [customGraphs, shouldShowWidget])

  const spaceVisibleCardIds = useMemo(() => {
    if (!showChartsTab) return []
    const ids = []
    if (shouldShowWidget('instant_utilization_combined')) ids.push('instant_utilization_combined')
    if (shouldShowWidget('utilization')) ids.push('utilization')
    if (shouldShowWidget('instant_occupancy_count')) ids.push('instant_occupancy_count')
    if (shouldShowWidget('utilization_by_area_group')) ids.push('utilization_by_area_group')
    if (shouldShowWidget('peak_and_minimum_utilization')) ids.push('peak_and_minimum_utilization')
    if (shouldShowWidget('utilization_by_area')) ids.push('utilization_by_area')

    for (const ek of ENERGY_BUILTIN_KEYS) {
      if (getEffectiveBuiltinDashboardPage(ek) === 'space' && shouldShowWidget(ek)) {
        ids.push(ek)
      }
    }

    for (const g of spaceCustomGraphs) {
      ids.push(`custom_graph:${String(g?.id ?? '')}`)
    }
    return ids
  }, [showChartsTab, shouldShowWidget, spaceCustomGraphs, widgetVisibility, builtinDashboardPageTick])

  const spaceMergedOrder = useMemo(() => {
    const currentOrder = Array.isArray(spaceCardOrder) ? spaceCardOrder : []
    const visible = Array.isArray(spaceVisibleCardIds) ? spaceVisibleCardIds : []
    const merged = [
      ...currentOrder.filter((k) => visible.includes(k)),
      ...visible.filter((k) => !currentOrder.includes(k)),
    ]
    return visible.includes(SPACE_COMBINED_WIDGET_KEY)
      ? pinWidgetFirstInOrder(merged, SPACE_COMBINED_WIDGET_KEY)
      : merged
  }, [spaceCardOrder, spaceVisibleCardIds])

  useEffect(() => {
    spaceMergedOrderRef.current = spaceMergedOrder
  }, [spaceMergedOrder])

  // When Space Combined is enabled, persist it first (Basic Energy parity).
  useEffect(() => {
    if (!spaceVisibleCardIds.includes(SPACE_COMBINED_WIDGET_KEY)) return
    setSpaceCardOrder((prev) => {
      const base = Array.isArray(prev) ? prev : []
      const withCombined = base.includes(SPACE_COMBINED_WIDGET_KEY)
        ? base
        : [...base, SPACE_COMBINED_WIDGET_KEY]
      const next = pinWidgetFirstInOrder(withCombined, SPACE_COMBINED_WIDGET_KEY)
      if (JSON.stringify(next) === JSON.stringify(prev)) return prev
      try {
        const raw = localStorage.getItem('dashboardOrder')
        const parsed = raw ? JSON.parse(raw) : {}
        const obj = parsed && typeof parsed === 'object' ? parsed : {}
        obj.space = next
        localStorage.setItem('dashboardOrder', JSON.stringify(obj))
        if (!spaceLayoutLocked && dispatch && saveDashboardChartOrder) {
          dispatch(
            saveDashboardChartOrder(
              persistCustomizedLayoutAndBuildApiPayload({ space: next })
            )
          )
        }
      } catch {
        /* ignore */
      }
      return next
    })
  }, [spaceVisibleCardIds, spaceLayoutLocked, dispatch])

  const getSpaceCardOrder = useCallback(
    (id) => {
      const idx = spaceMergedOrder.indexOf(id)
      return idx >= 0 ? idx : 9999
    },
    [spaceMergedOrder]
  )

  const getSpaceCardSpan = useCallback(
    (id) => {
      const raw = spaceCardSpan?.[id]
      if (raw === 2 || raw === '2') return 2
      if (raw === 1 || raw === '1') return 1
      // sensible defaults: these look best full-width
      if (
        id === 'utilization' ||
        id === 'instant_occupancy_count' ||
        id === 'instant_utilization_combined'
      ) {
        return 2
      }
      // peak_and_minimum_utilization defaults to half-width (compact card)
      return 1
    },
    [spaceCardSpan]
  )

  const toggleSpaceCardSpan = useCallback(
    (id) => {
      if (spaceLayoutLocked) return
      setSpaceCardSpan((prev) => {
        const next = { ...(prev && typeof prev === 'object' && !Array.isArray(prev) ? prev : {}) }
        const cur = next?.[id]
        const curSpan = cur === 2 || cur === '2' ? 2 : 1
        next[id] = curSpan === 2 ? 1 : 2
        writeDashboardSpan(next)
        return next
      })
    },
    [spaceLayoutLocked, writeDashboardSpan]
  )

  const getSpaceCardRowSpan = useCallback(() => 1, [])

  const toggleSpaceFullscreen = useCallback((id) => {
    setSpaceFullscreenCardId((prev) => (String(prev) === String(id) ? null : String(id)))
  }, [])

  useEffect(() => {
    if (!spaceFullscreenCardId) return
    const onKeyDown = (e) => {
      if (e?.key === 'Escape') setSpaceFullscreenCardId(null)
    }
    window.addEventListener('keydown', onKeyDown)
    const prevOverflow = document?.body?.style?.overflow
    if (document?.body?.style) document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      if (document?.body?.style) document.body.style.overflow = prevOverflow || ''
    }
  }, [spaceFullscreenCardId])

  // Grid behavior like Energy tab:
  // - If only 1 chart-card is selected => single column (full width)
  // - If 2+ chart-cards are selected => 2 columns (side-by-side)
  const spaceChartsTabKeys = [
    'utilization',
    'instant_occupancy_count',
    'utilization_by_area_group',
    'peak_and_minimum_utilization',
    'utilization_by_area',
  ];

  const spaceChartsTabVisibleCount = spaceChartsTabKeys.reduce(
    (acc, key) => acc + (shouldShowWidget(key) ? 1 : 0),
    0
  );
  const spaceChartsTabGridCols =
    spaceChartsTabVisibleCount === 1 ? '1fr' : '1fr 1fr';

  // Keep chart cards uniform like Energy tab.
  const spaceCardHeight = 560;

  // Match Dashboard.jsx: prefer `title` after rename (API may update title before dropdown_name).
  const getWidgetTitle = (widgetKey, fallbackTitle) => {
    if (!widgetList?.titles) return fallbackTitle;

    const widget = widgetList.titles.find(
      (w) => String(w.key) === String(widgetKey)
    );

    return widget?.title ?? widget?.dropdown_name ?? fallbackTitle;
  };

  const spaceOverrideGraph = (widgetKey, fallbackTitle) => {
    const ov = readBuiltinWidgetOverrides()[widgetKey];
    if (!ov?.api_path?.trim() || !ov?.graph_type) return null;
    return {
      id: `builtin_${widgetKey}`,
      name: getWidgetTitle(widgetKey, fallbackTitle),
      graph_type: ov.graph_type,
      api_path: normalizeBuiltinApiPath(ov.api_path),
      ...(Array.isArray(ov?.floor_ids) && ov.floor_ids.length ? { floor_ids: ov.floor_ids } : {}),
      ...(Array.isArray(ov?.area_ids) && ov.area_ids.length ? { area_ids: ov.area_ids } : {}),
      ...(ov?.group_scope ? { group_scope: ov.group_scope } : {}),
      page: 'space',
    };
  };

  // Generate dynamic chart title based on selected filters
  // If area groups are selected, show group names; if areas, show area names; if floor, show floor name
  const generateDynamicChartTitle = (baseTitle) => {
    // If area groups are selected, use group names as subtitle
    if (selectedGroupIds && selectedGroupIds.length > 0 && areaGroups) {
      const allGroups = [
        ...(areaGroups.user_area_groups || []),
        ...(areaGroups.special_area_groups || []),
      ];
      const groupNames = selectedGroupIds.map((gid) => {
        const match = allGroups.find(
          (g) => g && (String(g.group_id) === String(gid) || String(g.id) === String(gid))
        );
        return match ? String(match.name || match.group_name || gid).trim() : String(gid);
      });
      return `${baseTitle} - ${groupNames.join(', ')}`;
    }

    // If individual areas are selected (but not 5+), show area names
    if (selectedAreas && selectedAreas.length > 0 && selectedAreas.length < 5) {
      const areaNames = selectedAreas.map(areaId => {
        // Find area name from area tree
        const findAreaName = (node) => {
          if (node && node.id === areaId) return node.name;
          if (node && node.children) {
            for (const child of node.children) {
              const result = findAreaName(child);
              if (result) return result;
            }
          }
          return null;
        };
        return findAreaName(areaTree) || `Area ${areaId}`;
      });
      return `${baseTitle} - ${areaNames.join(', ')}`;
    }

    // Default: return base title
    return baseTitle;
  };

  // Close custom-graph export dropdown on outside click
  useEffect(() => {
    if (!customGraphExportOpenId) return
    const handleCustomClickOutside = (event) => {
      try {
        const isInsideDropdown =
          customGraphExportDropdownRef.current &&
          customGraphExportDropdownRef.current.contains(event.target)
        const isInsideButton = event.target.closest('[data-custom-export-button="1"]')
        if (!isInsideDropdown && !isInsideButton) {
          setCustomGraphExportOpenId(null)
        }
      } catch (e) {
        setCustomGraphExportOpenId(null)
      }
    }
    document.addEventListener('mousedown', handleCustomClickOutside)
    return () => document.removeEventListener('mousedown', handleCustomClickOutside)
  }, [customGraphExportOpenId])

  const isUtilizationFullscreen = String(spaceFullscreenCardId || '') === 'utilization'
  const isInstantOccupancyFullscreen = String(spaceFullscreenCardId || '') === 'instant_occupancy_count'

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
      selectedGroupIds,
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
      shouldShowWidget,
      spaceMergedOrder,
      colorPalette: COLORS,
      resolveOccupancyGroupLabel,
      isUtilizationFullscreen,
      isInstantOccupancyFullscreen,
      theme,
      isLargeScreen,
      areaGroups,
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
      selectedAreas,
      selectedFloorIds,
      selectedGroupIds,
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
      shouldShowWidget,
      spaceMergedOrder,
      resolveOccupancyGroupLabel,
      isUtilizationFullscreen,
      isInstantOccupancyFullscreen,
      theme,
      isLargeScreen,
      areaGroups,
    ]
  );

  const orchestration = useSpaceUtilizationContainer(
    customizedSpaceContainerAdapter,
    containerRuntime
  );

  const {
    exports: {
      showExportDropdown,
      setShowExportDropdown,
      exportLoading,
      handleExport,
    },
    widgetContext: spaceWidgetRenderContext,
  } = orchestration;

  const ExportDropdown = ({ isOpen, onClose, chartTitle, dropdownKey }) => (
    <SpaceChartExportMenu
      isOpen={isOpen}
      chartTitle={chartTitle}
      dropdownKey={dropdownKey}
      exportLoading={exportLoading}
      onExport={handleExport}
      innerRef={exportDropdownRef}
      shellVariant="customized"
      isLargeScreen={isLargeScreen}
    />
  )

  const customizedSpaceLayoutAdapter = useMemo(
    () =>
      createCustomizedSpaceLayoutAdapter(createCustomizedSpaceLayoutAdapterStyles()),
    []
  );

  const customizedMainLayoutRuntime = useMemo(
    () => ({
      renderWidgetSlot: (slotId, meta, layoutContext) =>
        renderCustomizedSpaceWidgetSlot(slotId, meta, layoutContext, {
          chartHeaderStyle,
          isLargeScreen,
          isMediumScreen,
          getWidgetTitle,
          generateDynamicChartTitle,
          ExportDropdown,
          showExportDropdown,
          setShowExportDropdown,
          exportLoading,
          handleExport,
          theme,
          spaceChartsDurationFilterElement,
          shouldShowWidget,
        }),
    }),
    [
      chartHeaderStyle,
      isLargeScreen,
      isMediumScreen,
      showExportDropdown,
      setShowExportDropdown,
      exportLoading,
      handleExport,
      theme,
      spaceChartsDurationFilterElement,
      shouldShowWidget,
    ]
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

      {/* Isolated color picker ? renders in document.body via portal, never re-renders SpaceUtilization */}
      <ColorPickerPortal
        ref={colorPickerRef}
        getSeriesColor={getSeriesColor}
        setCustomColor={setCustomColor}
        palette={DASHBOARD_PALETTE}
      />

      {/* Error Display */}
      <SpaceErrorPanel message={dashboardError} shellVariant="customized" />

      {/* API Error Display */}
      {hasApiErrors() && (
        <SpaceStatusPanel
          tone="warning"
          shellVariant="customized"
          title="Some data endpoints are experiencing issues"
          subtitle="Some charts may display limited or no data. Please try again later."
        />
      )}

      {showChartsTab && (
        <SpaceUtilizationContainer
          variant="customized"
          adapter={customizedSpaceContainerAdapter}
          activeTab={SPACE_TAB_IDS.CHARTS}
          orchestration={orchestration}
          runtime={{
            SpaceLayoutRenderer,
            layoutAdapter: customizedSpaceLayoutAdapter,
            chartsLayoutRuntime: {
            renderSortableLayout: () => (
              <>
<Box
            sx={{
              display: 'grid',
              // Max 2 cards per row at all breakpoints.
              gridTemplateColumns: {
                xs: '1fr',
                sm: spaceChartsTabGridCols,
                md: spaceChartsTabGridCols,
                lg: spaceChartsTabGridCols,
                xl: spaceChartsTabGridCols,
              },
              gridAutoRows: `${spaceCardHeight}px`,
              // Keep spacing consistent between all cards
              rowGap: { xs: 2, sm: 2.5, md: 3 },
              columnGap: { xs: 2, sm: 2.5, md: 3 },
              // Add a small outer padding so cards never "stick" to edges
              p: { xs: 1, sm: 1.5, md: 2 },
              width: '100%',
              alignItems: 'stretch',
              // Pack cards upward/left when some are hidden
              gridAutoFlow: 'row dense',
            }}
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(event) => {
                if (spaceLayoutLocked) return
                const activeId = String(event?.active?.id ?? '')
                const overId = String(event?.over?.id ?? '')
                if (!activeId || !overId || activeId === overId) return
                const current = Array.isArray(spaceMergedOrderRef.current) ? spaceMergedOrderRef.current : []
                const oldIndex = current.indexOf(activeId)
                const newIndex = current.indexOf(overId)
                if (oldIndex < 0 || newIndex < 0) return
                const next = arrayMove(current, oldIndex, newIndex)
                setSpaceCardOrder(next)
                writeDashboardOrder(next)
              }}
            >
              <SortableContext items={spaceMergedOrder} strategy={rectSortingStrategy}>
                {/* Utilization line chart ? hidden when SHOW_SPACE_UTILIZATION_LINE_CHART is false (advanced parity) */}
                {shouldShowWidget('utilization') && (
                  <SortableDashboardItem
                    id="utilization"
                    disabled={spaceLayoutLocked}
                    order={getSpaceCardOrder('utilization')}
                    span={getSpaceCardSpan('utilization')}
                    showSpanToggle={!spaceLayoutLocked}
                    onToggleSpan={toggleSpaceCardSpan}
                    showHeightToggle={!spaceLayoutLocked}
                    isFullscreen={String(spaceFullscreenCardId || '') === 'utilization'}
                    onToggleFullscreen={toggleSpaceFullscreen}
                    rowSpan={getSpaceCardRowSpan('utilization')}
                  >
                    {(() => {
                      const utilizationVg = spaceOverrideGraph('utilization', 'Utilization');
                      if (utilizationVg) {
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
                              backgroundColor: 'rgba(128, 120, 100, 0.6)',
                              borderRadius: '8px',
                              padding: { xs: 2, sm: 2.5, md: 3, lg: 4, xl: 5 },
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                              border: '1px solid #ccc',
                              minWidth: 0,
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                            }}
                          >
                            {renderCustomGraphCard(utilizationVg)}
                          </Box>
                        );
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
                            backgroundColor: 'rgba(128, 120, 100, 0.6)',
                            borderRadius: '8px',
                            padding: { xs: 2, sm: 2.5, md: 3, lg: 4, xl: 5 },
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            border: '1px solid #ccc',
                            minWidth: 0,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                          }}
                        >
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
                                <FileUploadIcon fontSize="small" /> Export
                              </button>
                              <ExportDropdown
                                isOpen={showExportDropdown.line}
                                onClose={() => setShowExportDropdown(prev => ({ ...prev, line: false }))}
                                chartTitle={generateDynamicChartTitle(getWidgetTitle('utilization', 'Utilization'))}
                                dropdownKey="line"
                              />
                            </Box>
                          </Box>
                          <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                            <SpaceWidgetRenderer
                              widgetKey="utilization"
                              context={{ ...spaceWidgetRenderContext, selectorMode: 'main' }}
                              chartLoaderHeight="100%"
                            />
                          </Box>
                        </Box>
                      );
                    })()}
                  </SortableDashboardItem>
                )}

                {shouldShowWidget('instant_utilization_combined') && (
                  <SortableDashboardItem
                    id="instant_utilization_combined"
                    disabled={spaceLayoutLocked}
                    order={getSpaceCardOrder('instant_utilization_combined')}
                    span={getSpaceCardSpan('instant_utilization_combined')}
                    showSpanToggle={false}
                    onToggleSpan={toggleSpaceCardSpan}
                    showHeightToggle={!spaceLayoutLocked}
                    isFullscreen={String(spaceFullscreenCardId || '') === 'instant_utilization_combined'}
                    onToggleFullscreen={toggleSpaceFullscreen}
                    rowSpan={getSpaceCardRowSpan('instant_utilization_combined')}
                  >
                    {renderCustomizedSpaceWidgetSlot(
                      'instant_utilization_combined',
                      { widgetKey: 'instant_occupancy_count', selectorMode: 'active' },
                      {
                        widgetRenderContext: spaceWidgetRenderContext,
                        selectorMode: 'active',
                      },
                      {
                        chartHeaderStyle,
                        isLargeScreen,
                        isMediumScreen,
                        getWidgetTitle,
                        generateDynamicChartTitle,
                        ExportDropdown,
                        showExportDropdown,
                        setShowExportDropdown,
                        exportLoading,
                        handleExport,
                        theme,
                        spaceChartsDurationFilterElement,
                        shouldShowWidget,
                      }
                    )}
                  </SortableDashboardItem>
                )}

                {/* Top Section: Instant Occupancy Count Chart */}
                {shouldShowWidget('instant_occupancy_count') && (
                  <SortableDashboardItem
                    id="instant_occupancy_count"
                    disabled={spaceLayoutLocked}
                    order={getSpaceCardOrder('instant_occupancy_count')}
                    span={getSpaceCardSpan('instant_occupancy_count')}
                    showSpanToggle={!spaceLayoutLocked}
                    onToggleSpan={toggleSpaceCardSpan}
                    showHeightToggle={!spaceLayoutLocked}
                    isFullscreen={String(spaceFullscreenCardId || '') === 'instant_occupancy_count'}
                    onToggleFullscreen={toggleSpaceFullscreen}
                    rowSpan={getSpaceCardRowSpan('instant_occupancy_count')}
                  >
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
                        minWidth: 0,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                      }}>
                      <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: { xs: 2, sm: 2.5, md: 3, lg: 4, xl: 5 }
                      }}>
                        <Box component="h3" sx={chartHeaderStyle}>
                          {generateDynamicChartTitle(getWidgetTitle('instant_occupancy_count', 'Instant Occupancy Count'))}
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
                            <FileUploadIcon fontSize="small" /> Export
                          </button>
                          <ExportDropdown
                            isOpen={showExportDropdown.instant}
                            onClose={() => setShowExportDropdown(prev => ({ ...prev, instant: false }))}
                            chartTitle={generateDynamicChartTitle(getWidgetTitle('instant_occupancy_count', 'Instant Occupancy Count'))}
                            dropdownKey="instant"
                          />
                        </Box>
                      </Box>
                      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                        <SpaceWidgetRenderer
                          widgetKey="instant_occupancy_count"
                          context={{ ...spaceWidgetRenderContext, selectorMode: 'active' }}
                          chartLoaderHeight="100%"
                        />
                      </Box>
                    </Box>
                  </SortableDashboardItem>
                )}

                {/* Main Content: Two columns for Occupancy by Group and Utilization By Area */}
                <>
                  {/* Left Column: Occupancy by Group */}
                  <>
                    {shouldShowWidget('utilization_by_area_group') && (
                      <SortableDashboardItem
                        id="utilization_by_area_group"
                        disabled={spaceLayoutLocked}
                        order={getSpaceCardOrder('utilization_by_area_group')}
                        span={getSpaceCardSpan('utilization_by_area_group')}
                        showSpanToggle={!spaceLayoutLocked}
                        onToggleSpan={toggleSpaceCardSpan}
                        showHeightToggle={!spaceLayoutLocked}
                        isFullscreen={String(spaceFullscreenCardId || '') === 'utilization_by_area_group'}
                        onToggleFullscreen={toggleSpaceFullscreen}
                        rowSpan={getSpaceCardRowSpan('utilization_by_area_group')}
                      >
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
                            minWidth: 0,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                          }}>
                          <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: { xs: 1.5, sm: 2, md: 2.5, lg: 3, xl: 3.5 }
                          }}>
                            <Box component="h3" sx={chartHeaderStyle}>
                              {generateDynamicChartTitle(getWidgetTitle('utilization_by_area_group', 'Occupancy by Group'))}
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
                                <FileUploadIcon fontSize="small" /> Export
                              </button>
                              <ExportDropdown
                                isOpen={showExportDropdown.pie}
                                onClose={() => setShowExportDropdown(prev => ({ ...prev, pie: false }))}
                                chartTitle={generateDynamicChartTitle(getWidgetTitle('utilization_by_area_group', 'Occupancy by Group'))}
                                dropdownKey="pie"
                              />
                            </Box>
                          </Box>
                          <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                            <SpaceWidgetRenderer
                              widgetKey="utilization_by_area_group"
                              context={{ ...spaceWidgetRenderContext, selectorMode: 'active' }}
                              chartLoaderHeight="100%"
                            />
                          </Box>
                        </Box>
                      </SortableDashboardItem>
                    )}

                    {shouldShowWidget('peak_and_minimum_utilization') && (
                      <SortableDashboardItem
                        id="peak_and_minimum_utilization"
                        disabled={spaceLayoutLocked}
                        order={getSpaceCardOrder('peak_and_minimum_utilization')}
                        span={getSpaceCardSpan('peak_and_minimum_utilization')}
                        showSpanToggle={!spaceLayoutLocked}
                        onToggleSpan={toggleSpaceCardSpan}
                        showHeightToggle={!spaceLayoutLocked}
                        isFullscreen={String(spaceFullscreenCardId || '') === 'peak_and_minimum_utilization'}
                        onToggleFullscreen={toggleSpaceFullscreen}
                        rowSpan={getSpaceCardRowSpan('peak_and_minimum_utilization')}
                      >
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
                            padding: { xs: 2, sm: 2.5, md: 3 },
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            border: '1px solid #ccc',
                            minWidth: 0,
                            // auto height — compact card, not stretched to grid row height
                            height: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                          }}>
                          <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: { xs: 1, sm: 1.5, md: 2 }
                          }}>
                            <Box component="h3" sx={chartHeaderStyle}>
                              {generateDynamicChartTitle(getWidgetTitle('peak_and_minimum_utilization', 'Peak & Minimum Utilization'))}
                            </Box>
                          </Box>

                          <Box sx={{ width: '100%' }}>
                            <SpaceWidgetRenderer
                              widgetKey="peak_and_minimum_utilization"
                              context={{ ...spaceWidgetRenderContext, selectorMode: 'active' }}
                            />
                          </Box>
                        </Box>
                      </SortableDashboardItem>
                    )}
                  </>

                  {shouldShowWidget('utilization_by_area') && (
                    <>
                      <SortableDashboardItem
                        id="utilization_by_area"
                        disabled={spaceLayoutLocked}
                        order={getSpaceCardOrder('utilization_by_area')}
                        span={getSpaceCardSpan('utilization_by_area')}
                        showSpanToggle={!spaceLayoutLocked}
                        onToggleSpan={toggleSpaceCardSpan}
                        showHeightToggle={!spaceLayoutLocked}
                        isFullscreen={String(spaceFullscreenCardId || '') === 'utilization_by_area'}
                        onToggleFullscreen={toggleSpaceFullscreen}
                        rowSpan={getSpaceCardRowSpan('utilization_by_area')}
                      >
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
                            backgroundColor: theme === 'default_white' ? '#fff' : 'rgba(128, 120, 100, 0.6)',
                            borderRadius: '8px',
                            padding: { xs: 2, sm: 2.5, md: 3, lg: 4, xl: 5 },
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            border: theme === 'default_white' ? '1px solid #000' : '1px solid #ccc',
                            minWidth: 0,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                          }}>
                          <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: { xs: 2, sm: 2.5, md: 3, lg: 4, xl: 5 }
                          }}>
                            <Box component="h3" sx={{
                              ...chartHeaderStyle,
                              color: theme === 'default_white' ? '#000' : '#fff'
                            }}>
                              {generateDynamicChartTitle(getWidgetTitle('utilization_by_area', 'Utilization By Area'))}
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
                                    color: theme === 'default_white' ? '#000' : '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: isLargeScreen ? '8px 12px' : '6px 10px',
                                    borderRadius: '4px',
                                    transition: 'background-color 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(0,0,0,0.05)'}
                                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                >
                                  <FileUploadIcon fontSize="small" /> Export
                                </button>
                                <ExportDropdown
                                  isOpen={showExportDropdown.table}
                                  onClose={() => setShowExportDropdown(prev => ({ ...prev, table: false }))}
                                  chartTitle={generateDynamicChartTitle(getWidgetTitle('utilization_by_area', 'Utilization By Area'))}
                                  dropdownKey="table"
                                />
                              </Box>
                            </Box>
                          </Box>

                          <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                            <SpaceWidgetRenderer
                              widgetKey="utilization_by_area"
                              context={{ ...spaceWidgetRenderContext, selectorMode: 'active' }}
                            />
                          </Box>
                        </Box>

                      </SortableDashboardItem>
                    </>
                  )}
                </>
                {spaceCustomGraphs.map((g, idx) => {
                  const key = `custom_graph:${String(g?.id ?? '')}`
                  return (
                    <SortableDashboardItem
                      key={key}
                      id={key}
                      disabled={spaceLayoutLocked}
                      order={getSpaceCardOrder(key)}
                      span={getSpaceCardSpan(key)}
                      showSpanToggle={!spaceLayoutLocked}
                      onToggleSpan={toggleSpaceCardSpan}
                      showHeightToggle={!spaceLayoutLocked}
                      isFullscreen={String(spaceFullscreenCardId || '') === String(key)}
                      onToggleFullscreen={toggleSpaceFullscreen}
                      rowSpan={getSpaceCardRowSpan(key)}
                    >
                      <Box
                        sx={{
                          background:
                            'linear-gradient(180deg, rgba(128,120,100,0.55) 0%, rgba(128,120,100,0.40) 100%)',
                          borderRadius: '14px',
                          padding: { xs: 2, sm: 2.5, md: 3, lg: 4, xl: 5 },
                          boxShadow: '0 10px 28px rgba(0,0,0,0.18)',
                          border: '1px solid rgba(255,255,255,0.16)',
                          minWidth: 0,
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          backdropFilter: 'blur(6px)',
                        }}
                      >
                        {renderCustomGraphCard(g, idx)}
                      </Box>
                    </SortableDashboardItem>
                  )
                })}
                {[...ENERGY_BUILTIN_KEYS].filter(
                  (widKey) => getEffectiveBuiltinDashboardPage(widKey) === 'space'
                ).map((widKey) => {
                  if (!shouldShowWidget(widKey)) return null;
                  const vg = spaceOverrideGraph(widKey, widKey);
                  if (!vg) return null;
                  return (
                    <SortableDashboardItem
                      key={widKey}
                      id={widKey}
                      disabled={spaceLayoutLocked}
                      order={getSpaceCardOrder(widKey)}
                      span={getSpaceCardSpan(widKey)}
                      showSpanToggle={!spaceLayoutLocked}
                      onToggleSpan={toggleSpaceCardSpan}
                      showHeightToggle={!spaceLayoutLocked}
                      isFullscreen={String(spaceFullscreenCardId || '') === String(widKey)}
                      onToggleFullscreen={toggleSpaceFullscreen}
                      rowSpan={getSpaceCardRowSpan(widKey)}
                    >
                      <Box
                        sx={{
                          background:
                            'linear-gradient(180deg, rgba(128,120,100,0.55) 0%, rgba(128,120,100,0.40) 100%)',
                          borderRadius: '14px',
                          padding: { xs: 2, sm: 2.5, md: 3, lg: 4, xl: 5 },
                          boxShadow: '0 10px 28px rgba(0,0,0,0.18)',
                          border: '1px solid rgba(255,255,255,0.16)',
                          minWidth: 0,
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          backdropFilter: 'blur(6px)',
                        }}
                      >
                        {renderCustomGraphCard(vg, 0)}
                      </Box>
                    </SortableDashboardItem>
                  );
                })}
              </SortableContext>
            </DndContext>
          </Box>
        
              </>
            ),
          },
          }}
        />
      )}

      {!showChartsTab && !showOnlyInstantChart && (
        <SpaceUtilizationContainer
          variant="customized"
          adapter={customizedSpaceContainerAdapter}
          activeTab={SPACE_TAB_IDS.UTILIZATION}
          orchestration={orchestration}
          runtime={{
            SpaceLayoutRenderer,
            layoutAdapter: customizedSpaceLayoutAdapter,
            mainLayoutAdapter: {
              ...customizedSpaceLayoutAdapter,
              layoutMode: 'fixed-sections',
            },
            mainLayoutRuntime: customizedMainLayoutRuntime,
          }}
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

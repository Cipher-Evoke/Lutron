import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Typography, CircularProgress, Divider } from '@mui/material'
import LinkIcon from '@mui/icons-material/Link'
import dashboardOverviewBg from '../../assets/images/dashboard-overview-bg.png'
import CarbonFootprintTeardrop from './CarbonFootprintTeardrop'
import OverviewMetricTile from '../../../../shared/dashboard/widgets/overview/OverviewMetricTile'
import AlertsWidget from '../../../../shared/dashboard/widgets/alerts'
import {
  OVERVIEW_TILE_TYPES,
  OVERVIEW_THEME_VARIANTS,
  overviewFiveGridSpanSx,
  overviewSevenGridSpanSx,
  overviewBottomRowTileWidthSx,
} from '../../../../shared/dashboard/widgets/overview'
import { useDashboardWidgetVisibility } from '../../utils/dashboardWidgetVisibility'
import {
  computeCo2KgFromEnergySavings,
  getShadesCo2Constant,
  getShadesWidgetDescription,
  getShadesWidgetImage,
  getShadesWidgetName,
  getShadesWidgetHyperlink,
  openShadesWidgetHyperlink,
  SHADES_SETTINGS_EVENT,
} from '../../utils/shadesWidgetSettings'
import {
  CUSTOM_OVERVIEW_WIDGET_TYPES,
  CUSTOM_OVERVIEW_WIDGETS_EVENT,
  ENABLE_CUSTOM_DASHBOARD_OVERVIEW_WIDGETS,
  readCustomOverviewWidgets,
} from '../../utils/customOverviewWidgets'

/** Quantum Vue floorplan (lighting / shades) — opens in a new browser tab */
const SHADES_FLOORPLAN_URL =
  'https://q2.lutron.com:8443/#floorplan/%2Fgraphicalregion%2F12584/lighting'

const titleStyle = {
  color: '#1565c0',
  fontWeight: 400,
  /* Dense titles for ~15" laptop viewports */
  fontSize: { xs: '1.2rem', sm: '1.35rem' },
  lineHeight: 1.2,
  textAlign: 'left',
  width: '100%',
  boxSizing: 'border-box',
}

/** Softer than near-black — matches reference cards */
const bodyTextDark = { color: '#64748b' }
const bodyTextMuted = { color: '#94a3b8' }

const cardStyle = {
  backgroundColor: '#ffffff',
  borderRadius: 0,
  p: 1,
  // Equal grid cells: allow shrink below content min-size (Alerts / CO₂ must not grow the row).
  minHeight: 0,
  minWidth: 0,
  width: '100%',
  height: '100%',
  maxHeight: '100%',
  alignSelf: 'stretch',
  justifySelf: 'stretch',
  cursor: 'pointer',
  transition: 'box-shadow 0.2s ease',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  boxSizing: 'border-box',
  overflow: 'hidden',
  /* Typography/icons can use cqi/cqh so they track card size (and browser zoom via rem-based layout) */
  containerType: 'size',
  containerName: 'overview-card',
  '&:hover': { boxShadow: 3 },
}

const cardHeader = {
  flexShrink: 0,
  width: '100%',
  minWidth: 0,
  minHeight: 0,
}

const cardBodyMain = {
  flex: 1,
  minHeight: 0,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  width: '100%',
  py: 0.25,
}

const labelSmall = { fontSize: 'clamp(0.52rem, 0.34rem + 2.4cqi, 0.72rem)' }
const labelMeta = { fontSize: 'clamp(0.48rem, 0.3rem + 2.1cqi, 0.65rem)' }

const iconInTile = (color) => ({
  color,
  fontSize: 'clamp(1.1rem, 0.65rem + 3cqi, 1.85rem) !important',
  width: '1em !important',
  height: '1em !important',
  flexShrink: 0,
})

const iconInTileLarge = (color) => ({
  ...iconInTile(color),
  fontSize: 'clamp(2.4rem, 1.1rem + 4.5cqh + 2cqi, 4.5rem) !important',
})

function ShadesTileContent({ title, savingsAmount, savingsUnit, gaugePercent, imageUrl, description }) {
  const co2Kg = computeCo2KgFromEnergySavings(savingsAmount, savingsUnit, getShadesCo2Constant())
  const showTeardrop = !imageUrl
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <Box sx={cardHeader}>
        <Typography variant="subtitle1" sx={titleStyle} noWrap>
          {title}
        </Typography>
        <Divider sx={{ my: 0.5, borderColor: '#e5e7eb' }} />
      </Box>
      <Box sx={{ ...cardBodyMain, py: 0.15 }}>
        {showTeardrop ? (
          <CarbonFootprintTeardrop co2Kg={co2Kg} gaugePercent={gaugePercent} />
        ) : (
          <Box
            component="img"
            src={imageUrl}
            alt=""
            sx={{
              maxWidth: '85%',
              maxHeight: '85%',
              objectFit: 'contain',
            }}
          />
        )}
      </Box>
      {description ? (
        <Box sx={{ flexShrink: 0, width: '100%', pt: 0.25, px: 0.25, overflow: 'hidden' }}>
          <Typography
            component="div"
            variant="body2"
            noWrap
            sx={{ ...bodyTextDark, ...labelMeta, lineHeight: 1.2 }}
          >
            {description}
          </Typography>
        </Box>
      ) : null}
    </Box>
  )
}

function CustomOverviewWidgetTile({
  widget,
  savingsAmount,
  savingsUnit,
  gaugePercent,
  tileWidthSx,
  navigate,
  onNavigateToEnergy,
}) {
  const isExternalLink = widget.type === CUSTOM_OVERVIEW_WIDGET_TYPES.EXTERNAL_LINK
  const isCarbon = widget.type === CUSTOM_OVERVIEW_WIDGET_TYPES.CARBON_FOOTPRINT
  const hyperlink = widget.hyperlink?.trim() || ''
  const isClickable = (isExternalLink && Boolean(hyperlink)) || (widget.type === CUSTOM_OVERVIEW_WIDGET_TYPES.STATIC && Boolean(hyperlink))

  const handleClick = () => {
    if (!isClickable || !hyperlink) return
    openShadesWidgetHyperlink(hyperlink, { navigate, onNavigateToEnergy })
  }

  const showTeardrop = isCarbon || (isExternalLink && !widget.imageUrl)
  const co2Kg = showTeardrop
    ? computeCo2KgFromEnergySavings(savingsAmount, savingsUnit, widget.co2Constant)
    : null

  return (
    <Box
      sx={{
        ...cardStyle,
        ...tileWidthSx,
        // Match main overview grid cell proportions (equal height/width among custom tiles).
        aspectRatio: '115 / 92',
        minHeight: 0,
        height: '100%',
        maxHeight: '12.5rem',
        cursor: isClickable ? 'pointer' : 'default',
      }}
      onClick={isClickable ? handleClick : undefined}
      role={isClickable ? 'link' : undefined}
      aria-label={isClickable ? `Open ${widget.name}` : widget.name}
    >
      <Box sx={cardHeader}>
        <Typography variant="subtitle1" sx={titleStyle} noWrap>
          {widget.name}
        </Typography>
        <Divider sx={{ my: 0.5, borderColor: '#e5e7eb' }} />
      </Box>
      <Box sx={cardBodyMain}>
        {showTeardrop ? (
          <CarbonFootprintTeardrop co2Kg={co2Kg} gaugePercent={gaugePercent} />
        ) : widget.imageUrl ? (
          <Box
            component="img"
            src={widget.imageUrl}
            alt=""
            sx={{
              maxWidth: '85%',
              maxHeight: '85%',
              objectFit: 'contain',
            }}
          />
        ) : isExternalLink ? (
          <LinkIcon sx={iconInTileLarge('#1565c0')} />
        ) : null}
      </Box>
      {widget.description ? (
        <Box sx={{ flexShrink: 0, width: '100%', pt: 0.25, px: 0.25 }}>
          <Typography component="div" variant="body2" sx={{ ...bodyTextDark, ...labelMeta, lineHeight: 1.2 }}>
            {widget.description}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ flexShrink: 0, width: '100%', pt: 0.25, px: 0.25 }} />
      )}
    </Box>
  )
}

function DashboardOverview({
  data,
  loading,
  error,
  onNavigateToEnergy,
  onNavigateToAlerts,
  onNavigateToSpaceUtilization,
  onNavigateToSchedule,
  onNavigateToFloor,
  onNavigateToQuickControls,
}) {
  const navigate = useNavigate()
  const { isWidgetVisible } = useDashboardWidgetVisibility()
  const readShadesTileSettings = () => ({
    name: getShadesWidgetName(),
    imageUrl: getShadesWidgetImage(),
    description: getShadesWidgetDescription(),
  })
  const [shadesTileSettings, setShadesTileSettings] = useState(() => readShadesTileSettings())
  const [customOverviewWidgets, setCustomOverviewWidgets] = useState(() => readCustomOverviewWidgets())

  useEffect(() => {
    const refreshCustom = () => setCustomOverviewWidgets(readCustomOverviewWidgets())
    const refreshShades = () => setShadesTileSettings(readShadesTileSettings())
    refreshCustom()
    refreshShades()
    window.addEventListener(CUSTOM_OVERVIEW_WIDGETS_EVENT, refreshCustom)
    window.addEventListener(SHADES_SETTINGS_EVENT, refreshShades)
    return () => {
      window.removeEventListener(CUSTOM_OVERVIEW_WIDGETS_EVENT, refreshCustom)
      window.removeEventListener(SHADES_SETTINGS_EVENT, refreshShades)
    }
  }, [])
  const showEnergyTile = isWidgetVisible('energy')
  const showAlertsTile = isWidgetVisible('alerts')
  const showSchedulesTile = isWidgetVisible('schedules')
  const showQuickControlsTile = isWidgetVisible('quick_controls')
  const showShadesTile = isWidgetVisible('shades')
  // const showFloorsTile = isWidgetVisible('floors')
  const showFloorsTile = false
  const showSpaceUtilizationTile = isWidgetVisible('space_utilization')

  const overviewTileCount =
    (showEnergyTile ? 1 : 0) +
    (showAlertsTile ? 1 : 0) +
    (showSchedulesTile ? 1 : 0) +
    (showQuickControlsTile ? 1 : 0) +
    (showShadesTile ? 1 : 0) +
    (showFloorsTile ? 1 : 0) +
    (showSpaceUtilizationTile ? 1 : 0)

  const useOneTileLayout = overviewTileCount === 1
  const useTwoTileLayout = overviewTileCount === 2
  const useThreeTileLayout = overviewTileCount === 3
  const useFourTileLayout = overviewTileCount === 4
  const useFiveTileLayout = overviewTileCount === 5
  const useSixTileLayout = overviewTileCount === 6
  const useSevenTileLayout = overviewTileCount === 7
  const useFlexBottomRow = !useOneTileLayout && !useTwoTileLayout && !useThreeTileLayout && !useFourTileLayout && !useFiveTileLayout && !useSixTileLayout && !useSevenTileLayout

  // Dynamic position map: assigns 5-tile grid positions to whichever 5 widgets are enabled (in canonical order)
  const tileFivePos = (() => {
    if (!useFiveTileLayout) return {}
    const showMap = {
      energy: showEnergyTile, alerts: showAlertsTile, schedules: showSchedulesTile,
      quick_controls: showQuickControlsTile, shades: showShadesTile,
      floors: showFloorsTile, space_utilization: showSpaceUtilizationTile,
    }
    const positions = [
      overviewFiveGridSpanSx(1, 1, 3),
      overviewFiveGridSpanSx(1, 3, 5),
      overviewFiveGridSpanSx(1, 5, 7),
      overviewFiveGridSpanSx(2, 2, 4),
      overviewFiveGridSpanSx(2, 4, 6),
    ]
    const keys = ['energy', 'alerts', 'schedules', 'quick_controls', 'shades', 'floors', 'space_utilization']
    const map = {}
    let idx = 0
    for (const key of keys) {
      if (showMap[key]) map[key] = positions[idx++]
    }
    return map
  })()

  // Dynamic position map: assigns 6-tile grid positions (3×2) to whichever 6 widgets are enabled (in canonical order)
  const tileSixPos = (() => {
    if (!useSixTileLayout) return {}
    const showMap = {
      energy: showEnergyTile, alerts: showAlertsTile, schedules: showSchedulesTile,
      quick_controls: showQuickControlsTile, shades: showShadesTile,
      floors: showFloorsTile, space_utilization: showSpaceUtilizationTile,
    }
    const positions = [
      overviewFiveGridSpanSx(1, 1, 3),
      overviewFiveGridSpanSx(1, 3, 5),
      overviewFiveGridSpanSx(1, 5, 7),
      overviewFiveGridSpanSx(2, 1, 3),
      overviewFiveGridSpanSx(2, 3, 5),
      overviewFiveGridSpanSx(2, 5, 7),
    ]
    const keys = ['energy', 'alerts', 'schedules', 'quick_controls', 'shades', 'floors', 'space_utilization']
    const map = {}
    let idx = 0
    for (const key of keys) {
      if (showMap[key]) map[key] = positions[idx++]
    }
    return map
  })()

  // Dynamic position map: assigns 4-tile grid positions (2×2) to whichever 4 widgets are enabled (in canonical order)
  const tileFourPos = (() => {
    if (!useFourTileLayout) return {}
    const showMap = {
      energy: showEnergyTile, alerts: showAlertsTile, schedules: showSchedulesTile,
      quick_controls: showQuickControlsTile, shades: showShadesTile,
      floors: showFloorsTile, space_utilization: showSpaceUtilizationTile,
    }
    // In a 2-col grid, auto-placement puts 2 items per row nicely. We don't even need explicit spans,
    // but returning empty {} for each active tile handles the logic dynamically.
    const positions = [{}, {}, {}, {}]
    const keys = ['energy', 'alerts', 'schedules', 'quick_controls', 'shades', 'floors', 'space_utilization']
    const map = {}
    let idx = 0
    for (const key of keys) {
      if (showMap[key]) map[key] = positions[idx++]
    }
    return map
  })()

  // Dynamic position map: assigns 3-tile grid positions (1×3 single row) to whichever 3 widgets are enabled
  const tileThreePos = (() => {
    if (!useThreeTileLayout) return {}
    const showMap = {
      energy: showEnergyTile, alerts: showAlertsTile, schedules: showSchedulesTile,
      quick_controls: showQuickControlsTile, shades: showShadesTile,
      floors: showFloorsTile, space_utilization: showSpaceUtilizationTile,
    }
    // 3-col grid, single row — auto-placement handles it, empty {} is fine
    const positions = [{}, {}, {}]
    const keys = ['energy', 'alerts', 'schedules', 'quick_controls', 'shades', 'floors', 'space_utilization']
    const map = {}
    let idx = 0
    for (const key of keys) {
      if (showMap[key]) map[key] = positions[idx++]
    }
    return map
  })()

  // Dynamic position map: assigns 2-tile grid positions (1×2 single row) to whichever 2 widgets are enabled
  const tileTwoPos = (() => {
    if (!useTwoTileLayout) return {}
    const showMap = {
      energy: showEnergyTile, alerts: showAlertsTile, schedules: showSchedulesTile,
      quick_controls: showQuickControlsTile, shades: showShadesTile,
      floors: showFloorsTile, space_utilization: showSpaceUtilizationTile,
    }
    // 2-col grid, single row — auto-placement handles it, empty {} is fine
    const positions = [{}, {}]
    const keys = ['energy', 'alerts', 'schedules', 'quick_controls', 'shades', 'floors', 'space_utilization']
    const map = {}
    let idx = 0
    for (const key of keys) {
      if (showMap[key]) map[key] = positions[idx++]
    }
    return map
  })()

  // Dynamic position map: assigns 1-tile grid position to whichever single widget is enabled
  const tileOnePos = (() => {
    if (!useOneTileLayout) return {}
    const showMap = {
      energy: showEnergyTile, alerts: showAlertsTile, schedules: showSchedulesTile,
      quick_controls: showQuickControlsTile, shades: showShadesTile,
      floors: showFloorsTile, space_utilization: showSpaceUtilizationTile,
    }
    const positions = [{}]
    const keys = ['energy', 'alerts', 'schedules', 'quick_controls', 'shades', 'floors', 'space_utilization']
    const map = {}
    let idx = 0
    for (const key of keys) {
      if (showMap[key]) map[key] = positions[idx++]
    }
    return map
  })()
  const resolveGreenTileGridSx = (tileKey, sevenSpan) => ({
    ...cardStyle,
    ...(useSevenTileLayout
      ? sevenSpan
      : useFiveTileLayout
        ? tileFivePos[tileKey]
        : useSixTileLayout
          ? tileSixPos[tileKey]
          : useFourTileLayout
            ? tileFourPos[tileKey]
            : useThreeTileLayout
              ? tileThreePos[tileKey]
              : useTwoTileLayout
                ? tileTwoPos[tileKey]
                : useOneTileLayout
                  ? tileOnePos[tileKey]
                  : {}),
  })
  const bottomRowTileCount =
    (showQuickControlsTile ? 1 : 0) +
    (showShadesTile ? 1 : 0) +
    (showFloorsTile ? 1 : 0) +
    (showSpaceUtilizationTile ? 1 : 0)
  const bottomRowTileWidthSx = overviewBottomRowTileWidthSx(bottomRowTileCount)

  const openShadesFloorplan = () => {
    openShadesWidgetHyperlink(getShadesWidgetHyperlink(SHADES_FLOORPLAN_URL), {
      navigate,
      onNavigateToEnergy,
    })
  }

  const alerts = data?.alerts
  const schedule = data?.schedule?.next
  // Floors tile is hidden, but count still drives Energy / Space Utilization empty-state.
  const floorsCount = data?.floors?.count ?? 0
  // Basic only: without configured floors, do not show overview Energy/CO₂ from /home/dashboard
  // (that payload can still include project-level CurrentAreaEvent / savings). Passing null
  // uses existing OverviewMetricTile empty UI ("No data"), same as Space Utilization.
  const energy = floorsCount > 0 ? data?.energy ?? null : null
  const spaceUtil = floorsCount > 0 ? data?.space_utilization ?? null : null
  // Always match the Energy overview tile: instantaneous savings (kW) × CO₂ constant.
  const shadesCo2Amount = energy?.savings_kw ?? null
  const shadesCo2Unit = energy?.savings_kw != null ? 'kW' : null
  const shadesCo2GaugePercent = energy?.savings_percent ?? null
  const visibleCustomOverviewWidgets = ENABLE_CUSTOM_DASHBOARD_OVERVIEW_WIDGETS
    ? customOverviewWidgets.filter((w) => w.visible)
    : []
  const customOverviewTileWidthSx = overviewBottomRowTileWidthSx(
    Math.min(Math.max(visibleCustomOverviewWidgets.length, 1), 4)
  )

  if (loading && !data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'min(22.5rem, 50%)' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error && !data) {
    const message =
      typeof error === 'string'
        ? error
        : error?.message || 'Failed to load dashboard overview.';
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error" sx={{ mb: 1 }}>
          {message}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Confirm the API server is reachable, then refresh the page or open the Energy tab.
        </Typography>
      </Box>
    )
  }

  return (
    <>
      <Box
        aria-hidden
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          backgroundImage: `url(${dashboardOverviewBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          height: '100%',
          minHeight: 0,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          /* Center in remaining space; Dashboard parent adds pt to clear fixed sub-header (do not add large dvh here) */
          justifyContent: 'center',
          boxSizing: 'border-box',
          overflowY: 'auto',
          overflowX: 'hidden',
          pt: 0.5,
          pb: 0.5,
          px: { xs: 1, sm: 1.5 },
        }}
      >
        <Box
          sx={{
            /* rem/% + aspect-ratio: scales with browser zoom like normal text; avoids vw/dvh fighting rem */
            width: useSevenTileLayout
              ? 'min(calc(100% - 1rem), 76rem, 94%)'
              : useOneTileLayout
                ? 'min(calc(100% - 1rem), 18.5rem, 90%)'
                : (useFourTileLayout || useTwoTileLayout)
                  ? 'min(calc(100% - 1rem), 40rem, 90%)'
                  : useSixTileLayout
                    ? 'min(calc(100% - 1rem), 68rem, 94%)'
                    : 'min(calc(100% - 1rem), 60rem, 92%)',
            maxWidth: '100%',
            /* Taller grid for 5/6 tiles so every card shares equal width/height cells */
            aspectRatio: useSevenTileLayout
              ? '2.15 / 1'
              : useSixTileLayout
                ? '3 / 1.95'
              : useFiveTileLayout
                ? '3 / 1.95'
              : useThreeTileLayout
                ? '3.2 / 1'
                : useTwoTileLayout
                  ? '115 / 52'
                  : (useFourTileLayout || useOneTileLayout)
                    ? '115 / 92'
                    : '3 / 1.7',
            minHeight: 0,
            maxHeight: 'min(100%, min(44rem, calc(100dvh - 8rem)))',
            flex: '0 1 auto',
            boxSizing: 'border-box',
            display: 'grid',
            gridTemplateColumns: useSevenTileLayout
              ? 'repeat(8, minmax(0, 1fr))'
              : (useFiveTileLayout || useSixTileLayout)
                ? 'repeat(6, minmax(0, 1fr))'
                : useOneTileLayout
                  ? 'repeat(1, minmax(0, 1fr))'
                  : (useFourTileLayout || useTwoTileLayout)
                    ? 'repeat(2, minmax(0, 1fr))'
                    : 'repeat(3, minmax(0, 1fr))',
            gridTemplateRows: (useThreeTileLayout || useTwoTileLayout || useOneTileLayout)
              ? 'minmax(0, 1fr)'
              : 'repeat(2, minmax(0, 1fr))',
            columnGap: 1.25,
            rowGap: 1.25,
            alignItems: 'stretch',
            justifyItems: 'stretch',
            alignSelf: 'center',
            overflow: 'hidden',
          }}
        >
          {showEnergyTile && (
            <OverviewMetricTile
              tileType={OVERVIEW_TILE_TYPES.ENERGY}
              energy={energy}
              onClick={onNavigateToEnergy}
              themeVariant={OVERVIEW_THEME_VARIANTS.BASIC}
              cardSx={resolveGreenTileGridSx('energy', overviewSevenGridSpanSx(1, 1, 3))}
            />
          )}

          {showAlertsTile && (
            <AlertsWidget
              alerts={alerts}
              onClick={onNavigateToAlerts}
              shellVariant="basic"
              cardSx={{
                ...cardStyle,
                ...(useSevenTileLayout
                  ? overviewSevenGridSpanSx(1, 3, 5)
                  : useFiveTileLayout
                    ? tileFivePos.alerts
                    : useSixTileLayout
                      ? tileSixPos.alerts
                      : useFourTileLayout
                        ? tileFourPos.alerts
                        : useThreeTileLayout
                          ? tileThreePos.alerts
                          : useTwoTileLayout
                            ? tileTwoPos.alerts
                            : useOneTileLayout
                              ? tileOnePos.alerts
                              : {}),
              }}
            />
          )}

          {showSchedulesTile && (
            <OverviewMetricTile
              tileType={OVERVIEW_TILE_TYPES.SCHEDULES}
              schedule={schedule}
              onClick={onNavigateToSchedule}
              themeVariant={OVERVIEW_THEME_VARIANTS.BASIC}
              cardSx={resolveGreenTileGridSx('schedules', overviewSevenGridSpanSx(1, 5, 7))}
            />
          )}

          {(useSevenTileLayout || useFiveTileLayout || useSixTileLayout || useFourTileLayout || useThreeTileLayout || useTwoTileLayout || useOneTileLayout) && showQuickControlsTile ? (
            <OverviewMetricTile
              tileType={OVERVIEW_TILE_TYPES.QUICK_CONTROLS}
              onClick={onNavigateToQuickControls}
              themeVariant={OVERVIEW_THEME_VARIANTS.BASIC}
              cardSx={resolveGreenTileGridSx('quick_controls', overviewSevenGridSpanSx(1, 7, 9))}
            />
          ) : null}

          {(useSevenTileLayout || useFiveTileLayout || useSixTileLayout || useFourTileLayout || useThreeTileLayout || useTwoTileLayout || useOneTileLayout) && showShadesTile ? (
            <Box
              sx={{
                ...cardStyle,
                ...(useSevenTileLayout
                  ? overviewSevenGridSpanSx(2, 2, 4)
                  : useFiveTileLayout
                    ? tileFivePos.shades
                    : useSixTileLayout
                      ? tileSixPos.shades
                      : useFourTileLayout
                        ? tileFourPos.shades
                        : useThreeTileLayout
                          ? tileThreePos.shades
                          : useTwoTileLayout
                            ? tileTwoPos.shades
                            : tileOnePos.shades),
              }}
              onClick={openShadesFloorplan}
              role="link"
              aria-label="Open Shades floorplan in Quantum Vue"
            >
              <ShadesTileContent
                title={shadesTileSettings.name}
                savingsAmount={shadesCo2Amount}
                savingsUnit={shadesCo2Unit}
                gaugePercent={shadesCo2GaugePercent}
                imageUrl={shadesTileSettings.imageUrl}
                description={shadesTileSettings.description}
              />
            </Box>
          ) : null}

          {/* Floors widget disabled
          {(useSevenTileLayout || useFiveTileLayout || useSixTileLayout || useFourTileLayout || useThreeTileLayout || useTwoTileLayout || useOneTileLayout) && showFloorsTile ? (
            <OverviewMetricTile
              tileType={OVERVIEW_TILE_TYPES.FLOORS}
              floorsCount={floorsCount}
              onClick={onNavigateToFloor}
              themeVariant={OVERVIEW_THEME_VARIANTS.BASIC}
              cardSx={resolveGreenTileGridSx('floors', overviewSevenGridSpanSx(2, 4, 6))}
            />
          ) : null}
          */}

          {(useSevenTileLayout || useFiveTileLayout || useSixTileLayout || useFourTileLayout || useThreeTileLayout || useTwoTileLayout || useOneTileLayout) && showSpaceUtilizationTile ? (
            <OverviewMetricTile
              tileType={OVERVIEW_TILE_TYPES.SPACE_UTILIZATION}
              spaceUtil={spaceUtil}
              onClick={onNavigateToSpaceUtilization}
              themeVariant={OVERVIEW_THEME_VARIANTS.BASIC}
              cardSx={resolveGreenTileGridSx('space_utilization', overviewSevenGridSpanSx(2, 6, 8))}
            />
          ) : null}

          {useFlexBottomRow ? (
            <Box
              sx={{
                gridColumn: '1 / -1',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'stretch',
                gap: 2,
                width: '100%',
                minHeight: 0,
                height: '100%',
              }}
            >
              {showQuickControlsTile && (
                <OverviewMetricTile
                  tileType={OVERVIEW_TILE_TYPES.QUICK_CONTROLS}
                  onClick={onNavigateToQuickControls}
                  themeVariant={OVERVIEW_THEME_VARIANTS.BASIC}
                  cardSx={{ ...cardStyle, ...bottomRowTileWidthSx, aspectRatio: '115 / 92' }}
                />
              )}

              {showShadesTile && (
                <Box
                  sx={{ ...cardStyle, ...bottomRowTileWidthSx, aspectRatio: '115 / 92' }}
                  onClick={openShadesFloorplan}
                  role="link"
                  aria-label="Open Shades floorplan in Quantum Vue"
                >
                  <ShadesTileContent
                title={shadesTileSettings.name}
                savingsAmount={shadesCo2Amount}
                savingsUnit={shadesCo2Unit}
                gaugePercent={shadesCo2GaugePercent}
                imageUrl={shadesTileSettings.imageUrl}
                description={shadesTileSettings.description}
              />
                </Box>
              )}

              {/* Floors widget disabled
              {showFloorsTile && (
                <OverviewMetricTile
                  tileType={OVERVIEW_TILE_TYPES.FLOORS}
                  floorsCount={floorsCount}
                  onClick={onNavigateToFloor}
                  themeVariant={OVERVIEW_THEME_VARIANTS.BASIC}
                  cardSx={{ ...cardStyle, ...bottomRowTileWidthSx, aspectRatio: '115 / 92' }}
                />
              )}
              */}

              {showSpaceUtilizationTile && (
                <OverviewMetricTile
                  tileType={OVERVIEW_TILE_TYPES.SPACE_UTILIZATION}
                  spaceUtil={spaceUtil}
                  onClick={onNavigateToSpaceUtilization}
                  themeVariant={OVERVIEW_THEME_VARIANTS.BASIC}
                  cardSx={{ ...cardStyle, ...bottomRowTileWidthSx, aspectRatio: '115 / 92' }}
                />
              )}
            </Box>
          ) : null}
        </Box>

        {visibleCustomOverviewWidgets.length > 0 ? (
          <Box
            sx={{
              width: useSevenTileLayout
                ? 'min(calc(100% - 1rem), 76rem, 94%)'
                : useSixTileLayout
                  ? 'min(calc(100% - 1rem), 68rem, 94%)'
                  : 'min(calc(100% - 1rem), 60rem, 92%)',
              maxWidth: '100%',
              mt: 1.5,
              flexShrink: 0,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 2,
                justifyContent: 'center',
                width: '100%',
              }}
            >
              {visibleCustomOverviewWidgets.map((widget) => (
                <CustomOverviewWidgetTile
                  key={widget.id}
                  widget={widget}
                  savingsAmount={shadesCo2Amount}
                  savingsUnit={shadesCo2Unit}
                  gaugePercent={shadesCo2GaugePercent}
                  tileWidthSx={customOverviewTileWidthSx}
                  navigate={navigate}
                  onNavigateToEnergy={onNavigateToEnergy}
                />
              ))}
            </Box>
          </Box>
        ) : null}
      </Box>
    </>
  )
}

export default DashboardOverview

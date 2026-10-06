import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Grid, Typography, CircularProgress, Divider } from '@mui/material'
import LinkIcon from '@mui/icons-material/Link'
import dashboardOverviewBg from '../../assets/images/dashboard-overview-bg.png'
import OverviewMetricTile from '../../../../shared/dashboard/widgets/overview/OverviewMetricTile'
import AlertsWidget from '../../../../shared/dashboard/widgets/alerts'
import {
  OVERVIEW_TILE_TYPES,
  OVERVIEW_THEME_VARIANTS,
} from '../../../../shared/dashboard/widgets/overview'
import {
  getShadesWidgetDescription,
  getShadesWidgetImage,
  getShadesWidgetName,
  getShadesWidgetHyperlink,
  openShadesWidgetHyperlink,
  SHADES_SETTINGS_EVENT,
} from '../../../basic/utils/shadesWidgetSettings'
import { isCustomizedOverviewWidgetVisible } from '../../utils/customizedOverviewWidgetVisibility'

const cardStyle = {
  backgroundColor: '#ffffff',
  borderRadius: 2,
  p: 2,
  height: '100%',
  minHeight: 360,
  cursor: 'pointer',
  transition: 'box-shadow 0.2s ease',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  '&:hover': { boxShadow: 3 },
}

function ExternalLinkOverviewTile({ title, imageUrl, description, onClick }) {
  return (
    <Box sx={cardStyle} onClick={onClick} role="link" aria-label={`Open ${title}`}>
      <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 1 }}>
        {title}
      </Typography>
      <Divider sx={{ mb: 1.5, borderColor: '#e5e7eb' }} />
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 180,
        }}
      >
        {imageUrl ? (
          <Box
            component="img"
            src={imageUrl}
            alt=""
            sx={{ maxWidth: '85%', maxHeight: '85%', objectFit: 'contain' }}
          />
        ) : (
          <LinkIcon sx={{ fontSize: 56, color: '#1565c0' }} />
        )}
      </Box>
      {description ? (
        <Typography variant="body2" sx={{ color: '#64748b', mt: 1 }}>
          {description}
        </Typography>
      ) : null}
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
  const [visibilityTick, setVisibilityTick] = useState(0)
  const readShadesTileSettings = useCallback(
    () => ({
      name: getShadesWidgetName(),
      imageUrl: getShadesWidgetImage(),
      description: getShadesWidgetDescription(),
    }),
    []
  )
  const [shadesTileSettings, setShadesTileSettings] = useState(() => readShadesTileSettings())

  useEffect(() => {
    const refreshVisibility = () => setVisibilityTick((t) => t + 1)
    const refreshShades = () => setShadesTileSettings(readShadesTileSettings())
    window.addEventListener('widgetVisibilityUpdated', refreshVisibility)
    window.addEventListener(SHADES_SETTINGS_EVENT, refreshShades)
    return () => {
      window.removeEventListener('widgetVisibilityUpdated', refreshVisibility)
      window.removeEventListener(SHADES_SETTINGS_EVENT, refreshShades)
    }
  }, [readShadesTileSettings])

  const isOverviewTileVisible = useCallback(
    (key) => {
      void visibilityTick
      return isCustomizedOverviewWidgetVisible(key)
    },
    [visibilityTick]
  )

  const showEnergyTile = isOverviewTileVisible('energy')
  const showAlertsTile = isOverviewTileVisible('alerts')
  const showSchedulesTile = isOverviewTileVisible('schedules')
  const showQuickControlsTile = isOverviewTileVisible('quick_controls')
  const showShadesTile = isOverviewTileVisible('shades')
  // const showFloorsTile = isOverviewTileVisible('floors')
  const showFloorsTile = false
  const showSpaceUtilizationTile = isOverviewTileVisible('space_utilization')

  const openExternalLink = () => {
    const url = getShadesWidgetHyperlink('https://')
    openShadesWidgetHyperlink(url, { navigate, onNavigateToEnergy })
  }

  const energy = data?.energy
  const alerts = data?.alerts
  const schedule = data?.schedule?.next
  // const floorsCount = data?.floors?.count
  const spaceUtil = data?.space_utilization

  const visibleTileCount = useMemo(
    () =>
      [
        showEnergyTile,
        showAlertsTile,
        showSchedulesTile,
        showQuickControlsTile,
        showShadesTile,
        showFloorsTile,
        showSpaceUtilizationTile,
      ].filter(Boolean).length,
    [
      showEnergyTile,
      showAlertsTile,
      showSchedulesTile,
      showQuickControlsTile,
      showShadesTile,
      showFloorsTile,
      showSpaceUtilizationTile,
    ]
  )

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">Failed to load dashboard overview.</Typography>
      </Box>
    )
  }

  if (visibleTileCount === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography sx={{ color: 'rgba(255,255,255,0.85)' }}>
          No overview widgets are visible. Enable tiles under Settings → Widgets → Dashboard Overview.
        </Typography>
      </Box>
    )
  }

  return (
    <Box
      className="dashboard-overview-variant-root"
      sx={{
        width: '100%',
        minHeight: 460,
        position: 'relative',
        backgroundImage: `url(${dashboardOverviewBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <Grid container spacing={2} className="dashboard-overview-variant-grid" sx={{ p: 1.5 }}>
        {showEnergyTile && (
          <Grid item xs={12} sm={6} md={4}>
            <OverviewMetricTile
              tileType={OVERVIEW_TILE_TYPES.ENERGY}
              energy={energy}
              onClick={onNavigateToEnergy}
              themeVariant={OVERVIEW_THEME_VARIANTS.GRID}
              cardSx={cardStyle}
            />
          </Grid>
        )}

        {showAlertsTile && (
          <Grid item xs={12} sm={6} md={4}>
            <AlertsWidget
              alerts={alerts}
              onClick={onNavigateToAlerts}
              shellVariant="customized"
              cardSx={cardStyle}
            />
          </Grid>
        )}

        {showSchedulesTile && (
          <Grid item xs={12} sm={6} md={4}>
            <OverviewMetricTile
              tileType={OVERVIEW_TILE_TYPES.SCHEDULES}
              schedule={schedule}
              onClick={onNavigateToSchedule}
              themeVariant={OVERVIEW_THEME_VARIANTS.GRID}
              cardSx={cardStyle}
            />
          </Grid>
        )}

        {showQuickControlsTile && (
          <Grid item xs={12} sm={6} md={4}>
            <OverviewMetricTile
              tileType={OVERVIEW_TILE_TYPES.QUICK_CONTROLS}
              onClick={onNavigateToQuickControls}
              themeVariant={OVERVIEW_THEME_VARIANTS.GRID}
              cardSx={cardStyle}
            />
          </Grid>
        )}

        {showShadesTile && (
          <Grid item xs={12} sm={6} md={4}>
            <ExternalLinkOverviewTile
              title={shadesTileSettings.name}
              imageUrl={shadesTileSettings.imageUrl}
              description={shadesTileSettings.description}
              onClick={openExternalLink}
            />
          </Grid>
        )}

        {/* Floors widget disabled
        {showFloorsTile && (
          <Grid item xs={12} sm={6} md={4}>
            <OverviewMetricTile
              tileType={OVERVIEW_TILE_TYPES.FLOORS}
              floorsCount={floorsCount}
              onClick={onNavigateToFloor}
              themeVariant={OVERVIEW_THEME_VARIANTS.GRID}
              cardSx={cardStyle}
            />
          </Grid>
        )}
        */}

        {showSpaceUtilizationTile && (
          <Grid item xs={12} sm={6} md={4}>
            <OverviewMetricTile
              tileType={OVERVIEW_TILE_TYPES.SPACE_UTILIZATION}
              spaceUtil={spaceUtil}
              onClick={onNavigateToSpaceUtilization}
              themeVariant={OVERVIEW_THEME_VARIANTS.GRID}
              cardSx={cardStyle}
            />
          </Grid>
        )}
      </Grid>
    </Box>
  )
}

export default DashboardOverview

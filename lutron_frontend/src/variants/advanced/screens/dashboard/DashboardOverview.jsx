import React, { useMemo } from 'react'
import { Box, Grid, Typography, CircularProgress } from '@mui/material'
import OverviewMetricTile from '../../../../shared/dashboard/widgets/overview/OverviewMetricTile'
import AlertsWidget from '../../../../shared/dashboard/widgets/alerts'
import {
  OVERVIEW_TILE_TYPES,
  OVERVIEW_THEME_VARIANTS,
} from '../../../../shared/dashboard/widgets/overview'
import { useDashboardWidgetVisibility } from '../../utils/dashboardWidgetVisibility'
import { resolveAdvancedOverviewCardSx } from '../../utils/advancedOverviewTheme'

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
  const cardStyle = useMemo(() => resolveAdvancedOverviewCardSx(), [])
  const energy = data?.energy
  const alerts = data?.alerts
  const schedule = data?.schedule?.next
  // const floorsCount = data?.floors?.count
  const spaceUtil = data?.space_utilization
  const { isWidgetVisible } = useDashboardWidgetVisibility()

  if (loading && !data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
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
    <Box
      className="dashboard-overview-variant-root"
      sx={{
        width: '100%',
        minHeight: 460,
        position: 'relative',
        backgroundColor: 'transparent',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <Grid container spacing={2} className="dashboard-overview-variant-grid" sx={{ p: 1.5 }}>
        {isWidgetVisible('energy') && (
        <Grid item xs={12} sm={6} md={4}>
          <OverviewMetricTile
            tileType={OVERVIEW_TILE_TYPES.ENERGY}
            energy={energy}
            onClick={onNavigateToEnergy}
            themeVariant={OVERVIEW_THEME_VARIANTS.ADVANCED}
            cardSx={cardStyle}
          />
        </Grid>
        )}

        {isWidgetVisible('alerts') && (
        <Grid item xs={12} sm={6} md={4}>
          <AlertsWidget
            alerts={alerts}
            onClick={onNavigateToAlerts}
            shellVariant="advanced"
            cardSx={cardStyle}
          />
        </Grid>
        )}

        {isWidgetVisible('schedules') && (
        <Grid item xs={12} sm={6} md={4}>
          <OverviewMetricTile
            tileType={OVERVIEW_TILE_TYPES.SCHEDULES}
            schedule={schedule}
            onClick={onNavigateToSchedule}
            themeVariant={OVERVIEW_THEME_VARIANTS.ADVANCED}
            cardSx={cardStyle}
          />
        </Grid>
        )}

        {isWidgetVisible('quick_controls') && (
        <Grid item xs={12} sm={6} md={4}>
          <OverviewMetricTile
            tileType={OVERVIEW_TILE_TYPES.QUICK_CONTROLS}
            onClick={onNavigateToQuickControls}
            themeVariant={OVERVIEW_THEME_VARIANTS.ADVANCED}
            cardSx={cardStyle}
          />
        </Grid>
        )}

        {/* Floors widget disabled
        {isWidgetVisible('floors') && (
        <Grid item xs={12} sm={6} md={4}>
          <OverviewMetricTile
            tileType={OVERVIEW_TILE_TYPES.FLOORS}
            floorsCount={floorsCount}
            onClick={onNavigateToFloor}
            themeVariant={OVERVIEW_THEME_VARIANTS.ADVANCED}
            cardSx={cardStyle}
          />
        </Grid>
        )}
        */}

        {isWidgetVisible('space_utilization') && (
        <Grid item xs={12} sm={6} md={4}>
          <OverviewMetricTile
            tileType={OVERVIEW_TILE_TYPES.SPACE_UTILIZATION}
            spaceUtil={spaceUtil}
            onClick={onNavigateToSpaceUtilization}
            themeVariant={OVERVIEW_THEME_VARIANTS.ADVANCED}
            cardSx={cardStyle}
          />
        </Grid>
        )}
      </Grid>
    </Box>
  )
}

export default DashboardOverview

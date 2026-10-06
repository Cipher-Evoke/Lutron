import React from 'react'
import { Box, Grid, Typography, CircularProgress, Divider } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import dashboardOverviewBg from '../../assets/images/dashboard-overview-bg.png'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import TouchAppIcon from '@mui/icons-material/TouchApp'
import LayersIcon from '@mui/icons-material/Layers'
import PeopleIcon from '@mui/icons-material/People'

const titleStyle = {
  color: '#1565c0',
  fontWeight: 'bold',
  fontSize: '1.7rem',
}

const bodyTextDark = { color: '#374151' }
const bodyTextMuted = { color: '#6b7280' }

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

const formatAlertTime = (timeStr) => {
  if (!timeStr) return ''
  const parts = timeStr.split(/[\s-./]+/)
  if (parts.length >= 5) {
    const [d, m, y, h, min] = parts
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const mi = parseInt(m, 10) - 1
    return `${months[mi] || m} ${d}, ${y} ${h}:${min}`
  }
  return timeStr
}

const CircularProgressLabel = ({ value, color = '#4caf50', size = 100 }) => {
  const clamped = Math.min(100, Math.max(0, Number(value) || 0))
  const strokeWidth = 6
  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference - (clamped / 100) * circumference
  return (
    <Box sx={{ position: 'relative', width: size, height: size, mx: 'auto' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#e0e0e0"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.3s ease' }}
        />
      </svg>
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="h6" fontWeight="bold" sx={{ color, fontSize: size >= 110 ? '1.7rem' : undefined }}>
          {clamped.toFixed(0)}%
        </Typography>
      </Box>
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
  const energy = data?.energy
  const alerts = data?.alerts
  const schedule = data?.schedule?.next
  const floorsCount = data?.floors?.count
  const spaceUtil = data?.space_utilization
  const top3Alerts = (alerts?.top_5 || []).slice(0, 3)
  const moreAlertsCount = (alerts?.total || 0) - top3Alerts.length

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

  return (
    <Box
      sx={{
        width: '100%',
        // Reduced minHeight so Overview fits better in a single viewport
        minHeight: 460,
        position: 'relative',
        backgroundImage: `url(${dashboardOverviewBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <Grid container spacing={2} sx={{ p: 1.5 }}>
        {/* Energy */}
        <Grid item xs={12} sm={6} md={4}>
          <Box sx={cardStyle} onClick={onNavigateToEnergy}>
            <Typography variant="subtitle1" sx={titleStyle}>Energy</Typography>
            <Divider sx={{ mb: 1, borderColor: '#e5e7eb' }} />
            {energy ? (
              <>
                <Typography
                  variant="body1"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.5,
                    mb: 1.25,
                    ...bodyTextDark,
                    fontSize: '1.35rem',
                  }}
                >
                  Current Energy Savings
                  <CheckCircleIcon sx={{ color: '#22c55e', fontSize: 26 }} />
                </Typography>
                <CircularProgressLabel value={energy.savings_percent} color="#4caf50" size={136} />
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    width: '100%',
                    mt: 1.5,
                    px: 1,
                  }}
                >
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography
                      variant="body2"
                      sx={{ ...bodyTextDark, fontSize: '1.2rem' }}
                    >
                      Savings
                    </Typography>
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      sx={{ color: '#15803d', fontSize: '1.8rem' }}
                    >
                      {Number(energy.savings_kw).toFixed(2)} kW
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography
                      variant="body2"
                      sx={{ ...bodyTextDark, fontSize: '1.2rem' }}
                    >
                      Using
                    </Typography>
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      sx={{ ...bodyTextDark, fontSize: '1.8rem' }}
                    >
                      {Number(energy.consumption_kw).toFixed(2)} kW
                    </Typography>
                  </Box>
                </Box>
              </>
            ) : (
              <Typography variant="body2" sx={bodyTextDark}>No data</Typography>
            )}
          </Box>
        </Grid>

        {/* Alerts */}
        <Grid item xs={12} sm={6} md={4}>
          <Box sx={cardStyle} onClick={onNavigateToAlerts}>
            <Typography
              variant="subtitle1"
              sx={{ ...titleStyle, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 1 }}
            >
              Alerts
              {alerts?.total > 0 && (
                <Box
                  sx={{
                    bgcolor: 'error.main',
                    color: 'white',
                    borderRadius: '50%',
                    minWidth: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    fontWeight: 'bold',
                  }}
                >
                  {alerts.total}
                </Box>
              )}
            </Typography>
            <Divider sx={{ mb: 1, borderColor: '#e5e7eb' }} />
            {top3Alerts.length > 0 ? (
              <>
                {top3Alerts.map((a, i) => (
                  <Box key={i} sx={{ mb: 1 }}>
                    <Typography
                      variant="body1"
                      fontWeight="medium"
                      sx={{ ...bodyTextDark, fontSize: '1.3rem' }}
                    >
                      {a.alert_type}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontSize: '1.15rem', ...bodyTextMuted }}
                    >
                      {a.location} - {formatAlertTime(a.time)}
                    </Typography>
                  </Box>
                ))}
                {moreAlertsCount > 0 && (
                  <Typography
                    variant="body1"
                    sx={{ color: '#dc2626', mt: 1, cursor: 'pointer', fontWeight: 500, fontSize: '1.3rem' }}
                  >
                    {moreAlertsCount} more alerts
                  </Typography>
                )}
              </>
            ) : (
              <Typography variant="body1" sx={{ ...bodyTextDark, fontSize: '1.3rem' }}>No alerts</Typography>
            )}
          </Box>
        </Grid>

        {/* Schedule */}
        <Grid item xs={12} sm={6} md={4}>
          <Box sx={cardStyle} onClick={onNavigateToSchedule}>
            <Typography variant="subtitle1" sx={titleStyle}>Schedules</Typography>
            <Divider sx={{ mb: 1, borderColor: '#e5e7eb' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1.5 }}>
              <CalendarTodayIcon sx={{ color: 'primary.main', fontSize: 88 }} />
            </Box>
            {schedule ? (
              <>
                <Typography
                  variant="body2"
                  sx={{ ...bodyTextMuted, fontSize: '1.45rem', mt: 0.75 }}
                >
                  Next event
                </Typography>
                <Typography
                  variant="body1"
                  fontWeight="medium"
                  sx={{ color: '#1976d2', fontSize: '1.8rem', mt: 0.35 }}
                >
                  {schedule.name} {schedule.time}, {schedule.date}
                </Typography>
              </>
            ) : (
              <Typography variant="body1" sx={{ ...bodyTextDark, fontSize: '1.55rem', mt: 0.75 }}>
                No upcoming event
              </Typography>
            )}
          </Box>
        </Grid>

        {/* Quick Controls */}
        <Grid item xs={12} sm={6} md={4}>
          <Box sx={cardStyle} onClick={onNavigateToQuickControls}>
            <Typography variant="subtitle1" sx={titleStyle}>Quick Controls</Typography>
            <Divider sx={{ mb: 1, borderColor: '#e5e7eb' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1.5 }}>
              <TouchAppIcon sx={{ color: 'warning.main', fontSize: 88 }} />
            </Box>
            <Typography variant="body1" sx={{ flex: 1, ...bodyTextDark, fontSize: '1.55rem' }}>
              Use quick controls to execute several actions at once.
            </Typography>
          </Box>
        </Grid>

        {/* Floors */}
        <Grid item xs={12} sm={6} md={4}>
          <Box sx={cardStyle} onClick={onNavigateToFloor}>
            <Typography variant="subtitle1" sx={titleStyle}>Floors</Typography>
            <Divider sx={{ mb: 1, borderColor: '#e5e7eb' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1.5 }}>
              <LayersIcon sx={{ color: 'secondary.main', fontSize: 88 }} />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
              <Typography
                variant="h4"
                fontWeight="bold"
                sx={{ color: '#1976d2', fontSize: '4.25rem', textAlign: 'center' }}
              >
                {floorsCount != null ? floorsCount : '—'}
              </Typography>
            </Box>
          </Box>
        </Grid>

        {/* Space Utilization */}
        <Grid item xs={12} sm={6} md={4}>
          <Box sx={cardStyle} onClick={onNavigateToSpaceUtilization}>
            <Typography variant="subtitle1" sx={titleStyle}>Space Utilization</Typography>
            <Divider sx={{ mb: 1, borderColor: '#e5e7eb' }} />
            {spaceUtil ? (
              <>
                <CircularProgressLabel value={spaceUtil.occupied_percent} color="#2196f3" size={146} />
                <Typography
                  variant="body1"
                  sx={{ mt: 1.2, flex: 1, ...bodyTextDark, fontSize: '1.55rem' }}
                >
                  Percentage of areas with sensors that are currently occupied.
                </Typography>
              </>
            ) : (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <PeopleIcon sx={{ color: '#9ca3af', fontSize: 88 }} />
                </Box>
                <Typography variant="body1" sx={{ ...bodyTextDark, fontSize: '1.55rem' }}>
                  No data
                </Typography>
              </>
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
}

export default DashboardOverview

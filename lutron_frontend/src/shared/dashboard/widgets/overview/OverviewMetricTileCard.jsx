import React from 'react';
import { Box, Typography, Divider } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import LayersIcon from '@mui/icons-material/Layers';
import PeopleIcon from '@mui/icons-material/People';
import { OVERVIEW_TILE_TYPES, OVERVIEW_TILE_TITLES } from './overviewTileTypes';

function CircularProgressLabelResponsive({ value, color = '#4caf50' }) {
  const clamped = Math.min(100, Math.max(0, Number(value) || 0));
  const r = 40;
  const strokeW = 13.6;
  const c = 2 * Math.PI * r;
  const offset = c - (clamped / 100) * c;
  return (
    <Box
      sx={{
        position: 'relative',
        flexShrink: 1,
        maxWidth: '100%',
        maxHeight: '100%',
        width: 'min(100%, min(9rem, 52cqi, 42cqh))',
        aspectRatio: 1,
        mx: 'auto',
        my: 0,
      }}
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ display: 'block', transform: 'rotate(-90deg)' }}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="#e0e0e0" strokeWidth={strokeW} />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeW}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.3s ease' }}
        />
      </svg>
      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography
          variant="h6"
          fontWeight="bold"
          component="div"
          sx={{ color, fontSize: 'clamp(0.72rem, 0.42rem + 2.5cqi, 1.05rem)', lineHeight: 1.1 }}
        >
          {clamped.toFixed(0)}%
        </Typography>
      </Box>
    </Box>
  );
}

function CircularProgressLabelFixed({ value, color = '#4caf50', size = 100 }) {
  const clamped = Math.min(100, Math.max(0, Number(value) || 0));
  const strokeWidth = 6;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (clamped / 100) * circumference;
  return (
    <Box sx={{ position: 'relative', width: size, height: size, mx: 'auto' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e0e0e0" strokeWidth={strokeWidth} />
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
        <Typography
          variant="h6"
          fontWeight="bold"
          sx={{ color, fontSize: size >= 110 ? '1.7rem' : undefined }}
        >
          {clamped.toFixed(0)}%
        </Typography>
      </Box>
    </Box>
  );
}

function TileHeader({ title, theme }) {
  return (
    <Box sx={theme.cardHeaderSx || undefined}>
      <Typography variant="subtitle1" sx={theme.titleStyle} noWrap>
        {title}
      </Typography>
      <Divider sx={theme.dividerSx} />
    </Box>
  );
}

function EnergyTileBody({ model, theme }) {
  if (model.status === 'empty') {
    return (
      <Typography component="div" variant="body2" sx={theme.emptyTextSx}>
        {model.emptyMessage}
      </Typography>
    );
  }

  const Ring =
    theme.ringMode === 'responsive' ? CircularProgressLabelResponsive : CircularProgressLabelFixed;

  return (
    <Box
      component="div"
      sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, minWidth: 0, width: '100%' }}
    >
      <Typography component="div" variant="body1" sx={theme.energyHeaderLabelSx}>
        Current Energy Savings
        <CheckCircleIcon sx={theme.energyCheckIconSx} />
      </Typography>
      <Box sx={theme.cardBodyMainSx}>
        <Ring
          value={model.savingsPercent}
          color={theme.ringColorEnergy}
          size={theme.ringSizeEnergy}
        />
      </Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          width: '100%',
          flexShrink: 0,
          mt: theme.ringMode === 'responsive' ? 0.2 : 1.5,
          px: theme.ringMode === 'responsive' ? 0.5 : 1,
          pt: theme.ringMode === 'responsive' ? 0.1 : 0,
          gap: 0.5,
        }}
      >
        <Box sx={{ textAlign: 'left', minWidth: 0 }}>
          <Typography component="div" variant="body2" sx={{ ...theme.bodyTextDark, ...theme.labelMeta }}>
            Savings
          </Typography>
          <Typography
            variant="body1"
            fontWeight="bold"
            component="div"
            sx={{
              color: theme.savingsValueColor,
              ...theme.labelSmall,
              lineHeight: 1.15,
              wordBreak: 'break-word',
            }}
          >
            {model.savingsKw} kW
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right', minWidth: 0 }}>
          <Typography component="div" variant="body2" sx={{ ...theme.bodyTextDark, ...theme.labelMeta }}>
            Using
          </Typography>
          <Typography
            variant="body1"
            fontWeight="bold"
            component="div"
            sx={{
              color: theme.bodyTextDark.color,
              ...theme.labelSmall,
              lineHeight: 1.15,
              wordBreak: 'break-word',
            }}
          >
            {model.consumptionKw} kW
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

function SchedulesTileBody({ model, theme }) {
  if (theme.ringMode === 'responsive') {
    return (
      <>
        <Box sx={theme.cardBodyMainSx}>
          <CalendarTodayIcon sx={theme.iconInTileLarge('primary.main')} />
        </Box>
        <Box sx={theme.footerBoxSx}>
          {model.status === 'ready' ? (
            <>
              <Typography component="div" variant="body2" sx={theme.scheduleNextLabelSx}>
                {theme.scheduleNextLabel}
              </Typography>
              <Typography
                component="div"
                variant="body1"
                fontWeight="medium"
                sx={theme.scheduleEventSx}
                noWrap
                title={model.eventText}
              >
                {model.eventText}
              </Typography>
            </>
          ) : (
            <Typography component="div" variant="body1" sx={theme.emptyTextSx}>
              {model.emptyMessage}
            </Typography>
          )}
        </Box>
      </>
    );
  }

  return (
    <>
      <Box sx={theme.cardBodyMainSx}>
        <CalendarTodayIcon sx={theme.iconInTileLarge('primary.main')} />
      </Box>
      {model.status === 'ready' ? (
        <>
          <Typography component="div" variant="body2" sx={theme.scheduleNextLabelSx}>
            {theme.scheduleNextLabel}
          </Typography>
          <Typography component="div" variant="body1" fontWeight="medium" sx={theme.scheduleEventSx}>
            {model.eventText}
          </Typography>
        </>
      ) : (
        <Typography component="div" variant="body1" sx={theme.emptyTextSx}>
          {model.emptyMessage}
        </Typography>
      )}
    </>
  );
}

function QuickControlsTileBody({ model, theme }) {
  if (theme.ringMode === 'responsive') {
    return (
      <>
        <Box sx={theme.cardBodyMainSx}>
          <TouchAppIcon sx={theme.iconInTileLarge('warning.main')} />
        </Box>
        <Box sx={theme.footerBoxSx}>
          <Typography component="div" variant="body2" sx={theme.quickControlsCaptionSx}>
            {model.description}
          </Typography>
        </Box>
      </>
    );
  }

  return (
    <>
      <Box sx={theme.cardBodyMainSx}>
        <TouchAppIcon sx={theme.iconInTileLarge('warning.main')} />
      </Box>
      <Typography component="div" variant="body1" sx={theme.quickControlsCaptionSx}>
        {model.description}
      </Typography>
    </>
  );
}

function FloorsTileBody({ model, theme }) {
  if (theme.ringMode === 'responsive') {
    return (
      <>
        <Box sx={theme.cardBodyMainSx}>
          <LayersIcon sx={theme.floorsIconSx} />
        </Box>
        <Box sx={theme.floorsFooterSx}>
          <Typography variant="h4" fontWeight="bold" component="div" sx={theme.floorsCountSx}>
            {model.count}
          </Typography>
        </Box>
      </>
    );
  }

  return (
    <>
      <Box sx={theme.cardBodyMainSx}>
        <LayersIcon sx={theme.floorsIconSx} />
      </Box>
      <Box sx={theme.floorsFooterSx}>
        <Typography variant="h4" fontWeight="bold" sx={theme.floorsCountSx}>
          {model.count}
        </Typography>
      </Box>
    </>
  );
}

function SpaceUtilizationTileBody({ model, theme }) {
  const Ring =
    theme.ringMode === 'responsive' ? CircularProgressLabelResponsive : CircularProgressLabelFixed;

  if (model.status === 'empty') {
    if (theme.ringMode === 'responsive') {
      return (
        <>
          <Box sx={theme.cardBodyMainSx}>
            <PeopleIcon sx={theme.iconInTile('#9ca3af')} />
          </Box>
          <Typography component="div" variant="body2" sx={theme.emptyTextSx}>
            {model.emptyMessage}
          </Typography>
        </>
      );
    }
    return (
      <>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <PeopleIcon sx={theme.iconInTile('#9ca3af')} />
        </Box>
        <Typography component="div" variant="body1" sx={theme.emptyTextSx}>
          {model.emptyMessage}
        </Typography>
      </>
    );
  }

  if (theme.ringMode === 'responsive') {
    return (
      <Box
        component="div"
        sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, minWidth: 0, width: '100%' }}
      >
        <Box sx={theme.cardBodyMainSx}>
          <Ring
            value={model.occupiedPercent}
            color={theme.ringColorSpace}
            size={theme.ringSizeSpace}
          />
        </Box>
        <Typography component="div" variant="body2" sx={theme.spaceUtilCaptionSx}>
          Percentage of areas with sensors that are currently occupied.
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Ring value={model.occupiedPercent} color={theme.ringColorSpace} size={theme.ringSizeSpace} />
      <Typography component="div" variant="body1" sx={theme.spaceUtilCaptionSx}>
        Percentage of areas with sensors that are currently occupied.
      </Typography>
    </>
  );
}

export function OverviewMetricTileCard({ tileType, title, model, theme }) {
  const resolvedTitle = title || OVERVIEW_TILE_TITLES[tileType] || '';

  return (
    <>
      <TileHeader title={resolvedTitle} theme={theme} />
      {tileType === OVERVIEW_TILE_TYPES.ENERGY && <EnergyTileBody model={model} theme={theme} />}
      {tileType === OVERVIEW_TILE_TYPES.SCHEDULES && <SchedulesTileBody model={model} theme={theme} />}
      {tileType === OVERVIEW_TILE_TYPES.QUICK_CONTROLS && (
        <QuickControlsTileBody model={model} theme={theme} />
      )}
      {tileType === OVERVIEW_TILE_TYPES.FLOORS && <FloorsTileBody model={model} theme={theme} />}
      {tileType === OVERVIEW_TILE_TYPES.SPACE_UTILIZATION && (
        <SpaceUtilizationTileBody model={model} theme={theme} />
      )}
    </>
  );
}

export default OverviewMetricTileCard;

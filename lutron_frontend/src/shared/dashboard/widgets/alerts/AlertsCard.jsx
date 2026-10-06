import React from 'react';
import { Box, Typography, Divider, CircularProgress } from '@mui/material';
import { formatAlertRowSubtitle } from './alertsResolvers';

function AlertsHeader({ title, total, theme }) {
  const titleRow = (
    <Typography
      variant="subtitle1"
      sx={{
        ...theme.titleStyle,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: theme.titleGap,
      }}
    >
      {title}
      {total > 0 && (
        <Box component="span" sx={theme.badgeSx}>
          {total}
        </Box>
      )}
    </Typography>
  );

  if (theme.headerLayout === 'cardHeader') {
    return (
      <Box sx={{ flexShrink: 0, width: '100%', minWidth: 0, minHeight: 0 }}>
        {titleRow}
        <Divider sx={theme.dividerSx} />
      </Box>
    );
  }

  return (
    <>
      {titleRow}
      <Divider sx={theme.dividerSx} />
    </>
  );
}

function AlertRow({ alert, index, theme }) {
  const subtitle = formatAlertRowSubtitle(alert);
  return (
    <Box
      key={index}
      component="div"
      sx={{
        mb: theme.alertRowMarginBottom,
        minWidth: 0,
        overflow: theme.truncateRows ? 'hidden' : undefined,
        flexShrink: theme.truncateRows ? 0 : undefined,
      }}
    >
      <Typography
        component="div"
        variant={theme.alertTypeVariant}
        fontWeight="medium"
        noWrap={theme.truncateRows}
        title={theme.truncateRows ? alert?.alert_type : undefined}
        sx={{ ...theme.bodyTextDark, ...theme.labelSmall, ...theme.alertTypeSx }}
      >
        {alert?.alert_type}
      </Typography>
      <Typography
        component="div"
        variant={theme.alertMetaVariant}
        noWrap={theme.truncateRows}
        title={theme.truncateRows ? subtitle : undefined}
        sx={{
          ...(theme.truncateRows
            ? { color: theme.bodyTextMuted.color }
            : theme.bodyTextMuted),
          ...theme.labelMeta,
          ...theme.alertMetaSx,
        }}
      >
        {subtitle}
      </Typography>
    </Box>
  );
}

function AlertsList({ model, theme }) {
  const list = (
    <>
      {model.topAlerts.map((alert, index) => (
        <AlertRow key={index} alert={alert} index={index} theme={theme} />
      ))}
    </>
  );

  if (theme.listScrollable) {
    return (
      <Box
        component="div"
        sx={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Box
          component="div"
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {list}
        </Box>
        {model.moreCount > 0 && (
          <Typography component="div" variant={theme.moreAlertsVariant} sx={theme.moreAlertsSx}>
            {model.moreCount} more alerts
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <>
      {list}
      {model.moreCount > 0 && (
        <Typography variant={theme.moreAlertsVariant} sx={theme.moreAlertsSx}>
          {model.moreCount} more alerts
        </Typography>
      )}
    </>
  );
}

export function AlertsCard({
  status = 'ready',
  model,
  theme,
  title = 'Alerts',
}) {
  if (status === 'loading') {
    return (
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <CircularProgress size={theme.preset === 'basic' ? 28 : 32} />
      </Box>
    );
  }

  const content = (
    <>
      <AlertsHeader title={title} total={model?.total || 0} theme={theme} />
      {model?.isEmpty ? (
        <Typography
          component="div"
          variant={theme.emptyTextVariant}
          sx={{ ...theme.bodyTextDark, ...theme.emptyTextSx }}
        >
          No alerts
        </Typography>
      ) : (
        <AlertsList model={model} theme={theme} />
      )}
    </>
  );

  if (theme.preset === 'basic') {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
          width: '100%',
        }}
      >
        {content}
      </Box>
    );
  }

  return content;
}

export default AlertsCard;

import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import { AlertsCard } from './AlertsCard';
import { resolveAlertsTheme, ALERTS_THEME_PRESETS } from './alertsTheme';
import {
  resolveAlertsWidgetStatus,
  resolveAlertsDisplayModel,
} from './alertsResolvers';
import { alertsWidgetPropsAreEqual } from './alertsMemoCompare';

function AlertsWidgetInner({
  alerts,
  loading = false,
  onClick,
  cardSx = {},
  shellVariant = ALERTS_THEME_PRESETS.grid,
  title = 'Alerts',
}) {
  const theme = useMemo(
    () => resolveAlertsTheme({ preset: shellVariant }),
    [shellVariant]
  );

  const status = useMemo(
    () => resolveAlertsWidgetStatus({ loading }),
    [loading]
  );

  const model = useMemo(
    () =>
      resolveAlertsDisplayModel(alerts, {
        maxPreviewCount: theme.maxPreviewCount,
      }),
    [alerts, theme.maxPreviewCount]
  );

  return (
    <Box sx={cardSx} onClick={onClick}>
      <AlertsCard status={status} model={model} theme={theme} title={title} />
    </Box>
  );
}

export const AlertsWidget = React.memo(AlertsWidgetInner, alertsWidgetPropsAreEqual);

export default AlertsWidget;

/**
 * @jest-environment node
 */
import {
  formatAlertTime,
  resolveAlertsWidgetStatus,
  resolveAlertsDisplayModel,
  formatAlertRowSubtitle,
} from './alertsResolvers';
import {
  resolveAlertsTheme,
  ALERTS_THEME_PRESETS,
} from './alertsTheme';
import {
  alertsWidgetPropsAreEqual,
  legacyAlertsWidgetStatus,
  sharedAlertsWidgetStatus,
} from './alertsMemoCompare';

const alertsPayload = {
  total: 8,
  top_5: [
    { alert_type: 'Device Offline', location: 'Floor 1', time: '10-03-2024-14-30' },
    { alert_type: 'High Load', location: 'Floor 2', time: '10-03-2024-15-45' },
    { alert_type: 'Sensor Fault', location: 'Floor 3', time: '11-03-2024-09-15' },
    { alert_type: 'Gateway Error', location: 'Floor 4', time: '11-03-2024-10-00' },
    { alert_type: 'Schedule Miss', location: 'Floor 5', time: '11-03-2024-11-20' },
  ],
};

describe('AlertsWidget status parity', () => {
  it('loading status when loading flag set', () => {
    expect(resolveAlertsWidgetStatus({ loading: true })).toBe('loading');
    expect(sharedAlertsWidgetStatus({ loading: true })).toBe('loading');
    expect(legacyAlertsWidgetStatus({ loading: true })).toBe('loading');
  });

  it('ready status when not loading', () => {
    expect(resolveAlertsWidgetStatus({ loading: false })).toBe('ready');
    expect(sharedAlertsWidgetStatus({ loading: false })).toBe('ready');
  });
});

describe('AlertsWidget display model parity', () => {
  it('grid/advanced/customized preview shows top 3 alerts', () => {
    const gridModel = resolveAlertsDisplayModel(alertsPayload, { maxPreviewCount: 3 });
    expect(gridModel.topAlerts).toHaveLength(3);
    expect(gridModel.total).toBe(8);
    expect(gridModel.moreCount).toBe(5);
    expect(gridModel.isEmpty).toBe(false);

    const advancedTheme = resolveAlertsTheme({ preset: ALERTS_THEME_PRESETS.advanced });
    const customizedTheme = resolveAlertsTheme({ preset: ALERTS_THEME_PRESETS.customized });
    expect(advancedTheme.maxPreviewCount).toBe(3);
    expect(customizedTheme.maxPreviewCount).toBe(3);
  });

  it('basic preview shows top 5 alerts', () => {
    const basicTheme = resolveAlertsTheme({ preset: ALERTS_THEME_PRESETS.basic });
    const model = resolveAlertsDisplayModel(alertsPayload, {
      maxPreviewCount: basicTheme.maxPreviewCount,
    });
    expect(model.topAlerts).toHaveLength(5);
    expect(model.moreCount).toBe(3);
  });

  it('empty state when no preview alerts', () => {
    const model = resolveAlertsDisplayModel({ total: 0, top_5: [] });
    expect(model.isEmpty).toBe(true);
    expect(model.moreCount).toBe(0);
  });
});

describe('AlertsWidget formatting parity', () => {
  it('formatAlertTime matches legacy month formatting', () => {
    expect(formatAlertTime('10-03-2024-14-30')).toBe('Mar 10, 2024 14:30');
    expect(formatAlertTime('')).toBe('');
  });

  it('formatAlertRowSubtitle joins location and formatted time', () => {
    const subtitle = formatAlertRowSubtitle(alertsPayload.top_5[0]);
    expect(subtitle).toContain('Floor 1');
    expect(subtitle).toContain('Mar 10, 2024 14:30');
  });
});

describe('AlertsWidget theme parity', () => {
  it('basic theme uses compact badge and scrollable list', () => {
    const theme = resolveAlertsTheme({ preset: ALERTS_THEME_PRESETS.basic });
    expect(theme.maxPreviewCount).toBe(5);
    expect(theme.listScrollable).toBe(true);
    expect(theme.headerLayout).toBe('cardHeader');
  });

  it('advanced theme uses chart-header contrast on dark cards', () => {
    const theme = resolveAlertsTheme({ preset: ALERTS_THEME_PRESETS.advanced });
    expect(theme.preset).toBe('advanced');
    expect(theme.titleStyle.color).toContain('dashboard-chart-header-text');
    expect(theme.badgeSx.bgcolor).toBe('#dc2626');
    expect(theme.badgeSx.color).toBe('#ffffff');
    expect(theme.listScrollable).toBe(false);
  });

  it('customized theme maps to grid preset', () => {
    const theme = resolveAlertsTheme({ preset: ALERTS_THEME_PRESETS.customized });
    expect(theme.preset).toBe('customized');
    expect(theme.badgeSx.minWidth).toBe(24);
  });
});

describe('alertsWidgetPropsAreEqual', () => {
  const base = {
    alerts: alertsPayload,
    loading: false,
    shellVariant: ALERTS_THEME_PRESETS.grid,
    title: 'Alerts',
    onClick: () => {},
    cardSx: {},
  };

  it('skips re-render for deep-equal alerts with different reference', () => {
    const next = {
      ...base,
      alerts: JSON.parse(JSON.stringify(alertsPayload)),
    };
    expect(alertsWidgetPropsAreEqual(base, next)).toBe(true);
  });

  it('re-renders when loading changes', () => {
    const next = { ...base, loading: true };
    expect(alertsWidgetPropsAreEqual(base, next)).toBe(false);
  });

  it('re-renders when shell variant changes', () => {
    const next = { ...base, shellVariant: ALERTS_THEME_PRESETS.basic };
    expect(alertsWidgetPropsAreEqual(base, next)).toBe(false);
  });
});

import React, { memo, useEffect } from 'react';
import { chartLoaderPropsAreEqual } from './chartLoaderMemoCompare';
import {
  DASHBOARD_CHART_LOADER_DEFAULT_MESSAGE,
  resolveDashboardChartLoaderPreset,
} from './chartLoaderTheme';

const SPIN_STYLE_ID = 'shared-dashboard-chart-loader-spin-keyframes';

function injectSpinKeyframes() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(SPIN_STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = SPIN_STYLE_ID;
  style.textContent = `
    @keyframes dashboardChartLoaderSpin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

function ChartLoaderInner({
  height,
  message,
  shellVariant = 'basic',
  light = false,
  fullWidth = true,
  minHeight,
}) {
  useEffect(() => {
    injectSpinKeyframes();
  }, []);

  const preset = resolveDashboardChartLoaderPreset(shellVariant, light);
  const resolvedHeight = height ?? preset.defaultHeight;
  const resolvedMessage = message ?? preset.defaultMessage;
  const showMessage = Boolean(resolvedMessage);

  const containerStyle = {
    height: resolvedHeight,
    minHeight,
    width: fullWidth ? '100%' : undefined,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...preset.container,
  };

  const spinnerStyle = {
    ...preset.spinner,
    borderRadius: '50%',
    animation: 'dashboardChartLoaderSpin 1s linear infinite',
    ...(showMessage ? preset.spinnerWithMessage : null),
  };

  return (
    <div
      style={containerStyle}
      data-testid="dashboard-chart-loader"
      data-shell-variant={shellVariant}
      data-light={light ? 'true' : 'false'}
      data-height={resolvedHeight}
    >
      <div style={spinnerStyle} data-testid="dashboard-chart-loader-spinner" />
      {showMessage ? <span style={preset.message}>{resolvedMessage}</span> : null}
    </div>
  );
}

const ChartLoader = memo(ChartLoaderInner, chartLoaderPropsAreEqual);

ChartLoader.displayName = 'DashboardChartLoader';

export default ChartLoader;

export function bindDashboardChartLoader(shellVariant) {
  function BoundDashboardChartLoader(props) {
    return <ChartLoader shellVariant={shellVariant} {...props} />;
  }
  BoundDashboardChartLoader.displayName = `DashboardChartLoader(${shellVariant})`;
  return BoundDashboardChartLoader;
}

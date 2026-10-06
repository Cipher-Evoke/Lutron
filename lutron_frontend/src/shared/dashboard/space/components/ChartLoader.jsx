import React, { memo, useEffect } from 'react';
import { chartLoaderPropsAreEqual } from './chartLoaderMemoCompare';
import { resolveChartLoaderPreset } from './chartLoaderTheme';

const SPIN_STYLE_ID = 'shared-chart-loader-spin-keyframes';

function injectSpinKeyframes() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(SPIN_STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = SPIN_STYLE_ID;
  style.textContent = `
    @keyframes chartLoaderSpin {
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
  fullWidth = true,
  minHeight,
}) {
  useEffect(() => {
    injectSpinKeyframes();
  }, []);

  const preset = resolveChartLoaderPreset(shellVariant);
  const resolvedHeight = height ?? preset.defaultHeight;
  const showMessage = Boolean(message);

  const containerStyle = {
    height: resolvedHeight,
    minHeight,
    width: fullWidth ? '100%' : undefined,
    display: 'flex',
    flexDirection: showMessage ? 'column' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...preset.container,
  };

  const spinnerStyle = {
    ...preset.spinner,
    borderRadius: '50%',
    animation: 'chartLoaderSpin 1s linear infinite',
    ...(showMessage ? preset.spinnerWithMessage : null),
  };

  return (
    <div
      style={containerStyle}
      data-testid="chart-loader"
      data-shell-variant={shellVariant}
      data-height={resolvedHeight}
    >
      <div style={spinnerStyle} data-testid="chart-loader-spinner" />
      {showMessage ? <span style={preset.message}>{message}</span> : null}
    </div>
  );
}

const ChartLoader = memo(ChartLoaderInner, chartLoaderPropsAreEqual);

ChartLoader.displayName = 'ChartLoader';

export default ChartLoader;

export function bindChartLoader(shellVariant) {
  function BoundChartLoader(props) {
    return <ChartLoader shellVariant={shellVariant} {...props} />;
  }
  BoundChartLoader.displayName = `ChartLoader(${shellVariant})`;
  return BoundChartLoader;
}

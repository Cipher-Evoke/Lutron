import React, { useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SpaceStackedBarTooltip } from './SpaceStackedBarTooltip';
import {
  SPACE_STACKED_BAR_EMPTY_MESSAGE,
  SPACE_STACKED_BAR_EMPTY_CRITERIA_MESSAGE,
  SPACE_STACKED_BAR_ERROR_MESSAGE,
  SPACE_STACKED_BAR_CATCH_ERROR_MESSAGE,
  STACKED_BAR_SERIES_ORDER,
  STACKED_BAR_LEGEND_LABELS,
} from './spaceStackedBarConfig';
import {
  plotContainerEventHandlers,
  responsiveContainerEventHandlers,
  tooltipEventHandlers,
} from './spaceLineChartPlotHandlers';

function Spinner({ theme }) {
  return (
    <div
      style={{
        width: '40px',
        height: '40px',
        border: `3px solid ${theme.spinOuter}`,
        borderTop: `3px solid ${theme.spinTop}`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }}
    />
  );
}

function resolvePlotHeightStyle(plotHeightStyle) {
  if (plotHeightStyle === 'flexFill') {
    return { height: '100%', minHeight: 0 };
  }
  if (plotHeightStyle === 'chartsTabClamp') {
    return { height: 'clamp(200px, 42vh, 340px)' };
  }
  if (plotHeightStyle === 'basicChartsTabClamp') {
    /* Basic Utilization by Area Group — taller so bars are readable */
    return { height: 'clamp(260px, 42vh, 360px)' };
  }
  if (plotHeightStyle === 'basicFixed320') {
    return { height: '360px' };
  }
  return { height: '400px' };
}

function shellFrameStyle(theme, plotHeightStyle) {
  return {
    ...resolvePlotHeightStyle(plotHeightStyle),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: theme.plotBorder,
    borderRadius: '4px',
    backgroundColor: theme.emptyBg,
    background: theme.shellStyle?.background || theme.emptyBg,
    color: theme.emptyColor,
    fontSize: '14px',
    ...(theme.shellStyle || {}),
  };
}

function resolveStatusMessage(status) {
  if (status === 'empty') return SPACE_STACKED_BAR_EMPTY_MESSAGE;
  if (status === 'empty-criteria') return SPACE_STACKED_BAR_EMPTY_CRITERIA_MESSAGE;
  if (status === 'error') return SPACE_STACKED_BAR_ERROR_MESSAGE;
  if (status === 'catch-error') return SPACE_STACKED_BAR_CATCH_ERROR_MESSAGE;
  return '';
}

export function SpaceStackedBarChartView({
  status,
  theme,
  stackedBarData = [],
  chartKey = 'stacked-bar',
  plotHeightStyle = 'fixed400',
}) {
  const tooltipContent = useCallback(
    (props) => <SpaceStackedBarTooltip {...props} theme={theme} />,
    [theme]
  );

  if (status !== 'ready') {
    if (status === 'loading') {
      return (
        <div style={shellFrameStyle(theme, plotHeightStyle)}>
          <Spinner theme={theme} />
        </div>
      );
    }
    return (
      <div style={shellFrameStyle(theme, plotHeightStyle)}>
        {resolveStatusMessage(status)}
      </div>
    );
  }

  const plotContainerStyle = {
    ...resolvePlotHeightStyle(plotHeightStyle),
    border: theme.plotBorder,
    borderRadius: '4px',
    backgroundColor: theme.plotBg || undefined,
    background: theme.shellStyle?.background || theme.plotBg || undefined,
    boxShadow: theme.shellStyle?.boxShadow,
    padding: '10px',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    MozUserSelect: 'none',
    msUserSelect: 'none',
    ...(theme.shellStyle?.border ? { border: theme.shellStyle.border } : {}),
  };

  return (
    <div style={plotContainerStyle} {...plotContainerEventHandlers}>
      <ResponsiveContainer width="100%" height="100%" {...responsiveContainerEventHandlers}>
        <BarChart
          {...responsiveContainerEventHandlers}
          data={stackedBarData}
          margin={{ top: 20, right: 30, left: 80, bottom: 5 }}
          key={chartKey}
        >
          <CartesianGrid stroke={theme.grid} strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            stroke={theme.axis}
            fontSize={12}
            tick={{ fill: theme.tick, fontWeight: 600, fontSize: 12 }}
            axisLine={{ stroke: theme.axis }}
            tickLine={{ stroke: theme.axis }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            stroke={theme.axis}
            fontSize={12}
            tick={{ fill: theme.tick, fontWeight: 600, fontSize: 12 }}
            axisLine={{ stroke: theme.axis }}
            tickLine={{ stroke: theme.axis }}
            label={{
              value: 'Utilization (%)',
              angle: -90,
              position: 'insideLeft',
              fill: theme.yLabel,
              offset: -50,
            }}
            domain={[0, 100]}
            padding={{ right: 20 }}
          />
          <Tooltip {...tooltipEventHandlers} content={tooltipContent} />
          {STACKED_BAR_SERIES_ORDER.map((dataKey) => (
            <Bar
              key={dataKey}
              dataKey={dataKey}
              stackId="a"
              fill={theme.barColors[dataKey]}
              name={STACKED_BAR_LEGEND_LABELS[dataKey]}
              stroke={theme.barEdge}
              strokeWidth={1}
              barSize={40}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default SpaceStackedBarChartView;

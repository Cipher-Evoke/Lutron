import React, { useCallback } from 'react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatSpaceInstantOccupancyXAxisLabel } from '../transforms/formatSpaceInstantOccupancyXAxisLabel';
import { InstantOccupancyTooltip } from './InstantOccupancyTooltip';
import {
  INSTANT_OCCUPANCY_EMPTY_MESSAGE,
  INSTANT_OCCUPANCY_ERROR_MESSAGE,
} from './instantOccupancyConfig';
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
  if (plotHeightStyle === 'instantChartsTabClamp') {
    return { height: 'clamp(200px, 36vh, 300px)' };
  }
  if (plotHeightStyle === 'basicInstantChartsTabClamp') {
    /* Basic Space Utilization Trends — taller so the area chart is not squashed */
    return { height: 'clamp(260px, 42vh, 360px)' };
  }
  if (plotHeightStyle === 'basicFixed280') {
    return { height: '320px' };
  }
  return { height: '350px' };
}

function resolvePlotShellBorder(theme) {
  if (theme.shellStyle?.border) return theme.shellStyle.border;
  const token = theme.plotBorder || theme.shellBorder;
  if (!token) return undefined;
  return String(token).includes('solid') ? token : `1px solid ${token}`;
}

function shellFrameStyle(theme, plotHeightStyle) {
  return {
    ...resolvePlotHeightStyle(plotHeightStyle),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: resolvePlotShellBorder(theme),
    borderRadius: '4px',
    backgroundColor: theme.shellBg,
    background: theme.shellStyle?.background || theme.shellBg,
    color: theme.shellText,
    fontSize: '14px',
    ...(theme.shellStyle || {}),
  };
}

function renderInstantOccupancyDot(props, theme) {
  if (!props.payload || props.payload.occupancy == null) return null;
  if (props.payload.isHourly === true) return null;
  return (
    <circle
      key={`dot-${props.index}`}
      cx={props.cx}
      cy={props.cy}
      r={1}
      fill={theme.line}
      stroke={theme.dotStroke}
      strokeWidth={0.3}
    />
  );
}

function UtilizationFooter({ footerModel }) {
  if (!footerModel) return null;
  const {
    selectedDuration,
    entirePct,
    workingPct,
    showWorkingHoursFooter,
    utilizationFooterPeriodLabel,
    footerMuted,
    footerStrong,
    formatFooterStat,
  } = footerModel;

  return (
    <div style={{ marginTop: '8px', fontSize: '13px', lineHeight: 1.5, paddingLeft: '2px' }}>
      {selectedDuration === 'this-day' ? (
        <>
          <span style={{ color: footerMuted }}>Occupancy </span>
          <strong style={{ color: footerStrong }}>{formatFooterStat(entirePct)}</strong>
        </>
      ) : (
        <>
          <span style={{ color: footerMuted }}>Average utilization </span>
          {showWorkingHoursFooter && (
            <>
              <span style={{ color: footerMuted }}>Working Hours </span>
              <strong style={{ color: footerStrong }}>{formatFooterStat(workingPct)}</strong>
              <span style={{ color: footerMuted }}> </span>
            </>
          )}
          {utilizationFooterPeriodLabel ? (
            <span style={{ color: footerMuted }}>{utilizationFooterPeriodLabel} </span>
          ) : null}
          <strong style={{ color: footerStrong }}>{formatFooterStat(entirePct)}</strong>
        </>
      )}
    </div>
  );
}

export function InstantOccupancyChartView({
  status,
  theme,
  processedChartData,
  chartConfig,
  maxOccupancy,
  nonNullValues,
  showPercentage,
  xAxisTicks,
  footerModel = null,
  selectedDuration,
  currentDate,
  currentYear,
  customDateRange,
  isNavigating,
  plotHeightStyle = 'instantFixed350',
}) {
  const formatXAxisLabel = useCallback(
    (value) =>
      formatSpaceInstantOccupancyXAxisLabel(value, {
        selectedDuration,
        currentDate,
        currentYear,
        customDateRange,
      }),
    [selectedDuration, currentDate, currentYear, customDateRange]
  );

  const tooltipContent = useCallback(
    (props) => (
      <InstantOccupancyTooltip
        {...props}
        theme={theme}
        selectedDuration={selectedDuration}
        currentDate={currentDate}
        customDateRange={customDateRange}
      />
    ),
    [theme, selectedDuration, currentDate, customDateRange]
  );

  if (status !== 'ready') {
    if (status === 'loading') {
      return (
        <div style={shellFrameStyle(theme, plotHeightStyle)}>
          <Spinner theme={theme} />
        </div>
      );
    }
    const message =
      status === 'error' ? INSTANT_OCCUPANCY_ERROR_MESSAGE : INSTANT_OCCUPANCY_EMPTY_MESSAGE;
    return (
      <div style={shellFrameStyle(theme, plotHeightStyle)}>{message}</div>
    );
  }

  const frameHeight = resolvePlotHeightStyle(plotHeightStyle);
  const plotContainerStyle = {
    ...frameHeight,
    border: resolvePlotShellBorder(theme),
    borderRadius: '4px',
    backgroundColor: theme.plotBg || undefined,
    background: theme.shellStyle?.background || theme.plotBg || undefined,
    boxShadow: theme.shellStyle?.boxShadow,
    padding: '10px',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    MozUserSelect: 'none',
    msUserSelect: 'none',
  };

  const xDataKey = selectedDuration === 'this-day' ? 'timeMinutes' : 'date';
  const xAxisInterval =
    selectedDuration === 'this-month' ||
    selectedDuration === 'this-year' ||
    selectedDuration === 'custom'
      ? 0
      : selectedDuration === 'this-day'
        ? 0
        : chartConfig.xAxisInterval;
  const xAxisType =
    selectedDuration === 'this-day'
      ? 'number'
      : selectedDuration === 'this-year' || selectedDuration === 'custom'
        ? 'category'
        : undefined;

  const seriesProps = {
    type: 'monotone',
    dataKey: 'occupancy',
    stroke: theme.line,
    strokeWidth: theme.seriesStrokeWidth || 2,
    connectNulls: true,
    dot: (props) => renderInstantOccupancyDot(props, theme),
    activeDot: { r: 3, fill: theme.line, stroke: theme.dotStroke, strokeWidth: 1 },
    name: 'Occupancy',
  };

  const chartKey = `instant-occupancy-${theme.chartRenderMode}-${selectedDuration}-${currentDate}-${isNavigating}`;

  const chartInner = (
    <div style={{ height: frameHeight.height, width: '100%', minHeight: frameHeight.minHeight }}>
      <ResponsiveContainer width="100%" height="100%" {...responsiveContainerEventHandlers}>
        {theme.chartRenderMode === 'area' ? (
          <AreaChart
            {...responsiveContainerEventHandlers}
            data={processedChartData}
            key={chartKey}
            margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
          >
            <CartesianGrid stroke={theme.grid} strokeDasharray="3 3" />
            <XAxis
              dataKey={xDataKey}
              stroke={theme.axis}
              fontSize={selectedDuration === 'this-day' ? 9 : chartConfig.xAxisFontSize}
              tick={{
                fill: theme.tick,
                fontWeight: 600,
                fontSize: selectedDuration === 'this-day' ? 9 : chartConfig.xAxisFontSize,
                angle: selectedDuration === 'this-day' ? -45 : 0,
                textAnchor: selectedDuration === 'this-day' ? 'end' : 'middle',
              }}
              tickFormatter={formatXAxisLabel}
              axisLine={{ stroke: theme.axis }}
              tickLine={{ stroke: theme.axis }}
              interval={xAxisInterval}
              tickCount={selectedDuration === 'this-day' ? 24 : chartConfig.xAxisTickCount}
              ticks={xAxisTicks}
              type={xAxisType}
              domain={selectedDuration === 'this-day' ? [0, 1440] : undefined}
            />
            <YAxis
              stroke={theme.axis}
              fontSize={12}
              tick={{ fill: theme.tick, fontWeight: 600, fontSize: 12 }}
              axisLine={{ stroke: theme.axis }}
              tickLine={{ stroke: theme.axis }}
              domain={[0, maxOccupancy]}
              padding={{ right: 20 }}
              label={{
                value: showPercentage ? '(Occupancy %)' : '(Occupancy Count)',
                angle: -90,
                position: 'insideLeft',
                fill: theme.yLabel,
                offset: -50,
                style: { textAnchor: 'middle', fontSize: '14px', fontWeight: '600' },
              }}
              hide={nonNullValues.length === 0}
            />
            <Tooltip
              {...tooltipEventHandlers}
              content={tooltipContent}
              cursor={{ stroke: theme.cursor, strokeWidth: 1 }}
            />
            <Area {...seriesProps} fill={theme.line} fillOpacity={theme.areaFillOpacity} />
          </AreaChart>
        ) : (
          <LineChart
            {...responsiveContainerEventHandlers}
            data={processedChartData}
            key={chartKey}
            margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
          >
            <CartesianGrid stroke={theme.grid} strokeDasharray="3 3" />
            <XAxis
              dataKey={xDataKey}
              stroke={theme.axis}
              fontSize={selectedDuration === 'this-day' ? 9 : chartConfig.xAxisFontSize}
              tick={{
                fill: theme.tick,
                fontWeight: 600,
                fontSize: selectedDuration === 'this-day' ? 9 : chartConfig.xAxisFontSize,
                angle: selectedDuration === 'this-day' ? -45 : 0,
                textAnchor: selectedDuration === 'this-day' ? 'end' : 'middle',
              }}
              tickFormatter={formatXAxisLabel}
              axisLine={{ stroke: theme.axis }}
              tickLine={{ stroke: theme.axis }}
              interval={xAxisInterval}
              tickCount={selectedDuration === 'this-day' ? 24 : chartConfig.xAxisTickCount}
              ticks={xAxisTicks}
              type={xAxisType}
              domain={selectedDuration === 'this-day' ? [0, 1440] : undefined}
            />
            <YAxis
              stroke={theme.axis}
              fontSize={12}
              tick={{ fill: theme.tick, fontWeight: 600, fontSize: 12 }}
              axisLine={{ stroke: theme.axis }}
              tickLine={{ stroke: theme.axis }}
              domain={[0, maxOccupancy]}
              padding={{ right: 20 }}
              label={{
                value: showPercentage ? '(Occupancy %)' : '(Occupancy Count)',
                angle: -90,
                position: 'insideLeft',
                fill: theme.yLabel,
                offset: -50,
                style: { textAnchor: 'middle', fontSize: '14px', fontWeight: '600' },
              }}
              hide={nonNullValues.length === 0}
            />
            <Tooltip
              {...tooltipEventHandlers}
              content={tooltipContent}
              cursor={{ stroke: theme.cursor, strokeWidth: 1 }}
            />
            <Line {...seriesProps} />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );

  return (
    <div style={plotContainerStyle} {...plotContainerEventHandlers}>
      {chartInner}
      <UtilizationFooter footerModel={footerModel} />
    </div>
  );
}

export default InstantOccupancyChartView;

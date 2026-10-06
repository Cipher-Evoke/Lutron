import React, { useCallback, useMemo } from 'react';
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
import { formatSpaceOccupancyXAxisLabel } from '../transforms/formatSpaceOccupancyXAxisLabel';
import { SpaceLineTooltip } from './SpaceLineTooltip';
import { SpaceChartCardShell } from './SpaceChartCardShell';
import {
  plotContainerEventHandlers,
  responsiveContainerEventHandlers,
  tooltipEventHandlers,
  renderSpaceLineDot,
} from './spaceLineChartPlotHandlers';

export function SpaceLineChartView({
  status,
  theme,
  processedChartData,
  chartConfig,
  maxOccupancy,
  nonNullValues,
  showPercentage,
  xAxisTicks,
  selectedDuration,
  currentDate,
  currentYear,
  customDateRange,
  isNavigating,
  plotHeightStyle = 'fixed350',
}) {
  const formatXAxisLabel = useCallback(
    (value) =>
      formatSpaceOccupancyXAxisLabel(value, {
        selectedDuration,
        currentDate,
        currentYear,
        customDateRange,
      }),
    [selectedDuration, currentDate, currentYear, customDateRange]
  );

  const tooltipContent = useCallback(
    (props) => (
      <SpaceLineTooltip
        {...props}
        theme={theme}
        selectedDuration={selectedDuration}
        currentDate={currentDate}
        customDateRange={customDateRange}
      />
    ),
    [theme, selectedDuration, currentDate, customDateRange]
  );

  const plotContainerStyle = useMemo(() => {
    const heightStyle =
      plotHeightStyle === 'flexFill'
        ? { height: '100%', minHeight: 0 }
        : plotHeightStyle === 'basicFixed280'
          ? { height: '320px' }
          : { height: '350px' };

    return {
      ...heightStyle,
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
  }, [plotHeightStyle, theme]);

  if (status !== 'ready') {
    return (
      <SpaceChartCardShell status={status} theme={theme} plotHeightStyle={plotHeightStyle} />
    );
  }

  const chartKeyPrefix = theme.chartRenderMode === 'area' ? 'areachart' : 'linechart';

  const xAxisInterval =
    selectedDuration === 'this-month' ||
    selectedDuration === 'this-year' ||
    selectedDuration === 'custom'
      ? 0
      : selectedDuration === 'this-day'
        ? 0
        : chartConfig.xAxisInterval;

  const xAxisType =
    selectedDuration === 'this-day' ||
    selectedDuration === 'this-year' ||
    selectedDuration === 'custom'
      ? 'category'
      : undefined;

  const seriesProps = {
    type: 'monotone',
    dataKey: 'occupancy',
    stroke: theme.seriesColor,
    strokeWidth: theme.seriesStrokeWidth,
    connectNulls: true,
    dot: (props) => renderSpaceLineDot(props, { selectedDuration, theme }),
    activeDot: {
      r: 4,
      stroke: theme.dotStroke,
      strokeWidth: 1,
    },
    name: 'Occupancy',
  };

  const chartBody = (
    <div style={plotContainerStyle} {...plotContainerEventHandlers}>
      <ResponsiveContainer width="100%" height="100%" {...responsiveContainerEventHandlers}>
        {theme.chartRenderMode === 'area' ? (
          <AreaChart
            {...responsiveContainerEventHandlers}
            data={processedChartData}
            key={`${chartKeyPrefix}-${selectedDuration}-${currentDate}-${isNavigating}`}
            margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
          >
            <CartesianGrid stroke={theme.grid} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
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
                offset: -70,
                style: { textAnchor: 'middle', fontSize: '12px', fontWeight: '600' },
              }}
              hide={nonNullValues.length === 0}
            />
            <Tooltip
              {...tooltipEventHandlers}
              content={tooltipContent}
              cursor={{ stroke: theme.cursor, strokeWidth: 1 }}
            />
            <Area
              {...seriesProps}
              fill={theme.seriesFill}
              fillOpacity={theme.areaFillOpacity}
            />
          </AreaChart>
        ) : (
          <LineChart
            {...responsiveContainerEventHandlers}
            data={processedChartData}
            key={`${chartKeyPrefix}-${selectedDuration}-${currentDate}-${isNavigating}`}
            margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
          >
            <CartesianGrid stroke={theme.grid} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
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
                offset: -70,
                style: { textAnchor: 'middle', fontSize: '12px', fontWeight: '600' },
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

  return chartBody;
}

export default SpaceLineChartView;

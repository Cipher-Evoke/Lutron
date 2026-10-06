import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { EnergyLineTooltip } from '../tooltips/EnergyLineTooltip';

/**
 * Pure Recharts energy line chart — no Redux, no export handlers.
 */
export function EnergyLineChartView({
  chartData,
  seriesNames,
  seriesColors,
  chartConfig,
  theme,
  dynamicUnit,
  yAxisLimit,
  formatXAxisLabel,
  selectedDuration,
  selectedAreaCount,
  title,
  currentDate,
  legendSeriesName = null,
  chartKey,
  cssTooltipStyle,
}) {
  const xInterval =
    selectedDuration === 'this-month'
      ? 0
      : selectedAreaCount <= 2
        ? Math.max(chartConfig.xAxisInterval, 1)
        : chartConfig.xAxisInterval;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        key={chartKey}
        margin={{
          top: 20,
          right: 20,
          left: 20,
          bottom: selectedAreaCount <= 2 ? 20 : 40,
        }}
      >
        <CartesianGrid stroke={theme.grid} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          stroke={theme.axis}
          fontSize={chartConfig.xAxisFontSize}
          tick={{
            fill: theme.tick,
            fontWeight: 600,
            fontSize: chartConfig.xAxisFontSize,
          }}
          tickFormatter={(value, index) => formatXAxisLabel(value, index)}
          axisLine={{ stroke: theme.axis }}
          tickLine={{ stroke: theme.axis }}
          interval={xInterval}
          angle={-45}
          textAnchor="end"
          height={selectedAreaCount <= 2 ? 60 : 50}
          type="category"
          key={`xaxis-${title}-${selectedDuration}`}
          tickCount={chartConfig.xAxisTickCount}
          allowDuplicatedCategory={false}
          scale="point"
          marginLeft={15}
          label={{
            value: '(Time)',
            position: 'insideBottomLeft',
            offset: -5,
            style: {
              textAnchor: 'start',
              fill: theme.tick,
              fontSize: '12px',
              fontWeight: 'bold',
            },
          }}
        />
        <YAxis
          stroke={theme.axis}
          fontSize={chartConfig.xAxisFontSize}
          tick={{
            fill: theme.tick,
            fontWeight: 600,
            fontSize: chartConfig.xAxisFontSize,
          }}
          axisLine={{ stroke: theme.axis }}
          tickLine={{ stroke: theme.axis }}
          width={50}
          tickCount={8}
          domain={yAxisLimit !== undefined && yAxisLimit !== null ? [0, yAxisLimit] : undefined}
          label={{
            value: dynamicUnit ? `(${dynamicUnit})` : '',
            angle: -90,
            position: 'insideLeft',
            offset: 15,
            style: {
              textAnchor: 'middle',
              fill: theme.tick,
              fontSize: '12px',
              fontWeight: 'bold',
            },
          }}
        />
        <Tooltip
          content={
            <EnergyLineTooltip
              theme={theme}
              dynamicUnit={dynamicUnit}
              selectedDuration={selectedDuration}
              currentDate={currentDate}
              useCssTooltipStyle={theme.useCssTooltipVars}
              cssTooltipStyle={cssTooltipStyle}
            />
          }
          cursor={{ stroke: theme.cursor, strokeWidth: 1 }}
        />
        {legendSeriesName == null ? (
          <Legend
            wrapperStyle={{
              color: theme.legend,
              fontSize: '12px',
              fontWeight: 600,
              marginTop: '40px',
              marginBottom: '10px',
              paddingTop: '10px',
              paddingBottom: '10px',
              lineHeight: '1.8',
            }}
            iconType="circle"
          />
        ) : null}
        {seriesNames.map((seriesName, index) => (
          <Line
            key={seriesName}
            name={legendSeriesName != null ? legendSeriesName : seriesName}
            type="monotone"
            dataKey={seriesName}
            stroke={seriesColors[index]}
            strokeWidth={chartConfig.strokeWidth}
            dot={(props) => {
              if (
                props.payload &&
                props.payload[seriesName] !== null &&
                props.payload[seriesName] !== undefined
              ) {
                return (
                  <circle
                    key={`dot-${index}-${props.index}`}
                    cx={props.cx}
                    cy={props.cy}
                    r={chartConfig.dotSize}
                    fill={seriesColors[index]}
                    stroke={theme.dotStroke}
                    strokeWidth={2}
                  />
                );
              }
              return null;
            }}
            activeDot={{
              r: chartConfig.activeDotSize,
              stroke: theme.activeDotStroke,
              strokeWidth: 1,
            }}
            connectNulls={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Customized static legend below chart when legendSeriesName is set. */
export function EnergyLineChartLegendLabel({ legendSeriesName, color }) {
  if (legendSeriesName == null) return null;
  return (
    <div
      style={{
        color: '#fff',
        fontSize: '12px',
        fontWeight: 600,
        marginTop: '40px',
        marginBottom: '10px',
        paddingTop: '10px',
        paddingBottom: '10px',
        lineHeight: '1.8',
        textAlign: 'center',
      }}
    >
      <span
        style={{
          display: 'inline-block',
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: color || '#fff',
          marginRight: 8,
          verticalAlign: 'middle',
        }}
      />
      {legendSeriesName}
    </div>
  );
}

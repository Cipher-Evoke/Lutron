import React, { useMemo, useCallback } from 'react';
import { PieChart, Pie, Cell, Label, Legend, ResponsiveContainer } from 'recharts';
import {
  SAVINGS_STRATEGY_PIE_LAYOUT,
  SAVINGS_STRATEGY_CUSTOM_RANGE_PLACEHOLDER,
} from './savingsStrategyConfig';
import { SavingsStrategyDefaultTooltip } from './SavingsStrategyTooltip';

const PLOT_EVENT_HANDLERS = {
  onMouseDown: (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  },
  onMouseUp: (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  },
  onClick: (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  },
  onDoubleClick: (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  },
  onContextMenu: (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  },
};

/**
 * Savings strategy donut — owns pie, tooltip, legend, loading, and empty states.
 */
export function SavingsStrategyChartView({
  status,
  title,
  headerTitle,
  pieData = [],
  centerLabelValue = 0,
  theme,
  getSegmentColor,
  resolveSegmentLabelColors,
  outerStyle = {},
  plotStyle = {},
  headerStyle = {},
  showHeader = true,
  loaderMessage,
  emptyNullMessage,
  emptyZeroMessage,
  LoaderComponent,
  loaderHeight = '100%',
  loaderLight = false,
  cssTooltipStyle,
  cardClassName,
}) {
  const renderSegmentLabel = useCallback(
    ({ cx, cy, midAngle, outerRadius, value, index }) => {
      const percent = value;
      if (percent <= 0) return null;

      const RADIAN = Math.PI / 180;
      const radius = outerRadius + SAVINGS_STRATEGY_PIE_LAYOUT.labelRadiusOffset;
      const x = cx + radius * Math.cos(-midAngle * RADIAN);
      const y = cy + radius * Math.sin(-midAngle * RADIAN);
      const lineEndX =
        cx + (outerRadius + SAVINGS_STRATEGY_PIE_LAYOUT.labelLineInset) * Math.cos(-midAngle * RADIAN);
      const lineEndY =
        cy + (outerRadius + SAVINGS_STRATEGY_PIE_LAYOUT.labelLineInset) * Math.sin(-midAngle * RADIAN);

      const segmentName = pieData[index]?.name;
      const segmentColor = getSegmentColor(segmentName);
      const labelColors = resolveSegmentLabelColors
        ? resolveSegmentLabelColors(segmentColor)
        : { textFill: segmentColor, lineStroke: segmentColor, textShadow: theme.labelTextShadow };

      let textAnchor = 'middle';
      if (x > cx + 20) textAnchor = 'start';
      else if (x < cx - 20) textAnchor = 'end';

      return (
        <g>
          <line
            x1={lineEndX}
            y1={lineEndY}
            x2={x}
            y2={y}
            stroke={labelColors.lineStroke}
            strokeWidth={2}
          />
          <text
            x={x}
            y={y}
            fill={labelColors.textFill}
            textAnchor={textAnchor}
            dominantBaseline="central"
            fontSize={12}
            fontWeight={600}
            style={{
              textShadow: labelColors.textShadow || theme.labelTextShadow,
              pointerEvents: 'none',
            }}
          >
            {`${Number(value).toFixed(1)}%`}
          </text>
        </g>
      );
    },
    [pieData, getSegmentColor, resolveSegmentLabelColors, theme.labelTextShadow]
  );

  const centerLabelStyle = useMemo(
    () => (theme.centerLabelShadow ? { textShadow: '0 1px 4px #232323' } : undefined),
    [theme.centerLabelShadow]
  );

  const header = showHeader ? (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexShrink: 0,
      }}
    >
      <h3 style={{ margin: 0, ...headerStyle }}>{headerTitle || title}</h3>
    </div>
  ) : null;

  if (status === 'custom-range-placeholder') {
    return (
      <div style={outerStyle} className={cardClassName}>
        {header}
        <div style={{ ...plotStyle, padding: '24px 24px 16px', position: 'relative' }}>
          <ResponsiveContainer width="100%" height="97%">
            <PieChart margin={SAVINGS_STRATEGY_PIE_LAYOUT.margin}>
              <Pie
                data={SAVINGS_STRATEGY_CUSTOM_RANGE_PLACEHOLDER}
                cx={SAVINGS_STRATEGY_PIE_LAYOUT.cx}
                cy={SAVINGS_STRATEGY_PIE_LAYOUT.cy}
                innerRadius={SAVINGS_STRATEGY_PIE_LAYOUT.innerRadius}
                outerRadius={SAVINGS_STRATEGY_PIE_LAYOUT.outerRadius}
                dataKey="value"
                paddingAngle={0}
                isAnimationActive={false}
                stroke="#e5e7eb"
              >
                <Cell fill="#f3f4f6" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div style={outerStyle} className={cardClassName}>
        {header}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {LoaderComponent ? (
            <LoaderComponent height={loaderHeight} message={loaderMessage} light={loaderLight} />
          ) : null}
        </div>
      </div>
    );
  }

  if (status === 'empty-null' || status === 'empty-zero') {
    const message = status === 'empty-zero' ? emptyZeroMessage : emptyNullMessage;
    return (
      <div style={outerStyle} className={cardClassName}>
        {header}
        <div
          style={{
            ...plotStyle,
            alignItems: 'center',
            justifyContent: 'center',
            color: theme.chromeText,
            fontSize: '14px',
          }}
        >
          {message}
        </div>
      </div>
    );
  }

  return (
    <div style={outerStyle} className={cardClassName}>
      {header}
      <div
        style={{ ...plotStyle, padding: '24px 24px 16px', position: 'relative', overflow: 'visible' }}
        {...PLOT_EVENT_HANDLERS}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={SAVINGS_STRATEGY_PIE_LAYOUT.margin} style={{ overflow: 'visible' }}>
            <Pie
              data={pieData}
              cx={SAVINGS_STRATEGY_PIE_LAYOUT.cx}
              cy={SAVINGS_STRATEGY_PIE_LAYOUT.cy}
              innerRadius={SAVINGS_STRATEGY_PIE_LAYOUT.innerRadius}
              outerRadius={SAVINGS_STRATEGY_PIE_LAYOUT.outerRadius}
              paddingAngle={SAVINGS_STRATEGY_PIE_LAYOUT.paddingAngle}
              dataKey="value"
              labelLine={false}
              label={renderSegmentLabel}
              isAnimationActive={false}
              minAngle={SAVINGS_STRATEGY_PIE_LAYOUT.minAngle}
            >
              <Label
                value={`${Number(centerLabelValue).toFixed(1)} %`}
                position="center"
                fill={theme.centerLabel}
                fontSize={SAVINGS_STRATEGY_PIE_LAYOUT.centerLabelFontSize}
                fontWeight={700}
                style={centerLabelStyle}
              />
              {pieData.map((entry, index) => (
                <Cell key={`cell-${entry.name}-${index}`} fill={getSegmentColor(entry.name)} />
              ))}
            </Pie>
            <SavingsStrategyDefaultTooltip theme={theme} cssTooltipStyle={cssTooltipStyle} />
            <Legend
              wrapperStyle={{
                color: theme.legend,
                fontSize: '11px',
                fontWeight: 600,
                right: 0,
                top: 0,
                lineHeight: '1.8',
              }}
              iconType="circle"
              align="right"
              verticalAlign="middle"
              layout="vertical"
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

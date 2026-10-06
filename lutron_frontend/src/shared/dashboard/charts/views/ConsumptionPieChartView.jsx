import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Label, Legend, ResponsiveContainer } from 'recharts';
import {
  CONSUMPTION_PIE_LAYOUT,
} from '../config/consumptionPieChartConfig';
import { ConsumptionPieDefaultTooltip } from '../tooltips/ConsumptionPieTooltip';
import { useConsumptionPieSegmentLabel } from './ConsumptionPieSegmentLabel';

/**
 * Pure Recharts consumption pie chart — no Redux, no export handlers.
 */
export function ConsumptionPieChartView({
  pieData,
  segmentColors,
  theme,
  resolveSegmentLabelColors,
  cssTooltipStyle,
}) {
  const renderLabel = useConsumptionPieSegmentLabel(pieData, segmentColors, resolveSegmentLabelColors);

  const centerLabelStyle = useMemo(
    () => (theme.centerLabelShadow ? { textShadow: '0 1px 4px #232323' } : undefined),
    [theme.centerLabelShadow]
  );

  return (
    <ResponsiveContainer width="100%" height="97%">
      <PieChart margin={CONSUMPTION_PIE_LAYOUT.margin}>
        <Pie
          data={pieData}
          cx={CONSUMPTION_PIE_LAYOUT.cx}
          cy={CONSUMPTION_PIE_LAYOUT.cy}
          innerRadius={CONSUMPTION_PIE_LAYOUT.innerRadius}
          outerRadius={CONSUMPTION_PIE_LAYOUT.outerRadius}
          paddingAngle={CONSUMPTION_PIE_LAYOUT.paddingAngle}
          dataKey="value"
          labelLine={false}
          label={renderLabel}
          isAnimationActive={false}
        >
          <Label
            value={CONSUMPTION_PIE_LAYOUT.centerLabelValue}
            position="center"
            fill={theme.centerLabel}
            fontSize={CONSUMPTION_PIE_LAYOUT.centerLabelFontSize}
            fontWeight={700}
            style={centerLabelStyle}
          />
          {pieData.map((entry, index) => (
            <Cell key={`cell-${entry.name}-${index}`} fill={segmentColors[index % segmentColors.length]} />
          ))}
        </Pie>
        <ConsumptionPieDefaultTooltip
          theme={theme}
          pieData={pieData}
          cssTooltipStyle={cssTooltipStyle}
        />
        <Legend
          wrapperStyle={{
            color: theme.legend,
            fontSize: '12px',
            fontWeight: 600,
            right: 0,
            top: 0,
            lineHeight: '1.8',
          }}
          iconType="circle"
          align="right"
          verticalAlign="middle"
          layout="vertical"
          formatter={(value) => value}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

import React, { useMemo } from 'react';
import { CONSUMPTION_PIE_LAYOUT } from '../config/consumptionPieChartConfig';

/**
 * Leader-line segment labels for consumption pie charts.
 */
export function createConsumptionPieSegmentLabelRenderer(pieData, colors, resolveSegmentLabelColors) {
  return function ConsumptionPieSegmentLabel({
    cx,
    cy,
    midAngle,
    outerRadius,
    percent,
    index,
    name,
    value,
  }) {
    const RADIAN = Math.PI / 180;

    if (percent < CONSUMPTION_PIE_LAYOUT.minVisiblePercent) return null;

    const radius = outerRadius + CONSUMPTION_PIE_LAYOUT.labelRadiusOffset;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const lineEndX =
      cx + (outerRadius + CONSUMPTION_PIE_LAYOUT.labelLineInset) * Math.cos(-midAngle * RADIAN);
    const lineEndY =
      cy + (outerRadius + CONSUMPTION_PIE_LAYOUT.labelLineInset) * Math.sin(-midAngle * RADIAN);

    const segmentColor = colors[index % colors.length];
    const labelColors = resolveSegmentLabelColors
      ? resolveSegmentLabelColors(segmentColor)
      : { textFill: segmentColor, lineStroke: segmentColor };

    const item = pieData.find((row) => row.name === name);

    return (
      <g>
        <line
          x1={lineEndX}
          y1={lineEndY}
          x2={x}
          y2={y}
          stroke={labelColors.lineStroke}
          strokeWidth={2}
          strokeDasharray="none"
        />
        <text
          x={x}
          y={y}
          fill={labelColors.textFill}
          textAnchor={x > cx ? 'start' : 'end'}
          dominantBaseline="central"
          fontSize={14}
          fontWeight={600}
          style={labelColors.textShadow ? { textShadow: labelColors.textShadow } : undefined}
        >
          {`${item?.actual_energy ?? ''} (${item?.consumption_percentage || `${value}%`})`}
        </text>
      </g>
    );
  };
}

export function useConsumptionPieSegmentLabel(pieData, colors, resolveSegmentLabelColors) {
  return useMemo(
    () => createConsumptionPieSegmentLabelRenderer(pieData, colors, resolveSegmentLabelColors),
    [pieData, colors, resolveSegmentLabelColors]
  );
}

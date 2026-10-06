import React from 'react';
import {
  resolveSpaceChartTooltipBoxStyle,
  resolveSpaceChartTooltipHeadBorder,
  resolveSpaceChartTooltipTextColor,
} from '../tooltips/resolveSpaceChartTooltipStyle';

export function SpaceStackedBarTooltip({ active, payload, label, theme }) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const tooltipTextColor = resolveSpaceChartTooltipTextColor(theme);
  const tooltipHeadBorder = resolveSpaceChartTooltipHeadBorder(theme);

  return (
    <div style={resolveSpaceChartTooltipBoxStyle(theme)}>
      <p
        style={{
          margin: '0 0 8px 0',
          fontWeight: 'bold',
          borderBottom: `1px solid ${tooltipHeadBorder}`,
          paddingBottom: '4px',
          color: tooltipTextColor,
        }}
      >
        {label}
      </p>
      {payload.map((entry, index) => (
        <p
          key={index}
          style={{
            margin: '4px 0',
            color: theme.useCssTooltipVars ? tooltipTextColor : entry.color,
            fontWeight: '600',
          }}
        >
          {entry.name}: {entry.value}%
        </p>
      ))}
    </div>
  );
}

export default SpaceStackedBarTooltip;

import React from 'react';
import {
  formatSpaceTooltipLabel,
  shouldShowSpaceOccupancyPercentage,
} from './spaceLineChartConfig';
import {
  resolveSpaceChartTooltipBoxStyle,
  resolveSpaceChartTooltipHeadBorder,
  resolveSpaceChartTooltipTextColor,
} from '../tooltips/resolveSpaceChartTooltipStyle';

export function SpaceLineTooltip({
  active,
  payload,
  label,
  theme,
  selectedDuration,
  currentDate,
  customDateRange,
}) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const formattedLabel = formatSpaceTooltipLabel(label, { selectedDuration, currentDate });
  const showPercentageInTooltip = shouldShowSpaceOccupancyPercentage(
    selectedDuration,
    customDateRange
  );
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
        {formattedLabel}
      </p>
      {payload.map((entry, index) => (
        <p
          key={index}
          style={{
            margin: '4px 0',
            color: tooltipTextColor,
            fontWeight: '600',
          }}
        >
          Occupancy: {entry.value}
          {showPercentageInTooltip ? ' %' : ''}
        </p>
      ))}
    </div>
  );
}

export default SpaceLineTooltip;

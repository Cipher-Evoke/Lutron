import React from 'react';
import { formatPeakMinTimeLabel } from '../transforms/formatPeakMinTimeLabel';

/**
 * Energy line chart tooltip — week date→weekday conversion matches legacy inline tooltip.
 */
export function EnergyLineTooltip({
  active,
  payload,
  label,
  theme,
  dynamicUnit,
  selectedDuration,
  currentDate,
  useCssTooltipStyle = false,
  cssTooltipStyle,
}) {
  if (!active || !payload || !payload.length) return null;

  const formattedLabel = formatPeakMinTimeLabel(label, selectedDuration, currentDate);

  const tooltipTextColor = useCssTooltipStyle
    ? cssTooltipStyle?.color || 'var(--dashboard-chart-tooltip-text, #ffffff)'
    : theme.tooltipText;

  const tooltipTitleBorderColor = useCssTooltipStyle
    ? 'var(--dashboard-chart-tooltip-border-color, #ffffff)'
    : theme.tooltipTitleBorder;

  const boxStyle = useCssTooltipStyle
    ? {
        ...cssTooltipStyle,
        background:
          cssTooltipStyle?.background ||
          cssTooltipStyle?.backgroundColor ||
          'var(--dashboard-chart-tooltip-bg, #3d4a5c)',
        padding: '10px',
        color: tooltipTextColor,
      }
    : {
        backgroundColor: theme.tooltipBg,
        border: theme.tooltipBorder,
        borderRadius: '4px',
        padding: '10px',
        color: theme.tooltipText,
        fontSize: '12px',
      };

  return (
    <div style={boxStyle}>
      <p
        style={{
          margin: '0 0 8px 0',
          fontWeight: 'bold',
          borderBottom: `1px solid ${tooltipTitleBorderColor}`,
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
          {entry.dataKey || entry.name}: {entry.value}
          {dynamicUnit ? ` ${dynamicUnit}` : ''}
        </p>
      ))}
    </div>
  );
}

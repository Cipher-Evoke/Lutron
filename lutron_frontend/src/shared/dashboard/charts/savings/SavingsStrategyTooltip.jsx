import React from 'react';
import { Tooltip } from 'recharts';
import { formatSavingsStrategyTooltipValue } from './savingsStrategyConfig';

export function SavingsStrategyDefaultTooltip({ theme, cssTooltipStyle }) {
  const contentStyle = theme.useCssTooltipVars
    ? {
        ...cssTooltipStyle,
        background:
          cssTooltipStyle?.background ||
          cssTooltipStyle?.backgroundColor ||
          'var(--dashboard-chart-tooltip-bg, #3d4a5c)',
        color:
          cssTooltipStyle?.color || 'var(--dashboard-chart-tooltip-text, #ffffff)',
      }
    : {
        backgroundColor: theme.tooltipBg,
        border: theme.tooltipBorder,
        borderRadius: '4px',
        color: theme.tooltipText,
        fontSize: '12px',
      };

  const tooltipTextColor = theme.useCssTooltipVars
    ? 'var(--dashboard-chart-tooltip-text, #ffffff)'
    : theme.tooltipText;

  return (
    <Tooltip
      contentStyle={contentStyle}
      formatter={(value, name) => [formatSavingsStrategyTooltipValue(value), name]}
      labelStyle={{ color: tooltipTextColor, fontWeight: 600 }}
      itemStyle={{ color: tooltipTextColor, fontWeight: 600 }}
    />
  );
}

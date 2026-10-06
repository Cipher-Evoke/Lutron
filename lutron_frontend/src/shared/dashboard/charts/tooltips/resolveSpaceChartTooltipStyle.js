/**
 * Tooltip chrome for space utilization charts when advanced uses CSS theme vars.
 */
export function resolveSpaceChartTooltipBoxStyle(theme) {
  if (theme?.useCssTooltipVars) {
    return {
      background: theme.tooltipBg || 'var(--dashboard-chart-tooltip-bg, #3d4a5c)',
      border: theme.tooltipBorder || '1px solid var(--dashboard-chart-tooltip-border-color, #ffffff)',
      borderRadius: '4px',
      padding: '10px',
      color: theme.tooltipText || 'var(--dashboard-chart-tooltip-text, #ffffff)',
      fontSize: '12px',
    };
  }

  return {
    background: theme.tooltipBg,
    backgroundColor: theme.tooltipBg,
    border: theme.tooltipBorder,
    borderRadius: '4px',
    padding: '10px',
    color: theme.tooltipText,
    fontSize: '12px',
    ...(theme.shellStyle || {}),
  };
}

export function resolveSpaceChartTooltipTextColor(theme) {
  if (theme?.useCssTooltipVars) {
    return theme.tooltipText || 'var(--dashboard-chart-tooltip-text, #ffffff)';
  }
  return theme.tooltipText;
}

export function resolveSpaceChartTooltipHeadBorder(theme) {
  if (theme?.useCssTooltipVars) {
    return theme.tooltipHeadBorder || 'var(--dashboard-chart-tooltip-border-color, #ffffff)';
  }
  return theme.tooltipHeadBorder;
}

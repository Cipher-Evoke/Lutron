function stopPlotEvent(e, { preventDefault = false } = {}) {
  if (e && preventDefault && typeof e.preventDefault === 'function') {
    e.preventDefault();
  }
  if (e && typeof e.stopPropagation === 'function') {
    e.stopPropagation();
  }
  return false;
}

export const plotContainerEventHandlers = {
  onMouseDown: (e) => stopPlotEvent(e, { preventDefault: true }),
  onMouseUp: (e) => stopPlotEvent(e, { preventDefault: true }),
  onClick: (e) => stopPlotEvent(e, { preventDefault: true }),
  onDoubleClick: (e) => stopPlotEvent(e, { preventDefault: true }),
  onContextMenu: (e) => stopPlotEvent(e, { preventDefault: true }),
  onTouchStart: (e) => stopPlotEvent(e, { preventDefault: true }),
  onTouchEnd: (e) => stopPlotEvent(e, { preventDefault: true }),
};

export const responsiveContainerEventHandlers = {
  onMouseDown: (e) => stopPlotEvent(e),
  onMouseUp: (e) => stopPlotEvent(e),
  onClick: (e) => stopPlotEvent(e),
  onDoubleClick: (e) => stopPlotEvent(e),
  onContextMenu: (e) => stopPlotEvent(e),
};

export const tooltipEventHandlers = {
  onMouseDown: (e) => stopPlotEvent(e),
  onMouseUp: (e) => stopPlotEvent(e),
  onClick: (e) => stopPlotEvent(e),
};

export function renderSpaceLineDot(props, { selectedDuration, theme }) {
  if (!props.payload) return null;

  const hasValue =
    props.payload.occupancy !== null && props.payload.occupancy !== undefined;
  const seriesColor = theme.seriesColor;
  const dotStroke = theme.dotStroke;

  if (selectedDuration === 'this-year') {
    return (
      <circle
        key={`dot-${props.index}`}
        cx={props.cx}
        cy={props.cy}
        r={hasValue ? 3 : 2}
        fill={hasValue ? theme.seriesFill || seriesColor : 'transparent'}
        stroke={hasValue ? dotStroke : seriesColor}
        strokeWidth={hasValue ? 0.5 : 1}
        opacity={hasValue ? 1 : 0.5}
      />
    );
  }

  if (hasValue) {
    return (
      <circle
        key={`dot-${props.index}`}
        cx={props.cx}
        cy={props.cy}
        r={3}
        fill={theme.seriesFill || seriesColor}
        stroke={dotStroke}
        strokeWidth={0.5}
      />
    );
  }

  return null;
}

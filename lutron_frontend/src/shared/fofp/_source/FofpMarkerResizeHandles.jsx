/**
 * PPT-style resize border + circular handles for a FOFP marker (SVG).
 */

import React from "react";
import { alpha, useTheme } from "@mui/material";
import {
  FOFP_CORNER_HANDLES,
  FOFP_STRETCH_HANDLES,
  getMarkerResizeBounds,
  getResizeHandleHitSize,
  getResizeHandlePositions,
  getResizeHandleCursor,
  isStretchResizeHandle,
} from "./fofpMarkerResize";

const CORNER_HANDLE_RADIUS = 4;
const EDGE_HANDLE_RADIUS = 3.25;

const FofpMarkerResizeHandles = ({
  centerX,
  centerY,
  halfW,
  halfH,
  onHandlePointerDown,
}) => {
  const theme = useTheme();
  const handleFill = theme.palette.common.white;
  const handleStroke = theme.palette.primary.main;
  const bounds = getMarkerResizeBounds(centerX, centerY, halfW, halfH);
  const handles = getResizeHandlePositions(bounds);

  const renderHandle = (id) => {
    const pos = handles[id];
    const hitSize = getResizeHandleHitSize(halfW, halfH, id);
    const hitRadius = hitSize / 2;
    const visibleRadius = isStretchResizeHandle(id)
      ? EDGE_HANDLE_RADIUS
      : CORNER_HANDLE_RADIUS;

    return (
      <g
        key={id}
        data-fofp-resize-handle={id}
        data-testid={`fofp-resize-handle-${id}`}
        style={{ cursor: getResizeHandleCursor(id) }}
      >
        <circle
          cx={pos.x}
          cy={pos.y}
          r={hitRadius}
          fill="transparent"
          pointerEvents="auto"
          onPointerDown={(e) => onHandlePointerDown(e, id)}
        />
        <circle
          cx={pos.x}
          cy={pos.y}
          r={visibleRadius}
          fill={handleFill}
          stroke={alpha(handleStroke, 0.85)}
          strokeWidth={1.25}
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
        />
      </g>
    );
  };

  return (
    <g
      data-fofp-resize-overlay="true"
      data-testid="fofp-resize-overlay"
      pointerEvents="none"
    >
      <rect
        x={bounds.x}
        y={bounds.y}
        width={bounds.width}
        height={bounds.height}
        fill="none"
        stroke={alpha(handleStroke, 0.55)}
        strokeWidth={1}
        strokeDasharray="4 3"
        vectorEffect="non-scaling-stroke"
        pointerEvents="none"
      />
      {FOFP_CORNER_HANDLES.map(renderHandle)}
      {FOFP_STRETCH_HANDLES.map(renderHandle)}
    </g>
  );
};

export default FofpMarkerResizeHandles;

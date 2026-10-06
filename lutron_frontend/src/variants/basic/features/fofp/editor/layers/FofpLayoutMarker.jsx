import React, { useCallback } from "react";
import {
  FOFPMarkerShape,
  resolveFofpMarkerShape,
} from "../../../../screens/heatmap/fofpMarkerShapes";
import { resolveFofpMarkerHalfAxes } from "../../../../screens/heatmap/fofpMarkerDimensions";
import { getMarkerStyle } from "../../../../screens/heatmap/fofpStatusStyles";

/** Zone name only — used for native SVG hover tooltip in FOFP settings. */
export function resolveFofpLayoutMarkerLabel(position) {
  const name = position?.zone_name;
  if (typeof name === "string" && name.trim()) {
    return name.trim();
  }
  if (position?.zone_id != null) {
    return `Zone ${position.zone_id}`;
  }
  return "Zone";
}

const FofpLayoutMarker = React.memo(function FofpLayoutMarker({
  p,
  resolvedShape,
  resolvedSize,
  previewBaseColor,
  accentStroke,
  isEditing,
  isSelected,
  isDragging,
  registerMarkerElement,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onContextMenu,
}) {
  const markerShape = resolveFofpMarkerShape(p.marker_shape, resolvedShape);
  const { halfX, halfY } = resolveFofpMarkerHalfAxes(p, resolvedSize);
  const isManual = p.placement_source === "manual";
  const previewStyle = getMarkerStyle({
    lightLevel: isManual ? 72 : 88,
    baseColor: previewBaseColor,
  });
  const markerVisualStyle = {
    fill: previewStyle.fill,
    stroke: isDragging ? "#ffeb3b" : previewStyle.stroke,
    strokeWidth: isDragging ? 2 : previewStyle.strokeWidth,
    opacity: previewStyle.opacity,
  };

  const setRef = useCallback(
    (el) => {
      if (typeof registerMarkerElement === "function") {
        registerMarkerElement(p.zone_id, el);
      }
    },
    [p.zone_id, registerMarkerElement]
  );

  return (
    <g
      ref={setRef}
      data-fofp-marker="true"
      data-zone-id={p.zone_id}
      data-testid={`fofp-marker-${p.zone_id}`}
      data-fofp-selected={isSelected ? "true" : "false"}
      style={{
        cursor: isDragging ? "grabbing" : isEditing ? "pointer" : "default",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onContextMenu={onContextMenu}
    >
      <title>{resolveFofpLayoutMarkerLabel(p)}</title>
      {isSelected ? (
        <ellipse
          cx={p.x}
          cy={p.y}
          rx={halfX + 3}
          ry={halfY + 3}
          fill="none"
          stroke={accentStroke}
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
        />
      ) : null}
      <FOFPMarkerShape
        x={p.x}
        y={p.y}
        size={halfX}
        sizeY={halfY}
        shape={markerShape}
        style={markerVisualStyle}
      />
    </g>
  );
});

export default FofpLayoutMarker;

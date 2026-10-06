import React, { useMemo } from "react";
import FofpLayoutMarker from "./FofpLayoutMarker";
import { cullPositionsToViewport } from "../culling/viewportCull";

const MarkerLayer = React.memo(function MarkerLayer({
  positions,
  visibleBounds,
  resolvedSize,
  resolvedShape,
  previewBaseColor,
  accentStroke,
  isEditing,
  selectedZoneId,
  draggingZoneId,
  resizingZoneId,
  registerMarkerElement,
  onMarkerPointerDown,
  onMarkerPointerMove,
  onMarkerPointerUp,
  onMarkerContextMenu,
  enableCulling = true,
}) {
  const visiblePositions = useMemo(() => {
    if (!enableCulling || !visibleBounds) return positions;
    return cullPositionsToViewport(positions, visibleBounds, resolvedSize);
  }, [enableCulling, positions, resolvedSize, visibleBounds]);

  return (
    <>
      {visiblePositions.map((p) => {
        if (
          resizingZoneId != null &&
          Number(resizingZoneId) === Number(p.zone_id)
        ) {
          return null;
        }
        const zoneId = p.zone_id;
        return (
          <FofpLayoutMarker
            key={zoneId}
            p={p}
            resolvedShape={resolvedShape}
            resolvedSize={resolvedSize}
            previewBaseColor={previewBaseColor}
            accentStroke={accentStroke}
            isEditing={isEditing}
            isSelected={Number(selectedZoneId) === Number(zoneId)}
            isDragging={Number(draggingZoneId) === Number(zoneId)}
            registerMarkerElement={registerMarkerElement}
            onPointerDown={(e) => onMarkerPointerDown(e, zoneId)}
            onPointerMove={(e) => onMarkerPointerMove(e, zoneId)}
            onPointerUp={(e) => onMarkerPointerUp(e, zoneId)}
            onContextMenu={(e) => onMarkerContextMenu(e, zoneId)}
          />
        );
      })}
    </>
  );
});

export default MarkerLayer;

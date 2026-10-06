import { useCallback, useEffect, useRef } from "react";
import {
  markerResizeFromHandle,
  computeStretchAnchorEdges,
  isStretchResizeHandle,
} from "../../../../screens/settings/fofp/fofpMarkerResize";
import { resolveFofpMarkerHalfAxes } from "../../../../screens/heatmap/fofpMarkerDimensions";
import { resolveFofpMarkerShape } from "../../../../screens/heatmap/fofpMarkerShapes";
import {
  clampMarkerSizeForShapeChange,
  hasValidAreaRings,
} from "../../geometry/markerContainment";

/**
 * Ephemeral resize: RAF-batched preview, commit patch on pointerup.
 */
export const useMarkerResizeSession = ({
  isEditing,
  areaRingsById,
  positionsByZoneId,
  resolvedSize,
  resolvedShape,
  onMarkerStyleChange,
  onLiveResizePatch,
  clientPointToSvg,
  resizingZoneId,
  setResizingZoneId,
}) => {
  const resizeDragRef = useRef(null);
  const livePatchRef = useRef(null);
  const resizeRafRef = useRef(null);

  const endResizeMode = useCallback(() => {
    resizeDragRef.current = null;
    livePatchRef.current = null;
    if (resizeRafRef.current != null) {
      window.cancelAnimationFrame(resizeRafRef.current);
      resizeRafRef.current = null;
    }
    if (typeof onLiveResizePatch === "function") {
      onLiveResizePatch(null);
    }
    setResizingZoneId(null);
  }, [onLiveResizePatch, setResizingZoneId]);

  /** End active handle drag only; keep resize chrome until user clicks away. */
  const commitResize = useCallback(() => {
    const drag = resizeDragRef.current;
    const patch = livePatchRef.current;
    resizeDragRef.current = null;
    livePatchRef.current = null;
    if (resizeRafRef.current != null) {
      window.cancelAnimationFrame(resizeRafRef.current);
      resizeRafRef.current = null;
    }
    if (typeof onLiveResizePatch === "function") {
      onLiveResizePatch(null);
    }
    if (drag && patch && typeof onMarkerStyleChange === "function") {
      onMarkerStyleChange(drag.zoneId, patch);
    }
  }, [onLiveResizePatch, onMarkerStyleChange]);

  useEffect(() => {
    const onPointerMove = (e) => {
      const drag = resizeDragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      if (resizeRafRef.current != null) return;
      resizeRafRef.current = window.requestAnimationFrame(() => {
        resizeRafRef.current = null;
        const active = resizeDragRef.current;
        if (!active) return;
        const pt = clientPointToSvg(e.clientX, e.clientY);
        if (!pt) return;
        const pos = positionsByZoneId.get(Number(active.zoneId));
        if (!pos) return;
        // Stretch must use drag-start size/center so the opposite edge stays fixed.
        const halfX = active.originHalfX;
        const halfY = active.originHalfY;
        const centerX = active.originX;
        const centerY = active.originY;
        const rings = areaRingsById?.get(Number(pos.area_id));
        const shape = resolveFofpMarkerShape(pos.marker_shape, resolvedShape);
        const patch = markerResizeFromHandle(
          active.handleId,
          pt.x,
          pt.y,
          centerX,
          centerY,
          halfX,
          halfY,
          {
            shape,
            rings,
            lastValidHalfX: active.lastValidHalfX,
            lastValidHalfY: active.lastValidHalfY,
            lastValidX: active.lastValidX,
            lastValidY: active.lastValidY,
            stretchAnchor: active.stretchAnchor,
          }
        );
        active.lastValidHalfX = patch.shape_size_x;
        active.lastValidHalfY = patch.shape_size_y;
        if (patch.x != null && Number.isFinite(Number(patch.x))) {
          active.lastValidX = patch.x;
        }
        if (patch.y != null && Number.isFinite(Number(patch.y))) {
          active.lastValidY = patch.y;
        }
        livePatchRef.current = patch;
        if (typeof onLiveResizePatch === "function") {
          onLiveResizePatch(patch);
        }
      });
    };

    const onPointerUp = (e) => {
      const drag = resizeDragRef.current;
      if (drag && drag.pointerId === e.pointerId) commitResize();
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      if (resizeRafRef.current != null) window.cancelAnimationFrame(resizeRafRef.current);
    };
  }, [
    areaRingsById,
    clientPointToSvg,
    commitResize,
    onLiveResizePatch,
    positionsByZoneId,
    resolvedShape,
    resolvedSize,
  ]);

  const handleResizeHandlePointerDown = useCallback(
    (e, handleId) => {
      if (!isEditing || resizingZoneId == null) return;
      e.preventDefault();
      e.stopPropagation();
      const pos = positionsByZoneId.get(Number(resizingZoneId));
      if (!pos) return;
      const { halfX, halfY } = resolveFofpMarkerHalfAxes(pos, resolvedSize);
      const target = e.currentTarget;
      if (target?.setPointerCapture) {
        try {
          target.setPointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }
      livePatchRef.current = null;
      const originX = Number(pos.x);
      const originY = Number(pos.y);
      resizeDragRef.current = {
        zoneId: resizingZoneId,
        handleId,
        pointerId: e.pointerId,
        originX,
        originY,
        originHalfX: halfX,
        originHalfY: halfY,
        lastValidHalfX: halfX,
        lastValidHalfY: halfY,
        lastValidX: originX,
        lastValidY: originY,
        // Mid-edge stretch: freeze opposite edge for the whole drag.
        stretchAnchor: isStretchResizeHandle(handleId)
          ? computeStretchAnchorEdges(originX, originY, halfX, halfY)
          : null,
      };
    },
    [isEditing, positionsByZoneId, resolvedSize, resizingZoneId]
  );

  const canResizeZone = useCallback(
    (zoneId) => {
      const pos = positionsByZoneId.get(Number(zoneId));
      if (!pos) return false;
      return hasValidAreaRings(areaRingsById?.get(Number(pos.area_id)));
    },
    [areaRingsById, positionsByZoneId]
  );

  const clampStylePatchToArea = useCallback(
    (zoneId, patch) => {
      const pos = positionsByZoneId.get(Number(zoneId));
      if (!pos || !patch) return patch;
      const rings = areaRingsById?.get(Number(pos.area_id));
      if (!hasValidAreaRings(rings)) return patch;
      const shape = resolveFofpMarkerShape(
        patch.marker_shape != null ? patch.marker_shape : pos.marker_shape,
        resolvedShape
      );
      const { halfX, halfY } = resolveFofpMarkerHalfAxes(
        { ...pos, ...patch },
        resolvedSize
      );
      const sizePatch = clampMarkerSizeForShapeChange({
        shape,
        cx: pos.x,
        cy: pos.y,
        halfX,
        halfY,
        rings,
      });
      return { ...patch, ...sizePatch };
    },
    [areaRingsById, positionsByZoneId, resolvedShape, resolvedSize]
  );

  return {
    handleResizeHandlePointerDown,
    endResizeMode,
    resizeDragRef,
    clampStylePatchToArea,
    canResizeZone,
  };
};

import { useCallback, useEffect, useRef } from "react";
import {
  FOFP_DRAG_HOLD_MS,
  shouldActivateMarkerDrag,
} from "../../../../screens/settings/fofp/fofpMarkerDrag";
import { clampPointToRings } from "../../geometry/containment";

const DRAGGING_ATTR = "data-fofp-dragging";

/**
 * Ephemeral marker drag: DOM transform during move, single state commit on end.
 */
export const useMarkerDragSession = ({
  isEditing,
  areaRingsById,
  positionsByZoneId,
  onPositionChange,
  onDragStateChange,
  clientPointToSvg,
}) => {
  const pendingDragRef = useRef(null);
  const dragSessionRef = useRef(null);
  const dragMovedRef = useRef(false);
  const markerElementsRef = useRef(new Map());
  const dragRafRef = useRef(null);

  const registerMarkerElement = useCallback((zoneId, el) => {
    const id = Number(zoneId);
    if (el) markerElementsRef.current.set(id, el);
    else markerElementsRef.current.delete(id);
  }, []);

  const setMarkerDraggingVisual = useCallback((zoneId, active) => {
    const el = markerElementsRef.current.get(Number(zoneId));
    if (!el) return;
    if (active) el.setAttribute(DRAGGING_ATTR, "true");
    else el.removeAttribute(DRAGGING_ATTR);
  }, []);

  const clearMarkerTransform = useCallback((zoneId) => {
    const el = markerElementsRef.current.get(Number(zoneId));
    if (el) el.removeAttribute("transform");
  }, []);

  const applyMarkerTransform = useCallback((zoneId, anchorX, anchorY, x, y) => {
    const el = markerElementsRef.current.get(Number(zoneId));
    if (!el) return;
    const dx = x - anchorX;
    const dy = y - anchorY;
    if (Math.abs(dx) < 1e-4 && Math.abs(dy) < 1e-4) {
      el.removeAttribute("transform");
    } else {
      el.setAttribute("transform", `translate(${dx},${dy})`);
    }
  }, []);

  const cancelPendingDrag = useCallback(() => {
    const pending = pendingDragRef.current;
    if (pending?.holdTimerId != null) window.clearTimeout(pending.holdTimerId);
    pendingDragRef.current = null;
  }, []);

  const endDragSession = useCallback(
    (commit) => {
      const session = dragSessionRef.current;
      if (!session) return;
      window.cancelAnimationFrame(dragRafRef.current);
      dragRafRef.current = null;
      clearMarkerTransform(session.zoneId);
      setMarkerDraggingVisual(session.zoneId, false);
      if (
        commit &&
        dragMovedRef.current &&
        session.liveX != null &&
        session.liveY != null &&
        typeof onPositionChange === "function"
      ) {
        onPositionChange(session.zoneId, session.liveX, session.liveY);
      }
      dragSessionRef.current = null;
      if (typeof onDragStateChange === "function") onDragStateChange(null);
    },
    [clearMarkerTransform, onDragStateChange, onPositionChange, setMarkerDraggingVisual]
  );

  const startDragSession = useCallback(
    (zoneId) => {
      cancelPendingDrag();
      const pos = positionsByZoneId.get(Number(zoneId));
      if (!pos) return;
      dragMovedRef.current = false;
      dragSessionRef.current = {
        zoneId: Number(zoneId),
        anchorX: pos.x,
        anchorY: pos.y,
        areaId: pos.area_id,
        liveX: pos.x,
        liveY: pos.y,
        lastValid: { x: pos.x, y: pos.y },
        pointerId: null,
      };
      setMarkerDraggingVisual(zoneId, true);
      if (typeof onDragStateChange === "function") onDragStateChange(Number(zoneId));
    },
    [cancelPendingDrag, onDragStateChange, positionsByZoneId, setMarkerDraggingVisual]
  );

  const scheduleDragFrame = useCallback(
    (clientX, clientY) => {
      const session = dragSessionRef.current;
      if (!session) return;
      if (dragRafRef.current != null) return;
      dragRafRef.current = window.requestAnimationFrame(() => {
        dragRafRef.current = null;
        const active = dragSessionRef.current;
        if (!active) return;
        const svgPt = clientPointToSvg(clientX, clientY);
        if (!svgPt) return;
        const rings = areaRingsById.get(Number(active.areaId));
        const clamped = clampPointToRings(svgPt, rings, active.lastValid);
        if (!clamped) return;
        active.liveX = clamped.x;
        active.liveY = clamped.y;
        active.lastValid = clamped;
        dragMovedRef.current = true;
        applyMarkerTransform(
          active.zoneId,
          active.anchorX,
          active.anchorY,
          clamped.x,
          clamped.y
        );
      });
    },
    [applyMarkerTransform, areaRingsById, clientPointToSvg]
  );

  const applyDragAtClientPoint = useCallback(
    (zoneId, clientX, clientY) => {
      const session = dragSessionRef.current;
      if (!session || session.zoneId !== Number(zoneId)) return;
      scheduleDragFrame(clientX, clientY);
    },
    [scheduleDragFrame]
  );

  const activateMarkerDrag = useCallback(
    (zoneId) => {
      startDragSession(zoneId);
    },
    [startDragSession]
  );

  useEffect(() => {
    if (!isEditing) {
      cancelPendingDrag();
      endDragSession(false);
    }
  }, [isEditing, cancelPendingDrag, endDragSession]);

  useEffect(() => {
    const onWindowMove = (e) => {
      const session = dragSessionRef.current;
      if (!session) return;
      if (session.pointerId != null && e.pointerId !== session.pointerId) return;
      applyDragAtClientPoint(session.zoneId, e.clientX, e.clientY);
    };

    const onWindowUp = (e) => {
      const session = dragSessionRef.current;
      if (!session) return;
      if (session.pointerId != null && e.pointerId !== session.pointerId) return;
      endDragSession(true);
    };

    window.addEventListener("pointermove", onWindowMove);
    window.addEventListener("pointerup", onWindowUp);
    window.addEventListener("pointercancel", onWindowUp);
    return () => {
      window.removeEventListener("pointermove", onWindowMove);
      window.removeEventListener("pointerup", onWindowUp);
      window.removeEventListener("pointercancel", onWindowUp);
      if (dragRafRef.current != null) window.cancelAnimationFrame(dragRafRef.current);
    };
  }, [applyDragAtClientPoint, endDragSession]);

  const handleMarkerPointerDown = useCallback(
    (e, zoneId) => {
      if (e.button !== 0 || !isEditing) return;
      e.stopPropagation();
      e.preventDefault();
      cancelPendingDrag();
      endDragSession(false);

      const pointerId = e.pointerId;
      const startX = e.clientX;
      const startY = e.clientY;

      const holdTimerId = window.setTimeout(() => {
        const pending = pendingDragRef.current;
        if (!pending || pending.zoneId !== zoneId) return;
        pending.holdElapsed = true;
        activateMarkerDrag(zoneId);
        const session = dragSessionRef.current;
        if (session) session.pointerId = pointerId;
        applyDragAtClientPoint(zoneId, e.clientX, e.clientY);
      }, FOFP_DRAG_HOLD_MS);

      pendingDragRef.current = {
        zoneId: Number(zoneId),
        pointerId,
        startX,
        startY,
        holdTimerId,
        holdElapsed: false,
      };

      const target = e.currentTarget;
      if (target?.setPointerCapture) {
        try {
          target.setPointerCapture(pointerId);
        } catch {
          // ignore
        }
      }
    },
    [activateMarkerDrag, applyDragAtClientPoint, cancelPendingDrag, endDragSession, isEditing]
  );

  const handleMarkerPointerMove = useCallback(
    (e, zoneId) => {
      const session = dragSessionRef.current;
      if (session?.zoneId === Number(zoneId)) {
        if (session.pointerId == null) session.pointerId = e.pointerId;
        applyDragAtClientPoint(zoneId, e.clientX, e.clientY);
        return;
      }

      const pending = pendingDragRef.current;
      if (
        !pending ||
        pending.zoneId !== Number(zoneId) ||
        pending.pointerId !== e.pointerId
      ) {
        return;
      }

      const dx = e.clientX - pending.startX;
      const dy = e.clientY - pending.startY;
      if (shouldActivateMarkerDrag(Math.hypot(dx, dy), pending.holdElapsed)) {
        activateMarkerDrag(zoneId);
        const active = dragSessionRef.current;
        if (active) active.pointerId = e.pointerId;
        applyDragAtClientPoint(zoneId, e.clientX, e.clientY);
      }
    },
    [activateMarkerDrag, applyDragAtClientPoint]
  );

  const handleMarkerPointerUp = useCallback(
    (e, zoneId) => {
      const pending = pendingDragRef.current;
      if (
        pending &&
        pending.zoneId === Number(zoneId) &&
        pending.pointerId === e.pointerId
      ) {
        cancelPendingDrag();
      }

      const session = dragSessionRef.current;
      if (session?.zoneId === Number(zoneId)) {
        endDragSession(true);
      }

      const target = e.currentTarget;
      if (target?.releasePointerCapture) {
        try {
          target.releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }
    },
    [cancelPendingDrag, endDragSession]
  );

  const isDraggingZone = useCallback(
    (zoneId) => dragSessionRef.current?.zoneId === Number(zoneId),
    []
  );

  const hasActiveDrag = useCallback(
    () => dragSessionRef.current != null || pendingDragRef.current != null,
    []
  );

  return {
    registerMarkerElement,
    handleMarkerPointerDown,
    handleMarkerPointerMove,
    handleMarkerPointerUp,
    isDraggingZone,
    hasActiveDrag,
    cancelPendingDrag,
    endDragSession,
    dragSessionRef,
  };
};

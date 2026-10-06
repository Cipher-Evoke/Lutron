// Shared heatmap pan/drag: drag only after the pointer moves past a threshold
// so a stationary click is not swallowed by pointer-events: none.

import { useCallback, useRef, useState } from "react";
import { DRAG_THRESHOLD_PX } from "./panDragThreshold";

export { DRAG_THRESHOLD_PX, shouldStartDrag } from "./panDragThreshold";

/**
 * Discriminate click vs pan. Committing to drag on mousedown moves the mouseup
 * target off the SVG and the browser never fires a click.
 */
export function usePanDrag({ scale, fitScale, pan, setPan }) {
  const [isDragging, setIsDragging] = useState(false);
  const pendingRef = useRef(null);
  const draggingRef = useRef(false);
  const dragOriginRef = useRef({ x: 0, y: 0 });

  const canPanNow = useCallback(() => {
    return scale > (fitScale || 0) + 0.001;
  }, [scale, fitScale]);

  const handleMouseDown = useCallback(
    (e) => {
      if (e.button !== 0) return;
      if (!canPanNow()) return;
      pendingRef.current = {
        originX: e.clientX,
        originY: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };
      draggingRef.current = false;
      e.preventDefault();
    },
    [canPanNow, pan.x, pan.y]
  );

  const handleMouseMove = useCallback(
    (e) => {
      const pending = pendingRef.current;
      if (pending && !draggingRef.current) {
        const dx = e.clientX - pending.originX;
        const dy = e.clientY - pending.originY;
        if (Math.hypot(dx, dy) >= DRAG_THRESHOLD_PX) {
          draggingRef.current = true;
          dragOriginRef.current = {
            x: pending.originX - pending.panX,
            y: pending.originY - pending.panY,
          };
          setIsDragging(true);
        }
      }

      if (draggingRef.current) {
        setPan({
          x: e.clientX - dragOriginRef.current.x,
          y: e.clientY - dragOriginRef.current.y,
        });
        e.preventDefault();
      }
    },
    [setPan]
  );

  const endDrag = useCallback(() => {
    pendingRef.current = null;
    if (draggingRef.current) {
      draggingRef.current = false;
      setIsDragging(false);
    }
  }, []);

  const handleMouseUp = useCallback(
    (e) => {
      if (draggingRef.current) {
        e.preventDefault();
      }
      endDrag();
    },
    [endDrag]
  );

  const handleMouseLeave = useCallback(() => {
    endDrag();
  }, [endDrag]);

  return {
    isDragging,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
  };
}

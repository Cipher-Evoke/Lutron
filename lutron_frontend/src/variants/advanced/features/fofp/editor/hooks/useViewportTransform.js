import { useCallback, useEffect, useRef } from "react";
import { clampZoom, computeCalibratedTransform } from "../../../../screens/settings/fofp/fofpViewportFit";
import { shouldApplyCalibratedFit } from "../../../../screens/settings/fofp/fofpViewAutoFit";

const WHEEL_ZOOM_FACTOR = 1.1;
const PAN_MARGIN = 80;

/**
 * Ref-based viewport pan/zoom (no React state per frame).
 */
export const useViewportTransform = ({
  viewportRef,
  contentRef,
  dims,
  calibratedBounds,
  onZoomChange,
}) => {
  const rafRef = useRef(null);
  const transformRef = useRef({ x: 0, y: 0, scale: 1 });
  const lastZoomPercentRef = useRef(100);
  const userAdjustedViewRef = useRef(false);

  const notifyZoomChange = useCallback(
    (scale) => {
      const percent = Math.round(scale * 100);
      if (percent !== lastZoomPercentRef.current) {
        lastZoomPercentRef.current = percent;
        if (typeof onZoomChange === "function") onZoomChange(percent);
      }
    },
    [onZoomChange]
  );

  const constrainTransform = useCallback(
    (next) => {
      const viewport = viewportRef.current;
      if (!viewport) return next;

      const viewportWidth = viewport.clientWidth;
      const viewportHeight = viewport.clientHeight;
      const scaledWidth = dims.width * next.scale;
      const scaledHeight = dims.height * next.scale;

      let minX;
      let maxX;
      if (scaledWidth <= viewportWidth) {
        minX = maxX = (viewportWidth - scaledWidth) / 2;
      } else {
        minX = viewportWidth - scaledWidth - PAN_MARGIN;
        maxX = PAN_MARGIN;
      }

      let minY;
      let maxY;
      if (scaledHeight <= viewportHeight) {
        minY = maxY = (viewportHeight - scaledHeight) / 2;
      } else {
        minY = viewportHeight - scaledHeight - PAN_MARGIN;
        maxY = PAN_MARGIN;
      }

      return {
        scale: clampZoom(next.scale),
        x: Math.min(maxX, Math.max(minX, next.x)),
        y: Math.min(maxY, Math.max(minY, next.y)),
      };
    },
    [dims.height, dims.width, viewportRef]
  );

  const applyTransform = useCallback(
    (next) => {
      const constrained = constrainTransform({
        ...next,
        scale: clampZoom(next.scale),
      });
      transformRef.current = constrained;

      // Apply immediately so Fit / + / − and initial fit survive React re-renders.
      const content = contentRef.current;
      if (content) {
        const { x, y, scale } = constrained;
        content.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
      }

      if (rafRef.current != null) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        notifyZoomChange(transformRef.current.scale);
      });
    },
    [constrainTransform, contentRef, notifyZoomChange]
  );

  const markViewAdjusted = useCallback(() => {
    userAdjustedViewRef.current = true;
  }, []);

  const applyCalibratedViewport = useCallback(
    (options = {}) => {
      const { force = false } = options;
      const viewport = viewportRef.current;

      if (!shouldApplyCalibratedFit(userAdjustedViewRef.current, force)) {
        if (viewport) applyTransform({ ...transformRef.current });
        return;
      }

      if (!viewport) {
        userAdjustedViewRef.current = false;
        applyTransform({ x: 0, y: 0, scale: 1 });
        return;
      }

      const next = computeCalibratedTransform(
        viewport.clientWidth,
        viewport.clientHeight,
        calibratedBounds
      );
      if (!next) return;
      userAdjustedViewRef.current = false;
      applyTransform(next);
    },
    [applyTransform, calibratedBounds, viewportRef]
  );

  const zoomAtCenter = useCallback(
    (zoomIn) => {
      markViewAdjusted();
      const viewport = viewportRef.current;
      if (!viewport) return;
      const rect = viewport.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const current = transformRef.current;
      const nextScale = clampZoom(
        current.scale * (zoomIn ? WHEEL_ZOOM_FACTOR : 1 / WHEEL_ZOOM_FACTOR)
      );
      const worldX = (cx - current.x) / current.scale;
      const worldY = (cy - current.y) / current.scale;
      applyTransform({
        scale: nextScale,
        x: cx - worldX * nextScale,
        y: cy - worldY * nextScale,
      });
    },
    [applyTransform, markViewAdjusted, viewportRef]
  );

  const zoomAtCursor = useCallback(
    (clientX, clientY, deltaY) => {
      markViewAdjusted();
      const viewport = viewportRef.current;
      if (!viewport) return;
      const rect = viewport.getBoundingClientRect();
      const cursorX = clientX - rect.left;
      const cursorY = clientY - rect.top;
      const current = transformRef.current;
      const nextScale = clampZoom(
        current.scale *
          (deltaY < 0 ? WHEEL_ZOOM_FACTOR : 1 / WHEEL_ZOOM_FACTOR)
      );
      const worldX = (cursorX - current.x) / current.scale;
      const worldY = (cursorY - current.y) / current.scale;
      applyTransform({
        scale: nextScale,
        x: cursorX - worldX * nextScale,
        y: cursorY - worldY * nextScale,
      });
    },
    [applyTransform, markViewAdjusted, viewportRef]
  );

  const panByDelta = useCallback(
    (dx, dy) => {
      const current = transformRef.current;
      applyTransform({
        ...current,
        x: current.x + dx,
        y: current.y + dy,
      });
    },
    [applyTransform]
  );

  const resetUserAdjusted = useCallback(() => {
    userAdjustedViewRef.current = false;
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return {
    transformRef,
    applyTransform,
    applyCalibratedViewport,
    markViewAdjusted,
    zoomAtCenter,
    zoomAtCursor,
    panByDelta,
    resetUserAdjusted,
    userAdjustedViewRef,
    WHEEL_ZOOM_FACTOR,
  };
};

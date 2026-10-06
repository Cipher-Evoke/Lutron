import React, { useMemo, useCallback, useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { Resizable } from 're-resizable';
import { useGraphSize } from '../../utils/useGraphSize';
import { updateGraphSize } from '../../utils/graphSizesStore';
import { UseAuth, isSuperadminRole } from '../../customhooks/UseAuth';

function isFillParentHeight(height) {
  if (height === '100%' || height === 'auto') return true;
  if (typeof height === 'string' && height.endsWith('%')) return true;
  return false;
}

const ENABLE = {
  top: false,
  right: true,
  bottom: true,
  bottomRight: false,
  bottomLeft: false,
  topLeft: false,
  topRight: false,
  left: false,
};

/**
 * Explicit size wrapper for ResponsiveContainer. Optional session-only resize
 * (sizes reset on full page reload when using in-memory graphSizesStore).
 * Drag-resize is Superadmin-only; Admin/Operator see saved sizes but cannot change them.
 */
export default function ChartSizeBox({ graphId, graph, sx, resizable = true, children }) {
  const { role } = UseAuth();
  const allowResize = Boolean(resizable) && isSuperadminRole(role);
  const parentRef = useRef(null);
  const defaults = useMemo(
    () => ({
      width: graph?.width != null ? graph.width : '100%',
      height: graph?.height != null ? graph.height : '100%',
    }),
    [graph?.width, graph?.height]
  );
  const size = useGraphSize(graphId, defaults);
  const fill = isFillParentHeight(size.height);

  // If the parent card changes size (e.g., card row/col span toggles),
  // keep the chart synced to the card by snapping back to 100% sizing.
  // This avoids "stuck" pixel sizes after a user resizes the card.
  useEffect(() => {
    if (!graphId) return;
    const el = parentRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    let raf = 0;
    const ro = new ResizeObserver(() => {
      // Debounce to next frame to avoid resize loops.
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        // Only snap back when we're in pixel sizing (i.e., not already filling parent).
        if (!isFillParentHeight(size.height) || !isFillParentHeight(size.width)) {
          updateGraphSize(graphId, '100%', '100%');
        }
      });
    });

    ro.observe(el);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [graphId, size.height, size.width]);

  const onResizeStop = useCallback(
    (_e, _dir, el) => {
      if (!allowResize || !graphId || !el) return;
      updateGraphSize(graphId, el.offsetWidth, el.offsetHeight);
    },
    [allowResize, graphId]
  );

  const onResizeStart = useCallback(
    (e, _dir, el) => {
      if (!allowResize) return;
      if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
      // If the wrapper is currently using %/auto sizing, snap to pixel size at drag start
      // so resizing behaves predictably.
      if (!graphId || !el) return;
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (typeof size.width !== 'number' || typeof size.height !== 'number') {
        updateGraphSize(graphId, w, h);
      }
    },
    [allowResize, graphId, size.width, size.height]
  );

  const outerSx = {
    position: 'relative',
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    ...(fill ? { flex: 1, alignSelf: 'stretch', width: '100%' } : { flexShrink: 0 }),
    ...sx,
  };

  const inner = (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
      }}
    >
      {children}
    </Box>
  );

  if (!allowResize || !graphId) {
    return (
      <Box
        ref={parentRef}
        sx={{
          width: size.width,
          height: size.height,
          ...outerSx,
        }}
      >
        {inner}
      </Box>
    );
  }

  return (
    <Box ref={parentRef} sx={outerSx}>
      <Resizable
        size={{ width: size.width, height: size.height }}
        minWidth={200}
        minHeight={160}
        maxWidth="100%"
        bounds="parent"
        enable={ENABLE}
        onResizeStart={onResizeStart}
        onResizeStop={onResizeStop}
        style={{
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          flex: fill ? '1 1 auto' : undefined,
          minHeight: 0,
          width: fill ? '100%' : undefined,
          maxWidth: '100%',
        }}
        handleStyles={{
          right: { width: 10, right: 0, zIndex: 5, cursor: 'ew-resize', background: 'transparent' },
          bottom: { height: 10, bottom: 0, zIndex: 5, cursor: 'ns-resize', background: 'transparent' },
        }}
      >
        {inner}
      </Resizable>
    </Box>
  );
}

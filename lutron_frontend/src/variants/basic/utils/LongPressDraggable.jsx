import React, { useState, useRef, useCallback, useEffect } from "react";
import { Box } from "@mui/material";
import { arrayMove } from "./draggableReflowOrder";

const DEFAULT_HOLD_MS = 5000;
/**
 * Only treat movement as "user scrolled / wrong gesture" in the first part of the hold.
 * After that, small jitter is ignored so a real 5s hold can complete.
 */
const EARLY_HOLD_CANCEL_MS = 1500;
/** Max movement from press point during early window before we cancel the hold. */
const EARLY_CANCEL_MOVE_PX = 80;

/** Use boolean so add/removeListener always matches (object options are new refs each render). */
const WINDOW_CAPTURE = true;

function readStoredOffset(storageKey) {
  try {
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) return { x: 0, y: 0 };
    const o = JSON.parse(raw);
    if (typeof o.x === "number" && typeof o.y === "number") return { x: o.x, y: o.y };
  } catch {
    /* ignore */
  }
  return { x: 0, y: 0 };
}

/**
 * Optional `reflow`: on drag release, reorder with the slot under the pointer so charts reflow
 * in document order (no overlap). `translateStorageKeys` clears saved pixel offsets.
 *
 * @typedef {object} ReflowConfig
 * @property {string} groupKey
 * @property {string} slotId
 * @property {string[]} orderedSlotIds
 * @property {(nextOrder: string[]) => void} onReorder
 * @property {string[]} [translateStorageKeys]
 */

/**
 * Wraps dashboard charts: after holding pointer ~5s without moving much, chart can be dragged;
 * releasing pointer stops drag. Uses transform during drag; optional reflow commits to list order.
 */
export default function LongPressDraggable({
  children,
  storageKey,
  disabled = false,
  holdMs = DEFAULT_HOLD_MS,
  /** @type {ReflowConfig|undefined} */
  reflow,
}) {
  const [offset, setOffset] = useState(() => readStoredOffset(storageKey));
  const [active, setActive] = useState(false);
  const [dragging, setDragging] = useState(false);

  const modeRef = useRef("idle");
  const holdTimerRef = useRef(null);
  const holdStartedAtRef = useRef(0);
  const startClientRef = useRef({ x: 0, y: 0 });
  const lastClientRef = useRef({ x: 0, y: 0 });
  const anchorRef = useRef({ x: 0, y: 0 });
  const baseOffsetRef = useRef({ x: 0, y: 0 });
  const offsetRef = useRef(offset);
  /** Which pointer started this session (multi-touch / multi-button safe). */
  const activePointerIdRef = useRef(null);
  const removeListenersRef = useRef(() => {
    /* no-op until pointer session attaches window listeners */
  });
  const rootRef = useRef(null);
  const reflowRef = useRef(reflow);
  useEffect(() => {
    reflowRef.current = reflow;
  }, [reflow]);

  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  const persist = useCallback(
    (next) => {
      offsetRef.current = next;
      setOffset(next);
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* quota / private */
      }
    },
    [storageKey]
  );

  /**
   * View-only mode (Admin/Operator): keep the same visual position as Superadmin (shared session offsets),
   * but disable interactions. Do NOT persist resets here; otherwise a view-only user would erase the
   * Superadmin's saved positions when they open the dashboard.
   */

  const clearHoldTimer = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  const tearDown = useCallback(() => {
    clearHoldTimer();
    removeListenersRef.current();
    activePointerIdRef.current = null;
    modeRef.current = "idle";
    setActive(false);
    setDragging(false);
  }, [clearHoldTimer]);

  useEffect(() => () => tearDown(), [tearDown]);

  const clearTranslateKeys = useCallback((keys) => {
    if (!keys || !keys.length) return;
    for (const k of keys) {
      try {
        sessionStorage.removeItem(k);
      } catch {
        /* ignore */
      }
    }
  }, []);

  const tryCommitReflow = useCallback(
    (pointerX, pointerY, wasDragging) => {
      const rf = reflowRef.current;
      if (!wasDragging || !rf || !rf.groupKey || !rf.slotId || !Array.isArray(rf.orderedSlotIds)) {
        return false;
      }
      const { groupKey, slotId, orderedSlotIds, onReorder, translateStorageKeys } = rf;
      if (orderedSlotIds.length < 2) return false;

      const selfRoot = rootRef.current;
      let targetSlot = null;
      try {
        const els = document.elementsFromPoint(pointerX, pointerY);
        for (const el of els) {
          const node = el.closest?.("[data-draggable-slot]");
          if (!node || !node.closest?.(`[data-draggable-group="${groupKey}"]`)) continue;
          if (node === selfRoot) continue;
          const sid = node.getAttribute("data-draggable-slot");
          if (sid && sid !== slotId && orderedSlotIds.includes(sid)) {
            targetSlot = sid;
            break;
          }
        }
      } catch {
        /* elementsFromPoint can throw in rare cases */
      }

      /* No "nearest slot by Y" fallback: it fired on almost every release when 2+ charts
       * were visible (pointer often not over another card after a small translate), which
       * reordered slots and cleared saved offsets — unlike charts without reflow. */

      if (!targetSlot) return false;

      const fromIdx = orderedSlotIds.indexOf(slotId);
      const toIdx = orderedSlotIds.indexOf(targetSlot);
      if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return false;

      const nextOrder = arrayMove(orderedSlotIds, fromIdx, toIdx);
      onReorder(nextOrder);
      clearTranslateKeys(translateStorageKeys);
      return true;
    },
    [clearTranslateKeys]
  );

  const onPointerDown = useCallback(
    (e) => {
      if (disabled) return;
      // Touch / pen primary; mouse left only (trackpad tap = 0)
      if (typeof e.button === "number" && e.button !== 0) return;
      if (
        e.target.closest &&
        e.target.closest(
          "a, button, select, input, textarea, [role='slider'], [role='button'], [contenteditable='true']"
        )
      ) {
        return;
      }

      // Avoid stacking two sessions if something double-fires
      if (modeRef.current !== "idle") {
        tearDown();
      }

      const pointerId =
        typeof e.pointerId === "number" && !Number.isNaN(e.pointerId) ? e.pointerId : null;
      activePointerIdRef.current = pointerId;

      modeRef.current = "holding";
      setActive(true);
      setDragging(false);
      holdStartedAtRef.current = typeof performance !== "undefined" ? performance.now() : Date.now();
      startClientRef.current = { x: e.clientX, y: e.clientY };
      lastClientRef.current = { x: e.clientX, y: e.clientY };

      const matchesPointer = (ev) => {
        if (activePointerIdRef.current == null) return true;
        return ev.pointerId === activePointerIdRef.current;
      };

      const onMove = (ev) => {
        if (!matchesPointer(ev)) return;
        lastClientRef.current = { x: ev.clientX, y: ev.clientY };

        if (modeRef.current === "dragging") {
          const dx = ev.clientX - anchorRef.current.x;
          const dy = ev.clientY - anchorRef.current.y;
          persist({
            x: baseOffsetRef.current.x + dx,
            y: baseOffsetRef.current.y + dy,
          });
          return;
        }

        if (modeRef.current !== "holding") return;
        const now = typeof performance !== "undefined" ? performance.now() : Date.now();
        const elapsed = now - holdStartedAtRef.current;
        if (elapsed < EARLY_HOLD_CANCEL_MS) {
          const dx = ev.clientX - startClientRef.current.x;
          const dy = ev.clientY - startClientRef.current.y;
          if (Math.hypot(dx, dy) > EARLY_CANCEL_MOVE_PX) {
            tearDown();
          }
        }
      };

      const onUp = (ev) => {
        if (ev && !matchesPointer(ev)) return;
        const wasDragging = modeRef.current === "dragging";
        const px = lastClientRef.current.x;
        const py = lastClientRef.current.y;
        activePointerIdRef.current = null;
        clearHoldTimer();
        removeListenersRef.current();
        if (modeRef.current === "dragging" || modeRef.current === "holding") {
          modeRef.current = "idle";
          setActive(false);
          setDragging(false);
        }
        if (wasDragging) {
          const didReorder = tryCommitReflow(px, py, true);
          if (didReorder) {
            persist({ x: 0, y: 0 });
          }
        }
      };

      const remove = () => {
        window.removeEventListener("pointermove", onMove, WINDOW_CAPTURE);
        window.removeEventListener("pointerup", onUp, WINDOW_CAPTURE);
        window.removeEventListener("pointercancel", onUp, WINDOW_CAPTURE);
        window.removeEventListener("lostpointercapture", onUp, WINDOW_CAPTURE);
      };
      removeListenersRef.current = remove;

      // Capture phase: runs before Recharts / inner handlers that stopPropagation,
      // so hold + drag still receive pointermove on trackpad / mouse.
      window.addEventListener("pointermove", onMove, WINDOW_CAPTURE);
      window.addEventListener("pointerup", onUp, WINDOW_CAPTURE);
      window.addEventListener("pointercancel", onUp, WINDOW_CAPTURE);
      window.addEventListener("lostpointercapture", onUp, WINDOW_CAPTURE);

      holdTimerRef.current = setTimeout(() => {
        if (modeRef.current !== "holding") return;
        modeRef.current = "dragging";
        setDragging(true);
        anchorRef.current = { ...lastClientRef.current };
        baseOffsetRef.current = { ...offsetRef.current };
      }, holdMs);
    },
    [disabled, holdMs, persist, tearDown, clearHoldTimer, tryCommitReflow]
  );

  const groupKey = reflow?.groupKey;
  const slotId = reflow?.slotId;

  return (
    <Box
      ref={rootRef}
      data-draggable-group={groupKey || undefined}
      data-draggable-slot={slotId || undefined}
      onPointerDownCapture={onPointerDown}
      sx={{
        position: "relative",
        width: "100%",
        minWidth: 0,
        alignSelf: groupKey === "space-charts-tab" ? "flex-start" : "stretch",
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        zIndex: dragging ? 20 : "auto",
        // While armed or dragging, reduce browser / trackpad stealing the gesture as scroll.
        touchAction: active ? "none" : undefined,
        userSelect: active ? "none" : undefined,
        cursor: dragging ? "grabbing" : active ? "progress" : "default",
        transition: dragging ? "none" : "box-shadow 0.2s",
        boxShadow: dragging ? "0 12px 40px rgba(0,0,0,0.25)" : "none",
        borderRadius: 1,
      }}
    >
      {children}
    </Box>
  );
}

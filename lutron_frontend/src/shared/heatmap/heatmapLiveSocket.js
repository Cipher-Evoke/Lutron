import { getValidToken } from "../auth/authToken";
import { clearSessionAndRedirectToLogin } from "../auth/sessionRedirect";
import { resolveApiOrigin } from "../utils/resolveMediaUrl";

const RECONNECT_BASE_MS = 2000;
const RECONNECT_MAX_MS = 30000;

/** Application close code used by `/ws/heatmap/live` on failed JWT auth. */
export const WS_UNAUTHORIZED_CLOSE_CODE = 4401;

export function buildHeatmapLiveWsUrl(token) {
  const apiBase = String(resolveApiOrigin()).replace(/\/$/, "");
  const wsBase = apiBase.replace(/^http/i, (match) =>
    match.toLowerCase() === "https" ? "wss" : "ws"
  );
  const encoded = encodeURIComponent(token);
  return `${wsBase}/ws/heatmap/live?token=${encoded}`;
}

/**
 * True when the server (or equivalent) closed the socket for auth failure.
 * Backend closes with code 4401 / reason "Unauthorized" after accept().
 */
export function isUnauthorizedWebSocketClose(event) {
  if (!event) return false;
  const code = Number(event.code);
  if (code === WS_UNAUTHORIZED_CLOSE_CODE) return true;
  const reason = String(event.reason || "").toLowerCase();
  return reason.includes("unauthorized");
}

/**
 * One WebSocket per heatmap tab. Replaces timer polling for live map/sidebar.
 *
 * Reconnect policy:
 * - Network / server restart / temporary disconnect → exponential backoff reconnect
 * - Auth failure (4401 / missing or expired local token) → clear session, redirect
 *   to login once, and stop reconnecting
 */
export function createHeatmapLiveSocket(handlers = {}) {
  let socket = null;
  let reconnectTimer = null;
  let reconnectAttempt = 0;
  let closedByUser = false;
  let authFailureHandled = false;
  let subscription = {
    floor_id: null,
    area_id: null,
    display_mode: "Light",
  };

  const clearReconnect = () => {
    if (reconnectTimer) {
      window.clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const handleAuthFailure = () => {
    if (authFailureHandled || closedByUser) return;
    authFailureHandled = true;
    closedByUser = true;
    clearReconnect();
    if (typeof handlers.onAuthFailure === "function") {
      try {
        handlers.onAuthFailure();
      } catch {
        // ignore handler errors
      }
    }
    clearSessionAndRedirectToLogin();
  };

  const sendSubscribe = () => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(
      JSON.stringify({
        action: "subscribe",
        floor_id: subscription.floor_id,
        area_id: subscription.area_id,
        display_mode: subscription.display_mode,
      })
    );
  };

  const scheduleReconnect = () => {
    if (closedByUser || authFailureHandled) return;
    clearReconnect();
    const delay = Math.min(
      RECONNECT_MAX_MS,
      RECONNECT_BASE_MS * 2 ** reconnectAttempt
    );
    reconnectAttempt += 1;
    reconnectTimer = window.setTimeout(() => {
      connect();
    }, delay);
  };

  const connect = () => {
    if (closedByUser || authFailureHandled) return;

    const token = getValidToken();
    if (!token) {
      // Expired / missing local JWT will never succeed — do not reconnect-storm.
      handleAuthFailure();
      return;
    }

    try {
      if (
        socket &&
        (socket.readyState === WebSocket.OPEN ||
          socket.readyState === WebSocket.CONNECTING)
      ) {
        return;
      }
      socket = new WebSocket(buildHeatmapLiveWsUrl(token));
    } catch (error) {
      scheduleReconnect();
      return;
    }

    socket.onopen = () => {
      reconnectAttempt = 0;
      sendSubscribe();
      if (typeof handlers.onOpen === "function") {
        handlers.onOpen();
      }
    };

    socket.onmessage = (event) => {
      let message;
      try {
        message = JSON.parse(event.data);
      } catch (error) {
        return;
      }

      const { type, payload } = message || {};
      if (type === "floor_light" && payload && handlers.onFloorLight) {
        handlers.onFloorLight(payload);
      } else if (
        type === "floor_occupancy" &&
        payload &&
        handlers.onFloorOccupancy
      ) {
        handlers.onFloorOccupancy(payload);
      } else if (type === "area_status" && payload && handlers.onAreaStatus) {
        handlers.onAreaStatus(payload);
      }
    };

    socket.onclose = (event) => {
      socket = null;
      if (closedByUser || authFailureHandled) return;
      if (isUnauthorizedWebSocketClose(event)) {
        handleAuthFailure();
        return;
      }
      scheduleReconnect();
    };

    socket.onerror = () => {
      try {
        socket?.close();
      } catch (error) {
        // ignore
      }
    };
  };

  return {
    subscribe(next) {
      subscription = {
        floor_id: next.floorId ?? null,
        area_id: next.areaId ?? null,
        display_mode: next.displayMode ?? "Light",
      };
      sendSubscribe();
    },
    start() {
      closedByUser = false;
      authFailureHandled = false;
      connect();
    },
    close() {
      closedByUser = true;
      clearReconnect();
      if (socket) {
        try {
          socket.close();
        } catch (error) {
          // ignore
        }
        socket = null;
      }
    },
    /** Test / diagnostics: whether auth failure already stopped reconnect. */
    isAuthFailureHandled() {
      return authFailureHandled;
    },
    /** Test / diagnostics: pending reconnect timer present. */
    hasPendingReconnect() {
      return reconnectTimer != null;
    },
    getReconnectAttempt() {
      return reconnectAttempt;
    },
  };
}

export default createHeatmapLiveSocket;

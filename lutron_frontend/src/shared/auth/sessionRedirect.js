/**
 * Clear browser session and redirect to login once.
 * Shared by axios interceptors' pattern and WebSocket auth failure handling.
 * Uses the same sessionStorage guard so HTTP + WS failures do not double-redirect.
 */

import {
  AUTH_REDIRECT_FLAG_KEY,
  clearAuthRedirectFlag,
} from "../../utils/authRedirectGuard";

const SESSION_KEYS = ["lutron", "role", "permission", "userEmail"];

function isOnLoginPage() {
  if (typeof window === "undefined" || !window.location) return false;
  const path = window.location.pathname;
  return path === "/login" || path === "/";
}

export function clearAuthSessionStorage() {
  try {
    SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {
    // ignore storage errors — redirect still matters
  }
}

/**
 * @returns {boolean} true when a redirect was initiated (or already in progress)
 */
export function clearSessionAndRedirectToLogin() {
  if (typeof window === "undefined") return false;

  try {
    if (sessionStorage.getItem(AUTH_REDIRECT_FLAG_KEY)) {
      return true;
    }
    sessionStorage.setItem(AUTH_REDIRECT_FLAG_KEY, "1");
  } catch {
    // proceed without the flag if storage is unavailable
  }

  clearAuthSessionStorage();

  if (isOnLoginPage()) {
    clearAuthRedirectFlag();
    return false;
  }

  try {
    window.location.replace("/login");
  } catch {
    try {
      window.location.href = "/login";
    } catch {
      window.location = "/login";
    }
  }
  return true;
}

/**
 * Token helpers for axios interceptors — no BaseUrl / Redux imports (avoids circular deps).
 */

export function getToken() {
  return localStorage.getItem("lutron");
}

export function validateToken(token) {
  if (!token) return false;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    const payload = JSON.parse(atob(parts[1]));
    const currentTime = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < currentTime) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export function getValidToken() {
  const token = getToken();
  return validateToken(token) ? token : null;
}

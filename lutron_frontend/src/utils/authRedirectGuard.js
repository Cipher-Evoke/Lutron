/** Session flag set during auth-failure redirects; must not block fresh login attempts. */
export const AUTH_REDIRECT_FLAG_KEY = 'lutronRedirectInProgress';

export function clearAuthRedirectFlag() {
  try {
    sessionStorage.removeItem(AUTH_REDIRECT_FLAG_KEY);
  } catch {
    // ignore storage errors
  }
}

/**
 * Shared auth-failure detection for axios interceptors and global error handlers.
 * 403 = floor/permission denied — must NOT trigger login redirect.
 */
export function isAuthTokenError({ message, status, apiMessage } = {}) {
  if (status === 401) return true;

  const msg = typeof message === 'string' ? message : '';
  if (msg.includes('No valid authentication token')) return true;
  if (msg.includes('authentication token')) return true;
  if (msg.includes('Authentication failure')) return true;

  if (status === 401) {
    const api = String(apiMessage || '').toLowerCase();
    return api.includes('token') || api.includes('expired');
  }

  return false;
}

export function getApiErrorMessage(error) {
  return String(error?.response?.data?.message || error?.response?.data?.detail || '');
}

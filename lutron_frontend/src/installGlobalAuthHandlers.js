import { isAuthTokenError } from './shared/utils/authErrorDetection';

/**
 * Global auth-error handlers (moved from variant index.js for single CRA entry).
 */
export function installGlobalAuthHandlers(redirectToLogin, redirectFlagKey) {
  if (window.__lutronGlobalHandlersInstalled) return;
  window.__lutronGlobalHandlersInstalled = true;

  let errorCount = 0;
  let lastErrorTime = Date.now();
  const ERROR_WINDOW = 10000;

  const resetErrorCount = () => {
    errorCount = 0;
    lastErrorTime = Date.now();
  };

  const clearRedirectGuard = () => {
    sessionStorage.removeItem(redirectFlagKey);
    resetErrorCount();
  };

  // Clear stale redirect flag immediately — the window "load" event may have
  // already fired before variant modules (and this installer) were ready.
  clearRedirectGuard();

  const onGlobalError = (event) => {
    const error = event?.error || event;
    const now = Date.now();
    if (now - lastErrorTime > ERROR_WINDOW) resetErrorCount();
    errorCount++;
    lastErrorTime = now;
    if (isAuthTokenError({ message: error?.message })) {
      console.warn(`Redirecting due to auth error: ${error?.message}`);
      redirectToLogin();
    }
  };

  const onUnhandledRejection = (event) => {
    const reason = event?.reason || event;
    const now = Date.now();
    if (now - lastErrorTime > ERROR_WINDOW) resetErrorCount();
    errorCount++;
    lastErrorTime = now;
    if (
      isAuthTokenError({
        message: reason?.message,
        status: reason?.response?.status,
        apiMessage: reason?.response?.data?.message || reason?.response?.data?.detail,
      })
    ) {
      console.warn(`Redirecting due to auth rejection: ${reason?.message || reason}`);
      redirectToLogin();
    }
  };

  window.addEventListener('error', onGlobalError);
  window.addEventListener('unhandledrejection', onUnhandledRejection);

  window.addEventListener('popstate', clearRedirectGuard);
  window.addEventListener('load', clearRedirectGuard);
}

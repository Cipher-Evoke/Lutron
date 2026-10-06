import axios from "axios";
import { getToken, getValidToken } from "../../shared/auth/authToken";
import {
  getApiErrorMessage,
  isAuthTokenError,
} from "../../shared/utils/authErrorDetection";
import {
  AUTH_REDIRECT_FLAG_KEY,
  clearAuthRedirectFlag,
} from "../../utils/authRedirectGuard";

const DEFAULT_API = "https://lutron.onrender.com";

function resolveApiBaseUrl() {
  const raw = (process.env.REACT_APP_API_URL || DEFAULT_API).replace(/\/+$/, '');
  if (typeof window === "undefined" || !window.location?.hostname) {
    return raw;
  }
  try {
    const pageHost = window.location.hostname;
    const pageProto = window.location.protocol || "http:";
    const u = new URL(raw);
    const bakedHost = (u.hostname || "").toLowerCase();
    const isLoopback =
      bakedHost === "" ||
      bakedHost === "localhost" ||
      bakedHost === "127.0.0.1" ||
      bakedHost === "::1";
    // Split cloud deploy (Netlify UI + Render API): the baked URL points at a
    // real backend host — use it exactly, never graft the page hostname onto it.
    if (!isLoopback) {
      return raw;
    }
    // HTTPS page = hosted UI (Netlify). Grafting ":8000" onto it can never work;
    // the build must bake REACT_APP_API_URL. Return raw so a missing backend
    // URL fails loudly instead of calling https://<ui-host>:8000.
    if (pageProto === "https:") {
      return raw;
    }
    // Same-host LAN / packaged install over plain HTTP: the API lives on the
    // page host at the baked port (e.g. http://192.168.x.x:3000 -> :8000).
    return `${pageProto}//${pageHost}:${u.port || "8000"}`;
  } catch {
    return raw;
  }
}

export const BaseUrl = axios.create({
  baseURL: resolveApiBaseUrl(),
});

// Track redirect state to prevent multiple redirects
let redirectInProgress = false;
let redirectTimeout = null;
const redirectFlagKey = AUTH_REDIRECT_FLAG_KEY;

/** Reset redirect guard so login and other public requests are not blocked. */
export function resetAuthRedirectGuard() {
  redirectInProgress = false;
  clearAuthRedirectFlag();
}

// Track pending requests to cancel them when redirect happens
const pendingRequests = new Set();
const requestCancelTokens = new Map(); // Map to store cancel tokens for each request

// Track consecutive API failures to detect unresponsiveness
let consecutiveFailures = 0;
let lastFailureTime = Date.now();
const MAX_CONSECUTIVE_FAILURES = 10; // Redirect after 10 consecutive failures
const FAILURE_WINDOW = 15000; // Within 15 seconds

// Helper function to cancel all pending requests
const cancelAllPendingRequests = () => {
  // Cancel all pending requests using their cancel tokens
  requestCancelTokens.forEach((cancelToken, requestId) => {
    try {
      if (cancelToken && typeof cancelToken === 'function') {
        cancelToken('Redirecting to login');
      }
    } catch (error) {
      // Ignore cancel errors
    }
  });
  requestCancelTokens.clear();
  pendingRequests.clear();
};

// Helper function to redirect to login and clear auth data.
// Redirects IMMEDIATELY without any delay to prevent "Page Unresponsive" prompt
const redirectToLogin = () => {
  // Check if redirect is already in progress
  if (redirectInProgress || sessionStorage.getItem(redirectFlagKey)) {
    return;
  }

  // Set flags immediately to prevent other calls
  redirectInProgress = true;
  sessionStorage.setItem(redirectFlagKey, '1');

  // Cancel ALL pending requests immediately to prevent them from completing
  cancelAllPendingRequests();

  // Clear any pending redirect timeout
  if (redirectTimeout) {
    clearTimeout(redirectTimeout);
  }

  // Clear auth data synchronously but quickly
  try {
    localStorage.removeItem("lutron");
    localStorage.removeItem("role");
    localStorage.removeItem("permission");
    localStorage.removeItem("userEmail");
  } catch (storageError) {
    // Ignore storage errors - redirect is more important
  }
  
  const isOnLoginPage = window.location.pathname === '/login' || window.location.pathname === '/';
  if (!isOnLoginPage) {
    // Redirect IMMEDIATELY without setTimeout to prevent "Page Unresponsive" prompt
    // Use replace instead of href to avoid adding to history
    try {
      window.location.replace("/login");
    } catch (error) {
      // If replace fails, try href as fallback
      try {
        window.location.href = "/login";
      } catch (e) {
        // Last resort - use window.location directly
        window.location = "/login";
      }
    }
  } else {
    // Reset flag if already on login page
    redirectInProgress = false;
    sessionStorage.removeItem(redirectFlagKey);
  }
};

// Add a request interceptor
BaseUrl.interceptors.request.use(
  (config) => {
    const isLoginRequest = config.url && config.url.includes('/auth/login');
    const isOnLoginPage =
      window.location.pathname === '/login' || window.location.pathname === '/';

    if (isOnLoginPage) {
      resetAuthRedirectGuard();
    }

    // Never block login — a stale redirect flag would trap users on the login page
    if (
      !isLoginRequest &&
      (redirectInProgress || sessionStorage.getItem(redirectFlagKey))
    ) {
      return Promise.reject(new Error('Redirect in progress'));
    }

    // List of endpoints that don't require authentication
    const publicEndpoints = [
      '/theme/',
      '/auth/login',
    ];

    // Check if the current request URL is in the public endpoints list
    const isPublicEndpoint = publicEndpoints.some(endpoint =>
      config.url && config.url.includes(endpoint)
    );

    // For protected endpoints, check if we have a valid token
    if (!isPublicEndpoint) {
      const validToken = getValidToken();
      if (!validToken) {
        // Token expired or invalid - redirect to login immediately
        // Redirect synchronously to prevent multiple requests from piling up
        redirectToLogin();
        // Cancel the request immediately
        return Promise.reject(new Error('No valid authentication token'));
      }
      config.headers.Authorization = `Bearer ${validToken}`;
    } else {
      // For public endpoints, add token if it exists
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Track this request and create cancel token
    const requestId = `${Date.now()}-${Math.random()}`;
    config.requestId = requestId;
    pendingRequests.add(requestId);
    
    // Create cancel token for this request
    const CancelToken = axios.CancelToken;
    const source = CancelToken.source();
    config.cancelToken = source.token;
    requestCancelTokens.set(requestId, source.cancel);

    // API Request logging removed for production
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
BaseUrl.interceptors.response.use(
  (response) => {
    // Remove request from pending list
    if (response.config?.requestId) {
      pendingRequests.delete(response.config.requestId);
      requestCancelTokens.delete(response.config.requestId);
    }
    
    // Reset consecutive failures on successful response
    consecutiveFailures = 0;
    lastFailureTime = Date.now();
    
    // API Response logging removed for production
    return response;
  },
  (error) => {
    // Remove request from pending list
    if (error.config?.requestId) {
      pendingRequests.delete(error.config.requestId);
      requestCancelTokens.delete(error.config.requestId);
    }

    // If redirect is in progress, don't process this error further
    if (redirectInProgress || sessionStorage.getItem(redirectFlagKey)) {
      return Promise.reject(new Error('Redirect in progress'));
    }
    
    // If this is a canceled request, don't redirect
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    // API Error logging removed for production
    
    // Only redirect to login for 401/403 errors on protected endpoints
    const publicEndpoints = [
      '/theme/',
      '/auth/login',
    ];
    
    const isPublicEndpoint = publicEndpoints.some(endpoint => 
      error.config?.url && error.config.url.includes(endpoint)
    );
    
    // Don't redirect for login endpoint errors
    const isLoginEndpoint = error.config?.url && error.config.url.includes('/auth/login');
    
    // Don't redirect for change_password endpoint errors (let the component handle it)
    const isChangePasswordEndpoint = error.config?.url && error.config.url.includes('/auth/change_password');

    // FOFP admin APIs: show errors in the settings UI instead of forcing login redirect
    const isFofpEndpoint = error.config?.url && error.config.url.includes('/fofp/');
    
    // Don't redirect if we're already on the login page or change password page
    const isOnLoginPage = window.location.pathname === '/login' || window.location.pathname === '/';
    const isOnChangePasswordPage = window.location.pathname === '/auth/change_password';
    
    // 401 / missing token → login. 403 is floor permission denied — stay on page.
    const isTokenError = isAuthTokenError({
      message: error.message,
      status: error.response?.status,
      apiMessage: getApiErrorMessage(error),
    });

    // For Token-specific errors on protected endpoints, redirect IMMEDIATELY to login
    if (isTokenError && !isPublicEndpoint && !isLoginEndpoint && !isChangePasswordEndpoint && !isFofpEndpoint && !isOnLoginPage && !isOnChangePasswordPage) {
      // Redirect IMMEDIATELY on token failure
      redirectToLogin();
      // Return immediately to stop processing
      return Promise.reject(new Error('Authentication failure - redirecting to login'));
    }
    
    // For other API failures (500, 404, etc. that are not auth related), 
    // we don't redirect to login, let the component handle the error
    
    return Promise.reject(error);
  }
);
import axios from "axios";
import { getToken, getValidToken } from "./redux/slice/auth/userlogin";

export const BaseUrl = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000",
});

// Track redirect state to prevent multiple redirects
let redirectInProgress = false;
let redirectTimeout = null;
const redirectFlagKey = 'lutronRedirectInProgress';

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
    // Check if redirect is already in progress - if so, cancel ALL requests immediately
    if (redirectInProgress || sessionStorage.getItem(redirectFlagKey)) {
      return Promise.reject(new Error('Redirect in progress'));
    }

    // List of endpoints that don't require authentication
    const publicEndpoints = [
      '/theme/',
      '/auth/login',
      '/users',
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
      '/users',
    ];
    
    const isPublicEndpoint = publicEndpoints.some(endpoint => 
      error.config?.url && error.config.url.includes(endpoint)
    );
    
    // Don't redirect for login endpoint errors
    const isLoginEndpoint = error.config?.url && error.config.url.includes('/auth/login');
    
    // Don't redirect for change_password endpoint errors (let the component handle it)
    const isChangePasswordEndpoint = error.config?.url && error.config.url.includes('/auth/change_password');
    
    // Don't redirect if we're already on the login page or change password page
    const isOnLoginPage = window.location.pathname === '/login' || window.location.pathname === '/';
    const isOnChangePasswordPage = window.location.pathname === '/auth/change_password';
    
    // Check for token expiration or authentication errors
    const isTokenError = 
      error.response?.status === 401 || 
      error.response?.status === 403 ||
      error.message?.includes('No valid authentication token') ||
      error.message?.includes('authentication token') ||
      error.response?.data?.message?.toLowerCase().includes('token') ||
      error.response?.data?.message?.toLowerCase().includes('expired') ||
      error.response?.data?.message?.toLowerCase().includes('unauthorized') ||
      error.response?.data?.message?.toLowerCase().includes('forbidden');
    
    // For Token-specific errors on protected endpoints, redirect IMMEDIATELY to login
    if (isTokenError && !isPublicEndpoint && !isLoginEndpoint && !isChangePasswordEndpoint && !isOnLoginPage && !isOnChangePasswordPage) {
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
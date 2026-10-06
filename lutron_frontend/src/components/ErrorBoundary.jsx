import React from 'react';

const redirectFlagKey = 'lutronRedirectInProgress';

// Track redirect state to prevent multiple redirects
let redirectInProgress = false;
let redirectTimeout = null;

const redirectToLogin = () => {
  // Check if redirect is already in progress
  if (redirectInProgress || sessionStorage.getItem(redirectFlagKey)) {
    return;
  }

  // Set flags immediately to prevent other calls
  redirectInProgress = true;
  sessionStorage.setItem(redirectFlagKey, '1');

  // Clear any pending redirect timeout
  if (redirectTimeout) {
    clearTimeout(redirectTimeout);
  }

  try {
    localStorage.removeItem("lutron");
    localStorage.removeItem("role");
    localStorage.removeItem("permission");
    localStorage.removeItem("userEmail");
  } catch (err) {
    console.warn("Failed to clear auth data on crash:", err);
  }

  const onLogin = window.location.pathname === '/login' || window.location.pathname === '/';
  if (!onLogin) {
    // Redirect IMMEDIATELY without setTimeout to prevent "Page Unresponsive" prompt
    try {
      window.location.replace('/login');
    } catch (error) {
      // If replace fails, try href as fallback
      try {
        window.location.href = '/login';
      } catch (e) {
        // Last resort - use window.location directly
        window.location = '/login';
      }
    }
  } else {
    // Reset flag if already on login page
    redirectInProgress = false;
    sessionStorage.removeItem(redirectFlagKey);
  }
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled render error:', error, info);
    // Redirect immediately to login page on any hard crash
    // This prevents the user from being stuck on a broken UI
    redirectToLogin();
  }

  render() {
    if (this.state.hasError) {
      // Return null while redirecting to keep the UI clean
      return null;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
export { redirectToLogin, redirectFlagKey };


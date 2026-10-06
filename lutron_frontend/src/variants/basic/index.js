import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { Provider } from 'react-redux';
import { store } from '../src/redux/store'
import { BrowserRouter } from 'react-router-dom';
import { ThemeProviderCustom } from './screens/settings/theme/ThemeContext'
import ErrorBoundary, { redirectToLogin, redirectFlagKey } from './components/ErrorBoundary';

// Global safety nets: only redirect for authentication errors
if (!window.__lutronGlobalHandlersInstalled) {
  window.__lutronGlobalHandlersInstalled = true;

  // Track consecutive errors
  let errorCount = 0;
  let lastErrorTime = Date.now();
  const ERROR_WINDOW = 10000; // Within 10 seconds

  const resetErrorCount = () => {
    errorCount = 0;
    lastErrorTime = Date.now();
  };

  const onGlobalError = (event) => {
    const error = event?.error || event;
    const now = Date.now();
    
    // Reset error count if too much time has passed
    if (now - lastErrorTime > ERROR_WINDOW) {
      resetErrorCount();
    }
    
    errorCount++;
    lastErrorTime = now;
    
    // Check if we should redirect - only on authentication errors
    const isAuthError = 
      error?.message?.includes('token') ||
      error?.message?.includes('authentication') ||
      error?.message?.includes('unauthorized') ||
      error?.message?.includes('401') ||
      error?.message?.includes('403');
    
    if (isAuthError) {
      console.warn(`Redirecting due to auth error: ${error?.message}`);
      redirectToLogin();
    }
  };

  const onUnhandledRejection = (event) => {
    const reason = event?.reason || event;
    const now = Date.now();
    
    // Reset error count if too much time has passed
    if (now - lastErrorTime > ERROR_WINDOW) {
      resetErrorCount();
    }
    
    errorCount++;
    lastErrorTime = now;
    
    const isAuthError = 
      reason?.message?.includes('token') ||
      reason?.message?.includes('authentication') ||
      reason?.message?.includes('unauthorized') ||
      reason?.message?.includes('401') ||
      reason?.message?.includes('403') ||
      reason?.response?.status === 401 ||
      reason?.response?.status === 403;
    
    if (isAuthError) {
      console.warn(`Redirecting due to auth rejection: ${reason?.message || reason}`);
      redirectToLogin();
    }
  };

  window.addEventListener('error', onGlobalError);
  window.addEventListener('unhandledrejection', onUnhandledRejection);

  // Ensure we clear the redirect guard after a navigation to login completes
  const clearRedirectGuard = () => {
    sessionStorage.removeItem(redirectFlagKey);
    resetErrorCount();
  };

  window.addEventListener('popstate', clearRedirectGuard);
  window.addEventListener('load', clearRedirectGuard);
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // <React.StrictMode>
  <ErrorBoundary>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <Provider store={store}>
        <ThemeProviderCustom>
          <App />
        </ThemeProviderCustom>
      </Provider>
    </BrowserRouter>
  </ErrorBoundary>
  //</React.StrictMode>
);

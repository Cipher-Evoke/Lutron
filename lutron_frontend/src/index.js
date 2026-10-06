import React, { Suspense, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import {
  detectUiVariantChangeOnBoot,
  clearForeignVariantDocumentChrome,
} from './utils/uiVariant';
import { invalidateThemeSessionCaches } from './shared/utils/bootstrapFetchGuards';
import { loadVariantModules } from './variantLoader';
import { installGlobalAuthHandlers } from './installGlobalAuthHandlers';

// After Theme variant switch: flush theme session caches and Advanced chrome so
// Basic/Customized do not hydrate gold/brown from the previous variant.
// Redux is already replaced by reload + per-variant store; localStorage prefs stay.
const { active: variant, changed: uiVariantChanged } = detectUiVariantChangeOnBoot();
if (uiVariantChanged) {
  invalidateThemeSessionCaches();
  clearForeignVariantDocumentChrome(variant);
} else if (variant !== 'advanced') {
  clearForeignVariantDocumentChrome(variant);
}

if (variant === 'advanced') {
  require('./variants/advanced/index.css');
  // Apply saved Advanced theme before async chunks load so gold/theme-4 classes
  // exist on first paint (default body CSS is slate until then).
  try {
    const {
      readAdvancedApplicationThemePin,
    } = require('./variants/advanced/utils/advancedApplicationThemePersist');
    const {
      applyAdvancedCssVariables,
    } = require('./shared/theme/registry/applyAdvancedCssVariables');
    const pin = readAdvancedApplicationThemePin();
    if (pin && (pin.background || pin.content || pin.button)) {
      applyAdvancedCssVariables(
        {
          background: pin.background,
          content: pin.content,
          button: pin.button,
        },
        '/assets/defaultBg.png'
      );
    }
  } catch {
    // Pin / CSS apply is best-effort; ThemeProvider will hydrate later.
  }
} else if (variant === 'customized') {
  require('./variants/customized/index.css');
} else {
  require('./variants/basic/index.css');
}

function VariantRoot() {
  const [modules, setModules] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    loadVariantModules()
      .then((loaded) => {
        if (cancelled) return;
        sessionStorage.removeItem('lutron_variant_chunk_reload');
        installGlobalAuthHandlers(loaded.redirectToLogin, loaded.redirectFlagKey);
        setModules(loaded);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loadError) {
    return (
      <Box sx={{ p: 3, color: 'error.main' }}>
        Failed to load UI ({variant}). {String(loadError?.message || loadError)}
      </Box>
    );
  }

  if (!modules) {
    return (
      <Box
        sx={{
          display: 'flex',
          height: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const { App, store, ThemeProviderCustom, ErrorBoundary } = modules;

  return (
    <ErrorBoundary>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Provider store={store}>
          <ThemeProviderCustom>
            <App />
          </ThemeProviderCustom>
        </Provider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

const styleNonce = document.querySelector('meta[name="csp-nonce"]')?.getAttribute('content') || undefined;
const muiCache = createCache({ key: 'mui', nonce: styleNonce, prepend: true });

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <CacheProvider value={muiCache}>
  <Suspense
    fallback={
      <Box
        sx={{
          display: 'flex',
          height: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    }
  >
    <VariantRoot />
  </Suspense>
  </CacheProvider>
);

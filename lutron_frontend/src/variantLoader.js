import { getUiVariant, reconcileLockedUiVariantFromBackend } from './utils/uiVariant';

const CHUNK_RELOAD_SESSION_KEY = 'lutron_variant_chunk_reload';

function isChunkLoadError(error) {
  const message = String(error?.message || error || '');
  return (
    error?.name === 'ChunkLoadError' ||
    /Loading chunk [\w-]+ failed/i.test(message)
  );
}

/**
 * Retry dynamic imports once after a stale chunk 404 (common in dev after HMR / variant switch).
 */
async function importWithChunkRetry(importer) {
  try {
    return await importer();
  } catch (error) {
    if (isChunkLoadError(error) && !sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) {
      sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, '1');
      window.location.reload();
      return new Promise(() => {});
    }
    sessionStorage.removeItem(CHUNK_RELOAD_SESSION_KEY);
    throw error;
  }
}

/**
 * Load the active variant's App, Redux store, theme provider, and error boundary.
 * Webpack needs static import paths — one branch per variant.
 */
export async function loadVariantModules() {
  const variant = getUiVariant();
  // Variant lock is checked in the background. A slow GET /config/installation
  // must not hold the switch spinner.
  void reconcileLockedUiVariantFromBackend();

  if (variant === 'advanced') {
    const [appMod, storeMod, themeMod, errMod] = await Promise.all([
      importWithChunkRetry(() => import('./variants/advanced/App')),
      importWithChunkRetry(() => import('./variants/advanced/redux/store')),
      importWithChunkRetry(() => import('./variants/advanced/screens/settings/theme/ThemeContext')),
      importWithChunkRetry(() => import('./variants/advanced/components/ErrorBoundary')),
    ]);
    return {
      App: appMod.default,
      store: storeMod.store,
      ThemeProviderCustom: themeMod.ThemeProviderCustom,
      ErrorBoundary: errMod.default,
      redirectToLogin: errMod.redirectToLogin,
      redirectFlagKey: errMod.redirectFlagKey,
    };
  }

  if (variant === 'customized') {
    const [appMod, storeMod, themeMod, errMod] = await Promise.all([
      importWithChunkRetry(() => import('./variants/customized/App')),
      importWithChunkRetry(() => import('./variants/customized/redux/store')),
      importWithChunkRetry(() => import('./variants/customized/screens/settings/theme/ThemeContext')),
      importWithChunkRetry(() => import('./variants/customized/components/ErrorBoundary')),
    ]);
    return {
      App: appMod.default,
      store: storeMod.store,
      ThemeProviderCustom: themeMod.ThemeProviderCustom,
      ErrorBoundary: errMod.default,
      redirectToLogin: errMod.redirectToLogin,
      redirectFlagKey: errMod.redirectFlagKey,
    };
  }

  const [appMod, storeMod, themeMod, errMod] = await Promise.all([
    importWithChunkRetry(() => import('./variants/basic/App')),
    importWithChunkRetry(() => import('./variants/basic/redux/store')),
    importWithChunkRetry(() => import('./variants/basic/screens/settings/theme/ThemeContext')),
    importWithChunkRetry(() => import('./variants/basic/components/ErrorBoundary')),
  ]);
  return {
    App: appMod.default,
    store: storeMod.store,
    ThemeProviderCustom: themeMod.ThemeProviderCustom,
    ErrorBoundary: errMod.default,
    redirectToLogin: errMod.redirectToLogin,
    redirectFlagKey: errMod.redirectFlagKey,
  };
}

/**
 * Once / in-flight guards for bootstrap GETs shared across screens.
 * Prevents remount / tab races from firing the same endpoint repeatedly.
 *
 * Theme / client / project also use sessionStorage so a hard reload in the
 * same tab can hydrate Redux without re-hitting the network. Cleared on logout.
 */
import { getToken } from '../auth/authToken';
import { getUiVariant } from '../../utils/uiVariant';

const inFlight = new Map();
const completed = new Set();
/** @type {Map<string, number>} */
const completedAt = new Map();

const SESSION_CACHE_PREFIX = 'lutron.bootstrap.';
const SESSION_CACHE_KEYS_STATIC = ['home-client', 'home-project'];
const UI_VARIANTS = ['basic', 'advanced', 'customized'];

function hasAuthToken() {
  try {
    return Boolean(getToken());
  } catch {
    return false;
  }
}

function themeSettingsCacheKey() {
  try {
    return `theme-settings:${getUiVariant()}`;
  } catch {
    return 'theme-settings';
  }
}

function themeApplicationCacheKey() {
  try {
    return `theme-application:${getUiVariant()}`;
  } catch {
    return 'theme-application';
  }
}

function currentUiVariant() {
  try {
    return getUiVariant();
  } catch {
    return null;
  }
}

function isThemeSessionCacheKey(cacheKey) {
  const key = String(cacheKey || '');
  return (
    key === 'theme-settings' ||
    key === 'theme-application' ||
    key.startsWith('theme-settings:') ||
    key.startsWith('theme-application:')
  );
}

function readSessionCache(cacheKey) {
  try {
    if (typeof sessionStorage === 'undefined') return null;
    const raw = sessionStorage.getItem(SESSION_CACHE_PREFIX + cacheKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !('payload' in parsed)) return null;
    // Drop untagged or cross-variant theme caches so Basic cannot hydrate
    // Customized/Advanced colors (or the reverse). Non-theme keys unchanged.
    if (isThemeSessionCacheKey(cacheKey)) {
      const variant = currentUiVariant();
      if (!parsed.variant || !variant || parsed.variant !== variant) {
        sessionStorage.removeItem(SESSION_CACHE_PREFIX + cacheKey);
        return null;
      }
    }
    return parsed.payload;
  } catch {
    return null;
  }
}

function writeSessionCache(cacheKey, payload) {
  try {
    if (typeof sessionStorage === 'undefined') return;
    const record = { payload, at: Date.now() };
    if (isThemeSessionCacheKey(cacheKey)) {
      const variant = currentUiVariant();
      if (variant) record.variant = variant;
    }
    sessionStorage.setItem(
      SESSION_CACHE_PREFIX + cacheKey,
      JSON.stringify(record)
    );
  } catch {
    // quota / private mode — ignore
  }
}

function clearSessionCache(cacheKey) {
  try {
    if (typeof sessionStorage === 'undefined') return;
    sessionStorage.removeItem(SESSION_CACHE_PREFIX + cacheKey);
  } catch {
    // ignore
  }
}

function clearAllBootstrapSessionCaches() {
  try {
    if (typeof sessionStorage === 'undefined') return;
    SESSION_CACHE_KEYS_STATIC.forEach((k) => {
      sessionStorage.removeItem(SESSION_CACHE_PREFIX + k);
    });
    UI_VARIANTS.forEach((v) => {
      sessionStorage.removeItem(SESSION_CACHE_PREFIX + `theme-settings:${v}`);
      sessionStorage.removeItem(SESSION_CACHE_PREFIX + `theme-application:${v}`);
    });
    sessionStorage.removeItem(SESSION_CACHE_PREFIX + 'theme-settings');
    sessionStorage.removeItem(SESSION_CACHE_PREFIX + 'theme-application');
  } catch {
    // ignore
  }
}

/**
 * Hydrate Redux from session cache and mark the once-guard complete (no network).
 * @returns {boolean} true if hydrated
 */
function hydrateFromSessionCache(dispatch, cacheKey, guardKey, thunk) {
  const cached = readSessionCache(cacheKey);
  if (cached === null || cached === undefined) return false;
  completed.add(guardKey);
  completedAt.set(guardKey, Date.now());
  if (thunk?.fulfilled?.type) {
    dispatch({ type: thunk.fulfilled.type, payload: cached });
  }
  return true;
}

function track(key, promise) {
  const tracked = Promise.resolve(promise)
    .then((result) => {
      completed.add(key);
      completedAt.set(key, Date.now());
      return result;
    })
    .catch((err) => {
      // Allow retry after failure
      throw err;
    })
    .finally(() => {
      inFlight.delete(key);
    });
  inFlight.set(key, tracked);
  return tracked;
}

/**
 * Skip if already completed; if in-flight, return the same promise (waiters share one request).
 * @param {string} key
 * @param {() => any} startFn
 * @param {{ force?: boolean, ttlMs?: number|null }} [options]
 *   ttlMs: when set, completed entries expire and may re-fetch (null = session-long).
 */
function getOrStart(key, startFn, { force = false, ttlMs = null, requireAuth = true } = {}) {
  if (requireAuth && !hasAuthToken()) return Promise.resolve(null);
  if (force) {
    completed.delete(key);
    completedAt.delete(key);
  }
  if (!force && completed.has(key)) {
    if (ttlMs == null) {
      return Promise.resolve(null);
    }
    const at = completedAt.get(key) || 0;
    if (Date.now() - at < ttlMs) {
      return Promise.resolve(null);
    }
    completed.delete(key);
    completedAt.delete(key);
  }
  if (inFlight.has(key)) {
    return inFlight.get(key);
  }
  return track(key, startFn());
}

export function resetBootstrapFetchGuards() {
  inFlight.clear();
  completed.clear();
  completedAt.clear();
  clearAllBootstrapSessionCaches();
}

/** Drop theme session caches for every variant. Used on UI variant switch. */
export function invalidateThemeSessionCaches() {
  completed.delete('theme-settings');
  completed.delete('theme-application');
  completedAt.delete('theme-settings');
  completedAt.delete('theme-application');
  try {
    if (typeof sessionStorage === 'undefined') return;
    sessionStorage.removeItem(SESSION_CACHE_PREFIX + 'theme-settings');
    sessionStorage.removeItem(SESSION_CACHE_PREFIX + 'theme-application');
    UI_VARIANTS.forEach((v) => {
      sessionStorage.removeItem(SESSION_CACHE_PREFIX + `theme-settings:${v}`);
      sessionStorage.removeItem(SESSION_CACHE_PREFIX + `theme-application:${v}`);
    });
  } catch {
    // ignore
  }
}

/** Skip if already loaded; join in-flight if running. */
export function dispatchFetchProfileOnce(dispatch, fetchProfile) {
  return getOrStart('profile', () => dispatch(fetchProfile()));
}

export function dispatchFetchFloorsOnce(
  dispatch,
  fetchFloors,
  floorsAlreadyLoadedOrOpts = false,
  maybeOpts = undefined
) {
  const key = 'floors';
  if (!hasAuthToken()) return Promise.resolve(null);

  let floorsAlreadyLoaded = false;
  let force = false;
  if (
    floorsAlreadyLoadedOrOpts &&
    typeof floorsAlreadyLoadedOrOpts === 'object' &&
    !Array.isArray(floorsAlreadyLoadedOrOpts)
  ) {
    floorsAlreadyLoaded = Boolean(floorsAlreadyLoadedOrOpts.alreadyLoaded);
    force = Boolean(floorsAlreadyLoadedOrOpts.force);
  } else {
    floorsAlreadyLoaded = Boolean(floorsAlreadyLoadedOrOpts);
    force = Boolean(maybeOpts?.force);
  }

  if (force) {
    completed.delete(key);
    completedAt.delete(key);
  } else if (floorsAlreadyLoaded) {
    completed.add(key);
    completedAt.set(key, Date.now());
    return Promise.resolve(null);
  }
  return getOrStart(key, () => dispatch(fetchFloors()), { force });
}


/** Application chrome theme (/theme/application) — once per session; force after Theme save. */
export function dispatchFetchApplicationThemeOnce(
  dispatch,
  fetchApplicationTheme,
  { force = false } = {}
) {
  const key = 'theme-application';
  const cacheKey = themeApplicationCacheKey();

  if (force) {
    clearSessionCache(cacheKey);
    completed.delete(key);
    completedAt.delete(key);
  } else if (completed.has(key)) {
    return Promise.resolve(null);
  } else if (
    hasAuthToken() &&
    hydrateFromSessionCache(dispatch, cacheKey, key, fetchApplicationTheme)
  ) {
    return Promise.resolve(null);
  }

  return getOrStart(
    key,
    async () => {
      const action = await dispatch(fetchApplicationTheme());
      if (fetchApplicationTheme.fulfilled.match(action)) {
        writeSessionCache(cacheKey, action.payload);
      }
      return action;
    },
    { force }
  );
}

/**
 * After a successful theme save, update session cache so the next reload does
 * not hydrate a stale (e.g. gold) application theme over Default white.
 * Also keep `/theme/` ui_theme_colors in sync — Basic MUI surfaces read that
 * cache, not only CSS variables from `/theme/application`.
 * @param {object} applicationThemePayload - same shape as fetchApplicationTheme.fulfilled
 */
export function syncApplicationThemeSessionCache(applicationThemePayload) {
  if (applicationThemePayload == null) return;
  const key = 'theme-application';
  writeSessionCache(themeApplicationCacheKey(), applicationThemePayload);
  completed.add(key);
  completedAt.set(key, Date.now());

  const at = applicationThemePayload.application_theme;
  if (!at || (!at.background && !at.content && !at.button)) return;

  const settingsCacheKey = themeSettingsCacheKey();
  const existingSettings = readSessionCache(settingsCacheKey);
  if (existingSettings && typeof existingSettings === 'object') {
    writeSessionCache(settingsCacheKey, {
      ...existingSettings,
      ui_theme_colors: {
        ...(existingSettings.ui_theme_colors || {}),
        background: at.background ?? existingSettings.ui_theme_colors?.background,
        content: at.content ?? existingSettings.ui_theme_colors?.content,
        button: at.button ?? existingSettings.ui_theme_colors?.button,
      },
    });
    completed.add('theme-settings');
    completedAt.set('theme-settings', Date.now());
    return;
  }

  clearSessionCache(settingsCacheKey);
  completed.delete('theme-settings');
  completedAt.delete('theme-settings');
}

export function dispatchFetchHeatMapThemeOnce(dispatch, fetchHeatMapTheme, { force = false } = {}) {
  return getOrStart('theme-heatmap', () => dispatch(fetchHeatMapTheme()), { force });
}

export function dispatchFetchBackgroundImageOnce(
  dispatch,
  fetchBackgroundImage,
  { force = false } = {}
) {
  return getOrStart('theme-background', () => dispatch(fetchBackgroundImage()), { force });
}

/** Client branding (/home/client) — one bootstrap GET; force after Home save. */
export function dispatchFetchClientOnce(dispatch, getLutronDataClient, { force = false } = {}) {
  const key = 'home-client';
  const cacheKey = 'home-client';

  if (force) {
    clearSessionCache(cacheKey);
  } else if (completed.has(key)) {
    return Promise.resolve(null);
  } else if (hasAuthToken() && hydrateFromSessionCache(dispatch, cacheKey, key, getLutronDataClient)) {
    return Promise.resolve(null);
  }

  return getOrStart(
    key,
    async () => {
      const action = await dispatch(getLutronDataClient());
      if (getLutronDataClient.fulfilled.match(action)) {
        writeSessionCache(cacheKey, action.payload);
      }
      return action;
    },
    { force }
  );
}

/** Project branding (/home/project) — one bootstrap GET; force after Home save. */
export function dispatchFetchProjectOnce(dispatch, getLutronDataProject, { force = false } = {}) {
  const key = 'home-project';
  const cacheKey = 'home-project';

  if (force) {
    clearSessionCache(cacheKey);
  } else if (completed.has(key)) {
    return Promise.resolve(null);
  } else if (hasAuthToken() && hydrateFromSessionCache(dispatch, cacheKey, key, getLutronDataProject)) {
    return Promise.resolve(null);
  }

  return getOrStart(
    key,
    async () => {
      const action = await dispatch(getLutronDataProject());
      if (getLutronDataProject.fulfilled.match(action)) {
        writeSessionCache(cacheKey, action.payload);
      }
      return action;
    },
    { force }
  );
}

/**
 * Global /theme/ settings — one bootstrap GET (also used on Login before auth).
 * Pass alreadyLoaded when Redux already has settings; force after Theme save.
 * Session cache survives hard reload within the same tab (per UI variant).
 */
export function dispatchFetchThemeSettingsOnce(
  dispatch,
  fetchThemeSettings,
  alreadyLoadedOrOpts = false,
  maybeOpts = undefined
) {
  const key = 'theme-settings';
  const cacheKey = themeSettingsCacheKey();

  let alreadyLoaded = false;
  let force = false;
  if (
    alreadyLoadedOrOpts &&
    typeof alreadyLoadedOrOpts === 'object' &&
    !Array.isArray(alreadyLoadedOrOpts)
  ) {
    alreadyLoaded = Boolean(alreadyLoadedOrOpts.alreadyLoaded);
    force = Boolean(alreadyLoadedOrOpts.force);
  } else {
    alreadyLoaded = Boolean(alreadyLoadedOrOpts);
    force = Boolean(maybeOpts?.force);
  }

  if (force) {
    completed.delete(key);
    completedAt.delete(key);
    clearSessionCache(cacheKey);
  } else if (alreadyLoaded) {
    completed.add(key);
    completedAt.set(key, Date.now());
    return Promise.resolve(null);
  } else if (completed.has(key)) {
    return Promise.resolve(null);
  } else if (hydrateFromSessionCache(dispatch, cacheKey, key, fetchThemeSettings)) {
    return Promise.resolve(null);
  }

  // Theme is loaded on Login (no token yet) and again by ThemeProvider — share one GET.
  return getOrStart(
    key,
    async () => {
      const action = await dispatch(fetchThemeSettings());
      if (fetchThemeSettings.fulfilled.match(action)) {
        writeSessionCache(cacheKey, action.payload);
      }
      return action;
    },
    {
      force,
      requireAuth: false,
    }
  );
}

export function dispatchFetchCustomGraphsOnce(dispatch, fetchCustomGraphs, { force = false } = {}) {
  return getOrStart('custom-graphs', () => dispatch(fetchCustomGraphs()), { force });
}

export function dispatchFetchWidgetTitlesOnce(dispatch, fetchWidgetTitles, { force = false } = {}) {
  return getOrStart('widget-titles', () => dispatch(fetchWidgetTitles()), { force });
}

export function dispatchFetchWidgetConfigurationOnce(
  dispatch,
  fetchWidgetConfiguration,
  { force = false } = {}
) {
  return getOrStart('widget-configuration', () => dispatch(fetchWidgetConfiguration()), {
    force,
  });
}

export function dispatchFetchAreaGroupsOnce(dispatch, fetchAreaGroups, { force = false } = {}) {
  return getOrStart('area-groups', () => dispatch(fetchAreaGroups()), { force });
}

/** One area_tree fetch per floorId (join in-flight; skip after success unless force). */
export function dispatchFetchLeafByFloorOnce(
  dispatch,
  getLeafByFloorID,
  floorId,
  { force = false, alreadyLoaded = false } = {}
) {
  const key = `area-tree:${floorId}`;
  if (!hasAuthToken()) return Promise.resolve(null);
  if (alreadyLoaded && !force) {
    completed.add(key);
    completedAt.set(key, Date.now());
    return Promise.resolve(null);
  }
  return getOrStart(key, () => dispatch(getLeafByFloorID(floorId)), { force });
}

export function dispatchFetchAlertTypesOnce(dispatch, fetchAlertTypes, { force = false } = {}) {
  return getOrStart('alert-types', () => dispatch(fetchAlertTypes()), {
    force,
    // Settings toggles change which types belong in the filter; do not cache forever.
    ttlMs: 2500,
  });
}

export function invalidateAlertTypesBootstrap() {
  completed.delete('alert-types');
  completedAt.delete('alert-types');
}

/** Brief TTL so Strict Mode remounts coalesce; revisiting later still refreshes. */
export function dispatchFetchActiveAlertsOnce(dispatch, fetchActiveAlerts, { force = false } = {}) {
  return getOrStart('active-alerts', () => dispatch(fetchActiveAlerts()), {
    force,
    ttlMs: 2500,
  });
}

export function dispatchFetchQuickControlsOnce(dispatch, fetchQuickControls, { force = false } = {}) {
  return getOrStart('quick-controls-list', () => dispatch(fetchQuickControls()), {
    force,
    ttlMs: 2500,
  });
}

export function dispatchFetchAreaSizeLoadOnce(dispatch, getAreaSizeLoadData, { force = false } = {}) {
  return getOrStart('area-size-load', () => dispatch(getAreaSizeLoadData()), {
    force,
    ttlMs: 2500,
  });
}


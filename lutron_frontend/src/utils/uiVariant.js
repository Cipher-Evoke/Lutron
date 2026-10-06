/** UI experience variant: basic (default), advanced, or customized. */
export const UI_VARIANT_STORAGE_KEY = 'lutron_ui_variant';

/** Mirror of installation_settings.ui_variant_locked for fast UI reads (server is source of truth). */
export const UI_VARIANT_LOCKED_STORAGE_KEY = 'lutron_ui_variant_locked';

export const UI_VARIANT_LOCKED_SETTING_KEY = 'ui_variant_locked';

/** Last variant that finished booting in this tab (detects Theme switch across reload). */
export const UI_VARIANT_LAST_BOOT_SESSION_KEY = 'lutron.last_boot_ui_variant';

/** Set just before reload on Theme switch; cleared after boot reconcile. */
export const UI_VARIANT_SWITCH_PENDING_SESSION_KEY = 'lutron.ui_variant_switch_pending';

export const UI_VARIANTS = ['basic', 'advanced', 'customized'];

/** First run and invalid/missing values default to basic. */
export function getUiVariant() {
  try {
    const raw = localStorage.getItem(UI_VARIANT_STORAGE_KEY);
    if (raw && UI_VARIANTS.includes(raw)) return raw;
  } catch {
    /* private mode / blocked storage */
  }
  return 'basic';
}

export function setUiVariant(variant) {
  if (!UI_VARIANTS.includes(variant)) return;
  try {
    localStorage.setItem(UI_VARIANT_STORAGE_KEY, variant);
  } catch {
    /* ignore */
  }
}

export function parseUiVariantLocked(value) {
  if (value === true || value === 1) return true;
  if (value === false || value === 0 || value == null) return false;
  const normalized = String(value).trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
}

export function readUiVariantLockedLocal() {
  try {
    return localStorage.getItem(UI_VARIANT_LOCKED_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function writeUiVariantLockedLocal(locked) {
  try {
    localStorage.setItem(UI_VARIANT_LOCKED_STORAGE_KEY, locked ? 'true' : 'false');
  } catch {
    /* ignore */
  }
}

function getApiBaseUrl(options = {}) {
  if (options.apiUrl) return String(options.apiUrl).replace(/\/+$/, '');
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const proto = window.location.protocol || 'http:';
    return `${proto}//${window.location.hostname}:8000`;
  }
  const raw = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  return String(raw).replace(/\/+$/, '');
}

function getAuthToken(options = {}) {
  if (options.token !== undefined) return options.token;
  try {
    return localStorage.getItem('lutron');
  } catch {
    return null;
  }
}

function parseInstallationSettingsPayload(json) {
  if (!json || typeof json !== 'object') return {};
  if (json.root && typeof json.root === 'object' && !Array.isArray(json.root)) {
    return json.root;
  }
  return json;
}

/**
 * Read ui_variant + ui_variant_locked from GET /config/installation.
 * @returns {Promise<{ ui_variant: string|null, ui_variant_locked: boolean }|null>}
 */
export async function fetchInstallationUiVariantSettings(options = {}) {
  const token = getAuthToken(options);
  if (!token) return null;
  const timeoutMs = options.timeoutMs ?? 4000;
  const fetchImpl = options.fetchImpl || fetch;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(
        `${getApiBaseUrl(options)}/config/installation`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        }
      );
      if (!response.ok) return null;
      const json = await response.json();
      const map = parseInstallationSettingsPayload(json);
      const rawVariant = map.ui_variant;
      const ui_variant =
        rawVariant && UI_VARIANTS.includes(String(rawVariant).trim().toLowerCase())
          ? String(rawVariant).trim().toLowerCase()
          : null;
      return {
        ui_variant,
        ui_variant_locked: parseUiVariantLocked(map[UI_VARIANT_LOCKED_SETTING_KEY]),
      };
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return null;
  }
}

/**
 * Partial POST /config/installation (Superadmin). Returns merged map or null.
 */
export async function patchInstallationUiVariantSettings(updates, options = {}) {
  const token = getAuthToken(options);
  if (!token || !updates || typeof updates !== 'object') return null;
  const timeoutMs = options.timeoutMs ?? 4000;
  const fetchImpl = options.fetchImpl || fetch;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(
        `${getApiBaseUrl(options)}/config/installation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updates),
          signal: controller.signal,
        }
      );
      if (!response.ok) return null;
      const json = await response.json();
      return parseInstallationSettingsPayload(json);
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return null;
  }
}

/**
 * When ui_variant_locked is true on the server, align localStorage to server ui_variant.
 * Reloads once if a correction was needed. No-op without auth token or on network failure.
 * @returns {Promise<boolean>} true if a reload was triggered
 */
export async function reconcileLockedUiVariantFromBackend(options = {}) {
  const settings = await fetchInstallationUiVariantSettings(options);
  if (!settings) return false;

  writeUiVariantLockedLocal(settings.ui_variant_locked);

  if (
    settings.ui_variant_locked &&
    settings.ui_variant &&
    getUiVariant() !== settings.ui_variant
  ) {
    setUiVariant(settings.ui_variant);
    window.location.reload();
    return true;
  }
  return false;
}

/**
 * Drop Advanced-only html classes / page CSS vars when booting Basic or Customized
 * so gold/Theme-4 chrome cannot linger across a variant switch (bfcache / same tab).
 * Does not clear localStorage preference keys (widget visibility, dashboard order, pin).
 */
export function clearForeignVariantDocumentChrome(activeVariant) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (activeVariant === 'advanced') return;

  root.classList.remove(
    'gold-theme',
    'theme-3-page',
    'theme-4-page',
    'custom-theme'
  );

  if (activeVariant === 'basic') {
    root.style.setProperty('--app-background', '#ffffff');
    root.style.setProperty('--app-content', '#f5f5f5');
    root.style.setProperty('--app-button', '#1565C0');
    root.style.setProperty('--app-background-image', 'none');
    root.style.removeProperty('--app-page-background');
    root.style.removeProperty('--dashboard-card-background');
    root.style.removeProperty('--auth-page-background-image');
  }
}

/**
 * Call from Theme switcher before reload. Persists next variant and marks the
 * upcoming boot as a switch so theme session caches are flushed. Does not clear
 * variant-scoped localStorage prefs or shared area-group data.
 *
 * @param {string} nextVariant
 * @returns {string|null} previous variant (if any)
 */
export function prepareUiVariantSwitch(nextVariant) {
  if (!UI_VARIANTS.includes(nextVariant)) return null;
  let previous = null;
  try {
    previous = localStorage.getItem(UI_VARIANT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  setUiVariant(nextVariant);
  try {
    sessionStorage.setItem(UI_VARIANT_SWITCH_PENDING_SESSION_KEY, nextVariant);
  } catch {
    /* ignore */
  }
  clearForeignVariantDocumentChrome(nextVariant);
  return previous && UI_VARIANTS.includes(previous) ? previous : null;
}

/**
 * Resolve active variant and whether this boot follows a Theme variant switch.
 * Call before loading variant CSS / Advanced theme pin.
 *
 * @returns {{ active: string, changed: boolean, previous: string|null }}
 */
export function detectUiVariantChangeOnBoot() {
  let previousBoot = null;
  let pending = null;
  try {
    previousBoot = sessionStorage.getItem(UI_VARIANT_LAST_BOOT_SESSION_KEY);
    pending = sessionStorage.getItem(UI_VARIANT_SWITCH_PENDING_SESSION_KEY);
  } catch {
    /* ignore */
  }

  const active = getUiVariant();
  const changed =
    Boolean(pending && UI_VARIANTS.includes(pending) && pending === active) ||
    Boolean(
      previousBoot &&
        UI_VARIANTS.includes(previousBoot) &&
        previousBoot !== active
    );

  const previous =
    previousBoot && UI_VARIANTS.includes(previousBoot) && previousBoot !== active
      ? previousBoot
      : null;

  try {
    sessionStorage.setItem(UI_VARIANT_LAST_BOOT_SESSION_KEY, active);
    sessionStorage.removeItem(UI_VARIANT_SWITCH_PENDING_SESSION_KEY);
  } catch {
    /* ignore */
  }

  return { active, changed, previous };
}

export const UI_VARIANT_LABELS = {
  basic: 'Basic',
  advanced: 'Advanced',
  customized: 'Customized',
};

/** Superadmin only — matches JWT/localStorage role variants (Superadmin, Super Admin, etc.). */
export function isSuperAdminRole(role) {
  if (role == null || role === '') return false;
  // Same acceptance set as shared/auth useAuthCore.isSuperadminRole, then normalize.
  const raw = String(role).trim();
  const lower = raw.toLowerCase();
  if (raw === 'Superadmin' || lower === 'superadmin' || lower === 'super admin') {
    return true;
  }
  const normalized = lower.replace(/\s+/g, '');
  return normalized === 'superadmin';
}

/** Snapshot before `localStorage.clear()` on logout (same pattern as widget visibility). */
export function readUiVariantRaw() {
  try {
    return localStorage.getItem(UI_VARIANT_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function restoreUiVariantAfterStorageClear(raw) {
  if (raw == null || !UI_VARIANTS.includes(raw)) return;
  try {
    localStorage.setItem(UI_VARIANT_STORAGE_KEY, raw);
  } catch {
    /* ignore */
  }
}

/**
 * Best-effort sync of selected UI variant into installation_settings.ui_variant.
 * Theme APIs also pass ?variant= from localStorage; this keeps other
 * variant-scoped backend routes aligned after a switch.
 *
 * Never throws — returns false on timeout/network/auth failure so the UI
 * can still reload.
 */
export async function syncUiVariantToBackend(variant, options = {}) {
  if (!UI_VARIANTS.includes(variant)) return false;
  const merged = await patchInstallationUiVariantSettings({ ui_variant: variant }, options);
  return Boolean(merged);
}

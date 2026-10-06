/**
 * Remap settings URLs when switching UI variants.
 * Basic, advanced, and customized use `/setting/...`.
 */

const SETTINGS_PREFIX = "/setting";
const PREFIXED_VARIANTS = new Set(["basic", "advanced", "customized"]);

const LEGACY_SETTINGS_PATH_PREFIXES = [
  "/main",
  "/theme-change",
  "/rename-widget",
  "/widgets",
  "/manage-area-groups",
  "/area-size-load",
  "/email-server",
  "/users",
  "/floor",
  "/manage-sensors",
  "/manage-modules",
  "/alerts",
  "/processors",
  "/maintenance",
  "/fofp",
  "/create-help",
];

function normalizePathname(pathname) {
  if (!pathname || typeof pathname !== "string") return "/";
  let p = pathname;
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p || "/";
}

function isLegacySettingsPath(pathname) {
  const p = normalizePathname(pathname);
  return LEGACY_SETTINGS_PATH_PREFIXES.some(
    (prefix) => p === prefix || p.startsWith(`${prefix}/`)
  );
}

function withTrailingSlash(pathname, shouldHaveTrailingSlash) {
  if (!shouldHaveTrailingSlash || pathname.endsWith("/")) return pathname;
  return `${pathname}/`;
}

/**
 * @param {string} pathname
 * @param {'basic'|'advanced'|'customized'} targetVariant
 */
export function remapPathnameForVariant(pathname, targetVariant) {
  const raw = pathname || "/";
  const normalized = normalizePathname(raw);
  const hadTrailingSlash = raw.length > 1 && raw.endsWith("/");

  if (PREFIXED_VARIANTS.has(targetVariant)) {
    if (normalized === SETTINGS_PREFIX || normalized.startsWith(`${SETTINGS_PREFIX}/`)) {
      return raw;
    }
    if (isLegacySettingsPath(normalized)) {
      const prefixedPath = `${SETTINGS_PREFIX}${normalized}`;
      return withTrailingSlash(prefixedPath, hadTrailingSlash);
    }
    return raw;
  }

  return raw;
}

/** @deprecated Use remapPathnameForVariant; kept for customized fallback redirect component. */
export function stripBasicSettingsPrefix(pathname) {
  const raw = pathname || "/";
  const normalized = normalizePathname(raw);
  const hadTrailingSlash = raw.length > 1 && raw.endsWith("/");

  if (normalized === SETTINGS_PREFIX) {
    return "/main";
  }
  if (normalized.startsWith(`${SETTINGS_PREFIX}/`)) {
    const stripped = normalized.slice(SETTINGS_PREFIX.length) || "/main";
    return withTrailingSlash(stripped, hadTrailingSlash);
  }
  return raw;
}

/** Default public asset (seeded product photo — not a user custom image). */
export const DEFAULT_PUBLIC_BG = "/assets/defaultBg.png";

/** Backend-seeded path for every variant in variant_config_defaults. */
export const SEEDED_API_BACKGROUND_IMAGE = "/background_image/defaultBg.png";

/**
 * Some APIs store a bad filename: "default@g.png" instead of "defaultBg.png".
 * Fixes that so the browser can load the image from `public`.
 */
export function normalizeBackgroundPath(url) {
  if (url == null || typeof url !== "string" || !url.trim()) {
    return DEFAULT_PUBLIC_BG;
  }
  return url
    .trim()
    .split("default@g")
    .join("defaultBg");
}

/**
 * Seeded product defaultBg (and empty) — must not paint basic app shell orange/gold.
 * Real user uploads under /background_image/<custom>.png stay allowed.
 */
export function isSeededDefaultBackgroundImage(url) {
  if (url == null || typeof url !== "string") return true;
  const u = url.trim().toLowerCase().replace(/\\/g, "/");
  if (!u) return true;
  return (
    u.includes("defaultbg.png") ||
    u.includes("default@g.png")
  );
}

/**
 * App shell / CSS --app-background-image: only real custom images.
 * Returns "" when missing or seeded default so chrome stays white basic theme.
 */
export function resolveAppShellBackgroundUrl(url) {
  if (url == null || typeof url !== "string" || !url.trim()) {
    return "";
  }
  const fixed = url.trim().split("default@g").join("defaultBg");
  if (isSeededDefaultBackgroundImage(fixed)) {
    return "";
  }
  return fixed;
}

/** Auth/settings pages: only show a background when the API has a custom image. */
export function resolveAuthPageBackgroundUrl(url) {
  if (url == null || typeof url !== "string" || !url.trim()) {
    return null;
  }
  const shell = resolveAppShellBackgroundUrl(url);
  return shell || null;
}

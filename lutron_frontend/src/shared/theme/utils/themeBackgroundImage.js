/** Default when theme has no custom image (public asset). */
export const DEFAULT_PUBLIC_BG = "/assets/defaultBg.png";

/**
 * Some APIs store a bad filename: "default@g.png" instead of "defaultBg.png".
 */
export function normalizeBackgroundPath(url) {
  if (url == null || typeof url !== "string" || !url.trim()) {
    return DEFAULT_PUBLIC_BG;
  }
  return url.trim().split("default@g").join("defaultBg");
}

/** Auth pages: only show a background when the API has a custom image. */
export function resolveAuthPageBackgroundUrl(url) {
  if (url == null || typeof url !== "string" || !url.trim()) {
    return null;
  }
  return normalizeBackgroundPath(url);
}

/** Pick first defined background candidate (empty string is intentional). */
export function pickThemeBackgroundImage(...candidates) {
  for (const value of candidates) {
    if (value !== undefined && value !== null) {
      return value;
    }
  }
  return undefined;
}

function isSeededDefaultBackground(url) {
  const normalized = String(url).trim().split("default@g").join("defaultBg");
  return (
    normalized === DEFAULT_PUBLIC_BG ||
    normalized.endsWith("/defaultBg.png")
  );
}

/** True for an uploaded theme photo. Seeded defaultBg.png does not count. */
export function isUserThemeBackgroundImage(url) {
  if (url == null || typeof url !== "string") return false;
  const value = url.trim();
  if (!value) return false;
  return !isSeededDefaultBackground(value);
}

/** First real uploaded image among candidates. Skips empty and defaultBg. */
export function pickUserThemeBackgroundImage(...candidates) {
  for (const value of candidates) {
    if (isUserThemeBackgroundImage(value)) return value;
  }
  return undefined;
}

export function hasActiveUserThemeBackgroundImage(...candidates) {
  return pickUserThemeBackgroundImage(...candidates) != null;
}

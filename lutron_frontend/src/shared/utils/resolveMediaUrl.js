const UPLOADED_MEDIA_PREFIX = /^\/(background_image|logo_image|help_files)(\/|$)/i;

function uploadedMediaPathname(path) {
  const value = String(path).trim();
  if (!value || /^(blob:|data:)/i.test(value)) return null;
  let pathname = value;
  if (/^https?:/i.test(value)) {
    try {
      pathname = new URL(value).pathname || "";
    } catch {
      return null;
    }
  }
  if (!pathname.startsWith("/")) pathname = `/${pathname}`;
  return UPLOADED_MEDIA_PREFIX.test(pathname) ? pathname : null;
}

/**
 * Uploaded theme/home/help files live on the API (:8000).
 * The UI on :3000 answers those paths with index.html, so the image never paints.
 * Keep /assets and other UI files on the page origin.
 */
export function resolvePublicAssetUrl(path) {
  if (path == null) return null;
  const p = String(path).trim();
  if (!p) return null;
  if (/^(blob:|data:)/i.test(p)) return p;
  const mediaPath = uploadedMediaPathname(p);
  // Same origin. The UI server returns the saved file. The API port is not
  // used here, so the page CSP and a localhost-only API cannot hide the image.
  if (mediaPath) return mediaPath;
  if (/^https?:/i.test(p)) return p;
  return p.startsWith("/") ? p : `/${p}`;
}

/**
 * API origin for fetch/WebSocket that cannot use same-origin proxy.
 * - Split cloud deploy (Netlify UI + Render API): the baked URL points at a
 *   real backend host — use it exactly.
 * - Plain-HTTP LAN / packaged installs: follow the page hostname
 *   (LAN IP / custom host / 127.0.0.1) at the baked port.
 */
export function resolveApiOrigin() {
  const raw = (process.env.REACT_APP_API_URL || "https://lutron.onrender.com").replace(/\/+$/, '');
  if (typeof window !== "undefined" && window.location?.hostname) {
    try {
      const bakedHost = (new URL(raw).hostname || "").toLowerCase();
      const isLoopback =
        bakedHost === "" ||
        bakedHost === "localhost" ||
        bakedHost === "127.0.0.1" ||
        bakedHost === "::1";
      if (!isLoopback) return raw;
      // HTTPS page = hosted UI: never graft ":8000" onto it.
      if ((window.location.protocol || "http:") === "https:") return raw;
      let port = "8000";
      try {
        const baked = process.env.REACT_APP_API_URL;
        if (baked) {
          const u = new URL(baked);
          if (u.port) port = u.port;
        }
      } catch {
        /* keep 8000 */
      }
      return `${window.location.protocol || "http:"}//${window.location.hostname}:${port}`;
    } catch {
      return raw;
    }
  }
  return raw;
}

/**
 * Home hero background, client logo, and theme photo.
 * These stay on the page origin. The UI server reads the saved file.
 */
export function resolveHomeUploadUrl(path) {
  const resolved = resolvePublicAssetUrl(path);
  return resolved || "";
}

/** Absolute URL for an API-relative path using page host. */
export function resolveApiAssetUrl(path) {
  if (path == null) return null;
  const p = String(path).trim();
  if (!p) return null;
  if (/^(https?:|blob:|data:)/i.test(p)) return p;
  const origin = resolveApiOrigin();
  return `${origin}${p.startsWith("/") ? p : `/${p}`}`;
}

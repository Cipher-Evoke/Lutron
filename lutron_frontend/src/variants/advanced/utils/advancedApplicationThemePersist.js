/**
 * Advanced-only pin for application theme colors across hard refresh.
 * Does not apply to basic/customized.
 */
export const ADVANCED_APPLICATION_THEME_STORAGE_KEY =
  "lutron.advanced.application_theme";

function isHexish(value) {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * @returns {{ background: string, content: string, button: string } | null}
 */
export function readAdvancedApplicationThemePin() {
  try {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(ADVANCED_APPLICATION_THEME_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const background = parsed.background;
    const content = parsed.content;
    const button = parsed.button;
    if (!isHexish(background) && !isHexish(content) && !isHexish(button)) {
      return null;
    }
    return {
      background: isHexish(background) ? background : "",
      content: isHexish(content) ? content : "",
      button: isHexish(button) ? button : "",
    };
  } catch {
    return null;
  }
}

/**
 * @param {{ background?: string, content?: string, button?: string } | null | undefined} colors
 */
export function writeAdvancedApplicationThemePin(colors) {
  try {
    if (typeof localStorage === "undefined" || !colors) return;
    const normalize = (v) => {
      if (v == null) return "";
      let c = String(v).trim().toLowerCase();
      if (c === "white") return "#ffffff";
      if (c.startsWith("#") && c.length === 4) {
        c = `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}`;
      }
      return c;
    };
    const payload = {
      background: normalize(colors.background),
      content: normalize(colors.content),
      button: normalize(colors.button),
    };
    if (!payload.background && !payload.content && !payload.button) return;
    localStorage.setItem(
      ADVANCED_APPLICATION_THEME_STORAGE_KEY,
      JSON.stringify(payload)
    );
  } catch {
    // ignore quota / private mode
  }
}

export function clearAdvancedApplicationThemePin() {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.removeItem(ADVANCED_APPLICATION_THEME_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Shape expected by Redux / session bootstrap cache.
 * @param {{ background?: string, content?: string, button?: string }} colors
 */
export function toAdvancedApplicationThemePayload(colors) {
  return {
    status: "Success",
    application_theme: {
      background: colors?.background || "",
      content: colors?.content || "",
      button: colors?.button || "",
    },
  };
}

/** Seed advanced theme slice so first paint prefers pin over /theme/ defaults. */
export function getAdvancedApplicationThemeInitialState() {
  const pin = readAdvancedApplicationThemePin();
  if (!pin) return {};
  return {
    applicationTheme: toAdvancedApplicationThemePayload(pin),
  };
}

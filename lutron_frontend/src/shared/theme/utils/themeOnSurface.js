/**
 * Picks text/icon colors for UI drawn on the application "content" surface
 * (application_theme.content) so light backgrounds get dark text and dark surfaces
 * get light text.
 */
function parseToRgbString(color) {
  if (color == null || color === "") return { r: 255, g: 255, b: 255 };
  const c = String(color).trim();
  if (c.startsWith("#") && c.length >= 4) {
    const hex =
      c.length === 4
        ? `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}`
        : c.length >= 7
          ? c.slice(0, 7)
          : c;
    const n = parseInt(hex.slice(1, 7), 16);
    if (Number.isNaN(n)) return { r: 255, g: 255, b: 255 };
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  const lower = c.toLowerCase();
  if (lower === "white" || lower === "#fff" || lower === "#ffffff")
    return { r: 255, g: 255, b: 255 };
  if (lower === "black" || lower === "#000" || lower === "#000000")
    return { r: 0, g: 0, b: 0 };
  if (c.startsWith("rgb")) {
    const parts = c.match(/[\d.]+/g);
    if (!parts || parts.length < 3) return { r: 255, g: 255, b: 255 };
    const a = parts.length > 3 ? Math.min(1, Math.max(0, parseFloat(parts[3]))) : 1;
    const br = 255;
    const bg = 255;
    const bb = 255;
    return {
      r: Math.round(a * parseInt(parts[0], 10) + (1 - a) * br),
      g: Math.round(a * parseInt(parts[1], 10) + (1 - a) * bg),
      b: Math.round(a * parseInt(parts[2], 10) + (1 - a) * bb),
    };
  }
  return { r: 250, g: 250, b: 250 };
}

function getRelativeLuminance(srgb) {
  const [r, g, b] = [srgb.r / 255, srgb.g / 255, srgb.b / 255].map((v) =>
    v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function isLightSurface(contentColor) {
  const { r, g, b } = parseToRgbString(contentColor);
  return getRelativeLuminance({ r, g, b }) > 0.5;
}

/** @returns {typeof ON_LIGHT} */
export function onContentColors(contentColor) {
  if (isLightSurface(contentColor)) {
    return {
      primary: "rgba(0, 0, 0, 0.87)",
      secondary: "rgba(0, 0, 0, 0.6)",
      disabled: "rgba(0, 0, 0, 0.38)",
      border: "rgba(0, 0, 0, 0.23)",
      borderStrong: "rgba(0, 0, 0, 0.42)",
      icon: "rgba(0, 0, 0, 0.6)",
      hover: "rgba(0, 0, 0, 0.04)",
      tableHeadBg: "#e8e8e8",
      popoverPanelBg: "#f5f5f5",
      isLight: true,
    };
  }
  return {
    primary: "#ffffff",
    secondary: "rgba(255, 255, 255, 0.8)",
    disabled: "rgba(255, 255, 255, 0.3)",
    border: "rgba(255, 255, 255, 0.6)",
    borderStrong: "rgba(255, 255, 255, 0.85)",
    icon: "#ffffff",
    hover: "rgba(255, 255, 255, 0.1)",
    tableHeadBg: contentColor,
    popoverPanelBg: "#2a2a2a",
    isLight: false,
  };
}

export const DEFAULT_APP_BACKGROUND = "#ffffff";
export const DEFAULT_APP_CONTENT = "#f5f5f5";

/**
 * Area-picker modals (Select Area, schedule/quick control trees) use a crisp
 * white panel when the application "content" color is a light surface — e.g.
 * default white theme — so dropdowns and trees match high-contrast black-on-white.
 */
export function isWhiteAreaPickerChrome(applicationContentColor) {
  return isLightSurface(applicationContentColor || DEFAULT_APP_CONTENT);
}

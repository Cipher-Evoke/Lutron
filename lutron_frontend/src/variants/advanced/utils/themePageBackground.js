import { darken, lighten } from '@mui/material/styles';
import {
  GOLD_BACKGROUND_ANCHOR,
  GOLD_THEME_BUTTON_SOLID,
  GOLD_THEME_LIGHT_PANEL_BG,
  GOLD_THEME_LIGHT_SURFACE_TEXT,
  GOLD_THEME_SURFACE_GRADIENT,
  THEME_3_BACKGROUND_ANCHOR,
  THEME_3_BUTTON_SOLID,
  THEME_3_LIGHT_PANEL_BG,
  THEME_3_LIGHT_SURFACE_TEXT,
  THEME_3_NAVBAR_GRADIENT,
  THEME_3_PAGE_GRADIENT,
  THEME_3_TAB_PILL_GRADIENT,
  THEME_4_BACKGROUND_ANCHOR,
  THEME_4_BUTTON_SOLID,
  THEME_4_LIGHT_PANEL_BG,
  THEME_4_LIGHT_SURFACE_TEXT,
  THEME_4_NAVBAR_GRADIENT,
  THEME_4_PAGE_GRADIENT,
  THEME_4_TAB_PILL_GRADIENT,
} from '../config/themeConstants';
import { isLightSurface, onContentColors } from './themeOnSurface';

const GOLD_NAVBAR_GRADIENT =
  'linear-gradient(90deg, #745500 0%, #5A4828 20%, #473D27 50%, #3F3527 75%, #383129 100%)';

export function normalizeThemeHex(color) {
  if (color == null) return '';
  let c = String(color).trim().toLowerCase();
  if (c === 'white') return '#ffffff';
  if (c.startsWith('#') && c.length === 4) {
    c = `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}`;
  }
  return c;
}

/** Mix a hex color toward white (0 = original, 1 = white). */
function blendHexTowardWhite(hex, amount = 0.9) {
  const normalized = normalizeThemeHex(hex);
  if (!normalized || normalized.length < 7) return '#f4f6f9';
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  const mix = (channel) => Math.round(channel * (1 - amount) + 255 * amount);
  const toHex = (n) => n.toString(16).padStart(2, '0');
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}

const FIXED_GRADIENT_PAGE_THEMES = [
  {
    id: 'theme3',
    anchor: THEME_3_BACKGROUND_ANCHOR,
    gradient: THEME_3_PAGE_GRADIENT,
    className: 'theme-3-page',
  },
  {
    id: 'theme4',
    anchor: THEME_4_BACKGROUND_ANCHOR,
    gradient: THEME_4_PAGE_GRADIENT,
    className: 'theme-4-page',
  },
];

/** Theme 3/4: fixed multi-stop page gradient matched by Background anchor hex. */
export function getFixedGradientPageTheme(background) {
  const norm = normalizeThemeHex(background);
  return (
    FIXED_GRADIENT_PAGE_THEMES.find(
      (theme) => normalizeThemeHex(theme.anchor) === norm
    ) ?? null
  );
}

export function usesTheme3PageGradient(background) {
  return getFixedGradientPageTheme(background)?.id === 'theme3';
}

export function usesTheme4PageGradient(background) {
  return getFixedGradientPageTheme(background)?.id === 'theme4';
}

/** Gold, Theme 3, or Theme 4: light page chrome — export trigger uses dark text on light surfaces. */
export function usesLightPageExportChrome(background) {
  return (
    usesGoldPageTheme(background) ||
    usesTheme3PageGradient(background) ||
    usesTheme4PageGradient(background)
  );
}

/** Theme 2 (Gold preset): exact Background anchor only — custom light colors use dynamic theme. */
export function usesGoldPageTheme(background) {
  return normalizeThemeHex(background) === normalizeThemeHex(GOLD_BACKGROUND_ANCHOR);
}

/** User-picked colors from the hex picker (not Gold / Blue / Brown presets). */
export function usesCustomApplicationTheme(background) {
  if (!normalizeThemeHex(background)) return false;
  if (getFixedGradientPageTheme(background)) return false;
  if (usesGoldPageTheme(background)) return false;
  return true;
}

/** Themes 2–4 use palette-matched buttons; other themes keep saved Button color. */
export function resolveThemeButtonStyle(button, background) {
  if (usesTheme4PageGradient(background)) {
    return {
      solid: THEME_4_BUTTON_SOLID,
      background: THEME_4_TAB_PILL_GRADIENT,
      text: '#ffffff',
    };
  }
  if (usesTheme3PageGradient(background)) {
    return {
      solid: THEME_3_BUTTON_SOLID,
      background: THEME_3_TAB_PILL_GRADIENT,
      text: '#ffffff',
    };
  }
  if (usesGoldPageTheme(background)) {
    return {
      solid: GOLD_THEME_BUTTON_SOLID,
      background: GOLD_THEME_SURFACE_GRADIENT,
      text: '#ffffff',
    };
  }
  if (usesCustomApplicationTheme(background)) {
    const accentSolid = resolveCustomNavbarSolid(background);
    const accentGradient = buildCustomDashboardSurfaceGradient(background);
    return {
      solid: accentSolid,
      background: accentGradient,
      text: '#ffffff',
    };
  }
  const solid = button || '#232323';
  return {
    solid,
    background: solid,
    text: isLightSurface(solid) ? 'rgba(0, 0, 0, 0.87)' : '#ffffff',
  };
}

export function getThemeButtonColor(button, background) {
  return resolveThemeButtonStyle(button, background).solid;
}

/** Page shell background; Themes 3 & 4 use fixed gradients only. */
export function buildAppPageBackground(background, { withRadialOverlay = true } = {}) {
  const fixed = getFixedGradientPageTheme(background);
  if (fixed) {
    return fixed.gradient;
  }
  const base = background || '#6f809d';
  const lightBg = lighten(base, 0.25);
  const veryLightBg = lighten(base, 0.55);
  const linear = `linear-gradient(135deg, ${base} 0%, ${lightBg} 35%, ${veryLightBg} 100%)`;
  if (!withRadialOverlay) {
    return linear;
  }
  return `radial-gradient(circle at 88% 6%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.12) 20%, rgba(255,255,255,0.05) 40%, transparent 70%), ${linear}`;
}

const DEFAULT_NAVBAR_COLOR = '#3d4a5c';

/**
 * Panel surfaces for custom themes — always derived from Background (like Blue/Gold/Brown presets).
 * Content color is not used here so saved slate defaults do not paint panels blue.
 */
export function resolveCustomThemePanelBg(background, _content) {
  const bg = normalizeThemeHex(background) || '#6f809d';
  return blendHexTowardWhite(bg, isLightSurface(bg) ? 0.92 : 0.78);
}

export function resolveCustomThemeSectionBg(_panelBg, background, _content) {
  const bg = normalizeThemeHex(background) || '#6f809d';
  return blendHexTowardWhite(bg, isLightSurface(bg) ? 0.86 : 0.7);
}

/** Readable page-level text for MUI + inherited UI on light preset pages. */
export function resolveApplicationPageTextOn(background) {
  if (usesGoldPageTheme(background)) {
    return onContentColors(GOLD_THEME_LIGHT_SURFACE_TEXT);
  }
  if (usesTheme4PageGradient(background)) {
    return onContentColors(THEME_4_LIGHT_SURFACE_TEXT);
  }
  if (usesTheme3PageGradient(background)) {
    return onContentColors(THEME_3_LIGHT_SURFACE_TEXT);
  }
  if (usesCustomApplicationTheme(background)) {
    return onContentColors(normalizeThemeHex(background) || '#6f809d');
  }
  return onContentColors(normalizeThemeHex(background) || '#6f809d');
}

/** MUI paper / card surface matched to the active theme. */
export function resolveApplicationPaperSurface(background, content) {
  if (usesGoldPageTheme(background)) {
    return GOLD_THEME_LIGHT_PANEL_BG;
  }
  if (usesTheme4PageGradient(background)) {
    return THEME_4_LIGHT_PANEL_BG;
  }
  if (usesTheme3PageGradient(background)) {
    return THEME_3_LIGHT_PANEL_BG;
  }
  if (usesCustomApplicationTheme(background)) {
    return resolveCustomThemePanelBg(background, content);
  }
  return normalizeThemeHex(content) || '#3d4a5c';
}

function pickCustomNavbarBaseFromBackground(background) {
  const base = normalizeThemeHex(background) || DEFAULT_NAVBAR_COLOR;
  if (isLightSurface(base)) {
    return darken(base, 0.45);
  }
  return darken(base, 0.06);
}

/** Navbar gradient for custom hex-picker themes — derived from Background color. */
export function buildCustomNavbarGradient(background) {
  const resolvedBackground = normalizeThemeHex(background) || DEFAULT_NAVBAR_COLOR;
  const base = pickCustomNavbarBaseFromBackground(resolvedBackground);
  if (isLightSurface(resolvedBackground)) {
    return `linear-gradient(90deg, ${darken(base, 0.1)} 0%, ${darken(base, 0.04)} 25%, ${base} 50%, ${darken(base, 0.12)} 75%, ${darken(base, 0.2)} 100%)`;
  }
  const lightNavbar = lighten(base, 0.12);
  return `linear-gradient(90deg, ${base} 0%, ${lightNavbar} 100%)`;
}

export function resolveCustomNavbarSolid(background) {
  return pickCustomNavbarBaseFromBackground(background);
}

/** Dashboard Energy/Space/Alerts tab pill + chart card gradient (custom themes only). */
export function buildCustomDashboardSurfaceGradient(background) {
  const resolvedBackground = normalizeThemeHex(background) || DEFAULT_NAVBAR_COLOR;
  const base = pickCustomNavbarBaseFromBackground(resolvedBackground);
  if (isLightSurface(resolvedBackground)) {
    const edge = darken(base, 0.1);
    const mid = darken(base, 0.04);
    return `linear-gradient(90deg, ${edge} 0%, ${mid} 25%, ${base} 50%, ${mid} 75%, ${edge} 100%)`;
  }
  const edge = darken(base, 0.14);
  const mid = darken(base, 0.06);
  const center = lighten(base, 0.08);
  return `linear-gradient(90deg, ${edge} 0%, ${mid} 25%, ${center} 50%, ${mid} 75%, ${edge} 100%)`;
}

/** Header navbar gradient for the active application theme (presets + custom). */
export function resolveApplicationNavbarBackground(background, content, button) {
  if (usesTheme4PageGradient(background)) {
    return THEME_4_NAVBAR_GRADIENT;
  }
  if (usesTheme3PageGradient(background)) {
    return THEME_3_NAVBAR_GRADIENT;
  }
  if (usesGoldPageTheme(background)) {
    return GOLD_NAVBAR_GRADIENT;
  }
  if (usesCustomApplicationTheme(background)) {
    return buildCustomNavbarGradient(background);
  }
  const navbarColor = normalizeThemeHex(content) || DEFAULT_NAVBAR_COLOR;
  return `linear-gradient(90deg, ${navbarColor} 0%, ${lighten(navbarColor, 0.12)} 100%)`;
}

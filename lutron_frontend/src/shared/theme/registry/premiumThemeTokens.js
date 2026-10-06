import { alpha } from '@mui/material/styles';

/** Shared premium elevation / chrome tokens (CSS variables on :root). */

const PREMIUM_VAR_KEYS = [
  '--premium-radius-sm',
  '--premium-radius-md',
  '--premium-radius-lg',
  '--premium-motion-fast',
  '--premium-motion-normal',
  '--premium-easing',
  '--premium-card-border',
  '--premium-card-shadow',
  '--premium-panel-shadow',
  '--premium-border-subtle',
  '--premium-button-shadow',
  '--premium-button-shadow-hover',
  '--topbar-nav-pill-shadow',
  '--premium-dialog-shadow',
];

export function clearPremiumThemeTokens(root) {
  PREMIUM_VAR_KEYS.forEach((key) => root.style.removeProperty(key));
}

const SHARED = {
  '--premium-radius-sm': '8px',
  '--premium-radius-md': '12px',
  '--premium-radius-lg': '16px',
  '--premium-motion-fast': '150ms',
  '--premium-motion-normal': '250ms',
  '--premium-easing': 'cubic-bezier(0.22, 1, 0.36, 1)',
};

/** Gold (light mustard page + brown chrome). */
export function applyGoldPremiumThemeTokens(root) {
  Object.entries(SHARED).forEach(([k, v]) => root.style.setProperty(k, v));
  root.style.setProperty('--premium-card-border', '1px solid rgba(74, 67, 52, 0.22)');
  root.style.setProperty('--premium-card-shadow', '0 8px 24px rgba(74, 67, 52, 0.12)');
  root.style.setProperty('--premium-panel-shadow', '0 4px 18px rgba(74, 67, 52, 0.1)');
  root.style.setProperty('--premium-border-subtle', 'rgba(74, 67, 52, 0.22)');
  root.style.setProperty(
    '--premium-button-shadow',
    'inset 0 1px 0 rgba(255, 255, 255, 0.14)'
  );
  root.style.setProperty(
    '--premium-button-shadow-hover',
    'inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 4px 14px rgba(74, 67, 52, 0.24)'
  );
  root.style.setProperty('--topbar-nav-pill-shadow', '0 2px 12px rgba(74, 67, 52, 0.22)');
  root.style.setProperty('--premium-dialog-shadow', '0 12px 32px rgba(74, 67, 52, 0.2)');
}

/** Theme 3 — Blue slate gradient page. */
export function applyTheme3PremiumThemeTokens(root) {
  Object.entries(SHARED).forEach(([k, v]) => root.style.setProperty(k, v));
  root.style.setProperty('--premium-card-border', '1px solid rgba(61, 74, 92, 0.28)');
  root.style.setProperty('--premium-card-shadow', '0 8px 24px rgba(45, 58, 74, 0.14)');
  root.style.setProperty('--premium-panel-shadow', '0 4px 18px rgba(45, 58, 74, 0.12)');
  root.style.setProperty('--premium-border-subtle', 'rgba(61, 74, 92, 0.22)');
  root.style.setProperty(
    '--premium-button-shadow',
    'inset 0 1px 0 rgba(255, 255, 255, 0.12)'
  );
  root.style.setProperty(
    '--premium-button-shadow-hover',
    'inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 4px 14px rgba(45, 58, 74, 0.28)'
  );
  root.style.setProperty('--topbar-nav-pill-shadow', '0 2px 12px rgba(45, 58, 74, 0.2)');
  root.style.setProperty('--premium-dialog-shadow', '0 12px 32px rgba(45, 58, 74, 0.22)');
}

/** Custom hex-picker themes — elevation matched to background accent. */
export function applyCustomPremiumThemeTokens(root, accentSolid = '#3d4a5c') {
  const tint = String(accentSolid).trim() || '#3d4a5c';
  Object.entries(SHARED).forEach(([k, v]) => root.style.setProperty(k, v));
  root.style.setProperty('--premium-card-border', `1px solid ${alpha(tint, 0.28)}`);
  root.style.setProperty('--premium-card-shadow', `0 8px 24px ${alpha(tint, 0.18)}`);
  root.style.setProperty('--premium-panel-shadow', `0 4px 18px ${alpha(tint, 0.14)}`);
  root.style.setProperty('--premium-border-subtle', alpha(tint, 0.24));
  root.style.setProperty(
    '--premium-button-shadow',
    'inset 0 1px 0 rgba(255, 255, 255, 0.12)'
  );
  root.style.setProperty(
    '--premium-button-shadow-hover',
    `inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 4px 14px ${alpha(tint, 0.26)}`
  );
  root.style.setProperty('--topbar-nav-pill-shadow', `0 2px 12px ${alpha(tint, 0.22)}`);
  root.style.setProperty('--premium-dialog-shadow', `0 12px 32px ${alpha(tint, 0.22)}`);
}

/** Theme 4 — Brown / warm tan page. */
export function applyTheme4PremiumThemeTokens(root) {
  Object.entries(SHARED).forEach(([k, v]) => root.style.setProperty(k, v));
  root.style.setProperty('--premium-card-border', '1px solid rgba(64, 58, 49, 0.24)');
  root.style.setProperty('--premium-card-shadow', '0 8px 24px rgba(64, 58, 49, 0.14)');
  root.style.setProperty('--premium-panel-shadow', '0 4px 18px rgba(64, 58, 49, 0.11)');
  root.style.setProperty('--premium-border-subtle', 'rgba(64, 58, 49, 0.22)');
  root.style.setProperty(
    '--premium-button-shadow',
    'inset 0 1px 0 rgba(255, 255, 255, 0.12)'
  );
  root.style.setProperty(
    '--premium-button-shadow-hover',
    'inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 4px 14px rgba(64, 58, 49, 0.26)'
  );
  root.style.setProperty('--topbar-nav-pill-shadow', '0 2px 12px rgba(64, 58, 49, 0.24)');
  root.style.setProperty('--premium-dialog-shadow', '0 12px 32px rgba(64, 58, 49, 0.22)');
}

// Shared theme constants used across the dashboard / widgets.
// Keep visual values here so every screen renders the same premium look,
// and so a single edit re-themes the whole dashboard.

// Premium dark slate-blue gradient for chart/widget cards (matches navbar palette).
// Subtle vertical gradient (lighter top → deeper bottom) gives premium depth without
// the radial highlight that visually scaled with card size and made small cards look
// lighter than wide cards. Now every card renders uniformly dark regardless of size.
//
// Previous brown card background (kept for quick rollback):
// export const CARD_BACKGROUND = 'rgba(128, 120, 100, 0.6)';
// Previous translucent slate attempt (kept for quick rollback):
// export const CARD_BACKGROUND = 'linear-gradient(135deg, rgba(47, 58, 74, 0.92) 0%, rgba(61, 74, 92, 0.85) 100%)';
// Previous radial-highlight variant (kept for quick rollback - looked uneven on small cards):
// export const CARD_BACKGROUND = 'radial-gradient(ellipse at top, rgba(74, 90, 120, 0.35) 0%, transparent 60%), linear-gradient(180deg, #2e3a4f 0%, #1f2735 100%)';
/** Brown gradient for gold/light application themes (dashboard + heatmap). */
export const GOLD_THEME_SURFACE_GRADIENT =
  'linear-gradient(180deg, #4A4334 0%, #443D2E 50%, #3D3629 100%)';

/** Solid fill for Theme 2 (gold) primary buttons — matches surface gradient anchor. */
export const GOLD_THEME_BUTTON_SOLID = '#4A4334';

/** Heatmap / dashboard sliding tab indicator on gold theme (white pill on brown track). */
export const GOLD_THEME_TAB_INDICATOR_BG = '#ffffff';

/** Light yellow panels on gold page (schedule forms, settings theme box, area picker). */
export const GOLD_THEME_LIGHT_PANEL_BG = '#faf0d4';
export const GOLD_THEME_LIGHT_SECTION_BG = '#f5e8bc';
export const GOLD_THEME_LIGHT_SURFACE_TEXT = '#2c2820';

/** Theme 3 — fixed slate page/footer gradient (Background anchor #58687B). */
export const THEME_3_PAGE_GRADIENT =
  'radial-gradient(circle at 88% 6%, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.14) 32%, transparent 62%), ' +
  'linear-gradient(135deg, #58687B 0%, #6F8096 22%, #859AB7 48%, #C8CED9 72%, #E8E9F0 100%)';
export const THEME_3_BACKGROUND_ANCHOR = '#58687B';
/** Slate pill/button gradient for Theme 3 (matches page anchor tones). */
export const THEME_3_TAB_PILL_GRADIENT =
  'linear-gradient(90deg, #3D4A5C 0%, #4A586C 25%, #58687B 50%, #4A586C 75%, #3D4A5C 100%)';
export const THEME_3_BUTTON_SOLID = '#3D4A5C';
/** Cool gray-blue shells on Theme 3 page (settings, tables, dialogs). */
export const THEME_3_LIGHT_PANEL_BG = '#f4f6f9';
export const THEME_3_LIGHT_SECTION_BG = '#e8ecf2';
export const THEME_3_LIGHT_SURFACE_TEXT = '#1a2a42';
/** Navbar matches slate pill gradient on Blue theme. */
export const THEME_3_NAVBAR_GRADIENT = THEME_3_TAB_PILL_GRADIENT;

/** Theme 4 — warm tan page gradient with radial glow (Background anchor #A89773). */
export const THEME_4_PAGE_GRADIENT =
  'radial-gradient(circle at 50% 20%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 35%, transparent 70%), linear-gradient(180deg, #A89773 0%, #C7BA9A 18%, #DDD2BA 50%, #E7DDC8 100%)';
export const THEME_4_BACKGROUND_ANCHOR = '#A89773';
export const THEME_4_NAVBAR_GRADIENT =
  'linear-gradient(90deg, #4A4439 0%, #544D42 20%, #5A5348 50%, #544D42 80%, #4A4439 100%)';
export const THEME_4_TAB_PILL_GRADIENT =
  'linear-gradient(90deg, #403A31 0%, #4B453B 25%, #575045 50%, #4B453B 75%, #403A31 100%)';

/** Light warm panels on Theme 4 page (settings shell, tables, FOFP viewer). */
export const THEME_4_LIGHT_PANEL_BG = '#faf6ef';
export const THEME_4_LIGHT_SECTION_BG = '#f0ebe3';
export const THEME_4_LIGHT_SURFACE_TEXT = '#2c2820';
/** Solid fill for Theme 4 buttons (gradient uses THEME_4_TAB_PILL_GRADIENT). */
export const THEME_4_BUTTON_SOLID = '#403A31';

/** Theme 2 (Gold) page background anchor — exact match enables gold preset palette. */
export const GOLD_BACKGROUND_ANCHOR = '#E6C84C';

/** Gold / Blue / Brown anchors — included in Settings → Theme hex picker swatches. */
export const THEME_BACKGROUND_PRESETS = [
  { id: 'gold', label: 'Gold', color: GOLD_BACKGROUND_ANCHOR },
  { id: 'theme3', label: 'Blue', color: THEME_3_BACKGROUND_ANCHOR },
  { id: 'theme4', label: 'Brown', color: THEME_4_BACKGROUND_ANCHOR },
];

/** Advanced Theme Reset — second background preset swatch (Blue). */
export const ADVANCED_THEME_RESET_BACKGROUND_SWATCH = THEME_BACKGROUND_PRESETS[1].color;

/** Settings shell panels (all settings routes). */
export const SETTINGS_PANEL_OUTER_BG = 'var(--settings-panel-outer-bg, #ffffff)';
export const SETTINGS_PANEL_INNER_BG = 'var(--settings-panel-inner-bg, #ffffff)';

// Allow ThemeContext to override card background per selected theme.
export const CARD_BACKGROUND =
  'var(--dashboard-card-background, linear-gradient(180deg, #2a3445 0%, #1c2330 100%))';

// Subtle light-gray border that lifts the dark card off the page background
// (matches the Space Utilization "Instant Occupancy Count" reference look).
//
// Previous dark-edge variant (kept for quick rollback):
// export const CARD_BORDER = '1px solid rgba(255, 255, 255, 0.08)';
export const CARD_BORDER = 'var(--premium-card-border, 1px solid #ccc)';

/** Inner plot border for advanced space charts — matches ChartLoader shell while loading. */
export const ADVANCED_SPACE_CHART_PLOT_BORDER = '1px solid #ddd';

// Soft, light drop shadow for refined depth without a heavy black halo
// (matches the Space Utilization "Instant Occupancy Count" reference look).
//
// Previous heavy-spread variant (kept for quick rollback):
// export const CARD_SHADOW = '0 4px 20px rgba(0, 0, 0, 0.25)';
export const CARD_SHADOW = 'var(--premium-card-shadow, 0 2px 4px rgba(0, 0, 0, 0.1))';

/** Dashboard chart tooltips / loading shells (theme via CSS variables). */
export const DASHBOARD_CHART_TOOLTIP_STYLE = {
  background: 'var(--dashboard-chart-tooltip-bg, #3d4a5c)',
  border: '1px solid var(--dashboard-chart-tooltip-border-color, #ffffff)',
  borderRadius: '4px',
  color: 'var(--dashboard-chart-tooltip-text, #ffffff)',
  fontSize: '12px',
};

export const DASHBOARD_CHART_LOADING_BG = 'var(--dashboard-chart-loading-bg, #232323)';

export const DASHBOARD_CHART_LOADING_SPINNER_STYLE = {
  border: '3px solid var(--dashboard-chart-loading-spinner-track, #555555)',
  borderTop: '3px solid var(--dashboard-chart-loading-spinner-head, #ffffff)',
};

// Slightly lighter / more translucent variant - useful for nested panels, tooltips
// and "second-tier" surfaces that should look distinct from the main card.
//
// Previous brown variant (kept for quick rollback):
// export const CARD_BACKGROUND_SOFT = 'rgba(128, 120, 100, 0.5)';
export const CARD_BACKGROUND_SOFT =
  'linear-gradient(135deg, rgba(58, 69, 85, 0.78) 0%, rgba(74, 86, 103, 0.70) 100%)';

// Light cool gray-blue used for "light surface" elements that previously used
// the tan accent #CDC0A0 (table headers, dropdown menus, dialog title bars,
// tooltip backgrounds, schedule swatches, sensor/module status chips, etc.).
// Maintains the original lightness so existing dark text stays legible,
// just shifted from a warm tan to a cool gray-blue to fit the new theme.
//
// Previous tan accent (kept for quick rollback):
// export const SURFACE_ACCENT = '#CDC0A0';
export const SURFACE_ACCENT = '#d6dde8';

import { isLightSurface, onContentColors } from '../../theme/utils/themeOnSurface';

const BASIC_ACTION_BLUE = '#1565C0';
const BASIC_ACCENT_BLUE = '#1976d2';
const DEFAULT_DARK_GRID = '#676050';
const DEFAULT_EVENT_ACTIVE =
  'linear-gradient(90deg, #1E75BB 0%, #3A8DFF 100%)';
const DEFAULT_EVENT_INACTIVE =
  'linear-gradient(90deg, #b0b0b0 0%, #d3d3d3 100%)';

function readCssVar(name, fallback = '') {
  if (typeof document === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function resolveInkOnSurface(surfaceColor, fallback = '#ffffff') {
  const color = String(surfaceColor || '').trim();
  if (!color) return fallback;
  if (color.includes('gradient') || color.includes('linear-gradient')) {
    return fallback;
  }
  return isLightSurface(color) ? onContentColors(color).primary : fallback;
}

function resolveGridLineColor(gridBg, scheduleCalendarChrome) {
  if (scheduleCalendarChrome === 'light') {
    return '#e0e0e0';
  }
  const fromVar = readCssVar('--schedule-grid-line-color');
  if (fromVar) return fromVar;
  const surface = String(gridBg || '').trim();
  if (surface.includes('gradient')) {
    return 'rgba(255, 255, 255, 0.24)';
  }
  return isLightSurface(surface) ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.24)';
}

/**
 * Resolves Schedule calendar chrome colors.
 * - basic `light` binding: blue-on-white (basic variant)
 * - advanced themed pages: CSS vars from gold / theme3 / theme4 / custom presets
 * - default: dark grid with light page text (slate advanced)
 */
export function resolveScheduleCalendarColors({
  scheduleCalendarChrome = 'dark',
  themeBackground = '#ffffff',
} = {}) {
  if (scheduleCalendarChrome === 'light') {
    const lightScheduleText = onContentColors('#ffffff').primary;
    return {
      pageText: lightScheduleText,
      actionButtonColor: BASIC_ACTION_BLUE,
      accentColor: BASIC_ACCENT_BLUE,
      buttonTextColor: '#ffffff',
      panelBg: themeBackground,
      gridBg: '#ffffff',
      headerBg: '#ffffff',
      headerText: lightScheduleText,
      timeText: lightScheduleText,
      todayBg: BASIC_ACCENT_BLUE,
      todayText: '#ffffff',
      eventActiveBg: DEFAULT_EVENT_ACTIVE,
      eventInactiveBg: DEFAULT_EVENT_INACTIVE,
      eventActiveText: '#ffffff',
      gridBorder: '#e0e0e0',
      gridLineColor: '#e0e0e0',
      tableText: '#222222',
      filterBg: '#fafbfc',
      filterText: '#222222',
      filterBorder: '#e0e0e0',
    };
  }

  const lightPage = isLightSurface(themeBackground);
  const gridBg = readCssVar('--schedule-grid-bg', DEFAULT_DARK_GRID);
  const gridInk = resolveInkOnSurface(gridBg, '#ffffff');
  const pageText = lightPage
    ? readCssVar(
        '--schedule-page-heading-text',
        onContentColors(themeBackground).primary
      )
    : '#ffffff';

  const gridLineColor = resolveGridLineColor(gridBg, scheduleCalendarChrome);

  return {
    pageText,
    actionButtonColor: readCssVar('--app-button', 'var(--app-button)'),
    accentColor: readCssVar('--schedule-status-text', '#1E75BB'),
    buttonTextColor: readCssVar('--app-button-text', '#ffffff'),
    panelBg: readCssVar('--schedule-grid-bg', gridBg),
    gridBg,
    headerBg: gridBg,
    headerText: gridInk,
    timeText: gridInk,
    todayBg: readCssVar('--schedule-today-bg', '#1E75BB'),
    todayText: readCssVar('--schedule-today-text', '#ffffff'),
    eventActiveBg: readCssVar('--schedule-event-active-bg', DEFAULT_EVENT_ACTIVE),
    eventInactiveBg: DEFAULT_EVENT_INACTIVE,
    eventActiveText: readCssVar('--schedule-event-active-text', '#ffffff'),
    gridBorder: readCssVar('--schedule-panel-border', '#e0e0e0'),
    gridLineColor,
    tableText: gridInk,
    filterBg: readCssVar('--schedule-select-bg', '#fafbfc'),
    filterText: readCssVar('--schedule-select-text', lightPage ? pageText : '#222222'),
    filterBorder: readCssVar('--schedule-panel-border', '#e0e0e0'),
  };
}

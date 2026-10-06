import { isLightSurface, onContentColors } from '../../theme/utils/themeOnSurface';

const BASIC_ACTION_BLUE = '#1565C0';

function readCssVar(name, fallback = '') {
  if (typeof document === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

const LIGHT_THEME = {
  isLight: true,
  useAdvancedFormChrome: false,
  useSeparateFieldCards: false,
  buttonColor: BASIC_ACTION_BLUE,
  sectionBg: '#ffffff',
  sectionPadding: 16,
  sectionRadius: 12,
  sectionBorder: '1px solid #b3e5fc',
  sectionTextColor: 'rgba(0, 0, 0, 0.87)',
  panelShellBg: '#90caf9',
  panelShellPadding: 20,
  groupedCardBg: 'transparent',
  inputDisabledBg: '#f5f5f5',
  inputColor: 'rgba(0, 0, 0, 0.87)',
  labelColor: 'rgba(0, 0, 0, 0.87)',
  readonlyFieldBg: '#e3f2fd',
  radioSelected: BASIC_ACTION_BLUE,
  annualAddBorder: `1px solid ${BASIC_ACTION_BLUE}`,
  annualAddBg: '#ffffff',
  annualChipRemoveBg: BASIC_ACTION_BLUE,
  modalBg: '#ffffff',
  modalTitleColor: 'rgba(0, 0, 0, 0.87)',
  modalBodyTextColor: 'rgba(0, 0, 0, 0.87)',
  modalSectionLabelColor: 'rgba(0, 0, 0, 0.87)',
  colonColor: 'rgba(0, 0, 0, 0.87)',
  dayUnselectedBorder: `1px solid ${BASIC_ACTION_BLUE}`,
  listTextColor: 'rgba(0, 0, 0, 0.87)',
  listBorderColor: '#e0e0e0',
  rightPanelBg: '#ffffff',
  headerTextColor: 'rgba(0, 0, 0, 0.87)',
  listHeaderBg: '#1565C0',
  listHeaderColor: '#ffffff',
  listHeaderBorderBottom: '1px solid rgba(255,255,255,0.35)',
  listHeaderPadding: '10px 12px',
  listHeaderFontWeight: 700,
  listRowAltBg: 'rgba(0,0,0,0.03)',
  fieldCardBg: undefined,
  fieldCardBorder: undefined,
  fieldCardRadius: 16,
  fieldCardPadding: 16,
  fieldCardGap: 14,
  rightPanelShadow: '0 2px 8px rgba(0,0,0,0.04)',
  inputBorder: '1px solid #ccc',
  dayUnselectedBg: '#ffffff',
  modalSelectBg: '#ffffff',
    modalSelectText: 'rgba(0, 0, 0, 0.87)',
};

/** Legacy customized schedule form chrome (pre-advanced themed cards). */
const CUSTOMIZED_THEME = {
  isLight: false,
  useAdvancedFormChrome: false,
  useSeparateFieldCards: false,
  buttonColor: 'var(--app-button)',
  sectionBg: '#807864',
  sectionPadding: 5,
  sectionRadius: 5,
  sectionBorder: undefined,
  sectionTextColor: '#ffffff',
  panelShellBg: undefined,
  panelShellPadding: 0,
  groupedCardBg: '#ffffff',
  inputDisabledBg: '#e0dbce',
  inputColor: 'var(--app-button)',
  labelColor: '#000000',
  readonlyFieldBg: '#e0dbce',
  radioSelected: '#000000',
  annualAddBorder: '1px solid #a89c81',
  annualAddBg: '#f7f4ed',
  annualChipRemoveBg: '#a89c81',
  modalBg: '#CDC0A0',
  modalTitleColor: undefined,
  modalBodyTextColor: undefined,
  modalSectionLabelColor: undefined,
  colonColor: '#ffffff',
  dayUnselectedBorder: '1px solid #ccc',
  listTextColor: '#ffffff',
  listBorderColor: '#b2a98b',
  rightPanelBg: undefined,
  headerTextColor: '#ffffff',
  listHeaderBg: undefined,
  listHeaderColor: '#ffffff',
  listHeaderBorderBottom: '1px solid #ccc',
  listHeaderPadding: undefined,
  listHeaderFontWeight: 500,
  listRowAltBg: 'rgba(255,255,255,0.01)',
  fieldCardBg: undefined,
  fieldCardBorder: undefined,
  fieldCardRadius: 16,
  fieldCardPadding: 16,
  fieldCardGap: 14,
  rightPanelShadow: '0 2px 8px rgba(0,0,0,0.04)',
  inputBorder: '1px solid #ccc',
  dayUnselectedBg: '#ffffff',
  modalSelectBg: '#ffffff',
  modalSelectText: '#000000',
};

function isGradientSurface(surface) {
  return String(surface || '').toLowerCase().includes('gradient');
}

function resolveSectionTextColor(sectionBg) {
  const surface = String(sectionBg || '').trim();
  if (isGradientSurface(surface)) {
    return readCssVar('--schedule-section-text', '#ffffff');
  }
  if (isLightSurface(surface)) {
    return readCssVar(
      '--schedule-panel-label',
      onContentColors(surface).primary
    );
  }
  return readCssVar('--schedule-section-text', '#ffffff');
}

function resolveModalInk(modalBg) {
  const surface = String(modalBg || '').trim();
  const title = readCssVar('--schedule-modal-title-color');
  const body = readCssVar('--schedule-modal-body-text');
  const sectionLabel = readCssVar('--schedule-modal-section-label-color');
  const panelLabel = readCssVar('--schedule-panel-label', '#1a2a42');

  if (isGradientSurface(surface) || !isLightSurface(surface)) {
    return {
      modalTitleColor: title || '#ffffff',
      modalBodyTextColor: body || '#ffffff',
      modalSectionLabelColor: sectionLabel || body || '#ffffff',
    };
  }

  return {
    modalTitleColor: title || panelLabel,
    modalBodyTextColor: body || panelLabel,
    modalSectionLabelColor: sectionLabel || panelLabel,
  };
}

function buildThemedDarkTheme() {
  const panelBorder = readCssVar('--schedule-panel-border', '#b8c5d6');
  const panelBg = readCssVar('--schedule-panel-bg', '#d6dde8');
  const sectionBg = readCssVar('--schedule-section-bg', '#4a586c');
  const sectionTextColor = resolveSectionTextColor(sectionBg);
  const modalBg = readCssVar('--schedule-modal-bg', readCssVar('--schedule-panel-bg', '#d6dde8'));
  const modalInk = resolveModalInk(modalBg);

  return {
    isLight: false,
    useAdvancedFormChrome: true,
    useSeparateFieldCards: true,
    buttonColor: readCssVar('--app-button', 'var(--app-button)'),
    sectionBg,
    sectionPadding: 12,
    sectionRadius: 8,
    sectionInnerGap: 12,
    sectionBorder: undefined,
    sectionTextColor,
    panelShellBg: undefined,
    panelShellPadding: 0,
    groupedCardBg: 'transparent',
    inputDisabledBg: readCssVar('--schedule-select-bg', '#e0dbce'),
    inputColor: readCssVar('--app-button', 'var(--app-button)'),
    labelColor: readCssVar('--schedule-panel-label', '#1a2a42'),
    readonlyFieldBg: readCssVar('--schedule-select-bg', '#e0dbce'),
    radioSelected: readCssVar('--schedule-panel-label', '#1a2a42'),
    annualAddBorder: `1px solid ${panelBorder}`,
    annualAddBg: readCssVar('--schedule-select-bg', '#ffffff'),
    annualChipRemoveBg: readCssVar('--schedule-section-bg', '#4a586c'),
    modalBg,
    ...modalInk,
    colonColor: sectionTextColor,
    dayUnselectedBorder: `1px solid ${panelBorder}`,
    listTextColor: readCssVar('--schedule-panel-label', '#1a2a42'),
    listBorderColor: readCssVar(
      '--premium-border-subtle',
      panelBorder
    ),
    rightPanelBg: readCssVar('--schedule-panel-bg', '#d6dde8'),
    headerTextColor: readCssVar('--schedule-panel-label', '#1a2a42'),
    listHeaderBg: undefined,
    listHeaderColor: readCssVar('--schedule-panel-label', '#1a2a42'),
    listHeaderBorderBottom: `1px solid ${panelBorder}`,
    listHeaderPadding: undefined,
    listHeaderFontWeight: 600,
    listRowAltBg: 'rgba(255,255,255,0.01)',
    fieldCardBg: panelBg,
    fieldCardBorder: `1px solid ${panelBorder}`,
    fieldCardRadius: 16,
    fieldCardPadding: 16,
    fieldCardGap: 14,
    rightPanelShadow: readCssVar(
      '--premium-card-shadow',
      '0 8px 24px rgba(0, 0, 0, 0.12)'
    ),
    inputBorder: `1px solid ${panelBorder}`,
    dayUnselectedBg: readCssVar('--schedule-select-bg', '#ffffff'),
    modalSelectBg: readCssVar('--schedule-select-bg', '#ffffff'),
    modalSelectText: readCssVar('--schedule-select-text', readCssVar('--schedule-panel-label', '#1a2a42')),
  };
}

export function getScheduleFormTheme(scheduleCalendarChrome = 'dark') {
  if (scheduleCalendarChrome === 'light') return LIGHT_THEME;
  if (scheduleCalendarChrome === 'customized') return CUSTOMIZED_THEME;
  return buildThemedDarkTheme();
}

export function scheduleSectionBox(theme, extra = {}) {
  const sectionBg = theme.sectionBg;
  const usesGradient = isGradientSurface(sectionBg);

  return {
    ...(usesGradient ? { background: sectionBg } : { backgroundColor: sectionBg }),
    color: theme.sectionTextColor,
    padding: theme.sectionPadding,
    borderRadius: theme.sectionRadius,
    ...(theme.sectionBorder ? { border: theme.sectionBorder } : {}),
    ...extra,
  };
}

export function scheduleFieldCardShell(theme, extra = {}) {
  if (!theme.useSeparateFieldCards) {
    const { marginBottom = 12, ...rest } = extra;
    return { marginBottom, ...rest };
  }
  return {
    background: theme.fieldCardBg,
    border: theme.fieldCardBorder,
    borderRadius: theme.fieldCardRadius,
    padding: theme.fieldCardPadding,
    boxSizing: 'border-box',
    ...extra,
  };
}

export function scheduleFormSectionsColumn(theme, { isLargeScreen, isDesktop } = {}) {
  const innerGap = theme.sectionInnerGap ?? theme.fieldCardGap ?? 12;

  if (theme.useSeparateFieldCards) {
    return {
      ...scheduleFieldCardShell(theme),
      display: 'flex',
      flexDirection: 'column',
      gap: innerGap,
    };
  }

  return {
    background: theme.groupedCardBg,
    borderRadius: 12,
    padding: isLargeScreen ? 24 : isDesktop ? 20 : 18,
    marginBottom: 0,
    marginTop: isLargeScreen ? 24 : isDesktop ? 20 : 18,
    display: 'flex',
    flexDirection: 'column',
    gap: isLargeScreen ? 24 : isDesktop ? 20 : 18,
  };
}

export function scheduleFormSectionCard(theme, extra = {}) {
  return scheduleSectionBox(theme, extra);
}

export function scheduleRightPanelShell(theme, { isLargeScreen, isDesktop } = {}) {
  const padding = theme.useSeparateFieldCards
    ? (isLargeScreen ? 24 : isDesktop ? 22 : 20)
    : 25;

  if (!theme.rightPanelBg) {
    return { padding };
  }

  return {
    background: theme.rightPanelBg,
    borderRadius: theme.fieldCardRadius || 16,
    ...(theme.fieldCardBorder ? { border: theme.fieldCardBorder } : {}),
    boxShadow: theme.rightPanelShadow,
    padding,
    boxSizing: 'border-box',
  };
}

export function scheduleLegacyModalPanelStyle(theme, buttonColor, extra = {}) {
  return {
    background: theme.modalBg,
    borderRadius: 18,
    padding: 28,
    boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
    position: 'relative',
    color: buttonColor,
    boxSizing: 'border-box',
    ...extra,
  };
}

export function scheduleLegacyModalTitleStyle(buttonColor, extra = {}) {
  return {
    marginBottom: 16,
    fontWeight: 600,
    fontSize: 18,
    color: buttonColor,
    ...extra,
  };
}

export function scheduleModalPanelStyle(theme, extra = {}) {
  const modalBg = theme.modalBg;
  const usesGradient = isGradientSurface(modalBg);

  return {
    ...(usesGradient ? { background: modalBg } : { background: modalBg }),
    borderRadius: 18,
    padding: 28,
    boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
    position: 'relative',
    color: theme.modalBodyTextColor,
    boxSizing: 'border-box',
    ...extra,
  };
}

export function scheduleModalTitleStyle(theme, extra = {}) {
  return {
    marginBottom: 16,
    fontWeight: 600,
    fontSize: 18,
    color: theme.modalTitleColor,
    ...extra,
  };
}

export function scheduleModalLabelStyle(theme, extra = {}) {
  return {
    fontWeight: 600,
    marginBottom: 8,
    color: theme.modalSectionLabelColor,
    ...extra,
  };
}

export function scheduleModalSelectStyle(theme) {
  return {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 6,
    border: theme.inputBorder || '1px solid #ccc',
    background: theme.modalSelectBg ?? theme.dayUnselectedBg ?? '#ffffff',
    color: theme.modalSelectText ?? theme.modalBodyTextColor,
    fontSize: 14,
    boxSizing: 'border-box',
  };
}

export function scheduleModalRadioLabelStyle(theme, extra = {}) {
  return {
    display: 'flex',
    alignItems: 'center',
    color: theme.modalBodyTextColor,
    ...extra,
  };
}

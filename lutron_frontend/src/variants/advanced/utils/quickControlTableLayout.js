import {
  scheduleCardShell,
  scheduleInputBg,
  schedulePanelLabel,
  scheduleRightListScrollStyle,
  scheduleRowBorder,
} from './scheduleCreateStyles';

export const ADVANCED_QUICK_CONTROL_DETAILS_MAX_WIDTH = 1200;

export const QUICK_CONTROL_LOCATION_COL = '0 0 300px';
export const QUICK_CONTROL_ACTION_COL = '1 1 300px';
export const QUICK_CONTROL_HEADER_TRAILING_COL = '0 0 180px';

export function getAdvancedQuickControlDetailsShellStyle(
  isLargeScreen,
  isDesktop,
  isTablet
) {
  const horizontalPadding = isLargeScreen ? 40 : isDesktop ? 32 : isTablet ? 24 : 24;

  return {
    width: '100%',
    maxWidth: ADVANCED_QUICK_CONTROL_DETAILS_MAX_WIDTH,
    margin: '0 auto',
    boxSizing: 'border-box',
    padding: horizontalPadding,
    borderRadius: 20,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    position: 'relative',
    '--qc-details-shell-padding-x': `${horizontalPadding}px`,
  };
}

export function getAdvancedQuickControlDetailsTablePanelStyle(isLargeScreen, isDesktop) {
  return {
    width: '100%',
    maxWidth: '100%',
    margin: '0 auto',
    background: scheduleInputBg,
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    boxSizing: 'border-box',
    borderRadius: isLargeScreen ? 12 : isDesktop ? 10 : 8,
    overflow: 'hidden',
    ...scheduleCardShell,
  };
}

export function getAdvancedQuickControlDetailsTableCardStyle(isLargeScreen, isDesktop) {
  return {
    padding: isLargeScreen ? 16 : isDesktop ? 14 : 12,
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    boxSizing: 'border-box',
    position: 'relative',
  };
}

export const quickControlDetailsListScrollWrapStyle = {
  position: 'relative',
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
};

export const quickControlDetailsTableHeaderRowStyle = {
  display: 'flex',
  alignItems: 'center',
  flexShrink: 0,
  fontWeight: 600,
  borderBottom: `1px solid ${scheduleRowBorder}`,
  padding: '10px 12px',
  marginBottom: 8,
  fontSize: 15,
  gap: 16,
  width: '100%',
  boxSizing: 'border-box',
  color: schedulePanelLabel,
};

export const quickControlDetailsTableRowStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '10px 0',
  borderBottom: `1px solid ${scheduleRowBorder}`,
  gap: 16,
  width: '100%',
  boxSizing: 'border-box',
};

export const quickControlDetailsLocationColStyle = {
  flex: QUICK_CONTROL_LOCATION_COL,
  minWidth: 0,
  fontSize: 15,
  textAlign: 'left',
  color: schedulePanelLabel,
  whiteSpace: 'normal',
  wordBreak: 'break-word',
};

export const quickControlDetailsActionColStyle = {
  flex: QUICK_CONTROL_ACTION_COL,
  minWidth: 0,
  fontSize: 15,
  textAlign: 'left',
  color: schedulePanelLabel,
};

export const quickControlDetailsHeaderTrailingColStyle = {
  flex: QUICK_CONTROL_HEADER_TRAILING_COL,
  minWidth: 0,
  textAlign: 'left',
  whiteSpace: 'nowrap',
  color: schedulePanelLabel,
};

export const quickControlDetailsListScrollStyle = {
  ...scheduleRightListScrollStyle,
  flex: 1,
  minHeight: 0,
  maxHeight: '100%',
  paddingBottom: 28,
};

export function getAdvancedQuickControlDetailsActionBarStyle() {
  return {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 16,
    flexWrap: 'nowrap',
    flexShrink: 0,
    paddingTop: 12,
    paddingBottom: 4,
  };
}

export function quickControlDetailsStickyHeaderStyle() {
  return {
    position: 'sticky',
    top: 0,
    zIndex: 2,
    backgroundColor: scheduleInputBg,
  };
}

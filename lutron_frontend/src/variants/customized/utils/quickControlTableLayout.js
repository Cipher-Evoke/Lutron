import { scheduleRightListScrollStyle } from '../../../utils/fixedActionBarStyles';

/** Column widths — match basic CreateQuickControl.jsx */
export const QUICK_CONTROL_LOCATION_COL = '0 0 300px';
export const QUICK_CONTROL_ACTION_COL = '1 1 auto';
export const QUICK_CONTROL_HEADER_TRAILING_COL = '0 0 170px';
export const QUICK_CONTROL_ROW_TRAILING_COL = '0 0 140px';

export const quickControlCreateTableHeaderRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontWeight: 700,
  borderBottom: '1px solid #ccc',
  padding: '10px 12px',
  gap: 16,
  flexShrink: 0,
  width: '100%',
  boxSizing: 'border-box',
};

export const quickControlCreateTableRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 0',
  borderBottom: '1px solid #b2a98b',
  gap: 16,
  width: '100%',
  boxSizing: 'border-box',
};

export const quickControlCreateLocationColStyle = {
  flex: QUICK_CONTROL_LOCATION_COL,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

export const quickControlCreateActionColStyle = {
  flex: QUICK_CONTROL_ACTION_COL,
  minWidth: 0,
  textAlign: 'center',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

export const quickControlCreateHeaderTrailingColStyle = {
  flex: QUICK_CONTROL_HEADER_TRAILING_COL,
  minWidth: 0,
  textAlign: 'right',
  whiteSpace: 'nowrap',
};

export const quickControlCreateRowTrailingColStyle = {
  flex: QUICK_CONTROL_ROW_TRAILING_COL,
  minWidth: 0,
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
};

/** Scrollable list — header is sticky inside so columns stay aligned with the scrollbar. */
export const quickControlCreateListScrollStyle = {
  ...scheduleRightListScrollStyle,
  scrollbarGutter: 'stable',
};

export function quickControlCreateStickyHeaderStyle(panelBackground) {
  return {
    position: 'sticky',
    top: 0,
    zIndex: 2,
    backgroundColor: panelBackground,
  };
}

/** Quick Control Details — match basic QuickControlDetails.jsx table layout */
export const quickControlDetailsTableHeaderRowStyle = {
  display: 'flex',
  alignItems: 'center',
  flexShrink: 0,
  fontWeight: 700,
  borderBottom: '1px solid #ccc',
  padding: '10px 12px',
  marginBottom: 8,
  fontSize: 15,
  gap: 16,
  width: '100%',
  boxSizing: 'border-box',
};

export const quickControlDetailsTableRowStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '8px 0',
  borderBottom: '1px solid #b2a98b',
  gap: 16,
  width: '100%',
  boxSizing: 'border-box',
};

export const quickControlDetailsLocationColStyle = {
  flex: QUICK_CONTROL_LOCATION_COL,
  minWidth: 0,
  fontSize: 15,
  textAlign: 'left',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

export const quickControlDetailsActionColStyle = {
  flex: '1 1 300px',
  minWidth: 0,
  fontSize: 15,
  textAlign: 'left',
};

export const quickControlDetailsHeaderTrailingColStyle = {
  flex: '0 0 180px',
  minWidth: 0,
  textAlign: 'left',
  whiteSpace: 'nowrap',
};

export const quickControlDetailsListScrollStyle = {
  ...scheduleRightListScrollStyle,
  scrollbarGutter: 'stable',
};

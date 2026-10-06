import {
  renderScheduleModalLayer,
  SCHEDULE_MODAL_OVERLAY_Z_INDEX,
} from '../../../shared/settings/schedule/scheduleModalLayer';

/** Portal advanced QC modals to body (full-viewport overlay, same as schedule). */
export const renderQuickControlModalLayer = renderScheduleModalLayer;

export { SCHEDULE_MODAL_OVERLAY_Z_INDEX };

export const quickControlModalOverlaySx = {
  position: 'fixed',
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0,0,0,0.25)',
  zIndex: SCHEDULE_MODAL_OVERLAY_Z_INDEX,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export const quickControlModalPanelSx = {
  background: '#ffffff',
  borderRadius: 18,
  padding: 28,
  boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
  position: 'relative',
  color: 'rgba(0, 0, 0, 0.87)',
  boxSizing: 'border-box',
  '--schedule-modal-body-text': 'rgba(0, 0, 0, 0.87)',
  '--schedule-modal-muted-text': 'rgba(0, 0, 0, 0.6)',
  '--schedule-modal-section-label-color': 'rgba(0, 0, 0, 0.87)',
  '--schedule-modal-item-selected-bg': 'var(--app-button, #3D4A5C)',
  '--schedule-modal-item-selected-text': '#ffffff',
  // Theme4 (and similar) use white radios for dark page chrome; this panel is always white.
  '--quick-control-radio-border': 'var(--app-button, #2c2820)',
  '--quick-control-radio-checked-fill': 'var(--app-button, #2c2820)',
  '--quick-control-radio-unchecked-fill': '#ffffff',
};

export const quickControlModalTitleSx = {
  marginBottom: 16,
  fontWeight: 600,
  fontSize: 18,
  color: 'rgba(0, 0, 0, 0.87)',
};

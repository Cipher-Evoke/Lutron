import {
  renderScheduleModalLayer,
  SCHEDULE_MODAL_OVERLAY_Z_INDEX,
} from '../../../shared/settings/schedule/scheduleModalLayer';

/** Portal customized QC modals to body (full-viewport overlay, same as schedule). */
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
  background: '#CDC0A0',
  borderRadius: 18,
  padding: 28,
  boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
  position: 'relative',
  boxSizing: 'border-box',
};

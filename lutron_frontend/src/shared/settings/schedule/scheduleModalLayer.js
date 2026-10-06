import { createPortal } from 'react-dom';

/** Advanced schedule: portal modals to body so fixed overlays span the full viewport. */
export function renderScheduleModalLayer(usePortal, node) {
  if (usePortal && typeof document !== 'undefined') {
    return createPortal(node, document.body);
  }
  return node;
}

export const SCHEDULE_MODAL_OVERLAY_Z_INDEX = 13000;

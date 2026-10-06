import { CONTEXT_MENU_OFFSET_PX } from "./fofpMarkerResize";

const MENU_APPROX_WIDTH = 220;
const MENU_APPROX_HEIGHT = 320;

/**
 * Place context menu below-right of a screen point, flipping near viewport edges.
 */
export const computeContextMenuAnchor = (
  anchorX,
  anchorY,
  viewportWidth = window.innerWidth,
  viewportHeight = window.innerHeight
) => {
  const offset = CONTEXT_MENU_OFFSET_PX;
  let left = anchorX + offset;
  let top = anchorY + offset;

  if (left + MENU_APPROX_WIDTH > viewportWidth - 8) {
    left = Math.max(8, anchorX - MENU_APPROX_WIDTH - offset);
  }
  if (top + MENU_APPROX_HEIGHT > viewportHeight - 8) {
    top = Math.max(8, anchorY - MENU_APPROX_HEIGHT - offset);
  }

  return { top, left };
};

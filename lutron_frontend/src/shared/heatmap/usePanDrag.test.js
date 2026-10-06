/**
 * @jest-environment node
 */

import { DRAG_THRESHOLD_PX, shouldStartDrag } from "./panDragThreshold";

test("stationary click does not start a drag", () => {
  expect(shouldStartDrag({ x: 10, y: 10 }, { x: 10, y: 10 })).toBe(false);
  expect(shouldStartDrag({ x: 10, y: 10 }, { x: 12, y: 11 })).toBe(false);
});

test("movement past threshold starts a drag", () => {
  expect(shouldStartDrag({ x: 0, y: 0 }, { x: DRAG_THRESHOLD_PX, y: 0 })).toBe(true);
  expect(shouldStartDrag({ x: 0, y: 0 }, { x: 3, y: 3 })).toBe(true);
});

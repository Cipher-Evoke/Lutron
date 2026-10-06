/**
 * Move one item in an array from `fromIndex` to `toIndex` (after removal, insert at `toIndex`).
 */
export function arrayMove(arr, fromIndex, toIndex) {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return [...arr];
  const next = [...arr];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

/**
 * After reordering only visible slots, merge back into a full order array:
 * walk original full order; at each visible position emit the next id from `newVisibleOrder`.
 */
export function liftedFullOrderFromVisibleReorder(fullOrder, newVisibleOrder) {
  const vis = new Set(newVisibleOrder);
  const next = [];
  let v = 0;
  for (const id of fullOrder) {
    if (vis.has(id)) {
      if (v < newVisibleOrder.length) next.push(newVisibleOrder[v++]);
    } else {
      next.push(id);
    }
  }
  return next;
}

/**
 * In-memory chart dimensions for the current page session only.
 * Reload clears all overrides (original layout is restored).
 */
let graphSizes = {};

const listeners = new Set();

function emit() {
  listeners.forEach((fn) => fn());
}

export function subscribeGraphSizes(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getGraphSizesSnapshot() {
  return graphSizes;
}

export function getServerGraphSizesSnapshot() {
  return {};
}

/**
 * @param {string} id
 * @param {{ width?: string|number, height?: string|number }} [defaults]
 */
export function getGraphSize(id, defaults = {}) {
  const w = defaults.width != null ? defaults.width : '100%';
  const h = defaults.height != null ? defaults.height : '100%';
  if (!id) return { width: w, height: h };
  const saved = graphSizes[id];
  if (saved && typeof saved === 'object') {
    return {
      width: saved.width != null ? saved.width : w,
      height: saved.height != null ? saved.height : h,
    };
  }
  return { width: w, height: h };
}

export function updateGraphSize(id, width, height) {
  if (!id) return;
  graphSizes = { ...graphSizes, [id]: { width, height } };
  emit();
}


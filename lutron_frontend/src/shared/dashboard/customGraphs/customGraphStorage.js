import { CUSTOM_GRAPH_VARIANTS } from './customGraphConstants';

/**
 * Customized keeps legacy key `customGraphs` for backward compatibility.
 * Basic and advanced use isolated keys so graphs do not leak across variants.
 */
export function getCustomGraphsStorageKey(variant) {
  const v = String(variant || '').toLowerCase();
  if (v === CUSTOM_GRAPH_VARIANTS.customized) return 'customGraphs';
  if (v === CUSTOM_GRAPH_VARIANTS.basic) return 'customGraphs_basic';
  if (v === CUSTOM_GRAPH_VARIANTS.advanced) return 'customGraphs_advanced';
  return `customGraphs_${v}`;
}

export function readCustomGraphsFromStorage(variant) {
  try {
    const key = getCustomGraphsStorageKey(variant);
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeCustomGraphsToStorage(variant, list) {
  const key = getCustomGraphsStorageKey(variant);
  localStorage.setItem(key, JSON.stringify(Array.isArray(list) ? list : []));
}

export function createCustomGraphId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function buildCustomGraphWidgetKey(id) {
  return `custom_graph:${String(id ?? '').trim()}`;
}

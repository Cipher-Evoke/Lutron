import {
  CUSTOM_GRAPH_VISIBILITY_UPDATED_EVENT,
  CUSTOM_GRAPH_VARIANTS,
} from './customGraphConstants';
import { buildCustomGraphWidgetKey } from './customGraphStorage';
import {
  CUSTOMIZED_WIDGET_VISIBILITY_STORAGE_KEY,
  migrateCustomizedWidgetVisibilityStorageIfNeeded,
} from '../../../variants/customized/utils/customizedOverviewWidgetVisibility';

function visibilityStorageKey(variant) {
  const v = String(variant || '').toLowerCase();
  if (v === CUSTOM_GRAPH_VARIANTS.customized) {
    migrateCustomizedWidgetVisibilityStorageIfNeeded();
    return CUSTOMIZED_WIDGET_VISIBILITY_STORAGE_KEY;
  }
  return `customGraphVisibility_${v}`;
}

function normalizePage(page) {
  const lower = String(page || '')
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/\s+/g, '-');
  if (lower === 'space' || lower === 'space-utilization' || lower.startsWith('space-')) {
    return 'space';
  }
  return 'energy';
}

export function readCustomGraphVisibilityState(variant) {
  try {
    const key = visibilityStorageKey(variant);
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : {};
    const energy =
      parsed?.energy && typeof parsed.energy === 'object' ? { ...parsed.energy } : {};
    const space =
      parsed?.space && typeof parsed.space === 'object' ? { ...parsed.space } : {};
    return { energy, space };
  } catch {
    return { energy: {}, space: {} };
  }
}

function writeCustomGraphVisibilityState(variant, state) {
  const key = visibilityStorageKey(variant);
  localStorage.setItem(
    key,
    JSON.stringify({
      energy: state?.energy && typeof state.energy === 'object' ? state.energy : {},
      space: state?.space && typeof state.space === 'object' ? state.space : {},
    })
  );
  window.dispatchEvent(new CustomEvent(CUSTOM_GRAPH_VISIBILITY_UPDATED_EVENT));
}

export function isCustomGraphVisible(variant, page, graphId, defaultVisible = true) {
  const widgetKey = buildCustomGraphWidgetKey(graphId);
  if (!widgetKey || widgetKey === 'custom_graph:') return false;
  const section = normalizePage(page);
  const state = readCustomGraphVisibilityState(variant);
  const map = section === 'space' ? state.space : state.energy;
  if (map[widgetKey] === undefined) return defaultVisible;
  return map[widgetKey] !== false;
}

export function setCustomGraphVisible(variant, page, graphId, visible) {
  const widgetKey = buildCustomGraphWidgetKey(graphId);
  if (!widgetKey || widgetKey === 'custom_graph:') return;
  const section = normalizePage(page);
  const state = readCustomGraphVisibilityState(variant);
  const next = {
    energy: { ...state.energy },
    space: { ...state.space },
  };
  if (section === 'space') {
    delete next.energy[widgetKey];
    next.space[widgetKey] = Boolean(visible);
  } else {
    delete next.space[widgetKey];
    next.energy[widgetKey] = Boolean(visible);
  }
  writeCustomGraphVisibilityState(variant, next);
}

export function enableCustomGraphOnCreate(variant, page, graphId) {
  setCustomGraphVisible(variant, page, graphId, true);
}

export function deleteCustomGraphVisibility(variant, graphId) {
  const widgetKey = buildCustomGraphWidgetKey(graphId);
  if (!widgetKey || widgetKey === 'custom_graph:') return;
  const state = readCustomGraphVisibilityState(variant);
  const next = {
    energy: { ...state.energy },
    space: { ...state.space },
  };
  delete next.energy[widgetKey];
  delete next.space[widgetKey];
  writeCustomGraphVisibilityState(variant, next);
}

/**
 * Shared Energy/Space layout sync helpers (order + span) for all UI variants.
 * Superadmin writes; all roles read via GET /widgets/dashboard_chart_order.
 */
import {
  ADVANCED_DASHBOARD_ORDER_STORAGE_KEY,
  BASIC_DASHBOARD_ORDER_STORAGE_KEY,
  DASHBOARD_ORDER_STORAGE_KEY,
  readDashboardPageOrder,
  readDashboardPageSpan,
  writeDashboardPageOrder,
  writeDashboardPageSpan,
} from './dashboardLayoutResolvers';

export function isPlainSpanMap(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

export function normalizeSpanMap(value) {
  if (!isPlainSpanMap(value)) return {};
  const out = {};
  for (const [key, span] of Object.entries(value)) {
    if (typeof key !== 'string' || !key.trim()) continue;
    out[key.trim()] = span;
  }
  return out;
}

export function readLocalDashboardOrderBlob(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function writeLocalDashboardOrderBlob(storageKey, blob) {
  try {
    localStorage.setItem(
      storageKey,
      JSON.stringify(blob && typeof blob === 'object' && !Array.isArray(blob) ? blob : {})
    );
  } catch {
    /* ignore */
  }
}

/** Merge page fields into localStorage blob (energy/space + spans). */
export function mergeLocalDashboardOrderBlob(storageKey, patch) {
  const cur = readLocalDashboardOrderBlob(storageKey);
  const next = {
    ...cur,
    ...(patch && typeof patch === 'object' ? patch : {}),
  };
  writeLocalDashboardOrderBlob(storageKey, next);
  return next;
}

export function applyVariantDashboardOrderBlob(storageKey, blob) {
  if (!isPlainSpanMap(blob)) return null;
  writeLocalDashboardOrderBlob(storageKey, blob);
  return {
    energy: Array.isArray(blob.energy) ? blob.energy : readDashboardPageOrder('energy', storageKey),
    energySpan: isPlainSpanMap(blob.energySpan)
      ? blob.energySpan
      : readDashboardPageSpan('energy', storageKey),
    space: Array.isArray(blob.space) ? blob.space : readDashboardPageOrder('space', storageKey),
    spaceSpan: isPlainSpanMap(blob.spaceSpan)
      ? blob.spaceSpan
      : readDashboardPageSpan('space', storageKey),
    spaceCharts: Array.isArray(blob.spaceCharts)
      ? blob.spaceCharts
      : readDashboardPageOrder('spaceCharts', storageKey),
    spaceChartsSpan: isPlainSpanMap(blob.spaceChartsSpan)
      ? blob.spaceChartsSpan
      : readDashboardPageSpan('spaceCharts', storageKey),
    spaceMain: Array.isArray(blob.spaceMain)
      ? blob.spaceMain
      : readDashboardPageOrder('spaceMain', storageKey),
    spaceMainSpan: isPlainSpanMap(blob.spaceMainSpan)
      ? blob.spaceMainSpan
      : readDashboardPageSpan('spaceMain', storageKey),
  };
}

export function buildAdvancedLayoutPatch({ energy, energySpan, space, spaceSpan } = {}) {
  const patch = {};
  if (Array.isArray(energy)) patch.energy = energy;
  if (isPlainSpanMap(energySpan)) patch.energySpan = energySpan;
  if (Array.isArray(space)) patch.space = space;
  if (isPlainSpanMap(spaceSpan)) patch.spaceSpan = spaceSpan;
  return patch;
}

export function buildCustomizedLayoutPatch(patch) {
  return buildAdvancedLayoutPatch(patch);
}

export function persistAdvancedLayoutAndBuildApiPayload(patch) {
  const merged = mergeLocalDashboardOrderBlob(ADVANCED_DASHBOARD_ORDER_STORAGE_KEY, patch);
  return { advanced_dashboard_order: merged };
}

export function persistCustomizedLayoutAndBuildApiPayload(patch) {
  const merged = mergeLocalDashboardOrderBlob(DASHBOARD_ORDER_STORAGE_KEY, patch);
  return { customized_dashboard_order: merged };
}

export function persistBasicEnergySpanAndBuildApiPayload(spanMap) {
  const normalized = normalizeSpanMap(spanMap);
  writeDashboardPageSpan('energy', normalized, BASIC_DASHBOARD_ORDER_STORAGE_KEY);
  return { energy_slot_span: normalized };
}

export function persistBasicSpaceChartsSpanAndBuildApiPayload(spanMap) {
  const normalized = normalizeSpanMap(spanMap);
  writeDashboardPageSpan('spaceCharts', normalized, BASIC_DASHBOARD_ORDER_STORAGE_KEY);
  return { space_charts_tab_span: normalized };
}

export function persistBasicSpaceMainSpanAndBuildApiPayload(spanMap) {
  const normalized = normalizeSpanMap(spanMap);
  writeDashboardPageSpan('spaceMain', normalized, BASIC_DASHBOARD_ORDER_STORAGE_KEY);
  return { space_main_tab_span: normalized };
}

export {
  ADVANCED_DASHBOARD_ORDER_STORAGE_KEY,
  BASIC_DASHBOARD_ORDER_STORAGE_KEY,
  DASHBOARD_ORDER_STORAGE_KEY,
};

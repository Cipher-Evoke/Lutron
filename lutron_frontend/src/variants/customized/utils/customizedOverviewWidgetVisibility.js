import {
  DEFAULT_VISIBLE_OVERVIEW_WIDGET_KEYS,
  OVERVIEW_WIDGET_LABELS,
  WIDGET_VISIBILITY_SECTION,
  normalizeDashboardWidgetKey,
  getWidgetVisibilityPersistenceKey,
} from '../../../shared/dashboard/utils/dashboardWidgetVisibilityCore';

/** Legacy key used before per-variant isolation. */
export const LEGACY_CUSTOMIZED_WIDGET_VISIBILITY_STORAGE_KEY = 'widgetVisibility';
export const CUSTOMIZED_WIDGET_VISIBILITY_STORAGE_KEY = 'widgetVisibility_customized';

export const CUSTOMIZED_OVERVIEW_WIDGET_KEYS = [
  'energy',
  'alerts',
  'schedules',
  'quick_controls',
  'shades',
  // 'floors',
  'space_utilization',
];

export const CUSTOMIZED_OVERVIEW_WIDGET_ROWS = [
  { key: 'energy', label: OVERVIEW_WIDGET_LABELS.energy },
  { key: 'alerts', label: OVERVIEW_WIDGET_LABELS.alerts },
  { key: 'schedules', label: OVERVIEW_WIDGET_LABELS.schedules },
  { key: 'quick_controls', label: OVERVIEW_WIDGET_LABELS.quick_controls },
  { key: 'shades', label: 'External Link' },
  // { key: 'floors', label: OVERVIEW_WIDGET_LABELS.floors },
  { key: 'space_utilization', label: OVERVIEW_WIDGET_LABELS.space_utilization },
];

/** Default visible charts when customized prefs are missing (Advanced-like: Combined off). */
export const CUSTOMIZED_DEFAULT_ENERGY_VISIBLE_KEYS = [
  'savings_by_strategy',
  'total_consumption_by_group',
  'light_power_density',
  'consumption',
  'savings',
  'peak_and_minimum_consumption',
];
export const CUSTOMIZED_DEFAULT_SPACE_VISIBLE_KEYS = [
  'utilization',
  'utilization_by_area_group',
  'utilization_by_area',
  'peak_and_minimum_utilization',
  'instant_occupancy_count',
];

/** Known keys for API hydrate (broader than empty-map defaults). */
const CUSTOMIZED_ENERGY_HYDRATE_KEYS = [
  'consumption_saving',
  'consumption',
  'savings_by_strategy',
  'total_consumption_by_group',
  'light_power_density',
  'savings',
  'peak_and_minimum_consumption',
];
const CUSTOMIZED_SPACE_HYDRATE_KEYS = [
  'instant_utilization_combined',
  'utilization',
  'utilization_by_area_group',
  'utilization_by_area',
  'peak_and_minimum_utilization',
  'instant_occupancy_count',
];

export function isCustomizedVisibilitySectionEmpty(map) {
  return !map || typeof map !== 'object' || Object.keys(map).length === 0;
}

/** Drop Combined when conflicting individual charts are on (matches Advanced). */
export function applyCustomizedCombinedExclusionToRoot(root) {
  const next = root && typeof root === 'object' ? { ...root } : {};
  const energy = {
    ...(next.energy && typeof next.energy === 'object' ? next.energy : {}),
  };
  const space = {
    ...(next.space && typeof next.space === 'object' ? next.space : {}),
  };
  const energyIndividualsOn =
    energy.consumption === true || energy.savings_by_strategy === true;
  if (energyIndividualsOn) {
    energy.consumption_saving = false;
  }
  const spaceIndividualsOn =
    space.instant_occupancy_count === true || space.utilization_by_area === true;
  if (spaceIndividualsOn) {
    space.instant_utilization_combined = false;
    if (energy.instant_utilization_combined === true) {
      energy.instant_utilization_combined = false;
    }
  }
  next.energy = energy;
  next.space = space;
  return next;
}

/**
 * Selected energy keys for Settings checkboxes / dashboard render.
 * Empty/missing map → Advanced-like defaults (Combined off).
 */
export function resolveCustomizedEnergySelectedKeys(visibilityRoot) {
  const energyMap = visibilityRoot?.energy;
  if (isCustomizedVisibilitySectionEmpty(energyMap)) {
    return [...CUSTOMIZED_DEFAULT_ENERGY_VISIBLE_KEYS];
  }
  let selected = Object.entries(energyMap)
    .filter(([, v]) => v !== false)
    .map(([k]) => String(k).trim())
    .filter(Boolean);
  // Individuals win — do not keep Combined selected alongside them.
  if (
    selected.includes('consumption') ||
    selected.includes('savings_by_strategy')
  ) {
    selected = selected.filter((k) => k !== 'consumption_saving');
  }
  return selected;
}

/**
 * Selected space keys for Settings checkboxes / dashboard render.
 * Empty/missing map → Advanced-like defaults (Combined off).
 */
export function resolveCustomizedSpaceSelectedKeys(visibilityRoot) {
  const spaceMap = visibilityRoot?.space;
  const energyMap = visibilityRoot?.energy;
  if (isCustomizedVisibilitySectionEmpty(spaceMap)) {
    // Legacy: combined may have been saved under energy before page split.
    if (
      energyMap?.instant_utilization_combined === true &&
      energyMap?.instant_occupancy_count !== true &&
      energyMap?.utilization_by_area !== true
    ) {
      return ['instant_utilization_combined'];
    }
    if (isCustomizedVisibilitySectionEmpty(energyMap)) {
      return [...CUSTOMIZED_DEFAULT_SPACE_VISIBLE_KEYS];
    }
    return [];
  }
  let selected = Object.entries(spaceMap)
    .filter(([, v]) => v !== false)
    .map(([k]) => String(k).trim())
    .filter(Boolean);
  if (
    energyMap?.instant_utilization_combined === true &&
    !selected.includes('instant_utilization_combined')
  ) {
    selected.push('instant_utilization_combined');
  }
  if (
    selected.includes('instant_occupancy_count') ||
    selected.includes('utilization_by_area')
  ) {
    selected = selected.filter((k) => k !== 'instant_utilization_combined');
  }
  return selected;
}

/** Space dashboard widget visibility (Combined excluded when individuals are on). */
export function resolveCustomizedSpaceWidgetVisibleFromRoot(widgetKey, visibilityRoot) {
  const key = String(widgetKey ?? '').trim();
  if (!key) return false;
  if (key.startsWith('custom_graph:')) {
    const spaceMap = visibilityRoot?.space;
    if (isCustomizedVisibilitySectionEmpty(spaceMap)) return true;
    return spaceMap?.[key] !== false;
  }
  return resolveCustomizedSpaceSelectedKeys(visibilityRoot).includes(key);
}

export function migrateCustomizedWidgetVisibilityStorageIfNeeded() {
  try {
    if (localStorage.getItem(CUSTOMIZED_WIDGET_VISIBILITY_STORAGE_KEY) != null) return;
    const legacy = localStorage.getItem(LEGACY_CUSTOMIZED_WIDGET_VISIBILITY_STORAGE_KEY);
    if (legacy != null) {
      localStorage.setItem(CUSTOMIZED_WIDGET_VISIBILITY_STORAGE_KEY, legacy);
    }
  } catch {
    /* quota / private mode */
  }
}

export function parseCustomizedWidgetVisibilityRoot() {
  migrateCustomizedWidgetVisibilityStorageIfNeeded();
  try {
    const raw = localStorage.getItem(CUSTOMIZED_WIDGET_VISIBILITY_STORAGE_KEY);
    const obj = raw ? JSON.parse(raw) : null;
    return obj && typeof obj === 'object' ? obj : {};
  } catch {
    return {};
  }
}

export function writeCustomizedWidgetVisibilityRoot(next) {
  migrateCustomizedWidgetVisibilityStorageIfNeeded();
  try {
    localStorage.setItem(
      CUSTOMIZED_WIDGET_VISIBILITY_STORAGE_KEY,
      JSON.stringify(next && typeof next === 'object' ? next : {})
    );
  } catch {
    /* quota / private mode */
  }
}

/** Snapshot before localStorage.clear() on logout. */
export function readCustomizedWidgetVisibilityRaw() {
  migrateCustomizedWidgetVisibilityStorageIfNeeded();
  try {
    return localStorage.getItem(CUSTOMIZED_WIDGET_VISIBILITY_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Restore after localStorage.clear() so Admin/Operator keep Superadmin widget prefs. */
export function restoreCustomizedWidgetVisibilityAfterStorageClear(raw) {
  if (raw == null) return;
  try {
    localStorage.setItem(CUSTOMIZED_WIDGET_VISIBILITY_STORAGE_KEY, raw);
  } catch {
    /* quota / private mode */
  }
}

export function isCustomizedOverviewWidgetVisible(widgetKey, visibilityRoot) {
  const key = String(widgetKey ?? '').trim();
  if (!key) return true;
  const root = visibilityRoot ?? parseCustomizedWidgetVisibilityRoot();
  const overviewMap = root?.overview;
  if (!overviewMap || typeof overviewMap !== 'object' || Object.keys(overviewMap).length === 0) {
    return DEFAULT_VISIBLE_OVERVIEW_WIDGET_KEYS.has(key);
  }
  return overviewMap[key] !== false;
}

export function buildCustomizedOverviewVisibilityMap(selectedKeys) {
  const selected = new Set((selectedKeys || []).map((k) => String(k).trim()));
  const map = {};
  for (const key of CUSTOMIZED_OVERVIEW_WIDGET_KEYS) {
    map[key] = selected.has(key);
  }
  return map;
}

export function resolveCustomizedOverviewSelectedKeys(visibilityRoot) {
  const root = visibilityRoot ?? parseCustomizedWidgetVisibilityRoot();
  const overviewMap = root?.overview;
  if (!overviewMap || typeof overviewMap !== 'object' || Object.keys(overviewMap).length === 0) {
    return [...CUSTOMIZED_OVERVIEW_WIDGET_KEYS];
  }
  return CUSTOMIZED_OVERVIEW_WIDGET_KEYS.filter((key) => overviewMap[key] !== false);
}

/**
 * Convert flat DB/API widget configuration rows into customized nested visibility root
 * and persist as a cache of the DB values.
 */
export function hydrateCustomizedVisibilityFromApiItems(items) {
  if (!Array.isArray(items) || items.length === 0) return null;
  const byKey = new Map();
  for (const item of items) {
    if (!item || typeof item.widget_key !== 'string') continue;
    const key = normalizeDashboardWidgetKey(item.widget_key);
    if (!key) continue;
    byKey.set(key, item.is_visible !== false);
  }
  const overview = {};
  for (const key of CUSTOMIZED_OVERVIEW_WIDGET_KEYS) {
    overview[key] = byKey.has(key) ? byKey.get(key) === true : true;
  }
  const energy = {};
  const space = {};
  for (const key of CUSTOMIZED_ENERGY_HYDRATE_KEYS) {
    energy[key] = byKey.has(key) ? byKey.get(key) === true : false;
  }
  for (const key of CUSTOMIZED_SPACE_HYDRATE_KEYS) {
    space[key] = byKey.has(key) ? byKey.get(key) === true : false;
  }
  const current = parseCustomizedWidgetVisibilityRoot();
  if (current?.energy && typeof current.energy === 'object') {
    for (const [k, v] of Object.entries(current.energy)) {
      if (String(k).startsWith('custom_graph:')) energy[k] = v;
    }
  }
  if (current?.space && typeof current.space === 'object') {
    for (const [k, v] of Object.entries(current.space)) {
      if (String(k).startsWith('custom_graph:')) space[k] = v;
    }
  }
  const root = applyCustomizedCombinedExclusionToRoot({ overview, energy, space });
  writeCustomizedWidgetVisibilityRoot(root);
  return root;
}

/** Flatten customized nested maps into API upsert payloads. */
export function customizedVisibilityRootToApiPayloads(root) {
  const payloads = [];
  const sections = [root?.overview, root?.energy, root?.space];
  for (const map of sections) {
    if (!map || typeof map !== 'object') continue;
    for (const [rawKey, visible] of Object.entries(map)) {
      if (String(rawKey).startsWith('custom_graph:')) continue;
      const key = normalizeDashboardWidgetKey(rawKey);
      if (!key) continue;
      const section = WIDGET_VISIBILITY_SECTION[key];
      if (!section) continue;
      payloads.push({
        widget_key: getWidgetVisibilityPersistenceKey(key),
        is_visible: visible !== false,
        display_name: OVERVIEW_WIDGET_LABELS[key] || key,
        dropdown_name: OVERVIEW_WIDGET_LABELS[key] || key,
        ui_variant: 'customized',
      });
    }
  }
  return payloads;
}

/** Pure visibility helpers (no Redux/React) — safe for node unit tests. */

/** Legacy key — still used for the basic variant (backward compatible). */
export const DASHBOARD_WIDGET_VISIBILITY_STORAGE_KEY = 'lutron_dashboard_widget_visibility_v1'
export const LEGACY_DASHBOARD_WIDGET_VISIBILITY_STORAGE_KEY = DASHBOARD_WIDGET_VISIBILITY_STORAGE_KEY
export const DASHBOARD_WIDGET_VISIBILITY_EVENT = 'lutron-dashboard-widget-visibility'
export const DASHBOARD_UI_VARIANTS = ['basic', 'advanced', 'customized']
const DASHBOARD_WIDGET_VISIBILITY_ALL_VISIBLE_MARKER = 'all_visible'

export function normalizeDashboardUiVariant(variant) {
  const v = String(variant ?? 'basic').trim().toLowerCase()
  return DASHBOARD_UI_VARIANTS.includes(v) ? v : 'basic'
}

export function normalizeWidgetConfigurationUiVariant(value) {
  return normalizeDashboardUiVariant(value ?? 'basic')
}

/** Per-variant localStorage keys so basic / advanced / customized graph toggles do not leak. */
export function getDashboardWidgetVisibilityStorageKey(variant = 'basic') {
  const v = normalizeDashboardUiVariant(variant)
  if (v === 'basic') {
    return LEGACY_DASHBOARD_WIDGET_VISIBILITY_STORAGE_KEY
  }
  return `${LEGACY_DASHBOARD_WIDGET_VISIBILITY_STORAGE_KEY}_${v}`
}

/**
 * Previously copied Basic's visibility map into Advanced/Customized when those
 * keys were missing. That made Basic "Combined" selections leak into other
 * variants after refresh/logout. Variants keep separate storage keys only.
 */
function migrateLegacyDashboardWidgetVisibilityToVariant(_variant) {
  return
}

export function filterWidgetConfigurationByUiVariant(items, variant = 'basic') {
  if (!Array.isArray(items) || items.length === 0) return []
  const v = normalizeDashboardUiVariant(variant)
  const hasVariantField = items.some(
    (item) => item && item.ui_variant != null && String(item.ui_variant).trim() !== ''
  )
  if (!hasVariantField) {
    return v === 'basic' ? items : []
  }
  return items.filter(
    (item) => normalizeWidgetConfigurationUiVariant(item?.ui_variant) === v
  )
}

export function findWidgetConfigurationItemIndex(items, widgetKey, uiVariant = 'basic') {
  if (!Array.isArray(items)) return -1
  const key = normalizeDashboardWidgetKey(widgetKey)
  const v = normalizeDashboardUiVariant(uiVariant)
  return items.findIndex((item) => {
    if (!item || normalizeDashboardWidgetKey(item.widget_key) !== key) return false
    const itemVariant =
      item.ui_variant != null && String(item.ui_variant).trim() !== ''
        ? normalizeWidgetConfigurationUiVariant(item.ui_variant)
        : 'basic'
    return itemVariant === v
  })
}

export const DASHBOARD_WIDGET_KEY_ALIASES = {
  consumption_by_area_groups: 'total_consumption_by_group',
}

/** Canonical key plus any legacy alias keys that must stay in sync. */
export function getDashboardWidgetVisibilityKeyGroup(key) {
  const canonical = normalizeDashboardWidgetKey(key)
  if (!canonical) return []
  const keys = new Set([canonical])
  for (const [alias, target] of Object.entries(DASHBOARD_WIDGET_KEY_ALIASES)) {
    if (target === canonical || alias === canonical) {
      keys.add(alias)
      keys.add(target)
    }
  }
  return Array.from(keys)
}

/**
 * Fold legacy alias keys (e.g. consumption_by_area_groups) into the canonical key
 * so toggles cannot fight themselves when both keys exist in localStorage/API.
 */
export function sanitizeDashboardWidgetVisibilityMap(map) {
  if (!map || typeof map !== 'object' || Array.isArray(map)) {
    return getDefaultDashboardWidgetVisibilityMap()
  }
  const next = { ...map }
  for (const [alias, canonical] of Object.entries(DASHBOARD_WIDGET_KEY_ALIASES)) {
    const hasAlias = Object.prototype.hasOwnProperty.call(next, alias)
    if (!hasAlias) continue
    const aliasHidden = next[alias] === false
    const canonicalHidden = next[canonical] === false
    delete next[alias]
    if (aliasHidden || canonicalHidden) {
      next[canonical] = false
    } else {
      delete next[canonical]
    }
  }
  return next
}

/**
 * Key used when POSTing visibility to the API.
 * Backend widget titles enum uses `consumption_by_area_groups` (not the frontend canonical).
 */
export function getWidgetVisibilityPersistenceKey(key) {
  const canonical = normalizeDashboardWidgetKey(key)
  if (!canonical) return key
  for (const [alias, target] of Object.entries(DASHBOARD_WIDGET_KEY_ALIASES)) {
    if (target === canonical) return alias
  }
  return canonical
}

export const DEFAULT_VISIBLE_DASHBOARD_WIDGET_KEYS = new Set([
  'consumption_saving',
  'instant_utilization_combined',
])

/** Advanced + Customized product defaults (Combined off; individual graphs on). */
export const ADVANCED_LIKE_DEFAULT_VISIBLE_WIDGET_KEYS = new Set([
  'savings_by_strategy',
  'total_consumption_by_group',
  'light_power_density',
  'consumption',
  'savings',
  'peak_and_minimum_consumption',
  'utilization',
  'utilization_by_area_group',
  'utilization_by_area',
  'peak_and_minimum_utilization',
  'instant_occupancy_count',
])

export const DEFAULT_VISIBLE_OVERVIEW_WIDGET_KEYS = new Set([
  'energy',
  'alerts',
  'schedules',
  'quick_controls',
  'shades',
  'floors',
  'space_utilization',
])

export const WIDGET_VISIBILITY_SECTION = {
  savings_by_strategy: 'energy',
  total_consumption_by_group: 'energy',
  consumption_saving: 'energy',
  consumption: 'energy',
  savings: 'energy',
  light_power_density: 'energy',
  peak_and_minimum_consumption: 'energy',
  utilization: 'space',
  utilization_by_area_group: 'space',
  utilization_by_area: 'space',
  peak_and_minimum_utilization: 'space',
  instant_occupancy_count: 'space',
  instant_utilization_combined: 'space',
  energy: 'overview',
  alerts: 'overview',
  schedules: 'overview',
  quick_controls: 'overview',
  shades: 'overview',
  floors: 'overview',
  space_utilization: 'overview',
}

export const OVERVIEW_WIDGET_LABELS = {
  energy: 'Energy',
  alerts: 'Alerts',
  schedules: 'Schedules',
  quick_controls: 'Quick Controls',
  shades: 'Shades',
  floors: 'Floors',
  space_utilization: 'Space Utilization',
}

/** Canonical labels for built-in energy widgets (settings + dashboard title resolution). */
export const SETTINGS_WIDGET_TITLE_FALLBACKS = {
  light_power_density: 'Light Power Density',
  peak_and_minimum_consumption: 'Peak & Minimum Consumption',
}

/** Built-in widgets that must never show external-link / shades rename leakage. */
export const PROTECTED_BUILTIN_WIDGET_KEYS = new Set([
  'light_power_density',
  'peak_and_minimum_consumption',
])

const SHADES_LABEL_PREFIX_RE =
  /^(?:shades[-_](?:name|url)|lutron_dashboard_shades_(?:name|hyperlink))/i

export const INVALID_SETTINGS_WIDGET_KEYS = new Set([
  'shades-name',
  'shades-url',
  'shades_name',
  'shades_url',
  'lutron_dashboard_shades_name',
  'lutron_dashboard_shades_hyperlink',
])

export function slugifyWidgetKey(key) {
  return String(key ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
}

export function readWidgetTitleRowFields(row) {
  if (!row || typeof row !== 'object') {
    return { key: '', title: '', dropdown_name: '' }
  }
  const key = row.key ?? row.widget_key ?? row.widgetKey ?? ''
  const title = row.title ?? row.name ?? row.new_name ?? row.widget_name ?? ''
  const dropdown_name = row.dropdown_name ?? row.dropdownName ?? title
  return {
    key: String(key ?? '').trim(),
    title: String(title ?? '').trim(),
    dropdown_name: String(dropdown_name ?? '').trim(),
  }
}

export function extractWidgetTitlesArray(data) {
  if (data == null) return []
  if (Array.isArray(data)) return data
  if (typeof data !== 'object') return []
  if (Array.isArray(data.titles)) return data.titles
  if (Array.isArray(data.widget_titles)) return data.widget_titles
  if (Array.isArray(data.data)) return data.data
  if (data.data && Array.isArray(data.data.titles)) return data.data.titles
  return []
}

export function isInvalidSettingsWidgetKey(key) {
  const raw = String(key ?? '').trim().toLowerCase()
  if (!raw) return true
  const slug = slugifyWidgetKey(raw)
  if (INVALID_SETTINGS_WIDGET_KEYS.has(raw)) return true
  if (INVALID_SETTINGS_WIDGET_KEYS.has(slug)) return true
  if (raw.startsWith('shades-') && raw !== 'shades') return true
  if (raw.startsWith('shades_') && raw !== 'shades') return true
  if (raw.startsWith('lutron_dashboard_shades_')) return true
  return false
}

export function isCorruptedWidgetDisplayLabel(label) {
  const s = String(label ?? '').trim()
  if (!s) return false
  if (SHADES_LABEL_PREFIX_RE.test(s)) return true
  if (/lutron_dashboard_shades/i.test(s)) return true
  if (/^https?:\/\//i.test(s)) return true
  if (/^shades[-_](?:name|url)/i.test(s)) return true
  return false
}

export function isExternalLinkWidgetTitleForBuiltinKey(canonicalKey, label) {
  const s = String(label ?? '').trim()
  if (!s) return false
  if (canonicalKey === 'light_power_density' && /carbon\s*footprint/i.test(s)) {
    return true
  }
  if (
    canonicalKey === 'peak_and_minimum_consumption' &&
    (/^https?:\/\//i.test(s) || /\/dashboard\/energy/i.test(s))
  ) {
    return true
  }
  return false
}

export function sanitizeWidgetDisplayLabel(label, { fallback } = {}) {
  const s = String(label ?? '').trim()
  if (!s) return fallback ?? ''
  if (SHADES_LABEL_PREFIX_RE.test(s) || /^shades[-_](?:name|url)/i.test(s)) {
    const stripped = s
      .replace(/^shades[-_]name/i, '')
      .replace(/^shades[-_]url/i, '')
      .replace(/^lutron_dashboard_shades_name/i, '')
      .replace(/^lutron_dashboard_shades_hyperlink/i, '')
      .trim()
    if (
      stripped &&
      !SHADES_LABEL_PREFIX_RE.test(stripped) &&
      !/^shades[-_](?:name|url)/i.test(stripped) &&
      !/^https?:\/\//i.test(stripped)
    ) {
      return stripped
    }
    return fallback ?? ''
  }
  if (/^https?:\/\//i.test(s)) return fallback ?? ''
  return s
}

export function resolveSettingsWidgetDisplayName(
  canonicalKey,
  rawTitle,
  rawDropdownName,
  fallbackMap = {}
) {
  const fallback =
    fallbackMap[canonicalKey] ??
    SETTINGS_WIDGET_TITLE_FALLBACKS[canonicalKey] ??
    OVERVIEW_WIDGET_LABELS[canonicalKey] ??
    ''
  const primary = rawDropdownName ?? rawTitle

  // Protected builtins: reject shades/external-link leakage, but allow real renames.
  if (
    PROTECTED_BUILTIN_WIDGET_KEYS.has(canonicalKey) &&
    (isCorruptedWidgetDisplayLabel(primary) ||
      isCorruptedWidgetDisplayLabel(rawTitle) ||
      isExternalLinkWidgetTitleForBuiltinKey(canonicalKey, primary) ||
      isExternalLinkWidgetTitleForBuiltinKey(canonicalKey, rawTitle))
  ) {
    return fallback || canonicalKey
  }

  if (isCorruptedWidgetDisplayLabel(primary)) {
    if (SETTINGS_WIDGET_TITLE_FALLBACKS[canonicalKey]) {
      return SETTINGS_WIDGET_TITLE_FALLBACKS[canonicalKey]
    }
    return sanitizeWidgetDisplayLabel(primary, { fallback }) || fallback || canonicalKey
  }
  const sanitized = sanitizeWidgetDisplayLabel(primary, { fallback })
  if (sanitized) return sanitized
  const sanitizedTitle = sanitizeWidgetDisplayLabel(rawTitle, { fallback })
  if (sanitizedTitle) return sanitizedTitle
  return fallback || canonicalKey
}

/**
 * Normalize widget_titles API rows for Settings → Widgets lists (all variants).
 * Drops spurious shades-* keys and restores corrupted built-in labels.
 */
export function normalizeSettingsWidgetListItems(
  rawTitles,
  { fallbackMap = {}, syntheticKeys = [] } = {}
) {
  const arr = Array.isArray(rawTitles) ? rawTitles : []
  const normalizedItems = []
  for (const t of arr) {
    const fields = readWidgetTitleRowFields(t)
    if (!fields.key) continue
    const canonical = normalizeDashboardWidgetKey(fields.key)
    if (!canonical || isInvalidSettingsWidgetKey(canonical)) continue
    const displayName = resolveSettingsWidgetDisplayName(
      canonical,
      fields.title,
      // Prefer renamed title (API display_name) over stale dropdown_name defaults.
      fields.title || fields.dropdown_name,
      fallbackMap
    )
    normalizedItems.push({
      key: canonical,
      title: fields.title,
      dropdown_name: displayName,
    })
  }
  for (const sk of syntheticKeys) {
    const canonical = normalizeDashboardWidgetKey(String(sk).trim())
    if (!canonical) continue
    const hasCanonical = normalizedItems.some(
      (x) => normalizeDashboardWidgetKey(x.key) === canonical
    )
    if (!hasCanonical) {
      const title = resolveSettingsWidgetDisplayName(canonical, '', '', fallbackMap)
      normalizedItems.push({ key: canonical, title, dropdown_name: title })
    }
  }
  return dedupeWidgetItemsByCanonicalKey(normalizedItems).map((row) => {
    const canonical = normalizeDashboardWidgetKey(row.key)
    const displayName = resolveSettingsWidgetDisplayName(
      canonical,
      row.title,
      row.title || row.dropdown_name,
      fallbackMap
    )
    return {
      ...row,
      key: canonical,
      dropdown_name: displayName || row.dropdown_name,
    }
  })
}

export function normalizeDashboardWidgetKey(key) {
  if (!key || typeof key !== 'string') return key
  const trimmed = key.trim()
  if (DASHBOARD_WIDGET_KEY_ALIASES[trimmed]) {
    return DASHBOARD_WIDGET_KEY_ALIASES[trimmed]
  }
  const slug = slugifyWidgetKey(trimmed)
  if (DASHBOARD_WIDGET_KEY_ALIASES[slug]) {
    return DASHBOARD_WIDGET_KEY_ALIASES[slug]
  }
  if (slug === 'lighting_power_density' || slug === 'light_power_density') {
    return 'light_power_density'
  }
  if (slug === 'peak_min_consumption' || slug === 'peak_and_minimum_consumption') {
    return 'peak_and_minimum_consumption'
  }
  return trimmed
}

const DEFAULT_SYNTHETIC_WIDGET_TITLE_KEYS = [
  'light_power_density',
  'peak_and_minimum_consumption',
]

/**
 * Normalize GET /widgets/widget_titles payloads for Redux + dashboard title resolution.
 */
export function normalizeWidgetTitlesResponse(data, options = {}) {
  const {
    fallbackMap = SETTINGS_WIDGET_TITLE_FALLBACKS,
    syntheticKeys = DEFAULT_SYNTHETIC_WIDGET_TITLE_KEYS,
  } = options
  const titles = extractWidgetTitlesArray(data)
  return {
    titles: normalizeSettingsWidgetListItems(titles, { fallbackMap, syntheticKeys }),
  }
}

export function dedupeWidgetItemsByCanonicalKey(items) {
  if (!Array.isArray(items) || items.length === 0) return []
  const byCanonical = new Map()
  for (const item of items) {
    if (!item || typeof item.key !== 'string') continue
    const canonical = normalizeDashboardWidgetKey(item.key)
    if (!canonical) continue
    const fromCanonical = item.key === canonical
    const prev = byCanonical.get(canonical)
    if (!prev) {
      byCanonical.set(canonical, {
        key: canonical,
        title: item.title,
        dropdown_name: item.dropdown_name ?? item.title,
        fromCanonical,
      })
      continue
    }
    if (fromCanonical && !prev.fromCanonical) {
      byCanonical.set(canonical, {
        key: canonical,
        title: item.title,
        dropdown_name: item.dropdown_name ?? item.title,
        fromCanonical: true,
      })
    } else if (!fromCanonical && prev.fromCanonical) {
      /* keep prev */
    } else {
      byCanonical.set(canonical, {
        key: canonical,
        title: prev.title || item.title,
        dropdown_name: prev.dropdown_name || item.dropdown_name || prev.title || item.title,
        fromCanonical: prev.fromCanonical || fromCanonical,
      })
    }
  }
  return Array.from(byCanonical.values()).map(({ fromCanonical, ...rest }) => rest)
}

export function getDefaultDashboardWidgetVisibilityMap(variant = 'basic') {
  const v = normalizeDashboardUiVariant(variant)
  if (v === 'advanced' || v === 'customized') {
    const m = {}
    for (const key of Object.keys(WIDGET_VISIBILITY_SECTION)) {
      if (key === 'overview_page') continue
      // Overview tiles keep prior "absent = visible" semantics.
      if (WIDGET_VISIBILITY_SECTION[key] === 'overview') continue
      m[key] = ADVANCED_LIKE_DEFAULT_VISIBLE_WIDGET_KEYS.has(key)
    }
    return m
  }
  const m = {}
  for (const key of Object.keys(WIDGET_VISIBILITY_SECTION)) {
    if (key === 'overview_page') continue
    if (DEFAULT_VISIBLE_DASHBOARD_WIDGET_KEYS.has(key)) continue
    if (DEFAULT_VISIBLE_OVERVIEW_WIDGET_KEYS.has(key)) continue
    m[key] = false
  }
  return m
}

export function readDashboardWidgetVisibility(variant = 'basic') {
  const v = normalizeDashboardUiVariant(variant)
  migrateLegacyDashboardWidgetVisibilityToVariant(v)
  const storageKey = getDashboardWidgetVisibilityStorageKey(v)
  try {
    const raw = localStorage.getItem(storageKey)
    if (raw == null || raw === '') {
      return getDefaultDashboardWidgetVisibilityMap(v)
    }
    const parsed = JSON.parse(raw)
    if (parsed === DASHBOARD_WIDGET_VISIBILITY_ALL_VISIBLE_MARKER) {
      return {}
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return getDefaultDashboardWidgetVisibilityMap(v)
    }
    if (Object.keys(parsed).length === 0) {
      return getDefaultDashboardWidgetVisibilityMap(v)
    }
    return sanitizeDashboardWidgetVisibilityMap(parsed)
  } catch {
    return getDefaultDashboardWidgetVisibilityMap(v)
  }
}

export function writeDashboardWidgetVisibility(map, variant = 'basic') {
  const storageKey = getDashboardWidgetVisibilityStorageKey(variant)
  const sanitized = sanitizeDashboardWidgetVisibilityMap(map || {})
  try {
    if (
      sanitized &&
      typeof sanitized === 'object' &&
      !Array.isArray(sanitized) &&
      Object.keys(sanitized).length === 0
    ) {
      localStorage.setItem(storageKey, JSON.stringify(DASHBOARD_WIDGET_VISIBILITY_ALL_VISIBLE_MARKER))
      return
    }
    localStorage.setItem(storageKey, JSON.stringify(sanitized))
  } catch {
    /* quota / private mode */
  }
}

export function readDashboardWidgetVisibilityRaw(variant = 'basic') {
  try {
    return localStorage.getItem(getDashboardWidgetVisibilityStorageKey(variant))
  } catch {
    return null
  }
}

export function restoreDashboardWidgetVisibilityAfterStorageClear(raw, variant = 'basic') {
  if (raw == null) return
  try {
    localStorage.setItem(getDashboardWidgetVisibilityStorageKey(variant), raw)
  } catch {
    /* quota / private mode */
  }
}

export function isWidgetVisibleInMap(map, canonicalKey) {
  const k = normalizeDashboardWidgetKey(canonicalKey)
  if (!k) return true
  if (!map || typeof map !== 'object') return true
  // Trust the canonical entry when present (after enable, key is removed = visible).
  if (Object.prototype.hasOwnProperty.call(map, k)) {
    return map[k] !== false
  }
  // Legacy: only alias stored as false, canonical never written.
  for (const [alias, canonical] of Object.entries(DASHBOARD_WIDGET_KEY_ALIASES)) {
    if (canonical === k && map[alias] === false) return false
  }
  return true
}

export function hasBackendWidgetConfiguration(items) {
  return Array.isArray(items) && items.length > 0
}

export function widgetConfigurationItemsToVisibilityMap(items, variant = 'basic') {
  if (!hasBackendWidgetConfiguration(items)) {
    return getDefaultDashboardWidgetVisibilityMap(variant)
  }
  // Start from product defaults so a sparse backend list cannot flip every
  // untouched chart to "visible" after the first Superadmin save.
  const map = { ...getDefaultDashboardWidgetVisibilityMap(variant) }
  // Collapse alias + canonical rows. Prefer the API persistence key row
  // (e.g. consumption_by_area_groups) when both exist — that is what Basic
  // POSTs, so a stale total_consumption_by_group row cannot snap the switch back.
  const byCanonical = new Map()
  for (const item of items) {
    if (!item || typeof item.widget_key !== 'string') continue
    const rawKey = item.widget_key
    const key = normalizeDashboardWidgetKey(rawKey)
    if (!key) continue
    const persistenceKey = getWidgetVisibilityPersistenceKey(key)
    const isPersistenceRow = rawKey === persistenceKey
    const prev = byCanonical.get(key)
    if (!prev) {
      byCanonical.set(key, { is_visible: item.is_visible, isPersistenceRow })
      continue
    }
    if (isPersistenceRow && !prev.isPersistenceRow) {
      byCanonical.set(key, { is_visible: item.is_visible, isPersistenceRow: true })
      continue
    }
    if (isPersistenceRow === prev.isPersistenceRow) {
      byCanonical.set(key, { is_visible: item.is_visible, isPersistenceRow })
    }
  }
  for (const [key, entry] of byCanonical) {
    if (entry.is_visible === false) {
      map[key] = false
    } else if (entry.is_visible === true) {
      delete map[key]
    }
  }
  return sanitizeDashboardWidgetVisibilityMap(map)
}

export function resolveWidgetConfigurationDisplayName(widgetKey, widgetList) {
  const canonical = normalizeDashboardWidgetKey(widgetKey)
  const fallback =
    OVERVIEW_WIDGET_LABELS[canonical] ??
    SETTINGS_WIDGET_TITLE_FALLBACKS[canonical] ??
    canonical ??
    widgetKey
  const titles = widgetList?.titles
  if (Array.isArray(titles)) {
    const row = titles.find(
      (t) => t && normalizeDashboardWidgetKey(t.key) === canonical
    )
    if (row) {
      return (
        resolveSettingsWidgetDisplayName(
          canonical,
          row.title,
          row.title || row.dropdown_name,
          { ...OVERVIEW_WIDGET_LABELS, ...SETTINGS_WIDGET_TITLE_FALLBACKS }
        ) || fallback
      )
    }
  }
  return fallback
}

export function applyVisibilityToggleToMap(map, key, visible) {
  const canonical = normalizeDashboardWidgetKey(key)
  if (!canonical) return map
  const next = { ...(map || {}) }
  // Clear canonical + aliases so leftover alias:false cannot keep the switch stuck.
  for (const uk of getDashboardWidgetVisibilityKeyGroup(canonical)) {
    delete next[uk]
  }
  if (!visible) {
    next[canonical] = false
  }
  return next
}

/** Energy Combined vs standalone charts (Advanced persistence). */
export const ENERGY_COMBINED_EXCLUSION_KEYS = ['consumption', 'savings_by_strategy']
/** Space Combined vs standalone charts (Advanced persistence). */
export const SPACE_COMBINED_EXCLUSION_KEYS = [
  'instant_occupancy_count',
  'utilization_by_area',
]

/**
 * Toggle + Combined mutual exclusion (Advanced only — Basic keeps its own Settings effect).
 * Enabling an individual forces Combined off (and the reverse) in the same write.
 */
export function applyVisibilityToggleToMapWithCombinedExclusion(map, key, visible) {
  let next = applyVisibilityToggleToMap(map, key, visible)
  const canonical = normalizeDashboardWidgetKey(key)
  if (!canonical) return next

  if (visible) {
    if (ENERGY_COMBINED_EXCLUSION_KEYS.includes(canonical)) {
      next = applyVisibilityToggleToMap(next, 'consumption_saving', false)
    } else if (canonical === 'consumption_saving') {
      for (const k of ENERGY_COMBINED_EXCLUSION_KEYS) {
        next = applyVisibilityToggleToMap(next, k, false)
      }
    }
    if (SPACE_COMBINED_EXCLUSION_KEYS.includes(canonical)) {
      next = applyVisibilityToggleToMap(next, 'instant_utilization_combined', false)
    } else if (canonical === 'instant_utilization_combined') {
      for (const k of SPACE_COMBINED_EXCLUSION_KEYS) {
        next = applyVisibilityToggleToMap(next, k, false)
      }
    }
  }
  return next
}

/**
 * If individuals are on, force Combined off in the map (heals older Advanced storage).
 */
export function normalizeVisibilityMapCombinedExclusion(map) {
  let next =
    map && typeof map === 'object' && !Array.isArray(map)
      ? { ...map }
      : getDefaultDashboardWidgetVisibilityMap()

  const anyEnergyIndividualOn = ENERGY_COMBINED_EXCLUSION_KEYS.some((k) =>
    isWidgetVisibleInMap(next, k)
  )
  if (anyEnergyIndividualOn && isWidgetVisibleInMap(next, 'consumption_saving')) {
    next = applyVisibilityToggleToMap(next, 'consumption_saving', false)
  }

  const anySpaceIndividualOn = SPACE_COMBINED_EXCLUSION_KEYS.some((k) =>
    isWidgetVisibleInMap(next, k)
  )
  if (anySpaceIndividualOn && isWidgetVisibleInMap(next, 'instant_utilization_combined')) {
    next = applyVisibilityToggleToMap(next, 'instant_utilization_combined', false)
  }

  return sanitizeDashboardWidgetVisibilityMap(next)
}

/** Advanced dashboard/settings: Combined hidden while any conflicting individual is visible. */
export function isWidgetVisibleInMapWithCombinedExclusion(map, key) {
  const k = normalizeDashboardWidgetKey(key)
  if (!k) return true

  if (k === 'consumption_saving') {
    if (ENERGY_COMBINED_EXCLUSION_KEYS.some((id) => isWidgetVisibleInMap(map, id))) {
      return false
    }
  }
  if (k === 'instant_utilization_combined') {
    if (SPACE_COMBINED_EXCLUSION_KEYS.some((id) => isWidgetVisibleInMap(map, id))) {
      return false
    }
  }
  return isWidgetVisibleInMap(map, k)
}

export function inferWidgetVisibilitySection(canonicalKey) {
  if (!canonicalKey) return 'other'
  const section = WIDGET_VISIBILITY_SECTION[canonicalKey]
  if (section) {
    return section
  }
  const k = canonicalKey.toLowerCase()
  if (k.includes('utilization') || k.includes('occupancy')) return 'space'
  if (k.includes('consumption') || k.includes('savings') || k.includes('density') || k.includes('light')) {
    return 'energy'
  }
  return 'other'
}

export function resolveVisibilityMap(
  widgetConfiguration,
  widgetConfigurationStatus,
  variant = 'basic'
) {
  const local = readDashboardWidgetVisibility(variant)
  const localRaw = readDashboardWidgetVisibilityRaw(variant)
  if (widgetConfigurationStatus !== 'succeeded') {
    return local
  }
  const v = normalizeDashboardUiVariant(variant)

  // Advanced / Customized: localStorage only. Shared /widgets/configuration has
  // no real ui_variant column, so Basic Combined toggles must not replace other
  // variants' individual-widget selections after refresh or re-fetch.
  if (v !== 'basic') {
    return local
  }

  const filtered = filterWidgetConfigurationByUiVariant(widgetConfiguration, variant)
  if (!hasBackendWidgetConfiguration(filtered)) {
    return local
  }
  // Basic: prefer preserved localStorage (logout restore); else shared API.
  if (localRaw != null && localRaw !== '') {
    return local
  }
  return widgetConfigurationItemsToVisibilityMap(filtered, v)
}

/** Apply explicit backend visibility rows onto an existing map (keeps other keys). */
export function mergeWidgetConfigurationItemsOntoVisibilityMap(baseMap, items) {
  let next = {
    ...(baseMap && typeof baseMap === 'object' && !Array.isArray(baseMap)
      ? baseMap
      : getDefaultDashboardWidgetVisibilityMap()),
  }
  if (!Array.isArray(items)) {
    return sanitizeDashboardWidgetVisibilityMap(next)
  }
  // Collapse alias/canonical first (same preference as full convert).
  const collapsed = widgetConfigurationItemsToVisibilityMap(items)
  const touched = new Set()
  for (const item of items) {
    if (!item || typeof item.widget_key !== 'string') continue
    const key = normalizeDashboardWidgetKey(item.widget_key)
    if (key) touched.add(key)
  }
  for (const key of touched) {
    if (collapsed[key] === false) {
      next[key] = false
    } else {
      for (const uk of getDashboardWidgetVisibilityKeyGroup(key)) {
        delete next[uk]
      }
    }
  }
  return sanitizeDashboardWidgetVisibilityMap(next)
}

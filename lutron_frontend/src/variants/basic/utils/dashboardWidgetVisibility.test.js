/**
 * @jest-environment node
 */

import {
  applyVisibilityToggleToMap,
  getDefaultDashboardWidgetVisibilityMap,
  hasBackendWidgetConfiguration,
  isWidgetVisibleInMap,
  normalizeDashboardWidgetKey,
  readDashboardWidgetVisibility,
  resolveWidgetConfigurationDisplayName,
  widgetConfigurationItemsToVisibilityMap,
  writeDashboardWidgetVisibility,
  DASHBOARD_WIDGET_VISIBILITY_STORAGE_KEY,
  getDashboardWidgetVisibilityStorageKey,
  filterWidgetConfigurationByUiVariant,
  resolveVisibilityMap,
} from './dashboardWidgetVisibilityCore'

describe('dashboardWidgetVisibility API mapping', () => {
  it('detects backend configuration when items exist', () => {
    expect(hasBackendWidgetConfiguration([])).toBe(false)
    expect(hasBackendWidgetConfiguration([{ widget_key: 'consumption', is_visible: true }])).toBe(
      true
    )
  })

  it('converts backend items onto product defaults', () => {
    const map = widgetConfigurationItemsToVisibilityMap([
      { widget_key: 'consumption', is_visible: false },
      { widget_key: 'savings', is_visible: true },
      { widget_key: 'consumption_by_area_groups', is_visible: false },
    ])
    expect(map.consumption).toBe(false)
    expect(map.total_consumption_by_group).toBe(false)
    // Explicitly visible overrides default-hidden
    expect(isWidgetVisibleInMap(map, 'savings')).toBe(true)
    // Default-visible combined stays visible when backend omits it
    expect(isWidgetVisibleInMap(map, 'consumption_saving')).toBe(true)
    // Default-hidden charts stay hidden when backend omits them
    expect(isWidgetVisibleInMap(map, 'light_power_density')).toBe(false)
  })

  it('keeps default-hidden charts hidden when backend only lists other keys', () => {
    const map = widgetConfigurationItemsToVisibilityMap([
      { widget_key: 'consumption', is_visible: false },
    ])
    expect(isWidgetVisibleInMap(map, 'energy')).toBe(true)
    expect(isWidgetVisibleInMap(map, 'consumption_saving')).toBe(true)
    expect(isWidgetVisibleInMap(map, 'savings')).toBe(false)
  })

  it('applyVisibilityToggleToMap matches local semantics', () => {
    const hidden = applyVisibilityToggleToMap({}, 'consumption', false)
    expect(hidden).toEqual({ consumption: false })
    const shown = applyVisibilityToggleToMap(hidden, 'consumption', true)
    expect(shown).toEqual({})
  })

  it('resolveWidgetConfigurationDisplayName uses widget_titles and overview labels', () => {
    const widgetList = {
      titles: [{ key: 'consumption', title: 'Power Use', dropdown_name: 'Power' }],
    }
    expect(resolveWidgetConfigurationDisplayName('consumption', widgetList)).toBe('Power Use')
    expect(resolveWidgetConfigurationDisplayName('energy', widgetList)).toBe('Energy')
    expect(normalizeDashboardWidgetKey('consumption_by_area_groups')).toBe(
      'total_consumption_by_group'
    )
  })
})

describe('dashboardWidgetVisibility localStorage fallback', () => {
  const storage = {}

  beforeEach(() => {
    Object.keys(storage).forEach((k) => delete storage[k])
    global.localStorage = {
      getItem: (key) => (key in storage ? storage[key] : null),
      setItem: (key, value) => {
        storage[key] = value
      },
      removeItem: (key) => {
        delete storage[key]
      },
    }
  })

  it('uses restrictive defaults when storage is empty', () => {
    const map = readDashboardWidgetVisibility('basic')
    expect(isWidgetVisibleInMap(map, 'consumption_saving')).toBe(true)
    expect(isWidgetVisibleInMap(map, 'instant_utilization_combined')).toBe(true)
    expect(isWidgetVisibleInMap(map, 'consumption')).toBe(false)
    expect(isWidgetVisibleInMap(map, 'energy')).toBe(true)
  })

  it('persists hidden keys to variant-scoped localStorage', () => {
    writeDashboardWidgetVisibility({ consumption: false }, 'basic')
    const raw = storage[getDashboardWidgetVisibilityStorageKey('basic')]
    expect(JSON.parse(raw)).toEqual({ consumption: false })
    expect(isWidgetVisibleInMap(readDashboardWidgetVisibility('basic'), 'consumption')).toBe(false)
  })

  it('isolates basic and advanced visibility maps', () => {
    writeDashboardWidgetVisibility({ consumption: false }, 'basic')
    writeDashboardWidgetVisibility({ savings: false }, 'advanced')
    expect(isWidgetVisibleInMap(readDashboardWidgetVisibility('basic'), 'consumption')).toBe(false)
    expect(isWidgetVisibleInMap(readDashboardWidgetVisibility('basic'), 'savings')).toBe(true)
    expect(isWidgetVisibleInMap(readDashboardWidgetVisibility('advanced'), 'savings')).toBe(false)
    expect(isWidgetVisibleInMap(readDashboardWidgetVisibility('advanced'), 'consumption')).toBe(true)
  })

  it('filterWidgetConfigurationByUiVariant keeps legacy rows on basic only', () => {
    const items = [{ widget_key: 'consumption', is_visible: false }]
    expect(filterWidgetConfigurationByUiVariant(items, 'basic')).toHaveLength(1)
    expect(filterWidgetConfigurationByUiVariant(items, 'advanced')).toHaveLength(0)
  })

  it('filterWidgetConfigurationByUiVariant matches ui_variant when present', () => {
    const items = [
      { widget_key: 'consumption', is_visible: false, ui_variant: 'advanced' },
      { widget_key: 'savings', is_visible: false, ui_variant: 'basic' },
    ]
    expect(filterWidgetConfigurationByUiVariant(items, 'advanced')).toHaveLength(1)
    expect(filterWidgetConfigurationByUiVariant(items, 'advanced')[0].widget_key).toBe('consumption')
  })

  it('resolveVisibilityMap prefers local advanced map when backend is legacy-only', () => {
    writeDashboardWidgetVisibility({ consumption: false }, 'advanced')
    const map = resolveVisibilityMap(
      [{ widget_key: 'savings', is_visible: false }],
      'succeeded',
      'advanced'
    )
    expect(isWidgetVisibleInMap(map, 'consumption')).toBe(false)
  })

  it('advanced ignores shared API Combined so Basic cannot overwrite Advanced', () => {
    writeDashboardWidgetVisibility(
      {
        consumption: false,
        savings_by_strategy: false,
        // individuals visible (key absent) except we hide combined:
        consumption_saving: false,
      },
      'advanced'
    )
    const map = resolveVisibilityMap(
      [
        { widget_key: 'consumption_saving', is_visible: true },
        { widget_key: 'consumption', is_visible: false },
        { widget_key: 'savings_by_strategy', is_visible: false },
      ],
      'succeeded',
      'advanced'
    )
    expect(isWidgetVisibleInMap(map, 'consumption_saving')).toBe(false)
    expect(isWidgetVisibleInMap(map, 'consumption')).toBe(true)
  })

  it('does not copy basic localStorage into advanced when advanced key is missing', () => {
    writeDashboardWidgetVisibility({ consumption_saving: false, consumption: false }, 'basic')
    // Ensure advanced key absent
    try {
      localStorage.removeItem(
        getDashboardWidgetVisibilityStorageKey('advanced')
      )
    } catch {
      /* ignore */
    }
    const map = readDashboardWidgetVisibility('advanced')
    // Product defaults: Combined visible, consumption hidden — not Basic's map.
    expect(isWidgetVisibleInMap(map, 'consumption_saving')).toBe(true)
    expect(isWidgetVisibleInMap(map, 'consumption')).toBe(false)
  })

  it('default map hides non-overview charts except combined slots', () => {
    const defaults = getDefaultDashboardWidgetVisibilityMap()
    expect(defaults.consumption).toBe(false)
    expect(defaults.energy).toBeUndefined()
  })
})

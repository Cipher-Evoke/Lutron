/**
 * @jest-environment node
 */
import {
  applyVisibilityToggleToMap,
  applyVisibilityToggleToMapWithCombinedExclusion,
  normalizeVisibilityMapCombinedExclusion,
  isWidgetVisibleInMapWithCombinedExclusion,
  getDefaultDashboardWidgetVisibilityMap,
  getWidgetVisibilityPersistenceKey,
  hasBackendWidgetConfiguration,
  isWidgetVisibleInMap,
  mergeWidgetConfigurationItemsOntoVisibilityMap,
  normalizeDashboardWidgetKey,
  widgetConfigurationItemsToVisibilityMap,
  isCorruptedWidgetDisplayLabel,
  isInvalidSettingsWidgetKey,
  normalizeSettingsWidgetListItems,
  resolveSettingsWidgetDisplayName,
  sanitizeWidgetDisplayLabel,
  SETTINGS_WIDGET_TITLE_FALLBACKS,
  normalizeWidgetTitlesResponse,
} from './dashboardWidgetVisibilityCore';

describe('dashboardWidgetVisibilityCore (shared)', () => {
  it('normalizes alias keys', () => {
    expect(normalizeDashboardWidgetKey('consumption_by_area_groups')).toBe(
      'total_consumption_by_group'
    );
  });

  it('converts backend items onto product defaults', () => {
    const map = widgetConfigurationItemsToVisibilityMap([
      { widget_key: 'consumption', is_visible: false },
      { widget_key: 'savings', is_visible: true },
    ]);
    expect(map.consumption).toBe(false);
    expect(isWidgetVisibleInMap(map, 'savings')).toBe(true);
    expect(isWidgetVisibleInMap(map, 'consumption_saving')).toBe(true);
    expect(isWidgetVisibleInMap(map, 'light_power_density')).toBe(false);
  });

  it('hasBackendWidgetConfiguration detects items', () => {
    expect(hasBackendWidgetConfiguration([])).toBe(false);
    expect(hasBackendWidgetConfiguration([{ widget_key: 'x', is_visible: true }])).toBe(true);
  });

  it('applyVisibilityToggleToMap removes key when visible', () => {
    const next = applyVisibilityToggleToMap({ consumption: false }, 'consumption', true);
    expect(next.consumption).toBeUndefined();
  });

  it('applyVisibilityToggleToMapWithCombinedExclusion turns Combined off when enabling individual', () => {
    const base = getDefaultDashboardWidgetVisibilityMap();
    const next = applyVisibilityToggleToMapWithCombinedExclusion(base, 'consumption', true);
    expect(isWidgetVisibleInMap(next, 'consumption')).toBe(true);
    expect(isWidgetVisibleInMap(next, 'consumption_saving')).toBe(false);
    expect(isWidgetVisibleInMapWithCombinedExclusion(next, 'consumption_saving')).toBe(false);
  });

  it('normalizeVisibilityMapCombinedExclusion heals Combined still on with individuals', () => {
    const dirty = applyVisibilityToggleToMap(
      getDefaultDashboardWidgetVisibilityMap(),
      'consumption',
      true
    );
    // Combined still default-visible (key absent) before normalize
    expect(isWidgetVisibleInMap(dirty, 'consumption_saving')).toBe(true);
    const healed = normalizeVisibilityMapCombinedExclusion(dirty);
    expect(isWidgetVisibleInMap(healed, 'consumption_saving')).toBe(false);
    expect(isWidgetVisibleInMap(healed, 'consumption')).toBe(true);
  });

  it('prefers API persistence alias row over stale canonical for area-groups toggle', () => {
    const map = widgetConfigurationItemsToVisibilityMap([
      { widget_key: 'total_consumption_by_group', is_visible: false },
      { widget_key: 'consumption_by_area_groups', is_visible: true },
    ]);
    expect(isWidgetVisibleInMap(map, 'total_consumption_by_group')).toBe(true);
    expect(isWidgetVisibleInMap(map, 'consumption_by_area_groups')).toBe(true);

    const hidden = widgetConfigurationItemsToVisibilityMap([
      { widget_key: 'total_consumption_by_group', is_visible: true },
      { widget_key: 'consumption_by_area_groups', is_visible: false },
    ]);
    expect(isWidgetVisibleInMap(hidden, 'total_consumption_by_group')).toBe(false);
  });

  it('mergeWidgetConfigurationItemsOntoVisibilityMap keeps unrelated local keys', () => {
    const merged = mergeWidgetConfigurationItemsOntoVisibilityMap(
      {
        consumption: false,
        savings_by_strategy: false,
        total_consumption_by_group: false,
      },
      [{ widget_key: 'total_consumption_by_group', is_visible: true }]
    );
    expect(isWidgetVisibleInMap(merged, 'total_consumption_by_group')).toBe(true);
    expect(merged.consumption).toBe(false);
    expect(merged.savings_by_strategy).toBe(false);
  });

  it('applyVisibilityToggleToMap clears alias keys for Consumption by area groups', () => {
    const stuck = applyVisibilityToggleToMap(
      {
        total_consumption_by_group: false,
        consumption_by_area_groups: false,
      },
      'consumption_by_area_groups',
      true
    );
    expect(stuck.total_consumption_by_group).toBeUndefined();
    expect(stuck.consumption_by_area_groups).toBeUndefined();
    expect(isWidgetVisibleInMap(stuck, 'total_consumption_by_group')).toBe(true);
    expect(isWidgetVisibleInMap(stuck, 'consumption_by_area_groups')).toBe(true);

    const hidden = applyVisibilityToggleToMap(stuck, 'total_consumption_by_group', false);
    expect(hidden.total_consumption_by_group).toBe(false);
    expect(hidden.consumption_by_area_groups).toBeUndefined();
    expect(isWidgetVisibleInMap(hidden, 'consumption_by_area_groups')).toBe(false);
  });

  it('default map hides non-default keys', () => {
    const m = getDefaultDashboardWidgetVisibilityMap();
    expect(m.consumption).toBe(false);
    expect(m.energy).toBeUndefined();
  });

  it('filters spurious shades-* widget keys and restores corrupted built-in labels', () => {
    const items = normalizeSettingsWidgetListItems(
      [
        { key: 'shades-name', title: 'Carbon Footprint' },
        { key: 'shades-url', title: 'http://localhost:3000/dashboard/energy' },
        {
          key: 'light_power_density',
          title: 'Light Power Density',
          dropdown_name: 'light power density',
        },
        {
          key: 'peak_and_minimum_consumption',
          title: 'Peak and Minimum Consuption',
        },
        { key: 'consumption', title: 'Consumption' },
      ],
      { syntheticKeys: ['light_power_density', 'peak_and_minimum_consumption'] }
    );

    expect(items.map((row) => row.key)).toEqual([
      'light_power_density',
      'peak_and_minimum_consumption',
      'consumption',
    ]);
    expect(items.find((r) => r.key === 'light_power_density')?.dropdown_name).toBe(
      SETTINGS_WIDGET_TITLE_FALLBACKS.light_power_density
    );
    expect(items.find((r) => r.key === 'peak_and_minimum_consumption')?.dropdown_name).toBe(
      SETTINGS_WIDGET_TITLE_FALLBACKS.peak_and_minimum_consumption
    );
  });

  it('detects corrupted widget display labels', () => {
    expect(isCorruptedWidgetDisplayLabel('shades-nameCarbon Footprint')).toBe(true);
    expect(isCorruptedWidgetDisplayLabel('shades_nameCarbon Footprint')).toBe(true);
    expect(isInvalidSettingsWidgetKey('shades-url')).toBe(true);
    expect(isInvalidSettingsWidgetKey('lutron_dashboard_shades_name')).toBe(true);
    expect(sanitizeWidgetDisplayLabel('shades-nameTest', { fallback: 'Fallback' })).toBe('Test');
    expect(
      resolveSettingsWidgetDisplayName(
        'light_power_density',
        'shades-nameCarbon Footprint',
        'shades-nameCarbon Footprint'
      )
    ).toBe(SETTINGS_WIDGET_TITLE_FALLBACKS.light_power_density);
    expect(
      resolveSettingsWidgetDisplayName(
        'light_power_density',
        'Carbon Footprint',
        'Carbon Footprint'
      )
    ).toBe(SETTINGS_WIDGET_TITLE_FALLBACKS.light_power_density);
    expect(
      resolveSettingsWidgetDisplayName(
        'light_power_density',
        'Campus LPD',
        'Campus LPD'
      )
    ).toBe('Campus LPD');
    expect(
      resolveSettingsWidgetDisplayName(
        'peak_and_minimum_consumption',
        'Peak Demand',
        'Peak Demand'
      )
    ).toBe('Peak Demand');
  });

  it('normalizeWidgetTitlesResponse sanitizes API payloads', () => {
    const payload = normalizeWidgetTitlesResponse({
      titles: [
        { key: 'shades-name', title: 'Carbon Footprint' },
        {
          key: 'light_power_density',
          title: 'shades-nameCarbon Footprint',
        },
      ],
    });
    expect(payload.titles.map((row) => row.key)).toEqual([
      'light_power_density',
      'peak_and_minimum_consumption',
    ]);
    expect(payload.titles[0].dropdown_name).toBe(
      SETTINGS_WIDGET_TITLE_FALLBACKS.light_power_density
    );
  });
});

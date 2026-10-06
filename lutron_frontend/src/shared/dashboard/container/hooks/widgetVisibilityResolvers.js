import {
  isWidgetVisibleInMap,
  isWidgetVisibleInMapWithCombinedExclusion,
  normalizeDashboardWidgetKey,
  resolveSettingsWidgetDisplayName,
  SETTINGS_WIDGET_TITLE_FALLBACKS,
  resolveWidgetConfigurationDisplayName,
} from '../../utils/dashboardWidgetVisibilityCore';
import {
  resolveCustomizedEnergySelectedKeys,
  resolveCustomizedSpaceSelectedKeys,
  isCustomizedVisibilitySectionEmpty,
} from '../../../../variants/customized/utils/customizedOverviewWidgetVisibility';

export const ENERGY_WIDGET_TITLE_DEFAULTS = {
  consumption: 'Consumption',
  savings: 'Savings',
  savingsByStrategy: 'Savings By Strategy',
  totalConsumptionByGroup: 'Consumption By Area Groups',
  consumptionSaving: 'Energy',
  lightPowerDensity: 'Light Power Density',
  peakAndMinimumConsumption: 'Peak & Minimum Consumption',
};

export const TOTAL_CONSUMPTION_GROUP_ALIASES = [
  'total_consumption_by_group',
  'consumption_by_area_groups',
];

/**
 * Legacy Dashboard getWidgetTitle — exact key match (basic/advanced) or
 * customized string coercion with dropdown_name fallback.
 */
export function resolveDashboardWidgetTitle(
  widgetKey,
  fallbackTitle,
  widgetList,
  options = {}
) {
  const { variant = 'basic' } = options;
  const titles = widgetList?.titles;
  if (!Array.isArray(titles)) return fallbackTitle;

  const widget = titles.find((entry) => {
    if (!entry) return false;
    const entryKey = normalizeDashboardWidgetKey(
      String(entry.key ?? entry.widget_key ?? '').trim()
    );
    const targetKey = normalizeDashboardWidgetKey(String(widgetKey).trim());
    return entryKey === targetKey;
  });

  if (!widget) return fallbackTitle;

  const canonical = normalizeDashboardWidgetKey(widgetKey);
  const renamedTitle = widget.title ?? widget.name ?? widget.new_name;
  return resolveSettingsWidgetDisplayName(
    canonical,
    renamedTitle,
    // Prefer API title (display_name from rename) over stale dropdown_name.
    renamedTitle || widget.dropdown_name || widget.dropdownName,
    {
      ...SETTINGS_WIDGET_TITLE_FALLBACKS,
      [canonical]: fallbackTitle || SETTINGS_WIDGET_TITLE_FALLBACKS[canonical],
    }
  );
}

export function resolveDashboardWidgetTitleWithAliases(
  primaryKey,
  aliasKeys,
  fallbackTitle,
  widgetList,
  options = {}
) {
  const keys = [primaryKey, ...(Array.isArray(aliasKeys) ? aliasKeys : [])];
  for (const key of keys) {
    const title = resolveDashboardWidgetTitle(key, '', widgetList, options);
    if (title) return title;
  }
  return fallbackTitle;
}

export function resolveEnergyWidgetTitles(widgetList, options = {}) {
  const { variant = 'basic', includeAliases = variant === 'customized' } = options;

  const resolve = (key, fallback, aliasKeys = []) => {
    if (includeAliases && aliasKeys.length > 0) {
      return resolveDashboardWidgetTitleWithAliases(key, aliasKeys, fallback, widgetList, {
        variant,
      });
    }
    return resolveDashboardWidgetTitle(key, fallback, widgetList, { variant });
  };

  return {
    consumption: resolve('consumption', ENERGY_WIDGET_TITLE_DEFAULTS.consumption),
    savings: resolve('savings', ENERGY_WIDGET_TITLE_DEFAULTS.savings),
    savingsByStrategy: resolve(
      'savings_by_strategy',
      ENERGY_WIDGET_TITLE_DEFAULTS.savingsByStrategy
    ),
    totalConsumptionByGroup: resolve(
      'total_consumption_by_group',
      ENERGY_WIDGET_TITLE_DEFAULTS.totalConsumptionByGroup,
      TOTAL_CONSUMPTION_GROUP_ALIASES
    ),
    consumptionSaving: resolve(
      'consumption_saving',
      ENERGY_WIDGET_TITLE_DEFAULTS.consumptionSaving
    ),
    lightPowerDensity: resolve(
      'light_power_density',
      ENERGY_WIDGET_TITLE_DEFAULTS.lightPowerDensity
    ),
    peakAndMinimumConsumption: resolve(
      'peak_and_minimum_consumption',
      ENERGY_WIDGET_TITLE_DEFAULTS.peakAndMinimumConsumption
    ),
  };
}

export function resolveEnergyWidgetVisibilityKeys(widgetKey) {
  if (widgetKey === 'total_consumption_by_group') {
    return TOTAL_CONSUMPTION_GROUP_ALIASES;
  }
  return [widgetKey];
}

export function resolveBuiltinEnergyWidgetVisible(widgetKey, visibilityMap, options = {}) {
  const { variant = 'basic' } = options;
  const canonical = normalizeDashboardWidgetKey(widgetKey);
  if (variant === 'advanced') {
    return isWidgetVisibleInMapWithCombinedExclusion(visibilityMap || {}, canonical);
  }
  return isWidgetVisibleInMap(visibilityMap || {}, canonical);
}

/**
 * Customized Space Utilization (Combined) — matches Settings / Advanced defaults
 * (Combined off when empty or when individual occupancy charts are on).
 */
export function resolveCustomizedSpaceCombinedVisible(widgetVisibility) {
  return resolveCustomizedSpaceSelectedKeys(widgetVisibility).includes(
    'instant_utilization_combined'
  );
}

/**
 * Customized Energy dashboard visibility.
 * Empty prefs → Advanced-like defaults (Combined off). Built-ins via selected keys.
 */
export function resolveCustomizedEnergyWidgetVisible(
  widgetKey,
  widgetVisibility,
  getEffectiveBuiltinDashboardPage
) {
  const keysToCheckPage = resolveEnergyWidgetVisibilityKeys(widgetKey);
  if (
    keysToCheckPage.some((key) => getEffectiveBuiltinDashboardPage(key) === 'space')
  ) {
    return false;
  }

  const energyMap = widgetVisibility?.energy;
  if (String(widgetKey).startsWith('custom_graph:')) {
    if (!energyMap || typeof energyMap !== 'object' || Object.keys(energyMap).length === 0) {
      return true;
    }
    return energyMap?.[widgetKey] !== false;
  }

  const selected = resolveCustomizedEnergySelectedKeys(widgetVisibility);
  const keysToCheck = resolveEnergyWidgetVisibilityKeys(widgetKey);
  return keysToCheck.some((key) => selected.includes(key));
}

/**
 * Customized Space dashboard visibility (shared with SpaceUtilization).
 */
export function resolveCustomizedSpaceWidgetVisible(
  widgetKey,
  widgetVisibility,
  getEffectiveBuiltinDashboardPage,
  options = {}
) {
  const { showUtilizationLineChart = true } = options;
  if (widgetKey === 'utilization' && !showUtilizationLineChart) {
    return false;
  }

  if (String(widgetKey).startsWith('custom_graph:')) {
    const spaceMap = widgetVisibility?.space;
    if (isCustomizedVisibilitySectionEmpty(spaceMap)) return true;
    return spaceMap?.[widgetKey] !== false;
  }

  if (
    typeof getEffectiveBuiltinDashboardPage === 'function' &&
    getEffectiveBuiltinDashboardPage(widgetKey) === 'energy'
  ) {
    return false;
  }

  return resolveCustomizedSpaceSelectedKeys(widgetVisibility).includes(widgetKey);
}

export function resolveEnergyWidgetVisible(widgetKey, context = {}) {
  const { variant = 'basic', visibilityMap, widgetVisibility, getEffectiveBuiltinDashboardPage } =
    context;

  if (variant === 'customized') {
    return resolveCustomizedEnergyWidgetVisible(
      widgetKey,
      widgetVisibility,
      getEffectiveBuiltinDashboardPage || (() => 'energy')
    );
  }

  return resolveBuiltinEnergyWidgetVisible(widgetKey, visibilityMap, { variant });
}

export function resolveDashboardWidgetDisplayName(widgetKey, widgetList, fallbackTitle) {
  return resolveWidgetConfigurationDisplayName(widgetKey, widgetList) || fallbackTitle;
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchWidgetConfiguration,
  selectWidgetConfiguration,
  selectWidgetConfigurationStatus,
} from '../redux/slice/settingsslice/heatmap/groupOccupancySlice';
import { dispatchFetchWidgetConfigurationOnce } from '../../../shared/utils/bootstrapFetchGuards';
import {
  applyVisibilityToggleToMap,
  applyVisibilityToggleToMapWithCombinedExclusion,
  normalizeVisibilityMapCombinedExclusion,
  isWidgetVisibleInMapWithCombinedExclusion,
  DASHBOARD_WIDGET_VISIBILITY_EVENT,
  DASHBOARD_WIDGET_VISIBILITY_STORAGE_KEY,
  DASHBOARD_WIDGET_KEY_ALIASES,
  DEFAULT_VISIBLE_DASHBOARD_WIDGET_KEYS,
  DEFAULT_VISIBLE_OVERVIEW_WIDGET_KEYS,
  OVERVIEW_WIDGET_LABELS,
  WIDGET_VISIBILITY_SECTION,
  dedupeWidgetItemsByCanonicalKey,
  getDefaultDashboardWidgetVisibilityMap,
  getWidgetVisibilityPersistenceKey,
  hasBackendWidgetConfiguration,
  inferWidgetVisibilitySection,
  isWidgetVisibleInMap,
  normalizeDashboardWidgetKey,
  normalizeSettingsWidgetListItems,
  resolveSettingsWidgetDisplayName,
  readDashboardWidgetVisibility,
  readDashboardWidgetVisibilityRaw,
  resolveVisibilityMap,
  resolveWidgetConfigurationDisplayName,
  restoreDashboardWidgetVisibilityAfterStorageClear,
  widgetConfigurationItemsToVisibilityMap,
  writeDashboardWidgetVisibility,
  filterWidgetConfigurationByUiVariant,
} from './dashboardWidgetVisibilityCore';

const UI_VARIANT = 'advanced';

function readAdvancedVisibilityMap() {
  return normalizeVisibilityMapCombinedExclusion(
    readDashboardWidgetVisibility(UI_VARIANT)
  );
}

export {
  DASHBOARD_WIDGET_VISIBILITY_STORAGE_KEY,
  DASHBOARD_WIDGET_VISIBILITY_EVENT,
  DASHBOARD_WIDGET_KEY_ALIASES,
  DEFAULT_VISIBLE_DASHBOARD_WIDGET_KEYS,
  DEFAULT_VISIBLE_OVERVIEW_WIDGET_KEYS,
  WIDGET_VISIBILITY_SECTION,
  OVERVIEW_WIDGET_LABELS,
  normalizeDashboardWidgetKey,
  dedupeWidgetItemsByCanonicalKey,
  getDefaultDashboardWidgetVisibilityMap,
  getWidgetVisibilityPersistenceKey,
  readDashboardWidgetVisibility,
  writeDashboardWidgetVisibility,
  readDashboardWidgetVisibilityRaw,
  restoreDashboardWidgetVisibilityAfterStorageClear,
  isWidgetVisibleInMap,
  hasBackendWidgetConfiguration,
  widgetConfigurationItemsToVisibilityMap,
  resolveWidgetConfigurationDisplayName,
  applyVisibilityToggleToMap,
  applyVisibilityToggleToMapWithCombinedExclusion,
  normalizeVisibilityMapCombinedExclusion,
  isWidgetVisibleInMapWithCombinedExclusion,
  inferWidgetVisibilitySection,
  normalizeSettingsWidgetListItems,
  resolveSettingsWidgetDisplayName,
};

/**
 * Advanced widget visibility is localStorage-only (per-variant key).
 * Shared /widgets/configuration has no ui_variant column — posting from Advanced
 * would overwrite Basic Combined selections and re-hydrate Advanced from Basic.
 */
export function useDashboardWidgetVisibility() {
  const dispatch = useDispatch();
  const widgetConfiguration = useSelector(selectWidgetConfiguration);
  const widgetConfigurationStatus = useSelector(selectWidgetConfigurationStatus);

  const variantWidgetConfiguration = useMemo(
    () => filterWidgetConfigurationByUiVariant(widgetConfiguration, UI_VARIANT),
    [widgetConfiguration]
  );

  const backendActive = useMemo(
    () =>
      widgetConfigurationStatus === 'succeeded' &&
      hasBackendWidgetConfiguration(variantWidgetConfiguration),
    [variantWidgetConfiguration, widgetConfigurationStatus]
  );

  const [map, setMap] = useState(() => readAdvancedVisibilityMap());
  const mapRef = useRef(map);
  mapRef.current = map;
  const hydratedStatusRef = useRef(false);

  // Hydrate once when fetch settles — never replace a saved Advanced map with Combined defaults.
  useEffect(() => {
    if (widgetConfigurationStatus !== 'succeeded') return;
    if (hydratedStatusRef.current) return;
    hydratedStatusRef.current = true;

    const resolved = normalizeVisibilityMapCombinedExclusion(
      resolveVisibilityMap(
        widgetConfiguration,
        widgetConfigurationStatus,
        UI_VARIANT
      )
    );
    setMap(resolved);
    mapRef.current = resolved;
    const raw = readDashboardWidgetVisibilityRaw(UI_VARIANT);
    if (raw != null && raw !== '') {
      writeDashboardWidgetVisibility(resolved, UI_VARIANT);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once on succeeded
  }, [widgetConfigurationStatus]);

  useEffect(() => {
    const sync = () => {
      const next = readAdvancedVisibilityMap();
      mapRef.current = next;
      setMap(next);
    };
    window.addEventListener('storage', sync);
    window.addEventListener(DASHBOARD_WIDGET_VISIBILITY_EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(DASHBOARD_WIDGET_VISIBILITY_EVENT, sync);
    };
  }, []);

  const isWidgetVisible = useCallback(
    (key) =>
      isWidgetVisibleInMapWithCombinedExclusion(
        map,
        normalizeDashboardWidgetKey(key)
      ),
    [map]
  );

  const setWidgetVisible = useCallback((key, visible) => {
    const k = normalizeDashboardWidgetKey(key);
    if (!k) return;

    const prev = mapRef.current;
    const base =
      prev && typeof prev === 'object' && Object.keys(prev).length > 0
        ? prev
        : readAdvancedVisibilityMap();
    const next = normalizeVisibilityMapCombinedExclusion(
      applyVisibilityToggleToMapWithCombinedExclusion(base, k, visible)
    );
    writeDashboardWidgetVisibility(next, UI_VARIANT);
    mapRef.current = next;
    setMap(next);
    window.dispatchEvent(new CustomEvent(DASHBOARD_WIDGET_VISIBILITY_EVENT));
  }, []);

  return {
    isWidgetVisible,
    setWidgetVisible,
    visibilityMap: map,
    widgetConfigurationStatus,
    backendActive,
    refreshWidgetConfiguration: () =>
      dispatchFetchWidgetConfigurationOnce(dispatch, fetchWidgetConfiguration, { force: true }),
  };
}

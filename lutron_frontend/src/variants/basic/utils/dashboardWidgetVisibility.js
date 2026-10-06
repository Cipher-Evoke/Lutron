import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { UseAuth } from '../customhooks/UseAuth'
import {
  fetchWidgetConfiguration,
  saveWidgetVisibility,
  selectWidgetConfiguration,
  selectWidgetConfigurationStatus,
} from '../redux/slice/settingsslice/heatmap/groupOccupancySlice'
import { dispatchFetchWidgetConfigurationOnce } from '../../../shared/utils/bootstrapFetchGuards'
import {
  applyVisibilityToggleToMap,
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
} from './dashboardWidgetVisibilityCore'

const UI_VARIANT = 'basic'

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
  inferWidgetVisibilitySection,
  normalizeSettingsWidgetListItems,
  resolveSettingsWidgetDisplayName,
}

export function useDashboardWidgetVisibility() {
  const dispatch = useDispatch()
  const { role } = UseAuth()
  const widgetConfiguration = useSelector(selectWidgetConfiguration)
  const widgetConfigurationStatus = useSelector(selectWidgetConfigurationStatus)
  const widgetList = useSelector((state) => state.groupOccupancy.widgets)

  const variantWidgetConfiguration = useMemo(
    () => filterWidgetConfigurationByUiVariant(widgetConfiguration, UI_VARIANT),
    [widgetConfiguration]
  )

  const backendActive = useMemo(
    () =>
      widgetConfigurationStatus === 'succeeded' &&
      hasBackendWidgetConfiguration(variantWidgetConfiguration),
    [variantWidgetConfiguration, widgetConfigurationStatus]
  )

  const [map, setMap] = useState(() => readDashboardWidgetVisibility(UI_VARIANT))
  const mapRef = useRef(map)
  mapRef.current = map

  // Hydrate only when a fetch completes (status → succeeded). Do NOT re-run on
  // saveWidgetVisibility merges — that snapped toggles back after click.
  useEffect(() => {
    if (widgetConfigurationStatus !== 'succeeded') return
    const resolved = resolveVisibilityMap(
      widgetConfiguration,
      widgetConfigurationStatus,
      UI_VARIANT
    )
    setMap(resolved)
    mapRef.current = resolved
    const filtered = filterWidgetConfigurationByUiVariant(widgetConfiguration, UI_VARIANT)
    if (hasBackendWidgetConfiguration(filtered)) {
      writeDashboardWidgetVisibility(resolved, UI_VARIANT)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: hydrate on fetch status only
  }, [widgetConfigurationStatus])

  useEffect(() => {
    const sync = () => {
      const next = readDashboardWidgetVisibility(UI_VARIANT)
      mapRef.current = next
      setMap(next)
    }
    window.addEventListener('storage', sync)
    window.addEventListener(DASHBOARD_WIDGET_VISIBILITY_EVENT, sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener(DASHBOARD_WIDGET_VISIBILITY_EVENT, sync)
    }
  }, [])

  const isWidgetVisible = useCallback(
    (key) => isWidgetVisibleInMap(map, normalizeDashboardWidgetKey(key)),
    [map]
  )

  const setWidgetVisible = useCallback(
    (key, visible, options = {}) => {
      const k = normalizeDashboardWidgetKey(key)
      if (!k) return
      const skipRemote = options.skipRemote === true

      const prev = mapRef.current
      const base =
        prev && typeof prev === 'object' && Object.keys(prev).length > 0
          ? prev
          : readDashboardWidgetVisibility(UI_VARIANT)
      const next = applyVisibilityToggleToMap(base, k, visible)
      writeDashboardWidgetVisibility(next, UI_VARIANT)
      mapRef.current = next
      setMap(next)
      window.dispatchEvent(new CustomEvent(DASHBOARD_WIDGET_VISIBILITY_EVENT))

      if (!skipRemote && role === 'Superadmin') {
        const display_name = resolveWidgetConfigurationDisplayName(k, widgetList)
        const dropdownRow = Array.isArray(widgetList?.titles)
          ? widgetList.titles.find(
              (t) => t && normalizeDashboardWidgetKey(t.key) === k
            )
          : null
        const dropdown_name = dropdownRow?.dropdown_name ?? display_name
        const persistenceKey = getWidgetVisibilityPersistenceKey(k)
        dispatch(
          saveWidgetVisibility({
            widget_key: persistenceKey,
            is_visible: visible,
            display_name,
            dropdown_name,
            ui_variant: UI_VARIANT,
          })
        )
      }
    },
    [dispatch, role, widgetList]
  )

  return {
    isWidgetVisible,
    setWidgetVisible,
    visibilityMap: map,
    widgetConfigurationStatus,
    backendActive,
    refreshWidgetConfiguration: () =>
      dispatchFetchWidgetConfigurationOnce(dispatch, fetchWidgetConfiguration, { force: true }),
  }
}

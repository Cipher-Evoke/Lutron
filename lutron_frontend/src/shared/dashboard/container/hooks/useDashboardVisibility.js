import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  applyVisibilityToggleToMap,
  applyVisibilityToggleToMapWithCombinedExclusion,
  normalizeVisibilityMapCombinedExclusion,
  isWidgetVisibleInMapWithCombinedExclusion,
  DASHBOARD_WIDGET_VISIBILITY_EVENT,
  hasBackendWidgetConfiguration,
  isWidgetVisibleInMap,
  normalizeDashboardWidgetKey,
  readDashboardWidgetVisibility,
  readDashboardWidgetVisibilityRaw,
  resolveVisibilityMap,
  resolveWidgetConfigurationDisplayName,
  widgetConfigurationItemsToVisibilityMap,
  writeDashboardWidgetVisibility,
  filterWidgetConfigurationByUiVariant,
} from '../../utils/dashboardWidgetVisibilityCore';
import {
  resolveCustomizedEnergyWidgetVisible,
  resolveEnergyWidgetVisible,
  resolveEnergyWidgetVisibilityKeys,
} from './widgetVisibilityResolvers';
import {
  applyEnergyChartOrderForVisibility,
  buildDashboardRowsWithSpan,
  deriveEnergyChartOrderFromWidgetTitles,
  ENERGY_CHART_ORDER_STORAGE_KEY,
  hasStoredEnergyChartOrder,
  isCanonicalDefaultEnergyOrder,
  loadEnergyChartOrderFromStorage,
  mergeVisibleDashboardOrder,
  normalizeEnergySlotOrder,
  readDashboardPageOrder,
  readDashboardPageSpan,
  CUSTOMIZED_WIDGET_VISIBILITY_STORAGE_KEY,
  resolveEnergyAllVisible,
  resolveEnergyCardColumnSpan,
  resolveEnergyGridColumnTemplate,
  resolveEnergyVisibleSlotOrder,
  resolveOrderedVisibleEnergyCardsPinningCombined,
  resolveShowEnergyStandaloneDurationFilter,
  sortItemsByDashboardOrder,
  writeDashboardPageOrder,
  writeDashboardPageSpan,
  clearDragTranslateKeys,
  ADVANCED_DASHBOARD_ORDER_STORAGE_KEY,
  BASIC_DASHBOARD_ORDER_STORAGE_KEY,
  DASHBOARD_ORDER_STORAGE_KEY,
  pinWidgetFirstInOrder,
  ENERGY_COMBINED_WIDGET_KEY,
} from '../dashboardLayoutResolvers';
import {
  createVisibilityOrderSignature,
  hasVisibilityOrderSignatureChanged,
} from '../visibilityMemoCompare';
import {
  applyVariantDashboardOrderBlob,
  isPlainSpanMap,
  normalizeSpanMap,
  persistAdvancedLayoutAndBuildApiPayload,
  persistBasicEnergySpanAndBuildApiPayload,
  persistCustomizedLayoutAndBuildApiPayload,
} from '../dashboardLayoutApiSync';
import {
  hydrateCustomizedVisibilityFromApiItems,
  parseCustomizedWidgetVisibilityRoot,
} from '../../../../variants/customized/utils/customizedOverviewWidgetVisibility';
import { dispatchFetchWidgetConfigurationOnce } from '../../../utils/bootstrapFetchGuards';

export function useBasicDashboardVisibility({
  visibilityMap,
  isWidgetVisible,
  energyReflowLocked = false,
  dispatch,
  saveDashboardChartOrder,
  dashboardChartOrder,
  dashboardChartOrderStatus,
  widgetList,
  dragTranslateKeys = [],
}) {
  const [energyChartOrder, setEnergyChartOrder] = useState(() => loadEnergyChartOrderFromStorage());
  const [energyCardSpan, setEnergyCardSpan] = useState({});
  const appliedEnergyOrderFromApiRef = useRef(false);
  const lastAppliedEnergyApiOrderSigRef = useRef('');
  const prevEnergyVisibleSigRef = useRef('');
  const prevEnergyCombinedVisibleRef = useRef(null);

  useEffect(() => {
    setEnergyCardSpan(readDashboardPageSpan('energy', BASIC_DASHBOARD_ORDER_STORAGE_KEY));
  }, []);

  const getEnergySlotSpan = useCallback(
    (slotId) => {
      if (slotId === 'consumption_saving') return 12;
      const raw = energyCardSpan?.[slotId];
      return raw === 12 || raw === '12' ? 12 : 6;
    },
    [energyCardSpan]
  );

  const writeEnergyCardSpan = useCallback((nextSpan) => {
    const normalized = normalizeSpanMap(nextSpan);
    setEnergyCardSpan(normalized);
    writeDashboardPageSpan('energy', normalized, BASIC_DASHBOARD_ORDER_STORAGE_KEY);
    if (!energyReflowLocked && dispatch && saveDashboardChartOrder) {
      dispatch(
        saveDashboardChartOrder(persistBasicEnergySpanAndBuildApiPayload(normalized))
      );
    }
  }, [energyReflowLocked, dispatch, saveDashboardChartOrder]);

  // Prefer shared API spans so Admin/Operator match Superadmin resize.
  useEffect(() => {
    if (dashboardChartOrderStatus !== 'succeeded') return;
    const apiSpan = dashboardChartOrder?.energy_slot_span;
    if (!isPlainSpanMap(apiSpan) || Object.keys(apiSpan).length === 0) return;
    const normalized = normalizeSpanMap(apiSpan);
    setEnergyCardSpan(normalized);
    writeDashboardPageSpan('energy', normalized, BASIC_DASHBOARD_ORDER_STORAGE_KEY);
  }, [dashboardChartOrder, dashboardChartOrderStatus]);

  const energyAllVisible = useMemo(
    () => resolveEnergyAllVisible(visibilityMap),
    [visibilityMap]
  );

  const energyVisibleSlotOrder = useMemo(() => {
    const canonicalVisible = resolveEnergyVisibleSlotOrder(visibilityMap);
    return mergeVisibleDashboardOrder(energyChartOrder, canonicalVisible);
  }, [visibilityMap, energyChartOrder]);

  const energyHiddenSlotIds = useMemo(() => {
    const visibleSet = new Set(energyVisibleSlotOrder);
    return energyChartOrder.filter((id) => !visibleSet.has(id));
  }, [energyChartOrder, energyVisibleSlotOrder]);

  const showEnergyStandaloneDurationFilter = useMemo(
    () => resolveShowEnergyStandaloneDurationFilter(visibilityMap, energyVisibleSlotOrder),
    [visibilityMap, energyVisibleSlotOrder]
  );

  const energyDashboardRows = useMemo(
    () => buildDashboardRowsWithSpan(energyVisibleSlotOrder, getEnergySlotSpan),
    [energyVisibleSlotOrder, getEnergySlotSpan]
  );

  useEffect(() => {
    const sig = createVisibilityOrderSignature(energyVisibleSlotOrder);
    if (hasVisibilityOrderSignatureChanged(prevEnergyVisibleSigRef.current, energyVisibleSlotOrder)) {
      clearDragTranslateKeys(dragTranslateKeys);
    }
    prevEnergyVisibleSigRef.current = sig;
  }, [energyVisibleSlotOrder, dragTranslateKeys]);

  useEffect(() => {
    const combinedOn = isWidgetVisible('consumption_saving');
    const combinedVisibilityChanged =
      prevEnergyCombinedVisibleRef.current !== null &&
      prevEnergyCombinedVisibleRef.current !== combinedOn;
    prevEnergyCombinedVisibleRef.current = combinedOn;

    setEnergyChartOrder((prev) => {
      const next = applyEnergyChartOrderForVisibility(prev, visibilityMap);
      if (JSON.stringify(next) === JSON.stringify(prev)) return prev;
      if (combinedVisibilityChanged) {
        clearDragTranslateKeys(dragTranslateKeys);
      }
      try {
        localStorage.setItem(ENERGY_CHART_ORDER_STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      if (!energyReflowLocked && dispatch && saveDashboardChartOrder) {
        dispatch(saveDashboardChartOrder({ energy_slot_order: next }));
      }
      return next;
    });
  }, [
    visibilityMap,
    isWidgetVisible,
    energyReflowLocked,
    dispatch,
    saveDashboardChartOrder,
    dragTranslateKeys,
  ]);

  useEffect(() => {
    if (dashboardChartOrderStatus !== 'succeeded') return;
    const raw = dashboardChartOrder?.energy_slot_order;
    if (!Array.isArray(raw) || raw.length === 0) return;
    const apiSig = JSON.stringify(raw);
    // Same API order + object churn (e.g. save fulfilled) must not wipe a local rearrange.
    if (
      appliedEnergyOrderFromApiRef.current &&
      lastAppliedEnergyApiOrderSigRef.current === apiSig
    ) {
      return;
    }
    const merged = normalizeEnergySlotOrder(raw);
    if (isCanonicalDefaultEnergyOrder(merged) && hasStoredEnergyChartOrder()) {
      try {
        const localMerged = loadEnergyChartOrderFromStorage();
        if (!isCanonicalDefaultEnergyOrder(localMerged)) {
          return;
        }
      } catch {
        /* apply merged below */
      }
    }
    const ordered = applyEnergyChartOrderForVisibility(merged, visibilityMap);
    setEnergyChartOrder(ordered);
    try {
      localStorage.setItem(ENERGY_CHART_ORDER_STORAGE_KEY, JSON.stringify(ordered));
    } catch {
      /* ignore */
    }
    lastAppliedEnergyApiOrderSigRef.current = apiSig;
    appliedEnergyOrderFromApiRef.current = true;
  }, [dashboardChartOrder, dashboardChartOrderStatus, visibilityMap]);

  useEffect(() => {
    if (dashboardChartOrderStatus !== 'succeeded') return;
    const raw = dashboardChartOrder?.energy_slot_order;
    if (Array.isArray(raw) && raw.length > 0) return;
    if (!hasStoredEnergyChartOrder()) return;
    const ordered = applyEnergyChartOrderForVisibility(
      loadEnergyChartOrderFromStorage(),
      visibilityMap
    );
    setEnergyChartOrder(ordered);
    appliedEnergyOrderFromApiRef.current = true;
  }, [dashboardChartOrder, dashboardChartOrderStatus, visibilityMap]);

  useEffect(() => {
    if (dashboardChartOrderStatus !== 'succeeded') return;
    if (appliedEnergyOrderFromApiRef.current) return;
    if (hasStoredEnergyChartOrder()) {
      appliedEnergyOrderFromApiRef.current = true;
      return;
    }
    const titles = widgetList?.titles;
    if (!Array.isArray(titles) || titles.length === 0) return;
    setEnergyChartOrder(deriveEnergyChartOrderFromWidgetTitles(widgetList));
    appliedEnergyOrderFromApiRef.current = true;
  }, [widgetList, dashboardChartOrderStatus]);

  const shouldRenderWidget = useCallback(
    (widgetKey) => resolveEnergyWidgetVisible(widgetKey, { variant: 'basic', visibilityMap }),
    [visibilityMap]
  );

  return {
    isWidgetVisible,
    visibilityMap,
    shouldRenderWidget,
    energyChartOrder,
    setEnergyChartOrder,
    energyVisibleSlotOrder,
    energyHiddenSlotIds,
    showEnergyStandaloneDurationFilter,
    energyAllVisible,
    energyDashboardRows,
    energyCardSpan,
    setEnergyCardSpan,
    getEnergySlotSpan,
    writeEnergyCardSpan,
  };
}

export function useAdvancedDashboardVisibility({
  showOverviewTab = true,
  variant = 'advanced',
  widgetConfiguration = [],
  widgetConfigurationStatus = 'idle',
  dispatch,
  saveDashboardChartOrder,
  layoutLocked = false,
} = {}) {
  const uiVariant = variant || 'advanced';

  const [visibilityMap, setVisibilityMap] = useState(() =>
    normalizeVisibilityMapCombinedExclusion(readDashboardWidgetVisibility(uiVariant))
  );
  const visibilityMapRef = useRef(visibilityMap);
  visibilityMapRef.current = visibilityMap;
  const hydratedStatusRef = useRef(false);

  // Hydrate once from Advanced localStorage when fetch settles — do not re-run on
  // every widgetConfiguration reference change (that snapped toggles back to Combined).
  useEffect(() => {
    if (widgetConfigurationStatus !== 'succeeded') return;
    if (hydratedStatusRef.current) return;
    hydratedStatusRef.current = true;

    const resolved = normalizeVisibilityMapCombinedExclusion(
      resolveVisibilityMap(widgetConfiguration, widgetConfigurationStatus, uiVariant)
    );
    setVisibilityMap(resolved);
    visibilityMapRef.current = resolved;
    const raw = readDashboardWidgetVisibilityRaw(uiVariant);
    if (raw != null && raw !== '') {
      writeDashboardWidgetVisibility(resolved, uiVariant);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once on succeeded
  }, [widgetConfigurationStatus, uiVariant]);

  useEffect(() => {
    const sync = () => {
      const next = normalizeVisibilityMapCombinedExclusion(
        readDashboardWidgetVisibility(uiVariant)
      );
      visibilityMapRef.current = next;
      setVisibilityMap(next);
    };
    window.addEventListener('storage', sync);
    window.addEventListener(DASHBOARD_WIDGET_VISIBILITY_EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(DASHBOARD_WIDGET_VISIBILITY_EVENT, sync);
    };
  }, [uiVariant]);

  const isWidgetVisible = useCallback(
    (key) =>
      isWidgetVisibleInMapWithCombinedExclusion(
        visibilityMap,
        normalizeDashboardWidgetKey(key)
      ),
    [visibilityMap]
  );

  const setWidgetVisible = useCallback(
    (key, visible) => {
      const k = normalizeDashboardWidgetKey(key);
      if (!k) return;
      const prev = visibilityMapRef.current;
      const base =
        prev && typeof prev === 'object' && Object.keys(prev).length > 0
          ? prev
          : normalizeVisibilityMapCombinedExclusion(
              readDashboardWidgetVisibility(uiVariant)
            );
      const next = normalizeVisibilityMapCombinedExclusion(
        applyVisibilityToggleToMapWithCombinedExclusion(base, k, visible)
      );
      writeDashboardWidgetVisibility(next, uiVariant);
      visibilityMapRef.current = next;
      setVisibilityMap(next);
      window.dispatchEvent(new CustomEvent(DASHBOARD_WIDGET_VISIBILITY_EVENT));
      // Advanced stays localStorage-only — do not POST shared API (would affect Basic).
    },
    [uiVariant]
  );

  const shouldRenderWidget = useCallback(
    (widgetKey) => resolveEnergyWidgetVisible(widgetKey, { variant: uiVariant, visibilityMap }),
    [uiVariant, visibilityMap]
  );
  const shouldShowEnergyWidget = shouldRenderWidget;

  const [energyCardOrder, setEnergyCardOrder] = useState([]);
  const [energyCardSpan, setEnergyCardSpan] = useState({});

  useEffect(() => {
    setEnergyCardOrder(readDashboardPageOrder('energy', ADVANCED_DASHBOARD_ORDER_STORAGE_KEY));
    setEnergyCardSpan(readDashboardPageSpan('energy', ADVANCED_DASHBOARD_ORDER_STORAGE_KEY));
  }, []);

  const getEnergyCardCol = useCallback(
    (key, visibleCount) => {
      if (key === 'consumption_saving') return 12;
      return resolveEnergyCardColumnSpan(key, energyCardSpan, visibleCount);
    },
    [energyCardSpan]
  );

  const resolveEnergyCardLayout = useCallback(
    (cards) => resolveOrderedVisibleEnergyCardsPinningCombined(cards, energyCardOrder),
    [energyCardOrder]
  );

  const writeEnergyCardOrder = useCallback(
    (nextOrder) => {
      const pinned = pinWidgetFirstInOrder(
        Array.isArray(nextOrder) ? nextOrder : [],
        ENERGY_COMBINED_WIDGET_KEY
      );
      // Only pin when Combined is actually in the order (visible / being arranged).
      const order =
        Array.isArray(nextOrder) && nextOrder.includes(ENERGY_COMBINED_WIDGET_KEY)
          ? pinned
          : Array.isArray(nextOrder)
            ? nextOrder
            : [];
      setEnergyCardOrder(order);
      writeDashboardPageOrder('energy', order, ADVANCED_DASHBOARD_ORDER_STORAGE_KEY);
      if (!layoutLocked && dispatch && saveDashboardChartOrder) {
        dispatch(
          saveDashboardChartOrder(
            persistAdvancedLayoutAndBuildApiPayload({ energy: order })
          )
        );
      }
    },
    [layoutLocked, dispatch, saveDashboardChartOrder]
  );

  const writeEnergyCardSpan = useCallback(
    (nextSpan) => {
      const normalized = normalizeSpanMap(nextSpan);
      setEnergyCardSpan(normalized);
      writeDashboardPageSpan('energy', normalized, ADVANCED_DASHBOARD_ORDER_STORAGE_KEY);
      if (!layoutLocked && dispatch && saveDashboardChartOrder) {
        dispatch(
          saveDashboardChartOrder(
            persistAdvancedLayoutAndBuildApiPayload({ energySpan: normalized })
          )
        );
      }
    },
    [layoutLocked, dispatch, saveDashboardChartOrder]
  );

  /** Apply shared Advanced layout blob from GET /widgets/dashboard_chart_order. */
  const hydrateEnergyLayoutFromApi = useCallback((blob) => {
    const applied = applyVariantDashboardOrderBlob(ADVANCED_DASHBOARD_ORDER_STORAGE_KEY, blob);
    if (!applied) return;
    if (Array.isArray(applied.energy)) {
      const energy = applied.energy.includes(ENERGY_COMBINED_WIDGET_KEY)
        ? pinWidgetFirstInOrder(applied.energy, ENERGY_COMBINED_WIDGET_KEY)
        : applied.energy;
      setEnergyCardOrder(energy);
      writeDashboardPageOrder('energy', energy, ADVANCED_DASHBOARD_ORDER_STORAGE_KEY);
    }
    if (isPlainSpanMap(applied.energySpan)) setEnergyCardSpan(applied.energySpan);
  }, []);

  // When Energy Combined is enabled, pin it first (Basic parity).
  useEffect(() => {
    const combinedOn = shouldRenderWidget(ENERGY_COMBINED_WIDGET_KEY);
    if (!combinedOn) return;
    setEnergyCardOrder((prev) => {
      const base = Array.isArray(prev) ? prev : [];
      const withCombined = base.includes(ENERGY_COMBINED_WIDGET_KEY)
        ? base
        : [...base, ENERGY_COMBINED_WIDGET_KEY];
      const next = pinWidgetFirstInOrder(withCombined, ENERGY_COMBINED_WIDGET_KEY);
      if (JSON.stringify(next) === JSON.stringify(prev)) return prev;
      writeDashboardPageOrder('energy', next, ADVANCED_DASHBOARD_ORDER_STORAGE_KEY);
      if (!layoutLocked && dispatch && saveDashboardChartOrder) {
        dispatch(
          saveDashboardChartOrder(persistAdvancedLayoutAndBuildApiPayload({ energy: next }))
        );
      }
      return next;
    });
  }, [visibilityMap, shouldRenderWidget, layoutLocked, dispatch, saveDashboardChartOrder]);

  const energyGridColumnTemplate = useCallback(
    (visibleCount) => resolveEnergyGridColumnTemplate(visibleCount),
    []
  );

  return {
    isWidgetVisible,
    setWidgetVisible,
    visibilityMap,
    shouldRenderWidget,
    shouldShowEnergyWidget,
    showOverviewTab,
    energyCardOrder,
    setEnergyCardOrder,
    energyCardSpan,
    setEnergyCardSpan,
    getEnergyCardCol,
    resolveEnergyCardLayout,
    writeEnergyCardOrder,
    writeEnergyCardSpan,
    hydrateEnergyLayoutFromApi,
    energyGridColumnTemplate,
  };
}

export function useCustomizedDashboardVisibility({
  locationPathname,
  getEffectiveBuiltinDashboardPage,
  dispatch,
  fetchRenameWidgets,
  fetchCustomGraphs,
  fetchWidgetConfiguration,
  widgetConfiguration = [],
  widgetConfigurationStatus = 'idle',
  saveDashboardChartOrder,
  layoutLocked = false,
}) {
  const [widgetVisibility, setWidgetVisibility] = useState(() =>
    parseCustomizedWidgetVisibilityRoot()
  );
  const [energyCardOrder, setEnergyCardOrder] = useState([]);
  const [energyCardSpan, setEnergyCardSpan] = useState({});

  useEffect(() => {
    setWidgetVisibility(parseCustomizedWidgetVisibilityRoot());
  }, [locationPathname]);

  useEffect(() => {
    if (widgetConfigurationStatus === 'idle' && dispatch && fetchWidgetConfiguration) {
      dispatchFetchWidgetConfigurationOnce(dispatch, fetchWidgetConfiguration);
    }
  }, [dispatch, fetchWidgetConfiguration, widgetConfigurationStatus]);

  useEffect(() => {
    if (widgetConfigurationStatus !== 'succeeded') return;
    const filtered = filterWidgetConfigurationByUiVariant(
      widgetConfiguration,
      'customized'
    );
    if (!hasBackendWidgetConfiguration(filtered)) return;
    const root = hydrateCustomizedVisibilityFromApiItems(filtered);
    if (root) setWidgetVisibility(root);
    const flat = normalizeVisibilityMapCombinedExclusion(
      widgetConfigurationItemsToVisibilityMap(filtered, 'customized')
    );
    writeDashboardWidgetVisibility(flat, 'customized');
    window.dispatchEvent(new CustomEvent('widgetVisibilityUpdated'));
    window.dispatchEvent(new CustomEvent(DASHBOARD_WIDGET_VISIBILITY_EVENT));
  }, [widgetConfiguration, widgetConfigurationStatus]);

  useEffect(() => {
    const refreshFromStorage = () => {
      setWidgetVisibility(parseCustomizedWidgetVisibilityRoot());
    };

    const onCustomEvent = () => refreshFromStorage();
    const onStorage = (event) => {
      if (
        !event ||
        event.key === 'widgetVisibility' ||
        event.key === CUSTOMIZED_WIDGET_VISIBILITY_STORAGE_KEY ||
        event.key === 'widgetVisibility_customized'
      ) {
        refreshFromStorage();
      }
    };

    const onWidgetTitlesUpdated = () => {
      if (dispatch && fetchRenameWidgets) dispatch(fetchRenameWidgets());
    };
    const onCustomGraphsUpdated = () => {
      if (dispatch && fetchCustomGraphs) dispatch(fetchCustomGraphs());
    };

    window.addEventListener('widgetVisibilityUpdated', onCustomEvent);
    window.addEventListener(DASHBOARD_WIDGET_VISIBILITY_EVENT, onCustomEvent);
    window.addEventListener('widgetTitlesUpdated', onWidgetTitlesUpdated);
    window.addEventListener('customGraphsUpdated', onCustomGraphsUpdated);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('widgetVisibilityUpdated', onCustomEvent);
      window.removeEventListener(DASHBOARD_WIDGET_VISIBILITY_EVENT, onCustomEvent);
      window.removeEventListener('widgetTitlesUpdated', onWidgetTitlesUpdated);
      window.removeEventListener('customGraphsUpdated', onCustomGraphsUpdated);
      window.removeEventListener('storage', onStorage);
    };
  }, [dispatch, fetchRenameWidgets, fetchCustomGraphs]);

  useEffect(() => {
    setEnergyCardOrder(readDashboardPageOrder('energy'));
    setEnergyCardSpan(readDashboardPageSpan('energy'));
  }, []);

  const flatVisibilityMap = useMemo(() => {
    if (widgetConfigurationStatus === 'succeeded') {
      const filtered = filterWidgetConfigurationByUiVariant(
        widgetConfiguration,
        'customized'
      );
      if (hasBackendWidgetConfiguration(filtered)) {
        return normalizeVisibilityMapCombinedExclusion(
          widgetConfigurationItemsToVisibilityMap(filtered, 'customized')
        );
      }
    }
    return normalizeVisibilityMapCombinedExclusion(
      readDashboardWidgetVisibility('customized')
    );
  }, [widgetConfiguration, widgetConfigurationStatus]);

  const shouldRenderWidget = useCallback(
    (widgetKey) => {
      const getPage = getEffectiveBuiltinDashboardPage || (() => 'energy');
      const keysToCheckPage = resolveEnergyWidgetVisibilityKeys(widgetKey);
      if (keysToCheckPage.some((key) => getPage(key) === 'space')) {
        return false;
      }
      if (String(widgetKey).startsWith('custom_graph:')) {
        return resolveCustomizedEnergyWidgetVisible(widgetKey, widgetVisibility, getPage);
      }
      return isWidgetVisibleInMapWithCombinedExclusion(flatVisibilityMap, widgetKey);
    },
    [flatVisibilityMap, widgetVisibility, getEffectiveBuiltinDashboardPage]
  );

  const shouldShowEnergyWidget = shouldRenderWidget;

  const isSpaceCombinedVisible = useMemo(
    () =>
      isWidgetVisibleInMapWithCombinedExclusion(
        flatVisibilityMap,
        'instant_utilization_combined'
      ),
    [flatVisibilityMap]
  );

  const getEnergyCardCol = useCallback(
    (key, visibleCount) => {
      if (key === 'consumption_saving') return 12;
      return resolveEnergyCardColumnSpan(key, energyCardSpan, visibleCount);
    },
    [energyCardSpan]
  );

  const resolveEnergyCardLayout = useCallback(
    (cards) => resolveOrderedVisibleEnergyCardsPinningCombined(cards, energyCardOrder),
    [energyCardOrder]
  );

  const writeEnergyCardOrder = useCallback(
    (nextOrder) => {
      const order =
        Array.isArray(nextOrder) && nextOrder.includes(ENERGY_COMBINED_WIDGET_KEY)
          ? pinWidgetFirstInOrder(nextOrder, ENERGY_COMBINED_WIDGET_KEY)
          : Array.isArray(nextOrder)
            ? nextOrder
            : [];
      setEnergyCardOrder(order);
      writeDashboardPageOrder('energy', order);
      if (!layoutLocked && dispatch && saveDashboardChartOrder) {
        dispatch(
          saveDashboardChartOrder(
            persistCustomizedLayoutAndBuildApiPayload({ energy: order })
          )
        );
      }
    },
    [layoutLocked, dispatch, saveDashboardChartOrder]
  );

  const writeEnergyCardSpan = useCallback(
    (nextSpan) => {
      const normalized = normalizeSpanMap(nextSpan);
      setEnergyCardSpan(normalized);
      writeDashboardPageSpan('energy', normalized);
      if (!layoutLocked && dispatch && saveDashboardChartOrder) {
        dispatch(
          saveDashboardChartOrder(
            persistCustomizedLayoutAndBuildApiPayload({ energySpan: normalized })
          )
        );
      }
    },
    [layoutLocked, dispatch, saveDashboardChartOrder]
  );

  /** Apply shared Customized layout blob from GET /widgets/dashboard_chart_order. */
  const hydrateEnergyLayoutFromApi = useCallback((blob) => {
    const applied = applyVariantDashboardOrderBlob(DASHBOARD_ORDER_STORAGE_KEY, blob);
    if (!applied) return;
    if (Array.isArray(applied.energy)) {
      const energy = applied.energy.includes(ENERGY_COMBINED_WIDGET_KEY)
        ? pinWidgetFirstInOrder(applied.energy, ENERGY_COMBINED_WIDGET_KEY)
        : applied.energy;
      setEnergyCardOrder(energy);
      writeDashboardPageOrder('energy', energy);
    }
    if (isPlainSpanMap(applied.energySpan)) setEnergyCardSpan(applied.energySpan);
  }, []);

  // When Energy Combined is enabled, pin it first (Basic parity).
  useEffect(() => {
    const combinedOn = shouldRenderWidget(ENERGY_COMBINED_WIDGET_KEY);
    if (!combinedOn) return;
    setEnergyCardOrder((prev) => {
      const base = Array.isArray(prev) ? prev : [];
      const withCombined = base.includes(ENERGY_COMBINED_WIDGET_KEY)
        ? base
        : [...base, ENERGY_COMBINED_WIDGET_KEY];
      const next = pinWidgetFirstInOrder(withCombined, ENERGY_COMBINED_WIDGET_KEY);
      if (JSON.stringify(next) === JSON.stringify(prev)) return prev;
      writeDashboardPageOrder('energy', next);
      if (!layoutLocked && dispatch && saveDashboardChartOrder) {
        dispatch(
          saveDashboardChartOrder(persistCustomizedLayoutAndBuildApiPayload({ energy: next }))
        );
      }
      return next;
    });
  }, [flatVisibilityMap, shouldRenderWidget, layoutLocked, dispatch, saveDashboardChartOrder]);

  const energyGridColumnTemplate = useCallback(
    (visibleCount) => resolveEnergyGridColumnTemplate(visibleCount),
    []
  );

  return {
    widgetVisibility,
    shouldRenderWidget,
    shouldShowEnergyWidget,
    isSpaceCombinedVisible,
    energyCardOrder,
    setEnergyCardOrder,
    energyCardSpan,
    setEnergyCardSpan,
    getEnergyCardCol,
    resolveEnergyCardLayout,
    writeEnergyCardOrder,
    writeEnergyCardSpan,
    hydrateEnergyLayoutFromApi,
    energyGridColumnTemplate,
    mergeVisibleDashboardOrder,
    sortItemsByDashboardOrder,
  };
}

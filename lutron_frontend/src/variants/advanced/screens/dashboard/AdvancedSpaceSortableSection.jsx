import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import {
  readDashboardPageOrder,
  readDashboardPageSpan,
  writeDashboardPageOrder,
  writeDashboardPageSpan,
  ADVANCED_DASHBOARD_ORDER_STORAGE_KEY,
} from '../../../../shared/dashboard/container/dashboardLayoutResolvers';
import {
  applyVariantDashboardOrderBlob,
  isPlainSpanMap,
  normalizeSpanMap,
  persistAdvancedLayoutAndBuildApiPayload,
} from '../../../../shared/dashboard/container/dashboardLayoutApiSync';
import { SPACE_TAB_IDS } from '../../../../shared/dashboard/space/container/spaceLayoutTypes';
import SortableDashboardItem from '../../components/dashboard/SortableDashboardItem';
import {
  ADVANCED_SPACE_CHARTS_SLOT_KEYS,
  ADVANCED_SPACE_UTILIZATION_SLOT_KEYS,
  ADVANCED_SPACE_SPLIT_LEFT_COLUMN_SX,
  ADVANCED_SPACE_SPLIT_RIGHT_COLUMN_SX,
  ADVANCED_SPACE_SPLIT_SECTION_SX,
  mergeAdvancedVisibleOrder,
  resolveAdvancedSortableGridSx,
  resolveAdvancedSpaceSortableLayout,
} from '../../utils/advancedDashboardLayout';
import {
  pinWidgetFirstInOrder,
  SPACE_COMBINED_WIDGET_KEY,
} from '../../../../shared/dashboard/container/dashboardLayoutResolvers';

function resolveAdvancedSpaceVisibleSlots(showChartsTab, shouldRenderWidget) {
  const base = showChartsTab ? ADVANCED_SPACE_CHARTS_SLOT_KEYS : ADVANCED_SPACE_UTILIZATION_SLOT_KEYS;
  if (typeof shouldRenderWidget !== 'function') return base;
  return base.filter((key) => shouldRenderWidget(key));
}

function resolveAdvancedSpaceDefaultSpan(slotId) {
  if (
    slotId === 'utilization' ||
    slotId === 'instant_occupancy_count' ||
    slotId === 'instant_utilization_combined'
  ) {
    return 2;
  }
  return 1;
}

export function useAdvancedSpaceSortableLayoutState({
  showChartsTab,
  shouldRenderWidget,
  dispatch,
  saveDashboardChartOrder,
  layoutLocked = false,
}) {
  const [spaceCardOrder, setSpaceCardOrder] = useState([]);
  const [spaceCardSpan, setSpaceCardSpan] = useState({});
  const [spaceFullscreenCardId, setSpaceFullscreenCardId] = useState(null);
  const spaceMergedOrderRef = useRef([]);

  useEffect(() => {
    setSpaceCardOrder(readDashboardPageOrder('space', ADVANCED_DASHBOARD_ORDER_STORAGE_KEY));
    setSpaceCardSpan(readDashboardPageSpan('space', ADVANCED_DASHBOARD_ORDER_STORAGE_KEY));
  }, []);

  const hydrateSpaceLayoutFromApi = useCallback((blob) => {
    const applied = applyVariantDashboardOrderBlob(ADVANCED_DASHBOARD_ORDER_STORAGE_KEY, blob);
    if (!applied) return;
    if (Array.isArray(applied.space)) {
      const space = applied.space.includes(SPACE_COMBINED_WIDGET_KEY)
        ? pinWidgetFirstInOrder(applied.space, SPACE_COMBINED_WIDGET_KEY)
        : applied.space;
      setSpaceCardOrder(space);
      writeDashboardPageOrder('space', space, ADVANCED_DASHBOARD_ORDER_STORAGE_KEY);
    }
    if (isPlainSpanMap(applied.spaceSpan)) setSpaceCardSpan(applied.spaceSpan);
  }, []);

  const visibleSlotIds = useMemo(
    () => resolveAdvancedSpaceVisibleSlots(showChartsTab, shouldRenderWidget),
    [showChartsTab, shouldRenderWidget]
  );

  const spaceMergedOrder = useMemo(() => {
    const merged = mergeAdvancedVisibleOrder(spaceCardOrder, visibleSlotIds);
    return visibleSlotIds.includes(SPACE_COMBINED_WIDGET_KEY)
      ? pinWidgetFirstInOrder(merged, SPACE_COMBINED_WIDGET_KEY)
      : merged;
  }, [spaceCardOrder, visibleSlotIds]);

  useEffect(() => {
    spaceMergedOrderRef.current = spaceMergedOrder;
  }, [spaceMergedOrder]);

  const getSpaceCardSpan = useCallback(
    (id) => {
      const raw = spaceCardSpan?.[id];
      if (raw === 2 || raw === '2') return 2;
      if (raw === 1 || raw === '1') return 1;
      return resolveAdvancedSpaceDefaultSpan(id);
    },
    [spaceCardSpan]
  );

  const writeSpaceCardOrder = useCallback(
    (nextOrder) => {
      const order =
        Array.isArray(nextOrder) && nextOrder.includes(SPACE_COMBINED_WIDGET_KEY)
          ? pinWidgetFirstInOrder(nextOrder, SPACE_COMBINED_WIDGET_KEY)
          : Array.isArray(nextOrder)
            ? nextOrder
            : [];
      setSpaceCardOrder(order);
      writeDashboardPageOrder('space', order, ADVANCED_DASHBOARD_ORDER_STORAGE_KEY);
      if (!layoutLocked && dispatch && saveDashboardChartOrder) {
        dispatch(
          saveDashboardChartOrder(
            persistAdvancedLayoutAndBuildApiPayload({ space: order })
          )
        );
      }
    },
    [layoutLocked, dispatch, saveDashboardChartOrder]
  );

  // When Space Combined is enabled, persist it first (Basic Energy parity).
  useEffect(() => {
    if (!visibleSlotIds.includes(SPACE_COMBINED_WIDGET_KEY)) return;
    setSpaceCardOrder((prev) => {
      const base = Array.isArray(prev) ? prev : [];
      const withCombined = base.includes(SPACE_COMBINED_WIDGET_KEY)
        ? base
        : [...base, SPACE_COMBINED_WIDGET_KEY];
      const next = pinWidgetFirstInOrder(withCombined, SPACE_COMBINED_WIDGET_KEY);
      if (JSON.stringify(next) === JSON.stringify(prev)) return prev;
      writeDashboardPageOrder('space', next, ADVANCED_DASHBOARD_ORDER_STORAGE_KEY);
      if (!layoutLocked && dispatch && saveDashboardChartOrder) {
        dispatch(
          saveDashboardChartOrder(persistAdvancedLayoutAndBuildApiPayload({ space: next }))
        );
      }
      return next;
    });
  }, [visibleSlotIds, layoutLocked, dispatch, saveDashboardChartOrder]);

  const toggleSpaceCardSpan = useCallback(
    (id) => {
      if (layoutLocked) return;
      setSpaceCardSpan((prev) => {
        const next = { ...(prev && typeof prev === 'object' && !Array.isArray(prev) ? prev : {}) };
        const cur = next?.[id];
        const curSpan = cur === 2 || cur === '2' ? 2 : 1;
        next[id] = curSpan === 2 ? 1 : 2;
        const normalized = normalizeSpanMap(next);
        writeDashboardPageSpan('space', normalized, ADVANCED_DASHBOARD_ORDER_STORAGE_KEY);
        if (dispatch && saveDashboardChartOrder) {
          dispatch(
            saveDashboardChartOrder(
              persistAdvancedLayoutAndBuildApiPayload({ spaceSpan: normalized })
            )
          );
        }
        return normalized;
      });
    },
    [layoutLocked, dispatch, saveDashboardChartOrder]
  );

  const toggleSpaceFullscreen = useCallback((id) => {
    setSpaceFullscreenCardId((prev) => (String(prev) === String(id) ? null : String(id)));
  }, []);

  useEffect(() => {
    if (!spaceFullscreenCardId) return undefined;
    const onKeyDown = (e) => {
      if (e?.key === 'Escape') setSpaceFullscreenCardId(null);
    };
    window.addEventListener('keydown', onKeyDown);
    const prevOverflow = document?.body?.style?.overflow;
    if (document?.body?.style) document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      if (document?.body?.style) document.body.style.overflow = prevOverflow || '';
    };
  }, [spaceFullscreenCardId]);

  const spaceGridCols = visibleSlotIds.length === 1 ? '1fr' : '1fr 1fr';

  return {
    spaceMergedOrder,
    spaceMergedOrderRef,
    spaceFullscreenCardId,
    getSpaceCardSpan,
    toggleSpaceCardSpan,
    toggleSpaceFullscreen,
    setSpaceCardOrder,
    writeSpaceCardOrder,
    hydrateSpaceLayoutFromApi,
    spaceGridCols,
  };
}

export function AdvancedSpaceSortableSection({
  activeTab,
  showChartsTab,
  sensors,
  renderSlot,
  layoutState,
  /** When true (Admin/Operator), block rearrange + width resize. Superadmin only. */
  layoutLocked = false,
  orderStorageKey = ADVANCED_DASHBOARD_ORDER_STORAGE_KEY,
}) {
  const {
    spaceMergedOrder,
    spaceMergedOrderRef,
    spaceFullscreenCardId,
    getSpaceCardSpan,
    toggleSpaceCardSpan,
    toggleSpaceFullscreen,
    setSpaceCardOrder,
    writeSpaceCardOrder,
    spaceGridCols,
  } = layoutState;

  const tabId = activeTab || (showChartsTab ? SPACE_TAB_IDS.CHARTS : SPACE_TAB_IDS.UTILIZATION);
  const selectorMode = tabId === SPACE_TAB_IDS.CHARTS ? 'active' : 'main';

  const layout = useMemo(
    () => resolveAdvancedSpaceSortableLayout(spaceMergedOrder, getSpaceCardSpan),
    [spaceMergedOrder, getSpaceCardSpan]
  );

  const renderSortableSlot = (slotId) => {
    const isFullscreen = String(spaceFullscreenCardId || '') === String(slotId);
    return (
      <SortableDashboardItem
        key={slotId}
        id={slotId}
        disabled={layoutLocked}
        spanMode="space"
        span={getSpaceCardSpan(slotId)}
        showSpanToggle={!layoutLocked}
        onToggleSpan={layoutLocked ? undefined : toggleSpaceCardSpan}
        showHeightToggle={!layoutLocked}
        isFullscreen={isFullscreen}
      onToggleFullscreen={layoutLocked ? undefined : toggleSpaceFullscreen}
      rowSpan={1}
    >
      <Box
        sx={{
          width: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
          ...(isFullscreen
            ? {
                height: '100%',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
              }
            : {}),
        }}
      >
        {renderSlot(slotId, { selectorMode })}
      </Box>
    </SortableDashboardItem>
  );
};

  const gridHalfCols =
    layout.gridHalfIds.length === 1 ? '1fr' : spaceGridCols;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: { xs: 2, sm: 2.5, md: 3 },
        p: { xs: 1, sm: 1.5, md: 2 },
        width: '100%',
        mb: 2,
      }}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={(event) => {
          if (layoutLocked) return;
          const activeId = String(event?.active?.id ?? '');
          const overId = String(event?.over?.id ?? '');
          if (!activeId || !overId || activeId === overId) return;
          const current = Array.isArray(spaceMergedOrderRef.current) ? spaceMergedOrderRef.current : [];
          const oldIndex = current.indexOf(activeId);
          const newIndex = current.indexOf(overId);
          if (oldIndex < 0 || newIndex < 0) return;
          const next = arrayMove(current, oldIndex, newIndex);
          if (typeof writeSpaceCardOrder === 'function') {
            writeSpaceCardOrder(next);
          } else {
            setSpaceCardOrder(next);
            writeDashboardPageOrder('space', next, orderStorageKey);
          }
        }}
      >
        <SortableContext items={spaceMergedOrder} strategy={rectSortingStrategy}>
          {layout.fullWidthIds.length > 0 ? (
            <Box sx={resolveAdvancedSortableGridSx('1fr', { alignItems: 'start', includePadding: false })}>
              {layout.fullWidthIds.map(renderSortableSlot)}
            </Box>
          ) : null}

          {layout.useSplit ? (
            <Box sx={ADVANCED_SPACE_SPLIT_SECTION_SX}>
              <Box sx={ADVANCED_SPACE_SPLIT_LEFT_COLUMN_SX}>
                {layout.splitLeftIds.map(renderSortableSlot)}
              </Box>
              <Box sx={ADVANCED_SPACE_SPLIT_RIGHT_COLUMN_SX}>
                {layout.splitRightId ? renderSortableSlot(layout.splitRightId) : null}
              </Box>
            </Box>
          ) : null}

          {layout.gridHalfIds.length > 0 ? (
            <Box sx={resolveAdvancedSortableGridSx(gridHalfCols, { alignItems: 'start', includePadding: false })}>
              {layout.gridHalfIds.map(renderSortableSlot)}
            </Box>
          ) : null}
        </SortableContext>
      </DndContext>
    </Box>
  );
}

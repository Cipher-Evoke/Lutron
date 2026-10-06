import { SPACE_TAB_IDS, SPACE_LAYOUT_MODES, SPACE_SLOT_KINDS } from './spaceLayoutTypes';
import {
  ADVANCED_SPACE_CHARTS_SECTIONS,
  ADVANCED_SPACE_UTILIZATION_SECTIONS,
} from './spaceLayoutAdapters';

const FULL_WIDTH_CHARTS_SLOTS = new Set([
  'instant_occupancy_count',
  'instant_utilization_combined',
]);

/**
 * Charts tab rows: full-width instant/combined; other slots pair two per row.
 */
export function buildSpaceChartsDashboardRows(visibleIds = []) {
  const rows = [];
  let i = 0;
  while (i < visibleIds.length) {
    const id = visibleIds[i];
    if (FULL_WIDTH_CHARTS_SLOTS.has(id)) {
      rows.push([id]);
      i += 1;
      continue;
    }
    const next = visibleIds[i + 1];
    if (next != null && FULL_WIDTH_CHARTS_SLOTS.has(next)) {
      rows.push([id]);
      i += 1;
      continue;
    }
    if (next != null) {
      rows.push([id, next]);
      i += 2;
    } else {
      rows.push([id]);
      i += 1;
    }
  }
  return rows;
}

export function resolveSpaceActiveTab({ showChartsTab = false } = {}) {
  return showChartsTab ? SPACE_TAB_IDS.CHARTS : SPACE_TAB_IDS.UTILIZATION;
}

export function resolveSpaceTabLayout(activeTab, layoutContext = {}, adapter = {}) {
  const tabId = activeTab || resolveSpaceActiveTab(layoutContext);
  const visibility = resolveSpaceLayoutVisibility(layoutContext, adapter);

  if (!visibility.visible) {
    return { tabId, visible: false, showEmptyState: false };
  }

  const selectorMode = tabId === SPACE_TAB_IDS.CHARTS ? 'active' : 'main';
  const layoutMode = adapter.layoutMode || SPACE_LAYOUT_MODES.DYNAMIC_ROWS;

  let sections = [];
  if (layoutMode === SPACE_LAYOUT_MODES.FIXED_SECTIONS) {
    sections =
      tabId === SPACE_TAB_IDS.CHARTS
        ? adapter.CHARTS_SECTIONS || ADVANCED_SPACE_CHARTS_SECTIONS
        : adapter.UTILIZATION_SECTIONS || ADVANCED_SPACE_UTILIZATION_SECTIONS;
  }

  const rows =
    layoutMode === SPACE_LAYOUT_MODES.DYNAMIC_ROWS
      ? resolveSpaceSectionLayout(tabId, layoutContext, adapter)
      : [];

  return {
    tabId,
    visible: true,
    showEmptyState: visibility.showEmptyState,
    emptyStateKey: visibility.emptyStateKey,
    selectorMode,
    layoutMode,
    sections,
    rows,
    showTabChrome: Boolean(layoutContext.showTabChrome),
  };
}

export function resolveSpaceSectionLayout(activeTab, layoutContext = {}, adapter = {}) {
  const order = resolveSpaceWidgetOrder(layoutContext, adapter, activeTab);
  const layoutMode = adapter.layoutMode || SPACE_LAYOUT_MODES.DYNAMIC_ROWS;

  if (layoutMode === SPACE_LAYOUT_MODES.DYNAMIC_ROWS) {
    const buildRowsFn =
      layoutContext.buildRows || adapter.buildRows || buildSpaceChartsDashboardRows;
    return buildRowsFn(order, layoutContext);
  }

  if (layoutMode === SPACE_LAYOUT_MODES.FIXED_SECTIONS) {
    return activeTab === SPACE_TAB_IDS.CHARTS
      ? adapter.CHARTS_SECTIONS || ADVANCED_SPACE_CHARTS_SECTIONS
      : adapter.UTILIZATION_SECTIONS || ADVANCED_SPACE_UTILIZATION_SECTIONS;
  }

  return [];
}

export function resolveSpaceWidgetOrder(layoutContext = {}, adapter = {}, activeTab) {
  if (Array.isArray(layoutContext.visibleSlotOrder)) {
    return layoutContext.visibleSlotOrder;
  }

  const tabId = activeTab || resolveSpaceActiveTab(layoutContext);

  if (adapter.layoutMode === SPACE_LAYOUT_MODES.SORTABLE_GRID) {
    if (tabId === SPACE_TAB_IDS.CHARTS && Array.isArray(layoutContext.mergedSlotOrder)) {
      return layoutContext.mergedSlotOrder;
    }
    if (tabId === SPACE_TAB_IDS.UTILIZATION) {
      return (adapter.UTILIZATION_BUILTIN_SLOTS || []).filter((slotId) => {
        if (typeof layoutContext.shouldShowWidget === 'function') {
          return layoutContext.shouldShowWidget(slotId);
        }
        return true;
      });
    }
  }

  return [];
}

export function resolveSpaceLayoutVisibility(layoutContext = {}, adapter = {}) {
  const {
    showChartsTab = false,
    showOnlyInstantChart = false,
    visibleSlotOrder = [],
  } = layoutContext;

  if (adapter?.layoutMode === SPACE_LAYOUT_MODES.FIXED_SECTIONS) {
    return { visible: true, showEmptyState: false };
  }

  if (adapter?.layoutMode === SPACE_LAYOUT_MODES.SORTABLE_GRID) {
    return { visible: true, showEmptyState: false };
  }

  if (showChartsTab) {
    return {
      visible: true,
      showEmptyState: visibleSlotOrder.length === 0,
      emptyStateKey: 'charts',
    };
  }

  if (showOnlyInstantChart) {
    return { visible: false, showEmptyState: false };
  }

  return {
    visible: true,
    showEmptyState: visibleSlotOrder.length === 0,
    emptyStateKey: 'utilization',
  };
}

export function resolveSpaceSlotMeta(slotId, adapter = {}) {
  const registry = adapter.SLOT_REGISTRY || adapter.slotRegistry || {};
  return registry[slotId] || null;
}

export function isSpaceCustomSlot(slotId, adapter = {}) {
  const meta = resolveSpaceSlotMeta(slotId, adapter);
  return meta?.kind === SPACE_SLOT_KINDS.CUSTOM;
}

export function isSpaceLayoutTabSupported(activeTab) {
  return activeTab === SPACE_TAB_IDS.CHARTS || activeTab === SPACE_TAB_IDS.UTILIZATION;
}

export function buildSpaceLayoutContext({
  variant = 'basic',
  showChartsTab = false,
  showOnlyInstantChart = false,
  visibleSlotOrder = [],
  mergedSlotOrder,
  showTabChrome = false,
  shouldShowWidget,
  selectorMode,
  widgetRenderContext,
  ...rest
} = {}) {
  return {
    variant,
    showChartsTab,
    showOnlyInstantChart,
    visibleSlotOrder,
    mergedSlotOrder,
    showTabChrome,
    shouldShowWidget,
    selectorMode,
    widgetRenderContext,
    ...rest,
  };
}

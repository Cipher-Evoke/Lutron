import React, { memo } from 'react';
import { Box } from '@mui/material';
import SpaceWidgetRenderer from './SpaceWidgetRenderer';
import { SPACE_LAYOUT_MODES, SPACE_SECTION_TYPES, SPACE_SLOT_KINDS } from './spaceLayoutTypes';
import { resolveSpaceTabLayout, resolveSpaceSlotMeta } from './spaceLayoutResolvers';
import { spaceLayoutRendererPropsAreEqual } from './spaceLayoutMemoCompare';

function resolveSlotRegistry(adapter) {
  return adapter?.SLOT_REGISTRY || adapter?.slotRegistry || {};
}

function renderDefaultWidgetBody(slotId, meta, layoutContext) {
  const widgetRenderContext = layoutContext?.widgetRenderContext;
  if (!widgetRenderContext || !meta?.widgetKey) return null;

  const selectorMode = meta.selectorMode || layoutContext.selectorMode || 'active';
  const chartLoaderHeight =
    layoutContext.chartLoaderHeights?.[slotId] ?? layoutContext.chartLoaderHeight;

  return (
    <SpaceWidgetRenderer
      widgetKey={meta.widgetKey}
      context={{ ...widgetRenderContext, selectorMode }}
      overrides={layoutContext.widgetOverrides?.[slotId]}
      chartLoaderHeight={chartLoaderHeight}
    />
  );
}

function renderSlotContent({ slotId, adapter, layoutContext, runtime }) {
  const meta = resolveSpaceSlotMeta(slotId, adapter);
  if (!meta) {
    return runtime?.renderUnknownSlot?.(slotId, layoutContext) ?? null;
  }

  if (meta.kind === SPACE_SLOT_KINDS.CUSTOM) {
    return runtime?.renderCustomSlot?.(slotId, layoutContext) ?? null;
  }

  if (typeof runtime?.renderWidgetSlot === 'function') {
    return runtime.renderWidgetSlot(slotId, meta, layoutContext);
  }

  const widgetBody = renderDefaultWidgetBody(slotId, meta, layoutContext);
  if (typeof runtime?.renderWidgetCard === 'function') {
    return runtime.renderWidgetCard(slotId, meta, widgetBody, layoutContext);
  }

  return widgetBody;
}

function wrapSlotContent(slotId, content, runtime) {
  if (!content) return null;
  if (typeof runtime?.wrapSlot === 'function') {
    return runtime.wrapSlot(slotId, content);
  }
  return content;
}

function renderSlot({ slotId, adapter, layoutContext, runtime }) {
  const content = renderSlotContent({ slotId, adapter, layoutContext, runtime });
  return wrapSlotContent(slotId, content, runtime);
}

function DynamicRowsLayout({ rows, adapter, layoutContext, runtime }) {
  const resolveRowSx = adapter.resolveRowSx || (() => ({}));
  const resolveSlotSx = adapter.resolveSlotSx || (() => ({}));

  return rows.map((pair, rowIndex, allRows) => (
    <Box key={pair.join('-')} sx={resolveRowSx(rowIndex, allRows.length, pair)}>
      {pair.map((slotId) => (
        <Box key={slotId} sx={resolveSlotSx(slotId, pair, layoutContext)}>
          {renderSlot({ slotId, adapter, layoutContext, runtime })}
        </Box>
      ))}
    </Box>
  ));
}

function FixedSectionsLayout({ sections, adapter, layoutContext, runtime }) {
  const resolveFullSectionSx = adapter.resolveFullSectionSx || (() => ({}));
  const resolveSplitSectionSx = adapter.resolveSplitSectionSx || (() => ({}));
  const resolveSplitColumnSx = adapter.resolveSplitColumnSx || (() => ({}));
  const resolveSplitLeftColumnSx = adapter.resolveSplitLeftColumnSx || resolveSplitColumnSx;
  const resolveSplitRightColumnSx = adapter.resolveSplitRightColumnSx || resolveSplitColumnSx;

  return sections.map((section, sectionIndex) => {
    if (section.type === SPACE_SECTION_TYPES.FULL) {
      return (section.slots || []).map((slotId) => (
        <Box key={slotId} sx={resolveFullSectionSx(slotId, sectionIndex)}>
          {renderSlot({ slotId, adapter, layoutContext, runtime })}
        </Box>
      ));
    }

    if (section.type === SPACE_SECTION_TYPES.SPLIT) {
      return (
        <Box key={`split-${sectionIndex}`} sx={resolveSplitSectionSx(section, sectionIndex)}>
          <Box sx={resolveSplitLeftColumnSx(section.leftColumn, 'left')}>
            {(section.leftColumn?.slots || []).map((slotId) => (
              <React.Fragment key={slotId}>
                {renderSlot({ slotId, adapter, layoutContext, runtime })}
              </React.Fragment>
            ))}
          </Box>
          <Box sx={resolveSplitRightColumnSx(section.rightColumn, 'right')}>
            {(section.rightColumn?.slots || []).map((slotId) => (
              <React.Fragment key={slotId}>
                {renderSlot({ slotId, adapter, layoutContext, runtime })}
              </React.Fragment>
            ))}
          </Box>
        </Box>
      );
    }

    return null;
  });
}

function SortableGridLayout({ layoutContext, adapter, runtime }) {
  if (typeof runtime?.renderSortableLayout === 'function') {
    return runtime.renderSortableLayout({
      layoutContext,
      adapter,
      renderSlot: (slotId) => renderSlot({ slotId, adapter, layoutContext, runtime }),
    });
  }

  const slotIds = layoutContext.visibleSlotOrder || [];
  return slotIds.map((slotId) => (
    <React.Fragment key={slotId}>
      {renderSlot({ slotId, adapter, layoutContext, runtime })}
    </React.Fragment>
  ));
}

function SpaceLayoutRendererInner({ activeTab, layoutContext, adapter, runtime }) {
  if (!adapter || !layoutContext) return null;

  const tabLayout = runtime?.resolveTabLayout?.(activeTab, layoutContext, adapter);
  const resolvedTabLayout =
    tabLayout || resolveSpaceTabLayout(activeTab, layoutContext, adapter);

  if (!resolvedTabLayout.visible) return null;

  if (resolvedTabLayout.showEmptyState) {
    return (
      runtime?.renderEmptyState?.(resolvedTabLayout.emptyStateKey, layoutContext) ?? null
    );
  }

  const mergedContext = {
    ...layoutContext,
    selectorMode: resolvedTabLayout.selectorMode,
  };

  const tabChrome =
    resolvedTabLayout.showTabChrome && runtime?.renderTabChrome
      ? runtime.renderTabChrome(resolvedTabLayout.tabId, mergedContext)
      : null;

  let body = null;
  if (resolvedTabLayout.layoutMode === SPACE_LAYOUT_MODES.DYNAMIC_ROWS) {
    body = (
      <DynamicRowsLayout
        rows={resolvedTabLayout.rows}
        adapter={adapter}
        layoutContext={mergedContext}
        runtime={runtime}
      />
    );
  } else if (resolvedTabLayout.layoutMode === SPACE_LAYOUT_MODES.FIXED_SECTIONS) {
    body = (
      <FixedSectionsLayout
        sections={resolvedTabLayout.sections}
        adapter={adapter}
        layoutContext={mergedContext}
        runtime={runtime}
      />
    );
  } else if (resolvedTabLayout.layoutMode === SPACE_LAYOUT_MODES.SORTABLE_GRID) {
    body = (
      <SortableGridLayout
        layoutContext={mergedContext}
        adapter={adapter}
        runtime={runtime}
      />
    );
  }

  const stackSx = adapter.resolveStackSx?.(resolvedTabLayout.tabId, mergedContext) || {
    width: '100%',
  };

  return (
    <>
      {tabChrome}
      <Box sx={stackSx}>{body}</Box>
    </>
  );
}

const SpaceLayoutRenderer = memo(SpaceLayoutRendererInner, spaceLayoutRendererPropsAreEqual);
SpaceLayoutRenderer.displayName = 'SpaceLayoutRenderer';

export default SpaceLayoutRenderer;

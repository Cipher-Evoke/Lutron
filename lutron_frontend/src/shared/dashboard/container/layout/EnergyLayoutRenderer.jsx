import React, { memo } from 'react';
import { Box, Grid } from '@mui/material';
import WidgetSlotRenderer from './WidgetSlotRenderer';
import { ENERGY_LAYOUT_MODES, ENERGY_SLOT_KINDS } from './layoutTypes';
import { energyLayoutRendererPropsAreEqual } from './energyLayoutMemoCompare';

function resolveSlotRegistry(adapter) {
  return adapter?.SLOT_REGISTRY || adapter?.slotRegistry || {};
}

function renderSlotContent({
  slotId,
  variant,
  context,
  adapter,
  adapterRuntime,
}) {
  const registry = resolveSlotRegistry(adapter);
  const meta = registry[slotId] || adapter?.getSlotMeta?.(slotId);
  if (!meta) return null;

  if (meta.kind === ENERGY_SLOT_KINDS.CUSTOM) {
    return adapterRuntime?.renderCustomSlot?.(slotId) ?? null;
  }

  const shellProps = adapterRuntime?.getShellProps?.(slotId) ?? {};
  return (
    <WidgetSlotRenderer
      widgetKey={meta.widgetKey}
      variant={variant}
      context={context}
      shellType={meta.shellType}
      shellProps={shellProps}
    />
  );
}

function wrapSlotContent(slotId, content, adapterRuntime) {
  if (!content) return null;
  if (typeof adapterRuntime?.wrapSlot === 'function') {
    return adapterRuntime.wrapSlot(slotId, content);
  }
  return content;
}

function DynamicRowsLayout({
  rows,
  variant,
  context,
  adapter,
  adapterRuntime,
  theme,
}) {
  const resolveRowSx = adapter.resolveRowSx || adapter.resolveBasicRowSx;
  const resolveSlotSx = adapter.resolveSlotColumnSx || adapter.resolveBasicSlotColumnSx;

  return rows.map((pair, rowIndex, allRows) => (
    <Box key={pair.join('-')} sx={resolveRowSx(rowIndex, allRows.length)}>
      {pair.map((slotId) => {
        const content = renderSlotContent({
          slotId,
          variant,
          context,
          adapter,
          adapterRuntime,
        });
        return (
          <Box key={slotId} sx={resolveSlotSx(slotId, pair, theme)}>
            {wrapSlotContent(slotId, content, adapterRuntime)}
          </Box>
        );
      })}
    </Box>
  ));
}

function FixedGridLayout({ rows, variant, context, adapter, adapterRuntime }) {
  const spacing = adapter.GRID_SPACING || adapter.gridSpacing;
  const gridItemProps = adapter.GRID_ITEM_PROPS || adapter.gridItemProps || { xs: 12, md: 6 };
  const resolveRowSx = adapter.resolveGridRowSx;

  return rows.map((rowSlots, rowIndex) => (
    <Grid
      key={rowSlots.join('-')}
      container
      spacing={spacing}
      direction={{ xs: 'column', md: 'row' }}
      width="100%"
      sx={resolveRowSx?.(rowIndex)}
    >
      {rowSlots.map((slotId) => {
        const content = renderSlotContent({
          slotId,
          variant,
          context,
          adapter,
          adapterRuntime,
        });
        return (
          <Grid item {...gridItemProps} key={slotId}>
            {wrapSlotContent(slotId, content, adapterRuntime)}
          </Grid>
        );
      })}
    </Grid>
  ));
}

function SortableGridLayout({ cards, adapter, adapterRuntime, gridOptions }) {
  const gridSx = adapter.resolveSortableGridSx(gridOptions?.gridColumns);
  const getCardCol = adapterRuntime?.getCardCol;
  const wrapCard = adapterRuntime?.wrapCard;

  return (
    <Box sx={gridSx}>
      {(cards || []).map((card) => {
        const content = card.render?.();
        if (!content) return null;
        const col = getCardCol?.(card.key, gridOptions?.visibleCount);
        if (typeof wrapCard === 'function') {
          return (
            <React.Fragment key={card.key}>{wrapCard(card.key, col, content)}</React.Fragment>
          );
        }
        return (
          <Box key={card.key} sx={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
            {content}
          </Box>
        );
      })}
    </Box>
  );
}

function EnergyLayoutRendererInner({
  variant,
  layoutMode,
  rows = [],
  cards = [],
  context,
  adapter,
  adapterRuntime,
  theme,
  gridOptions = {},
}) {
  if (layoutMode === ENERGY_LAYOUT_MODES.DYNAMIC_ROWS) {
    return (
      <DynamicRowsLayout
        rows={rows}
        variant={variant}
        context={context}
        adapter={adapter}
        adapterRuntime={adapterRuntime}
        theme={theme}
      />
    );
  }

  if (layoutMode === ENERGY_LAYOUT_MODES.FIXED_GRID) {
    return (
      <FixedGridLayout
        rows={rows}
        variant={variant}
        context={context}
        adapter={adapter}
        adapterRuntime={adapterRuntime}
      />
    );
  }

  if (layoutMode === ENERGY_LAYOUT_MODES.SORTABLE_GRID) {
    return (
      <SortableGridLayout
        cards={cards}
        adapter={adapter}
        adapterRuntime={adapterRuntime}
        gridOptions={gridOptions}
      />
    );
  }

  return null;
}

const EnergyLayoutRenderer = memo(EnergyLayoutRendererInner, energyLayoutRendererPropsAreEqual);
EnergyLayoutRenderer.displayName = 'EnergyLayoutRenderer';

export default EnergyLayoutRenderer;

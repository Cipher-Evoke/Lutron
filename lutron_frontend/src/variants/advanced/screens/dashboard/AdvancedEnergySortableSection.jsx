import React from 'react';
import { Box } from '@mui/material';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import EnergyLayoutRenderer from '../../../../shared/dashboard/container/layout/EnergyLayoutRenderer';
import WidgetSlotRenderer from '../../../../shared/dashboard/container/layout/WidgetSlotRenderer';
import { ENERGY_LAYOUT_MODES } from '../../../../shared/dashboard/container/layout/layoutTypes';
import { getAdvancedEnergySlotMeta } from '../../../../shared/dashboard/container/layout';
import SortableDashboardItem from '../../components/dashboard/SortableDashboardItem';
import {
  ADVANCED_ENERGY_BUILTIN_CARD_KEYS,
  ADVANCED_ENERGY_FORCE_FULL_WIDTH_SLOTS,
  resolveAdvancedSortableGridSx,
} from '../../utils/advancedDashboardLayout';

function renderAdvancedEnergyCard(slotId, context, getShellProps) {
  const meta = getAdvancedEnergySlotMeta(slotId);
  if (!meta) return null;
  const shellProps = typeof getShellProps === 'function' ? getShellProps(slotId) ?? {} : {};
  return (
    <WidgetSlotRenderer
      widgetKey={meta.widgetKey}
      variant="advanced"
      context={context}
      shellType={meta.shellType}
      shellProps={shellProps}
    />
  );
}

export default function AdvancedEnergySortableSection({
  orchestration,
  energyWidgetRenderContext,
  getShellProps,
  renderCustomCard,
  extraEnergyCards = [],
  sensors,
  energyFullscreenCardId,
  toggleEnergyFullscreen,
  toggleEnergyCardSpan,
  setEnergyCardOrder,
  writeEnergyCardOrder,
  /** When true (Admin/Operator), block rearrange + width resize. Superadmin only. */
  layoutLocked = false,
}) {
  const {
    visibility: {
      getEnergyCardCol,
      resolveEnergyCardLayout,
      energyGridColumnTemplate,
      shouldRenderWidget,
    },
  } = orchestration;

  const energyCards = [
    ...ADVANCED_ENERGY_BUILTIN_CARD_KEYS
      .filter((key) => (typeof shouldRenderWidget === 'function' ? shouldRenderWidget(key) : true))
      .map((key) => ({
        key,
        render: () => {
          if (key === 'consumption_saving' && typeof renderCustomCard === 'function') {
            const custom = renderCustomCard(key);
            if (custom) return custom;
          }
          return renderAdvancedEnergyCard(key, energyWidgetRenderContext, getShellProps);
        },
      })),
    ...(Array.isArray(extraEnergyCards) ? extraEnergyCards : []),
  ];

  const { mergedOrder, orderedCards, visibleCount } = resolveEnergyCardLayout(energyCards);
  const energyGridCols = energyGridColumnTemplate(visibleCount);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={(event) => {
        if (layoutLocked) return;
        const activeId = String(event?.active?.id ?? '');
        const overId = String(event?.over?.id ?? '');
        if (!activeId || !overId || activeId === overId) return;
        const oldIndex = mergedOrder.indexOf(activeId);
        const newIndex = mergedOrder.indexOf(overId);
        if (oldIndex < 0 || newIndex < 0) return;
        const next = arrayMove(mergedOrder, oldIndex, newIndex);
        setEnergyCardOrder(next);
        writeEnergyCardOrder(next);
      }}
    >
      <SortableContext items={mergedOrder} strategy={rectSortingStrategy}>
        <EnergyLayoutRenderer
          variant="advanced"
          layoutMode={ENERGY_LAYOUT_MODES.SORTABLE_GRID}
          cards={orderedCards}
          adapter={{
            resolveSortableGridSx: resolveAdvancedSortableGridSx,
          }}
          adapterRuntime={{
            getCardCol: (key, count) => getEnergyCardCol(key, count),
            wrapCard: (key, col, content) => {
              const isFullscreen = String(energyFullscreenCardId || '') === String(key);
              return (
                <SortableDashboardItem
                  id={key}
                  disabled={layoutLocked}
                  spanMode="energy"
                  showSpanToggle={
                    !layoutLocked && !ADVANCED_ENERGY_FORCE_FULL_WIDTH_SLOTS.has(key)
                  }
                  span={col}
                  onToggleSpan={layoutLocked ? undefined : toggleEnergyCardSpan}
                  showHeightToggle={!layoutLocked}
                  isFullscreen={isFullscreen}
                  onToggleFullscreen={layoutLocked ? undefined : toggleEnergyFullscreen}
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
                    {content}
                  </Box>
                </SortableDashboardItem>
              );
            },
          }}
          gridOptions={{
            gridColumns: energyGridCols,
            visibleCount,
          }}
        />
      </SortableContext>
    </DndContext>
  );
}

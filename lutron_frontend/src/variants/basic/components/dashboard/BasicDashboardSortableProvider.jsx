import React, { useCallback } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';

/**
 * Shared DndContext + SortableContext shell for Basic Energy / Space rearrange.
 */
export default function BasicDashboardSortableProvider({
  items,
  sensors,
  locked = false,
  onReorder,
  children,
}) {
  const handleDragEnd = useCallback(
    (event) => {
      if (locked) return;
      const activeId = String(event?.active?.id ?? '');
      const overId = String(event?.over?.id ?? '');
      if (!activeId || !overId || activeId === overId) return;
      const list = Array.isArray(items) ? items.map(String) : [];
      const oldIndex = list.indexOf(activeId);
      const newIndex = list.indexOf(overId);
      if (oldIndex < 0 || newIndex < 0) return;
      const next = arrayMove(list, oldIndex, newIndex);
      if (typeof onReorder === 'function') onReorder(next);
    },
    [items, locked, onReorder]
  );

  const sortableItems = Array.isArray(items) ? items.map(String) : [];

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sortableItems} strategy={rectSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

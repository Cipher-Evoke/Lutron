import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/**
 * dnd-kit sortable wrapper for Basic dashboard cards.
 * Span/fullscreen chrome stays in BasicDashboardCardChrome (child).
 */
export default function SortableDashboardItem({ id, disabled = false, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
    cursor: disabled ? 'default' : 'grab',
    touchAction: 'none',
    width: '100%',
    minWidth: 0,
    minHeight: 0,
    boxSizing: 'border-box',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(!disabled ? listeners : {})}
    >
      {children}
    </div>
  );
}

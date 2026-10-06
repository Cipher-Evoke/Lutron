import { PointerSensor, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';

/** Press & hold before drag starts so chart interactions stay usable. */
export function useAdvancedDashboardSortableSensors() {
  return useSensors(
    useSensor(MouseSensor, { activationConstraint: { delay: 1000, tolerance: 20 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 1000, tolerance: 20 } }),
    useSensor(PointerSensor, { activationConstraint: { delay: 1000, tolerance: 20 } })
  );
}

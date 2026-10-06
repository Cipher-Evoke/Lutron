import { useEffect, useState } from 'react';

/**
 * Local area-tree picker state (pre-Set-button selections).
 * Handlers and tree render remain in Dashboard.jsx until Phase 6.2.
 */
export function useAreaTreeSelection() {
  const [floorsWithSelectedAreas, setFloorsWithSelectedAreas] = useState(new Set());
  const [localSelectedFloorIds, setLocalSelectedFloorIds] = useState([]);
  const [localSelectedAreas, setLocalSelectedAreas] = useState([]);
  const [localSelectedGroups, setLocalSelectedGroups] = useState([]);
  const [expandedFloorId, setExpandedFloorId] = useState(null);

  useEffect(() => {
    if (localSelectedFloorIds.length > 0) {
      setFloorsWithSelectedAreas(new Set(localSelectedFloorIds));
    } else {
      setFloorsWithSelectedAreas(new Set());
    }
  }, [localSelectedFloorIds]);

  return {
    floorsWithSelectedAreas,
    setFloorsWithSelectedAreas,
    localSelectedFloorIds,
    setLocalSelectedFloorIds,
    localSelectedAreas,
    setLocalSelectedAreas,
    localSelectedGroups,
    setLocalSelectedGroups,
    expandedFloorId,
    setExpandedFloorId,
  };
}

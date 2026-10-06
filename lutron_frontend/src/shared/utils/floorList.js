/**
 * Normalize /floor/list payloads — API may return an array or { floors: [] }.
 */
export function getFloorsList(floors) {
  if (!floors) return [];
  if (Array.isArray(floors)) return floors;
  if (Array.isArray(floors.floors)) return floors.floors;
  if (Array.isArray(floors.data)) return floors.data;
  return [];
}

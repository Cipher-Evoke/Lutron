/**
 * Normalize /floor/list response (array legacy or { floors, manual_sort_enabled }).
 */
export function normalizeFloorListResponse(data) {
  if (Array.isArray(data)) {
    return { floors: data, manual_sort_enabled: false };
  }
  return {
    floors: Array.isArray(data?.floors) ? data.floors : [],
    manual_sort_enabled: Boolean(data?.manual_sort_enabled),
  };
}

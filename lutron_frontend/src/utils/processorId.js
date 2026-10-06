/**
 * Resolve a numeric processor id from list/floor processor shapes.
 * Floor APIs use `processor_id`; processor list uses `id`.
 */
export function getProcessorId(processorOrId) {
  if (processorOrId == null || processorOrId === '') return null;
  if (typeof processorOrId === 'number' || typeof processorOrId === 'string') {
    const n = Number(processorOrId);
    return Number.isFinite(n) ? n : null;
  }
  const raw = processorOrId.processor_id ?? processorOrId.id;
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** Loose equality for processor ids (avoids string/number mismatch). */
export function processorIdsEqual(a, b) {
  const idA = getProcessorId(a);
  const idB = getProcessorId(b);
  return idA != null && idB != null && idA === idB;
}

export default getProcessorId;

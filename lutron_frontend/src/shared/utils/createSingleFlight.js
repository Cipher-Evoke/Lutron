/**
 * Ignore overlapping async clicks: only one run at a time.
 * Extra invocations while busy return undefined immediately.
 */
export function createSingleFlight() {
  let busy = false;
  return async (fn) => {
    if (busy) return undefined;
    busy = true;
    try {
      return await fn();
    } finally {
      busy = false;
    }
  };
}

/**
 * Temporary Space Utilization timing logs.
 * Prefix is stable so production console can be filtered.
 */
export function logSpaceTiming(phase, detail = {}) {
  try {
    // eslint-disable-next-line no-console
    console.info('[SpaceTiming]', {
      iso: new Date().toISOString(),
      phase,
      ...detail,
    });
  } catch (_err) {
    // ignore
  }
}

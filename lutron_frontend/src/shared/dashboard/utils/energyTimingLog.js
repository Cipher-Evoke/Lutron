/**
 * Temporary Energy Dashboard timing logs (RCA follow-up).
 * Prefix is stable so production console can be filtered.
 */
export function logEnergyTiming(phase, detail = {}) {
  try {
    // eslint-disable-next-line no-console
    console.info('[EnergyTiming]', {
      iso: new Date().toISOString(),
      phase,
      ...detail,
    });
  } catch (_err) {
    // ignore
  }
}

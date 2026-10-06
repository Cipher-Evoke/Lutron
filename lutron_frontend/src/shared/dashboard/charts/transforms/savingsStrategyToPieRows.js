/**
 * Savings-by-strategy API payload → pie chart rows.
 */

export function resolveSavingsStrategyDataObject(savingsByStrategy) {
  const raw = savingsByStrategy?.data || savingsByStrategy || {};
  if (!raw || typeof raw !== 'object' || Object.keys(raw).length === 0) {
    return {
      Keypad: 0,
      Sensors: 0,
      Schedule: 0,
      GUI: 0,
      Consumption: 0,
    };
  }
  return raw;
}

export function savingsStrategyEntriesFromPayload(savingsByStrategy) {
  const dataToUse = resolveSavingsStrategyDataObject(savingsByStrategy);
  return Object.entries(dataToUse).map(([name, value]) => ({
    name,
    value: Number(value || 0),
  }));
}

export function calculateTotalSavingsPercentage(savingsByStrategy) {
  if (!savingsByStrategy) return 0;
  const dataToUse = resolveSavingsStrategyDataObject(savingsByStrategy);
  const entries = Object.entries(dataToUse)
    .map(([name, value]) => ({ name, value: Number(value || 0) }))
    .filter((entry) => entry.name !== 'Consumption');
  return entries.reduce((s, d) => s + d.value, 0);
}

export function savingsStrategyToPieRows(savingsByStrategy) {
  const entries = savingsStrategyEntriesFromPayload(savingsByStrategy);
  return entries
    .filter((d) => d.value > 0)
    .map((d) => ({
      name: d.name,
      value: d.value,
      percentage: d.value,
    }));
}

export function isSavingsStrategyTransitionalData(savingsByStrategy) {
  const raw = savingsByStrategy?.data || savingsByStrategy || {};
  return (
    !raw ||
    typeof raw !== 'object' ||
    Object.keys(raw).length === 0 ||
    (raw.status && raw.status === 'error') ||
    (typeof raw === 'object' &&
      Object.values(raw).every((val) => val === 0 || val === null || val === undefined))
  );
}

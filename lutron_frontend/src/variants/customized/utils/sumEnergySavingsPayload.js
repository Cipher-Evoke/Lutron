/**
 * Sum all numeric series in an energy_savings API payload (period total).
 * Shape mirrors sumEnergyConsumptionPayload (y-axis object and top-level array).
 */
export function sumEnergySavingsPayload(raw) {
  if (!raw || typeof raw !== "object") return 0;
  const y = raw["y-axis"];
  if (y && typeof y === "object" && !Array.isArray(y)) {
    let total = 0;
    for (const arr of Object.values(y)) {
      if (Array.isArray(arr)) {
        for (const v of arr) {
          const n = Number(v);
          total += Number.isFinite(n) ? n : 0;
        }
      }
    }
    return total;
  }
  if (Array.isArray(raw.savings)) {
    return raw.savings.reduce((acc, v) => acc + (Number(v) || 0), 0);
  }
  return 0;
}

/**
 * Sum all numeric series in an energy_consumption API payload (period total).
 * Use this after ONE GET per floor/area bucket for bar/pie/table (STEP 2 aggregate).
 */
export function sumEnergyConsumptionPayload(raw) {
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
  if (Array.isArray(raw.consumption)) {
    return raw.consumption.reduce((acc, v) => acc + (Number(v) || 0), 0);
  }
  return 0;
}

/** Alias for custom energy widgets: one scalar Wh total per `/dashboard/energy_consumption` response. */
export function aggregateEnergyConsumptionApiResponseToTotal(raw) {
  return sumEnergyConsumptionPayload(raw);
}

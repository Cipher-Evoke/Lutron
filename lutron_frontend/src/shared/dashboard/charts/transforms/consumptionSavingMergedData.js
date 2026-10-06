/**
 * Merge consumption + savings transformed series for basic combined chart.
 */
export function consumptionSavingMergedData(consumptionSeries, savingsSeries) {
  if (!consumptionSeries.length && !savingsSeries.length) return [];

  const byDate = new Map();
  const upsert = (row) => {
    const key = String(row?.date ?? '');
    if (!key) return;
    if (!byDate.has(key)) byDate.set(key, { date: key, consumption: null, savings: null, connectedLoad: null });
    return byDate.get(key);
  };

  const sumSeriesPoint = (pt) => {
    if (!pt) return null;
    let sum = 0;
    let has = false;
    for (const [k, v] of Object.entries(pt)) {
      if (k === 'date') continue;
      if (v == null || v === '') continue;
      const n = Number(v);
      if (Number.isNaN(n)) continue;
      sum += n;
      has = true;
    }
    return has ? sum : null;
  };

  const areaKeysSet = new Set();

  for (const pt of consumptionSeries) {
    const row = upsert(pt);
    if (!row) continue;
    row.consumption = sumSeriesPoint(pt);
    for (const [k, v] of Object.entries(pt)) {
      if (k === 'date') continue;
      areaKeysSet.add(k);
      if (v != null && v !== '') {
        const n = Number(v);
        if (!Number.isNaN(n)) {
          row[`${k}_consumption`] = n;
        }
      }
    }
  }

  for (const pt of savingsSeries) {
    const row = upsert(pt);
    if (!row) continue;
    row.savings = sumSeriesPoint(pt);
    for (const [k, v] of Object.entries(pt)) {
      if (k === 'date') continue;
      areaKeysSet.add(k);
      if (v != null && v !== '') {
        const n = Number(v);
        if (!Number.isNaN(n)) {
          row[`${k}_savings`] = n;
        }
      }
    }
  }

  const areaKeys = Array.from(areaKeysSet);

  for (const row of byDate.values()) {
    const c = row.consumption != null && row.consumption !== '' ? Number(row.consumption) : null;
    const s = row.savings != null && row.savings !== '' ? Number(row.savings) : null;
    const cOk = c != null && !Number.isNaN(c);
    const sOk = s != null && !Number.isNaN(s);
    if (!cOk && !sOk) {
      row.connectedLoad = null;
    } else {
      row.connectedLoad = (cOk ? c : 0) + (sOk ? s : 0);
    }

    for (const key of areaKeys) {
      const ac = row[`${key}_consumption`];
      const as = row[`${key}_savings`];
      const acOk = ac != null && !Number.isNaN(ac);
      const asOk = as != null && !Number.isNaN(as);
      if (acOk || asOk) {
        row[`${key}_connectedLoad`] = (acOk ? ac : 0) + (asOk ? as : 0);
      } else {
        row[`${key}_connectedLoad`] = null;
      }
    }
  }

  const result = Array.from(byDate.values());
  if (areaKeys.length > 0) {
    result.areaKeys = areaKeys;
  }
  return result;
}

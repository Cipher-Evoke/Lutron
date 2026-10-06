/**
 * Single summary value from occupancy_count-style payload { 'x-axis', 'y-axis': { data } }.
 * Used when comparing multiple floors (mean of non-null series points).
 */
/**
 * Single summary value from occupancy_count-style payload { 'x-axis', 'y-axis': { data } }.
 * Used when comparing multiple floors (mean of non-null series points).
 */
export function meanOccupancyFromChartPayload(payload) {
  if (!payload || typeof payload !== 'object') return null;
  if (String(payload.status || '').toLowerCase() === 'error') return null;

  if (payload.utilized_area && Array.isArray(payload.utilized_area)) {
    const nums = payload.utilized_area
      .map(area => {
        const v = area.occupied ?? area.percentage ?? area.val;
        return Number(v);
      })
      .filter(v => v !== null && v !== undefined && !Number.isNaN(v));

    if (nums.length === 0) return null;
    const sum = nums.reduce((a, b) => a + b, 0);
    return sum / nums.length;
  }

  const yAxis = payload['y-axis'];
  if (!yAxis) return null;
  // Single series or array-of-objects case
  if (Array.isArray(yAxis.data)) {
    const isArrayOfObjects = yAxis.data.length > 0 && typeof yAxis.data[0] === 'object' && yAxis.data[0] !== null && 'data' in yAxis.data[0];

    if (!isArrayOfObjects) {
      // 1A) Simple array of numbers
      const nums = yAxis.data
        .filter((v) => v !== null && v !== undefined && !Number.isNaN(Number(v)))
        .map((v) => Number(v));
      if (nums.length === 0) return null;
      const sum = nums.reduce((a, b) => a + b, 0);
      return sum / nums.length;
    } else {
      // 1B) Array of objects: [{ name: 'Area 1', data: [1,2,3] }, { name: 'Area 2', data: [4,5,6] }]
      const seriesList = yAxis.data.map(s => Array.isArray(s.data) ? s.data : []);
      if (seriesList.length === 0) return null;
      const length = Math.max(...seriesList.map(s => s.length));
      if (length === 0) return null;

      const sums = [];
      for (let i = 0; i < length; i++) {
        let timePointSum = 0;
        let hasValidData = false;
        for (const series of seriesList) {
          const val = series[i];
          if (val !== null && val !== undefined && !Number.isNaN(Number(val))) {
            timePointSum += Number(val);
            hasValidData = true;
          }
        }
        if (hasValidData) sums.push(timePointSum);
      }
      if (sums.length === 0) return null;
      const totalSum = sums.reduce((a, b) => a + b, 0);
      return totalSum / sums.length;
    }
  }

  // Multi-series dictionary case (e.g. { 'Area A': [...], 'Area B': [...] })
  const keys = Object.keys(yAxis).filter(k => Array.isArray(yAxis[k]));
  if (keys.length === 0) return null;

  // Assuming all series have the same length (which they should for a given timeframe)
  const length = Math.max(...keys.map(k => yAxis[k].length));
  if (length === 0) return null;
  const sums = [];

  for (let i = 0; i < length; i++) {
    let timePointSum = 0;
    let hasValidData = false;
    for (const k of keys) {
      const val = yAxis[k][i];
      if (val !== null && val !== undefined && !Number.isNaN(Number(val))) {
        timePointSum += Number(val);
        hasValidData = true;
      }
    }
    if (hasValidData) {
      sums.push(timePointSum);
    }
  }

  if (sums.length === 0) return null;
  const totalSum = sums.reduce((a, b) => a + b, 0);
  return totalSum / sums.length;
}

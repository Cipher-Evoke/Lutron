/**
 * Peak/min over Recharts row data [{ date, series… }].
 * Extracted from variant Dashboard.jsx — behavior unchanged.
 */
export function calculatePeakMinFromChartData(chartData) {
  if (!chartData || chartData.length === 0) {
    return { peak: { value: 0, time: null }, min: { value: 0, time: null } };
  }

  const entries = [];
  let entryIndex = 0;

  chartData.forEach((point) => {
    Object.keys(point).forEach((key) => {
      if (key !== 'date') {
        const rawValue = point[key];
        if (rawValue === null || rawValue === undefined) {
          return;
        }

        const numericValue = Number(rawValue);
        if (!Number.isNaN(numericValue)) {
          entries.push({
            value: numericValue,
            time: point.date,
            index: entryIndex++,
          });
        }
      }
    });
  });

  if (entries.length === 0) {
    return { peak: { value: 0, time: null }, min: { value: 0, time: null } };
  }

  const tolerance = 1e-6;
  const zeroEntries = entries.filter((entry) => Math.abs(entry.value) <= tolerance);

  const peakEntry = entries.reduce((max, curr) => {
    if (curr.value > max.value) return curr;
    if (curr.value === max.value) {
      return curr.index < max.index ? curr : max;
    }
    return max;
  }, entries[0]);

  let minEntry;
  if (zeroEntries.length > 0) {
    minEntry = zeroEntries.reduce((best, curr) => (curr.index < best.index ? curr : best));
  } else {
    minEntry = entries.reduce((min, curr) => {
      if (curr.value < min.value) return curr;
      if (curr.value === min.value) {
        return curr.index < min.index ? curr : min;
      }
      return min;
    }, entries[0]);
  }

  return {
    peak: {
      value: peakEntry.value,
      time: peakEntry.time,
    },
    min: {
      value: minEntry.value,
      time: minEntry.time,
    },
  };
}

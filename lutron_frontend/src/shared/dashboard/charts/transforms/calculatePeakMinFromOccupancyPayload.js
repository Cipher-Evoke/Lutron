/**
 * Peak/min over API occupancy payload { 'x-axis', 'y-axis' }.
 * Extracted from customized SpaceUtilization.jsx — behavior unchanged.
 */
export function calculatePeakMinFromOccupancyPayload(chartData) {
  try {
    if (!chartData || typeof chartData !== 'object') {
      return { peak: null, min: null, peakTime: null, minTime: null };
    }
    if (String(chartData.status || '').toLowerCase() === 'error') {
      return { peak: null, min: null, peakTime: null, minTime: null };
    }
    if (!chartData['x-axis'] || !chartData['y-axis'] || typeof chartData['y-axis'] !== 'object') {
      return { peak: null, min: null, peakTime: null, minTime: null };
    }

    const timeLabels = chartData['x-axis'] || [];
    const yAxisObj = chartData['y-axis'];
    let occupancyValues = [];

    if (yAxisObj && !Array.isArray(yAxisObj) && !yAxisObj.data) {
      const series = Object.values(yAxisObj).filter(Array.isArray);
      occupancyValues = timeLabels.map((_, i) => {
        let maxAtIdx = null;
        for (const s of series) {
          const v = Number(s[i]);
          if (Number.isFinite(v)) {
            if (maxAtIdx === null || v > maxAtIdx) maxAtIdx = v;
          }
        }
        return maxAtIdx;
      });
    } else {
      occupancyValues = yAxisObj.data || (Array.isArray(yAxisObj) ? yAxisObj : []);
    }

    const validDataPoints = [];
    for (let i = 0; i < occupancyValues.length; i++) {
      const value = occupancyValues[i];
      const time = timeLabels[i];
      if (value !== null && value !== undefined && time) {
        validDataPoints.push({ value, time, index: i });
      }
    }

    if (validDataPoints.length === 0) {
      return { peak: null, min: null, peakTime: null, minTime: null };
    }

    const peakPoint = validDataPoints.reduce((max, current) =>
      current.value > max.value ? current : max
    );
    const minPoint = validDataPoints.reduce((min, current) =>
      current.value < min.value ? current : min
    );

    return {
      peak: peakPoint.value,
      min: minPoint.value,
      peakTime: peakPoint.time,
      minTime: minPoint.time,
    };
  } catch {
    return { peak: null, min: null, peakTime: null, minTime: null };
  }
}

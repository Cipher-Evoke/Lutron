/**
 * Recharts axis/dot/line configuration from transformed row count and date shape.
 */
export function getEnergyLineChartConfig(chartData, options = {}) {
  const { strokeWidthProfile = 'standard' } = options;
  const bold = strokeWidthProfile === 'bold';
  const dataPointCount = chartData.length;

  const hasDateHourFormat =
    chartData.length > 0 &&
    chartData[0].date &&
    (chartData[0].date.includes(' ') || chartData[0].date.includes('-'));

  if (dataPointCount === 96 || dataPointCount === 97) {
    return {
      xAxisInterval: 3,
      xAxisTickCount: 24,
      xAxisFontSize: 10,
      dotSize: 1.5,
      activeDotSize: 3,
      strokeWidth: bold ? 4 : 1.5,
    };
  }

  if (dataPointCount === 28 || dataPointCount === 29) {
    const weekHasDateHour =
      chartData.length > 0 && chartData[0].date && chartData[0].date.includes('/');

    if (weekHasDateHour) {
      return {
        xAxisInterval: 3,
        xAxisTickCount: 7,
        xAxisFontSize: 10,
        dotSize: 3,
        activeDotSize: 5,
        strokeWidth: bold ? 3 : 2,
      };
    }

    return {
      xAxisInterval: 3,
      xAxisTickCount: 7,
      xAxisFontSize: 10,
      dotSize: 4,
      activeDotSize: 6,
      strokeWidth: bold ? 3 : 2,
    };
  }

  if (dataPointCount >= 30 && dataPointCount <= 31) {
    return {
      xAxisInterval: 0,
      xAxisTickCount: dataPointCount,
      xAxisFontSize: 8,
      dotSize: 3,
      activeDotSize: 5,
      strokeWidth: bold ? 3 : 2,
    };
  }

  if (dataPointCount === 48) {
    return {
      xAxisInterval: 3,
      xAxisTickCount: 12,
      xAxisFontSize: 8,
      dotSize: 2,
      activeDotSize: 4,
      strokeWidth: bold ? 3 : 2,
    };
  }

  if (
    hasDateHourFormat &&
    chartData.length > 0 &&
    chartData[0].date &&
    chartData[0].date.includes('/') &&
    chartData[0].date.includes('-')
  ) {
    return {
      xAxisInterval: 3,
      xAxisTickCount: Math.ceil(dataPointCount / 4),
      xAxisFontSize: 8,
      dotSize: 2,
      activeDotSize: 4,
      strokeWidth: bold ? 3 : 2,
    };
  }

  if (dataPointCount > 31 && hasDateHourFormat) {
    return {
      xAxisInterval: 3,
      xAxisTickCount: Math.ceil(dataPointCount / 4),
      xAxisFontSize: 8,
      dotSize: 2,
      activeDotSize: 4,
      strokeWidth: bold ? 3 : 2,
    };
  }

  if (dataPointCount > 48 && hasDateHourFormat) {
    return {
      xAxisInterval: 3,
      xAxisTickCount: Math.ceil(dataPointCount / 4),
      xAxisFontSize: 8,
      dotSize: 2,
      activeDotSize: 4,
      strokeWidth: bold ? 3 : 2,
    };
  }

  return {
    xAxisInterval: 0,
    xAxisTickCount: Math.min(dataPointCount, 12),
    xAxisFontSize: 10,
    dotSize: 3,
    activeDotSize: 5,
    strokeWidth: bold ? 3 : 2,
  };
}

export function resolveEnergyLineSeriesNames(chartData) {
  const names = new Set();
  for (const row of chartData) {
    if (row && typeof row === 'object') {
      Object.keys(row).forEach((k) => {
        if (k !== 'date') names.add(k);
      });
    }
  }
  return Array.from(names);
}

export function resolveEnergyLineSeriesColors(seriesNames, colors, generateAdditional) {
  let uniqueColors = colors.slice(0, seriesNames.length);
  if (uniqueColors.length < seriesNames.length) {
    const additionalColors = generateAdditional(seriesNames.length - uniqueColors.length);
    uniqueColors = [...uniqueColors, ...additionalColors];
  }
  return uniqueColors;
}

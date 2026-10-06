function convertNullStrings(arr) {
  if (!Array.isArray(arr)) return arr;
  return arr.map((val) => (val === 'null' || val === null || val === undefined ? null : val));
}

function isNamedSeriesObject(dataObj) {
  if (!dataObj || typeof dataObj !== 'object' || Array.isArray(dataObj)) return false;
  return Object.keys(dataObj).some((key) => key !== 'combined_areas');
}

export function resolveUnifiedEnergyYAxis(dataObj, options = {}) {
  if (!dataObj || typeof dataObj !== 'object' || Array.isArray(dataObj)) return {};

  const fallbackLabel = options.fallbackLabel || 'Series';
  const requestedKeys = (options.requestedKeys || []).map(String);
  const rawEntries = Object.entries(dataObj);

  if (rawEntries.length === 0) return {};

  const hasNamedSeries = isNamedSeriesObject(dataObj);

  if (hasNamedSeries) {
    const normalized = {};
    rawEntries.forEach(([key, value]) => {
      if (key === 'combined_areas') return;
      if (!Array.isArray(value)) return;
      normalized[String(key)] = convertNullStrings(value);
    });

    if (Object.keys(normalized).length > 0) {
      return normalized;
    }
  }

  if (Object.prototype.hasOwnProperty.call(dataObj, 'combined_areas')) {
    return {
      'Combined Areas': convertNullStrings(dataObj.combined_areas || []),
    };
  }

  const fallbackSeries = {};
  fallbackSeries[fallbackLabel] = [];
  return fallbackSeries;
}

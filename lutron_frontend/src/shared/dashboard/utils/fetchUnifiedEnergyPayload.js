import { mapTimeRangeToBackend } from './mapTimeRangeToBackend';
import { resolveUnifiedEnergyYAxis } from './normalizeUnifiedEnergyPayload';

/**
 * Areas 2–4: call dedicated /dashboard/energy_consumption + /dashboard/energy_savings,
 * which already return one real named y-axis series per requested area_id.
 * Areas 0/1, areas 5+, or any floor/group scope: use
 * /dashboard/unified_energy_consumption_savings_data instead — the "Combined Areas"
 * splitting logic in transformDataForCharts fabricates per-area lines from a single
 * combined series once you're past a handful of areas, so we let the unified endpoint
 * (and its real combined_areas grouping) own that case instead of faking it client-side.
 */
export const UNIFIED_ENERGY_COMBINED_AREAS_THRESHOLD = 5;

const NAVIGABLE_TIME_RANGES = ['this-day', 'this-week', 'this-month', 'this-year'];

const appendTimeRangeParams = (params, { timeRange, startDate, endDate, isNavigating }) => {
  if (NAVIGABLE_TIME_RANGES.includes(timeRange) && isNavigating) {
    params.append('time_range', 'custom');
    params.append('start_date', startDate);
    params.append('end_date', endDate);
    return;
  }

  if (
    timeRange === 'custom' &&
    startDate &&
    endDate &&
    startDate.trim &&
    startDate.trim() !== '' &&
    endDate.trim &&
    endDate.trim() !== ''
  ) {
    params.append('time_range', 'custom');
    params.append('start_date', startDate);
    params.append('end_date', endDate);
    return;
  }

  params.append('time_range', mapTimeRangeToBackend(timeRange));
};

const appendLocationParams = (params, { areaIds, floorIds, groupIds }) => {
  if (floorIds && floorIds.length > 0) {
    floorIds.forEach((id) => params.append('floor_ids', id));
  }
  if (areaIds && areaIds.length > 0) {
    areaIds.forEach((id) => params.append('area_ids', id));
  }
  if (groupIds && groupIds.length > 0) {
    groupIds.forEach((id) => params.append('group_ids', id));
  }
};

const convertNullStrings = (arr) => {
  if (!Array.isArray(arr)) return arr;
  return arr.map((val) => (val === 'null' || val === null || val === undefined ? null : val));
};

/**
 * True only for the "several distinct areas, nothing else selected" shape — the one case
 * where per-area dedicated endpoints give a cleaner, real result than the unified/combined
 * endpoint's synthetic area splitting.
 */
const shouldUseDedicatedPerAreaEndpoints = ({ areaIds, floorIds, groupIds }) => {
  const hasFloors = Array.isArray(floorIds) && floorIds.length > 0;
  const hasGroups = Array.isArray(groupIds) && groupIds.length > 0;
  const areaCount = Array.isArray(areaIds) ? areaIds.length : 0;

  return (
    !hasFloors &&
    !hasGroups &&
    areaCount >= 2 &&
    areaCount < UNIFIED_ENERGY_COMBINED_AREAS_THRESHOLD
  );
};

async function fetchViaUnifiedEndpoint(baseUrlClient, params, { areaIds, groupIds }) {
  const response = await baseUrlClient.get(`/dashboard/unified_energy_consumption_savings_data?${params}`);
  const unifiedData = response.data || {};

  const requestedKeys = [
    ...(groupIds || []).map(String),
    ...(areaIds || []).map(String),
  ];

  let consumptionYAxis = {};
  if (unifiedData.consumption_data && typeof unifiedData.consumption_data === 'object') {
    consumptionYAxis = resolveUnifiedEnergyYAxis(unifiedData.consumption_data, {
      fallbackLabel: unifiedData.consumption_chart_name || 'Consumption',
      requestedKeys,
    });
  } else {
    consumptionYAxis = {
      [unifiedData.consumption_chart_name || 'Consumption']: convertNullStrings(unifiedData.consumption || []),
    };
  }

  let savingsYAxis = {};
  if (unifiedData.savings_data && typeof unifiedData.savings_data === 'object') {
    savingsYAxis = resolveUnifiedEnergyYAxis(unifiedData.savings_data, {
      fallbackLabel: unifiedData.savings_chart_name || 'Savings',
      requestedKeys,
    });
  } else {
    savingsYAxis = {
      [unifiedData.savings_chart_name || 'Savings']: convertNullStrings(unifiedData.savings || []),
    };
  }

  const xAxis = unifiedData['x-axis'] || unifiedData.x_axis || [];

  return {
    consumption: {
      'x-axis': xAxis,
      'y-axis': consumptionYAxis,
      unit: unifiedData.unit || '',
      max_limit: unifiedData.max_limit,
    },
    savings: {
      'x-axis': xAxis,
      'y-axis': savingsYAxis,
      unit: unifiedData.unit || '',
      max_limit: unifiedData.max_limit,
    },
    peakMin: {
      consumption_peak: unifiedData.consumption_peak || null,
      consumption_min: unifiedData.consumption_min || null,
    },
    original: unifiedData,
  };
}

/**
 * Dedicated per-area path: /dashboard/energy_consumption and /dashboard/energy_savings
 * already return one real named y-axis series per requested area_id, so there's no
 * splitting to do — just normalize the shape to match the unified transform's output.
 */
async function fetchViaDedicatedEndpoints(baseUrlClient, params) {
  const consumptionParams = new URLSearchParams(params);
  const savingsParams = new URLSearchParams(params);

  const [consumptionResponse, savingsResponse] = await Promise.all([
    baseUrlClient.get(`/dashboard/energy_consumption?${consumptionParams}`),
    baseUrlClient.get(`/dashboard/energy_savings?${savingsParams}`),
  ]);

  const consumptionData = consumptionResponse.data || {};
  const savingsData = savingsResponse.data || {};

  const normalizeAxes = (payload) => {
    const xAxis = payload['x-axis'] || payload.x_axis || [];
    const rawYAxis = payload['y-axis'] || payload.y_axis || {};
    const yAxis = {};
    Object.keys(rawYAxis || {}).forEach((key) => {
      yAxis[key] = convertNullStrings(rawYAxis[key]);
    });
    return { xAxis, yAxis, unit: payload.unit || '', max_limit: payload.max_limit };
  };

  const normalizedConsumption = normalizeAxes(consumptionData);
  const normalizedSavings = normalizeAxes(savingsData);

  return {
    consumption: {
      'x-axis': normalizedConsumption.xAxis,
      'y-axis': normalizedConsumption.yAxis,
      unit: normalizedConsumption.unit,
      max_limit: normalizedConsumption.max_limit,
    },
    savings: {
      'x-axis': normalizedSavings.xAxis,
      'y-axis': normalizedSavings.yAxis,
      unit: normalizedSavings.unit,
      max_limit: normalizedSavings.max_limit,
    },
    peakMin: {
      consumption_peak: consumptionData.consumption_peak || null,
      consumption_min: consumptionData.consumption_min || null,
    },
    original: { consumption: consumptionData, savings: savingsData },
  };
}

/**
 * Fetches consumption + savings + peak/min in the shape unifiedEnergySlice expects,
 * routing to whichever backend endpoint(s) return correct per-area series for the
 * given scope:
 *  - 2–4 areas, no floor/group scope → dedicated per-area endpoints (real per-area data)
 *  - everything else (0/1 areas, 5+ areas, any floor or group scope) → the unified
 *    combined endpoint
 *
 * @param {object} params
 * @param {number[]|null} params.areaIds
 * @param {number[]|null} params.floorIds
 * @param {(number|string)[]|null} params.groupIds
 * @param {string} params.timeRange
 * @param {string} params.startDate
 * @param {string} params.endDate
 * @param {boolean} params.isNavigating
 * @param {object} params.baseUrlClient - axios-like client with a `.get(url)` method
 *   (e.g. the shared `BaseUrl` instance), injected so this helper stays testable and
 *   free of any direct import cycle back into a specific slice's BaseUrl.
 */
export async function fetchUnifiedEnergyTransformedPayload({
  areaIds,
  floorIds,
  groupIds,
  timeRange,
  startDate,
  endDate,
  isNavigating,
  baseUrlClient,
}) {
  if (!baseUrlClient) {
    throw new Error('fetchUnifiedEnergyTransformedPayload requires a baseUrlClient');
  }

  const params = new URLSearchParams();
  appendLocationParams(params, { areaIds, floorIds, groupIds });
  appendTimeRangeParams(params, { timeRange, startDate, endDate, isNavigating });

  if (shouldUseDedicatedPerAreaEndpoints({ areaIds, floorIds, groupIds })) {
    return fetchViaDedicatedEndpoints(baseUrlClient, params);
  }

  return fetchViaUnifiedEndpoint(baseUrlClient, params, { areaIds, groupIds });
}
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { BaseUrl } from '../../../BaseUrl';
// import { mapTimeRangeToBackend } from '../../../../../shared/dashboard/utils/mapTimeRangeToBackend';
// import { resolveUnifiedEnergyYAxis } from '../../../../../shared/dashboard/utils/normalizeUnifiedEnergyPayload';
import { fetchUnifiedEnergyTransformedPayload } from '../../../../../shared/dashboard/utils/fetchUnifiedEnergyPayload';

// Helper function to extract error message from error response
const extractErrorMessage = (error) => {
  if (!error) return 'An unknown error occurred';
  if (typeof error === 'string') return error;

  if (error && typeof error === 'object') {
    if (Array.isArray(error)) {
      return error.map((err) => err.msg || err.message || JSON.stringify(err)).join(', ');
    }
    if (error.detail) {
      if (Array.isArray(error.detail)) {
        return error.detail.map((err) => err.msg || err.message || JSON.stringify(err)).join(', ');
      }
      return error.detail;
    }
    if (error.message) return error.message;
    if (error.msg) return error.msg;
    if (error.statusText) return error.statusText;
    if (error.status) return `HTTP ${error.status}: ${error.statusText || 'Request failed'}`;
    return JSON.stringify(error);
  }
  return 'An unknown error occurred';
};

// Data cache to store API responses for consistent data
const dataCache = new Map();

const generateCacheKey = (areaIds, floorIds, timeRange, startDate, endDate) => {
  const sortedAreaIds = areaIds ? [...areaIds].sort().join(',') : 'all';
  const sortedFloorIds = floorIds ? [...floorIds].sort().join(',') : 'all';
  return `${sortedAreaIds}_${sortedFloorIds}_${timeRange}_${startDate}_${endDate}`;
};

const getCachedData = (cacheKey) => {
  const cached = dataCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 300000) {
    return cached.data;
  }
  return null;
};

const setCachedData = (cacheKey, data) => {
  dataCache.set(cacheKey, { data, timestamp: Date.now() });
};

export const fetchUnifiedEnergyConsumptionSavingsData = createAsyncThunk(
  'unifiedEnergy/fetchUnifiedEnergyConsumptionSavingsData',
  async (
    { areaIds, floorIds, timeRange, startDate, endDate, isNavigating, forceRefresh = false },
    { rejectWithValue }
  ) => {
    try {
      const cacheKey = `unified_${generateCacheKey(areaIds, floorIds, timeRange, startDate, endDate)}`;

      if (!isNavigating && !forceRefresh) {
        const cachedData = getCachedData(cacheKey);
        if (cachedData) return cachedData;
      }

      // const params = new URLSearchParams();

      // // If floor is selected, send ONLY floorIds, NOT areaIds
      // if (floorIds && floorIds.length > 0) {
      //   floorIds.forEach((id) => params.append('floor_ids', id));
      // } else if (areaIds && areaIds.length > 0) {
      //   areaIds.forEach((id) => params.append('area_ids', id));
      // }

      // // For navigation flows we use custom range to preserve exact formatting
      // if ((timeRange === 'this-day' || timeRange === 'this-week' || timeRange === 'this-month' || timeRange === 'this-year') && isNavigating) {
      //   params.append('time_range', 'custom');
      //   params.append('start_date', startDate);
      //   params.append('end_date', endDate);
      // } else if (
      //   timeRange === 'custom' &&
      //   startDate &&
      //   endDate &&
      //   startDate.trim &&
      //   startDate.trim() !== '' &&
      //   endDate.trim &&
      //   endDate.trim() !== ''
      // ) {
      //   params.append('time_range', 'custom');
      //   params.append('start_date', startDate);
      //   params.append('end_date', endDate);
      // } else {
      //   params.append('time_range', mapTimeRangeToBackend(timeRange));
      // }

            const transformedResponse = await fetchUnifiedEnergyTransformedPayload({
        areaIds,
        floorIds,
        groupIds: [],
        timeRange,
        startDate,
        endDate,
        isNavigating,
        baseUrlClient: BaseUrl,
      });
      
   

      if (!isNavigating) {
        setCachedData(cacheKey, transformedResponse);
      }

      return transformedResponse;
    } catch (error) {
      const errorMessage = extractErrorMessage(
        error.response?.data || error
      );
      return rejectWithValue(errorMessage);
    }
  }
);

      // const response = await BaseUrl.get(`/dashboard/unified_energy_consumption_savings_data?${params}`);

      // const unifiedData = response.data || {};

      // const convertNullStrings = (arr) => {
      //   if (!Array.isArray(arr)) return arr;
      //   return arr.map((val) => (val === 'null' || val === null || val === undefined ? null : val));
      // };

      // // Helper function to convert consumption_data/savings_data object to y-axis format
      // const convertDataObjectToYAxis = (dataObj) => {
      //   if (!dataObj || typeof dataObj !== 'object') return {};
      //   const yAxis = {};
      //   Object.keys(dataObj).forEach((key) => {
      //     if (Array.isArray(dataObj[key])) {
      //       yAxis[key] = convertNullStrings(dataObj[key]);
      //     }
      //   });
      //   return yAxis;
      // };

      // // Determine consumption data format
      // let consumptionYAxis = {};
      // if (unifiedData.consumption_data && typeof unifiedData.consumption_data === 'object') {
      //   consumptionYAxis = resolveUnifiedEnergyYAxis(unifiedData.consumption_data, {
      //     fallbackLabel: unifiedData.consumption_chart_name || 'Consumption',
      //     requestedKeys: (areaIds || []).map(String),
      //   });
      // } else {
      //   // No consumption_data, use consumption array
      //   consumptionYAxis = {
      //     [unifiedData.consumption_chart_name || 'Consumption']: convertNullStrings(unifiedData.consumption || [])
      //   };
      // }

      // const consumptionData = {
      //   'x-axis': unifiedData['x-axis'] || unifiedData.x_axis || [],
      //   'y-axis': consumptionYAxis,
      //   unit: unifiedData.unit || '',
      //   max_limit: unifiedData.max_limit
      // };

      // // Determine savings data format
      // let savingsYAxis = {};
      // if (unifiedData.savings_data && typeof unifiedData.savings_data === 'object') {
      //   savingsYAxis = resolveUnifiedEnergyYAxis(unifiedData.savings_data, {
      //     fallbackLabel: unifiedData.savings_chart_name || 'Savings',
      //     requestedKeys: (areaIds || []).map(String),
      //   });
      // } else {
      //   // No savings_data, use savings array
      //   savingsYAxis = {
      //     [unifiedData.savings_chart_name || 'Savings']: convertNullStrings(unifiedData.savings || [])
      //   };
      // }

      // const savingsData = {
      //   'x-axis': unifiedData['x-axis'] || unifiedData.x_axis || [],
      //   'y-axis': savingsYAxis,
      //   unit: unifiedData.unit || '',
      //   max_limit: unifiedData.max_limit
      // };

      // const peakMinData = {
      //   consumption_peak: unifiedData.consumption_peak || null,
      //   consumption_min: unifiedData.consumption_min || null
      // };

      // const transformedResponse = {
      //   consumption: consumptionData,
      //   savings: savingsData,
      //   peakMin: peakMinData,
      //   original: unifiedData
      // };

      // if (!isNavigating) {
      //   setCachedData(cacheKey, transformedResponse);
      // }

      // return transformedResponse;


const initialState = {
  energyConsumption: null,
  energySavings: null,
  peakMinConsumption: null,
  energyConsumptionLoading: false,
  energySavingsLoading: false,
  peakMinConsumptionLoading: false,
  error: null
};

const unifiedEnergySlice = createSlice({
  name: 'unifiedEnergy',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUnifiedEnergyConsumptionSavingsData.pending, (state) => {
        state.energyConsumptionLoading = true;
        state.energySavingsLoading = true;
        state.peakMinConsumptionLoading = true;
        state.error = null;
      })
      .addCase(fetchUnifiedEnergyConsumptionSavingsData.fulfilled, (state, action) => {
        if (action.payload?.consumption) state.energyConsumption = action.payload.consumption;
        if (action.payload?.savings) state.energySavings = action.payload.savings;
        if (action.payload?.peakMin) state.peakMinConsumption = action.payload.peakMin;

        state.energyConsumptionLoading = false;
        state.energySavingsLoading = false;
        state.peakMinConsumptionLoading = false;
        state.error = null;
      })
      .addCase(fetchUnifiedEnergyConsumptionSavingsData.rejected, (state, action) => {
        state.energyConsumptionLoading = false;
        state.energySavingsLoading = false;
        state.peakMinConsumptionLoading = false;
        state.error = action.payload || 'Failed to fetch unified energy consumption savings data';
      });
  }
});

// Selectors
export const selectUnifiedEnergyConsumption = (state) => state.unifiedEnergy.energyConsumption;
export const selectUnifiedEnergySavings = (state) => state.unifiedEnergy.energySavings;
export const selectUnifiedPeakMinConsumption = (state) => state.unifiedEnergy.peakMinConsumption;
export const selectUnifiedEnergyConsumptionLoading = (state) => state.unifiedEnergy.energyConsumptionLoading;
export const selectUnifiedEnergySavingsLoading = (state) => state.unifiedEnergy.energySavingsLoading;
export const selectUnifiedPeakMinConsumptionLoading = (state) => state.unifiedEnergy.peakMinConsumptionLoading;
export const selectUnifiedEnergyError = (state) => state.unifiedEnergy.error;

export default unifiedEnergySlice.reducer;


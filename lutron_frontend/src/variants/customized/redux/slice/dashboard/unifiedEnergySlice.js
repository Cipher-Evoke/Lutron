import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { BaseUrl } from '../../../BaseUrl';
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

const generateCacheKey = (areaIds, floorIds, timeRange, startDate, endDate, groupIds) => {
  const sortedAreaIds = areaIds ? [...areaIds].sort().join(',') : 'all';
  const sortedFloorIds = floorIds ? [...floorIds].sort().join(',') : 'all';
  const sortedGroupIds = groupIds && groupIds.length > 0 ? [...groupIds].map(String).sort().join(',') : 'all';
  return `${sortedAreaIds}_${sortedFloorIds}_${sortedGroupIds}_${timeRange}_${startDate}_${endDate}`;
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

const withDefaultDashboardLocationScope = (getState, { areaIds, floorIds, groupIds }) => {
  const hasScope =
    (floorIds && floorIds.length > 0) ||
    (areaIds && areaIds.length > 0) ||
    (groupIds && groupIds.length > 0);
  if (hasScope) {
    return { areaIds, floorIds, groupIds };
  }
  const floors = getState().floor?.floors;
  if (!Array.isArray(floors) || floors.length === 0) {
    return { areaIds, floorIds, groupIds };
  }
  const sorted = [...floors].sort(
    (a, b) => Number(a?.id ?? 0) - Number(b?.id ?? 0)
  );
  const firstId = sorted[0]?.id;
  return {
    areaIds,
    floorIds: firstId != null ? [firstId] : [],
    groupIds,
  };
};

export const fetchUnifiedEnergyConsumptionSavingsData = createAsyncThunk(
  'unifiedEnergy/fetchUnifiedEnergyConsumptionSavingsData',
  async (
    { areaIds, floorIds, groupIds, timeRange, startDate, endDate, isNavigating, forceRefresh = false },
    { rejectWithValue }
  ) => {
    try {
      const cacheKey = `unified_${generateCacheKey(areaIds, floorIds, timeRange, startDate, endDate, groupIds)}`;

      if (!isNavigating && !forceRefresh) {
        const cachedData = getCachedData(cacheKey);
        if (cachedData) return cachedData;
      }

      const transformedResponse = await fetchUnifiedEnergyTransformedPayload({
        areaIds,
        floorIds,
        groupIds,
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
      const errorMessage = extractErrorMessage(error.response?.data || error);
      return rejectWithValue(errorMessage);
    }
  }
);

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


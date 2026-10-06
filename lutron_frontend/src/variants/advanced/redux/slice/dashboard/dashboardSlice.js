import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { fetchFloors, getLeafByFloorID } from '../floor/floorSlice';
import { BaseUrl } from '../../../BaseUrl';
import { coalesceDashboardHttpGet } from '../../../../../shared/dashboard/utils/coalesceDashboardHttpGet';
import { mapTimeRangeToBackend, mapTimeRangeToBackendForSavings } from '../../../../../shared/dashboard/utils/mapTimeRangeToBackend';

// Helper function to extract error message from error response
const extractErrorMessage = (error) => {
  // Handle null or undefined
  if (!error) return 'An unknown error occurred';

  // Handle string errors
  if (typeof error === 'string') return error;

  // Handle validation error objects
  if (error && typeof error === 'object') {
    // If it's an array of validation errors
    if (Array.isArray(error)) {
      return error.map(err => err.msg || err.message || JSON.stringify(err)).join(', ');
    }

    // If it has a detail property
    if (error.detail) {
      if (Array.isArray(error.detail)) {
        return error.detail.map(err => err.msg || err.message || JSON.stringify(err)).join(', ');
      }
      return error.detail;
    }

    // If it has a message property
    if (error.message) return error.message;

    // If it has msg property (common in validation errors)
    if (error.msg) return error.msg;

    // If it has a statusText property (HTTP error)
    if (error.statusText) return error.statusText;

    // If it has a status property (HTTP status code)
    if (error.status) return `HTTP ${error.status}: ${error.statusText || 'Request failed'}`;

    // Fallback to stringifying the object
    return JSON.stringify(error);
  }

  return 'An unknown error occurred';
};

const isCanceledRequest = (action) => {
  const message = String(action?.payload || action?.error?.message || '');
  return (
    action?.error?.name === 'CanceledError' ||
    action?.error?.code === 'ERR_CANCELED' ||
    /cancel|abort/i.test(message)
  );
};

// Helper: extract filename from Content-Disposition header
const extractFilename = (contentDisposition) => {
  try {
    if (!contentDisposition) return null;
    // e.g. attachment; filename="occupancy_by_group_this_day.csv"
    const match = contentDisposition.match(/filename\*=UTF-8''([^;\n]+)|filename="?([^";\n]+)"?/i);
    return decodeURIComponent(match?.[1] || match?.[2] || '').trim() || null;
  } catch {
    return null;
  }
};

// Helper: robust blob download that surfaces JSON errors
const downloadBlobOrThrow = async (response, fallbackFilename) => {
  const contentType = response.headers?.['content-type'] || '';
  const contentDisposition = response.headers?.['content-disposition'] || '';
  const blob = response.data;

  // If server returned JSON (likely an error), read and throw
  if (typeof blob?.type === 'string' && blob.type.includes('application/json') || contentType.includes('application/json')) {
    try {
      // Handle both Blob and ArrayBuffer cases
      let text;
      if (blob instanceof Blob) {
        text = await blob.text();
      } else if (blob instanceof ArrayBuffer) {
        text = new TextDecoder().decode(blob);
      } else {
        text = String(blob);
      }

      const json = JSON.parse(text);
      const message = json?.message || json?.detail || JSON.stringify(json);
      throw new Error(message || 'Download failed');
    } catch (e) {
      // If JSON parse fails, still throw generic error
      throw new Error(e?.message || 'Download failed');
    }
  }

  const url = window.URL.createObjectURL(blob instanceof Blob ? blob : new Blob([blob]));
  const link = document.createElement('a');
  link.href = url;
  const headerFilename = extractFilename(contentDisposition);
  link.setAttribute('download', headerFilename || fallbackFilename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// Data cache to store API responses for consistent data
const dataCache = new Map();

// Helper function to generate cache key
const generateCacheKey = (areaIds, floorIds, timeRange, startDate, endDate) => {
  const sortedAreaIds = areaIds ? [...areaIds].sort().join(',') : 'all';
  const sortedFloorIds = floorIds ? [...floorIds].sort().join(',') : 'all';
  const key = `${sortedAreaIds}_${sortedFloorIds}_${timeRange}_${startDate}_${endDate}`;
  return key;
};

// Helper function to get cached data
const getCachedData = (cacheKey) => {
  const cached = dataCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes cache
    return cached.data;
  }
  return null;
};

// Helper function to set cached data
const setCachedData = (cacheKey, data) => {
  dataCache.set(cacheKey, {
    data: data,
    timestamp: Date.now()
  });
};

// Helper function to clear cache
const clearDataCacheHelper = () => {
  dataCache.clear();
};

// Redux action creator to clear data cache
export const clearDataCache = createAsyncThunk(
  'dashboard/clearDataCache',
  async (_, { dispatch }) => {
    clearDataCacheHelper();
    return true;
  }
);

// Helper function to generate proper date format for filenames
const generateDateString = (timeRange, startDate, endDate) => {
  // If we have specific dates (from navigation), use them
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return `${start.toISOString().split('T')[0]}_to_${end.toISOString().split('T')[0]}`;
  }

  // Fall back to current date for predefined time ranges
  const now = new Date();

  if (timeRange === 'custom') {
    return now.toISOString().split('T')[0]; // fallback to today
  }

  switch (timeRange) {
    case 'this-day':
      return now.toISOString().split('T')[0]; // YYYY-MM-DD
    case 'this-week':
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `${startOfWeek.toISOString().split('T')[0]}_to_${endOfWeek.toISOString().split('T')[0]}`;
    case 'this-month':
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
    case 'this-year':
      // Since backend doesn't support this_year for most endpoints, we'll use month format
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
    default:
      return now.toISOString().split('T')[0]; // fallback to today
  }
};

// Async thunks for energy data
export const fetchEnergyConsumption = createAsyncThunk(
  'dashboard/fetchEnergyConsumption',
  async ({ areaIds, floorIds, timeRange, startDate, endDate, isNavigating }, { rejectWithValue }) => {
    try {
      const requestId = Math.random().toString(36).substr(2, 9);

      // Removed console logs to prevent flickering and performance issues

      // Generate cache key
      const cacheKey = generateCacheKey(areaIds, floorIds, timeRange, startDate, endDate);

      // Skip cache for navigation calls to ensure fresh data
      let cachedData = null;
      if (!isNavigating) {
        cachedData = getCachedData(cacheKey);
        if (cachedData) {
          return cachedData;
        }
      }

      const params = new URLSearchParams();
      // CORRECT LOGIC: If floor is selected, send ONLY floorIds, NOT areaIds
      if (floorIds && floorIds.length > 0) {
        floorIds.forEach(id => params.append('floor_ids', id));
      } else if (areaIds && areaIds.length > 0) {
        areaIds.forEach(id => params.append('area_ids', id));
      }

      // For this-day navigation, use custom date range to get 96-point format for the correct day
      if (timeRange === 'this-day' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-week navigation, use custom date range to get date format (31/8 6, 1/9 6, etc.)
      else if (timeRange === 'this-week' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-month navigation, use custom date range to get daily format (1/8, 2/8, etc.)
      else if (timeRange === 'this-month' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-year navigation, use custom date range to get the correct year data
      else if (timeRange === 'this-year' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // Use custom date range only when explicitly custom AND we have valid dates, otherwise use predefined time range
      else if (timeRange === 'custom' && startDate && endDate && startDate.trim && startDate.trim() !== '' && endDate.trim && endDate.trim() !== '') {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      } else {
        // Use predefined time range (this_day, this_week, etc.) - shows full representation
        const backendTimeRange = mapTimeRangeToBackend(timeRange);
        params.append('time_range', backendTimeRange);
      }



      // Removed console logs to prevent flickering and performance issues

      const response = await BaseUrl.get(`/dashboard/energy_consumption?${params}`);

      // Only cache non-navigation responses to avoid stale data
      if (!isNavigating) {
        setCachedData(cacheKey, response.data);
      }

      // Always return fresh data, never cached data for navigation
      return response.data;
    } catch (error) {
      const errorMessage = extractErrorMessage(error.response?.data || error);
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchEnergySavings = createAsyncThunk(
  'dashboard/fetchEnergySavings',
  async ({ areaIds, floorIds, timeRange, startDate, endDate, isNavigating }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      // CORRECT LOGIC: If floor is selected, send ONLY floorIds, NOT areaIds
      if (floorIds && floorIds.length > 0) {
        floorIds.forEach(id => params.append('floor_ids', id));
      } else if (areaIds && areaIds.length > 0) {
        areaIds.forEach(id => params.append('area_ids', id));
      }

      // For this-day navigation, use custom date range to get 96-point format for the correct day
      if (timeRange === 'this-day' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-week navigation, use custom date range to get date format (31/8 6, 1/9 6, etc.)
      else if (timeRange === 'this-week' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-month navigation, use custom date range to get daily format (1/8, 2/8, etc.)
      else if (timeRange === 'this-month' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-year navigation, use custom date range to get the correct year data
      else if (timeRange === 'this-year' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // Use custom date range only when explicitly custom AND we have valid dates, otherwise use predefined time range
      else if (timeRange === 'custom' && startDate && endDate && startDate.trim && startDate.trim() !== '' && endDate.trim && endDate.trim() !== '') {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      } else {
        // Use predefined time range (this_day, this_week, etc.) - shows full representation
        const backendTimeRange = mapTimeRangeToBackend(timeRange);
        params.append('time_range', backendTimeRange);
      }

      const response = await BaseUrl.get(`/dashboard/energy_savings?${params}`);
      return response.data;
    } catch (error) {
      const errorMessage = extractErrorMessage(error.response?.data || error);
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchPeakMinConsumption = createAsyncThunk(
  'dashboard/fetchPeakMinConsumption',
  async ({ areaIds, floorIds, timeRange, startDate, endDate, isNavigating }, { rejectWithValue }) => {
    try {
      const requestId = Math.random().toString(36).substr(2, 9);

      // Generate cache key for peak/min data
      const cacheKey = `peakmin_${generateCacheKey(areaIds, floorIds, timeRange, startDate, endDate)}`;

      // Check cache first
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      const params = new URLSearchParams();
      // CORRECT LOGIC: If floor is selected, send ONLY floorIds, NOT areaIds
      if (floorIds && floorIds.length > 0) {
        floorIds.forEach(id => params.append('floor_ids', id));
      } else if (areaIds && areaIds.length > 0) {
        areaIds.forEach(id => params.append('area_ids', id));
      }

      // For this-day navigation, use custom date range to get 96-point format for the correct day
      if (timeRange === 'this-day' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-week navigation, use custom date range to get date format (31/8 6, 1/9 6, etc.)
      else if (timeRange === 'this-week' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-month navigation, use custom date range to get daily format (1/8, 2/8, etc.)
      else if (timeRange === 'this-month' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-year navigation, use custom date range to get the correct year data
      else if (timeRange === 'this-year' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // Use custom date range only when explicitly custom AND we have valid dates, otherwise use predefined time range
      else if (timeRange === 'custom' && startDate && endDate && startDate.trim && startDate.trim() !== '' && endDate.trim && endDate.trim() !== '') {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      } else {
        // Use predefined time range (this_day, this_week, etc.) - shows full representation
        const backendTimeRange = mapTimeRangeToBackend(timeRange);
        params.append('time_range', backendTimeRange);
      }

      const response = await BaseUrl.get(`/dashboard/peak_min_consumption?${params}`);

      // Cache the response
      setCachedData(cacheKey, response.data);

      return response.data;
    } catch (error) {
      const errorMessage = extractErrorMessage(error.response?.data || error);
      return rejectWithValue(errorMessage);
    }
  }
);

// Add new async thunk for total consumption by group
export const fetchTotalConsumptionByGroup = createAsyncThunk(
  'dashboard/fetchTotalConsumptionByGroup',
  async ({ areaIds, floorIds, timeRange, startDate, endDate, isNavigating }, { rejectWithValue }) => {
    try {
      // Respect Energy dashboard area/floor filter (same as other energy charts).
      const cacheKey = `totalconsumption_${generateCacheKey(areaIds, floorIds, timeRange, startDate, endDate)}`;

      // Check cache first (but skip cache for debugging)
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      const params = new URLSearchParams();
      // Match other energy charts: floor selection sends floor_ids; otherwise area_ids.
      if (floorIds && floorIds.length > 0) {
        floorIds.forEach((id) => params.append('floor_ids', id));
      } else if (areaIds && areaIds.length > 0) {
        areaIds.forEach((id) => params.append('area_ids', id));
      }

      // Removed console logs for cleaner production code

      // For this-day navigation, use custom date range to get 96-point format for the correct day
      if (timeRange === 'this-day' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-week navigation, use custom date range to get date format (31/8 6, 1/9 6, etc.)
      else if (timeRange === 'this-week' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-month navigation, use custom date range to get daily format (1/8, 2/8, etc.)
      else if (timeRange === 'this-month' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-year navigation, use custom date range to get the correct year data
      else if (timeRange === 'this-year' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // Use custom date range only when explicitly custom AND we have valid dates, otherwise use predefined time range
      else if (timeRange === 'custom' && startDate && endDate && startDate.trim && startDate.trim() !== '' && endDate.trim && endDate.trim() !== '') {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      } else {
        // Use predefined time range (this_day, this_week, etc.) - shows full representation
        const backendTimeRange = mapTimeRangeToBackend(timeRange);
        params.append('time_range', backendTimeRange);
      }

      // Removed cache-busting parameter to improve performance

      const url = `/dashboard/total_consumption/by_group?${params}`;
      // Removed console logs for cleaner production code

      const response = await coalesceDashboardHttpGet(BaseUrl, url);

      // Removed console logs for cleaner production code

      // Cache the response
      setCachedData(cacheKey, response.data);

      return response.data;
    } catch (error) {
      const errorMessage = extractErrorMessage(error.response?.data || error);
      return rejectWithValue(errorMessage);
    }
  }
);

// Add new async thunk for light power density
export const fetchLightPowerDensity = createAsyncThunk(
  'dashboard/fetchLightPowerDensity',
  async ({ areaIds, floorIds, timeRange, startDate, endDate, isNavigating }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      // CORRECT LOGIC: If floor is selected, send ONLY floorIds, NOT areaIds
      if (floorIds && floorIds.length > 0) {
        floorIds.forEach(id => params.append('floor_ids', id));
      } else if (areaIds && areaIds.length > 0) {
        areaIds.forEach(id => params.append('area_ids', id));
      }

      // For this-day navigation, use custom date range to get 96-point format for the correct day
      if (timeRange === 'this-day' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-week navigation, use custom date range to get date format (31/8 6, 1/9 6, etc.)
      else if (timeRange === 'this-week' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-month navigation, use custom date range to get daily format (1/8, 2/8, etc.)
      else if (timeRange === 'this-month' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-year navigation, use custom date range to get the correct year data
      else if (timeRange === 'this-year' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // Use custom date range only when explicitly custom AND we have valid dates, otherwise use predefined time range
      else if (timeRange === 'custom' && startDate && endDate && startDate.trim && startDate.trim() !== '' && endDate.trim && endDate.trim() !== '') {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      } else {
        // Use predefined time range (this_day, this_week, etc.) - shows full representation
        const backendTimeRange = mapTimeRangeToBackend(timeRange);
        params.append('time_range', backendTimeRange);
      }

      const response = await coalesceDashboardHttpGet(BaseUrl, `/dashboard/light_power_density?${params}`);
      return response.data;
    } catch (error) {
      const errorMessage = extractErrorMessage(error.response?.data || error);
      return rejectWithValue(errorMessage);
    }
  }
);

// Add new async thunk for occupancy count
export const fetchOccupancyCount = createAsyncThunk(
  'dashboard/fetchOccupancyCount',
  async ({ areaIds, floorIds, timeRange, startDate, endDate, isNavigating }, { rejectWithValue }) => {
    try {
      // Removed console logs to prevent flickering and performance issues

      const params = new URLSearchParams();
      // CORRECT LOGIC: If floor is selected, send ONLY floorIds, NOT areaIds
      if (floorIds && floorIds.length > 0) {
        floorIds.forEach(id => params.append('floor_ids', id));
      } else if (areaIds && areaIds.length > 0) {
        areaIds.forEach(id => params.append('area_ids', id));
      }

      // For this-day navigation, use custom date range to get 96-point format for the correct day
      if (timeRange === 'this-day' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-week navigation, use custom date range to get date format (31/8 6, 1/9 6, etc.)
      else if (timeRange === 'this-week' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-month navigation, use custom date range to get daily format (1/8, 2/8, etc.)
      else if (timeRange === 'this-month' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-year navigation, use custom date range to get the correct year data
      else if (timeRange === 'this-year' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // Use custom date range only when explicitly custom AND we have valid dates, otherwise use predefined time range
      else if (timeRange === 'custom' && startDate && endDate && startDate.trim && startDate.trim() !== '' && endDate.trim && endDate.trim() !== '') {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      } else {
        // Use predefined time range (this_day, this_week, etc.) - shows full representation
        const backendTimeRange = mapTimeRangeToBackend(timeRange);
        params.append('time_range', backendTimeRange);
      }

      const response = await coalesceDashboardHttpGet(BaseUrl, `/dashboard/occupancy_count?${params}`);
      return response.data;
    } catch (error) {
      const errorMessage = extractErrorMessage(error.response?.data || error);
      return rejectWithValue(errorMessage);
    }
  }
);

// Add new async thunk for instant occupancy count
export const fetchInstantOccupancyCount = createAsyncThunk(
  'dashboard/fetchInstantOccupancyCount',
  async ({ areaIds, floorIds, timeRange, startDate, endDate, isNavigating }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      // CORRECT LOGIC: If floor is selected, send ONLY floorIds, NOT areaIds
      if (floorIds && floorIds.length > 0) {
        floorIds.forEach(id => params.append('floor_ids', id));
      } else if (areaIds && areaIds.length > 0) {
        areaIds.forEach(id => params.append('area_ids', id));
      }

      // For this-day navigation, use custom date range to get 96-point format for the correct day
      if (timeRange === 'this-day' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-week navigation, use custom date range to get date format (31/8 6, 1/9 6, etc.)
      else if (timeRange === 'this-week' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-month navigation, use custom date range to get daily format (1/8, 2/8, etc.)
      else if (timeRange === 'this-month' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-year navigation, use custom date range to get the correct year data
      else if (timeRange === 'this-year' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // Use custom date range only when explicitly custom AND we have valid dates, otherwise use predefined time range
      else if (timeRange === 'custom' && startDate && endDate && startDate.trim && startDate.trim() !== '' && endDate.trim && endDate.trim() !== '') {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      } else {
        // Use predefined time range (this_day, this_week, etc.) - shows full representation
        const backendTimeRange = mapTimeRangeToBackend(timeRange);
        params.append('time_range', backendTimeRange);
      }

      params.append('_', String(Date.now()));
      const response = await BaseUrl.get(`/dashboard/instant_occupancy_count?${params}`);
      return response.data;
    } catch (error) {
      const errorMessage = extractErrorMessage(error.response?.data || error);
      return rejectWithValue(errorMessage);
    }
  }
);

// Add new async thunk for occupancy by group from logs
export const fetchOccupancyByGroupFromLogs = createAsyncThunk(
  'dashboard/fetchOccupancyByGroupFromLogs',
  async ({ areaIds, floorIds, timeRange, startDate, endDate, isNavigating }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      // CORRECT LOGIC: If floor is selected, send ONLY floorIds, NOT areaIds
      if (floorIds && floorIds.length > 0) {
        floorIds.forEach(id => params.append('floor_ids', id));
      } else if (areaIds && areaIds.length > 0) {
        areaIds.forEach(id => params.append('area_ids', id));
      }

      // For this-day navigation, use custom date range
      if (timeRange === 'this-day' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-week navigation, use custom date range
      else if (timeRange === 'this-week' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-month navigation, use custom date range
      else if (timeRange === 'this-month' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-year navigation, use custom date range
      else if (timeRange === 'this-year' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // Use custom date range only when explicitly custom AND we have valid dates, otherwise use predefined time range
      else if (timeRange === 'custom' && startDate && endDate && startDate.trim && startDate.trim() !== '' && endDate.trim && endDate.trim() !== '') {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      } else {
        // Use predefined time range (this_day, this_week, etc.)
        const backendTimeRange = mapTimeRangeToBackend(timeRange);
        params.append('time_range', backendTimeRange);
      }

      const response = await coalesceDashboardHttpGet(BaseUrl, `/dashboard/occupancy_by_group_from_logs?${params}`);
      return response.data;
    } catch (error) {
      const errorMessage = extractErrorMessage(error.response?.data || error);
      return rejectWithValue(errorMessage);
    }
  }
);

// Add new async thunk for space utilization per area from logs
export const fetchSpaceUtilizationPerFromLogs = createAsyncThunk(
  'dashboard/fetchSpaceUtilizationPerFromLogs',
  async ({ areaIds, floorIds, timeRange, startDate, endDate, isNavigating }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      // CORRECT LOGIC: If floor is selected, send ONLY floorIds, NOT areaIds
      if (floorIds && floorIds.length > 0) {
        floorIds.forEach(id => params.append('floor_ids', id));
      } else if (areaIds && areaIds.length > 0) {
        areaIds.forEach(id => params.append('area_ids', id));
      }

      // For this-day navigation, use custom date range
      if (timeRange === 'this-day' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-week navigation, use custom date range
      else if (timeRange === 'this-week' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-month navigation, use custom date range
      else if (timeRange === 'this-month' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-year navigation, use custom date range
      else if (timeRange === 'this-year' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // Use custom date range only when explicitly custom AND we have valid dates, otherwise use predefined time range
      else if (timeRange === 'custom' && startDate && endDate && startDate.trim && startDate.trim() !== '' && endDate.trim && endDate.trim() !== '') {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      } else {
        // Use predefined time range (this_day, this_week, etc.)
        const backendTimeRange = mapTimeRangeToBackend(timeRange);
        params.append('time_range', backendTimeRange);
      }

      const response = await coalesceDashboardHttpGet(BaseUrl, `/dashboard/space_utilization_per_from_logs?${params}`);
      return response.data;
    } catch (error) {
      const errorMessage = extractErrorMessage(error.response?.data || error);
      return rejectWithValue(errorMessage);
    }
  }
);

// Add new async thunk for occupancy by group - Updated to match Dashboard date format
export const fetchOccupancyByGroup = createAsyncThunk(
  'dashboard/fetchOccupancyByGroup',
  async ({ areaIds, floorIds, timeRange, startDate, endDate, isNavigating }, { rejectWithValue }) => {
    try {
      // Removed console logs to prevent flickering and performance issues

      const params = new URLSearchParams();
      // CORRECT LOGIC: If floor is selected, send ONLY floorIds, NOT areaIds
      if (floorIds && floorIds.length > 0) {
        floorIds.forEach(id => params.append('floor_ids', id));
      } else if (areaIds && areaIds.length > 0) {
        areaIds.forEach(id => params.append('area_ids', id));
      }

      // For this-day navigation, use custom date range to get 96-point format for the correct day
      if (timeRange === 'this-day' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-week navigation, use custom date range to get date format (31/8 6, 1/9 6, etc.)
      else if (timeRange === 'this-week' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-month navigation, use custom date range to get daily format (1/8, 2/8, etc.)
      else if (timeRange === 'this-month' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-year navigation, use custom date range to get the correct year data
      else if (timeRange === 'this-year' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // Use custom date range only when explicitly custom AND we have valid dates, otherwise use predefined time range
      else if (timeRange === 'custom' && startDate && endDate && startDate.trim && startDate.trim() !== '' && endDate.trim && endDate.trim() !== '') {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      } else {
        // Use predefined time range (this_day, this_week, etc.) - shows full representation
        const backendTimeRange = mapTimeRangeToBackend(timeRange);
        params.append('time_range', backendTimeRange);
      }

      const response = await coalesceDashboardHttpGet(BaseUrl, `/dashboard/occupancy_by_group?${params}`);

      // Return the response data directly as it already has the correct structure
      return response.data;
    } catch (error) {
      // Error fetching occupancy by group
      const errorMessage = extractErrorMessage(error.response?.data || error);
      return rejectWithValue(errorMessage);
    }
  }
);

// Add new async thunk for space utilization per area
export const fetchSpaceUtilizationPerArea = createAsyncThunk(
  'dashboard/fetchSpaceUtilizationPerArea',
  async ({ areaIds, floorIds, timeRange, startDate, endDate, isNavigating }, { rejectWithValue }) => {
    try {
      // Removed console logs to prevent flickering and performance issues

      // Don't make the API call if no areas are selected
      const params = new URLSearchParams();
      // CORRECT LOGIC: If floor is selected, send ONLY floorIds, NOT areaIds
      if (floorIds && floorIds.length > 0) {
        floorIds.forEach(id => params.append('floor_ids', id));
      } else if (areaIds && areaIds.length > 0) {
        areaIds.forEach(id => params.append('area_ids', id));
      }

      // For this-day navigation, use custom date range to get 96-point format for the correct day
      if (timeRange === 'this-day' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-week navigation, use custom date range to get date format (31/8 6, 1/9 6, etc.)
      else if (timeRange === 'this-week' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-month navigation, use custom date range to get daily format (1/8, 2/8, etc.)
      else if (timeRange === 'this-month' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-year navigation, use custom date range to get the correct year data
      else if (timeRange === 'this-year' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // Use custom date range only when explicitly custom AND we have valid dates, otherwise use predefined time range
      else if (timeRange === 'custom' && startDate && endDate && startDate.trim && startDate.trim() !== '' && endDate.trim && endDate.trim() !== '') {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      } else {
        // Use predefined time range (this_day, this_week, etc.) - shows full representation
        const backendTimeRange = mapTimeRangeToBackend(timeRange);
        params.append('time_range', backendTimeRange);
      }

      const response = await coalesceDashboardHttpGet(BaseUrl, `/dashboard/space_utilization_per?${params}`);
      return response.data;
    } catch (error) {
      // Error fetching space utilization per area
      const errorMessage = extractErrorMessage(error.response?.data || error);
      return rejectWithValue(errorMessage);
    }
  }
);

// Commented out - not using peak min max API for space utilization
// export const fetchPeakMinOccupancy = createAsyncThunk(
//   'dashboard/fetchPeakMinOccupancy',
//   async (params, { rejectWithValue }) => {
//     try {
//       const queryParams = new URLSearchParams();
//       // CORRECT LOGIC: If floor is selected, send ONLY floorIds, NOT areaIds
//       if (params.floorIds && params.floorIds.length > 0) {
//         params.floorIds.forEach(id => queryParams.append('floor_ids', id));
//       } else if (params.areaIds && params.areaIds.length > 0) {
//         params.areaIds.forEach(id => queryParams.append('area_ids', id));
//       }
//       
//       // Use predefined time range if it's not custom, otherwise use custom dates
//       if (params.timeRange === 'custom' && params.startDate && params.endDate && 
//           params.startDate.trim && params.startDate.trim() !== '' && params.endDate.trim && params.endDate.trim() !== '') {
//         queryParams.append('time_range', 'custom');
//         queryParams.append('start_date', params.startDate);
//         queryParams.append('end_date', params.endDate);
//       } else if (params.timeRange) {
//         // Use predefined time range (this_day, this_week, etc.)
//         const backendTimeRange = mapTimeRangeToBackend(params.timeRange);
//         queryParams.append('time_range', backendTimeRange);
//       }
//
//       const response = await BaseUrl.get(`/dashboard/peak_min_occupancy?${queryParams}`);
//       return response.data;
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.detail || 'Failed to fetch peak/min occupancy');
//     }
//   }
// );

// Add new async thunk for savings by strategy
export const fetchSavingsByStrategy = createAsyncThunk(
  'dashboard/fetchSavingsByStrategy',
  async ({ areaIds, floorIds, timeRange, startDate, endDate, isNavigating }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      // CORRECT LOGIC: If floor is selected, send ONLY floorIds, NOT areaIds
      if (floorIds && floorIds.length > 0) {
        floorIds.forEach(id => params.append('floor_ids', id));
      } else if (areaIds && areaIds.length > 0) {
        areaIds.forEach(id => params.append('area_ids', id));
      }

      // For this-day navigation, use custom date range to get 96-point format for the correct day
      if (timeRange === 'this-day' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-week navigation, use custom date range to get date format (31/8 6, 1/9 6, etc.)
      else if (timeRange === 'this-week' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-month navigation, use custom date range to get daily format (1/8, 2/8, etc.)
      else if (timeRange === 'this-month' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // Use custom date range only when explicitly custom AND we have valid dates, otherwise use predefined time range
      else if (timeRange === 'custom' && startDate && endDate && startDate.trim && startDate.trim() !== '' && endDate.trim && endDate.trim() !== '') {
        params.append('time_range', 'custom');
        // Format date as ISO string for backend
        const formattedStartDate = new Date(startDate).toISOString();
        params.append('start_date', formattedStartDate);
        const formattedEndDate = new Date(endDate).toISOString();
        params.append('end_date', formattedEndDate);
      } else {
        // Use predefined time range (this_day, this_week, etc.) - shows full representation
        const backendTimeRange = mapTimeRangeToBackendForSavings(timeRange);
        params.append('time_range', backendTimeRange);
      }

      const response = await coalesceDashboardHttpGet(BaseUrl, `/dashboard/saving_by_stratergy?${params}`);

      // Check if the response has data
      if (response.data && response.data.status === 'success') {
        return response.data;
      } else if (response.data && response.data.status === 'error') {
        return { status: 'success', data: {} };
      } else {
        return { status: 'success', data: {} };
      }
    } catch (error) {
      const errorMessage = extractErrorMessage(error.response?.data || error);
      return rejectWithValue(errorMessage);
    }
  }
);

// Fetch area groups for grouping consumption data
export const fetchAreaGroups = createAsyncThunk(
  'dashboard/fetchAreaGroups',
  async (_, { rejectWithValue }) => {
    try {
      const response = await BaseUrl.get('/area_group/list');
      return response.data;
    } catch (error) {
      const errorMessage = extractErrorMessage(error.response?.data || error);
      return rejectWithValue(errorMessage);
    }
  }
);

// Download functions for all charts
export const downloadEnergyConsumption = createAsyncThunk(
  'dashboard/downloadEnergyConsumption',
  async ({ areaIds, floorIds, timeRange, startDate, endDate, isNavigating }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      // CORRECT LOGIC: If floor is selected, send ONLY floorIds, NOT areaIds
      if (floorIds && floorIds.length > 0) {
        floorIds.forEach(id => params.append('floor_ids', id));
      } else if (areaIds && areaIds.length > 0) {
        areaIds.forEach(id => params.append('area_ids', id));
      }

      // For this-day navigation, use custom date range to get 96-point format for the correct day
      if (timeRange === 'this-day' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-week navigation, use custom date range to get date format (31/8 6, 1/9 6, etc.)
      else if (timeRange === 'this-week' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // Use custom date range only when explicitly custom, otherwise use predefined time range
      else if (timeRange === 'custom' || (isNavigating && startDate && endDate)) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      } else {
        // Use predefined time range (this_day, this_week, etc.) - shows full representation
        const backendTimeRange = mapTimeRangeToBackend(timeRange);
        params.append('time_range', backendTimeRange);
      }

      const response = await BaseUrl.get(`/exports/energy_consumption/download?${params}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const dateString = generateDateString(timeRange, startDate, endDate);
      link.setAttribute('download', `energy_consumption_${dateString}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      const errorMessage = extractErrorMessage(error.response?.data || error);
      return rejectWithValue(errorMessage);
    }
  }
);

export const downloadEnergySavings = createAsyncThunk(
  'dashboard/downloadEnergySavings',
  async ({ areaIds, floorIds, timeRange, startDate, endDate, isNavigating }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      // CORRECT LOGIC: If floor is selected, send ONLY floorIds, NOT areaIds
      if (floorIds && floorIds.length > 0) {
        floorIds.forEach(id => params.append('floor_ids', id));
      } else if (areaIds && areaIds.length > 0) {
        areaIds.forEach(id => params.append('area_ids', id));
      }

      // For this-day navigation, use custom date range to get 96-point format for the correct day
      if (timeRange === 'this-day' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-week navigation, use custom date range to get date format (31/8 6, 1/9 6, etc.)
      else if (timeRange === 'this-week' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // Use custom date range only when explicitly custom, otherwise use predefined time range
      else if (timeRange === 'custom' || (isNavigating && startDate && endDate)) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      } else {
        // Use predefined time range (this_day, this_week, etc.) - shows full representation
        const backendTimeRange = mapTimeRangeToBackend(timeRange);
        params.append('time_range', backendTimeRange);
      }

      const response = await BaseUrl.get(`/exports/energy_savings/download?${params}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const dateString = generateDateString(timeRange, startDate, endDate);
      link.setAttribute('download', `energy_savings_${dateString}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      const errorMessage = extractErrorMessage(error.response?.data || error);
      return rejectWithValue(errorMessage);
    }
  }
);

export const downloadPeakMinConsumption = createAsyncThunk(
  'dashboard/downloadPeakMinConsumption',
  async ({ areaIds, floorIds, timeRange, startDate, endDate, isNavigating = false }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      // CORRECT LOGIC: If floor is selected, send ONLY floorIds, NOT areaIds
      if (floorIds && floorIds.length > 0) {
        floorIds.forEach(id => params.append('floor_ids', id));
      } else if (areaIds && areaIds.length > 0) {
        areaIds.forEach(id => params.append('area_ids', id));
      }

      // For this-day navigation, use custom date range to get 96-point format for the correct day
      if (timeRange === 'this-day' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-week navigation, use custom date range to get date format (31/8 6, 1/9 6, etc.)
      else if (timeRange === 'this-week' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // Use custom date range only when explicitly custom, otherwise use predefined time range
      else if (timeRange === 'custom' || (isNavigating && startDate && endDate)) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      } else {
        // Use predefined time range (this_day, this_week, etc.) - shows full representation
        const backendTimeRange = mapTimeRangeToBackend(timeRange);
        params.append('time_range', backendTimeRange);
      }

      const response = await BaseUrl.get(`/dashboard/peak_min_consumption/download?${params}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const dateString = generateDateString(timeRange, startDate, endDate);
      link.setAttribute('download', `peak_min_consumption_${dateString}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      const errorMessage = extractErrorMessage(error.response?.data || error);
      return rejectWithValue(errorMessage);
    }
  }
);

export const downloadTotalConsumptionByGroup = createAsyncThunk(
  'dashboard/downloadTotalConsumptionByGroup',
  async ({ timeRange, startDate, endDate }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();

      // Use custom date range only when explicitly custom, otherwise use predefined time range
      if (timeRange === 'custom') {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      } else {
        // Use predefined time range (this_day, this_week, etc.) - shows full representation
        const backendTimeRange = mapTimeRangeToBackend(timeRange);
        params.append('time_range', backendTimeRange);
      }

      const response = await BaseUrl.get(`/exports/total_consumption_by_group/download?${params}`, {
        responseType: 'blob'
      });

      const dateString = generateDateString(timeRange, startDate, endDate);
      await downloadBlobOrThrow(response, `total_consumption_by_group_${dateString}.csv`);

      return { success: true };
    } catch (error) {
      // Download API error
      const errorMessage = extractErrorMessage(error.response?.data || error);
      return rejectWithValue(errorMessage);
    }
  }
);

export const downloadOccupancyCount = createAsyncThunk(
  'dashboard/downloadOccupancyCount',
  async ({ areaIds, floorIds, timeRange, startDate, endDate, isNavigating }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      // CORRECT LOGIC: If floor is selected, send ONLY floorIds, NOT areaIds
      if (floorIds && floorIds.length > 0) {
        floorIds.forEach(id => params.append('floor_ids', id));
      } else if (areaIds && areaIds.length > 0) {
        areaIds.forEach(id => params.append('area_ids', id));
      }

      // For this-day navigation, use custom date range to get 96-point format for the correct day
      if (timeRange === 'this-day' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-week navigation, use custom date range to get date format (31/8 6, 1/9 6, etc.)
      else if (timeRange === 'this-week' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // Use custom date range only when explicitly custom, otherwise use predefined time range
      else if (timeRange === 'custom' || (isNavigating && startDate && endDate)) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      } else {
        // Use predefined time range (this_day, this_week, etc.) - shows full representation
        const backendTimeRange = mapTimeRangeToBackend(timeRange);
        params.append('time_range', backendTimeRange);
      }

      const response = await BaseUrl.get(`/exports/occupancy_count/download?${params}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const dateString = generateDateString(timeRange, startDate, endDate);
      link.setAttribute('download', `occupancy_count_${dateString}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      const errorMessage = extractErrorMessage(error.response?.data || error);
      return rejectWithValue(errorMessage);
    }
  }
);

export const downloadInstantOccupancyCount = createAsyncThunk(
  'dashboard/downloadInstantOccupancyCount',
  async ({ areaIds, floorIds, timeRange, startDate, endDate, isNavigating }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      // CORRECT LOGIC: If floor is selected, send ONLY floorIds, NOT areaIds
      if (floorIds && floorIds.length > 0) {
        floorIds.forEach(id => params.append('floor_ids', id));
      } else if (areaIds && areaIds.length > 0) {
        areaIds.forEach(id => params.append('area_ids', id));
      }

      // For this-day navigation, use custom date range to get 96-point format for the correct day
      if (timeRange === 'this-day' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-week navigation, use custom date range to get date format (31/8 6, 1/9 6, etc.)
      else if (timeRange === 'this-week' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // Use custom date range only when explicitly custom, otherwise use predefined time range
      else if (timeRange === 'custom' || (isNavigating && startDate && endDate)) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      } else {
        // Use predefined time range (this_day, this_week, etc.) - shows full representation
        const backendTimeRange = mapTimeRangeToBackend(timeRange);
        params.append('time_range', backendTimeRange);
      }

      const response = await BaseUrl.get(`/exports/instant_occupancy_count/download?${params}`, {
        responseType: 'blob'
      });

      const dateString = generateDateString(timeRange, startDate, endDate);
      await downloadBlobOrThrow(response, `instant_occupancy_count_${dateString}.csv`);

      return { success: true };
    } catch (error) {
      const errorMessage = extractErrorMessage(error.response?.data || error);
      return rejectWithValue(errorMessage);
    }
  }
);

export const downloadOccupancyByGroup = createAsyncThunk(
  'dashboard/downloadOccupancyByGroup',
  async ({ areaIds, floorIds, timeRange, startDate, endDate, isNavigating }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      // CORRECT LOGIC: If floor is selected, send ONLY floorIds, NOT areaIds
      if (floorIds && floorIds.length > 0) {
        floorIds.forEach(id => params.append('floor_ids', id));
      } else if (areaIds && areaIds.length > 0) {
        areaIds.forEach(id => params.append('area_ids', id));
      }

      // For this-day navigation, use custom date range to get 96-point format for the correct day
      if (timeRange === 'this-day' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-week navigation, use custom date range to get date format (31/8 6, 1/9 6, etc.)
      else if (timeRange === 'this-week' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // Use custom date range only when explicitly custom, otherwise use predefined time range
      else if (timeRange === 'custom' || (isNavigating && startDate && endDate)) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      } else {
        // Use predefined time range (this_day, this_week, etc.) - shows full representation
        const backendTimeRange = mapTimeRangeToBackend(timeRange);
        params.append('time_range', backendTimeRange);
      }

      const response = await BaseUrl.get(`/exports/occupancy_by_group/download?${params}`, { responseType: 'blob' });
      const dateString = generateDateString(timeRange, startDate, endDate);
      await downloadBlobOrThrow(response, `occupancy_by_group_${dateString}.csv`);

      return { success: true };
    } catch (error) {
      const errorMessage = extractErrorMessage(error.response?.data || error?.message || error);
      return rejectWithValue(errorMessage);
    }
  }
);

export const downloadOccupancyByGroupFromLogs = createAsyncThunk(
  'dashboard/downloadOccupancyByGroupFromLogs',
  async ({ areaIds, floorIds, timeRange, startDate, endDate, isNavigating }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      // CORRECT LOGIC: If floor is selected, send ONLY floorIds, NOT areaIds
      if (floorIds && floorIds.length > 0) {
        floorIds.forEach(id => params.append('floor_ids', id));
      } else if (areaIds && areaIds.length > 0) {
        areaIds.forEach(id => params.append('area_ids', id));
      }

      // For this-day navigation, use custom date range to get 96-point format for the correct day
      if (timeRange === 'this-day' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-week navigation, use custom date range to get date format (31/8 6, 1/9 6, etc.)
      else if (timeRange === 'this-week' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // Use custom date range only when explicitly custom, otherwise use predefined time range
      else if (timeRange === 'custom' || (isNavigating && startDate && endDate)) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      } else {
        // Use predefined time range (this_day, this_week, etc.) - shows full representation
        const backendTimeRange = mapTimeRangeToBackend(timeRange);
        params.append('time_range', backendTimeRange);
      }

      const response = await BaseUrl.get(`/exports/occupancy_by_group_from_logs/download?${params}`, { responseType: 'blob' });
      const dateString = generateDateString(timeRange, startDate, endDate);
      await downloadBlobOrThrow(response, `occupancy_by_group_from_logs_${dateString}.csv`);

      return { success: true };
    } catch (error) {
      const errorMessage = extractErrorMessage(error.response?.data || error?.message || error);
      return rejectWithValue(errorMessage);
    }
  }
);

export const downloadSpaceUtilizationPer = createAsyncThunk(
  'dashboard/downloadSpaceUtilizationPer',
  async ({ areaIds, floorIds, timeRange, startDate, endDate, isNavigating }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      // CORRECT LOGIC: If floor is selected, send ONLY floorIds, NOT areaIds
      if (floorIds && floorIds.length > 0) {
        floorIds.forEach(id => params.append('floor_ids', id));
      } else if (areaIds && areaIds.length > 0) {
        areaIds.forEach(id => params.append('area_ids', id));
      }

      // For this-day navigation, use custom date range to get 96-point format for the correct day
      if (timeRange === 'this-day' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-week navigation, use custom date range to get date format (31/8 6, 1/9 6, etc.)
      else if (timeRange === 'this-week' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // Use custom date range only when explicitly custom, otherwise use predefined time range
      else if (timeRange === 'custom' || (isNavigating && startDate && endDate)) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      } else {
        // Use predefined time range (this_day, this_week, etc.) - shows full representation
        const backendTimeRange = mapTimeRangeToBackend(timeRange);
        params.append('time_range', backendTimeRange);
      }

      const response = await BaseUrl.get(`/exports/space_utilization_per/download?${params}`, { responseType: 'blob' });
      const dateString = generateDateString(timeRange, startDate, endDate);
      await downloadBlobOrThrow(response, `space_utilization_area_${dateString}.csv`);

      return { success: true };
    } catch (error) {
      const errorMessage = extractErrorMessage(error.response?.data || error?.message || error);
      return rejectWithValue(errorMessage);
    }
  }
);

export const downloadSpaceUtilizationPerFromLogs = createAsyncThunk(
  'dashboard/downloadSpaceUtilizationPerFromLogs',
  async ({ areaIds, floorIds, timeRange, startDate, endDate, isNavigating }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      // CORRECT LOGIC: If floor is selected, send ONLY floorIds, NOT areaIds
      if (floorIds && floorIds.length > 0) {
        floorIds.forEach(id => params.append('floor_ids', id));
      } else if (areaIds && areaIds.length > 0) {
        areaIds.forEach(id => params.append('area_ids', id));
      }

      // For this-day navigation, use custom date range to get 96-point format for the correct day
      if (timeRange === 'this-day' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-week navigation, use custom date range to get date format (31/8 6, 1/9 6, etc.)
      else if (timeRange === 'this-week' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // Use custom date range only when explicitly custom, otherwise use predefined time range
      else if (timeRange === 'custom' || (isNavigating && startDate && endDate)) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      } else {
        // Use predefined time range (this_day, this_week, etc.) - shows full representation
        const backendTimeRange = mapTimeRangeToBackend(timeRange);
        params.append('time_range', backendTimeRange);
      }

      const response = await BaseUrl.get(`/exports/space_utilization_per_from_logs/download?${params}`, { responseType: 'blob' });
      const dateString = generateDateString(timeRange, startDate, endDate);
      await downloadBlobOrThrow(response, `space_utilization_per_from_logs_${dateString}.csv`);

      return { success: true };
    } catch (error) {
      const errorMessage = extractErrorMessage(error.response?.data || error?.message || error);
      return rejectWithValue(errorMessage);
    }
  }
);

// Commented out - not using peak min max API for space utilization
// export const downloadPeakMinOccupancy = createAsyncThunk(
//   'dashboard/downloadPeakMinOccupancy',
//   async ({ areaIds, floorIds, timeRange, startDate, endDate }, { rejectWithValue }) => {
//     try {
//       const params = new URLSearchParams();
//       // CORRECT LOGIC: If floor is selected, send ONLY floorIds, NOT areaIds
//       if (floorIds && floorIds.length > 0) {
//         floorIds.forEach(id => params.append('floor_ids', id));
//       } else if (areaIds && areaIds.length > 0) {
//         areaIds.forEach(id => params.append('area_ids', id));
//       }
//       
//       // For this-day navigation, use custom date range to get 96-point format for the correct day
//       if (timeRange === 'this-day' && isNavigating) {
//         params.append('time_range', 'custom');
//         params.append('start_date', startDate);
//         params.append('end_date', endDate);
//       }
//       // For this-week navigation, use custom date range to get date format (31/8 6, 1/9 6, etc.)
//       else if (timeRange === 'this-week' && isNavigating) {
//         params.append('time_range', 'custom');
//         params.append('start_date', startDate);
//         params.append('end_date', endDate);
//       }
//       // Use custom date range only when explicitly custom, otherwise use predefined time range
//       else if (timeRange === 'custom' || (isNavigating && startDate && endDate)) {
//         params.append('time_range', 'custom');
//         params.append('start_date', startDate);
//         params.append('end_date', endDate);
//       } else {
//         // Use predefined time range (this_day, this_week, etc.) - shows full representation
//         const backendTimeRange = mapTimeRangeToBackend(timeRange);
//         params.append('time_range', backendTimeRange);
//       }
//       
//       const response = await BaseUrl.get(`/dashboard/peak_min_occupancy/download?${params}`, {
//         responseType: 'blob'
//       });
//       
//       const dateString = generateDateString(timeRange, startDate, endDate);
//       await downloadBlobOrThrow(response, `peak_min_occupancy_${dateString}.csv`);
//       
//       return { success: true };
//     } catch (error) {
//       const errorMessage = extractErrorMessage(error.response?.data || error?.message || error);
//       return rejectWithValue(errorMessage);
//     }
//   }
// );

// Email async thunks
export const sendEnergyConsumptionEmail = createAsyncThunk(
  'dashboard/sendEnergyConsumptionEmail',
  async ({ toEmail, areaIds, floorIds, timeRange, startDate, endDate, isNavigating }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      params.append('to_email', toEmail);
      // CORRECT LOGIC: If floor is selected, send ONLY floorIds, NOT areaIds
      if (floorIds && floorIds.length > 0) {
        floorIds.forEach(id => params.append('floor_ids', id));
      } else if (areaIds && areaIds.length > 0) {
        areaIds.forEach(id => params.append('area_ids', id));
      }

      // For this-day navigation, use custom date range to get 96-point format for the correct day
      if (timeRange === 'this-day' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-week navigation, use custom date range to get date format (31/8 6, 1/9 6, etc.)
      else if (timeRange === 'this-week' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // Use custom date range only when explicitly custom, otherwise use predefined time range
      else if (timeRange === 'custom' || (isNavigating && startDate && endDate)) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      } else {
        // Use predefined time range (this_day, this_week, etc.) - shows full representation
        const backendTimeRange = mapTimeRangeToBackend(timeRange);
        params.append('time_range', backendTimeRange);
      }

      const response = await BaseUrl.post(`/exports/energy_consumption/email?${params}`);
      return response.data;
    } catch (error) {
      const errorMessage = extractErrorMessage(error.response?.data || error);
      return rejectWithValue(errorMessage);
    }
  }
);

export const sendEnergySavingsEmail = createAsyncThunk(
  'dashboard/sendEnergySavingsEmail',
  async ({ toEmail, areaIds, floorIds, timeRange, startDate, endDate, isNavigating }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      params.append('to_email', toEmail);
      // CORRECT LOGIC: If floor is selected, send ONLY floorIds, NOT areaIds
      if (floorIds && floorIds.length > 0) {
        floorIds.forEach(id => params.append('floor_ids', id));
      } else if (areaIds && areaIds.length > 0) {
        areaIds.forEach(id => params.append('area_ids', id));
      }

      // For this-day navigation, use custom date range to get 96-point format for the correct day
      if (timeRange === 'this-day' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-week navigation, use custom date range to get date format (31/8 6, 1/9 6, etc.)
      else if (timeRange === 'this-week' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // Use custom date range only when explicitly custom, otherwise use predefined time range
      else if (timeRange === 'custom' || (isNavigating && startDate && endDate)) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      } else {
        // Use predefined time range (this_day, this_week, etc.) - shows full representation
        const backendTimeRange = mapTimeRangeToBackend(timeRange);
        params.append('time_range', backendTimeRange);
      }

      const response = await BaseUrl.post(`/exports/energy_savings/email?${params}`);
      return response.data;
    } catch (error) {
      const errorMessage = extractErrorMessage(error.response?.data || error);
      return rejectWithValue(errorMessage);
    }
  }
);

export const sendPeakMinConsumptionEmail = createAsyncThunk(
  'dashboard/sendPeakMinConsumptionEmail',
  async ({ toEmail, areaIds, floorIds, timeRange, startDate, endDate, isNavigating }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      params.append('to_email', toEmail);
      // CORRECT LOGIC: If floor is selected, send ONLY floorIds, NOT areaIds
      if (floorIds && floorIds.length > 0) {
        floorIds.forEach(id => params.append('floor_ids', id));
      } else if (areaIds && areaIds.length > 0) {
        areaIds.forEach(id => params.append('area_ids', id));
      }

      // For this-day navigation, use custom date range to get 96-point format for the correct day
      if (timeRange === 'this-day' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-week navigation, use custom date range to get date format (31/8 6, 1/9 6, etc.)
      else if (timeRange === 'this-week' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // Use custom date range only when explicitly custom, otherwise use predefined time range
      else if (timeRange === 'custom' || (isNavigating && startDate && endDate)) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      } else {
        // Use predefined time range (this_day, this_week, etc.) - shows full representation
        const backendTimeRange = mapTimeRangeToBackend(timeRange);
        params.append('time_range', backendTimeRange);
      }

      const response = await BaseUrl.post(`/dashboard/peak_min_consumption/send_by_email?${params}`);
      return response.data;
    } catch (error) {
      const errorMessage = extractErrorMessage(error.response?.data || error);
      return rejectWithValue(errorMessage);
    }
  }
);

export const sendTotalConsumptionByGroupEmail = createAsyncThunk(
  'dashboard/sendTotalConsumptionByGroupEmail',
  async ({ toEmail, timeRange, startDate, endDate }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      params.append('to_email', toEmail);

      // Use custom date range only when explicitly custom, otherwise use predefined time range
      if (timeRange === 'custom') {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      } else {
        // Use predefined time range (this_day, this_week, etc.) - shows full representation
        const backendTimeRange = mapTimeRangeToBackend(timeRange);
        params.append('time_range', backendTimeRange);
      }

      const response = await BaseUrl.post(`/exports/total_consumption_by_group/email?${params}`);

      return response.data;
    } catch (error) {
      // API error
      const errorMessage = extractErrorMessage(error.response?.data || error);
      return rejectWithValue(errorMessage);
    }
  }
);

export const sendOccupancyCountEmail = createAsyncThunk(
  'dashboard/sendOccupancyCountEmail',
  async ({ toEmail, areaIds, floorIds, timeRange, startDate, endDate, isNavigating }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      params.append('to_email', toEmail);
      // CORRECT LOGIC: If floor is selected, send ONLY floorIds, NOT areaIds
      if (floorIds && floorIds.length > 0) {
        floorIds.forEach(id => params.append('floor_ids', id));
      } else if (areaIds && areaIds.length > 0) {
        areaIds.forEach(id => params.append('area_ids', id));
      }

      // For this-day navigation, use custom date range to get 96-point format for the correct day
      if (timeRange === 'this-day' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-week navigation, use custom date range to get date format (31/8 6, 1/9 6, etc.)
      else if (timeRange === 'this-week' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // Use custom date range only when explicitly custom, otherwise use predefined time range
      else if (timeRange === 'custom' || (isNavigating && startDate && endDate)) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      } else {
        // Use predefined time range (this_day, this_week, etc.) - shows full representation
        const backendTimeRange = mapTimeRangeToBackend(timeRange);
        params.append('time_range', backendTimeRange);
      }

      const response = await BaseUrl.post(`/exports/occupancy_count/email?${params}`);
      return response.data;
    } catch (error) {
      const errorMessage = extractErrorMessage(error.response?.data || error);
      return rejectWithValue(errorMessage);
    }
  }
);

export const sendInstantOccupancyCountEmail = createAsyncThunk(
  'dashboard/sendInstantOccupancyCountEmail',
  async ({ toEmail, areaIds, floorIds, timeRange, startDate, endDate, isNavigating }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      params.append('to_email', toEmail);
      // CORRECT LOGIC: If floor is selected, send ONLY floorIds, NOT areaIds
      if (floorIds && floorIds.length > 0) {
        floorIds.forEach(id => params.append('floor_ids', id));
      } else if (areaIds && areaIds.length > 0) {
        areaIds.forEach(id => params.append('area_ids', id));
      }

      // For this-day navigation, use custom date range to get 96-point format for the correct day
      if (timeRange === 'this-day' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-week navigation, use custom date range to get date format (31/8 6, 1/9 6, etc.)
      else if (timeRange === 'this-week' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // Use custom date range only when explicitly custom, otherwise use predefined time range
      else if (timeRange === 'custom' || (isNavigating && startDate && endDate)) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      } else {
        // Use predefined time range (this_day, this_week, etc.) - shows full representation
        const backendTimeRange = mapTimeRangeToBackend(timeRange);
        params.append('time_range', backendTimeRange);
      }

      const response = await BaseUrl.post(`/exports/instant_occupancy_count/email?${params}`);
      return response.data;
    } catch (error) {
      const errorMessage = extractErrorMessage(error.response?.data || error);
      return rejectWithValue(errorMessage);
    }
  }
);

export const sendOccupancyByGroupEmail = createAsyncThunk(
  'dashboard/sendOccupancyByGroupEmail',
  async ({ toEmail, areaIds, floorIds, timeRange, startDate, endDate, isNavigating }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      params.append('to_email', toEmail);
      // CORRECT LOGIC: If floor is selected, send ONLY floorIds, NOT areaIds
      if (floorIds && floorIds.length > 0) {
        floorIds.forEach(id => params.append('floor_ids', id));
      } else if (areaIds && areaIds.length > 0) {
        areaIds.forEach(id => params.append('area_ids', id));
      }

      // For this-day navigation, use custom date range to get 96-point format for the correct day
      if (timeRange === 'this-day' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-week navigation, use custom date range to get date format (31/8 6, 1/9 6, etc.)
      else if (timeRange === 'this-week' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // Use custom date range only when explicitly custom, otherwise use predefined time range
      else if (timeRange === 'custom' || (isNavigating && startDate && endDate)) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      } else {
        // Use predefined time range (this_day, this_week, etc.) - shows full representation
        const backendTimeRange = mapTimeRangeToBackend(timeRange);
        params.append('time_range', backendTimeRange);
      }

      const response = await BaseUrl.post(`/exports/occupancy_by_group/email?${params}`);
      return response.data;
    } catch (error) {
      // Error sending occupancy by group email
      const errorMessage = extractErrorMessage(error.response?.data || error);
      return rejectWithValue(errorMessage);
    }
  }
);

export const sendOccupancyByGroupFromLogsEmail = createAsyncThunk(
  'dashboard/sendOccupancyByGroupFromLogsEmail',
  async ({ toEmail, areaIds, floorIds, timeRange, startDate, endDate, isNavigating }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      params.append('to_email', toEmail);
      // CORRECT LOGIC: If floor is selected, send ONLY floorIds, NOT areaIds
      if (floorIds && floorIds.length > 0) {
        floorIds.forEach(id => params.append('floor_ids', id));
      } else if (areaIds && areaIds.length > 0) {
        areaIds.forEach(id => params.append('area_ids', id));
      }

      // For this-day navigation, use custom date range to get 96-point format for the correct day
      if (timeRange === 'this-day' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-week navigation, use custom date range to get date format (31/8 6, 1/9 6, etc.)
      else if (timeRange === 'this-week' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // Use custom date range only when explicitly custom, otherwise use predefined time range
      else if (timeRange === 'custom' || (isNavigating && startDate && endDate)) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      } else {
        // Use predefined time range (this_day, this_week, etc.) - shows full representation
        const backendTimeRange = mapTimeRangeToBackend(timeRange);
        params.append('time_range', backendTimeRange);
      }

      const response = await BaseUrl.post(`/exports/occupancy_by_group_from_logs/email?${params}`);
      return response.data;
    } catch (error) {
      // Error sending occupancy by group from logs email
      const errorMessage = extractErrorMessage(error.response?.data || error);
      return rejectWithValue(errorMessage);
    }
  }
);

export const sendSpaceUtilizationPerEmail = createAsyncThunk(
  'dashboard/sendSpaceUtilizationPerEmail',
  async ({ toEmail, areaIds, floorIds, timeRange, startDate, endDate, isNavigating }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      params.append('to_email', toEmail);
      // CORRECT LOGIC: If floor is selected, send ONLY floorIds, NOT areaIds
      if (floorIds && floorIds.length > 0) {
        floorIds.forEach(id => params.append('floor_ids', id));
      } else if (areaIds && areaIds.length > 0) {
        areaIds.forEach(id => params.append('area_ids', id));
      }

      // For this-day navigation, use custom date range to get 96-point format for the correct day
      if (timeRange === 'this-day' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-week navigation, use custom date range to get date format (31/8 6, 1/9 6, etc.)
      else if (timeRange === 'this-week' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // Use custom date range only when explicitly custom, otherwise use predefined time range
      else if (timeRange === 'custom' || (isNavigating && startDate && endDate)) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      } else {
        // Use predefined time range (this_day, this_week, etc.) - shows full representation
        const backendTimeRange = mapTimeRangeToBackend(timeRange);
        params.append('time_range', backendTimeRange);
      }

      const response = await BaseUrl.post(`/exports/space_utilization_per/email?${params}`);
      return response.data;
    } catch (error) {
      const errorMessage = extractErrorMessage(error.response?.data || error);
      return rejectWithValue(errorMessage);
    }
  }
);

export const sendSpaceUtilizationPerFromLogsEmail = createAsyncThunk(
  'dashboard/sendSpaceUtilizationPerFromLogsEmail',
  async ({ toEmail, areaIds, floorIds, timeRange, startDate, endDate, isNavigating }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      params.append('to_email', toEmail);
      // CORRECT LOGIC: If floor is selected, send ONLY floorIds, NOT areaIds
      if (floorIds && floorIds.length > 0) {
        floorIds.forEach(id => params.append('floor_ids', id));
      } else if (areaIds && areaIds.length > 0) {
        areaIds.forEach(id => params.append('area_ids', id));
      }

      // For this-day navigation, use custom date range to get 96-point format for the correct day
      if (timeRange === 'this-day' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // For this-week navigation, use custom date range to get date format (31/8 6, 1/9 6, etc.)
      else if (timeRange === 'this-week' && isNavigating) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // Use custom date range only when explicitly custom, otherwise use predefined time range
      else if (timeRange === 'custom' || (isNavigating && startDate && endDate)) {
        params.append('time_range', 'custom');
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      } else {
        // Use predefined time range (this_day, this_week, etc.) - shows full representation
        const backendTimeRange = mapTimeRangeToBackend(timeRange);
        params.append('time_range', backendTimeRange);
      }

      const response = await BaseUrl.post(`/exports/space_utilization_per_from_logs/email?${params}`);
      return response.data;
    } catch (error) {
      const errorMessage = extractErrorMessage(error.response?.data || error);
      return rejectWithValue(errorMessage);
    }
  }
);

// Commented out - not using peak min max API for space utilization
// export const sendPeakMinOccupancyEmail = createAsyncThunk(
//   'dashboard/sendPeakMinOccupancyEmail',
//   async ({ toEmail, areaIds, floorIds, timeRange, startDate, endDate }, { rejectWithValue }) => {
//     try {
//       const params = new URLSearchParams();
//       params.append('to_email', toEmail);
//       // CORRECT LOGIC: If floor is selected, send ONLY floorIds, NOT areaIds
//       if (floorIds && floorIds.length > 0) {
//         floorIds.forEach(id => params.append('floor_ids', id));
//       } else if (areaIds && areaIds.length > 0) {
//         areaIds.forEach(id => params.append('area_ids', id));
//       }
//       
//       // For this-day navigation, use custom date range to get 96-point format for the correct day
//       if (timeRange === 'this-day' && isNavigating) {
//         params.append('time_range', 'custom');
//         params.append('start_date', startDate);
//         params.append('end_date', endDate);
//       }
//       // For this-week navigation, use custom date range to get date format (31/8 6, 1/9 6, etc.)
//       else if (timeRange === 'this-week' && isNavigating) {
//         params.append('time_range', 'custom');
//         params.append('start_date', startDate);
//         params.append('end_date', endDate);
//       }
//       // Use custom date range only when explicitly custom, otherwise use predefined time range
//       else if (timeRange === 'custom' || (isNavigating && startDate && endDate)) {
//         params.append('time_range', 'custom');
//         params.append('start_date', startDate);
//         params.append('end_date', endDate);
//       } else {
//         // Use predefined time range (this_day, this_week, etc.) - shows full representation
//         const backendTimeRange = mapTimeRangeToBackend(timeRange);
//         params.append('time_range', backendTimeRange);
//       }
//       
//       const response = await BaseUrl.post(`/dashboard/peak_min_occupancy/send_by_email?${params}`);
//       return response.data;
//     } catch (error) {
//       const errorMessage = extractErrorMessage(error.response?.data || error);
//       return rejectWithValue(errorMessage);
//     }
//   }
// );

export const sendSavingsByStrategyEmail = createAsyncThunk(
  'dashboard/sendSavingsByStrategyEmail',
  async ({ toEmail, areaIds, floorIds, timeRange, startDate, endDate }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      params.append('to_email', toEmail);
      // CORRECT LOGIC: If floor is selected, send ONLY floorIds, NOT areaIds
      if (floorIds && floorIds.length > 0) {
        floorIds.forEach(id => params.append('floor_ids', id));
      } else if (areaIds && areaIds.length > 0) {
        areaIds.forEach(id => params.append('area_ids', id));
      }

      // Use custom date range if we have custom dates, otherwise use predefined time range
      if (timeRange === 'custom' || (startDate && endDate)) {
        params.append('time_range', 'custom');
        const formattedStartDate = new Date(startDate).toISOString();
        params.append('start_date', formattedStartDate);
        const formattedEndDate = new Date(endDate).toISOString();
        params.append('end_date', formattedEndDate);
      } else {
        // Use predefined time range (this_day, this_week, etc.)
        const backendTimeRange = mapTimeRangeToBackendForSavings(timeRange);
        params.append('time_range', backendTimeRange);
      }

      const response = await BaseUrl.post(`/dashboard/saving_by_stratergy/send_by_email?${params}`);
      return response.data;
    } catch (error) {
      const errorMessage = extractErrorMessage(error.response?.data || error);
      return rejectWithValue(errorMessage);
    }
  }
);

// Add download function for savings by strategy
export const downloadSavingsByStrategy = createAsyncThunk(
  'dashboard/downloadSavingsByStrategy',
  async ({ areaIds, floorIds, timeRange, startDate, endDate }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      // CORRECT LOGIC: If floor is selected, send ONLY floorIds, NOT areaIds
      if (floorIds && floorIds.length > 0) {
        floorIds.forEach(id => params.append('floor_ids', id));
      } else if (areaIds && areaIds.length > 0) {
        areaIds.forEach(id => params.append('area_ids', id));
      }

      // Use custom date range if we have custom dates, otherwise use predefined time range
      if (timeRange === 'custom' || (startDate && endDate)) {
        params.append('time_range', 'custom');
        const formattedStartDate = new Date(startDate).toISOString();
        params.append('start_date', formattedStartDate);
        const formattedEndDate = new Date(endDate).toISOString();
        params.append('end_date', formattedEndDate);
      } else {
        // Use predefined time range (this_day, this_week, etc.)
        const backendTimeRange = mapTimeRangeToBackendForSavings(timeRange);
        params.append('time_range', backendTimeRange);
      }

      const response = await BaseUrl.get(`/dashboard/saving_by_stratergy/download?${params}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const dateString = generateDateString(timeRange, startDate, endDate);
      link.setAttribute('download', `savings_by_strategy_${dateString}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      const errorMessage = extractErrorMessage(error.response?.data || error);
      return rejectWithValue(errorMessage);
    }
  }
);

const getLocalDateString = (dateInput = new Date()) => {
  const date =
    dateInput instanceof Date
      ? new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate())
      : new Date(dateInput);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const initialState = {
  selectedFloor: null,
  selectedAreas: [],
  selectedFloorIds: [], // Add selected floor IDs for backend APIs
  selectedGroups: [], // Add selected area groups
  selectedGroupIds: [], // Add selected group IDs for backend APIs
  selectedDuration: '',
  customStartDate: '',
  customEndDate: '',
  // Navigation state
  currentDate: getLocalDateString(),
  currentYear: new Date().getFullYear(),
  isNavigating: false, // Flag to track if we're in navigation mode
  lastNavigationTime: 0, // Timestamp of last navigation to prevent rapid calls
  globalLoading: false, // Global loading state for all charts
  // NOTE: unified energy data moved to dedicated slice `unifiedEnergySlice.js`
  totalConsumptionByGroup: null, // Add this
  lightPowerDensity: null, // Add this
  occupancyCount: null, // Add this
  occupancyByGroup: null, // Add this
  spaceUtilizationPerArea: null, // Add this
  // peakMinOccupancy: null, // Commented out - not using peak min max API for space utilization
  // peakMinOccupancyLoading: false,
  // peakMinOccupancyError: null,
  instantOccupancyCount: null, // Add this for instant occupancy count
  instantOccupancyCountLoading: false, // Add loading state
  instantOccupancyCountError: null, // Add error state
  occupancyByGroupFromLogs: null, // Add this for occupancy by group from logs
  occupancyByGroupFromLogsLoading: false, // Add loading state
  occupancyByGroupFromLogsError: null, // Add error state
  spaceUtilizationPerFromLogs: null, // Add this for space utilization per area from logs
  spaceUtilizationPerFromLogsLoading: false, // Add loading state
  spaceUtilizationPerFromLogsError: null, // Add error state
  // Individual loading states for each API call
  occupancyCountLoading: false,
  occupancyByGroupLoading: false,
  spaceUtilizationLoading: false,
  savingsByStrategy: null, // Add this
  areaGroups: null, // Add area groups for grouping consumption data
  filteredData: {
    energy: [],
    spaceUtilization: [],
    alerts: []
  },
  status: 'idle',
  error: null,
  loading: false,
  // Email state
  emailLoading: false,
  emailError: null,
  emailSuccess: null
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setSelectedFloor: (state, action) => {
      state.selectedFloor = action.payload;
      state.selectedAreas = []; // Reset selected areas when floor changes
    },
    setSelectedAreas: (state, action) => {
      state.selectedAreas = action.payload;
    },
    setSelectedFloorIds: (state, action) => {
      state.selectedFloorIds = action.payload;
    },
    setSelectedGroups: (state, action) => {
      state.selectedGroups = action.payload;
    },
    setSelectedGroupIds: (state, action) => {
      state.selectedGroupIds = action.payload;
    },
    setSelectedDuration: (state, action) => {
      state.selectedDuration = action.payload;
      state.isNavigating = false; // Reset navigation flag when duration changes
    },
    setCustomDateRange: (state, action) => {
      const { startDate, endDate } = action.payload;
      const currentTime = Date.now();

      // Prevent rapid navigation calls (cooldown of 500ms)
      if (currentTime - state.lastNavigationTime < 500) {
        // Navigation cooldown active
        return;
      }

      state.customStartDate = startDate;
      state.customEndDate = endDate;
      state.isNavigating = true; // Set navigation flag when custom date range is set
      state.lastNavigationTime = currentTime; // Update last navigation time
    },
    setCurrentDate: (state, action) => {
      state.currentDate = action.payload;
    },
    setCurrentYear: (state, action) => {
      state.currentYear = action.payload;
    },
    setIsNavigating: (state, action) => {
      const currentTime = Date.now();

      // Prevent rapid navigation flag changes (cooldown of 500ms)
      if (action.payload && currentTime - state.lastNavigationTime < 500) {
        return;
      }

      state.isNavigating = action.payload;
      if (action.payload) {
        state.lastNavigationTime = currentTime;
      }
    },
    setGlobalLoading: (state, action) => {
      state.globalLoading = action.payload;
    },
    setFilteredData: (state, action) => {
      state.filteredData = action.payload;
    },
    clearDashboardData: (state) => {
      state.selectedFloor = null;
      state.selectedAreas = [];
      state.selectedFloorIds = [];
      state.selectedGroups = [];
      state.selectedGroupIds = [];
      state.selectedDuration = '';
      state.customStartDate = '';
      state.customEndDate = '';
      state.currentDate = getLocalDateString();
      state.currentYear = new Date().getFullYear();
      state.isNavigating = false;
      state.lastNavigationTime = 0; // Reset navigation cooldown
      state.filteredData = {
        energy: [],
        spaceUtilization: [],
        alerts: []
      };
    }
  },
  extraReducers: (builder) => {
    builder
      // Handle floor loading states
      .addCase(fetchFloors.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchFloors.fulfilled, (state) => {
        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(fetchFloors.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error?.message || 'Failed to fetch floors';
      })
      // Handle area tree loading states
      .addCase(getLeafByFloorID.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getLeafByFloorID.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(getLeafByFloorID.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error?.message || 'Failed to fetch area tree';
      })
      // Handle energy consumption loading states
      .addCase(fetchEnergyConsumption.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEnergyConsumption.fulfilled, (state, action) => {
        state.loading = false;
        state.energyConsumption = action.payload;
        state.error = null;
      })
      .addCase(fetchEnergyConsumption.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch energy consumption';
      })
      // Handle energy savings loading states
      .addCase(fetchEnergySavings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEnergySavings.fulfilled, (state, action) => {
        state.loading = false;
        state.energySavings = action.payload;
        state.error = null;
      })
      .addCase(fetchEnergySavings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch energy savings';
      })
      // Handle peak/min consumption loading states
      .addCase(fetchPeakMinConsumption.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPeakMinConsumption.fulfilled, (state, action) => {
        state.loading = false;
        state.peakMinConsumption = action.payload;
        state.error = null;
      })
      .addCase(fetchPeakMinConsumption.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch peak/min consumption';
      })
      // Handle total consumption by group loading states
      .addCase(fetchTotalConsumptionByGroup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTotalConsumptionByGroup.fulfilled, (state, action) => {
        state.loading = false;
        state.totalConsumptionByGroup = action.payload;
        state.error = null;
      })
      .addCase(fetchTotalConsumptionByGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch total consumption by group';
      })
      // Handle light power density loading states
      .addCase(fetchLightPowerDensity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLightPowerDensity.fulfilled, (state, action) => {
        state.loading = false;
        state.lightPowerDensity = action.payload;
        state.error = null;
      })
      .addCase(fetchLightPowerDensity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch light power density';
        if (!state.lightPowerDensity) {
          state.lightPowerDensity = { status: 'failed' };
        }
      })
      // Handle occupancy count loading states
      .addCase(fetchOccupancyCount.pending, (state) => {
        state.loading = true;
        state.globalLoading = true;
        state.occupancyCountLoading = true;
        state.error = null;
      })
      .addCase(fetchOccupancyCount.fulfilled, (state, action) => {
        state.loading = false;
        state.globalLoading = false;
        state.occupancyCountLoading = false;
        state.occupancyCount = action.payload;
        state.error = null;
      })
      .addCase(fetchOccupancyCount.rejected, (state, action) => {
        state.loading = false;
        state.globalLoading = false;
        state.occupancyCountLoading = false;
        state.error = action.payload || 'Failed to fetch occupancy count';
      })
      // Handle instant occupancy count loading states
      // Do not toggle globalLoading or clear cached data — that made every Space
      // Utilization widget flash when switching to the charts tab.
      .addCase(fetchInstantOccupancyCount.pending, (state) => {
        state.instantOccupancyCountLoading = true;
        state.instantOccupancyCountError = null;
      })
      .addCase(fetchInstantOccupancyCount.fulfilled, (state, action) => {
        state.instantOccupancyCountLoading = false;
        state.instantOccupancyCount = action.payload;
        state.instantOccupancyCountError = null;
      })
      .addCase(fetchInstantOccupancyCount.rejected, (state, action) => {
        state.instantOccupancyCountLoading = false;
        if (isCanceledRequest(action)) return;
        state.instantOccupancyCountError = action.payload || 'Failed to fetch instant occupancy count';
      })
      // Handle occupancy by group from logs loading states
      .addCase(fetchOccupancyByGroupFromLogs.pending, (state) => {
        state.occupancyByGroupFromLogsLoading = true;
        state.occupancyByGroupFromLogsError = null;
      })
      .addCase(fetchOccupancyByGroupFromLogs.fulfilled, (state, action) => {
        state.occupancyByGroupFromLogsLoading = false;
        state.occupancyByGroupFromLogs = action.payload;
        state.occupancyByGroupFromLogsError = null;
      })
      .addCase(fetchOccupancyByGroupFromLogs.rejected, (state, action) => {
        state.occupancyByGroupFromLogsLoading = false;
        state.occupancyByGroupFromLogsError = action.payload || 'Failed to fetch occupancy by group from logs';
      })
      // Handle space utilization per area from logs loading states
      .addCase(fetchSpaceUtilizationPerFromLogs.pending, (state) => {
        state.spaceUtilizationPerFromLogsLoading = true;
        state.spaceUtilizationPerFromLogsError = null;
      })
      .addCase(fetchSpaceUtilizationPerFromLogs.fulfilled, (state, action) => {
        state.spaceUtilizationPerFromLogsLoading = false;
        state.spaceUtilizationPerFromLogs = action.payload;
        state.spaceUtilizationPerFromLogsError = null;
      })
      .addCase(fetchSpaceUtilizationPerFromLogs.rejected, (state, action) => {
        state.spaceUtilizationPerFromLogsLoading = false;
        state.spaceUtilizationPerFromLogsError = action.payload || 'Failed to fetch space utilization per area from logs';
      })
      // Handle occupancy by group loading states
      .addCase(fetchOccupancyByGroup.pending, (state) => {
        state.loading = true;
        state.occupancyByGroupLoading = true;
        state.error = null;
      })
      .addCase(fetchOccupancyByGroup.fulfilled, (state, action) => {
        state.loading = false;
        state.occupancyByGroupLoading = false;
        state.occupancyByGroup = action.payload;
        state.error = null;
      })
      .addCase(fetchOccupancyByGroup.rejected, (state, action) => {
        state.loading = false;
        state.occupancyByGroupLoading = false;
        state.error = action.payload || 'Failed to fetch occupancy by group';
      })
      // Handle space utilization per area loading states
      .addCase(fetchSpaceUtilizationPerArea.pending, (state) => {
        state.loading = true;
        state.spaceUtilizationLoading = true;
        state.error = null;
      })
      .addCase(fetchSpaceUtilizationPerArea.fulfilled, (state, action) => {
        state.loading = false;
        state.spaceUtilizationLoading = false;
        state.spaceUtilizationPerArea = action.payload;
        state.error = null;
      })
      .addCase(fetchSpaceUtilizationPerArea.rejected, (state, action) => {
        state.loading = false;
        state.spaceUtilizationLoading = false;
        state.error = action.payload || 'Failed to fetch space utilization per area';
      })
      // Commented out - not using peak min max API for space utilization
      // .addCase(fetchPeakMinOccupancy.pending, (state) => {
      //   state.peakMinOccupancyLoading = true;
      //   state.peakMinOccupancyError = null;
      // })
      // .addCase(fetchPeakMinOccupancy.fulfilled, (state, action) => {
      //   state.peakMinOccupancyLoading = false;
      //   state.peakMinOccupancy = action.payload;
      // })
      // .addCase(fetchPeakMinOccupancy.rejected, (state, action) => {
      //   state.peakMinOccupancyLoading = false;
      //   state.peakMinOccupancyError = action.payload;
      // })
      // Handle savings by strategy loading states
      .addCase(fetchSavingsByStrategy.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSavingsByStrategy.fulfilled, (state, action) => {
        state.loading = false;
        state.savingsByStrategy = action.payload;
        state.error = null;
      })
      .addCase(fetchSavingsByStrategy.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch savings by strategy';
        if (!state.savingsByStrategy) {
          state.savingsByStrategy = { data: {}, status: 'error' };
        }
      })
      // Handle area groups loading states
      .addCase(fetchAreaGroups.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAreaGroups.fulfilled, (state, action) => {
        state.loading = false;
        state.areaGroups = action.payload;
        state.error = null;
      })
      .addCase(fetchAreaGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch area groups';
      })
      // Handle email loading states
      .addCase(sendEnergyConsumptionEmail.pending, (state) => {
        state.emailLoading = true;
        state.emailError = null;
        state.emailSuccess = null;
      })
      .addCase(sendEnergyConsumptionEmail.fulfilled, (state, action) => {
        state.emailLoading = false;
        state.emailSuccess = action.payload;
        state.emailError = null;
      })
      .addCase(sendEnergyConsumptionEmail.rejected, (state, action) => {
        state.emailLoading = false;
        state.emailError = action.payload || 'Failed to send energy consumption email';
        state.emailSuccess = null;
      })
      .addCase(sendEnergySavingsEmail.pending, (state) => {
        state.emailLoading = true;
        state.emailError = null;
        state.emailSuccess = null;
      })
      .addCase(sendEnergySavingsEmail.fulfilled, (state, action) => {
        state.emailLoading = false;
        state.emailSuccess = action.payload;
        state.emailError = null;
      })
      .addCase(sendEnergySavingsEmail.rejected, (state, action) => {
        state.emailLoading = false;
        state.emailError = action.payload || 'Failed to send energy savings email';
        state.emailSuccess = null;
      })
      .addCase(sendPeakMinConsumptionEmail.pending, (state) => {
        state.emailLoading = true;
        state.emailError = null;
        state.emailSuccess = null;
      })
      .addCase(sendPeakMinConsumptionEmail.fulfilled, (state, action) => {
        state.emailLoading = false;
        state.emailSuccess = action.payload;
        state.emailError = null;
      })
      .addCase(sendPeakMinConsumptionEmail.rejected, (state, action) => {
        state.emailLoading = false;
        state.emailError = action.payload || 'Failed to send peak min consumption email';
        state.emailSuccess = null;
      })
      .addCase(sendTotalConsumptionByGroupEmail.pending, (state) => {
        state.emailLoading = true;
        state.emailError = null;
        state.emailSuccess = null;
      })
      .addCase(sendTotalConsumptionByGroupEmail.fulfilled, (state, action) => {
        state.emailLoading = false;
        state.emailSuccess = action.payload;
        state.emailError = null;
      })
      .addCase(sendTotalConsumptionByGroupEmail.rejected, (state, action) => {
        state.emailLoading = false;
        state.emailError = action.payload || 'Failed to send total consumption by group email';
        state.emailSuccess = null;
      })
      .addCase(sendOccupancyCountEmail.pending, (state) => {
        state.emailLoading = true;
        state.emailError = null;
        state.emailSuccess = null;
      })
      .addCase(sendOccupancyCountEmail.fulfilled, (state, action) => {
        state.emailLoading = false;
        state.emailSuccess = action.payload;
        state.emailError = null;
      })
      .addCase(sendOccupancyCountEmail.rejected, (state, action) => {
        state.emailLoading = false;
        state.emailError = action.payload || 'Failed to send occupancy count email';
        state.emailSuccess = null;
      })
      .addCase(sendOccupancyByGroupEmail.pending, (state) => {
        state.emailLoading = true;
        state.emailError = null;
        state.emailSuccess = null;
      })
      .addCase(sendOccupancyByGroupEmail.fulfilled, (state, action) => {
        state.emailLoading = false;
        state.emailSuccess = action.payload;
        state.emailError = null;
      })
      .addCase(sendOccupancyByGroupEmail.rejected, (state, action) => {
        state.emailLoading = false;
        state.emailError = action.payload || 'Failed to send occupancy by group email';
        state.emailSuccess = null;
      })
      .addCase(sendOccupancyByGroupFromLogsEmail.pending, (state) => {
        state.emailLoading = true;
        state.emailError = null;
        state.emailSuccess = null;
      })
      .addCase(sendOccupancyByGroupFromLogsEmail.fulfilled, (state, action) => {
        state.emailLoading = false;
        state.emailSuccess = action.payload;
        state.emailError = null;
      })
      .addCase(sendOccupancyByGroupFromLogsEmail.rejected, (state, action) => {
        state.emailLoading = false;
        state.emailError = action.payload || 'Failed to send occupancy by group from logs email';
        state.emailSuccess = null;
      })
      .addCase(sendSpaceUtilizationPerEmail.pending, (state) => {
        state.emailLoading = true;
        state.emailError = null;
        state.emailSuccess = null;
      })
      .addCase(sendSpaceUtilizationPerEmail.fulfilled, (state, action) => {
        state.emailLoading = false;
        state.emailSuccess = action.payload;
        state.emailError = null;
      })
      .addCase(sendSpaceUtilizationPerEmail.rejected, (state, action) => {
        state.emailLoading = false;
        state.emailError = action.payload || 'Failed to send space utilization email';
        state.emailSuccess = null;
      })
      .addCase(sendInstantOccupancyCountEmail.pending, (state) => {
        state.emailLoading = true;
        state.emailError = null;
        state.emailSuccess = null;
      })
      .addCase(sendInstantOccupancyCountEmail.fulfilled, (state, action) => {
        state.emailLoading = false;
        state.emailSuccess = action.payload;
        state.emailError = null;
      })
      .addCase(sendInstantOccupancyCountEmail.rejected, (state, action) => {
        state.emailLoading = false;
        state.emailError = action.payload || 'Failed to send instant occupancy count email';
        state.emailSuccess = null;
      })
      .addCase(sendSpaceUtilizationPerFromLogsEmail.pending, (state) => {
        state.emailLoading = true;
        state.emailError = null;
        state.emailSuccess = null;
      })
      .addCase(sendSpaceUtilizationPerFromLogsEmail.fulfilled, (state, action) => {
        state.emailLoading = false;
        state.emailSuccess = action.payload;
        state.emailError = null;
      })
      .addCase(sendSpaceUtilizationPerFromLogsEmail.rejected, (state, action) => {
        state.emailLoading = false;
        state.emailError = action.payload || 'Failed to send space utilization per from logs email';
        state.emailSuccess = null;
      })
      // Commented out - not using peak min max API for space utilization
      // .addCase(sendPeakMinOccupancyEmail.pending, (state) => {
      //   state.emailLoading = true;
      //   state.emailError = null;
      //   state.emailSuccess = null;
      // })
      // .addCase(sendPeakMinOccupancyEmail.fulfilled, (state, action) => {
      //   state.emailLoading = false;
      //   state.emailSuccess = action.payload;
      //   state.emailError = null;
      // })
      // .addCase(sendPeakMinOccupancyEmail.rejected, (state, action) => {
      //   state.emailLoading = false;
      //   state.emailError = action.payload || 'Failed to send peak min occupancy email';
      //   state.emailSuccess = null;
      // })
      .addCase(sendSavingsByStrategyEmail.pending, (state) => {
        state.emailLoading = true;
        state.emailError = null;
        state.emailSuccess = null;
      })
      .addCase(sendSavingsByStrategyEmail.fulfilled, (state, action) => {
        state.emailLoading = false;
        state.emailSuccess = action.payload;
        state.emailError = null;
      })
      .addCase(sendSavingsByStrategyEmail.rejected, (state, action) => {
        state.emailLoading = false;
        state.emailError = action.payload || 'Failed to send savings by strategy email';
        state.emailSuccess = null;
      })
      // Handle clear data cache
      .addCase(clearDataCache.fulfilled, (state) => {
        // Cache is cleared by the async thunk, no state changes needed
      });
  },
});

export const {
  setSelectedFloor,
  setSelectedAreas,
  setSelectedFloorIds,
  setSelectedGroups,
  setSelectedGroupIds,
  setSelectedDuration,
  setCustomDateRange,
  setCurrentDate,
  setCurrentYear,
  setIsNavigating,
  setGlobalLoading,
  setFilteredData,
  clearDashboardData
} = dashboardSlice.actions;



// Selectors
export const selectSelectedFloor = (state) => state.dashboard.selectedFloor;
export const selectSelectedAreas = (state) => state.dashboard.selectedAreas;
export const selectSelectedFloorIds = (state) => state.dashboard.selectedFloorIds;
export const selectSelectedGroups = (state) => state.dashboard.selectedGroups;
export const selectSelectedGroupIds = (state) => state.dashboard.selectedGroupIds;
export const selectSelectedDuration = (state) => state.dashboard.selectedDuration;
export const selectCustomDateRange = createSelector(
  [(state) => state.dashboard.customStartDate, (state) => state.dashboard.customEndDate],
  (customStartDate, customEndDate) => ({
    startDate: customStartDate,
    endDate: customEndDate
  })
);
export const selectIsNavigating = (state) => state.dashboard.isNavigating;
export const selectGlobalLoading = (state) => state.dashboard.globalLoading;
export const selectCurrentDate = (state) => state.dashboard.currentDate;
export const selectCurrentYear = (state) => state.dashboard.currentYear;
export const selectFilteredData = (state) => state.dashboard.filteredData;
export const selectTotalConsumptionByGroup = (state) => state.dashboard.totalConsumptionByGroup;
export const selectLightPowerDensity = (state) => state.dashboard.lightPowerDensity;
export const selectOccupancyCount = (state) => state.dashboard.occupancyCount;
export const selectInstantOccupancyCount = (state) => state.dashboard.instantOccupancyCount;
export const selectInstantOccupancyCountLoading = (state) => state.dashboard.instantOccupancyCountLoading;
export const selectInstantOccupancyCountError = (state) => state.dashboard.instantOccupancyCountError;
export const selectOccupancyByGroupFromLogs = (state) => state.dashboard.occupancyByGroupFromLogs;
export const selectOccupancyByGroupFromLogsLoading = (state) => state.dashboard.occupancyByGroupFromLogsLoading;
export const selectOccupancyByGroupFromLogsError = (state) => state.dashboard.occupancyByGroupFromLogsError;
export const selectSpaceUtilizationPerFromLogs = (state) => state.dashboard.spaceUtilizationPerFromLogs;
export const selectSpaceUtilizationPerFromLogsLoading = (state) => state.dashboard.spaceUtilizationPerFromLogsLoading;
export const selectSpaceUtilizationPerFromLogsError = (state) => state.dashboard.spaceUtilizationPerFromLogsError;
export const selectOccupancyByGroup = (state) => state.dashboard.occupancyByGroup;
export const selectSpaceUtilizationPerArea = (state) => state.dashboard.spaceUtilizationPerArea;
// export const selectPeakMinOccupancy = (state) => state.dashboard.peakMinOccupancy; // Commented out - not using peak min max API for space utilization
export const selectSavingsByStrategy = (state) => state.dashboard.savingsByStrategy;
export const selectAreaGroups = (state) => state.dashboard.areaGroups;
export const selectDashboardStatus = (state) => state.dashboard.status;
export const selectDashboardLoading = (state) => state.dashboard.loading;
export const selectDashboardError = (state) => state.dashboard.error;
// Email selectors
export const selectEmailLoading = (state) => state.dashboard.emailLoading;
export const selectEmailError = (state) => state.dashboard.emailError;
export const selectEmailSuccess = (state) => state.dashboard.emailSuccess;

export default dashboardSlice.reducer;
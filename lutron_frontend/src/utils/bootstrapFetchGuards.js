/**
 * In-flight / already-loaded guards so bootstrap endpoints fire once per session.
 * Pattern: skip if no token, already loaded in Redux, or request already in flight.
 */
import { getValidToken, fetchProfile } from '../redux/slice/auth/userlogin';
import { fetchFloors, selectFloors } from '../redux/slice/floor/floorSlice';
import {
  fetchApplicationTheme,
  fetchHeatMapTheme,
  selectApplicationTheme,
  selectHeatMapTheme,
} from '../redux/slice/theme/themeSlice';
import {
  fetchAreaGroups,
  selectAreaGroups,
  fetchRenameWidgets,
  getWidgetList,
} from '../redux/slice/settingsslice/heatmap/groupOccupancySlice';

const inflight = {
  profile: null,
  floors: null,
  applicationTheme: null,
  heatMapTheme: null,
  areaGroups: null,
  widgetTitles: null,
};

const loaded = {
  areaGroups: false,
  widgetTitles: false,
};

export function resetBootstrapFetchGuards() {
  Object.keys(inflight).forEach((key) => {
    inflight[key] = null;
  });
  Object.keys(loaded).forEach((key) => {
    loaded[key] = false;
  });
}

function hasToken() {
  return Boolean(getValidToken());
}

function hasThemePayload(theme) {
  if (!theme || typeof theme !== 'object') return false;
  return Boolean(
    theme.application_theme ||
    theme.status ||
    theme.ui_theme_colors ||
    theme.heatmap_colors
  );
}

function hasAreaGroupsPayload(groups) {
  if (!groups) return false;
  if (Array.isArray(groups)) return groups.length > 0;
  const special = groups.special_area_groups || [];
  const user = groups.user_area_groups || [];
  // Treat as loaded only after a successful fetch (inflight/fulfilled sets real payload).
  // Initial empty lists alone are not enough — use a soft flag via non-empty OR prior success.
  return special.length > 0 || user.length > 0;
}

export function dispatchFetchProfileOnce(dispatch, getState) {
  if (!hasToken()) return Promise.resolve(null);
  const profile = getState()?.user?.profile;
  if (profile) return Promise.resolve(null);
  if (inflight.profile) return inflight.profile;
  inflight.profile = dispatch(fetchProfile()).finally(() => {
    inflight.profile = null;
  });
  return inflight.profile;
}

export function dispatchFetchFloorsOnce(dispatch, getState) {
  if (!hasToken()) return Promise.resolve(null);
  const floors = selectFloors(getState());
  if (Array.isArray(floors) && floors.length > 0) {
    return Promise.resolve(null);
  }
  if (inflight.floors) return inflight.floors;
  inflight.floors = dispatch(fetchFloors()).finally(() => {
    inflight.floors = null;
  });
  return inflight.floors;
}

export function dispatchFetchApplicationThemeOnce(dispatch, getState) {
  if (!hasToken()) return Promise.resolve(null);
  if (hasThemePayload(selectApplicationTheme(getState()))) {
    return Promise.resolve(null);
  }
  if (inflight.applicationTheme) return inflight.applicationTheme;
  inflight.applicationTheme = dispatch(fetchApplicationTheme()).finally(() => {
    inflight.applicationTheme = null;
  });
  return inflight.applicationTheme;
}

export function dispatchFetchHeatMapThemeOnce(dispatch, getState) {
  if (!hasToken()) return Promise.resolve(null);
  if (hasThemePayload(selectHeatMapTheme(getState()))) {
    return Promise.resolve(null);
  }
  if (inflight.heatMapTheme) return inflight.heatMapTheme;
  inflight.heatMapTheme = dispatch(fetchHeatMapTheme()).finally(() => {
    inflight.heatMapTheme = null;
  });
  return inflight.heatMapTheme;
}

export function dispatchFetchAreaGroupsOnce(dispatch, getState) {
  if (!hasToken()) return Promise.resolve(null);
  if (loaded.areaGroups || hasAreaGroupsPayload(selectAreaGroups(getState()))) {
    loaded.areaGroups = true;
    return Promise.resolve(null);
  }
  if (inflight.areaGroups) return inflight.areaGroups;
  inflight.areaGroups = dispatch(fetchAreaGroups())
    .then((result) => {
      loaded.areaGroups = true;
      return result;
    })
    .finally(() => {
      inflight.areaGroups = null;
    });
  return inflight.areaGroups;
}

export function dispatchFetchWidgetTitlesOnce(dispatch, getState) {
  if (!hasToken()) return Promise.resolve(null);
  const list = getWidgetList(getState());
  if (loaded.widgetTitles || (Array.isArray(list) && list.length > 0)) {
    loaded.widgetTitles = true;
    return Promise.resolve(null);
  }
  if (inflight.widgetTitles) return inflight.widgetTitles;
  inflight.widgetTitles = dispatch(fetchRenameWidgets())
    .then((result) => {
      loaded.widgetTitles = true;
      return result;
    })
    .finally(() => {
      inflight.widgetTitles = null;
    });
  return inflight.widgetTitles;
}

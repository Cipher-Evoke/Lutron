/**
 * Coalesce identical dashboard chart GETs that fire from Dashboard thunks and
 * SpaceUtilization / custom-graph loaders at the same time.
 * In-flight join + short recent cache (Strict Mode / remount races).
 * Filter changes use a different key, so they are not served from cache.
 *
 * Singleton paths: one in-flight GET per browser tab. A new param set aborts
 * the previous request so refreshes cannot stack long scans.
 */
import { logEnergyTiming } from './energyTimingLog';

const inflight = new Map();
/** @type {Map<string, { promise: Promise<any>, expires: number }>} */
const recent = new Map();
const RECENT_TTL_MS = 2500;
const IGNORE_QUERY_KEYS = new Set(['_', 'cacheBust', 'cache_bust']);

/** Backend ignores group_ids on these GETs; treating them as distinct stacked identical SQL. */
const PATH_IGNORE_QUERY_KEYS = {
  '/dashboard/light_power_density': new Set(['group_ids', 'group_id']),
  '/dashboard/occupancy_count': new Set(['group_ids', 'group_id']),
  '/dashboard/instant_occupancy_count': new Set(['group_ids', 'group_id']),
};

const SINGLETON_INFLIGHT_PATHS = new Set([
  '/dashboard/light_power_density',
  '/dashboard/occupancy_count',
  '/dashboard/occupancy_by_group_from_logs',
  '/dashboard/space_utilization_per_from_logs',
  '/dashboard/instant_occupancy_count',
]);

/** @type {Map<string, { key: string, controller: AbortController }>} */
const pathFlights = new Map();

function normalizePath(urlOrPath) {
  const raw = String(urlOrPath || '').trim();
  if (!raw) return '';
  try {
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      const u = new URL(raw);
      return u.pathname.replace(/\/+$/, '') || '/';
    }
  } catch {
    /* fall through */
  }
  const noHash = raw.split('#')[0];
  const pathOnly = noHash.split('?')[0];
  return pathOnly.replace(/\/+$/, '') || '/';
}

function paramsFromUrl(urlOrPath) {
  const raw = String(urlOrPath || '');
  const q = raw.indexOf('?');
  if (q < 0) return new URLSearchParams();
  return new URLSearchParams(raw.slice(q + 1));
}

function mergeParams(urlOrPath, configParams) {
  const merged = paramsFromUrl(urlOrPath);
  if (!configParams) return merged;

  if (configParams instanceof URLSearchParams) {
    configParams.forEach((value, key) => {
      merged.append(key, value);
    });
    return merged;
  }

  if (typeof configParams === 'object') {
    Object.entries(configParams).forEach(([key, val]) => {
      if (val === null || val === undefined) return;
      if (Array.isArray(val)) {
        val.forEach((v) => {
          if (v !== null && v !== undefined) merged.append(key, String(v));
        });
      } else {
        merged.append(key, String(val));
      }
    });
  }
  return merged;
}

function ignoreKeysForPath(path) {
  const extra = PATH_IGNORE_QUERY_KEYS[path];
  if (!extra) return IGNORE_QUERY_KEYS;
  const merged = new Set(IGNORE_QUERY_KEYS);
  extra.forEach((k) => merged.add(k));
  return merged;
}

function stableQueryKey(params, path) {
  const ignore = ignoreKeysForPath(path);
  const entries = [...params.entries()]
    .filter(([k]) => !ignore.has(String(k)))
    .map(([k, v]) => [String(k), String(v)]);
  entries.sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]));
  return entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
}

export function buildDashboardGetCoalesceKey(urlOrPath, config = {}) {
  const path = normalizePath(urlOrPath);
  const query = stableQueryKey(mergeParams(urlOrPath, config?.params), path);
  return `${path}?${query}`;
}

function abortPathFlight(path, exceptKey) {
  const prior = pathFlights.get(path);
  if (!prior) return;
  if (exceptKey && prior.key === exceptKey) return;
  try {
    prior.controller.abort();
  } catch (_err) {
    // ignore
  }
  inflight.delete(prior.key);
  if (pathFlights.get(path) === prior) {
    pathFlights.delete(path);
  }
  logEnergyTiming('request-abort', { path, previousKey: prior.key, nextKey: exceptKey || null });
}

/**
 * Abort singleton in-flight GETs (currently LPD) when filters change or the tab unmounts.
 */
export function abortSingletonDashboardGets() {
  [...SINGLETON_INFLIGHT_PATHS].forEach((path) => abortPathFlight(path));
}

/**
 * @param {import('axios').AxiosInstance|{ get: Function }} client
 * @param {string} urlOrPath
 * @param {object} [config]
 * @returns {Promise<any>} axios response
 */
export function coalesceDashboardHttpGet(client, urlOrPath, config = {}) {
  const path = normalizePath(urlOrPath);
  const key = buildDashboardGetCoalesceKey(urlOrPath, config);

  if (SINGLETON_INFLIGHT_PATHS.has(path)) {
    abortPathFlight(path, key);
  }

  const existing = inflight.get(key);
  if (existing) return existing;

  const cached = recent.get(key);
  if (cached && Date.now() < cached.expires) {
    return cached.promise;
  }

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  if (SINGLETON_INFLIGHT_PATHS.has(path) && controller) {
    pathFlights.set(path, { key, controller });
  }

  const mergedConfig = controller
    ? { ...config, signal: config.signal || controller.signal }
    : { ...config };

  const promise = Promise.resolve(client.get(urlOrPath, mergedConfig))
    .then((response) => {
      recent.set(key, { promise: Promise.resolve(response), expires: Date.now() + RECENT_TTL_MS });
      return response;
    })
    .finally(() => {
      if (inflight.get(key) === promise) inflight.delete(key);
      const flight = pathFlights.get(path);
      if (flight && flight.controller === controller) {
        pathFlights.delete(path);
      }
    });

  inflight.set(key, promise);
  return promise;
}

export function resetDashboardHttpGetCoalesce() {
  inflight.clear();
  recent.clear();
  pathFlights.forEach((flight) => {
    try {
      flight.controller.abort();
    } catch (_err) {
      // ignore
    }
  });
  pathFlights.clear();
}

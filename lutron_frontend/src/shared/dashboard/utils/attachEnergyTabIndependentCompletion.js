import { logEnergyTiming } from './energyTimingLog';

let completionGeneration = 0;

function isAbortedDashboardResult(result, err) {
  if (err) {
    const name = err.name || '';
    const code = err.code || '';
    const message = String(err.message || '');
    if (name === 'CanceledError' || name === 'AbortError' || code === 'ERR_CANCELED') {
      return true;
    }
    if (/cancel|abort/i.test(message)) return true;
  }

  if (!result || typeof result !== 'object') return false;
  if (result.meta?.aborted) return true;
  if (result.meta?.requestStatus !== 'rejected') return false;

  const name = result.error?.name || '';
  const code = result.error?.code || '';
  const message = String(result.payload || result.error?.message || '');
  if (name === 'CanceledError' || name === 'AbortError' || code === 'ERR_CANCELED') {
    return true;
  }
  return /cancel|abort/i.test(message);
}

/**
 * Each Energy tab API completes its own widget loading flag immediately.
 * Does not wait for sibling requests (LPD must not block Consumption/Savings).
 * A newer Energy fetch invalidates in-flight completion callbacks from the previous one.
 */
export function attachEnergyTabIndependentCompletion({
  apiCalls,
  completeEnergyWidgetLoading,
  onAllSettled,
}) {
  const generation = ++completionGeneration;
  const isStale = () => generation !== completionGeneration;
  const startedAt = {};

  apiCalls.forEach((apiCall) => {
    startedAt[apiCall.name] = Date.now();
    logEnergyTiming('request-start', { widget: apiCall.name, generation });

    apiCall.promise
      .then((result) => {
        if (isStale()) return;
        if (isAbortedDashboardResult(result)) {
          logEnergyTiming('request-aborted', { widget: apiCall.name, generation });
          return;
        }
        logEnergyTiming('response-received', {
          widget: apiCall.name,
          ms: Date.now() - startedAt[apiCall.name],
          generation,
        });
        completeEnergyWidgetLoading(apiCall.name);
        logEnergyTiming('widget-render', { widget: apiCall.name, generation });
      })
      .catch((err) => {
        if (isStale()) return;
        if (isAbortedDashboardResult(null, err)) {
          logEnergyTiming('request-aborted', { widget: apiCall.name, generation });
          return;
        }
        logEnergyTiming('response-error', {
          widget: apiCall.name,
          ms: Date.now() - startedAt[apiCall.name],
          message: err?.message || String(err),
          generation,
        });
        completeEnergyWidgetLoading(apiCall.name);
      });
  });

  Promise.allSettled(apiCalls.map((apiCall) => apiCall.promise)).then(() => {
    if (isStale()) return;
    if (typeof onAllSettled === 'function') {
      onAllSettled();
    }
  });
}

export function resetEnergyTabIndependentCompletion() {
  completionGeneration += 1;
}

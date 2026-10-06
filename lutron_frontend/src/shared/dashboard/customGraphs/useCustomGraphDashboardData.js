import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildDashboardChartAxiosParams, serializeDashboardApiParams } from '../utils/buildDashboardApiParams';
import { coalesceDashboardHttpGet } from '../utils/coalesceDashboardHttpGet';
import { applyCustomGraphGroupScopedParams } from '../../../variants/customized/utils/applyCustomGraphGroupScopedParams';
import { intersectDashboardAreasWithGraphFloorCeiling } from '../../../variants/customized/utils/mergeCustomGraphScopeIntoApiParams';
import { resolveDashboardThunkForCustomGraphPath } from '../../../variants/customized/utils/dashboardCustomGraphThunkResolver';

const CUSTOM_GRAPH_HTTP_TIMEOUT_MS = 30000;
const EMPTY_AREA_FLOOR_MAP = new Map();

function isAbortError(error) {
  return (
    error?.code === 'ERR_CANCELED' ||
    error?.name === 'CanceledError' ||
    error?.message === 'canceled'
  );
}

/**
 * Loads data for user-defined custom graphs on basic/advanced dashboards.
 * Uses the same thunk/HTTP paths as customized built-ins where possible.
 */
export function useCustomGraphDashboardData({
  customGraphs,
  apiParams,
  /** Stable serialization of apiParams — prevents fetch effect loops when apiParams identity changes. */
  apiParamsKey,
  dispatch,
  store,
  areaIdToFloorId = EMPTY_AREA_FLOOR_MAP,
  baseUrlClient,
  /** When false, always use HTTP — avoids Redux globalLoading side effects on basic/advanced. */
  dispatchThunks = true,
}) {
  const [customGraphData, setCustomGraphData] = useState({});
  const [customGraphLoading, setCustomGraphLoading] = useState({});
  const [customGraphError, setCustomGraphError] = useState({});
  const abortByGraphIdRef = useRef({});
  const mountedRef = useRef(true);
  const areaIdToFloorIdRef = useRef(areaIdToFloorId);
  const apiParamsRef = useRef(apiParams);
  const lastFetchSignatureRef = useRef('');

  areaIdToFloorIdRef.current = areaIdToFloorId;
  apiParamsRef.current = apiParams;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      Object.values(abortByGraphIdRef.current).forEach((controller) => {
        try {
          controller.abort();
        } catch {
          /* ignore */
        }
      });
      abortByGraphIdRef.current = {};
    };
  }, []);

  const fetchCustomGraphData = useCallback(
    async (g, qp) => {
      const id = String(g?.id ?? g?.name ?? '');
      const path = String(g?.api_path ?? '').trim();
      if (!id || !path) return;

      const prior = abortByGraphIdRef.current[id];
      if (prior) {
        try {
          prior.abort();
        } catch {
          /* ignore */
        }
      }
      const controller = new AbortController();
      abortByGraphIdRef.current[id] = controller;

      if (!mountedRef.current) return;

      setCustomGraphLoading((p) => ({ ...p, [id]: true }));
      setCustomGraphError((p) => ({ ...p, [id]: null }));

      try {
        let effectiveQp = applyCustomGraphGroupScopedParams(() => store.getState(), qp, g);
        effectiveQp = intersectDashboardAreasWithGraphFloorCeiling(
          effectiveQp,
          g,
          areaIdToFloorIdRef.current
        );

        const rule = dispatchThunks ? resolveDashboardThunkForCustomGraphPath(path) : null;
        if (rule && effectiveQp) {
          const arg = rule.mapArgs ? rule.mapArgs(effectiveQp) : effectiveQp;
          await dispatch(rule.thunk(arg)).unwrap();
          if (!mountedRef.current || controller.signal.aborted) return;
          const data = rule.select(store.getState());
          setCustomGraphData((p) => ({ ...p, [id]: data }));
        } else {
          const paramsObj = buildDashboardChartAxiosParams(effectiveQp);
          if (!baseUrlClient || typeof baseUrlClient.get !== 'function') {
            throw new Error('Chart client unavailable');
          }
          const res = await coalesceDashboardHttpGet(baseUrlClient, path, {
            params: paramsObj,
            signal: controller.signal,
            timeout: CUSTOM_GRAPH_HTTP_TIMEOUT_MS,
          });
          if (!mountedRef.current || controller.signal.aborted) return;
          setCustomGraphData((p) => ({ ...p, [id]: res.data }));
        }
      } catch (e) {
        if (!mountedRef.current || controller.signal.aborted || isAbortError(e)) return;
        const message =
          e?.code === 'ECONNABORTED'
            ? 'Chart request timed out'
            : e?.message || 'Failed to load';
        setCustomGraphError((p) => ({
          ...p,
          [id]: message,
        }));
      } finally {
        if (abortByGraphIdRef.current[id] === controller) {
          delete abortByGraphIdRef.current[id];
        }
        if (!mountedRef.current || controller.signal.aborted) return;
        setCustomGraphLoading((p) => ({ ...p, [id]: false }));
      }
    },
    [dispatch, store, baseUrlClient, dispatchThunks]
  );

  const graphList = useMemo(
    () => (Array.isArray(customGraphs) ? customGraphs : []),
    [customGraphs]
  );

  const graphIdsKey = useMemo(
    () =>
      graphList
        .map((g) => String(g?.id ?? g?.name ?? ''))
        .filter(Boolean)
        .join('|'),
    [graphList]
  );

  const resolvedApiParamsKey = useMemo(() => {
    if (!apiParams) return '';
    if (apiParamsKey) return apiParamsKey;
    return serializeDashboardApiParams(apiParams);
  }, [apiParams, apiParamsKey]);

  useEffect(() => {
    if (!apiParams || graphList.length === 0) {
      lastFetchSignatureRef.current = '';
      return undefined;
    }

    const signature = `${graphIdsKey}::${resolvedApiParamsKey}`;
    if (lastFetchSignatureRef.current === signature) {
      return undefined;
    }
    lastFetchSignatureRef.current = signature;

    const qp = apiParamsRef.current;
    graphList.forEach((g) => {
      fetchCustomGraphData(g, qp);
    });
    return undefined;
  }, [graphList, graphIdsKey, resolvedApiParamsKey, fetchCustomGraphData]);

  return {
    customGraphData,
    customGraphLoading,
    customGraphError,
    refetchCustomGraph: fetchCustomGraphData,
  };
}

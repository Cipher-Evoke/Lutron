import { useMemo, useSyncExternalStore } from 'react';
import {
  subscribeGraphSizes,
  getGraphSizesSnapshot,
  getServerGraphSizesSnapshot,
  getGraphSize,
} from './graphSizesStore';

/**
 * Subscribes to in-memory graph dimensions (session only).
 * @param {string} graphId
 * @param {{ width?: string|number, height?: string|number }} [defaults]
 */
export function useGraphSize(graphId, defaults) {
  const snap = useSyncExternalStore(
    subscribeGraphSizes,
    getGraphSizesSnapshot,
    getServerGraphSizesSnapshot
  );
  return useMemo(() => getGraphSize(graphId, defaults), [graphId, snap, defaults?.width, defaults?.height]);
}


import {
  savingsStrategyToPieRows,
  savingsStrategyEntriesFromPayload,
  isSavingsStrategyTransitionalData,
} from '../transforms/savingsStrategyToPieRows';

/**
 * Shared React.memo comparator for SavingsStrategyChart adapter props.
 */
export function savingsStrategyChartPropsAreEqual(prevProps, nextProps) {
  if (prevProps.title !== nextProps.title) return false;
  if (prevProps.isLoading !== nextProps.isLoading) return false;
  if (prevProps.globalLoading !== nextProps.globalLoading) return false;

  if ('chartSurface' in prevProps || 'chartSurface' in nextProps) {
    if (prevProps.chartSurface !== nextProps.chartSurface) return false;
  }
  if ('embedded' in prevProps || 'embedded' in nextProps) {
    if (prevProps.embedded !== nextProps.embedded) return false;
  }
  if ('customDatesIncomplete' in prevProps || 'customDatesIncomplete' in nextProps) {
    if (prevProps.customDatesIncomplete !== nextProps.customDatesIncomplete) return false;
  }

  if (prevProps.savingsByStrategy !== nextProps.savingsByStrategy) {
    if (prevProps.savingsByStrategy && nextProps.savingsByStrategy) {
      try {
        if (JSON.stringify(prevProps.savingsByStrategy) === JSON.stringify(nextProps.savingsByStrategy)) {
          return true;
        }
      } catch (e) {
        // fall through
      }
    }
    return false;
  }

  return true;
}

/**
 * Replicated legacy status + pie row pipeline from variant Dashboard.jsx.
 */
export function legacySavingsStrategyStatus(savingsByStrategy, { isLoading, globalLoading }) {
  if (isLoading || globalLoading) return 'loading';
  if (!savingsByStrategy) return 'empty-null';
  if (isSavingsStrategyTransitionalData(savingsByStrategy)) return 'loading';
  const entries = savingsStrategyEntriesFromPayload(savingsByStrategy);
  const total = entries.reduce((s, d) => s + d.value, 0);
  if (total === 0) return 'empty-zero';
  return 'ready';
}

export function sharedSavingsStrategyStatus(
  savingsByStrategy,
  { isLoading, globalLoading, customDatesIncomplete = false }
) {
  if (customDatesIncomplete) return 'custom-range-placeholder';
  return legacySavingsStrategyStatus(savingsByStrategy, { isLoading, globalLoading });
}

export function legacySavingsStrategyPieRows(savingsByStrategy) {
  return savingsStrategyToPieRows(savingsByStrategy);
}

/**
 * @jest-environment node
 */
import { energyLineChartPropsAreEqual } from './energyLineChartMemoCompare';

/**
 * Replicated pre-6.2A.3A inline comparator from variant Dashboard.jsx EnergyLineChart.
 * Used only to prove shared comparator preserves skip-render semantics.
 */
function legacyEnergyLineChartPropsAreEqual(prevProps, nextProps) {
  if (prevProps.title !== nextProps.title) return false;
  if (prevProps.isLoading !== nextProps.isLoading) return false;
  if (prevProps.colors !== nextProps.colors) return false;
  if (prevProps.onEmail !== nextProps.onEmail) return false;
  if (prevProps.onDownload !== nextProps.onDownload) return false;

  if ('chartSurface' in prevProps || 'chartSurface' in nextProps) {
    if (prevProps.chartSurface !== nextProps.chartSurface) return false;
  }

  if ('legendSeriesName' in prevProps || 'legendSeriesName' in nextProps) {
    if (prevProps.legendSeriesName !== nextProps.legendSeriesName) return false;
  }

  if ('emptyStateVariant' in prevProps || 'emptyStateVariant' in nextProps) {
    if (prevProps.emptyStateVariant !== nextProps.emptyStateVariant) return false;
  }

  if ('showDurationControls' in prevProps || 'showDurationControls' in nextProps) {
    if (prevProps.showDurationControls !== nextProps.showDurationControls) return false;
  }

  if (prevProps.data !== nextProps.data) {
    if (prevProps.data && nextProps.data) {
      try {
        if (JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data)) {
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

const baseProps = {
  title: 'Consumption',
  data: { 'x-axis': ['a'], 'y-axis': { Combined: [1] }, unit: 'kWh' },
  colors: ['#e57373', '#64b5f6'],
  onEmail: () => {},
  onDownload: () => {},
  isLoading: false,
};

const variants = [
  {},
  { chartSurface: 'light' },
  { chartSurface: 'dark', emptyStateVariant: 'blank', showDurationControls: true },
  { legendSeriesName: 'Energy Consumption' },
];

const dataMutations = [
  (p) => p,
  (p) => ({ ...p, data: { ...p.data, unit: 'kWh' } }),
  (p) => ({ ...p, data: JSON.parse(JSON.stringify(p.data)) }),
  (p) => ({ ...p, title: 'Savings' }),
  (p) => ({ ...p, isLoading: true }),
];

describe('energyLineChartPropsAreEqual vs legacy inline comparator', () => {
  it.each(
    variants.flatMap((variant) =>
      dataMutations.map((mutate, i) => ({
        label: `${JSON.stringify(variant)} / mutation ${i}`,
        prev: { ...baseProps, ...variant },
        next: mutate({ ...baseProps, ...variant }),
      }))
    )
  )('$label: legacy === shared', ({ prev, next }) => {
    const legacy = legacyEnergyLineChartPropsAreEqual(prev, next);
    const shared = energyLineChartPropsAreEqual(prev, next);
    expect(shared).toBe(legacy);
  });

  it('skips re-render when data is deep-equal but reference differs', () => {
    const prev = { ...baseProps };
    const next = {
      ...baseProps,
      data: JSON.parse(JSON.stringify(baseProps.data)),
    };
    expect(energyLineChartPropsAreEqual(prev, next)).toBe(true);
    expect(legacyEnergyLineChartPropsAreEqual(prev, next)).toBe(true);
  });

  it('re-renders when data content changes', () => {
    const prev = { ...baseProps };
    const next = {
      ...baseProps,
      data: { ...baseProps.data, unit: 'W' },
    };
    expect(energyLineChartPropsAreEqual(prev, next)).toBe(false);
  });

  it('re-renders when exportControl changes', () => {
    const prev = { ...baseProps, exportControl: { type: 'export-a' } };
    const next = { ...baseProps, exportControl: { type: 'export-b' } };
    expect(energyLineChartPropsAreEqual(prev, next)).toBe(false);
  });
});

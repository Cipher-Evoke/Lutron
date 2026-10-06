/**
 * @jest-environment node
 */
import {
  SUPPORTED_SPACE_WIDGET_RENDERER_KEYS,
  SPACE_WIDGET_RENDERER_TYPES,
  getSpaceWidgetRenderMapEntry,
  isSupportedSpaceWidgetRendererKey,
  isSpaceWidgetRendererSupportedForVariant,
} from './spaceWidgetRenderMap';
import {
  resolveSpaceWidgetRenderer,
  resolveSpaceWidgetVisibility,
  resolveSpaceWidgetProps,
  resolveSpaceWidgetTitle,
  resolveSpaceWidgetLoading,
  buildSpaceWidgetRenderContext,
  isRenderableSpaceWidgetKey,
} from './spaceWidgetSlotResolvers';

const widgetList = {
  titles: [
    { key: 'utilization', title: 'Custom Utilization' },
    { key: 'utilization_by_area_group', title: 'Custom Groups' },
  ],
};

const baseContext = {
  variant: 'basic',
  selectorMode: 'active',
  showChartsTab: true,
  widgetList,
  getWidgetTitle: (key, fallback) => {
    const widget = widgetList.titles.find((item) => item.key === key);
    return widget?.title || fallback;
  },
  data: {
    occupancyCount: { series: [] },
    instantOccupancyCount: { value: 1 },
    instantOccupancyCountError: null,
    activeOccupancyByGroup: { groups: [] },
    activeSpaceUtilizationPerArea: { areas: [] },
    spaceUtilizationPerArea: { areas: [] },
  },
  loading: {
    occupancyCountLoading: false,
    instantOccupancyCountLoading: false,
    activeOccupancyByGroupLoading: false,
    occupancyByGroupLoading: false,
    activeSpaceUtilizationLoading: false,
    spaceUtilizationLoading: false,
    anyLoading: false,
    isLoading: false,
    globalLoadingProp: false,
  },
  chart: {
    selectedDuration: 'this_week',
    currentDate: '2026-06-10',
    currentYear: 2026,
    customDateRange: { startDate: '', endDate: '' },
    isNavigating: false,
    showChartsTab: true,
  },
  shell: {
    spaceShell: { bg: '#fff' },
    chartSurface: 'dark',
    colorPalette: ['#ff0000'],
    isLargeScreen: true,
    utilizationByAreaLayoutMode: 'scroll',
  },
  overrides: {
    utilization: { isFullscreen: true },
    instant_occupancy_count: { chartSurface: 'light' },
  },
};

describe('spaceWidgetSlotResolvers', () => {
  describe('resolveSpaceWidgetRenderer', () => {
    it('returns map entry for supported space keys', () => {
      expect(resolveSpaceWidgetRenderer('utilization')).toMatchObject({
        type: SPACE_WIDGET_RENDERER_TYPES.LINE_CHART,
      });
      expect(resolveSpaceWidgetRenderer('peak_and_minimum_utilization')).toMatchObject({
        type: SPACE_WIDGET_RENDERER_TYPES.PEAK_MIN_CARDS,
      });
    });

    it('does not include instant_utilization_combined', () => {
      expect(resolveSpaceWidgetRenderer('instant_utilization_combined')).toBeNull();
      expect(SUPPORTED_SPACE_WIDGET_RENDERER_KEYS).not.toContain('instant_utilization_combined');
    });
  });

  describe('resolveSpaceWidgetTitle', () => {
    it('uses tab-specific fallback for utilization_by_area_group', () => {
      expect(
        resolveSpaceWidgetTitle('utilization_by_area_group', { selectorMode: 'active' })
      ).toBe('Occupancy by Group');
      expect(
        resolveSpaceWidgetTitle('utilization_by_area_group', { selectorMode: 'main' })
      ).toBe('Utilization By Area Groups');
    });

    it('prefers widgetList title when present', () => {
      expect(resolveSpaceWidgetTitle('utilization', baseContext)).toBe('Custom Utilization');
    });
  });

  describe('resolveSpaceWidgetVisibility', () => {
    it('returns false for unknown keys', () => {
      expect(resolveSpaceWidgetVisibility('unknown')).toBe(false);
    });

    it('respects shouldShowWidget when provided', () => {
      expect(
        resolveSpaceWidgetVisibility('utilization', {
          variant: 'customized',
          shouldShowWidget: (key) => key === 'utilization',
        })
      ).toBe(true);
      expect(
        resolveSpaceWidgetVisibility('utilization_by_area', {
          variant: 'customized',
          shouldShowWidget: (key) => key === 'utilization',
        })
      ).toBe(false);
    });
  });

  describe('resolveSpaceWidgetLoading', () => {
    it('returns false for widgets with internal loading', () => {
      expect(resolveSpaceWidgetLoading('peak_and_minimum_utilization', baseContext)).toBe(false);
      expect(resolveSpaceWidgetLoading('utilization_by_area', baseContext)).toBe(false);
    });

    it('uses active selector loading on charts tab for area groups', () => {
      const ctx = {
        ...baseContext,
        selectorMode: 'active',
        loading: { ...baseContext.loading, activeOccupancyByGroupLoading: true },
      };
      expect(resolveSpaceWidgetLoading('utilization_by_area_group', ctx)).toBe(true);
    });

    it('uses main selector loading on main tab for area groups', () => {
      const ctx = {
        ...baseContext,
        selectorMode: 'main',
        loading: { ...baseContext.loading, occupancyByGroupLoading: true },
      };
      expect(resolveSpaceWidgetLoading('utilization_by_area_group', ctx)).toBe(true);
    });

    it('does not treat sibling/global flags as this widget loading', () => {
      const ctx = {
        ...baseContext,
        loading: { ...baseContext.loading, globalLoadingProp: true, anyLoading: true, isLoading: true },
      };
      expect(resolveSpaceWidgetLoading('utilization', ctx)).toBe(false);
    });
  });

  describe('resolveSpaceWidgetProps', () => {
    it.each(SUPPORTED_SPACE_WIDGET_RENDERER_KEYS)(
      'returns props object for supported key: %s',
      (widgetKey) => {
        const props = resolveSpaceWidgetProps(widgetKey, baseContext);
        expect(props).toBeTruthy();
        expect(props.shellVariant).toBe('basic');
      }
    );

    it('switches utilization-by-area payload by selector mode', () => {
      const activeProps = resolveSpaceWidgetProps('utilization_by_area', baseContext);
      const mainProps = resolveSpaceWidgetProps('utilization_by_area', {
        ...baseContext,
        selectorMode: 'main',
      });
      expect(activeProps.payload).toBe(baseContext.data.activeSpaceUtilizationPerArea);
      expect(mainProps.payload).toBe(baseContext.data.spaceUtilizationPerArea);
      expect(mainProps.dataLoading).toBe(baseContext.loading.spaceUtilizationLoading);
    });

    it('uses occupancy count loading on the main tab, not a shared gate', () => {
      const props = resolveSpaceWidgetProps('peak_and_minimum_utilization', {
        ...baseContext,
        selectorMode: 'main',
        loading: { ...baseContext.loading, occupancyCountLoading: true, globalLoadingProp: true },
      });
      expect(props.includeInstantLoading).toBe(false);
      expect(props.isLoading).toBe(true);
      expect(props.instantOccupancyCountLoading).toBeUndefined();
    });

    it('does not mark main-tab peak/min loading from sibling global flags', () => {
      const props = resolveSpaceWidgetProps('peak_and_minimum_utilization', {
        ...baseContext,
        selectorMode: 'main',
        loading: { ...baseContext.loading, globalLoadingProp: true },
      });
      expect(props.isLoading).toBe(false);
    });

    it('merges per-widget overrides', () => {
      const props = resolveSpaceWidgetProps('utilization', baseContext);
      expect(props.isFullscreen).toBe(true);
      const instantProps = resolveSpaceWidgetProps('instant_occupancy_count', baseContext);
      expect(instantProps.chartSurface).toBe('light');
    });

    it('applies advanced card shell props', () => {
      const props = resolveSpaceWidgetProps('utilization', {
        ...baseContext,
        variant: 'advanced',
        shell: {
          ...baseContext.shell,
          lineSeriesColor: '#abc',
          cardBackground: '#111',
        },
      });
      expect(props.shellVariant).toBe('advanced');
      expect(props.lineSeriesColor).toBe('#abc');
      expect(props.cardBackground).toBe('#111');
    });
  });

  describe('buildSpaceWidgetRenderContext', () => {
    it('assembles a render context with chart.showChartsTab', () => {
      const ctx = buildSpaceWidgetRenderContext({
        variant: 'basic',
        showChartsTab: true,
        data: baseContext.data,
        loading: baseContext.loading,
      });
      expect(ctx.chart.showChartsTab).toBe(true);
      expect(ctx.variant).toBe('basic');
    });
  });

  describe('registry helpers', () => {
    it('validates supported keys', () => {
      expect(isSupportedSpaceWidgetRendererKey('utilization')).toBe(true);
      expect(isRenderableSpaceWidgetKey('utilization')).toBe(true);
      expect(isSpaceWidgetRendererSupportedForVariant('utilization', 'basic')).toBe(true);
      expect(getSpaceWidgetRenderMapEntry('utilization').key).toBe('utilization');
    });
  });
});

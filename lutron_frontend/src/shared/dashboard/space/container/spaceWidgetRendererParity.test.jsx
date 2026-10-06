/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import SpaceWidgetRenderer from './SpaceWidgetRenderer';
import {
  resolveSpaceWidgetLoading,
  resolveSpaceWidgetProps,
} from './spaceWidgetSlotResolvers';
import { SUPPORTED_SPACE_WIDGET_RENDERER_KEYS } from './spaceWidgetRenderMap';

jest.mock('../../charts/space/SpaceLineChartAdapter', () => {
  const React = require('react');
  return (props) => (
    <div data-testid="space-line-chart-adapter" data-shell={props.shellVariant}>
      line
    </div>
  );
});

jest.mock('../../charts/space/SpaceStackedBarChartAdapter', () => {
  const React = require('react');
  return (props) => (
    <div data-testid="space-stacked-bar-chart-adapter" data-shell={props.shellVariant}>
      stacked
    </div>
  );
});

jest.mock('../../charts/space/InstantOccupancyChartAdapter', () => {
  const React = require('react');
  return (props) => (
    <div
      data-testid="instant-occupancy-chart-adapter"
      data-surface={props.chartSurface}
    >
      instant
    </div>
  );
});

jest.mock('../widgets', () => {
  const React = require('react');
  return {
    SpacePeakMinCards: (props) => (
      <div data-testid="space-peak-min-cards" data-shell={props.shellVariant}>
        peak-min
      </div>
    ),
    UtilizationByAreaList: (props) => (
      <div data-testid="utilization-by-area-list" data-layout={props.layoutMode}>
        area-list
      </div>
    ),
  };
});

const TEST_ID_BY_KEY = {
  utilization: 'space-line-chart-adapter',
  utilization_by_area_group: 'space-stacked-bar-chart-adapter',
  instant_occupancy_count: 'instant-occupancy-chart-adapter',
  peak_and_minimum_utilization: 'space-peak-min-cards',
  utilization_by_area: 'utilization-by-area-list',
};

const ChartLoader = ({ height }) => (
  <div data-testid="chart-loader" data-height={height}>
    loading
  </div>
);

const baseContext = {
  variant: 'basic',
  selectorMode: 'active',
  showChartsTab: true,
  data: {
    occupancyCount: {},
    instantOccupancyCount: {},
    instantOccupancyCountError: null,
    activeOccupancyByGroup: {},
    activeSpaceUtilizationPerArea: {},
    spaceUtilizationPerArea: {},
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
    chartSurface: 'dark',
    utilizationByAreaLayoutMode: 'scroll',
    isLargeScreen: false,
  },
  ChartLoader,
  overrides: {},
};

describe('SpaceWidgetRenderer parity', () => {
  it.each(SUPPORTED_SPACE_WIDGET_RENDERER_KEYS)(
    'renders supported space widget key: %s',
    (widgetKey) => {
      render(
        <SpaceWidgetRenderer widgetKey={widgetKey} context={baseContext} visible />
      );
      expect(screen.getByTestId(TEST_ID_BY_KEY[widgetKey])).toBeInTheDocument();
    }
  );

  it('returns null for unsupported keys', () => {
    const { container } = render(
      <SpaceWidgetRenderer widgetKey="instant_utilization_combined" context={baseContext} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows ChartLoader when resolveSpaceWidgetLoading is true', () => {
    const context = {
      ...baseContext,
      loading: { ...baseContext.loading, occupancyCountLoading: true },
    };
    render(
      <SpaceWidgetRenderer
        widgetKey="utilization"
        context={context}
        chartLoaderHeight="350px"
      />
    );
    expect(screen.getByTestId('chart-loader')).toHaveAttribute('data-height', '350px');
    expect(screen.queryByTestId('space-line-chart-adapter')).not.toBeInTheDocument();
  });

  it('loading parity matches resolver for chart widgets', () => {
    SUPPORTED_SPACE_WIDGET_RENDERER_KEYS.forEach((widgetKey) => {
      const loadingContext = {
        ...baseContext,
        selectorMode: widgetKey === 'utilization_by_area_group' ? 'main' : 'active',
        loading: {
          ...baseContext.loading,
          occupancyCountLoading: widgetKey === 'utilization',
          instantOccupancyCountLoading: widgetKey === 'instant_occupancy_count',
          occupancyByGroupLoading: widgetKey === 'utilization_by_area_group',
        },
      };
      const expectedLoading = resolveSpaceWidgetLoading(widgetKey, loadingContext);
      const { unmount } = render(
        <SpaceWidgetRenderer
          widgetKey={widgetKey}
          context={loadingContext}
          chartLoaderHeight="200px"
        />
      );
      if (expectedLoading) {
        expect(screen.getByTestId('chart-loader')).toBeInTheDocument();
      } else {
        expect(screen.getByTestId(TEST_ID_BY_KEY[widgetKey])).toBeInTheDocument();
      }
      unmount();
    });
  });

  it('applies overrides to instant occupancy chart surface', () => {
    render(
      <SpaceWidgetRenderer
        widgetKey="instant_occupancy_count"
        context={baseContext}
        overrides={{ chartSurface: 'light', enableUtilizationFooter: true }}
      />
    );
    expect(screen.getByTestId('instant-occupancy-chart-adapter')).toHaveAttribute(
      'data-surface',
      'light'
    );
    const props = resolveSpaceWidgetProps('instant_occupancy_count', {
      ...baseContext,
      overrides: { instant_occupancy_count: { chartSurface: 'light' } },
    });
    expect(props.chartSurface).toBe('light');
  });

  it('respects visible=false', () => {
    const { container } = render(
      <SpaceWidgetRenderer widgetKey="utilization" context={baseContext} visible={false} />
    );
    expect(container.firstChild).toBeNull();
  });
});

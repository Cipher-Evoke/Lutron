/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import SpaceUtilizationContainer from './SpaceUtilizationContainer';
import SpaceLayoutRenderer from './SpaceLayoutRenderer';
import { basicSpaceContainerAdapter } from './adapters/basicSpaceContainerAdapter';
import { advancedSpaceContainerAdapter } from './adapters/advancedSpaceContainerAdapter';
import { customizedSpaceContainerAdapter } from './adapters/customizedSpaceContainerAdapter';
import { SPACE_TAB_IDS } from './spaceLayoutTypes';

jest.mock('./SpaceLayoutRenderer', () => {
  const React = require('react');
  const MockSpaceLayoutRenderer = (props) => (
    <div
      data-testid="space-layout-renderer"
      data-active-tab={props.activeTab}
      data-layout-mode={props.adapter?.layoutMode}
    >
      {props.runtime?.renderSortableLayout?.() || 'layout-body'}
    </div>
  );
  return { __esModule: true, default: MockSpaceLayoutRenderer };
});

const baseWidgetContext = {
  variant: 'basic',
  showChartsTab: true,
  data: {},
  loading: {},
};

const baseOrchestration = {
  exports: {
    showExportDropdown: {},
    setShowExportDropdown: jest.fn(),
    exportLoading: {},
    handleExport: jest.fn(),
  },
  widgetContext: baseWidgetContext,
  layoutContext: {
    variant: 'basic',
    showChartsTab: true,
    visibleSlotOrder: ['instant_occupancy_count'],
    widgetRenderContext: baseWidgetContext,
  },
  chartsLayoutContext: {
    variant: 'basic',
    showChartsTab: true,
    visibleSlotOrder: ['instant_occupancy_count'],
    widgetRenderContext: baseWidgetContext,
  },
  mainLayoutContext: {
    variant: 'basic',
    showChartsTab: false,
    visibleSlotOrder: ['utilization'],
    widgetRenderContext: baseWidgetContext,
  },
  loading: { anyLoading: false },
  visibility: {
    spaceChartsVisibleOrder: ['instant_occupancy_count'],
    spaceMainVisibleOrder: ['utilization'],
  },
};

const presentationRuntime = {
  SpaceLayoutRenderer,
  layoutAdapter: { layoutMode: 'dynamic-rows', variant: 'basic' },
  layoutRuntime: {
    renderWidgetSlot: jest.fn(() => <div data-testid="widget-slot">slot</div>),
  },
};

describe('space container adapters', () => {
  it('basic adapter resolves widget, layout, and export options', () => {
    const runtime = {
      showChartsTab: true,
      widgetList: { titles: [{ key: 'utilization', title: 'Utilization' }] },
      occupancyCount: { 'x-axis': [], 'y-axis': {} },
      occupancyCountLoading: false,
      globalLoading: false,
      isLoading: false,
      globalLoadingProp: false,
      instantOccupancyCountLoading: false,
      selectedDuration: 'this-day',
      currentDate: '2026-01-01',
      currentYear: 2026,
      customDateRange: {},
      isNavigating: false,
      spaceShell: {},
      spaceUtilLight: true,
      colorPalette: [],
      isLargeScreen: true,
      ChartLoader: () => null,
      spaceChartsVisibleOrder: ['utilization'],
      spaceMainVisibleOrder: ['utilization'],
      showSpaceChartsStandaloneDurationFilter: false,
      dispatch: jest.fn(),
      showSnackbar: jest.fn(),
      userProfile: { email: 'user@example.com' },
      fetchEmailConfigs: jest.fn(),
      selectedAreas: [],
      selectedFloorIds: [],
      exportThunks: {},
    };

    const widgetOptions = basicSpaceContainerAdapter.resolveWidgetOptions(runtime);
    expect(widgetOptions.variant).toBe('basic');
    expect(widgetOptions.getWidgetTitle('utilization', 'Utilization')).toBe('Utilization');

    const layoutOptions = basicSpaceContainerAdapter.resolveLayoutOptions(runtime);
    expect(layoutOptions.spaceChartsVisibleOrder).toEqual(['utilization']);

    const exportOptions = basicSpaceContainerAdapter.resolveExportOptions(runtime);
    expect(exportOptions.messagePreset).toBe('basic');
  });

  it('advanced adapter builds a single shared layout context', () => {
    const widgetContext = { variant: 'advanced' };
    const layoutContexts = advancedSpaceContainerAdapter.buildLayoutContexts({
      widgetContext,
      layoutOptions: { showChartsTab: true, showOnlyInstantChart: false },
    });
    expect(layoutContexts.chartsLayoutContext).toBe(layoutContexts.mainLayoutContext);
  });

  it('customized adapter delegates sortable runtime for charts tab', () => {
    const section = customizedSpaceContainerAdapter.buildSections({
      orchestration: baseOrchestration,
      runtime: {
        ...presentationRuntime,
        chartsLayoutRuntime: {
          renderSortableLayout: () => <div data-testid="sortable-grid">grid</div>,
        },
        mainLayoutRuntime: presentationRuntime.layoutRuntime,
      },
      activeTab: SPACE_TAB_IDS.CHARTS,
    });

    render(section);
    expect(screen.getByTestId('sortable-grid')).toBeInTheDocument();
  });
});

describe('SpaceUtilizationContainer', () => {
  it('routes active charts tab through SpaceLayoutRenderer', () => {
    render(
      <SpaceUtilizationContainer
        variant="basic"
        adapter={basicSpaceContainerAdapter}
        activeTab={SPACE_TAB_IDS.CHARTS}
        orchestration={baseOrchestration}
        runtime={presentationRuntime}
      />
    );

    expect(screen.getByTestId('space-layout-renderer')).toHaveAttribute(
      'data-active-tab',
      SPACE_TAB_IDS.CHARTS
    );
  });

  it('routes utilization tab to main layout context', () => {
    render(
      <SpaceUtilizationContainer
        variant="basic"
        adapter={basicSpaceContainerAdapter}
        activeTab={SPACE_TAB_IDS.UTILIZATION}
        orchestration={baseOrchestration}
        runtime={presentationRuntime}
      />
    );

    expect(screen.getByTestId('space-layout-renderer')).toHaveAttribute(
      'data-active-tab',
      SPACE_TAB_IDS.UTILIZATION
    );
  });

  it('uses customized main layout adapter override', () => {
    render(
      <SpaceUtilizationContainer
        variant="customized"
        adapter={customizedSpaceContainerAdapter}
        activeTab={SPACE_TAB_IDS.UTILIZATION}
        orchestration={baseOrchestration}
        runtime={{
          ...presentationRuntime,
          mainLayoutAdapter: { layoutMode: 'fixed-sections', variant: 'customized' },
          mainLayoutRuntime: presentationRuntime.layoutRuntime,
        }}
      />
    );

    expect(screen.getByTestId('space-layout-renderer')).toHaveAttribute(
      'data-layout-mode',
      'fixed-sections'
    );
  });
});

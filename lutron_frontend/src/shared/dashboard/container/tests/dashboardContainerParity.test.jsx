/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardContainer from '../DashboardContainer';
import { basicDashboardContainerAdapter } from '../adapters/basicDashboardContainerAdapter';
import { advancedDashboardContainerAdapter } from '../adapters/advancedDashboardContainerAdapter';
import { customizedDashboardContainerAdapter } from '../adapters/customizedDashboardContainerAdapter';

jest.mock('../layout/DashboardLayoutRenderer', () => {
  const React = require('react');
  return (props) => {
    const sectionKey =
      props.activeTab === 'space-utilization' ? 'charts' : props.activeTab;
    return (
      <div data-testid="dashboard-layout-renderer" data-active-tab={props.activeTab}>
        {props.sections?.[sectionKey]}
      </div>
    );
  };
});

const baseOrchestration = {
  visibility: {
    showEnergyStandaloneDurationFilter: false,
    energyVisibleSlotOrder: ['consumption'],
    energyDashboardRows: [['consumption']],
  },
  widgets: {
    getWidgetTitle: (key, fallback) => fallback || key,
    energyWidgetTitles: {},
    chartLoading: {},
    allEnergyChartsReady: true,
    consumptionColors: {},
    savingsColors: {},
    memoizedEnergyConsumption: {},
    memoizedEnergySavings: {},
  },
  dates: { energyCustomNeedsDates: false },
  exports: {},
};

describe('dashboard container adapters', () => {
  it('basic adapter exposes layout adapter and section builders', () => {
    expect(basicDashboardContainerAdapter.layoutAdapter).toBeDefined();
    expect(typeof basicDashboardContainerAdapter.buildSections).toBe('function');
    expect(typeof basicDashboardContainerAdapter.resolveVisibilityOptions).toBe('function');
  });

  it('advanced adapter preserves routable sections', () => {
    const sections = advancedDashboardContainerAdapter.buildSections({
      orchestration: baseOrchestration,
      runtime: {
        DashboardOverview: () => <div data-testid="overview">o</div>,
        SpaceUtilization: () => <div data-testid="charts">c</div>,
        Alerts: () => <div data-testid="alerts">a</div>,
        handleTabChange: () => {},
        navigate: () => {},
        energyLayoutRuntime: {},
      },
      activeTab: 'energy',
    });
    expect(sections.overview).toBeDefined();
    expect(sections.energy).toBeDefined();
    expect(sections.charts).toBeDefined();
    expect(sections.alerts).toBeDefined();
  });

  it('customized adapter delegates energy section to runtime.renderEnergySection', () => {
    const renderEnergySection = jest.fn(() => <div data-testid="custom-energy">energy</div>);
    const sections = customizedDashboardContainerAdapter.buildSections({
      orchestration: baseOrchestration,
      runtime: {
        DashboardOverview: () => <div>o</div>,
        SpaceUtilization: () => <div>c</div>,
        Alerts: () => <div>a</div>,
        navigate: () => {},
        renderEnergySection,
      },
      activeTab: 'energy',
    });
    expect(renderEnergySection).toHaveBeenCalled();
    expect(sections.energy).toBeDefined();
  });
});

describe('DashboardContainer', () => {
  it('renders sections through DashboardLayoutRenderer', () => {
    render(
      <DashboardContainer
        variant="basic"
        adapter={basicDashboardContainerAdapter}
        activeTab="overview"
        orchestration={baseOrchestration}
        runtime={{
          DashboardOverview: () => <div data-testid="section-overview">overview</div>,
          SpaceUtilization: () => <div>charts</div>,
          Alerts: () => <div>alerts</div>,
          handleTabChange: () => {},
          navigate: () => {},
          energyLayoutRuntime: {},
        }}
      />
    );
    expect(screen.getByTestId('dashboard-layout-renderer')).toHaveAttribute(
      'data-active-tab',
      'overview'
    );
    expect(screen.getByTestId('section-overview')).toBeInTheDocument();
  });
});

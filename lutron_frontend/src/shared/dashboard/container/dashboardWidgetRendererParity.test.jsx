/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardWidgetRenderer from './DashboardWidgetRenderer';
import { resolveWidgetProps } from './widgetSlotResolvers';
import { SUPPORTED_DASHBOARD_WIDGET_RENDERER_KEYS } from './widgetRenderMap';

jest.mock('../widgets/energy', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: (props) => (
      <div data-testid="unified-energy-widget" data-mode={props.mode}>
        {props.title}
      </div>
    ),
    UNIFIED_ENERGY_WIDGET_MODES: { consumption: 'consumption', savings: 'savings' },
  };
});

jest.mock('../widgets/SavingsByStrategyWidget', () => {
  const React = require('react');
  return (props) => <div data-testid="savings-by-strategy-widget">{props.title}</div>;
});

jest.mock('../widgets/TotalConsumptionByGroupWidget', () => {
  const React = require('react');
  return (props) => (
    <div data-testid="total-consumption-by-group-widget">{props.title}</div>
  );
});

jest.mock('../widgets/LightPowerDensityWidget', () => {
  const React = require('react');
  return (props) => (
    <div data-testid="light-power-density-widget">{props.lightingUnit}</div>
  );
});

jest.mock('../widgets/peakmin', () => {
  const React = require('react');
  return (props) => <div data-testid="peak-min-consumption-widget" />;
});

jest.mock('../widgets/overview/OverviewMetricTile', () => {
  const React = require('react');
  return (props) => (
    <div data-testid="overview-metric-tile" data-tile-type={props.tileType}>
      {props.title}
    </div>
  );
});

const ENERGY_KEYS = [
  'consumption',
  'savings',
  'savings_by_strategy',
  'total_consumption_by_group',
  'light_power_density',
  'peak_and_minimum_consumption',
];

const OVERVIEW_KEYS = [
  'energy',
  'schedules',
  'quick_controls',
  'floors',
  'space_utilization',
];

const baseContext = {
  variant: 'basic',
  titles: {
    consumption: 'Consumption Title',
    savings: 'Savings Title',
    savingsByStrategy: 'Strategy Title',
    totalConsumptionByGroup: 'Groups Title',
  },
  data: {
    memoizedEnergyConsumption: {},
    memoizedEnergySavings: {},
    savingsByStrategy: {},
    totalConsumptionByGroup: {},
    lightPowerDensity: {},
    lightingUnit: 'Watt / Sq ft',
  },
  loading: {
    energyConsumptionLoading: false,
    energySavingsLoading: false,
    peakMinConsumptionLoading: false,
  },
  chartLoading: {
    energyConsumption: false,
    energySavings: false,
    savingsByStrategy: false,
    totalConsumptionByGroup: false,
    lightPowerDensity: false,
    peakMinConsumption: false,
  },
  allEnergyChartsReady: true,
  globalLoading: false,
  colors: { consumption: [], savings: [] },
  transformDataForCharts: (d) => d,
  selectedDuration: 'this_week',
  currentDate: '2026-06-10',
  isLargeScreen: false,
  areaGroups: [],
  overrides: {
    consumption: {},
    savings: {},
    savings_by_strategy: {},
    total_consumption_by_group: {},
    light_power_density: {},
    peak_and_minimum_consumption: {},
  },
  overview: {
    themeVariant: 'basic',
  },
};

const TEST_ID_BY_KEY = {
  consumption: 'unified-energy-widget',
  savings: 'unified-energy-widget',
  savings_by_strategy: 'savings-by-strategy-widget',
  total_consumption_by_group: 'total-consumption-by-group-widget',
  light_power_density: 'light-power-density-widget',
  peak_and_minimum_consumption: 'peak-min-consumption-widget',
  energy: 'overview-metric-tile',
  schedules: 'overview-metric-tile',
  quick_controls: 'overview-metric-tile',
  floors: 'overview-metric-tile',
  space_utilization: 'overview-metric-tile',
};

describe('DashboardWidgetRenderer parity', () => {
  it.each(ENERGY_KEYS)('renders supported energy widget key: %s', (widgetKey) => {
    render(
      <DashboardWidgetRenderer
        widgetKey={widgetKey}
        variant="basic"
        context={baseContext}
        visible
      />
    );
    expect(screen.getByTestId(TEST_ID_BY_KEY[widgetKey])).toBeInTheDocument();
  });

  it.each(OVERVIEW_KEYS)('renders supported overview widget key: %s', (widgetKey) => {
    render(
      <DashboardWidgetRenderer
        widgetKey={widgetKey}
        variant="basic"
        context={baseContext}
        visible
      />
    );
    expect(screen.getByTestId('overview-metric-tile')).toBeInTheDocument();
  });

  it('returns null for unsupported widget key', () => {
    const { container } = render(
      <DashboardWidgetRenderer
        widgetKey="consumption_saving"
        variant="basic"
        context={baseContext}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('returns null when visible is false', () => {
    const { container } = render(
      <DashboardWidgetRenderer
        widgetKey="consumption"
        variant="basic"
        context={baseContext}
        visible={false}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders when visible is true', () => {
    render(
      <DashboardWidgetRenderer
        widgetKey="consumption"
        variant="basic"
        context={baseContext}
        visible
      />
    );
    expect(screen.getByTestId('unified-energy-widget')).toBeInTheDocument();
  });

  it('passes pre-resolved widgetProps through without re-resolution', () => {
    render(
      <DashboardWidgetRenderer
        widgetKey="consumption"
        variant="basic"
        visible
        widgetProps={{
          mode: 'consumption',
          title: 'Direct Props Title',
        }}
      />
    );
    expect(screen.getByText('Direct Props Title')).toBeInTheDocument();
  });

  it('title resolution parity matches resolveWidgetProps title', () => {
    const widgetKey = 'savings_by_strategy';
    const props = resolveWidgetProps(widgetKey, baseContext);
    render(
      <DashboardWidgetRenderer
        widgetKey={widgetKey}
        variant="basic"
        context={baseContext}
        visible
      />
    );
    expect(screen.getByText(props.title)).toBeInTheDocument();
  });

  it('prop pass-through parity matches resolveWidgetProps for consumption', () => {
    const props = resolveWidgetProps('consumption', baseContext);
    render(
      <DashboardWidgetRenderer
        widgetKey="consumption"
        variant="basic"
        context={baseContext}
        visible
      />
    );
    const node = screen.getByTestId('unified-energy-widget');
    expect(node).toHaveAttribute('data-mode', props.mode);
    expect(screen.getByText(props.title)).toBeInTheDocument();
  });

  it('alerts key is mapped but variant-owned (no renderer output)', () => {
    const { container } = render(
      <DashboardWidgetRenderer
        widgetKey="alerts"
        variant="basic"
        context={baseContext}
        visible
      />
    );
    expect(container).toBeEmptyDOMElement();
    expect(SUPPORTED_DASHBOARD_WIDGET_RENDERER_KEYS).toContain('alerts');
  });
});

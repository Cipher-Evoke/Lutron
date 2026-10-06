/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardLayoutRenderer from './DashboardLayoutRenderer';
import { DASHBOARD_SECTION_IDS, DASHBOARD_TAB_IDS } from './layoutTypes';
import { BASIC_DASHBOARD_LAYOUT_ADAPTER } from './adapters/basicDashboardLayoutAdapter';
import { ADVANCED_DASHBOARD_LAYOUT_ADAPTER } from './adapters/advancedDashboardLayoutAdapter';
import { CUSTOMIZED_DASHBOARD_LAYOUT_ADAPTER } from './adapters/customizedDashboardLayoutAdapter';
import {
  resolveDashboardSectionKey,
  listRoutableDashboardSections,
} from './dashboardLayoutResolvers';

describe('dashboard layout adapters', () => {
  it('basic resolves canonical section keys', () => {
    expect(resolveDashboardSectionKey('overview', BASIC_DASHBOARD_LAYOUT_ADAPTER)).toBe('overview');
    expect(resolveDashboardSectionKey('energy', BASIC_DASHBOARD_LAYOUT_ADAPTER)).toBe('energy');
    expect(resolveDashboardSectionKey('charts', BASIC_DASHBOARD_LAYOUT_ADAPTER)).toBe('charts');
    expect(resolveDashboardSectionKey('alerts', BASIC_DASHBOARD_LAYOUT_ADAPTER)).toBe('alerts');
    expect(resolveDashboardSectionKey('space-utilization', BASIC_DASHBOARD_LAYOUT_ADAPTER)).toBeNull();
  });

  it('advanced preserves same routable sections as basic', () => {
    expect(listRoutableDashboardSections(ADVANCED_DASHBOARD_LAYOUT_ADAPTER)).toEqual([
      'overview',
      'energy',
      'charts',
      'alerts',
    ]);
  });

  it('customized maps space-utilization tab to charts section', () => {
    expect(
      resolveDashboardSectionKey(DASHBOARD_TAB_IDS.SPACE_UTILIZATION, CUSTOMIZED_DASHBOARD_LAYOUT_ADAPTER)
    ).toBe(DASHBOARD_SECTION_IDS.CHARTS);
    expect(listRoutableDashboardSections(CUSTOMIZED_DASHBOARD_LAYOUT_ADAPTER)).toEqual([
      'overview',
      'energy',
      'charts',
      'alerts',
    ]);
  });
});

describe('DashboardLayoutRenderer parity', () => {
  const sections = {
    overview: <div data-testid="section-overview">overview</div>,
    energy: <div data-testid="section-energy">energy</div>,
    charts: <div data-testid="section-charts">charts</div>,
    alerts: <div data-testid="section-alerts">alerts</div>,
  };

  it.each([
    ['basic', 'overview', BASIC_DASHBOARD_LAYOUT_ADAPTER, 'section-overview'],
    ['basic', 'energy', BASIC_DASHBOARD_LAYOUT_ADAPTER, 'section-energy'],
    ['basic', 'charts', BASIC_DASHBOARD_LAYOUT_ADAPTER, 'section-charts'],
    ['basic', 'alerts', BASIC_DASHBOARD_LAYOUT_ADAPTER, 'section-alerts'],
    ['advanced', 'overview', ADVANCED_DASHBOARD_LAYOUT_ADAPTER, 'section-overview'],
    ['advanced', 'energy', ADVANCED_DASHBOARD_LAYOUT_ADAPTER, 'section-energy'],
    ['advanced', 'charts', ADVANCED_DASHBOARD_LAYOUT_ADAPTER, 'section-charts'],
    ['advanced', 'alerts', ADVANCED_DASHBOARD_LAYOUT_ADAPTER, 'section-alerts'],
  ])('%s routes activeTab=%s to %s', (variant, activeTab, adapter, expectedTestId) => {
    render(
      <DashboardLayoutRenderer
        activeTab={activeTab}
        variant={variant}
        sections={sections}
        adapter={adapter}
      />
    );
    expect(screen.getByTestId(expectedTestId)).toBeInTheDocument();
    // First visit: only the active section is mounted (advanced keep-alive is lazy).
    const otherSections = ['section-overview', 'section-energy', 'section-charts', 'section-alerts'].filter(
      (id) => id !== expectedTestId
    );
    for (const id of otherSections) {
      expect(screen.queryByTestId(id)).not.toBeInTheDocument();
    }
  });

  it('advanced keep-alive leaves previously visited sections mounted but hidden', () => {
    const { rerender } = render(
      <DashboardLayoutRenderer
        activeTab="energy"
        variant="advanced"
        sections={sections}
        adapter={ADVANCED_DASHBOARD_LAYOUT_ADAPTER}
      />
    );
    expect(screen.getByTestId('section-energy')).toBeInTheDocument();

    rerender(
      <DashboardLayoutRenderer
        activeTab="charts"
        variant="advanced"
        sections={sections}
        adapter={ADVANCED_DASHBOARD_LAYOUT_ADAPTER}
      />
    );
    expect(screen.getByTestId('section-charts')).toBeInTheDocument();
    expect(screen.getByTestId('section-energy')).toBeInTheDocument();
    const energyKeepAlive = screen
      .getByTestId('section-energy')
      .closest('[data-dashboard-section-keep-alive]');
    expect(energyKeepAlive).toHaveStyle({ visibility: 'hidden', position: 'absolute' });
    const chartsKeepAlive = screen
      .getByTestId('section-charts')
      .closest('[data-dashboard-section-keep-alive]');
    expect(chartsKeepAlive).toHaveStyle({ visibility: 'visible', position: 'absolute' });
    expect(screen.queryByTestId('section-alerts')).not.toBeInTheDocument();
  });

  it('customized routes space-utilization tab to charts section content', () => {
    render(
      <DashboardLayoutRenderer
        activeTab={DASHBOARD_TAB_IDS.SPACE_UTILIZATION}
        variant="customized"
        sections={{
          ...sections,
          charts: (
            <div data-testid="section-space-utilization">
              <div data-testid="custom-graph-slot">custom graph untouched</div>
            </div>
          ),
        }}
        adapter={CUSTOMIZED_DASHBOARD_LAYOUT_ADAPTER}
      />
    );
    expect(screen.getByTestId('section-space-utilization')).toBeInTheDocument();
    expect(screen.getByTestId('custom-graph-slot')).toBeInTheDocument();
    expect(screen.queryByTestId('section-energy')).not.toBeInTheDocument();
  });

  it('returns null for unroutable tabs', () => {
    const { container } = render(
      <DashboardLayoutRenderer
        activeTab="unknown-tab"
        variant="basic"
        sections={sections}
        adapter={BASIC_DASHBOARD_LAYOUT_ADAPTER}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });
});

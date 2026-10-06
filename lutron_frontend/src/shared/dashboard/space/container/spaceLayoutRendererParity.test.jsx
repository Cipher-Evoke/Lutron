/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import SpaceLayoutRenderer from './SpaceLayoutRenderer';
import { SPACE_TAB_IDS } from './spaceLayoutTypes';
import {
  createBasicSpaceLayoutAdapter,
  createAdvancedSpaceLayoutAdapter,
} from './spaceLayoutAdapters';
import { buildSpaceLayoutContext } from './spaceLayoutResolvers';

jest.mock('./SpaceWidgetRenderer', () => {
  const React = require('react');
  return (props) => (
    <div data-testid="space-widget-renderer" data-widget-key={props.widgetKey}>
      {props.widgetKey}
    </div>
  );
});

const widgetRenderContext = { variant: 'basic', data: {}, loading: {} };

const basicAdapter = createBasicSpaceLayoutAdapter({
  buildRows: (order) => order.map((id) => [id]),
  resolveRowSx: () => ({}),
  resolveSlotSx: () => ({}),
});

const advancedAdapter = createAdvancedSpaceLayoutAdapter({
  resolveFullSectionSx: () => ({}),
  resolveSplitSectionSx: () => ({}),
  resolveSplitColumnSx: () => ({}),
});

describe('SpaceLayoutRenderer parity', () => {
  it('renders empty state via runtime delegate', () => {
    render(
      <SpaceLayoutRenderer
        activeTab={SPACE_TAB_IDS.CHARTS}
        layoutContext={buildSpaceLayoutContext({
          showChartsTab: true,
          visibleSlotOrder: [],
        })}
        adapter={basicAdapter}
        runtime={{
          renderEmptyState: (key) => (
            <div data-testid="empty-state" data-key={key}>
              empty
            </div>
          ),
        }}
      />
    );
    expect(screen.getByTestId('empty-state')).toHaveAttribute('data-key', 'charts');
  });

  it('routes dynamic rows through renderWidgetSlot runtime', () => {
    const rendered = [];
    render(
      <SpaceLayoutRenderer
        activeTab={SPACE_TAB_IDS.CHARTS}
        layoutContext={buildSpaceLayoutContext({
          showChartsTab: true,
          visibleSlotOrder: ['instant_occupancy_count', 'utilization_by_area_group'],
          widgetRenderContext,
        })}
        adapter={basicAdapter}
        runtime={{
          renderWidgetSlot: (slotId) => {
            rendered.push(slotId);
            return <div data-testid={`slot-${slotId}`}>{slotId}</div>;
          },
        }}
      />
    );
    expect(rendered).toEqual(['instant_occupancy_count', 'utilization_by_area_group']);
    expect(screen.getByTestId('slot-instant_occupancy_count')).toBeInTheDocument();
  });

  it('delegates custom slots to renderCustomSlot', () => {
    render(
      <SpaceLayoutRenderer
        activeTab={SPACE_TAB_IDS.CHARTS}
        layoutContext={buildSpaceLayoutContext({
          showChartsTab: true,
          visibleSlotOrder: ['instant_utilization_combined'],
        })}
        adapter={basicAdapter}
        runtime={{
          renderCustomSlot: (slotId) => (
            <div data-testid="custom-slot" data-slot-id={slotId}>
              combined
            </div>
          ),
        }}
      />
    );
    expect(screen.getByTestId('custom-slot')).toHaveAttribute(
      'data-slot-id',
      'instant_utilization_combined'
    );
  });

  it('renders advanced fixed sections with widget bodies', () => {
    render(
      <SpaceLayoutRenderer
        activeTab={SPACE_TAB_IDS.CHARTS}
        layoutContext={buildSpaceLayoutContext({
          showChartsTab: true,
          widgetRenderContext,
        })}
        adapter={advancedAdapter}
        runtime={{
          renderWidgetSlot: (slotId, meta, ctx) => (
            <div data-testid="space-widget-renderer" data-widget-key={meta.widgetKey}>
              {slotId}
            </div>
          ),
        }}
      />
    );
    expect(screen.getAllByTestId('space-widget-renderer').length).toBeGreaterThan(0);
  });

  it('returns null for unsupported utilization tab when hidden', () => {
    const { container } = render(
      <SpaceLayoutRenderer
        activeTab={SPACE_TAB_IDS.UTILIZATION}
        layoutContext={buildSpaceLayoutContext({
          showOnlyInstantChart: true,
        })}
        adapter={basicAdapter}
        runtime={{}}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('wraps slots via runtime.wrapSlot', () => {
    render(
      <SpaceLayoutRenderer
        activeTab={SPACE_TAB_IDS.CHARTS}
        layoutContext={buildSpaceLayoutContext({
          showChartsTab: true,
          visibleSlotOrder: ['utilization_by_area'],
          widgetRenderContext,
        })}
        adapter={basicAdapter}
        runtime={{
          renderWidgetSlot: (slotId) => <div data-testid="inner">{slotId}</div>,
          wrapSlot: (slotId, content) => (
            <div data-testid="wrapped" data-slot-id={slotId}>
              {content}
            </div>
          ),
        }}
      />
    );
    expect(screen.getByTestId('wrapped')).toHaveAttribute(
      'data-slot-id',
      'utilization_by_area'
    );
  });

  it('renders tab chrome when showTabChrome is true', () => {
    render(
      <SpaceLayoutRenderer
        activeTab={SPACE_TAB_IDS.CHARTS}
        layoutContext={buildSpaceLayoutContext({
          showChartsTab: true,
          visibleSlotOrder: ['utilization_by_area'],
          showTabChrome: true,
          widgetRenderContext,
        })}
        adapter={basicAdapter}
        runtime={{
          renderTabChrome: () => <div data-testid="tab-chrome">filter</div>,
          renderWidgetSlot: (slotId) => <div>{slotId}</div>,
        }}
      />
    );
    expect(screen.getByTestId('tab-chrome')).toBeInTheDocument();
  });
});

/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import EnergyLayoutRenderer from './EnergyLayoutRenderer';
import {
  BASIC_LAYOUT_MODE,
  buildBasicEnergyRowDescriptors,
  resolveBasicSlotFullWidth,
  BASIC_ENERGY_SLOT_REGISTRY,
} from './adapters/basicLayoutAdapter';
import {
  ADVANCED_LAYOUT_MODE,
  ADVANCED_ENERGY_FIXED_ROWS,
} from './adapters/advancedLayoutAdapter';
import {
  CUSTOMIZED_LAYOUT_MODE,
  isCustomGraphEnergyCardKey,
  CUSTOMIZED_BUILTIN_ENERGY_CARD_KEYS,
} from './adapters/customizedLayoutAdapter';

jest.mock('../DashboardWidgetRenderer', () => {
  const React = require('react');
  return (props) => (
    <div data-testid="dashboard-widget-renderer" data-widget-key={props.widgetKey}>
      {props.widgetKey}
    </div>
  );
});

import { ENERGY_SLOT_KINDS } from './layoutTypes';

const context = { variant: 'basic', titles: {} };

describe('energy layout adapters', () => {
  it('buildBasicEnergyRowDescriptors pairs slots and isolates consumption_saving', () => {
    const rows = buildBasicEnergyRowDescriptors([
      'consumption',
      'consumption_saving',
      'savings',
    ]);
    expect(rows).toEqual([['consumption'], ['consumption_saving'], ['savings']]);
    expect(resolveBasicSlotFullWidth('consumption_saving')).toBe(true);
    expect(resolveBasicSlotFullWidth('savings')).toBe(false);
  });

  it('advanced fixed rows preserve 3-row structure', () => {
    expect(ADVANCED_ENERGY_FIXED_ROWS).toHaveLength(3);
    expect(ADVANCED_ENERGY_FIXED_ROWS[0]).toEqual([
      'savings_by_strategy',
      'total_consumption_by_group',
    ]);
    expect(ADVANCED_ENERGY_FIXED_ROWS[1]).toEqual(['consumption', 'savings']);
    expect(ADVANCED_ENERGY_FIXED_ROWS[2]).toEqual([
      'light_power_density',
      'peak_and_minimum_consumption',
    ]);
  });

  it('identifies customized custom graph card keys', () => {
    expect(isCustomGraphEnergyCardKey('custom_graph:abc')).toBe(true);
    expect(CUSTOMIZED_BUILTIN_ENERGY_CARD_KEYS).toContain('consumption');
    expect(isCustomGraphEnergyCardKey('consumption')).toBe(false);
  });
});

describe('EnergyLayoutRenderer parity', () => {
  const basicAdapter = {
    SLOT_REGISTRY: BASIC_ENERGY_SLOT_REGISTRY,
    resolveRowSx: () => ({}),
    resolveSlotColumnSx: () => ({}),
  };

  it('basic dynamic-rows renders widget keys in slot order', () => {
    const rows = [['consumption', 'savings'], ['consumption_saving']];
    const renderedKeys = [];

    render(
      <EnergyLayoutRenderer
        variant="basic"
        layoutMode={BASIC_LAYOUT_MODE}
        rows={rows}
        context={context}
        adapter={basicAdapter}
        adapterRuntime={{
          wrapSlot: (_slotId, content) => content,
          renderCustomSlot: (slotId) => (
            <div data-testid="custom-slot" data-slot-id={slotId}>
              custom
            </div>
          ),
        }}
        theme={{ spacing: () => '8px' }}
      />
    );

    document.querySelectorAll('[data-widget-key]').forEach((node) => {
      renderedKeys.push(node.getAttribute('data-widget-key'));
    });

    expect(renderedKeys).toEqual(['consumption', 'savings']);
    expect(screen.getByTestId('custom-slot')).toHaveAttribute(
      'data-slot-id',
      'consumption_saving'
    );
  });

  it('advanced fixed-grid renders all six widget keys', () => {
    const renderedKeys = [];

    render(
      <EnergyLayoutRenderer
        variant="advanced"
        layoutMode={ADVANCED_LAYOUT_MODE}
        rows={ADVANCED_ENERGY_FIXED_ROWS}
        context={context}
        adapter={{
          SLOT_REGISTRY: {
            savings_by_strategy: {
              kind: ENERGY_SLOT_KINDS.WIDGET,
              widgetKey: 'savings_by_strategy',
              shellType: 'none',
            },
            total_consumption_by_group: {
              kind: ENERGY_SLOT_KINDS.WIDGET,
              widgetKey: 'total_consumption_by_group',
              shellType: 'none',
            },
            consumption: {
              kind: ENERGY_SLOT_KINDS.WIDGET,
              widgetKey: 'consumption',
              shellType: 'none',
            },
            savings: { kind: ENERGY_SLOT_KINDS.WIDGET, widgetKey: 'savings', shellType: 'none' },
            light_power_density: {
              kind: ENERGY_SLOT_KINDS.WIDGET,
              widgetKey: 'light_power_density',
              shellType: 'metric-panel',
            },
            peak_and_minimum_consumption: {
              kind: ENERGY_SLOT_KINDS.WIDGET,
              widgetKey: 'peak_and_minimum_consumption',
              shellType: 'metric-panel',
            },
          },
          GRID_SPACING: { xs: 2 },
          GRID_ITEM_PROPS: { xs: 12, md: 6 },
          resolveGridRowSx: () => ({}),
        }}
        adapterRuntime={{
          getShellProps: (slotId) =>
            ['light_power_density', 'peak_and_minimum_consumption'].includes(slotId)
              ? { outerStyle: {}, skipInnerWrapper: true, headerTitle: slotId }
              : {},
        }}
      />
    );

    document.querySelectorAll('[data-widget-key]').forEach((node) => {
      renderedKeys.push(node.getAttribute('data-widget-key'));
    });

    expect(renderedKeys).toEqual([
      'savings_by_strategy',
      'total_consumption_by_group',
      'consumption',
      'savings',
      'light_power_density',
      'peak_and_minimum_consumption',
    ]);
  });

  it('customized sortable-grid preserves card order and custom graph keys', () => {
    const cards = [
      { key: 'consumption', render: () => <div data-testid="card-consumption">c</div> },
      { key: 'custom_graph:1', render: () => <div data-testid="card-custom">g</div> },
      { key: 'savings', render: () => <div data-testid="card-savings">s</div> },
    ];
    const wrapLog = [];

    render(
      <EnergyLayoutRenderer
        variant="customized"
        layoutMode={CUSTOMIZED_LAYOUT_MODE}
        cards={cards}
        adapter={{ resolveSortableGridSx: () => ({ display: 'grid' }) }}
        adapterRuntime={{
          getCardCol: () => 6,
          wrapCard: (key, col, content) => {
            wrapLog.push({ key, col });
            return <div data-testid={`wrapped-${key}`}>{content}</div>;
          },
        }}
        gridOptions={{ gridColumns: '1fr 1fr', visibleCount: 2 }}
      />
    );

    expect(wrapLog.map((entry) => entry.key)).toEqual([
      'consumption',
      'custom_graph:1',
      'savings',
    ]);
    expect(screen.getByTestId('wrapped-custom_graph:1')).toBeInTheDocument();
    expect(screen.getByTestId('card-custom')).toBeInTheDocument();
  });
});

/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { renderBasicSpaceWidgetSlot } from '../../../../variants/basic/screens/dashboard/basicSpaceLayoutSlots';
import { renderAdvancedSpaceWidgetSlot } from '../../../../variants/advanced/screens/dashboard/advancedSpaceLayoutSlots';
import { renderCustomizedSpaceWidgetSlot } from '../../../../variants/customized/screens/dashboard/customizedSpaceLayoutSlots';

jest.mock('../../../../variants/advanced/components/ChartExportButton', () => ({
  __esModule: true,
  default: (props) => (
    <button type="button" onClick={props.onClick}>
      Export
    </button>
  ),
}));

jest.mock('./index', () => ({
  SpaceWidgetRenderer: () => <div data-testid="space-widget-renderer" />,
}));

const slotMeta = { widgetKey: 'utilization', selectorMode: 'active' };

const baseWidgetRenderContext = {
  variant: 'basic',
  data: {},
  loading: {},
};

function createTitleResolver(resolvedTitle) {
  return jest.fn((key, fallback) => resolvedTitle ?? fallback);
}

function renderSlotTitle(variant, layoutContext, apiOverrides = {}) {
  const api = {
    chartHeaderStyle: {},
    isLargeScreen: true,
    spaceUtilLight: false,
    spacePeakMinOuterSx: {},
    ExportDropdown: () => null,
    showExportDropdown: {},
    setShowExportDropdown: jest.fn(),
    showChartsTab: true,
    theme: 'default',
    getWidgetTitle: jest.fn((key, fallback) => fallback),
    generateDynamicChartTitle: (title) => `Dynamic: ${title}`,
    ...apiOverrides,
  };

  let node;
  if (variant === 'basic') {
    node = renderBasicSpaceWidgetSlot('utilization', slotMeta, layoutContext, api);
  } else if (variant === 'advanced') {
    node = renderAdvancedSpaceWidgetSlot('utilization', slotMeta, layoutContext, api);
  } else {
    node = renderCustomizedSpaceWidgetSlot('utilization', slotMeta, layoutContext, api);
  }

  render(node);
  return screen.getByRole('heading', { level: 3 });
}

describe('space layout slot title contract parity', () => {
  describe.each([
    ['basic', 'basic'],
    ['advanced', 'advanced'],
    ['customized', 'customized'],
  ])('%s variant', (variant) => {
    it('resolves title from legacy layoutContext.getWidgetTitle', () => {
      const getWidgetTitle = createTitleResolver('Legacy Utilization Title');
      const heading = renderSlotTitle(variant, {
        selectorMode: 'active',
        getWidgetTitle,
        widgetRenderContext: baseWidgetRenderContext,
      });
      expect(heading).toHaveTextContent(
        variant === 'customized' ? 'Dynamic: Legacy Utilization Title' : 'Legacy Utilization Title'
      );
      expect(getWidgetTitle).toHaveBeenCalledWith('utilization', 'Utilization');
    });

    it('resolves title from widgetRenderContext.getWidgetTitle (6.5E contract)', () => {
      const getWidgetTitle = createTitleResolver('Widget Context Title');
      const heading = renderSlotTitle(variant, {
        selectorMode: 'active',
        widgetRenderContext: {
          ...baseWidgetRenderContext,
          variant,
          getWidgetTitle,
        },
      });
      expect(heading).toHaveTextContent(
        variant === 'customized' ? 'Dynamic: Widget Context Title' : 'Widget Context Title'
      );
      expect(getWidgetTitle).toHaveBeenCalledWith('utilization', 'Utilization');
    });

    it('falls back to export meta fallback when title resolver is missing', () => {
      const heading = renderSlotTitle(variant, {
        selectorMode: 'active',
        widgetRenderContext: { ...baseWidgetRenderContext, variant },
      });
      expect(heading).toHaveTextContent(
        variant === 'customized' ? 'Dynamic: Utilization' : 'Utilization'
      );
    });
  });

  it('basic uses charts fallback for utilization_by_area_group on active tab', () => {
    const getWidgetTitle = createTitleResolver();
    const layoutContext = {
      selectorMode: 'active',
      widgetRenderContext: {
        ...baseWidgetRenderContext,
        getWidgetTitle,
      },
    };
    const api = {
      chartHeaderStyle: {},
      isLargeScreen: true,
      spaceUtilLight: false,
      spacePeakMinOuterSx: {},
      ExportDropdown: () => null,
      showExportDropdown: {},
      setShowExportDropdown: jest.fn(),
      showChartsTab: true,
    };
    render(
      renderBasicSpaceWidgetSlot(
        'utilization_by_area_group',
        { widgetKey: 'utilization_by_area_group', selectorMode: 'active' },
        layoutContext,
        api
      )
    );
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Occupancy by Group');
    expect(getWidgetTitle).toHaveBeenCalledWith('utilization_by_area_group', 'Occupancy by Group');
  });
});

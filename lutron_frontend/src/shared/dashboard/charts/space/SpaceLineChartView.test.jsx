/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { SpaceLineChartView } from './SpaceLineChartView';
import { resolveSpaceLineChartTheme, SPACE_LINE_CHART_THEME_PRESETS } from './spaceLineChartTheme';
import {
  SPACE_LINE_EMPTY_MESSAGE,
  SPACE_LINE_ERROR_MESSAGE,
} from './spaceLineChartConfig';

const basicTheme = resolveSpaceLineChartTheme({
  preset: SPACE_LINE_CHART_THEME_PRESETS.basic,
  spaceShell: {
    plotBg: '#ffffff',
    plotBorder: '1px solid #e0e0e0',
    grid: 'rgba(0,0,0,0.12)',
    axis: '#111827',
    tick: '#111827',
    yLabel: '#111827',
    tooltipBg: '#ffffff',
    tooltipText: '#000',
    tooltipBorder: '1px solid #ccc',
    tooltipHeadBorder: '#ccc',
    cursor: '#000',
    areaStroke: '#1565C0',
    areaFill: '#1565C0',
    dotStroke: '#fff',
    emptyBg: '#ffffff',
    emptyColor: '#000',
    spinOuter: '#e0e0e0',
    spinTop: '#1565C0',
  },
});

describe('SpaceLineChartView shell states', () => {
  it('loading state renders spinner container', () => {
    const { container } = render(
      <SpaceLineChartView status="loading" theme={basicTheme} plotHeightStyle="fixed350" />
    );
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('empty state renders utilization message', () => {
    render(
      <SpaceLineChartView status="empty" theme={basicTheme} plotHeightStyle="fixed350" />
    );
    expect(screen.getByText(SPACE_LINE_EMPTY_MESSAGE)).toBeInTheDocument();
  });

  it('error state renders error message', () => {
    render(
      <SpaceLineChartView status="error" theme={basicTheme} plotHeightStyle="fixed350" />
    );
    expect(screen.getByText(SPACE_LINE_ERROR_MESSAGE)).toBeInTheDocument();
  });
});

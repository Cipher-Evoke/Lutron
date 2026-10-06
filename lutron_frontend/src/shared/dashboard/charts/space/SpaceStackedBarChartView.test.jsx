/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { SpaceStackedBarChartView } from './SpaceStackedBarChartView';
import { resolveSpaceStackedBarTheme, SPACE_STACKED_BAR_THEME_PRESETS } from './spaceStackedBarTheme';
import {
  SPACE_STACKED_BAR_EMPTY_MESSAGE,
  SPACE_STACKED_BAR_ERROR_MESSAGE,
} from './spaceStackedBarConfig';

const basicTheme = resolveSpaceStackedBarTheme({
  preset: SPACE_STACKED_BAR_THEME_PRESETS.basic,
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
    barEdge: 'rgba(0,0,0,0.18)',
    emptyBg: '#ffffff',
    emptyColor: '#000',
    spinOuter: '#e0e0e0',
    spinTop: '#1565C0',
  },
});

describe('SpaceStackedBarChartView shell states', () => {
  it('loading state renders spinner container', () => {
    const { container } = render(
      <SpaceStackedBarChartView status="loading" theme={basicTheme} plotHeightStyle="fixed400" />
    );
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('empty state renders group message', () => {
    render(
      <SpaceStackedBarChartView status="empty" theme={basicTheme} plotHeightStyle="fixed400" />
    );
    expect(screen.getByText(SPACE_STACKED_BAR_EMPTY_MESSAGE)).toBeInTheDocument();
  });

  it('error state renders error message', () => {
    render(
      <SpaceStackedBarChartView status="error" theme={basicTheme} plotHeightStyle="fixed400" />
    );
    expect(screen.getByText(SPACE_STACKED_BAR_ERROR_MESSAGE)).toBeInTheDocument();
  });
});

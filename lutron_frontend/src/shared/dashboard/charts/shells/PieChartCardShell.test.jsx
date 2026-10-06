/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { PieChartCardShell } from './PieChartCardShell';
import { resolvePieChartTheme } from '../themes/pieChartTheme';

const theme = resolvePieChartTheme({ chartSurface: 'dark' });

function MockLoader({ message }) {
  return <div data-testid="pie-loader">{message}</div>;
}

describe('PieChartCardShell presentation states', () => {
  it('loading state renders loader message', () => {
    render(
      <PieChartCardShell
        status="loading"
        shellVariant="basic-energy"
        theme={theme}
        title="Consumption By Area Groups"
        loaderMessage="Loading Consumption By Area Groups data..."
        LoaderComponent={MockLoader}
      />
    );
    expect(screen.getByTestId('pie-loader')).toHaveTextContent(
      'Loading Consumption By Area Groups data...'
    );
  });

  it('empty state renders message', () => {
    render(
      <PieChartCardShell
        status="empty"
        shellVariant="advanced-card"
        theme={theme}
        title="Consumption By Area Groups"
        emptyMessage="No data available for Consumption By Area Groups"
      />
    );
    expect(
      screen.getByText('No data available for Consumption By Area Groups')
    ).toBeInTheDocument();
  });

  it('zero-segments state renders customized message', () => {
    render(
      <PieChartCardShell
        status="zero-segments"
        shellVariant="customized-builtin"
        theme={theme}
        title="Consumption By Area Groups"
        zeroSegmentsMessage="every segment is zero"
        plotStyleOverride={{ padding: 8 }}
      />
    );
    expect(screen.getByText('every segment is zero')).toBeInTheDocument();
  });
});

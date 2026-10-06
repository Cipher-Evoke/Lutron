/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { EnergyChartCardShell } from './EnergyChartCardShell';
import { resolveEnergyChartTheme } from '../themes/energyChartTheme';

const theme = resolveEnergyChartTheme({ chartSurface: 'dark' });

function MockLoader({ message }) {
  return <div data-testid="chart-loader">{message}</div>;
}

describe('EnergyChartCardShell presentation states', () => {
  it('loading state renders loader message', () => {
    render(
      <EnergyChartCardShell
        status="loading"
        shellVariant="basic-energy"
        theme={theme}
        title="Consumption"
        loaderMessage="Loading Consumption data..."
        LoaderComponent={MockLoader}
      />
    );
    expect(screen.getByText('Consumption')).toBeInTheDocument();
    expect(screen.getByTestId('chart-loader')).toHaveTextContent('Loading Consumption data...');
  });

  it('empty state renders message variant', () => {
    render(
      <EnergyChartCardShell
        status="empty"
        shellVariant="advanced-card"
        theme={theme}
        title="Savings"
        emptyMessage="No data available for Savings"
        emptyStateVariant="message"
      />
    );
    expect(screen.getByText('No data available for Savings')).toBeInTheDocument();
  });

  it('empty blank variant renders blank preview slot', () => {
    render(
      <EnergyChartCardShell
        status="empty"
        shellVariant="basic-energy"
        theme={theme}
        title="Consumption"
        emptyStateVariant="blank"
        blankChartPreview={<div data-testid="blank-preview">blank chart</div>}
      />
    );
    expect(screen.getByTestId('blank-preview')).toBeInTheDocument();
  });

  it('ready state renders children and export control', () => {
    render(
      <EnergyChartCardShell
        status="ready"
        shellVariant="basic-energy"
        theme={theme}
        title="Consumption"
        exportControl={<button type="button">Export</button>}
      >
        <div data-testid="chart-body">chart</div>
      </EnergyChartCardShell>
    );
    expect(screen.getByTestId('chart-body')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();
  });
});

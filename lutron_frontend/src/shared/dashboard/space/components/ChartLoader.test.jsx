/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import ChartLoader, { bindChartLoader } from './ChartLoader';

describe('ChartLoader', () => {
  it('renders centered spinner with basic preset by default', () => {
    render(<ChartLoader />);
    expect(screen.getByTestId('chart-loader')).toHaveAttribute('data-shell-variant', 'basic');
    expect(screen.getByTestId('chart-loader-spinner')).toBeInTheDocument();
  });

  it('applies height prop', () => {
    render(<ChartLoader height="350px" shellVariant="basic" />);
    expect(screen.getByTestId('chart-loader')).toHaveAttribute('data-height', '350px');
  });

  it('renders optional message', () => {
    render(<ChartLoader message="Loading chart data..." shellVariant="customized" />);
    expect(screen.getByText('Loading chart data...')).toBeInTheDocument();
  });

  it('bindChartLoader pins shellVariant', () => {
    const BoundLoader = bindChartLoader('advanced');
    render(<BoundLoader height="100%" />);
    expect(screen.getByTestId('chart-loader')).toHaveAttribute('data-shell-variant', 'advanced');
    expect(screen.getByTestId('chart-loader')).toHaveAttribute('data-height', '100%');
  });
});

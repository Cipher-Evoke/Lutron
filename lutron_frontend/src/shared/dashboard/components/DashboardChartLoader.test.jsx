/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import ChartLoader, { bindDashboardChartLoader } from './ChartLoader';
import { DASHBOARD_CHART_LOADER_DEFAULT_MESSAGE } from './chartLoaderTheme';

describe('DashboardChartLoader', () => {
  it('renders default message with basic preset', () => {
    render(<ChartLoader shellVariant="basic" />);
    expect(screen.getByTestId('dashboard-chart-loader')).toHaveAttribute('data-shell-variant', 'basic');
    expect(screen.getByText(DASHBOARD_CHART_LOADER_DEFAULT_MESSAGE)).toBeInTheDocument();
  });

  it('applies basic light surface when light prop is true', () => {
    render(<ChartLoader shellVariant="basic" light />);
    expect(screen.getByTestId('dashboard-chart-loader')).toHaveAttribute('data-light', 'true');
  });

  it('applies height prop', () => {
    render(<ChartLoader shellVariant="advanced" height="100%" />);
    expect(screen.getByTestId('dashboard-chart-loader')).toHaveAttribute('data-height', '100%');
  });

  it('bindDashboardChartLoader pins shellVariant', () => {
    const BoundLoader = bindDashboardChartLoader('customized');
    render(<BoundLoader />);
    expect(screen.getByTestId('dashboard-chart-loader')).toHaveAttribute('data-shell-variant', 'customized');
  });
});

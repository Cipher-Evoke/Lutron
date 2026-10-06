/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardErrorBanner from './DashboardErrorBanner';
import DashboardOperatorNoFloorsPanel from './DashboardOperatorNoFloorsPanel';
import DashboardAreaTreeInlineStatus from './DashboardAreaTreeInlineStatus';

describe('dashboard status panels', () => {
  it('DashboardErrorBanner renders dashboard error copy', () => {
    render(<DashboardErrorBanner error="Network failure" />);
    expect(screen.getByTestId('dashboard-error-banner')).toBeInTheDocument();
    expect(screen.getByText('Error: Network failure')).toBeInTheDocument();
  });

  it('DashboardErrorBanner returns null without error', () => {
    const { container } = render(<DashboardErrorBanner error={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('DashboardOperatorNoFloorsPanel renders exact operator copy', () => {
    render(<DashboardOperatorNoFloorsPanel />);
    expect(screen.getByTestId('dashboard-operator-no-floors-panel')).toBeInTheDocument();
    expect(screen.getByText('No Floors Available')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Your operator account does not have access to any floors. Please contact your administrator to assign floors to your account.'
      )
    ).toBeInTheDocument();
  });

  it('DashboardAreaTreeInlineStatus renders loading message', () => {
    render(<DashboardAreaTreeInlineStatus mode="loading" textColor="#abc" />);
    const node = screen.getByTestId('dashboard-area-tree-inline-status');
    expect(node).toHaveAttribute('data-mode', 'loading');
    expect(node).toHaveTextContent('Loading floors...');
    expect(node).toHaveStyle({ color: '#abc' });
  });

  it('DashboardAreaTreeInlineStatus renders error message', () => {
    render(<DashboardAreaTreeInlineStatus mode="error" />);
    expect(screen.getByText('Error loading data. Please try again.')).toBeInTheDocument();
  });

  it('DashboardAreaTreeInlineStatus renders operator empty message', () => {
    render(<DashboardAreaTreeInlineStatus mode="empty" isOperator floorStatus="succeeded" />);
    expect(
      screen.getByText(
        'No floors assigned to your operator account. Please contact your administrator.'
      )
    ).toBeInTheDocument();
  });

  it('DashboardAreaTreeInlineStatus renders default empty message', () => {
    render(<DashboardAreaTreeInlineStatus mode="empty" isOperator={false} floorStatus="succeeded" />);
    expect(screen.getByText('No floors available')).toBeInTheDocument();
  });
});

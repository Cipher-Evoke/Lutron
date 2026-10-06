/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import SpaceStatusPanel from './SpaceStatusPanel';
import SpaceErrorPanel from './SpaceErrorPanel';
import SpaceEmptyPanel from './SpaceEmptyPanel';

describe('space status panels', () => {
  it('SpaceStatusPanel renders warning tone with subtitle', () => {
    render(
      <SpaceStatusPanel
        tone="warning"
        shellVariant="basic"
        title="Some data endpoints are experiencing issues"
        subtitle="Please try again later."
      />
    );
    expect(screen.getByTestId('space-status-panel')).toHaveAttribute('data-tone', 'warning');
    expect(screen.getByText('Some data endpoints are experiencing issues')).toBeInTheDocument();
    expect(screen.getByText('Please try again later.')).toBeInTheDocument();
  });

  it('SpaceErrorPanel prefixes error message', () => {
    render(<SpaceErrorPanel message="Network failure" shellVariant="advanced" />);
    expect(screen.getByText('Error: Network failure')).toBeInTheDocument();
  });

  it('SpaceErrorPanel returns null without message', () => {
    const { container } = render(<SpaceErrorPanel message={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('SpaceEmptyPanel renders title and subtitle', () => {
    render(
      <SpaceEmptyPanel
        shellVariant="basic"
        title="No Space Utilization widgets are visible"
        subtitle="Enable widgets under Settings."
      />
    );
    expect(screen.getByTestId('space-empty-panel')).toHaveAttribute('data-shell-variant', 'basic');
    expect(screen.getByText('No Space Utilization widgets are visible')).toBeInTheDocument();
  });
});

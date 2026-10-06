/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { SavingsStrategyChartView } from './SavingsStrategyChartView';
import { resolveSavingsStrategyTheme } from './savingsStrategyTheme';
import {
  SAVINGS_STRATEGY_EMPTY_NULL_MESSAGE,
  SAVINGS_STRATEGY_EMPTY_ZERO_MESSAGE,
} from './savingsStrategyConfig';

const theme = resolveSavingsStrategyTheme({ chartSurface: 'dark' });

function MockLoader({ message }) {
  return <div data-testid="savings-loader">{message}</div>;
}

describe('SavingsStrategyChartView shell states', () => {
  it('loading state renders loader', () => {
    render(
      <SavingsStrategyChartView
        status="loading"
        title="Savings By Strategy"
        headerTitle="Savings By Strategy"
        theme={theme}
        getSegmentColor={() => '#fff'}
        loaderMessage="Loading Savings By Strategy data..."
        LoaderComponent={MockLoader}
      />
    );
    expect(screen.getByTestId('savings-loader')).toHaveTextContent(
      'Loading Savings By Strategy data...'
    );
  });

  it('empty-null state renders message', () => {
    render(
      <SavingsStrategyChartView
        status="empty-null"
        title="Savings By Strategy"
        headerTitle="Savings By Strategy"
        theme={theme}
        getSegmentColor={() => '#fff'}
        emptyNullMessage={SAVINGS_STRATEGY_EMPTY_NULL_MESSAGE}
        plotStyle={{ minHeight: 100 }}
      />
    );
    expect(screen.getByText(SAVINGS_STRATEGY_EMPTY_NULL_MESSAGE)).toBeInTheDocument();
  });

  it('empty-zero state renders savings-specific message', () => {
    render(
      <SavingsStrategyChartView
        status="empty-zero"
        title="Savings By Strategy"
        headerTitle="Savings By Strategy"
        theme={theme}
        getSegmentColor={() => '#fff'}
        emptyZeroMessage={SAVINGS_STRATEGY_EMPTY_ZERO_MESSAGE}
        plotStyle={{ minHeight: 100 }}
      />
    );
    expect(screen.getByText(SAVINGS_STRATEGY_EMPTY_ZERO_MESSAGE)).toBeInTheDocument();
  });
});

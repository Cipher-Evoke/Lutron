/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { OverviewMetricTileCard } from './OverviewMetricTileCard';
import {
  resolveOverviewMetricTileTheme,
  OVERVIEW_THEME_VARIANTS,
} from './OverviewMetricTileTheme';
import {
  resolveEnergyTileModel,
  resolveSchedulesTileModel,
  resolveSpaceUtilizationTileModel,
  OVERVIEW_TILE_TYPES,
} from './overviewTileTypes';

const basicTheme = resolveOverviewMetricTileTheme({
  themeVariant: OVERVIEW_THEME_VARIANTS.BASIC,
});
const gridTheme = resolveOverviewMetricTileTheme({
  themeVariant: OVERVIEW_THEME_VARIANTS.GRID,
});

describe('OverviewMetricTileCard presentation', () => {
  it('energy ready state renders savings label', () => {
    render(
      <OverviewMetricTileCard
        tileType={OVERVIEW_TILE_TYPES.ENERGY}
        model={resolveEnergyTileModel({
          savings_percent: 50,
          savings_kw: 10,
          consumption_kw: 5,
        })}
        theme={gridTheme}
      />
    );
    expect(screen.getByText('Energy')).toBeInTheDocument();
    expect(screen.getByText('Current Energy Savings')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('10.00 kW')).toBeInTheDocument();
  });

  it('energy empty state renders no data', () => {
    render(
      <OverviewMetricTileCard
        tileType={OVERVIEW_TILE_TYPES.ENERGY}
        model={resolveEnergyTileModel(null)}
        theme={basicTheme}
      />
    );
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('schedules empty state renders no upcoming event', () => {
    render(
      <OverviewMetricTileCard
        tileType={OVERVIEW_TILE_TYPES.SCHEDULES}
        model={resolveSchedulesTileModel(null)}
        theme={gridTheme}
      />
    );
    expect(screen.getByText('No upcoming event')).toBeInTheDocument();
  });

  it('space utilization empty state renders no data', () => {
    render(
      <OverviewMetricTileCard
        tileType={OVERVIEW_TILE_TYPES.SPACE_UTILIZATION}
        model={resolveSpaceUtilizationTileModel(null)}
        theme={basicTheme}
      />
    );
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('quick controls renders helper copy', () => {
    render(
      <OverviewMetricTileCard
        tileType={OVERVIEW_TILE_TYPES.QUICK_CONTROLS}
        model={{ status: 'ready', description: 'Use quick controls to execute several actions at once.' }}
        theme={gridTheme}
      />
    );
    expect(screen.getByText(/Use quick controls/)).toBeInTheDocument();
  });
});

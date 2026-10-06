/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { LightPowerDensityCard } from './LightPowerDensityCard';
import {
  resolveLightPowerDensityTheme,
  LIGHT_POWER_DENSITY_THEME_PRESETS,
} from './lightPowerDensityTheme';

const basicTheme = resolveLightPowerDensityTheme({
  preset: LIGHT_POWER_DENSITY_THEME_PRESETS.basic,
  chartSurface: 'dark',
});

const customizedTheme = resolveLightPowerDensityTheme({
  preset: LIGHT_POWER_DENSITY_THEME_PRESETS.customized,
});

describe('LightPowerDensityCard shell states', () => {
  it('loading state renders spinner container', () => {
    const { container } = render(
      <LightPowerDensityCard status="loading" display={null} theme={basicTheme} />
    );
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('ready state renders value and unit', () => {
    render(
      <LightPowerDensityCard
        status="ready"
        display={{ value: 1.25, unit: 'W/ft²' }}
        theme={basicTheme}
        isLargeScreen
      />
    );
    expect(screen.getByText(/1\.25/)).toBeInTheDocument();
    expect(screen.getByText(/W\/ft²/)).toBeInTheDocument();
  });

  it('ready state shows no-data message', () => {
    render(
      <LightPowerDensityCard
        status="ready"
        display={{ value: 'No data', unit: '' }}
        theme={basicTheme}
      />
    );
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('customized ready state renders unit subtitle', () => {
    render(
      <LightPowerDensityCard
        status="ready"
        display={{ value: 13.45, unit: 'W/m²' }}
        theme={customizedTheme}
        isLargeScreen
      />
    );
    expect(screen.getAllByText('W/m²').length).toBeGreaterThanOrEqual(1);
  });
});

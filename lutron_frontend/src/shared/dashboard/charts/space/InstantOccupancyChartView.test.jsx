/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { InstantOccupancyChartView } from './InstantOccupancyChartView';
import {
  resolveInstantOccupancyTheme,
  INSTANT_OCCUPANCY_THEME_PRESETS,
} from './instantOccupancyTheme';
import {
  INSTANT_OCCUPANCY_EMPTY_MESSAGE,
  INSTANT_OCCUPANCY_ERROR_MESSAGE,
} from './instantOccupancyConfig';

const basicTheme = resolveInstantOccupancyTheme({
  preset: INSTANT_OCCUPANCY_THEME_PRESETS.basic,
  chartSurface: 'dark',
});

beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe('InstantOccupancyChartView shell states', () => {
  it('loading state renders spinner container', () => {
    const { container } = render(
      <InstantOccupancyChartView
        status="loading"
        theme={basicTheme}
        plotHeightStyle="instantFixed350"
      />
    );
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('empty state renders instant occupancy message', () => {
    render(
      <InstantOccupancyChartView
        status="empty"
        theme={basicTheme}
        plotHeightStyle="instantFixed350"
      />
    );
    expect(screen.getByText(INSTANT_OCCUPANCY_EMPTY_MESSAGE)).toBeInTheDocument();
  });

  it('error state renders error message', () => {
    render(
      <InstantOccupancyChartView
        status="error"
        theme={basicTheme}
        plotHeightStyle="instantFixed350"
      />
    );
    expect(screen.getByText(INSTANT_OCCUPANCY_ERROR_MESSAGE)).toBeInTheDocument();
  });

  it('ready state renders utilization footer when footerModel provided', () => {
    render(
      <InstantOccupancyChartView
        status="ready"
        theme={basicTheme}
        plotHeightStyle="instantFixed350"
        processedChartData={[
          { date: '08:00', timeMinutes: 480, occupancy: 10, isHourly: true },
          { date: '09:00', timeMinutes: 540, occupancy: 20, isHourly: true },
        ]}
        chartConfig={{ xAxisInterval: 0, xAxisTickCount: 24, xAxisFontSize: 10 }}
        maxOccupancy={20}
        nonNullValues={[10, 20]}
        showPercentage={false}
        xAxisTicks={[0, 60, 120]}
        footerModel={{
          selectedDuration: 'this-day',
          entirePct: 42,
          workingPct: 55,
          showWorkingHoursFooter: false,
          utilizationFooterPeriodLabel: 'Entire day',
          footerMuted: '#9ca3af',
          footerStrong: '#111827',
          formatFooterStat: (v) => (v == null ? '—' : `${Math.round(v)}`),
        }}
        selectedDuration="this-day"
        currentDate="2026-06-10"
        currentYear={2026}
        customDateRange={{ startDate: '', endDate: '' }}
        isNavigating={false}
      />
    );
    expect(screen.getByText(/Occupancy/i)).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });
});

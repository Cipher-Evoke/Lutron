/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ExportMenuPanel from './ExportMenuPanel';
import EnergyExportMenu from './EnergyExportMenu';
import SpaceChartExportMenu from './SpaceChartExportMenu';
import { resolveEnergyExportMenuPresetFromTheme } from './exportMenuTheme';

describe('ExportMenuPanel', () => {
  const baseActions = [
    {
      key: 'email',
      label: 'Send By Email',
      loading: false,
      onClick: jest.fn(),
    },
    {
      key: 'download',
      label: 'Download To PC',
      loading: false,
      onClick: jest.fn(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders email and download actions', () => {
    render(<ExportMenuPanel actions={baseActions} />);
    expect(screen.getByRole('button', { name: 'Send By Email' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download To PC' })).toBeInTheDocument();
  });

  it('renders loading labels', () => {
    render(
      <ExportMenuPanel
        actions={[
          { ...baseActions[0], loading: true },
          { ...baseActions[1], loading: true },
        ]}
        useEmoji
      />
    );
    expect(screen.getByRole('button', { name: '⏳ Sending...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '⏳ Downloading...' })).toBeDisabled();
  });

  it('renders disabled state from action.disabled', () => {
    render(
      <ExportMenuPanel
        actions={[
          { ...baseActions[0], disabled: true },
          baseActions[1],
        ]}
      />
    );
    expect(screen.getByRole('button', { name: 'Send By Email' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Download To PC' })).toBeEnabled();
  });

  it('forwards click handlers', () => {
    const onEmail = jest.fn();
    const onDownload = jest.fn();
    render(
      <ExportMenuPanel
        actions={[
          { key: 'email', label: 'Send By Email', onClick: onEmail },
          { key: 'download', label: 'Download To PC', onClick: onDownload },
        ]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Send By Email' }));
    fireEvent.click(screen.getByRole('button', { name: 'Download To PC' }));

    expect(onEmail).toHaveBeenCalledTimes(1);
    expect(onDownload).toHaveBeenCalledTimes(1);
  });

  it('supports panel data attribute for outside-click parity', () => {
    const { container } = render(
      <ExportMenuPanel
        actions={baseActions}
        panelDataAttribute="data-export-dropdown-panel"
      />
    );
    expect(container.querySelector('[data-export-dropdown-panel="true"]')).toBeInTheDocument();
  });
});

describe('dashboard export menu parity', () => {
  it('EnergyExportMenu renders shared actions with menu key loading map', () => {
    const onEmail = jest.fn();
    const onDownload = jest.fn();
    const preset = resolveEnergyExportMenuPresetFromTheme(
      {
        dropdownBg: '#fff',
        dropdownBorder: '1px solid #ccc',
        dropdownText: '#111',
        dropdownMuted: '#999',
        dropdownSep: '#eee',
      },
      { useEmoji: true }
    );

    render(
      <EnergyExportMenu
        menuKey="Consumption"
        isOpen
        exportLoading={{ Consumption_email: true, Consumption_download: false }}
        onEmail={onEmail}
        onDownload={onDownload}
        preset={preset}
      />
    );

    expect(screen.getByRole('button', { name: '⏳ Sending...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Download To PC' })).toBeEnabled();
  });

  it('EnergyExportMenu uses loadingPrefix when menu key differs from loading keys', () => {
    const onEmail = jest.fn();
    const onDownload = jest.fn();
    const preset = resolveEnergyExportMenuPresetFromTheme(
      {
        dropdownBg: '#fff',
        dropdownBorder: '1px solid #ccc',
        dropdownText: '#111',
        dropdownMuted: '#999',
        dropdownSep: '#eee',
      },
      { useEmoji: true }
    );

    render(
      <EnergyExportMenu
        menuKey="Custom Consumption Title"
        loadingPrefix="Consumption"
        isOpen
        exportLoading={{ Consumption_download: true }}
        onEmail={onEmail}
        onDownload={onDownload}
        preset={preset}
      />
    );

    expect(screen.getByRole('button', { name: '⏳ Downloading...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Send By Email' })).toBeEnabled();
  });
});

describe('space export menu parity', () => {
  it('SpaceChartExportMenu renders shared actions and routes via onExport', () => {
    const onExport = jest.fn();

    render(
      <SpaceChartExportMenu
        isOpen
        chartTitle="Utilization"
        dropdownKey="line"
        exportLoading={{}}
        onExport={onExport}
        shellVariant="basic"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Send By Email' }));
    fireEvent.click(screen.getByRole('button', { name: 'Download To PC' }));

    expect(onExport).toHaveBeenNthCalledWith(1, 'email', 'Utilization', 'line');
    expect(onExport).toHaveBeenNthCalledWith(2, 'download', 'Utilization', 'line');
  });

  it('SpaceChartExportMenu shows loading label for active export action', () => {
    render(
      <SpaceChartExportMenu
        isOpen
        chartTitle="Utilization"
        dropdownKey="line"
        exportLoading={{ Utilization_download: true }}
        onExport={jest.fn()}
        shellVariant="basic"
      />
    );

    expect(screen.getByRole('button', { name: 'Downloading...' })).toBeDisabled();
  });
});

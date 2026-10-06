import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';

import processorReducer from '../../../redux/slice/processor/processorSlice';
import themeReducer from '../../../redux/slice/theme/themeSlice';

const mockGet = jest.fn();
const mockPost = jest.fn();
jest.mock('../../../BaseUrl', () => ({
  BaseUrl: {
    get: (...args) => mockGet(...args),
    post: (...args) => mockPost(...args),
  },
}));

jest.mock('../../../customhooks/UseAuth', () => ({
  UseAuth: () => ({ role: 'Superadmin' }),
  getVisibleSidebarItemsWithPaths: () => [{ label: 'Processors', path: '/processors' }],
}));

import ProcessorsSettings from './ProcessorsSettings';

const listRow = {
  id: 1,
  ipv4: '192.168.1.201',
  system: 'AthenaProcessor',
  serial: '04270521',
  handshake_status: true,
};

const renderPage = () => {
  const store = configureStore({
    reducer: {
      processor: processorReducer,
      theme: themeReducer,
    },
    preloadedState: {
      theme: {
        applicationTheme: { application_theme: { button: '#232323' } },
      },
    },
  });

  return render(
    <Provider store={store}>
      <ThemeProvider theme={createTheme()}>
        <MemoryRouter initialEntries={['/processors']}>
          <ProcessorsSettings />
        </MemoryRouter>
      </ThemeProvider>
    </Provider>
  );
};

beforeEach(() => {
  localStorage.setItem('lutron', 'test-token');
  mockGet.mockReset();
  mockPost.mockReset();
});

test('loads processor table from GET /processor/list_all on mount', async () => {
  mockGet.mockResolvedValueOnce({ data: [listRow] });

  renderPage();

  await screen.findByText('Processors');
  expect(mockGet).toHaveBeenCalledWith('/processor/list_all');
  expect(await screen.findByText('192.168.1.201')).toBeInTheDocument();
  expect(screen.getByText('AthenaProcessor')).toBeInTheDocument();
});

test('Refresh triggers another GET /processor/list_all', async () => {
  mockGet.mockResolvedValue({ data: [listRow] });

  renderPage();

  await screen.findByText('192.168.1.201');

  const refreshBtn = screen.getByRole('button', { name: /refresh/i });
  fireEvent.click(refreshBtn);

  await waitFor(() => {
    expect(mockGet.mock.calls.filter((c) => c[0] === '/processor/list_all').length).toBeGreaterThanOrEqual(2);
  });
});

test('Discover Processor calls GET /processor/discover then refreshes list_all on success', async () => {
  mockGet
    .mockResolvedValueOnce({ data: [listRow] })
    .mockResolvedValueOnce({ data: [listRow] })
    .mockResolvedValueOnce({ data: [listRow] });

  renderPage();

  await screen.findByText('192.168.1.201');

  const discoverBtn = screen.getByRole('button', { name: /discover processor/i });
  fireEvent.click(discoverBtn);

  await waitFor(() => {
    expect(mockGet).toHaveBeenCalledWith('/processor/discover');
  });

  await waitFor(() => {
    const listCalls = mockGet.mock.calls.filter((c) => c[0] === '/processor/list_all');
    expect(listCalls.length).toBeGreaterThanOrEqual(2);
  });
});

test('handshake_status null disables toggle switch', async () => {
  mockGet.mockResolvedValueOnce({
    data: [{ ...listRow, id: 2, handshake_status: null }],
  });

  renderPage();

  const toggle = await screen.findByRole('checkbox', {
    name: /Handshake status for processor 2/i,
  });
  expect(toggle).toBeDisabled();
});

test('Handshake button calls POST /processor/processor_handshake', async () => {
  mockGet.mockResolvedValueOnce({ data: [listRow] });
  mockPost.mockResolvedValueOnce({
    data: {
      status: 'success',
      message: 'Certificate handshake completed successfully',
      processor_id: 1,
      handshake_status: true,
    },
  });
  mockGet.mockResolvedValueOnce({ data: [{ ...listRow, handshake_status: true }] });

  renderPage();

  await screen.findByText('192.168.1.201');

  const handshakeBtn = screen.getByRole('button', { name: /^Handshake$/i });
  fireEvent.click(handshakeBtn);

  await waitFor(() => {
    expect(mockPost).toHaveBeenCalledWith(
      '/processor/processor_handshake',
      null,
      expect.objectContaining({
        params: { processor_id: 1 },
        timeout: 125000,
      })
    );
  });
});

/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import {
  EMAIL_PROFILE_MISSING_MESSAGE,
  EMAIL_SERVER_NOT_CONFIGURED_MESSAGE,
  isEmailServerConfigValid,
  openEmailExportDialog,
  validateEmailExport,
} from './emailExportGate';
import { useDashboardExports } from '../container/hooks/useDashboardExports';
import {
  DEFAULT_CONSUMPTION_EXPORT_KEYS,
  DEFAULT_SAVINGS_EXPORT_KEYS,
} from '../container/hooks/exportMenuState';
import { useSpaceExports } from '../space/export/useSpaceExports';

const validConfig = {
  server_name: 'smtp',
  port: 25,
  server_email: 'a@b.com',
  sender_name: 'Sender',
};

function createDispatchMock(configs, emailThunkResult = { type: 'email/fulfilled' }) {
  return jest.fn((action) => {
    if (typeof action === 'function') {
      return action;
    }
    return {
      unwrap: () => Promise.resolve(configs),
      type: emailThunkResult.type,
      payload: emailThunkResult.payload,
    };
  });
}

const fetchEmailConfigs = () => 'fetchEmailConfigs';

describe('emailExportGate', () => {
  it('isEmailServerConfigValid requires all server fields', () => {
    expect(isEmailServerConfigValid(validConfig)).toBe(true);
    expect(isEmailServerConfigValid({ server_name: 'smtp' })).toBe(false);
  });

  it('returns normalized success contract for valid email', async () => {
    const dispatch = createDispatchMock([validConfig]);
    const showSnackbar = jest.fn();

    const result = await validateEmailExport({
      dispatch,
      fetchEmailConfigs,
      userProfile: { email: ' user@example.com ' },
      showSnackbar,
    });

    expect(result).toEqual({ ok: true, email: 'user@example.com' });
    expect(showSnackbar).not.toHaveBeenCalled();
  });

  it('returns failure contract when profile email is missing', async () => {
    const dispatch = createDispatchMock([validConfig]);
    const showSnackbar = jest.fn();

    const result = await validateEmailExport({
      dispatch,
      fetchEmailConfigs,
      userProfile: {},
      showSnackbar,
    });

    expect(result).toEqual({ ok: false });
    expect(showSnackbar).toHaveBeenCalledWith(EMAIL_PROFILE_MISSING_MESSAGE, 'error');
  });

  it('returns failure contract when profile is missing', async () => {
    const dispatch = createDispatchMock([validConfig]);
    const showSnackbar = jest.fn();

    const result = await validateEmailExport({
      dispatch,
      fetchEmailConfigs,
      userProfile: null,
      showSnackbar,
    });

    expect(result).toEqual({ ok: false });
    expect(showSnackbar).toHaveBeenCalledWith(EMAIL_PROFILE_MISSING_MESSAGE, 'error');
  });

  it('fires snackbar when email server is not configured', async () => {
    const dispatch = createDispatchMock([]);
    const showSnackbar = jest.fn();

    const result = await validateEmailExport({
      dispatch,
      fetchEmailConfigs,
      userProfile: { email: 'user@example.com' },
      showSnackbar,
    });

    expect(result).toEqual({ ok: false });
    expect(showSnackbar).toHaveBeenCalledWith(EMAIL_SERVER_NOT_CONFIGURED_MESSAGE, 'error');
  });

  it('openEmailExportDialog invokes action on success path', async () => {
    const dispatch = createDispatchMock([validConfig]);
    const showSnackbar = jest.fn();
    const action = jest.fn();

    await openEmailExportDialog({
      dispatch,
      fetchEmailConfigs,
      userProfile: { email: 'user@example.com' },
      showSnackbar,
      action,
    });

    expect(action).toHaveBeenCalledWith('user@example.com');
  });
});

describe('dashboard export email gate integration', () => {
  it('uses shared gate before routing energy email export', async () => {
    const emailThunk = jest.fn(() => ({ type: 'energy/email/fulfilled' }));
    const dispatch = jest.fn((action) => {
      if (action === 'fetchEmailConfigs') {
        return { unwrap: () => Promise.resolve([validConfig]) };
      }
      return emailThunk(action);
    });
    const showSnackbar = jest.fn();

    const { result } = renderHook(() =>
      useDashboardExports({
        dispatch,
        showSnackbar,
        userProfile: { email: 'dashboard@example.com' },
        fetchEmailConfigs,
        selection: {
          selectedAreas: [1],
          selectedFloorIds: [],
          selectedDuration: 'this-week',
          customStartDate: null,
          customEndDate: null,
          isNavigating: false,
        },
        calculateDateParameters: () => ({ timeRange: 'this-week' }),
        thunks: {
          sendEnergyConsumptionEmail: emailThunk,
          downloadEnergyConsumption: jest.fn(),
          sendEnergySavingsEmail: jest.fn(),
          downloadEnergySavings: jest.fn(),
        },
        keys: {
          consumption: DEFAULT_CONSUMPTION_EXPORT_KEYS,
          savings: DEFAULT_SAVINGS_EXPORT_KEYS,
          totalConsumptionByGroup: DEFAULT_CONSUMPTION_EXPORT_KEYS,
        },
      })
    );

    await act(async () => {
      await result.current.handleConsumptionEmail();
    });

    expect(emailThunk).toHaveBeenCalled();
    expect(showSnackbar).not.toHaveBeenCalledWith(EMAIL_PROFILE_MISSING_MESSAGE, 'error');
  });

  it('blocks dashboard email export when gate validation fails', async () => {
    const emailThunk = jest.fn();
    const dispatch = jest.fn(() => ({
      unwrap: () => Promise.resolve([]),
    }));
    const showSnackbar = jest.fn();

    const { result } = renderHook(() =>
      useDashboardExports({
        dispatch,
        showSnackbar,
        userProfile: { email: 'dashboard@example.com' },
        fetchEmailConfigs,
        selection: {},
        calculateDateParameters: () => ({}),
        thunks: {
          sendEnergyConsumptionEmail: emailThunk,
          downloadEnergyConsumption: jest.fn(),
          sendEnergySavingsEmail: jest.fn(),
          downloadEnergySavings: jest.fn(),
        },
        keys: {
          consumption: DEFAULT_CONSUMPTION_EXPORT_KEYS,
          savings: DEFAULT_SAVINGS_EXPORT_KEYS,
          totalConsumptionByGroup: DEFAULT_CONSUMPTION_EXPORT_KEYS,
        },
      })
    );

    await act(async () => {
      await result.current.handleConsumptionEmail();
    });

    expect(emailThunk).not.toHaveBeenCalled();
    expect(showSnackbar).toHaveBeenCalledWith(EMAIL_SERVER_NOT_CONFIGURED_MESSAGE, 'error');
  });
});

describe('space export email gate integration', () => {
  it('uses shared gate before routing space email export', async () => {
    const emailThunk = jest.fn(() => ({ type: 'space/email/fulfilled' }));
    const dispatch = jest.fn((action) => {
      if (action === 'fetchEmailConfigs') {
        return { unwrap: () => Promise.resolve([validConfig]) };
      }
      return emailThunk(action);
    });
    const showSnackbar = jest.fn();

    const { result } = renderHook(() =>
      useSpaceExports({
        dispatch,
        showSnackbar,
        userProfile: { email: 'space@example.com' },
        fetchEmailConfigs,
        selection: {
          selectedAreas: [1],
          selectedFloorIds: [],
          selectedDuration: 'this-week',
          customDateRange: {},
          isNavigating: false,
        },
        thunks: {
          sendOccupancyCountEmail: emailThunk,
          downloadOccupancyCount: jest.fn(),
        },
      })
    );

    await act(async () => {
      await result.current.handleExport('email', 'Utilization', 'line');
    });

    expect(emailThunk).toHaveBeenCalled();
    expect(showSnackbar).toHaveBeenCalledWith('Utilization report sent successfully!', 'success');
  });

  it('blocks space email export when profile email is missing', async () => {
    const emailThunk = jest.fn();
    const dispatch = jest.fn(() => ({
      unwrap: () => Promise.resolve([validConfig]),
    }));
    const showSnackbar = jest.fn();

    const { result } = renderHook(() =>
      useSpaceExports({
        dispatch,
        showSnackbar,
        userProfile: {},
        fetchEmailConfigs,
        selection: {
          selectedAreas: [1],
          selectedDuration: 'this-week',
          customDateRange: {},
          isNavigating: false,
        },
        thunks: {
          sendOccupancyCountEmail: emailThunk,
          downloadOccupancyCount: jest.fn(),
        },
      })
    );

    await act(async () => {
      await result.current.handleExport('email', 'Utilization', 'line');
    });

    expect(emailThunk).not.toHaveBeenCalled();
    expect(showSnackbar).toHaveBeenCalledWith(EMAIL_PROFILE_MISSING_MESSAGE, 'error');
  });
});

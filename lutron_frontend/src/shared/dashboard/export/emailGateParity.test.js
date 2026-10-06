/**
 * @jest-environment node
 */
import {
  EMAIL_PROFILE_MISSING_MESSAGE,
  EMAIL_SERVER_NOT_CONFIGURED_MESSAGE,
  invokeValidatedEmailExportAction,
} from './emailExportGate';

const validConfig = {
  server_name: 'smtp',
  port: 25,
  server_email: 'a@b.com',
  sender_name: 'Sender',
};

const fetchEmailConfigs = () => 'fetchEmailConfigs';

function createDispatchMock(configs) {
  return jest.fn(() => ({
    unwrap: () => Promise.resolve(configs),
  }));
}

function createGateDeps(overrides = {}) {
  return {
    dispatch: createDispatchMock([validConfig]),
    fetchEmailConfigs,
    userProfile: { email: 'user@example.com' },
    showSnackbar: jest.fn(),
    ...overrides,
  };
}

async function runAlertsEmailGateFlow(deps) {
  const sendAlertsByEmail = jest.fn(() => ({ type: 'alerts/email/fulfilled', payload: {} }));
  const dispatch = jest.fn((thunk) => {
    if (thunk === 'fetchEmailConfigs') {
      return { unwrap: () => Promise.resolve([validConfig]) };
    }
    return sendAlertsByEmail(thunk);
  });

  const action = jest.fn(async (email) => {
    await dispatch(`sendAlerts:${email}`);
  });

  const result = await invokeValidatedEmailExportAction({
    ...deps,
    dispatch: deps.dispatch || dispatch,
    action,
  });

  return { result, action, sendAlertsByEmail };
}

async function runActivityReportEmailGateFlow(deps) {
  const action = jest.fn(async (email) => {
    await deps.dispatch(`sendActivityReport:${email}`);
  });

  const result = await invokeValidatedEmailExportAction({
    ...deps,
    action,
  });

  return { result, action };
}

describe('Alerts email gate parity', () => {
  it('success path invokes export action with validated profile email', async () => {
    const deps = createGateDeps();
    const action = jest.fn();
    const result = await invokeValidatedEmailExportAction({ ...deps, action });

    expect(result).toEqual({ ok: true, email: 'user@example.com' });
    expect(action).toHaveBeenCalledWith('user@example.com');
    expect(deps.showSnackbar).not.toHaveBeenCalled();
  });

  it('missing profile shows shared gate snackbar and skips export action', async () => {
    const deps = createGateDeps({ userProfile: {} });
    const action = jest.fn();
    const result = await invokeValidatedEmailExportAction({ ...deps, action });

    expect(result).toEqual({ ok: false });
    expect(action).not.toHaveBeenCalled();
    expect(deps.showSnackbar).toHaveBeenCalledWith(EMAIL_PROFILE_MISSING_MESSAGE, 'error');
  });

  it('server config failure shows shared gate snackbar and skips export action', async () => {
    const deps = createGateDeps({
      dispatch: createDispatchMock([]),
    });
    const action = jest.fn();
    const result = await invokeValidatedEmailExportAction({ ...deps, action });

    expect(result).toEqual({ ok: false });
    expect(action).not.toHaveBeenCalled();
    expect(deps.showSnackbar).toHaveBeenCalledWith(EMAIL_SERVER_NOT_CONFIGURED_MESSAGE, 'error');
  });

  it('mirrors Alerts handleEmailDialogOpen + emailAction contract', async () => {
    const { result, action } = await runAlertsEmailGateFlow(createGateDeps());
    expect(result.ok).toBe(true);
    expect(action).toHaveBeenCalledWith('user@example.com');
  });
});

describe('ActivityReport email gate parity', () => {
  it('success path invokes export action with validated profile email', async () => {
    const deps = createGateDeps({ userProfile: { email: ' report@example.com ' } });
    const action = jest.fn();
    const result = await invokeValidatedEmailExportAction({ ...deps, action });

    expect(result).toEqual({ ok: true, email: 'report@example.com' });
    expect(action).toHaveBeenCalledWith('report@example.com');
  });

  it('missing profile shows shared gate snackbar and skips export action', async () => {
    const deps = createGateDeps({ userProfile: null });
    const action = jest.fn();
    const result = await invokeValidatedEmailExportAction({ ...deps, action });

    expect(result).toEqual({ ok: false });
    expect(action).not.toHaveBeenCalled();
    expect(deps.showSnackbar).toHaveBeenCalledWith(EMAIL_PROFILE_MISSING_MESSAGE, 'error');
  });

  it('server config failure shows shared gate snackbar and skips export action', async () => {
    const deps = createGateDeps({
      dispatch: jest.fn(() => ({
        unwrap: () => Promise.reject(new Error('network')),
      })),
    });
    const action = jest.fn();
    const result = await invokeValidatedEmailExportAction({ ...deps, action });

    expect(result).toEqual({ ok: false });
    expect(action).not.toHaveBeenCalled();
    expect(deps.showSnackbar).toHaveBeenCalledWith(EMAIL_SERVER_NOT_CONFIGURED_MESSAGE, 'error');
  });

  it('mirrors ActivityReport handleEmailDialogOpen + emailAction contract', async () => {
    const dispatch = jest.fn((marker) => {
      if (marker === 'fetchEmailConfigs') {
        return { unwrap: () => Promise.resolve([validConfig]) };
      }
      return marker;
    });
    const deps = createGateDeps({
      dispatch: jest.fn((arg) => {
        if (typeof arg === 'function') {
          return { unwrap: () => Promise.resolve([validConfig]) };
        }
        return dispatch(arg);
      }),
    });

    const { result, action } = await runActivityReportEmailGateFlow(deps);
    expect(result.ok).toBe(true);
    expect(action).toHaveBeenCalledWith('user@example.com');
  });
});

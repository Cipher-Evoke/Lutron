/**
 * @jest-environment node
 */
import {
  buildStandardEnergyExportApiParams,
  buildGroupEnergyExportApiParams,
  resolveBuiltInEnergyExportActions,
  resolveEmailExportOutcome,
  resolveDownloadExportOutcome,
  runEnergyEmailExport,
  runEnergyDownloadExport,
  runCustomGraphEnergyExport,
  ENERGY_EXPORT_SUCCESS_MESSAGES,
  ENERGY_EXPORT_WIDGET_KEYS,
} from './exportActionResolvers';
import {
  buildExportLoadingKey,
  createBasicGroupExportKeys,
  createAdvancedGroupExportKeys,
  DEFAULT_CONSUMPTION_EXPORT_KEYS,
} from './exportMenuState';

function createMockThunk(type) {
  return jest.fn((args) => () => ({ type, payload: args }));
}

const thunks = {
  sendEnergyConsumptionEmail: createMockThunk('email/fulfilled'),
  downloadEnergyConsumption: createMockThunk('download/fulfilled'),
  sendEnergySavingsEmail: createMockThunk('email/fulfilled'),
  downloadEnergySavings: createMockThunk('download/fulfilled'),
  sendTotalConsumptionByGroupEmail: createMockThunk('email/fulfilled'),
  downloadTotalConsumptionByGroup: createMockThunk('download/fulfilled'),
  sendPeakMinConsumptionEmail: createMockThunk('email/fulfilled'),
  downloadPeakMinConsumption: createMockThunk('download/fulfilled'),
  sendOccupancyCountEmail: createMockThunk('email/fulfilled'),
  downloadOccupancyCount: createMockThunk('download/fulfilled'),
  sendOccupancyByGroupEmail: createMockThunk('email/fulfilled'),
  downloadOccupancyByGroup: createMockThunk('download/fulfilled'),
  sendSpaceUtilizationPerEmail: createMockThunk('email/fulfilled'),
  downloadSpaceUtilizationPer: createMockThunk('download/fulfilled'),
};

const selection = {
  selectedAreas: [1, 2],
  selectedFloorIds: [],
  selectedDuration: 'this-week',
  customStartDate: '2025-06-01',
  customEndDate: '2025-06-07',
  isNavigating: false,
};

function legacyEmailOutcome(result) {
  if (result.type.endsWith('/fulfilled')) {
    if (
      result.payload &&
      typeof result.payload === 'object' &&
      (result.payload.status === 'error' || result.payload.state === 'error')
    ) {
      return {
        ok: false,
        message: `Email sending failed. Following is the error: ${result.payload.message || 'Unknown error occurred'}`,
      };
    }
    return { ok: true };
  }

  const errorMessage = result.payload?.message || result.payload || 'Unknown error occurred';
  return {
    ok: false,
    message: `Email sending failed. Following is the error: ${errorMessage}`,
  };
}

function legacyDownloadOutcome(result) {
  if (result.type.endsWith('/fulfilled')) {
    return { ok: true };
  }
  return {
    ok: false,
    message: result.payload || 'Failed to download report. Please try again.',
  };
}

describe('dashboard export action resolvers parity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('buildStandardEnergyExportApiParams matches legacy chart params', () => {
    const params = buildStandardEnergyExportApiParams(selection);
    expect(params).toEqual({
      areaIds: [1, 2],
      floorIds: [],
      timeRange: 'this-week',
      startDate: '2025-06-01',
      endDate: '2025-06-07',
      isNavigating: false,
    });
  });

  it('buildGroupEnergyExportApiParams excludes dashboard location scope', () => {
    const calculateDateParameters = () => ({
      startDate: '2025-05-01',
      endDate: '2025-05-31',
      timeRange: 'this-month',
    });

    const params = buildGroupEnergyExportApiParams(selection, calculateDateParameters);
    expect(params).toEqual({
      timeRange: 'this-month',
      startDate: '2025-05-01',
      endDate: '2025-05-31',
    });
    expect(params.areaIds).toBeUndefined();
    expect(params.floorIds).toBeUndefined();
    expect(params.isNavigating).toBeUndefined();
  });

  it('resolveBuiltInEnergyExportActions maps consumption widget', () => {
    const resolved = resolveBuiltInEnergyExportActions(
      ENERGY_EXPORT_WIDGET_KEYS.CONSUMPTION,
      thunks
    );
    expect(resolved.emailThunk).toBe(thunks.sendEnergyConsumptionEmail);
    expect(resolved.downloadThunk).toBe(thunks.downloadEnergyConsumption);
  });

  it('resolveEmailExportOutcome matches legacy success and payload-error paths', () => {
    const success = { type: 'slice/fulfilled', payload: { status: 'ok' } };
    const payloadError = {
      type: 'slice/fulfilled',
      payload: { status: 'error', message: 'SMTP down' },
    };
    const rejected = { type: 'slice/rejected', payload: 'network' };

    expect(resolveEmailExportOutcome(success).ok).toBe(legacyEmailOutcome(success).ok);
    expect(resolveEmailExportOutcome(payloadError).ok).toBe(legacyEmailOutcome(payloadError).ok);
    expect(resolveEmailExportOutcome(rejected).ok).toBe(legacyEmailOutcome(rejected).ok);
  });

  it('resolveDownloadExportOutcome matches legacy download handling', () => {
    const success = { type: 'slice/fulfilled', payload: {} };
    const rejected = { type: 'slice/rejected', payload: 'bad' };

    expect(resolveDownloadExportOutcome(success).ok).toBe(legacyDownloadOutcome(success).ok);
    expect(resolveDownloadExportOutcome(rejected).errorMessage).toBe(
      legacyDownloadOutcome(rejected).message
    );
  });

  it('runEnergyEmailExport dispatches thunk and shows success snackbar', async () => {
    const dispatch = jest.fn(async () => ({
      type: 'sendEnergyConsumptionEmail/fulfilled',
      payload: { status: 'ok' },
    }));
    const showSnackbar = jest.fn();

    const result = await runEnergyEmailExport({
      dispatch,
      emailThunk: thunks.sendEnergyConsumptionEmail,
      toEmail: 'user@example.com',
      apiParams: buildStandardEnergyExportApiParams(selection),
      showSnackbar,
      successMessage: ENERGY_EXPORT_SUCCESS_MESSAGES.consumption.email,
    });

    expect(result.ok).toBe(true);
    expect(thunks.sendEnergyConsumptionEmail).toHaveBeenCalledWith({
      toEmail: 'user@example.com',
      areaIds: [1, 2],
      floorIds: [],
      timeRange: 'this-week',
      startDate: '2025-06-01',
      endDate: '2025-06-07',
      isNavigating: false,
    });
    expect(showSnackbar).toHaveBeenCalledWith(
      ENERGY_EXPORT_SUCCESS_MESSAGES.consumption.email,
      'success'
    );
  });

  it('runEnergyEmailExport surfaces rejected errors', async () => {
    const dispatch = jest.fn(async () => ({
      type: 'email/rejected',
      payload: { message: 'Mailbox unavailable' },
    }));
    const showSnackbar = jest.fn();

    const result = await runEnergyEmailExport({
      dispatch,
      emailThunk: thunks.sendEnergyConsumptionEmail,
      toEmail: 'user@example.com',
      apiParams: {},
      showSnackbar,
      successMessage: 'ok',
    });

    expect(result.ok).toBe(false);
    expect(showSnackbar).toHaveBeenCalledWith(
      'Email sending failed. Following is the error: Mailbox unavailable',
      'error'
    );
  });

  it('runEnergyDownloadExport dispatches download thunk and shows success snackbar', async () => {
    const dispatch = jest.fn(async () => ({
      type: 'downloadEnergySavings/fulfilled',
      payload: {},
    }));
    const showSnackbar = jest.fn();

    const result = await runEnergyDownloadExport({
      dispatch,
      downloadThunk: thunks.downloadEnergySavings,
      apiParams: buildStandardEnergyExportApiParams(selection),
      showSnackbar,
      successMessage: ENERGY_EXPORT_SUCCESS_MESSAGES.savings.download,
    });

    expect(result.ok).toBe(true);
    expect(thunks.downloadEnergySavings).toHaveBeenCalledWith(
      buildStandardEnergyExportApiParams(selection)
    );
    expect(showSnackbar).toHaveBeenCalledWith(
      ENERGY_EXPORT_SUCCESS_MESSAGES.savings.download,
      'success'
    );
  });

  it('runCustomGraphEnergyExport resolves api_path actions', async () => {
    const dispatch = jest.fn(async () => ({
      type: 'downloadPeakMinConsumption/fulfilled',
      payload: {},
    }));
    const showSnackbar = jest.fn();

    const result = await runCustomGraphEnergyExport({
      dispatch,
      showSnackbar,
      action: 'download',
      graph: { api_path: '/dashboard/peak_min_consumption' },
      apiParams: buildStandardEnergyExportApiParams(selection),
      toEmail: 'user@example.com',
      thunks,
    });

    expect(result.ok).toBe(true);
    expect(thunks.downloadPeakMinConsumption).toHaveBeenCalledWith(
      buildStandardEnergyExportApiParams(selection)
    );
    expect(showSnackbar).toHaveBeenCalledWith('Download started successfully!', 'success');
  });

  it('runCustomGraphEnergyExport reports unsupported endpoint', async () => {
    const dispatch = jest.fn();
    const showSnackbar = jest.fn();

    const result = await runCustomGraphEnergyExport({
      dispatch,
      showSnackbar,
      action: 'email',
      graph: { api_path: '/dashboard/unknown' },
      apiParams: {},
      toEmail: 'user@example.com',
      thunks,
    });

    expect(result.ok).toBe(false);
    expect(showSnackbar).toHaveBeenCalledWith(
      "Export not supported for this graph's endpoint.",
      'error'
    );
    expect(dispatch).not.toHaveBeenCalled();
  });
});

describe('export menu state key parity', () => {
  it('basic group keys preserve total_consumption_by_group prefix', () => {
    const keys = createBasicGroupExportKeys('total_consumption_by_group');
    expect(buildExportLoadingKey(keys.loadingPrefix, 'email')).toBe(
      'total_consumption_by_group_email'
    );
    expect(keys.menuCloseKey).toBe('total_consumption_by_group');
  });

  it('advanced group keys preserve legacy menu/loading mismatch', () => {
    const keys = createAdvancedGroupExportKeys();
    expect(keys.menuCloseKey).toBe('Consumption By Area Groups');
    expect(buildExportLoadingKey(keys.loadingPrefix, 'download')).toBe(
      'Consumption by Group_download'
    );
  });

  it('consumption defaults preserve Consumption_* loading keys', () => {
    expect(buildExportLoadingKey(DEFAULT_CONSUMPTION_EXPORT_KEYS.loadingPrefix, 'email')).toBe(
      'Consumption_email'
    );
  });
});

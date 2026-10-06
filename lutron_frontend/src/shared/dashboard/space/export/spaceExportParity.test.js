/**
 * @jest-environment node
 */
import { resolveSpaceExportThunks } from '../../export/spaceExportActionMap';
import {
  buildSpaceExportApiParams,
  resolveSpaceDownloadExportOutcome,
  resolveSpaceEmailExportOutcome,
  resolveSpaceExportActions,
  resolveSpaceExportMessages,
  runSpaceDownloadExport,
  runSpaceEmailExport,
  SPACE_EXPORT_MESSAGE_PRESETS,
} from './spaceExportResolvers';
import {
  buildSpaceExportLoadingKey,
  DEFAULT_SPACE_EXPORT_DROPDOWN_BASIC,
  shouldCloseSpaceExportMenusOnOutsideClick,
  SPACE_EXPORT_OUTSIDE_CLICK_PROFILES,
} from './spaceExportMenuState';

const thunks = {
  sendInstantOccupancyCountEmail: 'instant-email',
  downloadInstantOccupancyCount: 'instant-dl',
  sendOccupancyCountEmail: 'occ-email',
  downloadOccupancyCount: 'occ-dl',
  sendOccupancyByGroupFromLogsEmail: 'group-logs-email',
  downloadOccupancyByGroupFromLogs: 'group-logs-dl',
  sendOccupancyByGroupEmail: 'group-email',
  downloadOccupancyByGroup: 'group-dl',
  sendSpaceUtilizationPerFromLogsEmail: 'per-logs-email',
  downloadSpaceUtilizationPerFromLogs: 'per-logs-dl',
  sendSpaceUtilizationPerEmail: 'per-email',
  downloadSpaceUtilizationPer: 'per-dl',
};

const selection = {
  selectedAreas: [1, 2],
  selectedFloorIds: [],
  selectedGroupIds: [9],
  selectedDuration: 'this-week',
  customDateRange: { startDate: '2025-06-01', endDate: '2025-06-07' },
  isNavigating: false,
};

function legacyEmailOutcome(result) {
  if (result.type.endsWith('/fulfilled')) {
    if (
      result.payload &&
      typeof result.payload === 'object' &&
      (result.payload.status === 'error' || result.payload.state === 'error')
    ) {
      return { ok: false };
    }
    return { ok: true };
  }
  return { ok: false };
}

function legacyDownloadOutcome(result) {
  return { ok: result.type.endsWith('/fulfilled') };
}

describe('space export api params', () => {
  it('buildSpaceExportApiParams includes group ids for customized parity', () => {
    const params = buildSpaceExportApiParams(selection);
    expect(params.areaIds).toEqual([1, 2]);
    expect(params.groupIds).toEqual([9]);
    expect(params.timeRange).toBe('this-week');
    expect(params.isNavigating).toBe(false);
  });
});

describe('space export thunk routing parity', () => {
  it('utilization line chart (dropdownKey line)', () => {
    const resolved = resolveSpaceExportActions(
      { showChartsTab: false, dropdownKey: 'line', chartTitle: 'Utilization' },
      thunks
    );
    expect(resolved.emailThunk).toBe('occ-email');
    expect(resolved.downloadThunk).toBe('occ-dl');
  });

  it('utilization_by_area_group (dropdownKey pie)', () => {
    const charts = resolveSpaceExportActions(
      { showChartsTab: true, dropdownKey: 'pie', chartTitle: 'Occupancy by Group' },
      thunks
    );
    expect(charts.emailThunk).toBe('group-logs-email');

    const main = resolveSpaceExportActions(
      { showChartsTab: false, dropdownKey: 'pie', chartTitle: 'Area Groups' },
      thunks
    );
    expect(main.downloadThunk).toBe('group-dl');
  });

  it('utilization_by_area (table / title)', () => {
    const resolved = resolveSpaceExportActions(
      { showChartsTab: true, dropdownKey: 'table', chartTitle: 'Utilization By Area' },
      thunks
    );
    expect(resolved).toEqual(resolveSpaceExportThunks(
      { showChartsTab: true, dropdownKey: 'table', chartTitle: 'Utilization By Area' },
      thunks
    ));
    expect(resolved.downloadThunk).toBe(thunks.downloadSpaceUtilizationPerFromLogs);
  });

  it('utilization_by_area routes by table key when title is renamed', () => {
    const charts = resolveSpaceExportActions(
      { showChartsTab: true, dropdownKey: 'table', chartTitle: 'Custom Area Label' },
      thunks
    );
    expect(charts.downloadThunk).toBe(thunks.downloadSpaceUtilizationPerFromLogs);

    const main = resolveSpaceExportActions(
      { showChartsTab: false, dropdownKey: 'table', chartTitle: 'Custom Area Label' },
      thunks
    );
    expect(main.downloadThunk).toBe(thunks.downloadSpaceUtilizationPer);
  });

  it('instant_occupancy_count', () => {
    const resolved = resolveSpaceExportActions(
      { showChartsTab: true, dropdownKey: 'instant', chartTitle: 'Instant Occupancy Count' },
      thunks
    );
    expect(resolved.emailThunk).toBe('instant-email');
  });

  it('instant_utilization_combined on main tab routes to occupancy count', () => {
    const resolved = resolveSpaceExportActions(
      { showChartsTab: false, dropdownKey: 'instantCombined', chartTitle: 'Combined' },
      thunks
    );
    expect(resolved.downloadThunk).toBe('occ-dl');
  });

  it('peak_and_minimum_utilization title routes like utilization when invoked', () => {
    const resolved = resolveSpaceExportActions(
      { showChartsTab: false, dropdownKey: 'peak', chartTitle: 'Peak & Minimum Utilization' },
      thunks
    );
    expect(resolved.emailThunk).toBe('occ-email');
    expect(resolved.downloadThunk).toBe('occ-dl');
  });
});

describe('space export outcome parity', () => {
  it('email outcome matches legacy fulfilled/error paths', () => {
    const success = { type: 'slice/fulfilled', payload: { status: 'ok' } };
    const payloadError = {
      type: 'slice/fulfilled',
      payload: { status: 'error', message: 'SMTP down' },
    };
    const rejected = { type: 'slice/rejected', payload: 'network' };

    expect(resolveSpaceEmailExportOutcome(success).ok).toBe(legacyEmailOutcome(success).ok);
    expect(resolveSpaceEmailExportOutcome(payloadError).ok).toBe(
      legacyEmailOutcome(payloadError).ok
    );
    expect(resolveSpaceEmailExportOutcome(rejected).ok).toBe(legacyEmailOutcome(rejected).ok);
  });

  it('download outcome matches legacy download handling', () => {
    const success = { type: 'slice/fulfilled', payload: {} };
    const rejected = { type: 'slice/rejected', payload: 'bad' };

    expect(resolveSpaceDownloadExportOutcome(success).ok).toBe(legacyDownloadOutcome(success).ok);
    expect(resolveSpaceDownloadExportOutcome(rejected).ok).toBe(legacyDownloadOutcome(rejected).ok);
  });
});

describe('space export runners', () => {
  const showSnackbar = jest.fn();
  const dispatch = jest.fn((thunk) => {
    if (typeof thunk === 'function') {
      return thunk();
    }
    return thunk;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('runSpaceEmailExport shows basic chart-title success message', async () => {
    dispatch.mockReturnValueOnce({ type: 'email/fulfilled', payload: { status: 'ok' } });
    const messages = resolveSpaceExportMessages('basic');

    await runSpaceEmailExport({
      dispatch,
      emailThunk: jest.fn(),
      toEmail: 'user@test.com',
      apiParams: { areaIds: [1] },
      showSnackbar,
      successMessage: messages.emailSuccess('Utilization By Area'),
    });

    expect(showSnackbar).toHaveBeenCalledWith(
      'Utilization By Area report sent successfully!',
      'success'
    );
  });

  it('runSpaceDownloadExport shows advanced chart-title success message', async () => {
    dispatch.mockReturnValueOnce({ type: 'download/fulfilled', payload: {} });
    const messages = resolveSpaceExportMessages('advanced');

    await runSpaceDownloadExport({
      dispatch,
      downloadThunk: jest.fn(),
      apiParams: { areaIds: [1] },
      showSnackbar,
      successMessage: messages.downloadSuccess('Utilization By Area'),
      rejectedFallback: messages.downloadRejected,
      catchMessage: messages.downloadCatch,
    });

    expect(showSnackbar).toHaveBeenCalledWith(
      'Utilization By Area report downloaded successfully!',
      'success'
    );
  });

  it('runSpaceEmailExport surfaces payload error', async () => {
    dispatch.mockReturnValueOnce({
      type: 'email/fulfilled',
      payload: { status: 'error', message: 'Mailbox full' },
    });

    await runSpaceEmailExport({
      dispatch,
      emailThunk: jest.fn(),
      toEmail: 'user@test.com',
      apiParams: {},
      showSnackbar,
      successMessage: 'ok',
    });

    expect(showSnackbar).toHaveBeenCalledWith(
      'Email sending failed. Following is the error: Mailbox full',
      'error'
    );
  });
});

describe('space export menu helpers', () => {
  it('buildSpaceExportLoadingKey preserves chart title keys', () => {
    expect(buildSpaceExportLoadingKey('Utilization By Area', 'email')).toBe(
      'Utilization By Area_email'
    );
  });

  it('basic outside-click profile closes when clicking outside export UI', () => {
    const event = {
      target: {
        closest: (selector) => {
          if (selector === 'button[data-export-menu]') return null;
          if (selector === '[data-export-dropdown-panel]') return null;
          return null;
        },
      },
    };
    expect(
      shouldCloseSpaceExportMenusOnOutsideClick(event, SPACE_EXPORT_OUTSIDE_CLICK_PROFILES.basic)
    ).toBe(true);
  });

  it('basic default dropdown state includes instantCombined', () => {
    expect(DEFAULT_SPACE_EXPORT_DROPDOWN_BASIC.instantCombined).toBe(false);
  });

  it('message presets use chart title for download success on all variants', () => {
    expect(SPACE_EXPORT_MESSAGE_PRESETS.basic.downloadSuccess('Chart')).toBe(
      'Chart report downloaded successfully!'
    );
    expect(SPACE_EXPORT_MESSAGE_PRESETS.advanced.downloadSuccess('Chart')).toBe(
      'Chart report downloaded successfully!'
    );
    expect(SPACE_EXPORT_MESSAGE_PRESETS.customized.downloadSuccess('Chart')).toBe(
      'Chart report downloaded successfully!'
    );
  });
});

import { buildChartApiParams } from '../../export/buildChartApiParams';
import {
  createEnergyExportActionMap,
  ENERGY_EXPORT_WIDGET_KEYS,
  resolveEnergyExportByApiPath,
} from '../../export/energyExportActionMap';
import {
  getExportErrorMessage,
  isExportActionFulfilled,
  isExportPayloadError,
} from '../../export/chartExportResults';

export { resolveEnergyExportByApiPath, ENERGY_EXPORT_WIDGET_KEYS, createEnergyExportActionMap };

export const ENERGY_EXPORT_SUCCESS_MESSAGES = {
  consumption: {
    email: 'Energy Consumption report sent successfully!',
    download: 'Energy Consumption report downloaded successfully!',
  },
  savings: {
    email: 'Energy Savings report sent successfully!',
    download: 'Energy Savings report downloaded successfully!',
  },
  totalConsumptionByGroup: {
    email: 'Consumption by Group report sent successfully!',
    download: 'Consumption by Group report downloaded successfully!',
  },
};

export function buildStandardEnergyExportApiParams(selection = {}) {
  return buildChartApiParams({
    selectedAreas: selection.selectedAreas,
    selectedFloorIds: selection.selectedFloorIds,
    timeRange: selection.selectedDuration,
    startDate: selection.customStartDate,
    endDate: selection.customEndDate,
    isNavigating: selection.isNavigating,
  });
}

export function buildGroupEnergyExportApiParams(selection = {}, calculateDateParameters) {
  const { startDate, endDate, timeRange } = calculateDateParameters();
  // Total Consumption by Area Group is project-scoped. The backend derives
  // configured Area Groups, so dashboard area/floor selections are intentionally
  // excluded from both download and email payloads.
  return { timeRange, startDate, endDate };
}

export function resolveBuiltInEnergyExportActions(widgetKey, thunks) {
  const map = createEnergyExportActionMap(thunks);
  return map[widgetKey] || null;
}

export function resolveEmailExportOutcome(result, { checkPayloadError = true } = {}) {
  if (!isExportActionFulfilled(result)) {
    return {
      ok: false,
      errorMessage: getExportErrorMessage(result),
      snackbarSeverity: 'error',
      snackbarPrefix: 'Email sending failed. Following is the error: ',
    };
  }

  if (checkPayloadError && isExportPayloadError(result.payload)) {
    return {
      ok: false,
      errorMessage: getExportErrorMessage(result),
      snackbarSeverity: 'error',
      snackbarPrefix: 'Email sending failed. Following is the error: ',
    };
  }

  return { ok: true };
}

export function resolveDownloadExportOutcome(result, { rejectedFallback } = {}) {
  if (isExportActionFulfilled(result)) {
    return { ok: true };
  }

  return {
    ok: false,
    errorMessage: result?.payload || rejectedFallback || 'Failed to download report. Please try again.',
    snackbarSeverity: 'error',
  };
}

export async function runEnergyEmailExport({
  dispatch,
  emailThunk,
  toEmail,
  apiParams,
  showSnackbar,
  successMessage,
  checkPayloadError = true,
}) {
  const result = await dispatch(
    emailThunk({
      toEmail,
      ...apiParams,
    })
  );

  const outcome = resolveEmailExportOutcome(result, { checkPayloadError });
  if (outcome.ok) {
    showSnackbar(successMessage, 'success');
    return { ok: true, result };
  }

  showSnackbar(`${outcome.snackbarPrefix}${outcome.errorMessage}`, outcome.snackbarSeverity);
  return { ok: false, result };
}

export async function runEnergyDownloadExport({
  dispatch,
  downloadThunk,
  apiParams,
  showSnackbar,
  successMessage,
  rejectedFallback = 'Failed to download report. Please try again.',
}) {
  const result = await dispatch(downloadThunk(apiParams));
  const outcome = resolveDownloadExportOutcome(result, { rejectedFallback });

  if (outcome.ok) {
    showSnackbar(successMessage, 'success');
    return { ok: true, result };
  }

  showSnackbar(outcome.errorMessage, outcome.snackbarSeverity);
  return { ok: false, result };
}

export async function runCustomGraphEnergyExport({
  dispatch,
  showSnackbar,
  action,
  graph,
  apiParams,
  toEmail,
  thunks,
}) {
  const apiPath = String(graph?.api_path || '').trim();
  if (!apiPath) {
    showSnackbar('Export not available for this graph.', 'error');
    return { ok: false };
  }

  const resolved = resolveEnergyExportByApiPath(apiPath, thunks);
  if (!resolved) {
    showSnackbar("Export not supported for this graph's endpoint.", 'error');
    return { ok: false };
  }

  if (action === 'email') {
    if (!toEmail) {
      showSnackbar('User email not found. Please log in again.', 'error');
      return { ok: false };
    }
    if (!resolved.emailThunk) {
      showSnackbar('Email export not supported for this graph.', 'error');
      return { ok: false };
    }

    const result = await dispatch(
      resolved.emailThunk({
        toEmail,
        ...apiParams,
      })
    );

    if (isExportActionFulfilled(result)) {
      showSnackbar(`${resolved.label} report sent successfully!`, 'success');
      return { ok: true, result };
    }

    showSnackbar(result.payload || 'Failed to send email.', 'error');
    return { ok: false, result };
  }

  if (action === 'download') {
    if (!resolved.downloadThunk) {
      showSnackbar('Download export not supported for this graph.', 'error');
      return { ok: false };
    }

    const result = await dispatch(resolved.downloadThunk(apiParams));

    if (isExportActionFulfilled(result)) {
      showSnackbar('Download started successfully!', 'success');
      return { ok: true, result };
    }

    showSnackbar(result?.payload || 'Failed to start download.', 'error');
    return { ok: false, result };
  }

  return { ok: false };
}

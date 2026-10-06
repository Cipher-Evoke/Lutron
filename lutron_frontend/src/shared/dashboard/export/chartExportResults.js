export function isExportActionFulfilled(result) {
  return Boolean(result?.type?.endsWith('/fulfilled'));
}

export function getExportErrorMessage(result, fallback = 'Unknown error occurred') {
  return result?.payload?.message || result?.payload || fallback;
}

export function isExportPayloadError(payload) {
  return (
    payload &&
    typeof payload === 'object' &&
    (payload.status === 'error' || payload.state === 'error')
  );
}

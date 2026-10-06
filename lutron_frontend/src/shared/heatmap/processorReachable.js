/** Heat Map: processor offline → PDF original colors; message only on area click. */

export const PROCESSOR_NOT_PINGING_MESSAGE = "Processor is not pinging";

export function isMapProcessorUnreachable(area) {
  return area?.processor_reachable === false;
}

function extractErrorText(err) {
  if (err == null) return "";
  if (typeof err === "string") return err;
  const detail = err.response?.data?.detail ?? err.response?.data?.message;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => item?.msg || String(item)).filter(Boolean).join("; ");
  }
  if (typeof err.message === "string") return err.message;
  return String(err);
}

/** Map full_area_status / LEAP unreachable errors to the Heat Map click message. */
export function mapAreaStatusFetchError(err) {
  const text = extractErrorText(err);
  if (/not reachable|not pinging|not responding/i.test(text)) {
    return PROCESSOR_NOT_PINGING_MESSAGE;
  }
  return text || "Failed to fetch area status";
}

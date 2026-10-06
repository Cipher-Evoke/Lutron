export function formatApiError(err) {
  const data = err?.response?.data;
  const detail = data?.detail;
  if (Array.isArray(detail)) {
    return detail.map((x) => x.msg || JSON.stringify(x)).join("; ");
  }
  if (typeof detail === "string") {
    return detail;
  }
  return data?.message || err?.response?.statusText || err?.message || "Request failed";
}

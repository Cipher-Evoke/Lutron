/** Stable fingerprint for Activity Report Generate params (order-independent). */
export function buildActivityReportGenerateKey(params = {}) {
  const sortIds = (arr) =>
    Array.isArray(arr) ? [...arr].map(String).sort() : [];

  return JSON.stringify({
    floor_ids: sortIds(params.floor_ids),
    area_ids: sortIds(params.area_ids),
    activity_description: sortIds(params.activity_description),
    start_date: params.start_date || "",
    start_time: params.start_time || "",
    end_date: params.end_date || "",
    end_time: params.end_time || "",
  });
}

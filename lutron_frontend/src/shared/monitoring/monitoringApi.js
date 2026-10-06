/**
 * Dedicated Monitoring API client.
 * Pass the variant BaseUrl axios instance — do not mix with energy slices.
 */

export function createMonitoringApi(BaseUrl) {
  if (!BaseUrl || typeof BaseUrl.get !== "function") {
    throw new Error("createMonitoringApi requires a BaseUrl axios instance");
  }

  return {
    getSummary: () => BaseUrl.get("/monitoring/summary"),
    getPipeline: () => BaseUrl.get("/monitoring/pipeline"),
    getHealth: () => BaseUrl.get("/monitoring/health"),
    getConnectivity: () => BaseUrl.get("/monitoring/processors/connectivity"),
    getJobs: (params = {}) => BaseUrl.get("/monitoring/jobs", { params }),
    getAlerts: (params = {}) => BaseUrl.get("/monitoring/alerts", { params }),
    getIssues: (params = {}) => BaseUrl.get("/monitoring/issues", { params }),
    getStatus: () => BaseUrl.get("/monitoring/status"),
    setStatus: (enabled) =>
      BaseUrl.patch("/monitoring/status", { enabled: Boolean(enabled) }),
    getResources: () => BaseUrl.get("/monitoring/resources"),
    getRuntimeEvents: (params = {}) =>
      BaseUrl.get("/monitoring/runtime/events", { params }),
    getRuntimeRestarts: (params = {}) =>
      BaseUrl.get("/monitoring/runtime/restarts", { params }),
    getRuntimeSupervisor: () => BaseUrl.get("/monitoring/runtime/supervisor"),
    getRuntimeRestartCounts: (params = {}) =>
      BaseUrl.get("/monitoring/runtime/restart-counts", { params }),
    getRuntimeAbandoned: (params = {}) =>
      BaseUrl.get("/monitoring/runtime/abandoned", { params }),
    getOpsOverview: () => BaseUrl.get("/monitoring/internal"),
    getOpsSnapshot: () => BaseUrl.get("/monitoring/internal/snapshot"),
    getOpsBootstrap: () => BaseUrl.get("/monitoring/internal/bootstrap"),
    getOpsProcessors: () => BaseUrl.get("/monitoring/internal/processors"),
    getOpsGapfill: () => BaseUrl.get("/monitoring/internal/gapfill"),
    getOpsRuntime: () => BaseUrl.get("/monitoring/internal/runtime"),
    getOpsDatabase: () => BaseUrl.get("/monitoring/internal/database"),
  };
}

export function getMonitoringErrorDetail(error) {
  const status = error?.response?.status;
  const detail = error?.response?.data?.detail;
  if (typeof detail === "string") return { status, detail };
  if (detail && typeof detail === "object" && detail.message) {
    return { status, detail: String(detail.message) };
  }
  if (status === 401 || status === 403) {
    return { status, detail: "You are not authorized to view Application Monitoring." };
  }
  if (status === 503) {
    return { status, detail: detail || "Monitoring service unavailable." };
  }
  return {
    status,
    detail:
      (typeof detail === "string" && detail) ||
      error?.message ||
      "Failed to load monitoring data.",
  };
}

export function isMonitoringDisabledError(error) {
  const { status, detail } = getMonitoringErrorDetail(error);
  if (status !== 503) return false;
  return String(detail || "")
    .toLowerCase()
    .includes("monitoring is disabled");
}

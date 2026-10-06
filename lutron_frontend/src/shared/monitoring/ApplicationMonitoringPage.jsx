import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import FormControlLabel from "@mui/material/FormControlLabel";
import Paper from "@mui/material/Paper";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import RefreshIcon from "@mui/icons-material/Refresh";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import { darken } from "@mui/material/styles";

import {
  createMonitoringApi,
  getMonitoringErrorDetail,
  isMonitoringDisabledError,
} from "./monitoringApi";
import ProcessorTable from "./ProcessorTable";
import IssuesPanel from "./IssuesPanel";
import ResourceUsagePanel from "./ResourceUsagePanel";
import LiveStateOpsPanel from "./LiveStateOpsPanel";
import StatusBadge from "./StatusBadge";
import {
  monitoringBodyTextSx,
  monitoringMutedTextSx,
  monitoringPageTextSx,
  monitoringSectionPaperSx,
  monitoringSectionTitleSx,
} from "./monitoringUiStyles";

const AUTO_REFRESH_MS = 30000;

function Section({ title, children, sx: sectionSx }) {
  return (
    <Box sx={{ mb: 4, ...monitoringPageTextSx, ...sectionSx }}>
      <Typography variant="h6" sx={monitoringSectionTitleSx}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function settledValue(result) {
  if (result.status === "fulfilled") return { data: result.value?.data, error: null };
  return { data: null, error: result.reason };
}

function MonitoringStatusControl({
  status,
  loading,
  error,
  mutating,
  mutateError,
  onToggle,
}) {
  if (error && !status) {
    return (
      <Paper elevation={0} sx={monitoringSectionPaperSx}>
        <Typography variant="body2" color="error">
          Monitoring status unavailable: {error}
        </Typography>
      </Paper>
    );
  }

  if (loading && !status) {
    return (
      <Paper elevation={0} sx={monitoringSectionPaperSx}>
        <Typography variant="body2" sx={monitoringBodyTextSx}>
          Loading monitoring status…
        </Typography>
      </Paper>
    );
  }

  const enabled = status?.enabled ?? status?.monitoring_enabled;
  const writable = status?.writable === true;
  let label = "Unknown";
  let tone = "neutral";
  if (enabled === true) {
    label = "ON";
    tone = "success";
  } else if (enabled === false) {
    label = "OFF";
    tone = "error";
  }

  const envForcedOff = status?.environment_enabled === false;
  const helper = envForcedOff
    ? "Controlled by environment (MONITORING_ENABLED). Toggle is disabled."
    : writable
      ? "Controls backend monitoring collection. Separate from Auto refresh."
      : "Monitoring status is not writable right now.";

  return (
    <Paper elevation={0} sx={monitoringSectionPaperSx}>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Typography variant="body2" sx={{ ...monitoringBodyTextSx, fontWeight: 600 }}>
          Monitoring
        </Typography>
        <StatusBadge label={label} tone={tone} />
        <FormControlLabel
          sx={{
            ml: 0.5,
            color: "#111827",
            "& .MuiFormControlLabel-label": { color: "#111827", fontSize: 14 },
          }}
          control={
            <Switch
              checked={enabled === true}
              disabled={!writable || mutating || enabled == null}
              onChange={(e) => onToggle(e.target.checked)}
              color="primary"
              inputProps={{ "aria-label": "Monitoring enabled" }}
            />
          }
          label={mutating ? "Saving…" : writable ? "Enable monitoring" : "Not writable"}
        />
        <Typography variant="body2" sx={monitoringMutedTextSx}>
          {helper}
        </Typography>
      </Box>
      {mutateError ? (
        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
          {mutateError}
        </Typography>
      ) : null}
      {status?.settings_available === false ? (
        <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
          Installation settings unavailable — status may be incomplete (not necessarily OFF).
        </Typography>
      ) : null}
    </Paper>
  );
}

/**
 * Shared Application Monitoring page body (Phase 1–7).
 * @param {{ BaseUrl: import('axios').AxiosInstance, buttonColor?: string, disableRootPaper?: boolean, fillAvailableHeight?: boolean }} props
 */
export default function ApplicationMonitoringPage({
  BaseUrl,
  buttonColor = "#1E75BB",
  disableRootPaper = false,
  /** When false, root sizes to content so a parent overflow:auto panel can scroll (e.g. basic Settings). */
  fillAvailableHeight = true,
}) {
  const api = useMemo(() => createMonitoringApi(BaseUrl), [BaseUrl]);
  const mountedRef = useRef(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [status, setStatus] = useState(null);
  const [connectivity, setConnectivity] = useState(null);
  const [issues, setIssues] = useState(null);
  const [resources, setResources] = useState(null);
  const [opsOverview, setOpsOverview] = useState(null);

  const [sectionErrors, setSectionErrors] = useState({});
  const [globalDisabled, setGlobalDisabled] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [statusMutating, setStatusMutating] = useState(false);
  const [statusMutateError, setStatusMutateError] = useState(null);

  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadAll = useCallback(
    async ({ soft = false } = {}) => {
      if (!mountedRef.current) return;
      if (soft) setRefreshing(true);
      else setLoading(true);

      const issueParams = { limit: 100, offset: 0 };
      if (statusFilter) issueParams.status = statusFilter;
      if (severityFilter) issueParams.severity = severityFilter;

      const calls = [
        api.getStatus(),
        api.getConnectivity(),
        api.getIssues(issueParams),
        api.getResources(),
      ];
      if (typeof api.getOpsOverview === "function") {
        calls.push(api.getOpsOverview());
      }
      const results = await Promise.allSettled(calls);

      if (!mountedRef.current) return;

      const keys = ["status", "connectivity", "issues", "resources"];
      if (typeof api.getOpsOverview === "function") keys.push("opsOverview");
      const setters = {
        status: setStatus,
        connectivity: setConnectivity,
        issues: setIssues,
        resources: setResources,
        opsOverview: setOpsOverview,
      };

      const nextErrors = {};
      let disabled = false;
      let unauth = false;

      results.forEach((result, index) => {
        const key = keys[index];
        const { data, error } = settledValue(result);
        if (error) {
          if (key !== "status" && isMonitoringDisabledError(error)) disabled = true;
          const parsed = getMonitoringErrorDetail(error);
          if (parsed.status === 401 || parsed.status === 403) unauth = true;
          nextErrors[key] = parsed.detail;
          setters[key](null);
        } else {
          setters[key](data);
          if (key === "status" && data && data.enabled === false) {
            disabled = true;
          }
        }
      });

      setSectionErrors(nextErrors);
      setGlobalDisabled(disabled);
      setUnauthorized(unauth);
      setLoading(false);
      setRefreshing(false);
    },
    [api, severityFilter, statusFilter]
  );

  const handleMonitoringToggle = useCallback(
    async (nextEnabled) => {
      if (statusMutating) return;
      setStatusMutating(true);
      setStatusMutateError(null);
      try {
        const resp = await api.setStatus(nextEnabled);
        if (!mountedRef.current) return;
        setStatus(resp.data);
        await loadAll({ soft: true });
      } catch (error) {
        if (!mountedRef.current) return;
        const parsed = getMonitoringErrorDetail(error);
        setStatusMutateError(parsed.detail || "Failed to update monitoring status.");
        try {
          const refresh = await api.getStatus();
          if (mountedRef.current) setStatus(refresh.data);
        } catch {
          /* keep prior status */
        }
      } finally {
        if (mountedRef.current) setStatusMutating(false);
      }
    },
    [api, loadAll, statusMutating]
  );

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const id = setInterval(() => {
      loadAll({ soft: true });
    }, AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [autoRefresh, loadAll]);

  const monitoringOff =
    globalDisabled || status?.enabled === false || status?.monitoring_enabled === false;

  const rootSx = {
    display: "flex",
    flexDirection: "column",
    ...(fillAvailableHeight
      ? { flex: 1, minHeight: 0 }
      : {
          flex: "0 0 auto",
          minHeight: "auto",
          height: "auto",
          overflow: "visible",
          pb: 2,
        }),
    width: "100%",
    maxWidth: "none",
    boxSizing: "border-box",
    ...(disableRootPaper
      ? { p: 0, m: 0, bgcolor: "transparent", boxShadow: "none" }
      : {
          p: { xs: 2, md: 2.5 },
          m: 0,
          borderRadius: 2,
          bgcolor: "#ffffff",
          color: "#111827",
          boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
        }),
    // Keep bottom padding after disableRootPaper's `p: 0` so the last section isn't clipped.
    ...(!fillAvailableHeight ? { pb: 2 } : {}),
  };

  const Root = disableRootPaper ? Box : Paper;
  const rootProps = disableRootPaper ? { sx: rootSx } : { elevation: 0, sx: rootSx };

  return (
    <Root {...rootProps}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <MonitorHeartIcon sx={{ fontSize: 32, color: buttonColor }} />
          <Typography
            variant="h4"
            sx={{
              fontWeight: "bold",
              fontSize: { xs: "14px", sm: "16px", md: "18px" },
              color: "#111827",
              backgroundColor: "transparent",
            }}
          >
            Application Monitoring
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          <FormControlLabel
            sx={{ color: "#111827", "& .MuiFormControlLabel-label": { color: "#111827" } }}
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                color="primary"
              />
            }
            label="Auto refresh (30s)"
          />
          <Button
            variant="contained"
            onClick={() => loadAll({ soft: true })}
            disabled={loading || refreshing}
            startIcon={
              refreshing || loading ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <RefreshIcon />
              )
            }
            sx={{
              backgroundColor: buttonColor,
              color: "#fff",
              textTransform: "none",
              "&:hover": { backgroundColor: darken(buttonColor, 0.12) },
            }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {monitoringOff && !unauthorized && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Application Monitoring is currently OFF. Processors, Issues, and Resources may be
          unavailable until Monitoring is enabled.
        </Alert>
      )}

      {unauthorized && (
        <Alert severity="error" sx={{ mb: 3 }}>
          You are not authorized to view Application Monitoring.
        </Alert>
      )}

      {!unauthorized && (
        <>
          <Section title="Live State">
            <LiveStateOpsPanel
              overview={opsOverview}
              loading={loading && !opsOverview}
              error={sectionErrors.opsOverview}
            />
          </Section>

          <Section title="Monitoring status">
            <MonitoringStatusControl
              status={status}
              loading={loading && !status}
              error={sectionErrors.status}
              mutating={statusMutating}
              mutateError={statusMutateError}
              onToggle={handleMonitoringToggle}
            />
          </Section>

          <Section title="Processors">
            <ProcessorTable
              connectivity={connectivity}
              loading={loading && !connectivity}
              error={sectionErrors.connectivity}
            />
          </Section>

          <Section title="Application Issues">
            <IssuesPanel
              issuesPayload={issues}
              loading={loading && !issues}
              error={sectionErrors.issues}
              statusFilter={statusFilter}
              severityFilter={severityFilter}
              onStatusFilterChange={setStatusFilter}
              onSeverityFilterChange={setSeverityFilter}
            />
          </Section>

          <Section title="Resource Usage" sx={!fillAvailableHeight ? { mb: 0, pb: 1 } : undefined}>
            <ResourceUsagePanel
              resources={resources}
              loading={loading && !resources}
              error={sectionErrors.resources}
            />
          </Section>
        </>
      )}
    </Root>
  );
}

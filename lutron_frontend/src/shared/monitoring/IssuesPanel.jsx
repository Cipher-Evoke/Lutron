import React, { useMemo } from "react";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Typography from "@mui/material/Typography";
import StatusBadge from "./StatusBadge";
import { formatMonitoringTimestamp } from "./monitoringFormatters";
import {
  monitoringBodyTextSx,
  monitoringMutedTextSx,
  monitoringSectionPaperSx,
  monitoringSubTitleSx,
} from "./monitoringUiStyles";

function displayValue(value) {
  if (value == null || value === "") return "—";
  return String(value);
}

function formatRecoveryDuration(durationMs) {
  if (durationMs == null || Number.isNaN(Number(durationMs))) return null;
  const ms = Number(durationMs);
  if (ms >= 1000) {
    const seconds = ms / 1000;
    const text = Number.isInteger(seconds) ? String(seconds) : seconds.toFixed(1);
    return `${text}s`;
  }
  return `${ms} ms`;
}

function recoveryResultLabel(result) {
  if (result == null) return "In progress";
  return String(result);
}

function IssueField({ label, value, show = true }) {
  if (!show) return null;
  return (
    <Box sx={{ mb: 0.75 }}>
      <Typography
        variant="caption"
        sx={{ ...monitoringMutedTextSx, fontWeight: 600, textTransform: "uppercase" }}
      >
        {label}
      </Typography>
      <Typography variant="body2" sx={{ ...monitoringBodyTextSx, mt: 0.25, wordBreak: "break-word" }}>
        {displayValue(value)}
      </Typography>
    </Box>
  );
}

function whereLabel(issue) {
  if (issue?.processor?.id != null) return `Processor #${issue.processor.id}`;
  if (issue?.component?.code) {
    return issue.component.name
      ? `${issue.component.name} (${issue.component.code})`
      : issue.component.code;
  }
  if (issue?.source?.id) return String(issue.source.id);
  return null;
}

function IssueCard({ issue }) {
  const status = String(issue.status || "unknown").toLowerCase();
  const isOpen = status === "open";
  const isAck = status === "acknowledged";
  const recovery = issue.recovery || {};
  const error = issue.error || {};
  const hasRecovery = recovery.attempted === true;
  const hasFileLine =
    error.file != null || error.line != null || error.function != null || error.traceback != null;

  return (
    <Paper
      elevation={0}
      sx={{
        ...monitoringSectionPaperSx,
        borderColor: isOpen || isAck ? "#fca5a5" : "#e5e7eb",
        bgcolor: isOpen || isAck ? "#fffafa" : "#ffffff",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 1,
          mb: 1.5,
        }}
      >
        <StatusBadge
          label={issue.status || "unknown"}
          tone={isOpen ? "error" : isAck ? "warning" : "neutral"}
        />
        <StatusBadge label={issue.severity || "info"} />
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#111827", ml: { sm: 0.5 } }}>
          {displayValue(issue.title || issue.message)}
        </Typography>
      </Box>

      <IssueField
        label="Detected"
        value={formatMonitoringTimestamp(issue.timestamps?.detected_at)}
      />
      <IssueField label="What happened" value={issue.title || issue.message} />
      <IssueField
        label="Why / details"
        value={
          issue.message &&
          issue.title &&
          String(issue.message) !== String(issue.title)
            ? issue.message
            : null
        }
      />
      <IssueField label="Source" value={issue.source?.type} />
      <IssueField label="Where" value={whereLabel(issue)} />
      <IssueField label="Error type" value={error.type} />
      <IssueField label="Error message" value={error.message} />
      <IssueField label="File" value={error.file} show={error.file != null} />
      <IssueField label="Line" value={error.line} show={error.line != null} />
      <IssueField label="Function" value={error.function} show={error.function != null} />
      {hasFileLine && error.traceback != null ? (
        <IssueField label="Traceback" value={error.traceback} />
      ) : null}
      {issue.job?.job_key ? (
        <IssueField
          label="Job"
          value={
            issue.job.display_name
              ? `${issue.job.display_name} (${issue.job.job_key})`
              : issue.job.job_key
          }
        />
      ) : null}
      {issue.job?.latest_run?.error_class ? (
        <IssueField
          label="Job error"
          value={
            issue.job.latest_run.error_message
              ? `${issue.job.latest_run.error_class}: ${issue.job.latest_run.error_message}`
              : issue.job.latest_run.error_class
          }
        />
      ) : null}
      {hasRecovery ? (
        <>
          <Typography
            variant="caption"
            sx={{
              ...monitoringMutedTextSx,
              fontWeight: 600,
              textTransform: "uppercase",
              display: "block",
              mt: 0.5,
              mb: 0.5,
            }}
          >
            Recovery
          </Typography>
          <IssueField label="Attempted" value="Yes" />
          <IssueField label="Result" value={recoveryResultLabel(recovery.result)} />
          <IssueField
            label="Duration"
            value={formatRecoveryDuration(recovery.duration_ms)}
            show={recovery.duration_ms != null}
          />
        </>
      ) : null}
      <IssueField
        label="Resolved"
        value={
          issue.timestamps?.resolved_at
            ? formatMonitoringTimestamp(issue.timestamps.resolved_at)
            : "—"
        }
      />
    </Paper>
  );
}

function IssueGroup({ title, issues }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" sx={monitoringSubTitleSx}>
        {title} ({issues.length})
      </Typography>
      {!issues.length ? (
        <Typography variant="body2" sx={monitoringMutedTextSx}>
          No {title.toLowerCase()} issues.
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </Box>
      )}
    </Box>
  );
}

/**
 * Application Issues panel — consumes canonical GET /monitoring/issues DTO.
 * Does not classify source/type in the frontend.
 */
function IssuesPanel({
  issuesPayload,
  loading,
  error,
  statusFilter,
  severityFilter,
  onStatusFilterChange,
  onSeverityFilterChange,
}) {
  const items = useMemo(() => issuesPayload?.items || [], [issuesPayload]);

  const { openIssues, acknowledgedIssues, resolvedIssues } = useMemo(() => {
    const open = [];
    const acknowledged = [];
    const resolved = [];
    items.forEach((item) => {
      const status = String(item.status || "").toLowerCase();
      if (status === "resolved") resolved.push(item);
      else if (status === "acknowledged") acknowledged.push(item);
      else open.push(item);
    });
    return {
      openIssues: open,
      acknowledgedIssues: acknowledged,
      resolvedIssues: resolved,
    };
  }, [items]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="mon-issue-status-label">Status</InputLabel>
          <Select
            labelId="mon-issue-status-label"
            label="Status"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="open">Open</MenuItem>
            <MenuItem value="acknowledged">Acknowledged</MenuItem>
            <MenuItem value="resolved">Resolved</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="mon-issue-severity-label">Severity</InputLabel>
          <Select
            labelId="mon-issue-severity-label"
            label="Severity"
            value={severityFilter}
            onChange={(e) => onSeverityFilterChange(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="critical">Critical</MenuItem>
            <MenuItem value="warning">Warning</MenuItem>
            <MenuItem value="info">Info</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error ? (
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      ) : loading ? (
        <Typography variant="body2" sx={monitoringBodyTextSx}>
          Loading application issues…
        </Typography>
      ) : !items.length ? (
        <Typography variant="body2" sx={monitoringMutedTextSx}>
          No application issues match the current filters.
        </Typography>
      ) : (
        <>
          {(statusFilter === "" || statusFilter === "open") && (
            <IssueGroup title="OPEN" issues={openIssues} />
          )}
          {(statusFilter === "" || statusFilter === "acknowledged") && (
            <IssueGroup title="ACKNOWLEDGED" issues={acknowledgedIssues} />
          )}
          {(statusFilter === "" || statusFilter === "resolved") && (
            <IssueGroup title="RESOLVED" issues={resolvedIssues} />
          )}
        </>
      )}
    </Box>
  );
}

export default React.memo(IssuesPanel);

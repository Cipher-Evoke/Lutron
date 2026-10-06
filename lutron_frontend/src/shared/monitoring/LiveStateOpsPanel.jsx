import React, { useMemo } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import StatusBadge from "./StatusBadge";
import {
  formatDurationMs,
  formatMonitoringTimestamp,
} from "./monitoringFormatters";
import {
  monitoringBodyTextSx,
  monitoringMutedTextSx,
  monitoringSectionPaperSx,
  monitoringSubTitleSx,
} from "./monitoringUiStyles";

function formatAgeS(value) {
  if (value == null || value === "") return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  if (n < 60) return `${Math.round(n)}s`;
  if (n < 3600) return `${Math.floor(n / 60)}m ${Math.round(n % 60)}s`;
  return `${Math.floor(n / 3600)}h ${Math.floor((n % 3600) / 60)}m`;
}

function healthTone(health) {
  const v = String(health || "").toLowerCase();
  if (v === "healthy") return "success";
  if (v === "warning") return "warning";
  if (v === "critical") return "error";
  return "neutral";
}

function Metric({ label, value, tone }) {
  return (
    <Box sx={{ minWidth: 140, flex: "1 1 140px" }}>
      <Typography variant="caption" sx={{ ...monitoringMutedTextSx, display: "block" }}>
        {label}
      </Typography>
      {tone ? (
        <StatusBadge label={value} tone={tone} />
      ) : (
        <Typography variant="body2" sx={{ ...monitoringBodyTextSx, fontWeight: 600 }}>
          {value == null || value === "" ? "—" : String(value)}
        </Typography>
      )}
    </Box>
  );
}

function DurationTrend({ values }) {
  const nums = (values || []).map((v) => Number(v)).filter((n) => Number.isFinite(n) && n >= 0);
  if (!nums.length) {
    return (
      <Typography variant="body2" sx={monitoringMutedTextSx}>
        No snapshot duration history yet.
      </Typography>
    );
  }
  const max = Math.max(...nums, 1);
  return (
    <Box sx={{ display: "flex", alignItems: "flex-end", gap: 0.5, height: 48, mt: 0.5 }}>
      {nums.map((n, idx) => (
        <Box
          key={`${idx}-${n}`}
          title={`${formatDurationMs(n)}`}
          sx={{
            width: 10,
            height: `${Math.max(8, Math.round((n / max) * 48))}px`,
            bgcolor: n > 15000 ? "#f59e0b" : "#2563eb",
            borderRadius: 0.5,
          }}
        />
      ))}
    </Box>
  );
}

function LiveStateOpsPanel({ overview, loading, error }) {
  const snapshot = overview?.snapshot;
  const bootstrap = overview?.bootstrap;
  const processors = overview?.processors;
  const gapfill = overview?.gapfill;
  const runtime = overview?.runtime;
  const database = overview?.database;
  const rows = useMemo(() => processors?.processors || [], [processors]);

  if (error) {
    return (
      <Alert severity="error">Live State unavailable: {error}</Alert>
    );
  }

  if (loading && !overview) {
    return (
      <Paper elevation={0} sx={monitoringSectionPaperSx}>
        <Typography variant="body2" sx={monitoringBodyTextSx}>
          Loading live-state diagnostics…
        </Typography>
      </Paper>
    );
  }

  const mapped = bootstrap?.mapped_zones;
  const expected = bootstrap?.expected_zones;
  const bootstrapLabel =
    mapped != null && expected != null ? `${mapped}/${expected}` : "—";
  const bootstrapTone = bootstrap?.complete ? "success" : "error";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Paper elevation={0} sx={monitoringSectionPaperSx}>
        <Typography variant="subtitle1" sx={monitoringSubTitleSx}>
          Snapshot
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <Metric
            label="Last successful"
            value={formatMonitoringTimestamp(snapshot?.last_successful_snapshot)}
          />
          <Metric
            label="Next expected"
            value={formatMonitoringTimestamp(snapshot?.next_expected_snapshot)}
          />
          <Metric
            label="Rows"
            value={snapshot?.last_snapshot_rows}
          />
          <Metric
            label="Average duration"
            value={formatDurationMs(snapshot?.average_duration_ms)}
          />
          <Metric
            label="Max duration"
            value={formatDurationMs(snapshot?.maximum_duration_ms)}
          />
          <Metric
            label="Missed"
            value={snapshot?.missed_snapshots ?? 0}
            tone={snapshot?.missed_snapshots > 0 ? "error" : "success"}
          />
          <Metric
            label="Status"
            value={snapshot?.running ? "RUNNING" : snapshot?.delayed ? "DELAYED" : "IDLE"}
            tone={snapshot?.running ? "warning" : snapshot?.delayed ? "error" : "success"}
          />
        </Box>
        <Typography variant="caption" sx={{ ...monitoringMutedTextSx, display: "block", mt: 1.5 }}>
          Duration trend (last {snapshot?.duration_trend_ms?.length || 0} successful)
        </Typography>
        <DurationTrend values={snapshot?.duration_trend_ms} />
      </Paper>

      <Paper elevation={0} sx={monitoringSectionPaperSx}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
          <Typography variant="subtitle1" sx={{ ...monitoringSubTitleSx, mb: 0 }}>
            Bootstrap
          </Typography>
          <StatusBadge label={bootstrapLabel} tone={bootstrapTone} />
          <StatusBadge
            label={bootstrap?.complete ? "Complete" : "Incomplete"}
            tone={bootstrapTone}
          />
        </Box>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <Metric label="Completeness" value={bootstrap?.completeness_pct == null ? "—" : `${bootstrap.completeness_pct}%`} />
          <Metric label="Missing" value={bootstrap?.missing_zones ?? 0} />
          <Metric label="Orphans" value={bootstrap?.orphans ?? 0} tone={bootstrap?.orphans > 0 ? "warning" : "success"} />
        </Box>
      </Paper>

      <Paper elevation={0} sx={monitoringSectionPaperSx}>
        <Typography variant="subtitle1" sx={monitoringSubTitleSx}>
          Processors (event age)
        </Typography>
        <Typography variant="body2" sx={{ ...monitoringMutedTextSx, mb: 1.5 }}>
          Healthy &lt; 15m · Warning 15–30m · Critical &gt; 30m. Separate from LEAP connectivity below.
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 1.5 }}>
          <Metric label="Healthy" value={processors?.healthy_count ?? 0} tone="success" />
          <Metric label="Warning" value={processors?.warning_count ?? 0} tone={processors?.warning_count ? "warning" : "neutral"} />
          <Metric label="Critical" value={processors?.stale_count ?? 0} tone={processors?.stale_count ? "error" : "success"} />
        </Box>
        {rows.length === 0 ? (
          <Typography variant="body2" sx={monitoringMutedTextSx}>
            No processor live-state rows yet.
          </Typography>
        ) : (
          rows.map((row) => (
            <Box
              key={row.processor_id}
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1.5,
                py: 1,
                borderTop: "1px solid #e5e7eb",
                alignItems: "center",
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 700, color: "#111827", minWidth: 120 }}>
                Processor #{row.processor_id}
              </Typography>
              <StatusBadge label={row.health || "—"} tone={healthTone(row.health)} />
              <Typography variant="body2" sx={monitoringBodyTextSx}>
                Zones {row.czs ?? "—"}/{row.db_zones ?? "—"}
              </Typography>
              <Typography variant="body2" sx={monitoringBodyTextSx}>
                Zone {formatAgeS(row.zone_event_age_s)}
              </Typography>
              <Typography variant="body2" sx={monitoringBodyTextSx}>
                Area {formatAgeS(row.area_event_age_s)}
              </Typography>
              <Typography variant="body2" sx={monitoringMutedTextSx}>
                Packet {formatAgeS(row.packet_age_s)}
              </Typography>
            </Box>
          ))
        )}
      </Paper>

      <Paper elevation={0} sx={monitoringSectionPaperSx}>
        <Typography variant="subtitle1" sx={monitoringSubTitleSx}>
          Gap-fill
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <Metric
            label="Status"
            value={gapfill?.running ? "RUNNING" : (gapfill?.status || "idle")}
            tone={gapfill?.overlap_with_snapshot ? "error" : gapfill?.running ? "warning" : "success"}
          />
          <Metric label="Checkpoint" value={formatMonitoringTimestamp(gapfill?.last_checkpoint)} />
          <Metric label="Last run" value={formatMonitoringTimestamp(gapfill?.last_gapfill_at)} />
          <Metric label="Rows repaired" value={gapfill?.rows_repaired ?? 0} />
          <Metric label="Duration" value={formatDurationMs(gapfill?.duration_ms)} />
          <Metric
            label="Backlog"
            value={gapfill?.backlog_hours == null ? "—" : `${gapfill.backlog_hours}h`}
            tone={gapfill?.backlog_hours >= 2 ? "warning" : "success"}
          />
          <Metric label="Deferred (snapshot busy)" value={gapfill?.deferred_count ?? 0} />
          <Metric
            label="Overlap with snapshot"
            value={gapfill?.overlap_with_snapshot ? "Yes" : "No"}
            tone={gapfill?.overlap_with_snapshot ? "error" : "success"}
          />
        </Box>
      </Paper>

      <Paper elevation={0} sx={monitoringSectionPaperSx}>
        <Typography variant="subtitle1" sx={monitoringSubTitleSx}>
          Runtime
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <Metric label="Listener" value={runtime?.listener?.status || runtime?.process_health?.listener} />
          <Metric label="Listener uptime" value={formatAgeS(runtime?.listener?.uptime_s)} />
          <Metric label="Energy logger" value={runtime?.process_health?.energy_logger} />
          <Metric label="Snapshot job" value={runtime?.snapshot?.job_running ? "RUNNING" : "idle"} />
          <Metric label="Gap-fill job" value={runtime?.gapfill?.job_running ? "RUNNING" : "idle"} />
          <Metric label="Load controller" value={runtime?.loadcontroller?.status || runtime?.process_health?.loadcontroller} />
          <Metric label="Backend RAM" value={runtime?.backend?.ram_mb == null ? "—" : `${runtime.backend.ram_mb} MB`} />
          <Metric
            label="Backend CPU"
            value={runtime?.backend?.cpu_percent == null ? "—" : `${Number(runtime.backend.cpu_percent).toFixed(1)}%`}
          />
          <Metric
            label="Scheduler"
            value={`${runtime?.scheduler?.queue_depth ?? 0} active · ${(runtime?.scheduler?.active_jobs || []).join(", ") || "none"}`}
          />
          <Metric label="Monitoring queue" value={runtime?.monitoring?.queue_length} />
        </Box>
      </Paper>

      <Paper elevation={0} sx={monitoringSectionPaperSx}>
        <Typography variant="subtitle1" sx={monitoringSubTitleSx}>
          Database
        </Typography>
        {database?.alert_snapshot_tx_long ? (
          <Alert severity="warning" sx={{ mb: 1.5 }}>
            Snapshot transaction is longer than the 60s expected runtime.
          </Alert>
        ) : null}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <Metric label="Connections" value={database?.connection_count} />
          <Metric
            label="Logger txn"
            value={database?.active_logger_transaction ? "Yes" : "No"}
            tone={database?.active_logger_transaction ? "warning" : "success"}
          />
          <Metric
            label="Gap-fill txn"
            value={database?.active_gapfill_transaction ? "Yes" : "No"}
          />
          <Metric
            label="Snapshot txn age"
            value={formatAgeS(database?.snapshot_transaction_age_s)}
            tone={database?.alert_snapshot_tx_long ? "error" : "success"}
          />
          <Metric
            label="Gap-fill txn age"
            value={formatAgeS(database?.gapfill_transaction_age_s)}
            tone={database?.alert_gapfill_tx_long ? "error" : "success"}
          />
          <Metric label="Longest session" value={formatAgeS(database?.longest_transaction_age_s)} />
          <Metric
            label="Blocked queries"
            value={database?.blocked_queries ?? 0}
            tone={database?.blocked_queries > 0 ? "warning" : "success"}
          />
        </Box>
      </Paper>
    </Box>
  );
}

export default React.memo(LiveStateOpsPanel);

import React from "react";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import StatusBadge from "./StatusBadge";
import { boolLabel } from "./monitoringFormatters";
import {
  monitoringBodyTextSx,
  monitoringMutedTextSx,
  monitoringSectionPaperSx,
} from "./monitoringUiStyles";

function MetricCard({ title, children }) {
  return (
    <Paper elevation={0} sx={{ ...monitoringSectionPaperSx, height: "100%" }}>
      <Typography variant="caption" sx={{ ...monitoringMutedTextSx, fontWeight: 600 }}>
        {title}
      </Typography>
      <Box sx={{ mt: 1, color: "#111827" }}>{children}</Box>
    </Paper>
  );
}

function OverviewCards({ summary, loading }) {
  const pipeline = summary?.pipeline || {};
  const componentCounts = summary?.component_counts || {};
  const jobSummary = summary?.job_summary || {};

  const monitoringStatus = summary?.monitoring_enabled ? "Enabled" : "Disabled";
  const pipelineStatus = pipeline.health_status || (pipeline.running ? "up" : "down");

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <MetricCard title="Monitoring Status">
          {loading ? (
            <Typography variant="body2" sx={monitoringBodyTextSx}>
              Loading…
            </Typography>
          ) : (
            <StatusBadge label={monitoringStatus} />
          )}
        </MetricCard>
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <MetricCard title="Pipeline Status">
          {loading ? (
            <Typography variant="body2" sx={monitoringBodyTextSx}>
              Loading…
            </Typography>
          ) : (
            <StatusBadge label={pipelineStatus} />
          )}
        </MetricCard>
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <MetricCard title="Worker State">
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#111827" }}>
            {loading ? "…" : pipeline.worker_state || "—"}
          </Typography>
        </MetricCard>
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <MetricCard title="Queue Length">
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#111827" }}>
            {loading ? "…" : pipeline.queue_length ?? "—"}
          </Typography>
        </MetricCard>
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <MetricCard title="Active Alerts">
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#111827" }}>
            {loading ? "…" : summary?.active_alert_count ?? 0}
          </Typography>
        </MetricCard>
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <MetricCard title="Registered Components">
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#111827" }}>
            {loading
              ? "…"
              : componentCounts.registered ?? componentCounts.total ?? "—"}
          </Typography>
        </MetricCard>
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <MetricCard title="Registered Jobs">
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#111827" }}>
            {loading ? "…" : jobSummary.definitions ?? "—"}
          </Typography>
        </MetricCard>
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <MetricCard title="Pipeline Running">
          {loading ? (
            <Typography variant="body2" sx={monitoringBodyTextSx}>
              Loading…
            </Typography>
          ) : (
            <StatusBadge label={boolLabel(pipeline.running)} />
          )}
        </MetricCard>
      </Grid>
    </Grid>
  );
}

export default React.memo(OverviewCards);

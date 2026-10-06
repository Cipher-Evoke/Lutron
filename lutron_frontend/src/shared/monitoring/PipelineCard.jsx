import React from "react";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import StatusBadge from "./StatusBadge";
import { boolLabel, formatMonitoringTimestamp } from "./monitoringFormatters";
import {
  monitoringBodyTextSx,
  monitoringMutedTextSx,
  monitoringSectionPaperSx,
} from "./monitoringUiStyles";

function Field({ label, children }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="caption" sx={{ ...monitoringMutedTextSx, fontWeight: 600 }}>
        {label}
      </Typography>
      <Box sx={{ mt: 0.5, color: "#111827" }}>{children}</Box>
    </Box>
  );
}

function PipelineCard({ pipeline, loading, error }) {
  const data = pipeline || {};

  return (
    <Paper elevation={0} sx={monitoringSectionPaperSx}>
      {error ? (
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      ) : loading ? (
        <Typography variant="body2" sx={monitoringBodyTextSx}>
          Loading pipeline…
        </Typography>
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Field label="Running">
              <StatusBadge label={boolLabel(data.running)} />
            </Field>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Field label="Health Status">
              <StatusBadge label={data.health_status || "unknown"} />
            </Field>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Field label="Queue Length">
              <Typography variant="body1" sx={{ fontWeight: 600, color: "#111827" }}>
                {data.queue_length ?? "—"}
              </Typography>
            </Field>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Field label="Max Queue">
              <Typography variant="body1" sx={{ fontWeight: 600, color: "#111827" }}>
                {data.max_queue ?? "—"}
              </Typography>
            </Field>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Field label="Worker State">
              <Typography variant="body1" sx={{ fontWeight: 600, color: "#111827" }}>
                {data.worker_state || "—"}
              </Typography>
            </Field>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Field label="Dropped Events">
              <Typography variant="body1" sx={{ fontWeight: 600, color: "#111827" }}>
                {data.dropped_events ?? "—"}
              </Typography>
            </Field>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Field label="Last Success">
              <Typography variant="body2" sx={monitoringBodyTextSx}>
                {formatMonitoringTimestamp(data.last_success_at)}
              </Typography>
            </Field>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Field label="Last Error">
              <Typography
                variant="body2"
                sx={{ color: data.last_error ? "#b91c1c" : "#111827" }}
              >
                {data.last_error || "—"}
              </Typography>
            </Field>
          </Grid>
        </Grid>
      )}
    </Paper>
  );
}

export default React.memo(PipelineCard);

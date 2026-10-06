import React, { useMemo } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import StatusBadge from "./StatusBadge";
import { formatMonitoringTimestamp } from "./monitoringFormatters";
import {
  monitoringBodyTextSx,
  monitoringMutedTextSx,
  monitoringSectionPaperSx,
  monitoringSubTitleSx,
  monitoringTableCellSx,
  monitoringTableContainerSx,
  monitoringTableHeadCellSx,
} from "./monitoringUiStyles";

function SubTitle({ children }) {
  return (
    <Typography variant="subtitle2" sx={monitoringSubTitleSx}>
      {children}
    </Typography>
  );
}

function RuntimePanel({
  supervisor,
  restartCounts,
  restarts,
  events,
  abandoned,
  loading,
  errors,
}) {
  const restartRows = useMemo(() => restarts?.restarts || [], [restarts]);
  const eventRows = useMemo(() => events?.events || [], [events]);
  const abandonedRows = useMemo(() => abandoned?.abandoned || [], [abandoned]);
  const totals = restartCounts?.totals || {};
  const byChild = restartCounts?.by_child || {};

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box>
        <SubTitle>Supervisor Status</SubTitle>
        {errors?.supervisor ? (
          <Typography color="error" variant="body2">
            {errors.supervisor}
          </Typography>
        ) : loading ? (
          <Typography variant="body2">Loading supervisor…</Typography>
        ) : (
          <Paper elevation={0} sx={monitoringSectionPaperSx}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ ...monitoringMutedTextSx, fontWeight: 600 }}>
                  Monitoring Enabled
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <StatusBadge
                    label={supervisor?.monitoring_enabled ? "Enabled" : "Disabled"}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ ...monitoringMutedTextSx, fontWeight: 600 }}>
                  Bridge
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5, ...monitoringBodyTextSx }}>
                  {supervisor?.bridge
                    ? JSON.stringify(supervisor.bridge)
                    : "Not attached"}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" sx={{ ...monitoringMutedTextSx, fontWeight: 600 }}>
                  Supervisor Snapshot
                </Typography>
                <Typography
                  variant="body2"
                  component="pre"
                  sx={{
                    mt: 0.5,
                    m: 0,
                    p: 1.5,
                    bgcolor: "#f9fafb",
                    color: "#111827",
                    borderRadius: 1,
                    overflow: "auto",
                    maxHeight: 220,
                    fontFamily: "monospace",
                    fontSize: 12,
                  }}
                >
                  {supervisor?.supervisor
                    ? JSON.stringify(supervisor.supervisor, null, 2)
                    : "No live supervisor snapshot"}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        )}
      </Box>

      <Box>
        <SubTitle>Restart Counts</SubTitle>
        {errors?.restartCounts ? (
          <Typography color="error" variant="body2">
            {errors.restartCounts}
          </Typography>
        ) : loading ? (
          <Typography variant="body2">Loading restart counts…</Typography>
        ) : (
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Paper elevation={0} sx={monitoringSectionPaperSx}>
                <Typography variant="caption" sx={{ ...monitoringMutedTextSx, fontWeight: 600 }}>
                  Restart Succeeded
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#111827" }}>
                  {restartCounts?.restart_succeeded ?? 0}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper elevation={0} sx={monitoringSectionPaperSx}>
                <Typography variant="caption" sx={{ ...monitoringMutedTextSx, fontWeight: 600 }}>
                  Restart Failed
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#111827" }}>
                  {restartCounts?.restart_failed ?? 0}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper elevation={0} sx={monitoringSectionPaperSx}>
                <Typography variant="caption" sx={{ ...monitoringMutedTextSx, fontWeight: 600 }}>
                  Abandoned
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#111827" }}>
                  {restartCounts?.abandoned ?? 0}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" sx={monitoringMutedTextSx}>
                Totals:{" "}
                {Object.keys(totals).length
                  ? Object.entries(totals)
                      .map(([k, v]) => `${k}=${v}`)
                      .join(", ")
                  : "none"}
              </Typography>
              <Typography variant="body2" sx={{ ...monitoringMutedTextSx, mt: 0.5 }}>
                By child:{" "}
                {Object.keys(byChild).length
                  ? Object.entries(byChild)
                      .map(([child, counts]) => `${child}(${Object.entries(counts).map(([k, v]) => `${k}:${v}`).join("|")})`)
                      .join("; ")
                  : "none"}
              </Typography>
            </Grid>
          </Grid>
        )}
      </Box>

      <Box>
        <SubTitle>Restart History</SubTitle>
        {errors?.restarts ? (
          <Typography color="error" variant="body2">
            {errors.restarts}
          </Typography>
        ) : loading ? (
          <Typography variant="body2">Loading restart history…</Typography>
        ) : !restartRows.length ? (
          <Typography variant="body2" sx={monitoringMutedTextSx}>
            No restart history.
          </Typography>
        ) : (
          <EventTable rows={restartRows} />
        )}
      </Box>

      <Box>
        <SubTitle>Recent Runtime Events</SubTitle>
        {errors?.events ? (
          <Typography color="error" variant="body2">
            {errors.events}
          </Typography>
        ) : loading ? (
          <Typography variant="body2">Loading runtime events…</Typography>
        ) : !eventRows.length ? (
          <Typography variant="body2" sx={monitoringMutedTextSx}>
            No runtime events.
          </Typography>
        ) : (
          <EventTable rows={eventRows} />
        )}
      </Box>

      <Box>
        <SubTitle>Abandoned Processes</SubTitle>
        {errors?.abandoned ? (
          <Typography color="error" variant="body2">
            {errors.abandoned}
          </Typography>
        ) : loading ? (
          <Typography variant="body2">Loading abandoned processes…</Typography>
        ) : !abandonedRows.length ? (
          <Typography variant="body2" sx={monitoringMutedTextSx}>
            No abandoned processes.
          </Typography>
        ) : (
          <EventTable rows={abandonedRows} />
        )}
      </Box>
    </Box>
  );
}

function EventTable({ rows }) {
  return (
    <TableContainer component={Paper} elevation={0} sx={monitoringTableContainerSx}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={monitoringTableHeadCellSx}>Time</TableCell>
            <TableCell sx={monitoringTableHeadCellSx}>Type</TableCell>
            <TableCell sx={monitoringTableHeadCellSx}>Severity</TableCell>
            <TableCell sx={monitoringTableHeadCellSx}>Component</TableCell>
            <TableCell sx={monitoringTableHeadCellSx}>Child</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} hover>
              <TableCell sx={monitoringTableCellSx}>
                {formatMonitoringTimestamp(row.event_at)}
              </TableCell>
              <TableCell sx={monitoringTableCellSx}>{row.event_type || "—"}</TableCell>
              <TableCell sx={monitoringTableCellSx}>
                <StatusBadge label={row.severity || "info"} />
              </TableCell>
              <TableCell sx={monitoringTableCellSx}>
                {row.component_code || row.component_id || "—"}
              </TableCell>
              <TableCell sx={monitoringTableCellSx}>{row.child_name || "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default React.memo(RuntimePanel);

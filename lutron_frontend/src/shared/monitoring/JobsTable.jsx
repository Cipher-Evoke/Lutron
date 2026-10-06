import React, { useMemo } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import StatusBadge from "./StatusBadge";
import { formatDurationMs, formatMonitoringTimestamp } from "./monitoringFormatters";
import {
  monitoringBodyTextSx,
  monitoringJobChipSx,
  monitoringMutedTextSx,
  monitoringSectionPaperSx,
  monitoringSubTitleSx,
  monitoringTableCellSx,
  monitoringTableContainerSx,
  monitoringTableHeadCellSx,
} from "./monitoringUiStyles";

function JobsTable({ jobsPayload, loading, error }) {
  const definitions = useMemo(() => jobsPayload?.definitions || [], [jobsPayload]);
  const recentRuns = useMemo(() => jobsPayload?.recent_runs || [], [jobsPayload]);

  if (error) {
    return (
      <Typography color="error" variant="body2">
        {error}
      </Typography>
    );
  }
  if (loading) {
    return (
      <Typography variant="body2" sx={monitoringBodyTextSx}>
        Loading jobs…
      </Typography>
    );
  }

  return (
    <Paper elevation={0} sx={monitoringSectionPaperSx}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        <Box>
          <Typography variant="subtitle2" sx={monitoringSubTitleSx}>
            Registered Jobs
          </Typography>
          {!definitions.length ? (
            <Typography variant="body2" sx={monitoringMutedTextSx}>
              No registered jobs.
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.25 }}>
              {definitions.map((job) => (
                <Chip
                  key={job.job_key}
                  label={`${job.display_name || job.job_key}${job.is_active === false ? " (inactive)" : ""}`}
                  size="small"
                  color="default"
                  variant="filled"
                  sx={monitoringJobChipSx}
                />
              ))}
            </Box>
          )}
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={monitoringSubTitleSx}>
            Recent Executions
          </Typography>
          {!recentRuns.length ? (
            <Typography variant="body2" sx={monitoringMutedTextSx}>
              No recent job executions.
            </Typography>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={monitoringTableContainerSx}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={monitoringTableHeadCellSx}>Job</TableCell>
                    <TableCell sx={monitoringTableHeadCellSx}>Outcome</TableCell>
                    <TableCell sx={monitoringTableHeadCellSx}>Duration</TableCell>
                    <TableCell sx={monitoringTableHeadCellSx}>Started</TableCell>
                    <TableCell sx={monitoringTableHeadCellSx}>Finished</TableCell>
                    <TableCell sx={monitoringTableHeadCellSx}>Trigger Source</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentRuns.map((run) => (
                    <TableRow key={run.id} hover>
                      <TableCell sx={monitoringTableCellSx}>
                        {run.display_name || run.job_key || "—"}
                      </TableCell>
                      <TableCell sx={monitoringTableCellSx}>
                        <StatusBadge label={run.outcome || "unknown"} />
                      </TableCell>
                      <TableCell sx={monitoringTableCellSx}>
                        {formatDurationMs(run.duration_ms)}
                      </TableCell>
                      <TableCell sx={monitoringTableCellSx}>
                        {formatMonitoringTimestamp(run.started_at)}
                      </TableCell>
                      <TableCell sx={monitoringTableCellSx}>
                        {formatMonitoringTimestamp(run.finished_at)}
                      </TableCell>
                      <TableCell sx={monitoringTableCellSx}>
                        {run.trigger_source || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Box>
    </Paper>
  );
}

export default React.memo(JobsTable);

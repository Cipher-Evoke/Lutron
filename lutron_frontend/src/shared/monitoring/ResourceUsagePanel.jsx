import React, { useMemo } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import StatusBadge from "./StatusBadge";
import {
  monitoringBodyTextSx,
  monitoringMutedTextSx,
  monitoringSectionPaperSx,
} from "./monitoringUiStyles";

const DISPLAY_NAMES = {
  api: "API",
  listener: "Listener",
  energy_logger: "Energy Logger",
  loadcontroller_listener: "Load Controller",
};

function displayName(name) {
  if (!name) return "—";
  return DISPLAY_NAMES[name] || String(name);
}

function formatRamMb(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  const n = Number(value);
  return `${Number.isInteger(n) ? n : n.toFixed(1)} MB`;
}

function formatRamPercent(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  const n = Number(value);
  return `${n.toFixed(1)}%`;
}

function statusTone(status) {
  const s = String(status || "").toUpperCase();
  if (s === "RUNNING") return "success";
  if (s === "STOPPED" || s === "NOT_FOUND") return "error";
  return "neutral";
}

/**
 * Resource Usage panel — consumes GET /monitoring/resources.
 * No local polling; refreshed by ApplicationMonitoringPage.
 */
function ResourceUsagePanel({ resources, loading, error }) {
  const processes = useMemo(() => {
    const rows = resources?.processes;
    if (!Array.isArray(rows)) return [];
    return rows.filter((row) => {
      const name = String(row?.name || "").toLowerCase();
      return name !== "scheduler";
    });
  }, [resources]);

  if (error) {
    return (
      <Typography color="error" variant="body2">
        {error}
      </Typography>
    );
  }

  if (loading && !resources) {
    return (
      <Typography variant="body2" sx={monitoringBodyTextSx}>
        Loading resource usage…
      </Typography>
    );
  }

  if (!resources || resources.available === false) {
    return (
      <Paper elevation={0} sx={monitoringSectionPaperSx}>
        <Typography variant="body2" sx={monitoringMutedTextSx}>
          Resource information unavailable
          {resources?.reason ? `: ${resources.reason}` : "."}
        </Typography>
      </Paper>
    );
  }

  if (!processes.length) {
    return (
      <Typography variant="body2" sx={monitoringMutedTextSx}>
        No process resource data yet.
      </Typography>
    );
  }

  return (
    <Paper elevation={0} sx={{ ...monitoringSectionPaperSx, overflowX: "auto" }}>
      {resources.reason ? (
        <Typography variant="body2" sx={{ ...monitoringMutedTextSx, mb: 1.5 }}>
          {resources.reason}
        </Typography>
      ) : null}
      <Table size="small" aria-label="Resource usage">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 700 }}>Process</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
            <TableCell align="right" sx={{ fontWeight: 700 }}>
              PID
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 700 }}>
              RAM
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 700 }}>
              RAM %
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {processes.map((row) => {
            const status = String(row.status || "UNKNOWN").toUpperCase();
            return (
              <TableRow key={String(row.name || `pid-${row.pid}`)}>
                <TableCell>
                  <Typography variant="body2" sx={{ ...monitoringBodyTextSx, fontWeight: 600 }}>
                    {displayName(row.name)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <StatusBadge label={status} tone={statusTone(status)} />
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" sx={monitoringBodyTextSx}>
                    {row.pid != null ? String(row.pid) : "—"}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" sx={monitoringBodyTextSx}>
                    {formatRamMb(row.ram_mb)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" sx={monitoringBodyTextSx}>
                    {formatRamPercent(row.ram_percent)}
                  </Typography>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {resources.host?.total_ram_mb != null ? (
        <Box sx={{ mt: 1.5 }}>
          <Typography variant="caption" sx={monitoringMutedTextSx}>
            Host total RAM: {formatRamMb(resources.host.total_ram_mb)}
          </Typography>
        </Box>
      ) : null}
    </Paper>
  );
}

export default React.memo(ResourceUsagePanel);

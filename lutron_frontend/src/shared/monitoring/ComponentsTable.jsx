import React, { useMemo } from "react";
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
  monitoringTableCellSx,
  monitoringTableContainerSx,
  monitoringTableHeadCellSx,
} from "./monitoringUiStyles";

function ComponentsTable({ healthPayload, loading, error }) {
  const rows = useMemo(() => {
    const health = healthPayload?.health || [];
    const components = healthPayload?.components || [];
    const metaById = new Map(components.map((c) => [String(c.id), c]));
    return health.map((row) => {
      const meta = metaById.get(String(row.component_id));
      return {
        key: row.component_id || row.component_code,
        name: row.component_code || meta?.code || row.component_id || "—",
        type: meta?.kind || "—",
        status: row.status || "unknown",
        lastHeartbeat: row.last_heartbeat_at,
        updated: row.updated_at,
        details:
          row.detail == null
            ? "—"
            : typeof row.detail === "string"
              ? row.detail
              : JSON.stringify(row.detail),
      };
    });
  }, [healthPayload]);

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
        Loading components…
      </Typography>
    );
  }

  if (!rows.length) {
    return (
      <Typography variant="body2" sx={monitoringMutedTextSx}>
        No component health data yet.
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper} elevation={0} sx={monitoringTableContainerSx}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={monitoringTableHeadCellSx}>Component</TableCell>
            <TableCell sx={monitoringTableHeadCellSx}>Type</TableCell>
            <TableCell sx={monitoringTableHeadCellSx}>Status</TableCell>
            <TableCell sx={monitoringTableHeadCellSx}>Last Heartbeat</TableCell>
            <TableCell sx={monitoringTableHeadCellSx}>Updated</TableCell>
            <TableCell sx={monitoringTableHeadCellSx}>Details</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.key} hover>
              <TableCell sx={monitoringTableCellSx}>{row.name}</TableCell>
              <TableCell sx={monitoringTableCellSx}>{row.type}</TableCell>
              <TableCell sx={monitoringTableCellSx}>
                <StatusBadge label={row.status} />
              </TableCell>
              <TableCell sx={monitoringTableCellSx}>
                {formatMonitoringTimestamp(row.lastHeartbeat)}
              </TableCell>
              <TableCell sx={monitoringTableCellSx}>
                {formatMonitoringTimestamp(row.updated)}
              </TableCell>
              <TableCell
                sx={{
                  ...monitoringTableCellSx,
                  maxWidth: 280,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={row.details}
              >
                {row.details}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default React.memo(ComponentsTable);

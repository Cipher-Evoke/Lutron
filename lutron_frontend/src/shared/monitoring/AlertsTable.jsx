import React, { useMemo } from "react";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
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
  monitoringMutedTextSx,
  monitoringTableCellSx,
  monitoringTableContainerSx,
  monitoringTableHeadCellSx,
} from "./monitoringUiStyles";

function AlertsTable({
  alertsPayload,
  loading,
  error,
  statusFilter,
  severityFilter,
  onStatusFilterChange,
  onSeverityFilterChange,
}) {
  const items = useMemo(() => alertsPayload?.items || [], [alertsPayload]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="mon-alert-status-label">Status</InputLabel>
          <Select
            labelId="mon-alert-status-label"
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
          <InputLabel id="mon-alert-severity-label">Severity</InputLabel>
          <Select
            labelId="mon-alert-severity-label"
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
        <Typography variant="body2" sx={{ color: "#111827" }}>
          Loading alerts…
        </Typography>
      ) : !items.length ? (
        <Typography variant="body2" sx={monitoringMutedTextSx}>
          No alerts match the current filters.
        </Typography>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={monitoringTableContainerSx}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={monitoringTableHeadCellSx}>Severity</TableCell>
                <TableCell sx={monitoringTableHeadCellSx}>Status</TableCell>
                <TableCell sx={monitoringTableHeadCellSx}>Component</TableCell>
                <TableCell sx={monitoringTableHeadCellSx}>Message</TableCell>
                <TableCell sx={monitoringTableHeadCellSx}>Opened</TableCell>
                <TableCell sx={monitoringTableHeadCellSx}>Acknowledged</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={monitoringTableCellSx}>
                    <StatusBadge label={row.severity || "info"} />
                  </TableCell>
                  <TableCell sx={monitoringTableCellSx}>
                    <StatusBadge label={row.status || "unknown"} />
                  </TableCell>
                  <TableCell sx={monitoringTableCellSx}>{row.component_id || "—"}</TableCell>
                  <TableCell
                    sx={{
                      ...monitoringTableCellSx,
                      maxWidth: 360,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    title={row.message || row.title || ""}
                  >
                    {row.message || row.title || "—"}
                  </TableCell>
                  <TableCell sx={monitoringTableCellSx}>
                    {formatMonitoringTimestamp(row.opened_at)}
                  </TableCell>
                  <TableCell sx={monitoringTableCellSx}>
                    {formatMonitoringTimestamp(row.acknowledged_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

export default React.memo(AlertsTable);

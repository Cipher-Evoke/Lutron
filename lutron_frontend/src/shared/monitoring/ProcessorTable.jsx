import React, { useMemo } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import StatusBadge from "./StatusBadge";
import { formatMonitoringTimestamp } from "./monitoringFormatters";
import {
  monitoringBodyTextSx,
  monitoringMutedTextSx,
  monitoringSectionPaperSx,
} from "./monitoringUiStyles";

function detailText(detail, key) {
  if (!detail || typeof detail !== "object") return null;
  const value = detail[key];
  if (value == null || value === "") return null;
  return String(value);
}

function ProcessorRow({ row }) {
  const status = String(row.status || "unknown").toLowerCase();
  const isDown = status === "down";
  const isDegraded = status === "degraded";
  const reason = detailText(row.detail, "reason");
  const errorText = detailText(row.detail, "error");
  const leap = row.leap && typeof row.leap === "object" ? row.leap : null;
  const saturated = Boolean(leap?.saturated);
  const activeEst = leap?.active_estimated;
  const maxConn = leap?.max_connections;

  return (
    <Paper
      elevation={0}
      sx={{
        ...monitoringSectionPaperSx,
        borderColor: isDown
          ? "#fca5a5"
          : saturated || isDegraded
            ? "#fcd34d"
            : "#e5e7eb",
        bgcolor: isDown ? "#fffafa" : "#ffffff",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          mb: 1,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#111827" }}>
          Processor #{row.processor_id}
        </Typography>
        <StatusBadge
          label={row.status || "unknown"}
          tone={isDown ? "error" : isDegraded || saturated ? "warning" : undefined}
        />
      </Box>

      {isDown && (
        <Alert severity="error" sx={{ mb: 1.5, py: 0 }}>
          Processor problem — LEAP connectivity is down for this processor.
        </Alert>
      )}
      {saturated && !isDown && (
        <Alert severity="warning" sx={{ mb: 1.5, py: 0 }}>
          LEAP connection saturation — processor may have hit the max client limit (10).
        </Alert>
      )}

      {activeEst != null && maxConn != null ? (
        <Typography variant="body2" sx={{ ...monitoringBodyTextSx, mb: 0.5 }}>
          <Box component="span" sx={{ color: "#6b7280", fontWeight: 600 }}>
            LEAP slots (LMS estimate):{" "}
          </Box>
          {activeEst}/{maxConn}
        </Typography>
      ) : null}

      <Typography variant="body2" sx={{ ...monitoringBodyTextSx, mb: 0.5 }}>
        <Box component="span" sx={{ color: "#6b7280", fontWeight: 600 }}>
          Last OK:{" "}
        </Box>
        {formatMonitoringTimestamp(row.last_ok_at)}
      </Typography>
      <Typography variant="body2" sx={{ ...monitoringBodyTextSx, mb: 0.5 }}>
        <Box component="span" sx={{ color: "#6b7280", fontWeight: 600 }}>
          Last error:{" "}
        </Box>
        {formatMonitoringTimestamp(row.last_error_at)}
      </Typography>
      {(isDown || isDegraded || saturated) && reason ? (
        <Typography variant="body2" sx={{ ...monitoringBodyTextSx, mb: 0.5 }}>
          <Box component="span" sx={{ color: "#6b7280", fontWeight: 600 }}>
            Reason:{" "}
          </Box>
          {reason}
        </Typography>
      ) : null}
      {(isDown || isDegraded) && errorText ? (
        <Typography variant="body2" sx={monitoringBodyTextSx}>
          <Box component="span" sx={{ color: "#6b7280", fontWeight: 600 }}>
            Error:{" "}
          </Box>
          {errorText}
        </Typography>
      ) : null}
    </Paper>
  );
}

function ProcessorTable({ connectivity, loading, error }) {
  const rows = useMemo(() => connectivity?.processors || [], [connectivity]);

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
        Loading processors…
      </Typography>
    );
  }
  if (!rows.length) {
    return (
      <Typography variant="body2" sx={monitoringMutedTextSx}>
        No processor connectivity data yet.
      </Typography>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {rows.map((row) => (
        <ProcessorRow key={row.processor_id} row={row} />
      ))}
    </Box>
  );
}

export default React.memo(ProcessorTable);

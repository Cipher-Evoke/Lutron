import React from "react";
import Chip from "@mui/material/Chip";

const TONE = {
  success: { bg: "#dcfce7", color: "#166534", border: "#86efac" },
  error: { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5" },
  warning: { bg: "#fef3c7", color: "#92400e", border: "#fcd34d" },
  info: { bg: "#e0f2fe", color: "#075985", border: "#7dd3fc" },
  neutral: { bg: "#f3f4f6", color: "#374151", border: "#d1d5db" },
};

function resolveTone(raw) {
  const v = String(raw || "unknown").toLowerCase();
  if (["up", "success", "ok", "true", "enabled", "healthy", "yes"].includes(v)) {
    return "success";
  }
  if (["down", "failure", "failed", "error", "false", "disabled", "stopped", "no"].includes(v)) {
    return "error";
  }
  if (["degraded", "warning", "running", "partial"].includes(v)) {
    return "warning";
  }
  if (["unknown", "open", "info"].includes(v)) {
    return "info";
  }
  if (v === "acknowledged" || v === "resolved") return "neutral";
  return "neutral";
}

function StatusBadge({ label, tone, size = "small" }) {
  const text = label == null || label === "" ? "—" : String(label);
  const resolved = tone || resolveTone(text);
  const colors = TONE[resolved] || TONE.neutral;

  return (
    <Chip
      size={size}
      label={text}
      sx={{
        backgroundColor: `${colors.bg} !important`,
        color: `${colors.color} !important`,
        border: `1px solid ${colors.border}`,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.02em",
        "& .MuiChip-label": {
          color: `${colors.color} !important`,
        },
      }}
    />
  );
}

export default React.memo(StatusBadge);

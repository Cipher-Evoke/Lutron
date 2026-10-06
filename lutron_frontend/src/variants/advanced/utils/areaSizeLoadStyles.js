/** Theme-aware layout tokens for Settings → Area Size & Load. */

export const areaSizeText = "var(--settings-panel-text, #1c2330)";
export const areaSizeMuted = "var(--settings-panel-muted-text, rgba(28, 35, 48, 0.72))";
export const areaSizeBorder = "var(--users-border, #C5CDD8)";

/** Page shell: one viewport-bound column so only the table scrolls (no page scrollbar). */
export const areaSizePageShellSx = {
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
  // Leave room for Advanced topbar + Settings padding/footer so the window does not scroll.
  height: {
    xs: "calc(100dvh - 220px)",
    sm: "calc(100dvh - 210px)",
    md: "calc(100dvh - 200px)",
  },
  maxHeight: {
    xs: "calc(100dvh - 220px)",
    sm: "calc(100dvh - 210px)",
    md: "calc(100dvh - 200px)",
  },
  overflow: "hidden",
};

export const areaSizeTablePanelSx = {
  mt: 1,
  flex: 1,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  borderRadius: "12px",
  overflow: "hidden",
  backgroundColor: "var(--users-table-container-bg, #d6dde8)",
  border: `1px solid ${areaSizeBorder}`,
  boxShadow: "var(--premium-card-shadow, 0 8px 24px rgba(0, 0, 0, 0.12))",
};

export const areaSizeTableHeaderRowSx = {
  display: "flex",
  alignItems: "center",
  gap: 1,
  width: "100%",
  py: 1.5,
  px: 2,
  fontWeight: 600,
  fontSize: "0.875rem",
  color: areaSizeText,
  backgroundColor: "var(--users-table-head-bg, #d6dde8)",
  borderBottom: `1px solid ${areaSizeBorder}`,
  flexShrink: 0,
};

export const areaSizeTableScrollSx = {
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  overflowX: "auto",
};

export const areaSizeTotalRowSx = {
  display: "flex",
  alignItems: "center",
  gap: 1,
  width: "100%",
  py: 1.25,
  px: 2,
  fontWeight: 600,
  color: areaSizeText,
  backgroundColor: "var(--users-table-row-alt-bg, #f5f5f5)",
  borderBottom: `1px solid ${areaSizeBorder}`,
};

export const areaSizeDataRowSx = (level = 0) => ({
  display: "flex",
  alignItems: "center",
  gap: 1,
  width: "100%",
  py: 1,
  pr: 2,
  pl: 2 + level * 1.5,
  color: areaSizeText,
  borderBottom: `1px solid ${areaSizeBorder}`,
  fontSize: "0.875rem",
  transition: "background-color 150ms ease",
  "&:hover": {
    backgroundColor: "rgba(0, 0, 0, 0.03)",
  },
});

export const areaSizeColNameSx = {
  flex: "1 1 40%",
  minWidth: 140,
  wordWrap: "break-word",
  whiteSpace: "normal",
};

export const areaSizeColNumericSx = {
  flex: "0 0 18%",
  minWidth: 100,
  textAlign: "right",
};

export const areaSizeExpandSlotSx = {
  flex: "0 0 36px",
  display: "flex",
  justifyContent: "flex-end",
};

export const areaSizeIconButtonSx = {
  color: "var(--app-button, #3d4a5c)",
  "&:hover": {
    backgroundColor: "rgba(0, 0, 0, 0.06)",
  },
};

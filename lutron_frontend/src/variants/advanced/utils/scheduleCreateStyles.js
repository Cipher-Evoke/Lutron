/** Theme-aware layout tokens for Schedule Create / Edit (AddEvent, ScheduleDetails). */

export const schedulePanelBg = "var(--schedule-panel-bg, #d6dde8)";
export const schedulePanelBorder = "var(--schedule-panel-border, #b8c5d6)";
export const scheduleSectionBg = "var(--schedule-section-bg, #4a586c)";
export const scheduleSectionText = "var(--schedule-section-text, #ffffff)";
export const schedulePanelLabel = "var(--schedule-panel-label, #1a2a42)";
export const scheduleInputBg = "var(--schedule-select-bg, #fff)";
export const scheduleRowBorder =
  "var(--premium-border-subtle, var(--schedule-panel-border, rgba(0, 0, 0, 0.12)))";

export const scheduleCardShell = {
  border: "var(--premium-card-border, 1px solid var(--schedule-panel-border, #b8c5d6))",
  borderRadius: "var(--premium-radius-lg, 16px)",
  boxShadow: "var(--premium-card-shadow, 0 8px 24px rgba(0, 0, 0, 0.12))",
};

export const scheduleSectionStyle = {
  background: scheduleSectionBg,
  padding: 10,
  borderRadius: "var(--premium-radius-md, 8px)",
};

export const scheduleFormCardPadding = (isLargeScreen, isDesktop) =>
  isLargeScreen ? 20 : isDesktop ? 18 : 16;

export const scheduleFormCardStyle = (isLargeScreen, isDesktop) => ({
  background: schedulePanelBg,
  padding: scheduleFormCardPadding(isLargeScreen, isDesktop),
  ...scheduleCardShell,
});

export const scheduleTextInputStyle = (isLargeScreen, isDesktop, color) => ({
  width: "100%",
  padding: isLargeScreen ? 14 : isDesktop ? 13 : 12,
  borderRadius: 8,
  border: `1px solid ${schedulePanelBorder}`,
  background: scheduleInputBg,
  color: color || "var(--app-button)",
  fontSize: isLargeScreen ? 16 : isDesktop ? 15 : 14,
  outline: "none",
  boxSizing: "border-box",
});

export const scheduleTimeInputStyle = (color) => ({
  width: 60,
  padding: 8,
  borderRadius: 6,
  border: `1px solid ${schedulePanelBorder}`,
  textAlign: "center",
  background: scheduleInputBg,
  color: color || "var(--app-button)",
});

export const scheduleDayButtonStyle = (selected, buttonColor) => ({
  padding: "6px 12px",
  borderRadius: 8,
  border: `1px solid ${schedulePanelBorder}`,
  background: selected ? buttonColor || "var(--app-button)" : scheduleInputBg,
  color: selected ? "#fff" : buttonColor || "var(--app-button)",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 600,
  minWidth: 44,
  transition: "background 150ms ease, color 150ms ease",
});

export const scheduleRightPanelStyle = (isLargeScreen, isDesktop) => ({
  flex: 1,
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-start",
  height: "100%",
  overflow: "hidden",
  maxWidth: isLargeScreen ? 800 : isDesktop ? 700 : 600,
  background: schedulePanelBg,
  ...scheduleCardShell,
  padding: isLargeScreen ? 24 : isDesktop ? 22 : 20,
  boxSizing: "border-box",
});

export const scheduleRightListScrollStyle = {
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  overflowX: "hidden",
};

export const scheduleRightHeaderStyle = (isLargeScreen, isDesktop) => ({
  display: "flex",
  alignItems: "center",
  fontWeight: 600,
  color: schedulePanelLabel,
  borderBottom: `1px solid ${scheduleRowBorder}`,
  paddingBottom: isLargeScreen ? 12 : isDesktop ? 10 : 8,
  marginBottom: isLargeScreen ? 12 : isDesktop ? 10 : 8,
  fontSize: isLargeScreen ? 15 : isDesktop ? 14 : 13,
  flexShrink: 0,
});

export const scheduleLocationRowStyle = (isLongName) => ({
  display: "flex",
  alignItems: isLongName ? "flex-start" : "center",
  borderBottom: `1px solid ${scheduleRowBorder}`,
  padding: "10px 0",
  minHeight: isLongName ? 56 : 44,
});

export const scheduleLocationTextStyle = {
  fontSize: 15,
  color: schedulePanelLabel,
  textAlign: "left",
};

export const scheduleHeaderLinkStyle = {
  flex: 2,
  cursor: "pointer",
  textAlign: "left",
  minWidth: 120,
  color: schedulePanelLabel,
};

export const schedulePrimaryButtonStyle = (
  isLargeScreen,
  isDesktop,
  { disabled = false } = {}
) => ({
  padding: isLargeScreen ? "12px 32px" : isDesktop ? "11px 30px" : "10px 28px",
  borderRadius: 8,
  border: "none",
  background: disabled ? schedulePanelBorder : "var(--app-button)",
  color: "#fff",
  fontWeight: 600,
  fontSize: isLargeScreen ? 16 : isDesktop ? 15 : 14,
  cursor: disabled ? "not-allowed" : "pointer",
  boxShadow: disabled
    ? "none"
    : "var(--premium-button-shadow, 0 2px 8px rgba(0, 0, 0, 0.15))",
});

export const scheduleSmallActionButtonStyle = (buttonColor) => ({
  color: "#fff",
  padding: "6px 12px",
  borderRadius: 8,
  border: `1px solid ${schedulePanelBorder}`,
  background: buttonColor || "var(--app-button)",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 600,
  alignSelf: "flex-start",
});

export const scheduleAnnualAddButtonStyle = (buttonColor) => ({
  marginLeft: 4,
  width: 24,
  height: 24,
  borderRadius: "50%",
  border: `1px solid ${schedulePanelBorder}`,
  background: scheduleInputBg,
  color: buttonColor || "var(--app-button)",
  fontWeight: 700,
  fontSize: 16,
  padding: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
});

export const scheduleAnnualChipRemoveStyle = {
  marginLeft: 6,
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 13,
  color: "#fff",
  background: scheduleSectionBg,
  borderRadius: "50%",
  width: 16,
  height: 16,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

/** Keeps page action buttons visible above the app footer while scrolling. */
export const SCHEDULE_FIXED_ACTION_BAR_BOTTOM = "52px";

export const schedulePageWithFixedActionBarStyle = (
  isLargeScreen,
  isDesktop,
  isTablet = false
) => ({
  paddingBottom: 88,
  paddingRight: isLargeScreen ? 440 : isDesktop ? 400 : isTablet ? 360 : 320,
  boxSizing: "border-box",
  marginLeft: 0,
  marginRight: "auto",
});

export const scheduleFixedActionBarStyle = (
  isLargeScreen,
  isDesktop,
  isTablet = false
) => ({
  position: "fixed",
  bottom: SCHEDULE_FIXED_ACTION_BAR_BOTTOM,
  left: 0,
  right: 0,
  zIndex: 900,
  display: "flex",
  justifyContent: "flex-end",
  gap: isLargeScreen ? 20 : isDesktop ? 18 : 16,
  flexWrap: isTablet ? "wrap" : "nowrap",
  paddingTop: 12,
  paddingBottom: 12,
  paddingLeft: isLargeScreen ? 48 : isDesktop ? 40 : isTablet ? 32 : 24,
  paddingRight: isLargeScreen ? 48 : isDesktop ? 40 : isTablet ? 32 : 24,
  background: "transparent",
});

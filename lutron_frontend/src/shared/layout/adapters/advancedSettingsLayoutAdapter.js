/** Advanced variant settings layout adapter — Phase 5.2 */

export const advancedSettingsLayoutAdapter = {
  variant: "advanced",
  showContentHeader: false,
  headingInSidebar: true,
  filterSidebarItems: (items) =>
    (items || []).filter(
      (item) =>
        item?.label &&
        item?.path &&
        item.label !== "Manage Sensors" &&
        item.label !== "Manage Modules"
    ),
  getRootGridSx: () => ({
    ml: { xs: 0, sm: 0.5, md: "18px" },
    p: { xs: 0.5, sm: 1, md: "18px" },
    alignItems: "flex-start",
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    boxSizing: "border-box",
  }),
  getHeadingSx: (ctx) =>
    ctx.useThemedSidebarChrome && ctx.settingsSidebarHeadingSx
      ? { mb: { xs: 0.8, sm: 1, md: 1.5, lg: 2 }, ...ctx.settingsSidebarHeadingSx(true) }
      : {
          mb: { xs: 0.8, sm: 1, md: 1.5, lg: 2 },
          color: ctx.theme?.palette?.text?.secondary,
          ...(ctx.settingsSidebarHeadingSx
            ? ctx.settingsSidebarHeadingSx(false)
            : { fontSize: 24, fontWeight: 600 }),
        },
  getSidebarGridSx: (ctx) => ({
    md: 3,
    contentMd: 9,
    order: { xs: 1, md: 1 },
    p: { xs: 0.3, sm: 0.5, md: 1, lg: 1.5 },
    ...(typeof ctx.settingsSidebarColumnDividerSx === "function"
      ? ctx.settingsSidebarColumnDividerSx(
          ctx.isDefaultWhiteTheme,
          ctx.settingsSidebarMdUp
        )
      : {}),
    borderRight: { xs: "none", md: "none" },
    position: { xs: "static", md: "sticky" },
    top: { xs: "auto", md: "20px" },
    alignSelf: "flex-start",
  }),
  getContentOuterSx: (ctx) => ({
    order: { xs: 2, md: 2 },
    alignSelf: { xs: "stretch", md: "flex-start" },
    width: "100%",
    backgroundColor: ctx.hasActiveUserThemeBackgroundImage
      ? "transparent"
      : ctx.useThemedSidebarChrome
        ? "var(--settings-panel-outer-bg, #f5e8bc)"
        : ctx.isDefaultWhiteTheme
          ? "#ffffff"
          : ctx.contentColor,
    border: ctx.useThemedSidebarChrome
      ? "1px solid var(--settings-panel-border, rgba(74, 67, 52, 0.28))"
      : undefined,
    p: { xs: 1, sm: 1.5, md: 2, lg: 3 },
    borderTopRightRadius: "10px",
    borderBottomRightRadius: "10px",
  }),
  getContentInnerSx: () => ({
    backgroundColor: "var(--settings-panel-inner-bg, #fff)",
    borderRadius: { xs: "4px", sm: "6px", md: "8px", lg: "10px" },
    p: { xs: 0.5, sm: 0.8, md: 1.2, lg: 1.5 },
    width: "100%",
    flex: "0 1 auto",
    minHeight: 0,
    maxHeight: { xs: "none", md: "calc(100dvh - 280px)" },
    display: "flex",
    flexDirection: "column",
    overflowX: "hidden",
    overflowY: { xs: "visible", md: "auto" },
    minWidth: 0,
    maxWidth: "100%",
    boxSizing: "border-box",
  }),
  getSidebarClassName: () => "settings-sidebar-column",
};

export default advancedSettingsLayoutAdapter;

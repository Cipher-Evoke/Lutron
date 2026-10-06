// src/components/TopbarComponent.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  Menu,
  MenuItem,
  IconButton,
  CircularProgress,
  useMediaQuery,
  Avatar,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import LockResetIcon from "@mui/icons-material/LockReset";
import { useNavigate, useLocation, Link as RouterLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  buildAppPageBackground,
  resolveApplicationNavbarBackground,
} from "../utils/themePageBackground";
import { ADVANCED_VIEWPORT_GUTTER_PX } from "../utils/advancedViewportGutters";
import { isTopbarNavItemActive, isSettingsAppRoute } from "../utils/topbarNavActive";
import { resolveHomeUploadUrl } from "../../../shared/utils/resolveMediaUrl";
import SharedSidebar from "../../../shared/layout/app/SharedSidebar";
import { useSidebarDrawer } from "../../../shared/layout/app/useSidebarDrawer";
import {
  getRovingTabIndex,
  handleRovingTablistKeyDown,
} from "../utils/rovingTablistKeyboard";
import {
  focusPageSubNav,
  registerTopbarNavFocusHandler,
  requestSettingsSidebarFocus,
} from "../utils/pageSubNavBridge";
import { isKeyboardNavBlockedTarget } from "../utils/keyboardNavUtils";
import {
  fetchProfile,
  logout,
  selectProfile,
  selectProfileLoading,
  selectLogoutLoading,
  getValidToken,
} from "../redux/slice/auth/userlogin";
import { getLutronDataClient, homeDataClient } from "../redux/slice/home/homeSlice";
import { fetchApplicationTheme, selectApplicationTheme } from "../redux/slice/theme/themeSlice";
import {
  dispatchFetchApplicationThemeOnce,
  dispatchFetchClientOnce,
  dispatchFetchProfileOnce,
} from "../../../shared/utils/bootstrapFetchGuards";
import {
  readUiVariantRaw,
  restoreUiVariantAfterStorageClear,
} from "../../../utils/uiVariant";
import {
  snapshotAllVariantWidgetVisibilityForLogout,
  restoreAllVariantWidgetVisibilityAfterStorageClear,
} from "../../../shared/dashboard/utils/widgetVisibilityLogoutPreserve";
import {
  snapshotShadesSettingsForLogout,
  restoreShadesSettingsAfterStorageClear,
} from "../utils/shadesWidgetSettings";
import { ADVANCED_SETTINGS_HOME_PATH } from "../utils/advancedSettingsPaths";

export default function TopbarComponent() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const profile = useSelector(selectProfile);
  const profileLoading = useSelector(selectProfileLoading);
  const logoutLoading = useSelector(selectLogoutLoading);
  const clientData = useSelector(homeDataClient);
  const appTheme = useSelector(selectApplicationTheme);

  const logoUrl = resolveHomeUploadUrl(clientData?.logo_image) || null;
  const clientLogoRefreshRef = useRef(false);

  useEffect(() => {
    // Only fetch theme if not already loaded (join SharedMainLayout in-flight)
    if (!appTheme || !appTheme.application_theme) {
      dispatchFetchApplicationThemeOnce(dispatch, fetchApplicationTheme);
    }
  }, [dispatch, appTheme]);

  useEffect(() => {
    // Don't fetch profile if logout is in progress or if there's no valid token
    const validToken = getValidToken();
    if (!profile && !profileLoading && !logoutLoading && validToken) {
      dispatchFetchProfileOnce(dispatch, fetchProfile);
    }
  }, [dispatch, profile, profileLoading, logoutLoading]);


  useEffect(() => {
    // Only call this if user is authenticated and we don't have client data yet
    // Don't fetch during logout process
    const validToken = getValidToken();
    if (!validToken || !profile || logoutLoading) return;
    if (!clientData?.name) {
      dispatchFetchClientOnce(dispatch, getLutronDataClient).catch(() => {});
      return;
    }
    if (!clientData?.logo_image && !clientLogoRefreshRef.current) {
      clientLogoRefreshRef.current = true;
      dispatchFetchClientOnce(dispatch, getLutronDataClient, { force: true }).catch(() => {});
    }
  }, [dispatch, profile, clientData?.name, clientData?.logo_image, logoutLoading]);

  const roleFromProfile = profile?.role;
  const roleFromStorage = localStorage.getItem('role');
  const currentRole = roleFromProfile || roleFromStorage;
  // Determine settings path based on user role
  const getSettingsPath = () => ADVANCED_SETTINGS_HOME_PATH;

  const settingsPath = getSettingsPath(currentRole);

  const [anchorEl, setAnchorEl] = useState(null);
  const [menuWidth, setMenuWidth] = useState(0);
  const { drawerOpen, openDrawer, closeDrawer } = useSidebarDrawer();
  // Tablet and below → hamburger + drawer, hide center links
  const isMdDown = useMediaQuery(theme.breakpoints.down("md"));
  const displayName = profile?.name || profile?.email?.split('@')[0] || "User";

  const handleMenuToggle = (e) => {
    // If menu is already open, close it
    if (anchorEl) {
      setAnchorEl(null);
      return;
    }

    // If menu is closed, open it
    setAnchorEl(e.currentTarget);
    const width = e.currentTarget?.getBoundingClientRect?.().width;
    if (width && Number.isFinite(width)) {
      setMenuWidth(Math.ceil(width));
    }
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Handle clicking outside the menu
  const handleClickOutside = (event) => {
    // Don't close if clicking on a menu item or if menu is already closed
    if (!anchorEl || anchorEl.contains(event.target) || event.target.closest('[role="menuitem"]')) {
      return;
    }
    handleMenuClose();
  };

  // Handle clicking outside the logout menu and keyboard events
  useEffect(() => {
    if (anchorEl) {
      const handleKeyDown = (event) => {
        if (event.key === 'Escape') {
          handleMenuClose();
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [anchorEl]);

  const handleResetPassword = () => {
    handleMenuClose();
    navigate("/auth/change_password");
  };

  const handleLogout = async () => {
    if (logoutLoading) {
      return;
    }

    // Preserve all variant widget prefs across logout — clearing only restored
    // Advanced before, so Basic/Customized selections were wiped (and vice versa).
    const widgetVisibilitySnapshot = snapshotAllVariantWidgetVisibilityForLogout();
    const uiVariantRaw = readUiVariantRaw();
    const shadesSettingsSnapshot = snapshotShadesSettingsForLogout();

    try {
      // Get current valid token BEFORE clearing localStorage
      const currentToken = getValidToken();

      // Dispatch logout with token validation first
      if (currentToken) {
        await dispatch(logout()).unwrap();
      }

      // Clear local storage after successful logout API call
      localStorage.clear();
      restoreUiVariantAfterStorageClear(uiVariantRaw);
      restoreAllVariantWidgetVisibilityAfterStorageClear(widgetVisibilitySnapshot);
      restoreShadesSettingsAfterStorageClear(shadesSettingsSnapshot);
      sessionStorage.clear();

      // Navigate to login page
      navigate("/", { replace: true });
    } catch (error) {
      // Even if logout API fails, clear local state and redirect for security
      console.warn("Logout error:", error);
      localStorage.clear();
      restoreUiVariantAfterStorageClear(uiVariantRaw);
      restoreAllVariantWidgetVisibilityAfterStorageClear(widgetVisibilitySnapshot);
      restoreShadesSettingsAfterStorageClear(shadesSettingsSnapshot);
      sessionStorage.clear();
      navigate("/", { replace: true });
    }
  };

  const menuItems = [
    { label: "Dashboard", path: "/dashboard/overview" },
    { label: "Floorplan", path: "/heatmap" },
    { label: "Schedules", path: "/schedule" },
    { label: "Quick Controls", path: "/quickcontrols" },
    { label: "Activity Report", path: "/activity-report" },

    { label: "Settings", path: settingsPath },

    { label: "Help", path: "/get-help" },
  ];

  // Top navbar tabs — keyboard roving focus (no sliding pill on active tab)
  const navTabRefs = useRef({});

  const getActiveNavLabel = () => {
    for (const item of menuItems) {
      if (isTopbarNavItemActive(item, location.pathname, settingsPath)) {
        return item.label;
      }
    }
    return null;
  };

  const activeNavLabel = !isMdDown ? getActiveNavLabel() : null;
  const navItemKeys = menuItems.map((item) => item.label);

  const resolveNavLabelFromEvent = (event) => {
    const target = event?.currentTarget;
    if (target) {
      for (const item of menuItems) {
        const el = navTabRefs.current[item.label];
        if (el && (el === target || el.contains(target))) {
          return item.label;
        }
      }
    }
    return activeNavLabel;
  };

  const handleNavTabKeyDown = (event) => {
    const focusedLabel = resolveNavLabelFromEvent(event);

    if (event.key === "ArrowDown" && focusedLabel === "Dashboard") {
      event.preventDefault();
      event.stopPropagation();
      focusPageSubNav("dashboard", { tabKey: "energy" });
      return;
    }

    if (event.key === "ArrowDown" && focusedLabel === "Floorplan") {
      event.preventDefault();
      event.stopPropagation();
      focusPageSubNav("heatmap", { tabKey: "Light" });
      return;
    }

    if (event.key === "ArrowDown" && focusedLabel === "Settings") {
      event.preventDefault();
      event.stopPropagation();
      requestSettingsSidebarFocus("Home");
      return;
    }

    handleRovingTablistKeyDown(event, {
      itemKeys: navItemKeys,
      activeKey: focusedLabel || activeNavLabel,
      keyRefs: navTabRefs,
      orientation: "horizontal",
      onActivate: (label) => {
        const item = menuItems.find((entry) => entry.label === label);
        if (item) navigate(item.path);
      },
    });
  };

  useEffect(() => {
    if (isMdDown) return undefined;
    return registerTopbarNavFocusHandler((label) => {
      navTabRefs.current[label]?.focus({ preventScroll: true });
    });
  }, [isMdDown]);

  useEffect(() => {
    if (isMdDown) return undefined;

    const onKeyDown = (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      if (location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/heatmap')) return;
      if (isSettingsAppRoute(location.pathname, settingsPath)) return;
      if (isKeyboardNavBlockedTarget(event.target)) return;
      if (event.target?.closest?.('.topbar-main-nav, .nav-tab-btn, .heatmap-mode-tab-btn, .home-content-type-tabs, .settings-sidebar-nav-track')) {
        return;
      }
      if (!activeNavLabel) return;

      event.preventDefault();
      event.stopPropagation();
      handleRovingTablistKeyDown(
        { ...event, currentTarget: navTabRefs.current[activeNavLabel] },
        {
          itemKeys: navItemKeys,
          activeKey: activeNavLabel,
          keyRefs: navTabRefs,
          orientation: 'horizontal',
          onActivate: (label) => {
            const item = menuItems.find((entry) => entry.label === label);
            if (item) navigate(item.path);
          },
        }
      );
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [isMdDown, activeNavLabel, navItemKeys, location.pathname, menuItems, navigate, settingsPath]);

  return (
    <Box
      key={`topbar-${clientData?.name || "default"}`}
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10002,
        width: "100%",
        // Dynamic gradient — uses theme Background color (default: #6f809d)
        background: (() => {
          const bgColor = appTheme?.application_theme?.background || '#6f809d';
          return `var(--app-page-background, ${buildAppPageBackground(bgColor)})`;
        })(),
        backgroundAttachment: "fixed",
      }}
    >
      {/* Inner container with proper max width and padding */}
      <Box
        sx={{
          maxWidth: {
            xs: "100%",
            sm: "100%",
            md: "100%",
            lg: "100%",
            xl: "100%",
            xxl: "100%",
            "2xl": "100%",
            "3xl": "100%",
            "4xl": "100%",
            "5xl": "100%",
            "6xl": "100%"
          },
          mx: "auto",
          width: "100%",
          px: ADVANCED_VIEWPORT_GUTTER_PX,
        }}
      >
        <AppBar
          position="static"
          elevation={0}
          sx={{
            // Dynamic gradient — uses navbar color (dark when background is light)
            background: (() => {
              const themeColors = appTheme?.application_theme;
              return `${resolveApplicationNavbarBackground(
                themeColors?.background,
                themeColors?.content,
                themeColors?.button
              )} !important`;
            })(),
            boxShadow: "none",
            height: {
              xs: "60px",
              lg: "65px",
              xl: "68px",
              xxl: "70px",
              "2xl": "72px",
              "3xl": "75px",
              "4xl": "78px",
              "5xl": "80px",
              "6xl": "82px"
            },
            borderRadius: "10px",
            marginTop: "15px",
            overflow: "hidden",
          }}
        >
          <Toolbar
            disableGutters
            sx={{
              minHeight: {
                xs: "60px",
                lg: "65px",
                xl: "68px",
                xxl: "70px",
                "2xl": "72px",
                "3xl": "75px",
                "4xl": "78px",
                "5xl": "80px",
                "6xl": "82px"
              },
              height: {
                xs: "60px",
                lg: "65px",
                xl: "68px",
                xxl: "70px",
                "2xl": "72px",
                "3xl": "75px",
                "4xl": "78px",
                "5xl": "80px",
                "6xl": "82px"
              },
              px: 0,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              overflow: "hidden",
            }}
          >
            {/* Logo + hamburger (tablet) — left cluster */}
            <Box sx={{
              display: "flex",
              alignItems: "center",
              flex: isMdDown ? "0 0 auto" : 1,
              justifyContent: "flex-start",
              overflow: "hidden",
              minWidth: 0,
              maxWidth: { xs: 180, md: 280 },
              padding: "4px 8px",
              gap: 0.5,
            }}>
              {isMdDown && (
                <IconButton
                  edge="start"
                  color="inherit"
                  aria-label="menu"
                  onClick={openDrawer}
                  sx={{ flexShrink: 0 }}
                >
                  <MenuIcon />
                </IconButton>
              )}
              {logoUrl && (
                <RouterLink to="/lutron" style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", minWidth: 0, maxWidth: "100%", overflow: "hidden" }}>
                  <img
                    key={logoUrl}
                    src={logoUrl}
                    alt="Client Logo"
                    style={{
                      height: "36px",
                      width: "auto",
                      maxHeight: "36px",
                      maxWidth: "100%",
                      minWidth: 0,
                      objectFit: "contain",
                      objectPosition: "left center",
                      cursor: "pointer",
                      backgroundColor: "transparent",
                      display: "block",
                    }}
                  />
                </RouterLink>
              )}
            </Box>

            {/* Center menu - Desktop only, single line */}
            {!isMdDown && (
              <Box
                className="topbar-main-nav"
                role="tablist"
                aria-label="Main navigation"
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: { xs: 1, md: 2, lg: 3 }, // More consistent gap between tabs
                  flex: "0 1 auto",
                  minWidth: 0,
                  flexWrap: "nowrap",
                  overflowX: "visible",
                  whiteSpace: "nowrap",
                  position: "relative",
                  px: 1,
                }}
              >
                {menuItems.map((item) => {
                  const isActive = isTopbarNavItemActive(
                    item,
                    location.pathname,
                    settingsPath
                  );
                  return (
                    <Typography
                      key={item.label}
                      variant="body2"
                      component="div"
                      role="tab"
                      aria-selected={isActive}
                      tabIndex={getRovingTabIndex(isActive)}
                      className="topbar-nav-tab"
                      data-active={isActive ? "true" : "false"}
                      data-topbar-nav-label={item.label}
                      ref={(el) => { navTabRefs.current[item.label] = el; }}
                      onKeyDown={handleNavTabKeyDown}
                      sx={{
                        color: "var(--topbar-nav-inactive-text, #ffffff)",
                        fontWeight: isActive ? 600 : 500,
                        fontSize: {
                          xs: 11,
                          sm: 12,
                          md: 13,
                          lg: 14,
                          xl: 15,
                          xxl: 16,
                          "2xl": 17,
                          "3xl": 18,
                          "4xl": 19,
                          "5xl": 20,
                          "6xl": 21
                        },
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        position: "relative",
                        zIndex: 1,
                        "&::after": {
                          content: '""',
                          position: "absolute",
                          bottom: 6,
                          left: "50%",
                          transform: "translateX(-50%)",
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          backgroundColor: "var(--topbar-nav-inactive-text, #ffffff)",
                          opacity: isActive ? 1 : 0,
                          transition: "opacity 0.2s ease",
                          pointerEvents: "none",
                        },
                        "&:hover::after": { opacity: 1 },
                        transition: "color 0.8s ease",
                        outline: "none",
                        boxShadow: "none",
                        "&:focus": {
                          outline: "none",
                          boxShadow: "none",
                        },
                        "&:focus-visible": {
                          outline: "none",
                          boxShadow: "none",
                        },
                        px: {
                          xs: 0.5,
                          sm: 1,
                          md: 1.5,
                          lg: 2,
                          xl: 2.5,
                          xxl: 3,
                          "2xl": 3.5,
                          "3xl": 4,
                          "5xl": 4.5,
                          "6xl": 5
                        },
                        minWidth: "fit-content",
                        textAlign: "center",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        lineHeight: 1.2,
                        py: {
                          xs: 0.5,
                          sm: 1,
                          md: 1.5,
                          lg: 2,
                          xl: 2.5,
                          xxl: 3,
                          "2xl": 3.5,
                          "3xl": 4,
                          "5xl": 4.5,
                          "6xl": 5
                        }
                      }}
                      onClick={() => navigate(item.path)}
                    >
                      {item.label}
                    </Typography>
                  );
                })}
              </Box>
            )}

            {/* Mobile menu moved next to logo (tablet) */}

            {/* Right profile */}
            <Box sx={{
              display: "flex",
              alignItems: "center",
              flex: 1,
              justifyContent: "flex-end",
              overflow: "visible"
            }}>
              <Box
                className="topbar-profile-trigger"
                onClick={handleMenuToggle}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: {
                    xs: 0.5,
                    sm: 1,
                    md: 1.5,
                    lg: 2,
                    xl: 2.5,
                    xxl: 3,
                    "2xl": 3.5,
                    "3xl": 4,
                    "5xl": 4.5,
                    "6xl": 5
                  },
                  cursor: "pointer",
                  padding: {
                    xs: "3px 6px",
                    sm: "4px 8px",
                    md: "6px 12px",
                    lg: "8px 16px",
                    xl: "10px 20px",
                    xxl: "12px 24px",
                    "2xl": "14px 28px",
                    "3xl": "16px 32px",
                    "4xl": "18px 36px",
                    "5xl": "20px 40px",
                    "6xl": "22px 44px"
                  },
                  borderRadius: "6px",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                  },
                  minWidth: "fit-content",
                  maxWidth: "100%"
                }}
              >
                {profileLoading ? (
                  <CircularProgress
                    size={18}
                    color="inherit"
                  />
                ) : (
                  <>
                    <Avatar
                      sx={{
                        width: {
                          xs: 20,
                          sm: 22,
                          md: 24,
                          lg: 26,
                          xl: 28,
                          xxl: 30,
                          "2xl": 32,
                          "3xl": 34,
                          "4xl": 36,
                          "5xl": 38,
                          "6xl": 40
                        },
                        height: {
                          xs: 20,
                          sm: 22,
                          md: 24,
                          lg: 26,
                          xl: 28,
                          xxl: 30,
                          "2xl": 32,
                          "3xl": 34,
                          "4xl": 36,
                          "5xl": 38,
                          "6xl": 40
                        },
                        fontSize: {
                          xs: "10px",
                          sm: "11px",
                          md: "12px",
                          lg: "13px",
                          xl: "14px",
                          xxl: "15px",
                          "2xl": "16px",
                          "3xl": "17px",
                          "4xl": "18px",
                          "5xl": "19px",
                          "6xl": "20px"
                        },
                        backgroundColor: "rgba(255, 255, 255, 0.2)",
                        color: "var(--topbar-profile-trigger-text, var(--topbar-nav-inactive-text, #ffffff))",
                        flexShrink: 0
                      }}
                    >
                      {displayName.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "var(--topbar-profile-trigger-text, var(--topbar-nav-inactive-text, #ffffff))",
                        fontWeight: 500,
                        fontSize: {
                          xs: "10px",
                          sm: "11px",
                          md: "12px",
                          lg: "13px",
                          xl: "14px",
                          xxl: "15px",
                          "2xl": "16px",
                          "3xl": "17px",
                          "4xl": "18px",
                          "5xl": "19px",
                          "6xl": "20px"
                        },
                        whiteSpace: "nowrap",
                        flexShrink: 0
                      }}
                    >
                      {displayName}
                    </Typography>
                    <ArrowDropDownIcon
                      sx={{
                        color: theme.palette.text.secondary || "white",
                        fontSize: {
                          xs: "14px",
                          sm: "15px",
                          md: "16px",
                          lg: "17px",
                          xl: "18px",
                          xxl: "19px",
                          "2xl": "20px",
                          "3xl": "21px",
                          "4xl": "22px",
                          "5xl": "23px",
                          "6xl": "24px"
                        },
                        transition: "transform 0.2s ease",
                        transform: anchorEl ? "rotate(180deg)" : "rotate(0deg)",
                        flexShrink: 0
                      }}
                    />
                  </>
                )}
              </Box>

              <Menu
                className="topbar-profile-menu-root"
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                disableAutoFocus
                disableEnforceFocus
                slotProps={{
                  paper: {
                    className: "topbar-profile-menu",
                    elevation: 0,
                    sx: {
                      bgcolor: "var(--topbar-profile-menu-bg)",
                      color: "var(--topbar-profile-menu-text)",
                      borderRadius: "8px",
                      boxShadow: "var(--premium-card-shadow, 0 4px 12px rgba(0, 0, 0, 0.15))",
                      width: "max-content",
                      minWidth: `${Math.max(menuWidth || 0, 160)}px`,
                      maxWidth: "none",
                      mt: 0,
                      overflow: "hidden",
                      border: "1px solid var(--topbar-profile-menu-border)",
                      maxHeight: "none",
                      "&::-webkit-scrollbar": {
                        display: "none",
                      },
                      scrollbarWidth: "none",
                    },
                  },
                  list: {
                    sx: {
                      p: 0,
                      overflow: "hidden",
                      maxHeight: "none",
                      "&::-webkit-scrollbar": {
                        display: "none",
                      },
                      scrollbarWidth: "none",
                    }
                  },
                  backdrop: {
                    onClick: handleMenuClose,
                  },
                }}
              >
                <MenuItem
                  className="topbar-profile-menu-item"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleResetPassword();
                  }}
                  sx={{
                    color: "var(--topbar-profile-menu-text)",
                    fontWeight: 500,
                    justifyContent: "center",
                    whiteSpace: "nowrap",
                    borderBottom: "1px solid var(--topbar-profile-menu-border)",
                    py: 1.5,
                    minHeight: "48px",
                    "&:hover": {
                      backgroundColor: "var(--topbar-profile-menu-hover-bg) !important",
                    },
                    "&.Mui-focusVisible": {
                      backgroundColor: "var(--topbar-profile-menu-hover-bg) !important",
                    },
                    "&.Mui-selected": {
                      backgroundColor: "var(--topbar-profile-menu-hover-bg) !important",
                    },
                  }}
                >
                  <LockResetIcon
                    sx={{
                      mr: 1.5,
                      fontSize: 18,
                      color: "var(--topbar-profile-menu-icon)",
                      flexShrink: 0,
                    }}
                  />
                  Reset Password
                </MenuItem>
                <MenuItem
                  className="topbar-profile-menu-item"
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMenuClose();
                    await handleLogout();
                  }}
                  disabled={logoutLoading}
                  sx={{
                    color: logoutLoading ? "#9ca3af" : "#ef4444",
                    fontWeight: 600,
                    justifyContent: "center",
                    whiteSpace: "nowrap",
                    py: 1.5,
                    minHeight: "48px",
                    opacity: logoutLoading ? 0.7 : 1,
                    "&:hover": {
                      backgroundColor: "var(--topbar-profile-menu-hover-bg) !important",
                    },
                    "&.Mui-focusVisible": {
                      backgroundColor: "var(--topbar-profile-menu-hover-bg) !important",
                    },
                  }}
                >
                  {logoutLoading ? (
                    <CircularProgress size={16} sx={{ mr: 1.5, color: "#9ca3af" }} />
                  ) : (
                    <PowerSettingsNewIcon sx={{ mr: 1.5, fontSize: 18, color: "#ef4444" }} />
                  )}
                  {logoutLoading ? "Logging out..." : "Logout"}
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>
      </Box>

      <SharedSidebar
        open={drawerOpen}
        onClose={closeDrawer}
        items={menuItems}
        isItemActive={(item) =>
          isTopbarNavItemActive(item, location.pathname, settingsPath)
        }
      />
    </Box>
  );
}

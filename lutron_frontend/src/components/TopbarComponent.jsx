// src/components/TopbarComponent.jsx
import React, { useEffect, useState } from "react";
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  Menu,
  MenuItem,
  IconButton,
  CircularProgress,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
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
  fetchProfile,
  logout,
  selectProfile,
  selectProfileLoading,
  selectLogoutLoading,
  getValidToken,
} from "../redux/slice/auth/userlogin";
import { getLutronDataClient, homeDataClient } from "../redux/slice/home/homeSlice";
import { resolvePublicAssetUrl } from "../shared/utils/resolveMediaUrl";
import {
  snapshotShadesSettingsForLogout,
  restoreShadesSettingsAfterStorageClear,
} from "../variants/basic/utils/shadesWidgetSettings";

export default function TopbarComponent() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const profile = useSelector(selectProfile);
  const profileLoading = useSelector(selectProfileLoading);
  const logoutLoading = useSelector(selectLogoutLoading);
  const clientData = useSelector(homeDataClient);

  const logoUrl = resolvePublicAssetUrl(clientData?.logo_image);

  useEffect(() => {
    // Don't fetch profile if logout is in progress or if there's no valid token
    const validToken = getValidToken();
    if (!profile && !profileLoading && !logoutLoading && validToken) {
      dispatch(fetchProfile());
    }
  }, [dispatch, profile, profileLoading, logoutLoading]);


  useEffect(() => {
    // Only call this if user is authenticated and we don't have client data yet
    // Don't fetch during logout process
    const validToken = getValidToken();
    if (validToken && profile && !clientData?.name && !logoutLoading) {
      // Only fetch if we haven't tried recently (prevent multiple failed calls)
      const lastFetchTime = sessionStorage.getItem('clientDataFetchTime');
      const now = Date.now();
      if (!lastFetchTime || (now - parseInt(lastFetchTime)) > 60000) { // Only retry after 1 minute
        sessionStorage.setItem('clientDataFetchTime', now.toString());
        dispatch(getLutronDataClient()).catch(() => {
          // Silently handle errors - endpoint might not be available
        });
      }
    }
  }, [dispatch, profile, clientData?.name, logoutLoading]);

  const roleFromProfile = profile?.role;
  const roleFromStorage = localStorage.getItem('role');
  const currentRole = roleFromProfile || roleFromStorage;
  // Determine settings path based on user role
  const getSettingsPath = (role) => {
    if (role === 'Superadmin') {
      return '/main'; // Home component
    } else if (role === 'Admin') {
      return '/main'; // Manage Area Groups component
    } else {
      // Operator - redirect to first available option
      return '/main'; // Manage Area Groups component
    }
  };
  
  const settingsPath = getSettingsPath(currentRole);

  const [anchorEl, setAnchorEl] = useState(null);
  const [menuWidth, setMenuWidth] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
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
      restoreShadesSettingsAfterStorageClear(shadesSettingsSnapshot);
      sessionStorage.clear();

      // Navigate to login page
      navigate("/", { replace: true });

    } catch (error) {
      // Even if logout API fails, clear local state and redirect for security
      console.warn("Logout error:", error);
      localStorage.clear();
      restoreShadesSettingsAfterStorageClear(shadesSettingsSnapshot);
      sessionStorage.clear();
      navigate("/", { replace: true });
    }
  };

  const menuItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Floorplan", path: "/heatmap" },
    { label: "Schedules", path: "/schedule" },
    { label: "Quick Controls", path: "/quickcontrols" },
    { label: "Activity Report", path: "/activity-report" },

    { label: "Settings", path: settingsPath },

    { label: "Help", path: "/get-help" },
  ];

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
        backgroundColor: theme.palette.background.default,
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
          px: { 
            xs: 2, 
            sm: 3, 
            md: 4, 
            lg: 5, 
            xl: 6, 
            xxl: 8,
            "2xl": 10,
            "3xl": 12,
            "4xl": 16,
            "5xl": 20,
            "6xl": 24
          },
        }}
      >
        <AppBar
          position="static"
          elevation={0}
          sx={{
            backgroundColor: theme.palette.custom?.navbarBg || theme.palette.primary.main,
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
            borderRadius: "0px 0px 8px 8px",
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
            {/* Logo - Fixed size to prevent overflow */}
            <Box sx={{ 
              display: "flex", 
              alignItems: "center", 
              flex: "0 0 auto",
              width: { 
                xs: "100px", 
                sm: "120px", 
                md: "140px", 
                lg: "160px", 
                xl: "180px", 
                xxl: "200px",
                "2xl": "220px",
                "3xl": "240px",
                "4xl": "260px",
                "5xl": "280px",
                "6xl": "300px"
              },
              justifyContent: "flex-start",
              overflow: "hidden",
              padding: "15px"
            }}>
              {clientData?.logo_image && (
                <RouterLink to="/lutron" style={{ display: "flex", alignItems: "center", width: "100%" }}>
                  <img
                    src={logoUrl}
                    alt="Client Logo"
                    style={{ 
                      height: "auto",
                      maxHeight: "35px", // Reduced from 40px to prevent overflow
                      maxWidth: "100%",
                      objectFit: "contain",
                      cursor: "pointer"
                    }}
                  />
                </RouterLink>
              )}
            </Box>

                      {/* Center menu - Desktop only, single line */}
            {!isMdDown && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: { xs: 0.5, sm: 1, md: 1.5, lg: 2, xl: 2.5, xxl: 3 },
                  flex: 1,
                  minWidth: 0,
                  flexWrap: "nowrap",
                  overflowX: "visible",
                  whiteSpace: "nowrap"
                }}
              >
                {menuItems.map((item) => {
                  // Special logic for Floorplan - also highlight when on create area group pages
                  // Special logic for Schedules - also highlight when on schedule create/update pages
                  // Special logic for Quick Controls - also highlight when on QC create/update pages
                  // Special logic for Settings - highlight when on any settings page except home
                  const isActive = location.pathname === item.path || 
                    (item.path === "/heatmap" && (
                      location.pathname === "/create-area-model" ||
                      location.pathname.startsWith("/create-area-model/") ||
                      location.pathname === "/user-area-groups" ||
                      location.pathname.startsWith("/user-area-groups/") ||
                      location.pathname === "/create-area-group" ||
                      location.pathname.startsWith("/create-area-group/") ||
                      location.pathname === "/create-area-groups" ||
                      location.pathname.startsWith("/create-area-groups/") ||
                      location.pathname.startsWith("/update-area-groups/") ||
                      location.pathname.startsWith("/update-area-group/")
                    )) ||
                    (item.path === "/schedule" && (
                      location.pathname === "/schedule/add-event" ||
                      location.pathname.startsWith("/schedule/add-event/") ||
                      location.pathname === "/schedule/details" ||
                      location.pathname.startsWith("/schedule/details/") ||
                      location.pathname === "/schedule/update-preconfigured-event" ||
                      location.pathname.startsWith("/schedule/update-preconfigured-event/")
                    )) ||
                    (item.path === "/quickcontrols" && (
                      location.pathname === "/quickcontrols/create" ||
                      location.pathname.startsWith("/quickcontrols/create/") ||
                      location.pathname === "/quickcontrols/details" ||
                      location.pathname.startsWith("/quickcontrols/details/") ||
                      location.pathname.startsWith("/quickcontrols/") && location.pathname !== "/quickcontrols"
                    )) ||
                    (item.path === settingsPath && (
                      location.pathname === "/main" ||
                      location.pathname === "/theme-change" ||
                      location.pathname === "/rename-widget/" ||
                      location.pathname.startsWith("/rename-widget/") ||
                      location.pathname === "/manage-area-groups" ||
                      location.pathname.startsWith("/manage-area-groups/") ||
                      location.pathname === "/area-size-load" ||
                      location.pathname.startsWith("/area-size-load/") ||
                      location.pathname === "/email-server/" ||
                      location.pathname.startsWith("/email-server/") ||
                      location.pathname === "/users" ||
                      location.pathname.startsWith("/users/") ||
                      location.pathname === "/floor" ||
                      location.pathname.startsWith("/floor/") ||
                      location.pathname === "/create-help/" ||
                      location.pathname.startsWith("/create-help/") ||
                      location.pathname === "/manage-sensors" ||
                      location.pathname.startsWith("/manage-sensors/") ||
                      location.pathname === "/manage-modules" ||
                      location.pathname.startsWith("/manage-modules/")
                    ));
                  return (
                    <Typography
                      key={item.label}
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary || "white",
                        fontWeight: 500,
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
                        borderBottom: isActive ? "2px solid white" : "none",
                        "&:hover": { textDecoration: "underline" },
                        transition: "border-bottom 0.2s",
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

            {/* Mobile menu - Only on very small screens */}
            {isMdDown && (
              <IconButton
                edge="start"
                color="inherit"
                aria-label="menu"
                onClick={() => setDrawerOpen(true)}
                sx={{ ml: 1, mr: 1 }}
              >
                <MenuIcon />
              </IconButton>
            )}

            {/* Right profile - Properly contained */}
            <Box sx={{ 
              display: "flex", 
              alignItems: "center", 
              flex: "0 0 auto",
              minWidth: { 
                xs: "120px", 
                sm: "140px", 
                md: "160px", 
                lg: "180px", 
                xl: "200px", 
                xxl: "220px",
                "2xl": "240px",
                "3xl": "260px",
                "4xl": "280px",
                "5xl": "300px",
                "6xl": "320px"
              },
              justifyContent: "flex-end",
              overflow: "visible"
            }}>
              <Box
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
                        color: theme.palette.text.secondary || "white",
                        flexShrink: 0
                      }}
                    >
                      {displayName.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary || "white",
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
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                disableAutoFocus
                disableEnforceFocus
                slotProps={{
                  paper: {
                    elevation: 0,
                    style: { backgroundColor: "#fff" },
                    sx: {
                      bgcolor: "#fff",
                      color: "#111",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      width: `${menuWidth || 0}px`,
                      minWidth: `${menuWidth || 0}px`,
                      maxWidth: `${menuWidth || 0}px`,
                      mt: 0,
                      overflow: "hidden",
                      border: "1px solid rgba(0,0,0,0.08)",
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
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleResetPassword();
                  }}
                  sx={{ 
                    color: "#111", 
                    fontWeight: 500, 
                    justifyContent: "center",
                    borderBottom: "1px solid rgba(0,0,0,0.08)",
                    py: 1.5,
                    minHeight: "48px",
                    "&:hover": {
                      backgroundColor: "rgba(0,0,0,0.04)",
                    }
                  }}
                >
                  <LockResetIcon sx={{ mr: 1.5, fontSize: 18, color: "#666" }} />
                  Reset Password
                </MenuItem>
                <MenuItem
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
                    py: 1.5,
                    minHeight: "48px",
                    opacity: logoutLoading ? 0.7 : 1
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

      {/* Drawer for mobile */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { 
              xs: "250px", 
              lg: "280px", 
              xl: "300px", 
              xxl: "320px",
              "2xl": "350px",
              "3xl": "380px",
              "4xl": "400px",
              "5xl": "420px",
              "6xl": "450px"
            },
            backgroundColor: theme.palette.background.paper,
            zIndex: 10003,
          },
        }}
      >
        <Box
          sx={{
            textAlign: "center",
            p: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>
            Menu
          </Typography>
        </Box>
        <List>
          {menuItems.map((item) => {
            // Special logic for Floorplan - also highlight when on create area group pages
            // Special logic for Schedules - also highlight when on schedule create/update pages
            // Special logic for Quick Controls - also highlight when on QC create/update pages
            // Special logic for Settings - highlight when on any settings page except home
            const isActive = location.pathname === item.path || 
              (item.path === "/heatmap" && (
                location.pathname === "/create-area-model" ||
                location.pathname.startsWith("/create-area-model/") ||
                location.pathname === "/user-area-groups" ||
                location.pathname.startsWith("/user-area-groups/") ||
                location.pathname === "/create-area-group" ||
                location.pathname.startsWith("/create-area-group/") ||
                location.pathname === "/create-area-groups" ||
                location.pathname.startsWith("/create-area-groups/") ||
                location.pathname.startsWith("/update-area-groups/") ||
                location.pathname.startsWith("/update-area-group/")
              )) ||
              (item.path === "/schedule" && (
                location.pathname === "/schedule/add-event" ||
                location.pathname.startsWith("/schedule/add-event/") ||
                location.pathname === "/schedule/details" ||
                location.pathname.startsWith("/schedule/details/") ||
                location.pathname === "/schedule/update-preconfigured-event" ||
                location.pathname.startsWith("/schedule/update-preconfigured-event/")
              )) ||
              (item.path === "/quickcontrols" && (
                location.pathname === "/quickcontrols/create" ||
                location.pathname.startsWith("/quickcontrols/create/") ||
                location.pathname === "/quickcontrols/details" ||
                location.pathname.startsWith("/quickcontrols/details/") ||
                location.pathname.startsWith("/quickcontrols/") && location.pathname !== "/quickcontrols"
              )) ||
              (item.path === settingsPath && (
                location.pathname === "/main" ||
                location.pathname === "/theme-change" ||
                location.pathname === "/rename-widget/" ||
                location.pathname.startsWith("/rename-widget/") ||
                location.pathname === "/manage-area-groups" ||
                location.pathname.startsWith("/manage-area-groups/") ||
                location.pathname === "/area-size-load" ||
                location.pathname.startsWith("/area-size-load/") ||
                location.pathname === "/email-server/" ||
                location.pathname.startsWith("/email-server/") ||
                location.pathname === "/users" ||
                location.pathname.startsWith("/users/") ||
                location.pathname === "/floor" ||
                location.pathname.startsWith("/floor/") ||
                location.pathname === "/create-help/" ||
                location.pathname.startsWith("/create-help/") ||
                location.pathname === "/manage-sensors" ||
                location.pathname.startsWith("/manage-sensors/") ||
                location.pathname === "/manage-modules" ||
                location.pathname.startsWith("/manage-modules/")
              ));
            
            return (
              <ListItem key={item.label} disablePadding>
                <ListItemButton
                  onClick={() => {
                    navigate(item.path);
                    setDrawerOpen(false);
                  }}
                  sx={{
                    backgroundColor: isActive ? theme.palette.primary.main : 'transparent',
                    '&:hover': {
                      backgroundColor: isActive ? theme.palette.primary.dark : theme.palette.action.hover,
                    }
                  }}
                >
                  <ListItemText
                    primary={item.label}
                    sx={{ 
                      color: isActive ? theme.palette.primary.contrastText : theme.palette.text.primary,
                      fontWeight: isActive ? 600 : 400
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Drawer>
    </Box>
  );
}

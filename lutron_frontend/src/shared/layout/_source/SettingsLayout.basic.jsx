/**
 * Shared Settings shell: left nav + content panel (Processors, Alerts, FOFP, etc.).
 */

import React from "react";
import { Box, Grid, Typography, useTheme, useMediaQuery } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { UseAuth, getVisibleSidebarItemsWithPaths } from "../../customhooks/UseAuth";

const isPathActive = (pathname, itemPath) => {
  if (!itemPath) return false;
  const current = pathname.replace(/\/$/, "") || "/";
  const target = String(itemPath).replace(/\/$/, "") || "/";
  return current === target;
};

const SettingsLayout = ({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const { role } = UseAuth();
  const visibleSidebarItemsWithPaths = getVisibleSidebarItemsWithPaths(role);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        p: { xs: 0.3, sm: 0.5, md: 1, lg: 1.5 },
        position: "relative",
      }}
    >
      <Box
        sx={{
          width: "100%",
          mx: "auto",
          px: { xs: 0.3, sm: 0.5, md: 1, lg: 1.5 },
        }}
      >
        <Grid container spacing={{ xs: 0.3, sm: 0.5, md: 1, lg: 1 }}>
          <Grid
            item
            xs={12}
            md={3}
            sx={{
              order: { xs: 1, md: 1 },
              p: { xs: 0.3, sm: 0.5, md: 1, lg: 1.5 },
              borderRadius: { xs: "4px", lg: "8px" },
              mb: { xs: 0.3, lg: 0 },
            }}
          >
            <Typography
              variant="h6"
              sx={{
                mb: { xs: 0.8, sm: 1, md: 1.5, lg: 2 },
                color: theme.palette.text.secondary,
                fontSize: { xs: "12px", sm: "14px", md: "16px", lg: "20px" },
              }}
            >
              Settings
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: isTablet ? "row" : "column",
                flexWrap: isTablet ? "wrap" : "nowrap",
                gap: isTablet ? 1 : 0,
              }}
              data-testid="settings-sidebar-nav"
            >
              {visibleSidebarItemsWithPaths.map((item) => {
                const active = isPathActive(location.pathname, item.path);
                return (
                  <Box
                    key={item.label}
                    onClick={() => {
                      if (item.path) navigate(item.path);
                    }}
                    data-testid={`settings-nav-${item.label.replace(/\s+/g, "-").toLowerCase()}`}
                    sx={{
                      backgroundColor: active
                        ? theme.palette.custom?.containerBg || "#f5f5f5"
                        : "transparent",
                      color: active
                        ? theme.palette.text.primary
                        : theme.palette.text.secondary,
                      px: isTablet ? 1.5 : { xs: 0.8, sm: 1, md: 1.5, lg: 2 },
                      py: isTablet ? 0.8 : { xs: 0.3, sm: 0.5, md: 0.8, lg: 1 },
                      borderRadius: "4px",
                      mb: isTablet ? 0 : { xs: 0.2, sm: 0.3, md: 0.5, lg: 0.8 },
                      mr: isTablet ? 1 : 0,
                      fontSize: isTablet
                        ? "11px"
                        : { xs: "9px", sm: "10px", md: "12px", lg: "14px" },
                      fontWeight: active ? 600 : 400,
                      cursor: "pointer",
                      minWidth: isTablet ? "auto" : "100%",
                      textAlign: isTablet ? "center" : "left",
                      whiteSpace: isTablet ? "nowrap" : "normal",
                      "&:hover": {
                        backgroundColor: theme.palette.custom?.containerBg || "#f5f5f5",
                      },
                      ...(isTablet && {
                        flex: "0 0 auto",
                        border: "1px solid rgba(255,255,255,0.1)",
                        minHeight: "32px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }),
                    }}
                  >
                    {item.label}
                  </Box>
                );
              })}
            </Box>
          </Grid>

          <Grid
            item
            xs={12}
            lg={9}
            sx={{
              order: { xs: 2, lg: 2 },
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
            }}
          >
            <Box
              data-testid="settings-layout-content"
              sx={{
                backgroundColor: "#fff",
                borderRadius: { xs: "4px", sm: "6px", md: "8px", lg: "10px" },
                p: { xs: 0.8, sm: 1, md: 1.2, lg: 1.5 },
                width: "100%",
                flex: 1,
                minHeight: { xs: "auto", md: "calc(100vh - 120px)" },
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {children}
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default SettingsLayout;
export { isPathActive };

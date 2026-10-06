/**
 * Shared mobile navigation drawer — Phase 5.3
 *
 * Consolidates drawer collapse, navigation, and route highlighting
 * previously duplicated in each variant TopbarComponent.
 */

import React from "react";
import {
  Drawer,
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";

import { onContentColors } from "../../theme/utils/themeOnSurface";

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {Array<{label:string,path:string}>} props.items
 * @param {(item:object)=>boolean} props.isItemActive
 * @param {string} [props.title]
 * @param {object} [props.paperSx]
 */
export function SharedSidebar({
  open,
  onClose,
  items = [],
  isItemActive,
  title = "Menu",
  paperSx = {},
}) {
  const theme = useTheme();
  const navigate = useNavigate();

  const paperBg = theme.palette.background.paper;
  const inactiveOn = onContentColors(paperBg);
  const activeOn = onContentColors(theme.palette.primary.main);

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      data-testid="shared-sidebar-drawer"
      PaperProps={{
        className: "shared-sidebar-drawer-paper",
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
            "6xl": "450px",
          },
          backgroundColor: paperBg,
          zIndex: 10003,
          "--shared-sidebar-inactive-text": inactiveOn.primary,
          "--shared-sidebar-active-text": activeOn.primary,
          ...paperSx,
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
        <Typography variant="h6" sx={{ color: inactiveOn.primary }}>
          {title}
        </Typography>
      </Box>
      <List>
        {items.map((item) => {
          const isActive = isItemActive(item);
          return (
            <ListItem key={`${item.label}-${item.path}`} disablePadding>
              <ListItemButton
                className={
                  isActive
                    ? "shared-sidebar-nav-item shared-sidebar-nav-item--active"
                    : "shared-sidebar-nav-item"
                }
                onClick={() => {
                  navigate(item.path);
                  onClose();
                }}
                sx={{
                  backgroundColor: isActive
                    ? theme.palette.primary.main
                    : "transparent",
                  "&:hover": {
                    backgroundColor: isActive
                      ? theme.palette.primary.dark
                      : theme.palette.action.hover,
                  },
                }}
              >
                <ListItemText
                  primary={item.label}
                  sx={{
                    color: isActive ? activeOn.primary : inactiveOn.primary,
                    fontWeight: isActive ? 600 : 400,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Drawer>
  );
}

export default SharedSidebar;

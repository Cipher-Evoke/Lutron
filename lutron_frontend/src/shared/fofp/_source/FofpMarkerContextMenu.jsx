/**
 * Compact right-click menu: 3×2 shape icon grid + resize action.
 */

import React from "react";
import {
  Box,
  Divider,
  IconButton,
  ListSubheader,
  Menu,
  MenuList,
  Tooltip,
} from "@mui/material";
import PhotoSizeSelectSmallOutlinedIcon from "@mui/icons-material/PhotoSizeSelectSmallOutlined";

import { resolveFofpShape } from "../../heatmap/fofpMarkerShapes";
import { FOFP_SHAPE_OPTIONS } from "./fofpShapeOptions";
import FofpShapeMenuIcon from "./FofpShapeMenuIcon";

const FofpMarkerContextMenu = ({
  open = false,
  anchorPosition = null,
  zoneId = null,
  markerShape = "circle",
  onClose,
  onShapeChange,
  onStartResize,
}) => {
  const handleClose = () => {
    if (typeof onClose === "function") onClose();
  };

  const handlePickShape = (shape) => {
    if (typeof onShapeChange === "function") {
      onShapeChange(resolveFofpShape(shape));
    }
    handleClose();
  };

  const handleResizeClick = (e) => {
    e.stopPropagation();
    if (zoneId != null && typeof onStartResize === "function") {
      onStartResize(zoneId);
    }
    handleClose();
  };

  if (!open || !anchorPosition) return null;

  const resolvedShape = resolveFofpShape(markerShape);

  return (
    <Menu
      open={open}
      onClose={handleClose}
      anchorReference="anchorPosition"
      anchorPosition={anchorPosition}
      anchorOrigin={{ vertical: "top", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      disableAutoFocusItem
      disableScrollLock
      data-testid="fofp-marker-context-menu"
      slotProps={{
        paper: {
          sx: { minWidth: 132, maxWidth: 148 },
        },
      }}
    >
      <MenuList
        dense
        disablePadding
        sx={{ py: 0.5, px: 0.5 }}
        data-testid="fofp-marker-context-menu-list"
      >
        <ListSubheader
          component="div"
          disableSticky
          sx={{ lineHeight: 1.8, py: 0.25, px: 0.5 }}
        >
          Shape
        </ListSubheader>
        <Box
          data-testid="fofp-ctx-shape-grid"
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 0.5,
            px: 0.5,
            pb: 0.5,
          }}
        >
          {FOFP_SHAPE_OPTIONS.map((opt) => {
            const selected = opt.value === resolvedShape;
            return (
              <IconButton
                key={opt.value}
                size="small"
                onClick={() => handlePickShape(opt.value)}
                aria-label={opt.label}
                title={opt.label}
                data-testid={`fofp-ctx-shape-${opt.value}`}
                sx={{
                  borderRadius: 1,
                  border: "2px solid",
                  borderColor: selected ? "primary.main" : "transparent",
                  bgcolor: selected ? "action.selected" : "transparent",
                  p: 0.5,
                  minWidth: 40,
                  minHeight: 40,
                }}
              >
                <FofpShapeMenuIcon shape={opt.value} />
              </IconButton>
            );
          })}
        </Box>
        <Divider sx={{ my: 0.25 }} />
        <Box sx={{ display: "flex", justifyContent: "center", py: 0.25 }}>
          <Tooltip title="Resize on floorplan">
            <IconButton
              size="small"
              onClick={handleResizeClick}
              aria-label="Resize on floorplan"
              data-testid="fofp-ctx-resize"
            >
              <PhotoSizeSelectSmallOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </MenuList>
    </Menu>
  );
};

export default FofpMarkerContextMenu;

/**
 * FOFP Layout Viewer — PDF + SVG overlay (admin editor).
 * Performance: ref-based pan/zoom, ephemeral drag/resize, viewport culling.
 */

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  ButtonGroup,
  CircularProgress,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Document, Page } from "react-pdf";
import { configurePdfJsWorker, buildPdfDocumentFile } from "../../../../../shared/pdf/floorPlanPdf";
import {
  clampFofpMarkerConfigSize,
  FOFPMarkerShape,
  FOFP_DEFAULT_MARKER_SIZE,
  resolveFofpMarkerShape,
  resolveFofpShape,
} from "../../heatmap/fofpMarkerShapes";
import {
  DEFAULT_FOFP_MARKER_COLOR,
  normalizeFofpHex,
} from "../../heatmap/fofpColorUtils";
import { getMarkerStyle } from "../../heatmap/fofpStatusStyles";
import { resolveFofpMarkerHalfAxes } from "../../heatmap/fofpMarkerDimensions";
import {
  buildAreaRingsById,
  buildPolygonRenderList,
  getVisibleContentBounds,
} from "../../../features/fofp/geometry";
import MarkerLayer from "../../../features/fofp/editor/layers/MarkerLayer";
import { useViewportTransform } from "../../../features/fofp/editor/hooks/useViewportTransform";
import { useMarkerDragSession } from "../../../features/fofp/editor/hooks/useMarkerDragSession";
import { useMarkerResizeSession } from "../../../features/fofp/editor/hooks/useMarkerResizeSession";
import FofpMarkerContextMenu from "./FofpMarkerContextMenu";
import FofpMarkerResizeHandles from "./FofpMarkerResizeHandles";
import { computeContextMenuAnchor } from "./fofpContextMenuPosition";
import {
  getFofpViewerChromeSx,
  getFofpViewerZoomBarSx,
  getFofpViewerZoomButtonSx,
} from "./fofpSettingsUi";
import { resolveFitBounds } from "./fofpViewportFit";

configurePdfJsWorker();

const DEFAULT_PAGE = { width: 800, height: 600 };

const FloorPlanPdfLayer = React.memo(function FloorPlanPdfLayer({
  pdfUrl,
  dims,
  onLoadSuccess,
  onLoadError,
}) {
  const pdfFile = useMemo(() => buildPdfDocumentFile(pdfUrl), [pdfUrl]);
  return (
    <Document
      file={pdfFile}
      key={pdfUrl}
      onLoadError={onLoadError}
      loading={
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress size={28} />
        </Box>
      }
    >
      <Page
        pageNumber={1}
        width={dims.width}
        renderAnnotationLayer={false}
        renderTextLayer={false}
        onLoadSuccess={onLoadSuccess}
      />
    </Document>
  );
});

const FOFPLayoutViewer = ({
  pdfUrl,
  areas = [],
  positions = [],
  isEditing = false,
  onPositionChange,
  selectedZoneId = null,
  onZoneSelect = null,
  onMarkerStyleChange = null,
  markerShape = "circle",
  markerSize = FOFP_DEFAULT_MARKER_SIZE,
  markerBaseColor = null,
  viewportBounds = null,
  onZoomChange,
  isLightChrome = false,
}) => {
  const theme = useTheme();
  const accentStroke = theme.palette.primary.main;
  const areaStroke = alpha(theme.palette.primary.main, 0.6);
  const areaFill = alpha(theme.palette.primary.main, 0.06);
  const resolvedShape = resolveFofpShape(markerShape);
  const resolvedSize = clampFofpMarkerConfigSize(markerSize);
  const previewBaseColor = normalizeFofpHex(
    markerBaseColor || DEFAULT_FOFP_MARKER_COLOR
  );

  const [pageDims, setPageDims] = useState(null);
  const [pdfError, setPdfError] = useState(null);
  const [draggingZoneId, setDraggingZoneId] = useState(null);
  const [isPanning, setIsPanning] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [resizingZoneId, setResizingZoneId] = useState(null);
  const [liveResizePatch, setLiveResizePatch] = useState(null);
  const [cullRevision, setCullRevision] = useState(0);

  const svgRef = useRef(null);
  const viewportRef = useRef(null);
  const contentRef = useRef(null);
  const panRef = useRef({
    active: false,
    pointerId: null,
    lastX: 0,
    lastY: 0,
  });

  const dims = pageDims || DEFAULT_PAGE;
  const calibratedBounds = useMemo(
    // Wait for real PDF dims before applying backend boundary (avoids wrong fit on floor switch).
    () => resolveFitBounds(pageDims ? viewportBounds : null, dims),
    [dims, pageDims, viewportBounds]
  );

  const {
    transformRef,
    applyTransform,
    applyCalibratedViewport,
    markViewAdjusted,
    zoomAtCenter,
    zoomAtCursor,
    panByDelta,
    resetUserAdjusted,
    userAdjustedViewRef,
  } = useViewportTransform({
    viewportRef,
    contentRef,
    dims,
    calibratedBounds,
    onZoomChange,
  });

  const bumpCullRevision = useCallback(() => {
    setCullRevision((n) => n + 1);
  }, []);

  // Keep imperative pan/zoom after React re-renders (do not let sx reset scale).
  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const { x, y, scale } = transformRef.current;
    content.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
  }, [cullRevision, dims.width, dims.height, pdfUrl, transformRef]);

  const clientPointToSvg = useCallback((clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg || typeof svg.createSVGPoint !== "function") return null;
    const ctm = svg.getScreenCTM && svg.getScreenCTM();
    if (!ctm) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    return pt.matrixTransform(ctm.inverse());
  }, []);

  const polygons = useMemo(
    () => buildPolygonRenderList(areas),
    [areas]
  );

  const areaRingsById = useMemo(
    () => buildAreaRingsById(areas),
    [areas]
  );

  const positionsByZoneId = useMemo(() => {
    const map = new Map();
    for (const p of positions || []) {
      if (p?.zone_id != null) map.set(Number(p.zone_id), p);
    }
    return map;
  }, [positions]);

  const positionsList = useMemo(
    () => (Array.isArray(positions) ? positions : []),
    [positions]
  );

  const visibleBounds = useMemo(() => {
    const vp = viewportRef.current;
    if (!vp || vp.clientWidth <= 0) return null;
    return getVisibleContentBounds(
      transformRef.current,
      vp.clientWidth,
      vp.clientHeight,
      48
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- revision bumps after pan/zoom settle
  }, [cullRevision, dims.width, dims.height]);

  const enableMarkerCulling =
    !isPanning && draggingZoneId == null && resizingZoneId == null;

  const {
    registerMarkerElement,
    handleMarkerPointerDown,
    handleMarkerPointerMove,
    handleMarkerPointerUp,
    hasActiveDrag,
    cancelPendingDrag,
    endDragSession,
  } = useMarkerDragSession({
    isEditing,
    areaRingsById,
    positionsByZoneId,
    onPositionChange,
    onDragStateChange: setDraggingZoneId,
    clientPointToSvg,
  });

  const {
    handleResizeHandlePointerDown,
    endResizeMode,
    clampStylePatchToArea,
    canResizeZone,
  } = useMarkerResizeSession({
    isEditing,
    areaRingsById,
    positionsByZoneId,
    resolvedSize,
    resolvedShape,
    onMarkerStyleChange,
    onLiveResizePatch: setLiveResizePatch,
    clientPointToSvg,
    resizingZoneId,
    setResizingZoneId,
  });

  const clearZoneSelection = useCallback(() => {
    if (typeof onZoneSelect === "function") onZoneSelect(null);
  }, [onZoneSelect]);

  useEffect(() => {
    if (!isEditing) {
      setContextMenu(null);
      endResizeMode();
    }
  }, [isEditing, endResizeMode]);

  useEffect(() => {
    if (resizingZoneId == null) return undefined;

    const onPointerDownCapture = (e) => {
      const target = e.target;
      if (!(target instanceof Element)) {
        endResizeMode();
        clearZoneSelection();
        return;
      }
      if (target.closest("[data-fofp-resize-handle]")) return;
      if (target.closest("[data-fofp-resize-chrome]")) return;
      if (target.closest("[data-testid='fofp-marker-context-menu']")) return;
      if (target.closest(".MuiPopover-root, .MuiMenu-root, .MuiModal-root")) return;
      endResizeMode();
      clearZoneSelection();
    };

    document.addEventListener("pointerdown", onPointerDownCapture, true);
    return () => document.removeEventListener("pointerdown", onPointerDownCapture, true);
  }, [clearZoneSelection, endResizeMode, resizingZoneId]);

  const getContextMenuAnchorForMarker = useCallback(
    (e, zoneId) => {
      const p = positionsByZoneId.get(Number(zoneId));
      const svg = svgRef.current;
      let anchorX = e.clientX;
      let anchorY = e.clientY;
      if (p && svg?.createSVGPoint && svg.getScreenCTM) {
        const pt = svg.createSVGPoint();
        pt.x = p.x;
        pt.y = p.y;
        const screen = pt.matrixTransform(svg.getScreenCTM());
        const { halfX, halfY } = resolveFofpMarkerHalfAxes(p, resolvedSize);
        anchorX = screen.x + halfX;
        anchorY = screen.y + halfY;
      }
      return computeContextMenuAnchor(anchorX, anchorY);
    },
    [positionsByZoneId, resolvedSize]
  );

  const handleMarkerContextMenu = useCallback(
    (e, zoneId) => {
      if (!isEditing) return;
      e.preventDefault();
      e.stopPropagation();
      cancelPendingDrag();
      endDragSession(false);
      if (typeof onZoneSelect === "function") onZoneSelect(zoneId);
      const anchor = getContextMenuAnchorForMarker(e, zoneId);
      setContextMenu({ zoneId, top: anchor.top, left: anchor.left });
    },
    [
      cancelPendingDrag,
      endDragSession,
      getContextMenuAnchorForMarker,
      isEditing,
      onZoneSelect,
    ]
  );

  const handleMarkerPointerDownWrapped = useCallback(
    (e, zoneId) => {
      if (resizingZoneId != null && resizingZoneId !== zoneId) endResizeMode();
      if (typeof onZoneSelect === "function") onZoneSelect(zoneId);
      handleMarkerPointerDown(e, zoneId);
    },
    [endResizeMode, handleMarkerPointerDown, onZoneSelect, resizingZoneId]
  );

  const contextTarget = contextMenu
    ? positionsByZoneId.get(Number(contextMenu.zoneId))
    : null;

  const resizingPositionRaw =
    resizingZoneId != null
      ? positionsByZoneId.get(Number(resizingZoneId))
      : null;
  const resizingPosition =
    resizingPositionRaw && liveResizePatch
      ? { ...resizingPositionRaw, ...liveResizePatch }
      : resizingPositionRaw;

  const handleStartResize = useCallback(
    (zoneId) => {
      const id = zoneId ?? contextMenu?.zoneId;
      if (id == null) return;
      if (!canResizeZone(id)) return;
      setResizingZoneId(Number(id));
      setContextMenu(null);
      if (typeof onZoneSelect === "function") onZoneSelect(id);
    },
    [canResizeZone, contextMenu?.zoneId, onZoneSelect]
  );

  const handlePdfLoadSuccess = useCallback((page) => {
    setPageDims({ width: page.originalWidth, height: page.originalHeight });
  }, []);

  const handlePdfLoadError = useCallback((err) => {
    setPdfError(err?.message || "Failed to load floor plan");
  }, []);

  const zoomIn = useCallback(() => {
    zoomAtCenter(true);
    bumpCullRevision();
  }, [bumpCullRevision, zoomAtCenter]);

  const zoomOut = useCallback(() => {
    zoomAtCenter(false);
    bumpCullRevision();
  }, [bumpCullRevision, zoomAtCenter]);

  const resetZoom = useCallback(() => {
    applyCalibratedViewport({ force: true });
    bumpCullRevision();
  }, [applyCalibratedViewport, bumpCullRevision]);

  useEffect(() => {
    setPageDims(null);
    setPdfError(null);
    resetUserAdjusted();
  }, [pdfUrl, resetUserAdjusted]);

  useEffect(() => {
    if (!pdfUrl) return undefined;
    if (userAdjustedViewRef.current) return undefined;
    // Double rAF: wait until flex layout has real viewport size after PDF dims load.
    let innerId = 0;
    const outerId = window.requestAnimationFrame(() => {
      innerId = window.requestAnimationFrame(() => {
        applyCalibratedViewport({ force: true });
        bumpCullRevision();
      });
    });
    return () => {
      window.cancelAnimationFrame(outerId);
      window.cancelAnimationFrame(innerId);
    };
  }, [applyCalibratedViewport, bumpCullRevision, pdfUrl, pageDims, userAdjustedViewRef]);

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp || !pdfUrl) return undefined;
    // Defer fit out of the ResizeObserver callback — sync layout work here causes
    // "ResizeObserver loop completed with undelivered notifications" in CRA overlay.
    let rafId = 0;
    const runFit = () => {
      rafId = 0;
      if (vp.clientWidth > 0 && vp.clientHeight > 0) {
        applyCalibratedViewport({ force: !userAdjustedViewRef.current });
        bumpCullRevision();
      }
    };
    const scheduleFit = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(runFit);
    };
    scheduleFit();
    const ro = new ResizeObserver(scheduleFit);
    ro.observe(vp);
    return () => {
      ro.disconnect();
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [pdfUrl, pageDims, applyCalibratedViewport, bumpCullRevision, userAdjustedViewRef]);

  const handleWheel = useCallback(
    (e) => {
      if (!pdfUrl) return;
      e.preventDefault();
      e.stopPropagation();
      zoomAtCursor(e.clientX, e.clientY, e.deltaY);
      bumpCullRevision();
    },
    [bumpCullRevision, pdfUrl, zoomAtCursor]
  );

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !pdfUrl) return undefined;
    viewport.addEventListener("wheel", handleWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", handleWheel);
  }, [handleWheel, pdfUrl]);

  const handlePointerDown = useCallback(
    (e) => {
      if (!pdfUrl || e.button !== 0 || hasActiveDrag()) return;
      const target = e.target;
      if (
        target instanceof Element &&
        target.closest(
          ".MuiModal-root, .MuiPopover-root, .MuiMenu-root, [data-testid='fofp-marker-context-menu']"
        )
      ) {
        return;
      }
      if (target instanceof Element && target.closest("[data-fofp-resize-handle]")) {
        return;
      }
      if (resizingZoneId != null) return;
      if (contextMenu != null) setContextMenu(null);
      if (target instanceof Element && target.closest("[data-fofp-marker='true']")) {
        return;
      }
      clearZoneSelection();
      markViewAdjusted();
      e.preventDefault();
      panRef.current = {
        active: true,
        pointerId: e.pointerId,
        lastX: e.clientX,
        lastY: e.clientY,
      };
      setIsPanning(true);
      viewportRef.current?.setPointerCapture?.(e.pointerId);
    },
    [
      clearZoneSelection,
      contextMenu,
      hasActiveDrag,
      markViewAdjusted,
      pdfUrl,
      resizingZoneId,
    ]
  );

  const handlePointerMove = useCallback(
    (e) => {
      const pan = panRef.current;
      if (!pan.active || pan.pointerId !== e.pointerId) return;
      e.preventDefault();
      const dx = e.clientX - pan.lastX;
      const dy = e.clientY - pan.lastY;
      panRef.current = { ...pan, lastX: e.clientX, lastY: e.clientY };
      panByDelta(dx, dy);
    },
    [panByDelta]
  );

  const endPan = useCallback(
    (e) => {
      const pan = panRef.current;
      if (e && pan.pointerId !== e.pointerId) return;
      panRef.current = {
        active: false,
        pointerId: null,
        lastX: 0,
        lastY: 0,
      };
      setIsPanning(false);
      bumpCullRevision();
      if (e && viewportRef.current?.releasePointerCapture) {
        try {
          viewportRef.current.releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }
    },
    [bumpCullRevision]
  );

  return (
    <Box
      ref={viewportRef}
      sx={{
        flex: 1,
        minHeight: 0,
        width: "100%",
        alignSelf: "stretch",
        position: "relative",
        ...getFofpViewerChromeSx(isLightChrome),
        overflow: "hidden",
        display: "flex",
        alignItems: pdfUrl ? "flex-start" : "center",
        justifyContent: "center",
        cursor: pdfUrl ? (isPanning ? "grabbing" : "grab") : "default",
        touchAction: "none",
        userSelect: isPanning ? "none" : "auto",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endPan}
      onPointerCancel={endPan}
    >
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        onPointerDown={(e) => e.stopPropagation()}
        sx={{
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 5,
          ...getFofpViewerZoomBarSx(theme),
        }}
      >
        <ButtonGroup size="small" variant="text" aria-label="FOFP viewer zoom controls">
          <Button onClick={zoomOut} sx={getFofpViewerZoomButtonSx(theme)}>
            -
          </Button>
          <Button onClick={zoomIn} sx={getFofpViewerZoomButtonSx(theme)}>
            +
          </Button>
          <Button
            onClick={() => {
              applyCalibratedViewport({ force: true });
              bumpCullRevision();
            }}
            sx={{ ...getFofpViewerZoomButtonSx(theme), minWidth: 44 }}
          >
            Fit
          </Button>
          <Button onClick={resetZoom} sx={{ ...getFofpViewerZoomButtonSx(theme), minWidth: 54 }}>
            Reset
          </Button>
        </ButtonGroup>
      </Stack>

      {!pdfUrl && (
        <Box
          className={`fofp-viewer-empty-message${isLightChrome ? " fofp-viewer-empty-on-light" : ""}`}
          sx={{ textAlign: "center", px: 2 }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: theme.typography.fontWeightBold,
              // Beat `.settings-main-inner-panel .MuiTypography-root` panel text CSS.
              color: `${isLightChrome ? "#0f172a" : "#E2E8F0"} !important`,
            }}
          >
            No Floor Selected
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: `${
                isLightChrome
                  ? "rgba(15, 23, 42, 0.72)"
                  : "rgba(226, 232, 240, 0.88)"
              } !important`,
            }}
          >
            Select a floor from the toolbar to load the editable floorplan.
          </Typography>
        </Box>
      )}

      {pdfUrl && (
        <Box
          ref={contentRef}
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: dims.width,
            height: dims.height,
            display: "inline-block",
            willChange: "transform",
            transformOrigin: "top left",
            boxShadow: "0 18px 45px rgba(0,0,0,0.32)",
            bgcolor: theme.palette.common.white,
          }}
        >
          <FloorPlanPdfLayer
            pdfUrl={pdfUrl}
            dims={dims}
            onLoadSuccess={handlePdfLoadSuccess}
            onLoadError={handlePdfLoadError}
          />

          <svg
            ref={svgRef}
            data-testid="fofp-overlay"
            width={dims.width}
            height={dims.height}
            viewBox={`0 0 ${dims.width} ${dims.height}`}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              pointerEvents: "auto",
            }}
          >
            {polygons.map((poly) => (
              <polygon
                key={poly.key}
                points={poly.points}
                fill={areaFill}
                stroke={areaStroke}
                strokeWidth={1}
                pointerEvents="none"
              />
            ))}

            <MarkerLayer
              positions={positionsList}
              visibleBounds={visibleBounds}
              resolvedSize={resolvedSize}
              resolvedShape={resolvedShape}
              previewBaseColor={previewBaseColor}
              accentStroke={accentStroke}
              isEditing={isEditing}
              selectedZoneId={selectedZoneId}
              draggingZoneId={draggingZoneId}
              resizingZoneId={resizingZoneId}
              registerMarkerElement={registerMarkerElement}
              onMarkerPointerDown={handleMarkerPointerDownWrapped}
              onMarkerPointerMove={handleMarkerPointerMove}
              onMarkerPointerUp={handleMarkerPointerUp}
              onMarkerContextMenu={handleMarkerContextMenu}
              enableCulling={enableMarkerCulling}
            />

            {resizingPosition && isEditing ? (() => {
              const p = resizingPosition;
              const { halfX, halfY } = resolveFofpMarkerHalfAxes(
                p,
                resolvedSize
              );
              const markerShape = resolveFofpMarkerShape(
                p.marker_shape,
                resolvedShape
              );
              const isManual = p.placement_source === "manual";
              const previewStyle = getMarkerStyle({
                lightLevel: isManual ? 72 : 88,
                baseColor: previewBaseColor,
              });
              return (
                <g
                  data-fofp-resize-chrome
                  data-testid={`fofp-marker-${p.zone_id}-resize-top`}
                >
                  <FofpMarkerResizeHandles
                    centerX={p.x}
                    centerY={p.y}
                    halfW={halfX}
                    halfH={halfY}
                    onHandlePointerDown={handleResizeHandlePointerDown}
                  />
                  <g pointerEvents="none">
                    <ellipse
                      data-fofp-resize-ring
                      cx={p.x}
                      cy={p.y}
                      rx={halfX + 3}
                      ry={halfY + 3}
                      fill="none"
                      stroke={accentStroke}
                      strokeWidth={2}
                      vectorEffect="non-scaling-stroke"
                    />
                    <g data-fofp-resize-shape>
                      <FOFPMarkerShape
                        x={p.x}
                        y={p.y}
                        size={halfX}
                        sizeY={halfY}
                        shape={markerShape}
                        style={{
                          fill: previewStyle.fill,
                          stroke: previewStyle.stroke,
                          strokeWidth: previewStyle.strokeWidth,
                          opacity: previewStyle.opacity,
                        }}
                      />
                    </g>
                  </g>
                </g>
              );
            })() : null}
          </svg>
        </Box>
      )}

      {pdfError && pdfUrl && (
        <Typography
          variant="caption"
          color="error"
          sx={{ position: "absolute", bottom: 8, left: 8 }}
        >
          {pdfError}
        </Typography>
      )}

      <FofpMarkerContextMenu
        open={Boolean(contextMenu)}
        anchorPosition={
          contextMenu
            ? { top: contextMenu.top, left: contextMenu.left }
            : undefined
        }
        zoneId={contextMenu?.zoneId ?? null}
        markerShape={contextTarget?.marker_shape ?? resolvedShape}
        onClose={() => setContextMenu(null)}
        onShapeChange={(shape) => {
          if (contextMenu?.zoneId == null || !onMarkerStyleChange) return;
          const patch = clampStylePatchToArea(contextMenu.zoneId, {
            marker_shape: shape,
          });
          onMarkerStyleChange(contextMenu.zoneId, {
            marker_shape: shape,
            ...patch,
          });
        }}
        onStartResize={handleStartResize}
      />
    </Box>
  );
};

export default React.memo(FOFPLayoutViewer);

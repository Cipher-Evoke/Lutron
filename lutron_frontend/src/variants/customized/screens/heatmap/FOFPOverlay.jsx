// FOFP live read-only overlay layer (Step 6 + Step 7).
//
// Renders a transparent SVG overlay above the floor visualization when
// `fofp_enabled === true`. Markers are interactive: hover shows zone name
// and level %; click opens the area control panel (handled by parent).

import React from "react";
import { DEFAULT_FOFP_MARKER_COLOR, normalizeFofpHex } from "./fofpColorUtils";
import {
  formatFofpMarkerTooltip,
} from "./fofpZoneInteraction";
import {
  buildFofpGlowFilters,
  FOFP_TRANSITION,
  getMarkerStyle,
} from "./fofpStatusStyles";
import { resolveFofpMarkerHalfAxes } from "./fofpMarkerDimensions";
import {
  clampFofpMarkerConfigSize,
  FOFPMarkerShape,
  FOFP_DEFAULT_MARKER_SIZE,
  FOFP_FALLBACK_SHAPE,
  resolveFofpMarkerShape,
  resolveFofpShape,
} from "./fofpMarkerShapes";

export { formatFofpMarkerTooltip };

const FOFP_DEBUG =
  process.env.NODE_ENV === "development" ||
  process.env.REACT_APP_FOFP_DEBUG === "true";

const HIT_PAD_MULTIPLIER = 1.75;

/**
 * Fail-closed boundary: overlay errors must never take down the floor page.
 */
export class FOFPOverlayBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    if (FOFP_DEBUG) {
      console.error("[FOFP] overlay render error (suppressed):", error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

const isFiniteNum = (v) => typeof v === "number" && Number.isFinite(v);

const sanitizeLightLevel = (v, fallback = null) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100, Math.round(n)));
};

const sanitizeTriState = (v) => {
  if (v === true || v === false) return v;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "on" || s === "true" || s === "occupied") return true;
    if (s === "off" || s === "false" || s === "unoccupied") return false;
  }
  return null;
};

const sanitizePosition = (
  raw,
  globalMarkerSize = FOFP_DEFAULT_MARKER_SIZE,
  configShape = FOFP_FALLBACK_SHAPE
) => {
  if (!raw || typeof raw !== "object") return null;
  const x = Number(raw.x);
  const y = Number(raw.y);
  const zoneId = raw.zone_id != null ? Number(raw.zone_id) : null;
  const areaId = raw.area_id != null ? Number(raw.area_id) : null;
  if (!isFiniteNum(x) || !isFiniteNum(y)) return null;
  if (zoneId == null || !Number.isFinite(zoneId)) return null;
  if (areaId == null || !Number.isFinite(areaId)) return null;

  const zoneName =
    typeof raw.zone_name === "string" && raw.zone_name.trim()
      ? raw.zone_name.trim()
      : `Zone ${zoneId}`;

  const { halfX, halfY, shapeSize } = resolveFofpMarkerHalfAxes(
    raw,
    globalMarkerSize
  );
  const markerShape = resolveFofpMarkerShape(raw.marker_shape, configShape);
  const lightLevel = sanitizeLightLevel(raw.light_level);
  return {
    zoneId,
    areaId,
    zoneName,
    x,
    y,
    size: shapeSize,
    halfX,
    halfY,
    shapeSize: raw.shape_size,
    markerShape,
    lightLevel,
    lightStatus: sanitizeTriState(raw.light_status),
    tooltip: formatFofpMarkerTooltip(zoneName, lightLevel),
  };
};

const FOFPGlowDefs = React.memo(function FOFPGlowDefs({ filters }) {
  const defs = filters && filters.length ? filters : buildFofpGlowFilters();
  return (
    <defs>
      {defs.map(({ id, color, stdDeviation, floodOpacity }) => (
        <filter
          key={id}
          id={id}
          x="-60%"
          y="-60%"
          width="220%"
          height="220%"
        >
          <feGaussianBlur stdDeviation={stdDeviation} result="blur" />
          <feFlood
            floodColor={color}
            floodOpacity={floodOpacity ?? 0.85}
            result="flood"
          />
          <feComposite in="flood" in2="blur" operator="in" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      ))}
    </defs>
  );
});

const FOFPMarkerInteractive = React.memo(
  function FOFPMarkerInteractive({
    position: p,
    shape,
    baseColor,
    onZoneClick,
  }) {
    const style = getMarkerStyle({
      lightLevel: p.lightLevel,
      lightStatus: p.lightStatus,
      baseColor,
    });
    const hitR = Math.max(p.halfX, p.halfY) * HIT_PAD_MULTIPLIER;

    const handleClick = (e) => {
      e.stopPropagation();
      if (typeof onZoneClick === "function") {
        onZoneClick({
          zoneId: p.zoneId,
          areaId: p.areaId,
          zoneName: p.zoneName,
          lightLevel: p.lightLevel,
        });
      }
    };

    return (
      <g
        data-testid={`fofp-marker-${p.zoneId}`}
        style={{ cursor: onZoneClick ? "pointer" : "default", outline: "none" }}
        pointerEvents="all"
        onClick={handleClick}
      >
        <title>{p.tooltip}</title>
        <circle
          cx={p.x}
          cy={p.y}
          r={hitR}
          fill="transparent"
          stroke="none"
          pointerEvents="all"
        />
        <FOFPMarkerShape
          x={p.x}
          y={p.y}
          size={p.halfX}
          sizeY={p.halfY}
          shape={shape}
          style={{
            fill: style.fill,
            stroke: "none",
            strokeWidth: 0,
            opacity: style.opacity,
            filter: style.glowFilterId ? `url(#${style.glowFilterId})` : undefined,
            transition: FOFP_TRANSITION,
          }}
        />
      </g>
    );
  },
  (prev, next) =>
    prev.position === next.position &&
    prev.shape === next.shape &&
    prev.baseColor === next.baseColor &&
    prev.onZoneClick === next.onZoneClick
);

const FOFPOverlay = ({
  enabled,
  positions,
  config,
  width,
  height,
  onZoneClick = null,
  highlightedFofpZone = null,
}) => {
  const renderCountRef = React.useRef(0);
  renderCountRef.current += 1;

  const baseColor = normalizeFofpHex(
    (config && config.marker_color) || DEFAULT_FOFP_MARKER_COLOR
  );
  const glowFilters = buildFofpGlowFilters(baseColor);

  React.useEffect(() => {
    if (!FOFP_DEBUG) return undefined;
    console.debug("[FOFP] overlay mount", {
      enabled,
      positionCount: Array.isArray(positions) ? positions.length : 0,
    });
    return () => {
      console.debug("[FOFP] overlay unmount");
    };
  }, [enabled, positions]);

  if (enabled !== true) return null;
  if (!Array.isArray(positions) || positions.length === 0) return null;

  const w = Number(width);
  const h = Number(height);
  if (!isFiniteNum(w) || !isFiniteNum(h) || w <= 0 || h <= 0) return null;

  const configShape = resolveFofpShape(config && config.shape);
  const globalMarkerSize = clampFofpMarkerConfigSize(
    config && config.marker_size,
    FOFP_DEFAULT_MARKER_SIZE
  );

  const safePositions = [];
  for (let i = 0; i < positions.length; i += 1) {
    const p = sanitizePosition(positions[i], globalMarkerSize, configShape);
    if (p) safePositions.push(p);
  }
  if (safePositions.length === 0) return null;

  return (
    <svg
      data-testid="fofp-overlay-svg"
      width={w}
      height={h}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 3,
        pointerEvents: "none",
      }}
    >
      <FOFPGlowDefs filters={glowFilters} />
      <g data-testid="fofp-overlay-layer" pointerEvents="none">
        {safePositions.map((p) => (
            <FOFPMarkerInteractive
              key={p.zoneId}
              position={p}
              shape={p.markerShape}
              baseColor={baseColor}
              onZoneClick={onZoneClick}
            />
          ))}
      </g>
    </svg>
  );
};

const propsEqual = (prev, next) =>
  prev.enabled === next.enabled &&
  prev.positions === next.positions &&
  prev.width === next.width &&
  prev.height === next.height &&
  prev.onZoneClick === next.onZoneClick &&
  prev.highlightedFofpZone === next.highlightedFofpZone &&
  (prev.config && prev.config.shape) === (next.config && next.config.shape) &&
  (prev.config && prev.config.marker_size) === (next.config && next.config.marker_size) &&
  (prev.config && prev.config.marker_color) === (next.config && next.config.marker_color);

export default React.memo(FOFPOverlay, propsEqual);

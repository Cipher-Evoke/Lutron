/**
 * Shared FOFP SVG marker primitives (lightweight, no canvas).
 * Used by the production overlay and the admin layout viewer.
 */

import React from "react";
import { hexToGlowColor, normalizeFofpHex } from "./fofpColorUtils";

export const FOFP_KNOWN_SHAPES = new Set([
  "circle",
  "glowing_dot",
  "square",
  "triangle",
  "hexagon",
  "bulb",
]);

export const FOFP_FALLBACK_SHAPE = "circle";
export const FOFP_MIN_MARKER_SIZE = 4;
export const FOFP_MAX_MARKER_SIZE = 20;
export const FOFP_DEFAULT_MARKER_SIZE = 5;

export const resolveFofpShape = (shape) => {
  if (typeof shape !== "string") return FOFP_FALLBACK_SHAPE;
  const trimmed = shape.trim().toLowerCase();
  if (!trimmed) return FOFP_FALLBACK_SHAPE;
  return FOFP_KNOWN_SHAPES.has(trimmed) ? trimmed : FOFP_FALLBACK_SHAPE;
};

/** Per-zone / layout sizes: minimum only (no global max). */
export const clampFofpMarkerSizeMin = (
  raw,
  fallback = FOFP_DEFAULT_MARKER_SIZE
) => {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(FOFP_MIN_MARKER_SIZE, Math.round(n));
};

/** Global config default marker_size: keeps legacy 4–20 cap. */
export const clampFofpMarkerConfigSize = (
  raw,
  fallback = FOFP_DEFAULT_MARKER_SIZE
) => {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(
    FOFP_MIN_MARKER_SIZE,
    Math.min(FOFP_MAX_MARKER_SIZE, Math.round(n))
  );
};

/** @deprecated Use clampFofpMarkerSizeMin for layout; clampFofpMarkerConfigSize for config. */
export const clampFofpMarkerSize = clampFofpMarkerSizeMin;

export const calculateFofpFinalMarkerSize = (
  markerShapeSize,
  globalMarkerSize = FOFP_DEFAULT_MARKER_SIZE
) => {
  const markerSize =
    markerShapeSize == null
      ? FOFP_DEFAULT_MARKER_SIZE
      : clampFofpMarkerSizeMin(markerShapeSize);
  const globalSize = clampFofpMarkerConfigSize(globalMarkerSize);
  const globalScale = globalSize / FOFP_DEFAULT_MARKER_SIZE;
  return clampFofpMarkerSizeMin(markerSize * globalScale);
};

/** Per-zone shape: use stored marker_shape when set, else global default. */
export const resolveFofpMarkerShape = (positionShape, globalShape) => {
  if (positionShape != null && String(positionShape).trim()) {
    return resolveFofpShape(positionShape);
  }
  return resolveFofpShape(globalShape);
};

/** Halo scale vs core half-axis for glowing_dot (reads as dot + glow, not a solid circle). */
export const FOFP_GLOWING_DOT_HALO_SCALE = 1.35;
export const FOFP_GLOWING_DOT_CORE_SCALE = 0.62;
export const FOFP_GLOWING_DOT_HALO_COLOR = "#ffee58";
export const FOFP_GLOWING_DOT_HALO_OPACITY = 0.38;

const resolveGlowingDotHaloColor = (fill, haloColor) => {
  if (haloColor != null && String(haloColor).trim()) return haloColor;
  if (fill != null && String(fill).trim()) {
    try {
      return hexToGlowColor(normalizeFofpHex(fill));
    } catch {
      return FOFP_GLOWING_DOT_HALO_COLOR;
    }
  }
  return FOFP_GLOWING_DOT_HALO_COLOR;
};

/**
 * Glowing dot: soft outer halo + smaller bright core.
 */
export const FofpGlowingDotShape = React.memo(function FofpGlowingDotShape({
  x,
  y,
  rx,
  ry,
  fill,
  stroke,
  strokeWidth = 1,
  haloColor = null,
  haloOpacity = FOFP_GLOWING_DOT_HALO_OPACITY,
  filter,
  transition,
  opacity = 1,
}) {
  const coreRx = rx * FOFP_GLOWING_DOT_CORE_SCALE;
  const coreRy = ry * FOFP_GLOWING_DOT_CORE_SCALE;
  const haloRx = rx * FOFP_GLOWING_DOT_HALO_SCALE;
  const haloRy = ry * FOFP_GLOWING_DOT_HALO_SCALE;
  const resolvedHaloColor = resolveGlowingDotHaloColor(fill, haloColor);
  const groupStyle = transition ? { transition } : undefined;

  return (
    <g filter={filter} style={groupStyle} opacity={opacity}>
      <ellipse
        cx={x}
        cy={y}
        rx={haloRx}
        ry={haloRy}
        fill={resolvedHaloColor}
        opacity={haloOpacity}
        stroke="none"
        vectorEffect="non-scaling-stroke"
      />
      <ellipse
        cx={x}
        cy={y}
        rx={coreRx}
        ry={coreRy}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        vectorEffect="non-scaling-stroke"
      />
    </g>
  );
});

/** Per-zone size: absolute shape_size when set, else global marker_size. */
export const resolveFofpMarkerSize = (
  positionSize,
  globalMarkerSize = FOFP_DEFAULT_MARKER_SIZE
) => {
  if (positionSize != null && Number.isFinite(Number(positionSize))) {
    return clampFofpMarkerSizeMin(positionSize);
  }
  return clampFofpMarkerConfigSize(globalMarkerSize);
};

/**
 * Renders one marker at (x, y). `style` may include fill, stroke, strokeWidth,
 * opacity, filter (production overlay), and optional `transition` (CSS string).
 */
export const FOFPMarkerShape = React.memo(function FOFPMarkerShape({
  x,
  y,
  size,
  sizeY = null,
  shape,
  style = {},
}) {
  const rawRx = Number(size);
  const rx = Number.isFinite(rawRx) && rawRx > 0
    ? clampFofpMarkerSizeMin(rawRx)
    : FOFP_DEFAULT_MARKER_SIZE;
  const rawRy = sizeY != null ? Number(sizeY) : rx;
  const ry = Number.isFinite(rawRy) && rawRy > 0
    ? clampFofpMarkerSizeMin(rawRy)
    : rx;
  const resolved = resolveFofpShape(shape);

  const commonProps = {
    fill: style.fill ?? "#43a047",
    stroke: style.stroke ?? "#ffffff",
    strokeWidth: style.strokeWidth ?? 1,
    vectorEffect: "non-scaling-stroke",
    opacity: style.opacity ?? 1,
    filter: style.filter,
    style: style.transition ? { transition: style.transition } : undefined,
  };

  switch (resolved) {
    case "square": {
      return (
        <rect
          x={x - rx}
          y={y - ry}
          width={rx * 2}
          height={ry * 2}
          {...commonProps}
        />
      );
    }
    case "triangle": {
      const pts = [
        `${x},${y - ry}`,
        `${x - rx},${y + ry}`,
        `${x + rx},${y + ry}`,
      ].join(" ");
      return <polygon points={pts} {...commonProps} />;
    }
    case "hexagon": {
      const pts = Array.from({ length: 6 }, (_, i) => {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        return `${x + rx * Math.cos(angle)},${y + ry * Math.sin(angle)}`;
      }).join(" ");
      return <polygon points={pts} {...commonProps} />;
    }
    case "bulb": {
      const stemW = rx * 0.55;
      const stemH = ry * 0.85;
      return (
        <g filter={commonProps.filter} style={commonProps.style} opacity={commonProps.opacity}>
          <ellipse
            cx={x}
            cy={y - ry * 0.35}
            rx={rx * 0.95}
            ry={ry * 0.95}
            fill={commonProps.fill}
            stroke={commonProps.stroke}
            strokeWidth={commonProps.strokeWidth}
            vectorEffect="non-scaling-stroke"
          />
          <rect
            x={x - stemW / 2}
            y={y + ry * 0.15}
            width={stemW}
            height={stemH}
            rx={stemW * 0.15}
            fill={commonProps.fill}
            stroke={commonProps.stroke}
            strokeWidth={commonProps.strokeWidth}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      );
    }
    case "glowing_dot":
      return (
        <FofpGlowingDotShape
          x={x}
          y={y}
          rx={rx}
          ry={ry}
          fill={commonProps.fill}
          stroke={commonProps.stroke}
          strokeWidth={commonProps.strokeWidth}
          filter={commonProps.filter}
          transition={commonProps.style?.transition}
          opacity={commonProps.opacity}
        />
      );
    case "circle":
    default:
      if (rx === ry) {
        return <circle cx={x} cy={y} r={rx} {...commonProps} />;
      }
      return <ellipse cx={x} cy={y} rx={rx} ry={ry} {...commonProps} />;
  }
});

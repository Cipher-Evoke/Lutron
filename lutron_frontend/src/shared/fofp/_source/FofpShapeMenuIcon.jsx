import React from "react";
import {
  FOFPMarkerShape,
  FofpGlowingDotShape,
} from "../../heatmap/fofpMarkerShapes";

const PREVIEW_FILL = "#4fc3f7";
const PREVIEW_STROKE = "#ffffff";
const PREVIEW_SIZE = 8;

/**
 * Small SVG preview of a FOFP marker shape for the context menu grid.
 */
const FofpShapeMenuIcon = React.memo(function FofpShapeMenuIcon({ shape }) {
  const resolved = shape === "glowing_dot" ? "glowing_dot" : shape;

  return (
    <svg
      viewBox="0 0 24 24"
      width={28}
      height={28}
      aria-hidden
      style={{ display: "block" }}
    >
      {resolved === "glowing_dot" ? (
        <FofpGlowingDotShape
          x={12}
          y={12}
          rx={PREVIEW_SIZE}
          ry={PREVIEW_SIZE}
          fill={PREVIEW_FILL}
          stroke={PREVIEW_STROKE}
          strokeWidth={1}
        />
      ) : (
        <FOFPMarkerShape
          x={12}
          y={12}
          size={PREVIEW_SIZE}
          shape={resolved}
          style={{
            fill: PREVIEW_FILL,
            stroke: PREVIEW_STROKE,
            strokeWidth: 1,
          }}
        />
      )}
    </svg>
  );
});

export default FofpShapeMenuIcon;

import React, { useCallback, useRef } from "react";
import { Box } from "@mui/material";
import { clampShadeLevel } from "../../utils/heatmapSidebarUtils";

const SLAT_COUNT = 7;
const OPEN_COLOR = "#b8d4e8";
const CLOSED_COLOR = "#3a3a3a";
const RAIL_COLOR = "#c8c8c8";

export function getSlatColors(level, slatCount = SLAT_COUNT) {
  const clamped = clampShadeLevel(level);
  const openCount = Math.round((clamped / 100) * slatCount);
  return Array.from({ length: slatCount }, (_, index) => {
    const isOpen = index >= slatCount - openCount;
    return isOpen ? OPEN_COLOR : CLOSED_COLOR;
  });
}

export default function ShadeSlatIcon({
  level = 0,
  onChange,
  disabled = false,
  width,
  height,
  isMobile = false,
}) {
  const rootRef = useRef(null);
  const svgWidth = width ?? (isMobile ? 44 : 52);
  const svgHeight = height ?? (isMobile ? 72 : 84);
  const slatGap = 3;
  const slatHeight =
    (svgHeight - slatGap * (SLAT_COUNT - 1) - 8) / SLAT_COUNT;
  const colors = getSlatColors(level, SLAT_COUNT);

  const updateFromClientY = useCallback(
    (clientY) => {
      if (disabled || !onChange || !rootRef.current) return;
      const rect = rootRef.current.getBoundingClientRect();
      const ratio = 1 - (clientY - rect.top) / rect.height;
      onChange(clampShadeLevel(Math.round(ratio * 100)));
    },
    [disabled, onChange]
  );

  const handlePointerDown = (event) => {
    if (disabled) return;
    event.preventDefault();
    updateFromClientY(event.clientY);

    const handleMove = (moveEvent) => updateFromClientY(moveEvent.clientY);
    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  return (
    <Box
      ref={rootRef}
      role="slider"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clampShadeLevel(level)}
      aria-label="Shade level"
      onPointerDown={handlePointerDown}
      sx={{
        width: svgWidth,
        height: svgHeight,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        touchAction: "none",
        userSelect: "none",
        flexShrink: 0,
      }}
    >
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x={4} y={2} width={4} height={svgHeight - 4} fill={RAIL_COLOR} rx={1} />
        <rect
          x={svgWidth - 8}
          y={2}
          width={4}
          height={svgHeight - 4}
          fill={RAIL_COLOR}
          rx={1}
        />
        {colors.map((fill, index) => {
          const y = 4 + index * (slatHeight + slatGap);
          return (
            <rect
              key={index}
              x={10}
              y={y}
              width={svgWidth - 20}
              height={slatHeight}
              fill={fill}
              rx={1}
            />
          );
        })}
      </svg>
    </Box>
  );
}

import { isMarkerVisibleInBounds } from "../../geometry/bounds";
import { resolveFofpMarkerHalfAxes } from "../../../../screens/heatmap/fofpMarkerDimensions";

/**
 * @param {object[]} positions
 * @param {{ minX: number, minY: number, maxX: number, maxY: number } | null} viewBounds
 * @param {number} globalMarkerSize
 */
export const cullPositionsToViewport = (
  positions,
  viewBounds,
  globalMarkerSize = 5
) => {
  if (!viewBounds || !Array.isArray(positions)) return positions;
  return positions.filter((p) => {
    const { halfX, halfY } = resolveFofpMarkerHalfAxes(p, globalMarkerSize);
    const radius = Math.max(halfX, halfY, 4);
    return isMarkerVisibleInBounds(p, viewBounds, radius + 6);
  });
};

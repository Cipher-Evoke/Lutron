/** Grid placement helpers for basic DashboardOverview dynamic layouts. */

export function overviewGridCellSx(row, col) {
  return {
    gridColumn: col,
    gridRow: row,
  };
}

export function overviewFiveGridSpanSx(row, colStart, colEnd) {
  return {
    gridColumn: `${colStart} / ${colEnd}`,
    gridRow: row,
  };
}

export function overviewSevenGridSpanSx(row, colStart, colEnd) {
  return {
    gridColumn: `${colStart} / ${colEnd}`,
    gridRow: row,
  };
}

export function overviewBottomRowTileWidthSx(colsInRow) {
  return {
    width: `calc((100% - ${16 * (colsInRow - 1)}px) / ${colsInRow})`,
    maxWidth: `calc((100% - ${16 * (colsInRow - 1)}px) / ${colsInRow})`,
  };
}

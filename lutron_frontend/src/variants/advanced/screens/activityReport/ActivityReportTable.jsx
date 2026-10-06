import React, { useEffect, useMemo, useState } from "react";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Typography,
  MenuItem,
  Select,
  FormControl,
  Pagination,
} from "@mui/material";
import { selectApplicationTheme } from "../../redux/slice/theme/themeSlice";
import { useSelector } from "react-redux";
import { getThemeButtonColor } from "../../utils/themePageBackground";

const ROWS_PER_PAGE_OPTIONS = [5, 10, 25, 50, 100];

const headCellSx = {
  fontWeight: 700,
  textAlign: "left",
  borderBottom: "2px solid rgba(0,0,0,0.12)",
  background: "var(--activity-report-table-head-bg, #d6dde8)",
  color: "var(--activity-report-table-head-text, #000)",
};

const ActivityReportTable = ({
  rows = [],
  loading = false,
  error = "",
  selectedAreas = [],
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fmtDate = (iso) => {
    if (!iso) return "-";
    const date = new Date(iso);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${day}/${month}/${year}`;
  };
  const fmtTime = (iso) =>
    iso
      ? new Date(iso).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      : "-";

  const appTheme = useSelector(selectApplicationTheme);
  const buttonColor = getThemeButtonColor(
    appTheme?.application_theme?.button,
    appTheme?.application_theme?.background
  );
  const pageTextColor = "var(--activity-report-page-text, #fff)";
  const paginationTextColor = "var(--activity-report-pagination-text, #fff)";

  const safeRows = useMemo(
    () => (Array.isArray(rows) ? rows : []),
    [rows]
  );

  const rowsIdentity = useMemo(() => {
    if (!safeRows.length) return "0";
    const first = safeRows[0];
    const last = safeRows[safeRows.length - 1];
    return `${safeRows.length}:${first?.id ?? first?.created_at}:${last?.id ?? last?.created_at}`;
  }, [safeRows]);

  useEffect(() => {
    setPage(0);
  }, [rowsIdentity]);

  const pageCount = Math.max(1, Math.ceil(safeRows.length / rowsPerPage) || 1);
  const maxPage = Math.max(0, pageCount - 1);
  const currentPage = Math.min(page, maxPage);
  const from = safeRows.length === 0 ? 0 : currentPage * rowsPerPage + 1;
  const to = Math.min(safeRows.length, (currentPage + 1) * rowsPerPage);

  const handleChangePage = (_event, nextPage) => {
    setPage(Math.max(0, nextPage - 1));
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) return <Box sx={{ color: pageTextColor, py: 2 }}>Loading…</Box>;
  if (error) return <Box sx={{ color: "error.main", py: 2 }}>{String(error)}</Box>;

  return (
    <>
      {selectedAreas.length > 0 && (
        <Box
          sx={{
            mb: 2,
            p: 2,
            backgroundColor: "rgba(244, 67, 54, 0.1)",
            border: "1px solid rgba(244, 67, 54, 0.3)",
            borderRadius: 1,
          }}
        >
          <Typography variant="body2" sx={{ color: "#f44336", fontWeight: 500 }}>
            Activity of type User, QuickControl, Schedule & AreaGroup can&apos;t be
            filtered by area.
          </Typography>
        </Box>
      )}

      <Typography sx={{ color: pageTextColor, m: 1, fontWeight: 600 }}>
        Activities
      </Typography>
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: 2,
          overflow: "hidden",
          bgcolor: "var(--activity-report-table-container-bg, #FFFFFF)",
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow
              sx={{
                bgcolor: "var(--activity-report-table-head-bg, #d6dde8)",
                "& .MuiTableCell-head": {
                  color: "var(--activity-report-table-head-text, #000)",
                },
              }}
            >
              <TableCell sx={headCellSx}>Date</TableCell>
              <TableCell sx={headCellSx}>Time</TableCell>
              <TableCell sx={headCellSx}>Area</TableCell>
              <TableCell sx={headCellSx}>Type</TableCell>
              <TableCell sx={headCellSx}>User</TableCell>
              <TableCell sx={headCellSx}>Activity</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {safeRows.length ? (
              safeRows
                .slice(
                  currentPage * rowsPerPage,
                  currentPage * rowsPerPage + rowsPerPage
                )
                .map((r, rowIndex) => (
                  <TableRow
                    key={r.id != null ? String(r.id) : `${r.created_at}-${rowIndex}`}
                    hover
                    sx={{
                      bgcolor:
                        rowIndex % 2 === 0
                          ? "var(--activity-report-table-row-bg, #ffffff)"
                          : "var(--activity-report-table-row-alt-bg, #f5f5f5)",
                      "& .MuiTableCell-root": {
                        color: "var(--activity-report-table-text, #000)",
                        textAlign: "left",
                      },
                    }}
                  >
                    <TableCell>{fmtDate(r.created_at)}</TableCell>
                    <TableCell>{fmtTime(r.created_at)}</TableCell>
                    <TableCell>
                      {[r.floor_name, r.area_name].filter(Boolean).join(" / ")}
                    </TableCell>
                    <TableCell>{r.activity_type || "-"}</TableCell>
                    <TableCell>{r.user_name || "-"}</TableCell>
                    <TableCell>{r.activity_description || "-"}</TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  align="center"
                  sx={{
                    py: 4,
                    color: "var(--activity-report-table-text, #000)",
                  }}
                >
                  No activities found for this filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {safeRows.length > 0 && (
        <Box
          className="activity-report-pagination"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1.5,
            mt: 1,
            mb: "110px",
            px: 1,
            py: 0.5,
            color: paginationTextColor,
            position: "relative",
            zIndex: 2,
            pointerEvents: "auto",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
            <Typography variant="body2" sx={{ color: paginationTextColor }}>
              Showing {from} to {to} of {safeRows.length}
            </Typography>
            <Typography variant="body2" sx={{ color: paginationTextColor }}>
              Rows per page:
            </Typography>
            <FormControl size="small" variant="standard" sx={{ minWidth: 56 }}>
              <Select
                value={rowsPerPage}
                onChange={handleChangeRowsPerPage}
                disableUnderline
                sx={{
                  color: paginationTextColor,
                  "& .MuiSelect-icon": { color: paginationTextColor },
                  "& .MuiSelect-select": {
                    color: paginationTextColor,
                    py: 0.5,
                  },
                }}
              >
                {ROWS_PER_PAGE_OPTIONS.map((n) => (
                  <MenuItem key={n} value={n}>
                    {n}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Pagination
            count={pageCount}
            page={currentPage + 1}
            onChange={handleChangePage}
            color="primary"
            size="small"
            siblingCount={1}
            boundaryCount={1}
            sx={{
              "& .MuiPaginationItem-root": {
                color: paginationTextColor,
                border: "1px solid rgba(255,255,255,0.35)",
              },
              "& .MuiPaginationItem-root.Mui-selected": {
                backgroundColor: buttonColor || undefined,
                color: "#fff",
              },
              "& .MuiPaginationItem-icon": {
                color: paginationTextColor,
              },
            }}
          />
        </Box>
      )}
    </>
  );
};

export default ActivityReportTable;

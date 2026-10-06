import React, { useEffect, useState, useMemo } from "react";
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
  Pagination,
  FormControl,
  Select,
  MenuItem,
} from "@mui/material";
import { selectApplicationTheme } from "../../redux/slice/theme/themeSlice";
import { useSelector } from "react-redux";
import {
  onContentColors,
  DEFAULT_APP_CONTENT,
  isWhiteAreaPickerChrome,
} from "../../utils/themeOnSurface";

const ROWS_PER_PAGE_OPTIONS = [5, 10, 25, 50, 100];

const ActivityReportTable = ({ rows = [], loading = false, error = "", selectedAreas = [] }) => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const fmtDate = (iso) => {
        if (!iso) return "-";
        const date = new Date(iso);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${day}/${month}/${year}`;
    };
    const fmtTime = (iso) => (iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }) : "-");
    const appTheme = useSelector(selectApplicationTheme);
    const contentColor = appTheme?.application_theme?.content || DEFAULT_APP_CONTENT;
    const surface = useMemo(() => onContentColors(contentColor), [contentColor]);
    const isDefaultWhiteTheme = isWhiteAreaPickerChrome(contentColor);

    useEffect(() => {
        setPage(0);
    }, [rows]);

    const totalPages = Math.max(1, Math.ceil(rows.length / rowsPerPage) || 1);
    const safePage = Math.min(page, Math.max(0, totalPages - 1));
    const from = rows.length === 0 ? 0 : safePage * rowsPerPage + 1;
    const to = Math.min(rows.length, (safePage + 1) * rowsPerPage);

    const handleChangePage = (_event, nextPage) => {
        setPage(Math.max(0, nextPage - 1));
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    if (loading) return <Box sx={{ color: surface.primary, py: 2 }}>Loading…</Box>;
    if (error) return <Box sx={{ color: "error.main", py: 2 }}>{String(error)}</Box>;
    return (
        <>
            {selectedAreas.length > 0 && (
                <Box sx={{
                    mb: 2,
                    p: 2,
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    border: '1px solid rgba(244, 67, 54, 0.3)',
                    borderRadius: 1
                }}>
                    <Typography variant="body2" sx={{ color: '#f44336', fontWeight: 500 }}>
                        Activity of type User, QuickControl, Schedule & AreaGroup can't be filtered by area.
                    </Typography>
                </Box>
            )}

            <Typography sx={{ color: surface.primary, m: 1, fontWeight: 600 }}>Activities</Typography>
            <TableContainer
                component={Paper}
                elevation={0}
                sx={{
                    borderRadius: 2,
                    overflow: "hidden",
                    bgcolor: "#FFFFFF",
                    ...(isDefaultWhiteTheme
                        ? {
                              border: "1px solid #1565C0",
                          }
                        : {}),
                }}
            >
                <Table size="small" sx={{
                    "& .MuiTableCell-root": {
                        borderColor: isDefaultWhiteTheme ? "#1565C0" : "inherit"
                    }
                }}>
                    <TableHead>
                        <TableRow sx={{
                            bgcolor: isDefaultWhiteTheme ? "#1565C0" : surface.tableHeadBg,
                            "& .MuiTableCell-head": { 
                                color: isDefaultWhiteTheme ? "#fff" : (surface.isLight ? "rgba(0,0,0,0.87)" : "#fff"),
                                borderColor: isDefaultWhiteTheme ? "#1565C0" : "inherit"
                            },
                        }}>
                            <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Time</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Area</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Activity</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.length ? (
                            rows
                                .slice(safePage * rowsPerPage, safePage * rowsPerPage + rowsPerPage)
                                .map((r) => (
                                    <TableRow key={r.id} hover>
                                        <TableCell>{fmtDate(r.created_at)}</TableCell>
                                        <TableCell>{fmtTime(r.created_at)}</TableCell>
                                        <TableCell>{[r.floor_name, r.area_name].filter(Boolean).join(" / ")}</TableCell>
                                        <TableCell>{r.activity_type || "-"}</TableCell>
                                        <TableCell>{r.user_name || "-"}</TableCell>
                                        <TableCell>{r.activity_description || "-"}</TableCell>
                                    </TableRow>
                                ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 4, color: "black" }}>
                                    No activities found for this filter.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            {rows.length > 0 && (
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 2,
                        py: 1.5,
                        px: 1,
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                        <Typography variant="body2" sx={{ color: surface.primary, fontSize: "14px" }}>
                            Showing {from} to {to} of {rows.length} activities
                        </Typography>
                        <FormControl size="small" sx={{ minWidth: 72 }}>
                            <Select
                                value={rowsPerPage}
                                onChange={handleChangeRowsPerPage}
                                sx={{
                                    color: surface.primary,
                                    "& .MuiOutlinedInput-notchedOutline": {
                                        borderColor: isDefaultWhiteTheme ? "#1565C0" : "rgba(255,255,255,0.35)",
                                    },
                                    "& .MuiSvgIcon-root": {
                                        color: surface.primary,
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
                        <Typography variant="body2" sx={{ color: surface.primary, fontSize: "14px" }}>
                            per page
                        </Typography>
                    </Box>
                    <Pagination
                        count={totalPages}
                        page={safePage + 1}
                        onChange={handleChangePage}
                        color="primary"
                        size="small"
                        siblingCount={1}
                        boundaryCount={1}
                        sx={{
                            "& .MuiPaginationItem-root": {
                                color: surface.primary,
                            },
                            "& .MuiPaginationItem-root.Mui-selected": {
                                backgroundColor: isDefaultWhiteTheme ? "#0d47a1" : undefined,
                                color: isDefaultWhiteTheme ? "#fff" : undefined,
                            },
                        }}
                    />
                </Box>
            )}
        </>
    )
}
export default ActivityReportTable

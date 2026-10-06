// // ActivityReportTable.jsx
// import React, { useEffect } from "react";
// import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, Typography } from "@mui/material";
// import { fetchApplicationTheme, selectApplicationTheme } from "../../redux/slice/theme/themeSlice";
// import { useDispatch } from "react-redux";
// const dispatch = useDispatch()
// const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("en-GB") : "-");
// const fmtTime = (iso) => (iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-");
// const appTheme = useSelector(selectApplicationTheme);
// const backgroundColor = appTheme?.application_theme?.background || '#d2c4a2';
// const contentColor = appTheme?.application_theme?.content || 'rgba(128, 120, 100, 0.7)';
// const buttonColor = appTheme?.application_theme?.button || '#232323'
// export default function ActivityReportTable({ rows = [], loading = false, error = "" }) {
//     useEffect(() => {
//         dispatch(fetchApplicationTheme());
//     }, [dispatch]);
//     if (loading) return <Box sx={{ color: "#fff", py: 2 }}>Loading…</Box>;
//     if (error) return <Box sx={{ color: "error.main", py: 2 }}>{String(error)}</Box>;

//     return (
//         <>
//             <Typography sx={{ color: "white", m: 1, fontWeight: 600 }}>Activities</Typography>
//             <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, overflow: "hidden", bgcolor: "#FFFFFF" }}>
//                 <Table size="small">
//                     <TableHead>
//                         <TableRow sx={{
//                             bgcolor: "backgroundColor"
//                         }}>
//                             <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
//                             <TableCell sx={{ fontWeight: 700 }}>Time</TableCell>
//                             <TableCell sx={{ fontWeight: 700 }}>Area</TableCell>
//                             <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
//                             <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
//                             <TableCell sx={{ fontWeight: 700 }}>Activity</TableCell>
//                         </TableRow>
//                     </TableHead>
//                     <TableBody>
//                         {rows.length ? (
//                             rows.map((r) => (
//                                 <TableRow key={r.id} hover>
//                                     <TableCell>{fmtDate(r.created_at)}</TableCell>
//                                     <TableCell>{fmtTime(r.created_at)}</TableCell>
//                                     <TableCell>{[r.floor_name, r.area_name].filter(Boolean).join(" / ")}</TableCell>
//                                     <TableCell>{r.activity_type || "-"}</TableCell>
//                                     <TableCell>{r.user_name || "-"}</TableCell>
//                                     <TableCell>{r.activity_description || "-"}</TableCell>
//                                 </TableRow>
//                             ))
//                         ) : (
//                             <TableRow>
//                                 <TableCell colSpan={6} align="center" sx={{ py: 4, color: "black" }}>
//                                     No activities found for this filter.
//                                 </TableCell>
//                             </TableRow>
//                         )}
//                     </TableBody>
//                 </Table>
//             </TableContainer>
//         </>
//     );
// }
import React, { useEffect, useState } from "react";
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, Typography, TablePagination } from "@mui/material";
import { selectApplicationTheme } from "../../redux/slice/theme/themeSlice";
import { useDispatch, useSelector } from "react-redux";
const ActivityReportTable = ({ rows = [], loading = false, error = "", selectedAreas = [] }) => {
    const dispatch = useDispatch()
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const fmtDate = (iso) => {
        if (!iso) return "-";
        // Create date in local timezone to avoid timezone conversion issues
        const date = new Date(iso);
        // Use local date components to avoid timezone offset issues
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${day}/${month}/${year}`;
    };
    const fmtTime = (iso) => (iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }) : "-");
    const appTheme = useSelector(selectApplicationTheme);
    const backgroundColor = appTheme?.application_theme?.background || '#d2c4a2';
    const contentColor = appTheme?.application_theme?.content || 'rgba(128, 120, 100, 0.7)';
    const buttonColor = appTheme?.application_theme?.button || '#232323'

    // Reset to first page when rows change
    useEffect(() => {
        setPage(0);
    }, [rows]);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    if (loading) return <Box sx={{ color: "#fff", py: 2 }}>Loading…</Box>;
    if (error) return <Box sx={{ color: "error.main", py: 2 }}>{String(error)}</Box>;
    return (
        <>
            {/* Disclaimer when areas are selected */}
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

            <Typography sx={{ color: "white", m: 1, fontWeight: 600 }}>Activities</Typography>
            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, overflow: "hidden", bgcolor: "#FFFFFF" }}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{
                            bgcolor: backgroundColor
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
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
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
                <TablePagination
                    component="div"
                    count={rows.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[5, 10, 25, 50, 100]}
                    sx={{
                        color: "#fff",
                        "& .MuiTablePagination-select": {
                            color: "#fff",
                        },
                        "& .MuiTablePagination-selectIcon": {
                            color: "#fff",
                        },
                        "& .MuiTablePagination-displayedRows": {
                            color: "#fff",
                        },
                        "& .MuiTablePagination-actions": {
                            color: "#fff",
                        },
                        "& .MuiIconButton-root": {
                            color: "#fff",
                        },
                    }}
                />
            )}
        </>
    )
}
export default ActivityReportTable

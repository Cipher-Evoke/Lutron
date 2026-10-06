/**
 * RenameWidget Component - Widget Renaming Settings Page
 * 
 * Role-Based Sidebar Access:
 * - Superadmin: Can see all sidebar options (Home, Theme, Rename Widget, Manage Area Groups, 
 *   Area Size & Load, Email Server, Users, Floor, Help)
 * - Admin: Can only see restricted options (Rename Widget, Manage Area Groups, 
 *   Area Size & Load, Email Server, Users)
 * - Operator: Can only see restricted options (Rename Widget, Manage Area Groups, 
 *   Area Size & Load, Email Server, Users)
 * 
 * The sidebar filtering is handled by getVisibleSidebarItems() utility function
 * which ensures consistent role-based access control across all settings pages.
 */
// src/screens/settings/RenameWidget.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Grid, Box, Typography, FormControl, Select, MenuItem, TextField, Button,
    Snackbar,
    Alert
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useLocation, useNavigate } from "react-router-dom";
import { SidebarItems, getVisibleSidebarItems } from "../../../utils/sidebarItems";
import { useDispatch, useSelector } from "react-redux";
import { fetchRenameWidgets, getWidgetList, renameWidget, selectRenameWidgetLoading, selectRenameWidgetError } from "../../../redux/slice/settingsslice/heatmap/groupOccupancySlice";
import { UseAuth, getVisibleSidebarItemsWithPaths } from "../../../customhooks/UseAuth";
import { selectProfile } from "../../../redux/slice/auth/userlogin";

export default function RenameWidget() {
    const dispatch = useDispatch();
    const widgetList = useSelector(getWidgetList);
    const renameLoading = useSelector(selectRenameWidgetLoading);
    const renameError = useSelector(selectRenameWidgetError);
    const theme = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [errorSnackbarOpen, setErrorSnackbarOpen] = useState(false);
    
    // Get current user role for sidebar filtering
    const { role: currentUserRole } = UseAuth();
    const userProfile = useSelector(selectProfile);
    const visibleSidebarItemsWithPaths = getVisibleSidebarItemsWithPaths(currentUserRole, userProfile);
    
    // Fallback labels if API is missing
    const widgetTitlesFallback = {
        savings_by_strategy: "Savings by Strategy",
        consumption_by_area_groups: "Consumption By Area Groups",
        light_power_density: "Light Power Density",
        consumption: "Consumption",
        savings: "Savings",
        peak_and_minimum_consumption: "Peak And Minimum Consumption",
        utilization: "Utilization",
        utilization_by_area_group: "Utilization By Area Group",
        utilization_by_area: "Utilization By Area",
        peak_and_minimum_utilization: "Peak And Minimum Utilization",
    };

    const items = useMemo(() => {
        const arr = Array.isArray(widgetList?.titles) ? widgetList.titles : [];
        // normalize shape { key, title, dropdown_name }
        const normalizedItems = arr.map((t) => ({
            key: t.key,
            title: t.title,
            dropdown_name: t.dropdown_name ?? t.title, // fallback
        }));
        return normalizedItems;
    }, [widgetList]);

    const [selectedKey, setSelectedKey] = useState("");
    const [name, setName] = useState("");

    // prefill the text field with the current *title* (not dropdown_name)
    const onSelect = (e) => {
        const key = e.target.value;
        setSelectedKey(key);
        const found = items.find((x) => x.key === key);
        setName(found?.title || "");
    };

    // POST -> refresh list so dropdown_name changes only after success
    const handleUpdate = async () => {
        if (!selectedKey || !name.trim()) return;
        
        try {
            const result = await dispatch(
                renameWidget({ widget_key: selectedKey, new_name: name.trim() })
            ).unwrap();
            // fetch fresh labels from backend; dropdown_name will update here
            dispatch(fetchRenameWidgets());
            setSnackbarOpen(true);
            // Clear the form after successful rename
            setSelectedKey("");
            setName("");
        } catch (err) {
            setErrorSnackbarOpen(true);
        }
    };

    useEffect(() => {
        // Only fetch if not already loaded
        if (!widgetList || (Array.isArray(widgetList) && widgetList.length === 0) || (widgetList && !widgetList.titles)) {
            dispatch(fetchRenameWidgets());
        }
    }, [dispatch, widgetList]);

    // Monitor for rename errors
    useEffect(() => {
        if (renameError) {
            setErrorSnackbarOpen(true);
        }
    }, [renameError]);

    // shared UI styles
    const controlSx = {
        "& .MuiOutlinedInput-root": {
            backgroundColor: "#fff",
            borderRadius: "8px",
            "& .MuiSelect-select, & .MuiOutlinedInput-input": {
                padding: "8px 10px",
                lineHeight: 1.4,
                fontSize: 14,
            },
            "& fieldset": { borderColor: "rgba(0,0,0,0.2)" },
            "&:hover fieldset": { borderColor: "rgba(0,0,0,0.35)" },
            "&.Mui-focused fieldset": { borderColor: "#1E1E1E", borderWidth: 1.5 },
        },
        "& input::placeholder": { opacity: 1, color: "rgba(0,0,0,0.5)" },
    };

    // keep dropdown same width as select (optional polish)
    const selectRef = useRef(null);
    const menuProps = {
        anchorEl: selectRef.current || undefined,
        anchorOrigin: { vertical: "bottom", horizontal: "left" },
        transformOrigin: { vertical: "top", horizontal: "left" },
        PaperProps: {
            sx: {
                bgcolor: "#fff",
                color: "#000",
                borderRadius: 1,
                boxShadow: "0 8px 24px rgba(0,0,0,.18)",
                border: "1px solid rgba(0,0,0,.08)",
                maxHeight: 320,
                "& .MuiMenuItem-root": { color: "#000" },
            },
            style: {
                width: selectRef.current ? selectRef.current.offsetWidth : undefined,
            },
        },
    };

    return (
        <Grid container sx={{ alignItems: "flex-start" ,ml:'18px',p:'18px'}}>
            {/* Sidebar */}
            <Grid item xs={12} md={3}>
                <Typography variant="h6" sx={{
                            mb: { xs: 0.8, sm: 1, md: 1.5, lg: 2 },
                            color: theme.palette.text.secondary,
                            fontSize: 24,
                            fontWeight: 600,
                            letterSpacing: 0.5,
                            paddingTop: "18px",
                            marginBottom: 16
                        }}>
                    Settings
                </Typography>
                {visibleSidebarItemsWithPaths.map((item) => (
                    <Box
                        key={item.label}
                        onClick={() => {
                            if (item.path) navigate(item.path);
                        }}
                        sx={{
                            backgroundColor:
                                location.pathname === item.path
                                    ? theme.palette.custom.containerBg
                                    : "transparent",
                            color:
                                location.pathname === item.path
                                    ? theme.palette.text.primary
                                    : theme.palette.text.secondary,
                            px: 2,
                            py: 1,
                            borderRadius: 0.5,
                            mb: 0.8,
                            fontSize: 14,
                            fontWeight: location.pathname === item.path ? 600 : 400,
                            cursor: "pointer",
                            "&:hover": { backgroundColor: theme.palette.custom.containerBg },
                        }}
                    >
                        {item.label}
                    </Box>
                ))}
            </Grid>

            {/* Right panel */}
            <Grid item xs={12} md={9} sx={{ p: 3, borderTopRightRadius: 2, borderBottomRightRadius: 2 }}>
                <Box sx={{ maxWidth: 900 }}>
                    {/* headings */}
                    <Grid container spacing={2} alignItems="center" sx={{ mb: 1 }}>
                        <Grid item xs={12} md={5.5}>
                            <Typography sx={{ color: "#fff", fontWeight: 500, fontSize: 14 }}>
                                Select Widget To Rename
                            </Typography>
                        </Grid>
                        <Grid item xs={12} md={5.5}>
                            <Typography sx={{ color: "#fff", fontWeight: 500, fontSize: 14 }}>
                                Type Name
                            </Typography>
                        </Grid>
                        <Grid item xs={12} md={1} />
                    </Grid>

                    {/* inputs */}
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={5.5}>
                            <FormControl fullWidth size="small" sx={controlSx}>
                                <Select
                                    value={selectedKey}
                                    onChange={onSelect}
                                    MenuProps={{
                                        PaperProps: {
                                            sx: {
                                                bgcolor: "#fff",
                                                color: "#000",
                                                borderRadius: 1,
                                                boxShadow: "0 8px 24px rgba(0,0,0,.18)",
                                                border: "1px solid rgba(0,0,0,.08)",
                                                maxHeight: 320,
                                                "& .MuiMenuItem-root": { color: "#000" },
                                            },
                                        },
                                    }}
                                    renderValue={(val) => {
                                        if (!val) return "";
                                        const f = items.find((x) => x.key === val);
                                        return f?.dropdown_name || f?.title || "";
                                    }}
                                >
                                    {items.map(({ key, dropdown_name }) => (
                                        <MenuItem key={key} value={key}>
                                            {dropdown_name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                        </Grid>

                        <Grid item xs={12} md={5.5}>
                            <TextField
                                fullWidth
                                size="small"
                                variant="outlined"
                                placeholder="New Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                sx={controlSx}
                            />
                        </Grid>

                        <Grid item xs={12} md={1} sx={{ display: "flex", alignItems: "center" }}>
                            <Button
                                variant="contained"
                                onClick={handleUpdate}
                                disabled={!selectedKey || !name.trim() || renameLoading}
                                sx={{
                                    minWidth: 80,
                                    height: 34,
                                    borderRadius: "8px",
                                    bgcolor: "#232323",
                                    color: "#fff",
                                    textTransform: "none",
                                    "&:hover": { bgcolor: "#1E1E1E" },
                                }}
                            >
                                {renameLoading ? "Saving..." : "Save"}
                            </Button>
                        </Grid>
                    </Grid>
                </Box>
                <Snackbar
                    open={snackbarOpen}
                    autoHideDuration={3000}
                    onClose={() => setSnackbarOpen(false)}
                    anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                >
                    <Alert
                        onClose={() => setSnackbarOpen(false)}
                        severity="success"
                        variant="filled"
                        sx={{ width: "100%" }}
                    >
                        Widget Renamed Successfully!
                    </Alert>
                </Snackbar>
                
                {/* Error Snackbar */}
                <Snackbar
                    open={errorSnackbarOpen}
                    autoHideDuration={5000}
                    onClose={() => setErrorSnackbarOpen(false)}
                    anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                >
                    <Alert
                        onClose={() => setErrorSnackbarOpen(false)}
                        severity="error"
                        variant="filled"
                        sx={{ width: "100%" }}
                    >
                        {renameError || "Failed to rename widget. Please try again."}
                    </Alert>
                </Snackbar>
            </Grid>
        </Grid>
    );
}

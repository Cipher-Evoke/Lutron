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
    Alert,
    FormControlLabel,
    Switch,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
} from "@mui/material";
import LinkIcon from "@mui/icons-material/Link";
import CloseIcon from "@mui/icons-material/Close";
import { useTheme } from "@mui/material/styles";
import { useLocation, useNavigate } from "react-router-dom";
import { SidebarItems, getVisibleSidebarItems } from "../../../utils/sidebarItems";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchRenameWidgets,
    fetchWidgetConfiguration,
    getWidgetList,
    renameWidget,
    selectRenameWidgetLoading,
    selectRenameWidgetError,
    selectWidgetConfigurationStatus,
} from "../../../redux/slice/settingsslice/heatmap/groupOccupancySlice";
import { UseAuth } from "../../../customhooks/UseAuth";
import SettingsLayout from "../SettingsLayout";
import { selectProfile } from "../../../redux/slice/auth/userlogin";
import {
    useDashboardWidgetVisibility,
    inferWidgetVisibilitySection,
    normalizeDashboardWidgetKey,
    normalizeSettingsWidgetListItems,
    resolveSettingsWidgetDisplayName,
} from "../../../utils/dashboardWidgetVisibility";
import { dispatchFetchWidgetConfigurationOnce } from "../../../../../shared/utils/bootstrapFetchGuards";
import {
    DEFAULT_SHADES_CO2_CONSTANT,
    DEFAULT_SHADES_WIDGET_NAME,
    getShadesCo2Constant,
    getShadesWidgetDescription,
    getShadesWidgetHyperlink,
    getShadesWidgetImage,
    getShadesWidgetName,
    notifyShadesSettingsChanged,
    readImageFileAsDataUrl,
    SHADES_CO2_CONSTANT_KEY,
    SHADES_DESCRIPTION_KEY,
    SHADES_HYPERLINK_KEY,
    SHADES_IMAGE_KEY,
    SHADES_NAME_KEY,
} from "../../../utils/shadesWidgetSettings";
import { ENABLE_CUSTOM_ENERGY_SPACE_GRAPHS } from "../../../config/featureFlags";
import CustomGraphSettingsPanel from "../../../../../shared/settings/customGraph/CustomGraphSettingsPanel";
import {
    fetchCustomGraphs,
    createCustomGraph,
    deleteCustomGraph,
    selectCustomGraphs,
    selectCustomGraphsLoading,
    selectCustomGraphsError,
} from "../../../redux/slice/settingsslice/heatmap/groupOccupancySlice";
import { createSingleFlight } from "../../../../../shared/utils/createSingleFlight";

const capitalizeFirstLetter = (str) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
};

export default function RenameWidget() {
    const dispatch = useDispatch();
    const widgetList = useSelector(getWidgetList);
    const widgetConfigurationStatus = useSelector(selectWidgetConfigurationStatus);
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

    // Fallback labels if API is missing
    const widgetTitlesFallback = {
        savings_by_strategy: "Savings by Strategy",
        consumption_by_area_groups: "Consumption By Area Groups",
        total_consumption_by_group: "Consumption by area groups",
        consumption_saving: "Energy (Combined)",
        light_power_density: "Light Power Density",
        consumption: "Consumption",
        savings: "Savings",
        peak_and_minimum_consumption: "Peak & Minimum Consumption",
        utilization: "Utilization",
        utilization_by_area_group: "Utilization By Area Group",
        utilization_by_area: "Utilization By Area",
        peak_and_minimum_utilization: "Peak And Minimum Utilization",
        instant_utilization_combined: "Space Utilization (Combined)",
        instant_occupancy_count: "Occupancy",
    };

    const items = useMemo(() => {
        const arr = Array.isArray(widgetList?.titles)
            ? widgetList.titles
            : Array.isArray(widgetList)
                ? widgetList
                : [];
        const syntheticKeys = [
            "instant_utilization_combined",
            "total_consumption_by_group",
            "consumption_saving",
            "instant_occupancy_count",
            "light_power_density",
            "peak_and_minimum_consumption",
        ];
        const normalizedItems = normalizeSettingsWidgetListItems(arr, {
            fallbackMap: widgetTitlesFallback,
            syntheticKeys,
        });
        return normalizedItems.map((row) => {
            if (row.key !== "total_consumption_by_group") return row;
            const fb = widgetTitlesFallback.total_consumption_by_group;
            const t = (row.title || "").trim();
            const dd = (row.dropdown_name || "").trim();
            const legacy =
                !t ||
                t.toLowerCase() === "consumption by area groups" ||
                t === widgetTitlesFallback.consumption_by_area_groups;
            const legacyDd =
                !dd ||
                dd.toLowerCase() === "consumption by area groups" ||
                dd === widgetTitlesFallback.consumption_by_area_groups;
            if (legacy && legacyDd) {
                return { ...row, title: fb, dropdown_name: fb };
            }
            return {
                ...row,
                dropdown_name: row.dropdown_name || row.title || fb,
            };
        });
    }, [widgetList]);

    const visibilityRowLabel = (row) =>
        capitalizeFirstLetter(
            resolveSettingsWidgetDisplayName(
                row.canonicalKey || normalizeDashboardWidgetKey(row.key),
                row.title,
                row.dropdown_name || row.title,
                widgetTitlesFallback
            )
        );

    const { isWidgetVisible, setWidgetVisible } = useDashboardWidgetVisibility();

    useEffect(() => {
        const consumptionOn = isWidgetVisible("consumption");
        const savingsByStrategyOn = isWidgetVisible("savings_by_strategy");
        const anyEnergyIndividualOn = consumptionOn || savingsByStrategyOn;
        if (anyEnergyIndividualOn && isWidgetVisible("consumption_saving")) {
            setWidgetVisible("consumption_saving", false);
        }

        const occupancyOn = isWidgetVisible("instant_occupancy_count");
        const utilizationByAreaOn = isWidgetVisible("utilization_by_area");
        const anyOneSpaceOn = occupancyOn || utilizationByAreaOn;
        if (anyOneSpaceOn && isWidgetVisible("instant_utilization_combined")) {
            setWidgetVisible("instant_utilization_combined", false);
        }
    }, [isWidgetVisible, setWidgetVisible]);

    const visibilityGroups = useMemo(() => {
        const energy = [];
        const space = [];
        const other = [];
        for (const t of items) {
            const canonicalKey = normalizeDashboardWidgetKey(t.key);
            const sec = inferWidgetVisibilitySection(canonicalKey);
            const row = { ...t, canonicalKey };
            if (sec === "energy") energy.push(row);
            else if (sec === "space") space.push(row);
            else other.push(row);
        }
        return { energy, space, other };
    }, [items]);

    const [selectedKey, setSelectedKey] = useState("");
    const [name, setName] = useState("");
    const [shadesDialogOpen, setShadesDialogOpen] = useState(false);
    const [shadesHyperlink, setShadesHyperlink] = useState("");
    const [shadesName, setShadesName] = useState("");
    const [shadesCo2Constant, setShadesCo2Constant] = useState(
        String(DEFAULT_SHADES_CO2_CONSTANT)
    );
    const [shadesImageUrl, setShadesImageUrl] = useState("");
    const [shadesDescription, setShadesDescription] = useState("");
    const [shadesImageError, setShadesImageError] = useState("");

    // prefill the text field with the current *title* (not dropdown_name)
    const onSelect = (e) => {
        const key = e.target.value;
        setSelectedKey(key);
        const found = items.find((x) => x.key === key);
        setName(found?.title || "");
    };

    // POST -> refresh list so dropdown_name changes only after success
    const runUpdateOnce = useMemo(() => createSingleFlight(), []);
    const handleUpdate = async () => runUpdateOnce(async () => {
        if (!selectedKey || !name.trim()) return;

        try {
            await dispatch(
                renameWidget({ widget_key: selectedKey, new_name: name.trim() })
            ).unwrap();
            // fetch fresh labels from backend; dropdown_name will update here
            await dispatch(fetchRenameWidgets()).unwrap();
            setSnackbarOpen(true);
            // Clear the form after successful rename
            setSelectedKey("");
            setName("");
        } catch (err) {
            setErrorSnackbarOpen(true);
        }
    });

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

    useEffect(() => {
        if (widgetConfigurationStatus === 'idle') {
            dispatchFetchWidgetConfigurationOnce(dispatch, fetchWidgetConfiguration);
        }
    }, [dispatch, widgetConfigurationStatus]);

    useEffect(() => {
        if (shadesDialogOpen) {
            setShadesHyperlink(getShadesWidgetHyperlink());
            const currentName = getShadesWidgetName();
            setShadesName(currentName === DEFAULT_SHADES_WIDGET_NAME ? "" : currentName);
            setShadesCo2Constant(String(getShadesCo2Constant()));
            setShadesImageUrl(getShadesWidgetImage());
            setShadesDescription(getShadesWidgetDescription());
            setShadesImageError("");
        }
    }, [shadesDialogOpen]);

    const handleShadesImageChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const dataUrl = await readImageFileAsDataUrl(file);
            setShadesImageUrl(dataUrl);
            setShadesImageError("");
        } catch (err) {
            setShadesImageError(err?.message || "Could not load image.");
        }
        e.target.value = "";
    };

    const handleSaveShadesHyperlink = () => {
        try {
            if (shadesHyperlink.trim()) {
                localStorage.setItem(SHADES_HYPERLINK_KEY, shadesHyperlink.trim());
            } else {
                localStorage.removeItem(SHADES_HYPERLINK_KEY);
            }
            if (shadesName.trim()) {
                localStorage.setItem(SHADES_NAME_KEY, shadesName.trim());
            } else {
                localStorage.removeItem(SHADES_NAME_KEY);
            }
            const parsedCo2 = Number(shadesCo2Constant);
            if (Number.isFinite(parsedCo2) && parsedCo2 >= 0) {
                localStorage.setItem(SHADES_CO2_CONSTANT_KEY, String(parsedCo2));
            }
            if (shadesImageUrl) {
                localStorage.setItem(SHADES_IMAGE_KEY, shadesImageUrl);
            } else {
                localStorage.removeItem(SHADES_IMAGE_KEY);
            }
            const description = shadesDescription.trim();
            if (description) {
                localStorage.setItem(SHADES_DESCRIPTION_KEY, description);
            } else {
                localStorage.removeItem(SHADES_DESCRIPTION_KEY);
            }
            notifyShadesSettingsChanged();
            setSnackbarOpen(true);
            setShadesDialogOpen(false);
        } catch (e) {
            console.error(e);
            setErrorSnackbarOpen(true);
        }
    };

    const panelText = "var(--settings-panel-text, #1c2330)";
    const panelMuted = "var(--settings-panel-muted-text, rgba(0,0,0,0.7))";

    // shared UI styles
    const controlSx = {
        "& .MuiOutlinedInput-root": {
            backgroundColor: "var(--users-input-bg, #fff)",
            borderRadius: "8px",
            "& .MuiSelect-select, & .MuiOutlinedInput-input": {
                padding: "8px 10px",
                lineHeight: 1.4,
                fontSize: 14,
                color: "var(--settings-panel-text, #1c2330)",
            },
            "& fieldset": { borderColor: "var(--users-border, rgba(0,0,0,0.2))" },
            "&:hover fieldset": { borderColor: "var(--home-tab-active-color, rgba(0,0,0,0.35))" },
            "&.Mui-focused fieldset": { borderColor: "var(--home-tab-active-color, #1E1E1E)", borderWidth: 1.5 },
        },
        "& input::placeholder": {
            opacity: 1,
            color: "var(--settings-panel-muted-text, rgba(0,0,0,0.5))",
        },
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
        <>
        <SettingsLayout>
                <Box sx={{ maxWidth: 900 }}>
                    {/* headings */}
                    <Grid container spacing={2} alignItems="center" sx={{ mb: 1 }}>
                        <Grid item xs={12} md={5.5}>
                            <Typography sx={{ color: "var(--settings-panel-text, #1c2330)", fontWeight: 500, fontSize: 14 }}>
                                Select Widget To Rename
                            </Typography>
                        </Grid>
                        <Grid item xs={12} md={5.5}>
                            <Typography sx={{ color: "var(--settings-panel-text, #1c2330)", fontWeight: 500, fontSize: 14 }}>
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
                                                bgcolor: "var(--users-select-menu-bg, #fff)",
                                                color: "var(--settings-panel-text, #1c2330)",
                                                borderRadius: 1,
                                                boxShadow: "0 8px 24px rgba(0,0,0,.18)",
                                                border: "1px solid var(--users-border, rgba(0,0,0,.08))",
                                                maxHeight: 320,
                                                "& .MuiMenuItem-root": { color: "var(--settings-panel-text, #1c2330)" },
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
                                    bgcolor: "var(--settings-panel-button-bg, #232323)",
                                    color: "var(--settings-panel-button-text, #fff) !important",
                                    textTransform: "none",
                                    border: "1px solid var(--area-groups-border, transparent)",
                                    boxShadow: "none",
                                    "&:hover": {
                                        bgcolor: "var(--settings-panel-button-bg, #1E1E1E)",
                                        filter: "brightness(0.92)",
                                    },
                                    "&.Mui-disabled": {
                                        bgcolor: "var(--settings-panel-button-bg, #232323)",
                                        color: "var(--settings-panel-button-text, #fff) !important",
                                        opacity: 0.45,
                                    },
                                }}
                            >
                                {renameLoading ? "Saving..." : "Save"}
                            </Button>
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 4, maxWidth: 900 }}>
                        <Typography sx={{ color: panelText, fontWeight: 600, fontSize: 16, mb: 1 }}>
                            Dashboard chart visibility
                        </Typography>
                        <Typography sx={{ color: panelMuted, fontSize: 13, mb: 2, lineHeight: 1.45 }}>
                            Show or hide charts on the Energy and Space Utilization tabs, and overview tiles listed below. Alerts and all other behavior stay the same.
                        </Typography>
                        {[
                            {
                                title: "Dashboard Overview",
                                rows: [
                                    { key: "energy", canonicalKey: "energy", title: "Energy", dropdown_name: "Energy" },
                                    { key: "alerts", canonicalKey: "alerts", title: "Alerts", dropdown_name: "Alerts" },
                                    { key: "schedules", canonicalKey: "schedules", title: "Schedules", dropdown_name: "Schedules" },
                                    { key: "quick_controls", canonicalKey: "quick_controls", title: "Quick Controls", dropdown_name: "Quick Controls" },
                                    { key: "shades", canonicalKey: "shades", title: DEFAULT_SHADES_WIDGET_NAME, dropdown_name: DEFAULT_SHADES_WIDGET_NAME },
                                    // { key: "floors", canonicalKey: "floors", title: "Floors", dropdown_name: "Floors" },
                                    { key: "space_utilization", canonicalKey: "space_utilization", title: "Space Utilization", dropdown_name: "Space Utilization" },
                                ],
                            },
                            { title: "Energy dashboard", rows: visibilityGroups.energy },
                            { title: "Space utilization dashboard", rows: visibilityGroups.space },
                            ...(visibilityGroups.other.length
                                ? [{ title: "Other widgets", rows: visibilityGroups.other }]
                                : []),
                        ]
                            .filter((s) => s.rows.length > 0)
                            .map((section) => (
                                <Box key={section.title} sx={{ mb: 2.5 }}>
                                    <Typography sx={{ color: panelText, fontWeight: 600, fontSize: 14, mb: 1 }}>
                                        {section.title}
                                    </Typography>
                                    <Grid container spacing={1} columnSpacing={2}>
                                        {section.rows.map((row) => {
                                            const consumptionOn = isWidgetVisible("consumption");
                                            const savingsByStrategyOn = isWidgetVisible("savings_by_strategy");
                                            const anyEnergyIndividualOn = consumptionOn || savingsByStrategyOn;
                                            const rowCanonical =
                                                row.canonicalKey || normalizeDashboardWidgetKey(row.key);
                                            const disableCombinedEnergyToggle =
                                                rowCanonical === "consumption_saving" && anyEnergyIndividualOn;

                                            const occupancyOn = isWidgetVisible("instant_occupancy_count");
                                            const utilizationByAreaOn = isWidgetVisible("utilization_by_area");
                                            const anyOneSpaceOn = occupancyOn || utilizationByAreaOn;
                                            const disableCombinedSpaceToggle =
                                                row.key === "instant_utilization_combined" && anyOneSpaceOn;

                                            return (
                                                <Grid item xs={12} sm={6} key={row.key}>
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                        <FormControlLabel
                                                            sx={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                ml: 0,
                                                                mr: 0,
                                                                color: panelText,
                                                                "& .MuiFormControlLabel-label": {
                                                                    color: panelText,
                                                                    fontSize: 14,
                                                                },
                                                            }}
                                                            control={
                                                                <Switch
                                                                    checked={isWidgetVisible(
                                                                        row.canonicalKey || row.key
                                                                    )}
                                                                    onChange={(e) =>
                                                                        setWidgetVisible(
                                                                            row.canonicalKey ||
                                                                                normalizeDashboardWidgetKey(
                                                                                    row.key
                                                                                ),
                                                                            e.target.checked
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        disableCombinedEnergyToggle ||
                                                                        disableCombinedSpaceToggle
                                                                    }
                                                                    color="primary"
                                                                />
                                                            }
                                                            label={visibilityRowLabel(row)}
                                                        />
                                                        {row.key === "shades" && (
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => setShadesDialogOpen(true)}
                                                                sx={{
                                                                    color: "var(--home-tab-active-color, #1565C0)",
                                                                    border: "1px solid",
                                                                    borderColor: "var(--users-border, rgba(0,0,0,0.15))",
                                                                    borderRadius: "6px",
                                                                    p: "4px",
                                                                    ml: 0.5,
                                                                }}
                                                            >
                                                                <LinkIcon sx={{ fontSize: 16 }} />
                                                            </IconButton>
                                                        )}
                                                    </Box>
                                                </Grid>
                                            );
                                        })}
                                    </Grid>
                                </Box>
                            ))}
                        {ENABLE_CUSTOM_ENERGY_SPACE_GRAPHS ? (
                            <CustomGraphSettingsPanel
                                variant="advanced"
                                fetchCustomGraphs={fetchCustomGraphs}
                                createCustomGraph={createCustomGraph}
                                deleteCustomGraph={deleteCustomGraph}
                                selectCustomGraphs={selectCustomGraphs}
                                selectCustomGraphsLoading={selectCustomGraphsLoading}
                                selectCustomGraphsError={selectCustomGraphsError}
                            />
                        ) : null}
                    </Box>
                </Box>
        </SettingsLayout>

                <Dialog
                    open={shadesDialogOpen}
                    onClose={() => setShadesDialogOpen(false)}
                    PaperProps={{
                        sx: {
                            borderRadius: "12px",
                            padding: "8px",
                            width: "440px",
                            maxWidth: "90%",
                        },
                    }}
                >
                    <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1, pt: 1.5, px: 2 }}>
                        <Typography sx={{ fontSize: 16, fontWeight: 600, color: panelText }}>
                            External Link
                        </Typography>
                        <IconButton size="small" onClick={() => setShadesDialogOpen(false)}>
                            <CloseIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                    </DialogTitle>
                    <Box sx={{ height: "1px", backgroundColor: "var(--users-border, rgba(0,0,0,0.08))", mx: 2 }} />
                    <DialogContent sx={{ pt: 2.5, pb: 1.5, px: 2 }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 500, color: panelText, mb: 1 }}>
                            Rename Widget
                        </Typography>
                        <TextField
                            fullWidth
                            size="small"
                            variant="outlined"
                            placeholder="Enter new widget name (e.g. External Link)"
                            value={shadesName}
                            onChange={(e) => setShadesName(e.target.value)}
                            sx={{ ...controlSx, mb: 2 }}
                        />
                        <Typography sx={{ fontSize: 13, fontWeight: 500, color: panelText, mb: 1 }}>
                            Image (optional, max 400 KB)
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                            <Button variant="outlined" component="label" size="small" sx={{ textTransform: "none" }}>
                                Choose image
                                <input type="file" accept="image/*" hidden onChange={handleShadesImageChange} />
                            </Button>
                            {shadesImageUrl ? (
                                <Box
                                    component="img"
                                    src={shadesImageUrl}
                                    alt=""
                                    sx={{ width: 48, height: 48, objectFit: "contain", borderRadius: 1, border: "1px solid #e5e7eb" }}
                                />
                            ) : null}
                            {shadesImageUrl ? (
                                <Button
                                    size="small"
                                    onClick={() => setShadesImageUrl("")}
                                    sx={{ textTransform: "none" }}
                                >
                                    Remove
                                </Button>
                            ) : null}
                        </Box>
                        {shadesImageError ? (
                            <Typography sx={{ fontSize: 12, color: "error.main", mb: 2 }}>
                                {shadesImageError}
                            </Typography>
                        ) : null}
                        <Typography sx={{ fontSize: 13, fontWeight: 500, color: panelText, mb: 1 }}>
                            Description (optional)
                        </Typography>
                        <TextField
                            fullWidth
                            size="small"
                            variant="outlined"
                            multiline
                            minRows={2}
                            placeholder="Short text shown on the External Link tile"
                            value={shadesDescription}
                            onChange={(e) => setShadesDescription(e.target.value)}
                            sx={{ ...controlSx, mb: 2 }}
                        />
                        <Typography sx={{ fontSize: 13, fontWeight: 500, color: panelText, mb: 1 }}>
                            Hyperlink URL
                        </Typography>
                        <TextField
                            fullWidth
                            size="small"
                            variant="outlined"
                            placeholder="https://"
                            value={shadesHyperlink}
                            onChange={(e) => setShadesHyperlink(e.target.value)}
                            sx={controlSx}
                        />
                        <Typography sx={{ fontSize: 11, color: panelMuted, mt: 1 }}>
                            Enter the Quantum Vue floorplan hyperlink for Shades.
                        </Typography>
                        <Typography sx={{ fontSize: 13, fontWeight: 500, color: panelText, mb: 1, mt: 2.5 }}>
                            CO₂ constant (kg per kWh)
                        </Typography>
                        <TextField
                            fullWidth
                            size="small"
                            variant="outlined"
                            type="number"
                            inputProps={{ min: 0, step: 0.01 }}
                            placeholder={String(DEFAULT_SHADES_CO2_CONSTANT)}
                            value={shadesCo2Constant}
                            onChange={(e) => setShadesCo2Constant(e.target.value)}
                            sx={controlSx}
                        />
                        <Typography sx={{ fontSize: 11, color: panelMuted, mt: 1 }}>
                            Multiplied by instantaneous energy savings (kW) to show CO₂ on the Shades widget.
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ px: 2, pb: 1.5, pt: 0.5, gap: 1 }}>
                        <Button variant="outlined" onClick={() => setShadesDialogOpen(false)} sx={{ textTransform: "none" }}>
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleSaveShadesHyperlink}
                            sx={{
                                textTransform: "none",
                                bgcolor: "var(--settings-panel-button-bg, #232323)",
                                color: "var(--settings-panel-button-text, #fff)",
                            }}
                        >
                            Save
                        </Button>
                    </DialogActions>
                </Dialog>
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
        </>
    );
}

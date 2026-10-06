/**
 * RenameWidget Component - Widget Renaming Settings Page
 * 
 * Role-Based Sidebar Access:
 * - Superadmin: Can see all sidebar options (Home, Theme, Widgets, Area Groups,
 *   Area Size for Energy, Email Server, User Management, Floors, Help)
 * - Admin / Operator: see getVisibleSidebarItems in utils/sidebarItems.jsx
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
    useMediaQuery,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
} from "@mui/material";
import LinkIcon from "@mui/icons-material/Link";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useTheme } from "@mui/material/styles";
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
import { dispatchFetchWidgetConfigurationOnce } from "../../../../../shared/utils/bootstrapFetchGuards";
import { UseAuth, getVisibleSidebarItemsWithPaths } from "../../../customhooks/UseAuth";
import { selectProfile } from "../../../redux/slice/auth/userlogin";
import { selectApplicationTheme } from "../../../redux/slice/theme/themeSlice";
import { DEFAULT_APP_CONTENT, isWhiteAreaPickerChrome } from "../../../utils/themeOnSurface";
import { settingsSidebarColumnDividerSx } from "../../../utils/settingsSidebarTabStyles";
import SettingsSidebarNav from "../../../components/SettingsSidebarNav";
import {
    useDashboardWidgetVisibility,
    inferWidgetVisibilitySection,
    normalizeDashboardWidgetKey,
    normalizeSettingsWidgetListItems,
    resolveSettingsWidgetDisplayName,
} from "../../../utils/dashboardWidgetVisibility";
import {
    DEFAULT_SHADES_CO2_CONSTANT,
    DEFAULT_SHADES_WIDGET_NAME,
    getShadesCo2Constant,
    getShadesWidgetDescription,
    getShadesWidgetHyperlink,
    getShadesWidgetImage,
    getShadesWidgetName,
    notifyShadesSettingsChanged,
    SHADES_CO2_CONSTANT_KEY,
    SHADES_DESCRIPTION_KEY,
    SHADES_HYPERLINK_KEY,
    SHADES_IMAGE_KEY,
    SHADES_NAME_KEY,
} from "../../../utils/shadesWidgetSettings";
import {
    CUSTOM_OVERVIEW_WIDGET_TYPES,
    CUSTOM_OVERVIEW_WIDGET_TYPE_LABELS,
    CUSTOM_OVERVIEW_WIDGETS_EVENT,
    ENABLE_CUSTOM_DASHBOARD_OVERVIEW_WIDGETS,
    readCustomOverviewWidgets,
    addCustomOverviewWidget,
    updateCustomOverviewWidget,
    removeCustomOverviewWidget,
    setCustomOverviewWidgetVisible,
    readImageFileAsDataUrl,
} from "../../../utils/customOverviewWidgets";
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
    const appTheme = useSelector(selectApplicationTheme);
    const buttonColor = appTheme?.application_theme?.button || "#232323";
    const contentColor = appTheme?.application_theme?.content || DEFAULT_APP_CONTENT;
    const whiteChrome = isWhiteAreaPickerChrome(contentColor);
    const actionBlue = whiteChrome ? "#1565C0" : buttonColor;
    /** Match Alerts settings: blue thumb/track when on (primary was dark on default white). */
    const widgetVisibilitySwitchSx = useMemo(
        () =>
            whiteChrome
                ? {
                    "& .MuiSwitch-switchBase.Mui-checked": {
                        color: "#1565C0",
                    },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                        backgroundColor: "#90caf9",
                        opacity: 1,
                    },
                }
                : undefined,
        [whiteChrome]
    );
    const theme = useTheme();
    const settingsSidebarMdUp = useMediaQuery(theme.breakpoints.up("md"));
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
        /** Pie / donut by area group — distinct from `consumption_saving` combined bar chart. */
        total_consumption_by_group: "Consumption by area groups",
        /** ConsumptionSavingsCombinedChart (Energy tab combined bar). */
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
            "light_power_density",
            "peak_and_minimum_consumption",
        ];
        const deduped = normalizeSettingsWidgetListItems(arr, {
            fallbackMap: widgetTitlesFallback,
            syntheticKeys,
        });
        return deduped.map((row) => {
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

    // Rule: if Consumption or Savings by Strategy is ON, Energy (Combined) must stay OFF.
    useEffect(() => {
        const consumptionOn = isWidgetVisible("consumption");
        const savingsByStrategyOn = isWidgetVisible("savings_by_strategy");
        const anyEnergyIndividualOn = consumptionOn || savingsByStrategyOn;
        if (anyEnergyIndividualOn && isWidgetVisible("consumption_saving")) {
            // Persist Combined off (remote) so Advanced/Basic stay aligned after refresh.
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
    const [snackbarMessage, setSnackbarMessage] = useState("Widget Renamed Successfully!");

    const [customWidgets, setCustomWidgets] = useState(() => readCustomOverviewWidgets());
    const [customWidgetDialogOpen, setCustomWidgetDialogOpen] = useState(false);
    const [editingCustomWidgetId, setEditingCustomWidgetId] = useState(null);
    const [customFormName, setCustomFormName] = useState("");
    const [customFormType, setCustomFormType] = useState(CUSTOM_OVERVIEW_WIDGET_TYPES.EXTERNAL_LINK);
    const [customFormDescription, setCustomFormDescription] = useState("");
    const [customFormHyperlink, setCustomFormHyperlink] = useState("");
    const [customFormCo2Constant, setCustomFormCo2Constant] = useState(
        String(DEFAULT_SHADES_CO2_CONSTANT)
    );
    const [customFormImageUrl, setCustomFormImageUrl] = useState("");
    const [customFormError, setCustomFormError] = useState("");

    useEffect(() => {
        const refreshCustomWidgets = () => setCustomWidgets(readCustomOverviewWidgets());
        refreshCustomWidgets();
        window.addEventListener(CUSTOM_OVERVIEW_WIDGETS_EVENT, refreshCustomWidgets);
        return () => window.removeEventListener(CUSTOM_OVERVIEW_WIDGETS_EVENT, refreshCustomWidgets);
    }, []);

    const resetCustomWidgetForm = () => {
        setEditingCustomWidgetId(null);
        setCustomFormName("");
        setCustomFormType(CUSTOM_OVERVIEW_WIDGET_TYPES.EXTERNAL_LINK);
        setCustomFormDescription("");
        setCustomFormHyperlink("");
        setCustomFormCo2Constant(String(DEFAULT_SHADES_CO2_CONSTANT));
        setCustomFormImageUrl("");
        setCustomFormError("");
    };

    const openAddCustomWidgetDialog = () => {
        resetCustomWidgetForm();
        setCustomWidgetDialogOpen(true);
    };

    const openEditCustomWidgetDialog = (widget) => {
        setEditingCustomWidgetId(widget.id);
        setCustomFormName(widget.name);
        setCustomFormType(widget.type);
        setCustomFormDescription(widget.description || "");
        setCustomFormHyperlink(widget.hyperlink || "");
        setCustomFormCo2Constant(String(widget.co2Constant ?? DEFAULT_SHADES_CO2_CONSTANT));
        setCustomFormImageUrl(widget.imageUrl || "");
        setCustomFormError("");
        setCustomWidgetDialogOpen(true);
    };

    const handleCustomImageChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const dataUrl = await readImageFileAsDataUrl(file);
            setCustomFormImageUrl(dataUrl);
            setCustomFormError("");
        } catch (err) {
            setCustomFormError(err?.message || "Could not load image.");
        }
        e.target.value = "";
    };

    const handleSaveCustomWidget = () => {
        const name = customFormName.trim();
        if (!name) {
            setCustomFormError("Widget name is required.");
            return;
        }
        if (
            customFormType === CUSTOM_OVERVIEW_WIDGET_TYPES.EXTERNAL_LINK &&
            !customFormHyperlink.trim()
        ) {
            setCustomFormError("Hyperlink URL is required for External Link widgets.");
            return;
        }
        const parsedCo2 = Number(customFormCo2Constant);
        const payload = {
            name,
            type: customFormType,
            description: customFormDescription.trim(),
            hyperlink: customFormHyperlink.trim(),
            imageUrl: customFormImageUrl,
            co2Constant:
                Number.isFinite(parsedCo2) && parsedCo2 >= 0
                    ? parsedCo2
                    : DEFAULT_SHADES_CO2_CONSTANT,
        };
        try {
            if (editingCustomWidgetId) {
                updateCustomOverviewWidget(editingCustomWidgetId, payload);
                setSnackbarMessage("Dashboard Overview widget updated.");
            } else {
                addCustomOverviewWidget(payload);
                setSnackbarMessage("Dashboard Overview widget added.");
            }
            setCustomWidgetDialogOpen(false);
            resetCustomWidgetForm();
            setSnackbarOpen(true);
        } catch (e) {
            console.error(e);
            setErrorSnackbarOpen(true);
        }
    };

    const handleDeleteCustomWidget = (id) => {
        removeCustomOverviewWidget(id);
        setSnackbarMessage("Dashboard Overview widget removed.");
        setSnackbarOpen(true);
    };

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

    const handleCloseShadesDialog = () => {
        setShadesDialogOpen(false);
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
            setSnackbarMessage("External Link settings saved successfully!");
            setSnackbarOpen(true);
            setShadesDialogOpen(false);
        } catch (e) {
            console.error(e);
            setErrorSnackbarOpen(true);
        }
    };

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
            setSnackbarMessage("Widget Renamed Successfully!");
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

    useEffect(() => {
        if (widgetConfigurationStatus === 'idle') {
            dispatchFetchWidgetConfigurationOnce(dispatch, fetchWidgetConfiguration);
        }
    }, [dispatch, widgetConfigurationStatus]);

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
        <Grid container className="settings-layout-root" sx={{ alignItems: "flex-start", ml: '18px', p: '18px' }}>
            {/* Full-width header (title + 2 horizontal dividers) */}
            <Grid item xs={12} sx={{ pt: '18px', mb: 1.5 }}>
                <Typography
                    variant="h6"
                    sx={{
                        color: theme.palette.text.secondary,
                        fontSize: 24,
                        fontWeight: 600,
                        letterSpacing: 0.5,
                        mb: 1,
                    }}
                >
                    Settings
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <Box sx={{ height: '1px', width: '100%', backgroundColor: '#e5e7eb' }} />
                    <Box sx={{ height: '1px', width: '100%', backgroundColor: '#e5e7eb' }} />
                </Box>
            </Grid>

            {/* Sidebar */}
            <Grid
                item
                xs={12}
                md={2}
                sx={{
                    ...settingsSidebarColumnDividerSx(whiteChrome, settingsSidebarMdUp),
                }}
            >
                <SettingsSidebarNav items={visibleSidebarItemsWithPaths} />
            </Grid>

            {/* Right panel */}
            <Grid
                item
                xs={12}
                md={10}
                className="settings-main-content-column"
                sx={{
                    p: 3,
                    borderTopRightRadius: 2,
                    borderBottomRightRadius: 2,
                    backgroundColor: whiteChrome ? '#ffffff' : contentColor,
                }}
            >
                <Box sx={{ maxWidth: 900 }}>
                    {/* headings */}
                    <Grid container spacing={2} alignItems="center" sx={{ mb: 1 }}>
                        <Grid item xs={12} md={5.5}>
                            <Typography sx={{ color: "#000", fontWeight: 500, fontSize: 14 }}>
                                Select Widget To Rename
                            </Typography>
                        </Grid>
                        <Grid item xs={12} md={5.5}>
                            <Typography sx={{ color: "#000", fontWeight: 500, fontSize: 14 }}>
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
                                        const label = f?.dropdown_name || f?.title || "";
                                        return capitalizeFirstLetter(label);
                                    }}
                                >
                                    {items.map(({ key, dropdown_name }) => (
                                        <MenuItem key={key} value={key}>
                                            {capitalizeFirstLetter(dropdown_name)}
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
                                    bgcolor: actionBlue,
                                    color: "#fff",
                                    textTransform: "none",
                                    "&:hover": { bgcolor: actionBlue },
                                }}
                            >
                                {renameLoading ? "Saving..." : "Save"}
                            </Button>
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 4, maxWidth: 900 }}>
                        <Typography sx={{ color: "#000", fontWeight: 600, fontSize: 16, mb: 1 }}>
                            Dashboard chart visibility
                        </Typography>
                        <Typography sx={{ color: "rgba(0,0,0,0.7)", fontSize: 13, mb: 2, lineHeight: 1.45 }}>
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
                                    <Typography
                                        sx={{
                                            color: "#000",
                                            fontWeight: 600,
                                            fontSize: 14,
                                            mb: 1,
                                        }}
                                    >
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

                                            const occupancyOn =
                                                isWidgetVisible("instant_occupancy_count");
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
                                                                color: "#000",
                                                                "& .MuiFormControlLabel-label": {
                                                                    color: "#000",
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
                                                                    color={whiteChrome ? "default" : "primary"}
                                                                    sx={widgetVisibilitySwitchSx}
                                                                />
                                                            }
                                                            label={visibilityRowLabel(row)}
                                                        />
                                                        {row.key === "shades" && (
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => {
                                                                    setShadesHyperlink("");
                                                                    setShadesDialogOpen(true);
                                                                }}
                                                                sx={{
                                                                    color: "#1565C0",
                                                                    border: "1px solid",
                                                                    borderColor: "rgba(0, 0, 0, 0.15)",
                                                                    borderRadius: "6px",
                                                                    p: "4px",
                                                                    ml: 0.5,
                                                                    transition: "all 0.2s",
                                                                    "&:hover": {
                                                                        backgroundColor: "rgba(21, 101, 192, 0.04)",
                                                                        borderColor: "#1565C0",
                                                                    }
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

                        {ENABLE_CUSTOM_DASHBOARD_OVERVIEW_WIDGETS ? (
                        <Box sx={{ mt: 3, pt: 2.5, borderTop: "1px solid #e5e7eb" }}>
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                                <Typography sx={{ color: "#000", fontWeight: 600, fontSize: 14 }}>
                                    Add Dashboard Overview widgets
                                </Typography>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<AddIcon />}
                                    onClick={openAddCustomWidgetDialog}
                                    sx={{
                                        textTransform: "none",
                                        borderRadius: "8px",
                                        borderColor: "rgba(0,0,0,0.23)",
                                        color: "#1565C0",
                                        "&:hover": {
                                            borderColor: "#1565C0",
                                            backgroundColor: "rgba(21, 101, 192, 0.04)",
                                        },
                                    }}
                                >
                                    Add widget
                                </Button>
                            </Box>
                            <Typography sx={{ color: "rgba(0,0,0,0.7)", fontSize: 13, mb: 2, lineHeight: 1.45 }}>
                                Create extra tiles on the Dashboard Overview page. Built-in tiles and rename settings above are unchanged.
                            </Typography>
                            {customWidgets.length === 0 ? (
                                <Typography sx={{ color: "rgba(0,0,0,0.54)", fontSize: 13 }}>
                                    No custom overview widgets yet.
                                </Typography>
                            ) : (
                                customWidgets.map((widget) => (
                                    <Box
                                        key={widget.id}
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                            py: 0.75,
                                            borderBottom: "1px solid rgba(0,0,0,0.06)",
                                        }}
                                    >
                                        <FormControlLabel
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                ml: 0,
                                                mr: 0,
                                                flex: 1,
                                                minWidth: 0,
                                                color: "#000",
                                                "& .MuiFormControlLabel-label": {
                                                    color: "#000",
                                                    fontSize: 14,
                                                },
                                            }}
                                            control={
                                                <Switch
                                                    checked={widget.visible}
                                                    onChange={(e) =>
                                                        setCustomOverviewWidgetVisible(widget.id, e.target.checked)
                                                    }
                                                    color={whiteChrome ? "default" : "primary"}
                                                    sx={widgetVisibilitySwitchSx}
                                                />
                                            }
                                            label={
                                                <Box sx={{ minWidth: 0 }}>
                                                    <Typography sx={{ fontSize: 14, fontWeight: 500 }} noWrap>
                                                        {widget.name}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: 12, color: "rgba(0,0,0,0.54)" }}>
                                                        {CUSTOM_OVERVIEW_WIDGET_TYPE_LABELS[widget.type] || widget.type}
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                        <IconButton
                                            size="small"
                                            onClick={() => openEditCustomWidgetDialog(widget)}
                                            aria-label="Edit widget"
                                            sx={{ color: "#1565C0" }}
                                        >
                                            <EditIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleDeleteCustomWidget(widget.id)}
                                            aria-label="Delete widget"
                                            sx={{ color: "rgba(0,0,0,0.54)" }}
                                        >
                                            <DeleteIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                    </Box>
                                ))
                            )}
                        </Box>
                        ) : null}

                        {ENABLE_CUSTOM_ENERGY_SPACE_GRAPHS ? (
                            <CustomGraphSettingsPanel
                                variant="basic"
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
                {ENABLE_CUSTOM_DASHBOARD_OVERVIEW_WIDGETS ? (
                <Dialog
                    open={customWidgetDialogOpen}
                    onClose={() => {
                        setCustomWidgetDialogOpen(false);
                        resetCustomWidgetForm();
                    }}
                    PaperProps={{
                        sx: {
                            borderRadius: "12px",
                            padding: "8px",
                            width: "480px",
                            maxWidth: "90%",
                            boxShadow: "0 12px 32px rgba(0, 0, 0, 0.15)",
                        },
                    }}
                >
                    <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1, pt: 1.5, px: 2 }}>
                        <Typography sx={{ fontSize: 16, fontWeight: 600, color: "#1E1E1E" }}>
                            {editingCustomWidgetId ? "Edit Dashboard Overview widget" : "Add Dashboard Overview widget"}
                        </Typography>
                        <IconButton
                            size="small"
                            onClick={() => {
                                setCustomWidgetDialogOpen(false);
                                resetCustomWidgetForm();
                            }}
                            sx={{ color: "rgba(0,0,0,0.54)" }}
                        >
                            <CloseIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                    </DialogTitle>
                    <Box sx={{ height: "1px", backgroundColor: "rgba(0, 0, 0, 0.08)", mx: 2 }} />
                    <DialogContent sx={{ pt: 2.5, pb: 1.5, px: 2 }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#2E2E2E", mb: 1 }}>
                            Widget name
                        </Typography>
                        <TextField
                            fullWidth
                            size="small"
                            variant="outlined"
                            placeholder="e.g. Building map"
                            value={customFormName}
                            onChange={(e) => setCustomFormName(e.target.value)}
                            sx={{
                                mb: 2,
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: "8px",
                                    fontSize: 13.5,
                                    backgroundColor: "#FCFCFC",
                                },
                            }}
                        />
                        <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#2E2E2E", mb: 1 }}>
                            Widget type
                        </Typography>
                        <FormControl fullWidth size="small" sx={{ ...controlSx, mb: 2 }}>
                            <Select
                                value={customFormType}
                                onChange={(e) => setCustomFormType(e.target.value)}
                            >
                                {Object.entries(CUSTOM_OVERVIEW_WIDGET_TYPE_LABELS).map(([value, label]) => (
                                    <MenuItem key={value} value={value}>
                                        {label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#2E2E2E", mb: 1 }}>
                            Image (optional, max 400 KB)
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                            <Button variant="outlined" component="label" size="small" sx={{ textTransform: "none" }}>
                                Choose image
                                <input type="file" accept="image/*" hidden onChange={handleCustomImageChange} />
                            </Button>
                            {customFormImageUrl ? (
                                <Box
                                    component="img"
                                    src={customFormImageUrl}
                                    alt=""
                                    sx={{ width: 48, height: 48, objectFit: "contain", borderRadius: 1, border: "1px solid #e5e7eb" }}
                                />
                            ) : null}
                            {customFormImageUrl ? (
                                <Button
                                    size="small"
                                    onClick={() => setCustomFormImageUrl("")}
                                    sx={{ textTransform: "none" }}
                                >
                                    Remove
                                </Button>
                            ) : null}
                        </Box>
                        <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#2E2E2E", mb: 1 }}>
                            Description (optional)
                        </Typography>
                        <TextField
                            fullWidth
                            size="small"
                            variant="outlined"
                            multiline
                            minRows={2}
                            placeholder="Short text shown on the tile"
                            value={customFormDescription}
                            onChange={(e) => setCustomFormDescription(e.target.value)}
                            sx={{
                                mb: 2,
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: "8px",
                                    fontSize: 13.5,
                                    backgroundColor: "#FCFCFC",
                                },
                            }}
                        />
                        {(customFormType === CUSTOM_OVERVIEW_WIDGET_TYPES.EXTERNAL_LINK ||
                            customFormType === CUSTOM_OVERVIEW_WIDGET_TYPES.STATIC) && (
                            <>
                                <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#2E2E2E", mb: 1 }}>
                                    Hyperlink URL{customFormType === CUSTOM_OVERVIEW_WIDGET_TYPES.EXTERNAL_LINK ? "" : " (optional)"}
                                </Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    variant="outlined"
                                    placeholder="https://..."
                                    value={customFormHyperlink}
                                    onChange={(e) => setCustomFormHyperlink(e.target.value)}
                                    sx={{
                                        mb: 2,
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: "8px",
                                            fontSize: 13.5,
                                            backgroundColor: "#FCFCFC",
                                        },
                                    }}
                                />
                            </>
                        )}
                        {(customFormType === CUSTOM_OVERVIEW_WIDGET_TYPES.EXTERNAL_LINK ||
                            customFormType === CUSTOM_OVERVIEW_WIDGET_TYPES.CARBON_FOOTPRINT) && (
                            <>
                                <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#2E2E2E", mb: 1 }}>
                                    CO₂ constant (kg per kWh)
                                </Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    variant="outlined"
                                    type="number"
                                    inputProps={{ min: 0, step: 0.01 }}
                                    value={customFormCo2Constant}
                                    onChange={(e) => setCustomFormCo2Constant(e.target.value)}
                                    sx={{
                                        mb: 1,
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: "8px",
                                            fontSize: 13.5,
                                            backgroundColor: "#FCFCFC",
                                        },
                                    }}
                                />
                                <Typography sx={{ fontSize: 11, color: "rgba(0, 0, 0, 0.54)", mb: 2 }}>
                                    Multiplied by instantaneous energy savings (kW) for carbon footprint tiles.
                                </Typography>
                            </>
                        )}
                        {customFormError ? (
                            <Typography sx={{ fontSize: 12, color: "error.main" }}>{customFormError}</Typography>
                        ) : null}
                    </DialogContent>
                    <DialogActions sx={{ px: 2, pb: 1.5, pt: 0.5, gap: 1 }}>
                        <Button
                            variant="outlined"
                            onClick={() => {
                                setCustomWidgetDialogOpen(false);
                                resetCustomWidgetForm();
                            }}
                            sx={{ textTransform: "none", borderRadius: "8px" }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleSaveCustomWidget}
                            sx={{
                                textTransform: "none",
                                borderRadius: "8px",
                                bgcolor: "#1565C0",
                                color: "#fff",
                                "&:hover": { bgcolor: "#0D47A1" },
                            }}
                        >
                            Save
                        </Button>
                    </DialogActions>
                </Dialog>
                ) : null}
                <Dialog
                    open={shadesDialogOpen}
                    onClose={() => setShadesDialogOpen(false)}
                    PaperProps={{
                        sx: {
                            borderRadius: "12px",
                            padding: "8px",
                            width: "440px",
                            maxWidth: "90%",
                            boxShadow: "0 12px 32px rgba(0, 0, 0, 0.15)",
                        }
                    }}
                >
                    <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1, pt: 1.5, px: 2 }}>
                        <Typography sx={{ fontSize: 16, fontWeight: 600, color: "#1E1E1E" }}>
                            External Link
                        </Typography>
                        <IconButton size="small" onClick={() => setShadesDialogOpen(false)} sx={{ color: "rgba(0,0,0,0.54)" }}>
                            <CloseIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                    </DialogTitle>
                    <Box sx={{ height: "1px", backgroundColor: "rgba(0, 0, 0, 0.08)", mx: 2 }} />
                    <DialogContent sx={{ pt: 2.5, pb: 1.5, px: 2 }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#2E2E2E", mb: 1 }}>
                            Rename Widget
                        </Typography>
                        <TextField
                            fullWidth
                            size="small"
                            variant="outlined"
                            placeholder="Enter new widget name (e.g. External Link)"
                            value={shadesName}
                            onChange={(e) => setShadesName(e.target.value)}
                            sx={{
                                mb: 2,
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: "8px",
                                    fontSize: 13.5,
                                    color: "#333",
                                    backgroundColor: "#FCFCFC",
                                    "& fieldset": { borderColor: "rgba(0, 0, 0, 0.15)" },
                                    "&:hover fieldset": { borderColor: "rgba(0, 0, 0, 0.3)" },
                                    "&.Mui-focused fieldset": { borderColor: "#1565C0", borderWidth: 1.5 },
                                }
                            }}
                        />
                        <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#2E2E2E", mb: 1 }}>
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
                                    sx={{
                                        width: 48,
                                        height: 48,
                                        objectFit: "contain",
                                        borderRadius: 1,
                                        border: "1px solid #e5e7eb",
                                    }}
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
                        <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#2E2E2E", mb: 1 }}>
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
                            sx={{
                                mb: 2,
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: "8px",
                                    fontSize: 13.5,
                                    color: "#333",
                                    backgroundColor: "#FCFCFC",
                                    "& fieldset": { borderColor: "rgba(0, 0, 0, 0.15)" },
                                    "&:hover fieldset": { borderColor: "rgba(0, 0, 0, 0.3)" },
                                    "&.Mui-focused fieldset": { borderColor: "#1565C0", borderWidth: 1.5 },
                                }
                            }}
                        />
                        <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#2E2E2E", mb: 1 }}>
                            Hyperlink URL
                        </Typography>
                        <TextField
                            fullWidth
                            size="small"
                            variant="outlined"
                            // placeholder="https://q2.lutron.com:8443/#floorplan/%2Fgraphicalregion?..."
                            value={shadesHyperlink}
                            onChange={(e) => setShadesHyperlink(e.target.value)}
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: "8px",
                                    fontSize: 13.5,
                                    color: "#333",
                                    backgroundColor: "#FCFCFC",
                                    "& fieldset": { borderColor: "rgba(0, 0, 0, 0.15)" },
                                    "&:hover fieldset": { borderColor: "rgba(0, 0, 0, 0.3)" },
                                    "&.Mui-focused fieldset": { borderColor: "#1565C0", borderWidth: 1.5 },
                                }
                            }}
                        />
                        <Typography sx={{ fontSize: 11, color: "rgba(0, 0, 0, 0.54)", mt: 1 }}>
                            Enter the Quantum Vue floorplan hyperlink for Shades.
                        </Typography>
                        <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#2E2E2E", mb: 1, mt: 2.5 }}>
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
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: "8px",
                                    fontSize: 13.5,
                                    color: "#333",
                                    backgroundColor: "#FCFCFC",
                                    "& fieldset": { borderColor: "rgba(0, 0, 0, 0.15)" },
                                    "&:hover fieldset": { borderColor: "rgba(0, 0, 0, 0.3)" },
                                    "&.Mui-focused fieldset": { borderColor: "#1565C0", borderWidth: 1.5 },
                                }
                            }}
                        />
                        <Typography sx={{ fontSize: 11, color: "rgba(0, 0, 0, 0.54)", mt: 1 }}>
                            Multiplied by instantaneous energy savings (kW) to show CO₂ on the Shades widget.
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ px: 2, pb: 1.5, pt: 0.5, gap: 1 }}>
                        <Button
                            variant="outlined"
                            onClick={() => setShadesDialogOpen(false)}
                            sx={{
                                textTransform: "none",
                                borderRadius: "8px",
                                borderColor: "rgba(0,0,0,0.23)",
                                color: "rgba(0,0,0,0.7)",
                                px: 2.5,
                                height: 36,
                                "&:hover": {
                                    borderColor: "rgba(0,0,0,0.4)",
                                    backgroundColor: "rgba(0,0,0,0.04)"
                                }
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleSaveShadesHyperlink}
                            sx={{
                                textTransform: "none",
                                borderRadius: "8px",
                                bgcolor: "#1565C0",
                                color: "#fff",
                                px: 2.5,
                                height: 36,
                                "&:hover": { bgcolor: "#0D47A1" }
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
                        {snackbarMessage}
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

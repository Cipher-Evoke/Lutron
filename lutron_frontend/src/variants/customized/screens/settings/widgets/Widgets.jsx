/**
 * Widgets: add custom graphs, dashboard visibility, inline edit.
 * Built-in widgets: visibility switch + rename (no delete). Custom widgets: checkbox + delete.
 * Role-based sidebar: getVisibleSidebarItemsWithPaths (UseAuth).
 */
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
    Grid, Box, Typography, FormControl, Select, MenuItem, TextField, Button,
    Snackbar,
    Alert,
    IconButton,
    Tooltip,
    Chip,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import LinkIcon from "@mui/icons-material/Link";
import CloseIcon from "@mui/icons-material/Close";
import { Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import SettingsSidebar from "../../../components/SettingsSidebar";
// import { getApiFromKeyword } from "../../../redux/slice/settingsslice/heatmap/groupOccupancySlice";
import { useDispatch, useSelector, useStore } from "react-redux";
import {
    fetchRenameWidgets,
    getWidgetList,
    Widget,
    fetchCustomGraphs,
    fetchAreaGroups,
    createCustomGraph,
    getBuiltinWidgetDefaultApiPath,
    BUILTIN_WIDGET_DEFAULT_API_PATHS,
    getApiFromKeyword,
    validateKeywordConflictForGraph,
    buildPeerGraphDescriptorsForKeywordValidation,
    selectCustomGraphs,
    selectCustomGraphsLoading,
    selectCustomGraphsError,
    selectRenameWidgetLoading,
    selectRenameWidgetError,
    clearRenameWidgetError,
    fetchWidgetConfiguration,
    saveWidgetVisibility,
    selectWidgetConfiguration,
} from "../../../redux/slice/settingsslice/heatmap/groupOccupancySlice";
import {
    dispatchFetchCustomGraphsOnce,
    dispatchFetchWidgetConfigurationOnce,
    dispatchFetchWidgetTitlesOnce,
} from "../../../../../shared/utils/bootstrapFetchGuards";
import { UseAuth, getVisibleSidebarItemsWithPaths } from "../../../customhooks/UseAuth";
import { selectProfile } from "../../../redux/slice/auth/userlogin";
import { Checkbox, FormControlLabel, Switch } from "@mui/material";
import {
    readBuiltinWidgetOverrides,
    setBuiltinWidgetOverride,
    clearBuiltinWidgetOverride,
    normalizeBuiltinApiPath,
} from "../../../utils/builtinWidgetOverrides";
import {
    getEffectiveBuiltinDashboardPage,
    setBuiltinWidgetDashboardPage,
    defaultBuiltinDashboardPage,
} from "../../../utils/builtinWidgetDashboardPage";
import CustomGraphScopeSection from "./CustomGraphScopeSection";
import CustomGraphScopedGroupPicker from "./CustomGraphScopedGroupPicker";
import AddCustomGraphDialog from "../../../../../shared/settings/customGraph/AddCustomGraphDialog";
import { customizedModalBackdropProps } from "../../../utils/customizedDialogChrome";
import {
    pickCustomGraphScopeForStorage,
    readCustomGraphScopeDraft,
} from "../../../utils/mergeCustomGraphScopeIntoApiParams";
import { isCustomGraphGroupScope } from "../../../utils/filterGroupIdsByAreaGroupScope";
import {
    CUSTOMIZED_OVERVIEW_WIDGET_ROWS,
    resolveCustomizedOverviewSelectedKeys,
    resolveCustomizedEnergySelectedKeys,
    resolveCustomizedSpaceSelectedKeys,
    isCustomizedVisibilitySectionEmpty,
    parseCustomizedWidgetVisibilityRoot,
    writeCustomizedWidgetVisibilityRoot,
    hydrateCustomizedVisibilityFromApiItems,
    customizedVisibilityRootToApiPayloads,
} from "../../../utils/customizedOverviewWidgetVisibility";
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
} from "../../../../basic/utils/shadesWidgetSettings";
import { normalizeDashboardWidgetKey, normalizeSettingsWidgetListItems, resolveSettingsWidgetDisplayName } from "../../../../../shared/dashboard/utils/dashboardWidgetVisibilityCore";
import { readImageFileAsDataUrl } from "../../../../basic/utils/customOverviewWidgets";
import {
    CUSTOMIZED_GUARANTEED_ENERGY_BUILTIN_ROWS,
    CUSTOMIZED_GUARANTEED_SPACE_BUILTIN_ROWS,
    mergeGuaranteedCustomizedBuiltinRows,
} from "../../../utils/customizedDashboardBuiltinWidgetRows";
import { createSingleFlight } from "../../../../../shared/utils/createSingleFlight";

// Stable fallback labels (module scope so hook memos stay pure without listing a new object each render)
const widgetTitlesFallback = {
    savings_by_strategy: "Savings by Strategy",
    total_consumption_by_group: "Consumption By Area Groups",
    consumption_by_area_groups: "Consumption By Area Groups",
    light_power_density: "Light Power Density",
    consumption: "Consumption",
    savings: "Savings",
    peak_and_minimum_consumption: "Peak & Minimum Consumption",
    consumption_saving: "Energy (Combined)",
    utilization: "Utilization",
    instant_occupancy_count: "Instant Occupancy Count",
    instant_utilization_combined: "Space Utilization (Combined)",
    utilization_by_area_group: "Utilization By Area Group",
    utilization_by_area: "Utilization By Area",
    peak_and_minimum_utilization: "Peak And Minimum Utilization",
};

export default function RenameWidget() {
    const dispatch = useDispatch();
    const store = useStore();
    const widgetList = useSelector(getWidgetList);
    const renameLoading = useSelector(selectRenameWidgetLoading);
    const renameError = useSelector(selectRenameWidgetError);
    const customGraphs = useSelector(selectCustomGraphs);
    const customGraphsLoading = useSelector(selectCustomGraphsLoading);
    const customGraphsError = useSelector(selectCustomGraphsError);

    const theme = useTheme();
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [errorSnackbarOpen, setErrorSnackbarOpen] = useState(false);
    const [areaSnackbarOpen, setAreaSnackbarOpen] = useState(false);
    const [customGraphSnackbarOpen, setCustomGraphSnackbarOpen] = useState(false);
    const [customGraphErrorOpen, setCustomGraphErrorOpen] = useState(false);
    const [customGraphErrorMessage, setCustomGraphErrorMessage] = useState("");

    const [customGraphOpen, setCustomGraphOpen] = useState(false);
    const [customGraphDialogError, setCustomGraphDialogError] = useState("");

    /** Unified edit dialog (built-in + custom) */
    const [graphEditOpen, setGraphEditOpen] = useState(false);
    const [graphEditIsCustom, setGraphEditIsCustom] = useState(false);
    const [graphEditBuiltinKey, setGraphEditBuiltinKey] = useState("");
    const [graphEditCustomId, setGraphEditCustomId] = useState("");
    const [graphEditName, setGraphEditName] = useState("");
    const [graphEditPage, setGraphEditPage] = useState("energy");
    const [graphEditGraphType, setGraphEditGraphType] = useState("bar");
    const [graphEditApiPath, setGraphEditApiPath] = useState("");
    const [graphEditScopeMode, setGraphEditScopeMode] = useState("inherit");
    const [graphEditScopeDraft, setGraphEditScopeDraft] = useState({
        floor_ids: [],
        area_ids: [],
    });
    const [graphEditScopeTarget, setGraphEditScopeTarget] = useState("location"); // 'location' or 'group'
    /** Optional subset of area group ids when target is 'group' (stored as `custom_area_group_ids`). */
    const [graphEditAreaGroupIds, setGraphEditAreaGroupIds] = useState([]);
    const [graphEditGroupScope, setGraphEditGroupScope] = useState("");
    const [graphEditScopedGroupIds, setGraphEditScopedGroupIds] = useState([]);

    const [deleteGraphOpen, setDeleteGraphOpen] = useState(false);
    const [deleteGraphId, setDeleteGraphId] = useState("");

    // Get current user role for sidebar filtering
    const { role: currentUserRole } = UseAuth();
    const userProfile = useSelector(selectProfile);
    const visibleSidebarItemsWithPaths = getVisibleSidebarItemsWithPaths(currentUserRole, userProfile);

    const humanizeWidgetKey = useCallback((key) => {
        return String(key)
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());
    }, []);

    const formatApiPathLabel = useCallback((apiPath) => {
        const s = String(apiPath ?? "")
            .trim()
            .split("?")[0]
            .split("#")[0]
            .replace(/^\/+/, "")
            .replace(/^dashboard\/?/i, "")
            .replace(/\//g, " ")
            .replace(/_/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        if (!s) return String(apiPath ?? "");
        return s.replace(/\b\w/g, (c) => c.toUpperCase());
    }, []);

    const normalizeWidgetKey = (key) => normalizeDashboardWidgetKey(String(key ?? "").trim());

    const items = useMemo(() => {
        const arr = Array.isArray(widgetList?.titles)
            ? widgetList.titles
            : Array.isArray(widgetList)
                ? widgetList
                : [];
        const syntheticKeys = [
            "instant_utilization_combined",
            "consumption_saving",
            "light_power_density",
            "peak_and_minimum_consumption",
        ];
        return normalizeSettingsWidgetListItems(arr, {
            fallbackMap: widgetTitlesFallback,
            syntheticKeys,
        });
    }, [widgetList]);

    const energyKeys = useMemo(
        () =>
            new Set([
                "savings_by_strategy",
                "total_consumption_by_group",
                "consumption_by_area_groups",
                "consumption",
                "savings",
                "consumption_saving",
                "light_power_density",
                "peak_and_minimum_consumption",
            ]),
        []
    );

    const spaceKeys = useMemo(
        () =>
            new Set([
                "utilization",
                "instant_occupancy_count",
                "instant_utilization_combined",
                "utilization_by_area_group",
                "peak_and_minimum_utilization",
                "utilization_by_area",
            ]),
        []
    );

    const parseWidgetVisibilityFromLocalStorage = () => parseCustomizedWidgetVisibilityRoot();

    const [, setWidgetVisibility] = useState(() =>
        parseWidgetVisibilityFromLocalStorage()
    );

    /** Re-run built-in row filters when dashboard page assignment (Energy vs Space) changes */
    const [builtinDashboardPageTick, setBuiltinDashboardPageTick] = useState(0);

    const [overviewSelected, setOverviewSelected] = useState([]);
    const overviewSelectedRef = useRef([]);

    const [shadesDialogOpen, setShadesDialogOpen] = useState(false);
    const [shadesHyperlink, setShadesHyperlink] = useState("");
    const [shadesName, setShadesName] = useState("");
    const [shadesCo2Constant, setShadesCo2Constant] = useState(String(DEFAULT_SHADES_CO2_CONSTANT));
    const [shadesImageUrl, setShadesImageUrl] = useState("");
    const [shadesDescription, setShadesDescription] = useState("");
    const [shadesImageError, setShadesImageError] = useState("");

    const [energySelected, setEnergySelected] = useState([]);
    const [spaceSelected, setSpaceSelected] = useState([]);
    const energySelectedRef = useRef([]);
    const spaceSelectedRef = useRef([]);

    useEffect(() => {
        overviewSelectedRef.current = overviewSelected;
    }, [overviewSelected]);

    useEffect(() => {
        energySelectedRef.current = energySelected;
    }, [energySelected]);
    useEffect(() => {
        spaceSelectedRef.current = spaceSelected;
    }, [spaceSelected]);

    useEffect(() => {
        const onPage = () => setBuiltinDashboardPageTick((t) => t + 1);
        window.addEventListener("builtinWidgetDashboardPageUpdated", onPage);
        return () => window.removeEventListener("builtinWidgetDashboardPageUpdated", onPage);
    }, []);

    const defaultTitleForKey = (key) =>
        widgetTitlesFallback[key] || humanizeWidgetKey(key);

    const isNewCustomGraphNameDuplicate = useCallback(
        (rawName) => {
            const nameNorm = String(rawName ?? "").trim().toLowerCase();
            if (!nameNorm) return false;
            const list = Array.isArray(customGraphs) ? customGraphs : [];
            if (list.some((g) => String(g?.name ?? "").trim().toLowerCase() === nameNorm)) {
                return true;
            }
            // Source of truth: custom graphs are stored in localStorage. Redux may be stale/not yet loaded.
            try {
                const raw = localStorage.getItem("customGraphs");
                const parsed = raw ? JSON.parse(raw) : [];
                const localList = Array.isArray(parsed) ? parsed : [];
                if (
                    localList.some(
                        (g) => String(g?.name ?? "").trim().toLowerCase() === nameNorm
                    )
                ) {
                    return true;
                }
            } catch {
                // ignore parse errors
            }
            const unionKeys = [...new Set([...energyKeys, ...spaceKeys])];
            for (const k of unionKeys) {
                const row = items.find((i) => i.key === k);
                const display = row
                    ? String(row.title ?? row.dropdown_name ?? "").trim()
                    : widgetTitlesFallback[k] || humanizeWidgetKey(k);
                if (String(display).trim().toLowerCase() === nameNorm) return true;
            }
            return false;
        },
        [customGraphs, items, energyKeys, spaceKeys, humanizeWidgetKey]
    );

    const getDefaultApiPathForBuiltInWidgetKey = (widgetKey) =>
        getBuiltinWidgetDefaultApiPath(normalizeWidgetKey(widgetKey));

    const apiPathDropdownOptions = useMemo(() => {
        const fromBuiltin = Object.values(BUILTIN_WIDGET_DEFAULT_API_PATHS || {}).filter(Boolean);
        const extras = [
            "/dashboard/unified_energy_consumption_savings_data",
            "/dashboard/peak_min_occupancy",
        ];
        const all = Array.from(new Set([...fromBuiltin, ...extras].map((p) => String(p).trim()).filter(Boolean)));
        all.sort((a, b) => a.localeCompare(b));
        return all;
    }, []);

    const openGraphEdit = (row) => {
        dispatch(clearRenameWidgetError());
        dispatch(fetchAreaGroups());
        if (row?.isCustom && row?.graph) {
            const g = row.graph;
            setGraphEditIsCustom(true);
            setGraphEditBuiltinKey("");
            setGraphEditCustomId(String(g?.id ?? ""));
            setGraphEditName(String(g?.name ?? ""));
            setGraphEditPage(String(g?.page ?? "energy"));
            setGraphEditGraphType(String(g?.graph_type ?? "bar"));
            setGraphEditApiPath(String(g?.api_path ?? "").trim());
            const scopeDraft = readCustomGraphScopeDraft(g);
            const hasScope =
                scopeDraft.floor_ids.length > 0 || scopeDraft.area_ids.length > 0;
            setGraphEditScopeMode(hasScope ? "custom" : "inherit");
            setGraphEditScopeDraft(
                hasScope ? scopeDraft : { floor_ids: [], area_ids: [] }
            );
            setGraphEditGroupScope(
                isCustomGraphGroupScope(g?.group_scope) ? g.group_scope : ""
            );
            setGraphEditScopedGroupIds(
                Array.isArray(g?.scoped_group_ids) ? g.scoped_group_ids.slice() : []
            );
            setGraphEditScopeTarget(g?.is_area_group_widget ? "group" : "location");
            setGraphEditAreaGroupIds(Array.isArray(g?.custom_area_group_ids) ? g.custom_area_group_ids.slice() : []);
            setGraphEditOpen(true);
            return;
        }
        const key = String(row?.key ?? "");
        if (!key) return;
        setGraphEditIsCustom(false);
        setGraphEditCustomId("");
        setGraphEditBuiltinKey(key);
        const full = items.find((x) => normalizeWidgetKey(x.key) === normalizeWidgetKey(key));
        setGraphEditName(
            String(full?.dropdown_name ?? row?.dropdown_name ?? row?.title ?? "").trim() ||
            defaultTitleForKey(key)
        );
        setGraphEditPage(getEffectiveBuiltinDashboardPage(key));
        const ov = readBuiltinWidgetOverrides()[key];
        setGraphEditGraphType(String(ov?.graph_type || "line"));
        const computedApiPath = ov?.api_path?.trim()
            ? String(ov.api_path)
            : getDefaultApiPathForBuiltInWidgetKey(key);

        setGraphEditApiPath(String(computedApiPath || ""));
        const builtinScopeDraft = readCustomGraphScopeDraft(ov);
        const builtinHasScope =
            builtinScopeDraft.floor_ids.length > 0 || builtinScopeDraft.area_ids.length > 0;
        setGraphEditScopeMode(builtinHasScope ? "custom" : "inherit");
        setGraphEditScopeDraft(
            builtinHasScope ? builtinScopeDraft : { floor_ids: [], area_ids: [] }
        );
        setGraphEditGroupScope(isCustomGraphGroupScope(ov?.group_scope) ? ov.group_scope : "");
        setGraphEditScopedGroupIds(
            Array.isArray(ov?.scoped_group_ids) ? ov.scoped_group_ids.slice() : []
        );
        setGraphEditScopeTarget("location");
        setGraphEditAreaGroupIds([]);
        setGraphEditOpen(true);
    };

    const runSaveGraphEditOnce = useMemo(() => createSingleFlight(), []);
    const handleSaveGraphEdit = async () => runSaveGraphEditOnce(async () => {
        if (!graphEditName.trim()) return;
        if (graphEditIsCustom) {
            if (!graphEditCustomId) return;
            try {
                const trimmedName = graphEditName.trim();
                const durationType = String(graphEditPage).toLowerCase().includes("space")
                    ? "week"
                    : "day";
                const resolvedAp =
                    graphEditApiPath.trim() ||
                    getApiFromKeyword(trimmedName, durationType, graphEditPage);
                const peers = buildPeerGraphDescriptorsForKeywordValidation(store.getState(), {
                    excludeCustomGraphId: graphEditCustomId,
                });
                const kw = validateKeywordConflictForGraph(trimmedName, resolvedAp, peers);
                if (!kw.isValid) {
                    setCustomGraphErrorMessage(kw.message);
                    setCustomGraphErrorOpen(true);
                    return;
                }
                const storageKey = "customGraphs";
                const raw = localStorage.getItem(storageKey);
                const parsed = raw ? JSON.parse(raw) : [];
                const list = Array.isArray(parsed) ? parsed : [];
                const nextList = list.map((g) => {
                    if (String(g?.id ?? "") !== String(graphEditCustomId)) return g;
                    const updated = {
                        ...g,
                        page: graphEditPage,
                        graph_type: graphEditGraphType,
                        name: trimmedName,
                    };
                    const ap = graphEditApiPath.trim();
                    if (ap) {
                        updated.api_path = ap.startsWith("/") ? ap : `/dashboard/${ap.replace(/^\/+/, "")}`;
                    } else {
                        delete updated.api_path;
                    }
                    // Clean up existing scope settings
                    delete updated.floor_ids;
                    delete updated.area_ids;
                    delete updated.is_area_group_widget;
                    delete updated.custom_area_group_ids;

                    if (graphEditScopeTarget === "group") {
                        updated.is_area_group_widget = true;
                        updated.custom_area_group_ids = graphEditAreaGroupIds.slice();
                    } else if (graphEditScopeMode === "custom") {
                        Object.assign(
                            updated,
                            pickCustomGraphScopeForStorage(graphEditScopeDraft)
                        );
                    }

                    delete updated.group_scope;
                    delete updated.scoped_group_ids;
                    if (isCustomGraphGroupScope(graphEditGroupScope)) {
                        updated.group_scope = graphEditGroupScope;
                        if (graphEditScopedGroupIds.length > 0) {
                            updated.scoped_group_ids = graphEditScopedGroupIds.slice();
                        }
                    }
                    return updated;
                });
                localStorage.setItem(storageKey, JSON.stringify(nextList));
                await dispatch(fetchCustomGraphs()).unwrap();
                window.dispatchEvent(new CustomEvent("customGraphsUpdated"));
                setCustomGraphVisibilityEnabled(graphEditPage, graphEditCustomId);
                setGraphEditOpen(false);
                setSnackbarOpen(true);
            } catch (e) {
                const msg =
                    typeof e === "string"
                        ? e
                        : e && typeof e === "object"
                            ? JSON.stringify(e)
                            : "Failed to edit graph";
                setCustomGraphErrorMessage(msg);
                setCustomGraphErrorOpen(true);
            }
            return;
        }
        if (!graphEditBuiltinKey) return;
        const defPage = defaultBuiltinDashboardPage(graphEditBuiltinKey);
        if (graphEditPage !== defPage) {
            const ap = graphEditApiPath.trim();
            const gt = graphEditGraphType.trim();
            if (!ap || !gt) {
                setCustomGraphErrorMessage(
                    "To move a chart between Energy and Space, set both API path and graph type (e.g. line, bar, pie). Defaults are filled when you open Edit again after this update."
                );
                setCustomGraphErrorOpen(true);
                return;
            }
        }
        const trimmedBuiltinName = graphEditName.trim();
        const resolvedBuiltinAp = normalizeBuiltinApiPath(
            graphEditApiPath.trim() ||
            getDefaultApiPathForBuiltInWidgetKey(graphEditBuiltinKey)
        );
        const builtinPeers = buildPeerGraphDescriptorsForKeywordValidation(store.getState(), {
            excludeBuiltinWidgetKey: graphEditBuiltinKey,
        });
        const builtinKw = validateKeywordConflictForGraph(
            trimmedBuiltinName,
            resolvedBuiltinAp,
            builtinPeers
        );
        if (!builtinKw.isValid) {
            setCustomGraphErrorMessage(builtinKw.message);
            setCustomGraphErrorOpen(true);
            return;
        }
        dispatch(clearRenameWidgetError());
        try {
            const prevEffectivePage = getEffectiveBuiltinDashboardPage(graphEditBuiltinKey);
            await dispatch(
                Widget({
                    widget_key: String(graphEditBuiltinKey),
                    new_name: trimmedBuiltinName,
                    resolved_api_path_for_validation: resolvedBuiltinAp,
                })
            ).unwrap();
            await dispatch(fetchRenameWidgets()).unwrap();
            window.dispatchEvent(new CustomEvent("widgetTitlesUpdated"));
            setBuiltinWidgetDashboardPage(graphEditBuiltinKey, graphEditPage);
            const ap = normalizeBuiltinApiPath(graphEditApiPath.trim());
            const gt = graphEditGraphType.trim();
            if (ap && gt) {
                const scopeFields =
                    graphEditScopeMode === "custom"
                        ? pickCustomGraphScopeForStorage(graphEditScopeDraft)
                        : {};
                setBuiltinWidgetOverride(graphEditBuiltinKey, {
                    graph_type: gt,
                    api_path: ap,
                    ...scopeFields,
                    ...(isCustomGraphGroupScope(graphEditGroupScope)
                        ? { group_scope: graphEditGroupScope }
                        : {}),
                    ...(isCustomGraphGroupScope(graphEditGroupScope) && graphEditScopedGroupIds.length > 0
                        ? { scoped_group_ids: graphEditScopedGroupIds.slice() }
                        : {}),
                });
            } else {
                clearBuiltinWidgetOverride(graphEditBuiltinKey);
            }
            const nextEffectivePage = getEffectiveBuiltinDashboardPage(graphEditBuiltinKey);
            if (prevEffectivePage !== nextEffectivePage) {
                const nk = normalizeWidgetKey(graphEditBuiltinKey);
                setEnergySelected((prevE) => {
                    let nextE = [...prevE];
                    let nextS = [...spaceSelectedRef.current];
                    if (nextEffectivePage === "energy") {
                        if (!nextE.includes(nk)) nextE.push(nk);
                        nextS = nextS.filter((x) => x !== nk);
                    } else {
                        if (!nextS.includes(nk)) nextS.push(nk);
                        nextE = nextE.filter((x) => x !== nk);
                    }
                    setSpaceSelected(nextS);
                    persistWidgetVisibility(nextE, nextS);
                    return nextE;
                });
            }
            setBuiltinDashboardPageTick((t) => t + 1);
            setGraphEditOpen(false);
            setSnackbarOpen(true);
        } catch {
            setErrorSnackbarOpen(true);
        }
    });

    const handleCheckboxRowEdit = (row) => {
        openGraphEdit(row);
    };

    const handleCheckboxRowDelete = (row) => {
        if (row?.isCustom && row?.graph) {
            openDeleteGraph(row.graph?.id);
        }
    };

    const handleBuiltinVisibilitySwitch = (row, checked) => {
        const normKey = normalizeWidgetKey(row.key);
        if (row.section === "energy") {
            setEnergySelected((prev) => {
                let next = checked
                    ? prev.includes(normKey)
                        ? prev
                        : [...prev, normKey]
                    : prev.filter((item) => item !== normKey);
                if (checked) {
                    if (normKey === "consumption_saving") {
                        next = next.filter(
                            (k) => k !== "consumption" && k !== "savings_by_strategy"
                        );
                    } else if (normKey === "consumption" || normKey === "savings_by_strategy") {
                        next = next.filter((k) => k !== "consumption_saving");
                    }
                }
                energySelectedRef.current = next;
                persistWidgetVisibility(next, spaceSelectedRef.current);
                return next;
            });
        } else {
            setSpaceSelected((prev) => {
                let next = checked
                    ? prev.includes(normKey)
                        ? prev
                        : [...prev, normKey]
                    : prev.filter((item) => item !== normKey);
                if (checked) {
                    if (normKey === "instant_utilization_combined") {
                        next = next.filter(
                            (k) => k !== "instant_occupancy_count" && k !== "utilization_by_area"
                        );
                    } else if (
                        normKey === "instant_occupancy_count" ||
                        normKey === "utilization_by_area"
                    ) {
                        next = next.filter((k) => k !== "instant_utilization_combined");
                    }
                }
                spaceSelectedRef.current = next;
                persistWidgetVisibility(energySelectedRef.current, next);
                return next;
            });
        }
    };

    const anyEnergyIndividualOn = useMemo(
        () =>
            energySelected.includes("consumption") ||
            energySelected.includes("savings_by_strategy"),
        [energySelected]
    );

    const anyOneSpaceCombinedConflictOn = useMemo(
        () =>
            spaceSelected.includes("instant_occupancy_count") ||
            spaceSelected.includes("utilization_by_area"),
        [spaceSelected]
    );

    useEffect(() => {
        if (!anyEnergyIndividualOn || !energySelected.includes("consumption_saving")) return;
        setEnergySelected((prev) => {
            const next = prev.filter((k) => k !== "consumption_saving");
            energySelectedRef.current = next;
            persistWidgetVisibility(next, spaceSelectedRef.current);
            return next;
        });
    }, [anyEnergyIndividualOn, energySelected]);

    useEffect(() => {
        if (!anyOneSpaceCombinedConflictOn || !spaceSelected.includes("instant_utilization_combined")) {
            return;
        }
        setSpaceSelected((prev) => {
            const next = prev.filter((k) => k !== "instant_utilization_combined");
            spaceSelectedRef.current = next;
            persistWidgetVisibility(energySelectedRef.current, next);
            return next;
        });
    }, [anyOneSpaceCombinedConflictOn, spaceSelected]);

    const energyItems = useMemo(
        () =>
            items.filter((x) => {
                const k = normalizeWidgetKey(x.key);
                if (!energyKeys.has(k) && !spaceKeys.has(k)) return false;
                return getEffectiveBuiltinDashboardPage(k) === "energy";
            }),
        [items, energyKeys, spaceKeys, builtinDashboardPageTick]
    );
    const spaceItems = useMemo(
        () =>
            items.filter((x) => {
                const k = normalizeWidgetKey(x.key);
                if (!energyKeys.has(k) && !spaceKeys.has(k)) return false;
                return getEffectiveBuiltinDashboardPage(k) === "space";
            }),
        [items, energyKeys, spaceKeys, builtinDashboardPageTick]
    );

    const customEnergyWidgetKeys = useMemo(() => {
        const list = Array.isArray(customGraphs) ? customGraphs : [];
        return list
            .filter((g) => String(g?.page || "").toLowerCase().replace(/_/g, "-").replace(/\s+/g, "-") === "energy")
            .map((g) => `custom_graph:${String(g?.id ?? "").trim()}`)
            .filter((k) => k !== "custom_graph:");
    }, [customGraphs]);

    const customSpaceWidgetKeys = useMemo(() => {
        const list = Array.isArray(customGraphs) ? customGraphs : [];
        return list
            .filter((g) => {
                const p = String(g?.page || "").toLowerCase().replace(/_/g, "-").replace(/\s+/g, "-");
                return p === "space" || p === "space-utilization" || p.startsWith("space-");
            })
            .map((g) => `custom_graph:${String(g?.id ?? "").trim()}`)
            .filter((k) => k !== "custom_graph:");
    }, [customGraphs]);

    // Checkbox rows: built-in + custom; each row carries isCustom + graph for inline actions.
    const energyCheckboxRows = useMemo(() => {
        const base = energyItems.map((x) => {
            const key = normalizeWidgetKey(x.key);
            return {
                key,
                dropdown_name: resolveSettingsWidgetDisplayName(
                    key,
                    x.title,
                    x.dropdown_name || x.title,
                    widgetTitlesFallback
                ),
                isCustom: false,
                graph: null,
            };
        });
        const list = Array.isArray(customGraphs) ? customGraphs : [];
        const extras = list
            .filter(
                (g) =>
                    String(g?.page || "")
                        .toLowerCase()
                        .replace(/_/g, "-")
                        .replace(/\s+/g, "-") === "energy"
            )
            .map((g) => ({
                key: `custom_graph:${String(g?.id ?? "").trim()}`,
                dropdown_name: g?.name || "Custom Graph",
                isCustom: true,
                graph: g,
            }))
            .filter((r) => r.key !== "custom_graph:");
        return [...base, ...extras];
    }, [energyItems, customGraphs]);

    const spaceCheckboxRows = useMemo(() => {
        const base = spaceItems.map((x) => {
            const key = normalizeWidgetKey(x.key);
            return {
                key,
                dropdown_name: resolveSettingsWidgetDisplayName(
                    key,
                    x.title,
                    x.dropdown_name || x.title,
                    widgetTitlesFallback
                ),
                isCustom: false,
                graph: null,
            };
        });
        const existingKeys = new Set(base.map((r) => r.key));
        const requiredSpaceBuiltins = [
            {
                key: "instant_utilization_combined",
                dropdown_name: widgetTitlesFallback.instant_utilization_combined,
            },
        ];
        const missingBuiltins = requiredSpaceBuiltins
            .filter((r) => !existingKeys.has(r.key))
            .map((r) => ({
                ...r,
                isCustom: false,
                graph: null,
            }));
        const list = Array.isArray(customGraphs) ? customGraphs : [];
        const extras = list
            .filter((g) => {
                const p = String(g?.page || "")
                    .toLowerCase()
                    .replace(/_/g, "-")
                    .replace(/\s+/g, "-");
                return p === "space" || p === "space-utilization" || p.startsWith("space-");
            })
            .map((g) => ({
                key: `custom_graph:${String(g?.id ?? "").trim()}`,
                dropdown_name: g?.name || "Custom Graph",
                isCustom: true,
                graph: g,
            }))
            .filter((r) => r.key !== "custom_graph:");
        return [...base, ...missingBuiltins, ...extras];
    }, [spaceItems, customGraphs]);

    const unifiedGraphRows = useMemo(() => {
        const energy = energyCheckboxRows.map((r) => ({ ...r, section: "energy" }));
        const space = spaceCheckboxRows.map((r) => ({ ...r, section: "space" }));
        const withGuaranteedEnergy = mergeGuaranteedCustomizedBuiltinRows(
            energy,
            CUSTOMIZED_GUARANTEED_ENERGY_BUILTIN_ROWS,
            "energy"
        );
        const withGuaranteedSpace = mergeGuaranteedCustomizedBuiltinRows(
            space,
            CUSTOMIZED_GUARANTEED_SPACE_BUILTIN_ROWS,
            "space"
        );
        return [...withGuaranteedEnergy, ...withGuaranteedSpace];
    }, [energyCheckboxRows, spaceCheckboxRows]);

    const persistWidgetVisibility = (nextEnergySelected, nextSpaceSelected) => {
        const current = parseWidgetVisibilityFromLocalStorage();

        const energyMap = {};
        // Persist against canonical key lists (not the API list) so Dashboard filtering
        // works even if /widgets/widget_titles omits some keys.
        for (const k of energyKeys) {
            const key = normalizeWidgetKey(k);
            energyMap[key] = nextEnergySelected.includes(key);
        }
        // Custom graphs (Energy page)
        for (const k of customEnergyWidgetKeys) {
            energyMap[k] = nextEnergySelected.includes(k);
        }
        // Preserve any unknown custom-graph flags that aren't in the current list.
        const prevEnergy = current?.energy && typeof current.energy === "object" ? current.energy : {};
        for (const [k, v] of Object.entries(prevEnergy)) {
            if (String(k).startsWith("custom_graph:") && energyMap[k] === undefined) energyMap[k] = v;
        }
        // Keep alias keys in sync for backend + UI consistency.
        // Prefer canonical selection — do not let the alias key (often absent from
        // energySelected after normalize) overwrite total_consumption_by_group to false.
        const areaGroupsOn =
            nextEnergySelected.includes("total_consumption_by_group") ||
            nextEnergySelected.includes("consumption_by_area_groups");
        energyMap.total_consumption_by_group = areaGroupsOn;
        energyMap.consumption_by_area_groups = areaGroupsOn;

        const spaceMap = {};
        for (const k of spaceKeys) {
            const key = normalizeWidgetKey(k);
            spaceMap[key] = nextSpaceSelected.includes(key);
        }
        // Custom graphs (Space page)
        for (const k of customSpaceWidgetKeys) {
            spaceMap[k] = nextSpaceSelected.includes(k);
        }
        const prevSpace = current?.space && typeof current.space === "object" ? current.space : {};
        for (const [k, v] of Object.entries(prevSpace)) {
            if (String(k).startsWith("custom_graph:") && spaceMap[k] === undefined) spaceMap[k] = v;
        }

        // If a built-in originally belonging to Energy is moved to Space (or vice-versa),
        // we must persist it under the *destination* map as well.
        // Otherwise the later re-hydration effect reads `spaceMap`/`energyMap` and the checkbox
        // will immediately appear unchecked after saving.
        for (const selKey of nextSpaceSelected) {
            const k = normalizeWidgetKey(selKey);
            if (energyKeys.has(k) && !spaceKeys.has(k)) {
                spaceMap[k] = true;
            }
        }
        for (const selKey of nextEnergySelected) {
            const k = normalizeWidgetKey(selKey);
            if (spaceKeys.has(k) && !energyKeys.has(k)) {
                energyMap[k] = true;
            }
        }

        // Keep alias keys in sync (same rule as energy map).
        const spaceAreaGroupsOn =
            nextSpaceSelected.includes("total_consumption_by_group") ||
            nextSpaceSelected.includes("consumption_by_area_groups") ||
            spaceMap.total_consumption_by_group === true ||
            spaceMap.consumption_by_area_groups === true;
        if (
            Object.prototype.hasOwnProperty.call(spaceMap, "total_consumption_by_group") ||
            Object.prototype.hasOwnProperty.call(spaceMap, "consumption_by_area_groups")
        ) {
            spaceMap.total_consumption_by_group = spaceAreaGroupsOn;
            spaceMap.consumption_by_area_groups = spaceAreaGroupsOn;
        }

        const overviewMap = {};
        const overviewKeys = CUSTOMIZED_OVERVIEW_WIDGET_ROWS.map((row) => row.key);
        const overviewSelectedKeys =
            overviewSelectedRef.current.length > 0
                ? overviewSelectedRef.current
                : resolveCustomizedOverviewSelectedKeys(current);
        for (const k of overviewKeys) {
            overviewMap[k] = overviewSelectedKeys.includes(k);
        }

        const merged = {
            ...current,
            overview: overviewMap,
            energy: energyMap,
            space: spaceMap,
        };

        // Keep Combined off while individuals are enabled (persist until user disables).
        if (energyMap.consumption === true || energyMap.savings_by_strategy === true) {
            energyMap.consumption_saving = false;
        }
        if (energyMap.consumption_saving === true) {
            energyMap.consumption = false;
            energyMap.savings_by_strategy = false;
        }
        if (
            spaceMap.instant_occupancy_count === true ||
            spaceMap.utilization_by_area === true
        ) {
            spaceMap.instant_utilization_combined = false;
        }
        if (spaceMap.instant_utilization_combined === true) {
            spaceMap.instant_occupancy_count = false;
            spaceMap.utilization_by_area = false;
        }

        writeCustomizedWidgetVisibilityRoot(merged);
        setWidgetVisibility(merged);
        window.dispatchEvent(new CustomEvent("widgetVisibilityUpdated"));
        if (currentUserRole === "Superadmin") {
            const payloads = customizedVisibilityRootToApiPayloads(merged);
            for (const payload of payloads) {
                dispatch(saveWidgetVisibility(payload));
            }
        }
    };

    const setCustomGraphVisibilityEnabled = (page, id) => {
        const widgetKey = `custom_graph:${String(id ?? "").trim()}`;
        if (!widgetKey || widgetKey === "custom_graph:") return;

        const current = parseWidgetVisibilityFromLocalStorage();
        const lowerPage = String(page || "").toLowerCase().replace(/_/g, "-").replace(/\s+/g, "-");
        const isSpace = lowerPage === "space" || lowerPage === "space-utilization" || lowerPage.startsWith("space-");

        // If prefs were empty, seed Combined defaults first so adding a custom graph
        // does not create a partial map that shows every built-in (opt-out legacy).
        const energyEmpty = isCustomizedVisibilitySectionEmpty(current?.energy);
        const spaceEmpty = isCustomizedVisibilitySectionEmpty(current?.space);
        if (energyEmpty && spaceEmpty) {
            persistWidgetVisibility(
                resolveCustomizedEnergySelectedKeys({}),
                resolveCustomizedSpaceSelectedKeys({})
            );
        }
        const seeded = parseWidgetVisibilityFromLocalStorage();

        const nextEnergy = {
            ...(seeded?.energy && typeof seeded.energy === "object" ? seeded.energy : {}),
        };
        const nextSpace = {
            ...(seeded?.space && typeof seeded.space === "object" ? seeded.space : {}),
        };
        // One graph belongs to one page: remove from the other map when switching energy ↔ space.
        if (isSpace) {
            delete nextEnergy[widgetKey];
            nextSpace[widgetKey] = true;
        } else {
            delete nextSpace[widgetKey];
            nextEnergy[widgetKey] = true;
        }
        const next = { ...seeded, energy: nextEnergy, space: nextSpace };
        writeCustomizedWidgetVisibilityRoot(next);
        setWidgetVisibility(next);
        // Keep checkbox UI in sync immediately (otherwise the graph appears on the dashboard
        // but the new custom graph checkbox can look unchecked until a full re-hydration).
        if (isSpace) {
            setSpaceSelected((prev) => (prev.includes(widgetKey) ? prev : [...prev, widgetKey]));
        } else {
            setEnergySelected((prev) => (prev.includes(widgetKey) ? prev : [...prev, widgetKey]));
        }
        window.dispatchEvent(new CustomEvent("widgetVisibilityUpdated"));
    };

    const deleteCustomGraphVisibility = (id) => {
        const widgetKey = `custom_graph:${String(id ?? "").trim()}`;
        if (!widgetKey || widgetKey === "custom_graph:") return;

        const current = parseWidgetVisibilityFromLocalStorage();
        const nextEnergy = { ...(current?.energy && typeof current.energy === "object" ? current.energy : {}) };
        const nextSpace = { ...(current?.space && typeof current.space === "object" ? current.space : {}) };
        delete nextEnergy[widgetKey];
        delete nextSpace[widgetKey];

        const next = { ...current, energy: nextEnergy, space: nextSpace };
        writeCustomizedWidgetVisibilityRoot(next);
        setWidgetVisibility(next);

        // Keep checkbox UI in sync immediately.
        setEnergySelected((prev) => prev.filter((k) => String(k) !== widgetKey));
        setSpaceSelected((prev) => prev.filter((k) => String(k) !== widgetKey));

        window.dispatchEvent(new CustomEvent("widgetVisibilityUpdated"));
    };

    const handleOverviewVisibilitySwitch = (key, checked) => {
        const normKey = normalizeWidgetKey(key);
        setOverviewSelected((prev) => {
            const next = checked
                ? Array.from(new Set([...prev, normKey]))
                : prev.filter((item) => item !== normKey);
            overviewSelectedRef.current = next;
            persistWidgetVisibility(energySelectedRef.current, spaceSelectedRef.current);
            return next;
        });
    };

    useEffect(() => {
        if (!shadesDialogOpen) return;
        setShadesHyperlink(getShadesWidgetHyperlink());
        const currentName = getShadesWidgetName();
        setShadesName(currentName === DEFAULT_SHADES_WIDGET_NAME ? "" : currentName);
        setShadesCo2Constant(String(getShadesCo2Constant()));
        setShadesImageUrl(getShadesWidgetImage());
        setShadesDescription(getShadesWidgetDescription());
        setShadesImageError("");
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
            setShadesDialogOpen(false);
        } catch (e) {
            console.error(e);
            setErrorSnackbarOpen(true);
        }
    };

    const handleEnergyCheckboxChange = (key) => {
        const normKey = normalizeWidgetKey(key);
        setEnergySelected((prev) => {
            const next = prev.includes(normKey)
                ? prev.filter((item) => item !== normKey)
                : [...prev, normKey];
            energySelectedRef.current = next;
            persistWidgetVisibility(next, spaceSelectedRef.current);
            return next;
        });
    };

    const handleSpaceCheckboxChange = (key) => {
        const normKey = normalizeWidgetKey(key);
        setSpaceSelected((prev) => {
            const next = prev.includes(normKey)
                ? prev.filter((item) => item !== normKey)
                : [...prev, normKey];
            spaceSelectedRef.current = next;
            persistWidgetVisibility(energySelectedRef.current, next);
            return next;
        });
    };

    const allWidgetKeys = useMemo(() => {
        const keys = [
            ...energyCheckboxRows.map(({ key }) => normalizeWidgetKey(key)),
            ...spaceCheckboxRows.map(({ key }) => normalizeWidgetKey(key)),
        ];
        return Array.from(new Set(keys));
    }, [energyCheckboxRows, spaceCheckboxRows]);

    // Combined is mutually exclusive with individuals — after Select All, Combined is
    // stripped but must still count as "covered" or the checkbox unchecks on release.
    const isSelectAllKeySatisfied = useCallback(
        (k) => {
            if (energySelected.includes(k) || spaceSelected.includes(k)) return true;
            if (k === "consumption_saving") {
                return (
                    energySelected.includes("consumption") ||
                    energySelected.includes("savings_by_strategy")
                );
            }
            if (k === "instant_utilization_combined") {
                return (
                    spaceSelected.includes("instant_occupancy_count") ||
                    spaceSelected.includes("utilization_by_area")
                );
            }
            return false;
        },
        [energySelected, spaceSelected]
    );

    const allSelected =
        allWidgetKeys.length > 0 && allWidgetKeys.every((k) => isSelectAllKeySatisfied(k));

    // Single "Select All" should behave as a strict toggle:
    // checked => select all (respect Combined vs individual exclusion), unchecked => unselect all.
    const handleToggleAll = (e) => {
        const checked = !!e?.target?.checked;
        if (!checked) {
            energySelectedRef.current = [];
            spaceSelectedRef.current = [];
            setEnergySelected([]);
            setSpaceSelected([]);
            persistWidgetVisibility([], []);
            return;
        }

        let nextEnergy = Array.from(
            new Set(energyCheckboxRows.map(({ key }) => normalizeWidgetKey(key)))
        );
        let nextSpace = Array.from(
            new Set(spaceCheckboxRows.map(({ key }) => normalizeWidgetKey(key)))
        );
        // Prefer individuals over Combined so Select All stays checked after persist.
        if (
            nextEnergy.includes("consumption") ||
            nextEnergy.includes("savings_by_strategy")
        ) {
            nextEnergy = nextEnergy.filter((k) => k !== "consumption_saving");
        }
        if (
            nextSpace.includes("instant_occupancy_count") ||
            nextSpace.includes("utilization_by_area")
        ) {
            nextSpace = nextSpace.filter((k) => k !== "instant_utilization_combined");
        }
        energySelectedRef.current = nextEnergy;
        spaceSelectedRef.current = nextSpace;
        setEnergySelected(nextEnergy);
        setSpaceSelected(nextSpace);
        persistWidgetVisibility(nextEnergy, nextSpace);
    };

    const handleAreaSave = () => {
        // Use live state (not only refs) so Save cannot revert a just-toggled chart.
        energySelectedRef.current = energySelected;
        spaceSelectedRef.current = spaceSelected;
        overviewSelectedRef.current = overviewSelected;
        persistWidgetVisibility(energySelected, spaceSelected);
        // Old key caused cross-tab conflicts; clear it.
        localStorage.removeItem("selectedWidgets");
        setAreaSnackbarOpen(true);
    };

    const handleOpenCustomGraph = () => {
        dispatch(fetchAreaGroups());
        setCustomGraphDialogError("");
        setCustomGraphOpen(true);
    };

    const handleSaveCustomGraph = async (payload) => {
        const trimmedName = String(payload?.name ?? "").trim();
        if (!trimmedName) return;
        if (isNewCustomGraphNameDuplicate(trimmedName)) {
            setCustomGraphDialogError("Name already exists. Change the widget name.");
            throw new Error("duplicate-custom-graph-name");
        }

        try {
            const multiFloorEnergy =
                payload.page === "energy" &&
                Array.isArray(payload.floor_ids) &&
                payload.floor_ids.length >= 2;
            const created = await dispatch(
                createCustomGraph({
                    ...payload,
                    name: trimmedName,
                    graph_type: multiFloorEnergy ? "bar" : payload.graph_type,
                })
            ).unwrap();

            await dispatch(fetchCustomGraphs()).unwrap();
            setCustomGraphVisibilityEnabled(payload.page, created?.id);
            window.dispatchEvent(new CustomEvent("customGraphsUpdated"));
            setCustomGraphOpen(false);
            setCustomGraphDialogError("");
            setCustomGraphSnackbarOpen(true);
        } catch (e) {
            if (e?.message === "duplicate-custom-graph-name") {
                throw e;
            }
            const msg =
                typeof e === "string"
                    ? e
                    : e && typeof e === "object"
                        ? JSON.stringify(e)
                        : "Failed to add new graph";
            setCustomGraphDialogError(msg);
            setCustomGraphErrorMessage(msg);
            setCustomGraphErrorOpen(true);
            throw e;
        }
    };

    const openDeleteGraph = (id) => {
        setDeleteGraphId(String(id ?? ""));
        setDeleteGraphOpen(true);
    };

    const handleConfirmDeleteGraph = async () => {
        if (!deleteGraphId) return;
        try {
            const storageKey = "customGraphs";
            const raw = localStorage.getItem(storageKey);
            const parsed = raw ? JSON.parse(raw) : [];
            const list = Array.isArray(parsed) ? parsed : [];
            const nextList = list.filter((g) => String(g?.id ?? "") !== String(deleteGraphId));
            localStorage.setItem(storageKey, JSON.stringify(nextList));

            deleteCustomGraphVisibility(deleteGraphId);
            await dispatch(fetchCustomGraphs()).unwrap();
            window.dispatchEvent(new CustomEvent("customGraphsUpdated"));

            setDeleteGraphOpen(false);
        } catch (e) {
            const msg =
                typeof e === "string"
                    ? e
                    : e && typeof e === "object"
                        ? JSON.stringify(e)
                        : "Failed to delete graph";
            setCustomGraphErrorMessage(msg);
            setCustomGraphErrorOpen(true);
        }
    };


    useEffect(() => {
        // Only fetch if not already loaded
        const isEmptyArray = Array.isArray(widgetList) && widgetList.length === 0;
        const isMissingTitlesObj =
            widgetList &&
            !Array.isArray(widgetList) &&
            typeof widgetList === "object" &&
            !Array.isArray(widgetList.titles);

        if (!widgetList || isEmptyArray || isMissingTitlesObj) {
            dispatchFetchWidgetTitlesOnce(dispatch, fetchRenameWidgets);
        }
    }, [dispatch, widgetList]);

    useEffect(() => {
        dispatchFetchCustomGraphsOnce(dispatch, fetchCustomGraphs);
    }, [dispatch]);

    // Hydrate visibility from DB (source of truth) into local cache + UI.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const action = await dispatchFetchWidgetConfigurationOnce(
                    dispatch,
                    fetchWidgetConfiguration
                );
                if (cancelled) return;
                let items = null;
                if (action && fetchWidgetConfiguration.fulfilled.match(action)) {
                    items = action.payload;
                } else {
                    items = selectWidgetConfiguration(store.getState());
                }
                if (!Array.isArray(items) || items.length === 0) return;
                const root = hydrateCustomizedVisibilityFromApiItems(items);
                if (!root || cancelled) return;
                setWidgetVisibility(root);
                setOverviewSelected(resolveCustomizedOverviewSelectedKeys(root));
                setEnergySelected(resolveCustomizedEnergySelectedKeys(root));
                setSpaceSelected(resolveCustomizedSpaceSelectedKeys(root));
                window.dispatchEvent(new CustomEvent("widgetVisibilityUpdated"));
            } catch {
                /* keep local cache */
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [dispatch, store]);

    // Monitor for rename errors
    useEffect(() => {
        if (renameError) {
            setErrorSnackbarOpen(true);
        }
    }, [renameError]);

    useEffect(() => {
        const vis = parseWidgetVisibilityFromLocalStorage();
        setWidgetVisibility(vis);

        const energyEmpty = isCustomizedVisibilitySectionEmpty(vis?.energy);
        const spaceEmpty = isCustomizedVisibilitySectionEmpty(vis?.space);

        // Prefer stored selection. Empty prefs → Combined defaults (first visit only).
        const nextEnergySelected = resolveCustomizedEnergySelectedKeys(vis).map((k) =>
            normalizeWidgetKey(k)
        );
        const nextSpaceSelected = resolveCustomizedSpaceSelectedKeys(vis).map((k) =>
            normalizeWidgetKey(k)
        );

        energySelectedRef.current = Array.from(new Set(nextEnergySelected));
        spaceSelectedRef.current = Array.from(new Set(nextSpaceSelected));
        setEnergySelected(energySelectedRef.current);
        setSpaceSelected(spaceSelectedRef.current);
        setOverviewSelected(resolveCustomizedOverviewSelectedKeys(vis));

        // Seed Combined defaults only when both sections are truly empty — never
        // overwrite an existing Advanced/Customized selection when widget lists load later.
        if (energyEmpty && spaceEmpty) {
            persistWidgetVisibility(
                energySelectedRef.current,
                spaceSelectedRef.current
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [energyItems.length, spaceItems.length]);

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

    /** One card per widget: fixed control + chip columns, flexible title, fixed-width actions so icons line up. */
    const widgetRowCardSx = {
        display: "flex",
        alignItems: "center",
        gap: 1,
        width: "100%",
        minHeight: 52,
        py: 1,
        px: 1.25,
        borderRadius: 1.5,
        border: "1px solid rgba(255,255,255,0.1)",
        backgroundColor: "rgba(0,0,0,0.22)",
        boxSizing: "border-box",
    };

    const widgetRowControlSlotSx = {
        width: 52,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    };

    const widgetRowChipSlotSx = {
        flexShrink: 0,
        width: 80,
        display: "flex",
        justifyContent: "center",
    };

    const widgetRowTitleSx = {
        flex: 1,
        minWidth: 0,
        color: "#fff",
        fontSize: 14,
        fontWeight: 500,
        lineHeight: 1.35,
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
        wordBreak: "break-word",
    };

    const widgetRowActionsSx = {
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        width: 84,
        mr: -0.5,
    };

    /** Inner track: edit + optional delete (or spacer) so the pencil lines up across built-in vs custom rows. */
    const widgetRowActionsInnerSx = {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        width: 80,
        flexShrink: 0,
    };

    const builtinVisibilitySwitchSx = {
        flexShrink: 0,
        "& .MuiSwitch-switchBase.Mui-checked": {
            color: "#66bb6a",
            "&:hover": { backgroundColor: "rgba(102, 187, 106, 0.12)" },
        },
        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
            backgroundColor: "#43a047",
            opacity: 1,
        },
        "& .MuiSwitch-switchBase:not(.Mui-checked)": {
            color: "rgba(255,255,255,0.45)",
        },
        "& .MuiSwitch-switchBase:not(.Mui-checked) + .MuiSwitch-track": {
            backgroundColor: "rgba(183, 28, 28, 0.45)",
            opacity: 1,
        },
    };

    const customizedWidgetsPanelScrollSx = {
        minHeight: 0,
        maxHeight: { xs: "none", md: "calc(100vh - 120px)" },
        overflowY: { xs: "visible", md: "auto" },
        overflowX: "hidden",
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(255,255,255,0.4) rgba(0,0,0,0.15)",
        "&::-webkit-scrollbar": { width: "10px" },
        "&::-webkit-scrollbar-track": {
            background: "rgba(0,0,0,0.12)",
            borderRadius: "8px",
        },
        "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(255,255,255,0.38)",
            borderRadius: "8px",
            border: "2px solid transparent",
            backgroundClip: "padding-box",
        },
    };

    return (
        <Grid
            container
            sx={{
                alignItems: "flex-start",
                ml: "18px",
                p: "18px",
                boxSizing: "border-box",
            }}
        >
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
                <SettingsSidebar items={visibleSidebarItemsWithPaths} embedded />
            </Grid>

            {/* Right panel */}
            <Grid
                item
                xs={12}
                md={9}
                sx={{
                    p: 3,
                    borderTopRightRadius: 2,
                    borderBottomRightRadius: 2,
                    display: "flex",
                    flexDirection: "column",
                    boxSizing: "border-box",
                    ...customizedWidgetsPanelScrollSx,
                }}
            >
                <Box
                    sx={{
                        maxWidth: 1100,
                        width: "100%",
                        pb: 1,
                    }}
                >
                    <Box sx={{ mb: 2 }}>
                        <Typography sx={{ color: "#fff", fontWeight: 600, mb: 1, fontSize: 16 }}>
                            Add Widgets
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                            <Button
                                variant="contained"
                                onClick={handleOpenCustomGraph}
                                disabled={customGraphsLoading}
                                sx={{
                                    bgcolor: "#232323",
                                    color: "#fff",
                                    textTransform: "none",
                                    "&:hover": { bgcolor: "#1E1E1E" },
                                }}
                            >
                                Add New Widget
                            </Button>
                            {customGraphsError ? (
                                <Typography sx={{ color: "#ffb3b3", fontSize: 12 }}>
                                    {typeof customGraphsError === "string"
                                        ? customGraphsError
                                        : "Failed to load custom graphs"}
                                </Typography>
                            ) : null}
                        </Box>
                    </Box>

                    <Box sx={{ mb: 3 }}>
                        <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: 14, mb: 1 }}>
                            Dashboard Overview
                        </Typography>
                        <Grid container spacing={1} columnSpacing={2}>
                            {CUSTOMIZED_OVERVIEW_WIDGET_ROWS.map((row) => (
                                <Grid item xs={12} sm={6} key={row.key}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <FormControlLabel
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                ml: 0,
                                                mr: 0,
                                                color: "#fff",
                                                "& .MuiFormControlLabel-label": {
                                                    color: "#fff",
                                                    fontSize: 14,
                                                },
                                            }}
                                            control={
                                                <Switch
                                                    size="small"
                                                    checked={overviewSelected.includes(normalizeWidgetKey(row.key))}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        handleOverviewVisibilitySwitch(row.key, e.target.checked);
                                                    }}
                                                    sx={builtinVisibilitySwitchSx}
                                                />
                                            }
                                            label={row.label}
                                        />
                                        {row.key === "shades" ? (
                                            <IconButton
                                                size="small"
                                                onClick={() => setShadesDialogOpen(true)}
                                                sx={{
                                                    color: "#fff",
                                                    border: "1px solid rgba(255,255,255,0.2)",
                                                    borderRadius: "6px",
                                                    p: "4px",
                                                }}
                                            >
                                                <LinkIcon sx={{ fontSize: 16 }} />
                                            </IconButton>
                                        ) : null}
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>

                    <FormControlLabel
                        sx={{
                            mb: 1,
                            color: "#fff",
                            "& .MuiFormControlLabel-label": { color: "#fff" },
                        }}
                        control={
                            <Checkbox
                                checked={allSelected}
                                onChange={handleToggleAll}
                                sx={{
                                    color: "rgba(255, 255, 255, 0.85)",
                                    "&.Mui-checked": {
                                        color: "#4caf50",
                                    },
                                    "&.MuiCheckbox-indeterminate": {
                                        color: "#4caf50",
                                    },
                                    "&.Mui-checked .MuiSvgIcon-root": {
                                        color: "#4caf50",
                                    },
                                }}
                            />
                        }
                        label={"Select All Widgets"}
                    />

                    <Grid container spacing={1.5} sx={{ mt: 0 }}>
                        {unifiedGraphRows.map((row) => (
                            <Grid item xs={12} sm={6} md={6} lg={4} key={`${row.section}:${row.key}`}>
                                <Box sx={widgetRowCardSx}>
                                    <Box sx={widgetRowControlSlotSx}>
                                        {row.isCustom ? (
                                            <Checkbox
                                                checked={
                                                    row.section === "energy"
                                                        ? energySelected.includes(normalizeWidgetKey(row.key))
                                                        : spaceSelected.includes(normalizeWidgetKey(row.key))
                                                }
                                                onChange={() =>
                                                    row.section === "energy"
                                                        ? handleEnergyCheckboxChange(row.key)
                                                        : handleSpaceCheckboxChange(row.key)
                                                }
                                                sx={{ color: "#fff", p: 0.5 }}
                                            />
                                        ) : (
                                            <Tooltip
                                                title={
                                                    row.key === "consumption_saving" && anyEnergyIndividualOn
                                                        ? "Turn off Consumption and Savings by Strategy to enable Energy (Combined)."
                                                        : row.key === "instant_utilization_combined" &&
                                                            anyOneSpaceCombinedConflictOn
                                                          ? "Turn off Instant Occupancy Count and Utilization By Area to enable Space Utilization (Combined)."
                                                          : "On: visible on dashboard. Off: hidden."
                                                }
                                            >
                                                <span>
                                                    <Switch
                                                        size="small"
                                                        checked={
                                                            row.section === "energy"
                                                                ? energySelected.includes(normalizeWidgetKey(row.key))
                                                                : spaceSelected.includes(normalizeWidgetKey(row.key))
                                                        }
                                                        disabled={
                                                            (row.key === "consumption_saving" &&
                                                                anyEnergyIndividualOn) ||
                                                            (row.key === "instant_utilization_combined" &&
                                                                anyOneSpaceCombinedConflictOn)
                                                        }
                                                        onChange={(e) => {
                                                            e.stopPropagation();
                                                            handleBuiltinVisibilitySwitch(row, e.target.checked);
                                                        }}
                                                        inputProps={{
                                                            "aria-label": `${row.dropdown_name || row.key} dashboard visibility`,
                                                        }}
                                                        sx={builtinVisibilitySwitchSx}
                                                    />
                                                </span>
                                            </Tooltip>
                                        )}
                                    </Box>
                                    <Box sx={widgetRowChipSlotSx}>
                                        <Chip
                                            label={row.section === "energy" ? "Energy" : "Space"}
                                            size="small"
                                            sx={{
                                                height: 24,
                                                minWidth: 72,
                                                fontSize: 11,
                                                fontWeight: 600,
                                                bgcolor:
                                                    row.section === "energy"
                                                        ? "rgba(59,130,246,0.4)"
                                                        : "rgba(168,85,247,0.4)",
                                                color: "#fff",
                                                border: "1px solid rgba(255,255,255,0.14)",
                                            }}
                                        />
                                    </Box>
                                    <Typography sx={widgetRowTitleSx} title={row.dropdown_name}>
                                        {row.dropdown_name}
                                    </Typography>
                                    <Box sx={widgetRowActionsSx}>
                                        <Box sx={widgetRowActionsInnerSx}>
                                            <Tooltip title="Edit display name or graph">
                                                <span>
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleCheckboxRowEdit(row);
                                                        }}
                                                        disabled={renameLoading && !row.isCustom}
                                                        sx={{ color: "rgba(255,255,255,0.88)" }}
                                                        aria-label="Edit"
                                                    >
                                                        <EditOutlinedIcon fontSize="small" />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                            {row.isCustom ? (
                                                <Tooltip title="Delete this custom graph">
                                                    <span>
                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCheckboxRowDelete(row);
                                                            }}
                                                            sx={{ color: "rgba(255,180,180,0.95)" }}
                                                            aria-label="Delete custom graph"
                                                        >
                                                            <DeleteOutlineIcon fontSize="small" />
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                            ) : (
                                                <Box
                                                    sx={{
                                                        width: 40,
                                                        height: 40,
                                                        flexShrink: 0,
                                                        pointerEvents: "none",
                                                    }}
                                                    aria-hidden
                                                />
                                            )}
                                        </Box>
                                    </Box>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>

                    <Box sx={{ mt: 2 }}>
                        <Button
                            variant="contained"
                            onClick={handleAreaSave}
                            sx={{
                                bgcolor: "#232323",
                                color: "#fff",
                                textTransform: "none",
                            }}
                        >
                            Save
                        </Button>
                    </Box>
                </Box>

                {/* Snackbar for saving selected areas */}
                <Snackbar
                    open={areaSnackbarOpen}
                    autoHideDuration={3000}
                    onClose={() => setAreaSnackbarOpen(false)}
                    anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                >
                    <Alert
                        onClose={() => setAreaSnackbarOpen(false)}
                        severity="success"
                        variant="filled"
                        sx={{ width: "100%" }}
                    >
                        Areas Saved Successfully!
                    </Alert>
                </Snackbar>

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
                        Changes saved.
                    </Alert>
                </Snackbar>

                {/* Error Snackbar */}
                <Snackbar
                    open={errorSnackbarOpen}
                    autoHideDuration={5000}
                    onClose={() => {
                        setErrorSnackbarOpen(false);
                        dispatch(clearRenameWidgetError());
                    }}
                    anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                >
                    <Alert
                        onClose={() => {
                            setErrorSnackbarOpen(false);
                            dispatch(clearRenameWidgetError());
                        }}
                        severity="error"
                        variant="filled"
                        sx={{ width: "100%" }}
                    >
                        {typeof renameError === "string"
                            ? renameError
                            : renameError
                                ? JSON.stringify(renameError)
                                : "Failed to rename widget. Please try again."}
                    </Alert>
                </Snackbar>

                <Snackbar
                    open={customGraphSnackbarOpen}
                    autoHideDuration={3000}
                    onClose={() => setCustomGraphSnackbarOpen(false)}
                    anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                >
                    <Alert
                        onClose={() => setCustomGraphSnackbarOpen(false)}
                        severity="success"
                        variant="filled"
                        sx={{ width: "100%" }}
                    >
                        Graph Added Successfully!
                    </Alert>
                </Snackbar>

                <Snackbar
                    open={customGraphErrorOpen}
                    autoHideDuration={6000}
                    onClose={() => setCustomGraphErrorOpen(false)}
                    anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                >
                    <Alert
                        onClose={() => setCustomGraphErrorOpen(false)}
                        severity="error"
                        variant="filled"
                        sx={{ width: "100%" }}
                    >
                        {customGraphErrorMessage || "Failed to add new graph"}
                    </Alert>
                </Snackbar>

                <AddCustomGraphDialog
                    open={customGraphOpen}
                    onClose={() => {
                        setCustomGraphDialogError("");
                        setCustomGraphOpen(false);
                    }}
                    onSave={handleSaveCustomGraph}
                    saving={customGraphsLoading}
                    errorMessage={customGraphDialogError}
                    dialogProps={customizedModalBackdropProps}
                    primaryActionSx={{
                        textTransform: "none",
                        bgcolor: "#232323",
                        "&:hover": { bgcolor: "#1E1E1E" },
                    }}
                />

                <Dialog open={deleteGraphOpen} onClose={() => setDeleteGraphOpen(false)} maxWidth="xs" fullWidth>
                    <DialogTitle>Delete Widget</DialogTitle>
                    <DialogContent dividers>
                        <Typography sx={{ fontSize: 14 }}>
                            Are you sure you want to delete widget?
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteGraphOpen(false)} sx={{ textTransform: "none" }}>
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleConfirmDeleteGraph}
                            sx={{
                                textTransform: "none",
                                bgcolor: "#b91c1c",
                                "&:hover": { bgcolor: "#991b1b" },
                            }}
                        >
                            Delete
                        </Button>
                    </DialogActions>
                </Dialog>

                <Dialog open={graphEditOpen} onClose={() => setGraphEditOpen(false)} maxWidth={graphEditIsCustom ? "md" : "sm"} fullWidth>
                    <DialogTitle>{graphEditIsCustom ? "Edit graph" : "Edit widget"}</DialogTitle>
                    <DialogContent dividers>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            {graphEditIsCustom ? (
                                <>
                                    <FormControl fullWidth size="small" sx={controlSx}>
                                        <Typography sx={{ fontSize: 13, mb: 0.5, color: "rgba(255,255,255,0.9)" }}>
                                            Page
                                        </Typography>
                                        <Select
                                            value={graphEditPage}
                                            onChange={(e) => setGraphEditPage(e.target.value)}
                                        >
                                            <MenuItem value="energy">Energy</MenuItem>
                                            <MenuItem value="space">Space Utilization</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <FormControl fullWidth size="small" sx={controlSx}>
                                        <Typography sx={{ fontSize: 13, mb: 0.5, color: "rgba(255,255,255,0.9)" }}>
                                            Graph type
                                        </Typography>
                                        <Select
                                            value={graphEditGraphType}
                                            onChange={(e) => setGraphEditGraphType(e.target.value)}
                                        >
                                            <MenuItem value="bar">Bar</MenuItem>
                                            <MenuItem value="pie">Pie</MenuItem>
                                            <MenuItem value="line">Line</MenuItem>
                                            <MenuItem value="table">Table</MenuItem>
                                        </Select>
                                    </FormControl>
                                </>
                            ) : null}
                            <TextField
                                label={graphEditIsCustom ? "Graph name" : "Display name"}
                                value={graphEditName}
                                onChange={(e) => setGraphEditName(e.target.value)}
                                size="small"
                                fullWidth
                                sx={controlSx}
                            />
                            {graphEditIsCustom ? (
                                <Box sx={{ color: "rgba(255,255,255,0.9)" }}>
                                    <FormControl fullWidth size="small" sx={controlSx}>
                                        <Typography
                                            sx={{
                                                fontSize: 13,
                                                mb: 0.5,
                                                color: "rgba(255,255,255,0.9)",
                                            }}
                                        >
                                            API Path (optional)
                                        </Typography>
                                        <Select
                                            value={graphEditApiPath}
                                            onChange={(e) => setGraphEditApiPath(e.target.value)}
                                            displayEmpty
                                        >
                                            <MenuItem value="">
                                                Auto (choose from name keywords)
                                            </MenuItem>
                                            {apiPathDropdownOptions.map((p) => (
                                                <MenuItem key={p} value={p}>
                                                    {formatApiPathLabel(p)}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        <Typography
                                            sx={{
                                                fontSize: 11,
                                                color: "rgba(255,255,255,0.65)",
                                                mt: 0.5,
                                            }}
                                        >
                                            If left on Auto, the API is inferred from the name.
                                        </Typography>
                                    </FormControl>
                                    <FormControl fullWidth size="small" sx={controlSx}>
                                        <Typography sx={{ fontSize: 13, mb: 0.5, color: "rgba(255,255,255,0.9)" }}>
                                            Scope Target
                                        </Typography>
                                        <Select
                                            value={graphEditScopeTarget}
                                            onChange={(e) => setGraphEditScopeTarget(e.target.value)}
                                        >
                                            <MenuItem value="location">Floors / Areas</MenuItem>
                                            <MenuItem value="group">Area Groups</MenuItem>
                                        </Select>
                                    </FormControl>

                                    {graphEditScopeTarget === "location" ? (
                                        <CustomGraphScopeSection
                                            mode={graphEditScopeMode}
                                            onModeChange={setGraphEditScopeMode}
                                            draft={graphEditScopeDraft}
                                            onDraftChange={setGraphEditScopeDraft}
                                        />
                                    ) : (
                                        <Box sx={{ mt: 1, p: 1.5, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 1, bgcolor: "rgba(255,255,255,0.05)" }}>
                                            <Typography sx={{ fontSize: 13, mb: 1, fontWeight: 600, color: "#fff" }}>Select Area Groups</Typography>
                                            <CustomGraphScopedGroupPicker
                                                dark
                                                groupScope="user_only"
                                                value={graphEditAreaGroupIds}
                                                onChange={setGraphEditAreaGroupIds}
                                                disabled={customGraphsLoading}
                                            />
                                            <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.6)", mt: 1 }}>
                                                Graph will aggregate data from the selected User Area Groups.
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            ) : null}
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setGraphEditOpen(false)} sx={{ textTransform: "none" }}>
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleSaveGraphEdit}
                            disabled={
                                !graphEditName.trim() ||
                                (graphEditIsCustom ? customGraphsLoading : renameLoading)
                            }
                            sx={{ textTransform: "none", bgcolor: "#232323", "&:hover": { bgcolor: "#1E1E1E" } }}
                        >
                            {graphEditIsCustom
                                ? customGraphsLoading
                                    ? "Saving..."
                                    : "Save"
                                : renameLoading
                                    ? "Saving..."
                                    : "Save"}
                        </Button>
                    </DialogActions>
                </Dialog>

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
                            sx={{ ...controlSx, mb: 2 }}
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
                                    sx={{ width: 48, height: 48, objectFit: "contain", borderRadius: 1, border: "1px solid #e5e7eb" }}
                                />
                            ) : null}
                            {shadesImageUrl ? (
                                <Button size="small" onClick={() => setShadesImageUrl("")} sx={{ textTransform: "none" }}>
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
                            sx={{ ...controlSx, mb: 2 }}
                        />
                        <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#2E2E2E", mb: 1 }}>
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
                            sx={controlSx}
                        />
                        <Typography sx={{ fontSize: 11, color: "rgba(0, 0, 0, 0.54)", mt: 1 }}>
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
                            sx={{ textTransform: "none", bgcolor: "#232323", "&:hover": { bgcolor: "#1E1E1E" } }}
                        >
                            Save
                        </Button>
                    </DialogActions>
                </Dialog>
            </Grid>
        </Grid>
    );
}

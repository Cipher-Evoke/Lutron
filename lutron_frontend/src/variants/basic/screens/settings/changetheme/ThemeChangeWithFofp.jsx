import React, { useContext, useEffect, useRef, useState, useMemo } from 'react';
import { resolvePublicAssetUrl } from "../../../../../shared/utils/resolveMediaUrl";
import { createSingleFlight } from "../../../../../shared/utils/createSingleFlight";
import {
    buildThemeApplicationSaveKey,
    buildThemeHeatmapSaveKey,
} from "../../../../../shared/utils/themeSettingsSaveKey";
import { Box, Button, Grid, Typography, useTheme, useMediaQuery } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import HexColorPicker, { HEX_PICKER_DEFAULT_WHITE_SWATCH } from '../../../utils/HexColorPicker';
import '../../../styles/HexColorPicker.css';
import {
    BASIC_MANAGE_AREA_GROUPS_PATH,
} from '../../../utils/basicSettingsPaths';
import { getVisibleSidebarItems } from '../../../utils/sidebarItems';
import {
    clearBackgroundImage,
    fetchApplicationTheme,
    fetchBackgroundImage,
    fetchHeatMapTheme,
    fetchThemeSettings,
    selectApplicationTheme,
    selectBackgroundImage,
    selectHeatMapTheme,
    updateApplicationTheme,
    updateBackgroundImage,
    updateHeatMapTheme
} from '../../../redux/slice/theme/themeSlice';
import { Snackbar, Alert } from '@mui/material';
import { ThemeContext } from '../theme/ThemeContext';
import { UseAuth, getVisibleSidebarItemsWithPaths } from '../../../customhooks/UseAuth';
import { getLutronDataClient } from '../../../redux/slice/home/homeSlice';
import UiVariantSelector from '../../../../../components/UiVariantSelector';
import {
    dispatchFetchApplicationThemeOnce,
    dispatchFetchBackgroundImageOnce,
    dispatchFetchClientOnce,
    dispatchFetchHeatMapThemeOnce,
    dispatchFetchThemeSettingsOnce,
    syncApplicationThemeSessionCache,
} from '../../../../../shared/utils/bootstrapFetchGuards';
import {
    DEFAULT_APP_BACKGROUND,
    DEFAULT_APP_CONTENT,
    isLightSurface,
} from '../../../utils/themeOnSurface';
import { settingsSidebarColumnDividerSx } from '../../../utils/settingsSidebarTabStyles';
import SettingsSidebarNav from '../../../components/SettingsSidebarNav';
import FofpThemeColorCard from './FofpThemeColorCard';
import {
    BASIC_THEME_PICKER_HEX,
    themePickerCardCellSx,
    themePickerCardColumnSx,
    themePickerCardsGridSx,
    themePickerCardSurfaceSx,
    themePickerTitleSpacerSx,
    themePickerActionsSx,
} from './themePickerLayout';

const ThemeChange = () => {
    const normalizeColor = (color) => {
        if (typeof color === 'string' && color.startsWith('hsl')) {
            const [h, s, l] = color.match(/\d+/g).map(Number);
            return hslToHex(h, s, l);
        }
        return color;
    };

    const hslToHex = (h, s, l) => {
        s /= 100;
        l /= 100;
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c / 2;
        let r, g, b;

        if (0 <= h && h < 60) [r, g, b] = [c, x, 0];
        else if (60 <= h && h < 120) [r, g, b] = [x, c, 0];
        else if (120 <= h && h < 180) [r, g, b] = [0, c, x];
        else if (180 <= h && h < 240) [r, g, b] = [0, x, c];
        else if (240 <= h && h < 300) [r, g, b] = [x, 0, c];
        else[r, g, b] = [c, 0, x];

        const toHex = n => {
            const hex = Math.round((n + m) * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };

        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    };

    const theme = useTheme();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const runThemeSaveOnce = useMemo(() => createSingleFlight(), []);
    const runThemeResetOnce = useMemo(() => createSingleFlight(), []);
    const runHeatmapSaveOnce = useMemo(() => createSingleFlight(), []);
    const lastThemeSaveKeyRef = useRef(null);
    const lastHeatmapSaveKeyRef = useRef(null);
    const [themeBusy, setThemeBusy] = useState(false);
    const [heatmapBusy, setHeatmapBusy] = useState(false);
    const { reloadTheme } = useContext(ThemeContext);
    const appTheme = useSelector(selectApplicationTheme);
    const heatMapTheme = useSelector(selectHeatMapTheme)
    const apibgImage = useSelector(selectBackgroundImage)
    const DEFAULT_THEME_COLORS = {
        Background: DEFAULT_APP_BACKGROUND,
        Content: DEFAULT_APP_CONTENT,
        Button: '#232323',
    };

    const [themeColorMap, setThemeColorMap] = useState({
        Background: DEFAULT_APP_BACKGROUND,
        Content: DEFAULT_APP_CONTENT,
        Button: '#232323',
    });

    const [heatmapColorMap, setHeatmapColorMap] = useState({
        Light: '#f2ff00',
        Occupancy: '#4318d1',
        Energy: '#006400'
    });
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');
    const [selectedThemeColor, setSelectedThemeColor] = useState('#ffffff');
    const [selectedHeatmapColor, setSelectedHeatmapColor] = useState('#ffffff');

    const settingsSidebarMdUp = useMediaQuery(theme.breakpoints.up('md'));

    const [activeThemeTab, setActiveThemeTab] = useState('Background');
    const [activeHeatmapTab, setActiveHeatmapTab] = useState('Light');
    const [themePickerKey, setThemePickerKey] = useState(0);
    const [dynamicButtonColor, setDynamicButtonColor] = useState('#232323');
    useEffect(() => {
        dispatchFetchClientOnce(dispatch, getLutronDataClient);
    }, [dispatch]);

    useEffect(() => {
        setDynamicButtonColor(themeColorMap?.Button || '#232323');
    }, [themeColorMap?.Button]);

    const actionButtonLabel = isLightSurface(dynamicButtonColor)
        ? "rgba(0, 0, 0, 0.87)"
        : "#ffffff";

    // const filename = file.name;  // or use a UUID generator if needed
    // const backendUrl = `http://localhost:8000/background_image/${file.name}`;
    // setBackgroundImage(backendUrl);

    useEffect(() => {
        // Only fetch if not already loaded
        if (!appTheme || !appTheme.application_theme) {
            dispatchFetchApplicationThemeOnce(dispatch, fetchApplicationTheme);
        }
        if (!heatMapTheme || !heatMapTheme.application_theme) {
            dispatchFetchHeatMapThemeOnce(dispatch, fetchHeatMapTheme);
        }
        const bgApiLoaded =
            apibgImage &&
            (apibgImage.status != null || Object.prototype.hasOwnProperty.call(apibgImage, 'background_image'));
        if (!bgApiLoaded) {
            dispatchFetchBackgroundImageOnce(dispatch, fetchBackgroundImage);
        }
    }, [dispatch, appTheme, heatMapTheme, apibgImage]);

    // Keep local pickers in sync with Redux, but never clobber in-progress edits.
    // heatMapTheme must not reset Background/Content/Button (and vice versa).
    const themeDirtyRef = useRef(false);
    const heatmapDirtyRef = useRef(false);
    const lastSyncedAppThemeKeyRef = useRef(null);
    const lastSyncedHeatmapKeyRef = useRef(null);

    const setThemeColorMapFromPicker = (updater) => {
        themeDirtyRef.current = true;
        setThemeColorMap(updater);
    };

    const setHeatmapColorMapFromPicker = (updater) => {
        heatmapDirtyRef.current = true;
        setHeatmapColorMap(updater);
    };

    useEffect(() => {
        if (!appTheme?.application_theme) return;
        if (themeDirtyRef.current) return;

        const { background, content, button } = appTheme.application_theme;
        const updatedMap = {
            Background: background || DEFAULT_APP_BACKGROUND,
            Content: content || DEFAULT_APP_CONTENT,
            Button: button || '#232323',
        };
        const key = buildThemeApplicationSaveKey({
            background: updatedMap.Background,
            content: updatedMap.Content,
            button: updatedMap.Button,
        });
        if (lastSyncedAppThemeKeyRef.current === key) return;
        lastSyncedAppThemeKeyRef.current = key;

        setThemeColorMap(updatedMap);
        setSelectedThemeColor(normalizeColor(updatedMap[activeThemeTab] || '#ffffff'));
    }, [appTheme, activeThemeTab]);

    useEffect(() => {
        if (!heatMapTheme?.application_theme) return;
        if (heatmapDirtyRef.current) return;

        const { light, occupancy, energy } = heatMapTheme.application_theme;
        const normalizedHeatmap = {
            Light: normalizeColor(light || '#f2ff00'),
            Occupancy: normalizeColor(occupancy || '#4318d1'),
            Energy: normalizeColor(energy || '#006400'),
        };
        const key = buildThemeHeatmapSaveKey({
            light: normalizedHeatmap.Light,
            occupancy: normalizedHeatmap.Occupancy,
            energy: normalizedHeatmap.Energy,
        });
        if (lastSyncedHeatmapKeyRef.current === key) return;
        lastSyncedHeatmapKeyRef.current = key;

        setHeatmapColorMap(normalizedHeatmap);
        setSelectedHeatmapColor(normalizedHeatmap[activeHeatmapTab] || '#ffffff');
    }, [heatMapTheme, activeHeatmapTab]);

    const backgroundRemovedRef = useRef(false);

    useEffect(() => {
        if (backgroundRemovedRef.current) {
            const apiUrl = apibgImage?.background_image?.trim();
            setBackgroundImage(apiUrl || null);
            return;
        }
        const apiUrl = apibgImage?.background_image?.trim();
        if (apiUrl) {
            setBackgroundImage(apiUrl);
            return;
        }
        if (
            apibgImage &&
            (Object.prototype.hasOwnProperty.call(apibgImage, 'background_image') || apibgImage.status)
        ) {
            setBackgroundImage(null);
            return;
        }
        const legacyUrl = appTheme?.application_theme?.backgroundImageUrl?.trim();
        if (legacyUrl) {
            setBackgroundImage(legacyUrl);
            return;
        }
        setBackgroundImage(null);
    }, [apibgImage, appTheme]);

    // const handleThemeSave = () => {
    //     dispatch(updateApplicationTheme({
    //         background: themeColorMap.Background,
    //         content: themeColorMap.Content,
    //         button: themeColorMap.Button
    //     }));
    //     setSnackbarMessage("Theme colors saved successfully.");
    //     setSnackbarOpen(true);
    // };
    const handleThemeSave = async () => runThemeSaveOnce(async () => {
        const payload = {
            background: normalizeColor(themeColorMap.Background),
            content: normalizeColor(themeColorMap.Content),
            button: normalizeColor(themeColorMap.Button)
        };
        const saveKey = buildThemeApplicationSaveKey(payload);
        if (lastThemeSaveKeyRef.current === saveKey) {
            setSnackbarSeverity('info');
            setSnackbarMessage("No changes to save");
            setSnackbarOpen(true);
            return;
        }

        setThemeBusy(true);
        try {
            const response = await dispatch(updateApplicationTheme(payload)).unwrap();
            lastThemeSaveKeyRef.current = saveKey;
            themeDirtyRef.current = false;
            lastSyncedAppThemeKeyRef.current = saveKey;
            reloadTheme(payload, backgroundImage);
            const nextApplicationTheme = {
                ...(appTheme || {}),
                ...(response && typeof response === 'object' ? response : {}),
                application_theme: {
                    ...(appTheme?.application_theme || {}),
                    ...(response?.application_theme || {}),
                    ...payload,
                },
            };
            // Already persisted + session-cached; skip force GET /theme/application (duplicate Network row).
            syncApplicationThemeSessionCache(nextApplicationTheme);
            setSnackbarSeverity('success');
            setSnackbarMessage("Theme colors saved successfully.");
            setSnackbarOpen(true);
            if (typeof window !== 'undefined') {
                setTimeout(() => window.location.reload(), 300);
            }
        } catch (error) {
            // Optionally handle error feedback here
        } finally {
            setThemeBusy(false);
        }
    });

    const handleHeatmapSave = async () => runHeatmapSaveOnce(async () => {
        const payload = {
            light: normalizeColor(heatmapColorMap.Light),
            occupancy: normalizeColor(heatmapColorMap.Occupancy),
            energy: normalizeColor(heatmapColorMap.Energy),
        };
        const saveKey = buildThemeHeatmapSaveKey(payload);
        if (lastHeatmapSaveKeyRef.current === saveKey) {
            setSnackbarSeverity('info');
            setSnackbarMessage("No changes to save");
            setSnackbarOpen(true);
            return;
        }

        setHeatmapBusy(true);
        try {
            dispatch(updateHeatMapTheme(payload));
            lastHeatmapSaveKeyRef.current = saveKey;
            heatmapDirtyRef.current = false;
            lastSyncedHeatmapKeyRef.current = saveKey;
            // Publish single energy color to CSS variable for gradient usage
            if (typeof document !== 'undefined') {
                document.documentElement.style.setProperty('--heatmap-energy', normalizeColor(heatmapColorMap.Energy));
            }
            setSnackbarSeverity('success');
            setSnackbarMessage("Heatmap colors saved successfully.");
            setSnackbarOpen(true);
        } finally {
            setHeatmapBusy(false);
        }
    });

    // const handleThemeReset = () => {
    //     setThemeColorMap(DEFAULT_THEME_COLORS);
    //     setSelectedThemeColor(DEFAULT_THEME_COLORS[activeThemeTab]);
    //     dispatch(updateApplicationTheme({
    //         background: DEFAULT_THEME_COLORS.Background,
    //         content: DEFAULT_THEME_COLORS.Content,
    //         button: DEFAULT_THEME_COLORS.Button
    //     }));
    //     setSnackbarMessage("Theme colors reset to default.");
    //     setSnackbarOpen(true);
    // };
    const handleThemeReset = async () => runThemeResetOnce(async () => {
        const defaultColors = { ...DEFAULT_THEME_COLORS };

        setActiveThemeTab('Background');
        setThemeColorMap(defaultColors);
        setSelectedThemeColor(HEX_PICKER_DEFAULT_WHITE_SWATCH);
        setThemePickerKey((k) => k + 1);
        themeDirtyRef.current = false;

        const payload = {
            background: normalizeColor(defaultColors.Background),
            content: normalizeColor(defaultColors.Content),
            button: normalizeColor(defaultColors.Button),
        };
        const saveKey = buildThemeApplicationSaveKey(payload);
        lastSyncedAppThemeKeyRef.current = saveKey;
        if (lastThemeSaveKeyRef.current === saveKey) {
            setSnackbarSeverity('info');
            setSnackbarMessage("Theme already at default colors.");
            setSnackbarOpen(true);
            return;
        }

        setThemeBusy(true);
        try {
            const response = await dispatch(updateApplicationTheme(payload)).unwrap();
            lastThemeSaveKeyRef.current = saveKey;
            reloadTheme(payload);
            const nextApplicationTheme = {
                ...(appTheme || {}),
                ...(response && typeof response === 'object' ? response : {}),
                application_theme: {
                    ...(appTheme?.application_theme || {}),
                    ...(response?.application_theme || {}),
                    ...payload,
                },
            };
            // Already persisted + session-cached; skip force GET /theme/application (duplicate Network row).
            syncApplicationThemeSessionCache(nextApplicationTheme);
            setSnackbarSeverity('success');
            setSnackbarMessage("Theme colors reset to default.");
            setSnackbarOpen(true);
            if (typeof window !== 'undefined') {
                setTimeout(() => window.location.reload(), 300);
            }
        } catch (error) {
            // Optionally handle error feedback here
        } finally {
            setThemeBusy(false);
        }
    });
    //background image
    const [backgroundImage, setBackgroundImage] = useState(null);
    const fileInputRef = React.useRef();

    const handleBackgroundImageSave = async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        try {
            // 1. Upload image via Redux thunk (sends to /theme/background)
            const response = await dispatch(updateBackgroundImage(formData)).unwrap();

            // 2. Backend returns relative path like "/background_image/bg_1234.png"
            const backendPath = response?.background_image;

            if (backendPath) {
                backgroundRemovedRef.current = false;
                dispatch(updateApplicationTheme({ background_image: backendPath }));
                const bgResponse = await dispatch(fetchBackgroundImage()).unwrap();
                dispatchFetchThemeSettingsOnce(dispatch, fetchThemeSettings, { force: true });
                const bgUrl = bgResponse?.background_image?.trim();
                if (bgUrl) {
                    reloadTheme(
                        {
                            background: normalizeColor(themeColorMap.Background),
                            content: normalizeColor(themeColorMap.Content),
                            button: normalizeColor(themeColorMap.Button),
                        },
                        bgUrl
                    );
                }
            }
        } catch (error) {
            // Error uploading background image
        }
    };

    const handleBackgroundImageClear = async () => {
        try {
            await dispatch(clearBackgroundImage()).unwrap();
            backgroundRemovedRef.current = true;
            setBackgroundImage(null);
            const themePayload = {
                background: normalizeColor(themeColorMap.Background),
                content: normalizeColor(themeColorMap.Content),
                button: normalizeColor(themeColorMap.Button),
            };
            reloadTheme(themePayload, '');
            dispatchFetchThemeSettingsOnce(dispatch, fetchThemeSettings, { force: true });
            dispatchFetchBackgroundImageOnce(dispatch, fetchBackgroundImage, { force: true });
            dispatchFetchApplicationThemeOnce(dispatch, fetchApplicationTheme, { force: true });
            setSnackbarSeverity('success');
            setSnackbarMessage('Background image removed.');
            setSnackbarOpen(true);
        } catch (error) {
            setSnackbarSeverity('error');
            setSnackbarMessage('Failed to remove background image.');
            setSnackbarOpen(true);
        }
    };

    const triggerFileSelect = () => {
        if (fileInputRef.current) fileInputRef.current.click();
    };

    const themePickerCardSx = themePickerCardSurfaceSx;

    const renderTabs = (labels, active, setActive, colorMap, setSelectedColor) => (
        <Box className="pill-tab-container">
            {labels.map(label => (
                <button
                    key={label}
                    className={`pill-tab ${active === label ? 'active' : ''}`}
                    onClick={() => {
                        setActive(label);
                        setSelectedColor(normalizeColor(colorMap[label] ?? '#ffffff'));
                    }}
                >
                    {label}
                </button>
            ))}
        </Box>
    );

    const { role } = UseAuth();
    const userProfile = useSelector((state) => state.user?.profile);
    const visibleSidebarItems = getVisibleSidebarItems(role);
    const visibleSidebarItemsWithPaths = getVisibleSidebarItemsWithPaths(role);

    const normalizedRole = role ? role.toLowerCase() : '';
    const canAccessTheme = normalizedRole === 'superadmin' || normalizedRole === 'super admin' || normalizedRole === 'admin';
    // FOFP marker palette is Superadmin-only; Admin keeps Background + heatmap pickers.
    // Keep a 3-column grid so Admin's two cards stay the same width as Superadmin's.
    const canEditFofpThemeColor =
        normalizedRole === 'superadmin' || normalizedRole === 'super admin';

    useEffect(() => {
        if (!canAccessTheme) {
            navigate(BASIC_MANAGE_AREA_GROUPS_PATH, { replace: true });
        }
    }, [canAccessTheme, navigate]);

    if (!canAccessTheme) return null;

    const contentForSidebar = appTheme?.application_theme?.content || DEFAULT_APP_CONTENT;
    const isDefaultWhiteTheme = isLightSurface(contentForSidebar);

    return (
        <Grid container className="settings-layout-root" sx={{ ml: '18px', p: '18px', alignItems: 'flex-start' }}>
            {/* Full-width header (title + 2 horizontal dividers) — match Alerts */}
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

            {/* Sidebar — same column as Alerts */}
            <Grid
                item
                xs={12}
                md={2}
                sx={{
                    ...settingsSidebarColumnDividerSx(isDefaultWhiteTheme, settingsSidebarMdUp),
                }}
            >
                <SettingsSidebarNav items={visibleSidebarItemsWithPaths} />
            </Grid>
            {/* Color Pickers */}
            <Grid
                item
                xs={12}
                md={10}
                className="settings-main-content-column"
                sx={{
                    backgroundColor: isDefaultWhiteTheme ? '#ffffff' : contentForSidebar,
                    p: { xs: 1.5, md: 2 },
                    borderTopRightRadius: '10px',
                    borderBottomRightRadius: '10px',
                }}
            >
                <UiVariantSelector compact lightChrome={isDefaultWhiteTheme} />
                <Box sx={themePickerCardsGridSx(3)}>
                    {/* Theme Picker Card */}
                    <Box sx={themePickerCardCellSx}>
                        <Box sx={themePickerCardColumnSx}>
                            <Typography variant="subtitle1" sx={themePickerTitleSpacerSx} aria-hidden>
                                &nbsp;
                            </Typography>
                            <Box className="color-picker-card" sx={themePickerCardSx}>
                                {renderTabs(['Background', 'Content', 'Button'], activeThemeTab, setActiveThemeTab, themeColorMap, setSelectedThemeColor)}
                                <HexColorPicker
                                    key={themePickerKey}
                                    colorMap={themeColorMap}
                                    setColorMap={setThemeColorMapFromPicker}
                                    selectedColor={selectedThemeColor}
                                    setSelectedColor={setSelectedThemeColor}
                                    activeTarget={activeThemeTab}
                                    width={BASIC_THEME_PICKER_HEX.width}
                                    height={BASIC_THEME_PICKER_HEX.height}
                                    hexRadius={BASIC_THEME_PICKER_HEX.hexRadius}
                                />
                                <Box sx={{ ...themePickerActionsSx, justifyContent: 'space-between', px: 1.5, gap: 1.5 }}>
                                    <Button
                                        className="save-button"
                                        onClick={handleThemeReset}
                                        disabled={themeBusy}
                                        sx={{
                                            backgroundColor: dynamicButtonColor,
                                            color: actionButtonLabel,
                                            fontWeight: 'bold',
                                            px: 4,
                                            py: 1,
                                            borderRadius: 1,
                                        }}
                                    >
                                        {themeBusy ? 'Working…' : 'Reset'}
                                    </Button>
                                    <Button
                                        className="save-button"
                                        onClick={handleThemeSave}
                                        disabled={themeBusy}
                                        sx={{
                                            backgroundColor: dynamicButtonColor,
                                            color: actionButtonLabel,
                                            fontWeight: 'bold',
                                            px: 4,
                                            py: 1,
                                            borderRadius: 1,
                                        }}
                                    >
                                        {themeBusy ? 'Saving…' : 'Save'}
                                    </Button>
                                </Box>
                            </Box>
                        </Box>
                    </Box>

                    {/* Heatmap Picker Card */}
                    <Box sx={themePickerCardCellSx}>
                        <Box sx={themePickerCardColumnSx}>
                            <Typography variant="subtitle1" sx={themePickerTitleSpacerSx} aria-hidden>
                                &nbsp;
                            </Typography>
                            <Box className="color-picker-card" sx={themePickerCardSx}>
                                {renderTabs(['Light', 'Occupancy', 'Energy'], activeHeatmapTab, setActiveHeatmapTab, heatmapColorMap, setSelectedHeatmapColor)}
                                <HexColorPicker
                                    colorMap={heatmapColorMap}
                                    setColorMap={setHeatmapColorMapFromPicker}
                                    selectedColor={selectedHeatmapColor}
                                    setSelectedColor={setSelectedHeatmapColor}
                                    activeTarget={activeHeatmapTab}
                                    width={BASIC_THEME_PICKER_HEX.width}
                                    height={BASIC_THEME_PICKER_HEX.height}
                                    hexRadius={BASIC_THEME_PICKER_HEX.hexRadius}
                                />
                                <Box sx={{ ...themePickerActionsSx, justifyContent: 'center' }}>
                                    <Button
                                        className="save-button"
                                        onClick={handleHeatmapSave}
                                        disabled={heatmapBusy}
                                        sx={{
                                            backgroundColor: dynamicButtonColor,
                                            color: actionButtonLabel,
                                            fontWeight: 'bold',
                                            px: 4,
                                            py: 1,
                                            borderRadius: 1,
                                        }}
                                    >
                                        {heatmapBusy ? 'Saving…' : 'Save'}
                                    </Button>
                                </Box>
                            </Box>
                        </Box>
                    </Box>

                    {canEditFofpThemeColor && (
                        <FofpThemeColorCard
                            renderTabs={renderTabs}
                            dynamicButtonColor={dynamicButtonColor}
                            actionButtonLabel={actionButtonLabel}
                            themePickerActionsSx={{ ...themePickerActionsSx, justifyContent: 'center' }}
                            onSaveMessage={(message) => {
                                setSnackbarMessage(message);
                                setSnackbarOpen(true);
                            }}
                        />
                    )}
                </Box>
                <Box sx={{ mt: 2, p: 1 }}>
                    <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        mb={1}
                        sx={{ color: "text.primary" }}
                    >
                        Choose Background
                    </Typography>

                    <Box
                        sx={{
                            width: 240,
                            height: 160,
                            border: '1px solid #ccc',
                            borderRadius: 2,
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: '#f9f9f9',
                            boxShadow: 1,
                        }}
                    >
                        {backgroundImage ? (
                            <img
                                src={resolvePublicAssetUrl(backgroundImage) || backgroundImage}
                                alt="Background Preview"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                No image selected
                            </Typography>
                        )}
                    </Box>

                    <Box mt={2} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                            component="label"
                            variant="outlined"
                            size="small"
                            sx={{
                                fontWeight: 'bold',
                                borderRadius: 2,
                                textTransform: 'none',
                                px: 2,
                                py: 1,
                                color: "black",
                                backgroundColor: '#fff',
                                '&:hover': {
                                    backgroundColor: '#f0f0f0',
                                },
                            }}
                            startIcon={<i className="fas fa-pen"></i>}
                        >
                            Change Background
                            <input
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) handleBackgroundImageSave(file);
                                }}
                            />
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            disabled={!backgroundImage}
                            onClick={handleBackgroundImageClear}
                            sx={{
                                fontWeight: 'bold',
                                borderRadius: 2,
                                textTransform: 'none',
                                px: 2,
                                py: 1,
                                color: "black",
                                backgroundColor: '#fff',
                                '&:hover': {
                                    backgroundColor: '#f0f0f0',
                                },
                            }}
                        >
                            Remove Background
                        </Button>
                    </Box>
                </Box>
            </Grid>
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbarOpen(false)}
                    severity={snackbarSeverity}
                    sx={{ width: '100%' }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Grid >

    );
};

export default ThemeChange;

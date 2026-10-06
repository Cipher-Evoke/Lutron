import React, { useContext, useEffect, useRef, useState, useMemo } from 'react';
import { createSingleFlight } from "../../../../../shared/utils/createSingleFlight";
import {
    buildThemeApplicationSaveKey,
    buildThemeHeatmapSaveKey,
} from "../../../../../shared/utils/themeSettingsSaveKey";
import { Box, Button, Typography, useTheme } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ADVANCED_MANAGE_AREA_GROUPS_PATH } from '../../../utils/advancedSettingsPaths';
import HexColorPicker from '../../../utils/HexColorPicker';
import '../../../styles/HexColorPicker.css';
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
import { UseAuth } from '../../../customhooks/UseAuth';
import { getLutronDataClient } from '../../../redux/slice/home/homeSlice';
import {
    dispatchFetchApplicationThemeOnce,
    dispatchFetchBackgroundImageOnce,
    dispatchFetchClientOnce,
    dispatchFetchHeatMapThemeOnce,
    dispatchFetchThemeSettingsOnce,
    syncApplicationThemeSessionCache,
} from '../../../../../shared/utils/bootstrapFetchGuards';
import {
    toAdvancedApplicationThemePayload,
    writeAdvancedApplicationThemePin,
} from '../../../utils/advancedApplicationThemePersist';
import {
    isLightSurface,
    PRODUCT_DEFAULT_APP_BACKGROUND,
    PRODUCT_DEFAULT_APP_BUTTON,
    PRODUCT_DEFAULT_APP_CONTENT,
    PRODUCT_DEFAULT_THEME_COLOR_MAP,
} from '../../../utils/themeOnSurface';
import SettingsLayout from '../SettingsLayout';
import { themePickerCardCellSx, themePickerCardsGridSx, themePickerCardColumnSx, themePickerCardSurfaceSx, ADVANCED_THEME_PICKER_HEX, themePickerActionsSx } from './themePickerLayout';
import FofpThemeColorCard from './FofpThemeColorCard';
import { THEME_BACKGROUND_PRESETS, ADVANCED_THEME_RESET_BACKGROUND_SWATCH } from '../../../config/themeConstants';
import {
    normalizeThemeHex,
    resolveThemeButtonStyle,
} from '../../../utils/themePageBackground';
import UiVariantSelector from '../../../../../components/UiVariantSelector';
import { setUiVariant } from '../../../../../utils/uiVariant';
import { resolvePublicAssetUrl } from '../../../../../shared/utils/resolveMediaUrl';

/** Same-origin media URL (proxied on :3000); leave blob/data/http unchanged. */
function resolveThemeMediaUrl(path) {
    return resolvePublicAssetUrl(path);
}

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
    const DEFAULT_THEME_COLORS = { ...PRODUCT_DEFAULT_THEME_COLOR_MAP };

    const [themeColorMap, setThemeColorMap] = useState({
        Background: PRODUCT_DEFAULT_APP_BACKGROUND,
        Content: PRODUCT_DEFAULT_APP_CONTENT,
        Button: PRODUCT_DEFAULT_APP_BUTTON,
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

    const [activeHeatmapTab, setActiveHeatmapTab] = useState('Light');
    const [themePickerKey, setThemePickerKey] = useState(0);
    const themeButtonStyle = resolveThemeButtonStyle(
        appTheme?.application_theme?.button || PRODUCT_DEFAULT_APP_BUTTON,
        themeColorMap?.Background
    );
    const [dynamicButtonColor, setDynamicButtonColor] = useState(themeButtonStyle.solid);
    useEffect(() => {
        // Advanced shell may still be mounted after storage clear; pin variant so theme APIs use ?variant=advanced.
        setUiVariant('advanced');
        dispatchFetchClientOnce(dispatch, getLutronDataClient);
    }, [dispatch]);

    useEffect(() => {
        const resolved = resolveThemeButtonStyle(
            appTheme?.application_theme?.button || PRODUCT_DEFAULT_APP_BUTTON,
            themeColorMap?.Background
        );
        setDynamicButtonColor(resolved.solid);
    }, [appTheme?.application_theme?.button, themeColorMap?.Background]);

    const actionButtonLabel = themeButtonStyle.text;

    // const filename = file.name;  // or use a UUID generator if needed
    // const backendUrl = `http://localhost:8000/background_image/${file.name}`;
    // setBackgroundImage(backendUrl);

    useEffect(() => {
        // Only fetch if not already loaded (join layout/topbar in-flight)
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
    useEffect(() => {
        if (appTheme?.application_theme) {
            const { background, content, button } = appTheme.application_theme;
            const updatedMap = {
                Background: normalizeThemeHex(normalizeColor(background || PRODUCT_DEFAULT_APP_BACKGROUND)),
                Content: normalizeThemeHex(normalizeColor(content || PRODUCT_DEFAULT_APP_CONTENT)),
                Button: normalizeThemeHex(normalizeColor(button || PRODUCT_DEFAULT_APP_BUTTON)),
            };
            setThemeColorMap(updatedMap);
            setSelectedThemeColor(updatedMap.Background || '#ffffff');
        }

        if (heatMapTheme?.application_theme) {
            const { light, occupancy, energy } = heatMapTheme.application_theme;

            const normalizedHeatmap = {
                Light: normalizeColor(light || '#f2ff00'),
                Occupancy: normalizeColor(occupancy || '#4318d1'),
                Energy: normalizeColor(energy || '#006400'),
            };

            setHeatmapColorMap(normalizedHeatmap);
            setSelectedHeatmapColor(normalizedHeatmap[activeHeatmapTab] || '#ffffff');
        }
    }, [appTheme, heatMapTheme]);
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
        setUiVariant('advanced');
        // Persist picker colors (not stale Redux) so Background/Content/Button stick on refresh.
        const payload = {
            background: normalizeThemeHex(
                normalizeColor(themeColorMap.Background || PRODUCT_DEFAULT_APP_BACKGROUND)
            ),
            content: normalizeThemeHex(
                normalizeColor(themeColorMap.Content || PRODUCT_DEFAULT_APP_CONTENT)
            ),
            button: normalizeThemeHex(
                normalizeColor(themeColorMap.Button || PRODUCT_DEFAULT_APP_BUTTON)
            ),
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
            await dispatch(updateApplicationTheme(payload)).unwrap();
            lastThemeSaveKeyRef.current = saveKey;
            reloadTheme(payload, backgroundImage);
            const nextApplicationTheme = toAdvancedApplicationThemePayload(payload);
            writeAdvancedApplicationThemePin(payload);
            // Align session cache; do not force-GET or full-reload (races revive stale /theme/ chrome).
            syncApplicationThemeSessionCache(nextApplicationTheme);
            setSnackbarSeverity('success');
            setSnackbarMessage("Theme colors saved successfully.");
            setSnackbarOpen(true);
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
        setUiVariant('advanced');
        const resetBackgroundColor = normalizeThemeHex(ADVANCED_THEME_RESET_BACKGROUND_SWATCH);
        const defaultColors = {
            ...DEFAULT_THEME_COLORS,
            Background: resetBackgroundColor,
        };

        const payload = {
            background: normalizeThemeHex(normalizeColor(defaultColors.Background)),
            content: normalizeThemeHex(normalizeColor(defaultColors.Content)),
            button: normalizeThemeHex(normalizeColor(defaultColors.Button)),
        };
        const saveKey = buildThemeApplicationSaveKey(payload);
        if (lastThemeSaveKeyRef.current === saveKey) {
            setSnackbarSeverity('info');
            setSnackbarMessage("Theme already at default colors.");
            setSnackbarOpen(true);
            return;
        }

        setThemeBusy(true);
        try {
            await dispatch(updateApplicationTheme(payload)).unwrap();
            lastThemeSaveKeyRef.current = saveKey;
            setThemeColorMap(defaultColors);
            setSelectedThemeColor(resetBackgroundColor);
            setThemePickerKey((k) => k + 1);
            reloadTheme(payload, backgroundImage);
            const nextApplicationTheme = toAdvancedApplicationThemePayload(payload);
            writeAdvancedApplicationThemePin(payload);
            syncApplicationThemeSessionCache(nextApplicationTheme);
            setSnackbarSeverity('success');
            setSnackbarMessage("Theme colors reset to default.");
            setSnackbarOpen(true);
        } catch {
            setSnackbarSeverity('error');
            setSnackbarMessage("Failed to reset theme colors. Please try again.");
            setSnackbarOpen(true);
        } finally {
            setThemeBusy(false);
        }
    });
    const sidebarItemPaths = {
        "Home": "/main",
        "Alerts": "/alerts",
        "Email Server": "/email-server/",
        "Theme": "/theme-change",
        "User Management": "/users",
        "Area Size for Energy": "/area-size-load",
        "Area Groups": "/manage-area-groups",
        "Widgets": "/rename-widget/",
        "Floors": "/floor",
        "Processors": "/processors",
        "Help": "/create-help/",
    };
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
                            content: normalizeColor(
                                appTheme?.application_theme?.content || themeColorMap.Content || PRODUCT_DEFAULT_APP_CONTENT
                            ),
                            button: normalizeColor(
                                appTheme?.application_theme?.button || themeColorMap.Button || PRODUCT_DEFAULT_APP_BUTTON
                            ),
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
            reloadTheme(
                {
                    background: normalizeColor(themeColorMap.Background),
                    content: normalizeColor(
                        appTheme?.application_theme?.content || themeColorMap.Content || PRODUCT_DEFAULT_APP_CONTENT
                    ),
                    button: normalizeColor(
                        appTheme?.application_theme?.button || themeColorMap.Button || '#232323'
                    ),
                },
                ''
            );
            dispatchFetchThemeSettingsOnce(dispatch, fetchThemeSettings, { force: true });
            dispatchFetchBackgroundImageOnce(dispatch, fetchBackgroundImage, { force: true });
            // Keep color pin authoritative — do not force-GET application colors (revives slate).
            const colorPin = {
                background: normalizeColor(themeColorMap.Background),
                content: normalizeColor(
                    themeColorMap.Content || appTheme?.application_theme?.content || PRODUCT_DEFAULT_APP_CONTENT
                ),
                button: normalizeColor(
                    themeColorMap.Button || appTheme?.application_theme?.button || PRODUCT_DEFAULT_APP_BUTTON
                ),
            };
            writeAdvancedApplicationThemePin(colorPin);
            syncApplicationThemeSessionCache(toAdvancedApplicationThemePayload(colorPin));
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
                        setSelectedColor(normalizeThemeHex(normalizeColor(colorMap[label] ?? '#ffffff')));
                    }}
                >
                    {label}
                </button>
            ))}
        </Box>
    );

    const { role } = UseAuth();

    const normalizedRole = role ? role.toLowerCase() : '';
    const canAccessTheme = normalizedRole === 'superadmin' || normalizedRole === 'super admin' || normalizedRole === 'admin';
    // FOFP marker palette is Superadmin-only; Admin keeps Background + heatmap pickers.
    // Keep a 3-column grid so Admin's two cards stay the same width as Superadmin's.
    const canEditFofpThemeColor =
        normalizedRole === 'superadmin' || normalizedRole === 'super admin';

    useEffect(() => {
        if (!canAccessTheme) {
            navigate(ADVANCED_MANAGE_AREA_GROUPS_PATH, { replace: true });
        }
    }, [canAccessTheme, navigate]);

    if (!canAccessTheme) return null;

    const settingsPanelBg = themeColorMap?.Background ?? appTheme?.application_theme?.background;
    /** Inner settings panel is white; also respect light theme Background / Content colors. */
    const uiSelectorLightChrome =
        isLightSurface('#ffffff') ||
        isLightSurface(settingsPanelBg) ||
        isLightSurface(appTheme?.application_theme?.content);

    return (
        <>
        <SettingsLayout>
                <Box className="advanced-theme-page">
                <Box sx={{ margin: '1em', marginBottom: 0 }}>
                    <UiVariantSelector lightChrome={uiSelectorLightChrome} />
                </Box>
                <Box
                    className="theme-picker-cards-grid theme-picker-cards-grid--cols-3"
                    sx={themePickerCardsGridSx(3)}
                >
                    {/* Theme Picker Card */}
                    <Box sx={themePickerCardCellSx}>
                        <Box sx={themePickerCardColumnSx}>
                            <Box className="color-picker-card" sx={themePickerCardSx}>
                                {renderTabs(['Background'], 'Background', () => {}, themeColorMap, setSelectedThemeColor)}
                                <HexColorPicker
                                    key={themePickerKey}
                                    colorMap={themeColorMap}
                                    setColorMap={setThemeColorMap}
                                    selectedColor={selectedThemeColor}
                                    setSelectedColor={setSelectedThemeColor}
                                    activeTarget="Background"
                                    width={ADVANCED_THEME_PICKER_HEX.width}
                                    height={ADVANCED_THEME_PICKER_HEX.height}
                                    hexRadius={ADVANCED_THEME_PICKER_HEX.hexRadius}
                                    themePresetSwatches={THEME_BACKGROUND_PRESETS.map((p) => p.color)}
                                />
                                <Box sx={{ ...themePickerActionsSx, justifyContent: 'space-between', px: 2, gap: 2 }}>
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
                            <Box className="color-picker-card" sx={themePickerCardSx}>
                                {renderTabs(['Light', 'Occupancy', 'Energy'], activeHeatmapTab, setActiveHeatmapTab, heatmapColorMap, setSelectedHeatmapColor)}
                                <HexColorPicker
                                    colorMap={heatmapColorMap}
                                    setColorMap={setHeatmapColorMap}
                                    selectedColor={selectedHeatmapColor}
                                    setSelectedColor={setSelectedHeatmapColor}
                                    activeTarget={activeHeatmapTab}
                                    width={ADVANCED_THEME_PICKER_HEX.width}
                                    height={ADVANCED_THEME_PICKER_HEX.height}
                                    hexRadius={ADVANCED_THEME_PICKER_HEX.hexRadius}
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
                            onSaveMessage={(message) => {
                                setSnackbarMessage(message);
                                setSnackbarOpen(true);
                            }}
                        />
                    )}
                </Box>
                <Box sx={{ mt: 4, p: 2, width: '100%' }}>
                    <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        mb={1}
                        sx={{ color: 'var(--settings-panel-text, inherit)' }}
                    >
                        Choose Background
                    </Typography>

                    <Box
                        className="theme-background-preview"
                        sx={{
                            width: 240,
                            height: 160,
                            border: '1px solid var(--settings-panel-border, rgba(74, 67, 52, 0.28))',
                            borderRadius: 2,
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'var(--settings-theme-card-bg, #faf0d4)',
                            boxShadow: '0 1px 4px rgba(74, 67, 52, 0.12)',
                        }}
                    >
                        {backgroundImage ? (
                            <img
                                src={resolveThemeMediaUrl(backgroundImage)}
                                alt="Background Preview"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            <Typography
                                variant="body2"
                                sx={{ color: 'var(--settings-panel-muted-text, rgba(44, 40, 32, 0.72))' }}
                            >
                                No image selected
                            </Typography>
                        )}
                    </Box>

                    <Box mt={2} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                            component="label"
                            className="theme-settings-outlined-btn"
                            variant="outlined"
                            size="small"
                            sx={{
                                fontWeight: 'bold',
                                borderRadius: 2,
                                textTransform: 'none',
                                px: 2,
                                py: 1,
                                color: 'var(--settings-panel-text, #2c2820)',
                                backgroundColor: 'var(--users-input-bg, #fff)',
                                borderColor: 'var(--settings-panel-border, rgba(0,0,0,0.23))',
                                '&:hover': {
                                    backgroundColor: 'var(--settings-panel-outer-bg, #f0f0f0)',
                                    borderColor: 'var(--home-tab-active-color, #403A31)',
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
                            className="theme-settings-outlined-btn"
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
                                color: 'var(--settings-panel-text, #2c2820)',
                                backgroundColor: 'var(--users-input-bg, #fff)',
                                borderColor: 'var(--settings-panel-border, rgba(0,0,0,0.23))',
                                '&:hover': {
                                    backgroundColor: 'var(--settings-panel-outer-bg, #f0f0f0)',
                                    borderColor: 'var(--home-tab-active-color, #403A31)',
                                },
                            }}
                        >
                            Remove Background
                        </Button>
                    </Box>
                </Box>
                </Box>
        </SettingsLayout>
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
        </>
    );
};

export default ThemeChange;

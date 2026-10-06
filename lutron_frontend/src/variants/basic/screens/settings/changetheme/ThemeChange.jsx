import React, { useContext, useEffect, useState } from 'react';
import { Box, Button, Grid, Typography, useTheme, useMediaQuery } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { resolvePublicAssetUrl } from '../../../../../shared/utils/resolveMediaUrl';
import HexColorPicker, { HEX_PICKER_DEFAULT_WHITE_SWATCH } from '../../../utils/HexColorPicker';
import '../../../styles/HexColorPicker.css';
import {
    BASIC_MANAGE_AREA_GROUPS_PATH,
} from '../../../utils/basicSettingsPaths';
import { getVisibleSidebarItems } from '../../../utils/sidebarItems';
import {
    fetchApplicationTheme,
    fetchBackgroundImage,
    fetchHeatMapTheme,
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
import {
    dispatchFetchApplicationThemeOnce,
    dispatchFetchBackgroundImageOnce,
    dispatchFetchClientOnce,
    dispatchFetchHeatMapThemeOnce,
    syncApplicationThemeSessionCache,
} from '../../../../../shared/utils/bootstrapFetchGuards';
import {
    DEFAULT_APP_BACKGROUND,
    DEFAULT_APP_CONTENT,
    onContentColors,
    isLightSurface,
} from '../../../utils/themeOnSurface';
import { settingsSidebarColumnDividerSx } from '../../../utils/settingsSidebarTabStyles';
import SettingsSidebarNav from '../../../components/SettingsSidebarNav';

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
    const [selectedThemeColor, setSelectedThemeColor] = useState('#ffffff');
    const [selectedHeatmapColor, setSelectedHeatmapColor] = useState('#ffffff');

    // Add responsive breakpoints
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
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
        if (!apibgImage || !apibgImage.background_image) {
            dispatchFetchBackgroundImageOnce(dispatch, fetchBackgroundImage);
        }
    }, [dispatch, appTheme, heatMapTheme, apibgImage]);
    useEffect(() => {
        if (appTheme?.application_theme) {
            const { background, content, button } = appTheme.application_theme;
            const updatedMap = {
                Background: background || DEFAULT_APP_BACKGROUND,
                Content: content || DEFAULT_APP_CONTENT,
                Button: button || '#232323',
            };
            setThemeColorMap(updatedMap);
            setSelectedThemeColor(normalizeColor(updatedMap[activeThemeTab] || '#ffffff'));
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
    useEffect(() => {
        if (apibgImage) {
            setBackgroundImage(apibgImage.background_image);
        } else if (appTheme?.application_theme?.backgroundImageUrl) {
            setBackgroundImage(appTheme.application_theme.backgroundImageUrl);
        }
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
    const handleThemeSave = async () => {
        const payload = {
            background: normalizeColor(themeColorMap.Background),
            content: normalizeColor(themeColorMap.Content),
            button: normalizeColor(themeColorMap.Button)
        };

        try {
            const response = await dispatch(updateApplicationTheme(payload)).unwrap();
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
            syncApplicationThemeSessionCache(nextApplicationTheme);
            // Skip force GET /theme/application — save response + cache already applied.
            setSnackbarMessage("Theme colors saved successfully.");
            setSnackbarOpen(true);
            if (typeof window !== 'undefined') {
                setTimeout(() => window.location.reload(), 300);
            }
        } catch (error) {
            // Optionally handle error feedback here
        }
    };

    const handleHeatmapSave = () => {
        const payload = {
            light: normalizeColor(heatmapColorMap.Light),
            occupancy: normalizeColor(heatmapColorMap.Occupancy),
            energy: normalizeColor(heatmapColorMap.Energy),
        };

        dispatch(updateHeatMapTheme(payload));
        // Publish single energy color to CSS variable for gradient usage
        if (typeof document !== 'undefined') {
            document.documentElement.style.setProperty('--heatmap-energy', normalizeColor(heatmapColorMap.Energy));
        }
        setSnackbarMessage("Heatmap colors saved successfully.");
        setSnackbarOpen(true);
    };

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
    const handleThemeReset = async () => {
        const defaultColors = { ...DEFAULT_THEME_COLORS };

        setActiveThemeTab('Background');
        setThemeColorMap(defaultColors);
        setSelectedThemeColor(HEX_PICKER_DEFAULT_WHITE_SWATCH);
        setThemePickerKey((k) => k + 1);

        const payload = {
            background: normalizeColor(defaultColors.Background),
            content: normalizeColor(defaultColors.Content),
            button: normalizeColor(defaultColors.Button),
        };

        try {
            const response = await dispatch(updateApplicationTheme(payload)).unwrap();
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
            syncApplicationThemeSessionCache(nextApplicationTheme);
            // Skip force GET /theme/application — save response + cache already applied.
            setSnackbarMessage("Theme colors reset to default.");
            setSnackbarOpen(true);
            if (typeof window !== 'undefined') {
                setTimeout(() => window.location.reload(), 300);
            }
        } catch (error) {
            // Optionally handle error feedback here
        }
    };
    //background image
    const [backgroundImage, setBackgroundImage] = useState(null);
    const fileInputRef = React.useRef();

    useEffect(() => {
        if (appTheme?.application_theme?.backgroundImageUrl) {
            setBackgroundImage(appTheme.application_theme.backgroundImageUrl);
        }
    }, [appTheme]);
    const handleBackgroundImageSave = async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        try {
            // 1. Upload image via Redux thunk (sends to /theme/background)
            const response = await dispatch(updateBackgroundImage(formData)).unwrap();

            // 2. Backend returns relative path like "/background_image/bg_1234.png"
            const backendPath = response?.background_image;

            if (backendPath) {
                // 3. Update application theme with the new background_image path
                dispatch(updateApplicationTheme({ background_image: backendPath }));
                dispatch(fetchBackgroundImage())
            }
        } catch (error) {
            // Error uploading background image
        }
    };
    const triggerFileSelect = () => {
        if (fileInputRef.current) fileInputRef.current.click();
    };

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

    useEffect(() => {
        if (!canAccessTheme) {
            navigate(BASIC_MANAGE_AREA_GROUPS_PATH, { replace: true });
        }
    }, [canAccessTheme, navigate]);

    if (!canAccessTheme) return null;

    const contentForSidebar = appTheme?.application_theme?.content || DEFAULT_APP_CONTENT;
    const side = onContentColors(contentForSidebar);
    const isDefaultWhiteTheme = isLightSurface(contentForSidebar);

    return (
        <Grid container sx={{ ml: '18px', p: '18px' }}>
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
                    p: 0,
                    borderTopLeftRadius: "10px",
                    borderBottomLeftRadius: "10px",
                    ...settingsSidebarColumnDividerSx(isDefaultWhiteTheme, settingsSidebarMdUp && !isTablet),
                }}
            >
                <SettingsSidebarNav items={visibleSidebarItemsWithPaths} />
            </Grid>
            {/* Color Pickers */}
            <Grid item xs={12} md={10}>
                <Grid
                    container
                    columnSpacing={2}
                    rowSpacing={{ xs: 2, md: 0 }}
                    alignItems="flex-start"
                    justifyContent="flex-start"
                    sx={{ margin: '1em' }}
                >
                    {/* Theme Picker Card */}
                    <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
                        <Box className="color-picker-card" sx={{ backgroundColor: 'white', padding: '1em', borderRadius: '1em', width: '100%' }}>
                            {renderTabs(['Background', 'Content', 'Button'], activeThemeTab, setActiveThemeTab, themeColorMap, setSelectedThemeColor)}
                            <HexColorPicker
                                key={themePickerKey}
                                colorMap={themeColorMap}
                                setColorMap={setThemeColorMap}
                                selectedColor={selectedThemeColor}
                                setSelectedColor={setSelectedThemeColor}
                                activeTarget={activeThemeTab}
                                width={200}
                                height={220}
                                hexRadius={8}
                            />
                            <Box mt={2} display="flex" justifyContent="space-between" px={2} gap={2}>
                                <Button
                                    className="save-button"
                                    onClick={handleThemeReset}
                                    sx={{
                                        backgroundColor: dynamicButtonColor,
                                        color: actionButtonLabel,
                                        fontWeight: 'bold',
                                        px: 4,
                                        py: 1,
                                        borderRadius: 1,
                                    }}
                                >
                                    Reset
                                </Button>
                                <Button
                                    className="save-button"
                                    onClick={handleThemeSave}
                                    sx={{
                                        backgroundColor: dynamicButtonColor,
                                        color: actionButtonLabel,
                                        fontWeight: 'bold',
                                        px: 4,
                                        py: 1,
                                        borderRadius: 1,
                                    }}
                                >
                                    Save
                                </Button>
                            </Box>

                        </Box>
                    </Grid>

                    {/* Heatmap Picker Card */}
                    <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
                        <Box className="color-picker-card" sx={{ backgroundColor: 'white', padding: '1em', borderRadius: '1em', width: '100%' }}>
                            {renderTabs(['Light', 'Occupancy', 'Energy'], activeHeatmapTab, setActiveHeatmapTab, heatmapColorMap, setSelectedHeatmapColor)}
                            <HexColorPicker
                                colorMap={heatmapColorMap}
                                setColorMap={setHeatmapColorMap}
                                selectedColor={selectedHeatmapColor}
                                setSelectedColor={setSelectedHeatmapColor}
                                activeTarget={activeHeatmapTab}
                                width={200}
                                height={220}
                                hexRadius={8}
                            />
                            <Box mt={2} display="flex" justifyContent="center">
                                <Button
                                    className="save-button"
                                    onClick={handleHeatmapSave}
                                    sx={{
                                        backgroundColor: dynamicButtonColor,
                                        color: actionButtonLabel,
                                        fontWeight: 'bold',
                                        px: 4,
                                        py: 1,
                                        borderRadius: 1,
                                    }}
                                >
                                    Save
                                </Button>
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
                <Box sx={{ mt: 4, p: 2 }}>
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

                    <Box mt={2}>
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
                    severity="success"
                    sx={{ width: '100%' }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Grid >

    );
};

export default ThemeChange;

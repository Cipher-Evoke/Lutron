import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createSingleFlight } from "../../../../../shared/utils/createSingleFlight";
import { resolveHomeUploadUrl } from "../../../../../shared/utils/resolveMediaUrl";

function previewMediaUrl(path) {
    return resolveHomeUploadUrl(path);
}
import { buildHomeSettingsSaveKey } from "../../../../../shared/utils/homeSettingsSaveKey";
import {
    Box,
    Button,
    Typography,
    TextField,
    useTheme,
    Grid,
    Alert,
    Snackbar,
} from '@mui/material';
import { styled } from '@mui/system';
import { selectApplicationTheme } from '../../../redux/slice/theme/themeSlice';
import { darken } from '@mui/material/styles';
import CustomizedHomeDescriptionEditor from './CustomizedHomeDescriptionEditor';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AddIcon from '@mui/icons-material/Add';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import SettingsSidebar from '../../../components/SettingsSidebar';
import { UseAuth, getVisibleSidebarItemsWithPaths } from '../../../customhooks/UseAuth';
import {
    getLutronData,
    getLutronDataClient,
    getLutronDataProject,
    saveLutronData,
    saveClientData,
    saveProjectData,
    clearSaveError,
    homeDataList,
    homeDataClient,
    homeDataProject
} from '../../../redux/slice/home/homeSlice';
import {
    dispatchFetchClientOnce,
    dispatchFetchProjectOnce,
} from '../../../../../shared/utils/bootstrapFetchGuards';
import {
    getRovingTabIndex,
    handleRovingTablistKeyDown,
} from '../../../../../utils/keyboard/rovingTablistKeyboard';
import {
    registerSettingsHomeTabFocusHandler,
    requestSettingsSidebarFocus,
} from '../../../../../utils/keyboard/pageSubNavBridge';
import { isKeyboardNavBlockedTarget } from '../../../../../utils/keyboard/keyboardNavUtils';

// Suppress findDOMNode warning for ReactQuill (third-party library issue)
const originalError = console.error;
console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('findDOMNode is deprecated')) {
        return;
    }
    originalError.call(console, ...args);
};

const HOME_TAB_KEYS = ['Lutron', 'Client', 'Project'];



// Mobile-first responsive styled components
const PreviewImage = styled('img')(({ theme }) => ({
    width: 'auto',
    maxWidth: '100%',
    height: 'auto',
    maxHeight: '80px',
    marginTop: '8px',
    borderRadius: '4px',
    objectFit: 'contain',
    [theme.breakpoints.up('sm')]: {
        maxWidth: '100px',
        marginTop: '10px',
        borderRadius: '6px',
    },
    [theme.breakpoints.up('md')]: {
        maxWidth: '120px',
    },
    [theme.breakpoints.up('lg')]: {
        maxWidth: '180px',
    },
}));

const LutronPreviewImage = styled('img')(({ theme }) => ({
    width: '100%',
    maxWidth: '60px',
    maxHeight: '50px',
    height: 'auto',
    marginTop: '8px',
    borderRadius: '4px',
    objectFit: 'cover',
    [theme.breakpoints.up('sm')]: {
        maxWidth: '80px',
        maxHeight: '60px',
        marginTop: '10px',
        borderRadius: '6px',
    },
    [theme.breakpoints.up('md')]: {
        maxWidth: '100px',
        maxHeight: '80px',
    },
    [theme.breakpoints.up('lg')]: {
        maxWidth: '150px',
        maxHeight: '120px',
    },
}));

const LogoUploadArea = styled(Box)(({ theme }) => ({
    border: '2px dashed #bbdefb',
    borderRadius: '4px',
    padding: '8px',
    textAlign: 'center',
    cursor: 'pointer',
    backgroundColor: '#e3f2fd',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60px',
    '&:hover': {
        backgroundColor: '#c1e0fc',
    },
    [theme.breakpoints.up('sm')]: {
        padding: '12px',
        minHeight: '80px',
        borderRadius: '6px',
    },
    [theme.breakpoints.up('md')]: {
        padding: '15px',
        minHeight: '100px',
    },
    [theme.breakpoints.up('lg')]: {
        padding: '20px',
        minHeight: '120px',
    },
}));

/**
 * HomeComponent - Settings Home Page Component
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
 * which ensures consistent role-based access control.
 */
const HomeComponent = () => {
    const [displayMode, setDisplayMode] = useState('Lutron');
    const [description, setDescription] = useState('');
    const [imagePreview, setImagePreview] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [clientName, setClientName] = useState('');
    const [logoPreview, setLogoPreview] = useState(null);
    const [logoFile, setLogoFile] = useState(null);
    const [locationText, setLocationText] = useState('');
    const [address, setAddress] = useState('');
    const [areaSize, setAreaSize] = useState('');
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [statusMessage, setStatusMessage] = useState('Data saved successfully!');
    const [statusSeverity, setStatusSeverity] = useState('success');
    const [showErrorMessage, setShowErrorMessage] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Track if user has manually edited fields to prevent override
    const [userEditedFields, setUserEditedFields] = useState({
        locationText: false,
        address: false,
        areaSize: false
    });

    // Installed Solutions state
    const [installedSolutions, setInstalledSolutions] = useState([]);
    const [newSolutionText, setNewSolutionText] = useState('');

    // Refs to track if data has been loaded to prevent infinite API calls
    const dataLoadedRef = useRef({
        lutron: false,
        client: false,
        project: false
    });

    const theme = useTheme();

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const runSaveOnce = useMemo(() => createSingleFlight(), []);
    const lastSavedKeyByModeRef = useRef({});

    // Get current user role for sidebar filtering
    const { role: currentUserRole } = UseAuth();
    const visibleSidebarItemsWithPaths = getVisibleSidebarItemsWithPaths(currentUserRole);

    const normalizedRole = currentUserRole ? currentUserRole.toLowerCase() : '';
    const canAccessHome = normalizedRole === 'superadmin' || normalizedRole === 'super admin' || normalizedRole === 'admin';

    // Redirect if user doesn't have permission
    useEffect(() => {
        if (!canAccessHome) {
            navigate('/setting/manage-area-groups', { replace: true });
        }
    }, [canAccessHome, navigate]);

    // One scroller only: lock the page so Home's content column can scroll.
    useEffect(() => {
        if (!canAccessHome) return undefined;
        const html = document.documentElement;
        const body = document.body;
        html.style.setProperty('overflow-y', 'hidden', 'important');
        body.style.setProperty('overflow-y', 'hidden', 'important');
        return () => {
            html.style.removeProperty('overflow-y');
            body.style.removeProperty('overflow-y');
        };
    }, [canAccessHome]);

    // Redux selectors
    const appTheme = useSelector(selectApplicationTheme);
    const buttonColor = appTheme?.application_theme?.button || '#232323';

    const tabRefs = useRef({});
    const displayModeRef = useRef(displayMode);
    displayModeRef.current = displayMode;

    const activateHomeTab = (mode) => {
        if (!HOME_TAB_KEYS.includes(mode)) return;
        displayModeRef.current = mode;
        setDisplayMode(mode);
        requestAnimationFrame(() => {
            tabRefs.current[mode]?.focus({ preventScroll: true });
        });
    };

    const handleHomeTabKeyDown = (event) => {
        if (event.key === 'ArrowLeft' && displayModeRef.current === 'Lutron') {
            event.preventDefault();
            event.stopPropagation();
            requestSettingsSidebarFocus('Home');
            return;
        }

        handleRovingTablistKeyDown(event, {
            itemKeys: HOME_TAB_KEYS,
            activeKey: displayModeRef.current,
            keyRefs: tabRefs,
            orientation: 'horizontal',
            onActivate: (mode) => activateHomeTab(mode),
        });
    };

    useEffect(() => {
        return registerSettingsHomeTabFocusHandler((tabKey = 'Lutron') => {
            const key = HOME_TAB_KEYS.includes(tabKey) ? tabKey : 'Lutron';
            activateHomeTab(key);
        });
    }, []);

    useEffect(() => {
        const onKeyDown = (event) => {
            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
            if (isKeyboardNavBlockedTarget(event.target)) return;
            if (event.target?.closest?.('.topbar-main-nav, .settings-sidebar-item, .home-content-type-tabs [role="tab"]')) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            if (event.key === 'ArrowLeft' && displayModeRef.current === 'Lutron') {
                requestSettingsSidebarFocus('Home');
                return;
            }

            handleRovingTablistKeyDown(
                { ...event, currentTarget: tabRefs.current[displayModeRef.current] },
                {
                    itemKeys: HOME_TAB_KEYS,
                    activeKey: displayModeRef.current,
                    keyRefs: tabRefs,
                    orientation: 'horizontal',
                    onActivate: (mode) => activateHomeTab(mode),
                }
            );
        };

        window.addEventListener('keydown', onKeyDown, true);
        return () => window.removeEventListener('keydown', onKeyDown, true);
    }, []);

    const homeData = useSelector(homeDataList);
    const homeClientData = useSelector(homeDataClient);
    const homeProjectData = useSelector(homeDataProject); // Fixed: was using homeProjectData instead of homeDataProject
    const { saveLoading, saveError } = useSelector((state) => state.home);

    // Load data on component mount - only run once
    useEffect(() => {
        // Only fetch if not already loaded
        if (!dataLoadedRef.current.lutron && (!homeData || !homeData.description)) {
            dataLoadedRef.current.lutron = true;
            dispatch(getLutronData());
        }
        if (!dataLoadedRef.current.client && (!homeClientData || !homeClientData.name)) {
            dataLoadedRef.current.client = true;
            dispatchFetchClientOnce(dispatch, getLutronDataClient);
        }
        if (!dataLoadedRef.current.project && (!homeProjectData || !homeProjectData.name)) {
            dataLoadedRef.current.project = true;
            dispatchFetchProjectOnce(dispatch, getLutronDataProject);
        }
    }, [dispatch]); // Only depend on dispatch to prevent infinite loops


    // Reset user edited fields when display mode changes
    useEffect(() => {
        setUserEditedFields({
            locationText: false,
            address: false,
            areaSize: false
        });
    }, [displayMode]);

    // Handle Lutron data updates
    useEffect(() => {
        if (displayMode === 'Lutron' && homeData) {
            setDescription(homeData.description || '');
            if (homeData.background_image && !imageFile) {
                setImagePreview(previewMediaUrl(homeData.background_image) || '');
            }
            // Installed solutions not supported for Lutron mode
            setInstalledSolutions([]);
        }
    }, [displayMode, homeData, imageFile]);

    // Handle Client data updates
    useEffect(() => {
        if (displayMode === 'Client' && homeClientData) {
            setDescription(homeClientData.description || '');
            setClientName(homeClientData.name || '');
            if (homeClientData.background_image && !imageFile) {
                setImagePreview(previewMediaUrl(homeClientData.background_image) || '');
            }
            if (homeClientData.logo_image && !logoFile) {
                setLogoPreview(previewMediaUrl(homeClientData.logo_image) || '');
            }
            // Installed solutions not supported for Client mode
            setInstalledSolutions([]);
        }
    }, [displayMode, homeClientData, imageFile, logoFile]);

    // Handle Project data updates
    useEffect(() => {
        if (displayMode === 'Project' && homeProjectData) {
            setDescription(homeProjectData.description || '');
            // Only set locationText if user hasn't manually edited it
            if (!userEditedFields.locationText) {
                setLocationText(homeProjectData.location_link || '');
            }
            // Only set address if user hasn't manually edited it
            if (!userEditedFields.address) {
                setAddress(homeProjectData.address || '');
            }
            // Only set areaSize if user hasn't manually edited it
            if (!userEditedFields.areaSize) {
                setAreaSize(homeProjectData.overall_area_size || '');
            }
            // Load installed solutions from Redux data
            if (homeProjectData.installed_solutions) {
                try {
                    const solutions = typeof homeProjectData.installed_solutions === 'string'
                        ? JSON.parse(homeProjectData.installed_solutions)
                        : homeProjectData.installed_solutions;
                    // Handle array of objects with 'solution' key
                    if (Array.isArray(solutions)) {
                        setInstalledSolutions(solutions.map((item, index) => ({
                            id: Date.now() + index,
                            name: item.solution || item
                        })));
                    } else {
                        setInstalledSolutions([]);
                    }
                } catch (error) {
                    console.error('Error parsing installed solutions:', error);
                    setInstalledSolutions([]);
                }
            } else {
                setInstalledSolutions([]);
            }
        }
    }, [displayMode, homeProjectData, userEditedFields]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Create an image object to check dimensions
            const img = new Image();
            const url = URL.createObjectURL(file);

            img.onload = () => {
                const minWidth = 100;
                const minHeight = 50;

                if (img.width < minWidth || img.height < minHeight) {
                    URL.revokeObjectURL(url);
                    showErrorSnackbar(`Logo image must be at least ${minWidth}x${minHeight} pixels. Current size: ${img.width}x${img.height}`);
                    return;
                }

                setLogoFile(file);
                setLogoPreview((current) => {
                    if (typeof current === 'string' && current.startsWith('blob:')) {
                        URL.revokeObjectURL(current);
                    }
                    return url;
                });
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);
                showErrorSnackbar('Error loading image. Please try again.');
            };

            img.src = url;
        }
    };

    // Helper function to clean description HTML
    const cleanDescription = (desc) => {
        if (!desc) return '';

        // Clean up the HTML content
        return desc
            .replace(/&nbsp;/gi, ' ') // Convert &nbsp; to regular spaces
            .replace(/&amp;/gi, '&') // Convert &amp; to &
            .replace(/&lt;/gi, '<') // Convert &lt; to <
            .replace(/&gt;/gi, '>') // Convert &gt; to >
            .replace(/&quot;/gi, '"') // Convert &quot; to "
            .replace(/&#39;/gi, "'") // Convert &#39; to '
            .replace(/<img\b[^>]*>/gi, '')
            .replace(/<p><br><\/p>/gi, '<p></p>') // Remove empty paragraphs with br
            .replace(/<p><\/p>/gi, '') // Remove empty paragraphs
            .replace(/<br><br>/gi, '<br>') // Reduce multiple br tags
            .trim();
    };

    const handleSave = async () => runSaveOnce(async () => {
        const saveKey = buildHomeSettingsSaveKey({
            mode: displayMode,
            description: cleanDescription(description),
            clientName,
            locationText,
            address,
            areaSize,
            installedSolutions,
            imageFile,
            logoFile,
        });
        if (lastSavedKeyByModeRef.current[displayMode] === saveKey) {
            setStatusSeverity('info');
            setStatusMessage('No changes to save');
            setShowSuccessMessage(true);
            return;
        }

        const formData = new FormData();

        if (displayMode === 'Lutron') {
            if (description) formData.append('description', cleanDescription(description));
            if (imageFile) formData.append('background_image', imageFile);
            // Note: Lutron endpoint doesn't support installed_solutions

            const result = await dispatch(saveLutronData(formData));
            if (saveLutronData.fulfilled.match(result)) {
                lastSavedKeyByModeRef.current[displayMode] = saveKey;
                const savedBackground = result.payload?.background_image;
                if (savedBackground) setImagePreview(previewMediaUrl(savedBackground));
                setImageFile(null);
                setLogoFile(null);
                setStatusSeverity('success');
                setStatusMessage('Data saved successfully!');
                setShowSuccessMessage(true);
                dispatch(getLutronData());
            }
        } else if (displayMode === 'Client') {
            if (description) formData.append('description', cleanDescription(description));
            if (clientName) formData.append('name', clientName);
            if (imageFile) formData.append('background_image', imageFile);
            if (logoFile) formData.append('logo_image', logoFile);
            // Note: Client endpoint doesn't support installed_solutions

            const result = await dispatch(saveClientData(formData));
            if (saveClientData.fulfilled.match(result)) {
                lastSavedKeyByModeRef.current[displayMode] = saveKey;
                const savedLogo = result.payload?.logo_image;
                const savedBackground = result.payload?.background_image;
                if (savedLogo) setLogoPreview(previewMediaUrl(savedLogo) || '');
                if (savedBackground) setImagePreview(previewMediaUrl(savedBackground) || '');
                setImageFile(null);
                setLogoFile(null);
                setStatusSeverity('success');
                setStatusMessage('Data saved successfully!');
                setShowSuccessMessage(true);
                dispatchFetchClientOnce(dispatch, getLutronDataClient, { force: true });
            }
        } else if (displayMode === 'Project') {
            if (description) formData.append('description', cleanDescription(description));
            if (locationText) formData.append('location_link', locationText);
            if (address) formData.append('address', address);
            if (areaSize) formData.append('overall_area_size', areaSize);
            // Add installed solutions data
            if (installedSolutions.length > 0) {
                formData.append('installed_solutions', installedSolutions.map(s => s.name).join(','));
            }

            const result = await dispatch(saveProjectData(formData));
            if (saveProjectData.fulfilled.match(result)) {
                lastSavedKeyByModeRef.current[displayMode] = saveKey;
                setImageFile(null);
                setLogoFile(null);
                setStatusSeverity('success');
                setStatusMessage('Data saved successfully!');
                setShowSuccessMessage(true);
                // Redux save.fulfilled already merges payload — skip force GET /home/project.
            }
        }
    });

    const handleCloseSuccessMessage = () => {
        setShowSuccessMessage(false);
    };

    const handleCloseError = () => {
        dispatch(clearSaveError());
    };

    const handleCloseErrorMessage = () => {
        setShowErrorMessage(false);
        setErrorMessage('');
    };

    const showErrorSnackbar = (message) => {
        setErrorMessage(message);
        setShowErrorMessage(true);
    };

    // Installed Solutions handlers
    const handleAddSolution = () => {
        if (newSolutionText.trim() && installedSolutions.length < 10) {
            const newSolution = {
                id: Date.now(),
                name: newSolutionText.trim()
            };
            setInstalledSolutions(prev => [...prev, newSolution]);
            setNewSolutionText('');
        } else if (installedSolutions.length >= 10) {
            showErrorSnackbar('Maximum 10 solutions allowed');
        }
    };

    const removeSolution = (id) => {
        setInstalledSolutions(prev => prev.filter(s => s.id !== id));
    };

    const updateSolutionName = (id, newName) => {
        setInstalledSolutions(prev =>
            prev.map(s => s.id === id ? { ...s, name: newName } : s)
        );
    };

    const renderTabs = () => (
        <Box
            className="home-content-type-tabs"
            role="tablist"
            aria-label="Home content type"
            sx={{
                display: 'flex',
                justifyContent: 'flex-start',
                gap: { xs: 0.3, sm: 0.5, md: 1, lg: 1.5 },
                mb: { xs: 0.8, sm: 1, md: 1.5, lg: 2 },
                flexWrap: 'wrap'
            }}>
            {HOME_TAB_KEYS.map((mode) => (
                <Button
                    key={mode}
                    ref={(el) => { tabRefs.current[mode] = el; }}
                    role="tab"
                    aria-selected={displayMode === mode}
                    tabIndex={getRovingTabIndex(displayMode === mode)}
                    onKeyDown={handleHomeTabKeyDown}
                    onClick={() => activateHomeTab(mode)}
                    sx={{
                        width: { xs: '60px', sm: '70px', md: '85px', lg: '100px' },
                        height: { xs: '20px', sm: '25px', md: '28px', lg: '32px' },
                        backgroundColor: displayMode === mode ? '#fff' : buttonColor,
                        color: displayMode === mode ? buttonColor : '#fff',
                        borderRadius: '50%',
                        fontWeight: 'bold',
                        border: `1px solid ${buttonColor}`,
                        textTransform: 'none',
                        minWidth: 'unset',
                        padding: 0,
                        fontSize: { xs: '8px', sm: '10px', md: '12px', lg: '14px' },
                        '&:hover': {
                            backgroundColor: displayMode === mode ? '#f5f5f5' : darken(buttonColor, 0.12),
                        },
                        '&:focus': {
                            backgroundColor: displayMode === mode ? '#fff' : buttonColor,
                            color: displayMode === mode ? buttonColor : '#fff',
                        },
                        '&:active': {
                            backgroundColor: displayMode === mode ? '#ededed' : darken(buttonColor, 0.18),
                            color: displayMode === mode ? buttonColor : '#fff',
                        },
                    }}
                >
                    {mode}
                </Button>
            ))}
        </Box>
    );

    if (!canAccessHome) return null;

    return (
        <Box className="settings-container settings-home-page" sx={{
            height: '100%',
            minHeight: 0,
            maxHeight: '100%',
            width: '100%',
            p: 0,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
        }}>
            {/* Success/Error Messages */}
            <Snackbar
                open={showSuccessMessage}
                autoHideDuration={3000}
                onClose={handleCloseSuccessMessage}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                sx={{
                    zIndex: 9999,
                    '& .MuiSnackbar-root': {
                        zIndex: 9999,
                    },
                    '& .MuiAlert-root': {
                        fontSize: { xs: '12px', sm: '14px', md: '16px' },
                        fontWeight: 600,
                        minWidth: { xs: '200px', sm: '250px', md: '300px' },
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    }
                }}
            >
                <Alert
                    onClose={handleCloseSuccessMessage}
                    severity={statusSeverity}
                    sx={{
                        backgroundColor: '#fff',
                        color: '#000',
                        border: statusSeverity === 'info' ? '1px solid #2196F3' : '1px solid #4CAF50',
                        borderRadius: '8px',
                        '& .MuiAlert-icon': {
                            color: statusSeverity === 'info' ? '#2196F3' : '#4CAF50',
                        },
                        '& .MuiAlert-message': {
                            color: '#000',
                        },
                        '& .MuiAlert-action': {
                            color: '#000',
                        }
                    }}
                >
                    {statusMessage}
                </Alert>
            </Snackbar>

            <Snackbar
                open={!!saveError}
                autoHideDuration={5000}
                onClose={handleCloseError}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                sx={{
                    zIndex: 9999,
                    '& .MuiSnackbar-root': {
                        zIndex: 9999,
                    },
                    '& .MuiAlert-root': {
                        fontSize: { xs: '12px', sm: '14px', md: '16px' },
                        fontWeight: 600,
                        minWidth: { xs: '200px', sm: '250px', md: '300px' },
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    }
                }}
            >
                <Alert
                    onClose={handleCloseError}
                    severity="error"
                    sx={{
                        backgroundColor: '#fff',
                        color: '#000',
                        border: '1px solid #f44336',
                        borderRadius: '8px',
                        '& .MuiAlert-icon': {
                            color: '#f44336',
                        },
                        '& .MuiAlert-message': {
                            color: '#000',
                        },
                        '& .MuiAlert-action': {
                            color: '#000',
                        }
                    }}
                >
                    {saveError}
                </Alert>
            </Snackbar>

            {/* Error Message Snackbar */}
            <Snackbar
                open={showErrorMessage}
                autoHideDuration={5000}
                onClose={handleCloseErrorMessage}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                sx={{
                    zIndex: 9999,
                    '& .MuiSnackbar-root': {
                        zIndex: 9999,
                    },
                    '& .MuiAlert-root': {
                        fontSize: { xs: '12px', sm: '14px', md: '16px' },
                        fontWeight: 600,
                        minWidth: { xs: '200px', sm: '250px', md: '300px' },
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    }
                }}
            >
                <Alert
                    onClose={handleCloseErrorMessage}
                    severity="error"
                    sx={{
                        backgroundColor: '#fff',
                        color: '#000',
                        border: '1px solid #f44336',
                        borderRadius: '8px',
                        '& .MuiAlert-icon': {
                            color: '#f44336',
                        },
                        '& .MuiAlert-message': {
                            color: '#000',
                        },
                        '& .MuiAlert-action': {
                            color: '#000',
                        }
                    }}
                >
                    {errorMessage}
                </Alert>
            </Snackbar>

            {/* Main Container - Mobile First */}
            <Box sx={{
                width: '100%',
                mx: 'auto',
                p: '18px',
                height: '100%',
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                ml: '18px'
            }}>
                <Grid container spacing={{ xs: 0.3, sm: 0.5, md: 1, lg: 1 }} sx={{ height: '100%', minHeight: 0, overflow: 'hidden' }}>
                    {/* Sidebar - Mobile: Full width, Desktop: 3/12 */}

                    <Grid item xs={12} md={3} sx={{
                        order: { xs: 1, md: 1 },
                        p: { xs: 0.3, sm: 0.5, md: 1, lg: 1.5 },
                        borderRadius: { xs: '4px', lg: '8px' },
                        mb: { xs: 0.3, lg: 0 }
                    }}>
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

                    {/* Main Content - Mobile: Full width, Desktop: 9/12 */}
                    <Grid
                        item
                        xs={12}
                        lg={9}
                        className="settings-home-content-column"
                        sx={{
                        order: { xs: 2, lg: 2 },
                        height: '100%',
                        minHeight: 0,
                        overflowX: 'hidden',
                        overflowY: 'auto',
                    }}>
                        {/* Export Button - BEFORE the white container starts */}
                        <Box sx={{
                            display: { xs: 'none', md: 'flex' },
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                            mb: 2,
                            mt: 1
                        }}>

                        </Box>

                        {/* White container starts here */}
                        {(displayMode === 'Client' || displayMode === 'Lutron' || displayMode === 'Project') && (
                            <Box
                                sx={{
                                    backgroundColor: '#fff',
                                    borderRadius: { xs: '4px', sm: '6px', md: '8px', lg: '10px' },
                                    p: { xs: 0.5, sm: 0.8, md: 1.2, lg: 1.5 },
                                    width: '100%',
                                    maxWidth: '92%',
                                    alignSelf: 'center',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: { xs: 0.8, sm: 1, md: 1.2 },
                                }}
                            >
                                {renderTabs()}

                                {displayMode === 'Client' && (
                                    <Box
                                        className="client-content-scrollable"
                                        sx={{
                                            backgroundColor: '#fff',
                                            p: { xs: 0.5, sm: 0.8, md: 1.2, lg: 1.5 },
                                            borderRadius: { xs: '6px', sm: '8px', md: '10px', lg: '12px' },
                                            border: '2px solid black',
                                            width: '100%',
                                            maxHeight: 'none',
                                            overflow: 'visible',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: { xs: 0.8, sm: 1, md: 1.2 },
                                        }}
                                    >
                                        <Grid container spacing={{ xs: 0.5, sm: 0.8, md: 1.2, lg: 1.5 }} sx={{ flex: 1 }}>
                                            {/* Left Column */}
                                            <Grid item xs={12} md={5}>
                                                <Typography fontWeight="bold" mb={1} fontSize={{ xs: '9px', sm: '10px', md: '12px', lg: '14px' }}>
                                                    Client Name
                                                </Typography>
                                                <TextField
                                                    fullWidth
                                                    value={clientName || ''}
                                                    onChange={(e) => setClientName(e.target.value)}
                                                    sx={{
                                                        mb: 2,
                                                        '& .MuiInputBase-root': {
                                                            backgroundColor: '#f0f0f0',
                                                            borderRadius: '4px',
                                                        },
                                                    }}
                                                />

                                                <Typography fontWeight="bold" mb={1} fontSize={{ xs: '9px', sm: '10px', md: '12px', lg: '14px' }}>
                                                    Logo
                                                </Typography>
                                                <label htmlFor="logo-upload">
                                                    <LogoUploadArea>
                                                        {logoPreview ? (
                                                            <PreviewImage src={logoPreview} alt="Logo Preview" />
                                                        ) : (
                                                            <>
                                                                <CloudUploadIcon sx={{
                                                                    fontSize: { xs: 16, sm: 20, md: 25, lg: 30 },
                                                                    color: '#90CAF9'
                                                                }} />
                                                                <Typography variant="body2" fontSize={{ xs: '7px', sm: '8px', md: '10px', lg: '12px' }}>
                                                                    Select a File to Upload
                                                                </Typography>
                                                                <Typography variant="caption" fontSize={{ xs: '6px', sm: '7px', md: '8px', lg: '10px' }}>
                                                                    or Drag and Drop a file here
                                                                </Typography>
                                                            </>
                                                        )}
                                                        <input type="file" hidden accept="image/*" id="logo-upload" onChange={handleLogoUpload} />
                                                    </LogoUploadArea>
                                                </label>

                                                <Typography fontWeight="bold" mt={3} mb={1} fontSize={{ xs: '9px', sm: '10px', md: '12px', lg: '14px' }}>
                                                    Background Image
                                                </Typography>
                                                <Box sx={{
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: { xs: 0.5, sm: 0.8, md: 1.2, lg: 1.5 },
                                                    mb: 2,
                                                    flexDirection: { xs: 'column', sm: 'row' }
                                                }}>
                                                    <Button
                                                        variant="contained"
                                                        component="label"
                                                        sx={{
                                                            minWidth: { xs: '100%', sm: '120px' },
                                                            height: { xs: '24px', sm: '28px', md: '32px', lg: '36px' },
                                                            flexShrink: 0,
                                                            fontSize: { xs: '8px', sm: '10px', md: '12px', lg: '14px' }
                                                        }}
                                                    >
                                                        Upload Image
                                                        <input hidden type="file" accept="image/*" onChange={handleImageUpload} />
                                                    </Button>
                                                    {imagePreview && (
                                                        <PreviewImage
                                                            src={imagePreview}
                                                            alt=""
                                                            style={{
                                                                marginTop: 0,
                                                                borderRadius: '4px',
                                                                width: '80px',
                                                                height: '60px',
                                                                maxWidth: '80px',
                                                                maxHeight: '60px',
                                                                objectFit: 'contain',
                                                                flexShrink: 0
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                            </Grid>

                                            {/* Right Column - Description */}
                                            <Grid item xs={12} md={7}>
                                                <Typography fontWeight="bold" mb={1} fontSize={{ xs: '9px', sm: '10px', md: '12px', lg: '14px' }}>
                                                    Description
                                                </Typography>
                                                <CustomizedHomeDescriptionEditor
                                                    value={description}
                                                    onChange={setDescription}
                                                    placeholder="Write here"
                                                />
                                            </Grid>
                                        </Grid>


                                        {/* Save Button */}
                                        <Box
                                            display="flex"
                                            justifyContent="flex-end"
                                            mt={1}
                                            sx={{
                                                clear: 'both',
                                                position: 'relative',
                                                zIndex: 10,
                                            }}
                                        >
                                            <Button
                                                variant="contained"
                                                disabled={saveLoading}
                                                sx={{
                                                    backgroundColor: saveLoading ? '#888' : buttonColor,
                                                    color: '#fff',
                                                    '&:hover': { backgroundColor: saveLoading ? '#888' : darken(buttonColor, 0.12) },
                                                    borderRadius: '4px',
                                                    px: { xs: 1, sm: 1.5, md: 2, lg: 2.5 },
                                                    py: { xs: 0.3, sm: 0.4, md: 0.6, lg: 0.8 },
                                                    textTransform: 'none',
                                                    fontSize: { xs: '8px', sm: '10px', md: '12px', lg: '14px' },
                                                }}
                                                onClick={handleSave}
                                            >
                                                {saveLoading ? 'Saving...' : 'Save'}
                                            </Button>
                                        </Box>
                                    </Box>
                                )}

                                {displayMode === 'Lutron' && (
                                    <Box
                                        className="lutron-content-scrollable"
                                        sx={{
                                            backgroundColor: '#fff',
                                            borderRadius: { xs: '4px', sm: '6px', md: '8px', lg: '10px' },
                                            p: { xs: 0.5, sm: 0.8, md: 1.2, lg: 1.5 },
                                            width: '100%',
                                            border: '2px solid #000',
                                            maxHeight: 'none',
                                            overflow: 'visible',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: { xs: 0.8, sm: 1, md: 1.2 },
                                        }}
                                    >
                                        <Typography fontWeight="bold" mb={1} fontSize={{ xs: '9px', sm: '10px', md: '12px', lg: '14px' }}>
                                            Description
                                        </Typography>

                                        <CustomizedHomeDescriptionEditor
                                            value={description}
                                            onChange={setDescription}
                                            placeholder="Write here"
                                        />

                                        <Typography fontWeight="bold" mt={1} mb={1} fontSize={{ xs: '9px', sm: '10px', md: '12px', lg: '14px' }}>
                                            Background Image
                                        </Typography>
                                        <Box sx={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: { xs: 0.5, sm: 0.8, md: 1.2, lg: 1.5 },
                                            mb: 2,
                                            flexDirection: { xs: 'column', sm: 'row' }
                                        }}>
                                            <Button
                                                variant="contained"
                                                component="label"
                                                sx={{
                                                    minWidth: { xs: '100%', sm: '120px' },
                                                    height: { xs: '24px', sm: '28px', md: '32px', lg: '36px' },
                                                    fontSize: { xs: '8px', sm: '10px', md: '12px', lg: '14px' }
                                                }}
                                            >
                                                Upload Image
                                                <input hidden type="file" accept="image/*" onChange={handleImageUpload} />
                                            </Button>
                                            {imagePreview && (
                                                <LutronPreviewImage
                                                    src={imagePreview}
                                                    alt=""
                                                    style={{
                                                        marginTop: 0,
                                                        borderRadius: '4px',
                                                        width: '80px',
                                                        height: '60px',
                                                        objectFit: 'contain',
                                                        flexShrink: 0
                                                    }}
                                                />
                                            )}
                                        </Box>


                                        <Box display="flex" justifyContent="flex-end" mt={2}>
                                            <Button
                                                variant="contained"
                                                disabled={saveLoading}
                                                sx={{
                                                    backgroundColor: saveLoading ? '#888' : buttonColor,
                                                    color: '#fff',
                                                    '&:hover': { backgroundColor: saveLoading ? '#888' : darken(buttonColor, 0.12) },
                                                    borderRadius: '4px',
                                                    px: { xs: 1, sm: 1.5, md: 2, lg: 2.5 },
                                                    py: { xs: 0.3, sm: 0.4, md: 0.6, lg: 0.8 },
                                                    textTransform: 'none',
                                                    fontSize: { xs: '8px', sm: '10px', md: '12px', lg: '14px' },
                                                }}
                                                onClick={handleSave}
                                            >
                                                {saveLoading ? 'Saving...' : 'Save'}
                                            </Button>
                                        </Box>
                                    </Box>
                                )}

                                {displayMode === 'Project' && (
                                    <Box
                                        className="project-content-scrollable"
                                        sx={{
                                            border: '2px solid #000',
                                            p: { xs: 0.5, sm: 0.8, md: 1.2, lg: 1.5 },
                                            pt: { xs: 1, sm: 1.2, md: 1.5, lg: 1.5 },
                                            overflow: 'visible',
                                            overflowX: 'hidden',
                                            mb: 2,
                                            borderRadius: { xs: '4px', sm: '6px', md: '8px', lg: '10px' },
                                            maxHeight: 'none',
                                            height: 'auto',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: { xs: 0.8, sm: 1, md: 1.2 },
                                        }}
                                    >
                                        <Typography fontWeight="bold" mb={0.5} fontSize={{ xs: '9px', sm: '10px', md: '12px', lg: '14px' }}>
                                            Description
                                        </Typography>
                                        <CustomizedHomeDescriptionEditor
                                            value={description}
                                            onChange={setDescription}
                                            placeholder="Write here"
                                        />

                                        <Box sx={{
                                            display: 'flex',
                                            flexDirection: { xs: 'column', sm: 'row' },
                                            gap: { xs: 0.8, sm: 1, md: 1.5, lg: 2 },
                                            mt: 1.5,
                                        }}>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography fontWeight="bold" mb={0} ml={{ xs: 0, sm: 5 }} fontSize={{ xs: '9px', sm: '10px', md: '12px', lg: '14px' }}>
                                                    Location
                                                </Typography>
                                                <TextField
                                                    fullWidth
                                                    value={locationText || ''}
                                                    onChange={(e) => {
                                                        setLocationText(e.target.value);
                                                        setUserEditedFields(prev => ({ ...prev, locationText: true }));
                                                    }}
                                                    variant="outlined"
                                                    placeholder="Enter Google Maps link or location"
                                                    sx={{
                                                        backgroundColor: '#f0f0f0',
                                                        borderRadius: '4px',
                                                        '&:hover': {
                                                            backgroundColor: '#e8e8e8',
                                                        },
                                                        '& .MuiOutlinedInput-root': {
                                                            '&:hover fieldset': {
                                                                borderColor: '#1976d2',
                                                            },
                                                            '&.Mui-focused fieldset': {
                                                                borderColor: '#1976d2',
                                                                borderWidth: 2,
                                                            },
                                                            '& input': {
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                            },
                                                            '&::-webkit-scrollbar': {
                                                                display: 'none',
                                                            },
                                                            scrollbarWidth: 'none',
                                                        },
                                                        '& input': {
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                        },
                                                        '& input::-webkit-scrollbar': {
                                                            display: 'none',
                                                        },
                                                        '& input[type=number]': {
                                                            MozAppearance: 'textfield',
                                                        },
                                                        '& input[type=number]::-webkit-outer-spin-button': {
                                                            WebkitAppearance: 'none',
                                                            margin: 0,
                                                        },
                                                        '& input[type=number]::-webkit-inner-spin-button': {
                                                            WebkitAppearance: 'none',
                                                            margin: 0,
                                                        },
                                                    }}
                                                />
                                            </Box>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography fontWeight="bold" mb={0} ml={{ xs: 0, sm: 5 }} fontSize={{ xs: '9px', sm: '10px', md: '12px', lg: '14px' }}>
                                                    Address
                                                </Typography>
                                                <TextField
                                                    fullWidth
                                                    value={address || ''}
                                                    onChange={(e) => {
                                                        setAddress(e.target.value);
                                                        setUserEditedFields(prev => ({ ...prev, address: true }));
                                                    }}
                                                    variant="outlined"
                                                    sx={{
                                                        backgroundColor: '#f0f0f0',
                                                        borderRadius: '4px',
                                                        '& .MuiOutlinedInput-root': {
                                                            '& input': {
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                            },
                                                            '&::-webkit-scrollbar': {
                                                                display: 'none',
                                                            },
                                                            scrollbarWidth: 'none',
                                                        },
                                                        '& input': {
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                        },
                                                        '& input::-webkit-scrollbar': {
                                                            display: 'none',
                                                        },
                                                        '& input[type=number]': {
                                                            MozAppearance: 'textfield',
                                                        },
                                                        '& input[type=number]::-webkit-outer-spin-button': {
                                                            WebkitAppearance: 'none',
                                                            margin: 0,
                                                        },
                                                        '& input[type=number]::-webkit-inner-spin-button': {
                                                            WebkitAppearance: 'none',
                                                            margin: 0,
                                                        },
                                                    }}
                                                />
                                            </Box>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography fontWeight="bold" mb={0} ml={{ xs: 0, sm: 5 }} fontSize={{ xs: '9px', sm: '10px', md: '12px', lg: '14px' }}>
                                                    Area size
                                                </Typography>
                                                <TextField
                                                    fullWidth
                                                    value={areaSize || ''}
                                                    onChange={(e) => {
                                                        setAreaSize(e.target.value);
                                                        setUserEditedFields(prev => ({ ...prev, areaSize: true }));
                                                    }}
                                                    variant="outlined"
                                                    sx={{
                                                        backgroundColor: '#f0f0f0',
                                                        borderRadius: '4px',
                                                        '& .MuiOutlinedInput-root': {
                                                            '& input': {
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                            },
                                                            '&::-webkit-scrollbar': {
                                                                display: 'none',
                                                            },
                                                            scrollbarWidth: 'none',
                                                        },
                                                        '& input': {
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                        },
                                                        '& input::-webkit-scrollbar': {
                                                            display: 'none',
                                                        },
                                                        '& input[type=number]': {
                                                            MozAppearance: 'textfield',
                                                        },
                                                        '& input[type=number]::-webkit-outer-spin-button': {
                                                            WebkitAppearance: 'none',
                                                            margin: 0,
                                                        },
                                                        '& input[type=number]::-webkit-inner-spin-button': {
                                                            WebkitAppearance: 'none',
                                                            margin: 0,
                                                        },
                                                    }}
                                                />
                                            </Box>
                                        </Box>

                                        {/* Installed Solutions Section */}
                                        <Box sx={{ mt: 1.5, mb: 2 }}>
                                            <Typography fontWeight="bold" mb={1} fontSize={{ xs: '9px', sm: '10px', md: '12px', lg: '14px' }}>
                                                Installed Solutions
                                            </Typography>

                                            {/* Add Solution Input */}
                                            <Box sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
                                                <TextField
                                                    fullWidth
                                                    value={newSolutionText || ''}
                                                    onChange={(e) => setNewSolutionText(e.target.value)}
                                                    placeholder="Enter solution name"
                                                    size="small"
                                                    sx={{
                                                        '& .MuiInputBase-root': {
                                                            fontSize: { xs: '8px', sm: '9px', md: '10px', lg: '12px' },
                                                            height: { xs: '28px', sm: '32px', md: '36px', lg: '40px' },
                                                            '& input': {
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                            },
                                                            '&::-webkit-scrollbar': {
                                                                display: 'none',
                                                            },
                                                            scrollbarWidth: 'none',
                                                        },
                                                        '& input::-webkit-scrollbar': {
                                                            display: 'none',
                                                        },
                                                    }}
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter') {
                                                            handleAddSolution();
                                                        }
                                                    }}
                                                />
                                                <Button
                                                    variant="contained"
                                                    onClick={handleAddSolution}
                                                    disabled={!newSolutionText.trim() || installedSolutions.length >= 10}
                                                    sx={{
                                                        backgroundColor: installedSolutions.length >= 10 ? '#e0e0e0' : '#1976d2',
                                                        color: installedSolutions.length >= 10 ? '#9e9e9e' : '#fff',
                                                        minWidth: 'auto',
                                                        px: 2,
                                                        py: 1,
                                                        textTransform: 'none',
                                                        fontSize: { xs: '8px', sm: '10px', md: '12px', lg: '14px' },
                                                        '&:hover': {
                                                            backgroundColor: installedSolutions.length >= 10 ? '#e0e0e0' : '#1565c0',
                                                        },
                                                        '&:disabled': {
                                                            backgroundColor: '#e0e0e0',
                                                            color: '#9e9e9e',
                                                        },
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 0.5,
                                                    }}
                                                >
                                                    <AddIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18, lg: 20 } }} />
                                                    Add
                                                </Button>
                                            </Box>

                                            {/* Solutions List */}
                                            {installedSolutions.length > 0 && (
                                                <Box sx={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: 1,
                                                    mb: 2,
                                                    maxHeight: 'none', // Remove height limit
                                                    overflow: 'visible', // Remove all scroll
                                                    // Hide scrollbars for all browsers
                                                    scrollbarWidth: 'none', // Firefox
                                                    msOverflowStyle: 'none', // IE and Edge
                                                    '&::-webkit-scrollbar': {
                                                        display: 'none',
                                                        width: 0,
                                                        height: 0,
                                                    },
                                                    '& *': {
                                                        scrollbarWidth: 'none', // Firefox
                                                        msOverflowStyle: 'none', // IE and Edge
                                                        '&::-webkit-scrollbar': {
                                                            display: 'none',
                                                            width: 0,
                                                            height: 0,
                                                        },
                                                    },
                                                }}>
                                                    {installedSolutions.map((solution) => (
                                                        <Box
                                                            key={solution.id}
                                                            sx={{
                                                                border: '1px solid #e0e0e0',
                                                                borderRadius: '8px',
                                                                p: 1.5,
                                                                backgroundColor: '#fff',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 1,
                                                            }}
                                                        >
                                                            {/* Solution Name Input */}
                                                            <TextField
                                                                fullWidth
                                                                value={solution.name || ''}
                                                                onChange={(e) => updateSolutionName(solution.id, e.target.value)}
                                                                size="small"
                                                                sx={{
                                                                    '& .MuiInputBase-root': {
                                                                        fontSize: { xs: '8px', sm: '9px', md: '10px', lg: '12px' },
                                                                        height: { xs: '28px', sm: '32px', md: '36px', lg: '40px' },
                                                                        '& input': {
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                        },
                                                                        '&::-webkit-scrollbar': {
                                                                            display: 'none',
                                                                        },
                                                                        scrollbarWidth: 'none',
                                                                    },
                                                                    '& input::-webkit-scrollbar': {
                                                                        display: 'none',
                                                                    },
                                                                }}
                                                            />

                                                            {/* Remove Button */}
                                                            <Button
                                                                onClick={() => removeSolution(solution.id)}
                                                                sx={{
                                                                    minWidth: 'auto',
                                                                    width: 32,
                                                                    height: 32,
                                                                    borderRadius: '50%',
                                                                    backgroundColor: '#f44336',
                                                                    color: installedSolutions.length >= 10 ? '#9e9e9e' : '#fff',
                                                                    fontSize: '16px',
                                                                    '&:hover': {
                                                                        backgroundColor: '#d32f2f',
                                                                    },
                                                                }}
                                                            >
                                                                ×
                                                            </Button>
                                                        </Box>
                                                    ))}
                                                </Box>
                                            )}
                                        </Box>

                                        <Box
                                            display="flex"
                                            justifyContent="flex-end"
                                            mt={2}
                                            sx={{
                                                '&::-webkit-scrollbar': {
                                                    display: 'none',
                                                },
                                                scrollbarWidth: 'none',
                                            }}
                                        >
                                            <Button
                                                variant="contained"
                                                disabled={saveLoading}
                                                sx={{
                                                    backgroundColor: saveLoading ? '#888' : buttonColor,
                                                    color: '#fff',
                                                    '&:hover': { backgroundColor: saveLoading ? '#888' : darken(buttonColor, 0.12) },
                                                    borderRadius: '4px',
                                                    px: { xs: 1, sm: 1.5, md: 2, lg: 2.5 },
                                                    py: { xs: 0.3, sm: 0.4, md: 0.6, lg: 0.8 },
                                                    textTransform: 'none',
                                                    fontSize: { xs: '8px', sm: '10px', md: '12px', lg: '14px' },
                                                }}
                                                onClick={handleSave}
                                            >
                                                {saveLoading ? 'Saving...' : 'Save'}
                                            </Button>
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        )}
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
};

export default HomeComponent;
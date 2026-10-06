import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Grid,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    useTheme,
    useMediaQuery,
    CircularProgress,
    Alert,
    Snackbar,
    Tabs,
    Tab,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SensorIcon from '@mui/icons-material/Sensors';
import { SidebarItems, getVisibleSidebarItems } from '../../../utils/sidebarItems';
import { UseAuth, getVisibleSidebarItemsWithPaths } from '../../../customhooks/UseAuth';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
    fetchSensors, 
    discoverSensors, 
    clearError as clearSensorsError, 
    clearDiscoverError, 
    clearDiscoverSuccess 
} from '../../../redux/slice/sensors/sensorsSlice';
import { fetchProcessors } from '../../../redux/slice/processor/processorSlice';

const ManageSensors = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
    const isLaptop = useMediaQuery(theme.breakpoints.between('md', 'lg'));
    const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    // Get current user role for sidebar filtering
    const { role: currentUserRole } = UseAuth();
    const visibleSidebarItemsWithPaths = getVisibleSidebarItemsWithPaths(currentUserRole);
    
    // Redux state
    const { 
        sensors, 
        loading: sensorsLoading, 
        error: sensorsError, 
        discovering, 
        discoverSuccess, 
        discoverError 
    } = useSelector((state) => state.sensors);
    
    
    const { processors } = useSelector((state) => state.processor);
    
    // Local state
    const [activeTab, setActiveTab] = useState(0);

    // Fetch data on component mount
    useEffect(() => {
        dispatch(fetchSensors());
        dispatch(fetchProcessors());
    }, [dispatch]);

    const handleDiscoverSensors = async () => {
        // Use the first available processor ID
        const processorId = processors.length > 0 ? processors[0].id : null;
        
        if (!processorId) {
            console.error('No processors available for sensor discovery');
            return;
        }
        
        const result = await dispatch(discoverSensors(processorId));
        if (result.type === 'sensors/discoverSensors/fulfilled') {
            // Auto-refresh sensors data after successful discovery
            setTimeout(() => {
                dispatch(fetchSensors());
            }, 1000);
        }
    };


    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'ok':
            case 'active':
            case 'online':
            case 'normal':
                return 'success';
            case 'not_ok':
            case 'inactive':
            case 'offline':
            case 'error':
            case 'fault':
                return 'error';
            case 'maintenance':
            case 'warning':
                return 'warning';
            default:
                return 'default';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleString();
        } catch {
            return dateString;
        }
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            p: { xs: 0.3, sm: 0.5, md: 1, lg: 1.5 },
            position: 'relative'
        }}>
            {/* Main Container */}
            <Box sx={{
                width: { xs: '100%', sm: '100%', md: '100%', lg: '100%' },
                mx: 'auto',
                px: { xs: 0.3, sm: 0.5, md: 1, lg: 1.5 },
            }}>
                <Grid container spacing={{ xs: 0.3, sm: 0.5, md: 1, lg: 1 }}>
                    {/* Left Sidebar */}
                    <Grid item xs={12} md={3} sx={{
                        order: { xs: 1, md: 1 },
                        p: { xs: 0.3, sm: 0.5, md: 1, lg: 1.5 },
                        borderRadius: { xs: '4px', lg: '8px' },
                        mb: { xs: 0.3, lg: 0 }
                    }}>
                        <Typography variant="h6" sx={{
                            mb: { xs: 0.8, sm: 1, md: 1.5, lg: 2 },
                            color: theme.palette.text.secondary,
                            fontSize: { xs: '12px', sm: '14px', md: '16px', lg: '20px' }
                        }}>
                            Settings
                        </Typography>

                        {/* Responsive sidebar items layout */}
                        <Box sx={{
                            display: 'flex',
                            flexDirection: isTablet ? 'row' : 'column',
                            flexWrap: isTablet ? 'wrap' : 'nowrap',
                            gap: isTablet ? 1 : 0,
                            justifyContent: isTablet ? 'flex-start' : 'flex-start',
                            alignItems: isTablet ? 'flex-start' : 'stretch'
                        }}>
                            {visibleSidebarItemsWithPaths.map((item) => (
                                <Box
                                    key={item.label}
                                    onClick={() => {
                                        if (item.path) navigate(item.path);
                                    }}
                                    sx={{
                                        backgroundColor:
                                            location.pathname === item.path
                                                ? theme.palette.custom?.containerBg || '#f5f5f5'
                                                : 'transparent',
                                        color:
                                            location.pathname === item.path
                                                ? theme.palette.text.primary
                                                : theme.palette.text.secondary,
                                        px: isTablet ? 1.5 : { xs: 0.8, sm: 1, md: 1.5, lg: 2 },
                                        py: isTablet ? 0.8 : { xs: 0.3, sm: 0.5, md: 0.8, lg: 1 },
                                        borderRadius: '4px',
                                        mb: isTablet ? 0 : { xs: 0.2, sm: 0.3, md: 0.5, lg: 0.8 },
                                        mr: isTablet ? 1 : 0,
                                        fontSize: isTablet ? '11px' : { xs: '9px', sm: '10px', md: '12px', lg: '14px' },
                                        fontWeight: location.pathname === item.path ? 600 : 400,
                                        cursor: 'pointer',
                                        minWidth: isTablet ? 'auto' : '100%',
                                        textAlign: isTablet ? 'center' : 'left',
                                        whiteSpace: isTablet ? 'nowrap' : 'normal',
                                        '&:hover': {
                                            backgroundColor: theme.palette.custom?.containerBg || '#f5f5f5',
                                        },
                                        // Tablet-specific styling
                                        ...(isTablet && {
                                            flex: '0 0 auto',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            minHeight: '32px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        })
                                    }}
                                >
                                    {item.label}
                                </Box>
                            ))}
                        </Box>
                    </Grid>

                    {/* Right Content Area */}
                    <Grid item xs={12} lg={9} sx={{
                        order: { xs: 2, lg: 2 }
                    }}>
                        {/* White container */}
                        <Box
                            sx={{
                                backgroundColor: '#fff',
                                borderRadius: { xs: '4px', sm: '6px', md: '8px', lg: '10px' },
                                p: { xs: 0.5, sm: 0.8, md: 1.2, lg: 1.5 },
                                width: '100%',
                                height: 'auto',
                                minHeight: 'fit-content',
                                overflow: 'visible',
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            {/* Header */}
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                mb: 3
                            }}>
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2
                            }}>
                                <SensorIcon sx={{ fontSize: 32, color: theme.palette.primary.main }} />
                                <Typography variant="h4" sx={{ 
                                    fontWeight: 'bold',
                                        fontSize: { xs: '14px', sm: '16px', md: '18px' }
                                }}>
                                    Device Management
                                </Typography>
                                </Box>
                                
                                {/* Discover Sensors Button */}
                                <Button
                                    variant="contained"
                                    onClick={handleDiscoverSensors}
                                    disabled={discovering || processors.length === 0}
                                    startIcon={discovering ? <CircularProgress size={20} /> : <SearchIcon />}
                                    sx={{
                                        px: 3,
                                        py: 1.5,
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        borderRadius: 1,
                                        textTransform: 'none',
                                        boxShadow: 2,
                                        '&:hover': {
                                            boxShadow: 4,
                                        }
                                    }}
                                >
                                    {discovering ? 'Discovering Sensors...' : 
                                     processors.length === 0 ? 'No Processors Available' : 
                                     'Discover Sensors'}
                                </Button>
                            </Box>

                            {/* Tabs */}
                            {/* <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                                <Tabs value={activeTab} onChange={handleTabChange}> */}
                                    {/* <Tab 
                                        label="Sensors" 
                                        icon={<SensorIcon />} 
                                        iconPosition="start"
                                        sx={{ textTransform: 'none', fontWeight: 600 }}
                                    />
                                    <Tab 
                                        label="Modules" 
                                        icon={<ExtensionIcon />} 
                                        iconPosition="start"
                                        sx={{ textTransform: 'none', fontWeight: 600 }}
                                    /> */}
                                {/* </Tabs>
                            </Box> */}

                            {/* Tab Content */}
                            {activeTab === 0 && (
                                <Box>

                                    {/* Sensors Data Table */}
                                    {sensorsLoading && (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                            <CircularProgress />
                                        </Box>
                                    )}

                                    {sensorsError && (
                                        <Alert severity="error" sx={{ mb: 2 }}>
                                            {sensorsError}
                                        </Alert>
                                    )}

                                    {!sensorsLoading && !sensorsError && sensors.length > 0 && (
                                        <TableContainer component={Paper} sx={{ 
                                            borderRadius: 1,
                                            boxShadow: 1,
                                            overflow: 'auto',
                                            maxHeight: 600
                                        }}>
                                            <Table sx={{ minWidth: 900 }}>
                                                <TableHead>
                                                    <TableRow sx={{ backgroundColor: theme.palette.grey[50] }}>
                                                        <TableCell sx={{ 
                                                            fontWeight: 500, 
                                                            fontSize: '14px', 
                                                            textAlign: 'center',
                                                            borderBottom: '2px solid #ddd',
                                                            backgroundColor: '#cdc0a0'
                                                        }}>Area Code</TableCell>
                                                        <TableCell sx={{ 
                                                            fontWeight: 500, 
                                                            fontSize: '14px', 
                                                            textAlign: 'center',
                                                            borderBottom: '2px solid #ddd',
                                                            backgroundColor: '#cdc0a0'
                                                        }}>Area</TableCell>
                                                        <TableCell sx={{ 
                                                            fontWeight: 500, 
                                                            fontSize: '14px', 
                                                            textAlign: 'center',
                                                            borderBottom: '2px solid #ddd',
                                                            backgroundColor: '#cdc0a0'
                                                        }}>Device Code</TableCell>
                                                        <TableCell sx={{ 
                                                            fontWeight: 500, 
                                                            fontSize: '14px', 
                                                            textAlign: 'center',
                                                            borderBottom: '2px solid #ddd',
                                                            backgroundColor: '#cdc0a0'
                                                        }}>Device Name</TableCell>
                                                        <TableCell sx={{ 
                                                            fontWeight: 500, 
                                                            fontSize: '14px', 
                                                            textAlign: 'center',
                                                            borderBottom: '2px solid #ddd',
                                                            backgroundColor: '#cdc0a0'
                                                        }}>Device Type</TableCell>
                                                        <TableCell sx={{ 
                                                            fontWeight: 500, 
                                                            fontSize: '14px', 
                                                            textAlign: 'center',
                                                            borderBottom: '2px solid #ddd',
                                                            backgroundColor: '#cdc0a0'
                                                        }}>Alert Status</TableCell>
                                                        <TableCell sx={{ 
                                                            fontWeight: 500, 
                                                            fontSize: '14px', 
                                                            textAlign: 'center',
                                                            borderBottom: '2px solid #ddd',
                                                            backgroundColor: '#cdc0a0'
                                                        }}>Serial Number</TableCell>
                                                        <TableCell sx={{ 
                                                            fontWeight: 500, 
                                                            fontSize: '14px', 
                                                            textAlign: 'center',
                                                            borderBottom: '2px solid #ddd',
                                                            backgroundColor: '#cdc0a0'
                                                        }}>Model</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {sensors.map((sensor, index) => (
                                                        <TableRow 
                                                            key={sensor.device_code || index}
                                                            sx={{ 
                                                                '&:last-child td, &:last-child th': { border: 0 },
                                                                '&:hover': { backgroundColor: theme.palette.grey[50] }
                                                            }}
                                                        >
                                                            <TableCell sx={{ 
                                                                fontSize: '14px', 
                                                                textAlign: 'center', 
                                                                fontWeight: 500,
                                                                borderBottom: '1px solid #eee',
                                                                backgroundColor: '#fff'
                                                            }}>
                                                                {sensor.area_code || 'N/A'}
                                                            </TableCell>
                                                            <TableCell sx={{ 
                                                                fontSize: '14px', 
                                                                textAlign: 'center', 
                                                                fontWeight: 500,
                                                                borderBottom: '1px solid #eee',
                                                                backgroundColor: '#fff'
                                                            }}>
                                                                {sensor.area || 'N/A'}
                                                            </TableCell>
                                                            <TableCell sx={{ 
                                                                fontSize: '14px', 
                                                                textAlign: 'center', 
                                                                fontWeight: 500,
                                                                borderBottom: '1px solid #eee',
                                                                backgroundColor: '#fff'
                                                            }}>
                                                                {sensor.device_code || 'N/A'}
                                                            </TableCell>
                                                            <TableCell sx={{ 
                                                                fontSize: '14px', 
                                                                textAlign: 'left', 
                                                                fontWeight: 500,
                                                                borderBottom: '1px solid #eee',
                                                                backgroundColor: '#fff'
                                                            }}>
                                                                <Typography variant="body2" sx={{
                                                                    fontWeight: 600,
                                                                    color: theme.palette.text.primary
                                                                }}>
                                                                    {sensor.device_name || 'Unnamed Device'}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell sx={{ 
                                                                fontSize: '14px', 
                                                                textAlign: 'center', 
                                                                fontWeight: 500,
                                                                borderBottom: '1px solid #eee',
                                                                backgroundColor: '#fff'
                                                            }}>
                                                                {sensor.device_type || 'Unknown'}
                                                            </TableCell>
                                                            <TableCell sx={{ 
                                                                textAlign: 'center',
                                                                borderBottom: '1px solid #eee',
                                                                backgroundColor: '#fff'
                                                            }}>
                                                                <Chip
                                                                    label={sensor.alert_status || 'Unknown'}
                                                                    color={getStatusColor(sensor.alert_status)}
                                                                    size="small"
                                                                    sx={{ fontSize: '12px', fontWeight: 500 }}
                                                                />
                                                            </TableCell>
                                                            <TableCell sx={{ 
                                                                fontSize: '14px', 
                                                                textAlign: 'center', 
                                                                fontWeight: 500,
                                                                fontFamily: 'monospace',
                                                                borderBottom: '1px solid #eee',
                                                                backgroundColor: '#fff'
                                                            }}>
                                                                {sensor.serial_number || 'N/A'}
                                                            </TableCell>
                                                            <TableCell sx={{ 
                                                                fontSize: '14px', 
                                                                textAlign: 'center', 
                                                                fontWeight: 500,
                                                                fontFamily: 'monospace',
                                                                borderBottom: '1px solid #eee',
                                                                backgroundColor: '#fff'
                                                            }}>
                                                                {sensor.model || 'N/A'}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    )}

                                    {!sensorsLoading && !sensorsError && sensors.length === 0 && (
                            <Box sx={{
                                display: 'flex',
                                            flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                            minHeight: '300px',
                                backgroundColor: theme.palette.grey[50],
                                borderRadius: 2,
                                border: '2px dashed',
                                borderColor: theme.palette.grey[300]
                            }}>
                                            <SensorIcon sx={{ fontSize: 48, color: theme.palette.grey[400], mb: 2 }} />
                                <Typography variant="h6" sx={{
                                                color: theme.palette.text.secondary,
                                                textAlign: 'center',
                                                mb: 1
                                            }}>
                                                No Sensors Found
                                            </Typography>
                                            <Typography variant="body2" sx={{
                                    color: theme.palette.text.secondary,
                                    textAlign: 'center'
                                }}>
                                                Click "Discover Sensors" to find and add sensors to your system
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            )}

                        </Box>
                    </Grid>
                </Grid>
            </Box>

            {/* Success/Error Snackbars */}
            <Snackbar
                open={discoverSuccess}
                autoHideDuration={3000}
                onClose={() => dispatch(clearDiscoverSuccess())}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => dispatch(clearDiscoverSuccess())} severity="success">
                    Sensors discovered successfully!
                </Alert>
            </Snackbar>

            <Snackbar
                open={!!discoverError}
                autoHideDuration={5000}
                onClose={() => dispatch(clearDiscoverError())}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => dispatch(clearDiscoverError())} severity="error">
                    {discoverError}
                </Alert>
            </Snackbar>

        </Box>
    );
};

export default ManageSensors;

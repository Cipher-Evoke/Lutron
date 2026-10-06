import React, { useState, useEffect } from 'react';
import { resolveApiOrigin } from '../../../../../shared/utils/resolveMediaUrl';
import { toSafeReactText } from '../../../../../utils/safeReactText';
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
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ExtensionIcon from '@mui/icons-material/Extension';
import { useDispatch, useSelector } from 'react-redux';
import { SidebarItems, getVisibleSidebarItems } from '../../../utils/sidebarItems';
import { UseAuth } from '../../../customhooks/UseAuth';
import SettingsLayout from '../SettingsLayout';
import { useLocation, useNavigate } from 'react-router-dom';

const ManageModules = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
    const isLaptop = useMediaQuery(theme.breakpoints.between('md', 'lg'));
    const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
    const dispatch = useDispatch();
    const location = useLocation();
    const navigate = useNavigate();

    // Get current user role for sidebar filtering
    const { role: currentUserRole } = UseAuth();

    // State for modules data
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // State for file upload
    const [uploading, setUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);

    // Fetch modules data on component mount
    useEffect(() => {
        fetchModules();
    }, []);

    const fetchModules = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('lutron');
            const response = await fetch(`${resolveApiOrigin()}/list/modules`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setModules(data || []);
        } catch (err) {
            console.error('Error fetching modules:', err);
            setError('Failed to fetch modules data');
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            setUploadError(null);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setUploadError('Please select a file to upload');
            return;
        }

        setUploading(true);
        setUploadError(null);
        setUploadSuccess(false);

        try {
            const token = localStorage.getItem('lutron');
            const formData = new FormData();
            formData.append('file', selectedFile);

            const response = await fetch(`${resolveApiOrigin()}/alert/upload_device_alerts`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            setUploadSuccess(true);
            setSelectedFile(null);

            // Reset file input
            const fileInput = document.getElementById('file-upload');
            if (fileInput) {
                fileInput.value = '';
            }

            // Auto-refresh modules data after successful upload with a small delay
            // to ensure database has been updated
            setTimeout(() => {
                fetchModules();
            }, 1000);
        } catch (err) {
            console.error('Error uploading file:', err);
            setUploadError('Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'ok':
            case 'active':
            case 'online':
                return 'success';
            case 'not_ok':
            case 'inactive':
            case 'offline':
            case 'error':
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
        <>
        <SettingsLayout>
                            {/* Header */}
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                mb: 3
                            }}>
                                <ExtensionIcon sx={{ fontSize: 32, color: theme.palette.primary.main }} />
                                <Typography variant="h4" sx={{
                                    fontWeight: 'bold',
                                    fontSize: { xs: '14px', sm: '16px', md: '18px' }
                                }}>
                                    Manage Modules
                                </Typography>
                            </Box>

                            {/* Main Content */}
                            <Box>
                                {/* Header */}
                                {/* <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    mb: 3
                                }}>
                                    <Typography variant="h5" sx={{
                                        fontWeight: 600,
                                        color: theme.palette.text.primary,
                                        fontSize: { xs: '18px', sm: '20px', md: '20px' }
                                    }}>
                                        List of Modules
                                    </Typography>
                                </Box> */}

                                {/* Upload Section - Show at top when no table, below when table exists */}
                                {modules.length === 0 && !loading && !error && (
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="h6" sx={{
                                            mb: 2,
                                            fontWeight: 600,
                                            color: theme.palette.text.primary,
                                            fontSize: { xs: '14px', sm: '16px', md: '18px' }
                                        }}>
                                            Upload Here
                                        </Typography>

                                        <Box sx={{
                                            border: '2px dashed',
                                            borderColor: theme.palette.grey[300],
                                            borderRadius: 1,
                                            p: 2,
                                            textAlign: 'center',
                                            mb: 2,
                                            backgroundColor: "#d6dde8",
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                borderColor: theme.palette.primary.main,
                                                backgroundColor: "#d6dde8"
                                            }
                                        }}>
                                            <CloudUploadIcon sx={{
                                                fontSize: 32,
                                                color: theme.palette.text.secondary,
                                                mb: 1
                                            }} />
                                            <Typography variant="body2" sx={{
                                                mb: 2,
                                                color: theme.palette.text.secondary,
                                                fontSize: '12px',
                                                fontWeight: 500
                                            }}>
                                                Select a file to upload device alerts
                                            </Typography>

                                            <input
                                                id="file-upload"
                                                type="file"
                                                onChange={handleFileSelect}
                                                style={{ display: 'none' }}
                                                accept=".csv,.xlsx,.xls,.json"
                                            />

                                            <Button
                                                variant="outlined"
                                                component="label"
                                                htmlFor="file-upload"
                                                size="small"
                                                sx={{
                                                    mb: 1,
                                                    fontWeight: 500,
                                                    textTransform: 'none',
                                                    fontSize: '12px'
                                                }}
                                            >
                                                Choose File
                                            </Button>

                                            {selectedFile && (
                                                <Box sx={{ mt: 1 }}>
                                                    <Typography variant="caption" sx={{
                                                        color: theme.palette.primary.main,
                                                        fontWeight: 500,
                                                        fontSize: '11px',
                                                        display: 'block',
                                                        wordBreak: 'break-all'
                                                    }}>
                                                        Selected: {selectedFile.name}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>

                                        <Button
                                            variant="contained"
                                            fullWidth
                                            onClick={handleUpload}
                                            disabled={!selectedFile || uploading}
                                            startIcon={uploading ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                                            sx={{
                                                backgroundColor: theme.palette.primary.main,
                                                fontWeight: 500,
                                                textTransform: 'none',
                                                fontSize: '13px',
                                                py: 1.5,
                                                '&:hover': {
                                                    backgroundColor: theme.palette.primary.dark
                                                },
                                                '&:disabled': {
                                                    backgroundColor: theme.palette.grey[300],
                                                    color: theme.palette.grey[500]
                                                }
                                            }}
                                        >
                                            {uploading ? 'Uploading...' : 'Upload File'}
                                        </Button>

                                        {uploadError && (
                                            <Alert severity="error" sx={{ mt: 2 }}>
                                                {uploadError}
                                            </Alert>
                                        )}

                                        {uploadSuccess && (
                                            <Alert severity="success" sx={{ mt: 2 }}>
                                                File uploaded successfully!
                                            </Alert>
                                        )}
                                    </Box>
                                )}

                                {/* Modules Table */}
                                {loading ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                        <CircularProgress />
                                    </Box>
                                ) : error ? (
                                    <Alert severity="error" sx={{ mb: 2 }}>
                                        {toSafeReactText(error)}
                                    </Alert>
                                ) : modules.length > 0 ? (
                                    <Box>
                                        <Box sx={{
                                            backgroundColor: '#f5f5f5',
                                            borderRadius: '8px',
                                            padding: '20px',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                            border: '1px solid #ddd',
                                            overflow: 'auto'
                                        }}>
                                            <Table sx={{ minWidth: 800 }}>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell sx={{
                                                            fontWeight: 500,
                                                            fontSize: '14px',
                                                            textAlign: 'center',
                                                            borderBottom: '2px solid #ddd',
                                                            backgroundColor: '#d6dde8'
                                                        }}>
                                                            Device Code
                                                        </TableCell>
                                                        <TableCell sx={{
                                                            fontWeight: 500,
                                                            fontSize: '14px',
                                                            textAlign: 'center',
                                                            borderBottom: '2px solid #ddd',
                                                            backgroundColor: '#d6dde8'
                                                        }}>
                                                            Device Name
                                                        </TableCell>
                                                        <TableCell sx={{
                                                            fontWeight: 500,
                                                            fontSize: '14px',
                                                            textAlign: 'center',
                                                            borderBottom: '2px solid #ddd',
                                                            backgroundColor: '#d6dde8'
                                                        }}>
                                                            Serial Number
                                                        </TableCell>
                                                        <TableCell sx={{
                                                            fontWeight: 500,
                                                            fontSize: '14px',
                                                            textAlign: 'center',
                                                            borderBottom: '2px solid #ddd',
                                                            backgroundColor: '#d6dde8'
                                                        }}>
                                                            Model
                                                        </TableCell>
                                                        <TableCell sx={{
                                                            fontWeight: 500,
                                                            fontSize: '14px',
                                                            textAlign: 'center',
                                                            borderBottom: '2px solid #ddd',
                                                            backgroundColor: '#d6dde8'
                                                        }}>
                                                            Device Type
                                                        </TableCell>
                                                        <TableCell sx={{
                                                            fontWeight: 500,
                                                            fontSize: '14px',
                                                            textAlign: 'center',
                                                            borderBottom: '2px solid #ddd',
                                                            backgroundColor: '#d6dde8'
                                                        }}>
                                                            Alert Status
                                                        </TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {modules.map((module, index) => (
                                                        <TableRow
                                                            key={module.device_code || index}
                                                            sx={{
                                                                '&:last-child td, &:last-child th': { border: 0 },
                                                                '&:hover': { backgroundColor: 'rgba(0,0,0,0.02)' }
                                                            }}
                                                        >
                                                            <TableCell sx={{
                                                                fontSize: '14px',
                                                                textAlign: 'center',
                                                                fontWeight: 500,
                                                                borderBottom: '1px solid #eee',
                                                                backgroundColor: '#fff'
                                                            }}>
                                                                {module.device_code || 'N/A'}
                                                            </TableCell>
                                                            <TableCell sx={{
                                                                fontSize: '14px',
                                                                textAlign: 'left',
                                                                fontWeight: 500,
                                                                borderBottom: '1px solid #eee',
                                                                backgroundColor: '#fff'
                                                            }}>
                                                                {module.device_name || 'Unnamed Module'}
                                                            </TableCell>
                                                            <TableCell sx={{
                                                                fontSize: '14px',
                                                                textAlign: 'center',
                                                                fontWeight: 500,
                                                                fontFamily: 'monospace',
                                                                borderBottom: '1px solid #eee',
                                                                backgroundColor: '#fff'
                                                            }}>
                                                                {module.serial_number || 'N/A'}
                                                            </TableCell>
                                                            <TableCell sx={{
                                                                fontSize: '14px',
                                                                textAlign: 'center',
                                                                fontWeight: 500,
                                                                fontFamily: 'monospace',
                                                                borderBottom: '1px solid #eee',
                                                                backgroundColor: '#fff'
                                                            }}>
                                                                {module.model || 'N/A'}
                                                            </TableCell>
                                                            <TableCell sx={{
                                                                textAlign: 'center',
                                                                borderBottom: '1px solid #eee',
                                                                backgroundColor: '#fff'
                                                            }}>
                                                                <Chip
                                                                    label={module.device_type || 'Unknown'}
                                                                    color="primary"
                                                                    size="small"
                                                                    sx={{
                                                                        fontSize: '12px',
                                                                        fontWeight: 500
                                                                    }}
                                                                />
                                                            </TableCell>
                                                            <TableCell sx={{
                                                                textAlign: 'center',
                                                                borderBottom: '1px solid #eee',
                                                                backgroundColor: '#fff'
                                                            }}>
                                                                <Chip
                                                                    label={module.alert_status || 'Unknown'}
                                                                    color={getStatusColor(module.alert_status)}
                                                                    size="small"
                                                                    sx={{
                                                                        fontSize: '12px',
                                                                        fontWeight: 500
                                                                    }}
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </Box>

                                        {/* Refresh Button - Below table */}
                                        {/* <Box sx={{
                                            display: 'flex',
                                            justifyContent: 'flex-end',
                                            mt: 2
                                        }}>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={fetchModules}
                                                disabled={loading}
                                                sx={{
                                                    fontWeight: 500,
                                                    textTransform: 'none',
                                                    px: 2,
                                                    py: 1
                                                }}
                                            >
                                                Refresh
                                            </Button>
                                        </Box> */}

                                        {/* Upload Section - Show below table when table exists */}
                                        <Box sx={{ mt: 3 }}>
                                            <Typography variant="h6" sx={{
                                                mb: 2,
                                                fontWeight: 600,
                                                color: theme.palette.text.primary,
                                                fontSize: { xs: '14px', sm: '16px', md: '18px' }
                                            }}>
                                                Upload Here
                                            </Typography>

                                            <Box sx={{
                                                border: '2px dashed',
                                                borderColor: theme.palette.grey[300],
                                                borderRadius: 1,
                                                p: 2,
                                                textAlign: 'center',
                                                mb: 2,
                                                backgroundColor: "#d6dde8",
                                                transition: 'all 0.3s ease',
                                                '&:hover': {
                                                    borderColor: theme.palette.primary.main,
                                                    backgroundColor: "#d6dde8"
                                                }
                                            }}>
                                                <CloudUploadIcon sx={{
                                                    fontSize: 32,
                                                    color: theme.palette.text.secondary,
                                                    mb: 1
                                                }} />
                                                <Typography variant="body2" sx={{
                                                    mb: 2,
                                                    color: theme.palette.text.secondary,
                                                    fontSize: '12px',
                                                    fontWeight: 500
                                                }}>
                                                    Select a file to upload device alerts
                                                </Typography>

                                                <input
                                                    id="file-upload"
                                                    type="file"
                                                    onChange={handleFileSelect}
                                                    style={{ display: 'none' }}
                                                    accept=".csv,.xlsx,.xls,.json"
                                                />

                                                <Button
                                                    variant="outlined"
                                                    component="label"
                                                    htmlFor="file-upload"
                                                    size="small"
                                                    sx={{
                                                        mb: 1,
                                                        fontWeight: 500,
                                                        textTransform: 'none',
                                                        fontSize: '12px'
                                                    }}
                                                >
                                                    Choose File
                                                </Button>

                                                {selectedFile && (
                                                    <Box sx={{ mt: 1 }}>
                                                        <Typography variant="caption" sx={{
                                                            color: theme.palette.primary.main,
                                                            fontWeight: 500,
                                                            fontSize: '11px',
                                                            display: 'block',
                                                            wordBreak: 'break-all'
                                                        }}>
                                                            Selected: {selectedFile.name}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Box>

                                            <Button
                                                variant="contained"
                                                fullWidth
                                                onClick={handleUpload}
                                                disabled={!selectedFile || uploading}
                                                startIcon={uploading ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                                                sx={{
                                                    backgroundColor: theme.palette.primary.main,
                                                    fontWeight: 500,
                                                    textTransform: 'none',
                                                    fontSize: '13px',
                                                    py: 1.5,
                                                    '&:hover': {
                                                        backgroundColor: theme.palette.primary.dark
                                                    },
                                                    '&:disabled': {
                                                        backgroundColor: theme.palette.grey[300],
                                                        color: theme.palette.grey[500]
                                                    }
                                                }}
                                            >
                                                {uploading ? 'Uploading...' : 'Upload File'}
                                            </Button>

                                            {uploadError && (
                                                <Alert severity="error" sx={{ mt: 2 }}>
                                                    {uploadError}
                                                </Alert>
                                            )}

                                            {uploadSuccess && (
                                                <Alert severity="success" sx={{ mt: 2 }}>
                                                    File uploaded successfully!
                                                </Alert>
                                            )}
                                        </Box>
                                    </Box>
                                ) : (
                                    <Box sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        minHeight: '300px',
                                        backgroundColor: '#f5f5f5',
                                        borderRadius: '8px',
                                        border: '2px dashed #ddd'
                                    }}>
                                        <ExtensionIcon sx={{ fontSize: 48, color: '#999', mb: 2 }} />
                                        <Typography variant="h6" sx={{
                                            color: '#666',
                                            textAlign: 'center',
                                            mb: 1
                                        }}>
                                            No Modules Found
                                        </Typography>
                                        <Typography variant="body2" sx={{
                                            color: '#666',
                                            textAlign: 'center'
                                        }}>
                                            Upload a file to add modules to your system
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
        </SettingsLayout>

            {/* Success/Error Snackbars */}
            <Snackbar
                open={uploadSuccess}
                autoHideDuration={3000}
                onClose={() => setUploadSuccess(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setUploadSuccess(false)} severity="success">
                    File uploaded successfully!
                </Alert>
            </Snackbar>

            <Snackbar
                open={!!uploadError}
                autoHideDuration={5000}
                onClose={() => setUploadError(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setUploadError(null)} severity="error">
                    {uploadError}
                </Alert>
            </Snackbar>
        </>
    );
};

export default ManageModules;

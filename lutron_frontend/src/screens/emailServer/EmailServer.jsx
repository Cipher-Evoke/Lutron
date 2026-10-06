import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    Divider,
    Button,
    Grid,
    useTheme,
    Snackbar,
    Alert
} from '@mui/material';
import { SidebarItems, getVisibleSidebarItems } from '../../utils/sidebarItems';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createEmail, fetchEmailConfigs, getEmailData, testEmail } from '../../redux/slice/settingsslice/heatmap/groupOccupancySlice';
import {  selectApplicationTheme } from '../../redux/slice/theme/themeSlice';
import { getVisibleSidebarItemsWithPaths, UseAuth } from '../../customhooks/UseAuth';

const EmailServer = () => {
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');
    const dispatch = useDispatch()
    const theme = useTheme();
    const navigate = useNavigate();
    const emailData = useSelector(getEmailData)
    const appTheme = useSelector(selectApplicationTheme);
    const backgroundColor = appTheme?.application_theme?.background || '#d2c4a2';
    const contentColor = appTheme?.application_theme?.content || 'rgba(128, 120, 100, 0.7)';
    const buttonColor = appTheme?.application_theme?.button || '#232323'
    const [formData, setFormData] = useState({
        serverName: '',
        port: '',
        serverEmail: '',
        senderName: '',
        sslRequired: false,
        authRequired: false,
        password: '',
        testEmail: '',
    });

    const handleChange = (field) => (event) => {
        setFormData((prev) => ({
            ...prev,
            [field]: event.target.value,
        }));
    };
    const handleSendTestEmail = async () => {
        const payload = {
            to_email: formData.testEmail,
            subject: 'Test Email from LMS System'
        };
        try {
            await dispatch(testEmail(payload)).unwrap();
            setSnackbarSeverity('success');
            setSnackbarMessage('Test email sent successfully!');
        } catch (error) {
            setSnackbarSeverity('error');
            setSnackbarMessage('Failed to send test email!');
        } finally {
            setSnackbarOpen(true);
        }
    };
    const handleSave = async () => {
        const payload = {
            server_name: formData.serverName,
            port: Number(formData.port),
            server_email: formData.serverEmail,
            sender_name: formData.senderName,
            app_password: formData.password,
        };

        try {
            await dispatch(createEmail(payload)).unwrap();
            setSnackbarSeverity('success');
            setSnackbarMessage('Email configuration saved successfully!');
        } catch (error) {
            setSnackbarSeverity('error');
            setSnackbarMessage('Failed to save email configuration!');
        } finally {
            setSnackbarOpen(true);
        }
    };

    useEffect(() => {
        dispatch(fetchEmailConfigs()).then((res) => {
            const data = res.payload;
            if (Array.isArray(data) && data.length > 0) {
                const latest = data[0];
                setFormData({
                    serverName: latest.server_name || '',
                    port: latest.port?.toString() || '',
                    serverEmail: latest.server_email || '',
                    senderName: latest.sender_name || '',
                    sslRequired: true,
                    authRequired: true,
                    password: ''
                });
            }
        });
    }, []);
    
    const { role } = UseAuth();
    const visibleSidebarItems = getVisibleSidebarItems(role);
    const visibleSidebarItemsWithPaths = getVisibleSidebarItemsWithPaths(role);
    
    // Check if user has permission to access Email Server settings
    const canAccessEmailServer = () => {
        // Only Admin and Superadmin can access Email Server settings
        // All Operator roles (Not Required) according to Excel sheet
        return role === 'Superadmin' || role === 'Admin';
    };
    
    // Redirect unauthorized users
    useEffect(() => {
        if (!canAccessEmailServer()) {
            navigate('/manage-area-groups', { replace: true });
        }
    }, [role, navigate]);
    
    if (!canAccessEmailServer()) {
        return null;
    }
    
    return (
        <>
            <Grid container  sx={{ml:'18px'}}>
                <Grid
                    item
                    xs={12}
                    md={3}
                    sx={{ p: 2, borderTopLeftRadius: '10px', borderBottomLeftRadius: '10px' }}
                >
                    <Typography variant="h6" sx={{
                            mb: { xs: 0.8, sm: 1, md: 1.5, lg: 2 },
                            color: theme.palette.text.secondary,
                            fontSize: 24,
                            fontWeight: 600,
                            letterSpacing: 0.5,
                            paddingTop: "18px",
                            marginBottom: "16px"
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
                                        : 'transparent',
                                color:
                                    location.pathname === item.path
                                        ? theme.palette.text.primary
                                        : theme.palette.text.secondary,
                                px: 2,
                                py: 1,
                                borderRadius: '4px',
                                mb: 0.8,
                                fontSize: '14px',
                                fontWeight:
                                    location.pathname === item.path ? 600 : 400,
                                cursor: 'pointer',
                                '&:hover': {
                                    backgroundColor: theme.palette.custom.containerBg
                                }
                            }}
                        >
                            {item.label}
                        </Box>
                    ))}
                </Grid>
                <Grid item xs={12} md={9} sx={{p:5}}>
                    <Typography sx={{ color: "white", fontSize: "20px", mb: 2 }}>SMTP Mail Server Settings</Typography>
                    <Grid container spacing={3} alignItems="flex-start">
                        <Grid item xs={12} md={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Typography
                                    sx={{
                                        color: '#fff',
                                        minWidth: '120px',
                                        mr: 2,
                                        fontSize: '14px',
                                    }}
                                >
                                    Server Name
                                </Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    value={formData.serverName}
                                    onChange={handleChange('serverName')}
                                    variant="outlined"
                                    // placeholder="relay.cb.intra.lutron.com"
                                    sx={{
                                        backgroundColor: '#fff',
                                        borderRadius: '4px',
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '4px',
                                        },
                                    }}
                                />
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Typography
                                    sx={{
                                        color: '#fff',
                                        minWidth: '120px',
                                        mr: 2,
                                        fontSize: '14px',
                                    }}
                                >
                                    Server Email
                                </Typography>
                                <TextField
                                    fullWidth
                                    // label="Server Email"
                                    variant="outlined"
                                    size="small"
                                    value={formData.serverEmail || ''}
                                    onChange={handleChange('serverEmail')}
                                    sx={{
                                        backgroundColor: '#fff',
                                        borderRadius: '4px',
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '4px',
                                        },
                                    }}
                                />
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Typography
                                    sx={{
                                        color: '#fff',
                                        minWidth: '120px',
                                        mr: 2,
                                        fontSize: '14px',
                                    }}
                                >
                                    Sender Name
                                </Typography>
                                <TextField
                                    fullWidth
                                    // label="Sender Name"
                                    variant="outlined"
                                    size="small"
                                    value={formData.senderName || ''}
                                    onChange={handleChange('senderName')}
                                    sx={{
                                        backgroundColor: '#fff',
                                        borderRadius: '4px',
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '4px',
                                        },
                                    }}
                                />
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Typography
                                    sx={{
                                        color: '#fff',
                                        minWidth: '120px',
                                        mr: 2,
                                        fontSize: '14px',
                                    }}
                                >
                                    Port
                                </Typography>
                                <TextField
                                    fullWidth
                                    // label="Port"
                                    variant="outlined"
                                    size="small"
                                    value={formData.port || ''}
                                    onChange={handleChange('port')}
                                    sx={{
                                        backgroundColor: '#fff',
                                        borderRadius: '4px',
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '4px',
                                        },
                                    }}
                                />
                            </Box>
                        </Grid>
                    </Grid>
                    {/* Password field moved below the main grid with same width as other fields */}
                    <Grid container spacing={3} sx={{ mt: 0 }}>
                        <Grid item xs={12} md={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Typography
                                    sx={{
                                        color: '#fff',
                                        minWidth: '120px',
                                        mr: 2,
                                        fontSize: '14px',
                                    }}
                                >
                                    Password
                                </Typography>
                                <TextField
                                    fullWidth
                                    type="password"
                                    variant="outlined"
                                    size="small"
                                    value={formData.password || ''}
                                    onChange={handleChange('password')}
                                    sx={{
                                        backgroundColor: '#fff',
                                        borderRadius: '4px',
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '4px',
                                        },
                                    }}
                                />
                            </Box>
                        </Grid>
                    </Grid>
                    <Box display="flex" justifyContent="flex-end" gap={2} mt={1}>
                        <Button
                            variant="contained"
                            onClick={() => setFormData({})}
                            sx={{ bgcolor: 'buttonColor', color: '#fff' }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleSave}
                            sx={{ bgcolor: 'buttonColor', color: '#fff' }}
                        >
                            Save
                        </Button>
                    </Box>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#fff' }}>
                        Test Email Configuration
                    </Typography>
                    <Divider sx={{ mb: 2, borderColor: '#fff' }} />
                    <Grid
                        item
                        xs={12}
                        md={8}
                        sx={{ width: "100%", mb: 3 }}
                    >
                        <Box
                            display="flex"
                            alignItems="center"
                            gap={2}
                            flexWrap="wrap"
                        >
                            <TextField
                                fullWidth
                                placeholder="Enter Test Email"
                                size="small"
                                value={formData.testEmail}
                                onChange={handleChange('testEmail')}
                                sx={{
                                    backgroundColor: '#fff',
                                    borderRadius: 1,
                                    flex: 1,
                                    minWidth: '250px',

                                    '& .MuiInputBase-root': {
                                        backgroundColor: '#fff',
                                        borderRadius: 1,
                                    },
                                    '& .MuiOutlinedInput-root': {
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#e0e0e0',
                                        },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#e0e0e0',
                                        },
                                    },
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#e0e0e0',
                                    }
                                }}
                                InputProps={{
                                    style: {
                                        paddingLeft: 12,
                                        fontSize: '14px'
                                    }
                                }}
                            />
                            <Button
                                variant="contained"
                                onClick={handleSendTestEmail}
                                sx={{
                                    bgcolor: 'buttonColor',
                                    color: '#fff',
                                    fontWeight: 'bold',
                                    height: 40,
                                    padding: '0 20px',
                                    borderRadius: 1,
                                    textTransform: 'none'
                                }}
                            >
                                Send Test Email
                            </Button>
                        </Box>
                    </Grid>

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
            </Grid>
        </>
    )
}

export default EmailServer

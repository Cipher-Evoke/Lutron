import React, { useEffect, useState, useMemo, useRef } from 'react';
import { createSingleFlight } from "../../../../shared/utils/createSingleFlight";
import { buildEmailServerSaveKey } from "../../../../shared/utils/emailServerSaveKey";
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
import SettingsSidebar from '../../components/SettingsSidebar';
import { useDispatch } from 'react-redux';
import { createEmail, fetchEmailConfigs, testEmail } from '../../redux/slice/settingsslice/heatmap/groupOccupancySlice';
import { useNavigate } from 'react-router-dom';
import { getVisibleSidebarItemsWithPaths, UseAuth } from '../../customhooks/UseAuth';

const EmailServer = () => {
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');
    const [saving, setSaving] = useState(false);
    const lastSavedKeyRef = useRef(null);
    const dispatch = useDispatch();
    const runSaveOnce = useMemo(() => createSingleFlight(), []);
    const navigate = useNavigate();
    const theme = useTheme();
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
    const handleSave = async () => runSaveOnce(async () => {
        const payload = {
            server_name: formData.serverName,
            port: Number(formData.port),
            server_email: formData.serverEmail,
            sender_name: formData.senderName,
            app_password: formData.password,
        };
        const saveKey = buildEmailServerSaveKey(payload);
        if (lastSavedKeyRef.current === saveKey) {
            setSnackbarSeverity('info');
            setSnackbarMessage('No changes to save');
            setSnackbarOpen(true);
            return;
        }

        setSaving(true);
        try {
            await dispatch(createEmail(payload)).unwrap();
            lastSavedKeyRef.current = saveKey;
            setSnackbarSeverity('success');
            setSnackbarMessage('Email configuration saved successfully!');
        } catch (error) {
            setSnackbarSeverity('error');
            setSnackbarMessage('Failed to save email configuration!');
        } finally {
            setSaving(false);
            setSnackbarOpen(true);
        }
    });

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
                lastSavedKeyRef.current = buildEmailServerSaveKey({
                    server_name: latest.server_name || '',
                    port: Number(latest.port) || 0,
                    server_email: latest.server_email || '',
                    sender_name: latest.sender_name || '',
                    app_password: '',
                });
            }
        });
    }, [dispatch]);
    
    const { role } = UseAuth();
    const visibleSidebarItemsWithPaths = getVisibleSidebarItemsWithPaths(role);
    
    // Only Admin and Superadmin can access Email Server settings
    const canAccessEmailServer = role === 'Superadmin' || role === 'Admin';
    
    // Redirect unauthorized users
    useEffect(() => {
        if (!canAccessEmailServer) {
            navigate('/setting/manage-area-groups', { replace: true });
        }
    }, [canAccessEmailServer, navigate]);
    
    if (!canAccessEmailServer) {
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
                    <SettingsSidebar items={visibleSidebarItemsWithPaths} embedded />
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
                            disabled={saving}
                            sx={{ bgcolor: 'buttonColor', color: '#fff' }}
                        >
                            {saving ? 'Saving…' : 'Save'}
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

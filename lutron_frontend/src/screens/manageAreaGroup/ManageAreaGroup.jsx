import React, { useEffect } from 'react';
import { SidebarItems, getVisibleSidebarItems } from '../../utils/sidebarItems';
import {
    Grid,
    Typography,
    useTheme,
    Box,
    Button
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    selectApplicationTheme
} from '../../redux/slice/theme/themeSlice';
import {
    fetchAreaGroups,
    selectAreaGroups
} from '../../redux/slice/settingsslice/heatmap/groupOccupancySlice';
import UploadIcon from '@mui/icons-material/Upload';
import { getVisibleSidebarItemsWithPaths, UseAuth, getOverallPermissionLevel } from '../../customhooks/UseAuth';
import { selectProfile } from '../../redux/slice/auth/userlogin';

const ManageAreaGroup = () => {
    const dispatch = useDispatch();
    const theme = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const appTheme = useSelector(selectApplicationTheme);
    const areaGroups = useSelector(selectAreaGroups);
    const { role } = UseAuth();
    const userProfile = useSelector(selectProfile);
    const overallPermission = getOverallPermissionLevel(userProfile);
    const visibleSidebarItems = getVisibleSidebarItems(role);
    const visibleSidebarItemsWithPaths = getVisibleSidebarItemsWithPaths(role);
    
    // Check if user has permission to create area groups
    const canCreateAreaGroup = () => {
        // Superadmin and Admin can always create
        if (role === 'Superadmin' || role === 'Admin') return true;
        // Only Operator with "Monitoring, edit and control" permission can create
        if (role === 'Operator' && overallPermission === 'Monitoring, edit and control') return true;
        return false;
    };
    
    // Check if user has permission to view area groups
    const canViewAreaGroups = () => {
        // Superadmin and Admin can always view
        if (role === 'Superadmin' || role === 'Admin') return true;
        // All Operator roles can view
        if (role === 'Operator') return true;
        return false;
    };
    
    
    // Check if user can view special area groups (only Superadmin)
    const canViewSpecialAreaGroups = () => {
        return role === 'Superadmin';
    };

    const buttonColor = appTheme?.application_theme?.button || '#232323'
    const contentColor = appTheme?.application_theme?.content || '#a89d83';

    useEffect(() => {
        dispatch(fetchAreaGroups());
    }, [dispatch]);

    return (
        <Grid container sx={{ml:'18px',p:'18px'}}>
            {/* Sidebar */}
            <Grid item xs={12} md={3}  >
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
                              borderRadius: 0.5,
                            mb: 0.8,
                            fontSize: '14px',
                            fontWeight: location.pathname === item.path ? 600 : 400,
                            cursor: 'pointer',
                            '&:hover': {
                                backgroundColor: theme.palette.custom.containerBg,
                            },
                        }}
                    >
                        {item.label}
                    </Box>
                ))}
            </Grid>

            {/* Right Content */}
            <Grid
                item
                xs={12}
                md={9}
                sx={{
                    backgroundColor: contentColor,
                    p: 3,
                    borderTopRightRadius: '10px',
                    borderBottomRightRadius: '10px',
                }}
            >

                {/* Top Bar with Export
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                    <Button
                        variant="text"
                        startIcon={<UploadIcon />}
                        sx={{ color: '#fff', fontWeight: 600 }}
                        onClick={() => {}}
                    >
                        Export
                    </Button>
                </Box> */}

                {/* Special Groups - Only visible to Superadmin */}
                {canViewSpecialAreaGroups() && (
                    <Box sx={{ mb: 5, border: "1px solid grey", p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, }}>
                            <Typography fontWeight={600} fontSize={16} color={"white"}>
                                Special Area Groups
                            </Typography>
                            {canCreateAreaGroup() && (
                                <Button
                                    variant="contained"
                                    onClick={() => navigate('/create-area-groups/')}
                                    sx={{
                                        backgroundColor: 'buttonColor',
                                        color: '#fff',
                                        borderRadius: '8px',
                                        textTransform: 'none',
                                        fontSize: 14,
                                        px: 2,
                                        py: 0.8,
                                        '&:hover': {
                                            backgroundColor: '#222'
                                        }
                                    }}
                                >
                                    Create New
                                </Button>
                            )}
                        </Box>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, }}>
                            {(areaGroups?.special_area_groups || []).map((group) => (
                                <Button
                                    key={`special-${group.group_id}`}
                                    onClick={() => navigate(`/update-area-groups/${group.group_id}`)}
                                    variant="contained"
                                    sx={{
                                        backgroundColor: '#eddca9',
                                        color: '#000',
                                        borderRadius: '8px',
                                        textTransform: 'none',
                                        px: 2,
                                        py: 1,
                                        fontWeight: 500,
                                        '&:hover': {
                                            backgroundColor: '#e2cfa2'
                                        }
                                    }}
                                >
                                    {group.name}
                                </Button>
                            ))}
                        </Box>
                    </Box>
                )}

                {/* User Groups */}
                <Box sx={{ border: "1px solid grey", p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, }}>
                        <Typography fontWeight={600} fontSize={16} color={"white"}>
                            User Area Groups
                        </Typography>
                        {canCreateAreaGroup() && (
                            <Button
                                variant="contained"
                                onClick={() => navigate('/create-area-group/')}
                                sx={{
                                    backgroundColor: 'buttonColor',
                                    color: '#fff',
                                    borderRadius: '8px',
                                    textTransform: 'none',
                                    fontSize: 14,
                                    px: 2,
                                    py: 0.8,
                                    '&:hover': {
                                        backgroundColor: '#222'
                                    }
                                }}
                            >
                                Create New
                            </Button>
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        {(areaGroups?.user_area_groups || []).map((group) => (
                            <Button
                                key={`user-${group.group_id}`}
                                onClick={() => navigate(`/update-area-group/${group.group_id}`)}
                                variant="contained"
                                sx={{
                                    backgroundColor: '#eddca9',
                                    color: '#000',
                                    borderRadius: '8px',
                                    textTransform: 'none',
                                    px: 2,
                                    py: 1,
                                    fontWeight: 500,
                                    '&:hover': {
                                        backgroundColor: '#e2cfa2'
                                    }
                                }}
                            >
                                {group.name}
                            </Button>
                        ))}
                    </Box>
                </Box>
            </Grid>
        </Grid>
    );
};

export default ManageAreaGroup;
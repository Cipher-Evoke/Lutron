import React, { useEffect } from 'react';
import { SidebarItems, getVisibleSidebarItems } from '../../utils/sidebarItems';
import {
    Grid,
    Typography,
    useTheme,
    Box,
    Button,
    useMediaQuery,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    selectApplicationTheme
} from '../../redux/slice/theme/themeSlice';
import {
    fetchAreaGroups,
    selectAreaGroups
} from '../../redux/slice/settingsslice/heatmap/groupOccupancySlice';
import FileUploadOutlined from '@mui/icons-material/FileUploadOutlined';
import { getVisibleSidebarItemsWithPaths, UseAuth, getOverallPermissionLevel } from '../../customhooks/UseAuth';
import { selectProfile } from '../../redux/slice/auth/userlogin';
import { isLightSurface } from '../../utils/themeOnSurface';
import { settingsSidebarColumnDividerSx } from '../../utils/settingsSidebarTabStyles';
import SettingsSidebarNav from '../../components/SettingsSidebarNav';

const ManageAreaGroup = () => {
    const dispatch = useDispatch();
    const theme = useTheme();
    const settingsSidebarMdUp = useMediaQuery(theme.breakpoints.up('md'));
    const navigate = useNavigate();
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

    const buttonColor = appTheme?.application_theme?.button || "#232323";
    const contentColor = appTheme?.application_theme?.content || "#f5f5f5";
    const isDefaultWhiteTheme = isLightSurface(contentColor);
    const createNewButtonBg = isDefaultWhiteTheme ? "#1565C0" : buttonColor;
    const onButton = isLightSurface(createNewButtonBg) ? "rgba(0, 0, 0, 0.87)" : "#ffffff";
    const areaGroupChipBg = isDefaultWhiteTheme ? "#0d6ebc" : "#eddca9";
    const areaGroupChipHoverBg = isDefaultWhiteTheme ? "#0a5a9a" : "#e2cfa2";
    const areaGroupChipText = isDefaultWhiteTheme ? "#ffffff" : "#000000";

    useEffect(() => {
        dispatch(fetchAreaGroups());
    }, [dispatch]);

    return (
        <Grid container className="settings-layout-root" sx={{ml:'18px',p:'18px', alignItems: 'flex-start'}}>
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
                    ...settingsSidebarColumnDividerSx(isDefaultWhiteTheme, settingsSidebarMdUp),
                }}
            >
                <SettingsSidebarNav items={visibleSidebarItemsWithPaths} />
            </Grid>

            {/* Right Content */}
            <Grid
                item
                xs={12}
                md={10}
                className="settings-main-content-column"
                sx={{
                    backgroundColor: isDefaultWhiteTheme ? '#ffffff' : contentColor,
                    p: 3,
                    borderTopRightRadius: '10px',
                    borderBottomRightRadius: '10px',
                }}
            >

                {/* Top Bar with Export
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                    <Button
                        variant="text"
                        startIcon={<FileUploadOutlined sx={{ fontSize: 18, color: 'inherit' }} />}
                        sx={{ color: '#1565C0', fontWeight: 500, textTransform: 'none' }}
                        onClick={() => {}}
                    >
                        Export
                    </Button>
                </Box> */}

                {/* Special Groups - Only visible to Superadmin */}
                {canViewSpecialAreaGroups() && (
                    <Box sx={{ mb: 5, border: "1px solid grey", p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, }}>
                            <Typography fontWeight={600} fontSize={16} color="text.primary">
                                Special Area Groups
                            </Typography>
                            {canCreateAreaGroup() && (
                                <Button
                                    variant="contained"
                                    onClick={() => navigate('/create-area-groups/')}
                                    sx={{
                                        backgroundColor: createNewButtonBg,
                                        color: onButton,
                                        borderRadius: "8px",
                                        textTransform: "none",
                                        fontSize: 14,
                                        px: 2,
                                        py: 0.8,
                                        "&:hover": {
                                            backgroundColor: isDefaultWhiteTheme
                                                ? "#0d47a1"
                                                : isLightSurface(buttonColor)
                                                    ? "rgba(0, 0, 0, 0.12)"
                                                    : "#222",
                                        },
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
                                        backgroundColor: areaGroupChipBg,
                                        color: areaGroupChipText,
                                        borderRadius: '8px',
                                        textTransform: 'none',
                                        px: 2,
                                        py: 1,
                                        fontWeight: 500,
                                        '&:hover': {
                                            backgroundColor: areaGroupChipHoverBg
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
                        <Typography fontWeight={600} fontSize={16} color="text.primary">
                            User Area Groups
                        </Typography>
                        {canCreateAreaGroup() && (
                            <Button
                                variant="contained"
                                onClick={() => navigate('/create-area-group/')}
                                sx={{
                                    backgroundColor: createNewButtonBg,
                                    color: onButton,
                                    borderRadius: "8px",
                                    textTransform: "none",
                                    fontSize: 14,
                                    px: 2,
                                    py: 0.8,
                                    "&:hover": {
                                        backgroundColor: isDefaultWhiteTheme
                                            ? "#0d47a1"
                                            : isLightSurface(buttonColor)
                                                ? "rgba(0, 0, 0, 0.12)"
                                                : "#222",
                                    },
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
                                    backgroundColor: areaGroupChipBg,
                                    color: areaGroupChipText,
                                    borderRadius: '8px',
                                    textTransform: 'none',
                                    px: 2,
                                    py: 1,
                                    fontWeight: 500,
                                    '&:hover': {
                                        backgroundColor: areaGroupChipHoverBg
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
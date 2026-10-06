import React, { useEffect } from 'react';
import { SidebarItems, getVisibleSidebarItems } from '../../utils/sidebarItems';
import { CARD_BACKGROUND } from '../../config/themeConstants';
import {
    Typography,
    Box,
    Button
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
import UploadIcon from '@mui/icons-material/Upload';
import { UseAuth, getOverallPermissionLevel } from '../../customhooks/UseAuth';
import SettingsLayout from '../settings/SettingsLayout';
import { selectProfile } from '../../redux/slice/auth/userlogin';
import { getThemeButtonColor } from '../../utils/themePageBackground';

const ManageAreaGroup = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const appTheme = useSelector(selectApplicationTheme);
    const areaGroups = useSelector(selectAreaGroups);
    const { role } = UseAuth();
    const userProfile = useSelector(selectProfile);
    const overallPermission = getOverallPermissionLevel(userProfile);
    const visibleSidebarItems = getVisibleSidebarItems(role);
    
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

    const buttonColor = getThemeButtonColor(appTheme?.application_theme?.button, appTheme?.application_theme?.background);
    const contentColor = appTheme?.application_theme?.content || '#a89d83';

    useEffect(() => {
        dispatch(fetchAreaGroups());
    }, [dispatch]);

    return (
        <SettingsLayout>
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
                    <Box sx={{ mb: 5, border: '1px solid var(--area-groups-border, #C5CDD8)', borderRadius: 1, p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, }}>
                            <Typography fontWeight={600} fontSize={16} color={"#000"}>
                                Special Area Groups
                            </Typography>
                            {canCreateAreaGroup() && (
                                <Button
                                    variant="contained"
                                    onClick={() => navigate('/create-area-groups/')}
                                    sx={{
                                        backgroundColor: buttonColor,
                                        color: '#fff',
                                        borderRadius: '8px',
                                        textTransform: 'none',
                                        fontSize: 14,
                                        px: 2,
                                        py: 0.8,
                                        '&:hover': {
                                            backgroundColor: '#222',
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
                                    variant="outlined"
                                    sx={{
                                        // Previous tan tags - kept for quick rollback:
                                        // backgroundColor: '#eddca9', hover: '#e2cfa2'
                                        backgroundColor: 'var(--area-groups-chip-bg, #D6DDE8)',
                                        color: 'var(--settings-panel-text, #1c2330)',
                                        border: '1px solid var(--area-groups-border, #C5CDD8)',
                                        borderRadius: '8px',
                                        textTransform: 'none',
                                        px: 2,
                                        py: 1,
                                        fontWeight: 500,
                                        '&:hover': {
                                            backgroundColor: 'var(--settings-panel-outer-bg, #C5CDD8)',
                                            borderColor: 'var(--home-tab-active-color, #3D4A5C)',
                                        },
                                    }}
                                >
                                    {group.name}
                                </Button>
                            ))}
                        </Box>
                    </Box>
                )}

                {/* User Groups */}
                <Box sx={{ border: '1px solid var(--area-groups-border, #C5CDD8)', borderRadius: 1, p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, }}>
                        <Typography fontWeight={600} fontSize={16} color={"#000"}>
                            User Area Groups
                        </Typography>
                        {canCreateAreaGroup() && (
                            <Button
                                variant="contained"
                                onClick={() => navigate('/create-area-group/')}
                                sx={{
                                    backgroundColor: buttonColor,
                                    color: '#fff',
                                    borderRadius: '8px',
                                    textTransform: 'none',
                                    fontSize: 14,
                                    px: 2,
                                    py: 0.8,
                                    '&:hover': {
                                        backgroundColor: '#222',
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
                                variant="outlined"
                                sx={{
                                    backgroundColor: 'var(--area-groups-chip-bg, #D6DDE8)',
                                    color: 'var(--settings-panel-text, #1c2330)',
                                    border: '1px solid var(--area-groups-border, #C5CDD8)',
                                    borderRadius: '8px',
                                    textTransform: 'none',
                                    px: 2,
                                    py: 1,
                                    fontWeight: 500,
                                    '&:hover': {
                                        backgroundColor: 'var(--settings-panel-outer-bg, #C5CDD8)',
                                        borderColor: 'var(--home-tab-active-color, #3D4A5C)',
                                    },
                                }}
                            >
                                {group.name}
                            </Button>
                        ))}
                    </Box>
                </Box>
        </SettingsLayout>
    );
};

export default ManageAreaGroup;
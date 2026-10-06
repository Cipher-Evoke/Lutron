import React from 'react';
import { selectApplicationTheme } from '../../redux/slice/theme/themeSlice';
import { useSelector } from 'react-redux';
import SettingsSidebar from '../../components/SettingsSidebar';
import { Box, Typography, CircularProgress } from '@mui/material';
import AreaSizeLoadTree from './AreaSizeLoadTree';
import { getVisibleSidebarItemsWithPaths, UseAuth } from '../../customhooks/UseAuth';
import { selectProfile } from '../../redux/slice/auth/userlogin';
import CustomizedSettingsPageShell from '../../components/CustomizedSettingsPageShell';

const AreaSizeLoad = () => {
    const appTheme = useSelector(selectApplicationTheme);
    const contentColor = appTheme?.application_theme?.content || 'rgba(128, 120, 100, 0.7)';
    const { role } = UseAuth();
    const userProfile = useSelector(selectProfile);
    const visibleSidebarItemsWithPaths = getVisibleSidebarItemsWithPaths(role, userProfile);

    const isLoading = useSelector((state) => state.groupOccupancy?.loading || false);
    const areaData = useSelector((state) => state.groupOccupancy?.areaLoad);
    const hasData = areaData && (areaData.floors?.length > 0 || areaData.total);

    return (
        <CustomizedSettingsPageShell
            sidebarItems={visibleSidebarItemsWithPaths}
            NavigationComponent={(props) => <SettingsSidebar {...props} embedded />}
            contentColor={contentColor}
        >
            <Typography variant="h6" sx={{ color: '#ffff', mb: 2, flexShrink: 0 }}>
                Area Details
            </Typography>
            {isLoading && !hasData ? (
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: '200px',
                        flexDirection: 'column',
                        gap: 2,
                    }}
                >
                    <CircularProgress size={60} sx={{ color: '#fff' }} />
                    <Typography variant="body1" sx={{ color: '#fff', fontSize: '16px' }}>
                        Calculating area data...
                    </Typography>
                </Box>
            ) : (
                <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', pr: 1 }}>
                    <AreaSizeLoadTree />
                </Box>
            )}
        </CustomizedSettingsPageShell>
    );
};

export default AreaSizeLoad;

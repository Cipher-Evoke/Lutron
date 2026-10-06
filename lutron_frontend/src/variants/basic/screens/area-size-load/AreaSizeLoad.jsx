import React, { useEffect } from 'react';
import { selectApplicationTheme } from '../../redux/slice/theme/themeSlice';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@emotion/react';
import { SidebarItems, getVisibleSidebarItems } from '../../utils/sidebarItems';
import { Box, Grid, Typography, CircularProgress, useMediaQuery } from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import AreaSizeLoadTree from './AreaSizeLoadTree';
import { getVisibleSidebarItemsWithPaths, UseAuth, getOverallPermissionLevel } from '../../customhooks/UseAuth';
import { selectProfile } from '../../redux/slice/auth/userlogin';
import { isLightSurface } from '../../utils/themeOnSurface';
import { settingsSidebarColumnDividerSx } from '../../utils/settingsSidebarTabStyles';
import SettingsSidebarNav from '../../components/SettingsSidebarNav';

const AreaSizeLoad = () => {
    const dispatch = useDispatch();
    const theme = useTheme();
    const muiTheme = useMuiTheme();
    const settingsSidebarMdUp = useMediaQuery(muiTheme.breakpoints.up('md'));
    const appTheme = useSelector(selectApplicationTheme);
    const contentColor = appTheme?.application_theme?.content || '#ffffff';
    const isDefaultWhiteTheme = isLightSurface(contentColor);
    const { role } = UseAuth();
    const userProfile = useSelector(selectProfile);
    const overallPermission = getOverallPermissionLevel(userProfile);
    const visibleSidebarItemsWithPaths = getVisibleSidebarItemsWithPaths(role, userProfile);

    // Get loading state and data from Redux
    const isLoading = useSelector((state) => state.groupOccupancy?.loading || false);
    const areaData = useSelector((state) => state.groupOccupancy?.areaLoad);

    // Check if we have meaningful data (not just empty structure)
    const hasData = areaData && (areaData.floors?.length > 0 || areaData.total);


    return (
        <Grid container className="settings-layout-root" sx={{ ml: '18px', p: '18px', alignItems: 'flex-start' }}>
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

            {/* Sidebar - Always show for all users */}
            <Grid
                item
                xs={12}
                md={2}
                sx={{
                    p: 0,
                    ...settingsSidebarColumnDividerSx(isDefaultWhiteTheme, settingsSidebarMdUp),
                }}
            >
                <SettingsSidebarNav items={visibleSidebarItemsWithPaths} />
            </Grid>
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
                <Typography variant="h6" sx={{ color: '#000', mb: 2, fontWeight: 600 }}>
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
                            gap: 2
                        }}
                    >
                        <CircularProgress
                            size={60}
                            sx={{ color: 'rgba(0,0,0,0.5)' }}
                        />
                        <Typography
                            variant="body1"
                            sx={{ color: '#000', fontSize: '16px' }}
                        >
                            Calculating area data...
                        </Typography>
                    </Box>
                ) : (
                    <AreaSizeLoadTree />
                )}
            </Grid>
        </Grid>
    );
};

export default AreaSizeLoad;

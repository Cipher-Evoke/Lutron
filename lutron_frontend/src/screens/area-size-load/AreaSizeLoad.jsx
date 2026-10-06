import React, { useEffect } from 'react';
import { selectApplicationTheme } from '../../redux/slice/theme/themeSlice';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '@emotion/react';
import { SidebarItems, getVisibleSidebarItems } from '../../utils/sidebarItems';
import { Box, Grid, Typography, CircularProgress } from '@mui/material';
import AreaSizeLoadTree from './AreaSizeLoadTree';
import { getVisibleSidebarItemsWithPaths, UseAuth, getOverallPermissionLevel } from '../../customhooks/UseAuth';
import { selectProfile } from '../../redux/slice/auth/userlogin';

const AreaSizeLoad = () => {
    const dispatch = useDispatch();
    const theme = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const appTheme = useSelector(selectApplicationTheme);
    const contentColor = appTheme?.application_theme?.content || 'rgba(128, 120, 100, 0.7)';
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
        <Grid container sx={{ ml: '18px' }}>
            {/* Sidebar - Always show for all users */}
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
                    marginBottom: '16px'
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
            <Grid item xs={12} md={9} sx={{ p: 8 }}>
                <Typography variant="h6" sx={{ color: "#ffff", mb: 2 }}>
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
                            sx={{ color: '#fff' }}
                        />
                        <Typography
                            variant="body1"
                            sx={{ color: '#fff', fontSize: '16px' }}
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

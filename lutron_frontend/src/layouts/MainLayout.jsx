

// export default MainLayout; 
import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import TopbarComponent from '../components/TopbarComponent';
import HeatmapControls from '../screens/heatmap/HeatmapControls';
import HeatMap from '../screens/heatmap/HeatMap';
import Footer from '../components/Footer';
import { fetchApplicationTheme, selectApplicationTheme } from '../redux/slice/theme/themeSlice';

const MainLayout = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const appTheme = useSelector(selectApplicationTheme);

  useEffect(() => {
    // Only fetch if not already loaded
    if (!appTheme || !appTheme.application_theme) {
      dispatch(fetchApplicationTheme());
    }
  }, [dispatch, appTheme]);

  const backgroundColor = appTheme?.application_theme?.background || '#d2c4a2';
  const contentColor = appTheme?.application_theme?.content || 'rgba(128, 120, 100, 0.7)';

  const isLutronWebsite = location.pathname === '/lutronwebsite-page';
  const isDashboard = location.pathname === '/dashboard';

  return (
    <Box sx={{ width: '100%', minHeight: 'calc(100vh - 100px)', bgcolor: backgroundColor }}>
      <TopbarComponent />

      {/* Main container with fully responsive design */}
      <Box
        sx={{
          width: '100%',
          mx: 'auto',
          px: {
            xs: 2,
            sm: 3,
            md: 4,
            lg: 5,
            xl: 6,
            xxl: 8,
            '3xl': 10,
            '4xl': 12
          },
        }}
      >
        <Box sx={{
          paddingTop: {
            xs: '63px',
            sm: '65px',
            md: '67px',
            lg: '69px',
            xl: '71px',
            xxl: '73px',
            '3xl': '75px',
            '4xl': '77px'
          },
          width: '100%'
        }}>
          {location.pathname === "/heatmap" && (
            <HeatmapControls />
          )}

          {isDashboard ? (
            <Outlet />
          ) : (
            <Box sx={{
              width: '100%',
              mx: 'auto',
              backgroundColor: contentColor,
              borderRadius: {
                xs: '8px',
                sm: '10px',
                md: '12px',
                lg: '14px',
                xl: '16px',
                xxl: '18px',
                '3xl': '20px',
                '4xl': '22px'
              },
              flexGrow: 1,
              overflowY: (location.pathname === "/lutronwebsite-page" || location.pathname.includes("/settings") || location.pathname === "/heatmap") ? 'hidden' : 'auto', // No scroll for Lutron page, settings, and heatmap - they have internal scroll
              overflowX: 'hidden', // Prevent horizontal scroll
              height: (location.pathname === "/lutronwebsite-page" || location.pathname.includes("/settings") || location.pathname === "/heatmap") ? 'calc(100vh - 200px)' : 'auto', // Fixed height for Lutron page, settings, and heatmap
              maxHeight: (location.pathname === "/lutronwebsite-page" || location.pathname.includes("/settings") || location.pathname === "/heatmap") ? 'calc(100vh - 200px)' : 'none', // Fixed max height for Lutron page, settings, and heatmap
              minHeight: location.pathname === "/dashboard" ? 'calc(100vh - 50px)' : location.pathname === "/lutronwebsite-page" ? 'calc(100vh - 200px)' : location.pathname === "/heatmap" ? 'calc(100vh - 180px)' : 'calc(100vh - 120px)', // Slightly increased heatmap height to match settings better
              // Lutron page specific styling handled by CSS media queries
              mb: location.pathname === "/dashboard" ? {
                xs: 1,
                sm: 1,
                md: 2,
                lg: 2,
                xl: 3,
                xxl: 4,
                '3xl': 5,
                '4xl': 6
              } : location.pathname === "/lutron" ? {
                xs: 1,
                sm: 1,
                md: 2,
                lg: 2,
                xl: 3,
                xxl: 4,
                '3xl': 5,
                '4xl': 6
              } : 0, // Margin for lutron website only
              p: location.pathname === "/dashboard" ? {
                xs: 2,
                sm: 2,
                md: 3,
                lg: 3,
                xl: 4,
                xxl: 5,
                '3xl': 6,
                '4xl': 7
              } : location.pathname === "/lutron" ? {
                xs: 2,
                sm: 2,
                md: 3,
                lg: 3,
                xl: 4,
                xxl: 5,
                '3xl': 6,
                '4xl': 7
              } : location.pathname === "/schedule" ? {
                xs: 2,
                sm: 2,
                md: 3,
                lg: 3,
                xl: 4,
                xxl: 5,
                '3xl': 6,
                '4xl': 7
              } : 0, // Restored padding for schedule page
            }}>
              {location.pathname === "/heatmap" ? (
                <HeatMap />
              ) : (
                <Outlet />
              )}
            </Box>
          )}
        </Box>

        <Footer />
      </Box>
    </Box>
  );
};

export default MainLayout;
import React, { useContext, lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import { ThemeContext } from './screens/settings/theme/ThemeContext';
import { useDispatch, useSelector } from 'react-redux';
import { getLutronDataClient } from './redux/slice/home/homeSlice';
import { selectProfile } from './redux/slice/auth/userlogin';
import { store } from './redux/store';
import Login from './screens/auth/Login';
import ChangePassword from './screens/auth/ChangePassword';
import MainLayout from './layouts/MainLayout';
import AuthGuard from './customhooks/AuthGuard';
import Dashboard from './screens/dashboard/Dashboard';
import UsersComponent from './screens/settings/Users/UsersComponent';
import CreateUser from './screens/settings/Users/CreateUser';
import FloorComponent from './screens/settings/floor/FloorComponent';
import CreateFloor from './screens/settings/floor/CreateFloor';
import LutronWebsiteComponent from './screens/lutronwebsite page/LutronWebsiteComponent'
import EditFloor from './screens/settings/floor/EditFloor';
import CreateAreaModelComponent from './screens/create-area-model/CreateAreaModelComponent';
import GroupOccupancyModel from './screens/heatmap/GroupOccupancymodel'
import HomeComponent from './screens/settings/home/HomeComponent';
import ScheduleComponent from './screens/schedule/ScheduleComponent';
import UpdatePreconfigurdEvent from './screens/schedule/UpdatePreconfigurdEvent';
import QuickControls from './screens/quickcontrols/QuickControls';
import CreateQuickControl from './screens/quickcontrols/CreateQuickControl';
import AddEvent from './screens/schedule/AddEvent';
import QuickControlDetails from './screens/quickcontrols/QuickControlDetails';
import ChangeThemeDetails from './screens/settings/changetheme/ThemeChange'
import ScheduleDetails from './screens/schedule/ScheduleDetails';
import ManageAreaGroupDetails from './screens/manageAreaGroup/ManageAreaGroup'
import UpdateAreaGroupDetails from './screens/manageAreaGroup/UpdateAreaGroup'
import UpdateUserAreaGroupDetails from './screens/userAreaGroup/UpdateUserAreaGroup'
import AddAreaGroupDetails from './screens/manageAreaGroup/CreateAreaGroup'
import CreateAreaGroup from './screens/manageAreaGroup/CreateAreaGroup';
import CreateUserAreaGroup from './screens/userAreaGroup/CreateUserAreaGroup'
import EmailServerDetails from './screens/emailServer/EmailServer'
import AreaSizeLoadDetails from './screens/area-size-load/AreaSizeLoad'
import CreateHelpDetails from './screens/settings/help/CreateHelp'
import GetHelpDetails from './screens/settings/help/GetHelp'
import ActivityReport from './screens/activityReport/ActivityReport'

import CorrectCoordinate from './screens/settings/floor/CorrectCoordinate';

import AreaCalculationPage from './screens/settings/floor/AreaCalculationPage';


import RenameWidgetDetails from './screens/settings/renameWidget/RenameWidget'
import ManageSensors from './screens/settings/sensors/ManageSensors'
import ManageModules from './screens/settings/modules/ManageModules'
import AlertsComponent from './screens/settings/alerts/AlertsComponent'


const HeatMap = lazy(() => import('./screens/heatmap/HeatMap'));
const App = () => {
  const { theme } = useContext(ThemeContext);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const profile = useSelector(selectProfile);

  useEffect(() => {
    // Only call this if user is authenticated and client data is not already loaded
    const token = localStorage.getItem("lutron");
    if (token && profile) {
      // Check if client data is already loaded in Redux store
      const state = store.getState();
      const clientData = state.home?.homeClient;
      // Only fetch if we haven't tried recently (prevent multiple failed calls)
      const lastFetchTime = sessionStorage.getItem('clientDataFetchTime');
      const now = Date.now();
      if ((!clientData || !clientData.name) && (!lastFetchTime || (now - parseInt(lastFetchTime)) > 60000)) {
        sessionStorage.setItem('clientDataFetchTime', now.toString());
        dispatch(getLutronDataClient()).catch(() => {
          // Silently handle errors - endpoint might not be available
        });
      }
    }
  }, [dispatch, profile]);

  // Show loading state instead of returning null to maintain hook consistency
  if (!theme) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Suspense
        fallback={
          <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        }
      >
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/change_password" element={<ChangePassword />} />
          {/* Protected routes with layout */}
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/alerts" element={<Dashboard />} />
            <Route path="/dashboard/energy" element={<Dashboard />} />
            <Route path="/dashboard/space-utilization" element={<Dashboard />} />
            <Route path="/users" element={<UsersComponent />} />
            <Route path="/createusers" element={<CreateUser />} />
            <Route path="/heatmap" element={<Suspense fallback={<div>Loading...</div>}><HeatMap /></Suspense>} />
            <Route path="/create-area-model" element={<CreateAreaModelComponent />} />
            <Route path="/main" element={<HomeComponent />} />
            <Route path="/heatmap" element={<GroupOccupancyModel />} />
            <Route path="/floor" element={<FloorComponent />} />
            <Route path="/createfloor" element={<CreateFloor />} />
            <Route path="/lutron" element={<LutronWebsiteComponent />} />
            <Route path="/create-area-model" element={<CreateAreaModelComponent />} />
            <Route path="/editfloor/:floorId" element={<EditFloor />} />
            <Route path='/schedule' element={<ScheduleComponent />} />
            <Route path='/schedule/update-preconfigured-event' element={<UpdatePreconfigurdEvent />} />
            <Route path="/schedule/add-event" element={<AddEvent />} />
            <Route path="/quickcontrols" element={<AuthGuard><QuickControls /></AuthGuard>} />
            <Route path="/quickcontrols/create" element={<AuthGuard><CreateQuickControl /></AuthGuard>} />
            <Route path="/quickcontrols/:id" element={<AuthGuard><QuickControlDetails /></AuthGuard>} />
            <Route path="/theme-change" element={<ChangeThemeDetails />} />
            <Route path="/schedule/details/:id" element={<ScheduleDetails />} />
            <Route path="/manage-area-groups" element={<ManageAreaGroupDetails />} />
            <Route path="/update-area-groups/:id" element={<UpdateAreaGroupDetails />} />
            <Route path="/update-area-group/:id" element={<UpdateUserAreaGroupDetails />} />
            <Route path="/create-area-groups/" element={<CreateAreaGroup />} />
            <Route path="/create-area-group/" element={<CreateUserAreaGroup />} />
            <Route path="/create-area-group/" element={<CreateUserAreaGroup />} />
            <Route path="/email-server/" element={<EmailServerDetails />} />
            <Route path="/area-size-load/" element={<AreaSizeLoadDetails />} />
            <Route path="/create-help/" element={<CreateHelpDetails />} />
            <Route path="/get-help/" element={<GetHelpDetails />} />
            <Route path="/activity-report" element={<AuthGuard allowedRoles={["Superadmin", "Admin", "Operator"]}><ActivityReport /></AuthGuard>} />

            <Route path="/correct-coordinate/:floorId" element={<CorrectCoordinate />} />

            <Route path="/area-calculation/:floorId" element={<AreaCalculationPage />} />


            <Route path="/rename-widget/" element={<RenameWidgetDetails />} />
            <Route path="/manage-sensors" element={<AuthGuard allowedRoles={["Superadmin"]}><ManageSensors /></AuthGuard>} />
            <Route path="/manage-modules" element={<AuthGuard allowedRoles={["Superadmin"]}><ManageModules /></AuthGuard>} />
            <Route path="/alerts" element={<AuthGuard allowedRoles={["Superadmin"]}><AlertsComponent /></AuthGuard>} />


          </Route>
        </Routes>
      </Suspense>
    </ThemeProvider>
  );
};
export default App;